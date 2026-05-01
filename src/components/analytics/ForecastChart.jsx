import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { CloudSun, Loader2 } from 'lucide-react';
import { DEFAULT_FORECAST } from '@/lib/mocks';
import { generateProductivityForecast } from '@/api/forecastAi';
import { fetchWeatherForecast, resolveWeatherLocation } from '@/api/weather';
import { getForecastRunSlot } from '@/lib/dateUtils';
import { DAY_LABELS } from '@/constants';
import { modeLabelsShort, modeColors } from '@/config/mode';

function getNextDayLabels() {
  const result = [];
  const now = new Date();

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    result.push({ label: DAY_LABELS[d.getDay()] });
  }

  return result;
}

function getForecastErrorMessage(error) {
  return error.message || 'Не удалось получить прогноз погоды.';
}

function isForecastFreshForCurrentSlot(forecast, currentDateKey, timezone) {
  if (!forecast) return false;

  return (
    forecast.forecastDateKey === currentDateKey &&
    forecast.slot === getForecastRunSlot(timezone)
  );
}

function doesForecastMatchLocation(forecast, selectedWeatherLocation) {
  if (selectedWeatherLocation === 'auto') return forecast?.location?.source === 'geolocation';
  return forecast?.location?.id === selectedWeatherLocation;
}

function getWeatherIcon(type) {
  const normalizedType = (type || '').toLowerCase();
  if (normalizedType.includes('дождь') || normalizedType.includes('rain')) return '🌧';
  if (normalizedType.includes('снег') || normalizedType.includes('snow')) return '❄️';
  if (normalizedType.includes('облач') || normalizedType.includes('cloud')) return '☁️';
  return '☀️';
}

export default function ForecastChart({
  forecast: externalForecast,
  onChange,
  daysByDate,
  currentDateKey,
  profile,
  onProfileChange,
}) {
  const { modeColor } = useMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState(externalForecast ?? DEFAULT_FORECAST);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const days = useMemo(getNextDayLabels, []);
  const appTimezone = profile?.timezone ?? 'Europe/Saratov';
  const weatherLocationOptions = useMemo(
    () => [
      { id: 'auto', name: 'Текущая геолокация' },
      ...(profile?.weatherLocations ?? []),
    ],
    [profile?.weatherLocations],
  );
  const selectedWeatherLocation = profile?.selectedWeatherLocation ?? 'auto';

  useEffect(() => {
    setForecast(externalForecast ?? DEFAULT_FORECAST);
  }, [externalForecast]);

  useEffect(() => {
    setHasAutoLoaded(false);
  }, [currentDateKey, selectedWeatherLocation]);

  const loadForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const location = await resolveWeatherLocation(profile);
      const weatherForecast = await fetchWeatherForecast(location);
      const nextForecast = await generateProductivityForecast({
        daysByDate,
        currentDateKey,
        weatherForecast,
        location,
        profile,
      });

      setForecast(nextForecast);
      onChange?.(nextForecast);
    } catch (nextError) {
      setError(getForecastErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoLoaded) return;

    if (
      isForecastFreshForCurrentSlot(forecast, currentDateKey, appTimezone) &&
      doesForecastMatchLocation(forecast, selectedWeatherLocation)
    ) {
      setHasAutoLoaded(true);
      return;
    }

    setHasAutoLoaded(true);
    void loadForecast();
  }, [appTimezone, currentDateKey, daysByDate, forecast, hasAutoLoaded, selectedWeatherLocation]);

  const visibleDays = forecast?.days?.slice(0, 7) ?? DEFAULT_FORECAST.days;
  const maxScore = Math.max(...visibleDays.map((day) => day.focus_score), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500"
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Прогноз производительности на 7 дней
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <select
            value={selectedWeatherLocation}
            onChange={(event) => {
              const nextLocationId = event.target.value;
              onProfileChange?.({ selectedWeatherLocation: nextLocationId });
              setHasAutoLoaded(false);
            }}
            className="bg-[var(--surface-container-high)] rounded-lg px-3 py-1.5 text-[10px] font-inter text-foreground outline-none"
          >
            {weatherLocationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadForecast}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-inter text-muted-foreground hover:text-foreground bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudSun className="w-3 h-3" />}
            Обновить
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-inter">Рассчитываем прогноз...</span>
        </div>
      )}

      {!loading && forecast && (
        <>
          {error && (
            <p className="text-[11px] font-inter text-red-400 mb-4 leading-relaxed bg-red-500/10 rounded-lg px-3 py-2">
              Не удалось обновить погоду: {error}
            </p>
          )}

          {forecast.comment && (
            <p className="text-[11px] font-inter text-muted-foreground mb-4 leading-relaxed bg-[var(--surface-container-low)] rounded-lg px-3 py-2">
              💡 {forecast.comment}
            </p>
          )}

          {/* Chart */}
          <div className="flex items-end gap-2 h-[100px] mb-3">
            {visibleDays.map((day, i) => {
              const pct = Math.max(6, (day.focus_score / maxScore) * 100);
              const dm = day.work_mode || '';
              const barCol = modeColors[dm] || modeColor;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">{day.focus_score}%</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                    className="w-full rounded-t-md min-h-[4px]"
                    style={{ background: barCol, opacity: 0.75 }}
                    title={day.recommendation}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div className="flex gap-2 mb-3">
            {visibleDays.map((day, i) => {
              const d = days[i];
              const dm = day.work_mode || '';
              const barCol = modeColors[dm] || modeColor;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-inter font-medium text-muted-foreground">{d.label}</span>
                  <span className="text-sm leading-none">{getWeatherIcon(day.weather_type)}</span>
                  <span className="text-[9px] font-inter text-muted-foreground">{Math.round(day.weather_temp)}°</span>
                  {dm && (
                    <span className="text-[8px] font-inter font-semibold mt-0.5 text-center leading-tight" style={{ color: barCol }}>
                      {modeLabelsShort[dm] || dm}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mode legend */}
          <div className="flex gap-3 flex-wrap">
            {Object.entries(modeLabelsShort).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: modeColors[key] }} />
                <span className="text-[9px] font-inter text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {forecast.recommendations?.length > 0 && (
            <div className="mt-4 bg-[var(--surface-container-low)] rounded-lg px-3 py-3">
              <p className="text-[10px] font-inter font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2">
                Рекомендации недели
              </p>
              <div className="space-y-1.5">
                {forecast.recommendations.map((item) => (
                  <p key={item} className="text-[11px] font-inter text-muted-foreground leading-relaxed">
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] font-inter text-muted-foreground/40 mt-3">
            * Погода берётся из OpenWeather с fallback на Open-Meteo, а прогноз и рекомендации генерируются через OpenRouter утром и вечером
          </p>
        </>
      )}
    </motion.div>
  );
}
