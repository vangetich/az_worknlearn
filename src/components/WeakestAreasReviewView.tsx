import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import confetti from 'canvas-confetti';
import { Question, QuestionAttempt, UserStats } from '../types/quiz';
import {
  analyzeModulePerformance,
  buildWeakestAreasPracticeSet,
  ensureCompleteExplanations,
  ModulePerformanceSummary,
  rankWeakestModules,
} from '../utils/weakAreasAnalyzer';
import { KitengeRibbon, KitengeCardWatermark } from './MotifDecorations';

export interface WeakestAreasReviewViewProps {
  stats: UserStats;
  sessionAttempts: QuestionAttempt[];
  allQuestions: Question[];
  selectedPathId?: 1 | 2 | 3 | 'all';
  sourceLabel?: string;
  onAnswerReviewQuestion: (
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    generatedQuestion?: Question
  ) => void;
  onAddGeneratedQuestionsToBank?: (questions: Question[]) => void;
  onSelectModuleForPractice?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onQuickRetrySessionQuestions?: (questionsToQueue: Question[]) => void;
  onStartPersonalizedReview?: () => void;
  onAskTutorAboutQuestion?: (question: Question, selectedOption?: string | null) => void;
  onClose?: () => void;
}

type ReviewStage = 'analysis' | 'practice' | 'summary';

const STATUS_META: Record<
  ModulePerformanceSummary['status'],
  { label: string; textClass: string; barHex: string }
> = {
  critical: {
    label: 'Critical (<50%)',
    textClass: 'text-rose-700 dark:text-rose-300',
    barHex: '#e11d48',
  },
  'needs-work': {
    label: 'Needs Review (50–69%)',
    textClass: 'text-amber-700 dark:text-amber-300',
    barHex: '#d97706',
  },
  strong: {
    label: 'Proficient (70%+)',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    barHex: '#059669',
  },
  untested: {
    label: 'Untested',
    textClass: 'text-slate-500 dark:text-slate-400',
    barHex: '#94a3b8',
  },
};

