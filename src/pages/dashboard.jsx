import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, getDocs, limit, orderBy, query, setDoc, where, collection } from 'firebase/firestore';
import Navbar from '../components/dashboard/Navbar';
import CurrentTaskCard from '../components/dashboard/CurrentTaskCard';
import CircadianAnchor from '../components/dashboard/CircadianAnchor';
import DailyFocusProtocol from '../components/dashboard/DailyFocusProtocol';
import HabitsTracker from '../components/dashboard/HabitsTracker';
import StatusBar from '../components/dashboard/StatusBar';
import BottomNav from '../components/dashboard/BottomNav';
import AnalyticsTab from '../components/analytics/AnalyticsTab';
import { db } from '@/api/firebase';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_HABITS, DEFAULT_PROFILE, createDefaultDay, mergeDayWithDefaults } from '@/lib/mocks';
import { buildMomentumChartAnalytics } from '@/lib/analytics';
import { getTodayDateKey } from '@/lib/dateUtils';

export default function Dashboard() {
  const { mode, setMode } = useMode();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [dateKey, setDateKey] = useState(DEFAULT_PROFILE.activeDate);
  const [dayData, setDayData] = useState(createDefaultDay(DEFAULT_PROFILE.activeDate));
  const [daysByDate, setDaysByDate] = useState(
    {
      [DEFAULT_PROFILE.activeDate]: createDefaultDay(DEFAULT_PROFILE.activeDate),
    }
  );
  const [hasLoadedDay, setHasLoadedDay] = useState(false);

  const analyticsData = useMemo(
    () => buildMomentumChartAnalytics(daysByDate, dateKey),
    [daysByDate, dateKey],
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setHasLoadedDay(false);

      try {
        const profileRef = doc(db, 'profile', 'app');
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.data();
        const profileHasHabits = Array.isArray(profileData?.habits);
        const baseProfile = profileSnap.exists()
          ? { ...DEFAULT_PROFILE, ...profileData }
          : DEFAULT_PROFILE;

        const todayDateKey = getTodayDateKey(baseProfile.timezone || DEFAULT_PROFILE.timezone);
        const dayRef = doc(db, 'days', todayDateKey);
        const daySnap = await getDoc(dayRef);
        const migratedHabits = profileHasHabits
          ? profileData.habits
          : daySnap.data()?.habits ?? DEFAULT_HABITS;
        const nextProfile = {
          ...baseProfile,
          activeDate: todayDateKey,
          habits: migratedHabits,
          updatedAt: new Date().toISOString(),
        };

        if (!profileSnap.exists() || profileData?.activeDate !== todayDateKey || !profileHasHabits) {
          await setDoc(profileRef, nextProfile, { merge: true });
        }
        const nextDay = daySnap.exists()
          ? mergeDayWithDefaults(daySnap.data(), todayDateKey)
          : createDefaultDay(todayDateKey);

        if (!daySnap.exists()) {
          await setDoc(dayRef, nextDay);
        }

        const daysQuery = query(
          collection(db, 'days'),
          where('date', '<=', todayDateKey),
          orderBy('date', 'desc'),
          limit(40),
        );
        const recentDaysSnap = await getDocs(daysQuery);

        const recentDaysByDate = {};
        recentDaysSnap.forEach((snapshot) => {
          const snapshotDateKey = snapshot.data().date || snapshot.id;
          recentDaysByDate[snapshotDateKey] = mergeDayWithDefaults(snapshot.data(), snapshotDateKey);
        });
        recentDaysByDate[todayDateKey] = nextDay;

        setProfile(nextProfile);
        setDateKey(todayDateKey);
        setDayData(nextDay);
        setDaysByDate(recentDaysByDate);
        setMode(nextDay.mode);
        setHasLoadedDay(true);
      } catch (error) {
        console.error('Failed to load Firestore dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [setMode]);

  const persistProfilePatch = async (patch) => {
    const updatedAt = new Date().toISOString();
    const nextProfile = {
      ...profile,
      ...patch,
      updatedAt,
    };

    setProfile(nextProfile);

    try {
      await setDoc(doc(db, 'profile', 'app'), { ...patch, updatedAt }, { merge: true });
    } catch (error) {
      console.error('Failed to persist Firestore profile patch', error);
    }
  };

  const persistDayPatch = async (targetDateKey, patch) => {
    const updatedAt = new Date().toISOString();
    const previousDayData =
      targetDateKey === dateKey
        ? dayData
        : mergeDayWithDefaults(daysByDate[targetDateKey] ?? createDefaultDay(targetDateKey), targetDateKey);

    const nextDayData = {
      ...previousDayData,
      ...patch,
      date: targetDateKey,
      updatedAt,
    };

    setDaysByDate((prev) => ({
      ...prev,
      [targetDateKey]: nextDayData,
    }));

    if (targetDateKey === dateKey) {
      setDayData(nextDayData);
    }

    try {
      await setDoc(doc(db, 'days', targetDateKey), { date: targetDateKey, ...patch, updatedAt }, { merge: true });
    } catch (error) {
      console.error('Failed to persist Firestore day patch', error);
    }
  };

  useEffect(() => {
    if (!hasLoadedDay || mode === dayData.mode) return;
    void persistDayPatch(dateKey, { mode });
  }, [dateKey, dayData.mode, hasLoadedDay, mode]);

  const handleToggleSubtask = (blockId, subtaskId) => {
    const nextFocusBlocks = dayData.focusBlocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            subtasks: block.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
            ),
          }
        : block,
    );

    void persistDayPatch(dateKey, { focusBlocks: nextFocusBlocks });
  };

  const handleMomentumChartValueChange = (metricKey, dayItem, value) => {
    const targetDateKey = dayItem.dateKey;
    const targetDay = mergeDayWithDefaults(daysByDate[targetDateKey] ?? createDefaultDay(targetDateKey), targetDateKey);
    const vitalityPatch = { ...targetDay.vitality };

    if (metricKey === 'focus' || metricKey === 'concentration') vitalityPatch.focus = value;
    if (metricKey === 'stress') vitalityPatch.stress = value;
    if (metricKey === 'social') vitalityPatch.social = value;
    if (metricKey === 'activity') vitalityPatch.activity = value;
    if (metricKey === 'sleep') vitalityPatch.sleep = value;

    void persistDayPatch(targetDateKey, { vitality: vitalityPatch });
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] font-inter pb-32">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 md:px-10 pt-6">
        <div className="flex justify-end mb-4">
          <StatusBar />
        </div>

        {loading ? (
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="relative">
            <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CurrentTaskCard blocks={dayData.focusBlocks} onToggleSubtask={handleToggleSubtask} />
                  <CircadianAnchor />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-7">
                    <DailyFocusProtocol
                      onBlocksChange={(focusBlocks) => void persistDayPatch(dateKey, { focusBlocks })}
                      initialBlocks={dayData.focusBlocks}
                      strategicGoal={dayData.strategicGoal || profile.strategicGoalTemplate}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <HabitsTracker habits={profile.habits} onChange={(habits) => void persistProfilePatch({ habits })} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
              <AnalyticsTab
                physiology={dayData.physiology}
                onPhysiologyChange={(physiology) => void persistDayPatch(dateKey, { physiology })}
                vitality={dayData.vitality}
                vitalityComments={dayData.vitalityComments}
                onVitalityChange={(vitality) => void persistDayPatch(dateKey, { vitality })}
                onVitalityCommentsChange={(vitalityComments) => void persistDayPatch(dateKey, { vitalityComments })}
                momentumChartAnalytics={analyticsData}
                onMomentumChartAnalyticsValueChange={handleMomentumChartValueChange}
                forecast={dayData.forecast}
                onForecastChange={(forecast) => void persistDayPatch(dateKey, { forecast })}
                daysByDate={daysByDate}
                currentDateKey={dateKey}
                profile={profile}
                onProfileChange={persistProfilePatch}
              />
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
