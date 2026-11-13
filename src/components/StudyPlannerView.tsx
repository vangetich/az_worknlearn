import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  Play,
  BookOpen,
  Award,
  TrendingUp,
  RefreshCw,
  Download,
  ChevronRight,
  Layers,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { CURRICULUM_STUDY_MODULES } from '../data/studyNotes';
import { UserStats } from '../types/quiz';

interface StudyPlannerViewProps {
  stats: UserStats;
  onSelectModulePractice: (moduleId: number) => void;
  onLaunchAdaptiveModule: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onLaunchMockSimulation: () => void;
  onOpenStudyGuideModule?: (moduleId: number) => void;
}

interface PlannerConfigState {
  targetExamDate: string;
  scheduleCadence: 'daily' | 'weekly';
  dailyStudyMinutes: 30 | 45 | 60 | 90;
  pathConfidence: {
    1: number; // 0-100
    2: number; // 0-100
    3: number; // 0-100
  };
  completedTaskIds: string[];
}

export interface StudyTaskItem {
  id: string;
  dayOffset: number;
  dateLabel: string;
  isoDate: string;
  weekNumber: number;
  pathId: 1 | 2 | 3;
  pathTitle: string;
  moduleId: number;
  moduleTitle: string;
  priorityLevel: 'Critical' | 'High' | 'Moderate' | 'Review';
  activityType: 'Foundational Primer' | 'Targeted Module Drill' | 'Advanced Scenarios' | 'Mock Exam Simulation';
  estimatedMinutes: number;
  focusUnits: string[];
  examTakeaway: string;
  rationale: string;
}

const STORAGE_KEY = 'az900_study_planner_v1';

