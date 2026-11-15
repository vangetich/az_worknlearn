import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  BookOpen,
  Bot,
  History,
  User,
  Sparkles,
  Flame,
  CheckCircle2,
  Target,
  X,
  ArrowRight,
} from 'lucide-react';
import { AppTab } from './Header';
import { UserStats } from '../types/quiz';

export interface UserStatsContextValue {
  stats: UserStats | null;
  todayAnsweredCount?: number;
  dailyGoal?: number;
}

export const UserStatsContext = createContext<UserStatsContextValue>({
  stats: null,
});

export const UserStatsProvider: React.FC<{
  stats: UserStats;
  todayAnsweredCount?: number;
  dailyGoal?: number;
  children: React.ReactNode;
}> = ({ stats, todayAnsweredCount, dailyGoal, children }) => {
  const value = useMemo(
    () => ({
      stats,
      todayAnsweredCount,
      dailyGoal: dailyGoal ?? stats?.dailyGoal ?? 10,
    }),
    [stats, todayAnsweredCount, dailyGoal]
  );

  return (
    <UserStatsContext.Provider value={value}>
      {children}
    </UserStatsContext.Provider>
  );
};

export function useUserStatsContext(): UserStatsContextValue {
  return useContext(UserStatsContext);
}

export interface DailyGoalStreakDayEntry {
  dateKey: string;
  dayShort: string;
  answeredCount: number;
  goalMet: boolean;
  isToday: boolean;
}

export interface DailyGoalStreakSummary {
  consecutiveGoalDays: number;
  todayCount: number;
  dailyGoal: number;
  todayProgressPct: number;
  isTodayGoalMet: boolean;
  questionsRemainingToday: number;
  last7Days: DailyGoalStreakDayEntry[];
}

/**
 * Calculates consecutive days of meeting the daily study goal from UserStats attempts & streak metadata.
 */
export function calculateDailyGoalStreakSummary(
  stats?: UserStats | null,
  fallbackTodayCount = 0,
  fallbackDailyGoal = 10,
  fallbackStreakDays = 1
): DailyGoalStreakSummary {
  const effectiveDailyGoal = Math.max(
    1,
    stats?.dailyGoal ?? fallbackDailyGoal ?? 10
  );

  // Aggregate attempts by YYYY-MM-DD
  const dailyCounts = new Map<string, number>();
  if (stats?.attempts) {
    Object.values(stats.attempts).forEach((attemptList) => {
      if (!Array.isArray(attemptList)) return;
      attemptList.forEach((att) => {
        if (att && typeof att.timestamp === 'number' && att.timestamp > 0) {
          const dKey = new Date(att.timestamp).toISOString().split('T')[0];
          dailyCounts.set(dKey, (dailyCounts.get(dKey) || 0) + 1);
        }
      });
    });
  }

  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const attemptsToday = dailyCounts.get(todayKey) || 0;
  const todayCount = Math.max(attemptsToday, fallbackTodayCount || 0);
  dailyCounts.set(todayKey, todayCount);

  const isTodayGoalMet = todayCount >= effectiveDailyGoal;

  // Count consecutive days backwards where daily count >= effectiveDailyGoal
  let computedGoalStreakFromAttempts = 0;
  for (let offset = isTodayGoalMet ? 0 : 1; offset < 365; offset++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - offset);
    const key = d.toISOString().split('T')[0];
    const countForDay = dailyCounts.get(key) || 0;
    if (countForDay >= effectiveDailyGoal) {
      computedGoalStreakFromAttempts += 1;
    } else {
      break;
    }
  }

  const rawStreakDays = Math.max(0, stats?.streakDays ?? fallbackStreakDays ?? 0);

  // Reconcile attempt-derived goal streak with UserStats.streakDays so existing active streaks
  // and newly completed daily goals are both accurately reflected.
  let consecutiveGoalDays = computedGoalStreakFromAttempts;
  if (dailyCounts.size <= 1) {
    if (isTodayGoalMet) {
      consecutiveGoalDays = Math.max(1, rawStreakDays, computedGoalStreakFromAttempts);
    } else {
      consecutiveGoalDays = Math.max(computedGoalStreakFromAttempts, rawStreakDays);
    }
  } else {
    consecutiveGoalDays = Math.max(
      computedGoalStreakFromAttempts,
      isTodayGoalMet ? Math.max(1, rawStreakDays) : rawStreakDays
    );
  }

  // Build 7-day history strip (oldest -> today)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days: DailyGoalStreakDayEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const rawDayCount = dailyCounts.get(key) || 0;
    // If user has an active multi-day streak in UserStats and historical timestamps weren't individually logged,
    // reflect prior consecutive days within `consecutiveGoalDays` window
    const inferredGoalMet =
      rawDayCount >= effectiveDailyGoal ||
      (!isToday && i <= (isTodayGoalMet ? consecutiveGoalDays - 1 : consecutiveGoalDays) && dailyCounts.size <= 1);
    const effectiveDayCount =
      rawDayCount > 0
        ? rawDayCount
        : inferredGoalMet
        ? effectiveDailyGoal
        : 0;

    last7Days.push({
      dateKey: key,
      dayShort: isToday ? 'Today' : dayNames[d.getUTCDay()],
      answeredCount: effectiveDayCount,
      goalMet: effectiveDayCount >= effectiveDailyGoal,
      isToday,
    });
  }

  const todayProgressPct = Math.min(
    100,
    Math.round((todayCount / effectiveDailyGoal) * 100)
  );
  const questionsRemainingToday = Math.max(0, effectiveDailyGoal - todayCount);

  return {
    consecutiveGoalDays,
    todayCount,
    dailyGoal: effectiveDailyGoal,
    todayProgressPct,
    isTodayGoalMet,
    questionsRemainingToday,
    last7Days,
  };
}

