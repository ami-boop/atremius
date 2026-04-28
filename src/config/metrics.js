const filterDefs = [
  { key: 'focus',         label: 'Фокус',        color: 'var(--emerald)', max: 10  },
  { key: 'stress',        label: 'Стресс',        color: 'var(--coral)',   max: 10  },
  { key: 'social',        label: 'Общение',       color: 'var(--amber)',   max: 10  },
  { key: 'activity',      label: 'Активность',    color: '#7dd3fc',        max: 300 },
  { key: 'sleep',         label: 'Сон',           color: '#c4b5fd',        max: 10  },
  { key: 'concentration', label: 'Концентрация',  color: '#86efac',        max: 10  },
];

const metricDefs = [
  { key: 'sleep',    label: 'Качество сна',       unit: '/10', max: 10,  step: 1 },
  { key: 'stress',   label: 'Уровень стресса',     unit: '/10', max: 10,  step: 1 },
  { key: 'focus',    label: 'Концентрация',         unit: '/10', max: 10,  step: 1 },
  { key: 'activity', label: 'Время активности',     unit: ' мин', max: 300, step: 5 },
  { key: 'social',   label: 'Качество общения',     unit: '/10', max: 10,  step: 1 },
];

const filters = [
  { key: 'focus',  label: 'Фокус',  color: 'var(--emerald)' },
  { key: 'stress', label: 'Стресс', color: 'var(--coral)' },
];

const jointBodyPoints = [
  { id: 'neck',       cx: 60,  cy: 38,  label: 'Шея', kind: 'joint', region: 'posture' },
  { id: 'shoulder_l', cx: 33,  cy: 55,  label: 'Плечевой сустав (лев)', kind: 'joint', region: 'posture' },
  { id: 'shoulder_r', cx: 87,  cy: 55,  label: 'Плечевой сустав (прав)', kind: 'joint', region: 'posture' },
  { id: 'elbow_l',    cx: 22,  cy: 82,  label: 'Локоть (лев)', kind: 'joint', region: 'arms' },
  { id: 'elbow_r',    cx: 98,  cy: 82,  label: 'Локоть (прав)', kind: 'joint', region: 'arms' },
  { id: 'wrist_l',    cx: 14,  cy: 105, label: 'Кисть (лев)', kind: 'joint', region: 'arms' },
  { id: 'wrist_r',    cx: 106, cy: 105, label: 'Кисть (прав)', kind: 'joint', region: 'arms' },
  { id: 'hip_l',      cx: 49,  cy: 120, label: 'Тазобедренный сустав (лев)', kind: 'joint', region: 'legs' },
  { id: 'hip_r',      cx: 71,  cy: 120, label: 'Тазобедренный сустав (прав)', kind: 'joint', region: 'legs' },
  { id: 'knee_l',     cx: 42,  cy: 145, label: 'Колено (лев)', kind: 'joint', region: 'legs' },
  { id: 'knee_r',     cx: 78,  cy: 145, label: 'Колено (прав)', kind: 'joint', region: 'legs' },
  { id: 'foot_l',     cx: 36,  cy: 182, label: 'Голеностоп / стопа (лев)', kind: 'joint', region: 'legs' },
  { id: 'foot_r',     cx: 84,  cy: 182, label: 'Голеностоп / стопа (прав)', kind: 'joint', region: 'legs' },
];

const muscleBodyPoints = [
  { id: 'trap',       cx: 60,  cy: 48,  label: 'Трапеции / верх спины', kind: 'muscle', region: 'posture' },
  { id: 'bicep_l',    cx: 29,  cy: 68,  label: 'Бицепс (лев)', kind: 'muscle', region: 'arms' },
  { id: 'bicep_r',    cx: 91,  cy: 68,  label: 'Бицепс (прав)', kind: 'muscle', region: 'arms' },
  { id: 'forearm_l',  cx: 18,  cy: 94,  label: 'Предплечье (лев)', kind: 'muscle', region: 'arms' },
  { id: 'forearm_r',  cx: 102, cy: 94,  label: 'Предплечье (прав)', kind: 'muscle', region: 'arms' },
  { id: 'chest',      cx: 60,  cy: 65,  label: 'Грудные мышцы', kind: 'muscle', region: 'core' },
  { id: 'belly',      cx: 60,  cy: 90,  label: 'Пресс', kind: 'muscle', region: 'core' },
  { id: 'thigh_l',    cx: 48,  cy: 136, label: 'Ляжка / квадрицепс (лев)', kind: 'muscle', region: 'legs' },
  { id: 'thigh_r',    cx: 72,  cy: 136, label: 'Ляжка / квадрицепс (прав)', kind: 'muscle', region: 'legs' },
  { id: 'calf_l',     cx: 39,  cy: 166, label: 'Икра (лев)', kind: 'muscle', region: 'legs' },
  { id: 'calf_r',     cx: 81,  cy: 166, label: 'Икра (прав)', kind: 'muscle', region: 'legs' },
];

const bodyPoints = [...jointBodyPoints, ...muscleBodyPoints];
const bodyPointMeta = Object.fromEntries(bodyPoints.map((point) => [point.id, point]));
const allBodyPointIds = bodyPoints.map((point) => point.id);

const initialMetrics = [
  { label: 'Качество сна',        value: 88, color: 'var(--emerald)', max: 100, comment: '' },
  { label: 'Баланс питания',      value: 64, color: 'var(--amber)',   max: 100, comment: '' },
  { label: 'Стресс (ВСР)',        value: 25, color: 'var(--emerald)', max: 100, comment: '' },
  { label: 'Устойчивость потока', value: 85, color: 'var(--emerald)', max: 100, comment: '' },
];

export {
    filterDefs,
    metricDefs,
    filters,
    jointBodyPoints,
    muscleBodyPoints,
    bodyPoints,
    bodyPointMeta,
    allBodyPointIds,
    initialMetrics
}
