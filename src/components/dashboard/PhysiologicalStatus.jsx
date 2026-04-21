import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_PHYSIOLOGY } from '@/lib/mocks';
import { bodyPoints } from '@/config/metrics';
import { BODY_POINTS_STATUS_CYCLE as STATUS_CYCLE } from '@/constants';

export default function PhysiologicalStatus({ pointState: externalPointState, onChange }) {
  const { modeColor } = useMode();
  const [pointState, setPointState] = useState(externalPointState ?? DEFAULT_PHYSIOLOGY);
  const [selected, setSelected] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPointState(externalPointState ?? DEFAULT_PHYSIOLOGY);
  }, [externalPointState]);

  const applyPointState = (nextState) => {
    setPointState(nextState);
    onChange?.(nextState);
  };

  const cycleStatus = (id) => {
    const currentStatus = pointState[id].status;
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    applyPointState({
      ...pointState,
      [id]: {
        ...pointState[id],
        status: nextStatus,
      },
    });
  };

  const openComment = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(id);
    setCommentDraft(pointState[id].comment);
  };

  const saveComment = () => {
    if (selected) {
      applyPointState({ ...pointState, [selected]: { ...pointState[selected], comment: commentDraft } });
    }
    setSelected(null);
  };

  const getColor = (id) => {
    const s = pointState[id].status;
    if (s === 'ok') return 'var(--emerald)'; // always green regardless of mode
    if (s === 'mild') return 'var(--amber)';
    if (s === 'pain') return 'var(--coral)';
    return '#444';
  };

  const statusLabel = (s) => {
    if (s === 'ok') return 'Отлично';
    if (s === 'mild') return 'Среднее';
    if (s === 'pain') return 'Болит';
    return 'Не отмечено';
  };

  const hoveredPoint = bodyPoints.find(p => p.id === hovered);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500 flex flex-col h-full"
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">
        Физиологический статус
      </span>

      <div className="flex-1 flex items-center justify-center py-2">
        <div className="relative w-full max-w-[130px] mx-auto">
          <svg viewBox="0 0 120 200" className="w-full">
            <circle cx="60" cy="18" r="13" fill="none" stroke="#2a2a2a" strokeWidth="1.2" />
            <line x1="60" y1="31" x2="60" y2="120" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="60" y1="50" x2="33" y2="55" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="60" y1="50" x2="87" y2="55" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="33" y1="55" x2="22" y2="82" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="22" y1="82" x2="14" y2="105" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="87" y1="55" x2="98" y2="82" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="98" y1="82" x2="106" y2="105" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="60" y1="120" x2="42" y2="155" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="42" y1="155" x2="36" y2="185" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="60" y1="120" x2="78" y2="155" stroke="#2a2a2a" strokeWidth="1.4" />
            <line x1="78" y1="155" x2="84" y2="185" stroke="#2a2a2a" strokeWidth="1.4" />

            {bodyPoints.map((pt) => {
              const color = getColor(pt.id);
              const isHov = hovered === pt.id;
              return (
                <g key={pt.id}>
                  <circle
                    cx={pt.cx} cy={pt.cy} r={isHov ? 6 : 4.5}
                    fill={color}
                    opacity={pointState[pt.id].status === null ? 0.35 : 0.9}
                    className="cursor-pointer transition-all duration-150"
                    style={{ filter: isHov ? `drop-shadow(0 0 6px ${color})` : 'none' }}
                    onClick={() => cycleStatus(pt.id)}
                    onContextMenu={(e) => openComment(pt.id, e)}
                    onMouseEnter={() => setHovered(pt.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {pointState[pt.id].comment && (
                    <circle cx={pt.cx + 5} cy={pt.cy - 5} r="2.5" fill="var(--amber)" opacity="0.9" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {[
          { label: 'Отлично', color: 'var(--emerald)' },
          { label: 'Среднее', color: 'var(--amber)' },
          { label: 'Болит', color: 'var(--coral)' },
          { label: 'Не отмечено', color: '#444' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] font-inter text-muted-foreground">{l.label}</span>
          </div>
        ))}
        <p className="col-span-2 text-[9px] font-inter text-muted-foreground/50 mt-1">ПКМ — добавить комментарий</p>
      </div>

      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 pointer-events-none"
            style={{ left: mousePos.x + 12, top: mousePos.y - 10 }}
          >
            <div className="bg-[var(--surface-container-highest)] border border-[var(--ghost-border)] rounded-lg px-3 py-2 shadow-xl">
              <p className="text-[10px] font-inter font-semibold text-foreground">{hoveredPoint.label}</p>
              <p className="text-[10px] font-inter text-muted-foreground">{statusLabel(pointState[hoveredPoint.id].status)}</p>
              {pointState[hoveredPoint.id].comment && (
                <p className="text-[9px] font-inter text-secondary mt-0.5 max-w-[150px]">{pointState[hoveredPoint.id].comment}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={saveComment}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[var(--surface-container-highest)] border border-[var(--ghost-border)] rounded-xl p-5 w-64 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs font-inter font-semibold text-foreground mb-1">
                {bodyPoints.find(p => p.id === selected)?.label}
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">Комментарий (необязательно)</p>
              <textarea
                autoFocus
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Например: тянет при движении..."
                className="w-full bg-[var(--surface-container-high)] rounded-lg px-3 py-2 text-xs font-inter text-foreground outline-none border border-primary/20 resize-none h-20 mb-3"
              />
              <div className="flex gap-2">
                <button onClick={saveComment} className="flex-1 py-1.5 rounded-lg text-xs font-inter font-semibold transition-colors" style={{ background: `${modeColor}25`, color: modeColor }}>
                  Сохранить
                </button>
                <button onClick={() => setSelected(null)} className="flex-1 py-1.5 rounded-lg bg-[var(--surface-container-high)] text-muted-foreground text-xs font-inter hover:text-foreground transition-colors">
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
