import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  Flame,
  Sparkles,
  CheckCircle2,
  Trophy,
  Plus,
  Minus,
  Check,
  PartyPopper,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { setDailyGoal } from '../utils/storage';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface DailyLearningGoalProps {
  stats: UserStats;
  onUpdateStats?: (newStats: UserStats) => void;
  onStartPractice?: () => void;
}

export const DailyLearningGoal: React.FC<DailyLearningGoalProps> = ({
  stats,
  onUpdateStats,
  onStartPractice,
}) => {
  const dailyGoal = stats.dailyGoal || 10;
  const [customGoalInput, setCustomGoalInput] = useState<string>(String(dailyGoal));
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [bonusDemoAnswered, setBonusDemoAnswered] = useState<number>(0);

  useEffect(() => {
    setCustomGoalInput(String(stats.dailyGoal || 10));
  }, [stats.dailyGoal]);

  // Calculate today's answered questions & accuracy from stats.attempts
  const { todayAnsweredRaw, todayCorrectRaw } = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    let answered = 0;
    let correct = 0;

    Object.values(stats.attempts || {}).forEach((attemptList) => {
      attemptList.forEach((att) => {
        if (
          att.timestamp &&
          new Date(att.timestamp).toISOString().split('T')[0] === todayKey
        ) {
          answered++;
          if (att.isCorrect) correct++;
        }
      });
    });

    return { todayAnsweredRaw: answered, todayCorrectRaw: correct };
  }, [stats.attempts]);

  const todayAnswered = todayAnsweredRaw + bonusDemoAnswered;
  const todayCorrect = todayCorrectRaw + bonusDemoAnswered;
  const todayAccuracy =
    todayAnswered > 0 ? Math.round((todayCorrect / todayAnswered) * 100) : 0;

  const progressPct = Math.min(
    100,
    Math.round((todayAnswered / Math.max(1, dailyGoal)) * 100)
  );
  const isGoalCompleted = todayAnswered >= dailyGoal && dailyGoal > 0;
  const remainingQuestions = Math.max(0, dailyGoal - todayAnswered);

  // Achievement Milestone Tracker: Exceeding daily quiz target by MORE than 20% (> 1.2 * dailyGoal)
  const milestoneThreshold = Math.floor(dailyGoal * 1.2) + 1;
  const isMilestoneAchieved = todayAnswered >= milestoneThreshold && dailyGoal > 0;
  const milestoneProgressPct = Math.min(
    100,
    Math.round((todayAnswered / Math.max(1, milestoneThreshold)) * 100)
  );
  const overTargetPct =
    dailyGoal > 0 && todayAnswered > dailyGoal
      ? Math.round(((todayAnswered - dailyGoal) / dailyGoal) * 100)
      : 0;

  // Trigger celebratory animation when goal transitions to completed
  const prevCompletedRef = React.useRef<boolean>(isGoalCompleted);
  useEffect(() => {
    if (isGoalCompleted && !prevCompletedRef.current) {
      triggerGoalCelebration();
    }
    prevCompletedRef.current = isGoalCompleted;
  }, [isGoalCompleted]);

  // Trigger special Achievement Milestone confetti celebration when user exceeds daily target by >20%
  const prevMilestoneRef = React.useRef<boolean>(isMilestoneAchieved);
  useEffect(() => {
    if (isMilestoneAchieved && !prevMilestoneRef.current) {
      triggerMilestoneCelebration();
    }
    prevMilestoneRef.current = isMilestoneAchieved;
  }, [isMilestoneAchieved]);

  const triggerGoalCelebration = () => {
    setIsCelebrating(true);
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0078D4', '#10b981', '#f59e0b', '#38bdf8', '#eab308'],
      });
    } catch {
      // ignore in restricted environments
    }
    setTimeout(() => {
      setIsCelebrating(false);
    }, 3800);
  };

  const triggerMilestoneCelebration = () => {
    setIsCelebrating(true);
    try {
      confetti({
        particleCount: 95,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#D97706', '#F59E0B', '#0078D4', '#10B981', '#FDE047'],
      });
    } catch {
      // ignore in restricted environments
    }
    setTimeout(() => {
      setIsCelebrating(false);
    }, 4200);
  };

  const handleSaveGoal = (nextTarget: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(nextTarget)));
    setCustomGoalInput(String(clamped));
    const updated = setDailyGoal(stats, clamped);
    if (onUpdateStats) {
      onUpdateStats(updated);
    }
    window.dispatchEvent(
      new CustomEvent('az900_daily_goal_saved', { detail: { goal: clamped } })
    );
    setSaveToast(`Daily goal updated to ${clamped} questions/day`);
    setTimeout(() => setSaveToast(null), 2600);
  };

  // Circular SVG Ring Constants
  const size = 156;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPct / 100) * circumference;

  const presets = [5, 10, 15, 20, 25, 30, 50];

  return (
    <section
      aria-label="Daily Learning Goal Tracker"
      className="relative bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden transition-all"
    >
      <KitengeRibbon height={3} />

      {/* Celebratory Overlay Banner when Goal is Completed or Previewed */}
      {(isCelebrating || isGoalCompleted) && (
        <div
          className={`px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0078D4] text-white flex flex-wrap items-center justify-between gap-2 text-xs transition-all ${
            isCelebrating ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center gap-2 font-extrabold">
            <PartyPopper className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
            <span>
              Hongera! Daily Learning Goal Achieved ({todayAnswered}/{dailyGoal} Questions Today)!
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
            +100 XP Consistency Bonus
          </span>
        </div>
      )}

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* LEFT / CENTER: Circular Progress Ring + Celebration Aura */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-sky-50/40 to-amber-50/30 border border-slate-200/80 relative overflow-hidden">
            {/* Animated Celebration Sparkles in Ring Background */}
            {isCelebrating && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-44 h-44 rounded-full border-2 border-dashed border-amber-400/60 animate-spin" style={{ animationDuration: '10s' }} />
                <div className="absolute w-36 h-36 rounded-full bg-emerald-400/15 blur-xl animate-ping" />
              </div>
            )}

            {/* SVG Circular Progress Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90 transform"
              >
                <defs>
                  <linearGradient id="dailyGoalBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0078D4" />
                    <stop offset="50%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                  <linearGradient id="dailyGoalCompletedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>

                {/* Background Track Circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth={strokeWidth}
                />

                {/* Animated Foreground Progress Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={
                    isGoalCompleted || isCelebrating
                      ? 'url(#dailyGoalCompletedGrad)'
                      : 'url(#dailyGoalBlueGrad)'
                  }
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition:
                      'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                    filter:
                      isGoalCompleted || isCelebrating
                        ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))'
                        : 'drop-shadow(0 0 6px rgba(0, 120, 212, 0.25))',
                  }}
                />
              </svg>

              {/* Center Ring Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                {isGoalCompleted || isCelebrating ? (
                  <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mb-0.5 animate-bounce">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
                  </div>
                ) : (
                  <Target className="w-4 h-4 text-[#0078D4] mb-0.5" />
                )}

                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isGoalCompleted ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {todayAnswered}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    /{dailyGoal}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full mt-0.5 ${
                    isGoalCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-50 text-[#0078D4]'
                  }`}
                >
                  {progressPct}% Done
                </span>
              </div>
            </div>

            {/* Ring Side Metrics */}
            <div className="space-y-2.5 text-center sm:text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0078D4]">
                  <MaasaiMedallion size={14} />
                  <span>Daily Learning Goal</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug mt-0.5">
                  {isGoalCompleted
                    ? 'Daily Target Complete!'
                    : `${remainingQuestions} More Question${
                        remainingQuestions === 1 ? '' : 's'
                      } to Goal`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isGoalCompleted
                    ? 'Fantastic discipline! Keep practicing to boost domain mastery.'
                    : 'Consistent daily question volume locks AZ-900 concepts into long-term memory.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Today's Accuracy
                  </span>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {todayAccuracy}%
                  </span>
                </div>

                <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Active Streak
                  </span>
                  <span className="text-xs sm:text-sm font-black text-orange-600 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    {stats.streakDays || 1} Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Goal Configuration & Celebration Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Configure Daily Question Target</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#0078D4] border border-blue-200">
                    Target: {dailyGoal} Qs / Day
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Choose a preset pace or set a custom daily question goal (1–100 questions).
                </p>
              </div>

              {/* Preview / Replay Celebration Animation Button */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setBonusDemoAnswered((prev) => prev + 1);
                    if (todayAnswered + 1 >= dailyGoal) {
                      triggerGoalCelebration();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                  title="Log a quick demo question toward today's ring"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+1 Today</span>
                </button>

                <button
                  type="button"
                  onClick={triggerGoalCelebration}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Trigger goal completion celebration animation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Celebrate Goal</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Goal Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Quick Daily Goal Presets:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {presets.map((preset) => {
                  const isActive = dailyGoal === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSaveGoal(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-xs scale-[1.02]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset} Qs/day
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Stepper & Direct Input Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveGoal(Math.max(1, dailyGoal - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-black transition-colors cursor-pointer"
                  title="Decrease daily goal by 1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="relative w-28">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const parsed = parseInt(customGoalInput, 10);
                        if (!isNaN(parsed)) handleSaveGoal(parsed);
                      }
                    }}
                    className="w-full h-9 px-3 pr-10 rounded-xl border border-slate-300 text-center font-black text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0078D4]"
                    aria-label="Custom daily question goal"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    Qs
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveGoal(Math.min(100, dailyGoal + 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-black transition-colors cursor-pointer"
                  title="Increase daily goal by 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(customGoalInput, 10);
                    if (!isNaN(parsed)) handleSaveGoal(parsed);
                  }}
                  className="px-3.5 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set Target</span>
                </button>
              </div>

              {onStartPractice && (
                <button
                  type="button"
                  onClick={onStartPractice}
                  className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Practice Toward Goal</span>
                </button>
              )}
            </div>

            {/* Achievement Milestone Tracker (>20% Over Daily Target Celebration) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isMilestoneAchieved
                  ? 'bg-gradient-to-r from-amber-50 via-yellow-50/90 to-emerald-50 border-amber-300 shadow-xs'
                  : 'bg-slate-50/90 border-slate-200/90'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isMilestoneAchieved
                        ? 'bg-amber-500 text-white shadow-2xs animate-bounce'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        Achievement Milestone (+20% Over Target)
                      </span>
                      {isMilestoneAchieved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                          Unlocked! +{overTargetPct}% Above Target 🎉
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                          Reach {milestoneThreshold} Qs (&gt;20% bonus)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isMilestoneAchieved
                        ? `Overachiever Milestone reached (${todayAnswered}/${milestoneThreshold} Qs)! Confetti celebration unlocked.`
                        : `Exceed your ${dailyGoal} Qs/day goal by >20% (${milestoneThreshold} Qs) to unlock the Overachiever Milestone confetti celebration.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const needed = Math.max(1, milestoneThreshold - todayAnswered);
                    setBonusDemoAnswered((prev) => prev + needed);
                    triggerMilestoneCelebration();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Simulate exceeding daily goal by >20% and trigger milestone confetti celebration"
                >
                  <PartyPopper className="w-3 h-3 text-amber-600" />
                  <span>{isMilestoneAchieved ? 'Replay Milestone' : 'Reach +20% Milestone'}</span>
                </button>
              </div>

              <div className="mt-2.5 w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMilestoneAchieved
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500'
                      : 'bg-gradient-to-r from-[#0078D4] to-amber-500'
                  }`}
                  style={{ width: `${milestoneProgressPct}%` }}
                />
              </div>
            </div>

            {saveToast && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveToast}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
