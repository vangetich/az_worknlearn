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
  AlertTriangle,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import {
  evaluateStudyOverwork,
  getTodayBreaksCount,
  getTodayBreaksKey,
  incrementTodayBreaksCount,
  setTodayBreaksCount,
  STUDY_BREAKS_UPDATED_EVENT,
} from '../utils/studyBreakTracker';

interface FocusSessionWidgetProps {
  onOpenStudyBreak?: () => void;
  className?: string;
}

const POMODORO_OPTIONS = [10, 15, 20, 25, 30, 45]; // in minutes
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

  const [ambientSound, setAmbientSound] = useState<string>(() => {
    try {
      return localStorage.getItem('az900_focus_ambient_sound') || 'Savannah Rain';
    } catch {
      return 'Savannah Rain';
    }
  });

  // Current session timer in seconds
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);
  const [showBreakAlert, setShowBreakAlert] = useState<boolean>(false);
  const [breaksTakenToday, setBreaksTakenToday] = useState<number>(() => getTodayBreaksCount());
  const [breakConfirmedToast, setBreakConfirmedToast] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number }>({
    top: 64,
    left: 16,
    width: 288,
  });

  useEffect(() => {
    if (!showSettingsPopover) return;
    const updatePosition = () => {
      if (!triggerButtonRef.current) return;
      const rect = triggerButtonRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const panelWidth = Math.min(288, vw - 24);
      const preferredLeft = rect.right - panelWidth;
      const clampedLeft = Math.max(12, Math.min(preferredLeft, vw - panelWidth - 12));
      const top = Math.min(rect.bottom + 8, window.innerHeight - 220);
      setPopoverCoords({ top, left: clampedLeft, width: panelWidth });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showSettingsPopover]);

  // Close popover on click outside (excluding trigger button so toggle click works cleanly)
  useEffect(() => {
    if (!showSettingsPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!triggerButtonRef.current || !triggerButtonRef.current.contains(target))
      ) {
        setShowSettingsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsPopover]);

  // Sync total daily seconds and confirmed breaks across tabs & components
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getTodayKey() && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val)) setTotalDailySeconds(val);
      }
      if (e.key === getTodayBreaksKey() && e.newValue !== null) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val)) setBreaksTakenToday(Math.max(0, val));
      }
    };
    const handleBreaksUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number }>).detail;
      if (typeof detail?.count === 'number') {
        setBreaksTakenToday(Math.max(0, detail.count));
      } else {
        setBreaksTakenToday(getTodayBreaksCount());
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(STUDY_BREAKS_UPDATED_EVENT, handleBreaksUpdated);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(STUDY_BREAKS_UPDATED_EVENT, handleBreaksUpdated);
    };
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

  const handleConfirmBreakTaken = (resetBlockTimer: boolean = true) => {
    const next = incrementTodayBreaksCount(1);
    setBreaksTakenToday(next);
    setBreakConfirmedToast(true);
    setTimeout(() => setBreakConfirmedToast(false), 2400);
    if (resetBlockTimer) {
      setSessionSeconds(0);
      setShowBreakAlert(false);
    }
  };

  const handleAdjustBreaks = (delta: number) => {
    const next = setTodayBreaksCount(Math.max(0, breaksTakenToday + delta));
    setBreaksTakenToday(next);
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
  const overworkAssessment = evaluateStudyOverwork({
    sessionSeconds,
    totalDailySeconds,
    pomodoroMins,
    breaksTakenToday,
  });

  return (
    <div className={`relative ${className}`}>
      {/* Header Pill Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setShowSettingsPopover((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0 whitespace-nowrap border ${
          overworkAssessment.status === 'overworking'
            ? 'bg-gradient-to-r from-rose-50 to-amber-50 hover:from-rose-100 hover:to-amber-100 text-rose-900 border-rose-300 ring-1 ring-rose-300/60'
            : overworkAssessment.status === 'break-due'
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border-amber-300'
            : 'bg-gradient-to-r from-sky-50 to-blue-50/80 hover:from-sky-100 hover:to-blue-100 text-slate-800 border-sky-200/90'
        }`}
        title={`Focus Session (${pomodoroMins}m target) · ${breaksTakenToday} break(s) confirmed today · ${overworkAssessment.headline} — Click to change 10/15/20m+ session length or confirm breaks`}
      >
        <Clock
          className={`w-3.5 h-3.5 group-hover:rotate-45 transition-transform shrink-0 ${
            overworkAssessment.status === 'overworking'
              ? 'text-rose-600'
              : overworkAssessment.status === 'break-due'
              ? 'text-amber-600'
              : 'text-[#0078D4]'
          }`}
        />
        <span
          className={`font-mono font-black whitespace-nowrap ${
            overworkAssessment.status === 'overworking'
              ? 'text-rose-700'
              : overworkAssessment.status === 'break-due'
              ? 'text-amber-800'
              : 'text-[#0078D4]'
          }`}
        >
          {formatMinSec(sessionSeconds)}
        </span>
        <span className="text-[10px] text-slate-500 font-semibold hidden md:inline whitespace-nowrap">
          / {pomodoroMins}m
        </span>
        <span
          className={`hidden xl:inline px-1.5 py-0.2 rounded-md bg-white border text-[10px] font-bold whitespace-nowrap ${
            overworkAssessment.status === 'overworking'
              ? 'border-rose-300 text-rose-700'
              : 'border-sky-200 text-slate-600'
          }`}
        >
          {breaksTakenToday}B · {formatDailyTime(totalDailySeconds)}
        </span>
        {overworkAssessment.status !== 'balanced' && (
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              overworkAssessment.status === 'overworking'
                ? 'bg-rose-600 animate-ping'
                : 'bg-amber-500 animate-pulse'
            }`}
            aria-label={overworkAssessment.headline}
          />
        )}
      </button>

      {/* Settings / Controls Popover rendered via Portal so horizontal scroll never clips it */}
      {showSettingsPopover &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: `${Math.max(popoverCoords.width, Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 24 : 320))}px`,
            }}
            className="fixed max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-[95] animate-in fade-in zoom-in-95 duration-150 text-left space-y-3.5"
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

          {/* Configurable Study Session Duration (10, 15, 20, 25, 30, 45 mins) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Study Session Length:
              </span>
              <span className="text-[10px] font-extrabold text-[#0078D4] font-mono">
                {pomodoroMins} mins
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {POMODORO_OPTIONS.map((mins) => {
                const isSelected = pomodoroMins === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectPomodoroMins(mins)}
                    className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0078D4] text-white shadow-2xs ring-1 ring-sky-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Break Confirmation & Overwork Check */}
          <div
            className={`p-3 rounded-xl border space-y-2.5 ${
              overworkAssessment.status === 'overworking'
                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                : overworkAssessment.status === 'break-due'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-emerald-50/75 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                {overworkAssessment.status === 'overworking' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : overworkAssessment.status === 'break-due' ? (
                  <Coffee className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-black leading-tight">
                    {overworkAssessment.headline}
                  </div>
                  <p className="text-[10.5px] opacity-85 leading-snug mt-0.5">
                    {overworkAssessment.detail}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white/80 rounded-lg px-2.5 py-2 border border-black/5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Breaks Confirmed Today
                </div>
                <div className="text-xs font-black text-slate-900 tabular-nums">
                  {breaksTakenToday} break{breaksTakenToday === 1 ? '' : 's'}{' '}
                  <span className="font-semibold text-[10.5px] text-slate-500">
                    (Rec: {overworkAssessment.recommendedBreaks}+)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdjustBreaks(-1)}
                  disabled={breaksTakenToday <= 0}
                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  title="Decrease confirmed break count"
                  aria-label="Decrease confirmed break count"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmBreakTaken(true)}
                  className="px-2 py-1 rounded-md bg-[#0078D4] hover:bg-[#005A9E] text-white text-[10.5px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                  title="Confirm you took a break and reset the current study block timer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{breakConfirmedToast ? 'Logged!' : 'Confirm Break'}</span>
                </button>
              </div>
            </div>

            {onOpenStudyBreak && (
              <button
                type="button"
                onClick={() => {
                  setShowSettingsPopover(false);
                  onOpenStudyBreak();
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-white hover:bg-sky-50 text-[#005A9E] border border-sky-200 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Open Kahawa Break &amp; Breathing Reset</span>
              </button>
            )}
          </div>

          {/* Ambient Sound Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Ambient Pacing Sound:</span>
              <span className="text-emerald-700 font-extrabold">{ambientSound}</span>
            </span>
            <div className="grid grid-cols-2 gap-1">
              {['Savannah Rain', 'Rift Breeze', 'Forest Ticking', 'Ocean Waves', 'Muted'].map((sound) => {
                const isSelected = ambientSound === sound;
                return (
                  <button
                    key={sound}
                    type="button"
                    onClick={() => {
                      setAmbientSound(sound);
                      try {
                        localStorage.setItem('az900_focus_ambient_sound', sound);
                      } catch {
                        // ignore
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Volume2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{sound}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
          document.body
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
                        handleConfirmBreakTaken(true);
                        onOpenStudyBreak();
                      }}
                      className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Confirm &amp; Take Breather</span>
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
