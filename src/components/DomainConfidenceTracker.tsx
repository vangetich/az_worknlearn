import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Flame,
  Zap,
  Calendar,
  Clock,
  Filter,
  Coffee,
  Sparkles,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Download,
  RotateCcw,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { calculateDomainConfidence } from '../utils/storage';
import { MaasaiMedallion } from './MotifDecorations';
import { DailyConsistencyChart } from './DailyConsistencyChart';
import { ExamReadinessGauge } from './ExamReadinessGauge';
import { WeaknessHeatmap } from './WeaknessHeatmap';
import { BadgeSystem } from './BadgeSystem';
import { ResetModuleModal } from './ResetModuleModal';

interface DomainConfidenceProps {
  stats: UserStats;
  onDrillWeakAreas: (moduleIds: number[]) => void;
  onSelectModule: (moduleId: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
  onOpenStudyBreak?: () => void;
  onOpenExport?: () => void;
  onResetModuleConfidence?: (moduleId: number) => void;
}

export const DomainConfidenceTracker: React.FC<DomainConfidenceProps> = ({
  stats,
  onDrillWeakAreas,
  onSelectModule,
  onLaunchMicroDrill,
  onOpenStudyBreak,
  onOpenExport,
  onResetModuleConfidence,
}) => {
  // Toggle between 'Last 7 Days' and 'Last 30 Days'
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [resetModalModuleId, setResetModalModuleId] = useState<number | null | false>(false);

  // Compute confidence metrics filtered by the selected time range
  const filteredMetrics = useMemo(() => {
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    let totalAnswered = 0;
    let totalCorrect = 0;
    const moduleMastery: Record<number, { correct: number; total: number }> = {};
    const pathMastery: Record<number, { correct: number; total: number }> = {
      1: { correct: 0, total: 0 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 },
    };

    let attemptsCountInWindow = 0;

    Object.values(stats.attempts || {}).forEach((attemptList) => {
      attemptList.forEach((att) => {
        if (att.timestamp >= cutoff) {
          attemptsCountInWindow += 1;
          totalAnswered += 1;
          if (att.isCorrect) totalCorrect += 1;

          // Module mastery
          if (!moduleMastery[att.moduleId]) {
            moduleMastery[att.moduleId] = { correct: 0, total: 0 };
          }
          moduleMastery[att.moduleId].total += 1;
          if (att.isCorrect) moduleMastery[att.moduleId].correct += 1;

          // Path mastery
          if (!pathMastery[att.pathId]) {
            pathMastery[att.pathId] = { correct: 0, total: 0 };
          }
          pathMastery[att.pathId].total += 1;
          if (att.isCorrect) pathMastery[att.pathId].correct += 1;
        }
      });
    });

    if (attemptsCountInWindow > 0) {
      const accuracy = Math.round((totalCorrect / totalAnswered) * 100);
      return {
        totalAnswered,
        totalCorrect,
        accuracy,
        moduleMastery,
        pathMastery,
        hasDataInPeriod: true,
      };
    }

    // Default fallback to overall stats if no attempts in current window
    const overallAccuracy =
      stats.totalAnswered > 0
        ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
        : 0;

    return {
      totalAnswered: stats.totalAnswered,
      totalCorrect: stats.totalCorrect,
      accuracy: overallAccuracy,
      moduleMastery: stats.moduleMastery,
      pathMastery: stats.pathMastery,
      hasDataInPeriod: false,
    };
  }, [stats, timeRange]);

  // Identify weak modules (< 70% accuracy or unattempted)
  const weakModules: { id: number; title: string; accuracy: number; total: number }[] = [];
  const strongModules: { id: number; title: string; accuracy: number }[] = [];

  LEARNING_PATHS.forEach((path) => {
    path.modules.forEach((mod) => {
      const mastery = filteredMetrics.moduleMastery[mod.id] || { correct: 0, total: 0 };
      const pct = mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;
      if (pct < 70 || mastery.total === 0) {
        weakModules.push({ id: mod.id, title: mod.title, accuracy: pct, total: mastery.total });
      } else {
        strongModules.push({ id: mod.id, title: mod.title, accuracy: pct });
      }
    });
  });

  const overallConfidence = calculateDomainConfidence(
    filteredMetrics.totalCorrect,
    filteredMetrics.totalAnswered
  );

  // Scaled score out of 1000 for Microsoft Pass Mark tracking (700 required)
  const scaledScore =
    filteredMetrics.totalAnswered > 0
      ? Math.round((filteredMetrics.totalCorrect / filteredMetrics.totalAnswered) * 1000)
      : 0;

  const pointsToPass = Math.max(0, 700 - scaledScore);

  // Pick the single weakest module for rapid micro-drill
  const weakestModule = weakModules.length > 0 ? weakModules[0] : null;

  return (
    <div className="space-y-6">
      {/* Hero Overview Card with Time Range Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white shadow-sm shrink-0">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  AZ-900 Domain Confidence Radar
                </h2>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: overallConfidence.color }}
                >
                  {overallConfidence.rating}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Continuous performance modeling based on your scenario quiz answers across all 3 official Azure Curriculum paths.
              </p>
            </div>
          </div>

          {/* Time Filter Toggle + Breather Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Minimalist 7 Days / 30 Days Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '7d'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Last 7 Days</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('30d')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '30d'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Last 30 Days</span>
              </button>
            </div>

            {/* Mindful Breather Button */}
            {onOpenStudyBreak && (
              <button
                onClick={onOpenStudyBreak}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Take a mindful 60-second Kahawa break"
              >
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Kahawa Break ☕</span>
              </button>
            )}

            {/* Reset Module Confidence Button */}
            {onResetModuleConfidence && (
              <button
                type="button"
                onClick={() => setResetModalModuleId(null)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Reset progress on a specific module without clearing other data"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset Module Confidence</span>
              </button>
            )}

            {/* Export Progress Report Button */}
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Export Progress Report (PDF / JSON)"
              >
                <Download className="w-4 h-4 text-[#0078D4]" />
                <span>Export Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Time Period Subtitle Note */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Filter className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>
              Confidence Window: <strong className="text-slate-700">{timeRange === '7d' ? 'Last 7 Days (Sprint Focus)' : 'Last 30 Days (Long-Term Mastery Trend)'}</strong>
            </span>
          </span>
          {!filteredMetrics.hasDataInPeriod && stats.totalAnswered > 0 && (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
              Displaying all-time benchmark data
            </span>
          )}
        </div>

        {/* Global Stats Grid for Selected Period */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              {timeRange === '7d' ? '7-Day Solved' : '30-Day Solved'}
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {filteredMetrics.totalAnswered}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              Period Accuracy
            </span>
            <span className="text-2xl font-black text-[#0078D4] mt-1 block">
              {filteredMetrics.accuracy}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              Daily Streak
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-1.5">
              <Flame className="w-5 h-5 fill-amber-500" />
              <span>{stats.streakDays} Days</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              Estimated Score
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {scaledScore} / 1000
            </span>
          </div>
        </div>
      </div>

      {/* Exam Readiness Gauge (Average Domain Confidence across all 12 modules) */}
      <ExamReadinessGauge
        moduleMastery={filteredMetrics.moduleMastery}
        pathMastery={filteredMetrics.pathMastery}
        totalAnswered={filteredMetrics.totalAnswered}
      />

      {/* Daily Consistency Bar Chart (Recharts) with Azure Blue #0078D4 Bars */}
      <DailyConsistencyChart stats={stats} />

      {/* ADAPTIVE GRADUAL MASTERY LADDER (Progress to 700 Pass Mark) */}
      <div className="bg-white rounded-xl border border-slate-200 card-elevation p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Gradual Mastery Ladder • Path to 700+ Pass Mark
              </h3>
              <p className="text-xs text-slate-500">
                {scaledScore >= 700
                  ? '🎉 Outstanding! You are in the Certified Ready zone (700+ pts).'
                  : `You need ${pointsToPass} more points to reach the official 700 passing benchmark.`}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-center ${
              scaledScore >= 700
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : scaledScore >= 550
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {scaledScore >= 700 ? 'Level 4: Exam Certified Ready' : scaledScore >= 550 ? 'Level 3: Proficient' : 'Level 2: Apprentice'}
          </span>
        </div>

        {/* 4-Tier Visual Ladder Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
            {/* 0 - 400 Foundations */}
            <div className="w-[40%] h-full bg-slate-300 border-r border-white" title="Foundations (0-400)" />
            {/* 400 - 600 Apprentice */}
            <div className="w-[20%] h-full bg-amber-400 border-r border-white" title="Apprentice (400-600)" />
            {/* 600 - 700 Proficient */}
            <div className="w-[10%] h-full bg-sky-500 border-r-2 border-emerald-700" title="Proficient (600-700)" />
            {/* 700 - 1000 Certified Pass */}
            <div className="w-[30%] h-full bg-emerald-500" title="Exam Pass Zone (700-1000)" />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-500 px-1">
            <span>0</span>
            <span>400 (Apprentice)</span>
            <span className="text-[#0078D4]">600 (Proficient)</span>
            <span className="text-emerald-700 font-bold">★ 700 (Pass Mark)</span>
            <span>1000</span>
          </div>
        </div>
      </div>

      {/* INNOVATIVE WEAKNESS REMEDIATION & MICRO-DRILL HUB */}
      {weakestModule && (
        <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50/50 rounded-xl border border-amber-300/80 card-elevation p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">
                  Targeted Weakness Remediation (Early Intervention)
                </span>
                <h4 className="font-extrabold text-base text-slate-900 mt-0.5">
                  Priority Area: M{weakestModule.id} – {weakestModule.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  Current mastery: <strong className="text-amber-800">{weakestModule.accuracy}%</strong> ({weakestModule.total} attempts). Practicing bite-sized micro-drills prevents study fatigue while steadily converting weak areas into strengths.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              {onLaunchMicroDrill && (
                <button
                  onClick={() => onLaunchMicroDrill(weakestModule.id)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all"
                >
                  <Zap className="w-4 h-4 text-yellow-200" />
                  <span>3-Question Micro-Quiz</span>
                </button>
              )}

              <button
                onClick={() => onSelectModule(weakestModule.id)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors"
              >
                Explore Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Weakness Heatmap (12-Module Color-Coded Performance Map) */}
      <WeaknessHeatmap
        moduleMastery={filteredMetrics.moduleMastery}
        onSelectModule={onSelectModule}
        onLaunchMicroDrill={onLaunchMicroDrill}
      />


      {/* Azure Milestone & Harambee Badge System */}
      <BadgeSystem
        stats={stats}
        onExplorePractice={() => onSelectModule(weakestModule?.id || 1)}
      />

      {/* 3 Learning Paths Detailed Breakdown for Selected Period */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Official Domain Confidence Ratings</span>
            <span className="text-xs font-normal text-slate-500 lowercase">
              ({timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEARNING_PATHS.map((path) => {
            const mastery = filteredMetrics.pathMastery[path.id] || { correct: 0, total: 0 };
            const conf = calculateDomainConfidence(mastery.correct, mastery.total);

            return (
              <div
                key={path.id}
                className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: `${path.accentColor}18`,
                        color: path.accentColor,
                      }}
                    >
                      Path {path.id} ({path.examWeight})
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${conf.color}20`,
                        color: conf.color,
                      }}
                    >
                      {conf.rating}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 mb-2">
                    {path.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {path.summary}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Domain Mastery</span>
                      <span className="text-slate-900 font-bold">{conf.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${conf.percentage}%`,
                          backgroundColor: path.accentColor,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {mastery.correct} of {mastery.total} questions answered correctly
                    </span>
                  </div>
                </div>

                {/* Modules list inside path */}
                <div className="bg-slate-50/70 p-4 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Curriculum Modules:
                  </span>
                  {path.modules.map((m) => {
                    const modStat = filteredMetrics.moduleMastery[m.id] || { correct: 0, total: 0 };
                    const modPct =
                      modStat.total > 0
                        ? Math.round((modStat.correct / modStat.total) * 100)
                        : 0;

                    return (
                      <div
                        key={m.id}
                        onClick={() => onSelectModule(m.id)}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200/70 hover:border-[#0078D4] hover:bg-blue-50/30 cursor-pointer transition-colors"
                      >
                        <span className="font-medium text-slate-800 truncate pr-2">
                          M{m.id}: {m.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold shrink-0 ${
                              modPct >= 70
                                ? 'text-emerald-600'
                                : modStat.total === 0
                                ? 'text-slate-400'
                                : 'text-amber-600'
                            }`}
                          >
                            {modStat.total > 0 ? `${modPct}%` : 'New'}
                          </span>

                          {onResetModuleConfidence && modStat.total > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResetModalModuleId(m.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title={`Reset M${m.id} confidence`}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}

                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoped Reset Module Confidence Modal */}
      {resetModalModuleId !== false && onResetModuleConfidence && (
        <ResetModuleModal
          stats={stats}
          initialModuleId={resetModalModuleId}
          onReset={(modId) => {
            onResetModuleConfidence(modId);
          }}
          onClose={() => setResetModalModuleId(false)}
        />
      )}
    </div>
  );
};
