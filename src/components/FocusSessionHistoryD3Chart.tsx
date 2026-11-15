import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Maximize2,
  Clock,
  Zap,
  Target,
  Sparkles,
  RotateCcw,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Plus,
  Flame,
  Info,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  useFocusSessionHistory,
  WeeklyFocusSummary,
  WEEKLY_FOCUS_GOAL_MINUTES,
  FocusSessionRecord,
} from '../utils/focusSessionTracker';

interface FocusSessionHistoryD3ChartProps {
  onEnterFocusMode?: () => void;
  isFocusModeActive?: boolean;
}

type ChartMetric = 'minutes' | 'sessions';
type WeeksWindow = 4 | 6 | 8;

export const FocusSessionHistoryD3Chart: React.FC<FocusSessionHistoryD3ChartProps> = ({
  onEnterFocusMode,
  isFocusModeActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [weeksWindow, setWeeksWindow] = useState<WeeksWindow>(6);
  const [metricMode, setMetricMode] = useState<ChartMetric>('minutes');
  const [activeTab, setActiveTab] = useState<'chart' | 'logs'>('chart');
  const [hoveredWeek, setHoveredWeek] = useState<WeeklyFocusSummary | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyFocusSummary | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(720);

  const {
    sessions,
    weeklySummaries,
    stats,
    addManualSession,
    resetData,
  } = useFocusSessionHistory(weeksWindow);

  // Responsive width tracking via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(Math.floor(rect.width));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Auto-dismiss feedback toast after 3s
  useEffect(() => {
    if (!feedbackToast) return;
    const t = setTimeout(() => setFeedbackToast(null), 3000);
    return () => clearTimeout(t);
  }, [feedbackToast]);

  // Compute Productivity Trend comparing current week with prior week
  const productivityTrend = useMemo(() => {
    if (weeklySummaries.length < 2) return null;
    const current = weeklySummaries[weeklySummaries.length - 1];
    const prior = weeklySummaries[weeklySummaries.length - 2];

    const currentMins = current.totalMinutes;
    const priorMins = prior.totalMinutes;

    if (priorMins === 0) {
      return {
        percentChange: currentMins > 0 ? 100 : 0,
        direction: 'up' as const,
        currentMinutes: currentMins,
        priorMinutes: priorMins,
        label: `${currentMins}m logged this week (Starting fresh)`,
      };
    }

    const delta = currentMins - priorMins;
    const pct = Math.round((delta / priorMins) * 100);

    return {
      percentChange: Math.abs(pct),
      direction: pct >= 0 ? ('up' as const) : ('down' as const),
      currentMinutes: currentMins,
      priorMinutes: priorMins,
      label:
        pct > 0
          ? `+${pct}% focus time vs last week`
          : pct === 0
          ? 'Consistent focus time matching last week'
          : `${pct}% focus time vs last week`,
    };
  }, [weeklySummaries]);

  // Max value for Y-axis scaling based on selected metric
  const maxYValue = useMemo(() => {
    if (metricMode === 'minutes') {
      const highest = Math.max(...weeklySummaries.map((w) => w.totalMinutes), 0);
      return Math.max(highest + 15, WEEKLY_FOCUS_GOAL_MINUTES + 20, 80);
    } else {
      const highest = Math.max(...weeklySummaries.map((w) => w.sessionCount), 0);
      return Math.max(highest + 1, 5);
    }
  }, [weeklySummaries, metricMode]);

  // Render D3 Bar Chart with smooth animations and interactive states
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || weeklySummaries.length === 0) return;

    const isMobile = containerWidth < 500;
    const isTablet = containerWidth >= 500 && containerWidth < 768;

    const margin = {
      top: 36,
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 48 : 52,
      left: isMobile ? 42 : 54,
    };

    const svgHeight = isMobile ? 240 : 280;
    const innerWidth = Math.max(200, containerWidth - margin.left - margin.right);
    const innerHeight = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${containerWidth} ${svgHeight}`)
      .attr('width', '100%')
      .attr('height', svgHeight);

    // Defs: Gradients and drop shadows
    const defs = svg.append('defs');

    // Standard Azure gradient
    const azureGrad = defs
      .append('linearGradient')
      .attr('id', 'focusBarAzureGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    azureGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0284C7');
    azureGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0078D4');

    // Current Week Gradient (Emerald to Azure)
    const currentWeekGrad = defs
      .append('linearGradient')
      .attr('id', 'focusBarCurrentGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    currentWeekGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981');
    currentWeekGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0078D4');

    // Hover Highlight Gradient (Amber to Azure)
    const hoverGrad = defs
      .append('linearGradient')
      .attr('id', 'focusBarHoverGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    hoverGrad.append('stop').attr('offset', '0%').attr('stop-color', '#F59E0B');
    hoverGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0284C7');

    // Scales
    const xScale = d3
      .scaleBand<string>()
      .domain(weeklySummaries.map((w) => w.weekKey))
      .range([0, innerWidth])
      .paddingInner(isMobile ? 0.25 : 0.32)
      .paddingOuter(0.12);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxYValue])
      .range([innerHeight, 0])
      .nice();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Horizontal grid lines
    const yTicks = yScale.ticks(isMobile ? 4 : 5);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#E2E8F0')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-width', 1);

    // Productivity Goal Reference Line
    const targetValue = metricMode === 'minutes' ? WEEKLY_FOCUS_GOAL_MINUTES : 3;
    if (yScale(targetValue) >= 0 && yScale(targetValue) <= innerHeight) {
      const goalY = yScale(targetValue);
      const goalGroup = g.append('g').attr('class', 'goal-line-group');

      goalGroup
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', goalY)
        .attr('y2', goalY)
        .attr('stroke', '#059669')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');

      goalGroup
        .append('text')
        .attr('x', innerWidth - 6)
        .attr('y', goalY - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#059669')
        .attr('font-size', isMobile ? '9px' : '10px')
        .attr('font-weight', '800')
        .attr('font-family', 'sans-serif')
        .text(
          metricMode === 'minutes'
            ? `Weekly Goal: ${WEEKLY_FOCUS_GOAL_MINUTES}m`
            : 'Target: 3 sess/wk'
        );
    }

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(isMobile ? 4 : 5)
      .tickFormat((d) => (metricMode === 'minutes' ? `${d}m` : `${d}`));

    const yAxisG = g.append('g').call(yAxis);
    yAxisG.select('.domain').attr('stroke', '#CBD5E1');
    yAxisG.selectAll('.tick line').attr('stroke', '#CBD5E1');
    yAxisG
      .selectAll('.tick text')
      .attr('fill', '#64748B')
      .attr('font-size', isMobile ? '9px' : '11px')
      .attr('font-weight', '600');

    // X Axis
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`);

    xAxisG
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('stroke', '#CBD5E1');

    // Bar Groups
    const barGroups = g
      .selectAll('.bar-group')
      .data(weeklySummaries)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('cursor', 'pointer');

    // Animated Bars
    barGroups
      .append('rect')
      .attr('class', 'focus-bar')
      .attr('x', (d) => xScale(d.weekKey) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight) // Initial position for smooth entry animation
      .attr('height', 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) =>
        d.isCurrentWeek ? 'url(#focusBarCurrentGrad)' : 'url(#focusBarAzureGrad)'
      )
      .attr('stroke', (d) => (d.isCurrentWeek ? '#059669' : '#005A9E'))
      .attr('stroke-width', (d) => (d.isCurrentWeek ? 1.5 : 1))
      .transition()
      .duration(550)
      .ease(d3.easeCubicOut)
      .attr('y', (d) =>
        yScale(metricMode === 'minutes' ? d.totalMinutes : d.sessionCount)
      )
      .attr('height', (d) => {
        const val = metricMode === 'minutes' ? d.totalMinutes : d.sessionCount;
        return Math.max(0, innerHeight - yScale(val));
      });

    // Attach interactivity to bars
    barGroups
      .selectAll('rect')
      .on('mouseenter', function (event, d) {
        const datum = d as WeeklyFocusSummary;
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill', 'url(#focusBarHoverGrad)')
          .attr('stroke', '#D97706')
          .attr('stroke-width', 2);
        setHoveredWeek(datum);
      })
      .on('mouseleave', function (event, d) {
        const datum = d as WeeklyFocusSummary;
        d3.select(this)
          .transition()
          .duration(200)
          .attr(
            'fill',
            datum.isCurrentWeek
              ? 'url(#focusBarCurrentGrad)'
              : 'url(#focusBarAzureGrad)'
          )
          .attr('stroke', datum.isCurrentWeek ? '#059669' : '#005A9E')
          .attr('stroke-width', datum.isCurrentWeek ? 1.5 : 1);
        setHoveredWeek(null);
      })
      .on('click', (_event, d) => {
        const datum = d as WeeklyFocusSummary;
        setSelectedWeek((prev) => (prev?.weekKey === datum.weekKey ? null : datum));
      });

    // Value Labels on Top of Bars (animated fade-in)
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.weekKey) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => {
        const val = metricMode === 'minutes' ? d.totalMinutes : d.sessionCount;
        return Math.max(14, yScale(val) - 6);
      })
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.isCurrentWeek ? '#065F46' : '#1E293B'))
      .attr('font-size', isMobile ? '9px' : '11px')
      .attr('font-weight', '800')
      .attr('font-family', 'sans-serif')
      .attr('opacity', 0)
      .text((d) =>
        metricMode === 'minutes'
          ? d.totalMinutes > 0
            ? `${d.totalMinutes}m`
            : '0m'
          : `${d.sessionCount}`
      )
      .transition()
      .duration(600)
      .delay(180)
      .attr('opacity', 1);

    // Primary Date Sub-Label below bar (Week Name)
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.weekKey) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight + (isMobile ? 16 : 18))
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', isMobile ? '9px' : '11px')
      .attr('font-weight', (d) => (d.isCurrentWeek ? '800' : '700'))
      .attr('font-family', 'sans-serif')
      .text((d) => (isMobile ? d.shortLabel : d.weekLabel));

    // Secondary Sub-Label below bar (Opposite metric info)
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.weekKey) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight + (isMobile ? 28 : 34))
      .attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8')
      .attr('font-size', isMobile ? '8px' : '9px')
      .attr('font-weight', '600')
      .attr('font-family', 'sans-serif')
      .text((d) =>
        metricMode === 'minutes'
          ? `${d.sessionCount} sess`
          : `${d.totalMinutes}m total`
      );
  }, [weeklySummaries, maxYValue, containerWidth, metricMode]);

  return (
    <section
      data-testid="focus-session-history-section"
      aria-label="Focus Session History & Distraction-Free Trends"
      className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden shadow-xs"
    >
      {/* Top Azure Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#003865] to-[#0078D4] text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-black">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Productivity Trends
              </span>
              {isFocusModeActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CURRENTLY ACTIVE
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
              Focus Session History
            </h2>
            <p className="text-xs text-slate-200">
              Visualizing total minutes spent in Focus Mode per week to track distraction-free productivity trends over time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onEnterFocusMode && (
            <button
              type="button"
              onClick={onEnterFocusMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isFocusModeActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isFocusModeActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}</span>
            </button>
          )}

          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-[#0078D4] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
              D3 Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-[#0078D4] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Logs ({sessions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Productivity Trends Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 p-3.5 sm:p-5 bg-slate-50 border-b border-slate-200">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Total Focus Time</span>
            <Clock className="w-3.5 h-3.5 text-[#0078D4]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {stats.totalMinutes}m
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats.totalHours} hrs)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Across {stats.totalSessions} sessions
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Current Week Pace</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
              {stats.currentWeekMinutes}m
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {WEEKLY_FOCUS_GOAL_MINUTES}m goal
            </span>
          </div>
          <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.currentWeekGoalPercent}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Productivity Trend</span>
            {productivityTrend?.direction === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-sm sm:text-base font-black font-mono ${
                productivityTrend?.direction === 'up'
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {productivityTrend?.direction === 'up' ? '▲ Upward' : '● In Progress'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={productivityTrend?.label}>
            {productivityTrend?.label || 'Weekly tracking active'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Avg Session Duration</span>
            <Target className="w-3.5 h-3.5 text-[#0078D4]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-[#0078D4] font-mono">
              {stats.avgMinutesPerSession}m
            </span>
            <span className="text-xs text-slate-500 font-medium">per sprint</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Longest session: {stats.longestSessionMinutes}m
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chart' ? (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Chart Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800">
                {metricMode === 'minutes'
                  ? 'Total Minutes Spent in Focus Mode per Week'
                  : 'Distraction-Free Sessions Completed per Week'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                D3.js Bar Chart
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric Mode Toggle (Minutes vs Sessions) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMetricMode('minutes')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    metricMode === 'minutes'
                      ? 'bg-white text-[#0078D4] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Minutes
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode('sessions')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    metricMode === 'sessions'
                      ? 'bg-white text-[#0078D4] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sessions
                </button>
              </div>

              {/* Time Window Selector (4 vs 6 vs 8 weeks) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {([4, 6, 8] as WeeksWindow[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeeksWindow(w)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      weeksWindow === w
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {w}W
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* D3 SVG Container */}
          <div
            ref={containerRef}
            className="w-full relative overflow-hidden bg-slate-50/70 rounded-xl border border-slate-200/90 p-2 sm:p-3"
          >
            <svg ref={svgRef} className="overflow-visible block w-full" />

            {/* Interactive Tooltip Overlay */}
            {hoveredWeek && (
              <div className="pointer-events-none absolute top-3 right-3 sm:right-6 bg-slate-950/95 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1 z-20 animate-in fade-in duration-100 max-w-xs">
                <div className="font-black text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{hoveredWeek.weekLabel}</span>
                  {hoveredWeek.isCurrentWeek && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[9px] uppercase font-bold">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 font-mono">
                  <span className="text-slate-300 font-sans">Total Focus Time:</span>
                  <span className="font-bold text-white text-sm">
                    {hoveredWeek.totalMinutes} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 font-mono">
                  <span className="text-slate-300 font-sans">Completed Sessions:</span>
                  <span className="font-bold text-white">
                    {hoveredWeek.sessionCount} sessions
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 font-mono">
                  <span className="text-slate-300 font-sans">Average Sprint:</span>
                  <span className="font-bold text-emerald-300">
                    {hoveredWeek.averageMinutes} mins
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Selected Week Drill-down */}
          {selectedWeek && (
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-black text-sky-950">
                  {selectedWeek.weekLabel}: {selectedWeek.totalMinutes} total minutes
                </span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  {selectedWeek.sessionCount} focus session{selectedWeek.sessionCount === 1 ? '' : 's'} logged with an average of{' '}
                  <strong className="text-sky-900">{selectedWeek.averageMinutes}m</strong> per session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeek(null)}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer self-start sm:self-auto"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Quick Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Tip: The Study Coach detects prolonged interaction without question completion and offers a one-click Focus Mode prompt.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('az900-trigger-focus-suggestion'));
                  setFeedbackToast('Triggered Focus Mode suggestion prompt');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Test the intelligent Focus Mode suggestion banner directly"
              >
                <Zap className="w-3 h-3 text-amber-600 fill-current" />
                <span>Test Coach Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  addManualSession(15, 6, 'manual');
                  setFeedbackToast('Added +15m test focus session to history');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Log a quick 15-minute test focus session to explore chart updating"
              >
                <Plus className="w-3 h-3 text-[#0078D4]" />
                <span>+15m Test Session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetData();
                  setFeedbackToast('Reset focus sessions back to sample baseline');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset history back to realistic sample baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Session Logs List */
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
            <span className="font-extrabold text-slate-800">
              Focus Mode Session History ({sessions.length})
            </span>
            <button
              type="button"
              onClick={() => {
                addManualSession(20, 8, 'manual');
                setFeedbackToast('Added +20m test focus session');
              }}
              className="text-[#0078D4] hover:underline font-bold text-[11px] cursor-pointer"
            >
              + Log Sample Session
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {sessions.map((sess) => {
              const d = new Date(sess.endTime || sess.startTime);
              const dateStr = d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = d.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0078D4] border border-sky-200/80 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{dateStr}</span>
                        <span className="text-slate-400 font-normal">at {timeStr}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                            sess.source === 'prolonged_prompt'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : sess.source === 'floating_toggle'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sess.source === 'prolonged_prompt'
                            ? 'Coach Prompted'
                            : sess.source === 'floating_toggle'
                            ? 'Floating Toggle'
                            : 'Manual'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {sess.questionsAnsweredCount > 0
                          ? `${sess.questionsAnsweredCount} questions completed during session`
                          : 'Distraction-free review session'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span className="text-sm font-black text-[#0078D4]">
                      {sess.durationMinutes}m
                    </span>
                    <div className="text-[10px] text-slate-400">
                      ({Math.floor(sess.durationSeconds % 60)}s)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brief feedback toast */}
      {feedbackToast && (
        <div className="p-2.5 bg-slate-900 text-amber-300 text-xs font-bold text-center border-t border-slate-800 animate-in fade-in duration-150">
          {feedbackToast}
        </div>
      )}
    </section>
  );
};
