import { createDefaultDay, mergeDayWithDefaults } from '@/lib/mocks';

const METRIC_TO_VITALITY_FIELD = {
  focus: 'focus',
  concentration: 'focus',
  stress: 'stress',
  social: 'social',
  activity: 'activity',
  sleep: 'sleep',
};

export function buildDayStateForDate({ targetDateKey, currentDateKey, dayData, daysByDate }) {
  if (targetDateKey === currentDateKey) return dayData;
  return mergeDayWithDefaults(daysByDate[targetDateKey] ?? createDefaultDay(targetDateKey), targetDateKey);
}

export function buildPatchedDayState(previousDayData, targetDateKey, patch, updatedAt) {
  return {
    ...previousDayData,
    ...patch,
    date: targetDateKey,
    updatedAt,
  };
}

export function toggleFocusBlockSubtask(focusBlocks, blockId, subtaskId) {
  return focusBlocks.map((block) => {
    if (block.id !== blockId) return block;
    return {
      ...block,
      subtasks: block.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
      ),
    };
  });
}

export function patchVitalityByMetric(vitality, metricKey, value) {
  const targetField = METRIC_TO_VITALITY_FIELD[metricKey];
  if (!targetField) return vitality;
  return { ...vitality, [targetField]: value };
}
