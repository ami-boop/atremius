import React, { useEffect, useState } from 'react';
import { Plus, Check, Pencil, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_HABITS } from '@/lib/mocks';

export default function HabitsTracker({ habits: externalHabits, onChange }) {
  const [habits, setHabits] = useState(externalHabits ?? DEFAULT_HABITS);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newHabit, setNewHabit] = useState('');

  useEffect(() => {
    setHabits(externalHabits ?? DEFAULT_HABITS);
  }, [externalHabits]);

  const applyHabits = (nextHabits) => {
    setHabits(nextHabits);
    onChange?.(nextHabits);
  };

  const toggle = (id) => applyHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));

  const startEdit = (h) => { setEditingId(h.id); setEditValue(h.name); };
  const saveEdit = (id) => {
    if (editValue.trim()) applyHabits(habits.map(h => h.id === id ? { ...h, name: editValue.trim() } : h));
    setEditingId(null);
  };
  const remove = (id) => applyHabits(habits.filter(h => h.id !== id));

  const addHabit = () => {
    if (newHabit.trim()) {
      applyHabits([...habits, { id: Date.now(), name: newHabit.trim(), done: false, emoji: '✨' }]);
      setNewHabit('');
      setAdding(false);
    }
  };

  const { modeColor } = useMode();
  const doneCount = habits.filter(h => h.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 hover:bg-[var(--surface-container-high)]/60 transition-all duration-500 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Базовые привычки
        </span>
        <span className="text-[10px] font-inter" style={{ color: modeColor }}>{doneCount}/{habits.length} выполнено</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--surface-container-low)] rounded-full mb-4 overflow-hidden">
        <motion.div
          animate={{ width: `${habits.length ? (doneCount / habits.length) * 100 : 0}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: modeColor }}
        />
      </div>

      <div className="space-y-1 flex-1">
        <AnimatePresence>
          {habits.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[var(--surface-container-highest)]/40 group transition-colors"
            >
              <button
                onClick={() => toggle(h.id)}
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all border"
                style={h.done ? { background: `${modeColor}25`, borderColor: `${modeColor}70` } : {}}
              >
                {h.done && <Check className="w-3 h-3" style={{ color: modeColor }} />}
              </button>

              <span className="text-sm mr-1">{h.emoji}</span>

              {editingId === h.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(h.id); if (e.key === 'Escape') setEditingId(null); }}
                  onBlur={() => saveEdit(h.id)}
                  className="flex-1 bg-[var(--surface-container-highest)] rounded px-2 py-0.5 text-xs font-inter text-foreground outline-none border border-primary/30"
                />
              ) : (
                <span className={`flex-1 text-xs font-inter transition-colors ${h.done ? 'line-through text-muted-foreground' : 'text-foreground/80'}`}>
                  {h.name}
                </span>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(h)} className="p-1 rounded hover:bg-[var(--surface-container-high)] text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => remove(h.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[var(--surface-container-highest)]/40">
              <input
                autoFocus
                value={newHabit}
                onChange={e => setNewHabit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addHabit(); if (e.key === 'Escape') setAdding(false); }}
                placeholder="Название привычки..."
                className="flex-1 bg-transparent text-xs font-inter text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button onClick={addHabit} className="p-1 rounded" style={{ color: modeColor }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setAdding(false)} className="p-1 rounded text-muted-foreground hover:bg-[var(--surface-container-high)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 mt-3 py-2 px-2 text-xs font-inter text-muted-foreground hover:text-primary rounded-lg hover:bg-[var(--surface-container-highest)]/40 transition-all w-full"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Добавить привычку</span>
      </button>
    </motion.div>
  );
}
