import React, { useEffect, useMemo, useState } from 'react';
import {
  Target,
  X,
  Check,
  Sparkles,
  Award,
  Flame,
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types/quiz';
import { setDailyGoal } from '../utils/storage';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

interface EditDailyGoalModalProps {
  stats: UserStats;
  todayAnsweredCount: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStats?: (newStats: UserStats) => void;
  onOpenFullReminders?: () => void;
}

const GOAL_PRESETS = [5, 10, 15, 20, 30, 50];

export const EditDailyGoalModal: React.FC<EditDailyGoalModalProps> = ({
  stats,
  todayAnsweredCount,
  isOpen,
  onClose,
  onUpdateStats,
  onOpenFullReminders,
}) => {
  const savedGoal = Math.max(1, Math.min(100, stats.dailyGoal || 10));
  const [draftGoal, setDraftGoal] = useState<number>(savedGoal);
  const [goalInputText, setGoalInputText] = useState<string>(String(savedGoal));
  const [justSaved, setJustSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const next = Math.max(1, Math.min(100, stats.dailyGoal || 10));
      setDraftGoal(next);
      setGoalInputText(String(next));
      setJustSaved(false);
    }
  }, [isOpen, stats.dailyGoal]);

  const safeDraftGoal = Math.max(1, Math.min(100, draftGoal || 10));
  const progressPercent = Math.min(
    100,
    Math.round((todayAnsweredCount / safeDraftGoal) * 100)
  );
  const isGoalReached = todayAnsweredCount >= safeDraftGoal;

  // Compute immediate Milestone Achievement Thresholds for both Saved Goal and Draft Goal
  const thresholds = useMemo(() => {
    const calc = (target: number) => ({
      m25: Math.max(1, Math.ceil(target * 0.25)),
      m50: Math.max(1, Math.ceil(target * 0.5)),
      m100: target,
    });
    const current = calc(savedGoal);
    const next = calc(safeDraftGoal);

    return [
      {
        id: '25',
        pctLabel: '25% Milestone',
        badgeTitle: 'Opening Momentum',
        thresholdQs: next.m25,
        deltaQs: next.m25 - current.m25,
        unlocked: todayAnsweredCount >= next.m25,
        remainingQs: Math.max(0, next.m25 - todayAnsweredCount),
        accentBg: 'bg-sky-50 border-sky-200',
        accentBadge: 'bg-sky-600 text-white',
      },
      {
        id: '50',
        pctLabel: '50% Milestone',
        badgeTitle: 'Halfway Mastery',
        thresholdQs: next.m50,
        deltaQs: next.m50 - current.m50,
        unlocked: todayAnsweredCount >= next.m50,
        remainingQs: Math.max(0, next.m50 - todayAnsweredCount),
        accentBg: 'bg-emerald-50 border-emerald-200',
        accentBadge: 'bg-emerald-600 text-white',
      },
      {
        id: '100',
        pctLabel: '100% Daily Target',
        badgeTitle: 'Daily Goal Met ✨',
        thresholdQs: next.m100,
        deltaQs: next.m100 - current.m100,
        unlocked: todayAnsweredCount >= next.m100,
        remainingQs: Math.max(0, next.m100 - todayAnsweredCount),
        accentBg: 'bg-amber-50 border-amber-200',
        accentBadge: 'bg-amber-600 text-white',
      },
    ];
  }, [savedGoal, safeDraftGoal, todayAnsweredCount]);

  const goalDelta = safeDraftGoal - savedGoal;
  const estimatedMinutes = Math.max(2, Math.round((safeDraftGoal * 45) / 60));

  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPercent / 100) * ringCircumference;

  const sliderMax = 60;
  const sliderVal = Math.min(sliderMax, safeDraftGoal);
  const sliderFillPct = Math.round(((sliderVal - 1) / (sliderMax - 1)) * 100);

  const updateDraftValue = (val: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(val)));
    setDraftGoal(clamped);
    setGoalInputText(String(clamped));
  };

  const handleSave = () => {
    const parsed = parseInt(goalInputText, 10);
    const cleanGoal = !isNaN(parsed)
      ? Math.max(1, Math.min(100, parsed))
      : safeDraftGoal;
    updateDraftValue(cleanGoal);

    const updated = setDailyGoal(stats, cleanGoal);
    if (onUpdateStats) {
      onUpdateStats(updated);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('az900_daily_goal_saved', {
          detail: { goal: cleanGoal, todayAnswered: todayAnsweredCount },
        })
      );
    }

    if (todayAnsweredCount >= cleanGoal) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.55 },
        });
      } catch {
        // Ignore confetti failures in headless mode
      }
    }

    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 550);
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      closeOnBackdropClick={true}
      ariaLabel="Edit Daily Goal"
    >
      {/* Modal Header */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/90 via-white to-sky-50/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-[#0078D4] text-white shadow-xs shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                Edit Daily Goal
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-200">
                Milestone Threshold Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Slide or enter your daily AZ-900 question target to preview milestone unlocks in real time
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          aria-label="Close Edit Daily Goal modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
        {/* Top Live Ring + Target Summary Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50/60 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Live Interactive Ring Preview */}
              <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r={ringRadius}
                    fill="none"
                    stroke={isGoalReached ? '#A7F3D0' : '#FED7AA'}
                    strokeWidth="4.5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={ringRadius}
                    fill="none"
                    stroke={isGoalReached ? '#059669' : '#EA580C'}
                    strokeWidth="4.5"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{
                      transition:
                        'stroke-dashoffset 0.35s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.25s ease',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Flame
                    className={`w-4 h-4 ${
                      isGoalReached
                        ? 'text-emerald-600 fill-emerald-500'
                        : 'text-orange-600 fill-orange-500'
                    }`}
                  />
                  <span className="text-[9px] font-black text-slate-800 leading-none mt-0.5">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  New Daily Target Preview
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {safeDraftGoal} Qs/day
                  </span>
                  {goalDelta !== 0 ? (
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        goalDelta > 0
                          ? 'bg-sky-100 text-sky-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {goalDelta > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {goalDelta > 0 ? `+${goalDelta}` : goalDelta} vs current ({savedGoal})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      <Minus className="w-3 h-3" />
                      Current Target
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700">
                    Solved Today: {todayAnsweredCount} Qs
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0078D4]" />
                    ~{estimatedMinutes} min/day pace
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Responsive Numeric Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="edit-daily-goal-slider"
                className="font-extrabold text-slate-800"
              >
                Adjust Daily Target Slider
              </label>
              <span className="font-mono font-black text-[#0078D4]">
                {safeDraftGoal} Questions
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-400 w-5 text-center">
                1
              </span>
              <input
                id="edit-daily-goal-slider"
                type="range"
                min={1}
                max={sliderMax}
                step={1}
                value={sliderVal}
                onChange={(e) => updateDraftValue(parseInt(e.target.value, 10))}
                aria-label="Daily target questions numeric slider"
                style={{
                  background: `linear-gradient(to right, #0078D4 0%, #0ea5e9 ${sliderFillPct}%, #cbd5e1 ${sliderFillPct}%, #cbd5e1 100%)`,
                }}
                className="flex-1 h-2.5 rounded-full appearance-none cursor-pointer accent-[#0078D4]"
              />
              <span className="text-[11px] font-black text-slate-400 w-7 text-right">
                60+
              </span>
            </div>

            {/* Responsive Numeric Stepper + Direct Input + Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateDraftValue(safeDraftGoal - 1)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center cursor-pointer"
                  aria-label="Decrease daily goal by 1"
                >
                  -
                </button>
                <div className="relative w-24">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={goalInputText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setGoalInputText(raw);
                      const parsed = parseInt(raw, 10);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
                        setDraftGoal(parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(goalInputText, 10);
                      if (!isNaN(parsed) && parsed >= 1) {
                        updateDraftValue(parsed);
                      } else {
                        updateDraftValue(safeDraftGoal);
                      }
                    }}
                    aria-label="Daily target questions numeric input"
                    className="w-full h-9 px-2.5 pr-7 rounded-xl bg-white border-2 border-slate-300 focus:border-[#0078D4] focus:outline-none text-center font-black text-sm text-slate-900"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    Qs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateDraftValue(safeDraftGoal + 1)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center cursor-pointer"
                  aria-label="Increase daily goal by 1"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateDraftValue(preset)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      safeDraftGoal === preset
                        ? 'bg-[#0078D4] text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Immediate Feedback: How Changing the Target Shifts Milestone Achievement Thresholds */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0078D4]" />
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                Immediate Milestone Threshold Impact
              </h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {isGoalReached
                ? 'All daily milestones unlocked with this target!'
                : `${Math.max(0, safeDraftGoal - todayAnsweredCount)} more Qs needed today for 100%`}
            </span>
          </div>

          {/* Visual Linear Milestone Bar */}
          <div className="space-y-1.5">
            <div className="relative h-3 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-sky-500 via-[#0078D4] to-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
              {/* 25% and 50% milestone dividers */}
              <span
                className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-2xs"
                style={{ left: '25%' }}
                title={`25% Milestone: ${thresholds[0].thresholdQs} Qs`}
              />
              <span
                className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-2xs"
                style={{ left: '50%' }}
                title={`50% Milestone: ${thresholds[1].thresholdQs} Qs`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-0.5">
              <span>0 Qs</span>
              <span>25%: {thresholds[0].thresholdQs} Qs</span>
              <span>50%: {thresholds[1].thresholdQs} Qs</span>
              <span>100%: {thresholds[2].thresholdQs} Qs</span>
            </div>
          </div>

          {/* 3 Live Milestone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {thresholds.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border ${m.accentBg} space-y-1.5 transition-all`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${m.accentBadge}`}
                  >
                    {m.pctLabel}
                  </span>
                  {m.deltaQs !== 0 && (
                    <span
                      className={`text-[10px] font-black font-mono ${
                        m.deltaQs > 0 ? 'text-sky-700' : 'text-amber-700'
                      }`}
                    >
                      {m.deltaQs > 0 ? `+${m.deltaQs}Q` : `${m.deltaQs}Q`}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-black text-slate-900 font-mono">
                    {m.thresholdQs} Qs
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 truncate">
                    {m.badgeTitle}
                  </span>
                </div>

                <div className="text-[11px] font-extrabold">
                  {m.unlocked ? (
                    <span className="text-emerald-700 inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Unlocked today ✓
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      {m.remainingQs} more {m.remainingQs === 1 ? 'question' : 'questions'} to unlock
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {onOpenFullReminders && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullReminders();
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#0078D4] bg-sky-50 hover:bg-sky-100 border border-sky-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open WhatsApp Peer Schedule & Motivation Alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminders &amp; Alerts</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`px-5 py-2 rounded-xl font-black text-xs inline-flex items-center gap-1.5 text-white shadow-xs transition-all cursor-pointer ${
            justSaved
              ? 'bg-emerald-600 scale-102'
              : 'bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:from-[#005A9E] hover:to-[#004578]'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{justSaved ? 'Goal Saved!' : `Apply ${safeDraftGoal} Qs/Day`}</span>
        </button>
      </div>
    </ResponsiveModalContainer>
  );
};
