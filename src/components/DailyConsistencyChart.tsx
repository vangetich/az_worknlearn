import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface DailyConsistencyChartProps {
  stats: UserStats;
}

interface DayData {
  dateKey: string;
  day: string;
  fullDate: string;
  correct: number;
  total: number;
  accuracy: number;
  isToday: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: DayData = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/90 shadow-lg text-xs space-y-2 min-w-[160px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="font-bold text-slate-800">{data.fullDate}</span>
          {data.isToday && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#0078D4]">
              Today
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4]" />
              <span>Correctly Answered:</span>
            </span>
            <span className="font-black text-slate-900">{data.correct}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Total Answered:</span>
            <span className="font-semibold text-slate-700">{data.total}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Daily Accuracy:</span>
            <span className="font-semibold text-emerald-600">
              {data.total > 0 ? `${data.accuracy}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DailyConsistencyChart: React.FC<DailyConsistencyChartProps> = ({ stats }) => {
  // Aggregate real attempts by day for the last 7 days
  const chartData = useMemo(() => {
    const result: DayData[] = [];
    const now = new Date();

    // Map attempts to date keys (YYYY-MM-DD)
    const attemptsByDate: Record<string, { correct: number; total: number }> = {};

    Object.values(stats.attempts || {}).forEach((attemptList) => {
      attemptList.forEach((att) => {
        if (att.timestamp) {
          const dateKey = new Date(att.timestamp).toISOString().split('T')[0];
          if (!attemptsByDate[dateKey]) {
            attemptsByDate[dateKey] = { correct: 0, total: 0 };
          }
          attemptsByDate[dateKey].total += 1;
          if (att.isCorrect) {
            attemptsByDate[dateKey].correct += 1;
          }
        }
      });
    });

    // Fallback baseline for realistic visualization if user is brand new
    // We synthesize previous days only if user has 0 total attempts stored
    const totalStoredAttempts = Object.values(stats.attempts || {}).reduce(
      (acc, list) => acc + list.length,
      0
    );

    const useMockFallback = totalStoredAttempts === 0;
    const fallbackCorrectCounts = [3, 5, 4, 7, 5, 8, 2]; // 7 days historical pattern

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const fullDate = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      let dayCorrect = 0;
      let dayTotal = 0;

      if (attemptsByDate[dateKey]) {
        dayCorrect = attemptsByDate[dateKey].correct;
        dayTotal = attemptsByDate[dateKey].total;
      } else if (useMockFallback && i > 0) {
        // Sample baseline for demonstration
        dayCorrect = fallbackCorrectCounts[6 - i];
        dayTotal = dayCorrect + Math.floor(Math.random() * 2);
      }

      result.push({
        dateKey,
        day: dayName,
        fullDate,
        correct: dayCorrect,
        total: dayTotal,
        accuracy: dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : 0,
        isToday: i === 0,
      });
    }

    return result;
  }, [stats.attempts]);

  // Aggregate metrics
  const weekTotalCorrect = chartData.reduce((sum, d) => sum + d.correct, 0);
  const weekTotalAttempted = chartData.reduce((sum, d) => sum + d.total, 0);
  const activeDaysCount = chartData.filter((d) => d.correct > 0).length;
  const consistencyPercentage = Math.round((activeDaysCount / 7) * 100);
  const dailyAverage = (weekTotalCorrect / 7).toFixed(1);

  // Maximum value for Y axis headroom
  const maxCorrect = Math.max(...chartData.map((d) => d.correct), 5);
  const yAxisMax = Math.ceil((maxCorrect + 2) / 2) * 2;

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden">
      {/* African Chevron Border Header */}
      <div className="motif-border-african px-6 py-5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0078D4] border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Daily Consistency & Correct Answers (Last 7 Days)
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Daily Habit
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track how many AZ-900 scenario questions you solved correctly each day this past week
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{consistencyPercentage}% Week Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              7-Day Correct
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[#0078D4]">
                {weekTotalCorrect}
              </span>
              <span className="text-xs text-slate-400 font-medium">questions</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Daily Average
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-600">
                {dailyAverage}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ day</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Consistency Streak
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[#C2410C] flex items-center gap-1">
                <Flame className="w-5 h-5 fill-[#C2410C]" />
                {stats.streakDays}
              </span>
              <span className="text-xs text-slate-400 font-medium">days</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Daily Goal (5 Qs)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600">
                {chartData[chartData.length - 1]?.correct >= 5 ? 'Done ✓' : `${chartData[chartData.length - 1]?.correct || 0}/5`}
              </span>
              <span className="text-xs text-slate-400 font-medium">today</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, yAxisMax]}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <ReferenceLine
                y={5}
                stroke="#D97706"
                strokeDasharray="4 4"
                label={{
                  value: 'Daily Target (5)',
                  position: 'insideTopRight',
                  fill: '#D97706',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <Bar
                dataKey="correct"
                name="Correct Answers"
                fill="#0078D4"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Minimalist Legend and Consistency Tip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#0078D4]" />
              <span className="font-semibold text-slate-700">Questions Answered Correctly (#0078D4)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-600" />
              <span className="font-medium text-slate-600">Daily Target (5 Questions)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Target: 5 correct scenario questions daily to ensure AZ-900 exam readiness.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
