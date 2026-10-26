import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  ArrowRight,
  Flame,
  Zap,
  Calendar,
  Clock,
  Filter,
  Coffee,
  ChevronRight,
  Download,
  RotateCcw,
  Layers,
  LayoutGrid,
  Minimize2,
  Maximize2,
  Cloud,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { calculateDomainConfidence } from '../utils/storage';
import { KitengeRibbon } from './MotifDecorations';
import { DailyConsistencyChart } from './DailyConsistencyChart';
import { ExamReadinessGauge } from './ExamReadinessGauge';
import { WeaknessHeatmap } from './WeaknessHeatmap';
import { BadgeSystem } from './BadgeSystem';
import { ResetModuleModal } from './ResetModuleModal';
import { DomainConfidenceRadar } from './DomainConfidenceRadar';
import { TopMissedServicesTable } from './TopMissedServicesTable';
import { StudyPrepMotivationToolkit } from './StudyPrepMotivationToolkit';
import { DailyAccuracyTrajectoryChart } from './DailyAccuracyTrajectoryChart';
import { DomainAccuracyHeatmapD3 } from './DomainAccuracyHeatmapD3';

interface DomainConfidenceProps {
  stats: UserStats;
  onDrillWeakAreas: (moduleIds: number[]) => void;
  onSelectModule: (moduleId: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
  onOpenStudyBreak?: () => void;
  onOpenExport?: () => void;
  onResetModuleConfidence?: (moduleId: number) => void;
}

type RadarWindowTab = 'radar' | 'heatmap' | 'modules' | 'confidence' | 'actions';
type AnalyticsSectionFilter = 'all' | 'charts' | 'gaps' | 'toolkit';

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

  // Compact Radar Menus Window state
  const [isWindowExpanded, setIsWindowExpanded] = useState<boolean>(true);
  const [activeWindowTab, setActiveWindowTab] = useState<RadarWindowTab>('radar');
  const [selectedPathFilter, setSelectedPathFilter] = useState<1 | 2 | 3 | 'all'>('all');
  const [sectionFilter, setSectionFilter] = useState<AnalyticsSectionFilter>('all');

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

  const visiblePaths = useMemo(() => {
    if (selectedPathFilter === 'all') return LEARNING_PATHS;
    return LEARNING_PATHS.filter((p) => p.id === selectedPathFilter);
  }, [selectedPathFilter]);

  // Aggregate user confidence scoring across paths and modules (1-5 scale)
  const confidenceSummary = useMemo(() => {
    const questionScores = stats.confidenceScores || {};
    const moduleScores = stats.moduleConfidenceScores || {};

    const pathData: Record<1 | 2 | 3, { total: number; count: number; lowCount: number }> = {
      1: { total: 0, count: 0, lowCount: 0 },
      2: { total: 0, count: 0, lowCount: 0 },
      3: { total: 0, count: 0, lowCount: 0 },
    };

    const moduleData: Record<number, { total: number; count: number; manualRating?: number }> = {};
    LEARNING_PATHS.forEach((p) => {
      p.modules.forEach((m) => {
        moduleData[m.id] = { total: 0, count: 0, manualRating: moduleScores[m.id] };
      });
    });

    let overallSum = 0;
    let overallRatingsCount = 0;

    Object.entries(questionScores).forEach(([qId, score]) => {
      const atts = stats.attempts?.[qId] || [];
      const mId = atts[0]?.moduleId;
      const pId = atts[0]?.pathId;

      if (pId && (pId === 1 || pId === 2 || pId === 3)) {
        pathData[pId].total += score;
        pathData[pId].count += 1;
        if (score <= 2) pathData[pId].lowCount += 1;
      }
      if (mId && moduleData[mId]) {
        moduleData[mId].total += score;
        moduleData[mId].count += 1;
      }

      overallSum += score;
      overallRatingsCount += 1;
    });

    // Merge manual module ratings
    Object.entries(moduleScores).forEach(([mIdStr, score]) => {
      const mId = parseInt(mIdStr, 10);
      const foundPath = LEARNING_PATHS.find((p) => p.modules.some((m) => m.id === mId));
      if (foundPath && (foundPath.id === 1 || foundPath.id === 2 || foundPath.id === 3)) {
        if (moduleData[mId] && moduleData[mId].count === 0) {
          pathData[foundPath.id].total += score;
          pathData[foundPath.id].count += 1;
          if (score <= 2) pathData[foundPath.id].lowCount += 1;
          overallSum += score;
          overallRatingsCount += 1;
        }
      }
    });

    // Detect high risk areas (low confidence <= 2 or mistakes with low confidence)
    const highRiskModuleIds: number[] = [];
    LEARNING_PATHS.forEach((p) => {
      p.modules.forEach((m) => {
        const md = moduleData[m.id];
        const manual = md?.manualRating;
        const avg = md && md.count > 0 ? md.total / md.count : manual || 0;
        if ((avg > 0 && avg <= 2.5) || manual === 1 || manual === 2) {
          highRiskModuleIds.push(m.id);
        }
      });
    });

    return {
      pathData,
      moduleData,
      overallAvg: overallRatingsCount > 0 ? (overallSum / overallRatingsCount).toFixed(1) : null,
      totalRatings: overallRatingsCount,
      highRiskModuleIds,
    };
  }, [stats.confidenceScores, stats.moduleConfidenceScores, stats.attempts]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* =====================================================================
          AZ-900 DOMAIN CONFIDENCE RADAR MENUS WINDOW
          Functionally compact & CSS-responsive across Mobile, Tablet & Laptop
         ===================================================================== */}
      <section
        aria-label="AZ-900 Domain Confidence Radar Menus Window"
        className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
      >
        <KitengeRibbon height={3} />

