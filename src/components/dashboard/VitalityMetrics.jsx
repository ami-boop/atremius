import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { initialMetrics } from '../../config/metrics';

function DraggableBar({ metric, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const computeValue = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * metric.max);
  }, [metric.max]);

  const onPointerDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    trackRef.current.setPointerCapture(e.pointerId);
    onChange(computeValue(e.clientX));
  };
  const onPointerMove = (e) => { if (dragging.current) onChange(computeValue(e.clientX)); };
  const onPointerUp = () => { dragging.current = false; };

  const displayValue = `${metric.value}%`;

  return (
    <div>
      <div
        ref={trackRef}
        className="w-full h-3 bg-[var(--surface-container-low)] rounded-full overflow-hidden cursor-pointer relative select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="h-full rounded-full transition-none relative"
          style={{ width: `${(metric.value / metric.max) * 100}%`, background: `linear-gradient(90deg, ${metric.color}50, ${metric.color})` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/30 shadow-md" style={{ backgroundColor: metric.color }} />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        {[25, 50, 75, 100].map(tick => (
          <span key={tick} className="text-[8px] font-inter text-muted-foreground/40">{tick}</span>
        ))}
      </div>
    </div>
  );
}

function CommentModal({ metric, onSave, onClose }) {
  const [draft, setDraft] = useState(metric.comment);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-[var(--surface-container-highest)] border border-[var(--ghost-border)] rounded-xl p-5 w-64 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-xs font-inter font-semibold text-foreground mb-1">{metric.label}</p>
        <p className="text-[10px] text-muted-foreground mb-3">Комментарий (необязательно)</p>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Например: улучшилось после медитации..."
          className="w-full bg-[var(--surface-container-high)] rounded-lg px-3 py-2 text-xs font-inter text-foreground outline-none border border-primary/20 resize-none h-20 mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSave(draft)}
            className="flex-1 py-1.5 rounded-lg text-xs font-inter font-semibold transition-colors"
            style={{ background: `${metric.color}25`, color: metric.color }}
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
      </motion.div>
    </motion.div>
  );
}

export default function VitalityMetrics() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [commentFor, setCommentFor] = useState(null); // index

  const handleChange = (index, value) => {
    setMetrics(prev => prev.map((m, i) => i === index ? { ...m, value } : m));
  };
  const handleSaveComment = (index, comment) => {
    setMetrics(prev => prev.map((m, i) => i === index ? { ...m, comment } : m));
    setCommentFor(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 hover:bg-[var(--surface-container-high)] transition-all duration-500 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Показатели жизненных сил
        </span>
        <button
          onClick={() => setCommentFor(commentFor !== null ? null : 0)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-inter text-muted-foreground hover:text-foreground bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Комментарий
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {metrics.map((metric, i) => (
          <div key={metric.label} className="py-3.5 border-b border-[var(--ghost-border)] last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-inter text-muted-foreground">{metric.label}</span>
                {metric.comment && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" title={metric.comment} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-inter font-semibold" style={{ color: metric.color }}>{metric.value}%</span>
                <button
                  onClick={() => setCommentFor(i)}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                </button>
              </div>
            </div>
            {metric.comment && (
              <p className="text-[10px] font-inter text-secondary mb-1.5 italic">{metric.comment}</p>
            )}
            <DraggableBar metric={metric} onChange={(v) => handleChange(i, v)} />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {commentFor !== null && (
          <CommentModal
            metric={metrics[commentFor]}
            onSave={(c) => handleSaveComment(commentFor, c)}
            onClose={() => setCommentFor(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}