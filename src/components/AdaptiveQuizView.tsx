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
}

export const AdaptiveQuizView: React.FC<AdaptiveQuizViewProps> = ({
  questions,
  stats,
  onUpdateStats,
  onNavigateToHistory,
  onNavigateToPractice,
}) => {
  const SESSION_LENGTH = 10;

  // Active question index in session
  const [sessionQuestionIndex, setSessionQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [sessionMissedQuestions, setSessionMissedQuestions] = useState<QuizSessionMissedQuestion[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());

  // Current session questions list generated adaptively
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [adaptiveReasons, setAdaptiveReasons] = useState<string[]>([]);

  // Function to adaptively pick the next best question
  const pickNextAdaptiveQuestion = (
    currentUsed: Set<string>,
    currentStats: UserStats
  ): { question: Question; reason: string } | null => {
    // 1. Calculate confidence for each of the 12 modules
    const moduleConfidenceMap: Record<number, number> = {};
    const strugglingModules: number[] = [];
    const intermediateModules: number[] = [];
    const masteredModules: number[] = [];

    LEARNING_PATHS.forEach((path) => {
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

    // 2. Adaptive weighting: 65% struggling, 25% intermediate, 10% mastered
    const roll = Math.random();
    let targetPool: number[] = [];
    let priorityLabel = '';

    if (roll < 0.65 && strugglingModules.length > 0) {
      targetPool = strugglingModules;
      priorityLabel = 'High Focus (Struggling/Unattempted Area)';
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

    // Pick random module from targetPool
    const targetModuleId = targetPool[Math.floor(Math.random() * targetPool.length)];

    // Filter available unused questions in this module
    let availableQuestions = questions.filter(
      (q) => q.moduleId === targetModuleId && !currentUsed.has(q.id)
    );

    // Fallback: any unused question if module pool exhausted
    if (availableQuestions.length === 0) {
      availableQuestions = questions.filter((q) => !currentUsed.has(q.id));
    }

    if (availableQuestions.length === 0) {
      // If all questions used, allow reuse
      availableQuestions = questions;
    }

    const selected = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const currentModConf = moduleConfidenceMap[selected.moduleId] ?? 0;
    const reasonText = `Targeting M${selected.moduleId}: ${selected.moduleTitle} (Confidence: ${currentModConf}% • ${priorityLabel})`;

    return { question: selected, reason: reasonText };
  };

  // Initialize first question on mount
  useEffect(() => {
    if (sessionQuestions.length === 0 && questions.length > 0) {
      const firstPick = pickNextAdaptiveQuestion(usedQuestionIds, stats);
      if (firstPick) {
        setSessionQuestions([firstPick.question]);
        setAdaptiveReasons([firstPick.reason]);
        setUsedQuestionIds(new Set([firstPick.question.id]));
      }
    }
  }, [questions, stats]);

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

    // Pick next adaptive question with updated stats
    const nextPick = pickNextAdaptiveQuestion(usedQuestionIds, stats);
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

  const handleRestartSession = () => {
    setSessionQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setSessionCorrectCount(0);
    setSessionMissedQuestions([]);
    setIsSessionComplete(false);
    setSessionQuestions([]);
    setAdaptiveReasons([]);
    setUsedQuestionIds(new Set());
  };

  // If session is complete, display results and review prompt
  if (isSessionComplete) {
    const scorePercent = Math.round((sessionCorrectCount / SESSION_LENGTH) * 100);
    const passed = scorePercent >= 70;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8 text-center space-y-6">
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
              {passed ? '🎉 Passed Benchmark (70%+)' : 'Needs Weakness Review'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Adaptive Sprint Complete!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your domain confidence was updated in real time. Session results and missed question breakdowns have been archived in your Review History.
            </p>
          </div>

          {/* Score Stats Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Score</span>
              <span className="text-3xl font-black text-[#0078D4] mt-1 block">{scorePercent}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Correct</span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">
                {sessionCorrectCount} / {SESSION_LENGTH}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Missed</span>
              <span className="text-3xl font-black text-rose-600 mt-1 block">
                {sessionMissedQuestions.length}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToHistory}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0078D4] hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Review Missed in History Tab</span>
            </button>

            <button
              onClick={handleRestartSession}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Another Adaptive Sprint</span>
            </button>

            <button
              onClick={onNavigateToPractice}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Back to Practice Modules
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Real-time Adaptive Engine Radar Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-[#0078D4] to-sky-700 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-400/30 space-y-3">
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

        {/* Dynamic Question Rationale Banner */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/20 backdrop-blur-sm text-xs text-blue-50 border border-white/10">
          <Target className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-medium truncate">{currentReason}</span>
        </div>
      </div>

      {/* Main Adaptive Quiz Card */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Module Header Tag */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#0078D4] border border-blue-200">
              M{currentQuestion.moduleId}: {currentQuestion.moduleTitle}
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
