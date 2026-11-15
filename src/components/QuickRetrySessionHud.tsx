import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer,
  RotateCcw,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  CheckCircle2,
  Zap,
  Target,
  Sparkles,
  BellOff,
  Eye,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { useHudSnooze } from '../utils/hudSnooze';

interface QuickRetrySessionHudProps {
  retryQueueQuestionIds: string[];
  retryQueueSecondsLeft: number;
  onlyRetryQueue: boolean;
  unresolvedMistakeIds: string[];
  questions: Question[];
  activeTab: string;
  onActivateRetryDrill: () => void;
  onToggleRetryFilter: () => void;
  onStartQuickRetrySession: (questionsToQueue: Question[]) => void;
  onResetTimer: () => void;
  onClearQueue: () => void;
  onJumpToQuestion?: (questionId: string) => void;
}

const HUD_POSITION_STORAGE_KEY = 'az900_quick_retry_hud_pos_v1';
const TOTAL_SESSION_SECONDS = 300; // 5 minutes

export const QuickRetrySessionHud: React.FC<QuickRetrySessionHudProps> = ({
  retryQueueQuestionIds,
  retryQueueSecondsLeft,
  onlyRetryQueue,
  unresolvedMistakeIds,
  questions,
  activeTab,
  onActivateRetryDrill,
  onToggleRetryFilter,
  onStartQuickRetrySession,
  onResetTimer,
  onClearQueue,
  onJumpToQuestion,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const {
    isHudSnoozed,
    getRemainingMinutes,
    toggleQuickRetryWithNotificationSuppression,
    areNotificationsSuppressed,
  } = useHudSnooze();
  const isQuickRetrySnoozed = isHudSnoozed('quick-retry');

  const [offset, setOffset] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(HUD_POSITION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return { x: parsed.x, y: parsed.y };
        }
      }
    } catch {
      // ignore storage errors
    }
    return { x: 0, y: 0 };
  });

  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const isSessionActive =
    retryQueueSecondsLeft > 0 && retryQueueQuestionIds.length > 0;

  // Candidate questions to launch a 5-minute Quick-Retry session when in standby mode
  const candidateQuestionsToDrill = React.useMemo(() => {
    if (retryQueueQuestionIds.length > 0) {
      return questions.filter((q) => retryQueueQuestionIds.includes(q.id));
    }
    if (unresolvedMistakeIds.length > 0) {
      return questions
        .filter((q) => unresolvedMistakeIds.includes(q.id))
        .slice(0, 5);
    }
    // Fallback: pick 5 scenario/challenging questions across modules so user can always launch a 5-min Quick-Retry drill
    return questions.slice(0, 5);
  }, [retryQueueQuestionIds, unresolvedMistakeIds, questions]);

  const queuedQuestions = React.useMemo(() => {
    const idSet = new Set(retryQueueQuestionIds);
    return questions.filter((q) => idSet.has(q.id));
  }, [questions, retryQueueQuestionIds]);

  const remainingToDrillCount = isSessionActive
    ? retryQueueQuestionIds.length
    : unresolvedMistakeIds.length > 0
    ? unresolvedMistakeIds.length
    : candidateQuestionsToDrill.length;

  const displaySeconds = isSessionActive
    ? retryQueueSecondsLeft
    : TOTAL_SESSION_SECONDS;

  const formattedTime = React.useMemo(() => {
    const mins = Math.floor(displaySeconds / 60);
    const secs = displaySeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [displaySeconds]);

  const progressPct = isSessionActive
    ? Math.max(
        0,
        Math.min(100, Math.round((retryQueueSecondsLeft / TOTAL_SESSION_SECONDS) * 100))
      )
    : 100;

  const isUrgent = isSessionActive && retryQueueSecondsLeft <= 60;
  const isWarning =
    isSessionActive && retryQueueSecondsLeft > 60 && retryQueueSecondsLeft <= 120;

  const clampOffset = (nextX: number, nextY: number) => {
    if (typeof window === 'undefined') return { x: nextX, y: nextY };
    const maxLeft = -Math.max(120, window.innerWidth - 220);
    const maxRight = 40;
    const maxUp = -8;
    const maxDown = Math.max(200, window.innerHeight - 100);
    return {
      x: Math.max(maxLeft, Math.min(maxRight, nextX)),
      y: Math.max(maxUp, Math.min(maxDown, nextY)),
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.hasMoved = true;
      }
      const clamped = clampOffset(
        dragRef.current.initialX + dx,
        dragRef.current.initialY + dy
      );
      setOffset(clamped);
    };

    const handlePointerUp = () => {
      if (!dragRef.current.isDragging) return;
      dragRef.current.isDragging = false;
      try {
        localStorage.setItem(HUD_POSITION_STORAGE_KEY, JSON.stringify(offset));
      } catch {
        // ignore storage errors
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [offset]);

  const handleDragStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: offset.x,
      initialY: offset.y,
      hasMoved: false,
    };
  };

  const handleResetPosition = () => {
    const zero = { x: 0, y: 0 };
    setOffset(zero);
    try {
      localStorage.removeItem(HUD_POSITION_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailsOpen(false);
    toggleQuickRetryWithNotificationSuppression();
  };

  return (
    <div
      data-testid="quick-retry-hud-container"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      className="fixed top-2 right-2 sm:right-3 z-[142] pointer-events-none select-none flex flex-col items-end"
      role="region"
      aria-label="Persistent 5-Minute Quick-Retry Session HUD"
    >
      <AnimatePresence mode="wait">
        {!isQuickRetrySnoozed ? (
          /* Main Persistent On-Screen HUD Pill (Gracefully fades out when double-clicked or closed) */
          <motion.div
            key="quick-retry-hud-active"
            data-testid="quick-retry-hud"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: -10,
              transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
            }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            onDoubleClick={handleToggleVisibility}
            title="Double-click anywhere to hide Quick-Retry HUD & suppress all notifications for 20 mins"
            className={`pointer-events-auto rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden transition-colors duration-200 cursor-pointer ${
              isSessionActive
                ? isUrgent
                  ? 'bg-slate-950/95 border-rose-400 text-white ring-2 ring-rose-500/40'
                  : isWarning
                  ? 'bg-slate-950/95 border-amber-400 text-white ring-1 ring-amber-400/40'
                  : 'bg-slate-950/95 border-emerald-400/90 text-white ring-1 ring-emerald-400/30'
                : 'bg-slate-900/95 border-slate-700/90 text-slate-100 hover:border-amber-400/70'
            }`}
          >
            {/* Top Compact Row */}
            <div className="px-2.5 py-1.5 flex items-center gap-2">
              {/* Drag Handle */}
              <button
                type="button"
                onPointerDown={handleDragStart}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleResetPosition();
                }}
                title="Drag to reposition Quick-Retry HUD (double-click grip to reset position)"
                aria-label="Drag Quick-Retry HUD"
                className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>

              {/* Status Indicator + Session Label */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isSessionActive
                      ? isUrgent
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-amber-300 border border-slate-700'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                </span>
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      Quick-Retry HUD
                    </span>
                    {isSessionActive && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Remaining Time Counter */}
                    <span
                      data-testid="quick-retry-hud-timer"
                      className={`font-mono text-xs sm:text-sm font-black tabular-nums tracking-tight ${
                        isSessionActive
                          ? isUrgent
                            ? 'text-rose-300'
                            : isWarning
                            ? 'text-amber-300'
                            : 'text-emerald-300'
                          : 'text-slate-200'
                      }`}
                      title="Remaining time for the 5-minute Quick-Retry session"
                    >
                      {formattedTime}
                    </span>

                    <span className="text-slate-600 text-[10px]">•</span>

                    {/* Count of Remaining Questions to Drill */}
                    <span
                      data-testid="quick-retry-hud-remaining-count"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums bg-white/10 text-white border border-white/15"
                      title="Count of remaining questions to drill in this Quick-Retry session"
                    >
                      <Target className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>
                        {remainingToDrillCount}{' '}
                        {remainingToDrillCount === 1 ? 'Question' : 'Questions'} Left
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button: Drill Now / Start 5:00 Quick-Retry */}
              {isSessionActive ? (
                <button
                  type="button"
                  data-testid="quick-retry-hud-drill-btn"
                  onDoubleClick={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab !== 'quiz' || !onlyRetryQueue) {
                      onActivateRetryDrill();
                    } else {
                      onToggleRetryFilter();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                    onlyRetryQueue && activeTab === 'quiz'
                      ? 'bg-emerald-400 text-slate-950 shadow-xs'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
                  }`}
                  title={
                    onlyRetryQueue && activeTab === 'quiz'
                      ? 'Currently drilling Quick-Retry queue (click to show all questions)'
                      : 'Focus quiz purely on your remaining Quick-Retry questions'
                  }
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>
                    {onlyRetryQueue && activeTab === 'quiz'
                      ? 'Drilling Queue'
                      : 'Drill Queue'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="quick-retry-hud-start-btn"
                  onDoubleClick={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartQuickRetrySession(candidateQuestionsToDrill);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 inline-flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Start a 5-minute Quick-Retry session to drill unresolved mistakes or priority questions"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start 5:00 Drill</span>
                </button>
              )}

              {/* Expand / Collapse HUD Details */}
              <button
                type="button"
                data-testid="quick-retry-hud-expand-btn"
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDetailsOpen((prev) => !prev);
                }}
                aria-expanded={isDetailsOpen}
                aria-label="Toggle Quick-Retry HUD details"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isDetailsOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Direct Close / Switch-Off Button (Hides HUD & Suppresses Notifications for 20 Minutes) */}
              <button
                type="button"
                data-testid="snooze-quick-retry-hud-btn"
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={handleToggleVisibility}
                title="Double-click or click ✕ to hide Quick-Retry HUD & suppress all notifications for 20 minutes"
                aria-label="Hide Quick-Retry HUD and suppress notifications for 20 minutes"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5-Minute Session Progress Bar */}
            <div className="h-1 w-full bg-slate-800 overflow-hidden">
              <div
                data-testid="quick-retry-hud-progress-bar"
                style={{ width: `${progressPct}%` }}
                className={`h-full transition-all duration-500 ${
                  !isSessionActive
                    ? 'bg-amber-400/50'
                    : isUrgent
                    ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400'
                }`}
              />
            </div>

            {/* Expandable Quick-Retry Queue Details Drawer */}
            {isDetailsOpen && (
              <div
                data-testid="quick-retry-hud-drawer"
                className="p-3.5 space-y-3 border-t border-slate-800 bg-slate-950/95"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>5-Minute Quick-Retry Drill HUD</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {isSessionActive
                        ? `${retryQueueQuestionIds.length} question${
                            retryQueueQuestionIds.length === 1 ? '' : 's'
                          } remaining in your active 5-minute rapid remediation window.`
                        : `Launch a timed 5:00 Quick-Retry sprint with ${remainingToDrillCount} priority question${
                            remainingToDrillCount === 1 ? '' : 's'
                          }.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleToggleVisibility}
                      title="Double-click HUD or click to hide & suppress notifications for 20 mins"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-[10px] font-bold text-slate-300 hover:text-rose-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <BellOff className="w-3 h-3 text-amber-300" />
                      <span>Hide 20m</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDetailsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      aria-label="Close Quick-Retry HUD details"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Remaining Questions List */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(isSessionActive ? queuedQuestions : candidateQuestionsToDrill).map(
                    (q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          if (!isSessionActive) {
                            onStartQuickRetrySession(candidateQuestionsToDrill);
                          } else if (onJumpToQuestion) {
                            onJumpToQuestion(q.id);
                          } else {
                            onActivateRetryDrill();
                          }
                          setIsDetailsOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 transition-all flex items-start gap-2 cursor-pointer group"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 font-mono text-[10px] font-black shrink-0 mt-0.5 tabular-nums">
                          #{idx + 1} • M{q.moduleId}
                        </span>
                        <span className="text-[11px] text-slate-200 group-hover:text-white line-clamp-2 font-medium leading-snug">
                          {q.question}
                        </span>
                      </button>
                    )
                  )}
                </div>

                {/* Controls Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  {isSessionActive ? (
                    <>
                      <button
                        type="button"
                        onClick={onResetTimer}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset 5:00 Timer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearQueue();
                          setIsDetailsOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>End Session</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onStartQuickRetrySession(candidateQuestionsToDrill);
                        setIsDetailsOpen(false);
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 text-xs font-black inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        Start 5-Minute Quick-Retry ({remainingToDrillCount} Questions)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Subtle Snoozed Pill (Double-click or click toggles HUD back ON and restores notifications) */
          <motion.div
            key="quick-retry-hud-snoozed"
            data-testid="quick-retry-hud-snoozed"
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: -4,
              transition: { duration: 0.22, ease: 'easeIn' },
            }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="pointer-events-auto"
          >
            <button
              type="button"
              data-testid="restore-snoozed-quick-retry-hud-btn"
              onDoubleClick={handleToggleVisibility}
              onClick={handleToggleVisibility}
              title="Double-click or click to restore Quick-Retry HUD and re-enable notifications"
              className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-[10px] font-bold inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer select-none group"
            >
              <BellOff className="w-3 h-3 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>
                Quick-Retry &amp; Alerts Off ({getRemainingMinutes('quick-retry')}m)
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-extrabold">
                Double-click to restore
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
