import { allBodyPointIds } from '@/config/metrics';

export const DEFAULT_PROFILE = {
  activeDate: "2026-04-19",
  timezone: "Europe/Saratov",
  locale: "ru",
  defaultMode: "СТАБИЛЬНО",
  selectedWeatherLocation: "auto",
  weatherLocations: [
    {
      id: "kfar-tavor",
      name: "Kfar Tavor, Israel",
      latitude: 32.6876,
      longitude: 35.4214,
      timezone: "Asia/Jerusalem",
    },
    {
      id: "saratov",
      name: "Saratov, Russia",
      latitude: 51.5336,
      longitude: 46.0343,
      timezone: "Europe/Saratov",
    },
  ],
  habits: [
    { id: 1, name: "Выпить 2л воды", done: false, emoji: "💧" },
    { id: 2, name: "Утренняя зарядка 10 мин", done: true, emoji: "🏃" },
    { id: 3, name: "Медитация 5 мин", done: false, emoji: "🧘" },
    { id: 4, name: "Прогулка на улице", done: true, emoji: "🌿" },
    { id: 5, name: "Без телефона до 9:00", done: false, emoji: "📵" },
  ],
  strategicGoalTemplate: "Редизайн архитектуры дизайн-системы",
  circadianAnchorTime: "23:30",
  wakeTimeTarget: "08:00",
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
};

export const DEFAULT_FOCUS_BLOCKS = [
  {
    id: 1,
    time: "09:00",
    title: "Глубокая работа: Аудит компонентов",
    duration: "90",
    subtasks: [
      { id: 1, text: "Проверить иерархию карточных компонентов", done: true },
      { id: 2, text: "Аудит использования цветовых токенов", done: true },
      { id: 3, text: "Задокументировать несоответствия отступов", done: false },
      { id: 4, text: "Создать PR для рефакторинга", done: false },
    ],
  },
  {
    id: 2,
    time: "11:30",
    title: "Рефакторинг логики взаимодействия",
    duration: "60",
    subtasks: [
      { id: 1, text: "Вынести утилиты анимаций", done: false },
      { id: 2, text: "Унифицировать hover-переходы", done: false },
    ],
  },
  {
    id: 3,
    time: "14:00",
    title: "Документация дизайн-системы",
    duration: "45",
    subtasks: [{ id: 1, text: "Написать таблицу токенов", done: false }],
  },
];

export const DEFAULT_HABITS = DEFAULT_PROFILE.habits;

export const DEFAULT_VITALITY = {
  sleep: 7,
  stress: 3,
  focus: 8,
  activity: 45,
  social: 6,
};

export const DEFAULT_VITALITY_COMMENTS = {
  sleep: "",
  stress: "",
  focus: "",
  activity: "",
  social: "",
};

export const PHYSIOLOGY_POINT_IDS = allBodyPointIds;

export const DEFAULT_PHYSIOLOGY = Object.fromEntries(
  PHYSIOLOGY_POINT_IDS.map((pointId) => [pointId, { status: null, comment: "" }]),
);

const createSeries = (max, productiveLabel = "ПРОДУКТИВНОСТЬ") => [
  { label: "ПН", value: Math.round(max * 0.45), mode: "СТАБИЛЬНО" },
  { label: "ВТ", value: Math.round(max * 0.7), mode: productiveLabel },
  { label: "СР", value: Math.round(max * 0.6), mode: "СТАБИЛЬНО" },
  { label: "ЧТ", value: Math.round(max * 0.85), mode: productiveLabel },
  { label: "СГД", value: Math.round(max * 0.78), mode: productiveLabel },
  { label: "СБ", value: 0, mode: null },
  { label: "ВС", value: 0, mode: null },
];

export const DEFAULT_MOMENTUM_CHART = {
  focus: [
    { label: "ПН", value: 45, mode: "СТАБИЛЬНО" },
    { label: "ВТ", value: 70, mode: "ПРОДУКТИВНОСТЬ" },
    { label: "СР", value: 60, mode: "СТАБИЛЬНО" },
    { label: "ЧТ", value: 85, mode: "ПРОДУКТИВНОСТЬ" },
    { label: "СГД", value: 78, mode: "ПРОДУКТИВНОСТЬ" },
    { label: "СБ", value: 0, mode: null },
    { label: "ВС", value: 0, mode: null },
  ],
  stress: [
    { label: "ПН", value: 60, mode: "СТАБИЛЬНО" },
    { label: "ВТ", value: 45, mode: "СТАБИЛЬНО" },
    { label: "СР", value: 75, mode: "ВОССТАНОВЛЕНИЕ" },
    { label: "ЧТ", value: 30, mode: "ПРОДУКТИВНОСТЬ" },
    { label: "СГД", value: 35, mode: "ПРОДУКТИВНОСТЬ" },
    { label: "СБ", value: 0, mode: null },
    { label: "ВС", value: 0, mode: null },
  ],
};

