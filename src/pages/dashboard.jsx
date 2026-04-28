import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/dashboard/Navbar';
import CurrentTaskCard from '../components/dashboard/CurrentTaskCard';
import CircadianAnchor from '../components/dashboard/CircadianAnchor';
import DailyFocusProtocol from '../components/dashboard/DailyFocusProtocol';
import HabitsTracker from '../components/dashboard/HabitsTracker';
import StatusBar from '../components/dashboard/StatusBar';
import BottomNav from '../components/dashboard/BottomNav';
import AnalyticsTab from '../components/analytics/AnalyticsTab';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_PROFILE, createDefaultDay } from '@/lib/mocks';
import { buildMomentumChartAnalytics } from '@/lib/analytics';
import { loadDashboardData, saveDayPatch, saveProfilePatch } from '@/lib/dashboard/firestoreDashboard';
import { triggerTestNotification, useDashboardNotifications } from '@/lib/dashboard/useDashboardNotifications';
import {
  buildDayStateForDate,
  buildPatchedDayState,
  patchVitalityByMetric,
  toggleFocusBlockSubtask,
} from '@/lib/dashboard/dayMutations';

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
  useDashboardNotifications({ profile, dayData, dateKey });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setHasLoadedDay(false);
      try {
        const dashboardData = await loadDashboardData();
        setProfile(dashboardData.profile);
        setDateKey(dashboardData.dateKey);
        setDayData(dashboardData.dayData);
        setDaysByDate(dashboardData.daysByDate);
        setMode(dashboardData.dayData.mode);
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
      await saveProfilePatch(patch, updatedAt);
    } catch (error) {
      console.error('Failed to persist Firestore profile patch', error);
    }
  };

  const persistDayPatch = async (targetDateKey, patch) => {
    const updatedAt = new Date().toISOString();
    const previousDayData = buildDayStateForDate({
      targetDateKey,
      currentDateKey: dateKey,
      dayData,
      daysByDate,
    });
    const nextDayData = buildPatchedDayState(previousDayData, targetDateKey, patch, updatedAt);

    setDaysByDate((prev) => ({
      ...prev,
      [targetDateKey]: nextDayData,
    }));

    if (targetDateKey === dateKey) {
      setDayData(nextDayData);
    }

    try {
      await saveDayPatch(targetDateKey, patch, updatedAt);
    } catch (error) {
      console.error('Failed to persist Firestore day patch', error);
    }
  };

  useEffect(() => {
    if (!hasLoadedDay || mode === dayData.mode) return;
    void persistDayPatch(dateKey, { mode });
  }, [dateKey, dayData.mode, hasLoadedDay, mode]);

  const handleToggleSubtask = (blockId, subtaskId) => {
    const nextFocusBlocks = toggleFocusBlockSubtask(dayData.focusBlocks, blockId, subtaskId);
    void persistDayPatch(dateKey, { focusBlocks: nextFocusBlocks });
  };

  const handleMomentumChartValueChange = (metricKey, dayItem, value) => {
    const targetDateKey = dayItem.dateKey;
    const targetDay = buildDayStateForDate({
      targetDateKey,
      currentDateKey: dateKey,
      dayData,
      daysByDate,
    });
    const vitalityPatch = patchVitalityByMetric(targetDay.vitality, metricKey, value);
    void persistDayPatch(targetDateKey, { vitality: vitalityPatch });
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] font-inter pb-32">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 md:px-10 pt-6">
        <div className="flex justify-end mb-4">
          <StatusBar onTestNotification={triggerTestNotification} />
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