const getDefaultExamDate = (daysAhead = 14): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const CONFIDENCE_TIERS = [
  { label: 'Novice (20%)', value: 20, desc: 'New to these cloud concepts' },
  { label: 'Developing (45%)', value: 45, desc: 'Understand basics, miss exam traps' },
  { label: 'Moderate (65%)', value: 65, desc: 'Close to passing benchmark' },
  { label: 'Confident (80%)', value: 80, desc: 'Solid grasp of services & SLAs' },
  { label: 'Exam Ready (95%)', value: 95, desc: 'Mastered advanced scenarios' },
];

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  stats,
  onSelectModulePractice,
  onLaunchAdaptiveModule,
  onLaunchMockSimulation,
  onOpenStudyGuideModule,
}) => {
  const computeTelemetryConfidence = (): { 1: number; 2: number; 3: number } => {
    const getPathAcc = (pId: 1 | 2 | 3, fallback: number) => {
      const pm = stats.pathMastery?.[pId];
      if (pm && pm.total > 0) {
        return Math.max(15, Math.min(98, Math.round((pm.correct / pm.total) * 100)));
      }
      return fallback;
    };
    return {
      1: getPathAcc(1, 60),
      2: getPathAcc(2, 45),
      3: getPathAcc(3, 50),
    };
  };

  const [config, setConfig] = useState<PlannerConfigState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.targetExamDate && parsed.pathConfidence) {
          return {
            targetExamDate: parsed.targetExamDate,
            scheduleCadence: parsed.scheduleCadence === 'weekly' ? 'weekly' : 'daily',
            dailyStudyMinutes: parsed.dailyStudyMinutes || 45,
            pathConfidence: {
              1: Number(parsed.pathConfidence[1] ?? 60),
              2: Number(parsed.pathConfidence[2] ?? 45),
              3: Number(parsed.pathConfidence[3] ?? 50),
            },
            completedTaskIds: Array.isArray(parsed.completedTaskIds) ? parsed.completedTaskIds : [],
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return {
      targetExamDate: getDefaultExamDate(14),
      scheduleCadence: 'daily',
      dailyStudyMinutes: 45,
      pathConfidence: computeTelemetryConfidence(),
      completedTaskIds: [],
    };
  });

  const [filterPathId, setFilterPathId] = useState<number | 'all'>('all');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
  }, [config]);

  const handleSyncFromTelemetry = () => {
    const live = computeTelemetryConfidence();
    setConfig((prev) => ({
      ...prev,
      pathConfidence: live,
    }));
    setSyncNotice('Confidence levels calibrated from your live AZ-900 telemetry.');
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const applyPresetDate = (daysAhead: number) => {
    setConfig((prev) => ({
      ...prev,
      targetExamDate: getDefaultExamDate(daysAhead),
    }));
  };

  // Calculate days remaining until Target Exam Date
  const daysRemaining = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(config.targetExamDate + 'T00:00:00');
    if (isNaN(target.getTime())) return 14;
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(90, diffDays));
  }, [config.targetExamDate]);

  // Rank learning paths and modules by priority (weakest confidence + official exam weight + module telemetry)
  const prioritizedPathsAndModules = useMemo(() => {
    const pathWeights: Record<1 | 2 | 3, number> = {
      1: 0.275, // 25-30%
      2: 0.375, // 35-40%
      3: 0.325, // 30-35%
    };

    const pathsRanked = LEARNING_PATHS.map((lp) => {
      const conf = config.pathConfidence[lp.id];
      const deficit = 100 - conf;
      const priorityScore = Math.round(deficit * (1 + pathWeights[lp.id]));

      const modulesWithPriority = lp.modules.map((mod) => {
        const modStat = stats.moduleMastery?.[mod.id];
        const modAttempted = modStat?.total || 0;
        const modAcc = modAttempted > 0 ? Math.round((modStat.correct / modAttempted) * 100) : conf;
        // Blend path confidence with actual module accuracy
        const effectiveScore = modAttempted > 0 ? Math.round(conf * 0.4 + modAcc * 0.6) : conf;
        const modDeficit = 100 - effectiveScore;

        const studyMod = CURRICULUM_STUDY_MODULES.find((m) => m.moduleId === mod.id);
        const focusUnits = studyMod
          ? studyMod.units.slice(0, 3).map((u) => u.unitTitle)
          : mod.units.slice(0, 3);
        const examTakeaway =
          studyMod?.units[0]?.examTakeaway ||
          `Master ${mod.title} core concepts and architectural boundaries.`;

        return {
          ...mod,
          pathId: lp.id,
          pathTitle: lp.title,
          modAttempted,
          modAcc,
          effectiveScore,
          modDeficit,
          focusUnits,
          examTakeaway,
        };
      });

      // Sort modules within this path from weakest to strongest
      modulesWithPriority.sort((a, b) => b.modDeficit - a.modDeficit);

      return {
        ...lp,
        confidence: conf,
        deficit,
        priorityScore,
        modulesRanked: modulesWithPriority,
      };
    });

    pathsRanked.sort((a, b) => b.priorityScore - a.priorityScore);
    return pathsRanked;
  }, [config.pathConfidence, stats.moduleMastery]);

  // Build day-by-day schedule across daysRemaining (up to 42 days displayed cleanly)
  const studySchedule = useMemo<StudyTaskItem[]>(() => {
    const horizon = Math.min(daysRemaining, 42);
    const tasks: StudyTaskItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Flatten modules weighted by path deficit so weaker paths appear more frequently in the rotation
    const weightedModulePool: Array<(typeof prioritizedPathsAndModules)[0]['modulesRanked'][0]> = [];

    prioritizedPathsAndModules.forEach((p, idx) => {
      // Highest deficit path gets 3x frequency, second gets 2x, strongest gets 1x
      const repeatCount = idx === 0 ? 3 : idx === 1 ? 2 : 1;
      for (let r = 0; r < repeatCount; r++) {
        p.modulesRanked.forEach((m) => {
          weightedModulePool.push(m);
        });
      }
    });

    // Sort top slice so the very first days immediately hit the weakest modules
    for (let dayIdx = 0; dayIdx < horizon; dayIdx++) {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + dayIdx);
      const isoDate = taskDate.toISOString().split('T')[0];
      const dateLabel = taskDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const weekNumber = Math.floor(dayIdx / 7) + 1;

      const isFinalExamDay = dayIdx === horizon - 1 && horizon >= 3;
      const isPeriodicMockDay = !isFinalExamDay && (dayIdx + 1) % 6 === 0;

      if (isFinalExamDay || isPeriodicMockDay) {
        const weakestPath = prioritizedPathsAndModules[0];
        const targetMod = weakestPath.modulesRanked[0];
        tasks.push({
          id: `task-day-${dayIdx + 1}-mock`,
          dayOffset: dayIdx + 1,
          dateLabel,
          isoDate,
          weekNumber,
          pathId: weakestPath.id,
          pathTitle: weakestPath.title,
          moduleId: targetMod.id,
          moduleTitle: isFinalExamDay
            ? 'Full 60-Question Official Dress Rehearsal'
            : `Timed 50–60Q Mock Exam Checkpoint (Focus: Path ${weakestPath.id})`,
          priorityLevel: 'Critical',
          activityType: 'Mock Exam Simulation',
          estimatedMinutes: 60,
          focusUnits: [
            'Path 1: Cloud Concepts (25–30%)',
            'Path 2: Architecture & Services (35–40%)',
            'Path 3: Management & Governance (30–35%)',
          ],
          examTakeaway:
            'Target 700/1000+ under strict 60-minute exam conditions and review all learning path breakdowns.',
          rationale: isFinalExamDay
            ? 'Final dress rehearsal before your target exam date to validate pacing and stamina.'
            : `Periodic full-length checkpoint to measure progress on your #1 priority area (${weakestPath.title}).`,
        });
        continue;
      }

      const poolMod = weightedModulePool[dayIdx % weightedModulePool.length];
      const priorityLevel: StudyTaskItem['priorityLevel'] =
        poolMod.effectiveScore < 55
          ? 'Critical'
          : poolMod.effectiveScore < 72
          ? 'High'
          : poolMod.effectiveScore < 85
          ? 'Moderate'
          : 'Review';

      const activityType: StudyTaskItem['activityType'] =
        poolMod.effectiveScore < 55
          ? 'Foundational Primer'
          : poolMod.effectiveScore < 78
          ? 'Targeted Module Drill'
          : 'Advanced Scenarios';

      const rationale =
        poolMod.effectiveScore < 55
          ? `Low confidence/accuracy (${poolMod.effectiveScore}%) in Path ${poolMod.pathId}. Start with foundational explanations before drilling.`
          : poolMod.effectiveScore < 78
          ? `Below 80% mastery buffer (${poolMod.effectiveScore}%). Reinforce service comparisons and exam distractors.`
          : `Strong baseline (${poolMod.effectiveScore}%). Challenge yourself with multi-service architecture scenarios.`;

      tasks.push({
        id: `task-day-${dayIdx + 1}-mod-${poolMod.id}`,
        dayOffset: dayIdx + 1,
        dateLabel,
        isoDate,
        weekNumber,
        pathId: poolMod.pathId,
        pathTitle: poolMod.pathTitle,
        moduleId: poolMod.id,
        moduleTitle: poolMod.title,
        priorityLevel,
        activityType,
        estimatedMinutes: config.dailyStudyMinutes,
        focusUnits: poolMod.focusUnits,
        examTakeaway: poolMod.examTakeaway,
        rationale,
      });
    }

    return tasks;
  }, [daysRemaining, prioritizedPathsAndModules, config.dailyStudyMinutes]);

  const filteredTasks = useMemo(() => {
    if (filterPathId === 'all') return studySchedule;
    return studySchedule.filter((t) => t.pathId === filterPathId);
  }, [studySchedule, filterPathId]);

  // Group by week for Weekly Schedule Mode
  const weeklyGroups = useMemo(() => {
    const map = new Map<
      number,
      {
        weekNumber: number;
        dateRange: string;
        tasks: StudyTaskItem[];
        totalMinutes: number;
        primaryFocusModules: string[];
      }
    >();

    filteredTasks.forEach((task) => {
      const existing = map.get(task.weekNumber);
      if (!existing) {
        map.set(task.weekNumber, {
          weekNumber: task.weekNumber,
          dateRange: task.dateLabel,
          tasks: [task],
          totalMinutes: task.estimatedMinutes,
          primaryFocusModules: [`Mod ${task.moduleId}: ${task.moduleTitle}`],
        });
      } else {
        existing.tasks.push(task);
        existing.totalMinutes += task.estimatedMinutes;
        existing.dateRange = `${existing.tasks[0].dateLabel} – ${task.dateLabel}`;
        const modLabel = `Mod ${task.moduleId}: ${task.moduleTitle}`;
        if (
          task.activityType !== 'Mock Exam Simulation' &&
          !existing.primaryFocusModules.includes(modLabel)
        ) {
          existing.primaryFocusModules.push(modLabel);
        }
      }
    });

    return Array.from(map.values());
  }, [filteredTasks]);

  const toggleTaskCompleted = (taskId: string) => {
    setConfig((prev) => {
      const exists = prev.completedTaskIds.includes(taskId);
      return {
        ...prev,
        completedTaskIds: exists
          ? prev.completedTaskIds.filter((id) => id !== taskId)
          : [...prev.completedTaskIds, taskId],
      };
    });
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [
      `# AZ-900 Personalized Study Planner`,
      `- **Target Exam Date:** ${config.targetExamDate} (${daysRemaining} days remaining)`,
      `- **Daily Commitment:** ${config.dailyStudyMinutes} mins/day`,
      `- **Path 1 Confidence:** ${config.pathConfidence[1]}% | **Path 2 Confidence:** ${config.pathConfidence[2]}% | **Path 3 Confidence:** ${config.pathConfidence[3]}%`,
      ``,
      `## Prioritized Learning Paths`,
      ...prioritizedPathsAndModules.map(
        (p, idx) =>
          `${idx + 1}. **Path ${p.id}: ${p.title}** (${p.examWeight}) — Confidence: ${p.confidence}% | Top Focus Modules: ${p.modulesRanked
            .slice(0, 2)
            .map((m) => `Module ${m.id} (${m.title})`)
            .join(', ')}`
      ),
      ``,
      `## Recommended ${config.scheduleCadence === 'daily' ? 'Daily' : 'Weekly'} Schedule`,
      ...studySchedule.map(
        (t) =>
          `- [${config.completedTaskIds.includes(t.id) ? 'x' : ' '}] **Day ${t.dayOffset} (${t.dateLabel})** — [${t.priorityLevel}] ${t.activityType}: **Module ${t.moduleId}: ${t.moduleTitle}** (${t.estimatedMinutes}m) — *${t.rationale}*`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AZ-900-Study-Plan-${config.targetExamDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = studySchedule.filter((t) =>
    config.completedTaskIds.includes(t.id)
  ).length;
  const completionPct =
    studySchedule.length > 0 ? Math.round((completedCount / studySchedule.length) * 100) : 0;

  const overallReadinessIndex = Math.round(
    config.pathConfidence[1] * 0.275 +
      config.pathConfidence[2] * 0.375 +
      config.pathConfidence[3] * 0.35
  );

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200/70 dark:border-sky-800/70 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              AZ-900 Smart Study Planner
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Adaptive Exam Countdown & Priority Schedule
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Set your target exam date and rate your current confidence across all three official AZ-900 learning paths. The planner dynamically prioritizes your weakest domains and recommends daily or weekly module drills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncFromTelemetry}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Sync confidence sliders with your actual quiz accuracy per learning path"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync from Live Quiz Telemetry
            </button>
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Plan (.md)
            </button>
          </div>
        </div>

        {syncNotice && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {syncNotice}
          </div>
        )}

        {/* Configuration Grid: Target Date + Daily Commitment + Readiness Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Left Column: Exam Date & Commitment Controls */}
          <div className="lg:col-span-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                1. Target AZ-900 Exam Date
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <input
                  type="date"
                  value={config.targetExamDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      targetExamDate: e.target.value || getDefaultExamDate(14),
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-extrabold tabular-nums text-center shrink-0">
                  {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Horizon:</span>
                {[
                  { label: '7 Days (Sprint)', days: 7 },
                  { label: '14 Days (Standard)', days: 14 },
                  { label: '21 Days', days: 21 },
                  { label: '30 Days (Deep)', days: 30 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => applyPresetDate(preset.days)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      daysRemaining === preset.days
                        ? 'bg-sky-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Schedule Cadence
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, scheduleCadence: 'daily' }))}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      config.scheduleCadence === 'daily'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Daily Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, scheduleCadence: 'weekly' }))}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      config.scheduleCadence === 'weekly'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Weekly Plan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Daily Study Time
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg">
                  {([30, 45, 60, 90] as const).map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, dailyStudyMinutes: mins }))}
                      className={`py-1.5 rounded-md text-xs font-bold tabular-nums transition-all cursor-pointer ${
                        config.dailyStudyMinutes === mins
                          ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Readiness KPI Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Weighted Readiness</div>
                <div
                  className={`text-lg font-extrabold tabular-nums ${
                    overallReadinessIndex >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : overallReadinessIndex >= 55
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {overallReadinessIndex}%
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Study Hrs</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {((studySchedule.length * config.dailyStudyMinutes) / 60).toFixed(1)}h
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Plan Progress</div>
                <div className="text-lg font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
                  {completedCount}/{studySchedule.length} ({completionPct}%)
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Confidence Sliders per Learning Path */}
          <div className="lg:col-span-7 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-500" />
                2. Current Confidence Level by Learning Path
              </label>
              <span className="text-[11px] text-slate-400">
                Lower confidence paths receive higher daily priority
              </span>
            </div>

            <div className="space-y-3">
              {LEARNING_PATHS.map((lp) => {
                const conf = config.pathConfidence[lp.id];
                const liveStat = stats.pathMastery?.[lp.id];
                const liveAcc =
                  liveStat && liveStat.total > 0
                    ? Math.round((liveStat.correct / liveStat.total) * 100)
                    : null;

                const statusBadge =
                  conf < 55
                    ? { text: 'High Priority Deficit', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300' }
                    : conf < 75
                    ? { text: 'Moderate Priority', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300' }
                    : { text: 'Strong Baseline', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300' };

                return (
                  <div
                    key={lp.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            Path {lp.id}: {lp.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Weight: {lp.examWeight}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadge.cls}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        {liveAcc !== null && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Recorded Quiz Telemetry: <strong className="text-slate-600 dark:text-slate-300">{liveAcc}%</strong> ({liveStat?.correct}/{liveStat?.total} correct)
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
                          {conf}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">Confidence</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={conf}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setConfig((prev) => ({
                          ...prev,
                          pathConfidence: {
                            ...prev.pathConfidence,
                            [lp.id]: val,
                          },
                        }));
                      }}
                      className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-1 mt-2">
                      {CONFIDENCE_TIERS.map((tier) => (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              pathConfidence: {
                                ...prev.pathConfidence,
                                [lp.id]: tier.value,
                              },
                            }))
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                            Math.abs(conf - tier.value) <= 5
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Diagnostic & Specific Module Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {prioritizedPathsAndModules.map((pathItem, rankIndex) => {
          const topFocusModules = pathItem.modulesRanked.slice(0, 2);
          return (
            <div
              key={pathItem.id}
              className={`rounded-2xl p-4 border shadow-xs flex flex-col justify-between ${
                rankIndex === 0
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/70'
                  : rankIndex === 1
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70'
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      rankIndex === 0
                        ? 'bg-rose-600 text-white'
                        : rankIndex === 1
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Priority #{rankIndex + 1} • {rankIndex === 0 ? 'Primary Focus' : rankIndex === 1 ? 'Secondary Focus' : 'Maintenance'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                    Confidence: {pathItem.confidence}%
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Path {pathItem.id}: {pathItem.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official Exam Weight: <strong>{pathItem.examWeight}</strong> • {pathItem.modules.length} Modules
                </p>

                <div className="mt-3 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Suggested Specific Modules to Focus On:
                  </div>
                  {topFocusModules.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Module {m.id}: {m.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          Mastery Score: <strong className="tabular-nums">{m.effectiveScore}%</strong> • {m.focusUnits[0]}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLaunchAdaptiveModule(m.id, pathItem.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shrink-0 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        Drill
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Scheduled Sessions:</span>
                <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                  {studySchedule.filter((t) => t.pathId === pathItem.id).length} sessions
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated Daily or Weekly Schedule Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              Recommended {config.scheduleCadence === 'daily' ? 'Daily' : 'Weekly'} Study Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatically sequenced for the next {Math.min(daysRemaining, 42)} days leading up to{' '}
              <strong>{config.targetExamDate}</strong>. Check off sessions as you complete them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterPathId('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterPathId === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Paths ({studySchedule.length})
            </button>
            {LEARNING_PATHS.map((lp) => (
              <button
                key={lp.id}
                type="button"
                onClick={() => setFilterPathId(lp.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterPathId === lp.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Path {lp.id}
              </button>
            ))}
          </div>
        </div>

        {/* DAILY SCHEDULE VIEW */}
        {config.scheduleCadence === 'daily' ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {filteredTasks.map((task) => {
              const isDone = config.completedTaskIds.includes(task.id);
              const priorityBadge =
                task.priorityLevel === 'Critical'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : task.priorityLevel === 'High'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : task.priorityLevel === 'Moderate'
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

              return (
                <div
                  key={task.id}
                  className={`py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-opacity ${
                    isDone ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="mt-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                      title={isDone ? 'Mark as incomplete' : 'Mark session complete'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                          Day {task.dayOffset} • {task.dateLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityBadge}`}
                        >
                          {task.priorityLevel} Priority
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.activityType}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" /> {task.estimatedMinutes} mins
                        </span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-extrabold ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.activityType === 'Mock Exam Simulation'
                          ? task.moduleTitle
                          : `Module ${task.moduleId}: ${task.moduleTitle}`}{' '}
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                          (Path {task.pathId})
                        </span>
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400">{task.rationale}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Focus Units:
                        </span>
                        {task.focusUnits.map((u, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-medium"
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pl-8 lg:pl-0">
                    {task.activityType === 'Mock Exam Simulation' ? (
                      <button
                        type="button"
                        onClick={onLaunchMockSimulation}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Launch 50–60Q Mock Exam
                      </button>
                    ) : (
                      <>
                        {onOpenStudyGuideModule && (
                          <button
                            type="button"
                            onClick={() => onOpenStudyGuideModule(task.moduleId)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Study Notes
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectModulePractice(task.moduleId)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Practice Bank
                        </button>
                        <button
                          type="button"
                          onClick={() => onLaunchAdaptiveModule(task.moduleId, task.pathId)}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Adaptive Smart Quiz
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* WEEKLY SCHEDULE VIEW */
          <div className="space-y-5 mt-4">
            {weeklyGroups.map((week) => {
              const weekDone = week.tasks.filter((t) =>
                config.completedTaskIds.includes(t.id)
              ).length;
              return (
                <div
                  key={week.weekNumber}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Week {week.weekNumber} Schedule
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          ({week.dateRange})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Primary Focus:{' '}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {week.primaryFocusModules.slice(0, 3).join(' • ')}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 tabular-nums">
                        {(week.totalMinutes / 60).toFixed(1)} hrs total
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 tabular-nums">
                        {weekDone}/{week.tasks.length} Completed
                      </span>
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {week.tasks.map((task) => {
                      const isDone = config.completedTaskIds.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3 ${
                            isDone ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-70' : 'bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => toggleTaskCompleted(task.id)}
                              className="mt-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                <span>Day {task.dayOffset} ({task.dateLabel})</span>
                                <span>•</span>
                                <span className="text-sky-600 dark:text-sky-400">{task.activityType}</span>
                              </div>
                              <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {task.activityType === 'Mock Exam Simulation'
                                  ? task.moduleTitle
                                  : `Module ${task.moduleId}: ${task.moduleTitle}`}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {task.examTakeaway}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                              Path {task.pathId} • {task.estimatedMinutes} mins
                            </span>
                            {task.activityType === 'Mock Exam Simulation' ? (
                              <button
                                type="button"
                                onClick={onLaunchMockSimulation}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                Start Simulation <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onLaunchAdaptiveModule(task.moduleId, task.pathId)}
                                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                Start Module Drill <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