export const DEFAULT_MOMENTUM_CHART_ANALYTICS = {
  focus: createSeries(100),
  stress: createSeries(100),
  social: createSeries(10),
  activity: createSeries(300),
  sleep: createSeries(10),
  concentration: createSeries(10),
};

export const DEFAULT_FORECAST = {
  forecastDateKey: DEFAULT_PROFILE.activeDate,
  slot: "morning",
  days: [
    { focus_score: 62, work_mode: "СТАБИЛЬНО", weather_temp: 14, weather_type: "облачно", recommendation: "Держи умеренный темп и оставь резерв на переключения." },
    { focus_score: 74, work_mode: "ПРОДУКТИВНОСТЬ", weather_temp: 16, weather_type: "солнечно", recommendation: "Планируй сложные задачи на первую половину дня." },
    { focus_score: 81, work_mode: "ПРОДУКТИВНОСТЬ", weather_temp: 18, weather_type: "солнечно", recommendation: "Используй ясную погоду как окно для глубокой работы." },
    { focus_score: 69, work_mode: "СТАБИЛЬНО", weather_temp: 15, weather_type: "переменная облачность", recommendation: "Сохраняй ровный ритм без перегруза." },
    { focus_score: 53, work_mode: "СТАБИЛЬНО", weather_temp: 13, weather_type: "дождь", recommendation: "Снизь плотность задач и добавь больше света и движения." },
    { focus_score: 39, work_mode: "ВОССТАНОВЛЕНИЕ", weather_temp: 12, weather_type: "дождь", recommendation: "Сфокусируйся на восстановлении и рутинных задачах." },
    { focus_score: 47, work_mode: "СТАБИЛЬНО", weather_temp: 13, weather_type: "облачно", recommendation: "Работай в умеренном темпе и не ставь слишком тяжёлый день." },
  ],
  recommendations: [
    "Ставь сложные задачи на более ясные дни.",
    "При падении сна и активности уменьши число тяжёлых блоков.",
  ],
  bodyRecommendations: [
    "Сохраняй ровную нагрузку и не перегружай проблемные зоны, если появятся сигналы по телу.",
  ],
  activityRecommendations: [
    "Держи умеренную ежедневную активность без резких скачков объёма.",
  ],
  comment: "Прогноз производительности строится локальным алгоритмом по погоде и динамике последних дней.",
};

export function createDefaultDay(dateKey = DEFAULT_PROFILE.activeDate) {
  return {
    date: dateKey,
    mode: "ПРОДУКТИВНОСТЬ",
    strategicGoal: "Редизайн архитектуры дизайн-системы",
    focusBlocks: DEFAULT_FOCUS_BLOCKS,
    vitality: DEFAULT_VITALITY,
    vitalityComments: DEFAULT_VITALITY_COMMENTS,
    physiology: DEFAULT_PHYSIOLOGY,
    momentumChart: DEFAULT_MOMENTUM_CHART,
    momentumChartAnalytics: DEFAULT_MOMENTUM_CHART_ANALYTICS,
    forecast: DEFAULT_FORECAST,
    createdAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z",
  };
}

export function mergeDayWithDefaults(dayData, dateKey = DEFAULT_PROFILE.activeDate) {
  const defaults = createDefaultDay(dateKey);

  return {
    ...defaults,
    ...dayData,
    focusBlocks: dayData?.focusBlocks ?? defaults.focusBlocks,
    vitality: {
      ...defaults.vitality,
      ...dayData?.vitality,
    },
    vitalityComments: {
      ...defaults.vitalityComments,
      ...dayData?.vitalityComments,
    },
    physiology: {
      ...defaults.physiology,
      ...dayData?.physiology,
    },
    momentumChart: {
      ...defaults.momentumChart,
      ...dayData?.momentumChart,
    },
    momentumChartAnalytics: {
      ...defaults.momentumChartAnalytics,
      ...dayData?.momentumChartAnalytics,
    },
    forecast: {
      ...defaults.forecast,
      ...dayData?.forecast,
      days: dayData?.forecast?.days ?? defaults.forecast.days,
    },
  };
}
