import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Sparkles,
  Settings,
  Bell,
  X,
  Flame,
  Volume2,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface FocusSessionWidgetProps {
  onOpenStudyBreak?: () => void;
  className?: string;
}

const POMODORO_OPTIONS = [15, 20, 25, 30, 45]; // in minutes
const DEFAULT_POMODORO_MINS = 25;

export const FocusSessionWidget: React.FC<FocusSessionWidgetProps> = ({
  onOpenStudyBreak,
  className = '',
}) => {
  const getTodayKey = () => `az900_daily_study_seconds_${new Date().toISOString().split('T')[0]}`;

  // Total daily study time (synced across all tabs)
  const [totalDailySeconds, setTotalDailySeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(getTodayKey());
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Configured Pomodoro length (minutes)
  const [pomodoroMins, setPomodoroMins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('az900_pomodoro_target_mins');
      return saved ? parseInt(saved, 10) || DEFAULT_POMODORO_MINS : DEFAULT_POMODORO_MINS;
    } catch {
      return DEFAULT_POMODORO_MINS;
    }
  });

  // Current session timer in seconds
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);
  const [showBreakAlert, setShowBreakAlert] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    if (!showSettingsPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSettingsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsPopover]);

  // Sync total daily seconds across tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getTodayKey() && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val)) setTotalDailySeconds(val);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Main tick interval: runs while document is active and isRunning is true
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1. Increment session timer
      setSessionSeconds((prev) => {
        const next = prev + 1;
        const targetSeconds = pomodoroMins * 60;
        // Trigger 25-minute (or configured) Pomodoro break notification
        if (next === targetSeconds) {
          setShowBreakAlert(true);
          playSoftPing();
        }
        return next;
      });

      // 2. Increment total daily study seconds
      setTotalDailySeconds((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(getTodayKey(), String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, pomodoroMins]);

  const playSoftPing = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {
      // audioContext not allowed or unsupported
    }
  };

  const handleSelectPomodoroMins = (mins: number) => {
    setPomodoroMins(mins);
    try {
      localStorage.setItem('az900_pomodoro_target_mins', String(mins));
    } catch {
      // ignore
    }
  };

  const handleResetSession = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessionSeconds(0);
    setIsRunning(true);
    setShowBreakAlert(false);
  };

  const formatMinSec = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDailyTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const targetSeconds = pomodoroMins * 60;
  const progressPct = Math.min(100, Math.round((sessionSeconds / targetSeconds) * 100));

  return (
    <div className={`relative ${className}`}>
      {/* Header Pill Button */}
      <button
        type="button"
        onClick={() => setShowSettingsPopover((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50/80 hover:from-sky-100 hover:to-blue-100 text-slate-800 border border-sky-200/90 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0"
        title="Focus Session & Daily Study Timer (Click to customize Pomodoro & view daily stats)"
      >
        <Clock className="w-3.5 h-3.5 text-[#0078D4] group-hover:rotate-45 transition-transform" />
        <span className="font-mono font-black text-[#0078D4]">
          {formatMinSec(sessionSeconds)}
        </span>
        <span className="text-[10px] text-slate-500 font-semibold hidden md:inline">
          / {pomodoroMins}m
        </span>
        <span className="hidden xl:inline px-1.5 py-0.2 rounded-md bg-white border border-sky-200 text-[10px] font-bold text-slate-600">
          Today: {formatDailyTime(totalDailySeconds)}
        </span>
      </button>

      {/* Settings / Controls Popover */}
      {showSettingsPopover && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-left space-y-3.5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#0078D4]">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Focus Session Timer
                </h4>
                <p className="text-[10px] text-slate-500">Tracks total daily study across all tabs</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsPopover(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Daily Total Display */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Today's Study Time
              </span>
              <span className="font-mono text-base font-black text-slate-900">
                {formatDailyTime(totalDailySeconds)}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active Sync
            </span>
          </div>

          {/* Current Pomodoro Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Pomodoro Session</span>
              <span className="font-mono text-[#0078D4]">
                {formatMinSec(sessionSeconds)} / {pomodoroMins}:00
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0078D4] to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsRunning((prev) => !prev)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-[#0078D4] hover:bg-[#005A9E] text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset current Pomodoro block"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Configurable Pomodoro Duration */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Break Interval Target:
            </span>
            <div className="grid grid-cols-5 gap-1">
              {POMODORO_OPTIONS.map((mins) => {
                const isSelected = pomodoroMins === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectPomodoroMins(mins)}
                    className={`py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0078D4] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 25-Minute (or configured) Pomodoro Break Notification Alert Modal */}
      {showBreakAlert &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[min(28rem,calc(100vw-1.25rem))] max-h-[calc(100dvh-1.5rem)] my-auto rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-200 text-left">
              <KitengeRibbon height={4} />

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      🍅 Pomodoro Milestone
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      {pomodoroMins} Minutes of Active Study!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Great discipline! Continuous focus strengthens cognitive retention, but a quick 5-minute break helps refresh your working memory for higher exam accuracy.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 font-medium">
                  💡 <strong className="font-bold">Hekima Tip:</strong> Stand up, look at something 20 feet away, or grab a glass of water.
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
                  {onOpenStudyBreak && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowBreakAlert(false);
                        onOpenStudyBreak();
                      }}
                      className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Take 5-Min Breather</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleResetSession();
                    }}
                    className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start Next {pomodoroMins}m Block</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBreakAlert(false)}
                    className="w-full sm:w-auto py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
