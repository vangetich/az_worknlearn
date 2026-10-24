import React, { useState } from 'react';
import {
  BookOpen,
  Cloud,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Target,
  CheckCircle2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats, QuestionAttempt } from '../types/quiz';
import { getUnresolvedMissedQuestionsCount } from '../utils/storage';

interface LearningPathOverviewProps {
  onSelectPath?: (pathId: 1 | 2 | 3 | 'all') => void;
  selectedPathId?: number | 'all';
  selectedModuleId?: number | 'all';
  onSelectModule?: (moduleId: number | 'all', pathId?: 1 | 2 | 3 | 'all') => void;
  stats?: UserStats;
  sessionAttempts?: QuestionAttempt[];
  onFinishSessionAndReviewWeakAreas?: () => void;
  onStartPersonalizedReview?: () => void;
  onToggleModuleComplete?: (moduleId: number) => void;
  filteredQuestionsCount?: number;
  currentQuestionIndex?: number;
}

export const PATH_SUMMARIES = [
  {
    id: 1 as const,
    shortLabel: 'Cloud Concepts',
    title: 'Describe Cloud Concepts',
    weight: '25–30%',
    accentColor: '#D97706', // Warm Ochre
    bgLight: 'bg-amber-50/60',
    borderLight: 'border-amber-200/90',
    textAccent: 'text-amber-800',
    icon: Cloud,
    summary:
      'Covers fundamental cloud models (IaaS, PaaS, SaaS), essential cloud benefits like high availability, scalability, and elasticity, and cloud economics contrasting CapEx with consumption-based OpEx.',
    keyThemes: [
      'Shared Responsibility Model',
      'IaaS vs PaaS vs SaaS',
      'CapEx vs OpEx',
      'Elasticity & High Availability',
    ],
    examTip:
      'If the scenario asks who patches the OS, IaaS = Customer, PaaS/SaaS = Microsoft.',
  },
  {
    id: 2 as const,
    shortLabel: 'Azure Architecture & Services',
    title: 'Describe Azure Architecture & Services',
    weight: '35–40%',
    accentColor: '#0078D4', // Azure Blue
    bgLight: 'bg-blue-50/60',
    borderLight: 'border-blue-200/90',
    textAccent: 'text-[#0078D4]',
    icon: Layers,
    summary:
      'Encompasses Azure global infrastructure hierarchy (geographies, regions, availability zones) and core enterprise services spanning virtual machines, containers, networking, storage access tiers, and Microsoft Entra ID.',
    keyThemes: [
      'Availability Zones & Region Pairs',
      'Virtual Machines vs Containers',
      'Storage Tiers & Redundancy (LRS/GRS)',
      'Microsoft Entra ID & RBAC',
    ],
    examTip:
      'Datacenter isolation in the same region = Availability Zones; 300+ miles apart = Region Pairs.',
  },
  {
    id: 3 as const,
    shortLabel: 'Azure Management & Governance',
    title: 'Describe Azure Management & Governance',
    weight: '30–35%',
    accentColor: '#C2410C', // Safari Terracotta
    bgLight: 'bg-orange-50/60',
    borderLight: 'border-orange-200/90',
    textAccent: 'text-[#C2410C]',
    icon: ShieldCheck,
    summary:
      'Focuses on cost management tools (Pricing vs TCO calculators, budgets, tags), governance mechanisms like Azure Policy, Resource Locks, and Blueprints, alongside monitoring with Azure Monitor and Service Health.',
    keyThemes: [
      'Pricing Calculator vs TCO',
      'Azure Policy vs Resource Locks',
      'Azure Arc & Resource Manager',
      'Service Health & SLAs',
    ],
    examTip:
      'Resource Locks override RBAC permissions; even subscription Owners cannot delete locked resources.',
  },
];

const ALL_CURRICULUM_MODULES = LEARNING_PATHS.flatMap((p) => p.modules);

