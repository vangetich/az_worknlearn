import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart3,
  ArrowRight,
  Layers,
  BookOpen,
  Compass,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  ThreadTagId,
  THREAD_TAG_META,
  getGlobalThemeSummaryData,
  getAllModulesThemeBreakdown,
  doesModuleMatchThemeSearch,
} from '../data/azureThemesData';

interface GlobalThemeSummaryViewProps {
  stats: UserStats;
  questions: Question[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onOpenThreadPath: (tagId: ThreadTagId) => void;
  onInspectTheme: (themeId: string, moduleId?: number) => void;
  onPracticeModule: (moduleId: number) => void;
}

type ChartMetricMode = 'modules' | 'questions';

interface ChartTooltipPayloadItem {
  payload?: {
    label: string;
    primaryCount: number;
    totalConnected: number;
    primaryFrequencyPct: number;
    curriculumCoveragePct: number;
    questionCount: number;
    primaryModulesText: string;
  };
}

const CustomThreadTooltip: React.FC<{
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  metricMode: ChartMetricMode;
}> = ({ active, payload, metricMode }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const d = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs space-y-1.5 max-w-xs">
      <div className="font-bold text-slate-900 dark:text-slate-100">{d.label}</div>
      {metricMode === 'modules' ? (
        <>
          <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300 tabular-nums">
            <span>Primary Focus (#1):</span>
            <span className="font-bold text-[#0078D4] dark:text-sky-400">
              {d.primaryCount}/12 modules ({d.primaryFrequencyPct}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300 tabular-nums">
            <span>Total Curriculum Reach:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {d.totalConnected}/12 modules ({d.curriculumCoveragePct}%)
            </span>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Primary Anchor Modules: {d.primaryModulesText}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300 tabular-nums">
          <span>Questions Tagged:</span>
          <span className="font-bold text-[#0078D4] dark:text-sky-400">
            {d.questionCount} questions
          </span>
        </div>
      )}
    </div>
  );
};

export const GlobalThemeSummaryView: React.FC<GlobalThemeSummaryViewProps> = ({
  stats,
  questions,
  searchQuery = '',
  onClearSearch,
  onOpenThreadPath,
  onInspectTheme,
  onPracticeModule,
}) => {
  const [chartMetricMode, setChartMetricMode] = useState<ChartMetricMode>('modules');

  const summaryItems = useMemo(
    () => getGlobalThemeSummaryData(questions),
    [questions]
  );

  const allModulesCatalog = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({
          ...m,
          pathTitle: p.title,
          examWeight: p.examWeight,
        }))
      ),
    []
  );

  const moduleBreakdownRows = useMemo(
    () => getAllModulesThemeBreakdown(questions),
    [questions]
  );

  const filteredModuleRows = useMemo(() => {
    return moduleBreakdownRows.filter((row) => {
      const modInfo = allModulesCatalog.find((m) => m.id === row.moduleId);
      if (!searchQuery.trim()) return true;
      return doesModuleMatchThemeSearch(
        row.moduleId,
        searchQuery,
        modInfo?.title || ''
      );
    });
  }, [moduleBreakdownRows, allModulesCatalog, searchQuery]);

  const completedSet = useMemo(
    () => new Set(stats.completedModules || []),
    [stats.completedModules]
  );

  const masteredModulesCount = useMemo(() => {
    let count = 0;
    for (let modId = 1; modId <= 12; modId++) {
      const modStat = stats.moduleMastery?.[modId];
      const acc =
        modStat && modStat.total > 0
          ? Math.round((modStat.correct / modStat.total) * 100)
          : null;
      if (completedSet.has(modId) || (acc !== null && acc >= 75)) {
        count += 1;
      }
    }
    return count;
  }, [stats.moduleMastery, completedSet]);

  const topPrimaryThread = summaryItems[0];
  const broadestReachThread = useMemo(
    () =>
      [...summaryItems].sort(
        (a, b) =>
          b.totalConnectedModuleIds.length - a.totalConnectedModuleIds.length ||
          b.questionCount - a.questionCount
      )[0],
    [summaryItems]
  );

  const chartData = useMemo(
    () =>
      summaryItems.map((item) => ({
        tagId: item.tagId,
        label: item.label,
        primaryCount: item.primaryFocusModuleIds.length,
        totalConnected: item.totalConnectedModuleIds.length,
        primaryFrequencyPct: item.primaryFrequencyPct,
        curriculumCoveragePct: item.curriculumCoveragePct,
        questionCount: item.questionCount,
        accentHex: item.theme.accentHex,
        primaryModulesText:
          item.primaryFocusModuleIds.length > 0
            ? item.primaryFocusModuleIds.map((id) => `M${id}`).join(', ')
            : 'Supporting carryover',
      })),
    [summaryItems]
  );

  return (
    <div className="space-y-6">
      {/* Top 4-KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Curriculum Aggregation
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
            12 Modules · 6 Threads
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {questions.length} active questions analyzed across Paths 1–3
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Most Frequent #1 Primary Thread
          </div>
          <div className="text-xl font-bold text-[#0078D4] dark:text-sky-400 truncate">
            {topPrimaryThread?.label || 'Scaling'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            Primary focus in {topPrimaryThread?.primaryFocusModuleIds.length || 0}/12 modules (
            {topPrimaryThread?.primaryFrequencyPct || 0}%)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Broadest Thread Reach
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
            {broadestReachThread?.label || 'Scaling'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            Spans {broadestReachThread?.totalConnectedModuleIds.length || 0}/12 modules ·{' '}
            {broadestReachThread?.questionCount || 0} Qs
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Global Module Mastery
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {masteredModulesCount} / 12 Mastered
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {Math.round((masteredModulesCount / 12) * 100)}% curriculum threads verified (≥75%)
          </div>
        </div>
      </section>

      {/* Visual Frequency Chart + Thread Distribution */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] dark:text-sky-400">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Global Theme Frequency Across Modules 1–12</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 text-balance">
              Primary Focus vs. Cross-Module Thread Reach
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Compare how often each interconnecting thread anchors a module as its #1 Primary Focus versus how broadly it carries across all 12 modules.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
            role="group"
            aria-label="Chart metric mode"
          >
            <button
              type="button"
              onClick={() => setChartMetricMode('modules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                chartMetricMode === 'modules'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Module Count (0–12)
            </button>
            <button
              type="button"
              onClick={() => setChartMetricMode('questions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                chartMetricMode === 'questions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Question Bank Volume
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Recharts Visualization */}
          <div className="lg:col-span-7 space-y-3">
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartMetricMode === 'modules' ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 12, right: 16, left: -16, bottom: 8 }}
                    barGap={6}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.25} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, 12]}
                      ticks={[0, 3, 6, 9, 12]}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                      content={<CustomThreadTooltip metricMode="modules" />}
                    />
                    <Bar
                      dataKey="primaryCount"
                      name="Primary Focus (#1)"
                      fill="#0078D4"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={26}
                    />
                    <Bar
                      dataKey="totalConnected"
                      name="Total Connected Modules"
                      fill="#94A3B8"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={26}
                    />
                  </BarChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 12, right: 16, left: -10, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.25} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                      content={<CustomThreadTooltip metricMode="questions" />}
                    />
                    <Bar
                      dataKey="questionCount"
                      name="Questions Tagged"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.tagId} fill={entry.accentHex} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
              {chartMetricMode === 'modules' ? (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#0078D4] inline-block" />
                    <span>Primary Focus (#1 Anchor Modules)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
                    <span>Total Connected Modules (Primary + Carryover)</span>
                  </span>
                </div>
              ) : (
                <span>
                  Total AZ-900 question tags mapped across {questions.length} active questions
                </span>
              )}
            </div>
          </div>

          {/* Right: Ranked Thread Frequency Breakdown */}
          <div className="lg:col-span-5 divide-y divide-slate-200/80 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {summaryItems.map((item) => (
              <div
                key={item.tagId}
                className="p-3.5 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.theme.accentHex }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                      Primary: {item.primaryFocusModuleIds.map((id) => `M${id}`).join(', ') || 'None'}{' '}
                      <span aria-hidden="true">·</span> {item.questionCount} Qs
                    </div>
                  </div>

                  <div className="text-right shrink-0 tabular-nums">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.primaryFocusModuleIds.length}/12 Primary
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.totalConnectedModuleIds.length}/12 total reach
                    </div>
                  </div>
                </div>

                {/* Proportion Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(8, item.primaryFrequencyPct)}%`,
                      backgroundColor: item.theme.accentHex,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onInspectTheme(item.theme.id)}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0078D4] dark:hover:text-sky-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Theme Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenThreadPath(item.tagId)}
                    className="text-[11px] font-bold text-[#0078D4] dark:text-sky-400 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Open {item.pathTitle}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete 12-Module Aggregation Matrix */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50">
              All 12 Modules · Primary &amp; Supporting Thread Aggregation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect every module&apos;s ranked thread priorities, bank question counts, and your current mastery status.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            Showing {filteredModuleRows.length} / 12 Modules
          </span>
        </div>

        {filteredModuleRows.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              No modules matched &ldquo;{searchQuery}&rdquo;.
            </p>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="px-3 py-1.5 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="py-3 px-3.5 whitespace-nowrap">Module</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">#1 Primary Focus</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">#2 Core Carryover</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">#3 Supporting</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Questions</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Your Mastery</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {filteredModuleRows.map((row) => {
                  const modInfo = allModulesCatalog.find((m) => m.id === row.moduleId);
                  const modStat = stats.moduleMastery?.[row.moduleId];
                  const acc =
                    modStat && modStat.total > 0
                      ? Math.round((modStat.correct / modStat.total) * 100)
                      : null;
                  const isMastered = completedSet.has(row.moduleId) || (acc !== null && acc >= 75);
                  const isInProgress = !isMastered && modStat && modStat.total > 0;
                  const primaryMeta = THREAD_TAG_META[row.primaryTag];

                  return (
                    <tr
                      key={row.moduleId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          M{row.moduleId}: {modInfo?.title || `Module ${row.moduleId}`}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Path {modInfo?.pathId || 1}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenThreadPath(row.primaryTag)}
                          className="font-bold text-[#0078D4] dark:text-sky-400 hover:underline cursor-pointer"
                          title={`Open ${primaryMeta.label} Thread Path`}
                        >
                          {primaryMeta.label}
                        </button>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        <button
                          type="button"
                          onClick={() => onOpenThreadPath(row.secondaryTag)}
                          className="hover:text-[#0078D4] dark:hover:text-sky-400 hover:underline cursor-pointer"
                        >
                          {THREAD_TAG_META[row.secondaryTag].label}
                        </button>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {row.supportingTag ? THREAD_TAG_META[row.supportingTag].label : '—'}
                      </td>

                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {row.questionCount} Qs
                      </td>

                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap tabular-nums">
                        {isMastered ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{acc !== null ? `${acc}%` : 'Done'}</span>
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{acc}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <Circle className="w-3.5 h-3.5" />
                            <span>New</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onInspectTheme(primaryMeta.themeId, row.moduleId)}
                            className="text-slate-600 dark:text-slate-300 hover:text-[#0078D4] dark:hover:text-sky-400 font-semibold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Bridge</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onPracticeModule(row.moduleId)}
                            className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Practice</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
