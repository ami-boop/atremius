import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { modeLabels } from '@/config/mode';

export default function DayModeCard() {
  const { modeColor, mode } = useMode();
  const info = modeLabels[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500 flex flex-col justify-between h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Режим дня
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${modeColor}20` }}>
          <Zap className="w-3.5 h-3.5" style={{ color: modeColor }} />
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-2xl tracking-tight text-foreground mb-1">
          {info.title}
        </h3>
        <p className="text-xs font-inter font-medium mb-5" style={{ color: modeColor }}>
          {info.risk}
        </p>
      </div>

      <div className="mt-auto space-y-1">
        <p className="text-muted-foreground text-xs font-inter leading-relaxed">
          Рекомендуемая нагрузка: 3 блока фокуса сегодня.
        </p>
        <p className="text-muted-foreground text-xs font-inter">
          Ёмкость: {info.capacity}.
        </p>
      </div>
    </motion.div>
  );
}