export const WeakestAreasReviewView: React.FC<WeakestAreasReviewViewProps> = ({
  stats,
  sessionAttempts,
  allQuestions,
  selectedPathId = 'all',
  sourceLabel = 'Recent Quiz Session',
  onAnswerReviewQuestion,
  onAddGeneratedQuestionsToBank,
  onSelectModuleForPractice,
  onQuickRetrySessionQuestions,
  onAskTutorAboutQuestion,
  onClose,
}) => {
  const [stage, setStage] = useState<ReviewStage>('analysis');
  const [pathFilter, setPathFilter] = useState<1 | 2 | 3 | 'all'>(selectedPathId);
  const [desiredCount, setDesiredCount] = useState<5 | 8 | 10>(8);
  const [customTargetIds, setCustomTargetIds] = useState<number[] | null>(null);
  const [bonusAiQuestions, setBonusAiQuestions] = useState<Question[]>([]);
  const [isGeneratingBonus, setIsGeneratingBonus] = useState<boolean>(false);
  const [bonusStatusNote, setBonusStatusNote] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  // Interactive practice quiz state
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<string, { selected: string; isCorrect: boolean }>
  >({});
  const [expandedSummaryIds, setExpandedSummaryIds] = useState<Record<string, boolean>>({});

  // Keep synced if parent changes selectedPathId
  useEffect(() => {
    setPathFilter(selectedPathId);
  }, [selectedPathId]);

  // 1. Analyze all 12 modules using session attempts + cumulative mastery
  const analysis = useMemo(
    () => analyzeModulePerformance(stats, sessionAttempts, allQuestions, sourceLabel),
    [stats, sessionAttempts, allQuestions, sourceLabel]
  );

  const scopedRankedModules = useMemo(
    () =>
      rankWeakestModules(analysis.moduleSummaries, {
        scopedPathId: pathFilter,
      }),
    [analysis.moduleSummaries, pathFilter]
  );

  // Default top 3 lowest-scoring modules
  const defaultWeakModuleIds = useMemo(() => {
    const attemptedWeak = scopedRankedModules.filter(
      (m) => m.hasAttempts && m.effectiveAccuracy < 75
    );
    if (attemptedWeak.length > 0) {
      return attemptedWeak.slice(0, 3).map((m) => m.moduleId);
    }
    return scopedRankedModules.slice(0, 3).map((m) => m.moduleId);
  }, [scopedRankedModules]);

  const activeTargetModuleIds =
    customTargetIds && customTargetIds.length > 0 ? customTargetIds : defaultWeakModuleIds;

  const targetSummaries = useMemo(
    () =>
      activeTargetModuleIds
        .map((id) => analysis.moduleSummaries.find((m) => m.moduleId === id))
        .filter((m): m is ModulePerformanceSummary => Boolean(m)),
    [activeTargetModuleIds, analysis.moduleSummaries]
  );

  // 2. Build the practice question set strictly from lowest-scoring modules
  const practiceQuestions = useMemo(() => {
    const baseSet = buildWeakestAreasPracticeSet({
      targetModuleIds: activeTargetModuleIds,
      allQuestions,
      stats,
      sessionAttempts,
      questionCount: desiredCount,
    });

    if (bonusAiQuestions.length === 0) {
      return baseSet;
    }

    const merged = [...bonusAiQuestions.map(ensureCompleteExplanations), ...baseSet];
    const dedup = new Map<string, Question>();
    merged.forEach((q) => {
      if (!dedup.has(q.id)) dedup.set(q.id, q);
    });
    return Array.from(dedup.values()).slice(0, Math.max(desiredCount, bonusAiQuestions.length + 4));
    // refreshNonce lets user build a fresh rotation of questions on demand
  }, [
    activeTargetModuleIds,
    allQuestions,
    stats,
    sessionAttempts,
    desiredCount,
    bonusAiQuestions,
    refreshNonce,
  ]);

  const currentQuestion = practiceQuestions[activeIndex];
  const currentAnswer = currentQuestion ? answersByQuestionId[currentQuestion.id] : undefined;

  const currentModuleSummary = useMemo(() => {
    if (!currentQuestion) return undefined;
    return analysis.moduleSummaries.find((m) => m.moduleId === currentQuestion.moduleId);
  }, [currentQuestion, analysis.moduleSummaries]);

  const chartData = useMemo(() => {
    const list =
      pathFilter === 'all'
        ? analysis.moduleSummaries
        : analysis.moduleSummaries.filter((m) => m.pathId === pathFilter);

    return list.map((m) => ({
      name: `M${m.moduleId}`,
      fullTitle: `Module ${m.moduleId}: ${m.moduleTitle}`,
      accuracy: m.hasAttempts ? m.effectiveAccuracy : 0,
      hasAttempts: m.hasAttempts,
      sessionAccuracy: m.sessionAccuracy,
      overallAccuracy: m.overallAccuracy,
      status: m.status,
      isTargeted: activeTargetModuleIds.includes(m.moduleId),
      barColor: STATUS_META[m.status].barHex,
    }));
  }, [analysis.moduleSummaries, pathFilter, activeTargetModuleIds]);

  const practiceAnsweredCount = Object.keys(answersByQuestionId).length;
  const practiceCorrectCount = Object.values(answersByQuestionId).filter(
    (a) => a.isCorrect
  ).length;
  const practiceAccuracy =
    practiceAnsweredCount > 0
      ? Math.round((practiceCorrectCount / practiceAnsweredCount) * 100)
      : 0;

  const toggleTargetModule = (moduleId: number) => {
    setCustomTargetIds((prev) => {
      const current = prev && prev.length > 0 ? prev : defaultWeakModuleIds;
      if (current.includes(moduleId)) {
        if (current.length === 1) return current; // Keep at least 1 selected module
        return current.filter((id) => id !== moduleId);
      }
      return [...current, moduleId];
    });
  };

  const handleStartPractice = () => {
    setActiveIndex(0);
    setAnswersByQuestionId({});
    setStage('practice');
  };

  const handleSelectOption = (letter: string) => {
    if (!currentQuestion || currentAnswer) return;
    const isCorrect = letter === currentQuestion.correctAnswer;
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [currentQuestion.id]: { selected: letter, isCorrect },
    }));
    onAnswerReviewQuestion(currentQuestion.id, letter, isCorrect, currentQuestion);
  };

  const handleFinishPracticeSet = () => {
    // Expand all explanations in summary view for missed questions by default, or all if <= 10
    const initialExpanded: Record<string, boolean> = {};
    practiceQuestions.forEach((q) => {
      const ans = answersByQuestionId[q.id];
      initialExpanded[q.id] = !ans || !ans.isCorrect || practiceQuestions.length <= 8;
    });
    setExpandedSummaryIds(initialExpanded);
    setStage('summary');

    if (practiceAccuracy >= 70) {
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0078D4', '#10B981', '#F59E0B'],
        });
      } catch {
        // Ignore confetti failures in headless browsers
      }
    }
  };

  const handleGenerateBonusAiQuestions = async () => {
    if (isGeneratingBonus || targetSummaries.length === 0) return;
    setIsGeneratingBonus(true);
    setBonusStatusNote(null);

    try {
      const res = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId: pathFilter === 'all' ? undefined : pathFilter,
          difficulty: 'Intermediate',
          count: 3,
          weakModules: targetSummaries.slice(0, 3).map((m) => ({
            moduleId: m.moduleId,
            moduleTitle: m.moduleTitle,
            pathId: m.pathId,
            pathTitle: m.pathTitle,
            accuracy: m.effectiveAccuracy,
          })),
          customPrompt: `Generate targeted AZ-900 practice scenarios with detailed option-by-option explanations for the learner's lowest-scoring modules: ${targetSummaries
            .slice(0, 3)
            .map((m) => `Module ${m.moduleId} (${m.moduleTitle}, score ${m.effectiveAccuracy}%)`)
            .join('; ')}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          const normalized: Question[] = data.questions.map((q: any, idx: number) => {
            const mod = targetSummaries[idx % targetSummaries.length] || targetSummaries[0];
            return ensureCompleteExplanations({
              id: `weak-ai-${Date.now()}-${idx}`,
              learningPathId: (q.learningPathId || mod.pathId) as 1 | 2 | 3,
              learningPathTitle: q.learningPathTitle || mod.pathTitle,
              moduleId: q.moduleId || mod.moduleId,
              moduleTitle: q.moduleTitle || mod.moduleTitle,
              difficulty: (q.difficulty || 'Intermediate') as Question['difficulty'],
              scenario: q.scenario,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              whyCorrect: q.whyCorrect,
              distractorBreakdown: q.distractorBreakdown || [],
              examTip: q.examTip || '',
              isAiGenerated: true,
            });
          });
          setBonusAiQuestions(normalized);
          onAddGeneratedQuestionsToBank?.(normalized);
          setBonusStatusNote(`Added ${normalized.length} fresh AI remediation questions to your review set.`);
          setIsGeneratingBonus(false);
          return;
        }
      }
      setBonusStatusNote('Using curated curriculum bank scenarios for targeted remediation.');
    } catch {
      setBonusStatusNote('Offline or AI unavailable — curated curriculum scenarios remain ready below.');
    } finally {
      setIsGeneratingBonus(false);
    }
  };

  const lowestModule = scopedRankedModules[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 card-elevation overflow-hidden">
      <KitengeRibbon height={4} />

      {/* Top Mode Header */}
      <div className="p-5 sm:p-7 bg-gradient-to-br from-slate-950 via-[#0A2540] to-[#005A9E] text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-200">
              <Target className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Weakest Areas Review Mode</span>
              <span aria-hidden="true">·</span>
              <span>{analysis.sourceLabel}</span>
              {analysis.analyzedQuestionCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-amber-200">
                    {analysis.analyzedQuestionCount} Quiz Questions Analyzed
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Module Performance Analysis &amp; Targeted Practice
            </h2>
            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              Automatically isolates your lowest-scoring AZ-900 modules, builds a focused practice set from those modules, and provides full architectural explanations for every answer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center p-1 rounded-xl bg-black/25 border border-white/15"
              role="tablist"
              aria-label="Weakest Areas Review stages"
            >
              <button
                type="button"
                role="tab"
                aria-selected={stage === 'analysis'}
                onClick={() => setStage('analysis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  stage === 'analysis'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                1. Module Analysis
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={stage === 'practice'}
                onClick={() => setStage('practice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  stage === 'practice'
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                2. Practice ({practiceQuestions.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={stage === 'summary'}
                onClick={() => {
                  const expanded: Record<string, boolean> = {};
                  practiceQuestions.forEach((q) => {
                    expanded[q.id] = true;
                  });
                  setExpandedSummaryIds(expanded);
                  setStage('summary');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  stage === 'summary'
                    ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                3. Explanations ({practiceAnsweredCount}/{practiceQuestions.length})
              </button>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-colors cursor-pointer"
              >
                Exit Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          STAGE 1: POST-QUIZ MODULE PERFORMANCE ANALYSIS & TARGET SELECTION
         ===================================================================== */}
      {stage === 'analysis' && (
        <div className="p-5 sm:p-7 space-y-7">
          {/* Diagnostic KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {analysis.analyzedQuestionCount > 0 ? 'Just-Finished Quiz' : 'Cumulative Accuracy'}
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1 block">
                {analysis.analyzedQuestionCount > 0
                  ? `${analysis.sessionAccuracy}%`
                  : stats.totalAnswered > 0
                  ? `${Math.round((stats.totalCorrect / stats.totalAnswered) * 100)}%`
                  : '—'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {analysis.analyzedQuestionCount > 0
                  ? `${analysis.sessionCorrectCount}/${analysis.analyzedQuestionCount} correct`
                  : `${stats.totalCorrect}/${stats.totalAnswered} total Qs`}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                Lowest-Scoring Module
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-800 dark:text-rose-200 tabular-nums mt-1 block truncate">
                {lowestModule
                  ? `M${lowestModule.moduleId} · ${
                      lowestModule.hasAttempts ? `${lowestModule.effectiveAccuracy}%` : 'Untested'
                    }`
                  : '—'}
              </span>
              <span className="text-xs text-rose-700/90 dark:text-rose-300/90 truncate block">
                {lowestModule?.moduleTitle || 'Complete a quiz to calibrate'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                Modules Below 70%
              </span>
              <span className="text-2xl font-black text-amber-800 dark:text-amber-200 tabular-nums mt-1 block">
                {analysis.weakModulesCount}
              </span>
              <span className="text-xs text-amber-800/80 dark:text-amber-300/80 tabular-nums">
                Out of {analysis.attemptedModulesCount} attempted modules
              </span>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#005A9E] dark:text-sky-300 block">
                Review Practice Queue
              </span>
              <span className="text-2xl font-black text-[#0078D4] dark:text-sky-200 tabular-nums mt-1 block">
                {practiceQuestions.length} Qs
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                Targeting {targetSummaries.length} weakest module{targetSummaries.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Priority Weakest Modules Cards */}
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Lowest-Scoring Modules Targeted for Review</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Ranked by your lowest post-quiz &amp; cumulative accuracy. Click any module in the table below to customize your focus.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-bold">
                  {([5, 8, 10] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setDesiredCount(cnt)}
                      className={`px-2.5 py-1 rounded-md tabular-nums cursor-pointer transition-colors ${
                        desiredCount === cnt
                          ? 'bg-[#0078D4] text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleStartPractice}
                  disabled={practiceQuestions.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Start Weakest Areas Practice ({practiceQuestions.length} Qs)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {targetSummaries.slice(0, 3).map((mod, idx) => {
                const statusInfo = STATUS_META[mod.status];
                return (
                  <div
                    key={mod.moduleId}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          Priority #{idx + 1} · Path {mod.pathId}
                        </span>
                        <span className={`font-black tabular-nums ${statusInfo.textClass}`}>
                          {mod.hasAttempts ? `${mod.effectiveAccuracy}%` : 'Untested'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                        Module {mod.moduleId}: {mod.moduleTitle}
                      </h4>

                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${mod.hasAttempts ? Math.max(6, mod.effectiveAccuracy) : 0}%`,
                            backgroundColor: statusInfo.barHex,
                          }}
                        />
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                        {mod.sessionTotal > 0
                          ? `This quiz: ${mod.sessionCorrect}/${mod.sessionTotal} (${mod.sessionAccuracy}%)`
                          : 'Not tested in last quiz'}
                        {' · '}
                        {mod.overallTotal > 0
                          ? `Overall: ${mod.overallCorrect}/${mod.overallTotal} (${mod.overallAccuracy}%)`
                          : 'No prior attempts'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Topics:{' '}
                      </span>
                      <span>{mod.keyTerms.slice(0, 3).join(' · ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional quick tools bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBonusAiQuestions}
                  disabled={isGeneratingBonus}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingBonus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0078D4]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>Add Bonus AI Scenarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRefreshNonce((n) => n + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Rebuild Question Set</span>
                </button>

                {onQuickRetrySessionQuestions && practiceQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onQuickRetrySessionQuestions(practiceQuestions)}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold text-amber-900 dark:text-amber-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Queue in Main Quiz</span>
                  </button>
                )}
              </div>

              {bonusStatusNote && (
                <span className="text-xs font-medium text-[#0078D4] dark:text-sky-300">
                  {bonusStatusNote}
                </span>
              )}
            </div>
          </div>

          {/* Module Accuracy Chart & Filterable 12-Module Table */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="xl:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#0078D4]" />
                  <span>Accuracy by Module</span>
                </h3>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {(['all', 1, 2, 3] as const).map((p) => (
                    <button
                      key={String(p)}
                      type="button"
                      onClick={() => setPathFilter(p)}
                      className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                        pathFilter === p
                          ? 'bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {p === 'all' ? 'All' : `P${p}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip
                      formatter={(val: any, _name: any, item: any) => [
                        item?.payload?.hasAttempts ? `${val}% effective accuracy` : 'Untested',
                        item?.payload?.fullTitle || '',
                      ]}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        borderColor: '#cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                    <ReferenceLine
                      y={70}
                      stroke="#0078D4"
                      strokeDasharray="4 4"
                      label={{ value: '70% Pass', position: 'insideTopRight', fontSize: 10, fill: '#0078D4' }}
                    />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.barColor}
                          fillOpacity={entry.isTargeted ? 1 : 0.45}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Solid bars indicate modules currently included in your Weakest Areas practice set; dashed line marks the 70% AZ-900 pass threshold.
              </p>
            </div>

            <div className="xl:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  All Modules Performance Breakdown (Click to Toggle Target)
                </h3>
                {customTargetIds && (
                  <button
                    type="button"
                    onClick={() => setCustomTargetIds(null)}
                    className="text-xs font-bold text-[#0078D4] hover:underline cursor-pointer"
                  >
                    Reset to Auto-Lowest
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3 text-right">This Quiz</th>
                      <th className="py-2.5 px-3 text-right">Overall</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                      <th className="py-2.5 px-3 text-right">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {scopedRankedModules.map((mod) => {
                      const isSelected = activeTargetModuleIds.includes(mod.moduleId);
                      const statusMeta = STATUS_META[mod.status];
                      return (
                        <tr
                          key={mod.moduleId}
                          onClick={() => toggleTargetModule(mod.moduleId)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-50/70 dark:bg-sky-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              M{mod.moduleId}: {mod.moduleTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Path {mod.pathId} · {mod.availableBankQuestions} bank Qs
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {mod.sessionTotal > 0
                              ? `${mod.sessionCorrect}/${mod.sessionTotal} (${mod.sessionAccuracy}%)`
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                            {mod.overallTotal > 0
                              ? `${mod.overallCorrect}/${mod.overallTotal} (${mod.overallAccuracy}%)`
                              : '—'}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${statusMeta.textClass}`}>
                            {statusMeta.label}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                isSelected
                                  ? 'bg-[#0078D4] text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isSelected ? 'Targeted' : 'Add'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 2: INTERACTIVE WEAKEST-MODULES PRACTICE & ANSWER EXPLANATIONS
         ===================================================================== */}
      {stage === 'practice' && (
        <div className="relative p-5 sm:p-7 overflow-hidden">
          <KitengeCardWatermark opacity={0.05} />
          <div className="relative z-10 space-y-6">
          {/* Top Progress & Question Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              {practiceQuestions.map((q, idx) => {
                const ans = answersByQuestionId[q.id];
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center tabular-nums ${
                      isCurrent
                        ? 'bg-[#0078D4] text-white border-[#0078D4]'
                        : ans
                        ? ans.isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
              <span>
                Score: <strong className="text-[#0078D4] dark:text-sky-300">{practiceCorrectCount}/{practiceAnsweredCount}</strong>{' '}
                ({practiceAccuracy}%)
              </span>
              <button
                type="button"
                onClick={() => setStage('analysis')}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
              >
                Module Analysis
              </button>
            </div>
          </div>

          {currentQuestion ? (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Unboxed Metadata Eyebrow */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-[#0078D4] dark:text-sky-300">
                    Question {activeIndex + 1} of {practiceQuestions.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    Weakest Area: Module {currentQuestion.moduleId} ({currentQuestion.moduleTitle})
                  </span>
                  {currentModuleSummary && currentModuleSummary.hasAttempts && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Your Module Score: {currentModuleSummary.effectiveAccuracy}%
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{currentQuestion.difficulty}</span>
                </div>

                {onAskTutorAboutQuestion && (
                  <button
                    type="button"
                    onClick={() =>
                      onAskTutorAboutQuestion(currentQuestion, currentAnswer?.selected ?? null)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0078D4] dark:text-sky-300 hover:underline cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Tutor</span>
                  </button>
                )}
              </div>

              {/* Scenario Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Azure Scenario</span>
                </div>
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed">
                  {currentQuestion.scenario}
                </p>
              </div>

              {/* Question Prompt */}
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                {currentQuestion.question}
              </h3>

              {/* Answer Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentAnswer?.selected === opt.letter;
                  const isCorrectOpt = opt.letter === currentQuestion.correctAnswer;

                  let buttonClasses =
                    'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0078D4] dark:hover:border-sky-500 text-slate-800 dark:text-slate-100';
                  let letterClasses =
                    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600';

                  if (currentAnswer) {
                    if (isCorrectOpt) {
                      buttonClasses =
                        'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30';
                      letterClasses = 'bg-emerald-600 text-white border-emerald-600';
                    } else if (isSelected) {
                      buttonClasses =
                        'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/30';
                      letterClasses = 'bg-rose-600 text-white border-rose-600';
                    } else {
                      buttonClasses =
                        'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={Boolean(currentAnswer)}
                      onClick={() => handleSelectOption(opt.letter)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${buttonClasses}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${letterClasses}`}
                      >
                        {currentAnswer && isCorrectOpt ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : currentAnswer && isSelected && !isCorrectOpt ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          opt.letter
                        )}
                      </span>
                      <span className="text-sm sm:text-base font-medium leading-relaxed pt-0.5">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Immediate Full Answer Explanation */}
              {currentAnswer && (
                <div className="space-y-3.5 pt-2 animate-in fade-in duration-200">
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      currentAnswer.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100'
                    }`}
                  >
                    {currentAnswer.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <div className="text-xs sm:text-sm font-bold">
                      {currentAnswer.isCorrect
                        ? `Correct! Option ${currentQuestion.correctAnswer} strengthens your Module ${currentQuestion.moduleId} mastery.`
                        : `You selected Option ${currentAnswer.selected}. Correct Answer: Option ${currentQuestion.correctAnswer}.`}
                    </div>
                  </div>

                  {/* Why Correct */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Why Option {currentQuestion.correctAnswer} is Correct
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                      {currentQuestion.whyCorrect}
                    </p>
                  </div>

                  {/* Option-by-Option Distractor Breakdown */}
                  {currentQuestion.distractorBreakdown.length > 0 && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Why the Other Options Are Incorrect
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {currentQuestion.distractorBreakdown.map((d) => {
                          const wasChosen = currentAnswer.selected === d.letter;
                          return (
                            <div
                              key={d.letter}
                              className={`p-2.5 rounded-lg ${
                                wasChosen
                                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800'
                                  : 'bg-slate-50/70 dark:bg-slate-800/40'
                              }`}
                            >
                              <strong className="text-slate-900 dark:text-white">
                                Option {d.letter}
                                {wasChosen ? ' (Your Choice)' : ''}:
                              </strong>{' '}
                              <span>{d.reason}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Exam Tip */}
                  <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs sm:text-sm text-amber-950 dark:text-amber-100">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold block">AZ-900 Exam Rule</strong>
                      <span>{currentQuestion.examTip}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2.5">
                  {activeIndex < practiceQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((i) => Math.min(practiceQuestions.length - 1, i + 1))
                      }
                      className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishPracticeSet}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Complete Review &amp; View All Explanations</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No questions matched the selected modules. Select additional modules in the analysis tab.
              </p>
              <button
                type="button"
                onClick={() => setStage('analysis')}
                className="px-4 py-2 rounded-xl bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
              >
                Back to Module Analysis
              </button>
            </div>
          )}
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 3: REVIEW SUMMARY & COMPLETE ANSWER EXPLANATIONS LEDGER
         ===================================================================== */}
      {stage === 'summary' && (
        <div className="p-5 sm:p-7 space-y-7">
          {/* Summary Banner */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0078D4] dark:text-sky-300 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Weakest Areas Practice Summary</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {practiceAnsweredCount > 0
                  ? `${practiceCorrectCount} of ${practiceAnsweredCount} Correct (${practiceAccuracy}%)`
                  : `${practiceQuestions.length} Explanations Ready for Inspection`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Modules practiced: {targetSummaries.map((m) => `M${m.moduleId}: ${m.moduleTitle}`).join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setRefreshNonce((n) => n + 1);
                  setAnswersByQuestionId({});
                  setActiveIndex(0);
                  setStage('practice');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Practice New Weakest Set</span>
              </button>

              <button
                type="button"
                onClick={() => setStage('analysis')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold cursor-pointer"
              >
                Back to Module Analysis
              </button>
            </div>
          </div>

          {/* Complete Answer Key & Explanations Ledger */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0078D4]" />
                <span>All Practice Questions &amp; Answer Explanations ({practiceQuestions.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  const allOpen = practiceQuestions.every((q) => expandedSummaryIds[q.id]);
                  const next: Record<string, boolean> = {};
                  practiceQuestions.forEach((q) => {
                    next[q.id] = !allOpen;
                  });
                  setExpandedSummaryIds(next);
                }}
                className="text-xs font-bold text-[#0078D4] dark:text-sky-300 hover:underline cursor-pointer"
              >
                {practiceQuestions.every((q) => expandedSummaryIds[q.id])
                  ? 'Collapse All'
                  : 'Expand All Explanations'}
              </button>
            </div>

            <div className="space-y-3">
              {practiceQuestions.map((q, idx) => {
                const ans = answersByQuestionId[q.id];
                const isExpanded = Boolean(expandedSummaryIds[q.id]);
                const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSummaryIds((prev) => ({
                          ...prev,
                          [q.id]: !prev[q.id],
                        }))
                      }
                      className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-black text-slate-900 dark:text-white tabular-nums">
                            Q{idx + 1}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-[#0078D4] dark:text-sky-300">
                            Module {q.moduleId}: {q.moduleTitle}
                          </span>
                          <span aria-hidden="true">·</span>
                          {ans ? (
                            <span
                              className={`font-extrabold inline-flex items-center gap-1 ${
                                ans.isCorrect
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {ans.isCorrect ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {ans.isCorrect
                                  ? `Correct (${q.correctAnswer})`
                                  : `Answered ${ans.selected} · Correct: ${q.correctAnswer}`}
                              </span>
                            </span>
                          ) : (
                            <span className="font-bold text-slate-500 dark:text-slate-400">
                              Answer: Option {q.correctAnswer}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {q.question}
                        </p>
                      </div>

                      <span className="text-slate-400 shrink-0 pt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3 text-xs sm:text-sm">
                        <p className="text-slate-600 dark:text-slate-300 italic">{q.scenario}</p>

                        <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                          <div className="font-extrabold text-emerald-800 dark:text-emerald-300">
                            Correct Answer — Option {q.correctAnswer}: {correctOpt?.text}
                          </div>
                          <p className="text-slate-800 dark:text-slate-100">{q.whyCorrect}</p>
                        </div>

                        {q.distractorBreakdown.length > 0 && (
                          <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                            <div className="font-bold text-slate-900 dark:text-white">
                              Distractor Explanations:
                            </div>
                            {q.distractorBreakdown.map((d) => (
                              <p key={d.letter}>
                                <strong>Option {d.letter}:</strong> {d.reason}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Exam Tip:</strong> {q.examTip}
                          </span>
                        </div>

                        {onSelectModuleForPractice && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectModuleForPractice(q.moduleId, q.learningPathId)
                              }
                              className="text-xs font-bold text-[#0078D4] dark:text-sky-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Practice Full Module {q.moduleId} Bank</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
