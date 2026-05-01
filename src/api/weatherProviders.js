import { OPEN_METEO_URL, OPEN_WEATHER_URL } from '@/constants/weather';
import { openWeatherToMeteoCode, weatherCodeToType } from '@/api/weatherCodes';

function getLocalDateFromTimestamp(timestamp, timezoneOffset = 0) {
  return new Date((timestamp + timezoneOffset) * 1000).toISOString().slice(0, 10);
}

function getLocalHourFromTimestamp(timestamp, timezoneOffset = 0) {
  return new Date((timestamp + timezoneOffset) * 1000).getUTCHours();
}

function chooseRepresentativeForecast(items, timezoneOffset) {
  return items.reduce((best, item) => {
    if (!best) return item;

    const itemDistanceFromNoon = Math.abs(getLocalHourFromTimestamp(item.dt ?? 0, timezoneOffset) - 12);
    const bestDistanceFromNoon = Math.abs(getLocalHourFromTimestamp(best.dt ?? 0, timezoneOffset) - 12);
    return itemDistanceFromNoon < bestDistanceFromNoon ? item : best;
  }, null);
}

function buildWeatherDay({ date, weatherCode, weatherTempMax, weatherTempMin }) {
  return {
    date,
    weather_temp: Math.round(weatherTempMax),
    weather_type: weatherCodeToType(weatherCode),
    weather_code: weatherCode,
    weather_temp_max: weatherTempMax,
    weather_temp_min: weatherTempMin,
  };
}

function normalizeOpenWeatherDaily(data, location) {
  const timezoneOffset = Number(data.city?.timezone ?? 0);
  const forecastItems = data.list ?? [];

  if (!forecastItems.length) {
    throw new Error("OpenWeather returned no forecast items");
  }

  const itemsByDate = forecastItems.reduce((groups, item) => {
    const date = getLocalDateFromTimestamp(item.dt ?? 0, timezoneOffset);
    return {
      ...groups,
      [date]: [...(groups[date] ?? []), item],
    };
  }, {});

  // Free OpenWeather forecast is a 3-hour grid, so we collapse each local day
  // into one app-level day while preserving the daily peak/min temperatures.
  const allDays = Object.entries(itemsByDate).map(([date, items]) => {
    const representative = chooseRepresentativeForecast(items, timezoneOffset);
    const openWeatherCode = representative?.weather?.[0]?.id ?? 804;

    return buildWeatherDay({
      date,
      weatherCode: openWeatherToMeteoCode(openWeatherCode),
      weatherTempMax: Math.max(...items.map((item) => Number(item.main?.temp_max ?? item.main?.temp ?? 0))),
      weatherTempMin: Math.min(...items.map((item) => Number(item.main?.temp_min ?? item.main?.temp ?? 0))),
    });
  });

  const today = getLocalDateFromTimestamp(Math.floor(Date.now() / 1000), timezoneOffset);
  const days = allDays
    .filter((day) => day.date > today)
    .sort((left, right) => left.date.localeCompare(right.date));

  if (!days.length) {
    throw new Error("OpenWeather returned no future daily forecast");
  }

  return {
    source: "open-weather-free",
    generatedAt: new Date().toISOString(),
    location: {
      ...location,
      providerTimezone: data.city?.timezone,
      providerCity: data.city?.name,
    },
    days: days.slice(0, 7),
  };
}

async function getOpenWeatherErrorMessage(response) {
  try {
    const errorData = await response.json();
    return errorData?.message ? `: ${errorData.message}` : "";
  } catch {
    return "";
  }
}

export async function fetchOpenWeatherForecast(location) {
  const apiKey = import.meta.env.VITE_OPEN_WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_OPEN_WEATHER_API_KEY is missing");
  }

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    appid: apiKey,
    units: "metric",
    lang: "ru",
  });

  const response = await fetch(`${OPEN_WEATHER_URL}?${params.toString()}`);
  if (!response.ok) {
    const details = await getOpenWeatherErrorMessage(response);
    throw new Error(`OpenWeather request failed with status ${response.status}${details}`);
  }

  const data = await response.json();
  return normalizeOpenWeatherDaily(data, location);
}

function normalizeOpenMeteoDaily(data, location) {
  const daily = data.daily;
  const dates = daily?.time ?? [];

  if (!dates.length) {
    throw new Error("Open-Meteo returned no daily forecast");
  }

  const allDays = dates.map((date, index) =>
    buildWeatherDay({
      date,
      weatherCode: Number(daily.weather_code?.[index] ?? 3),
      weatherTempMax: Number(daily.temperature_2m_max?.[index] ?? 0),
      weatherTempMin: Number(daily.temperature_2m_min?.[index] ?? 0),
    }),
  );

  return {
    source: "open-meteo",
    generatedAt: new Date().toISOString(),
    location: {
      ...location,
      providerTimezone: data.timezone,
    },
    days: allDays.slice(1, 8),
  };
}

export async function fetchOpenMeteoForecast(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: location.timezone === "auto" ? "auto" : location.timezone,
    forecast_days: "8",
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }

  const data = await response.json();
  return normalizeOpenMeteoDaily(data, location);
}
