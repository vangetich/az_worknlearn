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
  Plus,
  Minus,
  Check,
  X,
  ExternalLink,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { BADGE_DEFINITIONS } from './BadgeSystem';
import { MaasaiMedallion } from './MotifDecorations';
import { AppTab } from './Header';
import { setDailyGoal } from '../utils/storage';
import { DomainConfidenceRadar } from './DomainConfidenceRadar';

interface GlassyStudyHubDropdownProps {
  stats: UserStats;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenExport: () => void;
  isMenuHidden: boolean;
  onToggleSlideMenu: () => void;
  onOpenResetModal?: () => void;
  onUpdateStats?: (newStats: UserStats) => void;
  onDrillDomain?: (moduleIds: number[]) => void;
  onOpenWeakAreasReview?: () => void;
  onOpenStudyRoom?: () => void;
}

export const GlassyStudyHubDropdown: React.FC<GlassyStudyHubDropdownProps> = ({
  stats,
  activeTab,
  setActiveTab,
  onOpenExport,
  isMenuHidden,
  onToggleSlideMenu,
  onOpenResetModal,
  onUpdateStats,
  onDrillDomain,
  onOpenWeakAreasReview,
  onOpenStudyRoom,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
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
  const goalPercent = Math.min(100, Math.round((todayAnswered / dailyGoal) * 100));
  const isGoalReached = todayAnswered >= dailyGoal && dailyGoal > 0;

  // Direct goal adjusters inside Study Hub
  const handleAdjustGoal = (newVal: number) => {
    const clamped = Math.max(1, Math.min(100, newVal));
    const updated = setDailyGoal(stats, clamped);
    if (onUpdateStats) {
      onUpdateStats(updated);
    }
  };

  const handleOpenGoalModal = () => {
    window.dispatchEvent(new CustomEvent('az900_open_daily_goal_modal'));
    setIsOpen(false);
  };

  const handleOpenRadarModal = () => {
    setShowRadarModal(true);
    setIsOpen(false);
  };

  const handleGoToAnalyticsRadar = () => {
    setActiveTab('analytics');
    setIsOpen(false);
    setTimeout(() => {
      const el = document.getElementById('domain-confidence-radar-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  return (
    <>
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
          <div className="absolute left-1/2 -translate-x-1/2 mt-2.5 w-88 sm:w-104 rounded-2xl bg-white/95 backdrop-blur-xl border border-sky-200/80 shadow-2xl shadow-blue-500/15 p-3.5 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto scrollbar-thin">
            {/* Header Note */}
            <div className="px-2.5 py-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MaasaiMedallion size={16} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Study Hub Features &amp; Tools
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0078D4] border border-blue-200/60">
                AZ-900 Prep
              </span>
            </div>

            {/* FEATURE 1: Daily Learning Goals & Streak (Interactive Card) */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50/90 via-amber-50/60 to-white border border-orange-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-2xs">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>Daily Learning Goal &amp; Streak</span>
                      {isGoalReached && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                          Hit! ✨
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {stats.streakDays} Day Streak • {todayAnswered} of {dailyGoal} completed today
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGoalModal}
                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open full configuration modal"
                >
                  <Target className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 bg-white/70 p-2 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600">Daily Target Progress</span>
                  <span className="font-black text-orange-900">{goalPercent}%</span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGoalReached ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
              </div>

              {/* Quick Goal Adjuster Stepper & Presets */}
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-[11px] font-bold text-slate-600">Adjust Target:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(dailyGoal - 5)}
                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                    title="Decrease by 5"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-black text-slate-900 px-2 min-w-7 text-center">
                    {dailyGoal}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(dailyGoal + 5)}
                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                    title="Increase by 5"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1 ml-1.5 border-l border-slate-200 pl-1.5">
                    {[10, 15, 20, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAdjustGoal(preset)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-colors cursor-pointer ${
                          dailyGoal === preset
                            ? 'bg-[#0078D4] text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FEATURE 2: Domain Confidence Radar (Interactive Card) */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-2xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>Domain Confidence Radar</span>
                      <span className="text-[9px] bg-blue-100 text-[#0078D4] px-1.5 py-0.5 rounded font-black">
                        Poly-Mesh
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Multi-axial readiness tracking against 70% passing threshold
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-[#0078D4] border border-blue-200">
                  {overallAccuracy}% Avg
                </span>
              </div>

              {/* Action Buttons for Radar */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenRadarModal}
                  className="py-1.5 px-2.5 rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Inspect Radar Chart</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToAnalyticsRadar}
                  className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-[#0078D4]" />
                  <span>Go to Analytics</span>
                </button>
              </div>
            </div>

            {/* Other Study Hub Tools */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              {/* ITEM: Weak Areas Review Drill */}
              {onOpenWeakAreasReview && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenWeakAreasReview();
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-rose-50/70 border border-transparent hover:border-rose-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-2xs shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="grow">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-rose-900">
                        Weak Areas Review
                      </h4>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                        5–10 Scenarios
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Drill practice scenarios focused only on your lowest scoring modules
                    </p>
                  </div>
                </button>
              )}

              {/* ITEM: Virtual Study Room */}
              {onOpenStudyRoom && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenStudyRoom();
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-[#0078D4] text-white shadow-2xs shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="grow">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-blue-900">
                        Virtual Study Room
                      </h4>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                        Live Circle
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Discuss questions and mnemonics with simulated peer learners
                    </p>
                  </div>
                </button>
              )}

              {/* ITEM: Adaptive Quiz Mode */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('adaptive');
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-2xs shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-blue-900">
                      Adaptive Quiz Mode
                    </h4>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      Dynamic
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Prioritizes questions from your weakest domains automatically
                  </p>
                </div>
              </button>

              {/* ITEM: Review History */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-all flex items-start gap-2.5 group/item cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-slate-800 text-white shadow-2xs shrink-0 mt-0.5">
                  <History className="w-3.5 h-3.5 text-sky-300" />
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      Review Past Sessions
                    </h4>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                      Trajectory
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Track scores and missed scenario questions
                  </p>
                </div>
              </button>

              {/* ITEM: Milestone Badges */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('analytics');
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-2xs shrink-0 mt-0.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-amber-900">
                      Milestone Badges
                    </h4>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                      {unlockedBadgesCount}/{BADGE_DEFINITIONS.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Review earned achievements and streaks
                  </p>
                </div>
              </button>

              {/* ITEM: Export Progress Report */}
              <button
                type="button"
                onClick={() => {
                  onOpenExport();
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-sky-500 text-white shadow-2xs shrink-0 mt-0.5">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-sky-900">
                      Export Progress Report
                    </h4>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                      PDF / JSON
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Download readiness transcript
                  </p>
                </div>
              </button>

              {/* ITEM: Slide Menu Toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggleSlideMenu();
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs shrink-0 mt-0.5">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-900">
                      Slide Menu Features
                    </h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                      {isMenuHidden ? 'Hidden' : 'Pinned'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isMenuHidden ? 'Click to pin menu visible' : 'Click to hide menu for clean canvas'}
                  </p>
                </div>
              </button>

              {/* ITEM: Reset Module Confidence */}
              {onOpenResetModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenResetModal();
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-rose-50/70 border border-transparent hover:border-rose-200/80 transition-all flex items-start gap-2.5 group/item cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-2xs shrink-0 mt-0.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div className="grow">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-rose-900">
                        Reset Module Confidence
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                        Scoped
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Clear individual module attempt history
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Standalone Domain Confidence Radar Modal */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0078D4] text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Domain Confidence Radar • Study Hub Diagnostic
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full poly-axial evaluation of knowledge domains against 700 passing mark
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRadarModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <DomainConfidenceRadar
                stats={stats}
                onDrillDomain={(moduleIds) => {
                  setShowRadarModal(false);
                  if (onDrillDomain) {
                    onDrillDomain(moduleIds);
                  } else {
                    setActiveTab('adaptive');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
