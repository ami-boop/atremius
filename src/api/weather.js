import { KFAR_TAVOR_FALLBACK, OPEN_WEATHER_URL, SARATOV_FALLBACK } from "../constants/weather";

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

function openWeatherToMeteoCode(openWeatherCode) {
  if (openWeatherCode === 800) return 0;
  if (openWeatherCode === 801) return 1;
  if (openWeatherCode === 802) return 2;
  if ([803, 804].includes(openWeatherCode)) return 3;

  if ([701, 711, 721, 731, 741, 751, 761, 762].includes(openWeatherCode)) return 45;

  if ([300, 301, 302, 310, 311, 312, 313, 314, 321].includes(openWeatherCode)) return 53;
  if ([500, 501].includes(openWeatherCode)) return 61;
  if ([502, 503].includes(openWeatherCode)) return 63;
  if ([504].includes(openWeatherCode)) return 65;
  if ([511].includes(openWeatherCode)) return 67;
  if ([520, 521].includes(openWeatherCode)) return 80;
  if ([522, 531].includes(openWeatherCode)) return 82;

  if ([600, 601].includes(openWeatherCode)) return 71;
  if ([602].includes(openWeatherCode)) return 75;
  if ([611, 612, 613].includes(openWeatherCode)) return 77;
  if ([615, 616].includes(openWeatherCode)) return 85;
  if ([620, 621].includes(openWeatherCode)) return 73;
  if ([622].includes(openWeatherCode)) return 86;

  if ([200, 201, 202, 210, 211, 212, 221, 230, 231, 232].includes(openWeatherCode)) return 95;

  return 3;
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
  const apiKey = import.meta.env.OPEN_WEATHER_API_KEY || import.meta.env.VITE_OPEN_WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPEN_WEATHER_API_KEY is missing");
  }

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    appid: apiKey,
    units: "metric",
    lang: "ru",
    exclude: "current,minutely,hourly,alerts",
  });

  const response = await fetch(`${OPEN_WEATHER_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const daily = data.daily ?? [];

  if (!daily.length) {
    throw new Error("Weather API returned no daily forecast");
  }

  const allDays = daily.map((day) => {
    const openWeatherCode = day.weather?.[0]?.id ?? 804;
    const weatherCode = openWeatherToMeteoCode(openWeatherCode);
    const weatherTemp = Math.round(((day.temp?.max ?? 0) + (day.temp?.min ?? 0)) / 2);
    const date = new Date((day.dt ?? 0) * 1000).toISOString().slice(0, 10);

    return {
      date,
      weather_temp: weatherTemp,
      weather_type: weatherCodeToType(weatherCode),
      weather_code: weatherCode,
      weather_temp_max: day.temp?.max ?? 0,
      weather_temp_min: day.temp?.min ?? 0,
    };
  });

  const days = allDays.slice(1, 8);

  return {
    source: "open-weather",
    generatedAt: new Date().toISOString(),
    location,
    days,
    comment:
      location.source === "geolocation"
        ? "Погода получена по текущей геолокации через OpenWeather."
        : location.source === "manual"
          ? `Погода получена для ${location.name} через OpenWeather.`
          : `Геолокация недоступна, поэтому использован прогноз для ${location.name} через OpenWeather.`,
  };
}
