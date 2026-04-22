import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { Clock, ChevronRight, Check } from 'lucide-react';

export default function CurrentTaskCard({ blocks, onToggleSubtask }) {
  const { modeColor } = useMode();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const sortedBlocks = [...blocks].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  let currentBlock = null;
  let nextBlock = null;

  for (let i = 0; i < sortedBlocks.length; i++) {
    if (parseTime(sortedBlocks[i].time) <= currentMinutes) {
      currentBlock = sortedBlocks[i];
      nextBlock = sortedBlocks[i + 1] || null;
    }
  }
  if (!currentBlock && sortedBlocks.length > 0) {
    nextBlock = sortedBlocks[0];
  }

  // Countdown in seconds
  let secondsLeft = null;
  if (currentBlock) {
    const endSeconds = (parseTime(currentBlock.time) + parseInt(currentBlock.duration || 0)) * 60;
    secondsLeft = Math.max(0, endSeconds - currentSeconds);
  }

  const pad = (n) => String(n).padStart(2, '0');
  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const completedSubtasks = currentBlock ? currentBlock.subtasks.filter(s => s.done).length : 0;
  const totalSubtasks = currentBlock ? currentBlock.subtasks.length : 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500 flex flex-col justify-between h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Сейчас в фокусе
        </span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${modeColor}15` }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: modeColor }} />
          <span className="text-[9px] font-inter font-semibold" style={{ color: modeColor }}>АКТИВНО</span>
        </div>
      </div>

      {currentBlock ? (
        <>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: modeColor }} />
              <span className="text-[11px] font-inter text-muted-foreground">{currentBlock.time} · {currentBlock.duration} мин</span>
            </div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-manrope font-bold text-lg tracking-tight text-foreground leading-snug">
                {currentBlock.title}
              </h3>
              {secondsLeft !== null && (
                <div className="shrink-0 text-right">
                  <p className="font-manrope font-bold text-xl tracking-tight text-foreground leading-none">
                    {secondsLeft > 0 ? formatCountdown(secondsLeft) : '00:00'}
                  </p>
                  <p className="text-[9px] font-inter text-muted-foreground tracking-[0.1em] uppercase mt-0.5">
                    {secondsLeft > 0 ? 'до конца' : 'завершён'}
                  </p>
                </div>
              )}
            </div>

            {/* Subtasks */}
            {currentBlock.subtasks.length > 0 && (
              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-inter text-muted-foreground">Подзадачи</span>
                  <span className="text-[10px] font-inter font-semibold" style={{ color: modeColor }}>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </div>
                <div className="w-full h-1 bg-[var(--surface-container-low)] rounded-full overflow-hidden mb-2">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: modeColor }}
                  />
                </div>
                <div className="space-y-1">
                  {currentBlock.subtasks.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => onToggleSubtask && onToggleSubtask(currentBlock.id, sub.id)}
                      className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-[var(--surface-container-highest)]/50 transition-colors cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all border"
                        style={sub.done
                          ? { background: `${modeColor}25`, borderColor: `${modeColor}60` }
                          : { borderColor: 'rgba(62,74,63,0.3)' }
                        }
                      >
                        {sub.done && <Check className="w-2.5 h-2.5" style={{ color: modeColor }} />}
                      </div>
                      <span className={`text-xs font-inter select-none ${sub.done ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
                        {sub.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {nextBlock && (
            <div className="flex items-center gap-2 pt-3 border-t border-[var(--ghost-border)]">
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[9px] font-inter text-muted-foreground uppercase tracking-wider">Далее</span>
                <p className="text-[11px] font-inter text-muted-foreground truncate max-w-[180px]">
                  {nextBlock.time} · {nextBlock.title}
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <p className="text-sm font-inter text-muted-foreground">Нет активных блоков</p>
          <p className="text-[10px] font-inter text-muted-foreground/60 mt-1">Добавьте задачи в протокол фокуса</p>
        </div>
      )}
    </motion.div>
  );
}