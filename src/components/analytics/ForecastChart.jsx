import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { CloudSun, Loader2 } from 'lucide-react';
import { DEFAULT_FORECAST } from '@/lib/mocks';
import { fetchWeatherForecast, resolveWeatherLocation } from '@/api/weather';
import { DAY_LABELS} from '@/constants'
import { modeLabelsShort } from '@/config/mode'

const nextDays = () => {
  const days = DAY_LABELS
  const result = [];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    result.push({ label: days[d.getDay()] });
  }
  return result;
};


export default function ForecastChart({ forecast: externalForecast, onChange }) {
  const { modeColor } = useMode();
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(externalForecast ?? DEFAULT_FORECAST);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const days = nextDays();

  useEffect(() => {
    setForecast(externalForecast ?? DEFAULT_FORECAST);
  }, [externalForecast]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const location = await resolveWeatherLocation();
      const res = await fetchWeatherForecast(location);
      setForecast(res);
      onChange?.(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoLoaded) return;

    const generatedAt = forecast?.generatedAt ? new Date(forecast.generatedAt) : null;
    const isFreshToday = generatedAt ? generatedAt.toDateString() === new Date().toDateString() : false;

    if (forecast?.source === 'open-meteo' && isFreshToday) {
      setHasAutoLoaded(true);
      return;
    }

    setHasAutoLoaded(true);
    void loadForecast();
  }, [forecast, hasAutoLoaded]);

  const weatherIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('дождь') || t.includes('rain')) return '🌧';
    if (t.includes('снег') || t.includes('snow')) return '❄️';
    if (t.includes('облач') || t.includes('cloud')) return '☁️';
    return '☀️';
  };

  const visibleDays = forecast?.days?.slice(0, 7) ?? DEFAULT_FORECAST.days;
  const maxScore = Math.max(...visibleDays.map(d => d.focus_score), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Прогноз на 7 дней
        </span>
        <button
          onClick={loadForecast}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-inter text-muted-foreground hover:text-foreground bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudSun className="w-3 h-3" />}
          Обновить
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-inter">Анализируем данные...</span>
        </div>
      )}

      {!loading && forecast && (
        <>
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
                  <span className="text-sm leading-none">{weatherIcon(day.weather_type)}</span>
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

          <p className="text-[9px] font-inter text-muted-foreground/40 mt-3">
            * Погода получена из Open-Meteo, режим и фокус рассчитаны локально
          </p>
        </>
      )}
    </motion.div>
  );
}
