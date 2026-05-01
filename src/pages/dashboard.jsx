import { useState } from 'react';
import Navbar from '../components/dashboard/Navbar';
import CurrentTaskCard from '../components/dashboard/CurrentTaskCard';
import CircadianAnchor from '../components/dashboard/CircadianAnchor';
import DailyFocusProtocol from '../components/dashboard/DailyFocusProtocol';
import HabitsTracker from '../components/dashboard/HabitsTracker';
import StatusBar from '../components/dashboard/StatusBar';
import BottomNav from '../components/dashboard/BottomNav';
import AnalyticsTab from '../components/analytics/AnalyticsTab';
import { useDashboardData } from '@/hooks/useDashboardData';
import { sendNotification, isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    analyticsData,
    dateKey,
    dayData,
    daysByDate,
    handleMomentumChartValueChange,
    handleToggleSubtask,
    loading,
    persistDayPatch,
    persistProfilePatch,
    profile,
  } = useDashboardData();

  const triggerTestNotification = async () => {
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }
  if (permissionGranted) {
    sendNotification('Tauri is awesome!');
    sendNotification({ title: 'TAURI', body: 'Tauri is awesome!' });
  }
  }

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
