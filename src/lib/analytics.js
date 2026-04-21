import { getRecentDateKeys, getRussianWeekdayLabel } from "@/lib/dateUtils";
import { METRICS_KEYS } from "../constants";

function metricToValue(dayData, metricKey) {
  const vitality = dayData?.vitality ?? {};

  switch (metricKey) {
    case "focus":
      return vitality.focus ?? 0;
    case "stress":
      return vitality.stress ?? 0;
    case "social":
      return vitality.social ?? 0;
    case "activity":
      return vitality.activity ?? 0;
    case "sleep":
      return vitality.sleep ?? 0;
    case "concentration":
      return vitality.focus ?? 0;
    default:
      return 0;
  }
}

export function buildMomentumChartAnalytics(daysByDate, currentDateKey) {
  const keys = METRICS_KEYS;
  const recentDateKeys = getRecentDateKeys(currentDateKey, 7);

  return Object.fromEntries(
    keys.map((metricKey) => [
      metricKey,
      recentDateKeys.map((dateKey) => {
        const dayData = daysByDate[dateKey];
        return {
          dateKey,
          label: getRussianWeekdayLabel(dateKey, dateKey === currentDateKey),
          value: metricToValue(dayData, metricKey),
          mode: dayData?.mode ?? null,
        };
      }),
    ]),
  );
}
