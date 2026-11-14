import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { QuizSessionRecord, UserStats } from '../types/quiz';

interface AccuracyTrendSparklineProps {
  sessions: QuizSessionRecord[];
  stats?: UserStats;
  onStartAdaptiveQuiz?: () => void;
}

interface SparklinePoint {
  index: number;
  label: string;
  sessionTitle: string;
  dateStr: string;
  mode: string;
  accuracy: number;
  movingAvg: number;
  delta: number;
  correctCount: number;
  totalQuestions: number;
  isPlateauPoint: boolean;
  isLive: boolean;
}

const FALLBACK_10_SESSIONS: Omit<SparklinePoint, 'movingAvg' | 'delta' | 'isPlateauPoint'>[] = [
  {
    index: 1,
    label: 'S1',
    sessionTitle: 'Cloud Concepts Baseline Drill',
    dateStr: 'Session 1',
    mode: 'practice',
    accuracy: 60,
    correctCount: 6,
    totalQuestions: 10,
    isLive: false,
  },
  {
    index: 2,
    label: 'S2',
    sessionTitle: 'Shared Responsibility & Models',
    dateStr: 'Session 2',
    mode: 'practice',
    accuracy: 65,
    correctCount: 13,
    totalQuestions: 20,
    isLive: false,
  },
  {
    index: 3,
    label: 'S3',
    sessionTitle: 'Core Azure Architecture Sprint',
    dateStr: 'Session 3',
    mode: 'adaptive',
    accuracy: 70,
    correctCount: 7,
    totalQuestions: 10,
    isLive: false,
  },
  {
    index: 4,
    label: 'S4',
    sessionTitle: 'Compute & Networking Practice',
    dateStr: 'Session 4',
    mode: 'practice',
    accuracy: 72,
    correctCount: 18,
    totalQuestions: 25,
    isLive: false,
  },
  {
    index: 5,
    label: 'S5',
    sessionTitle: 'Storage Redundancy & Tiers',
    dateStr: 'Session 5',
    mode: 'adaptive',
    accuracy: 71,
    correctCount: 10,
    totalQuestions: 14,
    isLive: false,
  },
  {
    index: 6,
    label: 'S6',
    sessionTitle: 'Identity, RBAC & Zero Trust',
    dateStr: 'Session 6',
    mode: 'mock',
    accuracy: 72,
    correctCount: 36,
    totalQuestions: 50,
    isLive: false,
  },
  {
    index: 7,
    label: 'S7',
    sessionTitle: 'Governance, Locks & Policy',
    dateStr: 'Session 7',
    mode: 'practice',
    accuracy: 71,
    correctCount: 15,
    totalQuestions: 21,
    isLive: false,
  },
  {
    index: 8,
    label: 'S8',
    sessionTitle: 'Cost Management & SLAs',
    dateStr: 'Session 8',
    mode: 'adaptive',
    accuracy: 76,
    correctCount: 13,
    totalQuestions: 17,
    isLive: false,
  },
  {
    index: 9,
    label: 'S9',
    sessionTitle: 'Full AZ-900 Readiness Check',
    dateStr: 'Session 9',
    mode: 'mock',
    accuracy: 80,
    correctCount: 40,
    totalQuestions: 50,
    isLive: false,
  },
  {
    index: 10,
    label: 'S10',
    sessionTitle: 'Recent Adaptive Mastery Drill',
    dateStr: 'Session 10',
    mode: 'adaptive',
    accuracy: 84,
    correctCount: 21,
    totalQuestions: 25,
    isLive: false,
  },
];

