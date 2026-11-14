import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  TrendingUp,
  Timer,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion, KenyanFlagMiniEmblem } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

interface MicroDrillProps {
  questions: Question[];
  targetModuleId?: number;
  targetModuleName: string;
  onAnswer: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onCompleteDrill?: (moduleId: number, score: number, total: number) => void;
  onLaunchPeerChallenge?: (moduleId: number) => void;
  drillVariant?: 'standard' | 'fundamentals-reset';
  fundamentalsResetSubtitle?: string;
  onClose: () => void;
}

interface MicroDrillSparklineProps {
  currentIndex: number;
  totalQuestions: number;
  hasSubmitted: boolean;
  score?: number;
  isFinished?: boolean;
}

export const MicroDrillSparkline: React.FC<MicroDrillSparklineProps> = ({
  currentIndex,
  totalQuestions,
  hasSubmitted,
  score = 0,
  isFinished = false,
}) => {
  const total = Math.max(1, totalQuestions);
  const completedQuestions = isFinished
    ? total
    : Math.min(total, currentIndex + (hasSubmitted ? 1 : 0));
  const progressPercent = Math.min(100, Math.round((completedQuestions / total) * 100));
  const remainingQuestions = Math.max(0, total - completedQuestions);
  const remainingPercent = Math.max(0, 100 - progressPercent);

  // Sparkline coordinates setup
  const width = 280;
  const height = 48;
  const paddingX = 20;
  const topY = 10;
  const bottomY = 36;
  const usableWidth = width - 2 * paddingX;
  const usableHeight = bottomY - topY;

  // Generate milestone points from start (0%) to completion (100%)
  const points = Array.from({ length: total + 1 }, (_, i) => {
    const x = paddingX + (i / total) * usableWidth;
    const pct = (i / total) * 100;
    const y = bottomY - (pct / 100) * usableHeight;
    return { index: i, x, y, pct };
  });

  // Completed points (up to completedQuestions)
  const completedPoints = points.slice(0, completedQuestions + 1);
  const currentPoint = points[completedQuestions] || points[0];

  // SVG Paths
  const completedLinePath =
    completedPoints.length > 0
      ? completedPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
      : '';

  const completedAreaPath =
    completedPoints.length > 0
      ? `${completedLinePath} L ${currentPoint.x} ${bottomY} L ${points[0].x} ${bottomY} Z`
      : '';

  // Remaining trajectory dashed line from current point to final 100% target
  const remainingPoints = points.slice(completedQuestions);
  const remainingLinePath =
    remainingPoints.length > 1
      ? remainingPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
      : '';

  return (
    <div className="bg-gradient-to-b from-slate-50 to-amber-50/30 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
      {/* Header Metric Row */}
      <div className="flex items-center justify-between text-xs font-semibold mb-1 flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-800 font-bold">
            Progress Sparkline:
          </span>
          <span className="text-emerald-700 font-black">
            {progressPercent}% Complete
          </span>
          <span className="text-slate-400 font-normal text-[11px]">
            ({completedQuestions}/{total} solved)
          </span>
        </div>

        {/* Remaining Effort Tag */}
        <div className="flex items-center gap-1 text-[11px]">
          {remainingQuestions > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Remaining Effort: <strong>{remainingQuestions} Q</strong> ({remainingPercent}% left)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Goal Reached • 0 Q Remaining</span>
            </span>
          )}
        </div>
      </div>

      {/* Mini SVG Sparkline Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-11 overflow-visible"
          aria-label={`Progress sparkline: ${progressPercent}% completed, ${remainingQuestions} questions remaining`}
        >
          <defs>
            <linearGradient id="drillProgressAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0078D4" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="drillProgressStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0078D4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Baseline (0%) & Ceiling (100%) Guidelines */}
          <line
            x1={paddingX}
            y1={bottomY}
            x2={width - paddingX}
            y2={bottomY}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <line
            x1={paddingX}
            y1={topY}
            x2={width - paddingX}
            y2={topY}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Area under completed curve */}
          {completedAreaPath && (
            <path
              d={completedAreaPath}
              fill="url(#drillProgressAreaGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Remaining effort trajectory line (dashed amber showing remaining effort) */}
          {remainingLinePath && (
            <path
              d={remainingLinePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              className="opacity-80"
            />
          )}

          {/* Completed progress line */}
          {completedLinePath && (
            <path
              d={completedLinePath}
              fill="none"
              stroke="url(#drillProgressStrokeGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Milestone points for each question */}
          {points.map((pt, i) => {
            if (i === 0) return null; // Show Q1..Q5
            const isCompleted = i <= completedQuestions;
            const isCurrent = !isFinished && i === currentIndex + 1 && !hasSubmitted;

            return (
              <g key={i}>
                {/* Active current pulsing halo */}
                {isCurrent && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6.5"
                    fill="#f59e0b"
                    opacity="0.35"
                    className="animate-ping"
                  />
                )}

                {/* Main point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isCurrent ? '4.5' : isCompleted ? '3.8' : '3'}
                  fill={isCompleted ? '#10b981' : isCurrent ? '#f59e0b' : '#ffffff'}
                  stroke={isCompleted ? '#065f46' : isCurrent ? '#d97706' : '#94a3b8'}
                  strokeWidth={isCurrent ? '2.5' : '1.75'}
                  className="transition-all duration-200"
                />

                {/* Question index label */}
                <text
                  x={pt.x}
                  y={height - 2}
                  textAnchor="middle"
                  className={`text-[9px] font-bold ${
                    isCompleted
                      ? 'fill-emerald-800'
                      : isCurrent
                      ? 'fill-amber-700 font-black'
                      : 'fill-slate-400'
                  }`}
                >
                  Q{i}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend / Key */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5 font-medium">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-0.5 bg-emerald-500 rounded-full" />
            <span>Completed ({progressPercent}%)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-0.5 border-b border-dashed border-amber-500" />
            <span>Remaining Effort ({remainingPercent}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const MicroDrillModal: React.FC<MicroDrillProps> = ({
  questions,
  targetModuleId = 11,
  targetModuleName,
  onAnswer,
  onCompleteDrill,
  onLaunchPeerChallenge,
  drillVariant = 'standard',
  fundamentalsResetSubtitle,
  onClose,
}) => {
  // Take up to 5 questions for the Daily Harambee Weakness Drill
  const drillQuestions = questions.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Quick-Drill Countdown Timer Overlay State (high-pressure exam simulation)
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<30 | 45 | 60>(45);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isTimerOverlayVisible, setIsTimerOverlayVisible] = useState<boolean>(true);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);

  const currentQ = drillQuestions[currentIndex];

  // Live 1-second exam countdown & total elapsed timer
  useEffect(() => {
    if (isFinished || !currentQ || isTimerPaused || !isTimerOverlayVisible) return;

    const timerId = setInterval(() => {
      setTotalElapsedSeconds((prev) => prev + 1);
      if (!hasSubmitted) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [isFinished, currentQ, isTimerPaused, isTimerOverlayVisible, hasSubmitted]);

  // Handle high-pressure timer expiration (0s reached before answer submitted)
  useEffect(() => {
    if (
      timeLeft === 0 &&
      !hasSubmitted &&
      !isFinished &&
      isTimerOverlayVisible &&
      currentQ
    ) {
      setTimedOut(true);
      setHasSubmitted(true);
      onAnswer(currentQ.id, '', false);
    }
  }, [timeLeft, hasSubmitted, isFinished, isTimerOverlayVisible, currentQ, onAnswer]);

  const handleSelect = (letter: string) => {
    if (hasSubmitted || !currentQ) return;
    setSelectedAnswer(letter);
    setHasSubmitted(true);
    setTimedOut(false);
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
      setTimedOut(false);
      setTimeLeft(secondsPerQuestion);
    } else {
      setIsFinished(true);
      if (onCompleteDrill) {
        onCompleteDrill(targetModuleId, score, drillQuestions.length);
      }
      confetti({
        particleCount: score >= 4 ? 90 : 45,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRetryDrill = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setTimedOut(false);
    setScore(0);
    setIsFinished(false);
    setTimeLeft(secondsPerQuestion);
    setTotalElapsedSeconds(0);
    setIsTimerPaused(false);
  };

  const handleChangePreset = (preset: 30 | 45 | 60) => {
    setSecondsPerQuestion(preset);
    if (!hasSubmitted) {
      setTimeLeft(preset);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const timerPct = Math.max(0, Math.min(100, (timeLeft / secondsPerQuestion) * 100));
  const isCriticalTime = timeLeft <= 10 && !hasSubmitted;
  const isWarningTime = timeLeft <= 20 && timeLeft > 10 && !hasSubmitted;

  const isSelectedCorrect = selectedAnswer === currentQ?.correctAnswer;
  const accuracyPercent =
    drillQuestions.length > 0 ? Math.round((score / drillQuestions.length) * 100) : 0;
  // Accurate completion badge unlocked at >= 80% (4/5 or 5/5)
  const earnedAccuracyBadge = accuracyPercent >= 80;

  return (
    <ResponsiveModalContainer
      isOpen={true}
      onClose={onClose}
      maxWidth="xl"
      ariaLabel="5-Question Rapid Weakness Drill"
    >
        <div className="shrink-0">
          <KitengeRibbon height={4} />
        </div>

        {/* Modal Header (Fixed / Shrink-0 so it stays visible on all screen sizes) */}
        <div
          className={`shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between gap-2 ${
            drillVariant === 'fundamentals-reset'
              ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
              {drillVariant === 'fundamentals-reset' ? (
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
              ) : (
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-lg truncate">
                  {drillVariant === 'fundamentals-reset'
                    ? 'Fundamentals Reset Drill (5 Qs)'
                    : '5-Question Rapid Weakness Drill'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white shrink-0">
                  {drillVariant === 'fundamentals-reset'
                    ? 'Foundation Recovery'
                    : 'Daily Harambee Challenge'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-100 truncate">
                {drillVariant === 'fundamentals-reset' && fundamentalsResetSubtitle
                  ? fundamentalsResetSubtitle
                  : `Targeting Module ${targetModuleId}: ${targetModuleName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isFinished && (
              <button
                type="button"
                onClick={() => setIsTimerOverlayVisible((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border ${
                  isTimerOverlayVisible
                    ? 'bg-slate-900/75 text-amber-300 border-white/30'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                }`}
                title="Toggle Quick-Drill Exam Countdown Timer Overlay"
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">
                  {isTimerOverlayVisible ? formatSeconds(timeLeft) : 'Timer Off'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Close drill modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-Pressure Quick-Drill Timer Overlay HUD */}
        {!isFinished && currentQ && isTimerOverlayVisible && (
          <div
            role="timer"
            aria-live="polite"
            aria-label={`Quick-Drill countdown: ${timeLeft} seconds remaining`}
            className={`shrink-0 px-4 sm:px-6 py-2 border-b transition-colors duration-300 relative overflow-hidden ${
              timedOut
                ? 'bg-rose-950 text-white border-rose-700'
                : isCriticalTime
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100'
                : isWarningTime
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 relative z-10 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 font-mono font-black text-sm tabular-nums ${
                    isCriticalTime ? 'text-rose-600 dark:text-rose-300 animate-pulse' : isWarningTime ? 'text-amber-700 dark:text-amber-300' : 'text-sky-300'
                  }`}
                >
                  <Timer className="w-4 h-4 shrink-0" />
                  <span>{formatSeconds(timeLeft)}</span>
                </div>
                <span className="text-[11px] font-bold opacity-85">
                  {timedOut
                    ? 'Time Expired — Review explanation below'
                    : isCriticalTime
                    ? 'Quick-Drill Alert · Final Seconds!'
                    : isWarningTime
                    ? 'Quick-Drill Pace · Pick Best Option'
                    : 'Quick-Drill Exam Pressure Mode'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Speed Preset Switcher */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-black/15 dark:bg-white/10 text-[10px] font-bold">
                  {([30, 45, 60] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleChangePreset(preset)}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        secondsPerQuestion === preset
                          ? 'bg-[#0078D4] text-white font-black shadow-2xs'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                      title={`Set ${preset} seconds per Quick-Drill question`}
                    >
                      {preset}s
                    </button>
                  ))}
                </div>

                {/* Pause / Resume Countdown */}
                {!hasSubmitted && (
                  <button
                    type="button"
                    onClick={() => setIsTimerPaused((p) => !p)}
                    className="p-1 rounded-lg bg-black/15 hover:bg-black/25 dark:bg-white/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                    title={isTimerPaused ? 'Resume Quick-Drill countdown' : 'Pause Quick-Drill countdown'}
                    aria-label={isTimerPaused ? 'Resume countdown' : 'Pause countdown'}
                  >
                    {isTimerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Depleting Countdown Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-black/15 dark:bg-white/10 overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-linear ${
                  timedOut || isCriticalTime
                    ? 'bg-rose-500'
                    : isWarningTime
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Scrollable Body that adapts to any viewport height */}
        {!isFinished && currentQ ? (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {/* Progress indicators */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Question <strong>{currentIndex + 1}</strong> of{' '}
                  <strong>{drillQuestions.length}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700 font-bold">
                  Score: {score}/{currentIndex + (hasSubmitted ? 1 : 0)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {drillQuestions.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-amber-500 ring-2 ring-amber-200 scale-110'
                        : i < currentIndex
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scenario snippet */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block mb-1">Scenario:</strong>
              {currentQ.scenario}
            </div>

            {/* Question */}
            <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
              {currentQ.question}
            </h4>

            {/* Choices */}
            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswer === opt.letter;
                const isCorrect = opt.letter === currentQ.correctAnswer;

                let btnStyles =
                  'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 cursor-pointer';
                if (hasSubmitted) {
                  if (isCorrect) {
                    btnStyles =
                      'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrect) {
                    btnStyles =
                      'bg-red-50 border-red-400 text-red-950 ring-1 ring-red-400';
                  } else {
                    btnStyles =
                      'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => handleSelect(opt.letter)}
                    disabled={hasSubmitted}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-all ${btnStyles}`}
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
                className={`p-3 sm:p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                  isSelectedCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {isSelectedCorrect ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : timedOut ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {isSelectedCorrect
                      ? 'Correct! Weakness domain confidence reinforced.'
                      : timedOut
                      ? `Time Expired — Correct Answer is ${currentQ.correctAnswer}`
                      : `Correct Answer is ${currentQ.correctAnswer}`}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">
                  {currentQ.whyCorrect}
                </p>
                <div className="pt-1 text-amber-900 font-semibold flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Exam Tip: {currentQ.examTip}</span>
                </div>
              </div>
            )}

            {/* Next or Finish Button */}
            {hasSubmitted && (
              <div className="flex justify-end pt-1 sticky bottom-0 bg-gradient-to-t from-white via-white to-white/90 py-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <span>
                    {currentIndex < drillQuestions.length - 1
                      ? 'Next Question'
                      : 'Complete 5-Question Drill'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Finished summary & Accuracy Badge Presentation */
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8 text-center space-y-5">
            <div className="relative inline-flex items-center justify-center mx-auto">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${
                  earnedAccuracyBadge
                    ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-emerald-600 text-white ring-4 ring-amber-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}
              >
                {earnedAccuracyBadge ? (
                  <ShieldCheck className="w-9 h-9" />
                ) : (
                  <Award className="w-8 h-8" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={22} />
              </div>
            </div>

            <div className="space-y-1.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 ${
                  earnedAccuracyBadge
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {earnedAccuracyBadge
                    ? 'Harambee Weakness Conqueror Badge Unlocked!'
                    : '5-Question Weakness Drill Completed'}
                </span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                You Scored {score} of {drillQuestions.length} Correct ({accuracyPercent}%)
              </h3>
              <p className="text-xs font-mono font-bold text-[#0078D4]">
                Quick-Drill Time: {formatSeconds(totalElapsedSeconds)} ({secondsPerQuestion}s/Q pace)
              </p>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                {earnedAccuracyBadge
                  ? `Outstanding accuracy on Module ${targetModuleId} (${targetModuleName})! Your weakness tracker and domain confidence have been updated.`
                  : `You need at least 4 of 5 (80%) correct to unlock the Harambee Weakness Conqueror badge for Module ${targetModuleId}. Retry now to claim your badge!`}
              </p>
            </div>

            {/* Completed Sparkline Summary */}
            <div className="max-w-md mx-auto text-left">
              <MicroDrillSparkline
                currentIndex={drillQuestions.length - 1}
                totalQuestions={drillQuestions.length}
                hasSubmitted={true}
                score={score}
                isFinished={true}
              />
            </div>

            {/* Badge Card Display */}
            <div
              className={`max-w-md mx-auto p-4 rounded-2xl border text-left flex items-center gap-3.5 ${
                earnedAccuracyBadge
                  ? 'bg-gradient-to-r from-amber-50 via-emerald-50/70 to-amber-50 border-emerald-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-85'
              }`}
            >
              <div className="shrink-0">
                <KenyanFlagMiniEmblem size={36} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-900">
                    Harambee Weakness Conqueror
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      earnedAccuracyBadge
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {earnedAccuracyBadge ? 'Badge Earned' : 'Locked (<80%)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Module {targetModuleId}: {targetModuleName} • 5-Question Rapid Drill Mastery
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {!earnedAccuracyBadge && (
                <button
                  type="button"
                  onClick={handleRetryDrill}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry 5-Question Drill for Badge</span>
                </button>
              )}
              {onLaunchPeerChallenge && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchPeerChallenge(targetModuleId);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#006600] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Invite Cohort to Peer Challenge</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                Continue Learning
              </button>
            </div>
          </div>
        )}
    </ResponsiveModalContainer>
  );
};
