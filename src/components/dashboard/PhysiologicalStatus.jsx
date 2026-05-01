import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { DEFAULT_PHYSIOLOGY } from '@/lib/mocks';
import { bodyPointMeta, jointBodyPoints, muscleBodyPoints } from '@/config/metrics';
import { BODY_POINTS_STATUS_CYCLE as STATUS_CYCLE } from '@/constants';
import { buildBodyInsights } from '@/lib/bodyInsights';

function BodyMapSection({
  title,
  points,
  pointState,
  getColor,
  hovered,
  setHovered,
  cycleStatus,
  openComment,
}) {
  const mildLabel = points[0]?.kind === 'muscle' ? 'Слабость' : 'Среднее';

  return (
    <div className="rounded-xl bg-[var(--surface-container-low)] px-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-inter font-semibold tracking-[0.18em] uppercase text-muted-foreground">
          {title}
        </p>
        <p className="text-[9px] font-inter text-muted-foreground/50">ЛКМ статус · ПКМ комментарий</p>
      </div>

      <div className="flex items-center justify-center py-1">
        <div className="relative w-full max-w-[120px] mx-auto">
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

            {points.map((pt) => {
              const color = getColor(pt.id);
              const isHovered = hovered === pt.id;
              const pointData = pointState[pt.id] ?? { status: null, comment: '' };

              return (
                <g key={pt.id}>
                  <circle
                    cx={pt.cx}
                    cy={pt.cy}
                    r={isHovered ? 6 : 4.5}
                    fill={color}
                    opacity={pointData.status === null ? 0.35 : 0.92}
                    className="cursor-pointer transition-all duration-150"
                    style={{ filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none' }}
                    onClick={() => cycleStatus(pt.id)}
                    onContextMenu={(event) => openComment(pt.id, event)}
                    onMouseEnter={() => setHovered(pt.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {pointData.comment && (
                    <circle cx={pt.cx + 5} cy={pt.cy - 5} r="2.5" fill="var(--amber)" opacity="0.9" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {[
          { label: 'Отлично', color: 'var(--emerald)' },
          { label: mildLabel, color: 'var(--amber)' },
          { label: 'Болит', color: 'var(--coral)' },
          { label: 'Не отмечено', color: '#444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-inter text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PhysiologicalStatus({
  pointState: externalPointState,
  onChange,
  daysByDate,
  currentDateKey,
  forecast,
}) {
  const { modeColor } = useMode();
  const [pointState, setPointState] = useState(externalPointState ?? DEFAULT_PHYSIOLOGY);
  const [selected, setSelected] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeMap, setActiveMap] = useState('joints');
  const bodyInsights = useMemo(
    () => buildBodyInsights(daysByDate ?? {}, currentDateKey, pointState),
    [currentDateKey, daysByDate, pointState],
  );
  const bodyRecommendations = forecast?.bodyRecommendations?.length
    ? forecast.bodyRecommendations
    : bodyInsights.bodyRecommendations;
  const activityRecommendations = forecast?.activityRecommendations?.length
    ? forecast.activityRecommendations
    : bodyInsights.activityRecommendations;

  useEffect(() => {
    setPointState(externalPointState ?? DEFAULT_PHYSIOLOGY);
  }, [externalPointState]);

  const applyPointState = (nextState) => {
    setPointState(nextState);
    onChange?.(nextState);
  };

  const cycleStatus = (id) => {
    const currentStatus = pointState[id]?.status ?? null;
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    applyPointState({
      ...pointState,
      [id]: {
        ...(pointState[id] ?? { comment: '' }),
        status: nextStatus,
      },
    });
  };

  const openComment = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(id);
    setCommentDraft(pointState[id]?.comment ?? '');
  };

  const saveComment = () => {
    if (selected) {
      applyPointState({
        ...pointState,
        [selected]: {
          ...(pointState[selected] ?? { status: null }),
          comment: commentDraft,
        },
      });
    }
    setSelected(null);
  };

  const getColor = (id) => {
    const s = pointState[id]?.status ?? null;
    if (s === 'ok') return 'var(--emerald)'; // always green regardless of mode
    if (s === 'mild') return 'var(--amber)';
    if (s === 'pain') return 'var(--coral)';
    return '#444';
  };

  const statusLabel = (pointId, status) => {
    const point = bodyPointMeta[pointId];

    if (status === 'mild' && point?.kind === 'muscle') return 'Слабость';
    if (status === 'ok') return 'Отлично';
    if (status === 'mild') return 'Среднее';
    if (status === 'pain') return 'Болит';
    return 'Не отмечено';
  };

  const hoveredPoint = hovered ? bodyPointMeta[hovered] : null;
  const activeMapConfig = activeMap === 'joints'
    ? { key: 'joints', title: 'Суставы', points: jointBodyPoints }
    : { key: 'muscles', title: 'Мышцы', points: muscleBodyPoints };
  const markCurrentMapAsOk = () => {
    const nextState = { ...pointState };
    activeMapConfig.points.forEach((point) => {
      nextState[point.id] = {
        ...(nextState[point.id] ?? { comment: '' }),
        status: 'ok',
      };
    });
    applyPointState(nextState);
  };

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

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--surface-container-low)] rounded-lg p-1 w-fit">
          {[
            { key: 'joints', label: 'Суставы' },
            { key: 'muscles', label: 'Мышцы' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMap(tab.key)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-inter font-semibold tracking-[0.08em] transition-all ${
                activeMap === tab.key
                  ? 'bg-[var(--surface-container-highest)] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={markCurrentMapAsOk}
          className="px-3 py-1.5 rounded-lg text-[10px] font-inter font-semibold tracking-[0.08em] bg-[var(--surface-container-low)] text-muted-foreground hover:text-foreground hover:bg-[var(--surface-container-high)] transition-colors"
        >
          Отметить все отлично
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <BodyMapSection
          key={activeMapConfig.key}
          title={activeMapConfig.title}
          points={activeMapConfig.points}
          pointState={pointState}
          getColor={getColor}
          hovered={hovered}
          setHovered={setHovered}
          cycleStatus={cycleStatus}
          openComment={openComment}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[var(--surface-container-low)] px-4 py-3">
          <p className="text-[10px] font-inter font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2">
            Рекомендации по телу
          </p>
          <div className="space-y-1.5">
            {bodyRecommendations.map((item) => (
              <p key={item} className="text-[11px] font-inter text-muted-foreground leading-relaxed">
                • {item}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[var(--surface-container-low)] px-4 py-3">
          <p className="text-[10px] font-inter font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2">
            Рекомендации по активности
          </p>
          <div className="space-y-1.5">
            {activityRecommendations.map((item) => (
              <p key={item} className="text-[11px] font-inter text-muted-foreground leading-relaxed">
                • {item}
              </p>
            ))}
          </div>
        </div>
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
              <p className="text-[10px] font-inter text-muted-foreground">
                {statusLabel(hoveredPoint.id, pointState[hoveredPoint.id]?.status ?? null)}
              </p>
              {pointState[hoveredPoint.id]?.comment && (
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
                {bodyPointMeta[selected]?.label}
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
