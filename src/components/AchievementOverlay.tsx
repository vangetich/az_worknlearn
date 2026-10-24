import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
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
  Sparkles,
  CheckCircle2,
  X,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { BADGE_DEFINITIONS, BadgeDefinition, BadgeTier } from './BadgeSystem';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

const SEEN_BADGES_STORAGE_KEY = 'az900_seen_unlocked_badges_v1';

export const triggerAchievementOverlay = (badgeId: string = 'master-of-governance') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('az900_trigger_achievement_overlay', {
        detail: { badgeId },
      })
    );
  }
};

interface AchievementOverlayProps {
  stats: UserStats;
  onViewBadges?: () => void;
}

export const AchievementOverlay: React.FC<AchievementOverlayProps> = ({
  stats,
  onViewBadges,
}) => {
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);
  const [activeBadge, setActiveBadge] = useState<BadgeDefinition | null>(null);
  const initializedRef = useRef<boolean>(false);

  const overallAccuracy = useMemo(() => {
    return stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;
  }, [stats.totalAnswered, stats.totalCorrect]);

  // Evaluate currently unlocked badge IDs whenever stats update
  useEffect(() => {
    const currentlyUnlocked = BADGE_DEFINITIONS.filter((def) =>
      def.isUnlocked(stats, overallAccuracy)
    );
    const unlockedIds = currentlyUnlocked.map((b) => b.id);

    try {
      const rawSeen = localStorage.getItem(SEEN_BADGES_STORAGE_KEY);
      if (!initializedRef.current) {
        initializedRef.current = true;
        if (!rawSeen) {
          // Baseline on first session load so pre-existing badges don't all pop at once
          localStorage.setItem(SEEN_BADGES_STORAGE_KEY, JSON.stringify(unlockedIds));
          return;
        }
      }

      const seenIds: string[] = rawSeen ? JSON.parse(rawSeen) : [];
      const seenSet = new Set(seenIds);

      const newlyUnlocked = currentlyUnlocked.filter((b) => !seenSet.has(b.id));
      if (newlyUnlocked.length > 0) {
        const updatedSeen = Array.from(new Set([...seenIds, ...unlockedIds]));
        localStorage.setItem(SEEN_BADGES_STORAGE_KEY, JSON.stringify(updatedSeen));
        setQueue((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const filteredNew = newlyUnlocked.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
      }
    } catch (e) {
      console.error('Failed to sync achievement overlay state:', e);
    }
  }, [stats, overallAccuracy]);

  // Listen for manual / demo milestone triggers (e.g., Master of Governance or 5-Day Study Streak)
  useEffect(() => {
    const handleCustomTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ badgeId?: string }>;
      const targetId = customEvent.detail?.badgeId || 'master-of-governance';
      const found =
        BADGE_DEFINITIONS.find((b) => b.id === targetId) ||
        BADGE_DEFINITIONS.find((b) => b.id === 'master-of-governance') ||
        BADGE_DEFINITIONS[0];

      if (found) {
        setActiveBadge(found);
      }
    };

    window.addEventListener('az900_trigger_achievement_overlay', handleCustomTrigger);
    return () =>
      window.removeEventListener('az900_trigger_achievement_overlay', handleCustomTrigger);
  }, []);

  // Pop next badge from queue when activeBadge is null
  useEffect(() => {
    if (!activeBadge && queue.length > 0) {
      setActiveBadge(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [activeBadge, queue]);

  // Fire celebratory confetti burst whenever activeBadge appears
  useEffect(() => {
    if (!activeBadge) return;

    try {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#0078D4', '#38bdf8', '#f59e0b', '#10b981', '#eab308'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.6 },
          colors: ['#0078D4', '#fbbf24', '#34d399'],
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.6 },
          colors: ['#0078D4', '#fbbf24', '#34d399'],
        });
      }, 260);

      return () => clearTimeout(timer);
    } catch {
      // Ignore confetti errors in restricted environments
    }
  }, [activeBadge]);

  if (!activeBadge || typeof document === 'undefined') return null;

  const renderBadgeIcon = (iconName: string) => {
    const iconProps = { className: 'w-11 h-11 sm:w-12 sm:h-12 stroke-[2.2]' };
    switch (iconName) {
      case 'Award':
        return <Award {...iconProps} />;
      case 'Compass':
        return <Compass {...iconProps} />;
      case 'ShieldCheck':
        return <ShieldCheck {...iconProps} />;
      case 'Crown':
        return <Crown {...iconProps} />;
      case 'Layers':
        return <Layers {...iconProps} />;
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'Target':
        return <Target {...iconProps} />;
      case 'Bookmark':
        return <Bookmark {...iconProps} />;
      case 'BookOpen':
        return <BookOpen {...iconProps} />;
      case 'ShieldAlert':
        return <ShieldAlert {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  const getTierOrbGradient = (tier: BadgeTier) => {
    switch (tier) {
      case 'diamond':
        return 'from-[#0078D4] via-sky-500 to-indigo-700 text-white shadow-blue-500/40';
      case 'gold':
        return 'from-amber-300 via-amber-500 to-yellow-600 text-slate-950 shadow-amber-500/40';
      case 'silver':
        return 'from-slate-200 via-slate-300 to-slate-400 text-slate-900 shadow-slate-400/40';
      case 'bronze':
      default:
        return 'from-amber-600 via-amber-700 to-yellow-900 text-amber-100 shadow-amber-700/40';
    }
  };

  const getTierPillStyle = (tier: BadgeTier) => {
    switch (tier) {
      case 'diamond':
        return 'bg-sky-400/20 text-sky-200 border-sky-400/40';
      case 'gold':
        return 'bg-amber-400/20 text-amber-200 border-amber-400/40';
      case 'silver':
        return 'bg-slate-300/20 text-slate-200 border-slate-300/40';
      case 'bronze':
      default:
        return 'bg-orange-400/20 text-orange-200 border-orange-400/40';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-unlock-title"
    >
      {/* Main Celebration Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-[#0b192f] to-slate-950 text-white border border-sky-400/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Top Kitenge Cultural Accent Ribbon */}
        <KitengeRibbon height={5} />

        {/* Ambient Glowing Rays Background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-[#0078D4]/35 via-amber-400/25 to-emerald-400/20 blur-3xl pointer-events-none animate-pulse" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveBadge(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Close achievement notification"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 p-6 sm:p-7 text-center space-y-5">
          {/* Header Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] font-black uppercase tracking-widest shadow-xs">
            <PartyPopper className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Milestone Unlocked!</span>
          </div>

          {/* Animated Badge Icon Emblem */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '12s' }} />
            {/* Inner glow pulse */}
            <div className="absolute inset-2 rounded-3xl bg-amber-400/20 blur-md animate-pulse" />

            <div
              className={`relative w-22 h-22 rounded-3xl bg-gradient-to-br ${getTierOrbGradient(
                activeBadge.tier
              )} flex items-center justify-center shadow-xl border-2 border-white/30 transform transition-transform duration-500 hover:scale-105`}
            >
              {renderBadgeIcon(activeBadge.iconName)}
              <Sparkles className="w-5 h-5 text-white absolute -top-2 -right-2 animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            <div className="absolute -bottom-1 -right-1">
              <MaasaiMedallion size={26} />
            </div>
          </div>

          {/* Badge Title, Tier & Subtitle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getTierPillStyle(
                  activeBadge.tier
                )}`}
              >
                {activeBadge.tier} Tier Credential
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>

            <h2
              id="achievement-unlock-title"
              className="text-2xl sm:text-3xl font-black tracking-tight text-white pt-1"
            >
              {activeBadge.title}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-sky-300">
              {activeBadge.subtitle}
            </p>
          </div>

          {/* Achievement Description Box */}
          <div className="p-4 rounded-2xl bg-white/8 border border-white/15 text-left space-y-2 backdrop-blur-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Achievement Accomplished</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {activeBadge.description}
            </p>
          </div>

          {/* Harambee Proverb Quote */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-400/30 text-xs italic text-amber-200 leading-relaxed flex items-start gap-2.5 text-left">
            <MaasaiMedallion size={18} className="shrink-0 mt-0.5" />
            <span>{activeBadge.proverbQuote}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            {onViewBadges && (
              <button
                type="button"
                onClick={() => {
                  setActiveBadge(null);
                  onViewBadges();
                }}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
              >
                View All Badges
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveBadge(null)}
              className={`${
                onViewBadges ? 'w-full sm:w-1/2' : 'w-full'
              } px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] via-sky-500 to-blue-600 hover:from-blue-600 hover:to-sky-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/30 transition-all cursor-pointer`}
            >
              <span>Continue Studying</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {queue.length > 0 && (
            <p className="text-[11px] font-semibold text-sky-300 animate-pulse">
              +{queue.length} more achievement{queue.length > 1 ? 's' : ''} unlocked!
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
