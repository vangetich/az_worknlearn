import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Target,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Award,
  SlidersHorizontal,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface ProfileAnalyticsTabProps {
  stats: UserStats;
  onOpenManageGoal?: () => void;
  onNavigateToPractice?: () => void;
}

interface DailyGoalAnalyticsPoint {
  dateKey: string;
  shortDate: string;
  fullDate: string;
  dayNumber: string;
  completed: number;
  correct: number;
  accuracy: number | null;
  targetGoal: number;
  variance: number;
  cumulativeCompleted: number;
  cumulativeTarget: number;
  goalMet: boolean;
  isToday: boolean;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const CustomDailyGoalTooltip = ({
  active,
  payload,
  chartMode,
}: {
  active?: boolean;
  payload?: any[];
  chartMode: 'daily' | 'cumulative';
}) => {
  if (!active || !payload || !payload.length) return null;
  const point: DailyGoalAnalyticsPoint = payload[0].payload;

  return (
    <div className="bg-slate-900/95 text-white backdrop-blur-md p-3.5 rounded-2xl border border-sky-400/40 shadow-2xl text-xs space-y-2.5 min-w-[235px] z-50">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 gap-3">
        <div className="flex items-center gap-1.5 font-extrabold text-sky-300">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>{point.fullDate}</span>
        </div>
        {point.isToday && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950">
            Today
          </span>
        )}
      </div>

      {chartMode === 'daily' ? (
        <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
              Daily Completion
            </span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                point.goalMet
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : point.completed > 0
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {point.goalMet
                ? 'Target Met ✓'
                : point.completed > 0
                ? 'In Progress'
                : '0 Logged'}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-black font-mono text-white">
              {point.completed} Qs
            </span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              Goal: {point.targetGoal} Qs
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/70">
            <span className="text-slate-400">Variance vs Target:</span>
            <span
              className={`font-mono font-extrabold ${
                point.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {point.variance >= 0 ? `+${point.variance}` : point.variance} Qs
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Cumulative Completed:</span>
            <span className="font-mono font-black text-emerald-300">
              {point.cumulativeCompleted} Qs
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Cumulative Target:</span>
            <span className="font-mono font-black text-amber-300">
              {point.cumulativeTarget} Qs
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/70">
            <span className="text-slate-400">Pace Delta:</span>
            <span
              className={`font-mono font-extrabold ${
                point.cumulativeCompleted - point.cumulativeTarget >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {point.cumulativeCompleted - point.cumulativeTarget >= 0
                ? `+${point.cumulativeCompleted - point.cumulativeTarget}`
                : point.cumulativeCompleted - point.cumulativeTarget}{' '}
              Qs
            </span>
          </div>
        </div>
      )}

      {point.accuracy !== null && (
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>Day Accuracy:</span>
          <span className="font-mono font-bold text-sky-300">
            {point.accuracy}% ({point.correct}/{point.completed})
          </span>
        </div>
      )}
    </div>
  );
};

export const ProfileAnalyticsTab: React.FC<ProfileAnalyticsTabProps> = ({
  stats,
  onOpenManageGoal,
  onNavigateToPractice,
}) => {
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const dailyGoal = Math.max(1, stats.dailyGoal || 10);

  const chartData: DailyGoalAnalyticsPoint[] = useMemo(() => {
    const attemptsByDate = new Map<string, { total: number; correct: number }>();

    Object.values(stats.attempts || {}).forEach((attemptList) => {
      attemptList.forEach((att) => {
        if (!att || typeof att.timestamp !== 'number') return;
        const d = new Date(att.timestamp);
        if (isNaN(d.getTime())) return;
        const key = toLocalDateKey(d);
        const curr = attemptsByDate.get(key) || { total: 0, correct: 0 };
        curr.total += 1;
        if (att.isCorrect) curr.correct += 1;
        attemptsByDate.set(key, curr);
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const points: DailyGoalAnalyticsPoint[] = [];
    let runningCompleted = 0;
    let runningTarget = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = toLocalDateKey(d);
      const rec = attemptsByDate.get(dateKey);

      const completed = rec?.total || 0;
      const correct = rec?.correct || 0;
      const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : null;

      runningCompleted += completed;
      runningTarget += dailyGoal;

      points.push({
        dateKey,
        shortDate: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        dayNumber: String(d.getDate()),
        completed,
        correct,
        accuracy,
        targetGoal: dailyGoal,
        variance: completed - dailyGoal,
        cumulativeCompleted: runningCompleted,
        cumulativeTarget: runningTarget,
        goalMet: completed >= dailyGoal,
        isToday: i === 0,
      });
    }

    return points;
  }, [stats.attempts, dailyGoal]);

  const summary = useMemo(() => {
    const totalCompleted30d = chartData.reduce((sum, p) => sum + p.completed, 0);
    const totalTarget30d = dailyGoal * 30;
    const goalMetDays = chartData.filter((p) => p.goalMet).length;
    const activeDays = chartData.filter((p) => p.completed > 0).length;
    const avgPerDay = Math.round((totalCompleted30d / 30) * 10) / 10;
    const avgPerActiveDay =
      activeDays > 0 ? Math.round((totalCompleted30d / activeDays) * 10) / 10 : 0;
    const bestDay = chartData.reduce(
      (best, curr) => (curr.completed > best.completed ? curr : best),
      chartData[0]
    );
    const todayPoint = chartData[chartData.length - 1];
    const targetCompletionRate = Math.min(
      999,
      Math.round((totalCompleted30d / Math.max(1, totalTarget30d)) * 100)
    );

    return {
      totalCompleted30d,
      totalTarget30d,
      goalMetDays,
      activeDays,
      avgPerDay,
      avgPerActiveDay,
      bestDay,
      todaySolved: todayPoint?.completed || 0,
      targetCompletionRate,
    };
  }, [chartData, dailyGoal]);

  const recent7Days = useMemo(() => chartData.slice(-7), [chartData]);

  return (
    <section
      aria-label="30-Day Daily Question Completion vs Target Goal Analytics"
      className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
    >
      <KitengeRibbon height={4} />

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 border border-white/25 text-amber-300 shadow-xs shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-400/25 text-sky-100 border border-sky-300/30">
                  30-Day Recharts Analytics
                </span>
                <h2 className="font-black text-base sm:text-xl tracking-tight text-white">
                  Daily Question Completion vs. Target Goal
                </h2>
              </div>
              <p className="text-xs text-sky-100/90 mt-0.5">
                Compares your actual solved questions each day against your daily target of{' '}
                <strong className="text-amber-300">{dailyGoal} questions/day</strong> across the last 30 days.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/45 border border-white/15 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'daily'
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Daily Totals</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'cumulative'
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Cumulative Pace</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowTargetLine((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showTargetLine
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-2xs'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Target Line</span>
            </button>

            {onOpenManageGoal && (
              <button
                type="button"
                onClick={onOpenManageGoal}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                <span>Edit Goal ({dailyGoal}Q)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-sky-50/75 border border-sky-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] block">
              30-Day Completed vs Target
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {summary.totalCompleted30d}
              </span>
              <span className="text-xs font-bold text-slate-600">
                / {summary.totalTarget30d} Qs ({summary.targetCompletionRate}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/75 border border-emerald-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Target Goal Met Days
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-700">
                {summary.goalMetDays}
              </span>
              <span className="text-xs font-bold text-emerald-800">
                / 30 days ({summary.activeDays} active)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/75 border border-amber-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
              Daily Average vs Target
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-amber-700">
                {summary.avgPerDay}
              </span>
              <span className="text-xs font-bold text-amber-900">
                vs {dailyGoal} Qs/day ({summary.avgPerActiveDay} active avg)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
              Today&apos;s Progress &amp; Peak
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {summary.todaySolved}/{dailyGoal}
              </span>
              <span className="text-xs font-bold text-slate-600">
                Peak: {summary.bestDay?.completed || 0} Qs
              </span>
            </div>
          </div>
        </div>

        {/* Empty-state notice if no real attempts logged yet */}
        {summary.totalCompleted30d === 0 && (
          <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-[#0078D4] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="font-extrabold text-slate-900 block">
                  No scenario completions logged in the past 30 days yet
                </strong>
                Start answering questions in the Practice Studio to populate your daily completion bars against your{' '}
                <strong>{dailyGoal} Qs/day</strong> target goal line.
              </div>
            </div>
            {onNavigateToPractice && (
              <button
                type="button"
                onClick={onNavigateToPractice}
                className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Start Practice Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Recharts Visualization */}
        <div className="h-72 sm:h-80 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'daily' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="shortDate"
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[
                    0,
                    (dataMax: number) => Math.max(dailyGoal + 4, dataMax + 2),
                  ]}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(val) => `${val}Q`}
                />
                <Tooltip content={<CustomDailyGoalTooltip chartMode="daily" />} />

                <Bar
                  dataKey="completed"
                  name="Questions Completed"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={20}
                >
                  {chartData.map((entry) => {
                    const fill = entry.isToday
                      ? entry.goalMet
                        ? '#10B981'
                        : '#0284C7'
                      : entry.goalMet
                      ? '#10B981'
                      : entry.completed > 0
                      ? '#0078D4'
                      : '#E2E8F0';
                    return <Cell key={`goal-bar-${entry.dateKey}`} fill={fill} />;
                  })}
                </Bar>

                {showTargetLine && (
                  <>
                    <ReferenceLine
                      y={dailyGoal}
                      stroke="#F59E0B"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `Target Goal: ${dailyGoal} Qs/day`,
                        position: 'insideTopRight',
                        fill: '#B45309',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="targetGoal"
                      name="Target Goal"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={{ r: 4, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </>
                )}
              </ComposedChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 16, right: 16, left: -6, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="cumulativeCompletedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078D4" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0078D4" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="shortDate"
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(val) => `${val}Q`}
                />
                <Tooltip content={<CustomDailyGoalTooltip chartMode="cumulative" />} />

                <Area
                  type="monotone"
                  dataKey="cumulativeCompleted"
                  name="Cumulative Completed"
                  stroke="#0078D4"
                  strokeWidth={2.5}
                  fill="url(#cumulativeCompletedFill)"
                  activeDot={{ r: 5, fill: '#0078D4', stroke: '#FFFFFF', strokeWidth: 2 }}
                />

                {showTargetLine && (
                  <Line
                    type="monotone"
                    dataKey="cumulativeTarget"
                    name="Cumulative Target Goal"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 4, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Last 7 Days Daily Variance Strip */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#0078D4]" />
              <span>Last 7 Days vs. Daily Target ({dailyGoal} Qs)</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {recent7Days.filter((d) => d.goalMet).length}/7 days hit target this week
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {recent7Days.map((day) => (
              <div
                key={`recent-${day.dateKey}`}
                className={`p-2 rounded-xl border text-center transition-all ${
                  day.goalMet
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : day.completed > 0
                    ? 'bg-sky-50 border-sky-200 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {day.isToday ? 'Today' : day.shortDate}
                </div>
                <div className="text-sm font-black font-mono mt-0.5">
                  {day.completed}/{day.targetGoal}
                </div>
                <div
                  className={`text-[10px] font-extrabold mt-0.5 ${
                    day.goalMet
                      ? 'text-emerald-700'
                      : day.completed > 0
                      ? 'text-[#0078D4]'
                      : 'text-slate-400'
                  }`}
                >
                  {day.goalMet ? (
                    <span className="inline-flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      +{day.variance}
                    </span>
                  ) : (
                    `${day.variance} Qs`
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Goal Met (≥ {dailyGoal} Qs)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0078D4] inline-block" />
              <span>Partial Day (1–{Math.max(1, dailyGoal - 1)} Qs)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-0.5 bg-amber-500 inline-block border-t border-dashed border-amber-600" />
              <span>Target Goal ({dailyGoal} Qs/day)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <MaasaiMedallion size={15} />
            <span>30-day totals update live as you solve scenario questions</span>
          </div>
        </div>
      </div>
    </section>
  );
};
