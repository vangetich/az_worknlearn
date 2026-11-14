import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  Sparkles,
  Share2,
  CheckCircle2,
  Award,
  Users,
  X,
  Zap,
  Copy,
  Check,
  TrendingUp,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

const GOAL_100_CELEBRATED_KEY = 'az900_daily_goal_100_celebrated_v1';
const COHORT_SHARES_STORAGE_KEY = 'az900_cohort_goal_shares_v1';

export interface CohortGoalShareItem {
  id: string;
  authorName: string;
  streakDays: number;
  questionsSolved: number;
  dailyGoal: number;
  accuracyPct: number;
  timestamp: number;
  message: string;
  reactions: number;
  isCurrentUser?: boolean;
}

const DEFAULT_COHORT_SHARES: CohortGoalShareItem[] = [
  {
    id: 'peer-1',
    authorName: 'Amina W. (Nairobi Chamber)',
    streakDays: 9,
    questionsSolved: 15,
    dailyGoal: 15,
    accuracyPct: 87,
    timestamp: Date.now() - 18 * 60 * 1000,
    message: '100% daily goal locked in! Shared Responsibility & Entra ID RBAC drilled cleanly.',
    reactions: 14,
  },
  {
    id: 'peer-2',
    authorName: 'David K. (Mombasa Edge)',
    streakDays: 6,
    questionsSolved: 10,
    dailyGoal: 10,
    accuracyPct: 82,
    timestamp: Date.now() - 47 * 60 * 1000,
    message: 'Hit 100% of my daily target on a 6-day fire streak! Harambee spirit stays undefeated.',
    reactions: 11,
  },
];

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function hasCelebrated100Today(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(GOAL_100_CELEBRATED_KEY) === getTodayDateKey();
  } catch {
    return false;
  }
}

function markCelebrated100Today(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOAL_100_CELEBRATED_KEY, getTodayDateKey());
  } catch {
    // ignore storage errors
  }
}

function loadCohortShares(): CohortGoalShareItem[] {
  if (typeof window === 'undefined') return DEFAULT_COHORT_SHARES;
  try {
    const raw = localStorage.getItem(COHORT_SHARES_STORAGE_KEY);
    if (!raw) return DEFAULT_COHORT_SHARES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_COHORT_SHARES;
  } catch {
    return DEFAULT_COHORT_SHARES;
  }
}

interface DailyGoalCelebrationModalProps {
  stats: UserStats;
  todayAnsweredCount: number;
  dailyGoal: number;
  isOpen?: boolean;
  onClose?: () => void;
  userEmail?: string | null;
  onNavigateToCohort?: () => void;
}

