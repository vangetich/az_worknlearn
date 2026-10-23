import React, { useMemo } from 'react';
import {
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface DailyChallengeBannerProps {
  stats: UserStats;
  onLaunchChallenge: (moduleId: number) => void;
}

export const DailyChallengeBanner: React.FC<DailyChallengeBannerProps> = ({
  stats,
  onLaunchChallenge,
}) => {
  // Find the lowest scoring module from performance data
  const targetModule = useMemo(() => {
    let lowest: { id: number; title: string; accuracy: number; total: number; pathId: number } | null = null;

    LEARNING_PATHS.forEach((path) => {
      path.modules.forEach((mod) => {
        const data = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

        // If unattempted or lowest accuracy, consider as candidate
        if (lowest === null) {
          lowest = { id: mod.id, title: mod.title, accuracy: acc, total: data.total, pathId: path.id };
        } else {
          // Prioritize modules with attempts that are struggling (< 70%), or unattempted
          if (data.total > 0 && acc < lowest.accuracy) {
            lowest = { id: mod.id, title: mod.title, accuracy: acc, total: data.total, pathId: path.id };
          } else if (lowest.total > 0 && lowest.accuracy >= 70 && data.total === 0) {
            lowest = { id: mod.id, title: mod.title, accuracy: acc, total: data.total, pathId: path.id };
          }
        }
      });
    });

    return lowest || { id: 5, title: 'Azure Compute & Networking Services', accuracy: 0, total: 0, pathId: 2 };
  }, [stats.moduleMastery]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#1e0f05] to-[#2a0e05] text-white border border-orange-500/35 shadow-xl card-elevation group">
      {/* African Fire Motif Animations: Tasteful, Savvy Streaks and Glowing Embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Background Ambient Heat Glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-red-600/5 blur-3xl animate-fire-pulse" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-gradient-to-tr from-red-600/10 via-amber-600/10 to-transparent blur-3xl animate-fire-pulse" style={{ animationDelay: '1.5s' }} />

        {/* African Fire Streak 1: Diagonal Shooting Flame with Maasai Diamond Head */}
        <div className="absolute top-1/4 left-0 w-72 h-10 animate-fire-streak-1">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 280 40">
            <defs>
              <linearGradient id="fireTrail1" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0" />
                <stop offset="60%" stopColor="#D97706" stopOpacity="0.35" />
                <stop offset="85%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FEF08A" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Tapered Fire Streak Trail */}
            <path
              d="M0 20 Q 140 16, 260 20"
              stroke="url(#fireTrail1)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))"
            />
            {/* African Diamond Flame Spark Head */}
            <polygon
              points="265,20 274,16 280,20 274,24"
              fill="#FEF08A"
              filter="drop-shadow(0 0 8px rgba(254, 240, 138, 0.9))"
            />
          </svg>
        </div>

        {/* African Fire Streak 2: Secondary Staggered Shooting Flame Motif */}
        <div className="absolute top-2/3 left-0 w-80 h-10 animate-fire-streak-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 40">
            <defs>
              <linearGradient id="fireTrail2" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0" />
                <stop offset="50%" stopColor="#EA580C" stopOpacity="0.3" />
                <stop offset="85%" stopColor="#F59E0B" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#FFFBEB" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M0 20 Q 160 24, 300 20"
              stroke="url(#fireTrail2)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              filter="drop-shadow(0 0 5px rgba(234, 88, 12, 0.6))"
            />
            <polygon
              points="305,20 313,17 319,20 313,23"
              fill="#FBBF24"
              filter="drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))"
            />
          </svg>
        </div>

        {/* African Fire Streak 3: Reverse Cross-Sweeping Ember */}
        <div className="absolute top-1/2 right-0 w-64 h-8 animate-fire-streak-3">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 250 30">
            <defs>
              <linearGradient id="fireTrail3" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#B45309" stopOpacity="0" />
                <stop offset="70%" stopColor="#EA580C" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M0 15 Q 120 12, 235 15"
              stroke="url(#fireTrail3)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <polygon
              points="240,15 245,12 249,15 245,18"
              fill="#FDE68A"
              filter="drop-shadow(0 0 5px rgba(253, 230, 138, 0.8))"
            />
          </svg>
        </div>

        {/* Floating African Diamond Ember Sparks */}
        <div className="absolute left-[15%] bottom-2 animate-ember-1">
          <div className="w-2 h-2 rotate-45 bg-amber-400 rounded-xs shadow-xs shadow-amber-400/80" />
        </div>
        <div className="absolute left-[45%] bottom-3 animate-ember-2">
          <div className="w-1.5 h-1.5 rotate-45 bg-orange-400 rounded-xs shadow-xs shadow-orange-400/80" />
        </div>
        <div className="absolute left-[78%] bottom-4 animate-ember-3">
          <div className="w-2.5 h-2.5 rotate-45 bg-yellow-300 rounded-xs shadow-xs shadow-yellow-300/80" />
        </div>
      </div>

      {/* Main Banner Content */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/40 ring-2 ring-amber-400/30">
              <Flame className="w-6 h-6 fill-amber-200 text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <MaasaiMedallion size={18} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-2xs flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Daily Harambee Challenge</span>
              </span>
              <span className="text-xs text-amber-200/90 font-medium">
                Streak: <strong className="text-white font-bold">{stats.streakDays} Days</strong>
              </span>
              <span className="text-[11px] text-orange-300/80 hidden sm:inline">
                • Target Drill Unit
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Target Weakness: Module {targetModule.id} – {targetModule.title}</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Based on your Heatmap diagnosis, your current confidence in this domain is{' '}
              <strong className="text-amber-400">
                {targetModule.total > 0 ? `${targetModule.accuracy}%` : 'Unattempted'}
              </strong>
              . Complete a rapid 3-question drill to reinforce memory and maintain momentum!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => onLaunchChallenge(targetModule.id)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-1 ring-amber-300/50"
          >
            <Zap className="w-4 h-4 fill-current text-slate-950" />
            <span>Launch 3-Question Drill</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Savvy African Chevron Fire Border Line */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 via-amber-400 to-orange-600 opacity-80" />
    </div>
  );
};
