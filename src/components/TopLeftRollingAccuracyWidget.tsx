import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  X,
  ShieldCheck,
  GripVertical,
  Move,
  EyeOff,
  Eye,
} from 'lucide-react';
import { useHudSnooze } from '../utils/hudSnooze';

const ROLLING_POS_STORAGE_KEY = 'az900_rolling_acc_widget_pos_v1';
const CONFIDENCE_POS_STORAGE_KEY = 'az900_confidence_streak_widget_pos_v1';

interface WidgetOffset {
  x: number;
  y: number;
}

function loadStoredOffset(key: string): WidgetOffset {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return {
        x: Math.max(-120, Math.min(window.innerWidth - 120, parsed.x)),
        y: Math.max(-8, Math.min(window.innerHeight - 60, parsed.y)),
      };
    }
  } catch {
    // ignore storage errors
  }
  return { x: 0, y: 0 };
}

export interface LowAccuracyModulePairAlert {
  pairKey: string;
  prevMod: {
    moduleId: number;
    moduleTitle: string;
    rollingAccuracy: number;
  };
  currMod: {
    moduleId: number;
    moduleTitle: string;
    rollingAccuracy: number;
  };
}

interface TopLeftRollingAccuracyWidgetProps {
  rollingAverageAccuracy: number | null;
  rolling20AccuracySeries: number[];
  sessionRollingOutcomes: boolean[];
  rolling20Trend: {
    delta: number;
    direction: 'up' | 'down' | 'steady';
    label: string;
  };
  last5QuestionsImpact: {
    count: number;
    correctCount: number;
    accuracyPercent: number;
    deltaPercent: number;
    formattedDelta: string;
    direction: 'up' | 'down' | 'steady';
    impactSummary: string;
  };
  effectiveDynamicDifficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  isDynamicDifficultyEnabled: boolean;
  lockedDifficulty: 'Fundamental' | 'Intermediate' | 'Advanced' | null;
  onToggleDynamicDifficulty?: () => void;
  showFundamentalsResetAlert?: boolean;
  consecutiveLowAccuracyModulesAlert?: LowAccuracyModulePairAlert | null;
  onStartFundamentalsResetDrill?: (targetModuleIds: number[], pairKey: string) => void;
  onDismissFundamentalsResetAlert?: (pairKey: string) => void;
  onNavigateToPractice?: () => void;
  confidenceStreak?: number;
  bestConfidenceStreak?: number;
  lastConfidenceLevel?: number | null;
}

