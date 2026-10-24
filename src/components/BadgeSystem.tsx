import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Compass,
  ShieldCheck,
  Crown,
  Layers,
  Zap,
  Flame,
  Target,
  Bookmark,
  BookOpen,
  ShieldAlert,
  Lock,
  CheckCircle2,
  ChevronRight,
  Info,
  Filter,
  Trophy,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type BadgeCategory = 'all' | 'milestones' | 'mastery' | 'consistency' | 'curriculum';

export interface BadgeDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'milestones' | 'mastery' | 'consistency' | 'curriculum';
  tier: BadgeTier;
  iconName: string;
  proverbQuote: string;
  targetValue: number;
  unit: string;
  isUnlocked: (stats: UserStats, accuracy: number) => boolean;
  getCurrentValue: (stats: UserStats, accuracy: number) => number;
  tipToUnlock: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'cloud-rookie',
    title: 'Cloud Rookie',
    subtitle: 'First Steps into Azure',
    description: 'Answered your first 5 AZ-900 practice questions.',
    category: 'milestones',
    tier: 'bronze',
    iconName: 'Award',
    proverbQuote: '“The journey of a thousand miles begins with a single step.” — African Proverb',
    targetValue: 5,
    unit: 'questions',
    isUnlocked: (stats) => stats.totalAnswered >= 5,
    getCurrentValue: (stats) => stats.totalAnswered,
    tipToUnlock: 'Complete 5 practice questions in any module.',
  },
  {
    id: 'azure-explorer',
    title: 'Azure Explorer',
    subtitle: 'Building Momentum',
    description: 'Completed 25 AZ-900 questions across diverse cloud domains.',
    category: 'milestones',
    tier: 'silver',
    iconName: 'Compass',
    proverbQuote: '“Smooth seas do not make skillful sailors.” — African Proverb',
    targetValue: 25,
    unit: 'questions',
    isUnlocked: (stats) => stats.totalAnswered >= 25,
    getCurrentValue: (stats) => stats.totalAnswered,
    tipToUnlock: 'Answer 25 questions to solidify cloud fundamentals.',
  },
  {
    id: 'cloud-centurion',
    title: 'Cloud Centurion',
    subtitle: 'High-Volume Mastery',
    description: 'Solved 50+ practice questions across official exam objectives.',
    category: 'milestones',
    tier: 'gold',
    iconName: 'ShieldCheck',
    proverbQuote: '“Little by little, a little becomes a lot.” — Swahili Proverb',
    targetValue: 50,
    unit: 'questions',
    isUnlocked: (stats) => stats.totalAnswered >= 50,
    getCurrentValue: (stats) => stats.totalAnswered,
    tipToUnlock: 'Practice consistently until you reach 50 total questions.',
  },
  {
    id: 'azure-architect',
    title: 'Azure Architect',
    subtitle: 'Passing Grade Mastery',
    description: 'Maintained 70%+ accuracy with at least 30 questions answered (official pass benchmark).',
    category: 'mastery',
    tier: 'diamond',
    iconName: 'Crown',
    proverbQuote: '“Wisdom is like a baobab tree; no one person can embrace it alone.” — African Proverb',
    targetValue: 70,
    unit: '% accuracy',
    isUnlocked: (stats, accuracy) => stats.totalAnswered >= 30 && accuracy >= 70,
    getCurrentValue: (stats, accuracy) => (stats.totalAnswered >= 30 ? accuracy : Math.min(69, accuracy)),
    tipToUnlock: 'Solve at least 30 questions and maintain an accuracy of 70% or higher.',
  },
  {
    id: 'master-of-modules',
    title: 'Master of Modules',
    subtitle: 'Full Curriculum Breadth',
    description: 'Tackled questions across all 3 official Azure Curriculum Learning Paths (Cloud Concepts, Architecture & Services, Governance & Management).',
    category: 'curriculum',
    tier: 'gold',
    iconName: 'Layers',
    proverbQuote: '“A single stick may smoke, but it will not burn without the bundle.” — Harambee Proverb',
    targetValue: 3,
    unit: 'paths practiced',
    isUnlocked: (stats) => {
      const p1 = (stats.pathMastery?.[1]?.total || 0) > 0;
      const p2 = (stats.pathMastery?.[2]?.total || 0) > 0;
      const p3 = (stats.pathMastery?.[3]?.total || 0) > 0;
      return p1 && p2 && p3;
    },
    getCurrentValue: (stats) => {
      let count = 0;
      if ((stats.pathMastery?.[1]?.total || 0) > 0) count++;
      if ((stats.pathMastery?.[2]?.total || 0) > 0) count++;
      if ((stats.pathMastery?.[3]?.total || 0) > 0) count++;
      return count;
    },
    tipToUnlock: 'Answer at least one question in Path 1, Path 2, and Path 3.',
  },
  {
    id: 'cloud-sharpshooter',
    title: 'Cloud Sharpshooter',
    subtitle: 'Elite Accuracy',
    description: 'Achieved 85%+ overall accuracy with 20 or more scenarios solved.',
    category: 'mastery',
    tier: 'diamond',
    iconName: 'Zap',
    proverbQuote: '“Patience and precision pierce the shield.” — African Proverb',
    targetValue: 85,
    unit: '% accuracy',
    isUnlocked: (stats, accuracy) => stats.totalAnswered >= 20 && accuracy >= 85,
    getCurrentValue: (stats, accuracy) => (stats.totalAnswered >= 20 ? accuracy : Math.min(84, accuracy)),
    tipToUnlock: 'Reach 20+ questions answered with an accuracy of 85% or higher.',
  },
  {
    id: 'harambee-consistency',
    title: 'Harambee Consistency',
    subtitle: '3-Day Daily Habit',
    description: 'Maintained an unbroken 3-day consecutive study streak.',
    category: 'consistency',
    tier: 'bronze',
    iconName: 'Flame',
    proverbQuote: '“Harambee: Pull together every day to conquer the mountain.”',
    targetValue: 3,
    unit: 'streak days',
    isUnlocked: (stats) => (stats.streakDays || 1) >= 3,
    getCurrentValue: (stats) => stats.streakDays || 1,
    tipToUnlock: 'Practice at least one question every day for 3 days in a row.',
  },
  {
    id: 'five-day-streak',
    title: '5-Day Study Streak',
    subtitle: 'Unbroken 5-Day Momentum',
    description: 'Completed a 5-day consecutive study streak with steady daily scenario practice.',
    category: 'consistency',
    tier: 'silver',
    iconName: 'Flame',
    proverbQuote: '“Tone na tone huwa mchirizi” — Drop by drop becomes a steady stream.',
    targetValue: 5,
    unit: 'streak days',
    isUnlocked: (stats) => (stats.streakDays || 1) >= 5,
    getCurrentValue: (stats) => stats.streakDays || 1,
    tipToUnlock: 'Practice at least one AZ-900 scenario question daily for 5 consecutive days.',
  },
  {
    id: 'safari-marathon',
    title: 'Safari Marathon',
    subtitle: '7-Day Discipline',
    description: 'Sustained a formidable 7-day daily study streak.',
    category: 'consistency',
    tier: 'gold',
    iconName: 'Flame',
    proverbQuote: '“He who runs alone may run fast, but he who studies daily finishes the marathon.”',
    targetValue: 7,
    unit: 'streak days',
    isUnlocked: (stats) => (stats.streakDays || 1) >= 7,
    getCurrentValue: (stats) => stats.streakDays || 1,
    tipToUnlock: 'Complete daily practice sessions for 7 consecutive days.',
  },
  {
    id: 'goal-crusher',
    title: 'Daily Goal Crusher',
    subtitle: 'Target Achiever',
    description: 'Met or exceeded your configured daily question goal.',
    category: 'consistency',
    tier: 'silver',
    iconName: 'Target',
    proverbQuote: '“When your target is clear, every arrow flies with conviction.”',
    targetValue: 10,
    unit: 'target questions',
    isUnlocked: (stats) => {
      const goal = stats.dailyGoal || 10;
      return stats.totalAnswered >= goal;
    },
    getCurrentValue: (stats) => {
      const goal = stats.dailyGoal || 10;
      return Math.min(stats.totalAnswered, goal);
    },
    tipToUnlock: 'Reach your daily goal target (e.g. 10 questions) in practice mode.',
  },
  {
    id: 'knowledge-curator',
    title: 'Knowledge Curator',
    subtitle: 'Curated Review List',
    description: 'Bookmarked 5 or more key scenarios for targeted review.',
    category: 'curriculum',
    tier: 'bronze',
    iconName: 'Bookmark',
    proverbQuote: '“To know the road ahead, ask those who have marked the stones.”',
    targetValue: 5,
    unit: 'bookmarks',
    isUnlocked: (stats) => (stats.bookmarks?.length || 0) >= 5,
    getCurrentValue: (stats) => stats.bookmarks?.length || 0,
    tipToUnlock: 'Bookmark 5 tricky questions using the bookmark icon on any question card.',
  },
  {
    id: 'concepts-sentinel',
    title: 'Cloud Concepts Sentinel',
    subtitle: 'Path 1 Foundation',
    description: 'Practiced 10+ questions in Learning Path 1 (Cloud Concepts).',
    category: 'curriculum',
    tier: 'silver',
    iconName: 'BookOpen',
    proverbQuote: '“A house built on deep bedrock withstands any storm.”',
    targetValue: 10,
    unit: 'questions in Path 1',
    isUnlocked: (stats) => (stats.pathMastery?.[1]?.total || 0) >= 10,
    getCurrentValue: (stats) => stats.pathMastery?.[1]?.total || 0,
    tipToUnlock: 'Solve 10 questions from Learning Path 1 (Cloud Concepts).',
  },
  {
    id: 'governance-guardian',
    title: 'Governance Guardian',
    subtitle: 'Path 3 Compliance & Cost',
    description: 'Practiced questions in Azure Management & Governance (Path 3).',
    category: 'curriculum',
    tier: 'bronze',
    iconName: 'ShieldAlert',
    proverbQuote: '“Good management preserves the harvest before the dry season.”',
    targetValue: 5,
    unit: 'questions in Path 3',
    isUnlocked: (stats) => (stats.pathMastery?.[3]?.total || 0) >= 5,
    getCurrentValue: (stats) => stats.pathMastery?.[3]?.total || 0,
    tipToUnlock: 'Solve 5 questions from Learning Path 3 (Azure Management & Governance).',
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    subtitle: 'Dawn Discipline',
    description: 'Started a study session before noon or sustained morning learning momentum.',
    category: 'consistency',
    tier: 'silver',
    iconName: 'Sparkles',
    proverbQuote: '“The early bird drinks from the purest spring.” — African Proverb',
    targetValue: 1,
    unit: 'morning session',
    isUnlocked: (stats) => {
      let hasEarly = false;
      Object.values(stats.attempts || {}).forEach((list) => {
        list.forEach((att) => {
          if (att.timestamp) {
            const h = new Date(att.timestamp).getHours();
            if (h >= 5 && h < 12) hasEarly = true;
          }
        });
      });
      return hasEarly || (stats.streakDays || 1) >= 2;
    },
    getCurrentValue: (stats) => {
      let hasEarly = false;
      Object.values(stats.attempts || {}).forEach((list) => {
        list.forEach((att) => {
          if (att.timestamp) {
            const h = new Date(att.timestamp).getHours();
            if (h >= 5 && h < 12) hasEarly = true;
          }
        });
      });
      return hasEarly || (stats.streakDays || 1) >= 2 ? 1 : 0;
    },
    tipToUnlock: 'Complete a study question before 12:00 PM or build a 2-day streak.',
  },
  {
    id: 'master-of-governance',
    title: 'Master of Governance',
    subtitle: 'Policy, Locks & Cost Mastery',
    description: 'Answered 10+ questions in Path 3 (Azure Management & Governance) with 70%+ accuracy.',
    category: 'curriculum',
    tier: 'gold',
    iconName: 'ShieldCheck',
    proverbQuote: '“Wise governance ensures the community prospers for generations.” — Swahili Proverb',
    targetValue: 10,
    unit: 'Path 3 questions',
    isUnlocked: (stats) => {
      const p3 = stats.pathMastery?.[3] || { correct: 0, total: 0 };
      const acc = p3.total > 0 ? (p3.correct / p3.total) * 100 : 0;
      return p3.total >= 10 && acc >= 70;
    },
    getCurrentValue: (stats) => {
      const p3 = stats.pathMastery?.[3] || { correct: 0, total: 0 };
      return p3.total;
    },
    tipToUnlock: 'Answer at least 10 questions in Path 3 (Management & Governance) with 70%+ accuracy.',
  },
];

