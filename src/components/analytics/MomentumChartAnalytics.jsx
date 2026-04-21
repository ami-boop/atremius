import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_MOMENTUM_CHART_ANALYTICS } from '@/lib/mocks';
import { CHART_HEIGHT } from '@/constants';
import { filterDefs } from '@/config/metrics'
import { modeLabelsShort, modeColors} from '@/config/mode'

const generateData = (max) => [
  { label: 'ПН',  value: Math.round(max * 0.45), mode: 'СТАБИЛЬНО' },
  { label: 'ВТ',  value: Math.round(max * 0.70), mode: 'ПРОДУКТИВНОСТЬ' },
  { label: 'СР',  value: Math.round(max * 0.60), mode: 'СТАБИЛЬНО' },
  { label: 'ЧТ',  value: Math.round(max * 0.85), mode: 'ПРОДУКТИВНОСТЬ' },
  { label: 'СГД', value: Math.round(max * 0.78), mode: 'ПРОДУКТИВНОСТЬ' },
  { label: 'СБ',  value: 0, mode: null },
  { label: 'ВС',  value: 0, mode: null },
];

const initialData = Object.fromEntries(filterDefs.map(f => [f.key, generateData(f.max)]));

function InputModal({ day, filter, onSave, onClose }) {
  const [val, setVal] = useState(day.value);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface-container-highest)] border border-[var(--ghost-border)] rounded-xl p-5 shadow-2xl w-60"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-xs font-inter font-semibold text-foreground mb-1">{day.label} — {filter.label}</p>
        <p className="text-[10px] text-muted-foreground mb-3">Введите значение (0–{filter.max})</p>
        <input
          autoFocus
          type="number"
          min={0}
          max={filter.max}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(Number(val)); if (e.key === 'Escape') onClose(); }}
          className="w-full bg-[var(--surface-container-high)] rounded-lg px-3 py-2 text-sm font-inter text-foreground outline-none border border-primary/30 mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSave(Math.min(filter.max, Math.max(0, Number(val) || 0)))}
            className="flex-1 py-1.5 rounded-lg text-xs font-inter font-semibold transition-colors"
            style={{ background: `${filter.color}25`, color: filter.color }}
          >
            Сохранить
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg bg-[var(--surface-container-high)] text-muted-foreground text-xs font-inter hover:text-foreground transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MomentumChartAnalytics({ data: externalData, onValueChange }) {
  const { modeColor } = useMode();
  const [active, setActive] = useState('focus');
  const [data, setData] = useState(externalData ?? DEFAULT_MOMENTUM_CHART_ANALYTICS ?? initialData);
  const [tooltip, setTooltip] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setData(externalData ?? DEFAULT_MOMENTUM_CHART_ANALYTICS ?? initialData);
  }, [externalData]);

  const days = data[active];
  const activeFilter = filterDefs.find(f => f.key === active);
  const barColor = active === 'focus' ? modeColor : activeFilter.color;
  const maxVal = Math.max(...days.map(d => d.value), 1);

  const handleSave = (dayIdx, value) => {
    onValueChange?.(active, data[active][dayIdx], value);
    setEditing(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500 flex flex-col"
    >
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Динамика за 7 дней
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Нажмите на столбик чтобы изменить</p>
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-[var(--surface-container-low)] rounded-lg p-1">
          {filterDefs.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-inter font-semibold tracking-wider transition-all duration-300 ${
                active === f.key ? 'bg-[var(--surface-container-highest)]' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ color: active === f.key ? (f.key === 'focus' ? modeColor : f.color) : undefined }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed-height chart for correct proportions */}
      <div className="flex items-end gap-2 relative" style={{ height: CHART_HEIGHT }}>
        {days.map((day, i) => {
          const barH = day.value > 0 ? (day.value / maxVal) * CHART_HEIGHT : 3;
          const isHov = tooltip?.dayIdx === i;
          return (
            <div
              key={day.label}
              className="flex-1 flex flex-col items-center justify-end group cursor-pointer h-full"
              onMouseEnter={(e) => {
                if (day.value > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ dayIdx: i, x: rect.left + rect.width / 2, y: rect.top });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => setEditing({ dayIdx: i })}
            >
              {day.value > 0 && (
                <span className="text-[9px] font-inter text-muted-foreground/70 mb-0.5">
                  {day.value}{activeFilter.max === 100 ? '%' : ''}
                </span>
              )}
              <motion.div
                key={active + day.label}
                initial={{ height: 0 }}
                animate={{ height: barH }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                className="w-full rounded-t-md transition-opacity"
                style={{
                  background: day.value > 0 ? barColor : 'var(--surface-container-high)',
                  opacity: day.value > 0 ? (isHov ? 1 : 0.65) : 0.12,
                  boxShadow: isHov && day.value > 0 ? `0 -4px 12px ${barColor}50` : 'none',
                  minHeight: 3,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Day labels + mode badges */}
      <div className="flex gap-2 mt-2">
        {days.map((day, i) => (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-0.5">
            <span className={`text-[9px] font-inter font-medium tracking-wider ${day.label === 'СГД' ? 'text-primary' : 'text-muted-foreground'}`}>
              {day.label}
            </span>
            {day.mode && (
              <span
                className="text-[8px] font-inter font-semibold text-center leading-tight"
                style={{ color: modeColors[day.mode] }}
              >
                {modeLabelsShort[day.mode]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Mode legend */}
      <div className="flex gap-3 flex-wrap mt-3">
        {Object.entries(modeLabelsShort).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: modeColors[key] }} />
            <span className="text-[9px] font-inter text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {tooltip && days[tooltip.dayIdx].value > 0 && (
          <motion.div
            key={tooltip.dayIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
          >
            <div className="bg-[var(--surface-container-highest)] border border-[var(--ghost-border)] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
              <p className="text-[10px] font-inter font-semibold" style={{ color: barColor }}>
                {days[tooltip.dayIdx].label} · {activeFilter.label}
              </p>
              <p className="text-xs font-inter font-bold text-foreground mt-0.5">
                {days[tooltip.dayIdx].value}{activeFilter.max === 100 ? '%' : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <InputModal
            day={days[editing.dayIdx]}
            filter={activeFilter}
            onSave={(v) => handleSave(editing.dayIdx, v)}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
