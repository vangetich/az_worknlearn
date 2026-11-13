import React from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  BookOpen,
  ArrowRight,
  Award,
} from 'lucide-react';
import { AzureThemeThread } from '../data/azureThemesData';
import { UserStats } from '../types/quiz';

interface ThemeMasteryTimelineProps {
  theme: AzureThemeThread;
  stats: UserStats;
  selectedModuleId: number;
  matchingModuleIds?: Set<number> | null;
  onSelectModule: (moduleId: number) => void;
  onPracticeModule: (moduleId: number) => void;
}

type MasteryTier = 'mastered' | 'in-progress' | 'not-started';

export const ThemeMasteryTimeline: React.FC<ThemeMasteryTimelineProps> = ({
  theme,
  stats,
  selectedModuleId,
  matchingModuleIds = null,
  onSelectModule,
  onPracticeModule,
}) => {
  const completedSet = new Set(stats.completedModules || []);

  const timelineNodes = theme.moduleConnections.map((conn) => {
    const modStat = stats.moduleMastery?.[conn.moduleId];
    const accuracy =
      modStat && modStat.total > 0
        ? Math.round((modStat.correct / modStat.total) * 100)
        : null;
    const isCompleted = completedSet.has(conn.moduleId);
    const tier: MasteryTier =
      isCompleted || (accuracy !== null && accuracy >= 75)
        ? 'mastered'
        : modStat && modStat.total > 0
        ? 'in-progress'
        : 'not-started';

    const matchesSearch =
      matchingModuleIds === null || matchingModuleIds.has(conn.moduleId);

    return {
      conn,
      accuracy,
      isCompleted,
      tier,
      matchesSearch,
    };
  });

  const masteredCount = timelineNodes.filter((n) => n.tier === 'mastered').length;
  const inProgressCount = timelineNodes.filter((n) => n.tier === 'in-progress').length;
  const totalCount = timelineNodes.length;
  const masteryPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  const nextUnmasteredNode = timelineNodes.find((n) => n.tier !== 'mastered');

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 space-y-4">
      {/* Header + Mastery Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Interactive Thread Mastery Timeline · {theme.shortTitle}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Track mastered modules across this interconnecting thread (≥75% accuracy or marked complete). Click any milestone node to inspect that module&apos;s bridge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">{masteredCount}</span>
            <span className="text-slate-400 dark:text-slate-500"> / </span>
            <span className="text-slate-900 dark:text-slate-100">{totalCount} Mastered</span>
            <span className="ml-1.5 text-[#0078D4] dark:text-sky-400">({masteryPct}%)</span>
          </div>

          {nextUnmasteredNode && (
            <button
              type="button"
              onClick={() => onPracticeModule(nextUnmasteredNode.conn.moduleId)}
              className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Practice Next: M{nextUnmasteredNode.conn.moduleId}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Overall Thread Mastery Bar + Legend */}
      <div className="space-y-2">
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${masteryPct}%` }}
            title={`${masteredCount} mastered`}
          />
          {inProgressCount > 0 && (
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${Math.round((inProgressCount / totalCount) * 100)}%` }}
              title={`${inProgressCount} in progress`}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mastered ({masteredCount})</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>In Progress ({inProgressCount})</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Not Started ({Math.max(0, totalCount - masteredCount - inProgressCount)})</span>
            </span>
          </div>
          <span className="text-[10.5px] font-semibold">
            {masteryPct === 100
              ? 'Full Thread Mastered'
              : 'Origin Anchor → Core Carryover → Exam Payoff'}
          </span>
        </div>
      </div>

      {/* Connected Interactive Node Timeline */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-stretch gap-0 min-w-max py-1 px-0.5">
          {timelineNodes.map((node, idx) => {
            const { conn, accuracy, tier, matchesSearch } = node;
            const isSelected = conn.moduleId === selectedModuleId;
            const prevMastered = idx > 0 && timelineNodes[idx - 1].tier === 'mastered';

            return (
              <React.Fragment key={conn.moduleId}>
                {idx > 0 && (
                  <div className="flex items-center self-center -mt-6 px-0.5" aria-hidden="true">
                    <div
                      className={`h-0.5 w-6 sm:w-8 rounded-full transition-colors ${
                        prevMastered && tier === 'mastered'
                          ? 'bg-emerald-500'
                          : prevMastered || tier === 'mastered'
                          ? 'bg-sky-300 dark:bg-sky-700'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onSelectModule(conn.moduleId)}
                  className={`group w-36 sm:w-40 p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shrink-0 ${
                    !matchesSearch ? 'opacity-35 hover:opacity-85' : ''
                  } ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-[#0078D4] ring-2 ring-[#0078D4]/30 shadow-sm'
                      : tier === 'mastered'
                      ? 'bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 hover:border-[#0078D4]'
                      : tier === 'in-progress'
                      ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-300/80 dark:border-amber-800/70 hover:border-[#0078D4]'
                      : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-700 hover:border-[#0078D4]'
                  }`}
                  aria-current={isSelected ? 'step' : undefined}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        tier === 'mastered'
                          ? 'bg-emerald-600 text-white'
                          : tier === 'in-progress'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {tier === 'mastered' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span>M{conn.moduleId}</span>
                      )}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                        tier === 'mastered'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                          : tier === 'in-progress'
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {accuracy !== null ? `${accuracy}%` : tier === 'mastered' ? 'Done' : 'New'}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                      M{conn.moduleId}: {conn.serviceCategory}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {conn.moduleTitle}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                    <span>{conn.roleInThread}</span>
                    {isSelected && (
                      <span className="text-[#0078D4] dark:text-sky-400 font-bold">Active</span>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