export const TopLeftRollingAccuracyWidget: React.FC<TopLeftRollingAccuracyWidgetProps> = ({
  rollingAverageAccuracy,
  rolling20AccuracySeries,
  sessionRollingOutcomes,
  rolling20Trend,
  last5QuestionsImpact,
  effectiveDynamicDifficulty,
  isDynamicDifficultyEnabled,
  lockedDifficulty,
  onToggleDynamicDifficulty,
  showFundamentalsResetAlert = false,
  consecutiveLowAccuracyModulesAlert = null,
  onStartFundamentalsResetDrill,
  onDismissFundamentalsResetAlert,
  onNavigateToPractice,
  confidenceStreak = 0,
  bestConfidenceStreak = 0,
  lastConfidenceLevel = null,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isConfidenceOpen, setIsConfidenceOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isHudSnoozed,
    getRemainingMinutes,
    snoozeHudFor20Mins,
    restoreSnoozedHud,
    snoozeToast,
    dismissSnoozeToast,
  } = useHudSnooze();
  const isRollingSnoozed = isHudSnoozed('rolling-accuracy');
  const isConfidenceSnoozed = isHudSnoozed('confidence-streak');

  // Independent movable offsets for (1) Top-Most Rolling Accuracy Bar and (2) Separate Confidence Calibration Streak
  const [rollingOffset, setRollingOffset] = useState<WidgetOffset>(() =>
    loadStoredOffset(ROLLING_POS_STORAGE_KEY)
  );
  const [confidenceOffset, setConfidenceOffset] = useState<WidgetOffset>(() =>
    loadStoredOffset(CONFIDENCE_POS_STORAGE_KEY)
  );
  const [isDraggingRolling, setIsDraggingRolling] = useState<boolean>(false);
  const [isDraggingConfidence, setIsDraggingConfidence] = useState<boolean>(false);

  const rollingDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const confidenceDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const clampOffset = useCallback((nextX: number, nextY: number): WidgetOffset => {
    if (typeof window === 'undefined') return { x: nextX, y: nextY };
    const maxRight = Math.max(120, window.innerWidth - 140);
    const maxBottom = Math.max(80, window.innerHeight - 48);
    return {
      x: Math.max(-16, Math.min(maxRight, Math.round(nextX))),
      y: Math.max(-4, Math.min(maxBottom, Math.round(nextY))),
    };
  }, []);

  const persistOffset = (key: string, offset: WidgetOffset) => {
    try {
      localStorage.setItem(key, JSON.stringify(offset));
    } catch {
      // ignore storage errors
    }
  };

  const handleRollingPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    rollingDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: rollingOffset.x,
      originY: rollingOffset.y,
      moved: false,
    };
  };

  const handleRollingPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = rollingDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
      setIsDraggingRolling(true);
    }
    if (drag.moved) {
      const clamped = clampOffset(drag.originX + dx, drag.originY + dy);
      setRollingOffset(clamped);
    }
  };

  const handleRollingPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const drag = rollingDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const wasMoved = drag.moved;
    drag.active = false;
    drag.pointerId = null;
    setIsDraggingRolling(false);
    if (wasMoved) {
      persistOffset(ROLLING_POS_STORAGE_KEY, rollingOffset);
    }
  };

  const handleConfidencePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    confidenceDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: confidenceOffset.x,
      originY: confidenceOffset.y,
      moved: false,
    };
  };

  const handleConfidencePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = confidenceDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
      setIsDraggingConfidence(true);
    }
    if (drag.moved) {
      const clamped = clampOffset(drag.originX + dx, drag.originY + dy);
      setConfidenceOffset(clamped);
    }
  };

  const handleConfidencePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const drag = confidenceDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const wasMoved = drag.moved;
    drag.active = false;
    drag.pointerId = null;
    setIsDraggingConfidence(false);
    if (wasMoved) {
      persistOffset(CONFIDENCE_POS_STORAGE_KEY, confidenceOffset);
    }
  };

  const resetRollingPosition = () => {
    const zero = { x: 0, y: 0 };
    setRollingOffset(zero);
    persistOffset(ROLLING_POS_STORAGE_KEY, zero);
  };

  const resetConfidencePosition = () => {
    const zero = { x: 0, y: 0 };
    setConfidenceOffset(zero);
    persistOffset(CONFIDENCE_POS_STORAGE_KEY, zero);
  };

  // Close left-side panel on Escape or outside click
  useEffect(() => {
    if (!isOpen && !isConfidenceOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsConfidenceOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsConfidenceOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, isConfidenceOpen]);

  const hasData = rollingAverageAccuracy !== null && sessionRollingOutcomes.length > 0;
  const isPassing = rollingAverageAccuracy !== null && rollingAverageAccuracy >= 70;
  const isWarning =
    rollingAverageAccuracy !== null &&
    rollingAverageAccuracy >= 60 &&
    rollingAverageAccuracy < 70;
  const isLowAccuracy = rollingAverageAccuracy !== null && rollingAverageAccuracy < 60;

  const miniSvgWidth = 56;
  const miniSvgHeight = 18;
  const miniPoints =
    rolling20AccuracySeries.length > 0
      ? rolling20AccuracySeries.map((acc, idx) => {
          const x =
            rolling20AccuracySeries.length === 1
              ? miniSvgWidth / 2
              : 2 + (idx / Math.max(1, rolling20AccuracySeries.length - 1)) * (miniSvgWidth - 4);
          const y = miniSvgHeight - 2 - (acc / 100) * (miniSvgHeight - 4);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
      : [];

  const fullSvgWidth = 260;
  const fullSvgHeight = 64;
  const fullPadX = 6;
  const fullPadY = 6;
  const fullInnerW = fullSvgWidth - fullPadX * 2;
  const fullInnerH = fullSvgHeight - fullPadY * 2;
  const fullPoints =
    rolling20AccuracySeries.length > 0
      ? rolling20AccuracySeries.map((acc, idx) => {
          const x =
            rolling20AccuracySeries.length === 1
              ? fullSvgWidth / 2
              : fullPadX +
                (idx / Math.max(1, rolling20AccuracySeries.length - 1)) * fullInnerW;
          const y = fullPadY + fullInnerH - (acc / 100) * fullInnerH;
          return { x, y, acc, outcome: sessionRollingOutcomes[idx] };
        })
      : [];
  const fullPolyline = fullPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fullAreaPath =
    fullPoints.length > 1
      ? `M ${fullPoints[0].x.toFixed(1)} ${(fullPadY + fullInnerH).toFixed(1)} L ${fullPoints
          .map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' L ')} L ${fullPoints[fullPoints.length - 1].x.toFixed(1)} ${(
          fullPadY + fullInnerH
        ).toFixed(1)} Z`
      : '';
  const target70Y = fullPadY + fullInnerH - 0.7 * fullInnerH;

  const strokeColor = !hasData
    ? '#0284c7'
    : isPassing
    ? '#10b981'
    : isWarning
    ? '#f59e0b'
    : '#f43f5e';

  const isRollingMoved = rollingOffset.x !== 0 || rollingOffset.y !== 0;
  const isConfidenceMoved = confidenceOffset.x !== 0 || confidenceOffset.y !== 0;

  return (
    <div
      ref={containerRef}
      className="fixed top-1.5 left-2 sm:left-3 z-[140] pointer-events-none select-none flex flex-col items-start gap-1.5"
      data-testid="top-left-rolling-accuracy-widget"
    >
      <div className="flex items-start gap-1.5 sm:gap-2">
      {/* =====================================================================
          WIDGET 1: MOVABLE TOP-MOST ROLLING ACCURACY BAR (Hidden for 20m when closed or double-clicked)
         ===================================================================== */}
      {!isRollingSnoozed && (
      <div
        data-testid="movable-rolling-accuracy-bar"
        data-movable="true"
        style={{
          transform: `translate3d(${rollingOffset.x}px, ${rollingOffset.y}px, 0)`,
        }}
        className={`pointer-events-auto relative ${
          isDraggingRolling ? 'cursor-grabbing z-[145]' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center gap-1">
          <div
            onPointerDown={handleRollingPointerDown}
            onPointerMove={handleRollingPointerMove}
            onPointerUp={handleRollingPointerUp}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              snoozeHudFor20Mins(
                'rolling-accuracy',
                'Rolling Accuracy HUD hidden for 20 minutes (double-clicked)'
              );
            }}
            onClick={() => {
              if (rollingDragRef.current.moved) {
                rollingDragRef.current.moved = false;
                return;
              }
              setIsConfidenceOpen(false);
              setIsOpen((prev) => !prev);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsConfidenceOpen(false);
                setIsOpen((prev) => !prev);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = clampOffset(rollingOffset.x + 24, rollingOffset.y);
                setRollingOffset(next);
                persistOffset(ROLLING_POS_STORAGE_KEY, next);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = clampOffset(rollingOffset.x - 24, rollingOffset.y);
                setRollingOffset(next);
                persistOffset(ROLLING_POS_STORAGE_KEY, next);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = clampOffset(rollingOffset.x, rollingOffset.y + 24);
                setRollingOffset(next);
                persistOffset(ROLLING_POS_STORAGE_KEY, next);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const next = clampOffset(rollingOffset.x, rollingOffset.y - 24);
                setRollingOffset(next);
                persistOffset(ROLLING_POS_STORAGE_KEY, next);
              }
            }}
            aria-expanded={isOpen}
            aria-controls="rolling-accuracy-left-drawer"
            title="Movable Rolling Accuracy Bar (Drag to move, click to expand, or double-click / click ✕ to hide for 20 mins)"
            style={{ touchAction: 'none' }}
            className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-colors duration-200 text-xs ${
              isDraggingRolling ? 'ring-2 ring-sky-400 scale-[1.02]' : ''
            } ${
              showFundamentalsResetAlert || isLowAccuracy
                ? 'bg-rose-950/95 text-white border-rose-400 ring-2 ring-rose-400/50 hover:bg-rose-900'
                : isPassing
                ? 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-emerald-400/80 hover:border-emerald-300'
                : isWarning
                ? 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-amber-400/80 hover:border-amber-300'
                : 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-sky-400/80 hover:border-sky-300'
            }`}
          >
            <GripVertical
              className="w-3 h-3 text-slate-400 group-hover:text-sky-300 shrink-0 -ml-1 cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            />

            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                showFundamentalsResetAlert || isLowAccuracy
                  ? 'bg-rose-400 animate-ping'
                  : isPassing
                  ? 'bg-emerald-400'
                  : isWarning
                  ? 'bg-amber-400'
                  : 'bg-sky-400'
              }`}
            />

            <TrendingUp
              className={`w-3.5 h-3.5 shrink-0 ${
                showFundamentalsResetAlert || isLowAccuracy
                  ? 'text-rose-300'
                  : isPassing
                  ? 'text-emerald-300'
                  : isWarning
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }`}
            />

            <span className="font-extrabold tracking-tight whitespace-nowrap text-[11px] sm:text-xs">
              Rolling Acc:
            </span>

            <span
              className={`font-mono font-black tabular-nums text-xs sm:text-sm ${
                !hasData
                  ? 'text-sky-300'
                  : isPassing
                  ? 'text-emerald-300'
                  : isWarning
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }`}
            >
              {hasData ? `${rollingAverageAccuracy}%` : '—'}
            </span>

            {/* Inline Mini Sparkline */}
            {miniPoints.length > 0 && (
              <svg
                width={miniSvgWidth}
                height={miniSvgHeight}
                viewBox={`0 0 ${miniSvgWidth} ${miniSvgHeight}`}
                className="hidden sm:block overflow-visible bg-white/10 rounded px-0.5 border border-white/15 shrink-0"
                aria-hidden="true"
              >
                <line
                  x1={0}
                  y1={miniSvgHeight - 2 - 0.7 * (miniSvgHeight - 4)}
                  x2={miniSvgWidth}
                  y2={miniSvgHeight - 2 - 0.7 * (miniSvgHeight - 4)}
                  stroke="#94a3b8"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />
                {miniPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={miniPoints.join(' ')}
                  />
                )}
              </svg>
            )}

            {/* Last 5Q Delta Pill */}
            <span
              className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-black tabular-nums border ${
                last5QuestionsImpact.direction === 'up'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  : last5QuestionsImpact.direction === 'down'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                  : 'bg-sky-500/20 text-sky-200 border-sky-400/40'
              }`}
            >
              {last5QuestionsImpact.formattedDelta}
            </span>

            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}

            {/* Direct Close / Switch-Off Button to Hide Rolling Accuracy HUD for 20 Minutes */}
            <button
              type="button"
              data-testid="snooze-rolling-hud-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                snoozeHudFor20Mins(
                  'rolling-accuracy',
                  'Rolling Accuracy HUD hidden for 20 minutes'
                );
              }}
              title="Close / Switch off Rolling Accuracy HUD for 20 minutes (or double-click HUD)"
              aria-label="Hide Rolling Accuracy HUD for 20 minutes"
              className="ml-0.5 p-0.5 rounded-md text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {isRollingMoved && (
            <button
              type="button"
              onClick={resetRollingPosition}
              title="Reset Rolling Accuracy Bar position to top-left"
              aria-label="Reset Rolling Accuracy Bar position"
              data-testid="reset-rolling-accuracy-pos-btn"
              className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Left-Side Expandable Drawer / Panel attached to Movable Rolling Accuracy Bar */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="rolling-accuracy-left-drawer"
              role="dialog"
              aria-label="Rolling Accuracy Left-Side Telemetry Panel"
              initial={{ opacity: 0, x: -24, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24, y: -6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="mt-2 left-0 w-[min(92vw,360px)] rounded-2xl bg-slate-950/98 text-white border border-sky-400/50 shadow-2xl p-4 space-y-3.5 backdrop-blur-xl origin-top-left"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-400 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
                      20-Question Rolling Accuracy
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Move className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>Drag to move • Double-click or ✕ to hide for 20m</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      snoozeHudFor20Mins('all', 'All HUDs hidden for 20 minutes');
                    }}
                    title="Switch off all HUDs for 20 minutes"
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-[10px] font-bold text-slate-300 hover:text-rose-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hide 20m</span>
                  </button>
                  {isRollingMoved && (
                    <button
                      type="button"
                      onClick={resetRollingPosition}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-sky-300 cursor-pointer"
                    >
                      Dock Top-Left
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close Rolling Accuracy panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>


            {/* Key KPI Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rolling Avg
                </div>
                <div
                  className={`text-lg font-mono font-black tabular-nums mt-0.5 ${
                    !hasData
                      ? 'text-sky-300'
                      : isPassing
                      ? 'text-emerald-400'
                      : isWarning
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {hasData ? `${rollingAverageAccuracy}%` : '—'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {sessionRollingOutcomes.filter(Boolean).length}/{sessionRollingOutcomes.length} Qs
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Last 5 Impact
                </div>
                <div
                  className={`text-lg font-mono font-black tabular-nums mt-0.5 ${
                    last5QuestionsImpact.direction === 'up'
                      ? 'text-emerald-400'
                      : last5QuestionsImpact.direction === 'down'
                      ? 'text-rose-400'
                      : 'text-sky-400'
                  }`}
                >
                  {last5QuestionsImpact.formattedDelta}
                </div>
                <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {last5QuestionsImpact.correctCount}/{last5QuestionsImpact.count} correct
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Difficulty Tier
                </div>
                <div className="text-xs font-black text-amber-300 mt-1 truncate">
                  {effectiveDynamicDifficulty}
                </div>
                <div className="text-[10px] text-slate-400">
                  {lockedDifficulty
                    ? 'Locked'
                    : isDynamicDifficultyEnabled
                    ? 'Auto-Adaptive'
                    : 'Manual'}
                </div>
              </div>
            </div>

            {/* 20-Question SVG Sparkline Chart */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300">
                  Rolling Trajectory ({sessionRollingOutcomes.length}/20 Window)
                </span>
                <span
                  className={`font-mono font-bold tabular-nums px-1.5 py-0.5 rounded text-[10px] ${
                    rolling20Trend.direction === 'up'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : rolling20Trend.direction === 'down'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {rolling20Trend.label}
                </span>
              </div>

              {fullPoints.length > 0 ? (
                <svg
                  width="100%"
                  height={fullSvgHeight}
                  viewBox={`0 0 ${fullSvgWidth} ${fullSvgHeight}`}
                  className="overflow-visible"
                  role="img"
                  aria-label="20-question rolling accuracy chart"
                >
                  {/* 70% AZ-900 Passing Benchmark Line */}
                  <line
                    x1={fullPadX}
                    y1={target70Y}
                    x2={fullSvgWidth - fullPadX}
                    y2={target70Y}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={fullSvgWidth - fullPadX - 2}
                    y={target70Y - 3}
                    textAnchor="end"
                    className="fill-sky-400 text-[8px] font-mono"
                  >
                    70% Pass Target
                  </text>

                  {fullAreaPath && (
                    <path d={fullAreaPath} fill={strokeColor} fillOpacity="0.16" />
                  )}

                  {fullPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={fullPolyline}
                    />
                  )}

                  {fullPoints.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={idx === fullPoints.length - 1 ? 3.5 : 2.2}
                      fill={pt.outcome ? '#10b981' : '#f43f5e'}
                      stroke="#0f172a"
                      strokeWidth="1"
                    >
                      <title>{`Q${idx + 1}: ${pt.outcome ? 'Correct' : 'Incorrect'} (Rolling: ${pt.acc}%)`}</title>
                    </circle>
                  ))}
                </svg>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  Answer practice questions to populate your live 20-question rolling accuracy curve.
                </div>
              )}

              {/* Outcome Dots Row */}
              {sessionRollingOutcomes.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {sessionRollingOutcomes.map((isCorrect, idx) => (
                    <span
                      key={idx}
                      title={`Question ${idx + 1} in window: ${isCorrect ? 'Correct' : 'Missed'}`}
                      className={`w-3.5 h-3.5 rounded-sm inline-flex items-center justify-center text-[8px] font-mono font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {isCorrect ? '✓' : '×'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Low Rolling Accuracy Alert inside Left-Side Panel */}
            {showFundamentalsResetAlert && consecutiveLowAccuracyModulesAlert && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-950 to-amber-950 border border-amber-400/80 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-slate-200">
                    <div className="font-black text-amber-300">
                      Rolling Accuracy Below 60% (2 Modules)
                    </div>
                    Dipped in{' '}
                    <strong className="text-rose-300">
                      M{consecutiveLowAccuracyModulesAlert.prevMod.moduleId} (
                      {consecutiveLowAccuracyModulesAlert.prevMod.rollingAccuracy}%)
                    </strong>{' '}
                    &amp;{' '}
                    <strong className="text-rose-300">
                      M{consecutiveLowAccuracyModulesAlert.currMod.moduleId} (
                      {consecutiveLowAccuracyModulesAlert.currMod.rollingAccuracy}%)
                    </strong>
                    .
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {onDismissFundamentalsResetAlert && (
                    <button
                      type="button"
                      onClick={() =>
                        onDismissFundamentalsResetAlert(consecutiveLowAccuracyModulesAlert.pairKey)
                      }
                      className="text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                  {onStartFundamentalsResetDrill && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartFundamentalsResetDrill(
                          [
                            consecutiveLowAccuracyModulesAlert.currMod.moduleId,
                            consecutiveLowAccuracyModulesAlert.prevMod.moduleId,
                          ],
                          consecutiveLowAccuracyModulesAlert.pairKey
                        );
                        setIsOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Start Fundamentals Reset Drill</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Footer Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px]">
              {onToggleDynamicDifficulty && !lockedDifficulty && (
                <button
                  type="button"
                  onClick={onToggleDynamicDifficulty}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 font-bold cursor-pointer transition-colors"
                >
                  Adaptive Mode: {isDynamicDifficultyEnabled ? 'ON' : 'OFF'}
                </button>
              )}
              {onNavigateToPractice && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToPractice();
                    setIsOpen(false);
                  }}
                  className="ml-auto px-3 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Target className="w-3 h-3" />
                  <span>Practice Studio</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      )}

      {/* =====================================================================
          WIDGET 2: SEPARATE MOVABLE CONFIDENCE CALIBRATION STREAK (Hidden for 20m when closed or double-clicked)
         ===================================================================== */}
      {!isConfidenceSnoozed && (
      <div
        data-testid="movable-confidence-streak-widget"
        style={{
          transform: `translate3d(${confidenceOffset.x}px, ${confidenceOffset.y}px, 0)`,
        }}
        className={`relative pointer-events-auto flex flex-col items-start transition-shadow ${
          isDraggingConfidence ? 'z-50 drop-shadow-2xl' : 'z-40'
        }`}
      >
        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-xl">
          {/* Drag Handle for Confidence Calibration Streak */}
          <div
            role="button"
            tabIndex={0}
            data-testid="drag-handle-confidence-streak"
            onPointerDown={handleConfidencePointerDown}
            onPointerMove={handleConfidencePointerMove}
            onPointerUp={handleConfidencePointerUp}
            onPointerCancel={handleConfidencePointerUp}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 24 : 10;
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                setConfidenceOffset((prev) => clampOffset(prev.x + step, prev.y));
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setConfidenceOffset((prev) => clampOffset(prev.x - step, prev.y));
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setConfidenceOffset((prev) => clampOffset(prev.x, prev.y + step));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setConfidenceOffset((prev) => clampOffset(prev.x, prev.y - step));
              }
            }}
            title="Drag to move Confidence Calibration Streak (or use arrow keys)"
            aria-label="Drag to reposition Confidence Calibration Streak"
            className="flex items-center justify-center px-1 py-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Separate Confidence Streak Button */}
          <button
            type="button"
            data-testid="confidence-streak-pill"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsConfidenceOpen(false);
              snoozeHudFor20Mins(
                'confidence-streak',
                'Confidence Streak HUD hidden for 20 minutes (double-clicked)'
              );
            }}
            onClick={() => {
              if (confidenceDragRef.current?.moved) return;
              setIsConfidenceOpen((prev) => !prev);
            }}
            aria-expanded={isConfidenceOpen}
            title={`Confidence Calibration Streak: ${confidenceStreak} consecutive questions rated with High Confidence (${bestConfidenceStreak} best). Drag handle to move, or double-click / click ✕ to hide for 20 mins.`}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
              confidenceStreak >= 3
                ? 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-emerald-950/95 border-amber-400/80 text-amber-200 ring-1 ring-amber-400/30'
                : confidenceStreak >= 1
                ? 'bg-slate-900/95 border-amber-500/60 text-amber-200 hover:border-amber-400'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-amber-500/50'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                confidenceStreak >= 3
                  ? 'bg-amber-400/25 text-amber-300 border border-amber-400/50'
                  : confidenceStreak >= 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${confidenceStreak >= 3 ? 'animate-pulse' : ''}`} />
            </span>

            <div className="flex flex-col items-start leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Confidence
                </span>
                {confidenceStreak >= 3 && (
                  <span className="px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[8px] font-black uppercase tracking-wider">
                    Calibrated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  data-testid="confidence-streak-count"
                  className={`text-xs font-mono font-black tabular-nums ${
                    confidenceStreak >= 3
                      ? 'text-amber-300'
                      : confidenceStreak >= 1
                      ? 'text-amber-200'
                      : 'text-slate-300'
                  }`}
                >
                  {confidenceStreak}x
                </span>
                <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                  High-Conf
                </span>
              </div>
            </div>
          </button>

          {/* Direct Close / Switch-Off Button to Hide Confidence Streak HUD for 20 Minutes */}
          <button
            type="button"
            data-testid="snooze-confidence-hud-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfidenceOpen(false);
              snoozeHudFor20Mins(
                'confidence-streak',
                'Confidence Streak HUD hidden for 20 minutes'
              );
            }}
            title="Close / Switch off Confidence Streak HUD for 20 minutes (or double-click HUD)"
            aria-label="Hide Confidence Streak HUD for 20 minutes"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>

          {isConfidenceMoved && (
            <button
              type="button"
              data-testid="reset-confidence-streak-pos"
              onClick={() => setConfidenceOffset({ x: 0, y: 0 })}
              title="Reset Confidence Streak position"
              aria-label="Reset Confidence Streak position"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Confidence Calibration Breakdown Popover */}
        <AnimatePresence>
          {isConfidenceOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="mt-2 w-[290px] sm:w-[320px] rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl p-3.5 text-slate-100 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Confidence Calibration Streak
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Movable widget · Double-click or ✕ to hide for 20m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfidenceOpen(false);
                      snoozeHudFor20Mins(
                        'confidence-streak',
                        'Confidence Streak HUD hidden for 20 minutes'
                      );
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-[10px] font-bold text-slate-300 hover:text-rose-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hide 20m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfidenceOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    aria-label="Close confidence calibration details"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Streak
                  </div>
                  <div className="text-lg font-mono font-black text-amber-300 tabular-nums mt-0.5">
                    {confidenceStreak} Qs
                  </div>
                  <div className="text-[10px] text-slate-400">Rated High Confidence</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Session Best
                  </div>
                  <div className="text-lg font-mono font-black text-emerald-400 tabular-nums mt-0.5">
                    {bestConfidenceStreak} Qs
                  </div>
                  <div className="text-[10px] text-slate-400">Peak Calibration</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Rate your certainty before or after answering each question. Grab the{' '}
                <strong className="text-amber-300">drag handle</strong> anytime to move this pill, or{' '}
                <strong className="text-amber-300">double-click / click ✕</strong> to switch it off for 20 minutes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
      </div>

      {/* Brief Non-Intrusive Snooze Confirmation Toast with Undo & Hide All */}
      {snoozeToast && (
        <div
          data-testid="hud-snooze-toast"
          role="status"
          className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700 text-slate-200 text-[11px] font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{snoozeToast}</span>
          {(!isRollingSnoozed || !isConfidenceSnoozed || !isHudSnoozed('quick-retry')) && (
            <button
              type="button"
              onClick={() => snoozeHudFor20Mins('all', 'All HUDs hidden for 20 minutes')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-black cursor-pointer"
            >
              Hide All HUDs (20m)
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              restoreSnoozedHud('all');
              dismissSnoozeToast();
            }}
            className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-black cursor-pointer"
          >
            Restore
          </button>
        </div>
      )}

      {/* Subtle Corner Restore Chip when Left HUDs are Snoozed */}
      {!snoozeToast && (isRollingSnoozed || isConfidenceSnoozed) && (
        <button
          type="button"
          data-testid="restore-snoozed-left-huds-btn"
          onClick={() => restoreSnoozedHud('all')}
          title="HUDs are switched off for 20 minutes. Click to restore HUDs early."
          className="pointer-events-auto px-2 py-0.5 rounded-full bg-slate-900/60 hover:bg-slate-900/95 border border-slate-700/60 text-slate-400 hover:text-amber-300 text-[10px] font-bold inline-flex items-center gap-1 transition-all opacity-60 hover:opacity-100 cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>
            HUDs Off (
            {Math.max(
              getRemainingMinutes('rolling-accuracy'),
              getRemainingMinutes('confidence-streak')
            )}
            m)
          </span>
        </button>
      )}
    </div>
  );
};
