import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  ChevronDown,
  X,
  Target,
  Check,
  Trophy,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { setDailyGoal } from '../utils/storage';

interface DailyStudyStreakProps {
  stats: UserStats;
  onUpdateStats?: (newStats: UserStats) => void;
  fireStreakTrigger?: number;
}

export const DailyStudyStreak: React.FC<DailyStudyStreakProps> = ({
  stats,
  onUpdateStats,
  fireStreakTrigger = 0,
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>(
    String(stats.dailyGoal || 10)
  );
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);
  const [isIncrementing, setIsIncrementing] = useState<boolean>(false);
  const [justReachedGoal, setJustReachedGoal] = useState<boolean>(false);
  const [isFireStreakActive, setIsFireStreakActive] = useState<boolean>(false);

  // Trigger fire-streak celebratory animation whenever a quiz question is completed
  const prevTriggerRef = React.useRef<number>(fireStreakTrigger);
  const prevTotalRef = React.useRef<number>(stats.totalAnswered);

  const triggerFireStreak = React.useCallback(() => {
    setIsFireStreakActive(true);
    const timer = setTimeout(() => {
      setIsFireStreakActive(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fireStreakTrigger > prevTriggerRef.current) {
      triggerFireStreak();
      prevTriggerRef.current = fireStreakTrigger;
    }
  }, [fireStreakTrigger, triggerFireStreak]);

  useEffect(() => {
    if (stats.totalAnswered > prevTotalRef.current) {
      triggerFireStreak();
      prevTotalRef.current = stats.totalAnswered;
    }
  }, [stats.totalAnswered, triggerFireStreak]);

  // Listen to global question completion event
  useEffect(() => {
    const handleQuestionCompleted = () => {
      triggerFireStreak();
    };
    window.addEventListener('az900_question_completed', handleQuestionCompleted);
    return () => {
      window.removeEventListener('az900_question_completed', handleQuestionCompleted);
    };
  }, [triggerFireStreak]);

  // Sync goalInput whenever stats.dailyGoal updates externally
  useEffect(() => {
    if (stats.dailyGoal) {
      setGoalInput(String(stats.dailyGoal));
    }
  }, [stats.dailyGoal]);

  // Allow external triggers (such as Study Hub Features dropdown) to open the goal configuration modal
  useEffect(() => {
    const handleOpenGoalModal = () => {
      setShowDropdown(true);
      setIsEditingGoal(true);
    };
    window.addEventListener('az900_open_daily_goal_modal', handleOpenGoalModal);
    return () => {
      window.removeEventListener('az900_open_daily_goal_modal', handleOpenGoalModal);
    };
  }, []);

  // Listen for Daily Learning Goal saves from Header Configuration Modal (DailyGoalAlertsModal)
  useEffect(() => {
    const handleGoalSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ goal?: number }>;
      const newGoal = customEvent.detail?.goal;
      if (newGoal) {
        setGoalInput(String(newGoal));
      }
      setIsIncrementing(true);
      setSaveFeedback(true);
      setGoalFeedback(
        newGoal ? `Goal set to ${newGoal} questions/day!` : 'Daily Goal Updated!'
      );
      setTimeout(() => setIsIncrementing(false), 1400);
      setTimeout(() => setSaveFeedback(false), 3200);
      setTimeout(() => setGoalFeedback(null), 3200);
    };
    window.addEventListener('az900_daily_goal_saved', handleGoalSaved);
    return () => {
      window.removeEventListener('az900_daily_goal_saved', handleGoalSaved);
    };
  }, []);

  // Today's attempts calculation (dynamic session progress)
  const todayKey = new Date().toISOString().split('T')[0];
  let todayAnswered = 0;
  Object.values(stats.attempts || {}).forEach((attemptsList) => {
    attemptsList.forEach((att) => {
      if (
        att.timestamp &&
        new Date(att.timestamp).toISOString().split('T')[0] === todayKey
      ) {
        todayAnswered++;
      }
    });
  });

  const dailyGoal = stats.dailyGoal || 10;
  const goalPercent = Math.min(
    100,
    Math.round((todayAnswered / dailyGoal) * 100)
  );
  const isGoalReached = todayAnswered >= dailyGoal && dailyGoal > 0;

  // Track progress increments to smoothly animate ring and trigger celebratory sparkle
  const prevAnsweredRef = React.useRef<number>(todayAnswered);
  useEffect(() => {
    if (todayAnswered > prevAnsweredRef.current) {
      setIsIncrementing(true);
      const timer = setTimeout(() => setIsIncrementing(false), 1200);
      if (todayAnswered >= dailyGoal && prevAnsweredRef.current < dailyGoal) {
        setJustReachedGoal(true);
        setTimeout(() => setJustReachedGoal(false), 4500);
      }
      prevAnsweredRef.current = todayAnswered;
      return () => clearTimeout(timer);
    }
    prevAnsweredRef.current = todayAnswered;
  }, [todayAnswered, dailyGoal]);

  // Generate last 7 days status
  const today = new Date();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().split('T')[0];
    const dayInitial = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const isToday = i === 0;

    let hasActivity = false;
    Object.values(stats.attempts || {}).forEach((attempts) => {
      if (
        attempts.some(
          (a) =>
            a.timestamp &&
            new Date(a.timestamp).toISOString().split('T')[0] === dayKey
        )
      ) {
        hasActivity = true;
      }
    });

    if (isToday && (stats.totalAnswered > 0 || todayAnswered > 0)) {
      hasActivity = true;
    }

    weekDays.push({
      date: dayKey,
      dayInitial,
      isToday,
      hasActivity,
    });
  }

  // Next streak milestone calculation
  const streak = stats.streakDays || 1;
  const nextMilestone =
    streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : streak + 10;
  const daysRemaining = Math.max(1, nextMilestone - streak);

  const commitGoal = (targetValue: number, showToast: boolean = true) => {
    if (isNaN(targetValue) || targetValue <= 0) return;
    const cleanGoal = Math.max(1, Math.min(100, Math.round(targetValue)));
    const updated = setDailyGoal(stats, cleanGoal);
    if (onUpdateStats) {
      onUpdateStats(updated);
    }
    setGoalInput(String(cleanGoal));
    setIsEditingGoal(false);
    setIsIncrementing(true);
    setTimeout(() => setIsIncrementing(false), 1200);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2800);
    if (showToast) {
      setGoalFeedback(`Goal set to ${cleanGoal} questions/day!`);
      setTimeout(() => setGoalFeedback(null), 2800);
    }
  };

  const handleHeaderGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGoalInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      // Instantly persist to localStorage so progress ring updates dynamically
      const updated = setDailyGoal(stats, parsed);
      if (onUpdateStats) {
        onUpdateStats(updated);
      }
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 1500);
    }
  };

  const handleHeaderGoalBlur = () => {
    const parsed = parseInt(goalInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      commitGoal(10, false);
    } else {
      commitGoal(parsed, false);
    }
  };

  const handleHeaderGoalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  // Progress ring constants (r=14 in 36x36 viewbox -> circumference ~ 87.96)
  const ringRadius = 14;
  const ringCircumference = 2 * Math.PI * ringRadius; // ~87.96
  const ringOffset =
    ringCircumference - (goalPercent / 100) * ringCircumference;

  return (
    <div className="relative">
      {/* Header Widget: Daily Learning Goal Progress Ring with Fire-Streak & Immediate Goal Save Feedback */}
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-300 ${
          isFireStreakActive
            ? 'bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 border-orange-400 text-orange-950 shadow-[0_0_18px_rgba(249,115,22,0.5)] ring-2 ring-orange-400/80 scale-[1.02]'
            : saveFeedback
            ? 'bg-gradient-to-r from-blue-50 via-emerald-50 to-blue-50 border-[#0078D4] text-slate-900 ring-2 ring-[#0078D4]/40 scale-[1.03]'
            : isGoalReached
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
            : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-orange-200/80 text-orange-950 shadow-2xs'
        }`}
      >
        {/* Visual Fire-Streak Animation Celebration when user completes a quiz question */}
        {isFireStreakActive && (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
            {/* 1. Celebratory Momentum Floating Pill */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white text-[11px] font-black shadow-lg shadow-orange-500/50 flex items-center gap-1.5 animate-bounce z-50 border border-yellow-200/50">
              <Flame className="w-3.5 h-3.5 fill-yellow-200 text-yellow-100 animate-pulse" />
              <span>Momentum Streak! +1</span>
              <Sparkles className="w-3 h-3 text-yellow-200" />
            </div>

            {/* 2. Expanding Fiery Shockwave Ring */}
            <div className="absolute -inset-2 rounded-xl border-2 border-orange-500 animate-ping opacity-75" />

            {/* 3. Glowing Fiery Aura Pulse */}
            <div className="absolute -inset-1 rounded-xl bg-orange-400/25 blur-xs animate-pulse" />

            {/* 4. Rising Embers & Spark Particles */}
            <span className="absolute -top-3 left-1 text-amber-400 animate-ember-1">
              <svg className="w-3 h-3 fill-amber-300 drop-shadow-sm" viewBox="0 0 24 24">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
              </svg>
            </span>
            <span className="absolute -top-4 right-1 text-orange-500 animate-ember-2">
              <svg className="w-3.5 h-3.5 fill-orange-400 drop-shadow-sm" viewBox="0 0 24 24">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
              </svg>
            </span>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-300 animate-ember-3">
              <svg className="w-2.5 h-2.5 fill-yellow-200" viewBox="0 0 24 24">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
              </svg>
            </span>
            <span className="absolute top-1 -left-2 text-red-500 animate-ember-1">
              <span className="block w-2 h-2 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 shadow-xs shadow-orange-500/80" />
            </span>
            <span className="absolute top-1 -right-2 text-amber-500 animate-ember-2">
              <span className="block w-2 h-2 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-xs shadow-amber-400/80" />
            </span>
          </div>
        )}

        {/* Clickable Area: Visual Progress Ring around Flame & Daily Goal Counts */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 rounded-xl transition-colors cursor-pointer group"
          title={`Daily Learning Goal: ${todayAnswered}/${dailyGoal} questions completed today (${goalPercent}%). Click to directly edit your Daily Learning Goal.`}
        >
          {/* Flame icon with Smooth Circular Visual Progress Ring & Celebration Effects */}
          <div
            className={`relative flex items-center justify-center w-8 h-8 transition-transform duration-300 ${
              isFireStreakActive || saveFeedback
                ? 'scale-115 animate-pulse'
                : isGoalReached
                ? 'animate-goal-glow rounded-full'
                : ''
            } ${isIncrementing ? 'animate-ring-pulse' : ''}`}
          >
            <svg
              className="w-8 h-8 -rotate-90 origin-center"
              viewBox="0 0 36 36"
            >
              {/* Background Track Circle */}
              <circle
                cx="18"
                cy="18"
                r={ringRadius}
                fill="none"
                stroke={
                  isFireStreakActive
                    ? '#FED7AA'
                    : saveFeedback
                    ? '#BAE6FD'
                    : isGoalReached
                    ? '#A7F3D0'
                    : '#FED7AA'
                }
                strokeWidth="3.2"
              />
              {/* Animated Dynamic Progress Ring with Smooth Settle Curve */}
              <circle
                cx="18"
                cy="18"
                r={ringRadius}
                fill="none"
                stroke={
                  isFireStreakActive
                    ? '#EA580C'
                    : saveFeedback
                    ? '#0078D4'
                    : isGoalReached
                    ? '#16A34A'
                    : '#EA580C'
                }
                strokeWidth="3.2"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                style={{
                  transition:
                    'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                  filter: isFireStreakActive
                    ? 'drop-shadow(0 0 5px rgba(234, 88, 12, 0.9))'
                    : saveFeedback
                    ? 'drop-shadow(0 0 4px rgba(0, 120, 212, 0.7))'
                    : undefined,
                }}
              />
            </svg>

            {/* Centered Flame Icon with momentum fire leap */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame
                className={`transition-all duration-300 ${
                  isFireStreakActive
                    ? 'w-5 h-5 text-amber-500 fill-orange-500 scale-125 -rotate-6 filter drop-shadow-[0_0_8px_rgba(245,158,11,1)]'
                    : saveFeedback
                    ? 'w-4 h-4 text-[#0078D4] fill-sky-400 scale-110'
                    : isGoalReached
                    ? 'w-4 h-4 text-emerald-600 fill-emerald-500 group-hover:scale-110 animate-pulse'
                    : 'w-4 h-4 text-orange-600 fill-orange-500 group-hover:scale-110'
                }`}
              />
            </div>

            {/* Goal Completed or Saved Check Badge */}
            {(isGoalReached || saveFeedback) && !isFireStreakActive && (
              <span
                className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border border-white rounded-full flex items-center justify-center text-white shadow-2xs z-10 ${
                  saveFeedback ? 'bg-[#0078D4]' : 'bg-emerald-500'
                }`}
              >
                <Check className="w-2 h-2 stroke-[3]" />
              </span>
            )}
          </div>

          {/* Daily Quiz Streak Counter + Daily Learning Goal Progress Counts */}
          <div className="flex items-center gap-2 text-left">
            {/* Consecutive Daily Quiz Streak Badge with Animated Fire Icon */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-red-500/15 border border-orange-300/80">
              <Flame
                className={`w-3.5 h-3.5 text-orange-600 fill-orange-500 shrink-0 ${
                  isFireStreakActive ? 'animate-bounce scale-125' : 'animate-pulse'
                }`}
              />
              <span className="text-xs font-black text-orange-950 whitespace-nowrap">
                {streak}d Streak
              </span>
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-extrabold text-slate-500">Goal</span>
                <span
                  className={`text-xs font-black transition-colors duration-500 ${
                    isFireStreakActive
                      ? 'text-orange-950 font-black'
                      : saveFeedback
                      ? 'text-[#0078D4]'
                      : isGoalReached
                      ? 'text-emerald-700'
                      : 'text-orange-900'
                  }`}
                >
                  {todayAnswered}/{dailyGoal}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 leading-none flex items-center gap-0.5">
                {isFireStreakActive ? (
                  <span className="text-orange-600 font-extrabold animate-pulse">
                    🔥 +1 Momentum!
                  </span>
                ) : saveFeedback ? (
                  <span className="text-[#0078D4] font-extrabold">
                    ✓ Ring Updated ({goalPercent}%)
                  </span>
                ) : isGoalReached ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 inline" />
                    <span className="text-emerald-700 font-extrabold">Done! ✨</span>
                  </>
                ) : (
                  `${goalPercent}% today`
                )}
              </span>
            </div>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Centered Modal Card in Viewable Space */}
      {showDropdown &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto overscroll-contain animate-in fade-in duration-150"
            onClick={() => {
              setShowDropdown(false);
              setIsEditingGoal(false);
            }}
          >
            <div
              className="w-full max-w-[min(28rem,calc(100vw-1.25rem))] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-y-auto overscroll-contain bg-white rounded-2xl border border-slate-200 card-elevation shadow-2xl p-4 sm:p-5 animate-in zoom-in-95 duration-150 space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Title and Close Button */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl text-white shadow-xs ${
                    isGoalReached
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}
                >
                  {isGoalReached ? (
                    <Trophy className="w-5 h-5 text-amber-200" />
                  ) : (
                    <Target className="w-5 h-5 text-amber-100" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Daily Learning Goal &amp; Streak</span>
                    {isGoalReached && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        Achieved!
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Set a daily target to build unbreakable Azure momentum
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  setIsEditingGoal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Daily Learning Goal Direct Editor & Progress Card */}
            <div
              className={`rounded-2xl p-4.5 border space-y-4 ${
                isGoalReached
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50 border-emerald-300 shadow-2xs'
                  : 'bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-white border-sky-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#0078D4] text-white">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Daily Learning Goal Target
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Questions to answer each day
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    isGoalReached
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-blue-100 text-[#0078D4] border border-blue-200'
                  }`}
                >
                  {isGoalReached ? 'Completed! ✨' : `${goalPercent}% today`}
                </span>
              </div>

              {/* Progress Count & Visual Ring / Bar */}
              <div className="space-y-1.5 bg-white/80 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-2xl font-black ${
                        isGoalReached ? 'text-emerald-700' : 'text-[#0078D4]'
                      }`}
                    >
                      {todayAnswered}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / {dailyGoal} questions answered today
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-700">
                    {goalPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isGoalReached
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-[#0078D4] to-sky-400'
                    }`}
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
              </div>

              {/* Direct Goal Editor: Stepper + Presets */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                  <span>Select Target Questions / Day:</span>
                  <span className="text-slate-400 font-normal">Min 1 • Max 100</span>
                </div>

                {/* Stepper & Input */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(goalInput, 10) || dailyGoal;
                      const next = Math.max(1, cur - 1);
                      setGoalInput(String(next));
                      commitGoal(next, true);
                    }}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-black text-slate-700 flex items-center justify-center text-sm shadow-2xs cursor-pointer active:scale-95 transition-transform"
                    title="Decrease daily goal by 1"
                  >
                    -
                  </button>

                  <div className="relative grow">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onBlur={() => {
                        const parsed = parseInt(goalInput, 10);
                        if (!isNaN(parsed) && parsed >= 1) {
                          commitGoal(parsed, true);
                        } else {
                          setGoalInput(String(dailyGoal));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const parsed = parseInt(goalInput, 10);
                          if (!isNaN(parsed) && parsed >= 1) {
                            commitGoal(parsed, true);
                          }
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full h-9 px-3 text-center font-black text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 shadow-2xs focus:outline-hidden"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      q/day
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(goalInput, 10) || dailyGoal;
                      const next = Math.min(100, cur + 1);
                      setGoalInput(String(next));
                      commitGoal(next, true);
                    }}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-black text-slate-700 flex items-center justify-center text-sm shadow-2xs cursor-pointer active:scale-95 transition-transform"
                    title="Increase daily goal by 1"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(goalInput, 10);
                      if (!isNaN(parsed) && parsed >= 1) {
                        commitGoal(parsed, true);
                      }
                    }}
                    className="px-3.5 h-9 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Save</span>
                  </button>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[5, 10, 15, 20, 25, 30].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => commitGoal(preset, true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                        dailyGoal === preset
                          ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                    >
                      {preset} / day
                    </button>
                  ))}
                </div>

                {/* Direct Feedback Banner */}
                {goalFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600 shrink-0" />
                    <span>{goalFeedback} Header progress ring updated immediately.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Streak Number Big Display */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-xl p-3.5 border border-amber-200/70 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black text-amber-900">
                  {streak}
                </span>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Consecutive Days Streak
                </span>
              </div>
              <p className="text-[11px] text-amber-950 font-medium">
                {streak >= 7
                  ? '🔥 Warrior Consistency! Your long-term memory is primed.'
                  : 'Answer at least 1 scenario daily to keep the flame active.'}
              </p>
            </div>

            {/* 7-Day Consistency Tracker Circles */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Past 7 Days</span>
                <span className="text-orange-700 font-semibold">
                  {weekDays.filter((d) => d.hasActivity).length} of 7 Active
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-1">
                {weekDays.map((d, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      {d.dayInitial}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        d.hasActivity
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-2xs'
                          : d.isToday
                          ? 'bg-blue-50 text-[#0078D4] border-2 border-dashed border-[#0078D4]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                      title={d.date}
                    >
                      {d.hasActivity ? (
                        <Flame className="w-3.5 h-3.5 fill-white text-white" />
                      ) : (
                        '·'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestone Badge Progress */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Next Milestone: {nextMilestone}-Day Streak</span>
                </span>
                <span className="text-amber-700">{daysRemaining} days left</span>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((streak / nextMilestone) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
