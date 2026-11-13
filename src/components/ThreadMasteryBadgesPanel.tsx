import React from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import {
  evaluateInterconnectingThreadInsights,
  ThreadInsightReport,
} from '../data/azureThemesData';
import { triggerAchievementOverlay } from './AchievementOverlay';

interface ThreadMasteryBadgesPanelProps {
  stats: UserStats;
  questions?: Question[];
  reports?: ThreadInsightReport[];
  onPracticeModule?: (moduleId: number, pathId?: 1 | 2 | 3) => void;
  onInspectThread?: (themeId: string, moduleId?: number) => void;
  onOpenAzureThemes?: () => void;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

const renderThreadBadgeIcon = (iconName: string, className = 'w-5 h-5') => {
  switch (iconName) {
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Lock':
      return <Lock className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    default:
      return <Award className={className} />;
  }
};

export const ThreadMasteryBadgesPanel: React.FC<ThreadMasteryBadgesPanelProps> = ({
  stats,
  questions = [],
  reports: providedReports,
  onPracticeModule,
  onInspectThread,
  onOpenAzureThemes,
  compact = false,
  title = 'Interconnecting Thread Mastery Badges (80%+ Across Every Linked Module)',
  subtitle = 'Earn specialist badges by achieving at least 80% accuracy in every module linked to a conceptual thread.',
}) => {
  const reports = React.useMemo(
    () => providedReports || evaluateInterconnectingThreadInsights(stats, questions),
    [providedReports, stats, questions]
  );

  const unlockedCount = reports.filter((r) => r.badgeUnlocked).length;

  return (
    <section
      aria-label="Thread Mastery Badges"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 tabular-nums">
              {unlockedCount}/{reports.length} Unlocked
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {onOpenAzureThemes && (
          <button
            type="button"
            onClick={onOpenAzureThemes}
            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/70 text-[#0078D4] dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open Thread Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {reports.map((report) => {
          const { badge, primaryBottleneck } = report;
          const isUnlocked = report.badgeUnlocked;
          const tierLabel = badge.tier.toUpperCase();

          return (
            <article
              key={badge.badgeId}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3.5 transition-colors ${
                isUnlocked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800'
                  : report.bottleneckSeverity === 'critical'
                  ? 'bg-rose-50/35 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/60'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnlocked
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {renderThreadBadgeIcon(
                        badge.iconName,
                        isUnlocked ? 'w-5 h-5 text-amber-200' : 'w-4.5 h-4.5'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                        {badge.title}
                      </h4>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {report.tagId} · {tierLabel} Tier
                      </div>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Earned</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                      {report.modulesAt80Count}/{report.totalModulesCount} ≥80%
                    </span>
                  )}
                </div>

                {!compact && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {badge.description}
                  </p>
                )}

                {/* Progress Bar toward 80% across all linked modules */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] tabular-nums">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Modules at 80%+ Mastery
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {report.badgeProgressPct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked
                          ? 'bg-emerald-500'
                          : report.modulesAt80Count > 0
                          ? 'bg-[#0078D4]'
                          : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(4, report.badgeProgressPct)}%` }}
                    />
                  </div>
                </div>

                {/* Per-Module 80% Gate Chips */}
                <div className="flex flex-wrap gap-1">
                  {report.modules.map((mod) => {
                    const chipStyle = mod.isAt80Threshold
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                      : mod.status === 'bottleneck'
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                      : mod.status === 'developing'
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                    return (
                      <button
                        key={mod.moduleId}
                        type="button"
                        onClick={() => onPracticeModule?.(mod.moduleId, mod.pathId)}
                        disabled={!onPracticeModule}
                        title={`Module ${mod.moduleId}: ${mod.moduleTitle} (${
                          mod.accuracyPct !== null ? `${mod.accuracyPct}% accuracy` : 'Not attempted'
                        } · Target: 80%)`}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border tabular-nums transition-colors ${
                          onPracticeModule ? 'cursor-pointer hover:border-[#0078D4]' : ''
                        } ${chipStyle}`}
                      >
                        M{mod.moduleId}
                        {mod.accuracyPct !== null ? ` ${mod.accuracyPct}%` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Action */}
              <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs">
                {isUnlocked ? (
                  <>
                    <button
                      type="button"
                      onClick={() => triggerAchievementOverlay(badge.badgeId)}
                      className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Reveal Badge</span>
                    </button>
                    {onInspectThread && (
                      <button
                        type="button"
                        onClick={() => onInspectThread(badge.themeId)}
                        className="text-slate-600 dark:text-slate-300 hover:text-[#0078D4] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Thread</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : primaryBottleneck ? (
                  <>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate flex items-center gap-1 min-w-0">
                      {report.activeWeakModules.length > 0 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {primaryBottleneck.accuracyPct !== null
                          ? `Blocker: M${primaryBottleneck.moduleId} (${primaryBottleneck.accuracyPct}%)`
                          : `Next: Practice M${primaryBottleneck.moduleId}`}
                      </span>
                    </div>
                    {onPracticeModule && (
                      <button
                        type="button"
                        onClick={() =>
                          onPracticeModule(primaryBottleneck.moduleId, primaryBottleneck.pathId)
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Practice M{primaryBottleneck.moduleId}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
