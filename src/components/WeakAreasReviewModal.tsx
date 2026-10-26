import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  Check,
  X,
  Target,
  Lightbulb,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import confetti from 'canvas-confetti';

interface WeakAreasReviewModalProps {
  stats: UserStats;
  allQuestions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onAnswerQuestion: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
}

export const WeakAreasReviewModal: React.FC<WeakAreasReviewModalProps> = ({
  stats,
  allQuestions,
  isOpen,
  onClose,
  onAnswerQuestion,
}) => {
  // 1. Identify skipped questions and lowest scoring modules
  const skippedIdsSet = useMemo(
    () => new Set(stats.skippedQuestionIds || []),
    [stats.skippedQuestionIds]
  );

  const targetQuestions = useMemo(() => {
    // Always prioritize questions explicitly skipped by the user for Weak Areas review
    const skippedQuestions = allQuestions.filter((q) =>
      (stats.skippedQuestionIds || []).includes(q.id)
    );

    // Module stats map
    const moduleScores: { moduleId: number; accuracy: number; total: number; mistakes: number }[] = [];

    // Check all 12 modules
    for (let mId = 1; mId <= 12; mId++) {
      const mm = stats.moduleMastery[mId];
      const mistakesCount = (stats.mistakesHistory || []).filter((m) => m.moduleId === mId).length;
      const skippedInMod = skippedQuestions.filter((q) => q.moduleId === mId).length;
      if (mm && mm.total > 0) {
        moduleScores.push({
          moduleId: mId,
          accuracy: Math.round((mm.correct / mm.total) * 100),
          total: mm.total,
          mistakes: mistakesCount + skippedInMod,
        });
      } else {
        // Untested module or module with mistakes/skips
        moduleScores.push({
          moduleId: mId,
          accuracy: 0,
          total: 0,
          mistakes: mistakesCount + skippedInMod,
        });
      }
    }

    // Sort by lowest accuracy first, then highest mistakes/skips
    moduleScores.sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.mistakes - a.mistakes;
    });

    // Pick top 3 weakest module IDs
    const weakModuleIds = moduleScores.slice(0, 3).map((m) => m.moduleId);

    // Pull remaining questions from these weak modules (excluding already-queued skipped questions)
    const skippedIdLookup = new Set(skippedQuestions.map((q) => q.id));
    const matching = allQuestions.filter(
      (q) => weakModuleIds.includes(q.moduleId) && !skippedIdLookup.has(q.id)
    );

    // Shuffle and combine with skipped questions at the front
    const shuffled = [...matching].sort(() => 0.5 - Math.random());
    const combined = [...skippedQuestions, ...shuffled];
    const count = Math.min(Math.max(5, Math.min(10, combined.length)), Math.max(10, skippedQuestions.length));
    return combined.slice(0, count);
  }, [stats, allQuestions]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [drillAnswers, setDrillAnswers] = useState<Record<string, { answer: string; isCorrect: boolean }>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Current question
  const currentQ = targetQuestions[currentIndex];

  const handleSelect = (letter: string) => {
    if (hasSubmitted || !currentQ) return;
    setSelectedAnswer(letter);
    setHasSubmitted(true);
    const isCorrect = letter === currentQ.correctAnswer;

    // Record answer
    setDrillAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { answer: letter, isCorrect },
    }));

    onAnswerQuestion(currentQ.id, letter, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < targetQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasSubmitted(false);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const correctCount = Object.values(drillAnswers).filter((a) => a.isCorrect).length;
  const accuracyScore = targetQuestions.length > 0 ? Math.round((correctCount / targetQuestions.length) * 100) : 0;

  if (!isOpen) return null;

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      ariaLabel="Weak Areas Review Drill"
    >
        <div className="shrink-0">
          <KitengeRibbon height={3} />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Weak Areas Review Drill
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                  Targeted Scenarios
                </span>
                {skippedIdsSet.size > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {skippedIdsSet.size} Skipped Queued
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Practice questions dynamically focused on your skipped questions & lowest-scoring modules
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!isCompleted && currentQ ? (
            <>
              {/* Question Progress & Module Tag */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700">
                    Question {currentIndex + 1} of {targetQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Module {currentQ.moduleId}: {currentQ.moduleTitle}
                  </span>
                  {skippedIdsSet.has(currentQ.id) && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                      Skipped for Review
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  Path {currentQ.learningPathId} · {currentQ.difficulty}
                </span>
              </div>

              {/* Scenario Context Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#0078D4]" />
                  <span>Real-World Architecture Scenario</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
                  {currentQ.scenario}
                </p>
              </div>

              {/* Question Text */}
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                {currentQ.question}
              </h4>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswer === opt.letter;
                  const isCorrectChoice = opt.letter === currentQ.correctAnswer;

                  let optStyles = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                  if (hasSubmitted) {
                    if (isCorrectChoice) {
                      optStyles = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-300';
                    } else if (isSelected) {
                      optStyles = 'bg-rose-50 border-rose-300 text-rose-950';
                    } else {
                      optStyles = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={hasSubmitted}
                      onClick={() => handleSelect(opt.letter)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optStyles}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                          hasSubmitted && isCorrectChoice
                            ? 'bg-emerald-600 text-white'
                            : hasSubmitted && isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.letter}
                      </span>
                      <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Post-Answer Comprehensive Feedback */}
              {hasSubmitted && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                      selectedAnswer === currentQ.correctAnswer
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {selectedAnswer === currentQ.correctAnswer ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Correct! You mastered this weak area scenario.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Incorrect. Review the detailed breakdown below.</span>
                      </>
                    )}
                  </div>

                  {/* Why it's right */}
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] block">
                      Why Option {currentQ.correctAnswer} Is Correct:
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed">{currentQ.whyCorrect}</p>
                  </div>

                  {/* Why others are wrong (Distractor breakdown) */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Why Other Options Are Wrong:
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      {currentQ.distractorBreakdown.map((item) => (
                        <div key={item.letter} className="flex items-start gap-1.5">
                          <strong className="text-slate-800 shrink-0">Option {item.letter}:</strong>
                          <span>{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exam Anchor Tip */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-amber-900 block">Official Exam Anchor:</strong>
                      <p className="italic mt-0.5">{currentQ.examTip}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : isCompleted ? (
            /* Completed Screen */
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">
                  Weak Areas Review Complete!
                </h3>
                <p className="text-xs text-slate-500">
                  You drilled targeted scenarios across your lowest-scoring modules
                </p>
              </div>

              {/* Score Card */}
              <div className="max-w-xs mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 block">Drill Accuracy</span>
                <span className="text-4xl font-black text-[#0078D4] block">{accuracyScore}%</span>
                <span className="text-xs font-bold text-slate-700">
                  {correctCount} of {targetQuestions.length} correct
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Return to Practice Studio
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer Navigation */}
        {!isCompleted && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              Score: {correctCount} / {targetQuestions.length}
            </span>

            {hasSubmitted && (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <span>{currentIndex < targetQuestions.length - 1 ? 'Next Question' : 'View Summary'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
    </ResponsiveModalContainer>
  );
};
