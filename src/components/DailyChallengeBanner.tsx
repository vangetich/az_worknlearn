import React, { useMemo, useState } from 'react';
import {
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
  Award,
  Target,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface DailyChallengeBannerProps {
  stats: UserStats;
  onLaunchChallenge: (moduleId: number) => void;
}

export interface WeaknessModuleDiagnostic {
  id: number;
  title: string;
  pathId: number;
  accuracy: number;
  total: number;
  correct: number;
  mistakesCount: number;
  badgeEarned: boolean;
  bestDrillScore: number;
  drillAttempts: number;
  statusLabel: 'Critical Weakness' | 'Unattempted (0%)' | 'Developing' | 'Reinforced';
  weaknessPriorityScore: number;
}

export const DailyChallengeBanner: React.FC<DailyChallengeBannerProps> = ({
  stats,
  onLaunchChallenge,
}) => {
  // Rank all 12 modules by weakness severity (tracking accuracy, mistakes, and Module 11 focus)
  const weaknessDiagnostics = useMemo<WeaknessModuleDiagnostic[]>(() => {
    const allModules: WeaknessModuleDiagnostic[] = [];
    const mistakesList = stats.mistakesHistory || [];
    const drillBadges = stats.harambeeChallengeBadges || {};

    LEARNING_PATHS.forEach((path) => {
      path.modules.forEach((mod) => {
        const data = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        const mistakesCount = mistakesList.filter((m) => m.moduleId === mod.id).length;
        const badgeInfo = drillBadges[mod.id];
        const badgeEarned = Boolean(badgeInfo?.badgeEarned);

        let statusLabel: WeaknessModuleDiagnostic['statusLabel'] = 'Unattempted (0%)';
        if (data.total > 0) {
          if (acc < 55) statusLabel = 'Critical Weakness';
          else if (acc < 75) statusLabel = 'Developing';
          else statusLabel = 'Reinforced';
        }

        // Priority score: lower score = higher priority weakness
        // Module 11 (Azure Monitoring & Advisory Tools) gets high visibility when unattempted/weak
        let priority = acc;
        if (data.total === 0) {
          priority = mod.id === 11 ? -15 : 5;
        } else if (acc < 60) {
          priority = acc - 30 - mistakesCount * 5;
        } else {
          priority = acc - mistakesCount * 3;
        }
        if (badgeEarned) {
          priority += 40; // Push already-conquered modules lower in weakness queue
        }

        allModules.push({
          id: mod.id,
          title: mod.title,
          pathId: path.id,
          accuracy: acc,
          total: data.total,
          correct: data.correct,
          mistakesCount,
          badgeEarned,
          bestDrillScore: badgeInfo?.bestScore || 0,
          drillAttempts: badgeInfo?.attemptsCount || 0,
          statusLabel,
          weaknessPriorityScore: priority,
        });
      });
    });

    return allModules.sort((a, b) => a.weaknessPriorityScore - b.weaknessPriorityScore);
  }, [stats.moduleMastery, stats.mistakesHistory, stats.harambeeChallengeBadges]);

  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState<boolean>(false);

  const targetModule = useMemo(() => {
    if (selectedModuleId !== null) {
      const found = weaknessDiagnostics.find((m) => m.id === selectedModuleId);
      if (found) return found;
    }
    return (
      weaknessDiagnostics[0] || {
        id: 11,
        title: 'Azure Monitoring & Advisory Tools',
        pathId: 3,
        accuracy: 0,
        total: 0,
        correct: 0,
        mistakesCount: 0,
        badgeEarned: false,
        bestDrillScore: 0,
        drillAttempts: 0,
        statusLabel: 'Unattempted (0%)' as const,
        weaknessPriorityScore: -15,
      }
    );
  }, [selectedModuleId, weaknessDiagnostics]);

  const earnedBadgesList = useMemo(
    () => weaknessDiagnostics.filter((m) => m.badgeEarned),
    [weaknessDiagnostics]
  );

  const displayedWeaknessModules = showAllWeaknesses
    ? weaknessDiagnostics
    : weaknessDiagnostics.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#1e0f05] to-[#2a0e05] text-white border border-orange-500/35 shadow-xl card-elevation group">
      {/* African Fire Motif Animations: Tasteful, Savvy Streaks and Glowing Embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Background Ambient Heat Glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-red-600/5 blur-3xl animate-fire-pulse" />
        <div
          className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-gradient-to-tr from-red-600/10 via-amber-600/10 to-transparent blur-3xl animate-fire-pulse"
          style={{ animationDelay: '1.5s' }}
        />

        {/* African Fire Streak 1 */}
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
            <path
              d="M0 20 Q 140 16, 260 20"
              stroke="url(#fireTrail1)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))"
            />
            <polygon
              points="265,20 274,16 280,20 274,24"
              fill="#FEF08A"
              filter="drop-shadow(0 0 8px rgba(254, 240, 138, 0.9))"
            />
          </svg>
        </div>

        {/* African Fire Streak 2 */}
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

        {/* African Fire Streak 3 */}
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
      <div className="p-4 sm:p-6 space-y-4 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4">
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
                <span className="text-[11px] text-orange-300/80">
                  • Target Drill Unit
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 border ${
                    earnedBadgesList.length > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-white/10 text-amber-200 border-amber-400/25'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {earnedBadgesList.length > 0
                      ? `${earnedBadgesList.length} Harambee Drill Badge${earnedBadgesList.length === 1 ? '' : 's'} Earned`
                      : 'Earn Weakness Conqueror Badge (4/5+ Correct)'}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Target Weakness: Module {targetModule.id} – {targetModule.title}
                </h3>
                {targetModule.badgeEarned && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    <span>Drill Badge Earned ({targetModule.bestDrillScore}/5)</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Based on your Heatmap diagnosis, your current confidence in this domain is{' '}
                <strong className="text-amber-400">{targetModule.accuracy}%</strong>
                {targetModule.mistakesCount > 0 && (
                  <span className="text-rose-300 font-semibold">
                    {' '}
                    ({targetModule.mistakesCount} unresolved mistake
                    {targetModule.mistakesCount === 1 ? '' : 's'} tracked)
                  </span>
                )}
                . Complete a rapid <strong className="text-white">5-question drill</strong> to
                reinforce memory, maintain momentum, and unlock the{' '}
                <span className="text-amber-300 font-bold">Harambee Weakness Conqueror</span> badge!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onLaunchChallenge(targetModule.id)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-1 ring-amber-300/50"
            >
              <Zap className="w-4 h-4 fill-current text-slate-950" />
              <span>Launch 5-Question Drill</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Weakness Areas Tracker & Selector */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Weakness Area Tracker (Click any domain to target &amp; drill):</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllWeaknesses((prev) => !prev)}
              className="text-[11px] font-bold text-amber-300 hover:text-white inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <span>
                {showAllWeaknesses
                  ? 'Show Top 4 Priority Weaknesses'
                  : `View All 12 Tracked Modules (${weaknessDiagnostics.filter((m) => m.accuracy < 70).length} Need Focus)`}
              </span>
              {showAllWeaknesses ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {displayedWeaknessModules.map((mod) => {
              const isSelected = mod.id === targetModule.id;
              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedModuleId(mod.id);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-red-500/15 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-amber-400/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/10 text-amber-300">
                        Module {mod.id}
                      </span>
                      {mod.badgeEarned ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                          <Award className="w-2.5 h-2.5 text-amber-300" />
                          <span>Badge Earned</span>
                        </span>
                      ) : mod.accuracy < 50 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/25 text-rose-200 border border-rose-400/30">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-300" />
                          <span>{mod.accuracy}% Conf.</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-200">
                          <span>{mod.accuracy}% Conf.</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-white line-clamp-1">
                      {mod.title}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {/* Mini Confidence Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          mod.accuracy >= 75
                            ? 'bg-emerald-400'
                            : mod.accuracy >= 50
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(6, mod.accuracy)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>
                        {mod.total > 0
                          ? `${mod.correct}/${mod.total} solved`
                          : '0% (Unattempted)'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModuleId(mod.id);
                          onLaunchChallenge(mod.id);
                        }}
                        className="text-amber-300 hover:text-white font-black inline-flex items-center gap-0.5 underline decoration-amber-400/50 cursor-pointer"
                      >
                        <span>5-Q Drill</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Savvy African Chevron Fire Border Line */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 via-amber-400 to-orange-600 opacity-80" />
    </div>
  );
};
