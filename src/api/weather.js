import { KFAR_TAVOR_FALLBACK, OPEN_METEO_URL, SARATOV_FALLBACK } from "../constants/weather";

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

function normalizeManualLocation(location, source = "manual") {
  return {
    ...location,
    source,
  };
}

function getManualLocation(profile, locationId) {
  const savedLocations = profile?.weatherLocations ?? [];
  const matched = savedLocations.find((location) => location.id === locationId);

  if (matched) return normalizeManualLocation(matched);
  if (locationId === "kfar-tavor") return normalizeManualLocation(KFAR_TAVOR_FALLBACK);
  if (locationId === "saratov") return normalizeManualLocation(SARATOV_FALLBACK);
  return null;
}

export async function resolveWeatherLocation(profile) {
  const selectedLocationId = profile?.selectedWeatherLocation ?? "auto";

  if (selectedLocationId !== "auto") {
    const manualLocation = getManualLocation(profile, selectedLocationId);
    if (manualLocation) return manualLocation;
  }

  try {
    return await getCurrentPosition();
  } catch {
    return getManualLocation(profile, "kfar-tavor") ?? getManualLocation(profile, "saratov") ?? SARATOV_FALLBACK;
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

    return {
      date,
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
        ? "Погода получена по текущей геолокации через Open-Meteo."
        : location.source === "manual"
          ? `Погода получена для ${location.name} через Open-Meteo.`
          : `Геолокация недоступна, поэтому использован прогноз для ${location.name} через Open-Meteo.`,
  };
}