export interface EvaluatedBadge extends BadgeDefinition {
  unlocked: boolean;
  currentValue: number;
  progress: number;
  targetValue: number;
}

interface BadgeSystemProps {
  stats: UserStats;
  onExplorePractice?: () => void;
}

export const BadgeSystem: React.FC<BadgeSystemProps> = ({ stats, onExplorePractice }) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState<boolean>(false);

  const overallAccuracy = useMemo(() => {
    return stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;
  }, [stats]);

  // Evaluated badges list with unlocked status and percentage progress
  const evaluatedBadges = useMemo(() => {
    return BADGE_DEFINITIONS.map((def) => {
      const unlocked = def.isUnlocked(stats, overallAccuracy);
      const current = def.getCurrentValue(stats, overallAccuracy);
      const target = def.id === 'goal-crusher' ? (stats.dailyGoal || 10) : def.targetValue;
      const progress = unlocked ? 100 : Math.min(99, Math.round((current / target) * 100));

      return {
        ...def,
        targetValue: target,
        unlocked,
        currentValue: current,
        progress: Math.max(0, isNaN(progress) ? 0 : progress),
      };
    });
  }, [stats, overallAccuracy]);

  // Summary counts
  const totalUnlocked = evaluatedBadges.filter((b) => b.unlocked).length;
  const totalBadges = evaluatedBadges.length;

  const tierCounts = useMemo(() => {
    return {
      bronze: evaluatedBadges.filter((b) => b.unlocked && b.tier === 'bronze').length,
      silver: evaluatedBadges.filter((b) => b.unlocked && b.tier === 'silver').length,
      gold: evaluatedBadges.filter((b) => b.unlocked && b.tier === 'gold').length,
      diamond: evaluatedBadges.filter((b) => b.unlocked && b.tier === 'diamond').length,
    };
  }, [evaluatedBadges]);

  // Next closest badge to unlock
  const nextBadgeToUnlock = useMemo(() => {
    const locked = evaluatedBadges.filter((b) => !b.unlocked);
    if (locked.length === 0) return null;
    return [...locked].sort((a, b) => b.progress - a.progress)[0];
  }, [evaluatedBadges]);

  // Filtered badges to display
  const displayedBadges = useMemo(() => {
    return evaluatedBadges.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) {
        return false;
      }
      if (filterUnlockedOnly && !b.unlocked) {
        return false;
      }
      return true;
    });
  }, [evaluatedBadges, selectedCategory, filterUnlockedOnly]);

  const renderBadgeIcon = (iconName: string, tier: BadgeTier, unlocked: boolean) => {
    const iconProps = { className: 'w-6 h-6' };
    let iconElement: React.ReactNode;

    switch (iconName) {
      case 'Award':
        iconElement = <Award {...iconProps} />;
        break;
      case 'Compass':
        iconElement = <Compass {...iconProps} />;
        break;
      case 'ShieldCheck':
        iconElement = <ShieldCheck {...iconProps} />;
        break;
      case 'Crown':
        iconElement = <Crown {...iconProps} />;
        break;
      case 'Layers':
        iconElement = <Layers {...iconProps} />;
        break;
      case 'Zap':
        iconElement = <Zap {...iconProps} />;
        break;
      case 'Flame':
        iconElement = <Flame {...iconProps} />;
        break;
      case 'Target':
        iconElement = <Target {...iconProps} />;
        break;
      case 'Bookmark':
        iconElement = <Bookmark {...iconProps} />;
        break;
      case 'BookOpen':
        iconElement = <BookOpen {...iconProps} />;
        break;
      case 'ShieldAlert':
        iconElement = <ShieldAlert {...iconProps} />;
        break;
      default:
        iconElement = <Trophy {...iconProps} />;
    }

    if (!unlocked) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
      );
    }

    switch (tier) {
      case 'diamond':
        return (
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0078D4] via-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform">
            {iconElement}
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 absolute -top-1 -right-1 animate-pulse" />
          </div>
        );
      case 'gold':
        return (
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
            {iconElement}
            <Sparkles className="w-3.5 h-3.5 text-white absolute -top-1 -right-1" />
          </div>
        );
      case 'silver':
        return (
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            {iconElement}
          </div>
        );
      case 'bronze':
      default:
        return (
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-yellow-900 text-amber-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            {iconElement}
          </div>
        );
    }
  };

  const getTierBadgeStyle = (tier: BadgeTier) => {
    switch (tier) {
      case 'diamond':
        return 'bg-blue-50 text-[#0078D4] border-blue-200';
      case 'gold':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'silver':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'bronze':
      default:
        return 'bg-amber-100/70 text-amber-900 border-amber-300/80';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden space-y-6">
      {/* Kitenge decorative ribbon */}
      <KitengeRibbon height={4} />

      {/* Hero Showcase Header */}
      <div className="p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 shadow-md">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Harambee Achievement Matrix
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Azure Milestone Badges</span>
              <MaasaiMedallion size={24} />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Earn authentic cloud credentials as you solve practice scenarios, maintain your daily study streak, and master all three Azure Curriculum domains.
            </p>
          </div>

          {/* Progress Summary Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 shrink-0 w-full md:w-auto min-w-[280px]">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-xs font-semibold text-slate-300">Total Unlocked</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                {totalUnlocked} / {totalBadges} Badges
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mb-3.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-[#0078D4] rounded-full transition-all duration-700"
                style={{ width: `${Math.round((totalUnlocked / totalBadges) * 100)}%` }}
              />
            </div>

            {/* Tier Breakdown Chips */}
            <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/10">
                <span className="block text-amber-300">🥉 {tierCounts.bronze}</span>
                <span className="text-[9px] text-slate-400 uppercase font-normal">Bronze</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/10">
                <span className="block text-slate-300">🥈 {tierCounts.silver}</span>
                <span className="text-[9px] text-slate-400 uppercase font-normal">Silver</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/10">
                <span className="block text-amber-400">🥇 {tierCounts.gold}</span>
                <span className="text-[9px] text-slate-400 uppercase font-normal">Gold</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/10">
                <span className="block text-cyan-300">💎 {tierCounts.diamond}</span>
                <span className="text-[9px] text-slate-400 uppercase font-normal">Diamond</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next closest badge callout & Milestone Celebration Replay Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {nextBadgeToUnlock ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Next up to unlock: <strong className="text-white font-bold">{nextBadgeToUnlock.title}</strong> ({nextBadgeToUnlock.progress}% complete)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-bold">
                All AZ-900 Milestone Badges Unlocked! Hongera!
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('az900_trigger_achievement_overlay', {
                    detail: { badgeId: 'master-of-governance' },
                  })
                )
              }
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Preview celebratory badge unlock animation for Master of Governance"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Celebrate: Master of Governance</span>
            </button>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('az900_trigger_achievement_overlay', {
                    detail: { badgeId: 'five-day-streak' },
                  })
                )
              }
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 border border-sky-400/30 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Preview celebratory badge unlock animation for 5-Day Study Streak"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Celebrate: 5-Day Streak</span>
            </button>

            {onExplorePractice && (
              <button
                onClick={onExplorePractice}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>Continue Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Category Controls */}
      <div className="px-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Badges ({totalBadges})
            </button>
            <button
              onClick={() => setSelectedCategory('milestones')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'milestones'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Milestones
            </button>
            <button
              onClick={() => setSelectedCategory('mastery')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'mastery'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mastery & Pass Mark
            </button>
            <button
              onClick={() => setSelectedCategory('consistency')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'consistency'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Habit & Streak
            </button>
            <button
              onClick={() => setSelectedCategory('curriculum')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'curriculum'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Curriculum Breadth
            </button>
          </div>

          {/* Toggle Unlocked Only */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={filterUnlockedOnly}
              onChange={(e) => setFilterUnlockedOnly(e.target.checked)}
              className="rounded text-[#0078D4] focus:ring-blue-500 h-4 w-4"
            />
            <span>Show Unlocked Only ({totalUnlocked})</span>
          </label>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {displayedBadges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-[#0078D4] hover:shadow-md'
                  : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top row: Icon + Tier Pill + Checkmark */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {renderBadgeIcon(badge.iconName, badge.tier, badge.unlocked)}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors">
                        {badge.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {badge.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${getTierBadgeStyle(
                      badge.tier
                    )}`}
                  >
                    {badge.tier}
                  </span>
                  {badge.unlocked && (
                    <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {badge.description}
              </p>

              {/* Progress and status */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>
                    {badge.unlocked ? (
                      <span className="text-emerald-700 font-bold">Goal Achieved!</span>
                    ) : (
                      <span>Progress: {badge.currentValue} / {badge.targetValue} {badge.unit}</span>
                    )}
                  </span>
                  <span className={`font-bold ${badge.unlocked ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {badge.progress}%
                  </span>
                </div>

                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : badge.progress > 50
                        ? 'bg-gradient-to-r from-amber-400 to-[#0078D4]'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <KitengeRibbon height={4} />

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {renderBadgeIcon(selectedBadge.iconName, selectedBadge.tier, selectedBadge.unlocked)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedBadge.title}
                      </h3>
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${getTierBadgeStyle(
                          selectedBadge.tier
                        )}`}
                      >
                        {selectedBadge.tier} Tier
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedBadge.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                  selectedBadge.unlocked
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                {selectedBadge.unlocked ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Badge Unlocked!</strong>
                      <span>You have fulfilled the criteria for this Azure achievement badge.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Badge In Progress ({selectedBadge.progress}%)</strong>
                      <span>{selectedBadge.tipToUnlock}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Requirement & Description */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  Milestone Criteria:
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedBadge.description}
                </p>
                <div className="pt-2 flex justify-between font-semibold text-slate-700">
                  <span>Current Metric:</span>
                  <span className="font-bold text-[#0078D4]">
                    {selectedBadge.currentValue} / {selectedBadge.targetValue} {selectedBadge.unit}
                  </span>
                </div>
              </div>

              {/* African Wisdom Proverb Quote */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-xs italic text-amber-900 leading-relaxed flex items-start gap-2.5">
                <MaasaiMedallion size={20} className="shrink-0 mt-0.5" />
                <span>{selectedBadge.proverbQuote}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const idToTrigger = selectedBadge.id;
                    setSelectedBadge(null);
                    window.dispatchEvent(
                      new CustomEvent('az900_trigger_achievement_overlay', {
                        detail: { badgeId: idToTrigger },
                      })
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Celebrate Unlock</span>
                </button>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    onClick={() => setSelectedBadge(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {onExplorePractice && (
                    <button
                      onClick={() => {
                        setSelectedBadge(null);
                        onExplorePractice();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Practice Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
