import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useMode } from '@/lib/ModeContext';
import { MODES as modes } from '@/config/mode';
import { states } from '@/config/mode';

export default function StatusBar({ onTestNotification }) {
  const { mode, setMode } = useMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-1 bg-[var(--surface-container)] rounded-xl p-1"
    >
      {states.map((state) => {
        const isActive = mode === state.label;
        const color = modes[state.label].color;
        return (
          <button
            key={state.label}
            onClick={() => setMode(state.label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              isActive ? 'bg-[var(--surface-container-high)]' : 'hover:bg-[var(--surface-container-high)]/50'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
              style={{
                backgroundColor: color,
                opacity: isActive ? 1 : 0.4,
                boxShadow: isActive ? `0 0 6px ${color}` : 'none',
              }}
            />
            <span
              className="text-[10px] font-inter font-semibold tracking-[0.1em] transition-colors duration-300"
              style={{ color: isActive ? color : 'hsl(var(--muted-foreground))' }}
            >
              {state.label}
            </span>
          </button>
        );
      })}
      <button
        onClick={() => void onTestNotification?.()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-[var(--surface-container-high)]/50 text-muted-foreground hover:text-foreground"
        title="Проверить уведомления"
      >
        <Bell className="w-3.5 h-3.5" />
        <span className="text-[10px] font-inter font-semibold tracking-[0.08em]">
          ТЕСТ
        </span>
      </button>
    </motion.div>
  );
}