export const AccuracyTrendSparkline: React.FC<AccuracyTrendSparklineProps> = ({
  sessions,
  stats,
  onStartAdaptiveQuiz,
}) => {
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [highlightPlateauBand, setHighlightPlateauBand] = useState<boolean>(true);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState<number | null>(null);

  const {
    sparklineData,
    plateauAnalysis,
    latestScore,
    tenSessionAvg,
    netMomentum,
    hasLiveSessions,
  } = useMemo(() => {
    // Take up to the last 10 sessions, ordered oldest -> newest (S1 -> S10)
    const recentLogged = [...sessions]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    let rawPoints: Omit<SparklinePoint, 'movingAvg' | 'delta' | 'isPlateauPoint'>[] = [];

    if (recentLogged.length > 0) {
      rawPoints = recentLogged.map((s, idx) => ({
        index: idx + 1,
        label: `S${idx + 1}`,
        sessionTitle: s.title || `Quiz Session #${idx + 1}`,
        dateStr: s.dateStr || new Date(s.timestamp).toLocaleDateString(),
        mode: s.mode || 'practice',
        accuracy: Math.max(0, Math.min(100, Math.round(s.scorePercent))),
        correctCount: s.correctCount,
        totalQuestions: s.totalQuestions,
        isLive: true,
      }));
    } else if (stats?.attempts && Object.keys(stats.attempts).length > 0) {
      // Synthesize up to 10 chronological mini-session buckets from attempt history if no formal session records exist yet
      const allAttempts = Object.values(stats.attempts)
        .flat()
        .filter((a) => a && typeof a.timestamp === 'number')
        .sort((a, b) => a.timestamp - b.timestamp);

      if (allAttempts.length >= 3) {
        const bucketCount = Math.min(10, Math.max(3, Math.floor(allAttempts.length / 3)));
        const chunkSize = Math.max(1, Math.ceil(allAttempts.length / bucketCount));
        for (let i = 0; i < bucketCount; i++) {
          const slice = allAttempts.slice(i * chunkSize, (i + 1) * chunkSize);
          if (slice.length === 0) continue;
          const correct = slice.filter((a) => a.isCorrect).length;
          const acc = Math.round((correct / slice.length) * 100);
          rawPoints.push({
            index: rawPoints.length + 1,
            label: `S${rawPoints.length + 1}`,
            sessionTitle: `Practice Batch #${rawPoints.length + 1}`,
            dateStr: new Date(slice[slice.length - 1].timestamp).toLocaleDateString(),
            mode: 'practice',
            accuracy: acc,
            correctCount: correct,
            totalQuestions: slice.length,
            isLive: true,
          });
        }
      }
    }

    const usingLive = rawPoints.length > 0;
    if (!usingLive) {
      rawPoints = FALLBACK_10_SESSIONS;
    }

    // Detect learning plateau across any consecutive window of 3+ sessions (prioritizing the most recent window)
    let plateauStartIdx = -1;
    let plateauEndIdx = -1;
    let plateauMin = 0;
    let plateauMax = 0;
    let plateauMean = 0;

    if (rawPoints.length >= 3) {
      for (let end = rawPoints.length - 1; end >= 2; end--) {
        const windowPts = rawPoints.slice(Math.max(0, end - 3), end + 1);
        if (windowPts.length >= 3) {
          const scores = windowPts.map((p) => p.accuracy);
          const minS = Math.min(...scores);
          const maxS = Math.max(...scores);
          const spread = maxS - minS;
          // A learning plateau occurs when 3-4 consecutive sessions stay within a narrow <= 5% band
          if (spread <= 5) {
            plateauStartIdx = Math.max(0, end - 3);
            plateauEndIdx = end;
            plateauMin = Math.max(0, minS - 2);
            plateauMax = Math.min(100, maxS + 2);
            plateauMean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            break;
          }
        }
      }
    }

    const enriched: SparklinePoint[] = rawPoints.map((pt, idx) => {
      const windowSlice = rawPoints.slice(Math.max(0, idx - 2), idx + 1);
      const movingAvg = Math.round(
        windowSlice.reduce((sum, item) => sum + item.accuracy, 0) / windowSlice.length
      );
      const prevAcc = idx > 0 ? rawPoints[idx - 1].accuracy : pt.accuracy;
      const delta = pt.accuracy - prevAcc;
      const isPlateauPoint =
        plateauStartIdx !== -1 && idx >= plateauStartIdx && idx <= plateauEndIdx;

      return {
        ...pt,
        movingAvg,
        delta,
        isPlateauPoint,
      };
    });

    const firstScore = enriched[0]?.accuracy ?? 0;
    const lastScore = enriched[enriched.length - 1]?.accuracy ?? 0;
    const avgScore =
      enriched.length > 0
        ? Math.round(enriched.reduce((s, p) => s + p.accuracy, 0) / enriched.length)
        : 0;
    const momentum = lastScore - firstScore;

    const hasPlateau = plateauStartIdx !== -1;
    const isRecentPlateau = hasPlateau && plateauEndIdx >= enriched.length - 2;

    let statusType: 'plateau' | 'climbing' | 'mastery' | 'dip' = 'climbing';
    let headline = 'Upward Accuracy Trajectory';
    let recommendation =
      'Your session accuracy is climbing steadily. Keep mixing Adaptive & Mock sessions.';

    if (isRecentPlateau && plateauMean < 85) {
      statusType = 'plateau';
      headline = `Learning Plateau Detected (~${plateauMean}% Band)`;
      recommendation = `Your accuracy stabilized between ${plateauMin + 2}%–${plateauMax - 2}% over ${
        plateauEndIdx - plateauStartIdx + 1
      } consecutive sessions. Switch to Adaptive Quiz mode to target specific weak Azure services and break through 85%+.`;
    } else if (hasPlateau && plateauMean < 80) {
      statusType = 'plateau';
      headline = `Mid-Trend Plateau Identified (~${plateauMean}% Zone)`;
      recommendation = `Sessions ${enriched[plateauStartIdx]?.label}–${enriched[plateauEndIdx]?.label} plateaued around ${plateauMean}%. Drill missed module concepts to prevent another stall.`;
    } else if (lastScore >= 82 && avgScore >= 78) {
      statusType = 'mastery';
      headline = 'High-Mastery Exam Readiness Zone';
      recommendation =
        'Consistent 80%+ accuracy across recent sessions — you are well above the 700/1000 pass mark!';
    } else if (momentum < -4) {
      statusType = 'dip';
      headline = 'Recent Accuracy Dip — Review Recommended';
      recommendation =
        'Recent session scores dipped slightly. Review missed questions below before starting a new timed set.';
    }

    return {
      sparklineData: enriched,
      plateauAnalysis: {
        hasPlateau,
        statusType,
        headline,
        recommendation,
        startLabel: plateauStartIdx !== -1 ? enriched[plateauStartIdx]?.label : null,
        endLabel: plateauEndIdx !== -1 ? enriched[plateauEndIdx]?.label : null,
        plateauMin,
        plateauMax,
        plateauMean,
      },
      latestScore: lastScore,
      tenSessionAvg: avgScore,
      netMomentum: momentum,
      hasLiveSessions: usingLive,
    };
  }, [sessions, stats]);

  const activeInspectedSession = useMemo(() => {
    if (selectedSessionIdx !== null && sparklineData[selectedSessionIdx]) {
      return sparklineData[selectedSessionIdx];
    }
    return sparklineData[sparklineData.length - 1] || null;
  }, [selectedSessionIdx, sparklineData]);

  const CustomSparklineTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: SparklinePoint = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl border border-sky-400/35 text-xs min-w-52 z-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5 mb-1.5">
          <span className="font-black text-sky-300 truncate">
            {data.label}: {data.sessionTitle}
          </span>
          <span className="text-[10px] font-bold uppercase text-amber-300 shrink-0">
            {data.mode}
          </span>
        </div>

        <div className="space-y-1 text-[11px] tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Session Accuracy:</span>
            <span
              className={`font-black ${
                data.accuracy >= 70 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {data.accuracy}% ({data.correctCount}/{data.totalQuestions})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">3-Session Moving Avg:</span>
            <span className="font-bold text-sky-200">{data.movingAvg}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Session Delta:</span>
            <span
              className={`font-extrabold ${
                data.delta > 0
                  ? 'text-emerald-400'
                  : data.delta < 0
                  ? 'text-rose-400'
                  : 'text-amber-300'
              }`}
            >
              {data.delta > 0 ? `+${data.delta}%` : `${data.delta}%`}
            </span>
          </div>

          {data.isPlateauPoint && (
            <div className="mt-1.5 pt-1.5 border-t border-amber-500/30 flex items-center gap-1.5 text-[10px] font-extrabold text-amber-300">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Learning Plateau Band (~{plateauAnalysis.plateauMean}%)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50/90 rounded-2xl border border-sky-200/90 p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Top Header & Plateau Diagnostic Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-xl border shrink-0 ${
              plateauAnalysis.statusType === 'plateau'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : plateauAnalysis.statusType === 'mastery'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-blue-100 text-[#0078D4] border-blue-200'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                Accuracy Trend Sparkline (Last {sparklineData.length} Quiz Sessions)
              </h3>
              <span aria-hidden="true" className="text-slate-400 text-xs">
                ·
              </span>
              <span
                className={`text-[11px] font-black ${
                  plateauAnalysis.statusType === 'plateau'
                    ? 'text-amber-800'
                    : plateauAnalysis.statusType === 'mastery'
                    ? 'text-emerald-800'
                    : plateauAnalysis.statusType === 'dip'
                    ? 'text-rose-800'
                    : 'text-[#005A9E]'
                }`}
              >
                {plateauAnalysis.headline}
              </span>
              {!hasLiveSessions && (
                <>
                  <span aria-hidden="true" className="text-slate-400 text-xs">
                    ·
                  </span>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    10-Session Baseline Trajectory
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              {plateauAnalysis.recommendation}
            </p>
          </div>
        </div>

        {/* Right Controls: Sparkline Overlays & Plateau-Breaker Button */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowMovingAverage((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
              showMovingAverage
                ? 'bg-[#0078D4] text-white border-[#0078D4]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            3-Session Moving Avg
          </button>

          {plateauAnalysis.hasPlateau && (
            <button
              type="button"
              onClick={() => setHighlightPlateauBand((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                highlightPlateauBand
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Plateau Zone ({plateauAnalysis.startLabel}–{plateauAnalysis.endLabel})
            </button>
          )}

          {onStartAdaptiveQuiz && plateauAnalysis.hasPlateau && (
            <button
              type="button"
              onClick={onStartAdaptiveQuiz}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Break Plateau</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sparkline & Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Recharts Area + Moving Average Sparkline (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 space-y-2">
          <div className="w-full h-40 sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={sparklineData}
                margin={{ top: 10, right: 14, left: -18, bottom: 2 }}
              >
                <defs>
                  <linearGradient id="sparklineAccuracyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078D4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0078D4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 70, 85, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<CustomSparklineTooltip />} />

                {/* Highlighted Learning Plateau Band */}
                {plateauAnalysis.hasPlateau &&
                  highlightPlateauBand &&
                  plateauAnalysis.startLabel &&
                  plateauAnalysis.endLabel && (
                    <ReferenceArea
                      x1={plateauAnalysis.startLabel}
                      x2={plateauAnalysis.endLabel}
                      y1={plateauAnalysis.plateauMin}
                      y2={plateauAnalysis.plateauMax}
                      fill="#F59E0B"
                      fillOpacity={0.18}
                      stroke="#D97706"
                      strokeDasharray="3 3"
                    />
                  )}

                {/* 70% AZ-900 Passing Target Reference Line */}
                <ReferenceLine
                  y={70}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '70% Pass',
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                />

                {/* Session Accuracy Sparkline Area */}
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  name="Session Accuracy"
                  stroke="#0078D4"
                  strokeWidth={2.5}
                  fill="url(#sparklineAccuracyGrad)"
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (typeof cx !== 'number' || typeof cy !== 'number') return <g />;
                    const isPlateau = payload?.isPlateauPoint;
                    const isPass = payload?.accuracy >= 70;
                    const isSelected = selectedSessionIdx === index;
                    return (
                      <circle
                        key={`dot-${payload.index}`}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 6 : isPlateau ? 4.5 : 3.5}
                        fill={isPlateau ? '#F59E0B' : isPass ? '#10B981' : '#0078D4'}
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="cursor-pointer"
                        onClick={() => setSelectedSessionIdx(index)}
                      />
                    );
                  }}
                  activeDot={{ r: 6, stroke: '#005A9E', strokeWidth: 2 }}
                />

                {/* 3-Session Moving Average Line */}
                {showMovingAverage && (
                  <Line
                    type="monotone"
                    dataKey="movingAvg"
                    name="3-Session Moving Avg"
                    stroke="#D97706"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive 10-Session Selector Strip */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
            {sparklineData.map((pt, idx) => {
              const isSelected =
                selectedSessionIdx === idx ||
                (selectedSessionIdx === null && idx === sparklineData.length - 1);
              return (
                <button
                  key={pt.label}
                  type="button"
                  onClick={() => setSelectedSessionIdx(idx)}
                  title={`${pt.label}: ${pt.sessionTitle} (${pt.accuracy}% accuracy${
                    pt.isPlateauPoint ? ' • Learning Plateau Band' : ''
                  })`}
                  className={`flex-1 min-w-[46px] px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border text-center tabular-nums ${
                    isSelected
                      ? 'bg-[#0078D4] text-white border-[#005A9E] shadow-2xs'
                      : pt.isPlateauPoint
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-black leading-none">{pt.label}</div>
                  <div className="text-[9.5px] opacity-90 mt-0.5">{pt.accuracy}%</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Compact Sparkline Telemetry Cards + Selected Session Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Latest Session
              </span>
              <span
                className={`text-base sm:text-lg font-black tabular-nums ${
                  latestScore >= 70 ? 'text-emerald-600' : 'text-[#0078D4]'
                }`}
              >
                {latestScore}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                {latestScore >= 70 ? 'Above 70% target' : `${70 - latestScore}% to pass mark`}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                10-Session Avg
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                {tenSessionAvg}%
              </span>
              <span className="text-[10px] text-slate-500 block">Rolling mean score</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Net Momentum
              </span>
              <span
                className={`text-base sm:text-lg font-black flex items-center gap-0.5 tabular-nums ${
                  netMomentum > 0
                    ? 'text-emerald-600'
                    : netMomentum < 0
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {netMomentum > 0 ? (
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                ) : netMomentum < 0 ? (
                  <ArrowDownRight className="w-4 h-4 shrink-0" />
                ) : (
                  <Minus className="w-4 h-4 shrink-0" />
                )}
                {netMomentum > 0 ? `+${netMomentum}%` : `${netMomentum}%`}
              </span>
              <span className="text-[10px] text-slate-500 block">
                S1 → S{sparklineData.length} shift
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Plateau Check
              </span>
              <span
                className={`text-xs sm:text-sm font-black block mt-0.5 tabular-nums ${
                  plateauAnalysis.hasPlateau ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {plateauAnalysis.hasPlateau
                  ? `${plateauAnalysis.startLabel}–${plateauAnalysis.endLabel} (~${plateauAnalysis.plateauMean}%)`
                  : 'No Stall Detected'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {plateauAnalysis.hasPlateau ? '≤5% variance band' : 'Healthy variance'}
              </span>
            </div>
          </div>

          {activeInspectedSession && (
            <div className="p-2.5 rounded-xl bg-white border border-sky-200/90 text-[11px] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-black text-slate-900 truncate">
                  {activeInspectedSession.label}: {activeInspectedSession.sessionTitle}
                </div>
                <div className="text-[10px] text-slate-500 tabular-nums">
                  {activeInspectedSession.correctCount}/{activeInspectedSession.totalQuestions} correct · 3-Sess Avg {activeInspectedSession.movingAvg}%
                  {activeInspectedSession.isPlateauPoint ? ' · Plateau Zone' : ''}
                </div>
              </div>
              <span
                className={`font-black text-xs shrink-0 tabular-nums ${
                  activeInspectedSession.accuracy >= 70 ? 'text-emerald-600' : 'text-amber-700'
                }`}
              >
                {activeInspectedSession.accuracy}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
