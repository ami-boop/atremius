import { OPEN_METEO_URL, SARATOV_FALLBACK, BASE_FOCUS_PATTERN } from "../constants/weather";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function weatherCodeToType(code) {
  if (code === 0) return "солнечно";
  if ([1].includes(code)) return "преимущественно ясно";
  if ([2].includes(code)) return "переменная облачность";
  if ([3].includes(code)) return "облачно";
  if ([45, 48].includes(code)) return "туман";
  if ([51, 53, 55, 56, 57].includes(code)) return "морось";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "дождь";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "снег";
  if ([95, 96, 99].includes(code)) return "гроза";
  return "облачно";
}

function weatherScoreAdjustment(code) {
  if (code === 0) return 8;
  if ([1].includes(code)) return 5;
  if ([2].includes(code)) return 2;
  if ([3].includes(code)) return -2;
  if ([45, 48].includes(code)) return -6;
  if ([51, 53, 55, 56, 57].includes(code)) return -7;
  if ([61, 63, 65, 66, 67].includes(code)) return -9;
  if ([80, 81, 82].includes(code)) return -10;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return -8;
  if ([95, 96, 99].includes(code)) return -12;
  return 0;
}

function temperatureScoreAdjustment(temp) {
  if (temp >= 18 && temp <= 24) return 4;
  if (temp >= 10 && temp < 18) return 2;
  if (temp >= 25 && temp <= 29) return 1;
  if (temp >= 0 && temp < 10) return -2;
  if (temp < 0) return -5;
  if (temp >= 30) return -4;
  return 0;
}

function scoreToWorkMode(score) {
  if (score >= 70) return "ПРОДУКТИВНОСТЬ";
  if (score >= 40) return "СТАБИЛЬНО";
  return "ВОССТАНОВЛЕНИЕ";
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: "Current location",
          timezone: "auto",
          source: "geolocation",
        });
      },
      reject,
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      },
    );
  });
}

export async function resolveWeatherLocation() {
  try {
    return await getCurrentPosition();
  } catch {
    return SARATOV_FALLBACK;
  }
}

export async function fetchWeatherForecast(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: location.timezone || "auto",
    forecast_days: "8",
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const daily = data.daily;

  if (!daily?.time?.length) {
    throw new Error("Weather API returned no daily forecast");
  }

  const allDays = daily.time.map((date, index) => {
    const weatherCode = daily.weather_code[index];
    const weatherTemp = Math.round(
      ((daily.temperature_2m_max[index] ?? 0) + (daily.temperature_2m_min[index] ?? 0)) / 2,
    );
    const focusScore = clamp(
      BASE_FOCUS_PATTERN[index] + weatherScoreAdjustment(weatherCode) + temperatureScoreAdjustment(weatherTemp),
      15,
      95,
    );

    return {
      date,
      focus_score: focusScore,
      work_mode: scoreToWorkMode(focusScore),
      weather_temp: weatherTemp,
      weather_type: weatherCodeToType(weatherCode),
      weather_code: weatherCode,
      weather_temp_max: daily.temperature_2m_max[index],
      weather_temp_min: daily.temperature_2m_min[index],
    };
  });

  const days = allDays.slice(1, 8);

  return {
    source: "open-meteo",
    generatedAt: new Date().toISOString(),
    location,
    days,
    comment:
      location.source === "geolocation"
        ? "Погода получена по текущей геолокации через Open-Meteo. Рабочий режим и фокус оценены локально по недельному паттерну и погодным условиям."
        : "Геолокация недоступна, поэтому использован прогноз для Saratov через Open-Meteo. Рабочий режим и фокус оценены локально по недельному паттерну и погодным условиям.",
  };
}
