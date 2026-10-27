import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Award,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  TrendingUp,
  X,
  Shuffle,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion, KenyanFlagMiniEmblem } from './MotifDecorations';

// Curated automatically randomized short encouraging messages (Harambee spirit + Azure exam success)
const ENCOURAGING_MESSAGES = [
  'Harambee! Small, steady steps turn complex cloud architectures into second nature.',
  'Umoja ni nguvu — unity is strength! You are pacing steadily toward that 700+ pass mark.',
  'Pole pole ndio mwendo (Slow and steady wins the race). Keep up your streak, future Azure Architect!',
  'Every question answered is one step closer to your official Microsoft AZ-900 certification!',
  'Habari ya wingu! Your cloud intuition is getting sharper with every scenario you solve.',
  'Consistency is your superpower. Your dedication today will shine brightly on exam day!',
  'Kazi nzuri! You are mastering cloud compute, identity, and governance like a true pro.',
  'Believe in your preparation. The Global Harambee Azure Cohort is cheering you on to victory!',
  'Mvumilivu hula mbivu (Patience and diligence yield sweet fruit). Keep solving and learning!',
  'One scenario at a time, one concept at a time — you are building lasting cloud mastery!',
  'You have what it takes! Each review reinforces high-yield exam traps before test day.',
  'Empower your cloud journey! Trust your instincts and celebrate every milestone today.',
];

interface StudentStatsCloudPopupProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  todayAnsweredCount: number;
  dailyGoal: number;
  anchorSide?: 'left' | 'right';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const StudentStatsCloudPopup: React.FC<StudentStatsCloudPopupProps> = ({
  isOpen,
  onClose,
  stats,
  todayAnsweredCount,
  dailyGoal,
  anchorSide = 'left',
  onMouseEnter,
  onMouseLeave,
  onNavigateToTab,
}) => {
  // Pick an automatically random encouraging message when the popup opens or via shuffle
  const [quoteIndex, setQuoteIndex] = useState<number>(() =>
    Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)
  );

  useEffect(() => {
    if (isOpen) {
      setQuoteIndex(Math.floor(Math.random() * ENCOURAGING_MESSAGES.length));
    }
  }, [isOpen]);

  const handleShuffleQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuoteIndex((prev) => (prev + 1) % ENCOURAGING_MESSAGES.length);
  };

  // Compute live metrics
  const totalAnswered = stats.totalAnswered || 0;
  const totalCorrect = stats.totalCorrect || 0;
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const streakDays = stats.streakDays || 0;
  const completedModulesCount = (stats.completedModules || []).length;
  const safeGoal = Math.max(1, dailyGoal || 10);
  const goalProgressPct = Math.min(100, Math.round((todayAnsweredCount / safeGoal) * 100));
  const isGoalReached = todayAnsweredCount >= safeGoal;

  // Readiness evaluation
  const readinessTier = useMemo(() => {
    if (overallAccuracy >= 85 && totalAnswered >= 30) {
      return {
        label: 'Exam Ready (700+ Pass Range)',
        color: 'text-emerald-700 bg-emerald-100 border-emerald-300',
        badge: 'Mastery',
      };
    }
    if (overallAccuracy >= 70 && totalAnswered >= 15) {
      return {
        label: 'Strong Foundation (On Track)',
        color: 'text-sky-700 bg-sky-100 border-sky-300',
        badge: 'Competent',
      };
    }
    return {
      label: 'Foundational Phase (Building)',
      color: 'text-amber-800 bg-amber-100 border-amber-300',
      badge: 'In Progress',
    };
  }, [overallAccuracy, totalAnswered]);

  if (!isOpen) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-modal="false"
      aria-label="Student Stats and Encouragement Dossier"
      className={`absolute top-full mt-2.5 z-50 ${
        anchorSide === 'left' ? 'left-0' : 'right-0'
      } w-[92vw] sm:w-[380px] md:w-[410px] max-w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto overscroll-contain bg-white/95 backdrop-blur-xl rounded-2xl border border-sky-200 shadow-2xl shadow-sky-900/15 animate-in fade-in-0 zoom-in-95 duration-200 select-none`}
      style={{
        // Visual indicator that this is ~1/4 screen size window on standard viewports
        minHeight: '280px',
      }}
    >
      {/* Subtle Top Azure Gradient Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0078D4] via-sky-400 to-[#006600] rounded-t-2xl" />

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Header: Cloud Logo Badge + Title + Close Button */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white shadow-xs shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={11} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm text-slate-900 leading-tight">
                  Student Cloud Dossier
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/20">
                  Live Stats
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                AZ-900 Learning &amp; Readiness Snapshot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShuffleQuote}
              className="p-1 rounded-lg text-slate-400 hover:text-[#0078D4] hover:bg-sky-50 transition-colors cursor-pointer"
              title="Shuffle encouraging message"
              aria-label="Shuffle encouraging message"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close popup"
              aria-label="Close dossier popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Automatically Random Short Encouraging Message Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 via-sky-50 to-emerald-50/50 p-3 border border-amber-200/80 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/80 flex items-center gap-1">
                  <KenyanFlagMiniEmblem size={11} />
                  <span>Daily Encouragement</span>
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">
                  Randomized
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-snug italic">
                "{ENCOURAGING_MESSAGES[quoteIndex]}"
              </p>
            </div>
          </div>
        </div>

        {/* 2x2 Student Core Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-left">
          {/* 1. Overall Accuracy */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-[#0078D4]" />
                <span>Accuracy</span>
              </span>
              <span className="text-slate-400">{totalCorrect}/{totalAnswered}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">
                {overallAccuracy}%
              </span>
              <span className={`text-[10px] font-bold ${overallAccuracy >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {overallAccuracy >= 80 ? 'Proficient' : 'Practicing'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0078D4] to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${overallAccuracy}%` }}
              />
            </div>
          </div>

          {/* 2. Questions Solved & Today's Volume */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-sky-600" />
                <span>Questions</span>
              </span>
              <span className="text-slate-400">Total</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">
                {totalAnswered}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                ({todayAnsweredCount} today)
              </span>
            </div>
            <p className="text-[9.5px] text-slate-500 truncate">
              {stats.bookmarks?.length || 0} bookmarked questions
            </p>
          </div>

          {/* 3. Active Study Streak */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Streak</span>
              </span>
              <span className="text-amber-600 font-extrabold">Active</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-amber-600">
                {streakDays}
              </span>
              <span className="text-[10px] font-bold text-slate-600">
                {streakDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-500 truncate">
              Last: {stats.lastActiveDate || 'Today'}
            </p>
          </div>

          {/* 4. Modules Mastered */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#006600]" />
                <span>Modules</span>
              </span>
              <span className="text-slate-400">of 11</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-emerald-700">
                {completedModulesCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Complete
              </span>
            </div>
            <p className="text-[9.5px] text-slate-500 truncate">
              {11 - completedModulesCount} modules to complete
            </p>
          </div>
        </div>

        {/* Daily Study Target Mini Bar */}
        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-extrabold text-slate-800 text-[11px]">
                Today's Daily Goal
              </span>
              {isGoalReached && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Target Met!
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {todayAnsweredCount} of {safeGoal} questions solved today ({goalProgressPct}%)
            </p>
          </div>
          <div className="shrink-0 text-right font-black text-sm text-[#0078D4]">
            {goalProgressPct}%
          </div>
        </div>

        {/* Readiness Tag & Quick Link */}
        <div className="pt-0.5 flex items-center justify-between gap-2">
          <div className={`px-2 py-1 rounded-lg text-[10px] font-black border truncate ${readinessTier.color}`}>
            <span>{readinessTier.label}</span>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToTab('profile');
              }}
              className="text-[11px] font-bold text-[#0078D4] hover:text-[#005A9E] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Full Profile</span>
              <TrendingUp className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
