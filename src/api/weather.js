import { normalizeLocation, resolveWeatherLocation } from '@/api/weatherLocation';
import { fetchOpenMeteoForecast, fetchOpenWeatherForecast } from '@/api/weatherProviders';

export { resolveWeatherLocation };

const WEATHER_PROVIDER_LABELS = {
  "open-weather": "OpenWeather",
  "open-weather-free": "OpenWeather",
  "open-meteo": "Open-Meteo",
};

function buildWeatherComment(location, provider, fallbackReason) {
  const providerLabel = WEATHER_PROVIDER_LABELS[provider] ?? provider;
  const fallbackNote = fallbackReason ? ` Основной провайдер недоступен: ${fallbackReason}` : "";

  if (location.source === "geolocation") {
    return `Погода получена по текущей геолокации через ${providerLabel}.${fallbackNote}`;
  }

  if (location.source === "manual") {
    return `Погода получена для ${location.name} через ${providerLabel}.${fallbackNote}`;
  }

  return `Геолокация недоступна, поэтому использован прогноз для ${location.name} через ${providerLabel}.${fallbackNote}`;
}

async function getOpenMeteoSupplement(location, openWeatherDays) {
  const fallbackForecast = await fetchOpenMeteoForecast(location);
  const openWeatherDates = new Set(openWeatherDays.map((day) => day.date));

  return fallbackForecast.days
    .filter((day) => !openWeatherDates.has(day.date))
    .slice(0, 7 - openWeatherDays.length);
}

function buildOpenWeatherComment({ location, forecast, supplementalDays, supplementalError }) {
  const baseComment = buildWeatherComment(location, forecast.source);

  // OpenWeather free forecast is 5 days max; Open-Meteo only fills the missing
  // tail of the 7-day productivity horizon and never replaces OpenWeather days.
  if (supplementalDays.length) {
    return `${baseComment} Бесплатный OpenWeather дает до 5 дней, последние дни дополнены через Open-Meteo.`;
  }

  if (supplementalError) {
    return `${baseComment} Open-Meteo не смог дополнить прогноз до 7 дней: ${supplementalError.message}`;
  }

  return baseComment;
}

async function buildOpenWeatherForecast(location) {
  const forecast = await fetchOpenWeatherForecast(location);
  let supplementalDays = [];
  let supplementalError = null;

  if (forecast.days.length < 7) {
    try {
      supplementalDays = await getOpenMeteoSupplement(location, forecast.days);
    } catch (error) {
      supplementalError = error;
    }
  }

  return {
    ...forecast,
    source: supplementalDays.length ? `${forecast.source}+open-meteo` : forecast.source,
    days: [...forecast.days, ...supplementalDays].slice(0, 7),
    supplementalSource: supplementalDays.length ? "open-meteo" : undefined,
    comment: buildOpenWeatherComment({ location, forecast, supplementalDays, supplementalError }),
  };
}

async function buildFallbackForecast(location, primaryError) {
  const fallbackForecast = await fetchOpenMeteoForecast(location);

  return {
    ...fallbackForecast,
    fallbackFrom: "open-weather",
    fallbackReason: primaryError.message,
    comment: buildWeatherComment(location, fallbackForecast.source, primaryError.message),
  };
}

export async function fetchWeatherForecast(rawLocation) {
  const location = normalizeLocation(rawLocation);

  try {
    return await buildOpenWeatherForecast(location);
  } catch (error) {
    return buildFallbackForecast(location, error);
  }
}
