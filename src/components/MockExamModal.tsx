import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  RotateCcw,
  X,
  Sparkles,
  Layers,
  BookOpen,
  Zap,
  Target,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

export type MockExamModeType = 'simulation' | 'full' | 'mini';

interface MockExamProps {
  questions: Question[];
  onFinish: (score: number, total: number) => void;
  onClose: () => void;
  initialMode?: MockExamModeType;
  onLaunchAdaptiveForPath?: (pathId: 1 | 2 | 3) => void;
  onOpenStudyPlanner?: () => void;
}

export const MockExamModal: React.FC<MockExamProps> = ({
  questions,
  onFinish,
  onClose,
  initialMode = 'simulation',
  onLaunchAdaptiveForPath,
  onOpenStudyPlanner,
}) => {
  const [examMode, setExamMode] = useState<MockExamModeType>(initialMode);
  const [simulationQuestionCount, setSimulationQuestionCount] = useState<50 | 55 | 60>(55);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [autoSubmittedByTimer, setAutoSubmittedByTimer] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'missed' | 'flagged' | 'p1' | 'p2' | 'p3'>('all');
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');

  const answersRef = useRef<Record<string, string>>(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Proportionally sampled questions across all 3 official learning paths
  // If the question bank has fewer than the requested count in a path, we cycle/synthesize variants cleanly so 50-60 questions are always presented
  const examQuestions = useMemo(() => {
    const p1 = questions.filter((q) => q.learningPathId === 1);
    const p2 = questions.filter((q) => q.learningPathId === 2);
    const p3 = questions.filter((q) => q.learningPathId === 3);

    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const takeFromPool = (pool: Question[], count: number, prefix: string): Question[] => {
      if (pool.length === 0) return [];
      const shuffled = shuffle(pool);
      if (shuffled.length >= count) {
        return shuffled.slice(0, count);
      }
      const result: Question[] = [...shuffled];
      let idx = 0;
      while (result.length < count) {
        const base = shuffled[idx % shuffled.length];
        result.push({
          ...base,
          id: `${base.id}-${prefix}-${result.length + 1}`,
        });
        idx++;
      }
      return result;
    };

    if (examMode === 'mini') {
      // 15 questions: 4 from Path 1 (27%), 6 from Path 2 (40%), 5 from Path 3 (33%)
      const selectedP1 = takeFromPool(p1, 4, 'mini-p1');
      const selectedP2 = takeFromPool(p2, 6, 'mini-p2');
      const selectedP3 = takeFromPool(p3, 5, 'mini-p3');
      return shuffle([...selectedP1, ...selectedP2, ...selectedP3]);
    } else if (examMode === 'full') {
      // 35 questions: 10 from Path 1 (28%), 14 from Path 2 (40%), 11 from Path 3 (32%)
      const selectedP1 = takeFromPool(p1, 10, 'full-p1');
      const selectedP2 = takeFromPool(p2, 14, 'full-p2');
      const selectedP3 = takeFromPool(p3, 11, 'full-p3');
      return shuffle([...selectedP1, ...selectedP2, ...selectedP3]);
    } else {
      // Official Exam Simulation: 50, 55, or 60 questions covering all learning paths
      // Path 1 (25-30% -> ~27%), Path 2 (35-40% -> ~40%), Path 3 (30-35% -> ~33%)
      const totalTarget = simulationQuestionCount;
      const countP1 = Math.round(totalTarget * 0.27); // 14 (for 50), 15 (for 55), 16 (for 60)
      const countP2 = Math.round(totalTarget * 0.40); // 20 (for 50), 22 (for 55), 24 (for 60)
      const countP3 = totalTarget - countP1 - countP2; // 16 (for 50), 18 (for 55), 20 (for 60)

      const selectedP1 = takeFromPool(p1, countP1, 'sim-p1');
      const selectedP2 = takeFromPool(p2, countP2, 'sim-p2');
      const selectedP3 = takeFromPool(p3, countP3, 'sim-p3');
      return shuffle([...selectedP1, ...selectedP2, ...selectedP3]);
    }
  }, [questions, examMode, simulationQuestionCount]);

  // Total duration in seconds: 60 min for Official Simulation (50-60Q), 45 min for Full (35Q), 20 min for Mini (15Q)
  const initialDuration =
    examMode === 'simulation' ? 60 * 60 : examMode === 'full' ? 45 * 60 : 20 * 60;
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);

  // Reset timer if mode changes before starting
  useEffect(() => {
    if (!hasStarted) {
      setTimeLeft(
        examMode === 'simulation' ? 60 * 60 : examMode === 'full' ? 45 * 60 : 20 * 60
      );
    }
  }, [examMode, simulationQuestionCount, hasStarted]);

  const handleSubmitAndFinalize = useCallback(
    (triggeredByTimer = false) => {
      if (isSubmitted) return;
      setIsSubmitted(true);
      if (triggeredByTimer) {
        setAutoSubmittedByTimer(true);
      }

      const latestAnswers = answersRef.current;
      let correctCount = 0;
      examQuestions.forEach((q) => {
        if (latestAnswers[q.id] === q.correctAnswer) {
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
        } catch {
          // Safe fallback
        }
      }
      onFinish(correctCount, examQuestions.length);
    },
    [isSubmitted, examQuestions, onFinish]
  );

  const submitRef = useRef(handleSubmitAndFinalize);
  useEffect(() => {
    submitRef.current = handleSubmitAndFinalize;
  }, [handleSubmitAndFinalize]);

  // Countdown timer tick
  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitRef.current(true);
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

  const handleRestart = () => {
    setAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setAutoSubmittedByTimer(false);
    setTimeLeft(
      examMode === 'simulation' ? 60 * 60 : examMode === 'full' ? 45 * 60 : 20 * 60
    );
    setHasStarted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
  const timeRemainingPct = Math.max(
    0,
    Math.min(100, Math.round((timeLeft / initialDuration) * 100))
  );
  const elapsedSeconds = Math.max(0, initialDuration - timeLeft);
  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;

  const isCriticalTime = timeLeft <= 180;
  const isWarningTime = timeLeft > 180 && timeLeft <= 300;

  // Results calculation
  const totalCorrect = examQuestions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const scaledScore = Math.round((totalCorrect / Math.max(1, examQuestions.length)) * 1000);
  const isPassed = scaledScore >= 700;

  // Detailed Breakdown by Learning Path AND by Module
  const pathStats = useMemo(() => {
    const map: Record<
      1 | 2 | 3,
      {
        correct: number;
        total: number;
        title: string;
        weight: string;
        modules: Record<number, { title: string; correct: number; total: number }>;
      }
    > = {
      1: {
        correct: 0,
        total: 0,
        title: 'Describe Cloud Concepts',
        weight: '25–30%',
        modules: {},
      },
      2: {
        correct: 0,
        total: 0,
        title: 'Describe Azure Architecture & Services',
        weight: '35–40%',
        modules: {},
      },
      3: {
        correct: 0,
        total: 0,
        title: 'Describe Azure Management & Governance',
        weight: '30–35%',
        modules: {},
      },
    };

    LEARNING_PATHS.forEach((lp) => {
      lp.modules.forEach((m) => {
        map[lp.id].modules[m.id] = { title: m.title, correct: 0, total: 0 };
      });
    });

    examQuestions.forEach((q) => {
      const p = map[q.learningPathId];
      if (p) {
        p.total += 1;
        const isRight = answers[q.id] === q.correctAnswer;
        if (isRight) {
          p.correct += 1;
        }
        if (!p.modules[q.moduleId]) {
          p.modules[q.moduleId] = { title: q.moduleTitle, correct: 0, total: 0 };
        }
        p.modules[q.moduleId].total += 1;
        if (isRight) {
          p.modules[q.moduleId].correct += 1;
        }
      }
    });

    return map;
  }, [examQuestions, answers]);

  return (
    <ResponsiveModalContainer
      isOpen={true}
      onClose={onClose}
      maxWidth="5xl"
      closeOnEscape={false}
      ariaLabel="AZ-900 Azure Fundamentals Mock Exam Simulation"
    >
      <div className="shrink-0">
        <KitengeRibbon height={4} />
      </div>

      {/* Header Bar */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 shrink-0">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Official Exam Simulation
              </span>
              <h2 className="font-bold text-sm sm:text-lg truncate">
                AZ-900 Mock Exam Simulation
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white">
                {examMode === 'simulation'
                  ? `Official Simulation (${simulationQuestionCount}Q • 60m)`
                  : examMode === 'full'
                  ? 'Standard Mock (35Q • 45m)'
                  : 'Mini-Mock (15Q • 20m)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Passing Score: 700 / 1000 Scaled Points • All 3 Official AZ-900 Learning Paths
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isSubmitted && (
            <div
              role="timer"
              aria-live="polite"
              aria-label={`Remaining Exam Time: ${timeFormatted}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-extrabold text-sm shadow-2xs transition-colors tabular-nums ${
                hasStarted && isCriticalTime
                  ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse'
                  : hasStarted && isWarningTime
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-amber-300'
              }`}
              title="Remaining Exam Time (Automatically triggers Submit & Finalize at 00:00)"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-wider font-sans text-slate-300 font-bold">
                  {hasStarted ? 'Time Remaining' : 'Exam Timer'}
                </span>
                <span>{timeFormatted}</span>
              </div>
            </div>
          )}

          {hasStarted && !isSubmitted && (
            <button
              type="button"
              onClick={() => handleSubmitAndFinalize(false)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Submit &amp; Finalize</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Mock Exam"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Exam Countdown Progress Strip */}
      {hasStarted && !isSubmitted && (
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
            <span
              className={`flex items-center gap-1.5 ${
                isCriticalTime
                  ? 'text-rose-400'
                  : isWarningTime
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isCriticalTime
                  ? `Final Countdown: ${minutes}m ${seconds}s remaining — Auto-triggers Submit & Finalize at 00:00`
                  : `Remaining Time: ${minutes}m ${seconds
                      .toString()
                      .padStart(2, '0')}s (${timeRemainingPct}% left) • Auto-submits at 00:00`}
              </span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-400">
                {Object.keys(answers).length}/{examQuestions.length} Answered
              </span>
              <span className="text-amber-300">
                {Object.values(flagged).filter(Boolean).length} Flagged
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCriticalTime
                  ? 'bg-rose-500'
                  : isWarningTime
                  ? 'bg-amber-400'
                  : 'bg-[#0078D4]'
              }`}
              style={{ width: `${timeRemainingPct}%` }}
            />
          </div>
        </div>
      )}

      {/* VIEW 1: PRE-EXAM BRIEFING & MODE SELECTION */}
      {!hasStarted && !isSubmitted ? (
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center mx-auto shadow-2xs">
              <Award className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0078D4]">
                Official Testing Center Experience
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                AZ-900 Mock Exam Simulation Mode
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Present a timed sequence of <strong>50–60 questions</strong> covering all three official AZ-900 learning paths in exact Microsoft exam proportions, with a comprehensive final score and per-path breakdown upon completion.
            </p>
          </div>

          {/* 3 Mode Selector Cards (Primary: 50-60Q Official Simulation) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Mode 1: Official 50-60 Question Simulation */}
            <div
              onClick={() => setExamMode('simulation')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                examMode === 'simulation'
                  ? 'border-[#0078D4] bg-blue-50/60 ring-2 ring-[#0078D4]/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white">
                    Recommended • Official Spec
                  </span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="font-black text-base text-slate-900">
                  Official Exam Simulation (50–60Q)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full-length 50 to 60 question timed sequence across all 12 modules and 3 learning paths, mimicking the real Microsoft certification exam.
                </p>

                {/* Question Count Selector (50 / 55 / 60 Questions) */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Select Sequence Length (50–60 Questions):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([50, 55, 60] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExamMode('simulation');
                          setSimulationQuestionCount(cnt);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          examMode === 'simulation' && simulationQuestionCount === cnt
                            ? 'bg-slate-900 text-amber-300 border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>60 Minutes</span>
                <span>{simulationQuestionCount} Questions</span>
              </div>
            </div>

            {/* Mode 2: Standard 35-Question Mock */}
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
                    Mid-Length Benchmark
                  </span>
                  <Layers className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="font-black text-base text-slate-900">Standard Mock Exam (35Q)</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  35 questions across all 3 learning paths for a 45-minute readiness check.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>45 Minutes</span>
                <span>35 Questions</span>
              </div>
            </div>

            {/* Mode 3: Rapid 15-Question Mini-Mock */}
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
                    Fast Diagnostic
                  </span>
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <h4 className="font-black text-base text-slate-900">Timed Mini-Mock (15Q)</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  15 questions drawn across all 3 learning paths for a quick 20-minute sprint.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>20 Minutes</span>
                <span>15 Questions</span>
              </div>
            </div>
          </div>

          {/* Proportional Distribution Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-w-4xl mx-auto space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                Official Learning Path Distribution ({examQuestions.length} Total Questions):
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Passing Score: 700 / 1000 (70% Accuracy)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-extrabold text-[#0078D4] block">
                  Path 1: Cloud Concepts (25–30%)
                </span>
                <span className="text-slate-600 text-[11px] mt-0.5 block">
                  {examQuestions.filter((q) => q.learningPathId === 1).length} Questions • Modules 1–3
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-extrabold text-emerald-700 block">
                  Path 2: Architecture &amp; Services (35–40%)
                </span>
                <span className="text-slate-600 text-[11px] mt-0.5 block">
                  {examQuestions.filter((q) => q.learningPathId === 2).length} Questions • Modules 4–7
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-extrabold text-amber-700 block">
                  Path 3: Management &amp; Governance (30–35%)
                </span>
                <span className="text-slate-600 text-[11px] mt-0.5 block">
                  {examQuestions.filter((q) => q.learningPathId === 3).length} Questions • Modules 8–12
                </span>
              </div>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={() => setHasStarted(true)}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-extrabold text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-5 h-5 text-amber-300" />
              <span>
                Start{' '}
                {examMode === 'simulation'
                  ? `Official ${simulationQuestionCount}-Question Mock Exam Simulation`
                  : examMode === 'full'
                  ? '35-Question Standard Mock Exam'
                  : '15-Question Mini-Mock Exam'}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {/* VIEW 2: ACTIVE EXAM IN PROGRESS */}
      {hasStarted && !isSubmitted && currentQ ? (
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Question Navigator Drawer */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800">
                  Question Palette ({Object.keys(answers).length}/{examQuestions.length} answered)
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPaletteFilter('all')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      paletteFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    All ({examQuestions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaletteFilter('unanswered')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      paletteFilter === 'unanswered' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    Unanswered ({examQuestions.length - Object.keys(answers).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaletteFilter('flagged')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      paletteFilter === 'flagged' ? 'bg-amber-500 text-slate-950' : 'text-slate-600'
                    }`}
                  >
                    Flagged ({Object.values(flagged).filter(Boolean).length})
                  </button>
                </div>
              </div>

              <span className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0078D4]" /> Answered
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Flagged
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {examQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCur = idx === currentIndex;
                const isFlag = flagged[q.id];

                if (paletteFilter === 'unanswered' && isAnswered) return null;
                if (paletteFilter === 'flagged' && !isFlag) return null;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all tabular-nums cursor-pointer ${
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-extrabold text-slate-900">
                  Question {currentIndex + 1} of {examQuestions.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#0078D4]">
                  Path {currentQ.learningPathId}: {currentQ.learningPathTitle}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Module {currentQ.moduleId} ({currentQ.moduleTitle})
                </span>
              </div>

              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
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
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
              {currentQ.scenario}
            </div>

            <h3 className="font-bold text-base text-slate-900">{currentQ.question}</h3>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.letter;
                return (
                  <button
                    key={opt.letter}
                    onClick={() => handleSelectAnswer(opt.letter)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
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

      {/* VIEW 3: EXAM SCORE AND DETAILED PERFORMANCE REPORT BY LEARNING PATH */}
      {isSubmitted && (
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {autoSubmittedByTimer && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between gap-3 text-xs font-bold shadow-2xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Time Expired (00:00): Your exam session was automatically submitted &amp; finalized with all recorded responses.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase shrink-0">
                Auto-Finalized
              </span>
            </div>
          )}

          {/* Top Score Summary Banner */}
          <div
            className={`p-6 rounded-2xl border text-center space-y-3 ${
              isPassed
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}
          >
            <div className="inline-flex p-3 rounded-full bg-white shadow-xs">
              {isPassed ? (
                <Award className="w-10 h-10 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-rose-600" />
              )}
            </div>
            <h2 className="text-2xl font-black">
              {isPassed
                ? 'Congratulations! You Passed the Official AZ-900 Exam Simulation'
                : 'Exam Benchmark Not Reached — Review Weak Learning Paths Below'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Scaled Score
                </span>
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {scaledScore} <span className="text-xs font-normal text-slate-500">/ 1000</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Accuracy
                </span>
                <span className="text-2xl font-black text-[#0078D4] tabular-nums">
                  {Math.round((totalCorrect / Math.max(1, examQuestions.length)) * 100)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Questions Correct
                </span>
                <span className="text-2xl font-black text-emerald-600 tabular-nums">
                  {totalCorrect} / {examQuestions.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Time Taken
                </span>
                <span className="text-2xl font-black text-slate-800 tabular-nums">
                  {elapsedMin}m {elapsedSec}s
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Passing Benchmark: 700 / 1000 points (70%). Below is your detailed performance breakdown across all three AZ-900 Learning Paths and their underlying modules.
            </p>
          </div>

          {/* Detailed Performance Breakdown by Learning Path & Modules */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0078D4]" />
                <span>Detailed Performance Breakdown by Learning Path (Paths 1–3)</span>
              </h4>
              {onOpenStudyPlanner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyPlanner();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Study Planner to Schedule Weak Paths</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {([1, 2, 3] as const).map((pId) => {
                const stat = pathStats[pId];
                const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                const domainScaled = stat.total > 0 ? Math.round((stat.correct / stat.total) * 1000) : 0;
                const passedDomain = pct >= 70;
                const moduleList = Object.entries(stat.modules).filter(
                  ([, mVal]) => mVal.total > 0
                );

                return (
                  <div
                    key={pId}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase text-[#0078D4]">
                            Learning Path {pId} • Official Weight: {stat.weight}
                          </span>
                          <span
                            className={`text-[11px] font-extrabold ${
                              passedDomain ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            · {passedDomain ? 'Passed Benchmark (70%+)' : 'Needs Remediation (<70%)'}
                          </span>
                        </div>
                        <h5 className="font-black text-slate-900 text-base mt-0.5">{stat.title}</h5>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 tabular-nums block">
                            {stat.correct} / {stat.total} ({pct}%)
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold tabular-nums">
                            Domain Scaled: {domainScaled} / 1000 pts
                          </span>
                        </div>

                        {onLaunchAdaptiveForPath && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onLaunchAdaptiveForPath(pId);
                            }}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#0078D4] border border-blue-200 text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Adapt Path {pId}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar with 70% pass marker */}
                    <div className="relative w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60"
                        style={{ left: '70%' }}
                        title="70% Passing Benchmark"
                      />
                    </div>

                    {/* Per-Module Sub-Breakdown within this Learning Path */}
                    {moduleList.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                        {moduleList.map(([modIdStr, mStat]) => {
                          const mPct =
                            mStat.total > 0
                              ? Math.round((mStat.correct / mStat.total) * 100)
                              : 0;
                          return (
                            <div
                              key={modIdStr}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  Module {modIdStr}
                                </span>
                                <span className="font-bold text-slate-800 truncate block">
                                  {mStat.title}
                                </span>
                              </div>
                              <span
                                className={`font-black tabular-nums shrink-0 ${
                                  mPct >= 70
                                    ? 'text-emerald-600'
                                    : mPct >= 50
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {mStat.correct}/{mStat.total} ({mPct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itemized Questions Review & Feedback Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0078D4]" />
                <h4 className="font-extrabold text-base text-slate-900">
                  Comprehensive Question &amp; Explanation Review
                </h4>
              </div>

              {/* Filter */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({examQuestions.length})
                </button>
                <button
                  onClick={() => setReviewFilter('missed')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    reviewFilter === 'missed'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  <span>Missed ({examQuestions.length - totalCorrect})</span>
                </button>
                <button
                  onClick={() => setReviewFilter('p1')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reviewFilter === 'p1'
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Path 1
                </button>
                <button
                  onClick={() => setReviewFilter('p2')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reviewFilter === 'p2'
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Path 2
                </button>
                <button
                  onClick={() => setReviewFilter('p3')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reviewFilter === 'p3'
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Path 3
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {examQuestions
                .filter((q) => {
                  const isRight = answers[q.id] === q.correctAnswer;
                  if (reviewFilter === 'missed') return !isRight;
                  if (reviewFilter === 'flagged') return flagged[q.id];
                  if (reviewFilter === 'p1') return q.learningPathId === 1;
                  if (reviewFilter === 'p2') return q.learningPathId === 2;
                  if (reviewFilter === 'p3') return q.learningPathId === 3;
                  return true;
                })
                .map((q) => {
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
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500">
                          Path {q.learningPathId} • Module {q.moduleId} ({q.moduleTitle})
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-extrabold ${
                            isRight ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {isRight ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>
                            {isRight
                              ? 'Correct'
                              : `Your Answer: ${userAns || 'Unanswered'} (Correct: ${
                                  q.correctAnswer
                                })`}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                        {q.scenario}
                      </p>

                      <h5 className="font-bold text-sm text-slate-900">{q.question}</h5>

                      <div className="p-3 rounded-lg bg-emerald-100/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <span className="font-bold block">
                          ✓ Why Option {q.correctAnswer} is Correct:
                        </span>
                        <p>{q.whyCorrect}</p>
                      </div>

                      {q.examTip && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Exam Tip:</strong> {q.examTip}
                          </span>
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
                onClick={() => handleSubmitAndFinalize(false)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit &amp; Finalize</span>
              </button>

              <button
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))
                }
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
              <span>Retake Exam Simulation</span>
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
    </ResponsiveModalContainer>
  );
};
