import React, { useEffect, useRef, useState } from 'react';
import { Award, Sparkles, X, CheckCircle2, Target, Flame, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

const MILESTONE_STORAGE_KEY = 'az900_daily_goal_milestones_v2';

interface StoredMilestoneState {
  date: string;
  lastGoal: number;
  celebrated25: boolean;
  celebrated50: boolean;
  celebrated75: boolean;
  celebrated100: boolean;
}

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function readTodayMilestoneState(currentGoal: number): StoredMilestoneState {
  const today = getTodayDateKey();
  const fallback: StoredMilestoneState = {
    date: today,
    lastGoal: currentGoal,
    celebrated25: false,
    celebrated50: false,
    celebrated75: false,
    celebrated100: false,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(MILESTONE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredMilestoneState>;
    if (parsed.date !== today) return fallback;

    // If goal was dynamically changed, adapt milestone states
    const goalChanged = typeof parsed.lastGoal === 'number' && parsed.lastGoal !== currentGoal;

    return {
      date: today,
      lastGoal: currentGoal,
      celebrated25: goalChanged ? false : Boolean(parsed.celebrated25),
      celebrated50: goalChanged ? false : Boolean(parsed.celebrated50),
      celebrated75: goalChanged ? false : Boolean(parsed.celebrated75),
      celebrated100: goalChanged ? false : Boolean(parsed.celebrated100),
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

export type MilestonePercent = 25 | 50 | 75 | 100;

export interface DailyGoalMilestoneOverlayProps {
  todayAnsweredCount: number;
  dailyGoal: number;
}

export const DailyGoalMilestoneOverlay: React.FC<DailyGoalMilestoneOverlayProps> = ({
  todayAnsweredCount,
  dailyGoal,
}) => {
  const [activeMilestone, setActiveMilestone] = useState<MilestonePercent | null>(null);
  const [dynamicGoal, setDynamicGoal] = useState<number>(() => Math.max(1, dailyGoal || 10));
  const prevAnsweredRef = useRef<number>(todayAnsweredCount);
  const prevGoalRef = useRef<number>(dynamicGoal);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync prop changes
  useEffect(() => {
    const safeGoal = Math.max(1, dailyGoal || 10);
    setDynamicGoal(safeGoal);
  }, [dailyGoal]);

  // Listen to window-level goal update events from ProfileView or Header
  useEffect(() => {
    const handleGoalSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ goal?: number }>;
      if (customEvent.detail && typeof customEvent.detail.goal === 'number') {
        const nextGoal = Math.max(1, customEvent.detail.goal);
        setDynamicGoal(nextGoal);
      }
    };

    window.addEventListener('az900_daily_goal_saved', handleGoalSaved);
    return () => {
      window.removeEventListener('az900_daily_goal_saved', handleGoalSaved);
    };
  }, []);

  useEffect(() => {
    const safeGoal = dynamicGoal;
    const prevCount = prevAnsweredRef.current;
    const goalChanged = prevGoalRef.current !== safeGoal;
    prevAnsweredRef.current = todayAnsweredCount;
    prevGoalRef.current = safeGoal;

    // Trigger celebration when user actively answered a question or if goal was reduced below answered count
    const shouldCheck = (todayAnsweredCount > prevCount) || (goalChanged && todayAnsweredCount > 0);
    if (!shouldCheck) return;

    const pct = Math.floor((todayAnsweredCount / safeGoal) * 100);
    const state = readTodayMilestoneState(safeGoal);
    let triggered: MilestonePercent | null = null;

    if (pct >= 100 && !state.celebrated100) {
      state.celebrated25 = true;
      state.celebrated50 = true;
      state.celebrated75 = true;
      state.celebrated100 = true;
      triggered = 100;
    } else if (pct >= 75 && pct < 100 && !state.celebrated75) {
      state.celebrated25 = true;
      state.celebrated50 = true;
      state.celebrated75 = true;
      triggered = 75;
    } else if (pct >= 50 && pct < 75 && !state.celebrated50) {
      state.celebrated25 = true;
      state.celebrated50 = true;
      triggered = 50;
    } else if (pct >= 25 && pct < 50 && !state.celebrated25) {
      state.celebrated25 = true;
      triggered = 25;
    }

    if (triggered !== null) {
      state.lastGoal = safeGoal;
      writeTodayMilestoneState(state);
      setActiveMilestone(triggered);

      try {
        const confettiConfigs: Record<
          MilestonePercent,
          { particleCount: number; spread: number; colors: string[] }
        > = {
          25: {
            particleCount: 45,
            spread: 55,
            colors: ['#0078D4', '#38BDF8', '#F59E0B'],
          },
          50: {
            particleCount: 65,
            spread: 75,
            colors: ['#10B981', '#0078D4', '#F59E0B'],
          },
          75: {
            particleCount: 80,
            spread: 85,
            colors: ['#F59E0B', '#F97316', '#10B981', '#0078D4'],
          },
          100: {
            particleCount: 110,
            spread: 100,
            colors: ['#10B981', '#F59E0B', '#0078D4', '#FBBF24', '#EF4444'],
          },
        };

        const config = confettiConfigs[triggered];
        confetti({
          particleCount: config.particleCount,
          spread: config.spread,
          origin: { y: 0.25 },
          colors: config.colors,
        });
      } catch {
        // ignore confetti failure in headless/SSR environments
      }

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        setActiveMilestone(null);
      }, triggered === 100 ? 7500 : 6000);
    }
  }, [todayAnsweredCount, dynamicGoal]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  if (activeMilestone === null) return null;

  const safeGoal = dynamicGoal;
  const progressPct = Math.min(100, Math.round((todayAnsweredCount / safeGoal) * 100));

  // Visual styling variants per milestone
  const milestoneTheme = {
    25: {
      bg: 'bg-gradient-to-br from-slate-950 via-[#004578] to-sky-900 border-sky-400',
      badgeBg: 'bg-sky-400 text-slate-950 border-sky-100',
      halo: 'bg-sky-400/30',
      tag: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
      bar: 'bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300',
      icon: Award,
      title: '25% Daily Study Momentum Unlocked!',
      desc: `Great opening sprint — 25% of today’s custom ${safeGoal}-question AZ-900 target complete!`,
    },
    50: {
      bg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-[#005A9E] border-emerald-400',
      badgeBg: 'bg-emerald-500 text-slate-950 border-emerald-200',
      halo: 'bg-emerald-400/30',
      tag: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40',
      bar: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300',
      icon: Target,
      title: '50% Halfway to Your Dynamic Goal!',
      desc: `Halfway mark conquered! Keep this pace to lock in today’s ${safeGoal}-question target.`,
    },
    75: {
      bg: 'bg-gradient-to-br from-slate-950 via-amber-950 to-[#004E89] border-amber-400',
      badgeBg: 'bg-amber-400 text-slate-950 border-amber-100',
      halo: 'bg-amber-400/30',
      tag: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
      bar: 'bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-300',
      icon: Flame,
      title: '75% Three-Quarters Conquered!',
      desc: `Incredible endurance — just ${Math.max(0, safeGoal - todayAnsweredCount)} more question${
        safeGoal - todayAnsweredCount === 1 ? '' : 's'
      } to hit today’s ${safeGoal}Q target!`,
    },
    100: {
      bg: 'bg-gradient-to-br from-slate-950 via-emerald-900 to-amber-950 border-amber-300',
      badgeBg: 'bg-gradient-to-br from-amber-400 to-emerald-400 text-slate-950 border-white',
      halo: 'bg-amber-400/40',
      tag: 'bg-gradient-to-r from-amber-400/30 to-emerald-400/30 text-amber-200 border-amber-300/60',
      bar: 'bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-300',
      icon: Trophy,
      title: `100% Daily Target (${safeGoal} Qs) Achieved!`,
      desc: `Hongera! You achieved 100% of your custom daily goal (${todayAnsweredCount}/${safeGoal} questions)! Continuous streak bonus unlocked.`,
    },
  }[activeMilestone];

  const MilestoneIcon = milestoneTheme.icon;

  return (
    <div
      className="fixed inset-x-0 top-16 sm:top-20 z-[110] flex justify-center px-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto relative max-w-md w-full rounded-2xl border-2 shadow-2xl p-4 sm:p-5 overflow-hidden animate-milestone-badge-pop text-white ${milestoneTheme.bg}`}
      >
        {/* Subtle decorative celebratory glow */}
        <div
          className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl animate-milestone-halo ${milestoneTheme.halo}`}
        />

        <div className="relative z-10 flex items-center gap-3.5">
          {/* Animated Milestone Seal Badge */}
          <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
            <div
              className={`absolute inset-0 rounded-2xl rotate-6 animate-milestone-halo bg-gradient-to-br from-white/20 to-amber-400/30 border border-white/40`}
            />
            <div
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg border ${milestoneTheme.badgeBg}`}
            >
              <MilestoneIcon className="w-4 h-4 shrink-0" />
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
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${milestoneTheme.tag}`}
              >
                Milestone Reached
              </span>
              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {todayAnsweredCount}/{safeGoal} Qs Today
                </span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-white/15 text-slate-200 border border-white/20">
                Target: {safeGoal} Qs/day
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-black text-white mt-1 leading-tight">
              {milestoneTheme.title}
            </h4>
            <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
              {milestoneTheme.desc}
            </p>

            {/* Progress bar inside badge overlay reflecting dynamic target */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${milestoneTheme.bar}`}
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
