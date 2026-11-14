import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from 'lucide-react';

export const PERSISTENT_EXAM_SESSION_STORAGE_KEY = 'az900_persistent_exam_session_v1';
export const TARGET_PACE_STORAGE_KEY = 'az900_quiz_target_pace_secs';
export const TARGET_PACE_OPTIONS = [30, 45, 60, 90, 120] as const;

interface StoredExamSessionTimerState {
  activeSeconds: number;
  isPaused: boolean;
  updatedAt: number;
}

export function formatExamDuration(totalSeconds: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = safeSecs % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function loadStoredSessionTimer(): StoredExamSessionTimerState {
  try {
    const raw = localStorage.getItem(PERSISTENT_EXAM_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.activeSeconds === 'number') {
        return {
          activeSeconds: Math.max(0, Math.floor(parsed.activeSeconds)),
          isPaused: Boolean(parsed.isPaused),
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return { activeSeconds: 0, isPaused: false, updatedAt: Date.now() };
}

function persistSessionTimer(state: StoredExamSessionTimerState): void {
  try {
    localStorage.setItem(PERSISTENT_EXAM_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export interface PersistentExamTimerProps {
  questionElapsedSeconds: number;
  targetPaceSeconds: number;
  onChangeTargetPace: (nextTargetSeconds: number) => void;
  hasSubmitted: boolean;
  avgCompletionSeconds: number;
  isPauseSynced?: boolean;
  onPausedStateChange?: (isPaused: boolean) => void;
}

export const PersistentExamTimer: React.FC<PersistentExamTimerProps> = ({
  questionElapsedSeconds,
  targetPaceSeconds,
  onChangeTargetPace,
  hasSubmitted,
  avgCompletionSeconds,
  onPausedStateChange,
}) => {
  const [sessionState, setSessionState] = useState<StoredExamSessionTimerState>(() =>
    loadStoredSessionTimer()
  );
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  // Pause active session counting automatically when user switches away from the browser tab
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Notify parent when pause state changes so question pace timer pauses in sync
  useEffect(() => {
    if (onPausedStateChange) {
      onPausedStateChange(sessionState.isPaused || !isDocumentVisible);
    }
  }, [sessionState.isPaused, isDocumentVisible, onPausedStateChange]);

  // Increment active session timer every 1s while running and tab is visible
  useEffect(() => {
    if (sessionState.isPaused || !isDocumentVisible) return;
    const interval = window.setInterval(() => {
      setSessionState((prev) => {
        if (prev.isPaused) return prev;
        const next: StoredExamSessionTimerState = {
          activeSeconds: prev.activeSeconds + 1,
          isPaused: prev.isPaused,
          updatedAt: Date.now(),
        };
        persistSessionTimer(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionState.isPaused, isDocumentVisible]);

  const handleTogglePause = () => {
    setSessionState((prev) => {
      const next: StoredExamSessionTimerState = {
        activeSeconds: prev.activeSeconds,
        isPaused: !prev.isPaused,
        updatedAt: Date.now(),
      };
      persistSessionTimer(next);
      return next;
    });
  };

  const handleResetSession = () => {
    const next: StoredExamSessionTimerState = {
      activeSeconds: 0,
      isPaused: false,
      updatedAt: Date.now(),
    };
    persistSessionTimer(next);
    setSessionState(next);
  };

  const safeTarget = Math.max(15, targetPaceSeconds || 60);
  const ratio = questionElapsedSeconds / safeTarget;
  const isOverTargetPace = questionElapsedSeconds > safeTarget;
  const isApproachingTarget = !isOverTargetPace && ratio >= 0.8;
  const overSeconds = Math.max(0, questionElapsedSeconds - safeTarget);
  const remainingTargetSeconds = Math.max(0, safeTarget - questionElapsedSeconds);
  const progressWidthPct = Math.min(100, Math.round((questionElapsedSeconds / safeTarget) * 100));

  const statusTone = isOverTargetPace
    ? {
        container: 'bg-rose-50/95 border-rose-400 text-rose-950 ring-1 ring-rose-500/20',
        badge: 'bg-rose-600 text-white border-rose-700',
        bar: 'bg-rose-600',
        track: 'bg-rose-200/80',
        sessionBox: 'bg-white/95 border-rose-300 text-rose-950',
      }
    : isApproachingTarget
    ? {
        container: 'bg-amber-50/90 border-amber-300 text-amber-950',
        badge: 'bg-amber-500 text-slate-950 border-amber-600',
        bar: 'bg-amber-500',
        track: 'bg-amber-200/75',
        sessionBox: 'bg-white/90 border-amber-200 text-slate-900',
      }
    : {
        container: 'bg-slate-50/95 border-slate-200/90 text-slate-900',
        badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
        bar: 'bg-[#0078D4]',
        track: 'bg-slate-200/85',
        sessionBox: 'bg-white border-slate-200 text-slate-900',
      };

  return (
    <section
      id="quizcard-persistent-exam-timer"
      aria-label="Persistent Exam Timer and Target Pace Monitor"
      className={`px-4 sm:px-6 py-2.5 border-b transition-colors duration-200 ${statusTone.container}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Persistent Active Session Time + Pause / Reset Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border shadow-2xs ${statusTone.sessionBox}`}
            title="Active Exam Session Time (persists across questions and page reloads; pauses automatically when tab is hidden)"
          >
            <Clock className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Session
            </span>
            <span
              data-testid="persistent-session-elapsed"
              className="font-mono tabular-nums text-xs sm:text-sm font-black tracking-tight"
            >
              {formatExamDuration(sessionState.activeSeconds)}
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border whitespace-nowrap ${
                sessionState.isPaused
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-sky-50 text-[#0078D4] border-sky-200'
              }`}
            >
              {sessionState.isPaused ? 'Paused' : 'Active'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleTogglePause}
              aria-label={sessionState.isPaused ? 'Resume active exam timer' : 'Pause active exam timer'}
              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {sessionState.isPaused ? (
                <>
                  <Play className="w-3 h-3 text-[#0078D4]" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-slate-600" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              aria-label="Reset active exam session timer"
              title="Reset persistent active exam session timer to 00:00"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center/Right: Per-Question Pace vs Target Pace + Dual-Coded Warning */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs">
              <Timer
                className={`w-3.5 h-3.5 shrink-0 ${
                  isOverTargetPace
                    ? 'text-rose-600'
                    : isApproachingTarget
                    ? 'text-amber-600'
                    : 'text-[#0078D4]'
                }`}
              />
              <span className="font-bold text-slate-700 whitespace-nowrap">Q Pace:</span>
              <span
                data-testid="question-pace-elapsed"
                className={`font-mono tabular-nums font-black ${
                  isOverTargetPace
                    ? 'text-rose-700'
                    : isApproachingTarget
                    ? 'text-amber-800'
                    : 'text-slate-900'
                }`}
              >
                {formatExamDuration(questionElapsedSeconds)}
              </span>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                / {safeTarget}s
              </span>
            </div>

            {/* Dual-coded status / warning indicator (icon + explicit text, never hue-only) */}
            {isOverTargetPace ? (
              <span
                role="status"
                aria-live="polite"
                data-testid="target-pace-warning"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-black uppercase tracking-wide whitespace-nowrap shrink-0 shadow-2xs ${statusTone.badge}`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>
                  {hasSubmitted
                    ? `Over Target (+${overSeconds}s)`
                    : `Pace Warning: +${overSeconds}s Over Target`}
                </span>
              </span>
            ) : isApproachingTarget ? (
              <span
                data-testid="target-pace-caution"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap shrink-0 ${statusTone.badge}`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  {hasSubmitted
                    ? `Done (${questionElapsedSeconds}s)`
                    : `${remainingTargetSeconds}s Left in Target`}
                </span>
              </span>
            ) : (
              <span
                data-testid="target-pace-ok"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap shrink-0 ${statusTone.badge}`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>
                  {hasSubmitted
                    ? `On Pace (${questionElapsedSeconds}s)`
                    : `On Pace (${remainingTargetSeconds}s left)`}
                </span>
              </span>
            )}
          </div>

          {/* Progress bar + Target Pace selector */}
          <div className="flex items-center gap-2">
            <div
              className={`w-24 sm:w-28 h-2 rounded-full overflow-hidden ${statusTone.track}`}
              title={`Current question time (${questionElapsedSeconds}s) vs Target Pace (${safeTarget}s) • Avg: ${formatExamDuration(avgCompletionSeconds)}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${statusTone.bar}`}
                style={{ width: `${progressWidthPct}%` }}
              />
            </div>

            <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 whitespace-nowrap shrink-0">
              <span>Target:</span>
              <select
                aria-label="Target pace per question in seconds"
                value={safeTarget}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) {
                    onChangeTargetPace(val);
                  }
                }}
                className="font-mono font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {TARGET_PACE_OPTIONS.map((secs) => (
                  <option key={secs} value={secs}>
                    {secs}s
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Explicit accessible pace-exceeded warning banner (never relies on hue alone) */}
      {isOverTargetPace && !hasSubmitted && (
        <div
          role="alert"
          className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold flex flex-wrap items-center justify-between gap-2 shadow-2xs"
        >
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>
              You exceeded your <strong className="font-mono tabular-nums">{safeTarget}s</strong>{' '}
              target pace by <strong className="font-mono tabular-nums">+{overSeconds}s</strong> on
              this question.
            </span>
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-100 whitespace-nowrap">
            Tip: Lock best choice or Skip to protect exam time
          </span>
        </div>
      )}
    </section>
  );
};
