import React, { useMemo, useState } from 'react';
import {
  Scale,
  Clock,
  Target,
  Flame,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';

export const PATH_STUDY_TIME_STORAGE_KEY = 'az900_path_study_time_v1';
export const TARGET_GRADE_STORAGE_KEY = 'az900_target_grade_percent_v1';

export type PathStudySecondsMap = Record<1 | 2 | 3, number>;

export function getStoredPathStudySeconds(): PathStudySecondsMap {
  if (typeof window === 'undefined') return { 1: 0, 2: 0, 3: 0 };
  try {
    const raw = localStorage.getItem(PATH_STUDY_TIME_STORAGE_KEY);
    if (!raw) return { 1: 0, 2: 0, 3: 0 };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      1: typeof parsed['1'] === 'number' && parsed['1'] >= 0 ? parsed['1'] : 0,
      2: typeof parsed['2'] === 'number' && parsed['2'] >= 0 ? parsed['2'] : 0,
      3: typeof parsed['3'] === 'number' && parsed['3'] >= 0 ? parsed['3'] : 0,
    };
  } catch {
    return { 1: 0, 2: 0, 3: 0 };
  }
}

export function incrementPathStudySecond(pathId: 1 | 2 | 3): PathStudySecondsMap {
  const current = getStoredPathStudySeconds();
  const next: PathStudySecondsMap = {
    ...current,
    [pathId]: (current[pathId] || 0) + 1,
  };
  try {
    localStorage.setItem(PATH_STUDY_TIME_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function getStoredTargetGrade(): number {
  if (typeof window === 'undefined') return 70;
  try {
    const raw = localStorage.getItem(TARGET_GRADE_STORAGE_KEY);
    if (!raw) return 70;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 70 && parsed <= 100) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return 70;
}

export function saveTargetGrade(grade: number): number {
  const clamped = Math.max(70, Math.min(100, Math.round(grade)));
  try {
    localStorage.setItem(TARGET_GRADE_STORAGE_KEY, String(clamped));
  } catch {
    // ignore
  }
  return clamped;
}

function formatDurationCompact(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

interface BalancedPathIntensityCoachProps {
  stats: UserStats;
  questions: Question[];
  pathStudySeconds: PathStudySecondsMap;
  selectedPathId: number | 'all';
  onFocusPath: (pathId: 1 | 2 | 3, moduleId?: number) => void;
  defaultExpanded?: boolean;
}

export const BalancedPathIntensityCoach: React.FC<BalancedPathIntensityCoachProps> = ({
  stats,
  questions,
  pathStudySeconds,
  selectedPathId,
  onFocusPath,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [targetGrade, setTargetGrade] = useState<number>(getStoredTargetGrade);

  const handleSetTargetGrade = (val: number) => {
    const saved = saveTargetGrade(val);
    setTargetGrade(saved);
  };

  const analysis = useMemo(() => {
    const totalSeconds =
      (pathStudySeconds[1] || 0) + (pathStudySeconds[2] || 0) + (pathStudySeconds[3] || 0);

    const paths = LEARNING_PATHS.map((path) => {
      const pId = path.id;
      const pathQuestions = questions.filter((q) => q.learningPathId === pId);
      let answeredCount = 0;
      let correctCount = 0;

      pathQuestions.forEach((q) => {
        const atts = stats.attempts?.[q.id] || [];
        if (atts.length > 0) {
          answeredCount += 1;
          const latest = [...atts].sort((a, b) => b.timestamp - a.timestamp)[0];
          if (latest.isCorrect) correctCount += 1;
        }
      });

      const accuracy =
        answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
      const seconds = pathStudySeconds[pId] || 0;
      const timeSharePercent =
        totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 33;

      // Find weakest module in this path
      let weakestModule = path.modules[0];
      let weakestModuleAcc = 101;
      path.modules.forEach((mod) => {
        const modQs = pathQuestions.filter((q) => q.moduleId === mod.id);
        let modTried = 0;
        let modCorrect = 0;
        modQs.forEach((q) => {
          const atts = stats.attempts?.[q.id] || [];
          if (atts.length > 0) {
            modTried += 1;
            const latest = [...atts].sort((a, b) => b.timestamp - a.timestamp)[0];
            if (latest.isCorrect) modCorrect += 1;
          }
        });
        const modAcc = modTried > 0 ? Math.round((modCorrect / modTried) * 100) : 0;
        if (modTried === 0 && weakestModuleAcc > 50) {
          weakestModule = mod;
          weakestModuleAcc = 0;
        } else if (modTried > 0 && modAcc < weakestModuleAcc) {
          weakestModuleAcc = modAcc;
          weakestModule = mod;
        }
      });

      const gradeGap = accuracy - targetGrade;
      const idealShare = 33.3;
      const timeDeficit = Math.max(0, idealShare - timeSharePercent);
      const masteryDeficit = Math.max(0, targetGrade - accuracy);

      // Priority score combines mastery gap toward Target Grade + time imbalance
      const priorityScore = masteryDeficit * 1.25 + timeDeficit * 1.1 + (answeredCount === 0 ? 25 : 0);

      const status: 'Under-Focused' | 'Needs Reinforcement' | 'On Target' | 'Mastered' =
        answeredCount === 0 || (totalSeconds >= 60 && timeSharePercent < 22)
          ? 'Under-Focused'
          : accuracy < targetGrade
          ? 'Needs Reinforcement'
          : accuracy >= Math.min(95, targetGrade + 5)
          ? 'Mastered'
          : 'On Target';

      const shortTitle =
        pId === 1
          ? 'Path 1: Cloud Concepts'
          : pId === 2
          ? 'Path 2: Architecture & Services'
          : 'Path 3: Management & Governance';

      return {
        pathId: pId,
        shortTitle,
        examWeight: path.examWeight,
        seconds,
        timeSharePercent,
        accuracy,
        answeredCount,
        totalQuestions: pathQuestions.length,
        gradeGap,
        weakestModule,
        weakestModuleAcc: weakestModuleAcc === 101 ? 0 : weakestModuleAcc,
        priorityScore,
        status,
      };
    });

    // Compute Equal-Focus Balance Score (100 = 33/33/33 equal time share)
    const maxDeviation =
      totalSeconds === 0
        ? 0
        : paths.reduce((acc, p) => acc + Math.abs(p.timeSharePercent - 33.3), 0);
    const balanceScore =
      totalSeconds === 0 ? 100 : Math.max(10, Math.round(100 - maxDeviation * 0.75));

    const priorityPath = [...paths].sort((a, b) => b.priorityScore - a.priorityScore)[0];
    const allPathsAtTarget = paths.every(
      (p) => p.answeredCount > 0 && p.accuracy >= targetGrade
    );

    return {
      paths,
      totalSeconds,
      balanceScore,
      priorityPath,
      allPathsAtTarget,
    };
  }, [pathStudySeconds, questions, stats.attempts, targetGrade]);

  return (
    <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-r from-white via-sky-50/40 to-amber-50/40 card-elevation overflow-hidden">
      {/* Compact Header Strip */}
      <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#0078D4] to-indigo-700 text-white shadow-2xs shrink-0">
            <Scale className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">
                Equal-Intensity 3-Path Focus &amp; Target Grade Coach
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  analysis.balanceScore >= 80
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : analysis.balanceScore >= 55
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                Time Balance: {analysis.balanceScore}%
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0078D4] text-white">
                Target: {targetGrade}% {targetGrade === 70 ? '(Pass Mark)' : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate">
              {analysis.allPathsAtTarget
                ? `All 3 paths meet your ${targetGrade}% target! Keep equal time intensity across modules.`
                : `Challenge Next: ${analysis.priorityPath.shortTitle} (${analysis.priorityPath.accuracy}% vs ${targetGrade}% target • Weakest: M${analysis.priorityPath.weakestModule.id})`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onFocusPath(
                analysis.priorityPath.pathId,
                analysis.priorityPath.weakestModule.id
              )
            }
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-indigo-700 hover:opacity-95 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            title={`Equalize focus: jump straight into weakest module in ${analysis.priorityPath.shortTitle}`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Challenge P{analysis.priorityPath.pathId} (M
              {analysis.priorityPath.weakestModule.id})
            </span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide Coach' : 'Balance & Goal'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Equal-Intensity 3-Path Grid & Target Grade Setter */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-200/80 space-y-4 bg-white/75 animate-in fade-in duration-150">
          {/* Target Grade Selector Bar */}
          <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Award className="w-4 h-4" />
                <span>Your Targeted Exam Mastery Grade: {targetGrade}%</span>
              </div>
              <p className="text-[11px] text-slate-300">
                70% is the official AZ-900 minimum pass mark. Raise your target to challenge weaknesses into strengths across all 3 paths equally.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {[
                { val: 70, label: '70% Pass' },
                { val: 80, label: '80% Solid' },
                { val: 85, label: '85% Strong' },
                { val: 90, label: '90% Mastery' },
                { val: 95, label: '95% Elite' },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleSetTargetGrade(preset.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                    targetGrade === preset.val
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-2xs'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/15'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <input
                type="range"
                min={70}
                max={100}
                step={5}
                value={targetGrade}
                onChange={(e) => handleSetTargetGrade(Number(e.target.value))}
                aria-label="Custom target mastery grade percentage"
                className="w-20 accent-amber-400 cursor-pointer ml-1"
              />
            </div>
          </div>

          {/* 3-Path Intensity & Time-Balance Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis.paths.map((item) => {
              const isSelected = selectedPathId === item.pathId;
              const isPriority = analysis.priorityPath.pathId === item.pathId;
              const meetsTarget = item.answeredCount > 0 && item.accuracy >= targetGrade;

              return (
                <div
                  key={item.pathId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isPriority && !meetsTarget
                      ? 'bg-amber-50/75 border-amber-300 ring-1 ring-amber-400/40'
                      : isSelected
                      ? 'bg-sky-50/70 border-[#0078D4]'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4]">
                          {item.examWeight} Exam Weight
                        </span>
                        <h4 className="text-xs font-black text-slate-900 mt-0.5">
                          {item.shortTitle}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-black border shrink-0 ${
                          item.status === 'Mastered' || item.status === 'On Target'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.status === 'Under-Focused'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Time Intensity Share vs 33.3% Equal Focus */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#0078D4]" />
                          <span>Time Invested: {formatDurationCompact(item.seconds)}</span>
                        </span>
                        <span className="font-black text-slate-800 tabular-nums">
                          {item.timeSharePercent}% / 33% ideal
                        </span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.timeSharePercent >= 28
                              ? 'bg-[#0078D4]'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, item.timeSharePercent)}%` }}
                        />
                        {/* 33% Equal Focus Marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900/70"
                          style={{ left: '33.3%' }}
                          title="33.3% Equal Time Target"
                        />
                      </div>
                    </div>

                    {/* Mastery Accuracy vs Target Grade */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-600" />
                          <span>
                            Mastery ({item.answeredCount}/{item.totalQuestions} Qs):
                          </span>
                        </span>
                        <span
                          className={`font-black tabular-nums ${
                            meetsTarget ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.accuracy}% ({item.gradeGap >= 0 ? `+${item.gradeGap}%` : `${item.gradeGap}%`})
                        </span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            meetsTarget ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, item.accuracy)}%` }}
                        />
                        {/* User Target Grade Marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900"
                          style={{ left: `${targetGrade}%` }}
                          title={`Your Target Grade: ${targetGrade}%`}
                        />
                      </div>
                    </div>

                    {/* Weakest Module Callout */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[10.5px] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-500 block">
                          Weakest Module to Convert:
                        </span>
                        <span className="font-extrabold text-slate-900 truncate block">
                          M{item.weakestModule.id}: {item.weakestModule.title}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-black text-slate-700 shrink-0">
                        {item.weakestModuleAcc}%
                      </span>
                    </div>
                  </div>

                  {/* Direct Focus Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onFocusPath(item.pathId)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>Focus P{item.pathId}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onFocusPath(item.pathId, item.weakestModule.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      {meetsTarget ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-300" />
                      )}
                      <span>Drill M{item.weakestModule.id}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
