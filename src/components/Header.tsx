import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Sparkles,
  Bot,
  Layers,
  TrendingUp,
  History,
  Zap,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Menu,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  KitengeRibbon,
  MaasaiMedallion,
  MoranShieldMotif,
  WarriorSpearBadge,
  WavyAzureFabricMotif,
} from './MotifDecorations';
import { UserStats, Question } from '../types/quiz';
import { DailyStudyStreak } from './DailyStudyStreak';
import { PWAInstallButton } from './PWAInstallButton';
import { DailyGoalAlertsModal } from './DailyGoalAlertsModal';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearchBar } from './GlobalSearchBar';

export type AppTab =
  | 'quiz'
  | 'adaptive'
  | 'flashcards'
  | 'history'
  | 'mock'
  | 'ai-builder'
  | 'assistant'
  | 'study-decks'
  | 'analytics'
  | 'leaderboard'
  | 'wisdom'
  | 'profile';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedPathId?: number | 'all';
  onSelectPath?: (pathId: number | 'all') => void;
  stats: UserStats;
  onOpenExport?: () => void;
  onUpdateStats?: (newStats: UserStats) => void;
  fireStreakTrigger?: number;
  onOpenReviewSession?: () => void;
  questions?: Question[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSelectQuestion?: (question: Question) => void;
  onSelectModule?: (moduleId: number, pathId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPathId = 'all',
  onSelectPath,
  stats,
  onOpenExport,
  onUpdateStats,
  fireStreakTrigger = 0,
  onOpenReviewSession,
  questions = [],
  searchQuery = '',
  onSearchQueryChange,
  onSelectQuestion,
  onSelectModule,
}) => {
  const [showGoalAlertsModal, setShowGoalAlertsModal] = useState<boolean>(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState<boolean>(false);
  const [isMenuBarHidden, setIsMenuBarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_hide_menu_bar') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMenuBar = () => {
    setIsMenuBarHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_hide_menu_bar', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const missedCount = React.useMemo(() => {
    if (stats.mistakesHistory && stats.mistakesHistory.length > 0) {
      return Math.min(10, stats.mistakesHistory.length);
    }
    if (stats.attempts) {
      const wrongIds = new Set<string>();
      Object.entries(stats.attempts).forEach(([qId, atts]) => {
        if (atts && atts.length > 0) {
          const sorted = [...atts].sort((a, b) => b.timestamp - a.timestamp);
          if (!sorted[0].isCorrect) wrongIds.add(qId);
        }
      });
      return Math.min(10, wrongIds.size);
    }
    return 0;
  }, [stats]);

  // Compute today's goal count for the compact mobile/tablet dropdown button badge
  const todayAnsweredCount = React.useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    let count = 0;
    Object.values(stats.attempts || {}).forEach((attemptsList) => {
      attemptsList.forEach((att) => {
        if (
          att.timestamp &&
          new Date(att.timestamp).toISOString().split('T')[0] === todayKey
        ) {
          count++;
        }
      });
    });
    return count;
  }, [stats.attempts]);

  const dailyGoal = stats.dailyGoal || 10;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-200/80 shadow-xs relative">
      {/* Azure African Fabric Patterns Only (Multiple Opacities of Azure) */}
      <WavyAzureFabricMotif />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* =====================================================================
            MOBILE & TABLET COMPACT TOP BAR (< lg screens)
            Saves vertical screen real estate by tucking nav details into a neat dropdown
           ===================================================================== */}
        <div className="flex lg:hidden items-center justify-between py-2 gap-2">
          {/* Compact Brand Logo & Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group/logo min-w-0"
            onClick={() => setActiveTab('quiz')}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-xs shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={13} />
              </div>
            </div>

            <div className="truncate text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 truncate">
                  Azure Curriculum
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white shrink-0 shadow-2xs">
                  AZ-900
                </span>
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/35 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-[#0078D4] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent truncate studio-subtitle-standout">
                  Fundamentals Practice Studio
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls on Mobile & Tablet: Tabs Visibility Toggle + Nav Details Dropdown Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Show/Hide Sliding Tabs Toggle */}
            <button
              type="button"
              onClick={toggleMenuBar}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                isMenuBarHidden
                  ? 'bg-blue-50 text-[#0078D4] border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
              title={isMenuBarHidden ? 'Show sliding navigation tabs' : 'Hide sliding navigation tabs'}
              aria-expanded={!isMenuBarHidden}
            >
              <Layers className="w-3.5 h-3.5 text-[#0078D4]" />
              <span className="hidden sm:inline">{isMenuBarHidden ? 'Show Tabs' : 'Hide Tabs'}</span>
            </button>

            {/* Mobile & Tablet Nav Details Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsMobileDetailsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer border ${
                isMobileDetailsOpen
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90'
              }`}
              aria-expanded={isMobileDetailsOpen}
              aria-label="Toggle navigation tools and search dropdown"
            >
              {isMobileDetailsOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0078D4]" />
              )}
              <span>Tools &amp; Goal</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isMobileDetailsOpen
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-100 text-orange-900'
                }`}
              >
                {todayAnsweredCount}/{dailyGoal}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMobileDetailsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Neat Collapsible Dropdown Menu for Mobile & Tablet (< lg screens) */}
        {isMobileDetailsOpen && (
          <div className="lg:hidden mb-2.5 p-3.5 rounded-2xl bg-white/98 border border-sky-200/90 shadow-lg space-y-3 animate-in slide-in-from-top-2 duration-150">
            {/* Row 1: Global Search Bar */}
            {onSearchQueryChange && onSelectQuestion && (
              <div className="w-full">
                <GlobalSearchBar
                  questions={questions}
                  searchQuery={searchQuery}
                  onSearchQueryChange={onSearchQueryChange}
                  onSelectQuestion={(q) => {
                    onSelectQuestion(q);
                    setIsMobileDetailsOpen(false);
                  }}
                  onSelectModule={(modId, pId) => {
                    if (onSelectModule) onSelectModule(modId, pId);
                    setIsMobileDetailsOpen(false);
                  }}
                />
              </div>
            )}

            {/* Row 2: Learning Path Selector Pills */}
            {onSelectPath && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500">
                  Learning Path:
                </span>
                <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPath('all');
                      if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedPathId === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPath(1);
                      if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      selectedPathId === 1
                        ? 'bg-[#0078D4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-[#0078D4]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>P1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPath(2);
                      if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      selectedPathId === 2
                        ? 'bg-[#0078D4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-[#0078D4]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>P2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPath(3);
                      if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      selectedPathId === 3
                        ? 'bg-[#0078D4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-[#0078D4]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>P3</span>
                  </button>
                </div>
              </div>
            )}

            {/* Row 3: Daily Learning Goal Progress Ring + Manage Goal + Review Session + Theme + PWA */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <DailyStudyStreak
                  stats={stats}
                  onUpdateStats={onUpdateStats}
                  fireStreakTrigger={fireStreakTrigger}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowGoalAlertsModal(true);
                    setIsMobileDetailsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-orange-600" />
                  <span>Manage Goal</span>
                </button>

                {onOpenReviewSession && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReviewSession();
                      setIsMobileDetailsOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Review Session</span>
                    {missedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                        {missedCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <PWAInstallButton />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            DESKTOP NAVIGATION BAR TOP TIER (lg+ screens)
           ===================================================================== */}
        <div className="hidden lg:flex flex-col items-center justify-center py-2.5 sm:py-3 gap-2.5 text-center">
          {/* Centered Brand: Logo & Larger Azure Curriculum Title */}
          <div
            className="flex items-center justify-center gap-3 cursor-pointer group/logo"
            onClick={() => setActiveTab('quiz')}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-sm shadow-blue-500/25 group-hover/logo:scale-105 transition-transform shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={16} />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 leading-tight">
                  Azure Curriculum
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-[#0078D4] text-white shadow-2xs">
                  AZ-900
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/40 shadow-xs">
                <Sparkles className="w-3 h-3 text-[#0078D4] shrink-0" />
                <span className="text-xs sm:text-[13px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent studio-subtitle-standout">
                  Fundamentals Practice Studio
                </span>
              </div>
            </div>
          </div>

          {/* Centered Controls, Global Search, Paths & Utilities Row */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap w-full">
            {/* Global Search Bar for Azure Services, Key Terms & Question Bank */}
            {onSearchQueryChange && onSelectQuestion && (
              <GlobalSearchBar
                questions={questions}
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
                onSelectQuestion={onSelectQuestion}
                onSelectModule={onSelectModule}
              />
            )}

            {/* Path 1, 2, 3 Minimalist Pills */}
            {onSelectPath && (
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath('all');
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedPathId === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View all 3 learning paths"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(1);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    selectedPathId === 1
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 1: Cloud Concepts"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Path 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(2);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    selectedPathId === 2
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 2: Azure Architecture & Services"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Path 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(3);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    selectedPathId === 3
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 3: Management & Governance"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Path 3</span>
                </button>
              </div>
            )}

            {/* Daily Learning Goal Progress Ring with Fire-Streak Animation */}
            <DailyStudyStreak
              stats={stats}
              onUpdateStats={onUpdateStats}
              fireStreakTrigger={fireStreakTrigger}
            />

            {/* Dedicated Manage Goal Button (triggers modal in center of viewable space) */}
            <button
              type="button"
              onClick={() => setShowGoalAlertsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              title="Set daily quiz question goal and custom alert preferences"
            >
              <Target className="w-3.5 h-3.5 text-orange-600 group-hover:scale-110 transition-transform" />
              <span>Manage Goal</span>
            </button>

            {/* Review Session Button (Quick access to last 10 missed questions) */}
            {onOpenReviewSession && (
              <button
                type="button"
                onClick={onOpenReviewSession}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                title="Review Session: quickly review and re-test your last 10 incorrectly answered questions in one organized view"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600 group-hover:-rotate-45 transition-transform" />
                <span>Review Session</span>
                {missedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                    {missedCount}
                  </span>
                )}
              </button>
            )}

            {/* Theme Toggle (Light / Midnight Azure) */}
            <ThemeToggle />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Minimalist & Stylish Toggle for Sliding Menu Bar */}
            <button
              type="button"
              onClick={toggleMenuBar}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                isMenuBarHidden
                  ? 'bg-blue-50 text-[#0078D4] border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
              title={isMenuBarHidden ? 'Show sliding navigation tabs' : 'Hide sliding navigation tabs'}
              aria-expanded={!isMenuBarHidden}
            >
              <Layers className="w-3.5 h-3.5 text-[#0078D4]" />
              <span className="hidden sm:inline">{isMenuBarHidden ? 'Show Tabs' : 'Hide Tabs'}</span>
              {isMenuBarHidden ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#0078D4]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Sliding Menu Bar: 50% Lighter Azure Opacity Shade with Azure Patterns & Warrior Motifs */}
        <div
          className={`relative w-full overflow-hidden transition-all duration-300 ease-in-out border-t border-sky-300/70 dark:border-sky-700/50 rounded-b-2xl shadow-xs backdrop-blur-md ${
            isMenuBarHidden
              ? 'max-h-0 opacity-0 pointer-events-none py-0 border-transparent'
              : 'max-h-24 opacity-100 py-2.5 bg-gradient-to-r from-[#0078D4]/45 via-[#0ea5e9]/50 to-[#0078D4]/45 dark:from-[#0284c7]/45 dark:via-[#0369a1]/50 dark:to-[#0284c7]/45'
          }`}
        >
          <WavyAzureFabricMotif className="opacity-50" />
          <div className="relative z-10 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none px-3 py-0.5">
            {/* Left Kenyan Moran Warrior Shield Motif */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0 pl-1 pr-1.5 opacity-95 hover:opacity-100 transition-opacity" title="Kenyan Warrior Heritage Motif">
              <MoranShieldMotif size={24} animate={true} />
            </div>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-[#005A9E] text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'quiz' ? <WarriorSpearBadge size={14} /> : <BookOpen className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>Practice</span>
            </button>

            {/* Adaptive Quiz Mode with glowing Zap */}
            <button
              onClick={() => setActiveTab('adaptive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'adaptive'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md ring-1 ring-amber-300 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'adaptive' ? <WarriorSpearBadge size={14} /> : <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 fill-amber-400" />}
              <span>Adaptive Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'flashcards' ? <WarriorSpearBadge size={14} /> : <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />}
              <span>Flashcards</span>
            </button>

            {/* Review History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#005A9E] text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'history' ? <WarriorSpearBadge size={14} /> : <History className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>Review History</span>
            </button>

            <button
              onClick={() => setActiveTab('mock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'mock'
                  ? 'bg-gradient-to-r from-blue-800 to-[#005A9E] text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'mock' ? <WarriorSpearBadge size={14} /> : <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />}
              <span>Mock Exam</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-md ring-1 ring-sky-300 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'analytics' ? <WarriorSpearBadge size={14} /> : <TrendingUp className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md ring-1 ring-yellow-200 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'assistant' ? <WarriorSpearBadge size={14} /> : <Bot className="w-3.5 h-3.5 text-orange-700 dark:text-amber-300" />}
              <span>Tutor</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-200 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'leaderboard' ? <WarriorSpearBadge size={14} /> : <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
              <span>Ranks</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md ring-1 ring-purple-300 font-black scale-102'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'profile' ? <WarriorSpearBadge size={14} /> : <Award className="w-3.5 h-3.5 text-purple-700 dark:text-amber-300" />}
              <span>Profile &amp; Badges</span>
            </button>

            {/* Right Kenyan Moran Warrior Shield Motif */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0 pr-1 pl-1.5 opacity-95 hover:opacity-100 transition-opacity" title="Kenyan Warrior Heritage Motif">
              <MoranShieldMotif size={24} animate={true} />
            </div>
          </div>
        </div>

        {/* Minimalist Floating Expand Handle (visible when menu bar is hidden) */}
        {isMenuBarHidden && (
          <div className="flex justify-center -mb-2.5 pb-1">
            <button
              type="button"
              onClick={toggleMenuBar}
              className="inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#003865] to-[#005a9e] hover:from-[#004578] hover:to-[#0078d4] text-white text-[10px] font-extrabold shadow-sm border border-sky-400/40 cursor-pointer transition-all hover:scale-105"
              title="Expand navigation menu tabs"
            >
              <MoranShieldMotif size={14} animate={false} />
              <span>Show Tabs ({activeTab.toUpperCase()})</span>
              <ChevronDown className="w-3 h-3 text-sky-200" />
            </button>
          </div>
        )}
      </div>

      {/* Dedicated Daily Goal & Custom Alerts Modal (Pops up in lower central position) */}
      <DailyGoalAlertsModal
        stats={stats}
        isOpen={showGoalAlertsModal}
        onClose={() => setShowGoalAlertsModal(false)}
        onUpdateStats={onUpdateStats}
      />
    </header>
  );
};

