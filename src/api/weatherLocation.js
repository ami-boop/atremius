import { KFAR_TAVOR_FALLBACK, SARATOV_FALLBACK } from '@/constants/weather';

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
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "auto",
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

function isValidCoordinate(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function normalizeLocation(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    throw new Error(`Invalid weather location coordinates for ${location?.name ?? "unknown location"}`);
  }

  return {
    ...location,
    latitude,
    longitude,
    timezone: location?.timezone || "auto",
  };
}

function normalizeManualLocation(location, source = "manual") {
  return {
    ...normalizeLocation(location),
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
    return normalizeLocation(await getCurrentPosition());
  } catch {
    return getManualLocation(profile, "kfar-tavor") ?? getManualLocation(profile, "saratov") ?? normalizeLocation(SARATOV_FALLBACK);
  }
}
