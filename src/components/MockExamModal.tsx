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
  Flame,
  Gauge,
  Brain,
  ShieldAlert,
  SkipForward,
  Keyboard,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, QuizSessionMissedQuestion, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

export type MockExamModeType = 'simulation' | 'weakness' | 'full' | 'mini';
export type SpeedRoutinePreset = 'standard' | 'sharp' | 'blitz';
export type WeaknessFocusArea =
  | 'auto'
  | 'path1'
  | 'compute-net-storage'
  | 'security-identity'
  | 'governance-finops-synth';

export interface MockExamFinishMetadata {
  durationSeconds: number;
  avgSecondsPerQuestion: number;
  examMode: MockExamModeType;
  speedRoutine: SpeedRoutinePreset;
  missedQuestions: QuizSessionMissedQuestion[];
  answeredItems: Array<{
    question: Question;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
}

interface MockExamProps {
  questions: Question[];
  stats?: UserStats;
  onFinish: (score: number, total: number, meta?: MockExamFinishMetadata) => void;
  onClose: () => void;
  initialMode?: MockExamModeType;
  onLaunchAdaptiveForPath?: (pathId: 1 | 2 | 3) => void;
  onOpenStudyPlanner?: () => void;
}

const SIMULATION_COUNTS = [45, 50, 55, 60, 75, 90] as const;
type SimulationCountType = (typeof SIMULATION_COUNTS)[number];

const WEAKNESS_COUNTS = [15, 20, 25] as const;
type WeaknessCountType = (typeof WEAKNESS_COUNTS)[number];

const SPRINT_COUNTS = [15, 25, 35] as const;
type SprintCountType = (typeof SPRINT_COUNTS)[number];

function computeDurationSeconds(count: number, routine: SpeedRoutinePreset): number {
  if (routine === 'blitz') {
    return Math.max(8 * 60, Math.round(count * 30)); // 30s/question
  }
  if (routine === 'sharp') {
    return Math.max(12 * 60, Math.round(count * 45)); // 45s/question
  }
  // Standard Microsoft Pearson VUE exam pacing (~65s/question, 60m baseline for 45–60Q)
  if (count >= 45 && count <= 60) return 60 * 60;
  if (count === 75) return 75 * 60;
  if (count === 90) return 90 * 60;
  return Math.max(15 * 60, Math.round(count * 75));
}

function getWeaknessFocusLabel(area: WeaknessFocusArea): string {
  switch (area) {
    case 'path1':
      return 'Path 1: Cloud Economics, SLA & Shared Responsibility (Mod 1–3)';
    case 'compute-net-storage':
      return 'Path 2: Architecture, Compute, Networking & Storage (Mod 4–6)';
    case 'security-identity':
      return 'Path 2: Entra ID, RBAC, Zero Trust & Security (Mod 7)';
    case 'governance-finops-synth':
      return 'Path 3: FinOps, Policy, Locks, Bicep/Arc & Synthesis (Mod 8–12)';
    default:
      return 'Auto-Detect Weakest Modules, Mistakes & High-Trap Concepts';
  }
}

export const MockExamModal: React.FC<MockExamProps> = ({
  questions,
  stats,
  onFinish,
  onClose,
  initialMode = 'simulation',
  onLaunchAdaptiveForPath,
  onOpenStudyPlanner,
}) => {
  const [examMode, setExamMode] = useState<MockExamModeType>(initialMode);
  const [simulationQuestionCount, setSimulationQuestionCount] =
    useState<SimulationCountType>(55);
  const [weaknessQuestionCount, setWeaknessQuestionCount] =
    useState<WeaknessCountType>(20);
  const [sprintQuestionCount, setSprintQuestionCount] =
    useState<SprintCountType>(35);
  const [speedRoutine, setSpeedRoutine] = useState<SpeedRoutinePreset>('standard');
  const [weaknessFocus, setWeaknessFocus] = useState<WeaknessFocusArea>('auto');
  const [prioritizeUnseen, setPrioritizeUnseen] = useState<boolean>(true);
  const [generationSeed, setGenerationSeed] = useState<number>(1);

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [questionSecondsMap, setQuestionSecondsMap] = useState<Record<string, number>>({});
  const [currentQuestionElapsed, setCurrentQuestionElapsed] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [autoSubmittedByTimer, setAutoSubmittedByTimer] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<
    'all' | 'missed' | 'flagged' | 'slow' | 'p1' | 'p2' | 'p3'
  >('all');
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');

  const answersRef = useRef<Record<string, string>>(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Diagnostics for Weakness Mode badge & transparency
  const weaknessDiagnostics = useMemo(() => {
    const mistakeIds = new Set((stats?.mistakesHistory || []).map((m) => m.questionId));
    const skippedIds = new Set(stats?.skippedQuestionIds || []);
    const weakModules = new Set<number>();
    for (let m = 1; m <= 12; m++) {
      const mod = stats?.moduleMastery?.[m];
      if (mod && mod.total > 0 && mod.correct / mod.total < 0.75) {
        weakModules.add(m);
      }
      const modConf = stats?.moduleConfidenceScores?.[m];
      if (typeof modConf === 'number' && modConf <= 3) {
        weakModules.add(m);
      }
    }
    const advancedCount = questions.filter((q) => q.difficulty === 'Advanced').length;
    return {
      mistakeCount: mistakeIds.size,
      skippedCount: skippedIds.size,
      weakModuleIds: Array.from(weakModules).sort((a, b) => a - b),
      advancedCount,
    };
  }, [stats, questions]);

  // Active target count for whichever mode is selected
  const activeTargetCount = useMemo(() => {
    if (examMode === 'weakness') return weaknessQuestionCount;
    if (examMode === 'full') return sprintQuestionCount;
    if (examMode === 'mini') return 15;
    return simulationQuestionCount;
  }, [examMode, weaknessQuestionCount, sprintQuestionCount, simulationQuestionCount]);

  // Question Selection Engine (Proportional Official Exam + Targeted Weakness Areas)
  const examQuestions = useMemo(() => {
    // Include generationSeed so "Shuffle Fresh Set" / Retake regenerates a fresh set
    void generationSeed;

    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const prioritizePool = (pool: Question[]): Question[] => {
      if (!prioritizeUnseen || !stats?.attempts) {
        return shuffle(pool);
      }
      const unseen = shuffle(pool.filter((q) => !(q.id in stats.attempts)));
      const seen = shuffle(pool.filter((q) => q.id in stats.attempts));
      return [...unseen, ...seen];
    };

    const takeFromPool = (pool: Question[], count: number, prefix: string): Question[] => {
      if (pool.length === 0) return [];
      const ordered = prioritizePool(pool);
      if (ordered.length >= count) {
        return ordered.slice(0, count);
      }
      const result: Question[] = [...ordered];
      let idx = 0;
      while (result.length < count) {
        const base = ordered[idx % ordered.length];
        result.push({
          ...base,
          id: `${base.id}-${prefix}-${result.length + 1}`,
        });
        idx++;
      }
      return result;
    };

    if (examMode === 'weakness') {
      const mistakeIds = new Set((stats?.mistakesHistory || []).map((m) => m.questionId));
      const skippedIds = new Set(stats?.skippedQuestionIds || []);

      const matchesFocus = (q: Question): boolean => {
        if (weaknessFocus === 'path1') return q.learningPathId === 1;
        if (weaknessFocus === 'compute-net-storage')
          return q.moduleId === 4 || q.moduleId === 5 || q.moduleId === 6;
        if (weaknessFocus === 'security-identity') return q.moduleId === 7;
        if (weaknessFocus === 'governance-finops-synth') return q.moduleId >= 8 && q.moduleId <= 12;
        return true;
      };

      const candidatePool = questions.filter(matchesFocus);
      const effectivePool = candidatePool.length >= weaknessQuestionCount ? candidatePool : questions;

      const scored = effectivePool.map((q) => {
        let priority = Math.random() * 6; // mild jitter within same tier so each drill stays fresh
        if (mistakeIds.has(q.id)) priority += 120;
        const attempts = stats?.attempts?.[q.id] || [];
        if (attempts.length > 0) {
          const wrongs = attempts.filter((a) => !a.isCorrect).length;
          const rights = attempts.length - wrongs;
          if (wrongs > rights) priority += 70;
          else if (wrongs > 0) priority += 28;
        } else {
          priority += 10; // slight preference for untested challenging questions
        }
        if (skippedIds.has(q.id)) priority += 50;

        const qConf = stats?.confidenceScores?.[q.id];
        if (typeof qConf === 'number' && qConf <= 3) priority += 40;

        const modConf = stats?.moduleConfidenceScores?.[q.moduleId];
        if (typeof modConf === 'number' && modConf <= 3) priority += 25;

        const modStat = stats?.moduleMastery?.[q.moduleId];
        if (modStat && modStat.total > 0) {
          const acc = modStat.correct / modStat.total;
          if (acc < 0.65) priority += 45;
          else if (acc < 0.8) priority += 22;
        }

        if (q.difficulty === 'Advanced') priority += 24;
        else if (q.difficulty === 'Intermediate') priority += 10;
        if (q.moduleId === 12) priority += 12;

        return { question: q, priority };
      });

      scored.sort((a, b) => b.priority - a.priority);
      return scored.slice(0, weaknessQuestionCount).map((entry) => entry.question);
    }

    const p1 = questions.filter((q) => q.learningPathId === 1);
    const p2 = questions.filter((q) => q.learningPathId === 2);
    const p3 = questions.filter((q) => q.learningPathId === 3);

    const totalTarget =
      examMode === 'mini'
        ? 15
        : examMode === 'full'
        ? sprintQuestionCount
        : simulationQuestionCount;

    // Exact official AZ-900 weighting: Path 1 (27%), Path 2 (40%), Path 3 (33%)
    const countP1 = Math.round(totalTarget * 0.27);
    const countP2 = Math.round(totalTarget * 0.4);
    const countP3 = Math.max(1, totalTarget - countP1 - countP2);

    const selectedP1 = takeFromPool(p1, countP1, `${examMode}-p1`);
    const selectedP2 = takeFromPool(p2, countP2, `${examMode}-p2`);
    const selectedP3 = takeFromPool(p3, countP3, `${examMode}-p3`);
    return shuffle([...selectedP1, ...selectedP2, ...selectedP3]);
  }, [
    questions,
    examMode,
    simulationQuestionCount,
    sprintQuestionCount,
    weaknessQuestionCount,
    weaknessFocus,
    prioritizeUnseen,
    stats,
    generationSeed,
  ]);

  const initialDuration = useMemo(
    () => computeDurationSeconds(examQuestions.length || activeTargetCount, speedRoutine),
    [examQuestions.length, activeTargetCount, speedRoutine]
  );

  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);

  // Sync timer when configuration changes prior to start
  useEffect(() => {
    if (!hasStarted) {
      setTimeLeft(initialDuration);
    }
  }, [initialDuration, hasStarted]);

  // Per-question speed routine tracker
  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    setCurrentQuestionElapsed(0);
    const currentId = examQuestions[currentIndex]?.id;
    const perQInterval = setInterval(() => {
      setCurrentQuestionElapsed((prev) => prev + 1);
      if (currentId) {
        setQuestionSecondsMap((prev) => ({
          ...prev,
          [currentId]: (prev[currentId] || 0) + 1,
        }));
      }
    }, 1000);
    return () => clearInterval(perQInterval);
  }, [hasStarted, isSubmitted, currentIndex, examQuestions]);

  const timeLeftRef = useRef<number>(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const handleSubmitAndFinalize = useCallback(
    (triggeredByTimer = false) => {
      if (isSubmitted) return;
      setIsSubmitted(true);
      if (triggeredByTimer) {
        setAutoSubmittedByTimer(true);
      }

      const latestAnswers = answersRef.current;
      let correctCount = 0;
      const missedQuestions: QuizSessionMissedQuestion[] = [];
      const answeredItems: MockExamFinishMetadata['answeredItems'] = [];

      examQuestions.forEach((q) => {
        const userChoice = latestAnswers[q.id];
        const isRight = userChoice === q.correctAnswer;
        if (isRight) {
          correctCount += 1;
        } else {
          const selectedOpt = q.options.find((o) => o.letter === userChoice);
          const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
          missedQuestions.push({
            questionId: q.id,
            scenario: q.scenario,
            question: q.question,
            selectedAnswer: userChoice || 'Unanswered',
            selectedAnswerText: selectedOpt?.text || 'Skipped / Time Expired',
            correctAnswer: q.correctAnswer,
            correctAnswerText: correctOpt?.text || '',
            whyCorrect: q.whyCorrect,
            examTip: q.examTip,
            moduleId: q.moduleId,
            moduleTitle: q.moduleTitle,
            learningPathTitle: q.learningPathTitle,
          });
        }
        if (userChoice) {
          answeredItems.push({
            question: q,
            selectedAnswer: userChoice,
            isCorrect: isRight,
          });
        }
      });

      const scaledScore = Math.round(
        (correctCount / Math.max(1, examQuestions.length)) * 1000
      );
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

      const usedDuration = Math.max(1, initialDuration - timeLeftRef.current);
      const avgSec = Math.round(usedDuration / Math.max(1, Object.keys(latestAnswers).length || examQuestions.length));

      onFinish(correctCount, examQuestions.length, {
        durationSeconds: usedDuration,
        avgSecondsPerQuestion: avgSec,
        examMode,
        speedRoutine,
        missedQuestions,
        answeredItems,
      });
    },
    [isSubmitted, examQuestions, onFinish, initialDuration, examMode, speedRoutine]
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

  const handleSelectAnswer = useCallback(
    (letter: string) => {
      if (isSubmitted || !currentQ) return;
      setAnswers((prev) => ({ ...prev, [currentQ.id]: letter }));
    },
    [isSubmitted, currentQ]
  );

  const toggleFlag = useCallback((id: string) => {
    setFlagged((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const jumpToNextUnanswered = useCallback(() => {
    const afterIdx = examQuestions.findIndex(
      (q, idx) => idx > currentIndex && answers[q.id] === undefined
    );
    if (afterIdx !== -1) {
      setCurrentIndex(afterIdx);
      return;
    }
    const wrapIdx = examQuestions.findIndex((q) => answers[q.id] === undefined);
    if (wrapIdx !== -1) {
      setCurrentIndex(wrapIdx);
    }
  }, [examQuestions, currentIndex, answers]);

  // Keyboard shortcuts for fast brain speed routines (1-4 / A-D, Arrows/N/P, F to flag)
  useEffect(() => {
    if (!hasStarted || isSubmitted || !currentQ) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') handleSelectAnswer('A');
      else if (key === '2' || key === 'b') handleSelectAnswer('B');
      else if (key === '3' || key === 'c') handleSelectAnswer('C');
      else if (key === '4' || key === 'd') handleSelectAnswer('D');
      else if (e.key === 'ArrowRight' || key === 'n') {
        setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || key === 'p') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (key === 'f') {
        toggleFlag(currentQ.id);
      } else if (key === 'u') {
        jumpToNextUnanswered();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hasStarted,
    isSubmitted,
    currentQ,
    examQuestions.length,
    handleSelectAnswer,
    toggleFlag,
    jumpToNextUnanswered,
  ]);

  const handleRestart = (nextMode?: MockExamModeType) => {
    if (nextMode) {
      setExamMode(nextMode);
    }
    setAnswers({});
    setFlagged({});
    setQuestionSecondsMap({});
    setCurrentQuestionElapsed(0);
    setCurrentIndex(0);
    setIsSubmitted(false);
    setAutoSubmittedByTimer(false);
    setGenerationSeed((prev) => prev + 1);
    setHasStarted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
  const timeRemainingPct = Math.max(
    0,
    Math.min(100, Math.round((timeLeft / Math.max(1, initialDuration)) * 100))
  );
  const elapsedSeconds = Math.max(0, initialDuration - timeLeft);
  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;

  const answeredCount = Object.keys(answers).length;
  const avgSecPerAnswered =
    answeredCount > 0 ? Math.round(elapsedSeconds / answeredCount) : 0;
  const targetPacePerQ =
    speedRoutine === 'blitz' ? 30 : speedRoutine === 'sharp' ? 45 : 65;

  const isCriticalTime = timeLeft <= 180;
  const isWarningTime = timeLeft > 180 && timeLeft <= 300;

  // Results calculation
  const totalCorrect = examQuestions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const scaledScore = Math.round((totalCorrect / Math.max(1, examQuestions.length)) * 1000);
  const isPassed = scaledScore >= 700;

  // Speed distribution breakdown
  const speedBreakdown = useMemo(() => {
    let fast = 0; // < 30s
    let optimal = 0; // 30-60s
    let deep = 0; // > 60s
    examQuestions.forEach((q) => {
      const sec = questionSecondsMap[q.id] || 0;
      if (sec < 30) fast += 1;
      else if (sec <= 60) optimal += 1;
      else deep += 1;
    });
    const avgOverall = Math.round(elapsedSeconds / Math.max(1, examQuestions.length));
    const speedLabel =
      avgOverall <= 32
        ? 'Blitz Reflex Speed'
        : avgOverall <= 48
        ? 'Sharp Exam Pace'
        : avgOverall <= 68
        ? 'Steady Standard Pace'
        : 'Deep Analytical Pace';
    return { fast, optimal, deep, avgOverall, speedLabel };
  }, [examQuestions, questionSecondsMap, elapsedSeconds]);

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

  const modeBadgeLabel = useMemo(() => {
    const mins = Math.round(initialDuration / 60);
    if (examMode === 'weakness') {
      return `Weakness Target (${examQuestions.length}Q • ${mins}m)`;
    }
    if (examMode === 'full') {
      return `Cohesion Sprint (${examQuestions.length}Q • ${mins}m)`;
    }
    if (examMode === 'mini') {
      return `Rapid Mini-Mock (15Q • ${mins}m)`;
    }
    return `Exam Simulation (${examQuestions.length}Q • ${mins}m)`;
  }, [examMode, examQuestions.length, initialDuration]);

  return (
    <ResponsiveModalContainer
      isOpen={true}
      onClose={onClose}
      maxWidth="6xl"
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
                {questions.length}-Question Exam Bank
              </span>
              <h2 className="font-bold text-sm sm:text-lg truncate">
                AZ-900 Exam Readiness &amp; Speed Simulator
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white">
                {modeBadgeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Passing Score: 700 / 1000 Scaled Points • 45–90Q Endurance • 15–25Q Weakness Drills • Speed Routines
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

      {/* Active Exam Countdown + Brain Speed Routine Telemetry Strip */}
      {hasStarted && !isSubmitted && (
        <div className="bg-slate-950 px-4 sm:px-6 py-2.5 border-b border-slate-800 flex flex-col gap-1.5">
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
                  ? `Final Countdown: ${minutes}m ${seconds}s left`
                  : `${minutes}m ${seconds.toString().padStart(2, '0')}s (${timeRemainingPct}% left)`}
              </span>
            </span>

            {/* Real-time Speed Routine & Question Pace Telemetry */}
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                  currentQuestionElapsed <= targetPacePerQ
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}
                title={`Target pace for ${speedRoutine} routine is ${targetPacePerQ}s per question`}
              >
                <Gauge className="w-3 h-3" />
                This Q: {currentQuestionElapsed}s / {targetPacePerQ}s target
              </span>

              {answeredCount > 0 && (
                <span className="text-sky-300 hidden md:inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Avg Pace: {avgSecPerAnswered}s/Q
                </span>
              )}

              <span className="text-emerald-400">
                {answeredCount}/{examQuestions.length} Answered
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

      {/* VIEW 1: PRE-EXAM BRIEFING, VOLUME OPTIONS & SPEED ROUTINES */}
      {!hasStarted && !isSubmitted ? (
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0078D4] text-xs font-extrabold">
              <Brain className="w-3.5 h-3.5" />
              <span>
                {questions.length} Exam-Level Questions Loaded • High-Volume Cohesion &amp; Speed Training
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Choose Exam Volume, Weakness Targeting &amp; Speed Routine
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Practice across <strong>45, 50, 55, 60, 75, or 90 questions</strong> to engage speed routines and sharpen recall, or target your <strong>15–25 challenging weakness areas</strong> directly.
            </p>
          </div>

          {/* 3 Primary Mode Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {/* MODE 1: Official & High-Volume Endurance Simulation (45, 50, 55, 60, 75, 90Q) */}
            <div
              onClick={() => setExamMode('simulation')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                examMode === 'simulation'
                  ? 'border-[#0078D4] bg-blue-50/60 ring-2 ring-[#0078D4]/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white">
                    Exam Cohesion &amp; Endurance
                  </span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">
                    High-Volume Exam Simulation (45–90Q)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Build exam stamina, domain cohesion, and mental confidence across 45, 50, 55, 60, or 75–90 question endurance marathons.
                  </p>
                </div>

                {/* Expanded Question Count Selector: 45 / 50 / 55 / 60 / 75 / 90 */}
                <div className="pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Select Question Count:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SIMULATION_COUNTS.map((cnt) => (
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
                            ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cnt} Qs
                        {cnt >= 75 && (
                          <span className="block text-[9px] font-bold opacity-80">
                            {cnt === 75 ? 'Endurance' : 'Marathon'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                  {Math.round(computeDurationSeconds(simulationQuestionCount, speedRoutine) / 60)}{' '}
                  Minutes
                </span>
                <span>{simulationQuestionCount} Unique Questions</span>
              </div>
            </div>

            {/* MODE 2: Targeted Weakness Areas Drill (15–25 Questions) */}
            <div
              onClick={() => setExamMode('weakness')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                examMode === 'weakness'
                  ? 'border-rose-500 bg-rose-50/55 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                    Challenging &amp; Weak Areas (15–25Q)
                  </span>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">
                    Weakness Precision Exam (15–25Q)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Targets recorded mistakes, low-confidence modules (&lt;75%), skipped items, and Advanced multi-trap scenarios.
                  </p>
                </div>

                {/* Weakness Telemetry Pill Summary */}
                <div className="p-2 rounded-xl bg-white/80 border border-rose-200 text-[11px] text-rose-950 font-semibold flex flex-wrap gap-x-3 gap-y-1">
                  <span>{weaknessDiagnostics.mistakeCount} active misses</span>
                  <span>· {weaknessDiagnostics.weakModuleIds.length} weak modules</span>
                  <span>· {weaknessDiagnostics.advancedCount} advanced traps</span>
                </div>

                {/* 15 / 20 / 25 Question Count Selector */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Select Weakness Length (15–25 Qs):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {WEAKNESS_COUNTS.map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExamMode('weakness');
                          setWeaknessQuestionCount(cnt);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          examMode === 'weakness' && weaknessQuestionCount === cnt
                            ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Challenging Focus Domain Picker */}
                <div onClick={(e) => e.stopPropagation()}>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Challenging Focus Area:
                  </label>
                  <select
                    value={weaknessFocus}
                    onChange={(e) => {
                      setExamMode('weakness');
                      setWeaknessFocus(e.target.value as WeaknessFocusArea);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="auto">Auto-Detect My Weakest Areas (Recommended)</option>
                    <option value="path1">Cloud Economics, SLA &amp; Models (Mod 1–3)</option>
                    <option value="compute-net-storage">
                      Architecture, Compute, Net &amp; Storage (Mod 4–6)
                    </option>
                    <option value="security-identity">
                      Identity, RBAC, Zero Trust &amp; Security (Mod 7)
                    </option>
                    <option value="governance-finops-synth">
                      FinOps, Policy, Locks, Bicep &amp; Synthesis (Mod 8–12)
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                  {Math.round(computeDurationSeconds(weaknessQuestionCount, speedRoutine) / 60)}{' '}
                  Minutes
                </span>
                <span>{weaknessQuestionCount} High-Yield Traps</span>
              </div>
            </div>

            {/* MODE 3: Balanced Cohesion Sprint (15 / 25 / 35Q) */}
            <div
              onClick={() => setExamMode('full')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                examMode === 'full' || examMode === 'mini'
                  ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800">
                    Fast Cohesion Warmup
                  </span>
                  <Layers className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">
                    Rapid Domain Sprint (15–35Q)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sharpen daily speed and cross-path transitions across all 3 Azure Fundamentals learning paths before full 45–60Q sets.
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Select Sprint Length:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SPRINT_COUNTS.map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExamMode('full');
                          setSprintQuestionCount(cnt);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          (examMode === 'full' && sprintQuestionCount === cnt) ||
                          (examMode === 'mini' && cnt === 15)
                            ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                  {Math.round(
                    computeDurationSeconds(
                      examMode === 'mini' ? 15 : sprintQuestionCount,
                      speedRoutine
                    ) / 60
                  )}{' '}
                  Minutes
                </span>
                <span>{examMode === 'mini' ? 15 : sprintQuestionCount} Balanced Questions</span>
              </div>
            </div>
          </div>

          {/* Brain Speed Routine & Freshness Options Strip */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Brain Speed &amp; Recall Routine Calibration
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'standard',
                      label: 'Standard Exam Pace',
                      sub: '~60–65s / Question',
                    },
                    {
                      id: 'sharp',
                      label: 'Sharp Speed Routine',
                      sub: '45s / Q • Crisp Reflex',
                    },
                    {
                      id: 'blitz',
                      label: 'Blitz Recall Routine',
                      sub: '30s / Q • Peak Velocity',
                    },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSpeedRoutine(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      speedRoutine === preset.id
                        ? 'bg-[#0078D4] border-sky-300 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-extrabold block">{preset.label}</span>
                    <span className="text-[10px] text-sky-100/80 block mt-0.5">{preset.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:border-l lg:border-slate-700 lg:pl-4">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={prioritizeUnseen}
                  onChange={(e) => setPrioritizeUnseen(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 text-[#0078D4] focus:ring-[#0078D4]"
                />
                <span>
                  <strong className="text-white block">Prioritize Unseen Questions First</strong>
                  <span className="text-[11px] text-slate-400">
                    Pulls fresh unseen scenarios from the {questions.length}-Q bank before repeating practiced items.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={() => setGenerationSeed((prev) => prev + 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-amber-300 transition-colors cursor-pointer self-start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reshuffle Fresh Question Set</span>
              </button>
            </div>
          </div>

          {/* Learning Path & Question Distribution Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-w-6xl mx-auto space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {examMode === 'weakness'
                  ? `Targeted Weakness Blueprint (${examQuestions.length} Questions • ${getWeaknessFocusLabel(weaknessFocus)}):`
                  : `Official Learning Path Distribution (${examQuestions.length} Total Questions):`}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Passing Score: 700 / 1000 (70%) • Shortcuts: A–D / 1–4, Arrows, F=Flag
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
              className={`px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer text-white ${
                examMode === 'weakness'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'
                  : 'bg-gradient-to-r from-[#0078D4] to-blue-700 hover:from-blue-600 hover:to-blue-800'
              }`}
            >
              {examMode === 'weakness' ? (
                <ShieldAlert className="w-5 h-5 text-amber-200" />
              ) : (
                <Award className="w-5 h-5 text-amber-300" />
              )}
              <span>
                Start {examQuestions.length}-Question{' '}
                {examMode === 'weakness'
                  ? 'Weakness Precision Exam'
                  : examMode === 'full' || examMode === 'mini'
                  ? 'Cohesion Sprint'
                  : 'Mock Exam Simulation'}{' '}
                ({Math.round(initialDuration / 60)}m •{' '}
                {speedRoutine === 'blitz'
                  ? 'Blitz 30s/Q'
                  : speedRoutine === 'sharp'
                  ? 'Sharp 45s/Q'
                  : 'Standard Pace'}
                )
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-800">
                  Question Palette ({answeredCount}/{examQuestions.length} answered)
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
                    Unanswered ({examQuestions.length - answeredCount})
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

              <div className="flex items-center gap-3 text-[11px]">
                <span className="hidden lg:inline-flex items-center gap-1 text-slate-500">
                  <Keyboard className="w-3.5 h-3.5" />
                  1–4 Select · N/P Move · F Flag · U Next Open
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0078D4]" /> Answered
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Flagged
                </span>
              </div>
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
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    currentQ.difficulty === 'Advanced'
                      ? 'bg-rose-100 text-rose-800'
                      : currentQ.difficulty === 'Intermediate'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentQ.difficulty}
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

      {/* VIEW 3: EXAM SCORE, SPEED ROUTINE METRICS & DETAILED BREAKDOWN */}
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
                ? `Exam Passed! ${examQuestions.length}-Question Simulation Cleared`
                : 'Benchmark Not Reached — Drill Weak Modules & Traps Below'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto pt-2">
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
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Speed Routine
                </span>
                <span className="text-xl font-black text-amber-600 tabular-nums block">
                  {speedBreakdown.avgOverall}s / Q
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  {speedBreakdown.speedLabel}
                </span>
              </div>
            </div>

            {/* Speed & Cognitive Sharpness Telemetry Bar */}
            <div className="max-w-3xl mx-auto pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-bold">
              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700">
                Instant Recall (&lt;30s): {speedBreakdown.fast} Qs
              </span>
              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[#0078D4]">
                Optimal Pace (30–60s): {speedBreakdown.optimal} Qs
              </span>
              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-amber-700">
                Deep Analysis (&gt;60s): {speedBreakdown.deep} Qs
              </span>
              <button
                type="button"
                onClick={() => {
                  setWeaknessFocus('auto');
                  setWeaknessQuestionCount(20);
                  handleRestart('weakness');
                }}
                className="px-3.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Launch 20Q Weakness Drill on Weak Areas</span>
              </button>
            </div>
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
                if (stat.total === 0) return null;
                const pct = Math.round((stat.correct / stat.total) * 100);
                const domainScaled = Math.round((stat.correct / stat.total) * 1000);
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

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {(
                  [
                    { id: 'all', label: `All (${examQuestions.length})` },
                    { id: 'missed', label: `Missed (${examQuestions.length - totalCorrect})` },
                    {
                      id: 'flagged',
                      label: `Flagged (${Object.values(flagged).filter(Boolean).length})`,
                    },
                    { id: 'slow', label: `Slow >60s (${speedBreakdown.deep})` },
                    { id: 'p1', label: 'Path 1' },
                    { id: 'p2', label: 'Path 2' },
                    { id: 'p3', label: 'Path 3' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReviewFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      reviewFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {examQuestions
                .filter((q) => {
                  const isRight = answers[q.id] === q.correctAnswer;
                  const sec = questionSecondsMap[q.id] || 0;
                  if (reviewFilter === 'missed') return !isRight;
                  if (reviewFilter === 'flagged') return flagged[q.id];
                  if (reviewFilter === 'slow') return sec > 60;
                  if (reviewFilter === 'p1') return q.learningPathId === 1;
                  if (reviewFilter === 'p2') return q.learningPathId === 2;
                  if (reviewFilter === 'p3') return q.learningPathId === 3;
                  return true;
                })
                .map((q) => {
                  const userAns = answers[q.id];
                  const isRight = userAns === q.correctAnswer;
                  const qSec = questionSecondsMap[q.id] || 0;

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
                          Path {q.learningPathId} • Module {q.moduleId} ({q.moduleTitle}) ·{' '}
                          <span className="text-slate-700 font-extrabold">{qSec}s</span>
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

                      {!isRight && q.distractorBreakdown && q.distractorBreakdown.length > 0 && (
                        <div className="p-3 rounded-lg bg-white/80 border border-rose-200 text-xs text-slate-700 space-y-1">
                          <span className="font-bold text-rose-800 block">
                            Why Distractors Were Traps:
                          </span>
                          {q.distractorBreakdown.map((d) => (
                            <p key={d.letter}>
                              <strong>Option {d.letter}:</strong> {d.reason}
                            </p>
                          ))}
                        </div>
                      )}

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
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        {hasStarted && !isSubmitted ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={jumpToNextUnanswered}
                disabled={answeredCount === examQuestions.length}
                className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[#0078D4] text-xs font-extrabold hover:bg-blue-100 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                title="Shortcut: U"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Next Open</span>
              </button>
            </div>

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
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => handleRestart()}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Configure New Exam Simulation</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
            >
              Close Report
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">
              {questions.length} Built-in + AI Exam Questions Ready • Zero Repeats Across Full Exams
            </span>
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
