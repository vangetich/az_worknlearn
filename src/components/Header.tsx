import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Award,
  Sparkles,
  Bot,
  Layers,
  TrendingUp,
  Compass,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { UserStats } from '../types/quiz';
import { DailyStudyStreak } from './DailyStudyStreak';
import { BADGE_DEFINITIONS } from './BadgeSystem';

interface HeaderProps {
  activeTab: 'quiz' | 'mock' | 'ai-builder' | 'assistant' | 'study-decks' | 'analytics' | 'wisdom';
  setActiveTab: (tab: 'quiz' | 'mock' | 'ai-builder' | 'assistant' | 'study-decks' | 'analytics' | 'wisdom') => void;
  stats: UserStats;
  onOpenExport?: () => void;
  onUpdateStats?: (newStats: UserStats) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenExport,
  onUpdateStats,
}) => {
  const [isMenuHidden, setIsMenuHidden] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Sideways sliding menu bar state
  const navRef = useRef<HTMLElement>(null);
  const [canSlideLeft, setCanSlideLeft] = useState<boolean>(false);
  const [canSlideRight, setCanSlideRight] = useState<boolean>(false);

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  // Compute unlocked badges count for header display
  const unlockedBadgesCount = useMemo(() => {
    return BADGE_DEFINITIONS.filter((b) => b.isUnlocked(stats, overallAccuracy)).length;
  }, [stats, overallAccuracy]);

  // Update sideways scroll affordance buttons
  const updateScrollState = useCallback(() => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    setCanSlideLeft(scrollLeft > 6);
    setCanSlideRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  // The menu bar should be visible if not hidden, OR if user is hovering over the header
  const isNavVisible = !isMenuHidden || isHovered;

  // Track horizontal scroll and resize
  useEffect(() => {
    updateScrollState();
    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('scroll', updateScrollState, { passive: true });
    }
    window.addEventListener('resize', updateScrollState);

    const timer1 = setTimeout(updateScrollState, 150);
    const timer2 = setTimeout(updateScrollState, 400);

    return () => {
      if (nav) nav.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isNavVisible, activeTab, updateScrollState]);

  // Scroll active tab into view when selected
  useEffect(() => {
    if (navRef.current) {
      const activeEl = navRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  // Smooth sideways scrolling method
  const slideNav = (direction: 'left' | 'right') => {
    if (!navRef.current) return;
    const scrollAmount = 260;
    navRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs group transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <KitengeRibbon height={4} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar: Brand + Metrics + Actions */}
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer group/logo"
            onClick={() => setActiveTab('quiz')}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-sm shadow-blue-500/20 group-hover/logo:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={18} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  AZ-900 <span className="text-[#0078D4]">Smart Quiz</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Azure Fundamentals
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <span>Knowledge Assistant</span>
                <span className="text-amber-500 font-bold">•</span>
                <span>Microsoft Official Curriculum</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics / Daily Study Streak / Export / Menu Slide Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Daily Study Streak & Learning Goal Component */}
            <DailyStudyStreak stats={stats} onUpdateStats={onUpdateStats} />

            {/* Confidence / Mastery Quick View */}
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              title="View Domain Confidence Breakdown"
            >
              <TrendingUp className="w-4 h-4 text-[#0078D4]" />
              <span className="font-extrabold">{overallAccuracy}%</span>
              <span className="hidden md:inline text-slate-400 font-normal">
                ({stats.totalCorrect}/{stats.totalAnswered})
              </span>
            </button>

            {/* Milestone Badges Quick Metric */}
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-xs font-bold text-amber-800 transition-colors shadow-2xs"
              title="View Milestone Badges & Achievements in Domain Confidence"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{unlockedBadgesCount}/{BADGE_DEFINITIONS.length}</span>
              <span className="hidden sm:inline font-semibold text-amber-700">Badges</span>
            </button>

            {/* Export Progress Button */}
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-xs font-bold text-[#0078D4] transition-colors shadow-2xs"
                title="Export Progress Report (PDF / JSON)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
            )}

            {/* Slide Up / Down Toggle Button */}
            <button
              onClick={() => setIsMenuHidden(!isMenuHidden)}
              className={`p-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 ${
                isMenuHidden
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title={
                isMenuHidden
                  ? 'Menu is hidden (hover to view, or click to pin)'
                  : 'Click to slide menu up and hide'
              }
            >
              {isMenuHidden ? (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-700 animate-bounce" />
                  <span className="hidden lg:inline text-[11px] font-bold">Show Menu</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                  <span className="hidden lg:inline text-[11px]">Slide Menu Up</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sliding Menu Bar: Slides Up/Down smoothly and Pops Down on Hover */}
        <div
          className={`transition-all duration-300 ease-in-out origin-top ${
            isNavVisible
              ? 'max-h-24 opacity-100 translate-y-0 pb-2 border-t border-slate-100'
              : 'max-h-0 opacity-0 -translate-y-2 overflow-hidden pointer-events-none'
          }`}
        >
          {/* Horizontal Sliding Topic Bar Container with Back and Forth controls */}
          <div className="relative flex items-center group/slider mt-1">
            {/* Left Slide Button & Gradient Mask */}
            <div
              className={`absolute left-0 top-0 bottom-0 z-20 flex items-center pr-3 bg-gradient-to-r from-white via-white/95 to-transparent transition-opacity duration-200 ${
                canSlideLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => slideNav('left')}
                className="w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#0078D4] hover:bg-blue-50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Slide topic areas left"
                aria-label="Slide topic areas left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Topic Areas Navigation Bar */}
            <nav
              ref={navRef}
              onScroll={updateScrollState}
              onWheel={(e) => {
                if (e.deltaY !== 0 && !e.deltaX && navRef.current) {
                  navRef.current.scrollBy({ left: e.deltaY * 0.8, behavior: 'auto' });
                }
              }}
              className="flex space-x-1 sm:space-x-2.5 overflow-x-auto pt-1 pb-1 scrollbar-none text-sm scroll-smooth w-full px-1"
            >
              <button
                data-active={activeTab === 'quiz'}
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'quiz'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Practice Modules</span>
              </button>

              <button
                data-active={activeTab === 'mock'}
                onClick={() => setActiveTab('mock')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'mock'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Mock Exam (Timed)</span>
              </button>

              <button
                data-active={activeTab === 'ai-builder'}
                onClick={() => setActiveTab('ai-builder')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'ai-builder'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>AI Scenario Generator</span>
              </button>

              <button
                data-active={activeTab === 'assistant'}
                onClick={() => setActiveTab('assistant')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'assistant'
                    ? 'bg-gradient-to-r from-[#C2410C] to-[#D97706] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Knowledge Assistant</span>
              </button>

              <button
                data-active={activeTab === 'study-decks'}
                onClick={() => setActiveTab('study-decks')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'study-decks'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Study Decks & Matrix</span>
              </button>

              <button
                data-active={activeTab === 'wisdom'}
                onClick={() => setActiveTab('wisdom')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'wisdom'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Harambee Wisdom</span>
              </button>

              <button
                data-active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Domain Confidence & Badges</span>
              </button>
            </nav>

            {/* Right Slide Button & Gradient Mask */}
            <div
              className={`absolute right-0 top-0 bottom-0 z-20 flex items-center pl-3 bg-gradient-to-l from-white via-white/95 to-transparent transition-opacity duration-200 ${
                canSlideRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => slideNav('right')}
                className="w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#0078D4] hover:bg-blue-50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Slide topic areas right"
                aria-label="Slide topic areas right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle indicator bar when menu is hidden to show it pops up on hover */}
      {isMenuHidden && (
        <div
          onClick={() => setIsMenuHidden(false)}
          className="h-1 bg-gradient-to-r from-transparent via-[#0078D4] to-transparent cursor-pointer opacity-70 group-hover:opacity-0 transition-opacity"
          title="Hover to pop down menu, or click to pin"
        />
      )}
    </header>
  );
};
