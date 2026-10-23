import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Bookmark,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Info,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface QuizCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onBookmark: (questionId: string) => void;
  isBookmarked: boolean;
  onAskTutorAboutQuestion?: (question: Question) => void;
  stats?: UserStats;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onNext,
  onPrev,
  onBookmark,
  isBookmarked,
  onAskTutorAboutQuestion,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  // Reset when question changes
  React.useEffect(() => {
    setSelectedOption(null);
    setHasSubmitted(false);
  }, [question.id]);

  const handleSelect = (letter: string) => {
    if (hasSubmitted) return;
    setSelectedOption(letter);
    setHasSubmitted(true);
    const isCorrect = letter === question.correctAnswer;
    onAnswer(question.id, letter, isCorrect);
  };

  const isAnswered = hasSubmitted && selectedOption !== null;
  const isSelectedCorrect = selectedOption === question.correctAnswer;

  // Path styling tags
  const pathColor =
    question.learningPathId === 1
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : question.learningPathId === 2
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : 'border-orange-200 bg-orange-50 text-orange-800';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 card-elevation overflow-hidden transition-all">
      {/* Top Motif Header Bar */}
      <div className="relative px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Learning Path & Module Badges */}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${pathColor}`}
          >
            Path {question.learningPathId}: Module {question.moduleId}
          </span>
          <span className="text-xs font-medium text-slate-600 hidden sm:inline">
            {question.moduleTitle}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
              question.difficulty === 'Fundamental'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : question.difficulty === 'Intermediate'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}
          >
            {question.difficulty}
          </span>
          {question.isAiGenerated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-600" />
              AI Scenario
            </span>
          )}
        </div>

        {/* Counter and Bookmark */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <button
            onClick={() => onBookmark(question.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isBookmarked
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-400 hover:text-amber-600 border-slate-200'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for revision'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Scenario Narrative Box */}
        <div className="relative bg-slate-50/80 rounded-xl p-5 border-l-4 border-[#0078D4] border-t border-r border-b border-slate-200/60 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100/70 text-[#0078D4] shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-blue-900 mb-1.5">
                Scenario Context
              </h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
                {question.scenario}
              </p>
            </div>
          </div>
        </div>

        {/* Actual Exam Question */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {question.question}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose the single best answer that meets all architectural criteria:
          </p>
        </div>

        {/* 4 Choices (A, B, C, D) */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.letter;
            const isCorrectOption = option.letter === question.correctAnswer;

            let cardStyles =
              'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800';
            let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';

            if (isAnswered) {
              if (isCorrectOption) {
                cardStyles =
                  'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20';
                badgeStyles = 'bg-emerald-600 text-white border-emerald-600';
              } else if (isSelected && !isCorrectOption) {
                cardStyles =
                  'border-red-400 bg-red-50/80 text-red-950 ring-2 ring-red-400/20';
                badgeStyles = 'bg-red-600 text-white border-red-600';
              } else {
                cardStyles = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60';
                badgeStyles = 'bg-slate-200 text-slate-400 border-slate-300';
              }
            } else if (isSelected) {
              cardStyles =
                'border-[#0078D4] bg-blue-50/70 text-blue-900 ring-2 ring-[#0078D4]/20';
              badgeStyles = 'bg-[#0078D4] text-white border-[#0078D4]';
            }

            return (
              <button
                key={option.letter}
                onClick={() => handleSelect(option.letter)}
                disabled={hasSubmitted}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group ${cardStyles}`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${badgeStyles}`}
                >
                  {isAnswered && isCorrectOption ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isAnswered && isSelected && !isCorrectOption ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    option.letter
                  )}
                </span>
                <span className="text-sm sm:text-base font-medium pt-1 grow leading-relaxed">
                  {option.text}
                </span>

                {isAnswered && isCorrectOption && (
                  <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md self-center">
                    Correct Answer
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* INSTANT FEEDBACK & BREAKDOWN ENGINE */}
        {isAnswered && (
          <div className="mt-8 space-y-5 animate-feedback-entrance">
            {/* Status Header Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-cascade-1 ${
                isSelectedCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isSelectedCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-base">
                    {isSelectedCorrect
                      ? 'Spot On! Correct Choice.'
                      : `Not Quite. The correct answer is ${question.correctAnswer}`}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Review the official Microsoft architecture breakdown below:
                  </p>
                </div>
              </div>

              {onAskTutorAboutQuestion && (
                <button
                  onClick={() => onAskTutorAboutQuestion(question)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ask AI Tutor</span>
                </button>
              )}
            </div>

            {/* If Incorrect: Targeted Diagnostic Analysis */}
            {!isSelectedCorrect && selectedOption && (
              <div className="bg-red-50/70 rounded-xl p-5 border border-red-200 space-y-2.5 animate-cascade-2">
                <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    !
                  </span>
                  <span>Diagnostic Breakdown: Where & Why You Stumbled</span>
                </div>
                <div className="text-xs sm:text-sm text-red-950 bg-white/80 p-3.5 rounded-lg border border-red-200/60 leading-relaxed">
                  <span className="font-bold text-red-700 block mb-1">
                    Your Selection: Option {selectedOption}
                  </span>
                  {question.distractorBreakdown.find((d) => d.letter === selectedOption)?.reason ||
                    'This option does not satisfy all architectural constraints in the scenario.'}
                </div>
                <div className="text-xs text-red-800 flex items-center gap-1.5 pt-1 font-medium">
                  <span className="font-bold">Corrective Prescription:</span>
                  <span>Review the constraints in the scenario carefully before deciding between IaaS, PaaS, or SaaS boundaries.</span>
                </div>
              </div>
            )}

            {/* Why It's Correct */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200 animate-cascade-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Why Option {question.correctAnswer} is Correct:</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {question.whyCorrect}
              </p>
            </div>

            {/* Why Other Options Are Incorrect (Distractor Breakdown) */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 animate-cascade-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
                <XCircle className="w-4 h-4 text-slate-500" />
                <span>Why Other Options Are Incorrect (Exam Distractors):</span>
              </div>

              <div className="space-y-2.5">
                {question.distractorBreakdown.map((distractor) => (
                  <div
                    key={distractor.letter}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 p-2.5 rounded-lg bg-white border border-slate-200/70"
                  >
                    <span className="font-bold text-red-600 shrink-0 px-1.5 py-0.5 bg-red-50 rounded border border-red-200 text-xs">
                      Option {distractor.letter}
                    </span>
                    <p className="leading-relaxed font-normal">{distractor.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Tip Card - Savannah Gold / Warm Ochre */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-50/80 to-yellow-50 rounded-xl p-5 border border-amber-300/80 shadow-xs animate-cascade-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-xs tracking-wider uppercase text-amber-900">
                      💡 Exam Anchor Tip
                    </h5>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                      High Yield
                    </span>
                  </div>
                  <p className="text-amber-950 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                    {question.examTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={questionIndex === 0}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {isAnswered && (
              <button
                onClick={() => {
                  setSelectedOption(null);
                  setHasSubmitted(false);
                }}
                className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Retry this question"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}

            <button
              onClick={onNext}
              disabled={questionIndex === totalQuestions - 1}
              className="px-5 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-sm font-semibold flex items-center gap-2 shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