        {/* 1. COMPACT WINDOW TITLE BAR */}
        <div className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-wrap items-center justify-between gap-2">
          {/* Left: Window Icon, Title & Live Rating Badges */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-300/40 flex items-center justify-center text-sky-300 shrink-0 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-black text-xs sm:text-sm tracking-tight text-white truncate">
                  AZ-900 Domain Confidence Radar
                </h2>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: overallConfidence.color }}
                >
                  {overallConfidence.rating}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 shrink-0">
                  {scaledScore}/1000 pts
                </span>
              </div>
            </div>
          </div>

          {/* Right: 3 Interactive Menu Tabs + 7D/30D Switcher + Compact/Expand Toggle */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap ml-auto">
            {/* Functional Menu Tabs inside Radar Window */}
            <div
              className="flex flex-wrap items-center bg-slate-950/45 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold gap-0.5"
              role="tablist"
              aria-label="Domain Confidence Radar Window Modes"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeWindowTab === 'radar'}
                onClick={() => {
                  setActiveWindowTab('radar');
                  if (!isWindowExpanded) setIsWindowExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeWindowTab === 'radar' && isWindowExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span>Radar</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeWindowTab === 'heatmap'}
                onClick={() => {
                  setActiveWindowTab('heatmap');
                  if (!isWindowExpanded) setIsWindowExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeWindowTab === 'heatmap' && isWindowExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <Target className="w-3 h-3 shrink-0 text-amber-300" />
                <span>D3 Heatmap</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeWindowTab === 'modules'}
                onClick={() => {
                  setActiveWindowTab('modules');
                  if (!isWindowExpanded) setIsWindowExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeWindowTab === 'modules' && isWindowExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>Domains (12)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeWindowTab === 'confidence'}
                onClick={() => {
                  setActiveWindowTab('confidence');
                  if (!isWindowExpanded) setIsWindowExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeWindowTab === 'confidence' && isWindowExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <Award className="w-3 h-3 shrink-0 text-amber-300" />
                <span>Confidence (1-5)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeWindowTab === 'actions'}
                onClick={() => {
                  setActiveWindowTab('actions');
                  if (!isWindowExpanded) setIsWindowExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeWindowTab === 'actions' && isWindowExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3 shrink-0" />
                <span>Tools</span>
              </button>
            </div>

            {/* Compact 7D / 30D Time Range Switcher */}
            <div className="flex items-center bg-slate-950/45 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  timeRange === '7d'
                    ? 'bg-sky-500 text-slate-950 font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
                title="Last 7 Days Sprint Window"
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>7D</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30d')}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  timeRange === '30d'
                    ? 'bg-sky-500 text-slate-950 font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
                title="Last 30 Days Long-Term Mastery Window"
              >
                <Calendar className="w-3 h-3 shrink-0" />
                <span>30D</span>
              </button>
            </div>

            {/* Compact / Expand Window Toggle */}
            <button
              type="button"
              onClick={() => setIsWindowExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-bold transition-colors cursor-pointer"
              aria-expanded={isWindowExpanded}
              title={
                isWindowExpanded
                  ? 'Minimize Domain Confidence Radar window'
                  : 'Expand Domain Confidence Radar window'
              }
            >
              {isWindowExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3 text-sky-200" />
                  <span>Compact</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-sky-200" />
                  <span>Expand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. ALWAYS-ON COMPACT KPI & QUICK ACTIONS RIBBON */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50/95 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
          {/* Compact 4-Metric KPI Strip (2x2 on small mobile, 4-col inline on tablet/laptop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 flex-1">
            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {timeRange === '7d' ? '7D Solved' : '30D Solved'}
              </span>
              <span className="font-black text-xs sm:text-sm text-slate-900">
                {filteredMetrics.totalAnswered}
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Accuracy
              </span>
              <span className="font-black text-xs sm:text-sm text-[#0078D4]">
                {filteredMetrics.accuracy}%
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Streak
              </span>
              <span className="font-black text-xs sm:text-sm text-amber-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
                <span>{stats.streakDays}d</span>
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Est. Score
              </span>
              <span
                className={`font-black text-xs sm:text-sm ${
                  scaledScore >= 700 ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {scaledScore}/1000
              </span>
            </div>
          </div>

          {/* Right Quick Action Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0 scrollbar-thin">
            {weakestModule && onLaunchMicroDrill && (
              <button
                type="button"
                onClick={() => onLaunchMicroDrill(weakestModule.id)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-[11px] whitespace-nowrap flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                <span>Micro-Quiz (M{weakestModule.id})</span>
              </button>
            )}

            {onOpenStudyBreak && (
              <button
                type="button"
                onClick={onOpenStudyBreak}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
                title="Take a mindful 60-second Kahawa break"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Kahawa ☕</span>
              </button>
            )}

            {onResetModuleConfidence && (
              <button
                type="button"
                onClick={() => setResetModalModuleId(null)}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset progress on a specific module"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Mod</span>
              </button>
            )}

            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
                title="Export Progress Report (PDF / JSON)"
              >
                <Download className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. EXPANDABLE RADAR MENUS WINDOW BODY */}
        {isWindowExpanded && (
          <div className="p-3 sm:p-4 bg-white space-y-3">
            {/* ===============================================================
                WINDOW TAB 1: MULTI-AXIAL RADAR MESH & PASS LADDER
               =============================================================== */}
            {activeWindowTab === 'radar' && (
              <div className="space-y-3">
                {/* Embedded Responsive Radar Mesh & Interactive Axis Drill */}
                <div id="domain-confidence-radar-section">
                  <DomainConfidenceRadar
                    stats={stats}
                    onDrillDomain={onDrillWeakAreas}
                    onSelectModule={onSelectModule}
                    compact
                    embedded
                  />
                </div>

                {/* Compact Responsive Row: Gradual Mastery Ladder + Priority Remediation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  {/* Compact Gradual Mastery Ladder (7 cols on laptop) */}
                  <div className="lg:col-span-7 bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            Gradual Mastery Ladder • 700+ Pass Mark
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {scaledScore >= 700
                              ? '🎉 Certified Ready zone (700+ pts achieved).'
                              : `${pointsToPass} pts needed to reach the 700 passing threshold.`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          scaledScore >= 700
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : scaledScore >= 550
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {scaledScore >= 700
                          ? 'Lv.4 Certified Ready'
                          : scaledScore >= 550
                          ? 'Lv.3 Proficient'
                          : 'Lv.2 Apprentice'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="relative w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div className="w-[40%] h-full bg-slate-300 border-r border-white" />
                        <div className="w-[20%] h-full bg-amber-400 border-r border-white" />
                        <div className="w-[10%] h-full bg-sky-500 border-r-2 border-emerald-700" />
                        <div className="w-[30%] h-full bg-emerald-500" />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 px-0.5">
                        <span>0</span>
                        <span>400</span>
                        <span className="text-[#0078D4]">600</span>
                        <span className="text-emerald-700 font-bold">★ 700 Pass</span>
                        <span>1000</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Priority Weakness Intervention Card (5 cols on laptop) */}
                  <div className="lg:col-span-5 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/60 rounded-xl border border-amber-300/80 p-3 flex flex-col justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                          Priority Intervention
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {weakestModule
                            ? `M${weakestModule.id}: ${weakestModule.title}`
                            : 'All Modules Passing!'}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {weakestModule
                            ? `Current mastery: ${weakestModule.accuracy}% (${weakestModule.total} attempts)`
                            : 'Keep reinforcing with mixed scenario drills.'}
                        </p>
                      </div>
                    </div>

                    {weakestModule && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {onLaunchMicroDrill && (
                          <button
                            type="button"
                            onClick={() => onLaunchMicroDrill(weakestModule.id)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-yellow-200" />
                            <span>3-Q Micro-Quiz</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectModule(weakestModule.id)}
                          className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Practice M{weakestModule.id}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                WINDOW TAB 1B: D3.JS DOMAIN ACCURACY HEATMAP
               =============================================================== */}
            {activeWindowTab === 'heatmap' && (
              <DomainAccuracyHeatmapD3
                stats={stats}
                onSelectModule={(modId) => onSelectModule(modId)}
                onLaunchMicroDrill={onLaunchMicroDrill}
                onDrillWeakAreas={onDrillWeakAreas}
                compact
              />
            )}

            {/* ===============================================================
                WINDOW TAB 2: COMPACT 3-PATH & 12-MODULE CONFIDENCE EXPLORER
               =============================================================== */}
            {activeWindowTab === 'modules' && (
              <div className="space-y-3">
                {/* Path Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setSelectedPathFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] whitespace-nowrap border transition-all cursor-pointer ${
                        selectedPathFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      All 3 Paths (12 Modules)
                    </button>
                    {LEARNING_PATHS.map((p) => {
                      const pm = filteredMetrics.pathMastery[p.id] || { correct: 0, total: 0 };
                      const conf = calculateDomainConfidence(pm.correct, pm.total);
                      const isSel = selectedPathFilter === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPathFilter(p.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSel
                              ? 'bg-[#0078D4] text-white border-[#0078D4]'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>Path {p.id}</span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                              isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {conf.percentage}%
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    Click any module to practice or launch a 3-Q micro-drill
                  </span>
                </div>

                {/* Responsive Path & Module Cards Grid (1 col mobile, 2 cols tablet, 3 cols laptop) */}
                <div
                  className={`grid grid-cols-1 ${
                    visiblePaths.length === 1
                      ? 'md:grid-cols-1'
                      : 'md:grid-cols-2 lg:grid-cols-3'
                  } gap-3`}
                >
                  {visiblePaths.map((path) => {
                    const mastery = filteredMetrics.pathMastery[path.id] || {
                      correct: 0,
                      total: 0,
                    };
                    const conf = calculateDomainConfidence(mastery.correct, mastery.total);

                    return (
                      <div
                        key={path.id}
                        className="bg-slate-50/70 rounded-xl border border-slate-200/90 overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-3 bg-white border-b border-slate-200/70 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-extrabold"
                              style={{
                                backgroundColor: `${path.accentColor}18`,
                                color: path.accentColor,
                              }}
                            >
                              Path {path.id} ({path.examWeight})
                            </span>
                            <span
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${conf.color}20`,
                                color: conf.color,
                              }}
                            >
                              {conf.rating} • {conf.percentage}%
                            </span>
                          </div>

                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">
                            {path.title}
                          </h4>

                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${conf.percentage}%`,
                                backgroundColor: path.accentColor,
                              }}
                            />
                          </div>
                        </div>

                        {/* Compact Module Rows inside Path */}
                        <div className="p-2.5 space-y-1.5">
                          {path.modules.map((m) => {
                            const modStat = filteredMetrics.moduleMastery[m.id] || {
                              correct: 0,
                              total: 0,
                            };
                            const modPct =
                              modStat.total > 0
                                ? Math.round((modStat.correct / modStat.total) * 100)
                                : 0;

                            return (
                              <div
                                key={m.id}
                                onClick={() => onSelectModule(m.id)}
                                className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200/80 hover:border-[#0078D4] hover:bg-blue-50/30 cursor-pointer transition-colors"
                              >
                                <span className="font-bold text-slate-800 truncate pr-2">
                                  M{m.id}: {m.title}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span
                                    className={`font-black text-[11px] px-1.5 py-0.2 rounded ${
                                      modPct >= 70
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : modStat.total === 0
                                        ? 'bg-slate-100 text-slate-400'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {modStat.total > 0 ? `${modPct}%` : 'New'}
                                  </span>

                                  {onLaunchMicroDrill && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onLaunchMicroDrill(m.id);
                                      }}
                                      className="p-1 rounded text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                      title={`3-Q Micro-Drill on M${m.id}`}
                                    >
                                      <Zap className="w-3 h-3 fill-amber-400" />
                                    </button>
                                  )}

                                  {onResetModuleConfidence && modStat.total > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setResetModalModuleId(m.id);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
            )}

            {/* ===============================================================
                WINDOW TAB: USER CONFIDENCE SCORING SUMMARY (1-5 SCALE)
               =============================================================== */}
            {activeWindowTab === 'confidence' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Header & Overall Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-[#0B2545] to-[#134074] text-white">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                        Self-Efficacy Engine
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        User Confidence Scoring Summary (1–5 Scale)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Evaluates subjective confidence against objective accuracy across all 3 AZ-900 Learning Paths
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-center">
                      <span className="text-[9px] font-bold uppercase text-sky-200 block">Overall Confidence</span>
                      <span className="font-mono text-base font-black text-amber-300">
                        {confidenceSummary.overallAvg ? `${confidenceSummary.overallAvg} / 5.0` : 'Not Yet Rated'}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-center">
                      <span className="text-[9px] font-bold uppercase text-sky-200 block">Rated Questions</span>
                      <span className="font-mono text-base font-black text-white">
                        {confidenceSummary.totalRatings}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Learning Paths Confidence Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LEARNING_PATHS.map((path) => {
                    const pData = confidenceSummary.pathData[path.id];
                    const avg = pData.count > 0 ? (pData.total / pData.count).toFixed(1) : null;
                    const numAvg = avg ? parseFloat(avg) : 0;
                    const statusConfig =
                      avg === null
                        ? { label: 'Unrated', color: 'bg-slate-100 text-slate-600 border-slate-200' }
                        : numAvg >= 4.0
                        ? { label: 'High Confidence', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
                        : numAvg >= 3.0
                        ? { label: 'Moderate', color: 'bg-amber-100 text-amber-900 border-amber-300' }
                        : { label: 'Needs Practice', color: 'bg-rose-100 text-rose-900 border-rose-300' };

                    return (
                      <div
                        key={path.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                              style={{ backgroundColor: `${path.accentColor}18`, color: path.accentColor }}
                            >
                              Path {path.id} ({path.examWeight})
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                            {path.title}
                          </h5>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600">Avg Confidence:</span>
                          <span className="font-mono text-sm font-black text-slate-900">
                            {avg ? `${avg} / 5.0` : '—'}
                          </span>
                        </div>

                        {pData.lowCount > 0 && (
                          <div className="text-[10px] text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>{pData.lowCount} questions flagged low confidence (≤2)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* High-Risk Areas & Practice Recommendations */}
                {confidenceSummary.highRiskModuleIds.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black text-rose-900 uppercase tracking-wide">
                          High-Risk Modules Identified (Low Confidence Score)
                        </div>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Target these modules where self-confidence is lowest to eliminate exam surprise:
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {confidenceSummary.highRiskModuleIds.map((mId) => (
                        <button
                          key={mId}
                          type="button"
                          onClick={() => onSelectModule(mId)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[11px] shadow-2xs transition-colors cursor-pointer"
                        >
                          Practice Module {mId} →
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Module-by-Module Confidence Breakdown Table (12 Modules) */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                  <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Module-by-Module Confidence &amp; Accuracy Matrix
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      All 12 AZ-900 Modules
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {LEARNING_PATHS.flatMap((p) => p.modules).map((m) => {
                      const mData = confidenceSummary.moduleData[m.id];
                      const avg = mData && mData.count > 0 ? (mData.total / mData.count).toFixed(1) : mData?.manualRating?.toFixed(1) || null;
                      const numAvg = avg ? parseFloat(avg) : 0;
                      const modStat = filteredMetrics.moduleMastery[m.id] || { correct: 0, total: 0 };
                      const acc = modStat.total > 0 ? Math.round((modStat.correct / modStat.total) * 100) : null;

                      return (
                        <div
                          key={m.id}
                          className="px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              M{m.id}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {m.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase block">Confidence</span>
                              <span
                                className={`font-mono font-black text-xs ${
                                  avg === null
                                    ? 'text-slate-400'
                                    : numAvg >= 4.0
                                    ? 'text-emerald-700'
                                    : numAvg >= 3.0
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {avg ? `${avg} / 5` : '—'}
                              </span>
                            </div>

                            <div className="text-right hidden sm:block">
                              <span className="text-[10px] text-slate-400 uppercase block">Accuracy</span>
                              <span className="font-mono font-bold text-xs text-slate-700">
                                {acc !== null ? `${acc}%` : 'New'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onSelectModule(m.id)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-[#0078D4] hover:text-white text-[#0078D4] border border-sky-200 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Practice
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                WINDOW TAB 3: ANALYTICS SECTION FILTER & STUDIO TOOLS MENU
               =============================================================== */}
            {activeWindowTab === 'actions' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-slate-800">
                    Filter Analytics Workspace Sections Below:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Show All Panels' },
                        { id: 'charts', label: 'Trajectory & Consistency Charts' },
                        { id: 'gaps', label: 'Heatmaps & Missed Services' },
                        { id: 'toolkit', label: 'Study Toolkit & Badges' },
                      ] as const
                    ).map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSectionFilter(sec.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          sectionFilter === sec.id
                            ? 'bg-[#0078D4] text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact 4-Column Quick Tools Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onDrillWeakAreas(
                        weakModules.length > 0 ? weakModules.map((w) => w.id) : [1, 4, 8]
                      )
                    }
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-700 text-white text-left flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">Drill Weak Areas</div>
                      <div className="text-[10px] text-sky-100 truncate">
                        {weakModules.length} modules &lt;70%
                      </div>
                    </div>
                  </button>

                  {weakestModule && onLaunchMicroDrill && (
                    <button
                      type="button"
                      onClick={() => onLaunchMicroDrill(weakestModule.id)}
                      className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-slate-900 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs truncate">
                          3-Q Micro-Drill
                        </div>
                        <div className="text-[10px] text-amber-900 truncate">
                          Target M{weakestModule.id}
                        </div>
                      </div>
                    </button>
                  )}

                  {onResetModuleConfidence && (
                    <button
                      type="button"
                      onClick={() => setResetModalModuleId(null)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-slate-900 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs truncate">
                          Reset Confidence
                        </div>
                        <div className="text-[10px] text-rose-800 truncate">
                          Scoped module reset
                        </div>
                      </div>
                    </button>
                  )}

                  {onOpenExport && (
                    <button
                      type="button"
                      onClick={onOpenExport}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#0078D4] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs truncate">Export Report</div>
                        <div className="text-[10px] text-slate-600 truncate">
                          Save PDF / JSON
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================================
          D3.JS DOMAIN ACCURACY HEATMAP (Always Prominent in Analytics & Gaps)
         ===================================================================== */}
      {(sectionFilter === 'all' || sectionFilter === 'gaps' || sectionFilter === 'charts') && (
        <DomainAccuracyHeatmapD3
          stats={stats}
          onSelectModule={(modId) => onSelectModule(modId)}
          onLaunchMicroDrill={onLaunchMicroDrill}
          onDrillWeakAreas={onDrillWeakAreas}
        />
      )}

      {/* =====================================================================
          SUPPORTING ANALYTICS PANELS (Filtered by Section Filter)
         ===================================================================== */}
      {(sectionFilter === 'all' || sectionFilter === 'charts') && (
        <>
          {/* Exam Readiness Gauge */}
          <ExamReadinessGauge
            moduleMastery={filteredMetrics.moduleMastery}
            pathMastery={filteredMetrics.pathMastery}
            totalAnswered={filteredMetrics.totalAnswered}
          />

          {/* 30-Day Daily Accuracy Percentage Line Chart (Recharts) */}
          <DailyAccuracyTrajectoryChart stats={stats} />

          {/* Daily Consistency Bar Chart (Recharts) with Hover Tooltips */}
          <DailyConsistencyChart stats={stats} />
        </>
      )}

      {(sectionFilter === 'all' || sectionFilter === 'gaps') && (
        <>
          {/* Detailed Table: Top 5 Most Frequently Missed Azure Services */}
          <TopMissedServicesTable
            stats={stats}
            onSelectModule={onSelectModule}
            onLaunchMicroDrill={onLaunchMicroDrill}
          />

          {/* Curriculum Weakness Heatmap & Azure Services Knowledge Gap Heatmap */}
          <WeaknessHeatmap
            moduleMastery={filteredMetrics.moduleMastery}
            onSelectModule={onSelectModule}
            onLaunchMicroDrill={onLaunchMicroDrill}
            stats={stats}
          />
        </>
      )}

      {(sectionFilter === 'all' || sectionFilter === 'toolkit') && (
        <>
          {/* Student Exam Prep & Motivation Hub: Paper Note-Taking, WhatsApp Reminders & Prep Rituals */}
          <StudyPrepMotivationToolkit stats={stats} />

          {/* Azure Milestone & Harambee Badge System */}
          <BadgeSystem
            stats={stats}
            onExplorePractice={() => onSelectModule(weakestModule?.id || 1)}
          />
        </>
      )}

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
