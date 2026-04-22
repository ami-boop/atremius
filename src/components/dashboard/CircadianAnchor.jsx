import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';

export default function CircadianAnchor() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const targetHour = 23;

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const { modeColor } = useMode();
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 hover:bg-[var(--surface-container-high)] transition-all duration-500 flex flex-col justify-between h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Циркадный якорь
        </span>
        <Moon className="w-4 h-4 text-secondary" />
      </div>

      <div className="text-center my-auto">
        <p className="font-manrope font-bold text-4xl tracking-tight text-foreground">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </p>
        <p className="text-[10px] font-inter text-muted-foreground tracking-[0.15em] uppercase mt-2">
          До целевого сна (23:00)
        </p>
      </div>

      <div className="mt-auto pt-4">
        <div className="w-full h-1 bg-[var(--surface-container-low)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              backgroundColor: modeColor,
              width: `${Math.max(2, 100 - ((timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds) / (16 * 3600)) * 100)}%`,
              opacity: 0.6,
            }}
          />
        </div>
        <p className="text-[10px] font-inter text-muted-foreground/50 mt-1.5 text-center">Прогресс дня</p>
      </div>
    </motion.div>
  );
}