export const LearningPathOverview: React.FC<LearningPathOverviewProps> = ({
  onSelectPath,
  selectedPathId = 'all',
  selectedModuleId = 'all',
  onSelectModule,
  stats,
  sessionAttempts = [],
  onFinishSessionAndReviewWeakAreas,
  onStartPersonalizedReview,
  onToggleModuleComplete,
  filteredQuestionsCount = 0,
  currentQuestionIndex = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activePathSummary = PATH_SUMMARIES.find((p) => p.id === selectedPathId);
  const activeCurriculumPath = LEARNING_PATHS.find((p) => p.id === selectedPathId);

  const completedModules = stats?.completedModules || [];
  const totalCurriculumModules = ALL_CURRICULUM_MODULES.length; // 12
  const overallCompletedCount = completedModules.filter((id) =>
    ALL_CURRICULUM_MODULES.some((m) => m.id === id)
  ).length;
  const overallCompletionPct =
    totalCurriculumModules > 0
      ? Math.round((overallCompletedCount / totalCurriculumModules) * 100)
      : 0;

  const getPathCompletion = (pathId: 1 | 2 | 3) => {
    const pathObj = LEARNING_PATHS.find((p) => p.id === pathId);
    const total = pathObj ? pathObj.modules.length : 0;
    const completed = pathObj
      ? pathObj.modules.filter((m) => completedModules.includes(m.id)).length
      : 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  };

  const getPathAccuracy = (pathId: 1 | 2 | 3) => {
    const pm = stats?.pathMastery?.[pathId] || { correct: 0, total: 0 };
    const pct = pm.total > 0 ? Math.round((pm.correct / pm.total) * 100) : null;
    return { ...pm, pct };
  };

  const getModuleAccuracy = (moduleId: number) => {
    const mm = stats?.moduleMastery?.[moduleId] || { correct: 0, total: 0 };
    const pct = mm.total > 0 ? Math.round((mm.correct / mm.total) * 100) : null;
    return { ...mm, pct };
  };

  const sessionCorrectCount = sessionAttempts.filter((a) => a.isCorrect).length;
  const sessionAccuracy =
    sessionAttempts.length > 0
      ? Math.round((sessionCorrectCount / sessionAttempts.length) * 100)
      : null;

  const unresolvedMistakesCount = stats
    ? getUnresolvedMissedQuestionsCount(stats)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden transition-all mb-4">
      <KitengeRibbon height={3} />

      {/* =====================================================================
          COMPACT OVERALL CURRICULUM COMPLETION TRACKER BAR
         ===================================================================== */}
      <div className="px-3.5 sm:px-5 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                AZ-900 Curriculum Progress
              </span>
              <span className="text-[11px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded">
                {overallCompletedCount}/{totalCurriculumModules} Modules ({overallCompletionPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & Per-Path Breakdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-mono text-slate-300">
            {([1, 2, 3] as const).map((pid) => {
              const comp = getPathCompletion(pid);
              return (
                <span key={pid} className="inline-flex items-center gap-1">
                  <strong className="text-white">P{pid}:</strong>
                  <span className={comp.pct === 100 ? 'text-emerald-400 font-bold' : ''}>
                    {comp.completed}/{comp.total}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="w-28 sm:w-36 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0078D4] via-sky-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${overallCompletionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE LEARNING PATH NAVIGATION BAR
         ===================================================================== */}
      <div className="px-3.5 sm:px-5 py-3 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 border-b border-slate-200/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-xs shrink-0">
              <BookOpen className="w-4 h-4" />
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={12} />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Learning Path Focus &amp; Module Checklists
              </h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Select a Learning Path below to focus your practice or expand full module checklists
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onStartPersonalizedReview && unresolvedMistakesCount > 0 && (
              <button
                type="button"
                onClick={onStartPersonalizedReview}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                title="Start a Personalized Review Session with only the questions you got wrong and their explanations"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Review Wrong ({unresolvedMistakesCount})</span>
              </button>
            )}

            {onFinishSessionAndReviewWeakAreas && (
              <button
                type="button"
                onClick={onFinishSessionAndReviewWeakAreas}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                title="Analyze session performance across modules and generate a separate practice set for your lowest-scoring weak areas"
              >
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>
                  {sessionAttempts.length > 0
                    ? `Finish (${sessionAttempts.length}) & Weak Areas`
                    : 'Weak-Area Set'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            >
              <span>{isExpanded ? 'Hide Checklists' : 'All Checklists'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Interactive Segmented Selector for the 3 Official AZ-900 Learning Paths + All Paths */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-2"
          role="tablist"
          aria-label="Select AZ-900 Learning Path"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedPathId === 'all'}
            onClick={() => {
              if (onSelectPath) onSelectPath('all');
              if (onSelectModule) onSelectModule('all', 'all');
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              selectedPathId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-80">
                Full Curriculum
              </span>
              <span className="text-[11px] font-mono font-bold">
                {overallCompletionPct}% Done
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm leading-snug">
              All 3 Learning Paths (Modules 1–12)
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-slate-200/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${overallCompletionPct}%` }}
                />
              </div>
              <div className="text-[11px] opacity-80 flex items-center justify-between">
                <span>{overallCompletedCount}/{totalCurriculumModules} modules complete</span>
                <span>
                  {stats && stats.totalAnswered > 0
                    ? `${Math.round((stats.totalCorrect / stats.totalAnswered) * 100)}% score`
                    : 'View all'}
                </span>
              </div>
            </div>
          </button>

          {PATH_SUMMARIES.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPathId === p.id;
            const perf = getPathAccuracy(p.id);
            const comp = getPathCompletion(p.id);

            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  if (onSelectPath) onSelectPath(p.id);
                  if (onSelectModule) onSelectModule('all', p.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-sm ring-2 ring-[#0078D4]/25'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                    <Icon className="w-3.5 h-3.5" />
                    <span>Path {p.id} · {p.weight}</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold opacity-95">
                    {comp.pct}% Complete
                  </span>
                </div>

                <div className="font-extrabold text-xs sm:text-sm leading-snug">
                  {p.shortLabel}
                </div>

                <div className="space-y-1.5">
                  <div
                    className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isSelected ? 'bg-blue-900/50' : 'bg-slate-100'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${comp.pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] flex items-center justify-between opacity-90">
                    <span>
                      {comp.completed}/{comp.total} Modules Done
                    </span>
                    <span className="font-mono font-bold">
                      {perf.pct !== null ? `${perf.pct}% Score` : 'Focus Path →'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          PROMINENT SELECTED LEARNING PATH SPOTLIGHT BANNER
         ===================================================================== */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#0078D4]/8 via-sky-50/70 to-amber-50/50 border-b border-slate-200/80">
        {activePathSummary && activeCurriculumPath ? (
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="p-3 rounded-2xl text-white shadow-sm shrink-0 mt-0.5"
                  style={{ backgroundColor: activePathSummary.accentColor }}
                >
                  <activePathSummary.icon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0078D4]">
                    <span>Active Learning Path Focus</span>
                    <span>·</span>
                    <span>Path {activePathSummary.id} of 3</span>
                    <span>·</span>
                    <span>Exam Weight: {activePathSummary.weight}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {activePathSummary.title} ({activePathSummary.shortLabel})
                  </h2>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    {activePathSummary.summary}
                  </p>
                </div>
              </div>

              {/* Right Metrics & Clear Path Filter */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">
                    Path {activePathSummary.id} Completion
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-700">
                    {getPathCompletion(activePathSummary.id).completed}/
                    {getPathCompletion(activePathSummary.id).total} Modules (
                    {getPathCompletion(activePathSummary.id).pct}%)
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">
                    Path {activePathSummary.id} Mastery
                  </span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {getPathAccuracy(activePathSummary.id).pct !== null
                      ? `${getPathAccuracy(activePathSummary.id).pct}% (${getPathAccuracy(activePathSummary.id).correct}/${getPathAccuracy(activePathSummary.id).total})`
                      : 'Not Yet Tested'}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">
                    Active Question
                  </span>
                  <span className="font-mono font-black text-sm text-[#0078D4]">
                    {filteredQuestionsCount > 0
                      ? `${currentQuestionIndex + 1} of ${filteredQuestionsCount}`
                      : '0 Questions'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectPath) onSelectPath('all');
                    if (onSelectModule) onSelectModule('all', 'all');
                  }}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Show All Paths
                </button>
              </div>
            </div>

            {/* Interactive Module Filter & Completion Checkboxes within the Selected Learning Path */}
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mr-1">
                Path {activePathSummary.id} Modules &amp; Completion:
              </span>

              <button
                type="button"
                onClick={() => onSelectModule && onSelectModule('all', activePathSummary.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  selectedModuleId === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Path {activePathSummary.id} Modules
              </button>

              {activeCurriculumPath.modules.map((mod) => {
                const isModActive = selectedModuleId === mod.id;
                const modPerf = getModuleAccuracy(mod.id);
                const isModCompleted = completedModules.includes(mod.id);

                return (
                  <div
                    key={mod.id}
                    className={`inline-flex items-center rounded-lg border overflow-hidden transition-all ${
                      isModActive
                        ? 'border-[#0078D4] bg-[#0078D4] text-white shadow-2xs'
                        : isModCompleted
                        ? 'border-emerald-300 bg-emerald-50/70 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {onToggleModuleComplete && (
                      <button
                        type="button"
                        onClick={() => onToggleModuleComplete(mod.id)}
                        className={`px-2 py-1.5 border-r flex items-center justify-center transition-colors cursor-pointer ${
                          isModActive
                            ? 'border-blue-400/40 hover:bg-blue-700'
                            : 'border-slate-200 hover:bg-emerald-100'
                        }`}
                        title={
                          isModCompleted
                            ? `Mark Module ${mod.id} as incomplete`
                            : `Mark Module ${mod.id} as complete`
                        }
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isModCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isModActive
                              ? 'border-white/70 bg-transparent'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isModCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectModule && onSelectModule(mod.id, activePathSummary.id)}
                      className="px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className={isModCompleted && !isModActive ? 'line-through decoration-emerald-600/60' : ''}>
                        M{mod.id}: {mod.title}
                      </span>
                      {modPerf.pct !== null && (
                        <span
                          className={`font-mono text-[10px] ${
                            isModActive
                              ? 'text-sky-100'
                              : modPerf.pct < 70
                              ? 'text-rose-600 font-black'
                              : 'text-emerald-700 font-black'
                          }`}
                        >
                          ({modPerf.pct}%)
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#0078D4] text-white shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0078D4]">
                  Active Learning Path Focus · All 3 Official AZ-900 Paths
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Comprehensive Exam Mode: Cloud Concepts, Architecture &amp; Services, and Management &amp; Governance
                </h2>
              </div>
            </div>

            {sessionAttempts.length > 0 && (
              <div className="text-xs text-slate-700 font-semibold flex items-center gap-3">
                <span>
                  Session Score:{' '}
                  <strong className="font-mono text-[#0078D4]">
                    {sessionCorrectCount}/{sessionAttempts.length} ({sessionAccuracy}%)
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable 3-Column Curriculum Reference & Module Completion Checklists */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PATH_SUMMARIES.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPathId === p.id;
              const perf = getPathAccuracy(p.id);
              const comp = getPathCompletion(p.id);
              const pathCurriculum = LEARNING_PATHS.find((lp) => lp.id === p.id);

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-[#0078D4] shadow-md bg-white border-[#0078D4]'
                      : `${p.bgLight} ${p.borderLight} hover:shadow-xs hover:bg-white`
                  }`}
                >
                  <div className="space-y-3">
                    {/* Path Title & Weight */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-2 rounded-xl text-white shadow-2xs"
                          style={{ backgroundColor: p.accentColor }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Path {p.id} · {p.weight} Weight
                          </span>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-snug">
                            {p.title}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-mono font-black shrink-0 ${
                          perf.pct === null
                            ? 'text-slate-400'
                            : perf.pct >= 70
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {perf.pct !== null ? `${perf.pct}% Score` : '—'}
                      </span>
                    </div>

                    {/* Visual Path Completion Progress Bar */}
                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-700">
                          Module Checklist Progress
                        </span>
                        <span
                          className={`font-mono ${
                            comp.pct === 100 ? 'text-emerald-700 font-black' : 'text-[#0078D4]'
                          }`}
                        >
                          {comp.completed}/{comp.total} Completed ({comp.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0078D4] to-emerald-500 transition-all duration-500"
                          style={{ width: `${comp.pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Concise Summary */}
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {p.summary}
                    </p>

                    {/* Interactive Module Checklist & Accuracy */}
                    {pathCurriculum && (
                      <div className="pt-1 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Check Off Completed Modules &amp; Practice:
                        </span>
                        <div className="space-y-1.5">
                          {pathCurriculum.modules.map((m) => {
                            const mPerf = getModuleAccuracy(m.id);
                            const isCompleted = completedModules.includes(m.id);

                            return (
                              <div
                                key={m.id}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 transition-colors ${
                                  isCompleted
                                    ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
                                    : 'bg-white/90 hover:bg-white border-slate-200/80 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleModuleComplete && onToggleModuleComplete(m.id)
                                    }
                                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                                      isCompleted
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'bg-white border-slate-300 hover:border-[#0078D4]'
                                    }`}
                                    aria-label={
                                      isCompleted
                                        ? `Mark Module ${m.id} incomplete`
                                        : `Mark Module ${m.id} complete`
                                    }
                                    title={
                                      isCompleted
                                        ? 'Completed! Click to mark incomplete'
                                        : 'Click to mark module complete'
                                    }
                                  >
                                    {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onSelectPath) onSelectPath(p.id);
                                      if (onSelectModule) onSelectModule(m.id, p.id);
                                    }}
                                    className="font-semibold text-left truncate hover:text-[#0078D4] transition-colors cursor-pointer flex-1"
                                  >
                                    M{m.id}: {m.title}
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isCompleted && (
                                    <span className="text-[10px] font-extrabold text-emerald-700">
                                      Done
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onSelectPath) onSelectPath(p.id);
                                      if (onSelectModule) onSelectModule(m.id, p.id);
                                    }}
                                    className={`font-mono font-bold cursor-pointer ${
                                      mPerf.pct === null
                                        ? 'text-slate-400 hover:text-[#0078D4]'
                                        : mPerf.pct < 70
                                        ? 'text-rose-600'
                                        : 'text-emerald-700'
                                    }`}
                                  >
                                    {mPerf.pct !== null ? `${mPerf.pct}%` : 'Quiz →'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exam Anchor and Filter Button */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <p className="text-[10px] text-slate-500 italic">
                      <strong className="text-slate-700 not-italic">Anchor:</strong> {p.examTip}
                    </p>

                    {onSelectPath && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPath(p.id);
                          if (onSelectModule) onSelectModule('all', p.id);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0078D4] text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        <span>
                          {isSelected ? `Focused on ${p.shortLabel}` : `Focus on ${p.shortLabel}`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
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
