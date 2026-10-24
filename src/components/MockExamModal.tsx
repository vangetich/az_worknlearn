import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  HelpCircle,
  BookOpen,
  Filter,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface MockExamProps {
  questions: Question[];
  onFinish: (score: number, total: number) => void;
  onClose: () => void;
  initialMode?: 'mini' | 'full';
}

export const MockExamModal: React.FC<MockExamProps> = ({
  questions,
  onFinish,
  onClose,
  initialMode = 'mini',
}) => {
  const [examMode, setExamMode] = useState<'mini' | 'full'>(initialMode);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'missed' | 'flagged'>('all');

  // Proportionally sampled questions across all 3 official learning paths
  const examQuestions = useMemo(() => {
    const p1 = questions.filter((q) => q.learningPathId === 1);
    const p2 = questions.filter((q) => q.learningPathId === 2);
    const p3 = questions.filter((q) => q.learningPathId === 3);

    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    if (examMode === 'mini') {
      // 15 questions: 4 from Path 1 (27%), 6 from Path 2 (40%), 5 from Path 3 (33%)
      const selectedP1 = shuffle(p1).slice(0, 4);
      const selectedP2 = shuffle(p2).slice(0, 6);
      const selectedP3 = shuffle(p3).slice(0, 5);
      return shuffle([...selectedP1, ...selectedP2, ...selectedP3]);
    } else {
      // 35 questions: 10 from Path 1 (28%), 14 from Path 2 (40%), 11 from Path 3 (32%)
      const selectedP1 = shuffle(p1).slice(0, 10);
      const selectedP2 = shuffle(p2).slice(0, 14);
      const selectedP3 = shuffle(p3).slice(0, 11);
      return shuffle([...selectedP1, ...selectedP2, ...selectedP3]);
    }
  }, [questions, examMode]);

  // Total duration in seconds: 20 min for Mini (1200s), 45 min for Full (2700s)
  const initialDuration = examMode === 'mini' ? 20 * 60 : 45 * 60;
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);

  // Reset timer if mode changes before starting
  useEffect(() => {
    if (!hasStarted) {
      setTimeLeft(examMode === 'mini' ? 20 * 60 : 45 * 60);
    }
  }, [examMode, hasStarted]);

  // Countdown timer
  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
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
  }, [hasStarted, isSubmitted]);

  const currentQ = examQuestions[currentIndex] || examQuestions[0];

  const handleSelectAnswer = (letter: string) => {
    if (isSubmitted || !currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: letter }));
  };

  const toggleFlag = (id: string) => {
    setFlagged((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    let correctCount = 0;
    examQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const scaledScore = Math.round((correctCount / examQuestions.length) * 1000);
    if (scaledScore >= 700) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
    onFinish(correctCount, examQuestions.length);
  };

  const handleRestart = () => {
    setAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setTimeLeft(examMode === 'mini' ? 20 * 60 : 45 * 60);
    setHasStarted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Results calculation
  const totalCorrect = examQuestions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const scaledScore = Math.round((totalCorrect / examQuestions.length) * 1000);
  const isPassed = scaledScore >= 700;

  // Breakdown by path
  const pathStats: Record<number, { correct: number; total: number; title: string; weight: string }> = {
    1: { correct: 0, total: 0, title: 'Describe Cloud Concepts', weight: '25-30%' },
    2: { correct: 0, total: 0, title: 'Describe Azure Architecture & Services', weight: '35-40%' },
    3: { correct: 0, total: 0, title: 'Describe Azure Management & Governance', weight: '30-35%' },
  };

  examQuestions.forEach((q) => {
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
        <KitengeRibbon height={4} />

        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Official Exam Simulation
                </span>
                <h2 className="font-bold text-base sm:text-lg">
                  AZ-900 Azure Fundamentals Mock Exam
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white">
                  {examMode === 'mini' ? 'Mini-Mock (15Q)' : 'Full Mock (35Q)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Passing Benchmark: 700 / 1000 scaled points • Balanced Across All 3 Learning Paths
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {hasStarted && !isSubmitted && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
                  timeLeft < 180
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
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
              title="Close Mock Exam"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: PRE-EXAM BRIEFING & MODE SELECTION */}
        {!hasStarted && !isSubmitted ? (
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center mx-auto shadow-2xs">
                <Award className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-block mb-2">
                  Official Exam Simulation
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  AZ-900 Azure Fundamentals Mock Exam
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Choose your exam length. Questions are randomly drawn in proportional exam weight ratios from all three learning paths:
              </p>
            </div>

            {/* Mode Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div
                onClick={() => setExamMode('mini')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  examMode === 'mini'
                    ? 'border-[#0078D4] bg-blue-50/60 ring-2 ring-[#0078D4]/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-[#0078D4]">
                      Fast Focused Session
                    </span>
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <h4 className="font-black text-base text-slate-900">Timed Mini-Mock Exam</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    15 questions drawn across all 3 learning paths. High-pressure, efficient practice session.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>⏱️ 20 Minutes</span>
                  <span>15 Questions</span>
                </div>
              </div>

              <div
                onClick={() => setExamMode('full')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  examMode === 'full'
                    ? 'border-[#0078D4] bg-blue-50/60 ring-2 ring-[#0078D4]/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700">
                      Complete Test Simulation
                    </span>
                    <Layers className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-black text-base text-slate-900">Full Mock Exam</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    35 questions simulating the actual testing center experience with extensive multi-domain testing.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>⏱️ 45 Minutes</span>
                  <span>35 Questions</span>
                </div>
              </div>
            </div>

            {/* Proportional Distribution Breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Exam Domain Proportions for {examMode === 'mini' ? 'Mini-Mock (15 Questions)' : 'Full Mock (35 Questions)'}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-[#0078D4] block">Path 1 (Concepts)</span>
                  <span className="text-slate-500 text-[11px]">{examMode === 'mini' ? '4 Questions (~27%)' : '10 Questions (~28%)'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-emerald-600 block">Path 2 (Architecture)</span>
                  <span className="text-slate-500 text-[11px]">{examMode === 'mini' ? '6 Questions (~40%)' : '14 Questions (~40%)'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-amber-600 block">Path 3 (Governance)</span>
                  <span className="text-slate-500 text-[11px]">{examMode === 'mini' ? '5 Questions (~33%)' : '11 Questions (~32%)'}</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setHasStarted(true)}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-extrabold text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-5 h-5 text-amber-300" />
                <span>Start {examMode === 'mini' ? 'Timed Mini-Mock Exam' : 'Full Mock Exam'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* VIEW 2: ACTIVE EXAM IN PROGRESS */}
        {hasStarted && !isSubmitted && currentQ ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Question Navigator Drawer */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-600">
                <span>
                  Question Palette ({Object.keys(answers).length}/{examQuestions.length} answered)
                </span>
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
                {examQuestions.map((q, idx) => {
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

            {/* Current Question Body */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question {currentIndex + 1} of {examQuestions.length} • Path {currentQ.learningPathId} (Module {currentQ.moduleId})
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
        ) : null}

        {/* VIEW 3: EXAM SCORE AND FEEDBACK REPORT */}
        {isSubmitted && (
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            <div
              className={`p-6 rounded-2xl border text-center ${
                isPassed
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              <div className="inline-flex p-3 rounded-full bg-white shadow-xs mb-3">
                {isPassed ? (
                  <Award className="w-10 h-10 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-rose-600" />
                )}
              </div>
              <h2 className="text-2xl font-black">
                {isPassed ? 'Congratulations! You Passed the Exam Simulation' : 'Exam Not Passed - Target Specific Domains'}
              </h2>
              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-4xl font-extrabold">{scaledScore}</span>
                <span className="text-base text-slate-500 font-semibold">/ 1000 pts</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Required passing benchmark: 700 pts (70%). You correctly answered {totalCorrect} out of {examQuestions.length} questions ({Math.round((totalCorrect / examQuestions.length) * 100)}%).
              </p>
            </div>

            {/* Domain Score Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Official Domain Performance Breakdown:
              </h4>

              {[1, 2, 3].map((pId) => {
                const stat = pathStats[pId];
                const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                return (
                  <div
                    key={pId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-500">Learning Path {pId} ({stat.weight})</span>
                      <h5 className="font-semibold text-slate-900 text-sm">{stat.title}</h5>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm w-16 text-right">
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Itemized Questions Review & Feedback Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#0078D4]" />
                  <h4 className="font-extrabold text-base text-slate-900">
                    Comprehensive Question &amp; Feedback Review
                  </h4>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      reviewFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({examQuestions.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('missed')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      reviewFilter === 'missed' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Missed ({examQuestions.length - totalCorrect})</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {examQuestions
                  .filter((q) => {
                    const isRight = answers[q.id] === q.correctAnswer;
                    if (reviewFilter === 'missed') return !isRight;
                    if (reviewFilter === 'flagged') return flagged[q.id];
                    return true;
                  })
                  .map((q, idx) => {
                    const userAns = answers[q.id];
                    const isRight = userAns === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-xl border space-y-3 ${
                          isRight
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            Path {q.learningPathId} • Module {q.moduleId} ({q.moduleTitle})
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-extrabold ${
                              isRight
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {isRight ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{isRight ? 'Correct' : `Your Answer: ${userAns || 'None'} (Correct: ${q.correctAnswer})`}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                          {q.scenario}
                        </p>

                        <h5 className="font-bold text-sm text-slate-900">
                          {q.question}
                        </h5>

                        {/* Why Correct Explanation */}
                        <div className="p-3 rounded-lg bg-emerald-100/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                          <span className="font-bold block">✓ Why Option {q.correctAnswer} is Correct:</span>
                          <p>{q.whyCorrect}</p>
                        </div>

                        {/* Exam Tip */}
                        {q.examTip && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Exam Tip:</strong> {q.examTip}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {hasStarted && !isSubmitted ? (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitExam}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-xs cursor-pointer"
                >
                  Submit Exam Now
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                  disabled={currentIndex === examQuestions.length - 1}
                  className="px-4 py-2 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </>
          ) : isSubmitted ? (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                onClick={handleRestart}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Exam</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
              >
                Close Report
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
