import React, { useMemo } from 'react';
import {
  Flame,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  MapPin,
  Heart,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { CohortLeaderboardEntry } from '../lib/supabase';

export interface StreakLeaderboardProps {
  entries: CohortLeaderboardEntry[];
  kudosGiven: Record<string, boolean>;
  onGiveKudos: (id: string) => void;
  currentUserStreakDays: number;
}

export const StreakLeaderboard: React.FC<StreakLeaderboardProps> = ({
  entries,
  kudosGiven,
  onGiveKudos,
  currentUserStreakDays,
}) => {
  // Exclusively rank learners by continuous study streak days (tie-breaking by accuracy then totalAnswered)
  const rankedByStreak = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.totalAnswered - a.totalAnswered;
    });
  }, [entries]);

  const topTenStreakLeaders = useMemo(() => rankedByStreak.slice(0, 10), [rankedByStreak]);
  const maxStreakDays = useMemo(
    () => Math.max(1, topTenStreakLeaders[0]?.streakDays || 1),
    [topTenStreakLeaders]
  );

  const currentUserStreakRank = useMemo(() => {
    const idx = rankedByStreak.findIndex((item) => item.isCurrentUser);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedByStreak]);

  const getStreakTierLabel = (days: number) => {
    if (days >= 25) {
      return {
        label: 'Unbreakable Flame',
        badgeClass:
          'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/50',
      };
    }
    if (days >= 14) {
      return {
        label: '2-Week Iron Streak',
        badgeClass:
          'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-400/50',
      };
    }
    if (days >= 7) {
      return {
        label: '7-Day Momentum',
        badgeClass:
          'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-400/50',
      };
    }
    return {
      label: 'Active Spark',
      badgeClass:
        'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-400/50',
    };
  };

  return (
    <section
      aria-label="Global Harambee Azure Cohort Top 10 Streak Leaderboard"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300/70 dark:border-amber-500/30 shadow-xs overflow-hidden"
    >
      {/* Header Banner */}
      <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-sky-500/10 border-b border-amber-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Streak Leaderboard • Top 10 Continuous Study Streaks
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                Global Harambee Azure Cohort
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Exclusively ranked by consecutive daily AZ-900 practice streak days across the cohort.
            </p>
          </div>
        </div>

        {/* Current User Streak Status Pill */}
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-amber-300/60 dark:border-slate-700 shrink-0">
          <Flame className="w-4 h-4 text-orange-500 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Your Streak: </span>
            <strong className="font-mono font-black text-slate-900 dark:text-white tabular-nums">
              {currentUserStreakDays} {currentUserStreakDays === 1 ? 'day' : 'days'}
            </strong>
            {currentUserStreakRank !== null && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-sky-500/15 text-[#0078D4] dark:text-sky-300 font-mono font-bold text-[10px] tabular-nums">
                Rank #{currentUserStreakRank}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top 3 Streak Podium Strip */}
      {topTenStreakLeaders.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-amber-50/40 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800">
          {topTenStreakLeaders.slice(0, 3).map((leader, idx) => {
            const rank = idx + 1;
            const tier = getStreakTierLabel(leader.streakDays);
            return (
              <div
                key={leader.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  rank === 1
                    ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/70 dark:from-amber-950/35 dark:to-slate-900 border-amber-400/70 shadow-xs'
                    : rank === 2
                    ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 border-orange-300/70 dark:border-orange-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : rank === 2
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                        : 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-400/40'
                    }`}
                  >
                    #{rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{leader.avatar}</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {leader.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                      <span className="truncate">{leader.location}</span>
                    </div>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${tier.badgeClass}`}
                    >
                      {tier.label}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-400/40 text-orange-700 dark:text-orange-300 font-mono font-black text-sm tabular-nums">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span>{leader.streakDays}d</span>
                  </div>
                  <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                    {leader.accuracy}% acc
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top 10 Continuous Streak Ranking List */}
      <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
        {topTenStreakLeaders.map((entry, idx) => {
          const rank = idx + 1;
          const progressPct = Math.max(8, Math.min(100, Math.round((entry.streakDays / maxStreakDays) * 100)));
          const tier = getStreakTierLabel(entry.streakDays);
          const hasKudos = Boolean(kudosGiven[entry.id]);

          return (
            <div
              key={entry.id}
              className={`px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                entry.isCurrentUser
                  ? 'bg-sky-50/80 dark:bg-sky-950/30'
                  : rank <= 3
                  ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Left: Rank + Scholar Identity */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${
                    rank === 1
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : rank === 2
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : rank === 3
                      ? 'bg-orange-400/30 text-orange-800 dark:text-orange-200 border border-orange-400/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {rank <= 3 ? <Trophy className="w-3.5 h-3.5" /> : `#${rank}`}
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg shrink-0">
                  {entry.avatar}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {entry.name}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="px-1.5 py-0.5 rounded bg-[#0078D4] text-white text-[9px] font-black uppercase">
                        You
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${tier.badgeClass}`}
                    >
                      {tier.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{entry.location}</span>
                    <span>•</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      {entry.chapter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Continuous Streak Bar, Days Counter & Kudos */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                <div className="w-28 sm:w-36 hidden md:block">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1 tabular-nums">
                    <span>Streak Momentum</span>
                    <span>{progressPct}% of #1</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40 text-amber-800 dark:text-amber-300 font-mono font-black text-xs sm:text-sm tabular-nums">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                  <span>{entry.streakDays}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                    days
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onGiveKudos(entry.id)}
                  disabled={hasKudos}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 font-mono tabular-nums cursor-pointer ${
                    hasKudos
                      ? 'bg-rose-500/15 border-rose-400/40 text-rose-600 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400/50 hover:text-rose-600'
                  }`}
                  title={hasKudos ? 'Harambee Kudos sent!' : 'Send Harambee Streak Kudos'}
                >
                  <Heart className={`w-3.5 h-3.5 ${hasKudos ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{entry.kudosCount}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Top 10 continuous study streaks verified in the Global Harambee Azure Cohort</span>
        </span>
        <span className="font-mono tabular-nums">
          #1 Streak: {topTenStreakLeaders[0]?.streakDays ?? 0} consecutive days
        </span>
      </div>
    </section>
  );
};
