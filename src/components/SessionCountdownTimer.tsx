import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Bell,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sparkles,
  X,
} from 'lucide-react';

interface SessionCountdownTimerProps {
  sessionAnsweredCount?: number;
  isAudioMuted?: boolean;
  onFinishSession?: () => void;
}

const STORAGE_ENABLED_KEY = 'az900_session_countdown_enabled_v1';
const STORAGE_LIMIT_KEY = 'az900_session_countdown_limit_mins_v1';
const SESSION_ELAPSED_KEY = 'az900_session_elapsed_secs_v1';
const SESSION_REMAINING_KEY = 'az900_session_remaining_secs_v1';

// Play a gentle harmonic chime using Web Audio API when countdown reaches 0:00
function playGentleTimeUpChime(isMuted: boolean) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Warm 3-note Kalimba-inspired gentle chord (C5 -> E5 -> G5)
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = now + idx * 0.14;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0005, startTime + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });

    setTimeout(() => ctx.close().catch(() => {}), 1400);
  } catch {
    // Ignore audio context errors
  }
}

const PRESET_MINUTES = [5, 10, 15, 25, 45];

export const SessionCountdownTimer: React.FC<SessionCountdownTimerProps> = ({
  sessionAnsweredCount = 0,
  isAudioMuted = false,
  onFinishSession,
}) => {
  // Optional toggle (persisted across sessions)
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ENABLED_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Target limit in minutes
  const [limitMinutes, setLimitMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LIMIT_KEY);
      const parsed = saved ? parseInt(saved, 10) : 15;
      return !Number.isNaN(parsed) && parsed > 0 ? parsed : 15;
    } catch {
      return 15;
    }
  });

  // Persistent session time spent (seconds)
  const [sessionElapsedSecs, setSessionElapsedSecs] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_ELAPSED_KEY);
      const parsed = saved ? parseInt(saved, 10) : 0;
      return !Number.isNaN(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  });

  // Persistent countdown remaining (seconds)
  const [remainingSecs, setRemainingSecs] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_REMAINING_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {
      // ignore
    }
    return limitMinutes * 60;
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showLimitPicker, setShowLimitPicker] = useState<boolean>(false);
  const [gentleAlertVisible, setGentleAlertVisible] = useState<boolean>(false);
  const [chimeMuted, setChimeMuted] = useState<boolean>(false);
  const alertFiredRef = useRef<boolean>(false);

  const effectiveMuted = isAudioMuted || chimeMuted;

  // Tick every second when enabled and running
  useEffect(() => {
    if (!isEnabled || !isRunning) return;

    const timer = setInterval(() => {
      // Track total time spent per session
      setSessionElapsedSecs((prev) => {
        const next = prev + 1;
        try {
          sessionStorage.setItem(SESSION_ELAPSED_KEY, String(next));
        } catch {
          // ignore
        }
        return next;
      });

      // Tick down countdown timer
      setRemainingSecs((prev) => {
        if (prev <= 0) return 0;
        const next = prev - 1;
        try {
          sessionStorage.setItem(SESSION_REMAINING_KEY, String(next));
        } catch {
          // ignore
        }
        if (next === 0 && !alertFiredRef.current) {
          alertFiredRef.current = true;
          setGentleAlertVisible(true);
          playGentleTimeUpChime(effectiveMuted);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, isRunning, effectiveMuted]);

  const handleToggleEnabled = () => {
    setIsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_ENABLED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSelectLimitMinutes = (mins: number) => {
    const clamped = Math.max(1, Math.min(180, mins));
    setLimitMinutes(clamped);
    const secs = clamped * 60;
    setRemainingSecs(secs);
    alertFiredRef.current = false;
    setGentleAlertVisible(false);
    setIsRunning(true);
    setShowLimitPicker(false);
    try {
      localStorage.setItem(STORAGE_LIMIT_KEY, String(clamped));
      sessionStorage.setItem(SESSION_REMAINING_KEY, String(secs));
    } catch {
      // ignore
    }
  };

  const handleExtendFiveMinutes = () => {
    const nextSecs = remainingSecs + 5 * 60;
    setRemainingSecs(nextSecs);
    alertFiredRef.current = false;
    setGentleAlertVisible(false);
    setIsRunning(true);
    try {
      sessionStorage.setItem(SESSION_REMAINING_KEY, String(nextSecs));
    } catch {
      // ignore
    }
  };

  const handleResetTimer = () => {
    const secs = limitMinutes * 60;
    setRemainingSecs(secs);
    alertFiredRef.current = false;
    setGentleAlertVisible(false);
    setIsRunning(true);
    try {
      sessionStorage.setItem(SESSION_REMAINING_KEY, String(secs));
    } catch {
      // ignore
    }
  };

  const handleResetSessionElapsed = () => {
    setSessionElapsedSecs(0);
    try {
      sessionStorage.setItem(SESSION_ELAPSED_KEY, '0');
    } catch {
      // ignore
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalLimitSecs = Math.max(1, limitMinutes * 60);
  const progressPct = Math.min(100, Math.max(0, Math.round((remainingSecs / totalLimitSecs) * 100)));
  const isNearEnd = remainingSecs > 0 && remainingSecs <= 60;
  const isTimeUp = remainingSecs === 0;

  return (
    <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-sky-50/80 via-white to-amber-50/50 border-b border-slate-200/80 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Optional Toggle + Session Time Spent + Countdown Display */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Enable / Disable Optional Session Countdown */}
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-extrabold text-[11px] border transition-all cursor-pointer ${
              isEnabled
                ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle optional persistent session countdown timer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Session Timer</span>
            <span className="px-1 py-0.2 rounded text-[9px] bg-black/20 uppercase">
              {isEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {isEnabled && (
            <>
              {/* Countdown Time Left Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold text-xs ${
                  isTimeUp
                    ? 'bg-amber-100 text-amber-950 border-amber-400 animate-pulse'
                    : isNearEnd
                    ? 'bg-orange-50 text-orange-900 border-orange-300'
                    : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Remaining:
                </span>
                <span className="font-mono text-xs sm:text-sm font-black text-[#0078D4]">
                  {formatTime(remainingSecs)}
                </span>
                <span className="text-[10px] text-slate-400">/ {limitMinutes}m</span>
              </div>

              {/* Total Time Spent in Session Pill */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 text-slate-700 font-semibold text-[11px]"
                title="Total active study time spent during this session"
              >
                <span>Time Spent:</span>
                <strong className="font-mono text-slate-900">{formatTime(sessionElapsedSecs)}</strong>
                {sessionElapsedSecs > 0 && (
                  <button
                    type="button"
                    onClick={handleResetSessionElapsed}
                    className="text-slate-400 hover:text-slate-700 ml-0.5 cursor-pointer"
                    title="Reset session time spent counter"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Controls (Play/Pause, Reset, Goal Limit Picker, Progress Bar) */}
        {isEnabled ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Compact visual countdown bar */}
            <div className="hidden md:flex items-center gap-2 mr-1">
              <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTimeUp
                      ? 'bg-amber-500'
                      : isNearEnd
                      ? 'bg-orange-500'
                      : 'bg-gradient-to-r from-[#0078D4] to-emerald-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Play / Pause */}
            <button
              type="button"
              onClick={() => setIsRunning((prev) => !prev)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title={isRunning ? 'Pause session timer' : 'Resume session timer'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            {/* Reset Countdown */}
            <button
              type="button"
              onClick={handleResetTimer}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title={`Reset countdown to ${limitMinutes}:00`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* +5m Quick Add */}
            <button
              type="button"
              onClick={handleExtendFiveMinutes}
              className="px-2 py-1 rounded-lg bg-white hover:bg-sky-50 text-[#0078D4] border border-sky-200 font-extrabold text-[11px] flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Add 5 extra minutes to session countdown"
            >
              <Plus className="w-3 h-3" />
              <span>5m</span>
            </button>

            {/* Mute/Unmute Chime */}
            <button
              type="button"
              onClick={() => setChimeMuted((prev) => !prev)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              title={effectiveMuted ? 'Unmute gentle alert chime' : 'Mute gentle alert chime'}
            >
              {effectiveMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#0078D4]" />
              )}
            </button>

            {/* Time Limit Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLimitPicker((prev) => !prev)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Change session time limit"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#0078D4]" />
                <span>Limit: {limitMinutes}m</span>
              </button>

              {showLimitPicker && (
                <div className="absolute right-0 mt-1.5 z-40 w-56 p-3 rounded-xl bg-white border border-slate-200 shadow-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-extrabold text-slate-800">Session Time Limit</span>
                    <button
                      type="button"
                      onClick={() => setShowLimitPicker(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {PRESET_MINUTES.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSelectLimitMinutes(mins)}
                        className={`py-1.5 rounded-lg font-extrabold text-[11px] border cursor-pointer ${
                          limitMinutes === mins
                            ? 'bg-[#0078D4] text-white border-[#0078D4]'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Triggers a gentle chime &amp; summary alert when your study target is reached.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">
            Optional session countdown paused • Click &ldquo;Session Timer&rdquo; to enable
          </span>
        )}
      </div>

      {/* Gentle Alert Banner when Time Limit is Reached */}
      {isEnabled && gentleAlertVisible && (
        <div className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-sky-50 border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  Gentle Study Milestone Reached ({limitMinutes}:00 Session Limit)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {sessionAnsweredCount} Questions Answered
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Great consistency! You&apos;ve studied for{' '}
                <strong className="text-slate-900">{formatTime(sessionElapsedSecs)}</strong> this session. Take a short stretch break, add 5 minutes, or continue at your own pace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExtendFiveMinutes}
              className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+5 Min</span>
            </button>
            <button
              type="button"
              onClick={handleResetTimer}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Restart ({limitMinutes}m)
            </button>
            {onFinishSession && (
              <button
                type="button"
                onClick={onFinishSession}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Wrap Up</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setGentleAlertVisible(false)}
              className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
