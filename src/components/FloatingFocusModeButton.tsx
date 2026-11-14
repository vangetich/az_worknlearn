import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Keyboard,
  Sliders,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react';
import { useKeyboardShortcutsConfig } from './KeyboardShortcutGuide';
import { formatShortcutCombo } from '../utils/keyboardShortcuts';

interface FloatingFocusModeButtonProps {
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isDynamicDifficultyEnabled: boolean;
  effectiveDynamicDifficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  onToggleDynamicDifficulty: () => void;
  onOpenAccessibilitySettings?: () => void;
  retryQueueCount?: number;
  onTriggerQuickRetry?: () => void;
}

const POMODORO_OPTIONS = [15, 20, 25, 30, 45];
const DEFAULT_POMODORO_MINS = 25;

function getTodayStudyKey(): string {
  return `az900_daily_study_seconds_${new Date().toISOString().split('T')[0]}`;
}

function formatStudyMinutes(totalSeconds: number): string {
  const totalMins = Math.floor(totalSeconds / 60);
  if (totalMins < 60) return `${totalMins}m`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export const FloatingFocusModeButton: React.FC<FloatingFocusModeButtonProps> = ({
  isFocusMode,
  onToggleFocusMode,
  isDynamicDifficultyEnabled,
  effectiveDynamicDifficulty,
  onToggleDynamicDifficulty,
  onOpenAccessibilitySettings,
  retryQueueCount = 0,
  onTriggerQuickRetry,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { config: shortcuts, platform } = useKeyboardShortcutsConfig();

  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('az900_pomodoro_mins'));
      return POMODORO_OPTIONS.includes(saved) ? saved : DEFAULT_POMODORO_MINS;
    } catch {
      return DEFAULT_POMODORO_MINS;
    }
  });

  const [totalDailySeconds, setTotalDailySeconds] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(getTodayStudyKey()) || 0);
    } catch {
      return 0;
    }
  });

  const [completedBlocksToday, setCompletedBlocksToday] = useState<number>(() => {
    try {
      const key = `az900_pomodoro_blocks_${new Date().toISOString().split('T')[0]}`;
      return Number(localStorage.getItem(key) || 0);
    } catch {
      return 0;
    }
  });

  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [blockCompleteBanner, setBlockCompleteBanner] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const targetSeconds = pomodoroMinutes * 60;
  const remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);

  useEffect(() => {
    if (!isPomodoroRunning) return;

    const interval = setInterval(() => {
      setTotalDailySeconds((prev) => {
        const nextTotal = prev + 1;
        try {
          localStorage.setItem(getTodayStudyKey(), String(nextTotal));
        } catch {
          // ignore
        }
        return nextTotal;
      });

      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (next >= targetSeconds) {
          setIsPomodoroRunning(false);
          setCompletedBlocksToday((b) => {
            const nextBlocks = b + 1;
            try {
              const key = `az900_pomodoro_blocks_${new Date().toISOString().split('T')[0]}`;
              localStorage.setItem(key, String(nextBlocks));
            } catch {
              // ignore
            }
            return nextBlocks;
          });
          setBlockCompleteBanner(true);
          setTimeout(() => setBlockCompleteBanner(false), 5000);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPomodoroRunning, targetSeconds]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleResetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPomodoroRunning(false);
    setSecondsElapsed(0);
  };

  const handleChangeTargetMinutes = (mins: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPomodoroMinutes(mins);
    try {
      localStorage.setItem('az900_pomodoro_mins', String(mins));
    } catch {
      // ignore
    }
    setSecondsElapsed(0);
    setIsPomodoroRunning(false);
  };

  // Opens ONLY when hovering directly on the circular Focus button
  const handleButtonMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  // Keeps hub open only if already opened by hovering on the circular button
  const handlePopupMouseEnter = () => {
    if (!isHovered) return;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 110);
  };

  const minsLeft = Math.floor(remainingSeconds / 60);
  const secsLeft = remainingSeconds % 60;
  const formattedCountdown = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(
    2,
    '0'
  )}`;
  const progressPercent = Math.min(100, Math.round((secondsElapsed / targetSeconds) * 100));
  const focusShortcutDisplay = formatShortcutCombo(shortcuts.focusMode, platform);

  const difficultyBadgeStyle =
    effectiveDynamicDifficulty === 'Advanced'
      ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
      : effectiveDynamicDifficulty === 'Intermediate'
      ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';

  return (
    <div className="fixed bottom-20 portrait:max-md:bottom-[72px] right-4 sm:bottom-24 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none">
      {/* Hover Pop-up Small Rectangle with Full Focus Features — Only mounted when button itself is hovered */}
      {isHovered && (
        <div
          role="region"
          aria-label="Focus Mode Features & Controls"
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`w-80 sm:w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900/98 backdrop-blur-md text-white border border-slate-700/90 shadow-2xl p-3.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 ${
            isFocusMode
              ? 'fixed top-16 right-4 sm:top-20 sm:right-6 origin-top-right'
              : 'absolute bottom-full right-0 mb-2.5 origin-bottom-right'
          }`}
        >
          {/* Top Header Strip */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isFocusMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-[#0078D4]/25 text-amber-300 border border-sky-400/40'
                }`}
              >
                {isFocusMode ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wide uppercase text-white">
                    Focus Command Hub
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      isFocusMode
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {isFocusMode ? 'ACTIVE' : 'READY'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Press the circular Focus button to {isFocusMode ? 'exit' : 'activate'}
                </p>
              </div>
            </div>

            <kbd className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[10px] font-mono font-extrabold text-amber-300 shrink-0">
              {focusShortcutDisplay}
            </kbd>
          </div>

          {/* 1. Pomodoro Focus Timer Section */}
          <div className="py-2.5 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-extrabold text-slate-200">
                  Pomodoro Study Timer
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Today: {formatStudyMinutes(totalDailySeconds)} ({completedBlocksToday} blocks)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-black font-mono tracking-tight text-white leading-none">
                    {formattedCountdown}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isPomodoroRunning
                      ? 'Focus block in progress'
                      : `${pomodoroMinutes}m target block`}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPomodoroRunning((r) => !r);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                      isPomodoroRunning
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isPomodoroRunning ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0078D4] via-sky-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Duration Presets */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase">Block:</span>
                <div className="flex items-center gap-1">
                  {POMODORO_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={(e) => handleChangeTargetMinutes(mins, e)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-colors cursor-pointer ${
                        pomodoroMinutes === mins
                          ? 'bg-[#0078D4] text-white'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {blockCompleteBanner && (
              <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Focus block complete! Great consistency.</span>
              </div>
            )}
          </div>

          {/* 2. Adaptive Difficulty & Quick-Retry Features */}
          <div className="py-2.5 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-extrabold text-slate-200 truncate">
                  Adaptive Difficulty
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-black border ${difficultyBadgeStyle}`}
                >
                  {effectiveDynamicDifficulty}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDynamicDifficulty();
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-colors cursor-pointer ${
                  isDynamicDifficultyEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {isDynamicDifficultyEnabled ? 'Auto ON (A)' : 'Paused (A)'}
              </button>
            </div>

            {retryQueueCount > 0 && onTriggerQuickRetry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerQuickRetry();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-extrabold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Quick-Retry Queue ({retryQueueCount} unresolved)</span>
                </span>
                <kbd className="px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 text-[10px] font-mono">
                  R
                </kbd>
              </button>
            )}
          </div>

          {/* 3. Essential Focus Shortcuts & Customize Keys */}
          <div className="pt-2.5 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-slate-300">
                <Keyboard className="w-3 h-3 text-sky-400" />
                <span>Speed Shortcuts</span>
              </span>
              {onOpenAccessibilitySettings && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                    onOpenAccessibilitySettings();
                  }}
                  className="text-sky-400 hover:text-sky-300 font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Customize Keys</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
                <span className="text-slate-300">Select Option</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-900 text-amber-300 font-mono font-bold">
                  1–4
                </kbd>
              </div>
              <div className="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
                <span className="text-slate-300">Submit / Next</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-900 text-amber-300 font-mono font-bold">
                  Space
                </kbd>
              </div>
              <div className="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
                <span className="text-slate-300">Quick-Retry</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-900 text-amber-300 font-mono font-bold">
                  R
                </kbd>
              </div>
              <div className="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
                <span className="text-slate-300">Toggle Focus</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-900 text-amber-300 font-mono font-bold">
                  {focusShortcutDisplay}
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round Circular Focus Button in Semi-Bottom-Right — Strictly triggers hover on the button itself */}
      <button
        type="button"
        onClick={onToggleFocusMode}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-pressed={isFocusMode}
        aria-label={
          isFocusMode
            ? 'Focus Mode Active. Press circular button to exit Focus Mode.'
            : 'Press circular button to activate Focus Mode. Hover directly on button for Focus features.'
        }
        title={
          isFocusMode
            ? `Press to Exit Focus Mode (${focusShortcutDisplay} / Esc)`
            : `Press to Activate Focus Mode (${focusShortcutDisplay}) • Hover for Focus features`
        }
        className={`pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-2xl border-2 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
          isFocusMode
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 text-white border-emerald-300 ring-4 ring-emerald-500/30'
            : 'bg-gradient-to-br from-slate-900 via-[#003E73] to-[#0078D4] text-white border-amber-300/80 hover:border-amber-300 ring-4 ring-[#0078D4]/25'
        }`}
      >
        {/* Subtle live indicator dot */}
        <span
          className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
            isFocusMode || isPomodoroRunning
              ? 'bg-emerald-400 animate-pulse'
              : 'bg-amber-400'
          }`}
        />

        {isFocusMode ? (
          <Minimize2 className="w-5 h-5 text-emerald-200 shrink-0" />
        ) : (
          <Maximize2 className="w-5 h-5 text-amber-300 shrink-0" />
        )}

        <span className="text-[10px] font-black uppercase tracking-wider leading-none">
          {isFocusMode ? 'Focused' : 'Focus'}
        </span>

        {isPomodoroRunning && (
          <span className="text-[8.5px] font-mono font-bold text-amber-200 leading-none">
            {formattedCountdown}
          </span>
        )}
      </button>
    </div>
  );
};
