import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceArea,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  BarChart3,
  Layers,
  ArrowRight,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Zap,
} from 'lucide-react';
import { UserStats, Question, QuestionAttempt } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { getStoredTheme, ThemeMode } from '../utils/theme';
import { KitengeRibbon } from './MotifDecorations';

interface PerformanceTrendsViewProps {
  stats: UserStats;
  questions: Question[];
  onPracticeModule?: (moduleId: number, pathId: number) => void;
}

type TimeRangeFilter = 'all' | '30d' | '14d' | '7d';

interface ChronologicalTrendPoint {
  label: string;
  fullLabel: string;
  overall: number | null;
  path1: number | null;
  path2: number | null;
  path3: number | null;
  attemptsInBucket: number;
}

interface ModuleHistoricalDatum {
  moduleId: number;
  shortLabel: string;
  title: string;
  pathId: 1 | 2 | 3;
  pathShort: string;
  totalAttempts: number;
  correctAttempts: number;
  currentAccuracy: number;
  baselineAccuracy: number;
  delta: number;
}

interface PathSummaryDatum {
  pathId: 1 | 2 | 3;
  code: string;
  title: string;
  weight: string;
  color: string;
  totalAttempts: number;
  correctAttempts: number;
  currentAccuracy: number;
  earlyAccuracy: number;
  recentAccuracy: number;
  growthDelta: number;
}

type DifficultyTier = 'Fundamental' | 'Intermediate' | 'Advanced';
type CalibrationViewMode = 'overlay' | 'segments';

interface DifficultyCalibrationTimelinePoint {
  label: string;
  fullLabel: string;
  successRate: number;
  difficultyLoad: number; // 33 = Fundamental, 67 = Intermediate, 100 = Advanced
  dominantTier: DifficultyTier;
  fundamentalAcc: number | null;
  intermediateAcc: number | null;
  advancedAcc: number | null;
  fundamentalCount: number;
  intermediateCount: number;
  advancedCount: number;
  bucketAttempts: number;
}

interface DifficultySegmentSummary {
  tier: DifficultyTier;
  color: string;
  targetBenchmark: number;
  total: number;
  correct: number;
  successRate: number;
  earlyAccuracy: number;
  recentAccuracy: number;
  delta: number;
  sharePct: number;
}

interface ThirtyDayDifficultyDataPoint {
  dateKey: string;
  label: string;
  fullDateLabel: string;
  fundamentalDailyAcc: number | null;
  intermediateDailyAcc: number | null;
  advancedDailyAcc: number | null;
  overallDailyAcc: number | null;
  fundamentalCumAcc: number | null;
  intermediateCumAcc: number | null;
  advancedCumAcc: number | null;
  overallCumAcc: number | null;
  fundamentalAcc: number | null;
  intermediateAcc: number | null;
  advancedAcc: number | null;
  overallAcc: number | null;
  fundamentalTotal: number;
  fundamentalCorrect: number;
  intermediateTotal: number;
  intermediateCorrect: number;
  advancedTotal: number;
  advancedCorrect: number;
  dayTotal: number;
  dayCorrect: number;
}

const PATH_COLORS: Record<1 | 2 | 3, string> = {
  1: '#0ea5e9', // Sky Azure
  2: '#10b981', // Emerald
  3: '#f59e0b', // Amber
};

const DIFFICULTY_COLORS: Record<DifficultyTier, string> = {
  Fundamental: '#0ea5e9',
  Intermediate: '#f59e0b',
  Advanced: '#8b5cf6',
};

const DIFFICULTY_WEIGHT: Record<DifficultyTier, number> = {
  Fundamental: 33,
  Intermediate: 67,
  Advanced: 100,
};

const DIFFICULTY_TARGET_SUCCESS: Record<DifficultyTier, number> = {
  Fundamental: 85,
  Intermediate: 75,
  Advanced: 65,
};

function resolveModuleAndPath(
  att: QuestionAttempt,
  questionById: Map<string, Question>
): { moduleId: number; pathId: 1 | 2 | 3 } {
  const q = questionById.get(att.questionId);
  const rawModId = att.moduleId || q?.moduleId || 1;
  let pathId = (att.pathId || q?.learningPathId) as 1 | 2 | 3 | undefined;
  if (pathId !== 1 && pathId !== 2 && pathId !== 3) {
    const found = LEARNING_PATHS.find((p) =>
      p.modules.some((m) => m.id === rawModId)
    );
    pathId = found?.id ?? 1;
  }
  return { moduleId: rawModId, pathId };
}