export interface MobileBottomNavBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  stats?: UserStats;
  todayAnsweredCount?: number;
  dailyGoal?: number;
  streakDays?: number;
  unresolvedMistakesCount?: number;
}

interface NavItem {
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    id: 'quiz',
    label: 'Practice Quiz',
    shortLabel: 'Quiz',
    icon: BookOpen,
    description: 'AZ-900 Question Practice',
  },
  {
    id: 'assistant',
    label: 'AI Tutor',
    shortLabel: 'AI Tutor',
    icon: Bot,
    description: 'Knowledge Assistant & Concept Explanations',
  },
  {
    id: 'history',
    label: 'Study History',
    shortLabel: 'History',
    icon: History,
    description: 'Review Past Attempts & Mistakes',
  },
  {
    id: 'profile',
    label: 'Profile & Goal',
    shortLabel: 'Profile',
    icon: User,
    description: 'Candidate Profile & Study Goals',
  },
];

export const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  stats: propStats,
  todayAnsweredCount = 0,
  dailyGoal = 10,
  streakDays = 1,
  unresolvedMistakesCount = 0,
}) => {
  const ctx = useUserStatsContext();
  const effectiveStats = propStats ?? ctx.stats;
  const effectiveTodayCount =
    todayAnsweredCount || ctx.todayAnsweredCount || 0;
  const effectiveDailyGoalProp =
    dailyGoal || ctx.dailyGoal || effectiveStats?.dailyGoal || 10;
  const effectiveStreakProp =
    streakDays || effectiveStats?.streakDays || 1;

  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState(false);

  const streakSummary = useMemo(
    () =>
      calculateDailyGoalStreakSummary(
        effectiveStats,
        effectiveTodayCount,
        effectiveDailyGoalProp,
        effectiveStreakProp
      ),
    [
      effectiveStats,
      effectiveTodayCount,
      effectiveDailyGoalProp,
      effectiveStreakProp,
    ]
  );

  const {
    consecutiveGoalDays,
    todayCount,
    dailyGoal: resolvedDailyGoal,
    todayProgressPct,
    isTodayGoalMet,
    questionsRemainingToday,
    last7Days,
  } = streakSummary;

  const leftNavItems = PRIMARY_NAV_ITEMS.slice(0, 2);
  const rightNavItems = PRIMARY_NAV_ITEMS.slice(2, 4);

  const renderNavItem = (item: NavItem) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    let badgeContent: React.ReactNode = null;
    if (item.id === 'quiz') {
      badgeContent = (
        <span
          className={`text-[9px] font-black tabular-nums px-1.5 py-0.2 rounded-full border leading-tight ${
            isTodayGoalMet
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-sky-100 text-[#0078D4] dark:bg-sky-950 dark:text-sky-300 border-sky-300/60'
          }`}
          title={`Today: ${todayCount}/${resolvedDailyGoal} Qs`}
        >
          {todayCount}/{resolvedDailyGoal}
        </span>
      );
    } else if (item.id === 'assistant') {
      badgeContent = (
        <span className="flex items-center gap-0.5 text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-2xs leading-tight">
          <Sparkles className="w-2.5 h-2.5" />
          <span>AI</span>
        </span>
      );
    } else if (item.id === 'history' && unresolvedMistakesCount > 0) {
      badgeContent = (
        <span
          className="text-[9px] font-black tabular-nums px-1.5 py-0.2 rounded-full bg-rose-500 text-white border border-rose-400 leading-tight"
          title={`${unresolvedMistakesCount} unresolved mistakes`}
        >
          {unresolvedMistakesCount}
        </span>
      );
    } else if (item.id === 'profile' && consecutiveGoalDays > 0) {
      badgeContent = (
        <span
          className="flex items-center gap-0.5 text-[8.5px] font-black tabular-nums px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-300/70 leading-tight"
          title={`${consecutiveGoalDays}-day daily study goal streak`}
        >
          <Flame className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
          <span>{consecutiveGoalDays}d</span>
        </span>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setIsStreakSheetOpen(false);
          setActiveTab(item.id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        className={`relative flex-1 py-1 px-1 min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer active:scale-95 ${
          isActive
            ? 'text-[#0078D4] dark:text-sky-400 font-black'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 font-semibold'
        }`}
      >
        {isActive && (
          <span className="absolute -top-1.5 w-8 h-1 rounded-full bg-[#0078D4] dark:bg-sky-400 shadow-xs animate-in fade-in zoom-in-75 duration-150" />
        )}

        <div className="relative flex items-center justify-center">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-150 ${
              isActive
                ? 'bg-sky-100/90 dark:bg-sky-950/80 text-[#0078D4] dark:text-sky-300 scale-105 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>

          {badgeContent && (
            <div className="absolute -top-1 -right-3.5 translate-x-1/4 scale-90 origin-bottom-left">
              {badgeContent}
            </div>
          )}
        </div>

        <span
          className={`text-[10.5px] tracking-tight leading-none ${
            isActive
              ? 'font-black text-[#0078D4] dark:text-sky-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {item.shortLabel}
        </span>
      </button>
    );
  };

  return (
    <nav
      role="navigation"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden portrait:block landscape:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 select-none"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Top 2.5px Continuous Daily Goal Progress Strip */}
      <div
        className="w-full h-[3px] bg-slate-200/80 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-label="Today's daily study goal progress"
        aria-valuenow={todayCount}
        aria-valuemin={0}
        aria-valuemax={resolvedDailyGoal}
      >
        <div
          className={`h-full transition-all duration-300 ${
            isTodayGoalMet
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400'
              : 'bg-gradient-to-r from-[#0078D4] via-sky-500 to-orange-500'
          }`}
          style={{ width: `${todayProgressPct}%` }}
        />
      </div>

      {/* Expandable Daily Study Goal Streak Counter Sheet */}
      {isStreakSheetOpen && (
        <div
          role="dialog"
          aria-label="Daily Study Goal Streak Details"
          data-testid="mobile-goal-streak-popover"
          className="mx-2 mb-1.5 mt-1.5 p-3 rounded-2xl bg-slate-900 text-white border border-amber-400/50 shadow-2xl space-y-2.5 animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isTodayGoalMet
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-orange-500/20 border-orange-400/50 text-amber-300'
                }`}
              >
                <Flame className="w-4 h-4 fill-orange-400 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-white tabular-nums">
                    {consecutiveGoalDays}-Day Daily Goal Streak
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      isTodayGoalMet
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isTodayGoalMet ? 'Goal Met Today' : `${todayProgressPct}% Today`}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 truncate tabular-nums">
                  {isTodayGoalMet
                    ? `Daily study goal achieved (${todayCount}/${resolvedDailyGoal} Qs today)!`
                    : `${todayCount}/${resolvedDailyGoal} Qs today · ${questionsRemainingToday} more to lock in today's goal`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStreakSheetOpen(false)}
              aria-label="Close streak counter details"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 7-Day Consecutive Daily Study Goal Tracker Strip */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {last7Days.map((day) => (
              <div
                key={day.dateKey}
                className={`p-1 rounded-lg border text-center flex flex-col items-center justify-center gap-0.5 ${
                  day.goalMet
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                    : day.isToday
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-tighter">
                  {day.dayShort}
                </span>
                {day.goalMet ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Flame
                    className={`w-3.5 h-3.5 ${
                      day.isToday ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  />
                )}
                <span className="text-[8.5px] font-mono tabular-nums">
                  {day.answeredCount}/{resolvedDailyGoal}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsStreakSheetOpen(false);
                setActiveTab('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Target className="w-3 h-3" />
              <span>{isTodayGoalMet ? 'Keep Practicing' : 'Complete Daily Goal'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsStreakSheetOpen(false);
                setActiveTab('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>Adjust Goal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Primary 5-Slot Dock: [Quiz] [AI Tutor] [Visual Daily Goal Streak Counter] [History] [Profile] */}
      <div className="max-w-md mx-auto px-1.5 pt-1 pb-1 flex items-center justify-around gap-1">
        {leftNavItems.map(renderNavItem)}

        {/* Dedicated Visual Daily Study Goal Streak Counter Pill */}
        <button
          type="button"
          data-testid="mobile-bottom-streak-counter"
          onClick={() => setIsStreakSheetOpen((prev) => !prev)}
          aria-expanded={isStreakSheetOpen}
          aria-label={`Daily study goal streak: ${consecutiveGoalDays} consecutive days. Today's progress: ${todayCount} of ${resolvedDailyGoal} questions`}
          title={`Consecutive Daily Study Goal Streak: ${consecutiveGoalDays} day${
            consecutiveGoalDays === 1 ? '' : 's'
          } (${todayCount}/${resolvedDailyGoal} Qs today)`}
          className={`relative px-2.5 py-1 min-h-[48px] min-w-[68px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer active:scale-95 ${
            isTodayGoalMet
              ? 'bg-gradient-to-b from-emerald-50 to-teal-50/90 dark:from-emerald-950/90 dark:to-slate-900 border-emerald-400/80 text-emerald-900 dark:text-emerald-200 shadow-2xs'
              : 'bg-gradient-to-b from-amber-50/95 to-orange-50/90 dark:from-orange-950/80 dark:to-slate-900 border-amber-300 dark:border-orange-500/50 text-orange-950 dark:text-amber-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-1">
            {isTodayGoalMet ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600 dark:text-amber-400 shrink-0" />
            )}
            <span className="text-xs font-black tracking-tight tabular-nums leading-none">
              {consecutiveGoalDays}d
            </span>
          </div>

          <span className="text-[9.5px] font-extrabold tracking-tight leading-none tabular-nums opacity-90">
            {isTodayGoalMet ? 'Goal Met' : `${todayCount}/${resolvedDailyGoal} Qs`}
          </span>

          {/* Mini Embedded Goal Bar */}
          <div className="w-11 h-1 rounded-full bg-slate-200/90 dark:bg-slate-700 overflow-hidden mt-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isTodayGoalMet ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${todayProgressPct}%` }}
            />
          </div>
        </button>

        {rightNavItems.map(renderNavItem)}
      </div>
    </nav>
  );
};

