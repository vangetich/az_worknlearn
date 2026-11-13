import React, { useEffect, useRef, useState } from 'react';
import { Award, Sparkles, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const MILESTONE_STORAGE_KEY = 'az900_daily_goal_milestones_v1';

interface StoredMilestoneState {
  date: string;
  celebrated25: boolean;
  celebrated50: boolean;
}

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function readTodayMilestoneState(): StoredMilestoneState {
  const today = getTodayDateKey();
  const fallback: StoredMilestoneState = {
    date: today,
    celebrated25: false,
    celebrated50: false,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(MILESTONE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredMilestoneState>;
    if (parsed.date !== today) return fallback;
    return {
      date: today,
      celebrated25: Boolean(parsed.celebrated25),
      celebrated50: Boolean(parsed.celebrated50),
    };
  } catch {
    return fallback;
  }
}

function writeTodayMilestoneState(state: StoredMilestoneState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

interface DailyGoalMilestoneOverlayProps {
  todayAnsweredCount: number;
  dailyGoal: number;
}

export const DailyGoalMilestoneOverlay: React.FC<DailyGoalMilestoneOverlayProps> = ({
  todayAnsweredCount,
  dailyGoal,
}) => {
  const [activeMilestone, setActiveMilestone] = useState<25 | 50 | null>(null);
  const prevAnsweredRef = useRef<number>(todayAnsweredCount);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const safeGoal = Math.max(1, dailyGoal || 10);
    const prevCount = prevAnsweredRef.current;
    prevAnsweredRef.current = todayAnsweredCount;

    // Only trigger celebration when the learner actively advances their solved count today
    if (todayAnsweredCount <= prevCount) return;

    const pct = Math.floor((todayAnsweredCount / safeGoal) * 100);
    const state = readTodayMilestoneState();
    let triggered: 25 | 50 | null = null;

    if (pct >= 50 && !state.celebrated50) {
      state.celebrated25 = true;
      state.celebrated50 = true;
      triggered = 50;
    } else if (pct >= 25 && pct < 50 && !state.celebrated25) {
      state.celebrated25 = true;
      triggered = 25;
    }

    if (triggered !== null) {
      writeTodayMilestoneState(state);
      setActiveMilestone(triggered);

      try {
        confetti({
          particleCount: triggered === 50 ? 65 : 40,
          spread: triggered === 50 ? 75 : 55,
          origin: { y: 0.25 },
          colors:
            triggered === 50
              ? ['#10B981', '#0078D4', '#F59E0B']
              : ['#0078D4', '#38BDF8', '#F59E0B'],
        });
      } catch {
        // ignore confetti failure in headless/SSR environments
      }

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        setActiveMilestone(null);
      }, 6000);
    }
  }, [todayAnsweredCount, dailyGoal]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  if (activeMilestone === null) return null;

  const safeGoal = Math.max(1, dailyGoal || 10);
  const progressPct = Math.min(100, Math.round((todayAnsweredCount / safeGoal) * 100));
  const isHalfway = activeMilestone === 50;

  return (
    <div
      className="fixed inset-x-0 top-20 sm:top-24 z-[110] flex justify-center px-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto relative max-w-md w-full rounded-2xl border-2 shadow-2xl p-4 sm:p-5 overflow-hidden animate-milestone-badge-pop ${
          isHalfway
            ? 'bg-gradient-to-br from-slate-950 via-emerald-950 to-[#005A9E] border-emerald-400 text-white'
            : 'bg-gradient-to-br from-slate-950 via-[#004578] to-sky-900 border-sky-400 text-white'
        }`}
      >
        {/* Subtle decorative celebratory glow */}
        <div
          className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl animate-milestone-halo ${
            isHalfway ? 'bg-emerald-400/30' : 'bg-sky-400/30'
          }`}
        />

        <div className="relative z-10 flex items-center gap-3.5">
          {/* Animated Milestone Seal Badge */}
          <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
            <div
              className={`absolute inset-0 rounded-2xl rotate-6 animate-milestone-halo ${
                isHalfway
                  ? 'bg-gradient-to-br from-emerald-400/35 to-amber-400/35 border border-emerald-300/60'
                  : 'bg-gradient-to-br from-sky-400/35 to-amber-400/35 border border-sky-300/60'
              }`}
            />
            <div
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg border ${
                isHalfway
                  ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                  : 'bg-sky-400 text-slate-950 border-sky-100'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-black leading-none mt-0.5">
                {activeMilestone}%
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1.5 -right-1.5 animate-sparkle-1" />
            <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute -bottom-1 -left-1 animate-sparkle-2" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isHalfway
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/40'
                    : 'bg-sky-400/20 text-sky-200 border border-sky-300/40'
                }`}
              >
                Milestone Reached
              </span>
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {todayAnsweredCount}/{safeGoal} Today
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-black text-white mt-1 leading-tight">
              {isHalfway
                ? '50% Halfway to Your Daily Goal!'
                : '25% Daily Study Momentum Unlocked!'}
            </h4>
            <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
              {isHalfway
                ? 'Halfway mark conquered! Keep this pace to lock in today’s AZ-900 target.'
                : 'Great opening sprint — 25% of today’s AZ-900 target complete!'}
            </p>

            {/* Progress bar inside badge overlay */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isHalfway
                    ? 'bg-gradient-to-r from-emerald-300 to-amber-300'
                    : 'bg-gradient-to-r from-sky-300 to-amber-300'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveMilestone(null)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors self-start shrink-0 cursor-pointer"
            aria-label="Dismiss milestone celebration"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