export const DailyGoalCelebrationModal: React.FC<DailyGoalCelebrationModalProps> = ({
  stats,
  todayAnsweredCount,
  dailyGoal,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  userEmail,
  onNavigateToCohort,
}) => {
  const [autoOpen, setAutoOpen] = useState<boolean>(false);
  const [flameIntensity, setFlameIntensity] = useState<1 | 2 | 3>(2);
  const [emberBurstKey, setEmberBurstKey] = useState<number>(0);
  const [streakBurstCount, setStreakBurstCount] = useState<number>(1);
  const [customPeerNote, setCustomPeerNote] = useState<string>('');
  const [hasSharedToCohort, setHasSharedToCohort] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [cohortShares, setCohortShares] = useState<CohortGoalShareItem[]>(loadCohortShares);
  const prevAnsweredRef = useRef<number>(todayAnsweredCount);

  const safeGoal = Math.max(1, dailyGoal || 10);
  const completionPct = Math.min(100, Math.round((todayAnsweredCount / safeGoal) * 100));
  const effectiveStreak = Math.max(1, stats.streakDays || 1);

  const overallAccuracy = useMemo(() => {
    if (!stats.totalAnswered || stats.totalAnswered <= 0) return 85;
    return Math.round((stats.totalCorrect / stats.totalAnswered) * 100);
  }, [stats.totalAnswered, stats.totalCorrect]);

  const isModalVisible = Boolean(externalIsOpen || autoOpen);

  const cohortSocialComparison = useMemo(() => {
    const cohortAvgAccuracy = 76;
    const cohortMedianStreak = 4;
    const accuracyDelta = overallAccuracy - cohortAvgAccuracy;
    const percentile = Math.max(
      1,
      Math.min(25, Math.round(18 - effectiveStreak * 1.1 - Math.max(0, accuracyDelta) * 0.35))
    );
    const badgeTier =
      effectiveStreak >= 7 || overallAccuracy >= 85
        ? 'Gold Savanna Vanguard'
        : effectiveStreak >= 3 || overallAccuracy >= 75
        ? 'Silver Rift Scholar'
        : 'Bronze Cloud Rising';

    return {
      cohortAvgAccuracy,
      cohortMedianStreak,
      accuracyDelta,
      percentile,
      badgeTier,
    };
  }, [overallAccuracy, effectiveStreak]);

  const fireCelebrationConfetti = (intensity: 1 | 2 | 3 = 2) => {
    try {
      const colors = ['#F97316', '#F59E0B', '#EF4444', '#10B981', '#0078D4', '#38BDF8'];
      confetti({
        particleCount: intensity === 3 ? 110 : intensity === 2 ? 80 : 60,
        spread: intensity === 3 ? 95 : 75,
        origin: { x: 0.5, y: 0.35 },
        colors,
      });
      if (intensity >= 2) {
        setTimeout(() => {
          try {
            confetti({
              particleCount: 45,
              angle: 60,
              spread: 55,
              origin: { x: 0.15, y: 0.55 },
              colors,
            });
            confetti({
              particleCount: 45,
              angle: 120,
              spread: 55,
              origin: { x: 0.85, y: 0.55 },
              colors,
            });
          } catch {
            // ignore
          }
        }, 220);
      }
    } catch {
      // ignore in non-DOM/SSR environments
    }
  };

  // Automatically trigger when user hits 100% of their daily streak target during active practice
  useEffect(() => {
    const prevCount = prevAnsweredRef.current;
    prevAnsweredRef.current = todayAnsweredCount;

    if (todayAnsweredCount > prevCount && todayAnsweredCount >= safeGoal) {
      if (!hasCelebrated100Today()) {
        markCelebrated100Today();
        setAutoOpen(true);
        setFlameIntensity(2);
        fireCelebrationConfetti(3);
      }
    }
  }, [todayAnsweredCount, safeGoal]);

  const handleClose = () => {
    setAutoOpen(false);
    if (externalOnClose) {
      externalOnClose();
    }
  };

  useEffect(() => {
    if (!isModalVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAutoOpen(false);
        if (externalOnClose) externalOnClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalVisible, externalOnClose]);

  const handleIgniteFlameBoost = () => {
    const nextLevel: 1 | 2 | 3 = flameIntensity === 1 ? 2 : flameIntensity === 2 ? 3 : 1;
    setFlameIntensity(nextLevel);
    setEmberBurstKey((prev) => prev + 1);
    setStreakBurstCount((prev) => prev + 1);
    fireCelebrationConfetti(nextLevel);
  };

  const learnerDisplayName = useMemo(() => {
    if (userEmail && userEmail.includes('@')) {
      const prefix = userEmail.split('@')[0];
      return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} (Harambee Scholar)`;
    }
    return 'You (Harambee Azure Scholar)';
  }, [userEmail]);

  const shareMessageText = useMemo(() => {
    const deltaSign =
      cohortSocialComparison.accuracyDelta >= 0
        ? `+${cohortSocialComparison.accuracyDelta}%`
        : `${cohortSocialComparison.accuracyDelta}%`;
    const customSuffix = customPeerNote.trim() ? ` — "${customPeerNote.trim()}"` : '';
    return `🏅 [AZ-900 Daily Goal Reached • Top ${cohortSocialComparison.percentile}% of Cohort] Solved ${Math.max(todayAnsweredCount, safeGoal)}/${safeGoal} Qs today on a ${effectiveStreak}-day fire streak • ${overallAccuracy}% accuracy (${deltaSign} vs. ${cohortSocialComparison.cohortAvgAccuracy}% Harambee Cohort avg) • Badge: ${cohortSocialComparison.badgeTier}!${customSuffix} #AZ900 #HarambeeCloud`;
  }, [
    todayAnsweredCount,
    safeGoal,
    effectiveStreak,
    overallAccuracy,
    cohortSocialComparison,
    customPeerNote,
  ]);

  const handleShareWithCohortPeers = async () => {
    const defaultNote = `Unlocked ${cohortSocialComparison.badgeTier} Badge (Top ${cohortSocialComparison.percentile}% of Cohort)! Completed ${Math.max(todayAnsweredCount, safeGoal)}/${safeGoal} Qs on a ${effectiveStreak}-day fire streak! 🔥`;
    const newShare: CohortGoalShareItem = {
      id: `share-${Date.now()}`,
      authorName: learnerDisplayName,
      streakDays: effectiveStreak,
      questionsSolved: Math.max(todayAnsweredCount, safeGoal),
      dailyGoal: safeGoal,
      accuracyPct: overallAccuracy,
      timestamp: Date.now(),
      message: customPeerNote.trim() ? `${customPeerNote.trim()} (${defaultNote})` : defaultNote,
      reactions: 18,
      isCurrentUser: true,
    };

    const updated = [newShare, ...cohortShares.filter((s) => !s.isCurrentUser)].slice(0, 6);
    setCohortShares(updated);
    setHasSharedToCohort(true);
    setStreakBurstCount((prev) => prev + 1);
    fireCelebrationConfetti(3);

    try {
      localStorage.setItem(COHORT_SHARES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareMessageText);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 3500);
      }
    } catch {
      // ignore clipboard errors
    }
  };

  const handleReactToPeer = (id: string) => {
    setCohortShares((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, reactions: item.reactions + 1 } : item
      );
      try {
        localStorage.setItem(COHORT_SHARES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!isModalVisible || typeof document === 'undefined') return null;

  const flameTitle =
    flameIntensity === 3
      ? 'Supernova Harambee Blaze (3x Fire-Streak)'
      : flameIntensity === 2
      ? 'Rift Valley Firestorm (2x Fire-Streak)'
      : 'Savanna Streak Flame (1x Fire-Streak)';

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-start sm:items-center justify-center pt-20 sm:pt-24 pb-4 px-3 sm:px-6 overflow-y-auto overscroll-contain bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-goal-celebration-title"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-auto rounded-3xl bg-gradient-to-b from-slate-950 via-[#0f172a] to-[#1e1b4b] text-white border-2 border-amber-400/80 shadow-2xl overflow-hidden max-h-[calc(100dvh-6.5rem)] flex flex-col"
      >
        <KitengeRibbon height={4} />

        {/* Ambient Animated Fire Glow Backdrop */}
        <div
          className={`pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 rounded-full blur-3xl transition-all duration-500 ${
            flameIntensity === 3
              ? 'w-80 h-80 bg-gradient-to-tr from-red-500/45 via-orange-500/45 to-amber-300/45 scale-110'
              : flameIntensity === 2
              ? 'w-72 h-72 bg-gradient-to-tr from-orange-500/35 via-amber-500/35 to-yellow-300/30 scale-105'
              : 'w-64 h-64 bg-gradient-to-tr from-orange-500/25 via-amber-500/25 to-emerald-400/20'
          }`}
        />

        {/* Top Modal Header */}
        <div className="relative z-10 px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs flex items-center gap-1">
              <Flame className="w-3 h-3 fill-slate-950" />
              <span>100% Daily Streak Target Reached</span>
            </span>
            <span className="text-[11px] font-extrabold text-amber-300 tabular-nums">
              {effectiveStreak}-Day Fire Streak 🔥
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Daily Goal Celebration Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Celebration Content */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Interactive Fire-Streaking Centerpiece Stage */}
          <div className="relative rounded-2xl bg-slate-950/60 border border-amber-400/35 p-4 flex flex-col items-center text-center space-y-3 overflow-hidden">
            {/* Animated Fire-Streaking Comet Trails Across Stage */}
            <svg
              key={`streaks-${emberBurstKey}-${flameIntensity}`}
              className="pointer-events-none absolute inset-0 w-full h-full opacity-85"
              viewBox="0 0 400 160"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="fireStreakGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
                  <stop offset="50%" stopColor="#F97316" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#FDE047" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="fireStreakGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                  <stop offset="55%" stopColor="#FB923C" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#FEF08A" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {/* Left-to-Center & Right-to-Center Dynamic Fire Streak Arcs */}
              <path
                d="M 15 145 Q 110 75 195 45"
                stroke="url(#fireStreakGrad1)"
                strokeWidth={flameIntensity === 3 ? 4 : 2.5}
                strokeLinecap="round"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
              <path
                d="M 385 145 Q 290 75 205 45"
                stroke="url(#fireStreakGrad2)"
                strokeWidth={flameIntensity === 3 ? 4 : 2.5}
                strokeLinecap="round"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
              {flameIntensity >= 2 && (
                <>
                  <path
                    d="M 40 155 Q 140 95 190 60"
                    stroke="url(#fireStreakGrad1)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 360 155 Q 260 95 210 60"
                    stroke="url(#fireStreakGrad2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              )}
              {flameIntensity === 3 && (
                <>
                  <circle cx="95" cy="95" r="3.5" fill="#FDE047" className="animate-ping" />
                  <circle cx="305" cy="95" r="3.5" fill="#FB923C" className="animate-ping" />
                  <circle cx="200" cy="24" r="4" fill="#FEF08A" className="animate-ping" />
                </>
              )}
            </svg>

            <div className="relative flex items-center justify-center pt-1">
              {/* Rising Animated Embers */}
              <div
                key={emberBurstKey}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ember-drift-1 absolute -top-2 left-2" />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ember-drift-2 absolute -top-3 right-2" />
                <span className="w-3 h-3 rounded-full bg-red-400 animate-ember-drift-3 absolute -top-4 left-1/2" />
                <span className="w-2 h-2 rounded-full bg-yellow-200 animate-ember-drift-4 absolute -top-1 right-5" />
              </div>

              {/* Interactive Fire-Streaking Center Button */}
              <button
                type="button"
                onClick={handleIgniteFlameBoost}
                title="Click to stoke the interactive fire-streaking animation and launch celebratory confetti!"
                className={`group relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer border-2 shadow-2xl ${
                  flameIntensity === 3
                    ? 'bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 border-yellow-200 scale-110 shadow-orange-500/50'
                    : flameIntensity === 2
                    ? 'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 border-amber-200 scale-105 shadow-amber-500/40'
                    : 'bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 border-amber-300 hover:scale-105'
                }`}
              >
                <Flame
                  className={`text-white drop-shadow-md transition-transform duration-300 ${
                    flameIntensity === 3
                      ? 'w-12 h-12 fill-yellow-200 animate-bounce'
                      : flameIntensity === 2
                      ? 'w-11 h-11 fill-amber-200 scale-110'
                      : 'w-10 h-10 fill-amber-100 group-hover:scale-110'
                  }`}
                />
                <span className="text-[11px] font-black text-slate-950 bg-white/95 px-2 py-0.5 rounded-full mt-1 shadow-2xs tabular-nums">
                  { Math.max(100, completionPct) }% • {effectiveStreak}d
                </span>
                <Sparkles className="w-4 h-4 text-yellow-200 absolute -top-2 -right-2 animate-sparkle-1" />
                <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute -bottom-1.5 -left-1.5 animate-sparkle-2" />
              </button>
            </div>

            <div className="relative z-10">
              <h2
                id="daily-goal-celebration-title"
                className="text-lg sm:text-xl font-black tracking-tight text-white"
              >
                Hongera! 100% Daily Streak Target Hit! 🔥
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                You completed{' '}
                <strong className="text-amber-300 tabular-nums">
                  {Math.max(todayAnsweredCount, safeGoal)}/{safeGoal} questions
                </strong>{' '}
                today and ignited your{' '}
                <strong className="text-orange-300 tabular-nums">
                  {effectiveStreak}-day active study streak
                </strong>
                .
              </p>
            </div>

            {/* Interactive Fire-Streak Intensity Selector & Stoke Control */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5">
              {([1, 2, 3] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setFlameIntensity(lvl);
                    setEmberBurstKey((prev) => prev + 1);
                    setStreakBurstCount((prev) => prev + 1);
                    fireCelebrationConfetti(lvl);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                    flameIntensity === lvl
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-yellow-200 shadow-sm'
                      : 'bg-white/10 text-amber-200 border-white/15 hover:bg-white/20'
                  }`}
                >
                  {lvl === 1 ? '1x Savanna Flame' : lvl === 2 ? '2x Rift Firestorm' : '3x Supernova Blaze'}
                </button>
              ))}
              <button
                type="button"
                onClick={handleIgniteFlameBoost}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-500/25 hover:bg-orange-500/40 border border-amber-400/60 text-[10.5px] font-black text-amber-200 transition-all cursor-pointer active:scale-95"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>Stoke Fire Streak ({streakBurstCount}x)</span>
              </button>
            </div>
          </div>

          {/* Shareable Progress Badge & 'Share Progress' Action for Cohort Peers */}
          <div
            aria-label="Shareable Progress Badge for Social Comparison"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0c2d48] to-indigo-950 border-2 border-amber-400/70 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-md shrink-0 border border-yellow-200">
                  <Award className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-amber-200 font-bold">
                    <span>Cohort Social Comparison Badge</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-300 font-black">
                      Top {cohortSocialComparison.percentile}% of Cohort
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white truncate mt-0.5">
                    {cohortSocialComparison.badgeTier} • {learnerDisplayName}
                  </h3>
                </div>
              </div>
              <MaasaiMedallion size={20} />
            </div>

            {/* 3-Column Social Comparison Metrics (You vs. Harambee Cohort Peers) */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-950/65 border border-white/10">
                <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                  Daily Target
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-300 block tabular-nums">
                  {Math.max(todayAnsweredCount, safeGoal)}/{safeGoal} Qs
                </span>
                <span className="text-[9.5px] font-bold text-emerald-400/90">
                  100% Quota Hit
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950/65 border border-white/10">
                <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                  Accuracy vs Peers
                </span>
                <span className="text-xs sm:text-sm font-black text-sky-300 block tabular-nums">
                  {overallAccuracy}% vs {cohortSocialComparison.cohortAvgAccuracy}%
                </span>
                <span
                  className={`text-[9.5px] font-bold tabular-nums ${
                    cohortSocialComparison.accuracyDelta >= 0
                      ? 'text-emerald-300'
                      : 'text-amber-300'
                  }`}
                >
                  {cohortSocialComparison.accuracyDelta >= 0
                    ? `+${cohortSocialComparison.accuracyDelta}% Above Avg`
                    : `${cohortSocialComparison.accuracyDelta}% vs Peer Avg`}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950/65 border border-white/10">
                <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                  Streak Rank
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300 block tabular-nums">
                  🔥 {effectiveStreak}d vs {cohortSocialComparison.cohortMedianStreak}d
                </span>
                <span className="text-[9.5px] font-bold text-amber-200">
                  Top {cohortSocialComparison.percentile}% Rank
                </span>
              </div>
            </div>

            {/* Optional Custom Message Input for Cohort Peers */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={customPeerNote}
                onChange={(e) => setCustomPeerNote(e.target.value)}
                placeholder="Add a quick encouragement note for your Harambee cohort peers (optional)..."
                maxLength={120}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/75 border border-white/15 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10.5px] text-slate-300 bg-slate-950/65 p-2 rounded-xl border border-white/10 font-medium leading-relaxed">
                “{shareMessageText}”
              </p>
            </div>

            {copiedSummary && (
              <div className="text-[10.5px] font-extrabold text-emerald-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Progress summary copied &amp; shared with cohort peers!</span>
              </div>
            )}

            {/* Primary 'Share Progress' Button for Cohort Peers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareWithCohortPeers}
                className={`flex-1 min-w-[190px] py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  hasSharedToCohort
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                    : 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-300 hover:to-orange-400 text-slate-950'
                }`}
              >
                {hasSharedToCohort ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Progress Shared with Cohort Peers!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share Progress with Cohort Peers</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareMessageText);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 3000);
                  } catch {
                    // ignore
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy shareable progress badge text"
              >
                {copiedSummary ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Badge</span>
              </button>
            </div>
          </div>

          {/* Live Cohort Peer Celebrations Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Live Cohort Peer Streak Feed ({cohortShares.length})</span>
              </span>
              {onNavigateToCohort && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToCohort();
                  }}
                  className="text-amber-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Open Cohort Hub</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {cohortShares.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2.5 ${
                    item.isCurrentUser
                      ? 'bg-amber-500/15 border-amber-400/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white truncate">
                        {item.authorName}
                      </span>
                      <span className="text-[10px] font-black text-amber-300 tabular-nums">
                        · 🔥 {item.streakDays}d Streak
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold tabular-nums">
                        · {item.questionsSolved}/{item.dailyGoal} Qs ({item.accuracyPct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {item.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReactToPeer(item.id)}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-amber-500/30 border border-white/15 text-[10px] font-black text-amber-200 flex items-center gap-1 shrink-0 transition-colors cursor-pointer tabular-nums"
                    title="Send fire kudos to cohort peer"
                  >
                    <Flame className="w-3 h-3 fill-amber-400 text-orange-400" />
                    <span>{item.reactions}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-4 sm:px-6 py-3 bg-slate-950/90 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Daily consistency builds AZ-900 exam speed &amp; cohort momentum</span>
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition-colors cursor-pointer"
          >
            Continue Studying
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