export const PerformanceTrendsView: React.FC<PerformanceTrendsViewProps> = ({
  stats,
  questions,
  onPracticeModule,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [selectedPathFilter, setSelectedPathFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [calibrationViewMode, setCalibrationViewMode] =
    useState<CalibrationViewMode>('overlay');
  const [showTierOverlayLines, setShowTierOverlayLines] = useState<boolean>(true);
  const [thirtyDayTrendMode, setThirtyDayTrendMode] = useState<'daily' | 'cumulative'>('daily');
  const [visibleTiers, setVisibleTiers] = useState<Record<DifficultyTier, boolean>>({
    Fundamental: true,
    Intermediate: true,
    Advanced: true,
  });
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };
    window.addEventListener('az900_theme_changed', handleThemeChange);
    return () => window.removeEventListener('az900_theme_changed', handleThemeChange);
  }, []);

  const isDark = theme === 'midnight-azure';
  const axisTickColor = isDark ? '#94a3b8' : '#64748b';
  const gridStrokeColor = isDark ? '#1a2f4d' : '#e2e8f0';

  const questionById = useMemo(() => {
    const map = new Map<string, Question>();
    questions.forEach((q) => map.set(q.id, q));
    return map;
  }, [questions]);

  // All chronological attempts filtered by selected time window
  const filteredAttempts = useMemo(() => {
    const all: Array<
      QuestionAttempt & {
        resolvedModuleId: number;
        resolvedPathId: 1 | 2 | 3;
        resolvedDifficulty: DifficultyTier;
      }
    > = [];
    Object.values(stats.attempts || {}).forEach((list) => {
      list.forEach((att) => {
        if (!att || typeof att.timestamp !== 'number') return;
        const { moduleId, pathId } = resolveModuleAndPath(att, questionById);
        const qDiff = questionById.get(att.questionId)?.difficulty;
        const resolvedDifficulty: DifficultyTier =
          qDiff === 'Fundamental' || qDiff === 'Intermediate' || qDiff === 'Advanced'
            ? qDiff
            : 'Intermediate';
        all.push({
          ...att,
          resolvedModuleId: moduleId,
          resolvedPathId: pathId,
          resolvedDifficulty,
        });
      });
    });

    all.sort((a, b) => a.timestamp - b.timestamp);

    if (timeRange === 'all') return all;
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return all.filter((a) => a.timestamp >= cutoff);
  }, [stats.attempts, questionById, timeRange]);

  // Build Recharts time-series data showing cumulative & path-level accuracy growth over time
  const timelineSeries = useMemo<ChronologicalTrendPoint[]>(() => {
    if (filteredAttempts.length === 0) return [];

    // Group by calendar date first
    const byDay = new Map<
      string,
      Array<QuestionAttempt & { resolvedModuleId: number; resolvedPathId: 1 | 2 | 3 }>
    >();
    filteredAttempts.forEach((att) => {
      const dateKey = new Date(att.timestamp).toISOString().split('T')[0];
      const existing = byDay.get(dateKey) || [];
      existing.push(att);
      byDay.set(dateKey, existing);
    });

    const cumTotals = {
      overall: { c: 0, t: 0 },
      1: { c: 0, t: 0 },
      2: { c: 0, t: 0 },
      3: { c: 0, t: 0 },
    };

    // If user practiced across >= 3 distinct days, plot day-by-day cumulative progression.
    // Otherwise plot sequential quiz checkpoints (batches of 3 attempts) so same-day learners still see their learning curve!
    if (byDay.size >= 3) {
      return Array.from(byDay.entries()).map(([dateKey, items]) => {
        items.forEach((att) => {
          cumTotals.overall.t += 1;
          if (att.isCorrect) cumTotals.overall.c += 1;
          cumTotals[att.resolvedPathId].t += 1;
          if (att.isCorrect) cumTotals[att.resolvedPathId].c += 1;
        });

        const dObj = new Date(`${dateKey}T12:00:00`);
        const shortLabel = dObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        return {
          label: shortLabel,
          fullLabel: `${shortLabel} (${items.length} Qs answered)`,
          overall:
            cumTotals.overall.t > 0
              ? Math.round((cumTotals.overall.c / cumTotals.overall.t) * 100)
              : null,
          path1:
            cumTotals[1].t > 0
              ? Math.round((cumTotals[1].c / cumTotals[1].t) * 100)
              : null,
          path2:
            cumTotals[2].t > 0
              ? Math.round((cumTotals[2].c / cumTotals[2].t) * 100)
              : null,
          path3:
            cumTotals[3].t > 0
              ? Math.round((cumTotals[3].c / cumTotals[3].t) * 100)
              : null,
          attemptsInBucket: items.length,
        };
      });
    }

    const batchSize = Math.max(1, Math.min(4, Math.ceil(filteredAttempts.length / 8)));
    const points: ChronologicalTrendPoint[] = [];

    for (let i = 0; i < filteredAttempts.length; i += batchSize) {
      const slice = filteredAttempts.slice(i, i + batchSize);
      slice.forEach((att) => {
        cumTotals.overall.t += 1;
        if (att.isCorrect) cumTotals.overall.c += 1;
        cumTotals[att.resolvedPathId].t += 1;
        if (att.isCorrect) cumTotals[att.resolvedPathId].c += 1;
      });
      const endQ = Math.min(filteredAttempts.length, i + batchSize);
      points.push({
        label: `Q${endQ}`,
        fullLabel: `Checkpoint Q${i + 1}–Q${endQ}`,
        overall:
          cumTotals.overall.t > 0
            ? Math.round((cumTotals.overall.c / cumTotals.overall.t) * 100)
            : null,
        path1:
          cumTotals[1].t > 0 ? Math.round((cumTotals[1].c / cumTotals[1].t) * 100) : null,
        path2:
          cumTotals[2].t > 0 ? Math.round((cumTotals[2].c / cumTotals[2].t) * 100) : null,
        path3:
          cumTotals[3].t > 0 ? Math.round((cumTotals[3].c / cumTotals[3].t) * 100) : null,
        attemptsInBucket: slice.length,
      });
    }

    return points;
  }, [filteredAttempts]);

  // Path-level historical summary with Early vs Recent growth delta
  const pathSummaries = useMemo<PathSummaryDatum[]>(() => {
    return LEARNING_PATHS.map((lp) => {
      const items = filteredAttempts.filter((a) => a.resolvedPathId === lp.id);
      const fallbackMastery = stats.pathMastery?.[lp.id];

      const totalAttempts =
        items.length > 0 ? items.length : timeRange === 'all' ? fallbackMastery?.total || 0 : 0;
      const correctAttempts =
        items.length > 0
          ? items.filter((a) => a.isCorrect).length
          : timeRange === 'all'
          ? fallbackMastery?.correct || 0
          : 0;
      const currentAccuracy =
        totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

      let earlyAccuracy = currentAccuracy;
      let recentAccuracy = currentAccuracy;
      if (items.length >= 4) {
        const half = Math.floor(items.length / 2);
        const earlySlice = items.slice(0, half);
        const recentSlice = items.slice(half);
        earlyAccuracy = Math.round(
          (earlySlice.filter((a) => a.isCorrect).length / earlySlice.length) * 100
        );
        recentAccuracy = Math.round(
          (recentSlice.filter((a) => a.isCorrect).length / recentSlice.length) * 100
        );
      }

      return {
        pathId: lp.id,
        code: `Path ${lp.id}`,
        title: lp.title,
        weight: lp.examWeight,
        color: PATH_COLORS[lp.id],
        totalAttempts,
        correctAttempts,
        currentAccuracy,
        earlyAccuracy,
        recentAccuracy,
        growthDelta: recentAccuracy - earlyAccuracy,
      };
    });
  }, [filteredAttempts, stats.pathMastery, timeRange]);

  // Module-level historical accuracy & Early vs Recent delta across all 12 modules
  const moduleData = useMemo<ModuleHistoricalDatum[]>(() => {
    const allModules = LEARNING_PATHS.flatMap((lp) =>
      lp.modules.map((m) => ({ ...m, pathId: lp.id }))
    );

    return allModules
      .filter((m) => selectedPathFilter === 'all' || m.pathId === selectedPathFilter)
      .map((mod) => {
        const items = filteredAttempts.filter((a) => a.resolvedModuleId === mod.id);
        const fallbackMod = stats.moduleMastery?.[mod.id];

        const totalAttempts =
          items.length > 0 ? items.length : timeRange === 'all' ? fallbackMod?.total || 0 : 0;
        const correctAttempts =
          items.length > 0
            ? items.filter((a) => a.isCorrect).length
            : timeRange === 'all'
            ? fallbackMod?.correct || 0
            : 0;

        const currentAccuracy =
          totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        let baselineAccuracy = currentAccuracy;
        let recentAccuracy = currentAccuracy;
        if (items.length >= 2) {
          const split = Math.max(1, Math.floor(items.length / 2));
          const early = items.slice(0, split);
          const recent = items.slice(split);
          baselineAccuracy = Math.round(
            (early.filter((a) => a.isCorrect).length / early.length) * 100
          );
          recentAccuracy = Math.round(
            (recent.filter((a) => a.isCorrect).length / recent.length) * 100
          );
        }

        return {
          moduleId: mod.id,
          shortLabel: `M${mod.id}`,
          title: mod.title,
          pathId: mod.pathId,
          pathShort: `Path ${mod.pathId}`,
          totalAttempts,
          correctAttempts,
          currentAccuracy,
          baselineAccuracy,
          delta: recentAccuracy - baselineAccuracy,
        };
      });
  }, [filteredAttempts, stats.moduleMastery, selectedPathFilter, timeRange]);

  // Global KPI stats
  const kpi = useMemo(() => {
    const total =
      filteredAttempts.length > 0
        ? filteredAttempts.length
        : timeRange === 'all'
        ? stats.totalAnswered
        : 0;
    const correct =
      filteredAttempts.length > 0
        ? filteredAttempts.filter((a) => a.isCorrect).length
        : timeRange === 'all'
        ? stats.totalCorrect
        : 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    let growthDelta = 0;
    if (filteredAttempts.length >= 4) {
      const mid = Math.floor(filteredAttempts.length / 2);
      const firstHalf = filteredAttempts.slice(0, mid);
      const secondHalf = filteredAttempts.slice(mid);
      const firstAcc = Math.round(
        (firstHalf.filter((a) => a.isCorrect).length / firstHalf.length) * 100
      );
      const secondAcc = Math.round(
        (secondHalf.filter((a) => a.isCorrect).length / secondHalf.length) * 100
      );
      growthDelta = secondAcc - firstAcc;
    }

    const activePaths = pathSummaries.filter((p) => p.totalAttempts > 0);
    const strongestPath =
      activePaths.length > 0
        ? [...activePaths].sort((a, b) => b.currentAccuracy - a.currentAccuracy)[0]
        : null;
    const weakestPath =
      activePaths.length > 0
        ? [...activePaths].sort((a, b) => a.currentAccuracy - b.currentAccuracy)[0]
        : null;

    const practicedModulesCount = moduleData.filter((m) => m.totalAttempts > 0).length;

    return {
      total,
      correct,
      accuracy,
      growthDelta,
      strongestPath,
      weakestPath,
      practicedModulesCount,
    };
  }, [filteredAttempts, stats.totalAnswered, stats.totalCorrect, pathSummaries, moduleData, timeRange]);

  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const point: ChronologicalTrendPoint = payload[0]?.payload;
    if (!point) return null;

    return (
      <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl border border-sky-400/50 shadow-2xl text-xs space-y-2 min-w-[210px]">
        <div className="font-black text-sky-300 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
          <span>{point.fullLabel}</span>
        </div>
        <div className="space-y-1">
          {point.overall !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-200">Overall Cumulative:</span>
              <span className="font-mono font-black text-white">{point.overall}%</span>
            </div>
          )}
          {point.path1 !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sky-300 font-semibold">Path 1 (Cloud Concepts):</span>
              <span className="font-mono font-black text-sky-300">{point.path1}%</span>
            </div>
          )}
          {point.path2 !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-emerald-300 font-semibold">Path 2 (Architecture):</span>
              <span className="font-mono font-black text-emerald-300">{point.path2}%</span>
            </div>
          )}
          {point.path3 !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-amber-300 font-semibold">Path 3 (Governance):</span>
              <span className="font-mono font-black text-amber-300">{point.path3}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CustomModuleTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const mod: ModuleHistoricalDatum = payload[0]?.payload;
    if (!mod) return null;

    return (
      <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl border border-sky-400/50 shadow-2xl text-xs space-y-1.5 max-w-[260px]">
        <div className="font-black text-sky-300">
          Module {mod.moduleId}: {mod.title}
        </div>
        <div className="text-[11px] text-slate-400">{mod.pathShort}</div>
        <div className="pt-1 border-t border-slate-800 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300">Current Accuracy:</span>
            <span className="font-mono font-black text-white">{mod.currentAccuracy}%</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300">Early Baseline:</span>
            <span className="font-mono font-bold text-slate-300">{mod.baselineAccuracy}%</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300">Attempts Solved:</span>
            <span className="font-mono font-bold text-sky-200">
              {mod.correctAttempts}/{mod.totalAttempts}
            </span>
          </div>
          {mod.totalAttempts >= 2 && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Growth Delta:</span>
              <span
                className={`font-mono font-black ${
                  mod.delta > 0
                    ? 'text-emerald-400'
                    : mod.delta < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {mod.delta > 0 ? `+${mod.delta}%` : `${mod.delta}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Difficulty Calibration computations (overlays user success rate against Fundamental, Intermediate & Advanced segments)
  const difficultyCalibration = useMemo(() => {
    const scopedAttempts =
      selectedPathFilter === 'all'
        ? filteredAttempts
        : filteredAttempts.filter((a) => a.resolvedPathId === selectedPathFilter);

    const tiers: DifficultyTier[] = ['Fundamental', 'Intermediate', 'Advanced'];
    const totalScoped = scopedAttempts.length;

    const segments: DifficultySegmentSummary[] = tiers.map((tier) => {
      const items = scopedAttempts.filter((a) => a.resolvedDifficulty === tier);
      const total = items.length;
      const correct = items.filter((a) => a.isCorrect).length;
      const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

      let earlyAccuracy = successRate;
      let recentAccuracy = successRate;
      if (total >= 2) {
        const half = Math.max(1, Math.floor(total / 2));
        const earlySlice = items.slice(0, half);
        const recentSlice = items.slice(half);
        earlyAccuracy = Math.round(
          (earlySlice.filter((a) => a.isCorrect).length / earlySlice.length) * 100
        );
        recentAccuracy = Math.round(
          (recentSlice.filter((a) => a.isCorrect).length / recentSlice.length) * 100
        );
      }

      return {
        tier,
        color: DIFFICULTY_COLORS[tier],
        targetBenchmark: DIFFICULTY_TARGET_SUCCESS[tier],
        total,
        correct,
        successRate,
        earlyAccuracy,
        recentAccuracy,
        delta: recentAccuracy - earlyAccuracy,
        sharePct: totalScoped > 0 ? Math.round((total / totalScoped) * 100) : 0,
      };
    });

    // Build chronological adaptive trajectory checkpoints
    const timeline: DifficultyCalibrationTimelinePoint[] = [];
    if (scopedAttempts.length > 0) {
      const bucketSize = Math.max(1, Math.ceil(scopedAttempts.length / 10));
      const tierCumulative: Record<DifficultyTier, { c: number; t: number }> = {
        Fundamental: { c: 0, t: 0 },
        Intermediate: { c: 0, t: 0 },
        Advanced: { c: 0, t: 0 },
      };

      for (let i = 0; i < scopedAttempts.length; i += bucketSize) {
        const slice = scopedAttempts.slice(i, i + bucketSize);
        let weightSum = 0;
        let correctInBucket = 0;
        const counts: Record<DifficultyTier, number> = {
          Fundamental: 0,
          Intermediate: 0,
          Advanced: 0,
        };

        slice.forEach((att) => {
          const tier = att.resolvedDifficulty;
          counts[tier] += 1;
          weightSum += DIFFICULTY_WEIGHT[tier];
          if (att.isCorrect) correctInBucket += 1;
          tierCumulative[tier].t += 1;
          if (att.isCorrect) tierCumulative[tier].c += 1;
        });

        const avgWeight = Math.round(weightSum / slice.length);
        const dominantTier: DifficultyTier =
          avgWeight >= 80
            ? 'Advanced'
            : avgWeight >= 50
            ? 'Intermediate'
            : 'Fundamental';

        const endIdx = Math.min(scopedAttempts.length, i + bucketSize);

        timeline.push({
          label: `Q${endIdx}`,
          fullLabel: `Adaptive Window Q${i + 1}–Q${endIdx} (${slice.length} Qs)`,
          successRate: Math.round((correctInBucket / slice.length) * 100),
          difficultyLoad: avgWeight,
          dominantTier,
          fundamentalAcc:
            tierCumulative.Fundamental.t > 0
              ? Math.round(
                  (tierCumulative.Fundamental.c / tierCumulative.Fundamental.t) * 100
                )
              : null,
          intermediateAcc:
            tierCumulative.Intermediate.t > 0
              ? Math.round(
                  (tierCumulative.Intermediate.c / tierCumulative.Intermediate.t) * 100
                )
              : null,
          advancedAcc:
            tierCumulative.Advanced.t > 0
              ? Math.round(
                  (tierCumulative.Advanced.c / tierCumulative.Advanced.t) * 100
                )
              : null,
          fundamentalCount: counts.Fundamental,
          intermediateCount: counts.Intermediate,
          advancedCount: counts.Advanced,
          bucketAttempts: slice.length,
        });
      }
    }

    // Measure adaptive escalation effectiveness (first half vs second half)
    let adaptiveNarrative =
      'Solve more Adaptive Quiz or Practice questions to observe how difficulty escalates with your accuracy.';
    let difficultyLiftPct = 0;
    let recentSuccessRate = 0;

    if (scopedAttempts.length >= 4) {
      const mid = Math.floor(scopedAttempts.length / 2);
      const earlyHalf = scopedAttempts.slice(0, mid);
      const recentHalf = scopedAttempts.slice(mid);
      const earlyAdvShare = Math.round(
        (earlyHalf.filter((a) => a.resolvedDifficulty === 'Advanced').length /
          earlyHalf.length) *
          100
      );
      const recentAdvShare = Math.round(
        (recentHalf.filter((a) => a.resolvedDifficulty === 'Advanced').length /
          recentHalf.length) *
          100
      );
      difficultyLiftPct = recentAdvShare - earlyAdvShare;
      recentSuccessRate = Math.round(
        (recentHalf.filter((a) => a.isCorrect).length / recentHalf.length) * 100
      );

      if (difficultyLiftPct > 0 && recentSuccessRate >= 70) {
        adaptiveNarrative = `Adaptive Lift Verified: Advanced question mix rose +${difficultyLiftPct}% (${earlyAdvShare}% → ${recentAdvShare}%) while holding ${recentSuccessRate}% recent accuracy.`;
      } else if (recentSuccessRate >= 70) {
        adaptiveNarrative = `Calibration Balanced: Sustaining ${recentSuccessRate}% recent success rate across Fundamental, Intermediate & Advanced segments.`;
      } else {
        adaptiveNarrative = `Remediation Active: Accuracy is ${recentSuccessRate}% recently — adaptive routing is reinforcing Fundamental concepts before escalating back to Advanced.`;
      }
    }

    return {
      totalScoped,
      segments,
      timeline,
      adaptiveNarrative,
      difficultyLiftPct,
    };
  }, [filteredAttempts, selectedPathFilter]);

  const CustomCalibrationTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const datum = payload[0]?.payload;
    if (!datum) return null;

    if (calibrationViewMode === 'segments') {
      const seg = datum as DifficultySegmentSummary;
      return (
        <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl border border-violet-400/50 shadow-2xl text-xs space-y-1.5 min-w-[220px]">
          <div className="font-black text-sm flex items-center justify-between gap-2">
            <span style={{ color: seg.color }}>{seg.tier} Tier</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {seg.sharePct}% of attempts
            </span>
          </div>
          <div className="border-t border-slate-800 pt-1.5 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-slate-300">User Success Rate:</span>
              <span className="font-mono font-black text-emerald-400">
                {seg.successRate}%
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-300">Calibration Target:</span>
              <span className="font-mono font-bold text-slate-300">
                {seg.targetBenchmark}%
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-300">Solved Correctly:</span>
              <span className="font-mono font-bold text-sky-300">
                {seg.correct}/{seg.total}
              </span>
            </div>
            {seg.total >= 2 && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-300">Early → Recent:</span>
                <span
                  className={`font-mono font-black ${
                    seg.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {seg.delta > 0 ? `+${seg.delta}%` : `${seg.delta}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    const pt = datum as DifficultyCalibrationTimelinePoint;
    return (
      <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl border border-violet-400/50 shadow-2xl text-xs space-y-2 min-w-[235px]">
        <div className="font-black text-sky-300 border-b border-slate-800 pb-1">
          {pt.fullLabel}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-emerald-300 font-bold">Window Success Rate:</span>
            <span className="font-mono font-black text-emerald-300">
              {pt.successRate}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-300">Adaptive Difficulty Load:</span>
            <span
              className="font-mono font-black"
              style={{ color: DIFFICULTY_COLORS[pt.dominantTier] }}
            >
              {pt.dominantTier} ({pt.difficultyLoad}/100)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-0.5">
            Mix: {pt.fundamentalCount} Fund • {pt.intermediateCount} Interm •{' '}
            {pt.advancedCount} Adv
          </div>
          {(pt.fundamentalAcc !== null ||
            pt.intermediateAcc !== null ||
            pt.advancedAcc !== null) && (
            <div className="border-t border-slate-800 pt-1 mt-1 space-y-0.5 text-[11px]">
              {pt.fundamentalAcc !== null && (
                <div className="flex justify-between">
                  <span className="text-sky-300">Fundamental Cum. Acc:</span>
                  <span className="font-mono font-bold">{pt.fundamentalAcc}%</span>
                </div>
              )}
              {pt.intermediateAcc !== null && (
                <div className="flex justify-between">
                  <span className="text-amber-300">Intermediate Cum. Acc:</span>
                  <span className="font-mono font-bold">{pt.intermediateAcc}%</span>
                </div>
              )}
              {pt.advancedAcc !== null && (
                <div className="flex justify-between">
                  <span className="text-violet-300">Advanced Cum. Acc:</span>
                  <span className="font-mono font-bold">{pt.advancedAcc}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 30-Day Question Accuracy Trends mapped against Fundamental, Intermediate, and Advanced difficulty levels
  const thirtyDayDifficultyTrends = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const attemptsIn30d: Array<
      QuestionAttempt & {
        resolvedDifficulty: DifficultyTier;
        dateKey: string;
      }
    > = [];

    Object.values(stats.attempts || {}).forEach((list) => {
      list.forEach((att) => {
        if (!att || typeof att.timestamp !== 'number') return;
        if (att.timestamp < thirtyDaysAgo) return;

        const q = questionById.get(att.questionId);
        const qDiff = q?.difficulty;
        const resolvedDifficulty: DifficultyTier =
          qDiff === 'Fundamental' || qDiff === 'Intermediate' || qDiff === 'Advanced'
            ? qDiff
            : 'Intermediate';

        const d = new Date(att.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${day}`;

        attemptsIn30d.push({
          ...att,
          resolvedDifficulty,
          dateKey,
        });
      });
    });

    attemptsIn30d.sort((a, b) => a.timestamp - b.timestamp);

    // Group attempts by dateKey
    const byDate = new Map<string, typeof attemptsIn30d>();
    attemptsIn30d.forEach((att) => {
      const existing = byDate.get(att.dateKey) || [];
      existing.push(att);
      byDate.set(att.dateKey, existing);
    });

    // 30-day summary metrics per tier
    const summary30d: Record<
      DifficultyTier,
      { total: number; correct: number; accuracy: number }
    > & { total: number; correct: number; overallAccuracy: number } = {
      total: attemptsIn30d.length,
      correct: attemptsIn30d.filter((a) => a.isCorrect).length,
      overallAccuracy:
        attemptsIn30d.length > 0
          ? Math.round((attemptsIn30d.filter((a) => a.isCorrect).length / attemptsIn30d.length) * 100)
          : 0,
      Fundamental: { total: 0, correct: 0, accuracy: 0 },
      Intermediate: { total: 0, correct: 0, accuracy: 0 },
      Advanced: { total: 0, correct: 0, accuracy: 0 },
    };

    attemptsIn30d.forEach((att) => {
      summary30d[att.resolvedDifficulty].total += 1;
      if (att.isCorrect) summary30d[att.resolvedDifficulty].correct += 1;
    });

    (['Fundamental', 'Intermediate', 'Advanced'] as DifficultyTier[]).forEach((tier) => {
      const t = summary30d[tier].total;
      const c = summary30d[tier].correct;
      summary30d[tier].accuracy = t > 0 ? Math.round((c / t) * 100) : 0;
    });

    // Build timeline points
    const runningCum = {
      Fundamental: { t: 0, c: 0 },
      Intermediate: { t: 0, c: 0 },
      Advanced: { t: 0, c: 0 },
      overall: { t: 0, c: 0 },
    };

    let points: ThirtyDayDifficultyDataPoint[] = [];

    if (byDate.size >= 3) {
      // User has >= 3 distinct days in the last 30 days: plot day-by-day progression
      points = Array.from(byDate.entries()).map(([dateKey, items]) => {
        const counts = {
          Fundamental: { t: 0, c: 0 },
          Intermediate: { t: 0, c: 0 },
          Advanced: { t: 0, c: 0 },
          overall: { t: items.length, c: items.filter((a) => a.isCorrect).length },
        };

        items.forEach((att) => {
          counts[att.resolvedDifficulty].t += 1;
          if (att.isCorrect) counts[att.resolvedDifficulty].c += 1;

          runningCum[att.resolvedDifficulty].t += 1;
          if (att.isCorrect) runningCum[att.resolvedDifficulty].c += 1;
          runningCum.overall.t += 1;
          if (att.isCorrect) runningCum.overall.c += 1;
        });

        const dObj = new Date(`${dateKey}T12:00:00`);
        const shortLabel = dObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        const fullDateLabel = dObj.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        const fundDaily =
          counts.Fundamental.t > 0
            ? Math.round((counts.Fundamental.c / counts.Fundamental.t) * 100)
            : null;
        const interDaily =
          counts.Intermediate.t > 0
            ? Math.round((counts.Intermediate.c / counts.Intermediate.t) * 100)
            : null;
        const advDaily =
          counts.Advanced.t > 0
            ? Math.round((counts.Advanced.c / counts.Advanced.t) * 100)
            : null;
        const overallDaily =
          counts.overall.t > 0
            ? Math.round((counts.overall.c / counts.overall.t) * 100)
            : null;

        const fundCum =
          runningCum.Fundamental.t > 0
            ? Math.round((runningCum.Fundamental.c / runningCum.Fundamental.t) * 100)
            : null;
        const interCum =
          runningCum.Intermediate.t > 0
            ? Math.round((runningCum.Intermediate.c / runningCum.Intermediate.t) * 100)
            : null;
        const advCum =
          runningCum.Advanced.t > 0
            ? Math.round((runningCum.Advanced.c / runningCum.Advanced.t) * 100)
            : null;
        const overallCum =
          runningCum.overall.t > 0
            ? Math.round((runningCum.overall.c / runningCum.overall.t) * 100)
            : null;

        const isCum = thirtyDayTrendMode === 'cumulative';

        return {
          dateKey,
          label: shortLabel,
          fullDateLabel,
          fundamentalDailyAcc: fundDaily,
          intermediateDailyAcc: interDaily,
          advancedDailyAcc: advDaily,
          overallDailyAcc: overallDaily,
          fundamentalCumAcc: fundCum,
          intermediateCumAcc: interCum,
          advancedCumAcc: advCum,
          overallCumAcc: overallCum,
          fundamentalAcc: isCum ? fundCum : fundDaily,
          intermediateAcc: isCum ? interCum : interDaily,
          advancedAcc: isCum ? advCum : advDaily,
          overallAcc: isCum ? overallCum : overallDaily,
          fundamentalTotal: counts.Fundamental.t,
          fundamentalCorrect: counts.Fundamental.c,
          intermediateTotal: counts.Intermediate.t,
          intermediateCorrect: counts.Intermediate.c,
          advancedTotal: counts.Advanced.t,
          advancedCorrect: counts.Advanced.c,
          dayTotal: counts.overall.t,
          dayCorrect: counts.overall.c,
        };
      });
    } else if (attemptsIn30d.length > 0) {
      // 1-2 days of practice in the 30-day window: divide chronologically into checkpoints
      const batchSize = Math.max(1, Math.min(3, Math.ceil(attemptsIn30d.length / 6)));
      for (let i = 0; i < attemptsIn30d.length; i += batchSize) {
        const slice = attemptsIn30d.slice(i, i + batchSize);
        const counts = {
          Fundamental: { t: 0, c: 0 },
          Intermediate: { t: 0, c: 0 },
          Advanced: { t: 0, c: 0 },
          overall: { t: slice.length, c: slice.filter((a) => a.isCorrect).length },
        };

        slice.forEach((att) => {
          counts[att.resolvedDifficulty].t += 1;
          if (att.isCorrect) counts[att.resolvedDifficulty].c += 1;

          runningCum[att.resolvedDifficulty].t += 1;
          if (att.isCorrect) runningCum[att.resolvedDifficulty].c += 1;
          runningCum.overall.t += 1;
          if (att.isCorrect) runningCum.overall.c += 1;
        });

        const endQ = Math.min(attemptsIn30d.length, i + batchSize);
        const sampleAtt = slice[slice.length - 1];
        const dObj = new Date(sampleAtt.timestamp);
        const shortDate = dObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        const label = `Q${endQ} (${shortDate})`;
        const fullDateLabel = `30d Checkpoint Q${i + 1}–Q${endQ} • ${shortDate}`;

        const fundDaily =
          counts.Fundamental.t > 0
            ? Math.round((counts.Fundamental.c / counts.Fundamental.t) * 100)
            : null;
        const interDaily =
          counts.Intermediate.t > 0
            ? Math.round((counts.Intermediate.c / counts.Intermediate.t) * 100)
            : null;
        const advDaily =
          counts.Advanced.t > 0
            ? Math.round((counts.Advanced.c / counts.Advanced.t) * 100)
            : null;
        const overallDaily =
          counts.overall.t > 0
            ? Math.round((counts.overall.c / counts.overall.t) * 100)
            : null;

        const fundCum =
          runningCum.Fundamental.t > 0
            ? Math.round((runningCum.Fundamental.c / runningCum.Fundamental.t) * 100)
            : null;
        const interCum =
          runningCum.Intermediate.t > 0
            ? Math.round((runningCum.Intermediate.c / runningCum.Intermediate.t) * 100)
            : null;
        const advCum =
          runningCum.Advanced.t > 0
            ? Math.round((runningCum.Advanced.c / runningCum.Advanced.t) * 100)
            : null;
        const overallCum =
          runningCum.overall.t > 0
            ? Math.round((runningCum.overall.c / runningCum.overall.t) * 100)
            : null;

        const isCum = thirtyDayTrendMode === 'cumulative';

        points.push({
          dateKey: `q-${endQ}`,
          label,
          fullDateLabel,
          fundamentalDailyAcc: fundDaily,
          intermediateDailyAcc: interDaily,
          advancedDailyAcc: advDaily,
          overallDailyAcc: overallDaily,
          fundamentalCumAcc: fundCum,
          intermediateCumAcc: interCum,
          advancedCumAcc: advCum,
          overallCumAcc: overallCum,
          fundamentalAcc: isCum ? fundCum : fundDaily,
          intermediateAcc: isCum ? interCum : interDaily,
          advancedAcc: isCum ? advCum : advDaily,
          overallAcc: isCum ? overallCum : overallDaily,
          fundamentalTotal: counts.Fundamental.t,
          fundamentalCorrect: counts.Fundamental.c,
          intermediateTotal: counts.Intermediate.t,
          intermediateCorrect: counts.Intermediate.c,
          advancedTotal: counts.Advanced.t,
          advancedCorrect: counts.Advanced.c,
          dayTotal: counts.overall.t,
          dayCorrect: counts.overall.c,
        });
      }
    }

    return {
      points,
      summary30d,
      activeDaysCount: byDate.size,
      totalAttemptsIn30d: attemptsIn30d.length,
    };
  }, [stats.attempts, questionById, thirtyDayTrendMode]);

  const CustomThirtyDayDifficultyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const pt: ThirtyDayDifficultyDataPoint = payload[0]?.payload;
    if (!pt) return null;

    return (
      <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl border border-sky-400/50 shadow-2xl text-xs space-y-2 min-w-[240px]">
        <div className="font-black text-sky-300 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
          <span>{pt.fullDateLabel}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {pt.dayTotal} Qs {thirtyDayTrendMode === 'cumulative' ? 'cum.' : 'period'}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sky-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
              Fundamental:
            </span>
            <span className="font-mono font-black text-white">
              {pt.fundamentalAcc !== null ? `${pt.fundamentalAcc}%` : '—'}
              {pt.fundamentalTotal > 0 && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({pt.fundamentalCorrect}/{pt.fundamentalTotal})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              Intermediate:
            </span>
            <span className="font-mono font-black text-white">
              {pt.intermediateAcc !== null ? `${pt.intermediateAcc}%` : '—'}
              {pt.intermediateTotal > 0 && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({pt.intermediateCorrect}/{pt.intermediateTotal})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-violet-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              Advanced:
            </span>
            <span className="font-mono font-black text-white">
              {pt.advancedAcc !== null ? `${pt.advancedAcc}%` : '—'}
              {pt.advancedTotal > 0 && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({pt.advancedCorrect}/{pt.advancedTotal})
                </span>
              )}
            </span>
          </div>

          {pt.overallAcc !== null && (
            <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between gap-3 text-slate-300">
              <span className="font-bold">Overall Accuracy:</span>
              <span className="font-mono font-black text-emerald-400">
                {pt.overallAcc}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden">
        <KitengeRibbon height={4} />
        <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[#0078D4] text-[10px] font-black uppercase tracking-wider">
              <BarChart3 className="w-3 h-3" />
              <span>Recharts Historical Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Performance Trends &amp; Learning Growth
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Track how your historical quiz accuracy evolves over time across every AZ-900 Learning Path and all 12 Curriculum Modules compared to the 70% Microsoft exam pass threshold.
            </p>
          </div>

          {/* Timeframe Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: '30d', label: '30 Days' },
                { id: '14d', label: '14 Days' },
                { id: '7d', label: '7 Days' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeRange(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  timeRange === opt.id
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Historical Accuracy</span>
            <Target className="w-4 h-4 text-[#0078D4]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpi.accuracy}%
            </span>
            <span
              className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                kpi.accuracy >= 70
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {kpi.accuracy >= 70 ? 'Above 70% Pass' : `${70 - kpi.accuracy}% to Pass`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {kpi.correct} correct out of {kpi.total} attempts
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Learning Growth (Early → Recent)</span>
            {kpi.growthDelta >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                kpi.growthDelta > 0
                  ? 'text-emerald-600'
                  : kpi.growthDelta < 0
                  ? 'text-rose-600'
                  : 'text-slate-900'
              }`}
            >
              {kpi.growthDelta > 0 ? `+${kpi.growthDelta}%` : `${kpi.growthDelta}%`}
            </span>
            <span className="text-[11px] font-bold text-slate-500">momentum shift</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {filteredAttempts.length >= 4
              ? 'Compares first 50% vs latest 50% of attempts'
              : 'Solve 4+ questions to measure growth velocity'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Strongest Learning Path</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {kpi.strongestPath
              ? `${kpi.strongestPath.code}: ${kpi.strongestPath.currentAccuracy}%`
              : 'No Path Data Yet'}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {kpi.strongestPath
              ? kpi.strongestPath.title
              : 'Answer questions to benchmark paths'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Modules Covered</span>
            <Layers className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpi.practicedModulesCount}
            </span>
            <span className="text-xs font-bold text-slate-500">
              / {moduleData.length} modules
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {kpi.weakestPath && kpi.weakestPath.currentAccuracy < 70
              ? `Focus Opportunity: ${kpi.weakestPath.code} (${kpi.weakestPath.currentAccuracy}%)`
              : 'Balanced progression across curriculum'}
          </p>
        </div>
      </div>

      {/* Chart 1: Historical Learning Growth Over Time by Learning Path (Recharts LineChart) */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0078D4]" />
              <span>Learning Growth Over Time by Learning Path</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cumulative accuracy progression across Path 1 (Cloud Concepts), Path 2 (Architecture &amp; Services), and Path 3 (Governance).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shrink-0">
            Target: ≥ 70% Exam Pass Line
          </span>
        </div>

        {timelineSeries.length > 0 ? (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineSeries}
                margin={{ top: 12, right: 16, left: -12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                  stroke={gridStrokeColor}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                  stroke={gridStrokeColor}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: '70% Pass Mark',
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Overall Cumulative"
                  stroke={isDark ? '#f8fafc' : '#0f172a'}
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="path1"
                  name="Path 1: Cloud Concepts"
                  stroke={PATH_COLORS[1]}
                  strokeWidth={2.75}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="path2"
                  name="Path 2: Architecture"
                  stroke={PATH_COLORS[2]}
                  strokeWidth={2.75}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="path3"
                  name="Path 3: Governance"
                  stroke={PATH_COLORS[3]}
                  strokeWidth={2.75}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Sparkles className="w-7 h-7 text-[#0078D4]" />
            <p className="text-sm font-bold text-slate-800">
              Answer quiz questions to plot your historical learning trajectory
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              As you complete questions across Practice, Adaptive Quiz, Mock Exams, or Micro-Drills, your Path 1–3 growth curves appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* Chart 2: Historical Accuracy Per Module + Baseline Comparison (Recharts BarChart) */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0078D4]" />
              <span>Historical Accuracy per Module (Early Baseline vs. Current)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Compare your initial baseline accuracy against your current overall mastery across AZ-900 Modules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['all', 1, 2, 3] as const).map((pId) => (
              <button
                key={String(pId)}
                type="button"
                onClick={() => setSelectedPathFilter(pId)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedPathFilter === pId
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pId === 'all' ? 'All Modules' : `Path ${pId}`}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={moduleData}
              margin={{ top: 12, right: 16, left: -12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                stroke={gridStrokeColor}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                stroke={gridStrokeColor}
              />
              <Tooltip content={<CustomModuleTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
              <ReferenceLine
                y={70}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: '70% Target',
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              />
              <Bar
                dataKey="baselineAccuracy"
                name="Early Baseline %"
                fill={isDark ? '#475569' : '#94a3b8'}
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="currentAccuracy" name="Current Accuracy %" radius={[4, 4, 0, 0]}>
                {moduleData.map((entry) => (
                  <Cell
                    key={`cell-${entry.moduleId}`}
                    fill={
                      entry.totalAttempts === 0
                        ? isDark
                          ? '#1e293b'
                          : '#e2e8f0'
                        : entry.currentAccuracy >= 80
                        ? '#10b981'
                        : entry.currentAccuracy >= 70
                        ? '#0ea5e9'
                        : '#f59e0b'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 30-Day Question Accuracy by Difficulty Level (Fundamental, Intermediate, Advanced) Recharts LineChart */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#0078D4]" />
                <span>30-Day Question Accuracy by Difficulty Level</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[#0078D4] text-[10px] font-black uppercase tracking-wider">
                Fundamental • Intermediate • Advanced (30 Days)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Maps how your question accuracy evolves across Fundamental, Intermediate, and Advanced tiers over the last 30 days compared to the 70% passing threshold.
            </p>
          </div>

          {/* Controls: Daily vs Cumulative & Tier Visibility */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setThirtyDayTrendMode('daily')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  thirtyDayTrendMode === 'daily'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Accuracy
              </button>
              <button
                type="button"
                onClick={() => setThirtyDayTrendMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  thirtyDayTrendMode === 'cumulative'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30-Day Cumulative
              </button>
            </div>

            {/* Tier Toggles */}
            <div className="flex items-center gap-1">
              {(['Fundamental', 'Intermediate', 'Advanced'] as DifficultyTier[]).map((tier) => {
                const isVisible = visibleTiers[tier];
                const color = DIFFICULTY_COLORS[tier];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() =>
                      setVisibleTiers((prev) => ({ ...prev, [tier]: !prev[tier] }))
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isVisible
                        ? 'bg-white text-slate-800 shadow-2xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}
                    style={{ borderColor: isVisible ? color : undefined }}
                    title={`Toggle ${tier} line`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{tier}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 30-Day KPI Tiers Summary Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(['Fundamental', 'Intermediate', 'Advanced'] as DifficultyTier[]).map((tier) => {
            const sum = thirtyDayDifficultyTrends.summary30d[tier];
            const color = DIFFICULTY_COLORS[tier];
            const isAbovePass = sum.accuracy >= 70;
            return (
              <div
                key={`30d-kpi-${tier}`}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-black text-slate-900">
                      {tier}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {sum.correct}/{sum.total} Qs in 30 days
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-slate-900 block">
                    {sum.total > 0 ? `${sum.accuracy}%` : '—'}
                  </span>
                  {sum.total > 0 && (
                    <span
                      className={`text-[10px] font-extrabold ${
                        isAbovePass ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {isAbovePass ? 'Pass Ready (≥70%)' : 'Needs Practice (<70%)'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recharts LineChart */}
        {thirtyDayDifficultyTrends.totalAttemptsIn30d > 0 &&
        thirtyDayDifficultyTrends.points.length > 0 ? (
          <div className="w-full h-76 sm:h-84">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={thirtyDayDifficultyTrends.points}
                margin={{ top: 14, right: 16, left: -12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                  stroke={gridStrokeColor}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                  stroke={gridStrokeColor}
                />
                <Tooltip content={<CustomThirtyDayDifficultyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: '70% Pass Threshold',
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                />
                {visibleTiers.Fundamental && (
                  <Line
                    type="monotone"
                    dataKey="fundamentalAcc"
                    name="Fundamental Tier %"
                    stroke={DIFFICULTY_COLORS.Fundamental}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: DIFFICULTY_COLORS.Fundamental,
                      stroke: '#fff',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                )}
                {visibleTiers.Intermediate && (
                  <Line
                    type="monotone"
                    dataKey="intermediateAcc"
                    name="Intermediate Tier %"
                    stroke={DIFFICULTY_COLORS.Intermediate}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: DIFFICULTY_COLORS.Intermediate,
                      stroke: '#fff',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                )}
                {visibleTiers.Advanced && (
                  <Line
                    type="monotone"
                    dataKey="advancedAcc"
                    name="Advanced Tier %"
                    stroke={DIFFICULTY_COLORS.Advanced}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: DIFFICULTY_COLORS.Advanced,
                      stroke: '#fff',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Gauge className="w-7 h-7 text-[#0078D4]" />
            <p className="text-sm font-bold text-slate-800">
              No quiz attempts recorded in the last 30 days
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Answer questions in Practice, Adaptive Quiz, or Mock Exams across Fundamental, Intermediate, and Advanced tiers to plot your 30-day difficulty trajectory.
            </p>
          </div>
        )}
      </div>

      {/* Chart 3: Dynamic Difficulty Calibration (Recharts ComposedChart Overlaying Success Rate vs Difficulty Segments) */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-violet-600" />
                <span>Difficulty Calibration &amp; Adaptive Effectiveness</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[10px] font-black uppercase tracking-wider">
                Fundamental • Intermediate • Advanced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Overlays your success rate against the Fundamental, Intermediate, and Advanced difficulty segments to visualize adaptive calibration growth.
            </p>
          </div>

          {/* Interactive Calibration Mode & Tier Line Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setCalibrationViewMode('overlay')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  calibrationViewMode === 'overlay'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Adaptive Trajectory
              </button>
              <button
                type="button"
                onClick={() => setCalibrationViewMode('segments')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  calibrationViewMode === 'segments'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Segment Comparison
              </button>
            </div>

            {calibrationViewMode === 'overlay' && (
              <button
                type="button"
                onClick={() => setShowTierOverlayLines((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showTierOverlayLines
                    ? 'bg-sky-50 text-[#0078D4] border-sky-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle Fundamental, Intermediate, and Advanced cumulative success overlay curves"
              >
                {showTierOverlayLines ? '✓ Tier Curves On' : 'Show Tier Curves'}
              </button>
            )}
          </div>
        </div>

        {/* 3 Difficulty Segment Summary Pills + Adaptive Calibration Narrative */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {difficultyCalibration.segments.map((seg) => (
            <div
              key={seg.tier}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-black text-slate-900">
                    {seg.tier}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    ({seg.sharePct}% mix)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {seg.correct}/{seg.total} correct • Target ≥ {seg.targetBenchmark}%
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black font-mono text-slate-900">
                  {seg.total > 0 ? `${seg.successRate}%` : '—'}
                </div>
                {seg.total >= 2 && (
                  <div
                    className={`text-[10px] font-black ${
                      seg.delta > 0
                        ? 'text-emerald-600'
                        : seg.delta < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {seg.delta > 0 ? `+${seg.delta}% shift` : `${seg.delta}% shift`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-50/90 via-sky-50/70 to-emerald-50/70 border border-violet-200/80 flex items-center gap-2 text-xs font-bold text-slate-800">
          <Zap className="w-4 h-4 text-violet-600 shrink-0" />
          <span>{difficultyCalibration.adaptiveNarrative}</span>
        </div>

        {difficultyCalibration.totalScoped > 0 ? (
          <div className="w-full h-76 sm:h-84">
            <ResponsiveContainer width="100%" height="100%">
              {calibrationViewMode === 'overlay' ? (
                <ComposedChart
                  data={difficultyCalibration.timeline}
                  margin={{ top: 14, right: 16, left: -12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                  {/* Horizontal Difficulty Segment Calibration Bands */}
                  <ReferenceArea
                    y1={0}
                    y2={55}
                    fill="#0ea5e9"
                    fillOpacity={isDark ? 0.08 : 0.06}
                  />
                  <ReferenceArea
                    y1={55}
                    y2={78}
                    fill="#f59e0b"
                    fillOpacity={isDark ? 0.08 : 0.06}
                  />
                  <ReferenceArea
                    y1={78}
                    y2={100}
                    fill="#8b5cf6"
                    fillOpacity={isDark ? 0.1 : 0.07}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                    stroke={gridStrokeColor}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                    stroke={gridStrokeColor}
                  />
                  <Tooltip content={<CustomCalibrationTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }} />
                  <ReferenceLine
                    y={70}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label={{
                      value: '70% Pass Threshold',
                      position: 'insideTopRight',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  />
                  <Bar
                    dataKey="difficultyLoad"
                    name="Adaptive Difficulty Load"
                    barSize={26}
                    radius={[6, 6, 0, 0]}
                    fillOpacity={0.78}
                  >
                    {difficultyCalibration.timeline.map((pt, idx) => (
                      <Cell
                        key={`calib-bar-${pt.label}-${idx}`}
                        fill={DIFFICULTY_COLORS[pt.dominantTier]}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="successRate"
                    name="User Success Rate %"
                    stroke="#10b981"
                    strokeWidth={3.2}
                    dot={{ r: 4.5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6.5 }}
                  />
                  {showTierOverlayLines && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="fundamentalAcc"
                        name="Fundamental %"
                        stroke={DIFFICULTY_COLORS.Fundamental}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={{ r: 2.5 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="intermediateAcc"
                        name="Intermediate %"
                        stroke={DIFFICULTY_COLORS.Intermediate}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={{ r: 2.5 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="advancedAcc"
                        name="Advanced %"
                        stroke={DIFFICULTY_COLORS.Advanced}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={{ r: 2.5 }}
                        connectNulls
                      />
                    </>
                  )}
                </ComposedChart>
              ) : (
                <ComposedChart
                  data={difficultyCalibration.segments}
                  margin={{ top: 14, right: 16, left: -12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                  <XAxis
                    dataKey="tier"
                    tick={{ fill: axisTickColor, fontSize: 12, fontWeight: 800 }}
                    stroke={gridStrokeColor}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 700 }}
                    stroke={gridStrokeColor}
                  />
                  <Tooltip content={<CustomCalibrationTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }} />
                  <ReferenceLine
                    y={70}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label={{
                      value: '70% Pass Mark',
                      position: 'insideTopRight',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  />
                  <Bar
                    dataKey="sharePct"
                    name="Difficulty Mix Share %"
                    barSize={34}
                    radius={[6, 6, 0, 0]}
                    fillOpacity={0.65}
                  >
                    {difficultyCalibration.segments.map((seg) => (
                      <Cell key={`seg-share-${seg.tier}`} fill={seg.color} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="earlyAccuracy"
                    name="Early Baseline %"
                    barSize={26}
                    radius={[6, 6, 0, 0]}
                    fill={isDark ? '#475569' : '#94a3b8'}
                  />
                  <Line
                    type="monotone"
                    dataKey="targetBenchmark"
                    name="Calibration Benchmark %"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="successRate"
                    name="User Success Rate %"
                    stroke="#10b981"
                    strokeWidth={3.2}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-52 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Gauge className="w-7 h-7 text-violet-600" />
            <p className="text-sm font-bold text-slate-800">
              Solve questions to map your Difficulty Calibration curve
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Once you attempt Fundamental, Intermediate, and Advanced scenarios, this chart plots how accurately you adapt as difficulty increases.
            </p>
          </div>
        )}
      </div>

      {/* Per-Path Growth Summary + Actionable Module Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pathSummaries.map((path) => (
          <div
            key={path.pathId}
            className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                  style={{ backgroundColor: path.color }}
                >
                  {path.code} • {path.weight}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 leading-snug">
                  {path.title}
                </h4>
              </div>
              <span className="text-xl font-black font-mono text-slate-900">
                {path.currentAccuracy}%
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${path.currentAccuracy}%`,
                  backgroundColor: path.color,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>
                Attempts: <strong>{path.correctAttempts}/{path.totalAttempts}</strong>
              </span>
              {path.totalAttempts >= 4 ? (
                <span
                  className={`font-black inline-flex items-center gap-1 ${
                    path.growthDelta > 0
                      ? 'text-emerald-600'
                      : path.growthDelta < 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {path.growthDelta > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : path.growthDelta < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  {path.growthDelta > 0
                    ? `+${path.growthDelta}% growth`
                    : `${path.growthDelta}% shift`}
                </span>
              ) : (
                <span className="text-slate-400">Need 4+ Qs for trend</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Module Breakdown Cards with Quick-Practice Launch */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Module Growth Breakdown ({moduleData.length} Modules)
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">
            Click any module to target it directly in Practice
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {moduleData.map((mod) => {
            const isMastered = mod.totalAttempts > 0 && mod.currentAccuracy >= 80;
            const needsAttention = mod.totalAttempts > 0 && mod.currentAccuracy < 70;
            return (
              <div
                key={mod.moduleId}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                      M{mod.moduleId}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {mod.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="font-mono font-bold text-slate-800">
                      {mod.totalAttempts > 0 ? `${mod.currentAccuracy}%` : '—'}
                    </span>
                    <span>
                      ({mod.correctAttempts}/{mod.totalAttempts})
                    </span>
                    {mod.totalAttempts >= 2 && mod.delta !== 0 && (
                      <span
                        className={`font-black ${
                          mod.delta > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {mod.delta > 0 ? `+${mod.delta}%` : `${mod.delta}%`}
                      </span>
                    )}
                    {isMastered && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    {needsAttention && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                  </div>
                </div>

                {onPracticeModule && (
                  <button
                    type="button"
                    onClick={() => onPracticeModule(mod.moduleId, mod.pathId)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
