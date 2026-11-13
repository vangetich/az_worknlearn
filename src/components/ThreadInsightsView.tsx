import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Filter,
  GitBranch,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import {
  doesModuleMatchThemeSearch,
  evaluateInterconnectingThreadInsights,
  ThreadInsightReport,
} from '../data/azureThemesData';
import { ThreadMasteryBadgesPanel } from './ThreadMasteryBadgesPanel';

interface ThreadInsightsViewProps {
  stats: UserStats;
  questions?: Question[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onPracticeModule: (moduleId: number, pathId?: 1 | 2 | 3) => void;
  onInspectTheme: (themeId: string, moduleId?: number) => void;
}

type InsightsFilterMode = 'all' | 'bottlenecks' | 'badges' | 'unattempted';

export const ThreadInsightsView: React.FC<ThreadInsightsViewProps> = ({
  stats,
  questions = [],
  searchQuery = '',
  onClearSearch,
  onPracticeModule,
  onInspectTheme,
}) => {
  const [filterMode, setFilterMode] = useState<InsightsFilterMode>('all');

  const reports = useMemo(
    () => evaluateInterconnectingThreadInsights(stats, questions),
    [stats, questions]
  );

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((report) => {
      if (filterMode === 'bottlenecks' && report.activeWeakModules.length === 0) {
        return false;
      }
      if (filterMode === 'badges' && !report.badgeUnlocked) {
        return false;
      }
      if (
        filterMode === 'unattempted' &&
        !report.modules.some((m) => m.status === 'unattempted')
      ) {
        return false;
      }

      if (!q) return true;
      const matchesMeta =
        report.tagId.toLowerCase().includes(q) ||
        report.theme.title.toLowerCase().includes(q) ||
        report.badge.title.toLowerCase().includes(q) ||
        report.bottleneckHeadline.toLowerCase().includes(q);
      const matchesModule = report.modules.some((m) =>
        doesModuleMatchThemeSearch(m.moduleId, q, m.moduleTitle)
      );
      return matchesMeta || matchesModule;
    });
  }, [reports, filterMode, searchQuery]);

  // Top KPI computations
  const kpi = useMemo(() => {
    const badgesUnlocked = reports.filter((r) => r.badgeUnlocked).length;
    const activeThreads = reports.filter((r) => r.totalAttempts > 0);
    const threadsWithBottleneck = reports.filter((r) => r.activeWeakModules.length > 0);

    const strongestThread = [...activeThreads].sort(
      (a, b) => (b.aggregatedAccuracyPct ?? 0) - (a.aggregatedAccuracyPct ?? 0)
    )[0];

    const priorityBottleneckReport = [...threadsWithBottleneck].sort(
      (a, b) =>
        (a.primaryBottleneck?.accuracyPct ?? 100) -
          (b.primaryBottleneck?.accuracyPct ?? 100) ||
        b.unresolvedMistakesCount - a.unresolvedMistakesCount
    )[0];

    return {
      badgesUnlocked,
      activeCount: activeThreads.length,
      bottleneckThreadCount: threadsWithBottleneck.length,
      strongestThread,
      priorityBottleneckReport,
    };
  }, [reports]);

  // Chart data comparing real-time thread accuracy vs. 80% Mastery Badge threshold
  const chartData = useMemo(
    () =>
      reports.map((r) => ({
        name: r.tagId,
        accuracy: r.aggregatedAccuracyPct ?? 0,
        hasAttempts: r.totalAttempts > 0,
        modulesAt80: r.modulesAt80Count,
        totalModules: r.totalModulesCount,
        badgeUnlocked: r.badgeUnlocked,
        accentColor: r.badge.accentColor,
        bottleneckLabel: r.primaryBottleneck
          ? `M${r.primaryBottleneck.moduleId} (${
              r.primaryBottleneck.accuracyPct !== null
                ? `${r.primaryBottleneck.accuracyPct}%`
                : 'Not attempted'
            })`
          : 'All >= 80%',
      })),
    [reports]
  );

  const getSeverityBadge = (report: ThreadInsightReport) => {
    switch (report.bottleneckSeverity) {
      case 'clear':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Badge Earned (80%+)</span>
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Critical Bottleneck</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Below 80% Target</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Activity className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
            <span>Pending Modules</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Diagnostic Header & 4 KPI Cards */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] dark:text-sky-400">
              <Activity className="w-4 h-4 shrink-0" />
              <span>Real-Time Conceptual Thread Telemetry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
              Interconnecting Thread Insights &amp; Bottleneck Diagnostics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Live quiz accuracy aggregated across every module carrying each conceptual theme. Spot exactly which module is breaking continuity across a thread—and unlock each Thread Mastery Badge by clearing 80% across every linked module.
            </p>
          </div>

          {kpi.priorityBottleneckReport?.primaryBottleneck && (
            <button
              type="button"
              onClick={() =>
                onPracticeModule(
                  kpi.priorityBottleneckReport.primaryBottleneck!.moduleId,
                  kpi.priorityBottleneckReport.primaryBottleneck!.pathId
                )
              }
              className="px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>
                Fix Priority Bottleneck: M
                {kpi.priorityBottleneckReport.primaryBottleneck.moduleId}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Thread Mastery Badges
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <span>{kpi.badgesUnlocked} / 6</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Requires 80%+ on all linked modules
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Threads with Active Data
            </div>
            <div className="text-2xl font-bold text-[#0078D4] dark:text-sky-400">
              {kpi.activeCount} / 6
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {stats.totalAnswered} total logged responses
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Strongest Thread Performance
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate">
              {kpi.strongestThread
                ? `${kpi.strongestThread.tagId} (${kpi.strongestThread.aggregatedAccuracyPct}%)`
                : 'Awaiting Attempts'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {kpi.strongestThread
                ? `${kpi.strongestThread.modulesAt80Count}/${kpi.strongestThread.totalModulesCount} modules >= 80%`
                : 'Start practicing to generate thread scores'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Priority Conceptual Bottleneck
            </div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-400 truncate">
              {kpi.priorityBottleneckReport?.primaryBottleneck
                ? `M${kpi.priorityBottleneckReport.primaryBottleneck.moduleId} · ${kpi.priorityBottleneckReport.tagId}`
                : 'No Active Weak Spots'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {kpi.priorityBottleneckReport?.primaryBottleneck
                ? `${kpi.priorityBottleneckReport.primaryBottleneck.accuracyPct ?? 0}% accuracy (${kpi.bottleneckThreadCount} thread${kpi.bottleneckThreadCount === 1 ? '' : 's'} impacted)`
                : 'All practiced thread modules >= 80%'}
            </div>
          </div>
        </div>

        {/* Comparative Recharts Chart: Aggregated Thread Accuracy vs 80% Badge Benchmark */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Live Aggregated Thread Accuracy vs. 80% Badge Benchmark
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dashed green line marks the 80% mastery threshold required per module for Thread Mastery Badges.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                70% Exam Pass
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                80% Badge Bar
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.22} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs shadow-lg border border-slate-700 space-y-1">
                        <div className="font-bold">{item.name} Thread</div>
                        <div className="tabular-nums text-sky-300">
                          Aggregated Accuracy:{' '}
                          {item.hasAttempts ? `${item.accuracy}%` : 'No attempts yet'}
                        </div>
                        <div className="tabular-nums text-emerald-300">
                          Modules at 80%+: {item.modulesAt80} / {item.totalModules}
                        </div>
                        <div className="text-amber-300">Focus: {item.bottleneckLabel}</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={70} stroke="#D97706" strokeDasharray="4 4" />
                <ReferenceLine y={80} stroke="#059669" strokeDasharray="4 4" />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        !entry.hasAttempts
                          ? '#94a3b8'
                          : entry.accuracy >= 80
                          ? '#059669'
                          : entry.accuracy >= 60
                          ? '#0078D4'
                          : '#E11D48'
                      }
                      fillOpacity={entry.hasAttempts ? 0.92 : 0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Filter Bar + Detailed Thread Bottleneck Diagnostic Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Filter className="w-4 h-4 text-[#0078D4] dark:text-sky-400" />
            <span>Filter Interconnecting Thread Insights:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All Threads (${reports.length})` },
                {
                  id: 'bottlenecks',
                  label: `Active Bottlenecks (${kpi.bottleneckThreadCount})`,
                },
                { id: 'badges', label: `Badges Earned (${kpi.badgesUnlocked})` },
                { id: 'unattempted', label: 'Needs Module Practice' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterMode(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  filterMode === opt.id
                    ? 'bg-[#0078D4] text-white border-[#0078D4]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0078D4]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No conceptual threads match your active filter{searchQuery ? ` ("${searchQuery}")` : ''}.
            </p>
            <div className="flex items-center justify-center gap-2">
              {filterMode !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="px-3 py-1.5 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
                >
                  Show All Threads
                </button>
              )}
              {searchQuery && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReports.map((report) => {
              const { primaryBottleneck } = report;

              return (
                <article
                  key={report.tagId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#0078D4] dark:text-sky-400">
                            {report.theme.numberLabel} · {report.tagId}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                            {report.totalAttempts} attempts ·{' '}
                            {report.unresolvedMistakesCount} unresolved mistakes
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug">
                          {report.theme.shortTitle}
                        </h3>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                          {report.aggregatedAccuracyPct !== null
                            ? `${report.aggregatedAccuracyPct}%`
                            : '—'}
                        </div>
                        {getSeverityBadge(report)}
                      </div>
                    </div>

                    {/* Bottleneck Diagnostic Callout */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                        report.bottleneckSeverity === 'clear'
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : report.bottleneckSeverity === 'critical'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                          : report.bottleneckSeverity === 'warning'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                        <ShieldAlert
                          className={`w-4 h-4 shrink-0 ${
                            report.bottleneckSeverity === 'clear'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : report.bottleneckSeverity === 'critical'
                              ? 'text-rose-600 dark:text-rose-400'
                              : report.bottleneckSeverity === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-[#0078D4] dark:text-sky-400'
                          }`}
                        />
                        <span>{report.bottleneckHeadline}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {report.bottleneckNarrative}
                      </p>
                    </div>

                    {/* Module-by-Module Performance Bars inside this Thread */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>Connected Modules ({report.totalModulesCount})</span>
                        <span>
                          {report.modulesAt80Count}/{report.totalModulesCount} at 80%+ Badge Goal
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {report.modules.map((mod) => {
                          const barColor = mod.isAt80Threshold
                            ? 'bg-emerald-500'
                            : mod.status === 'bottleneck'
                            ? 'bg-rose-500'
                            : mod.status === 'developing'
                            ? 'bg-amber-500'
                            : 'bg-slate-300 dark:bg-slate-700';

                          return (
                            <button
                              key={mod.moduleId}
                              type="button"
                              onClick={() => onPracticeModule(mod.moduleId, mod.pathId)}
                              className="text-left p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#0078D4] transition-colors cursor-pointer space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  M{mod.moduleId}: {mod.moduleTitle}
                                </span>
                                <span
                                  className={`font-bold tabular-nums shrink-0 ${
                                    mod.isAt80Threshold
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : mod.status === 'bottleneck'
                                      ? 'text-rose-700 dark:text-rose-400'
                                      : mod.status === 'developing'
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {mod.accuracyPct !== null ? `${mod.accuracyPct}%` : '0 Qs'}
                                </span>
                              </div>

                              <div className="relative w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${barColor}`}
                                  style={{ width: `${mod.accuracyPct ?? 0}%` }}
                                />
                                {/* 80% vertical threshold marker */}
                                <span
                                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900/40 dark:bg-white/60"
                                  style={{ left: '80%' }}
                                  aria-hidden="true"
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                                <span className="truncate">{mod.serviceCategory}</span>
                                <span className="shrink-0">
                                  {mod.correct}/{mod.total} Qs
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onInspectTheme(report.theme.id, primaryBottleneck?.moduleId)
                      }
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0078D4] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Inspect Thread Mapping</span>
                    </button>

                    {primaryBottleneck ? (
                      <button
                        type="button"
                        onClick={() =>
                          onPracticeModule(
                            primaryBottleneck.moduleId,
                            primaryBottleneck.pathId
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>
                          {report.activeWeakModules.length > 0
                            ? `Drill Bottleneck M${primaryBottleneck.moduleId}`
                            : `Start Next Module M${primaryBottleneck.moduleId}`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{report.badge.title} Mastered</span>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Dedicated 6-Badge Mastery Panel inside Azure Themes */}
      <ThreadMasteryBadgesPanel
        stats={stats}
        questions={questions}
        reports={reports}
        onPracticeModule={onPracticeModule}
        onInspectThread={onInspectTheme}
      />
    </div>
  );
};
