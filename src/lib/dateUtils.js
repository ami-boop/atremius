import { DAY_LABELS } from "../constants";

export function formatDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function addDaysToDateKey(dateKey, days) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

export function getTodayDateKey(timezone = "Europe/Saratov", rolloverHour = 3) {
  const localHour = getLocalHour(timezone);
  const baseDate = new Date();

  // Before rollover hour we still treat the day as "yesterday".
  if (localHour < rolloverHour) {
    baseDate.setUTCDate(baseDate.getUTCDate() - 1);
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(baseDate);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getRecentDateKeys(endDateKey, count) {
  return Array.from({ length: count }, (_, index) => addDaysToDateKey(endDateKey, index - (count - 1)));
}

export function getRussianWeekdayLabel(dateKey, isToday = false) {
  if (isToday) return "СГД";

  const labels = DAY_LABELS
  return labels[parseDateKey(dateKey).getUTCDay()];
}

export function getLocalHour(timezone = "Europe/Saratov", date = new Date()) {
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });

  return Number(hourFormatter.format(date));
}

export function getForecastRunSlot(timezone = "Europe/Saratov", date = new Date()) {
  const localHour = getLocalHour(timezone, date);
  return localHour >= 20 ? "evening" : "morning";
}
