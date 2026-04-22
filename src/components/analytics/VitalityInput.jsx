import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { MessageSquare } from 'lucide-react';
import { metricDefs } from '../../config/metrics';
import { DEFAULT_VITALITY, DEFAULT_VITALITY_COMMENTS } from '@/lib/mocks';

function CommentModal({ metricLabel, comment, color, onSave, onClose }) {
  const [draft, setDraft] = useState(comment);
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
        <p className="text-xs font-inter font-semibold text-foreground mb-1">{metricLabel}</p>
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
            style={{ background: `${color}25`, color }}
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

export default function VitalityInput({
  values: externalValues,
  comments: externalComments,
  onValuesChange,
  onCommentsChange,
}) {
  const [values, setValues] = useState(externalValues ?? DEFAULT_VITALITY);
  const [comments, setComments] = useState(externalComments ?? DEFAULT_VITALITY_COMMENTS);
  const [commentFor, setCommentFor] = useState(null);
  const { modeColor } = useMode();

  useEffect(() => {
    setValues(externalValues ?? DEFAULT_VITALITY);
  }, [externalValues]);

  useEffect(() => {
    setComments(externalComments ?? DEFAULT_VITALITY_COMMENTS);
  }, [externalComments]);

  const handleChange = (key, val) => {
    const def = metricDefs.find(m => m.key === key);
    const nextValues = { ...values, [key]: Math.min(def.max, Math.max(0, Number(val))) };
    setValues(nextValues);
    onValuesChange?.(nextValues);
  };

  const handleSaveComment = (key, text) => {
    const nextComments = { ...comments, [key]: text };
    setComments(nextComments);
    onCommentsChange?.(nextComments);
    setCommentFor(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Показатели жизненных сил
        </span>
        <button
          onClick={() => setCommentFor(metricDefs[0].key)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-inter text-muted-foreground hover:text-foreground bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Комментарий
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-4">
        {metricDefs.map((m) => {
          const pct = Math.min(100, (values[m.key] / m.max) * 100);
          return (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-inter text-muted-foreground">{m.label}</span>
                  {comments[m.key] && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" title={comments[m.key]} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleChange(m.key, values[m.key] - m.step)}
                    className="w-6 h-6 rounded flex items-center justify-center bg-[var(--surface-container-high)] text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >−</button>
                  <span className="text-xs font-inter font-semibold w-14 text-center" style={{ color: modeColor }}>
                    {values[m.key]}{m.unit}
                  </span>
                  <button
                    onClick={() => handleChange(m.key, values[m.key] + m.step)}
                    className="w-6 h-6 rounded flex items-center justify-center bg-[var(--surface-container-high)] text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >+</button>
                  <button
                    onClick={() => setCommentFor(m.key)}
                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {comments[m.key] && (
                <p className="text-[10px] font-inter text-secondary mb-1.5 italic">{comments[m.key]}</p>
              )}
              <div className="w-full h-1.5 bg-[var(--surface-container-low)] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: modeColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {commentFor !== null && (
          <CommentModal
            metricLabel={metricDefs.find(m => m.key === commentFor)?.label}
            comment={comments[commentFor] || ''}
            color={modeColor}
            onSave={(text) => handleSaveComment(commentFor, text)}
            onClose={() => setCommentFor(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
