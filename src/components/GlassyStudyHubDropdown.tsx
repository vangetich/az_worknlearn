import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Award,
  Flame,
  TrendingUp,
  Download,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Compass,
  ArrowRight,
  Target,
  Trophy,
  History,
  Zap,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { BADGE_DEFINITIONS } from './BadgeSystem';
import { MaasaiMedallion } from './MotifDecorations';
import { AppTab } from './Header';

interface GlassyStudyHubDropdownProps {
  stats: UserStats;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenExport: () => void;
  isMenuHidden: boolean;
  onToggleSlideMenu: () => void;
  onOpenResetModal?: () => void;
}

export const GlassyStudyHubDropdown: React.FC<GlassyStudyHubDropdownProps> = ({
  stats,
  activeTab,
  setActiveTab,
  onOpenExport,
  isMenuHidden,
  onToggleSlideMenu,
  onOpenResetModal,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const unlockedBadgesCount = useMemo(() => {
    return BADGE_DEFINITIONS.filter((b) => b.isUnlocked(stats, overallAccuracy)).length;
  }, [stats, overallAccuracy]);

  // Today's answers toward daily goal
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Semi-transparent Glassy Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-white/70 hover:bg-white/85 backdrop-blur-md border border-sky-300/50 shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 text-slate-800 font-bold text-xs sm:text-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group animate-azure-glow"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-[#0078D4] to-sky-400 text-white shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        <span className="font-extrabold tracking-tight text-slate-900 group-hover:text-[#0078D4] transition-colors">
          Study Hub Features
        </span>

        {/* Quick Metrics Badges inside Trigger */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 border-l border-slate-200/80 pl-2.5">
          <span className="flex items-center gap-1 text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-200/60">
            <Trophy className="w-3 h-3 text-amber-600" />
            <span>{unlockedBadgesCount}</span>
          </span>
          <span className="flex items-center gap-1 text-orange-700 bg-orange-50/80 px-1.5 py-0.5 rounded-md border border-orange-200/60">
            <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
            <span>{stats.streakDays}d</span>
          </span>
          <span className="flex items-center gap-1 text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded-md border border-blue-200/60">
            <TrendingUp className="w-3 h-3 text-[#0078D4]" />
            <span>{overallAccuracy}%</span>
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0078D4]' : ''
          }`}
        />
      </button>

      {/* Semi-transparent Glassy Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2.5 w-84 sm:w-96 rounded-2xl bg-white/90 backdrop-blur-xl border border-sky-200/80 shadow-2xl shadow-blue-500/15 p-3 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Note */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MaasaiMedallion size={16} />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                Quick Navigation &amp; Tools
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0078D4] border border-blue-200/60">
              AZ-900 Prep
            </span>
          </div>

          {/* ITEM 1: Milestone Badges */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('analytics');
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-amber-900">
                  Milestone Badges
                </h4>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                  {unlockedBadgesCount}/{BADGE_DEFINITIONS.length} Earned
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review unlocked badges &amp; milestones (Cloud Rookie, Azure Architect, etc.)
              </p>
            </div>
          </button>

          {/* ITEM 2: Daily Streaks & Learning Goal */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50/70 border border-transparent hover:border-orange-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-orange-900">
                  Daily Streaks &amp; Learning Goal
                </h4>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-900">
                  {stats.streakDays} Day Streak
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Today: {todayAnswered} of {dailyGoal} questions answered ({Math.min(100, Math.round((todayAnswered / dailyGoal) * 100))}%)
              </p>
            </div>
          </button>

          {/* ITEM 3: Domain Confidence Radar */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('analytics');
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-blue-900">
                  Domain Confidence Radar
                </h4>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-[#0078D4]">
                  {overallAccuracy}% Accuracy
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Adaptive mastery model across all 3 paths &amp; 12 official modules
              </p>
            </div>
          </button>

          {/* ITEM: Adaptive Quiz Mode */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('adaptive');
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-blue-900">
                  Adaptive Quiz Mode
                </h4>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  Dynamic Difficulty
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically prioritizes questions from your weakest domains
              </p>
            </div>
          </button>

          {/* ITEM: Quiz Review History */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-slate-800 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <History className="w-4 h-4 text-sky-300" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-slate-900">
                  Review Past Sessions
                </h4>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                  Trajectory
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Track past scores and review missed scenario questions
              </p>
            </div>
          </button>

          {/* ITEM 4: Export Progress Report */}
          <button
            type="button"
            onClick={() => {
              onOpenExport();
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-sky-900">
                  Export Progress Report
                </h4>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  PDF / JSON
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download your official readiness transcript and domain breakdown
              </p>
            </div>
          </button>

          {/* ITEM 5: Slide Menu Bar Features */}
          <button
            type="button"
            onClick={() => {
              onToggleSlideMenu();
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div className="grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-900">
                  Slide Menu Features
                </h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {isMenuHidden ? 'Currently Hidden' : 'Currently Pinned'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isMenuHidden
                  ? 'Click to slide menu down and keep it visible'
                  : 'Click to slide menu up for a cleaner study canvas'}
              </p>
            </div>
          </button>

          {/* ITEM 6: Reset Module Confidence */}
          {onOpenResetModal && (
            <button
              type="button"
              onClick={() => {
                onOpenResetModal();
                setIsOpen(false);
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50/70 border border-transparent hover:border-rose-200/80 transition-all flex items-start gap-3 group/item cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-rose-600 text-white shadow-2xs shrink-0 mt-0.5 group-hover/item:scale-105 transition-transform">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="grow">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-rose-900">
                    Reset Module Confidence
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    Scoped Reset
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clear progress on a specific module to re-train from scratch
                </p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
