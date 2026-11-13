import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Flame,
  CheckCircle2,
  Target,
  Sparkles,
  Grid3X3,
  LayoutGrid,
  Award,
  TrendingUp,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { KitengeRibbon } from './MotifDecorations';

interface StudyStreakCalendarProps {
  stats: UserStats;
  onOpenManageGoal?: () => void;
}

type CalendarViewMode = 'heatmap' | 'months';

interface CalendarDayRecord {
  dateKey: string;
  dateObj: Date;
  dayOfMonth: number;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  fullDateLabel: string;
  monthLabel: string;
  solved: number;
  correct: number;
  accuracy: number;
  dailyGoal: number;
  goalPct: number;
  goalMet: boolean;
  level: 0 | 1 | 2 | 3 | 4; // 0=none, 1=warm-up, 2=50-99%, 3=goal met (100-149%), 4=exceeded (150%+)
  moduleIds: number[];
  isToday: boolean;
  isFuture: boolean;
  isOutOfRange?: boolean;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const StudyStreakCalendar: React.FC<StudyStreakCalendarProps> = ({
  stats,
  onOpenManageGoal,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('heatmap');
  const [onlyHighlightGoalMet, setOnlyHighlightGoalMet] = useState<boolean>(false);

  const dailyGoal = Math.max(1, stats.dailyGoal || 10);

  // Aggregate real user attempts by local YYYY-MM-DD date key
  const attemptsByDate = useMemo(() => {
    const map = new Map<
      string,
      { solved: number; correct: number; modules: Set<number> }
    >();

    Object.values(stats.attempts || {}).forEach((attemptList) => {
      attemptList.forEach((att) => {
        if (!att || typeof att.timestamp !== 'number') return;
        const d = new Date(att.timestamp);
        if (isNaN(d.getTime())) return;
        const key = toLocalDateKey(d);
        const existing = map.get(key) || {
          solved: 0,
          correct: 0,
          modules: new Set<number>(),
        };
        existing.solved += 1;
        if (att.isCorrect) existing.correct += 1;
        if (att.moduleId) existing.modules.add(att.moduleId);
        map.set(key, existing);
      });
    });

    return map;
  }, [stats.attempts]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const todayKey = useMemo(() => toLocalDateKey(today), [today]);

  const buildDayRecord = (
    d: Date,
    options?: { isOutOfRange?: boolean }
  ): CalendarDayRecord => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    const key = toLocalDateKey(copy);
    const rec = attemptsByDate.get(key);
    const solved = rec?.solved || 0;
    const correct = rec?.correct || 0;
    const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;
    const goalPct = Math.round((solved / dailyGoal) * 100);
    const goalMet = solved >= dailyGoal;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (solved >= Math.ceil(dailyGoal * 1.5)) {
      level = 4;
    } else if (solved >= dailyGoal) {
      level = 3;
    } else if (solved >= Math.max(1, Math.ceil(dailyGoal * 0.5))) {
      level = 2;
    } else if (solved >= 1) {
      level = 1;
    }

    return {
      dateKey: key,
      dateObj: copy,
      dayOfMonth: copy.getDate(),
      dayOfWeek: copy.getDay(),
      fullDateLabel: copy.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      monthLabel: copy.toLocaleDateString(undefined, { month: 'short' }),
      solved,
      correct,
      accuracy,
      dailyGoal,
      goalPct,
      goalMet,
      level,
      moduleIds: rec ? Array.from(rec.modules).sort((a, b) => a - b) : [],
      isToday: key === todayKey,
      isFuture: copy.getTime() > today.getTime(),
      isOutOfRange: options?.isOutOfRange,
    };
  };

  // Exact 3-month rolling date span (3 months ago -> today)
  const threeMonthRange = useMemo(() => {
    const rangeStart = new Date(today);
    rangeStart.setMonth(rangeStart.getMonth() - 3);
    rangeStart.setHours(0, 0, 0, 0);

    const days: CalendarDayRecord[] = [];
    const cursor = new Date(rangeStart);
    while (cursor.getTime() <= today.getTime()) {
      days.push(buildDayRecord(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    // Build week columns starting from the Sunday on or before rangeStart
    const gridStart = new Date(rangeStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const weeks: Array<{
      weekIndex: number;
      monthHeader: string | null;
      days: CalendarDayRecord[];
    }> = [];

    const gridCursor = new Date(gridStart);
    let weekIdx = 0;
    let lastLabeledMonth = -1;

    while (gridCursor.getTime() <= today.getTime() || gridCursor.getDay() !== 0) {
      if (gridCursor.getTime() > today.getTime() && gridCursor.getDay() === 0) {
        break;
      }

      const weekDays: CalendarDayRecord[] = [];
      let monthHeader: string | null = null;

      for (let dow = 0; dow < 7; dow++) {
        const isBeforeStart = gridCursor.getTime() < rangeStart.getTime();
        const isAfterToday = gridCursor.getTime() > today.getTime();
        const rec = buildDayRecord(gridCursor, {
          isOutOfRange: isBeforeStart || isAfterToday,
        });

        // Place month header on the column containing the 1st of a month (or first visible week)
        if (!isAfterToday && !isBeforeStart) {
          const m = gridCursor.getMonth();
          if (gridCursor.getDate() <= 7 && m !== lastLabeledMonth) {
            monthHeader = gridCursor.toLocaleDateString(undefined, {
              month: 'short',
            });
            lastLabeledMonth = m;
          }
        }

        weekDays.push(rec);
        gridCursor.setDate(gridCursor.getDate() + 1);
      }

      weeks.push({
        weekIndex: weekIdx++,
        monthHeader,
        days: weekDays,
      });
    }

    return { rangeStart, days, weeks };
  }, [today, attemptsByDate, dailyGoal, todayKey]);

  // 3 Calendar Months Breakdown (Month - 2, Month - 1, Current Month)
  const threeCalendarMonths = useMemo(() => {
    const months: Array<{
      key: string;
      title: string;
      leadingBlanks: number;
      days: CalendarDayRecord[];
      goalMetCount: number;
      activeCount: number;
    }> = [];

    for (let offset = 2; offset >= 0; offset--) {
      const firstOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() - offset,
        1
      );
      const year = firstOfMonth.getFullYear();
      const month = firstOfMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const leadingBlanks = firstOfMonth.getDay();

      const monthDays: CalendarDayRecord[] = [];
      let goalMetCount = 0;
      let activeCount = 0;

      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const d = new Date(year, month, dayNum);
        const rec = buildDayRecord(d);
        if (!rec.isFuture) {
          if (rec.goalMet) goalMetCount += 1;
          if (rec.solved > 0) activeCount += 1;
        }
        monthDays.push(rec);
      }

      months.push({
        key: `${year}-${month + 1}`,
        title: firstOfMonth.toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        }),
        leadingBlanks,
        days: monthDays,
        goalMetCount,
        activeCount,
      });
    }

    return months;
  }, [today, attemptsByDate, dailyGoal, todayKey]);

  // 3-Month Consistency & Goal Achievement Metrics
  const summary = useMemo(() => {
    const { days } = threeMonthRange;
    const totalDays = days.length;
    const goalMetDays = days.filter((d) => d.goalMet).length;
    const activeDays = days.filter((d) => d.solved > 0).length;
    const totalSolved = days.reduce((sum, d) => sum + d.solved, 0);
    const totalCorrect = days.reduce((sum, d) => sum + d.correct, 0);

    let bestGoalStreak = 0;
    let runningGoalStreak = 0;
    let bestActiveStreak = 0;
    let runningActiveStreak = 0;

    days.forEach((d) => {
      if (d.goalMet) {
        runningGoalStreak += 1;
        if (runningGoalStreak > bestGoalStreak) bestGoalStreak = runningGoalStreak;
      } else {
        runningGoalStreak = 0;
      }

      if (d.solved > 0) {
        runningActiveStreak += 1;
        if (runningActiveStreak > bestActiveStreak) bestActiveStreak = runningActiveStreak;
      } else {
        runningActiveStreak = 0;
      }
    });

    const consistencyPct = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
    const goalHitRatePct = totalDays > 0 ? Math.round((goalMetDays / totalDays) * 100) : 0;
    const avgPerActiveDay = activeDays > 0 ? Math.round((totalSolved / activeDays) * 10) / 10 : 0;

    return {
      totalDays,
      goalMetDays,
      activeDays,
      totalSolved,
      totalCorrect,
      overallAccuracy: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0,
      bestGoalStreak,
      bestActiveStreak,
      consistencyPct,
      goalHitRatePct,
      avgPerActiveDay,
    };
  }, [threeMonthRange]);

  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);

  const selectedDay = useMemo(() => {
    const found = threeMonthRange.days.find((d) => d.dateKey === selectedDayKey);
    if (found) return found;
    return buildDayRecord(today);
  }, [threeMonthRange.days, selectedDayKey, today, attemptsByDate, dailyGoal]);

  const getTileStyle = (day: CalendarDayRecord): string => {
    if (day.isOutOfRange) {
      return 'bg-transparent border-transparent pointer-events-none opacity-0';
    }
    if (day.isFuture) {
      return 'bg-slate-50/50 border-slate-200/50 text-slate-300 opacity-50 cursor-default';
    }

    if (onlyHighlightGoalMet && !day.goalMet && day.solved > 0) {
      return 'bg-slate-200/70 border-slate-300/70 text-slate-500 opacity-45';
    }

    switch (day.level) {
      case 4:
        return 'bg-gradient-to-br from-emerald-600 to-teal-600 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/70';
      case 3:
        return 'bg-emerald-500 border-emerald-600 text-white shadow-2xs';
      case 2:
        return 'bg-[#0078D4]/80 border-[#005A9E] text-white';
      case 1:
        return 'bg-sky-200 border-sky-300 text-sky-950';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300';
    }
  };

  return (
    <section
      aria-label="Study Streak Calendar"
      className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden"
    >
      <KitengeRibbon height={3} />

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-emerald-50/70 via-white to-sky-50/60 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-[#0078D4] text-white shadow-xs shrink-0 mt-0.5">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  Study Streak Calendar (Last 3 Months)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>{summary.goalMetDays} Goal-Met Days</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                3-month heat map highlighting every day you met or exceeded your daily target of{' '}
                <strong className="text-slate-900">{dailyGoal} questions/day</strong>.
              </p>
            </div>
          </div>

          {/* Controls: View Mode + Goal-Met Filter + Quick Adjust Goal */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'heatmap'
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Heat Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('months')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'months'
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>3-Month Grid</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOnlyHighlightGoalMet((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                onlyHighlightGoalMet
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Highlight only days where you met your daily question goal"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Goal-Met Only</span>
            </button>

            {onOpenManageGoal && (
              <button
                type="button"
                onClick={onOpenManageGoal}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-orange-600" />
                <span>Goal: {dailyGoal}Q</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Daily Goal Met (3M)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-700">
                {summary.goalMetDays}
              </span>
              <span className="text-[11px] font-bold text-emerald-800">
                / {summary.totalDays} days ({summary.goalHitRatePct}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] block">
              Active Study Days (3M)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {summary.activeDays}
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                days ({summary.consistencyPct}% active)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800 block">
              Best Goal Streak (3M)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-orange-600 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-600" />
                {summary.bestGoalStreak}d
              </span>
              <span className="text-[11px] font-bold text-orange-900">
                ({summary.bestActiveStreak}d active run)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              3-Month Volume
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {summary.totalSolved}
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                Qs • {summary.avgPerActiveDay}/day avg
              </span>
            </div>
          </div>
        </div>

        {/* Heat Map View (Rolling 3-Month Matrix) */}
        {viewMode === 'heatmap' && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200 overflow-x-auto">
            <div className="min-w-[540px] space-y-2">
              {/* Month Column Labels */}
              <div className="flex items-center gap-1.5 pl-9">
                {threeMonthRange.weeks.map((week) => (
                  <div
                    key={`m-lbl-${week.weekIndex}`}
                    className="flex-1 min-w-[22px] text-[10px] font-black text-slate-500 uppercase tracking-wider"
                  >
                    {week.monthHeader || ''}
                  </div>
                ))}
              </div>

              {/* 7 Rows (Sun-Sat) x ~14 Week Columns */}
              <div className="flex gap-1.5">
                {/* Weekday Axis */}
                <div className="flex flex-col justify-between gap-1.5 pr-1 shrink-0">
                  {WEEKDAY_LABELS.map((dayName, idx) => (
                    <div
                      key={dayName}
                      className="h-6 sm:h-7 flex items-center text-[10px] font-bold text-slate-500 w-7"
                    >
                      {idx % 2 === 1 ? dayName : ''}
                    </div>
                  ))}
                </div>

                {/* Week Columns */}
                <div className="flex-1 flex gap-1.5">
                  {threeMonthRange.weeks.map((week) => (
                    <div
                      key={`wk-${week.weekIndex}`}
                      className="flex-1 min-w-[22px] flex flex-col gap-1.5"
                    >
                      {week.days.map((day) => {
                        const isSelected = selectedDay.dateKey === day.dateKey;
                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            disabled={day.isOutOfRange || day.isFuture}
                            onMouseEnter={() => {
                              if (!day.isOutOfRange && !day.isFuture) {
                                setSelectedDayKey(day.dateKey);
                              }
                            }}
                            onClick={() => {
                              if (!day.isOutOfRange && !day.isFuture) {
                                setSelectedDayKey(day.dateKey);
                              }
                            }}
                            title={`${day.fullDateLabel}: ${day.solved}/${day.dailyGoal} Qs (${day.goalPct}%)${
                              day.goalMet ? ' — Daily Goal Met!' : ''
                            }`}
                            aria-label={`${day.fullDateLabel}, ${day.solved} of ${day.dailyGoal} questions solved`}
                            className={`relative h-6 sm:h-7 w-full rounded-md border text-[10px] font-black flex items-center justify-center transition-all duration-150 ${
                              !day.isOutOfRange && !day.isFuture
                                ? 'cursor-pointer hover:scale-110 hover:z-10'
                                : ''
                            } ${getTileStyle(day)} ${
                              day.isToday
                                ? 'ring-2 ring-orange-500 ring-offset-1'
                                : isSelected && !day.isOutOfRange
                                ? 'ring-2 ring-slate-900 ring-offset-1'
                                : ''
                            }`}
                          >
                            {!day.isOutOfRange && day.goalMet && (
                              <span className="leading-none">
                                {day.level === 4 ? '★' : '✓'}
                              </span>
                            )}
                            {!day.isOutOfRange && !day.goalMet && day.solved > 0 && (
                              <span className="text-[9px] font-mono opacity-90">
                                {day.solved}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Month Side-by-Side Calendar Grid View */}
        {viewMode === 'months' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {threeCalendarMonths.map((monthBlock) => (
              <div
                key={monthBlock.key}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    {monthBlock.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {monthBlock.goalMetCount} goal{monthBlock.goalMetCount === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {SHORT_WEEKDAY_LABELS.map((lbl, idx) => (
                    <div
                      key={`${monthBlock.key}-hdr-${idx}`}
                      className="text-[10px] font-extrabold text-slate-400 py-0.5"
                    >
                      {lbl}
                    </div>
                  ))}

                  {Array.from({ length: monthBlock.leadingBlanks }).map((_, i) => (
                    <div key={`${monthBlock.key}-blank-${i}`} />
                  ))}

                  {monthBlock.days.map((day) => {
                    const isSelected = selectedDay.dateKey === day.dateKey;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        disabled={day.isFuture}
                        onMouseEnter={() => {
                          if (!day.isFuture) setSelectedDayKey(day.dateKey);
                        }}
                        onClick={() => {
                          if (!day.isFuture) setSelectedDayKey(day.dateKey);
                        }}
                        title={`${day.fullDateLabel}: ${day.solved}/${day.dailyGoal} Qs`}
                        className={`h-8 rounded-lg border text-[11px] font-black flex flex-col items-center justify-center transition-all ${
                          day.isFuture ? 'cursor-default' : 'cursor-pointer hover:scale-105'
                        } ${getTileStyle(day)} ${
                          day.isToday
                            ? 'ring-2 ring-orange-500 ring-offset-1'
                            : isSelected
                            ? 'ring-2 ring-slate-900 ring-offset-1'
                            : ''
                        }`}
                      >
                        <span className="leading-none">{day.dayOfMonth}</span>
                        {day.solved > 0 && !day.isFuture && (
                          <span className="text-[8px] leading-none opacity-90 mt-0.5">
                            {day.goalMet ? '✓' : `${day.solved}Q`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Day Inspector + Legend Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Selected Day Detail Card */}
          <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              {selectedDay.goalMet ? (
                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : selectedDay.solved > 0 ? (
                <TrendingUp className="w-4 h-4 text-[#0078D4] shrink-0" />
              ) : (
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-black text-slate-900">
                {selectedDay.fullDateLabel}
                {selectedDay.isToday ? ' (Today)' : ''}
              </span>
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <span className="font-mono font-black text-[#0078D4]">
              {selectedDay.solved} / {selectedDay.dailyGoal} Qs ({selectedDay.goalPct}%)
            </span>

            {selectedDay.solved > 0 && (
              <span className="font-bold text-slate-600">
                Accuracy: <strong className="text-slate-900">{selectedDay.accuracy}%</strong>
              </span>
            )}

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedDay.level === 4
                  ? 'bg-emerald-600 text-white'
                  : selectedDay.goalMet
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : selectedDay.solved > 0
                  ? 'bg-sky-100 text-sky-900 border border-sky-200'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {selectedDay.level === 4
                ? '🔥 Goal Exceeded (150%+)'
                : selectedDay.goalMet
                ? '✓ Daily Goal Met'
                : selectedDay.solved > 0
                ? 'Partial Progress'
                : 'No Questions Recorded'}
            </span>

            {selectedDay.moduleIds.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                Modules: {selectedDay.moduleIds.map((id) => `M${id}`).join(', ')}
              </span>
            )}
          </div>

          {/* Heat Map Intensity Legend */}
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-slate-600">
            <span className="font-bold text-slate-500">Intensity:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 inline-block" />
              <span>0</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-sky-200 border border-sky-300 inline-block" />
              <span>1–49%</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-[#0078D4]/80 border border-[#005A9E] inline-block" />
              <span>50–99%</span>
            </span>
            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600 inline-block" />
              <span>Goal Met (100%+)</span>
            </span>
            <span className="inline-flex items-center gap-1 font-extrabold text-teal-700">
              <span className="w-3.5 h-3.5 rounded bg-gradient-to-br from-emerald-600 to-teal-600 border border-amber-400 inline-block" />
              <span>150%+ ★</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
