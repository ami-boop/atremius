import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Check, GripVertical, Clock, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useMode } from '@/lib/ModeContext';
import { DURATIONS, MODE_LIMITS, TIMES } from '@/constants';

function FocusBlock({
  block,
  onToggleSubtask,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onUpdateTime,
  onUpdateTitle,
  onUpdateDuration,
  onDelete,
  dragControls,
  maxDuration,
  nowMinutes,
}) {
  const { modeColor } = useMode();
  const [expanded, setExpanded] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [titleDraft, setTitleDraft] = useState(block.title);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const completedCount = block.subtasks.filter(s => s.done).length;

  const parseTime = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const blockEnd = parseTime(block.time) + parseInt(block.duration || 0);
  const isDone = nowMinutes >= blockEnd;

  useEffect(() => {
    setTitleDraft(block.title);
  }, [block.title]);

  const startEditingSubtask = (subtask) => {
    setExpanded(true);
    setAddingSubtask(false);
    setNewSubtaskText('');
    setEditingSubtaskId(subtask.id);
    setSubtaskDraft(subtask.text);
  };

  const saveSubtaskEdit = (subtaskId, fallbackText) => {
    const nextText = subtaskDraft.trim();
    setEditingSubtaskId(null);
    setSubtaskDraft('');

    if (!nextText || nextText === fallbackText) return;
    onUpdateSubtask(block.id, subtaskId, nextText);
  };

  const cancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setSubtaskDraft('');
  };

  const submitNewSubtask = () => {
    const nextText = newSubtaskText.trim();
    if (!nextText) {
      setAddingSubtask(false);
      setNewSubtaskText('');
      return;
    }

    onAddSubtask(block.id, nextText);
    setAddingSubtask(false);
    setNewSubtaskText('');
  };

  return (
    <Reorder.Item value={block} dragListener={false} dragControls={dragControls} className="group">
      <div className="flex items-start gap-2 p-3 rounded-lg hover:bg-[var(--surface-container-high)] transition-all duration-200">
        {/* Drag handle */}
        <button
          className="mt-1 shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Time badge */}
        <div className="flex flex-col items-center shrink-0 mt-0.5">
          <div className="w-0.5 h-2" style={{ background: `${modeColor}50` }} />
          <div className="relative">
            {editingTime ? (
              <select
                autoFocus
                defaultValue={block.time}
                onChange={e => { onUpdateTime(block.id, e.target.value); setEditingTime(false); }}
                onBlur={() => setEditingTime(false)}
                className="px-1 py-0.5 rounded bg-[var(--surface-container-highest)] text-[10px] font-inter text-foreground outline-none border border-primary/30"
              >
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <button
                onClick={() => setEditingTime(true)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--surface-container-highest)] text-[10px] font-inter font-medium text-muted-foreground hover:text-foreground group/time"
              >
                {block.time}
                <Clock className="w-2.5 h-2.5 opacity-0 group-hover/time:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          <div className="w-0.5 flex-1 min-h-[16px]" style={{ background: `${modeColor}30` }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => !editingTitle && setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { onUpdateTitle(block.id, titleDraft); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
                onBlur={() => { onUpdateTitle(block.id, titleDraft); setEditingTitle(false); }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-[var(--surface-container-highest)] rounded px-2 py-0.5 text-sm font-inter text-foreground outline-none border border-primary/30"
              />
            ) : (
              <h4
                className="text-sm font-inter font-semibold truncate transition-colors duration-300"
                style={{ color: isDone ? 'var(--emerald)' : undefined }}
              >
                {block.title}
              </h4>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setTitleDraft(block.title); setEditingTitle(true); }}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(block.id); }}
                className="text-muted-foreground hover:text-destructive p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-5">
            {/* Duration editable */}
            {editingDuration ? (
              <select
                autoFocus
                defaultValue={block.duration}
                onChange={e => { onUpdateDuration(block.id, e.target.value); setEditingDuration(false); }}
                onBlur={() => setEditingDuration(false)}
                className="px-1 py-0.5 rounded bg-[var(--surface-container-highest)] text-[10px] font-inter text-foreground outline-none border border-primary/30"
              >
                {DURATIONS.filter(d => !maxDuration || parseInt(d) <= maxDuration).map(d => <option key={d} value={d}>{d} мин</option>)}
              </select>
            ) : (
              <button
                onClick={() => setEditingDuration(true)}
                className="text-[10px] font-inter text-muted-foreground hover:text-foreground flex items-center gap-1 group/dur"
              >
                {block.duration} мин
                <Pencil className="w-2 h-2 opacity-0 group-hover/dur:opacity-100 transition-opacity" />
              </button>
            )}
            <span className="text-[10px] font-inter" style={{ color: `${modeColor}99` }}>
              {completedCount}/{block.subtasks.length} выполнено
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="ml-[52px] pl-4 border-l space-y-1 pb-2" style={{ borderColor: `${modeColor}20` }}>
              {block.subtasks.map(sub => (
                <div
                  key={sub.id}
                  className="group/subtask flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-[var(--surface-container-highest)]/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onToggleSubtask(block.id, sub.id)}
                    className="shrink-0"
                  >
                    <div className="w-4 h-4 rounded flex items-center justify-center transition-all border"
                    style={sub.done ? { background: `${modeColor}25`, borderColor: `${modeColor}60` } : { borderColor: 'rgba(62,74,63,0.15)' }}
                    >
                      {sub.done && <Check className="w-2.5 h-2.5" style={{ color: modeColor }} />}
                    </div>
                  </button>

                  {editingSubtaskId === sub.id ? (
                    <input
                      autoFocus
                      value={subtaskDraft}
                      onChange={e => setSubtaskDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveSubtaskEdit(sub.id, sub.text);
                        if (e.key === 'Escape') cancelSubtaskEdit();
                      }}
                      onBlur={() => saveSubtaskEdit(sub.id, sub.text)}
                      className="flex-1 bg-[var(--surface-container-highest)] rounded px-2 py-1 text-xs font-inter text-foreground outline-none border border-primary/30"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleSubtask(block.id, sub.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className={`text-xs font-inter block truncate ${sub.done ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
                        {sub.text}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover/subtask:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditingSubtask(sub)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingSubtaskId === sub.id) cancelSubtaskEdit();
                        onDeleteSubtask(block.id, sub.id);
                      }}
                      className="text-muted-foreground hover:text-destructive p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {addingSubtask ? (
                <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-md bg-[var(--surface-container-highest)]/40">
                  <div className="w-4 h-4 rounded border border-dashed shrink-0" style={{ borderColor: `${modeColor}60` }} />
                  <input
                    autoFocus
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitNewSubtask();
                      if (e.key === 'Escape') {
                        setAddingSubtask(false);
                        setNewSubtaskText('');
                      }
                    }}
                    onBlur={submitNewSubtask}
                    placeholder="Новая подзадача"
                    className="flex-1 bg-transparent text-xs font-inter text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(true);
                    setEditingSubtaskId(null);
                    setSubtaskDraft('');
                    setAddingSubtask(true);
                  }}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md text-xs font-inter text-muted-foreground hover:text-foreground hover:bg-[var(--surface-container-highest)]/40 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Добавить подзадачу</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function DraggableBlock({
  block,
  onToggleSubtask,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onUpdateTime,
  onUpdateTitle,
  onUpdateDuration,
  onDelete,
  maxDuration,
  nowMinutes,
}) {
  const dragControls = useDragControls();
  return (
    <FocusBlock
      block={block}
      onToggleSubtask={onToggleSubtask}
      onAddSubtask={onAddSubtask}
      onUpdateSubtask={onUpdateSubtask}
      onDeleteSubtask={onDeleteSubtask}
      onUpdateTime={onUpdateTime}
      onUpdateTitle={onUpdateTitle}
      onUpdateDuration={onUpdateDuration}
      onDelete={onDelete}
      maxDuration={maxDuration}
      dragControls={dragControls}
      nowMinutes={nowMinutes}
    />
  );
}

export default function DailyFocusProtocol({ onBlocksChange, initialBlocks: externalInitial, strategicGoal = 'Редизайн архитектуры дизайн-системы' }) {
  const [blocks, setBlocks] = useState(externalInitial || []);
  const { modeColor, mode } = useMode();
  const limit = MODE_LIMITS[mode];
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    setBlocks(externalInitial || []);
  }, [externalInitial]);

  // When mode changes — trim blocks to the new limit and enforce max duration
  useEffect(() => {
    setBlocks(prev => {
      let updated = prev.slice(0, limit.maxBlocks);
      if (limit.maxDuration) {
        updated = updated.map(b => ({
          ...b,
          duration: Math.min(parseInt(b.duration) || 30, limit.maxDuration).toString(),
        }));
      }
      // notify parent outside of setter via setTimeout to avoid render-phase update
      setTimeout(() => onBlocksChange && onBlocksChange(updated), 0);
      return updated;
    });
  }, [mode]);



  const updateBlocks = (newBlocks) => {
    setBlocks(newBlocks);
    onBlocksChange && onBlocksChange(newBlocks);
  };

  const toggleSubtask = (blockId, subtaskId) => {
    updateBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, subtasks: b.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) } : b
    ));
  };

  const addSubtask = (blockId, text) => {
    const nextText = text.trim();
    if (!nextText) return;

    updateBlocks(blocks.map(b =>
      b.id === blockId
        ? {
            ...b,
            subtasks: [
              ...b.subtasks,
              { id: Date.now() + Math.random(), text: nextText, done: false },
            ],
          }
        : b
    ));
  };

  const updateSubtask = (blockId, subtaskId, text) => {
    const nextText = text.trim();
    if (!nextText) return;

    updateBlocks(blocks.map(b =>
      b.id === blockId
        ? {
            ...b,
            subtasks: b.subtasks.map(s => s.id === subtaskId ? { ...s, text: nextText } : s),
          }
        : b
    ));
  };

  const deleteSubtask = (blockId, subtaskId) => {
    updateBlocks(blocks.map(b =>
      b.id === blockId
        ? { ...b, subtasks: b.subtasks.filter(s => s.id !== subtaskId) }
        : b
    ));
  };

  const updateTime = (blockId, time) => updateBlocks(blocks.map(b => b.id === blockId ? { ...b, time } : b));
  const updateTitle = (blockId, title) => { if (title.trim()) updateBlocks(blocks.map(b => b.id === blockId ? { ...b, title: title.trim() } : b)); };
  const updateDuration = (blockId, duration) => updateBlocks(blocks.map(b => b.id === blockId ? { ...b, duration } : b));
  const deleteBlock = (blockId) => updateBlocks(blocks.filter(b => b.id !== blockId));

  const canAddBlock = blocks.length < limit.maxBlocks;
  const defaultDuration = limit.maxDuration ? String(limit.maxDuration) : '30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="bg-[var(--surface-container)] rounded-xl p-6 transition-all duration-500 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          Протокол фокуса
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-inter text-muted-foreground">{blocks.length}/{limit.maxBlocks} блоков</span>
          {limit.maxDuration && (
            <span className="text-[10px] font-inter px-2 py-0.5 rounded-full" style={{ background: `${modeColor}15`, color: modeColor }}>
              макс {limit.maxDuration} мин
            </span>
          )}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[9px] font-inter font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Основная стратегическая цель
        </p>
        <div className="bg-[var(--surface-container-low)] rounded-lg px-4 py-3">
          <span className="text-sm font-inter text-muted-foreground">{strategicGoal}</span>
        </div>
      </div>

      <Reorder.Group axis="y" values={blocks} onReorder={updateBlocks} className="flex-1 space-y-1">
        {blocks.map(block => (
          <DraggableBlock
            key={block.id}
            block={block}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={deleteSubtask}
            onUpdateTime={updateTime}
            onUpdateTitle={updateTitle}
            onUpdateDuration={updateDuration}
            onDelete={deleteBlock}
            maxDuration={limit.maxDuration}
            nowMinutes={nowMinutes}
          />
        ))}
      </Reorder.Group>

      {canAddBlock ? (
        <button
          onClick={() => updateBlocks([...blocks, {
            id: Date.now(),
            time: '18:00',
            title: 'Новый блок фокуса',
            duration: defaultDuration,
            subtasks: [],
          }])}
          className="flex items-center gap-2 mt-4 py-2.5 px-3 text-xs font-inter text-muted-foreground hover:text-foreground rounded-lg hover:bg-[var(--surface-container-highest)]/40 transition-all duration-300 w-full"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить блок фокуса</span>
        </button>
      ) : (
        <div className="mt-4 py-2.5 px-3 text-xs font-inter text-muted-foreground/50 text-center rounded-lg border border-dashed border-muted-foreground/20">
          Лимит блоков для текущего режима достигнут
        </div>
      )}
    </motion.div>
  );
}
