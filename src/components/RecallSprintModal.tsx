import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Timer,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { KitengeRibbon } from './MotifDecorations';

export interface RecallSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onCompleteSprint?: (correctCount: number, totalQuestions: number) => void;
}

const QUESTION_TIME_LIMIT_SECONDS = 30;

export const RecallSprintModal: React.FC<RecallSprintModalProps> = ({
  isOpen,
  onClose,
  questions,
  onCompleteSprint,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(QUESTION_TIME_LIMIT_SECONDS);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [totalTimeSpentSeconds, setTotalTimeSpentSeconds] = useState<number>(0);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset sprint state when opened with fresh questions
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSecondsLeft(QUESTION_TIME_LIMIT_SECONDS);
      setSelectedOption(null);
      setHasSubmitted(false);
      setCorrectCount(0);
      setIsCompleted(false);
      setTotalTimeSpentSeconds(0);
    }
  }, [isOpen, questions]);

  // Countdown timer for active question
  useEffect(() => {
    if (!isOpen || isCompleted || hasSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this question
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isCompleted, hasSubmitted]);

  const handleTimeExpired = () => {
    setHasSubmitted(true);
    // Unanswered / timed out counts as incorrect
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (letter: string) => {
    if (hasSubmitted || isCompleted || !currentQ) return;

    setSelectedOption(letter);
    setHasSubmitted(true);
    if (letter === currentQ.correctAnswer) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
      setSecondsLeft(QUESTION_TIME_LIMIT_SECONDS);
    } else {
      setIsCompleted(true);
      if (onCompleteSprint) {
        onCompleteSprint(
          selectedOption === currentQ?.correctAnswer ? correctCount + 1 : correctCount,
          questions.length
        );
      }
    }
  };

  if (!isOpen || questions.length === 0 || typeof document === 'undefined') return null;

  const timerPercent = (secondsLeft / QUESTION_TIME_LIMIT_SECONDS) * 100;
  const timerColor =
    secondsLeft > 15 ? 'text-emerald-500 stroke-emerald-500' : secondsLeft > 7 ? 'text-amber-500 stroke-amber-500' : 'text-rose-500 stroke-rose-500';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="30-Second Recall Sprint"
      data-testid="recall-sprint-modal"
      className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-[min(36rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-2rem)] my-auto rounded-3xl border-2 border-amber-400 dark:border-amber-600 shadow-2xl overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-200 text-left">
        {/* Top Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-5">
          <div className="absolute top-0 left-0 right-0">
            <KitengeRibbon height={3} />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
                <Flame className="w-6 h-6 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    ⚡ 30-Second Recall Sprint
                  </span>
                  <span className="text-xs text-amber-200 font-bold">Low Confidence Set</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {isCompleted
                    ? 'Sprint Complete!'
                    : `Recall Sprint: Question ${currentIndex + 1} of ${questions.length}`}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              title="Close Sprint (Esc)"
              aria-label="Close Recall Sprint"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sprint Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {isCompleted ? (
            /* Sprint Consolidation Scorecard */
            <div className="text-center space-y-5 py-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl">
                <Award className="w-10 h-10 fill-slate-950" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                  Memory Consolidation Complete!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  You drilled your lowest-confidence Azure questions under high-intensity 30-second recall pressure.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Correct</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {correctCount} / {questions.length}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Accuracy</span>
                  <p className="text-lg font-black text-[#0078D4] dark:text-sky-400">
                    {Math.round((correctCount / questions.length) * 100)}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Points</span>
                  <p className="text-lg font-black text-amber-500">
                    +{correctCount * 120} pts
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setSecondsLeft(QUESTION_TIME_LIMIT_SECONDS);
                    setSelectedOption(null);
                    setHasSubmitted(false);
                    setCorrectCount(0);
                    setIsCompleted(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Drill Again</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Return to Main Quiz Flow
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Drill View */
            <div className="space-y-4">
              {/* Question Metadata & 30s Countdown Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Module {currentQ.moduleId}: {currentQ.moduleTitle}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {currentQ.difficulty}
                  </span>
                </div>

                {/* 30-Second Countdown Timer Widget */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <Timer className={`w-4 h-4 ${timerColor} ${secondsLeft <= 5 ? 'animate-pulse' : ''}`} />
                  <span className={`text-xs font-mono font-black ${timerColor}`}>
                    {secondsLeft}s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    secondsLeft > 15
                      ? 'bg-emerald-500'
                      : secondsLeft > 7
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>

              {/* Scenario & Question */}
              <div className="space-y-1.5">
                {currentQ.scenario && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                    {currentQ.scenario}
                  </p>
                )}
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                  {currentQ.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOption === opt.letter;
                  const isCorrect = opt.letter === currentQ.correctAnswer;

                  let optClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#0078D4] text-slate-800 dark:text-slate-200';
                  if (hasSubmitted) {
                    if (isCorrect) {
                      optClass = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30';
                    } else if (isSelected) {
                      optClass = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/30';
                    } else {
                      optClass = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={hasSubmitted}
                      onClick={() => handleSelectOption(opt.letter)}
                      className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition-all cursor-pointer text-left ${optClass}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            hasSubmitted && isCorrect
                              ? 'bg-emerald-600 text-white'
                              : hasSubmitted && isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {opt.letter}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>

                      {hasSubmitted && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {hasSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Feedback Box upon Answering */}
              {hasSubmitted && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150 text-xs">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-slate-900 dark:text-white">
                        Why Option {currentQ.correctAnswer} is Correct:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {currentQ.whyCorrect}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-2"
                  >
                    <span>
                      {currentIndex + 1 < questions.length
                        ? 'Next Sprint Question (30s)'
                        : 'View Sprint Scorecard'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
