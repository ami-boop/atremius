const filterDefs = [
  { key: 'focus',         label: 'Фокус',        color: 'var(--emerald)', max: 100 },
  { key: 'stress',        label: 'Стресс',        color: 'var(--coral)',   max: 100 },
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

const bodyPoints = [
  { id: 'head',       cx: 60,  cy: 18,  label: 'Голова' },
  { id: 'neck',       cx: 60,  cy: 38,  label: 'Шея' },
  { id: 'shoulder_l', cx: 33,  cy: 55,  label: 'Плечо (лев)' },
  { id: 'shoulder_r', cx: 87,  cy: 55,  label: 'Плечо (прав)' },
  { id: 'elbow_l',    cx: 22,  cy: 82,  label: 'Локоть (лев)' },
  { id: 'elbow_r',    cx: 98,  cy: 82,  label: 'Локоть (прав)' },
  { id: 'wrist_l',    cx: 14,  cy: 105, label: 'Кисть (лев)' },
  { id: 'wrist_r',    cx: 106, cy: 105, label: 'Кисть (прав)' },
  { id: 'chest',      cx: 60,  cy: 65,  label: 'Грудь' },
  { id: 'belly',      cx: 60,  cy: 90,  label: 'Живот' },
  { id: 'knee_l',     cx: 42,  cy: 145, label: 'Колено (лев)' },
  { id: 'knee_r',     cx: 78,  cy: 145, label: 'Колено (прав)' },
  { id: 'foot_l',     cx: 36,  cy: 182, label: 'Стопа (лев)' },
  { id: 'foot_r',     cx: 84,  cy: 182, label: 'Стопа (прав)' },
];

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
    bodyPoints,
    initialMetrics
}