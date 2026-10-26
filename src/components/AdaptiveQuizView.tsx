import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Zap,
  Target,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Layers,
  HelpCircle,
  Check,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { Question, UserStats, QuestionAttempt, QuizSessionRecord, QuizSessionMissedQuestion } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { saveUserAttempt, saveQuizSession } from '../utils/storage';
import { MaasaiMedallion } from './MotifDecorations';
import confetti from 'canvas-confetti';

interface AdaptiveQuizViewProps {
  questions: Question[];
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onNavigateToHistory: () => void;
  onNavigateToPractice: () => void;
  onOpenPersonalizedReview?: () => void;
  onSelectModuleForPractice?: (moduleId: number) => void;
}

interface SessionAttemptItem {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
}

export const AdaptiveQuizView: React.FC<AdaptiveQuizViewProps> = ({
  questions,
  stats,
  onUpdateStats,
  onNavigateToHistory,
  onNavigateToPractice,
  onOpenPersonalizedReview,
  onSelectModuleForPractice,
}) => {
  const SESSION_LENGTH = 10;

  // Active question index in session
  const [sessionQuestionIndex, setSessionQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [sessionMissedQuestions, setSessionMissedQuestions] = useState<QuizSessionMissedQuestion[]>([]);
  const [sessionAttemptLog, setSessionAttemptLog] = useState<SessionAttemptItem[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [focusedWeakModuleFilter, setFocusedWeakModuleFilter] = useState<number[] | null>(null);

  // Rolling-Average Adaptive Difficulty State (Starts at Medium / 'Intermediate')
  const ROLLING_WINDOW_SIZE = 4;
  const [rollingOutcomes, setRollingOutcomes] = useState<boolean[]>([]);
  const [rollingDifficulty, setRollingDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced'
  >('Intermediate');

  // Learning Path Focus Selection & Confirmation State
  const [pendingPathFocus, setPendingPathFocus] = useState<1 | 2 | 3>(1);
  const [confirmedPathFocus, setConfirmedPathFocus] = useState<1 | 2 | 3 | null>(null);
  const [showPathSelectorPanel, setShowPathSelectorPanel] = useState<boolean>(false);

  const rollingAvgPercent = useMemo(() => {
    if (rollingOutcomes.length === 0) return null;
    const correctCount = rollingOutcomes.filter(Boolean).length;
    return Math.round((correctCount / rollingOutcomes.length) * 100);
  }, [rollingOutcomes]);

  // Current session questions list generated adaptively
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [adaptiveReasons, setAdaptiveReasons] = useState<string[]>([]);

  // Function to adaptively pick the next best question prioritizing weak modules, confirmed Learning Path, & rolling difficulty
  const pickNextAdaptiveQuestion = (
    currentUsed: Set<string>,
    currentStats: UserStats,
    overrideModules?: number[] | null,
    targetDifficulty: 'Fundamental' | 'Intermediate' | 'Advanced' = rollingDifficulty,
    targetLearningPath: 1 | 2 | 3 | null = confirmedPathFocus
  ): { question: Question; reason: string } | null => {
    // 1. Calculate confidence for each module (scoped to confirmedLearningPath if selected)
    const moduleConfidenceMap: Record<number, number> = {};
    const strugglingModules: number[] = [];
    const intermediateModules: number[] = [];
    const masteredModules: number[] = [];

    const activePaths =
      targetLearningPath !== null
        ? LEARNING_PATHS.filter((p) => p.id === targetLearningPath)
        : LEARNING_PATHS;

    activePaths.forEach((path) => {
      path.modules.forEach((mod) => {
        const mastery = currentStats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const conf = mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;
        moduleConfidenceMap[mod.id] = conf;

        if (mastery.total === 0 || conf < 65) {
          strugglingModules.push(mod.id);
        } else if (conf < 80) {
          intermediateModules.push(mod.id);
        } else {
          masteredModules.push(mod.id);
        }
      });
    });

    // 2. Determine target module pool (if focused weak modules override is active, prioritize them)
    const roll = Math.random();
    let targetPool: number[] = [];
    let priorityLabel = '';

    if (overrideModules && overrideModules.length > 0) {
      targetPool = overrideModules;
      priorityLabel = 'Targeted Weakness Remediation';
    } else if (roll < 0.65 && strugglingModules.length > 0) {
      targetPool = strugglingModules;
      priorityLabel = 'High Focus (Weak / Struggling Module)';
    } else if (roll < 0.90 && intermediateModules.length > 0) {
      targetPool = intermediateModules;
      priorityLabel = 'Reinforcement Focus (Developing Proficiency)';
    } else if (masteredModules.length > 0) {
      targetPool = masteredModules;
      priorityLabel = 'Mastery Challenge (Retaining High Score)';
    } else {
      targetPool = strugglingModules.length > 0 ? strugglingModules : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      priorityLabel = 'Core Azure Curriculum Objective';
    }

    // Sort struggling modules so the lowest confidence modules are weighted even higher
    const sortedPool = [...targetPool].sort(
      (a, b) => (moduleConfidenceMap[a] ?? 0) - (moduleConfidenceMap[b] ?? 0)
    );
    const targetModuleId =
      sortedPool.length > 1 && Math.random() < 0.6
        ? sortedPool[0]
        : sortedPool[Math.floor(Math.random() * sortedPool.length)];

    // Filter available unused questions in this module
    let availableQuestions = questions.filter(
      (q) => q.moduleId === targetModuleId && !currentUsed.has(q.id)
    );

    // Fallback: unused questions in the confirmed learning path (if any) or across all questions
    if (availableQuestions.length === 0) {
      availableQuestions = questions.filter(
        (q) =>
          (targetLearningPath === null || q.learningPathId === targetLearningPath) &&
          !currentUsed.has(q.id)
      );
    }

    if (availableQuestions.length === 0) {
      availableQuestions = questions.filter((q) => !currentUsed.has(q.id));
    }

    if (availableQuestions.length === 0) {
      availableQuestions = questions;
    }

    // Prioritize questions matching the current rolling-average difficulty tier ('Fundamental' / 'Intermediate' / 'Advanced')
    const difficultyMatchedPool = availableQuestions.filter(
      (q) => q.difficulty === targetDifficulty
    );
    const candidatePool =
      difficultyMatchedPool.length > 0 ? difficultyMatchedPool : availableQuestions;

    // Prioritize previously missed questions or unattempted questions in that pool
    const previouslyMissedInPool = candidatePool.filter((q) => {
      const qAttempts = currentStats.attempts?.[q.id] || [];
      if (qAttempts.length === 0) return false;
      const latest = [...qAttempts].sort((a, b) => b.timestamp - a.timestamp)[0];
      return !latest.isCorrect;
    });

    const unattemptedInPool = candidatePool.filter(
      (q) => !currentStats.attempts?.[q.id] || currentStats.attempts[q.id].length === 0
    );

    let selected: Question;
    let conceptNote = priorityLabel;

    if (previouslyMissedInPool.length > 0) {
      selected =
        previouslyMissedInPool[Math.floor(Math.random() * previouslyMissedInPool.length)];
      conceptNote = 'Previously Missed Concept Priority';
    } else if (unattemptedInPool.length > 0 && Math.random() < 0.75) {
      selected = unattemptedInPool[Math.floor(Math.random() * unattemptedInPool.length)];
      conceptNote = `${priorityLabel} • Unseen Concept`;
    } else {
      selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    }

    const currentModConf = moduleConfidenceMap[selected.moduleId] ?? 0;
    const diffLabel =
      selected.difficulty === 'Fundamental'
        ? 'Easy / Fundamental'
        : selected.difficulty === 'Intermediate'
        ? 'Medium / Intermediate'
        : 'Hard / Advanced';
    const reasonText = `Targeting M${selected.moduleId}: ${selected.moduleTitle} (${diffLabel} • Confidence: ${currentModConf}% • ${conceptNote})`;

    return { question: selected, reason: reasonText };
  };

  // Initialize first question on mount
  useEffect(() => {
    if (sessionQuestions.length === 0 && questions.length > 0) {
      const firstPick = pickNextAdaptiveQuestion(usedQuestionIds, stats, focusedWeakModuleFilter);
      if (firstPick) {
        setSessionQuestions([firstPick.question]);
        setAdaptiveReasons([firstPick.reason]);
        setUsedQuestionIds(new Set([firstPick.question.id]));
      }
    }
  }, [questions, stats, focusedWeakModuleFilter]);

  const currentQuestion = sessionQuestions[sessionQuestionIndex];
  const currentReason = adaptiveReasons[sessionQuestionIndex] || 'Dynamically calibrated for your current mastery level';

  // Current module confidence
  const currentModuleConfidence = useMemo(() => {
    if (!currentQuestion) return 0;
    const mastery = stats.moduleMastery[currentQuestion.moduleId] || { correct: 0, total: 0 };
    return mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;
  }, [currentQuestion, stats.moduleMastery]);

  const handleSelectOption = (letter: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(letter);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setIsAnswerSubmitted(true);
    setSessionAttemptLog((prev) => [
      ...prev,
      { question: currentQuestion, selectedAnswer, isCorrect },
    ]);

    if (isCorrect) {
      setSessionCorrectCount((prev) => prev + 1);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0078D4', '#10B981', '#38BDF8'],
      });
    } else {
      // Record missed question
      const selectedOptionObj = currentQuestion.options.find((o) => o.letter === selectedAnswer);
      const correctOptionObj = currentQuestion.options.find((o) => o.letter === currentQuestion.correctAnswer);

      const missedEntry: QuizSessionMissedQuestion = {
        questionId: currentQuestion.id,
        scenario: currentQuestion.scenario,
        question: currentQuestion.question,
        selectedAnswer,
        selectedAnswerText: selectedOptionObj ? `${selectedOptionObj.letter}: ${selectedOptionObj.text}` : selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        correctAnswerText: correctOptionObj ? `${correctOptionObj.letter}: ${correctOptionObj.text}` : currentQuestion.correctAnswer,
        whyCorrect: currentQuestion.whyCorrect,
        examTip: currentQuestion.examTip,
        moduleId: currentQuestion.moduleId,
        moduleTitle: currentQuestion.moduleTitle,
        learningPathTitle: currentQuestion.learningPathTitle,
      };

      setSessionMissedQuestions((prev) => [...prev, missedEntry]);
    }

    // Update rolling window of recent answers in current session and adjust difficulty dynamically
    const nextWindow = [...rollingOutcomes, isCorrect].slice(-ROLLING_WINDOW_SIZE);
    setRollingOutcomes(nextWindow);
    const nextAvg = Math.round(
      (nextWindow.filter(Boolean).length / nextWindow.length) * 100
    );

    if (nextWindow.length >= 2) {
      if (nextAvg >= 75) {
        setRollingDifficulty((prev) =>
          prev === 'Fundamental' ? 'Intermediate' : 'Advanced'
        );
      } else if (nextAvg <= 40) {
        setRollingDifficulty((prev) =>
          prev === 'Advanced' ? 'Intermediate' : 'Fundamental'
        );
      } else if (nextWindow.length >= 3) {
        setRollingDifficulty('Intermediate');
      }
    }

    // Save attempt to global stats immediately
    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      moduleId: currentQuestion.moduleId,
      pathId: currentQuestion.learningPathId,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
      trapType: currentQuestion.errorDiagnostic?.trapType || 'Conceptual Gap',
    };

    const updatedStats = saveUserAttempt(stats, attempt);
    onUpdateStats(updatedStats);
  };

  const handleNextQuestion = () => {
    const nextIndex = sessionQuestionIndex + 1;

    if (nextIndex >= SESSION_LENGTH) {
      // Finish session!
      finishSession();
      return;
    }

    // Pick next adaptive question with updated stats, rolling difficulty, and confirmed learning path
    const nextPick = pickNextAdaptiveQuestion(
      usedQuestionIds,
      stats,
      focusedWeakModuleFilter,
      rollingDifficulty,
      confirmedPathFocus
    );
    if (nextPick) {
      setSessionQuestions((prev) => [...prev, nextPick.question]);
      setAdaptiveReasons((prev) => [...prev, nextPick.reason]);
      setUsedQuestionIds((prev) => new Set([...prev, nextPick.question.id]));
      setSessionQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setIsSessionComplete(true);
    const scorePercent = Math.round((sessionCorrectCount / SESSION_LENGTH) * 100);
    const passed = scorePercent >= 70;
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);

    const sessionRecord: QuizSessionRecord = {
      id: `session-adaptive-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: `Adaptive Quiz Sprint (10 Questions)`,
      mode: 'adaptive',
      totalQuestions: SESSION_LENGTH,
      correctCount: sessionCorrectCount,
      scorePercent,
      passed,
      durationSeconds: duration,
      missedQuestions: sessionMissedQuestions,
    };

    saveQuizSession(sessionRecord);

    if (passed) {
      confetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#0078D4', '#10B981', '#F59E0B'],
      });
    }
  };

  const handleRestartSession = (
    targetWeakModules?: number[] | null,
    overridePathFocus?: 1 | 2 | 3 | null
  ) => {
    const nextPathFocus =
      overridePathFocus !== undefined ? overridePathFocus : confirmedPathFocus;
    setConfirmedPathFocus(nextPathFocus);
    setFocusedWeakModuleFilter(targetWeakModules ?? null);
    setRollingOutcomes([]);
    setRollingDifficulty('Intermediate'); // Always start session at Medium difficulty
    setSessionQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setSessionCorrectCount(0);
    setSessionMissedQuestions([]);
    setSessionAttemptLog([]);
    setIsSessionComplete(false);

    const freshUsed = new Set<string>();
    const firstPick = pickNextAdaptiveQuestion(
      freshUsed,
      stats,
      targetWeakModules ?? null,
      'Intermediate',
      nextPathFocus
    );
    if (firstPick) {
      setSessionQuestions([firstPick.question]);
      setAdaptiveReasons([firstPick.reason]);
      setUsedQuestionIds(new Set([firstPick.question.id]));
    } else {
      setSessionQuestions([]);
      setAdaptiveReasons([]);
      setUsedQuestionIds(new Set());
    }
    setShowPathSelectorPanel(false);
  };

  // If session is complete, display results + summary of performance by Learning Path and Module
  if (isSessionComplete) {
    const scorePercent = Math.round((sessionCorrectCount / SESSION_LENGTH) * 100);
    const passed = scorePercent >= 70;

    // Compute session performance by Learning Path (1, 2, 3)
    const pathSummaries = LEARNING_PATHS.map((path) => {
      const pathSessionAttempts = sessionAttemptLog.filter(
        (item) => item.question.learningPathId === path.id
      );
      const sessionTotal = pathSessionAttempts.length;
      const sessionCorrect = pathSessionAttempts.filter((i) => i.isCorrect).length;
      const sessionPct =
        sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : null;

      // Overall cumulative mastery across modules in this path
      let cumulativeCorrect = 0;
      let cumulativeTotal = 0;
      path.modules.forEach((m) => {
        const modStats = stats.moduleMastery[m.id] || { correct: 0, total: 0 };
        cumulativeCorrect += modStats.correct;
        cumulativeTotal += modStats.total;
      });
      const cumulativePct =
        cumulativeTotal > 0 ? Math.round((cumulativeCorrect / cumulativeTotal) * 100) : 0;

      return {
        pathId: path.id,
        title: path.title,
        weight: path.examWeight,
        sessionCorrect,
        sessionTotal,
        sessionPct,
        cumulativePct,
        cumulativeTotal,
      };
    });

    // Compute performance by Module (focusing on modules tested in this session + weak modules overall)
    const allModulesSummary = LEARNING_PATHS.flatMap((path) =>
      path.modules.map((mod) => {
        const modSessionAttempts = sessionAttemptLog.filter(
          (item) => item.question.moduleId === mod.id
        );
        const sessionTotal = modSessionAttempts.length;
        const sessionCorrect = modSessionAttempts.filter((i) => i.isCorrect).length;
        const sessionPct =
          sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : null;

        const overallMastery = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const overallPct =
          overallMastery.total > 0
            ? Math.round((overallMastery.correct / overallMastery.total) * 100)
            : 0;

        const isWeak =
          (sessionPct !== null && sessionPct < 70) ||
          (overallMastery.total > 0 && overallPct < 65) ||
          overallMastery.total === 0;

        return {
          moduleId: mod.id,
          title: mod.title,
          pathId: path.id,
          sessionCorrect,
          sessionTotal,
          sessionPct,
          overallPct,
          overallTotal: overallMastery.total,
          isWeak,
        };
      })
    );

    const testedModulesInSession = allModulesSummary.filter((m) => m.sessionTotal > 0);
    const prioritizedWeakModules = allModulesSummary
      .filter((m) => (m.sessionPct !== null && m.sessionPct < 70) || (m.overallTotal > 0 && m.overallPct < 65))
      .sort((a, b) => (a.sessionPct ?? a.overallPct) - (b.sessionPct ?? b.overallPct));

    const weakModuleIdsForNextSprint =
      prioritizedWeakModules.length > 0
        ? prioritizedWeakModules.map((m) => m.moduleId)
        : allModulesSummary.filter((m) => m.isWeak).map((m) => m.moduleId);

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0078D4] to-blue-600 text-white flex items-center justify-center shadow-md">
              <Zap className="w-8 h-8 text-amber-300" />
            </div>

            <div className="space-y-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  passed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {passed ? '🎉 Passed Benchmark (70%+)' : 'Adaptive Remediation Queued'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Adaptive Learning Path Session Summary
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Your performance across Learning Paths and Modules has been analyzed. Weak modules and missed concepts are automatically prioritized for your next adaptive practice session.
              </p>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Session Score</span>
                <span className="text-3xl font-black text-[#0078D4] mt-1 block">{scorePercent}%</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Correct</span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block">
                  {sessionCorrectCount} / {SESSION_LENGTH}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Priority Weak Areas</span>
                <span className="text-3xl font-black text-amber-600 mt-1 block">
                  {prioritizedWeakModules.length}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Performance Summary by Learning Path (Paths 1–3) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0078D4]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Performance by Learning Path (Paths 1–3)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Session Accuracy &amp; Overall Domain Mastery
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {pathSummaries.map((p) => {
                const displayPct = p.sessionPct !== null ? p.sessionPct : p.cumulativePct;
                const isPathStrong = displayPct >= 70;
                return (
                  <div
                    key={p.pathId}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-[#0078D4] border border-blue-200">
                          Path {p.pathId} ({p.weight})
                        </span>
                        <span
                          className={`text-xs font-black ${
                            p.sessionPct === null
                              ? 'text-slate-500'
                              : isPathStrong
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {p.sessionPct !== null
                            ? `${p.sessionPct}% (${p.sessionCorrect}/${p.sessionTotal})`
                            : 'Not Tested in Sprint'}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 mt-2 line-clamp-2">
                        {p.title}
                      </h4>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPathStrong ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(6, displayPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Overall Mastery: {p.cumulativePct}%</span>
                        <span>{p.cumulativeTotal} total attempts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Performance Summary by Module & Adaptive Next-Session Prioritization */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Performance by Module &amp; Adaptive Priority Queue
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                Weak areas prioritized next session
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(testedModulesInSession.length > 0 ? testedModulesInSession : allModulesSummary.slice(0, 6)).map(
                (mod) => {
                  const accuracy = mod.sessionPct ?? mod.overallPct;
                  const needsFocus = accuracy < 70;
                  return (
                    <div
                      key={mod.moduleId}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 ${
                        needsFocus
                          ? 'bg-amber-50/50 border-amber-300/90'
                          : 'bg-emerald-50/30 border-emerald-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              Path {mod.pathId} • M{mod.moduleId}
                            </span>
                            {needsFocus ? (
                              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                Priority Focus Next
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                Strong
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1.5">
                            {mod.title}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black block ${
                              needsFocus ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {mod.sessionPct !== null ? `${mod.sessionPct}%` : `${mod.overallPct}%`}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {mod.sessionTotal > 0
                              ? `${mod.sessionCorrect}/${mod.sessionTotal} this session`
                              : `Overall (${mod.overallTotal} Qs)`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Overall Module Confidence: <strong>{mod.overallPct}%</strong>
                        </span>
                        {onSelectModuleForPractice && (
                          <button
                            type="button"
                            onClick={() => onSelectModuleForPractice(mod.moduleId)}
                            className="text-[#0078D4] hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Drill Module {mod.moduleId}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
            {weakModuleIdsForNextSprint.length > 0 && (
              <button
                onClick={() => handleRestartSession(weakModuleIdsForNextSprint)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  Start Weak-Area Adaptive Sprint ({weakModuleIdsForNextSprint.length} Priority Module{weakModuleIdsForNextSprint.length === 1 ? '' : 's'})
                </span>
              </button>
            )}

            {onOpenPersonalizedReview && sessionMissedQuestions.length > 0 && (
              <button
                onClick={onOpenPersonalizedReview}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  Review Missed Questions ({sessionMissedQuestions.length} Wrong)
                </span>
              </button>
            )}

            <button
              onClick={() => handleRestartSession(null)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Balanced Adaptive Sprint</span>
            </button>

            <button
              onClick={onNavigateToHistory}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#0078D4]" />
              <span>Full History</span>
            </button>

            <button
              onClick={onNavigateToPractice}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#0078D4] border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-3">Calibrating next adaptive question...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto min-w-0 space-y-6">
      {/* Real-time Adaptive Engine Radar Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-[#0078D4] to-sky-700 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-blue-400/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-amber-300">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight text-white">
                  Adaptive AI Question Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 shadow-2xs">
                  Active
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Questions dynamically target your lower confidence modules to maximize exam readiness.
              </p>
            </div>
          </div>

          {/* Sprint Progress */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-xs text-blue-200 block font-medium">Sprint Progress</span>
              <span className="text-lg font-black text-white">
                {sessionQuestionIndex + 1} <span className="text-xs font-normal text-blue-200">/ {SESSION_LENGTH}</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center font-bold text-xs text-white">
              {Math.round(((sessionQuestionIndex + 1) / SESSION_LENGTH) * 100)}%
            </div>
          </div>
        </div>

        {/* Dynamic Question Rationale + Rolling-Average Adaptive Difficulty & Path Focus Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-black/20 backdrop-blur-sm text-xs text-blue-50 border border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-medium truncate">{currentReason}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-white/15 border border-white/20 text-[11px] font-bold text-white flex items-center gap-1.5">
              <span>Difficulty:</span>
              <span className="text-amber-300 font-black">
                {rollingDifficulty === 'Fundamental'
                  ? 'Easy (Fundamental)'
                  : rollingDifficulty === 'Intermediate'
                  ? 'Medium (Intermediate)'
                  : 'Hard (Advanced)'}
              </span>
              <span className="text-[10px] text-sky-200">
                {rollingAvgPercent !== null
                  ? `• Rolling Avg ${rollingAvgPercent}%`
                  : '• Starts at Medium'}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setShowPathSelectorPanel((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition-colors cursor-pointer"
            >
              {confirmedPathFocus
                ? `Focus: Path ${confirmedPathFocus} (Change)`
                : 'Select Learning Path Focus'}
            </button>
          </div>
        </div>

        {/* Learning Path Focus Selector & Confirmation Panel inside Adaptive Quiz */}
        {showPathSelectorPanel && (
          <div className="p-4 rounded-xl bg-white text-slate-900 border border-blue-200 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0078D4]">
                  Select & Confirm AZ-900 Learning Path Focus
                </h4>
                <p className="text-[11px] text-slate-600">
                  Choose one of the 3 AZ-900 Learning Paths below and confirm to generate a focused 10-question adaptive sprint.
                </p>
              </div>
              {confirmedPathFocus !== null && (
                <button
                  type="button"
                  onClick={() => handleRestartSession(null, null)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                >
                  All 3 Paths (Balanced)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LEARNING_PATHS.map((path) => {
                const isSelected = pendingPathFocus === path.id;
                const shortTitle =
                  path.id === 1
                    ? 'Cloud Concepts'
                    : path.id === 2
                    ? 'Azure Architecture & Services'
                    : 'Management & Governance';
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setPendingPathFocus(path.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-[#0078D4] ring-2 ring-[#0078D4]/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black text-[#0078D4]">
                      <span>PATH {path.id}</span>
                      <span className="text-slate-500">{path.examWeight}</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">
                      {shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Selected Focus:{' '}
                <strong className="text-[#0078D4]">
                  {LEARNING_PATHS.find((p) => p.id === pendingPathFocus)?.title}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => handleRestartSession(null, pendingPathFocus)}
                className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Confirm Path {pendingPathFocus} & Generate Adaptive Questions</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Adaptive Quiz Card with subtle fade-in-up entrance animation */}
      <div
        key={`adaptive-card-${currentQuestion.id}`}
        className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-4 sm:p-6 lg:p-8 space-y-6 animate-quiz-card-fade-in-up"
      >
        {/* Module Header Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#0078D4] border border-blue-200">
              M{currentQuestion.moduleId}: {currentQuestion.moduleTitle}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                currentQuestion.difficulty === 'Fundamental'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : currentQuestion.difficulty === 'Intermediate'
                  ? 'bg-blue-50 text-[#0078D4] border-blue-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {currentQuestion.difficulty}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {currentQuestion.learningPathTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Domain Confidence:</span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                currentModuleConfidence >= 70
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {currentModuleConfidence}%
            </span>
          </div>
        </div>

        {/* Scenario description */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
            Business Scenario Context
          </span>
          <p className="text-sm text-slate-800 leading-relaxed font-normal">
            {currentQuestion.scenario}
          </p>
        </div>

        {/* Question Prompt */}
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options Grid */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.letter;
            const isCorrect = isAnswerSubmitted && option.letter === currentQuestion.correctAnswer;
            const isWrong = isAnswerSubmitted && isSelected && !isCorrect;

            let cardStyle = 'border-slate-200 hover:border-[#0078D4] hover:bg-blue-50/30';
            if (isSelected && !isAnswerSubmitted) {
              cardStyle = 'border-[#0078D4] bg-blue-50/60 ring-2 ring-[#0078D4]/20';
            } else if (isCorrect) {
              cardStyle = 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20';
            } else if (isWrong) {
              cardStyle = 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20';
            }

            return (
              <button
                key={option.letter}
                type="button"
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(option.letter)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${cardStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : isWrong
                      ? 'bg-rose-600 text-white'
                      : isSelected
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : isWrong ? <XCircle className="w-4 h-4" /> : option.letter}
                </div>

                <div className="grow">
                  <span className="text-xs sm:text-sm font-medium text-slate-800 block">
                    {option.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit or Next Question Action Button */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            {isAnswerSubmitted
              ? selectedAnswer === currentQuestion.correctAnswer
                ? '✓ Correct! Confidence boosted.'
                : '✕ Incorrect. Added to Review History.'
              : 'Select your answer based on Azure Curriculum standards.'}
          </span>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>{sessionQuestionIndex + 1 === SESSION_LENGTH ? 'Finish Sprint' : 'Next Adaptive Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Immediate Architectural Concept Feedback when answered */}
        {isAnswerSubmitted && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
              <Sparkles className="w-4 h-4 text-[#0078D4]" />
              <span>Azure Curriculum Architecture Breakdown</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {currentQuestion.whyCorrect}
            </p>

            {currentQuestion.examTip && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <span className="font-extrabold text-amber-950 shrink-0">💡 Exam Anchor:</span>
                <span>{currentQuestion.examTip}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
