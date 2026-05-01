import { useEffect, useMemo, useState } from 'react';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_PROFILE, createDefaultDay } from '@/lib/mocks';
import { buildMomentumChartAnalytics } from '@/lib/analytics';
import { loadDashboardData, saveDayPatch, saveProfilePatch } from '@/lib/dashboard/firestoreDashboard';
import { useDashboardNotifications } from './useNotifications';
import {
  buildDayStateForDate,
  buildPatchedDayState,
  patchVitalityByMetric,
  toggleFocusBlockSubtask,
} from '@/lib/dashboard/dayMutations';

const DEFAULT_DATE_KEY = DEFAULT_PROFILE.activeDate;
const DEFAULT_DAY = createDefaultDay(DEFAULT_DATE_KEY);

export function useDashboardData() {
  const { mode, setMode } = useMode();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [dateKey, setDateKey] = useState(DEFAULT_DATE_KEY);
  const [dayData, setDayData] = useState(DEFAULT_DAY);
  const [daysByDate, setDaysByDate] = useState({ [DEFAULT_DATE_KEY]: DEFAULT_DAY });
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

  return {
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
  };
}
