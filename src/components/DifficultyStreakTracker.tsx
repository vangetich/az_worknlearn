import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Flame,
  Layers,
  Target,
  Award,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';

export type DifficultyTier = 'Fundamental' | 'Intermediate' | 'Advanced';

export interface DifficultyTierStreakMetrics {
  tier: DifficultyTier;
  shortCode: 'F' | 'I' | 'A';
  currentStreak: number;
  bestStreak: number;
  totalCorrect: number;
  totalAttempts: number;
  accuracyPct: number;
  targetStreak: number;
  isGoalMet: boolean;
}

interface DifficultyStreakTrackerProps {
  stats: UserStats;
  questions: Question[];
  activeDifficulty?: DifficultyTier;
  onSelectDifficultyForPractice?: (difficulty: DifficultyTier) => void;
  compact?: boolean;
}

const TIER_ORDER: DifficultyTier[] = ['Fundamental', 'Intermediate', 'Advanced'];

const TIER_META: Record<
  DifficultyTier,
  {
    shortCode: 'F' | 'I' | 'A';
    label: string;
    subtitle: string;
    badgeBg: string;
    badgeText: string;
    barColor: string;
    targetStreak: number;
  }
> = {
  Fundamental: {
    shortCode: 'F',
    label: 'Fundamental',
    subtitle: 'Core definitions, cloud models & service roles',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
    barColor: '#059669',
    targetStreak: 5,
  },
  Intermediate: {
    shortCode: 'I',
    label: 'Intermediate',
    subtitle: 'Scenario architecture, SLA & governance rules',
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-[#0078D4]',
    barColor: '#0078D4',
    targetStreak: 5,
  },
  Advanced: {
    shortCode: 'A',
    label: 'Advanced',
    subtitle: 'Multi-constraint exam traps & Zero-Trust edge cases',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-900',
    barColor: '#D97706',
    targetStreak: 5,
  },
};

export function computeDifficultyStreaks(
  stats: UserStats,
  questions: Question[]
): Record<DifficultyTier, DifficultyTierStreakMetrics> {
  const questionDifficultyMap = new Map<string, DifficultyTier>();
  questions.forEach((q) => {
    if (
      q.difficulty === 'Fundamental' ||
      q.difficulty === 'Intermediate' ||
      q.difficulty === 'Advanced'
    ) {
      questionDifficultyMap.set(q.id, q.difficulty);
    }
  });

  // Collect chronological attempts per difficulty tier
  const attemptsByTier: Record<
    DifficultyTier,
    Array<{ isCorrect: boolean; timestamp: number; questionId: string }>
  > = {
    Fundamental: [],
    Intermediate: [],
    Advanced: [],
  };

  Object.entries(stats.attempts || {}).forEach(([questionId, attemptList]) => {
    if (!Array.isArray(attemptList) || attemptList.length === 0) return;

    // Infer tier from question bank or deterministic fallback based on questionId
    let tier = questionDifficultyMap.get(questionId);
    if (!tier) {
      const numericSeed = questionId
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      tier = TIER_ORDER[numericSeed % 3];
    }

    attemptList.forEach((att) => {
      attemptsByTier[tier!].push({
        isCorrect: Boolean(att.isCorrect),
        timestamp: att.timestamp || 0,
        questionId,
      });
    });
  });

  const result = {} as Record<DifficultyTier, DifficultyTierStreakMetrics>;

  TIER_ORDER.forEach((tier) => {
    const sorted = [...attemptsByTier[tier]].sort((a, b) => a.timestamp - b.timestamp);
    let currentStreak = 0;
    let bestStreak = 0;
    let totalCorrect = 0;

    sorted.forEach((item) => {
      if (item.isCorrect) {
        totalCorrect += 1;
        currentStreak += 1;
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    });

    const totalAttempts = sorted.length;
    const accuracyPct =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const targetStreak = TIER_META[tier].targetStreak;

    result[tier] = {
      tier,
      shortCode: TIER_META[tier].shortCode,
      currentStreak,
      bestStreak,
      totalCorrect,
      totalAttempts,
      accuracyPct,
      targetStreak,
      isGoalMet: currentStreak >= targetStreak,
    };
  });

  return result;
}

export const DifficultyStreakTracker: React.FC<DifficultyStreakTrackerProps> = ({
  stats,
  questions,
  activeDifficulty,
  onSelectDifficultyForPractice,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const streakByTier = useMemo(
    () => computeDifficultyStreaks(stats, questions),
    [stats, questions]
  );

  const activeTiersCount = useMemo(() => {
    return TIER_ORDER.filter((t) => streakByTier[t].currentStreak > 0).length;
  }, [streakByTier]);

  const lowestStreakTier = useMemo<DifficultyTier>(() => {
    return [...TIER_ORDER].sort(
      (a, b) => streakByTier[a].currentStreak - streakByTier[b].currentStreak
    )[0];
  }, [streakByTier]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Difficulty Streak Tracker: Fundamental ${streakByTier.Fundamental.currentStreak}, Intermediate ${streakByTier.Intermediate.currentStreak}, Advanced ${streakByTier.Advanced.currentStreak}`}
        title="Difficulty Streak Tracker: Separate streak counters for Fundamental (F), Intermediate (I), and Advanced (A) difficulty levels"
        className={`flex items-center gap-1.5 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${
          compact
            ? 'px-2 py-1 mobile-landscape:px-1.5 mobile-landscape:py-0.5 text-[10px]'
            : 'px-2.5 py-1.5 text-xs'
        } ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-sky-400/50'
            : activeTiersCount === 3
            ? 'bg-amber-50/90 hover:bg-amber-100/80 text-slate-900 border-amber-300/90'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90'
        }`}
      >
        <Flame
          className={`w-3.5 h-3.5 shrink-0 ${
            activeTiersCount === 3
              ? 'text-orange-500 fill-amber-400'
              : activeTiersCount > 0
              ? 'text-[#0078D4]'
              : 'text-slate-400'
          }`}
        />

        {!compact && (
          <span className="font-extrabold tracking-tight hidden xl:inline whitespace-nowrap">
            Diff Streaks
          </span>
        )}

        {/* Three Separate Difficulty Streak Counters (F / I / A) */}
        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-[10.5px] whitespace-nowrap">
          <span
            className={
              isOpen
                ? 'text-emerald-300'
                : streakByTier.Fundamental.currentStreak > 0
                ? 'text-emerald-700 font-black'
                : 'text-slate-500'
            }
            title={`Fundamental Streak: ${streakByTier.Fundamental.currentStreak}`}
          >
            F:{streakByTier.Fundamental.currentStreak}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              isOpen
                ? 'text-sky-300'
                : streakByTier.Intermediate.currentStreak > 0
                ? 'text-[#0078D4] font-black'
                : 'text-slate-500'
            }
            title={`Intermediate Streak: ${streakByTier.Intermediate.currentStreak}`}
          >
            I:{streakByTier.Intermediate.currentStreak}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              isOpen
                ? 'text-amber-300'
                : streakByTier.Advanced.currentStreak > 0
                ? 'text-amber-700 font-black'
                : 'text-slate-500'
            }
            title={`Advanced Streak: ${streakByTier.Advanced.currentStreak}`}
          >
            A:{streakByTier.Advanced.currentStreak}
          </span>
        </span>

        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Interactive Difficulty Spectrum Streak Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Difficulty Spectrum Streak Breakdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 space-y-3.5 text-left animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#0078D4] shrink-0" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Difficulty Spectrum Streak Tracker
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Maintain consecutive correct streaks across all 3 AZ-900 difficulty tiers
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close Difficulty Streak Tracker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Spectrum Consistency Banner */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
              <span className="font-semibold">Spectrum Consistency:</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-slate-900">
              {activeTiersCount}/3 Tiers Active
            </span>
          </div>

          {/* Separate Streak Counters for Fundamental, Intermediate & Advanced */}
          <div className="space-y-2.5">
            {TIER_ORDER.map((tier) => {
              const metrics = streakByTier[tier];
              const meta = TIER_META[tier];
              const progressPct = Math.min(
                100,
                Math.round((metrics.currentStreak / meta.targetStreak) * 100)
              );
              const isCurrentActive = activeDifficulty === tier;

              return (
                <div
                  key={tier}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrentActive
                      ? 'bg-sky-50/60 border-[#0078D4]/50'
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          {meta.label}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10px] font-semibold text-[#0078D4]">
                            · Active Tier
                          </span>
                        )}
                        {metrics.isGoalMet && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate">
                        {meta.subtitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <div className="text-xs font-black text-slate-900 flex items-center justify-end gap-1">
                        <Flame
                          className={`w-3.5 h-3.5 ${
                            metrics.currentStreak > 0
                              ? 'text-orange-500 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                        <span>{metrics.currentStreak} Streak</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Best: {metrics.bestStreak} · {metrics.accuracyPct}% Acc
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar toward 5-Streak Spectrum Milestone */}
                  <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: meta.barColor,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500 font-mono tabular-nums">
                      {metrics.totalCorrect}/{metrics.totalAttempts} correct · Target: {meta.targetStreak} streak
                    </span>

                    {onSelectDifficultyForPractice && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDifficultyForPractice(tier);
                          setIsOpen(false);
                        }}
                        className="font-bold text-[#0078D4] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Practice {meta.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Motivation Callout */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-600">
              Next focus:{' '}
              <strong className="text-slate-900">{lowestStreakTier}</strong> tier to balance your spectrum.
            </span>
            {onSelectDifficultyForPractice && (
              <button
                type="button"
                onClick={() => {
                  onSelectDifficultyForPractice(lowestStreakTier);
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Drill {lowestStreakTier}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
