import { useState } from 'react';
import { motion } from 'framer-motion';
import { modeColors, modeLabelsShort } from '@/config/mode';
import { CHART_HEIGHT } from '@/constants';
import { filters } from '@/config/metrics';

// TODO: REMOVE HARDCODED DATA
const data = {
  focus: [
    { label: 'ПН', value: 45, mode: 'СТАБИЛЬНО' },
    { label: 'ВТ', value: 70, mode: 'ПРОДУКТИВНОСТЬ' },
    { label: 'СР', value: 60, mode: 'СТАБИЛЬНО' },
    { label: 'ЧТ', value: 85, mode: 'ПРОДУКТИВНОСТЬ' },
    { label: 'СГД', value: 78, mode: 'ПРОДУКТИВНОСТЬ' },
    { label: 'СБ', value: 0,  mode: null },
    { label: 'ВС', value: 0,  mode: null },
  ],
  stress: [
    { label: 'ПН', value: 60, mode: 'СТАБИЛЬНО' },
    { label: 'ВТ', value: 45, mode: 'СТАБИЛЬНО' },
    { label: 'СР', value: 75, mode: 'ВОССТАНОВЛЕНИЕ' },
    { label: 'ЧТ', value: 30, mode: 'ПРОДУКТИВНОСТЬ' },
    { label: 'СГД', value: 35, mode: 'ПРОДУКТИВНОСТЬ' },
    { label: 'СБ', value: 0,  mode: null },
    { label: 'ВС', value: 0,  mode: null },
  ],
};


export default function MomentumChart() {
  const [active, setActive] = useState('focus');
  const days = data[active];
  const maxVal = Math.max(...days.map((d) => d.value), 1);
  const activeColor = filters.find((f) => f.key === active).color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 hover:bg-[var(--surface-container-high)] transition-all duration-500 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Динамика за 7 дней
        </span>
        <div className="flex items-center gap-1 bg-[var(--surface-container-low)] rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`px-3 py-1 rounded-md text-[10px] font-inter font-semibold tracking-wider transition-all duration-300 ${
                active === f.key
                  ? 'bg-[var(--surface-container-highest)] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ color: active === f.key ? f.color : undefined }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — fixed height so proportions are correct */}
      <div className="flex items-end gap-3" style={{ height: CHART_HEIGHT }}>
        {days.map((day, i) => {
          const barHeight = day.value > 0 ? (day.value / maxVal) * CHART_HEIGHT : 3;
          const barColor = day.mode ? modeColors[day.mode] : 'var(--surface-container-high)';
          return (
            <div key={day.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[9px] font-inter text-muted-foreground/70">{day.value > 0 ? `${day.value}%` : ''}</span>
              <motion.div
                key={active + day.label}
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                className="w-full rounded-t-md"
                style={{
                  background: barColor,
                  opacity: day.value > 0 ? 0.8 : 0.12,
                  minHeight: 3,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Day labels + mode labels */}
      <div className="flex gap-3 mt-2">
        {days.map((day, i) => {
          const modeColor = day.mode ? modeColors[day.mode] : 'transparent';
          return (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-0.5">
              <span className={`text-[9px] font-inter font-medium tracking-wider ${day.label === 'СГД' ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.label}
              </span>
              {day.mode && (
                <span className="text-[8px] font-inter font-semibold text-center leading-tight" style={{ color: modeColor }}>
                  {modeLabelsShort[day.mode]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mt-3">
        {Object.entries(modeLabelsShort).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: modeColors[key] }} />
            <span className="text-[9px] font-inter text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}