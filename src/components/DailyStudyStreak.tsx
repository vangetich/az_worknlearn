import React, { useState } from 'react';
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
}

export const DailyStudyStreak: React.FC<DailyStudyStreakProps> = ({
  stats,
  onUpdateStats,
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>(
    String(stats.dailyGoal || 10)
  );
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);

  // Today's attempts calculation
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

  const handleSaveGoal = (targetValue: number) => {
    if (isNaN(targetValue) || targetValue <= 0) return;
    const cleanGoal = Math.max(1, Math.min(100, Math.round(targetValue)));
    const updated = setDailyGoal(stats, cleanGoal);
    if (onUpdateStats) {
      onUpdateStats(updated);
    }
    setGoalInput(String(cleanGoal));
    setIsEditingGoal(false);
    setGoalFeedback(`Goal set to ${cleanGoal} questions/day!`);
    setTimeout(() => setGoalFeedback(null), 2500);
  };

  // Progress ring constants (r=11 in 32x32 viewbox -> circumference ~ 69.115)
  const ringRadius = 11;
  const ringCircumference = 2 * Math.PI * ringRadius; // ~69.12
  const ringOffset =
    ringCircumference - (goalPercent / 100) * ringCircumference;

  return (
    <div className="relative">
      {/* Trigger Button with Progress Ring around Streak Flame */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all group ${
          isGoalReached
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-300 text-emerald-950 shadow-2xs'
            : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 hover:from-orange-100 hover:to-amber-100 border-orange-200/80 text-orange-950 shadow-2xs'
        }`}
        title={`Daily Goal: ${todayAnswered}/${dailyGoal} questions (${goalPercent}%). Streak: ${streak} days. Click to view or adjust goal.`}
      >
        {/* Flame icon with Circular Progress Ring */}
        <div
          className={`relative flex items-center justify-center w-7 h-7 ${
            isGoalReached ? 'animate-goal-glow rounded-full' : ''
          }`}
        >
          <svg
            className="w-7 h-7 -rotate-90 origin-center"
            viewBox="0 0 32 32"
          >
            {/* Background Track Circle */}
            <circle
              cx="16"
              cy="16"
              r={ringRadius}
              fill="none"
              stroke={isGoalReached ? '#A7F3D0' : '#FED7AA'}
              strokeWidth="2.75"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="16"
              cy="16"
              r={ringRadius}
              fill="none"
              stroke={isGoalReached ? '#16A34A' : '#EA580C'}
              strokeWidth="2.75"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Flame Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame
              className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
                isGoalReached
                  ? 'text-emerald-600 fill-emerald-500'
                  : 'text-orange-600 fill-orange-500'
              }`}
            />
          </div>

          {/* Goal Completed Badge */}
          {isGoalReached && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
          )}
        </div>

        {/* Streak and Daily Goal Info */}
        <div className="flex items-center gap-1.5">
          <span className="font-black text-xs text-slate-900">
            {streak}d
          </span>
          <span className="text-slate-300">•</span>
          <span
            className={`text-xs font-extrabold ${
              isGoalReached ? 'text-emerald-700' : 'text-orange-800'
            }`}
          >
            {todayAnswered}/{dailyGoal}
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
            Goal
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
      </button>

      {/* Popover Dropdown Card */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowDropdown(false);
              setIsEditingGoal(false);
            }}
          />

          <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl border border-slate-200 card-elevation shadow-2xl p-5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 space-y-4">
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

            {/* Daily Goal Visual Progress Card */}
            <div
              className={`rounded-xl p-4 border space-y-3 ${
                isGoalReached
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50 border-emerald-200'
                  : 'bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-yellow-50/40 border-orange-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target
                    className={`w-4 h-4 ${
                      isGoalReached ? 'text-emerald-600' : 'text-orange-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Today&apos;s Target Progress
                  </span>
                </div>

                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-[11px] font-bold text-[#0078D4] hover:underline flex items-center gap-1"
                >
                  {isEditingGoal ? 'Cancel' : 'Change Goal'}
                </button>
              </div>

              {/* Progress Count & Percentage */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl font-black ${
                      isGoalReached ? 'text-emerald-800' : 'text-orange-950'
                    }`}
                  >
                    {todayAnswered}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    / {dailyGoal} questions answered
                  </span>
                </div>
                <span
                  className={`text-xs font-black ${
                    isGoalReached ? 'text-emerald-700' : 'text-orange-700'
                  }`}
                >
                  {goalPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGoalReached
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500'
                  }`}
                  style={{ width: `${goalPercent}%` }}
                />
              </div>

              {/* Motivational Status Text */}
              <div className="text-xs font-medium">
                {isGoalReached ? (
                  <p className="text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Goal reached!</strong> Every extra scenario completed today cements your mastery for exam day.
                    </span>
                  </p>
                ) : (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {dailyGoal - todayAnswered} more {dailyGoal - todayAnswered === 1 ? 'question' : 'questions'} needed to hit today&apos;s goal. Keep going!
                    </span>
                  </p>
                )}
              </div>

              {/* Goal Input & Quick Preset Selectors */}
              {isEditingGoal && (
                <div className="pt-2 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Set Target Questions Per Day:
                  </label>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 15, 20, 30].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleSaveGoal(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          dailyGoal === preset
                            ? 'bg-[#0078D4] text-white border-[#0078D4]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset} / day
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0078D4]"
                    />
                    <button
                      onClick={() => handleSaveGoal(parseInt(goalInput, 10))}
                      className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Goal</span>
                    </button>
                  </div>
                </div>
              )}

              {goalFeedback && (
                <p className="text-[11px] font-bold text-emerald-700 animate-in fade-in">
                  ✓ {goalFeedback}
                </p>
              )}
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
        </>
      )}
    </div>
  );
};
