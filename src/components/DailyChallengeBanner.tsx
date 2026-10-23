import React, { useMemo } from 'react';
import {
  Flame,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Award,
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

  // Check if user solved any questions today
  const todayKey = new Date().toISOString().split('T')[0];
  const isCompletedToday = stats.lastActiveDate === todayKey && stats.totalAnswered > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950 to-orange-950 text-white border border-amber-500/30 shadow-md card-elevation">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 fill-amber-200 text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <MaasaiMedallion size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Daily Harambee Challenge</span>
              </span>
              <span className="text-xs text-amber-200/90 font-medium">
                Streak: <strong className="text-white">{stats.streakDays} Days</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              Target Weakness: Module {targetModule.id} – {targetModule.title}
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
            onClick={() => onLaunchChallenge(targetModule.id)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Launch 3-Question Drill</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
