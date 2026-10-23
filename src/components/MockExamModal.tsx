import React, { useState, useEffect } from 'react';
import {
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface MockExamProps {
  questions: Question[];
  onFinish: (score: number, total: number) => void;
  onClose: () => void;
}

export const MockExamModal: React.FC<MockExamProps> = ({
  questions,
  onFinish,
  onClose,
}) => {
  // 45 minutes = 2700 seconds
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (letter: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: letter }));
  };

  const toggleFlag = (id: string) => {
    setFlagged((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const scaledScore = Math.round((correctCount / questions.length) * 1000);
    if (scaledScore >= 700) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    onFinish(correctCount, questions.length);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Results calculation
  const totalCorrect = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const scaledScore = Math.round((totalCorrect / questions.length) * 1000);
  const isPassed = scaledScore >= 700;

  // Breakdown by path
  const pathStats: Record<number, { correct: number; total: number; title: string }> = {
    1: { correct: 0, total: 0, title: 'Describe Cloud Concepts' },
    2: { correct: 0, total: 0, title: 'Describe Azure Architecture & Services' },
    3: { correct: 0, total: 0, title: 'Describe Azure Management & Governance' },
  };

  questions.forEach((q) => {
    const p = pathStats[q.learningPathId];
    if (p) {
      p.total += 1;
      if (answers[q.id] === q.correctAnswer) {
        p.correct += 1;
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 card-elevation overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top African Motif */}
        <KitengeRibbon height={5} />

        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                AZ-900 Microsoft Azure Fundamentals Mock Exam
              </h2>
              <p className="text-xs text-slate-400">
                Passing Score: 700 / 1000 • Official Microsoft Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isSubmitted && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm ${
                  timeLeft < 300
                    ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-amber-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{timeFormatted}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {!isSubmitted ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Question Navigator Drawer */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-600">
                <span>Question Palette ({Object.keys(answers).length}/{questions.length} answered)</span>
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4]" /> Answered
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Flagged
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCur = idx === currentIndex;
                  const isFlag = flagged[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        isCur
                          ? 'ring-2 ring-slate-900 bg-slate-900 text-white'
                          : isFlag
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isAnswered
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question {currentIndex + 1} of {questions.length} • Path {currentQ.learningPathId} (Module {currentQ.moduleId})
                </span>

                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    flagged[currentQ.id]
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}</span>
                </button>
              </div>

              {/* Scenario Box */}
              <div className="bg-slate-50 border-l-4 border-[#0078D4] p-4 rounded-r-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                {currentQ.scenario}
              </div>

              <h3 className="font-bold text-base text-slate-900">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      onClick={() => handleSelectAnswer(opt.letter)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'border-[#0078D4] bg-blue-50/70 text-blue-900 ring-2 ring-[#0078D4]/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                          isSelected
                            ? 'bg-[#0078D4] text-white border-[#0078D4]'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {opt.letter}
                      </span>
                      <span className="text-sm font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* EXAM SCORE REPORT */
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            <div
              className={`p-6 rounded-2xl border text-center ${
                isPassed
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-red-50/70 border-red-300 text-red-950'
              }`}
            >
              <div className="inline-flex p-3 rounded-full bg-white shadow-xs mb-3">
                {isPassed ? (
                  <Award className="w-10 h-10 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                )}
              </div>
              <h2 className="text-2xl font-black">
                {isPassed ? 'Congratulations! You Passed the Mock Exam' : 'Exam Not Passed - Keep Practicing!'}
              </h2>
              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-4xl font-extrabold">{scaledScore}</span>
                <span className="text-base text-slate-500 font-semibold">/ 1000 pts</span>
              </div>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Required passing score: 700. You correctly answered {totalCorrect} out of {questions.length} questions ({Math.round((totalCorrect / questions.length) * 100)}%).
              </p>
            </div>

            {/* Domain Score Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Domain Score Breakdown:
              </h4>

              {[1, 2, 3].map((pId) => {
                const stat = pathStats[pId];
                const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                return (
                  <div
                    key={pId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-500">Learning Path {pId}</span>
                      <h5 className="font-semibold text-slate-900 text-sm">{stat.title}</h5>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm w-12 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white disabled:opacity-40"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitExam}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-xs"
                >
                  Submit Exam Now
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-sm font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold"
              >
                Close Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
