const MOBILE_BREAKPOINT = 768

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const METRICS_KEYS = ["focus", "stress", "social", "activity", "sleep", "concentration"];

const DAY_LABELS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"]

const CHART_HEIGHT = 120; // px — fixed so proportions are exact

const DURATIONS = ['15','20','25','30','45','60','90','120'];

const MODE_LIMITS = {
  'ПРОДУКТИВНОСТЬ': { maxBlocks: 3, maxDuration: null },
  'СТАБИЛЬНО':              { maxBlocks: 2, maxDuration: null },
  'ВОССТАНОВЛЕНИЕ':         { maxBlocks: 1, maxDuration: 30 },
};

const TIMES = (() => {
  const times = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return times;
})();

const MONTH_NAMES = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];

const BODY_POINTS_STATUS_CYCLE = [null, 'ok', 'mild', 'pain'];

export {
    MOBILE_BREAKPOINT,
    TOAST_LIMIT,
    TOAST_REMOVE_DELAY,
    METRICS_KEYS,
    DAY_LABELS,
    CHART_HEIGHT,
    DURATIONS,
    MODE_LIMITS,
    TIMES,
    MONTH_NAMES,
    BODY_POINTS_STATUS_CYCLE
}