import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  Zap,
  X,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface MicroDrillProps {
  questions: Question[];
  targetModuleName: string;
  onAnswer: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export const MicroDrillModal: React.FC<MicroDrillProps> = ({
  questions,
  targetModuleName,
  onAnswer,
  onClose,
}) => {
  // Take up to 3 questions for a bite-sized micro-drill
  const drillQuestions = questions.slice(0, 3);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentQ = drillQuestions[currentIndex];

  const handleSelect = (letter: string) => {
    if (hasSubmitted) return;
    setSelectedAnswer(letter);
    setHasSubmitted(true);
    const isCorrect = letter === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
    onAnswer(currentQ.id, letter, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < drillQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasSubmitted(false);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const isSelectedCorrect = selectedAnswer === currentQ?.correctAnswer;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 card-elevation overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <KitengeRibbon height={4} />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Zap className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg">
                  3-Question Rapid Micro-Drill
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                  Quick Burst
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Targeting: {targetModuleName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!isFinished && currentQ ? (
          <div className="p-6 space-y-5">
            {/* Progress indicators */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Question {currentIndex + 1} of {drillQuestions.length}</span>
              <div className="flex items-center gap-1.5">
                {drillQuestions.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i === currentIndex
                        ? 'bg-amber-500 ring-2 ring-amber-200'
                        : i < currentIndex
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scenario snippet */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block mb-1">Scenario:</strong>
              {currentQ.scenario}
            </div>

            {/* Question */}
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              {currentQ.question}
            </h4>

            {/* Choices */}
            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswer === opt.letter;
                const isCorrect = opt.letter === currentQ.correctAnswer;

                let btnStyles = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
                if (hasSubmitted) {
                  if (isCorrect) {
                    btnStyles = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrect) {
                    btnStyles = 'bg-red-50 border-red-400 text-red-950 ring-1 ring-red-400';
                  } else {
                    btnStyles = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.letter}
                    onClick={() => handleSelect(opt.letter)}
                    disabled={hasSubmitted}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-all ${btnStyles}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border ${
                        hasSubmitted && isCorrect
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : hasSubmitted && isSelected && !isCorrect
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt.letter}
                    </span>
                    <span className="leading-snug">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant mini corrective feedback */}
            {hasSubmitted && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                  isSelectedCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {isSelectedCorrect ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {isSelectedCorrect
                      ? 'Correct! Quick mastery point gained.'
                      : `Correct Answer is ${currentQ.correctAnswer}`}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">
                  {currentQ.whyCorrect}
                </p>
                <div className="pt-1 text-amber-900 font-semibold flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Exam Tip: {currentQ.examTip}</span>
                </div>
              </div>
            )}

            {/* Next or Finish Button */}
            {hasSubmitted && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>{currentIndex < drillQuestions.length - 1 ? 'Next Question' : 'Complete Micro-Drill'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Finished summary */
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Micro-Drill Completed!
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                You scored {score} of {drillQuestions.length} Correct
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-1">
                Bite-sized practice locks in key concepts without study burnout. Keep building your streak!
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
              >
                Continue Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
