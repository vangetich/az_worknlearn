import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

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
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close left-side panel on Escape or outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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
  }, [isOpen]);

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

  return (
    <div
      ref={containerRef}
      className="fixed top-1.5 left-2 sm:left-3 z-[140] pointer-events-auto select-none"
       data-testid="top-left-rolling-accuracy-widget"
    >
      {/* Top-Most Left-Side Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="rolling-accuracy-left-drawer"
        title="Rolling Accuracy (20-Question Window) — Always top-most, opens on the left side"
        className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer text-xs ${
          showFundamentalsResetAlert || isLowAccuracy
            ? 'bg-rose-950/95 text-white border-rose-400 ring-2 ring-rose-400/50 hover:bg-rose-900'
            : isPassing
            ? 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-emerald-400/80 hover:border-emerald-300'
            : isWarning
            ? 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-amber-400/80 hover:border-amber-300'
            : 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-sky-400/80 hover:border-sky-300'
        }`}
      >
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
      </button>

      {/* Left-Side Expandable Drawer / Panel */}
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
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pinned top-left across all studio views • Target: 70%+
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Rolling Accuracy panel"
              >
                <X className="w-4 h-4" />
              </button>
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
  );
};
