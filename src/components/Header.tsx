import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Menu,
  X,
  SlidersHorizontal,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  WifiOff,
  LogOut,
  LogOut as ArrowLeftOnRectangle,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
  Maximize2,
  BarChart3,
  Pencil,
  GitBranch,
  Flame,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import {
  MaasaiMedallion,
  MoranShieldMotif,
  WarriorSpearBadge,
  WavyAzureFabricMotif,
} from './MotifDecorations';
import { UserStats, Question } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { DailyStudyStreak } from './DailyStudyStreak';
import { PWAInstallButton } from './PWAInstallButton';
import { DailyGoalAlertsModal } from './DailyGoalAlertsModal';
import { EditDailyGoalModal } from './EditDailyGoalModal';
import { DailyGoalCelebrationModal } from './DailyGoalCelebrationModal';
import { ThemeToggle } from './ThemeToggle';
import { AccessibilityFontSizeControl } from './AccessibilityFontSizeControl';
import { GlobalSearchBar } from './GlobalSearchBar';
import { FocusSessionWidget } from './FocusSessionWidget';
import { SupabaseRealtimeStatus } from '../hooks/usePostgresDatabase';
import { StudentStatsCloudPopup } from './StudentStatsCloudPopup';
import {
  KeyboardShortcutGuidePopover,
  AccessibilitySettingsModal,
  useKeyboardShortcutsConfig,
} from './KeyboardShortcutGuide';
import { formatShortcutCombo } from '../utils/keyboardShortcuts';
import { DifficultyStreakTracker } from './DifficultyStreakTracker';

/**
 * Animated Daily Study Goal Circular Progress Ring
 * Displays percentage completion based on current streak and today's answered questions,
 * and shows a small fire icon animation upon reaching the daily goal.
 */
const DailyStudyGoalRing: React.FC<{
  todayAnsweredCount: number;
  dailyGoal: number;
  streakDays?: number;
  onClick: () => void;
  onOpenCelebration?: () => void;
  compact?: boolean;
}> = ({
  todayAnsweredCount,
  dailyGoal,
  streakDays = 0,
  onClick,
  onOpenCelebration,
  compact = false,
}) => {
  const safeGoal = Math.max(1, dailyGoal);
  const questionRatio = Math.min(1, todayAnsweredCount / safeGoal);
  // Factor in active streak momentum (+2% per active streak day up to +10% while building toward 100%)
  const streakMomentumBonus =
    todayAnsweredCount > 0 && questionRatio < 1
      ? Math.min(0.1, Math.max(0, streakDays) * 0.02)
      : 0;
  const effectiveRatio = Math.min(
    1,
    questionRatio >= 1 ? 1 : Math.min(0.99, questionRatio + streakMomentumBonus)
  );
  const percentage = Math.round(effectiveRatio * 100);
  const isGoalReached = todayAnsweredCount >= safeGoal;

  const size = compact ? 26 : 30;
  const strokeWidth = compact ? 3 : 3.2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - effectiveRatio * circumference;

  return (
    <div className="inline-block align-middle whitespace-nowrap">
      <button
        type="button"
        onClick={isGoalReached && onOpenCelebration ? onOpenCelebration : onClick}
        className={`group relative inline-flex items-center gap-1.5 ${
          compact ? 'px-2 py-1' : 'px-2.5 py-1'
        } rounded-xl border text-xs font-extrabold transition-all duration-300 shadow-2xs cursor-pointer overflow-visible whitespace-nowrap ${
          isGoalReached
            ? 'bg-gradient-to-r from-emerald-50 via-amber-50 to-orange-50 hover:from-emerald-100 hover:to-amber-100 text-emerald-950 border-amber-400 ring-1 ring-amber-400/60 animate-goal-celebrate'
            : 'bg-orange-50/90 hover:bg-orange-100 text-orange-900 border-orange-200/90'
        }`}
        title={`Daily Study Goal: ${percentage}% complete (${todayAnsweredCount}/${safeGoal} Qs today • ${streakDays}d streak)${
          isGoalReached
            ? ' — 100% Goal Reached! Click to open Fire Streak Celebration & Share Progress'
            : ' • Click to edit Daily Study Goal'
        }`}
        aria-label={`Daily Study Goal: ${percentage}% complete (${todayAnsweredCount} of ${safeGoal} questions, ${streakDays} day streak)`}
      >
        {/* Small Fire Icon Animation & Rising Embers when Daily Goal is Reached */}
        {isGoalReached && (
          <>
            <span className="pointer-events-none absolute -top-2 -right-1.5 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-amber-400 animate-bounce drop-shadow-xs" />
            </span>
            <span className="pointer-events-none absolute -top-2.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ember-drift-1" />
            <span className="pointer-events-none absolute -bottom-1 -left-1 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-emerald-500 animate-sparkle-2" />
            </span>
          </>
        )}

        <div
          className="relative flex items-center justify-center shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90 transform overflow-visible"
          >
            {/* Background Track Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className={isGoalReached ? 'text-amber-200/90' : 'text-orange-200/80'}
            />
            {/* Animated Progress Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={isGoalReached ? '#f97316' : '#ea580c'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition:
                  'stroke-dashoffset 0.75s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
              }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black tracking-tighter">
            {isGoalReached ? (
              <Flame className="w-3 h-3 text-orange-600 fill-amber-400 animate-pulse" />
            ) : (
              `${percentage}%`
            )}
          </span>
        </div>

        <div className="flex flex-col items-start leading-none">
          <span className="text-[9px] uppercase tracking-wider font-black opacity-85 hidden sm:inline items-center gap-0.5">
            {isGoalReached
              ? `100% Goal 🔥 ${streakDays}d`
              : percentage >= 50
              ? `${percentage}% • ${streakDays}d Streak`
              : percentage >= 25
              ? `${percentage}% • ${streakDays}d Streak`
              : `Goal ${percentage}%`}
          </span>
          <span className="text-[11px] font-black tabular-nums flex items-center gap-1">
            <span>
              {todayAnsweredCount}/{safeGoal}
            </span>
            {isGoalReached ? (
              <Flame className="w-3 h-3 text-orange-500 fill-amber-400 animate-pulse" />
            ) : (
              <Pencil className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </button>

      {isGoalReached && (
        <button
          type="button"
          onClick={onClick}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
          title="Edit Daily Study Goal target"
          aria-label="Edit Daily Study Goal target"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/**
 * Single-File Intuitive Horizontal Scroller (Left-to-Right & Right-to-Left)
 * Uses pure Tailwind CSS block/inline-block utilities (zero flexbox) to keep all
 * header controls strictly aligned in a single horizontal line across every viewport:
 * - Touch / trackpad swipe & mouse drag-to-scroll (left <-> right)
 * - Mouse-wheel vertical-to-horizontal glide
 * - Left & right chevron nudge buttons when overflowing
 * - Subtle 2px Azure scroll position track along the bottom
 */
const SingleFileHorizontalScroller: React.FC<{
  children: React.ReactNode;
  ariaLabel?: string;
}> = ({ children, ariaLabel = 'Horizontal controls scroll track' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ isDown: boolean; startX: number; scrollLeft: number; dragged: boolean }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    dragged: false,
  });

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const hasOverflow = maxScroll > 4;
    setIsOverflowing(hasOverflow);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
    setScrollRatio(maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollLeft / maxScroll)) : 0);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    const innerEl = innerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateScrollState();
    });
    ro.observe(el);
    if (innerEl) ro.observe(innerEl);

    window.addEventListener('resize', updateScrollState);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 2) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
      el.scrollLeft += e.deltaY * 0.9;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select')) return;
    const el = scrollRef.current;
    if (!el) return;
    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      dragged: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.isDown) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - state.startX;
    if (Math.abs(walk) > 5) {
      state.dragged = true;
      e.preventDefault();
      el.scrollLeft = state.scrollLeft - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    dragStateRef.current.isDown = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStateRef.current.dragged) {
      e.preventDefault();
      e.stopPropagation();
      dragStateRef.current.dragged = false;
    }
  };

  const slideBy = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.min(280, Math.max(160, el.clientWidth * 0.65));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="relative block w-full min-w-0 group/rail">
      {/* Left-to-Right Intuitive Nudge Control */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => slideBy(-1)}
          aria-label="Scroll controls left"
          title="Scroll left (Right-to-Left)"
          className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-[#0078D4] text-[#005A9E] dark:text-sky-300 hover:text-white border border-sky-300/90 dark:border-sky-600 shadow-md text-center leading-[22px] transition-all duration-150 cursor-pointer hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-3.5 h-3.5 inline-block align-middle" />
        </button>
      )}

      {/* Single-File Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        onScroll={updateScrollState}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleClickCapture}
        className={`block w-full overflow-x-auto no-scrollbar overscroll-x-contain whitespace-nowrap py-0.5 ${
          isOverflowing ? 'px-5 cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div
          ref={innerRef}
          className="inline-block align-middle whitespace-nowrap text-left lg:text-right min-w-full [&>*]:inline-block [&>*]:align-middle [&>*]:mx-0.5"
        >
          {children}
        </div>
      </div>

      {/* Right-to-Left Intuitive Nudge Control */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => slideBy(1)}
          aria-label="Scroll controls right"
          title="Scroll right (Left-to-Right)"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-[#0078D4] text-[#005A9E] dark:text-sky-300 hover:text-white border border-sky-300/90 dark:border-sky-600 shadow-md text-center leading-[22px] transition-all duration-150 cursor-pointer hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-3.5 h-3.5 inline-block align-middle" />
        </button>
      )}

      {/* Subtle Scroll Track Indicator when Overflowing */}
      {isOverflowing && (
        <div
          aria-hidden="true"
          className="pointer-events-none block w-full h-[2px] rounded-full bg-sky-100/80 dark:bg-slate-800/80 overflow-hidden mt-0.5 opacity-80 group-hover/rail:opacity-100 transition-opacity"
        >
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#0078D4] via-sky-400 to-[#005A9E] transition-transform duration-150 ease-out"
            style={{
              transform: `translateX(${scrollRatio * 200}%)`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export type AppTab =
  | 'quiz'
  | 'adaptive'
  | 'planner'
  | 'image-tutor'
  | 'azure-themes'
  | 'flashcards'
  | 'history'
  | 'mock'
  | 'ai-builder'
  | 'assistant'
  | 'study-decks'
  | 'analytics'
  | 'trends'
  | 'cohort'
  | 'leaderboard'
  | 'wisdom'
  | 'profile'
  | 'glossary';

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
  onOpenStudyBreak?: () => void;
  questions?: Question[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSelectQuestion?: (question: Question) => void;
  onSelectModule?: (moduleId: number, pathId: number) => void;
  onRetryIncorrectPath?: (pathId: 1 | 2 | 3) => void;
  retryIncorrectPathId?: 1 | 2 | 3 | null;
  onOpenUserGuide?: () => void;
  realtimeStatus?: SupabaseRealtimeStatus;
  lastSyncedAt?: number | null;
  onOpenCloudBackend?: () => void;
  onOpenCurriculumReadiness?: () => void;
  onOpenAdminBackOffice?: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isDynamicDifficultyEnabled?: boolean;
  onToggleDynamicDifficulty?: () => void;
  effectiveDynamicDifficulty?: 'Fundamental' | 'Intermediate' | 'Advanced';
  consecutiveCorrect?: number;
  onOpenAccessibilitySettings?: () => void;
  unresolvedMistakesCount?: number;
  pendingOfflineCount?: number;
  onSelectDifficultyForPractice?: (
    difficulty: 'Fundamental' | 'Intermediate' | 'Advanced'
  ) => void;
  isAiTutorDrawerOpen?: boolean;
  onToggleAiTutorDrawer?: () => void;
  currentQuestion?: Question | null;
  isQuickStudyMode?: boolean;
  onToggleQuickStudyMode?: () => void;
  quickStudySecondsLeft?: number;
  quickStudyQuestionCount?: number;
}

const PATH_COMPACT_INTEL: Record<
  1 | 2 | 3,
  {
    code: string;
    examWeight: string;
    keyTrapSummary: string;
  }
> = {
  1: {
    code: 'P1 • Cloud Concepts',
    examWeight: '25–30%',
    keyTrapSummary: 'Customer ALWAYS owns Data, Endpoints & Access (IaaS/PaaS/SaaS); Elasticity = auto-scales out & in.',
  },
  2: {
    code: 'P2 • Architecture & Services',
    examWeight: '35–40%',
    keyTrapSummary: 'ExpressRoute = private fiber (not internet); Archive tier requires rehydration; AuthN (MFA) ≠ AuthZ (RBAC).',
  },
  3: {
    code: 'P3 • Management & Governance',
    examWeight: '30–35%',
    keyTrapSummary: 'Resource Locks override Owner RBAC; Policy = resource rules; TCO = migration vs. Pricing = monthly bill.',
  },
};

type NavGroupName = 'Core Study' | 'Exam & Drills' | 'Insights & History' | 'AI Tutor & Community';

interface NavTabConfig {
  id: AppTab;
  label: string;
  group: NavGroupName;
  title?: string;
  activeClass: string;
  fontWeightClass?: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
}

const NAV_TAB_GROUPS: NavGroupName[] = [
  'Core Study',
  'Exam & Drills',
  'Insights & History',
  'AI Tutor & Community',
];

const NAV_TABS: NavTabConfig[] = [
  {
    id: 'quiz',
    label: 'Practice',
    group: 'Core Study',
    activeClass: 'bg-[#005A9E] text-white shadow-sm ring-1 ring-white/80 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <BookOpen className="w-3 h-3 text-[#005A9E] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'study-decks',
    label: 'Study Mode',
    group: 'Core Study',
    title:
      'Interactive Study Mode: Select Learning Path & Module to study Unit-by-Unit concepts, Azure services, and examples',
    activeClass:
      'bg-gradient-to-r from-[#0078D4] to-[#005A9E] text-white shadow-sm ring-1 ring-amber-300 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Layers className="w-3 h-3 text-[#005A9E] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'image-tutor',
    label: 'Image Tutor',
    group: 'Core Study',
    title:
      'Image Tutor: Interactive Microsoft Certified: Azure Fundamentals visual diagrams and course knowledge across all 12 modules',
    activeClass:
      'bg-gradient-to-r from-[#0078D4] via-indigo-700 to-[#005A9E] text-white shadow-sm ring-1 ring-amber-300 font-black',
    fontWeightClass: 'font-extrabold',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <ImageIcon className="w-3 h-3 text-[#0078D4] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'azure-themes',
    label: 'Azure Themes',
    group: 'Core Study',
    title:
      'Azure Themes: Interconnecting theories woven across all 12 AZ-900 modules and Azure service categories',
    activeClass:
      'bg-gradient-to-r from-[#0078D4] via-sky-700 to-[#005A9E] text-white shadow-sm ring-1 ring-amber-300 font-black',
    fontWeightClass: 'font-extrabold',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <GitBranch className="w-3 h-3 text-[#0078D4] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'adaptive',
    label: 'Adaptive Quiz',
    group: 'Exam & Drills',
    activeClass:
      'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-sm ring-1 ring-amber-300 font-black',
    fontWeightClass: 'font-extrabold',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Zap className="w-3 h-3 text-amber-600 dark:text-amber-300 fill-amber-400 shrink-0" />
      ),
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    group: 'Exam & Drills',
    activeClass:
      'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-sm ring-1 ring-white/80 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-300 shrink-0" />
      ),
  },
  {
    id: 'mock',
    label: 'Mock Exam',
    group: 'Exam & Drills',
    title:
      'Mock Exam Simulation: Timed 45–90 question official exam simulation & Weakness Precision drills with Learning Path breakdown',
    activeClass:
      'bg-gradient-to-r from-blue-800 to-[#005A9E] text-white shadow-sm ring-1 ring-white/80 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Award className="w-3 h-3 text-amber-600 dark:text-amber-300 shrink-0" />
      ),
  },
  {
    id: 'planner',
    label: 'Study Planner',
    group: 'Exam & Drills',
    title:
      'Study Planner: Set your target exam date & confidence levels to generate a prioritized daily or weekly schedule',
    activeClass:
      'bg-gradient-to-r from-sky-700 to-emerald-700 text-white shadow-sm ring-1 ring-amber-300 font-black',
    fontWeightClass: 'font-extrabold',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Calendar className="w-3 h-3 text-emerald-700 dark:text-emerald-300 shrink-0" />
      ),
  },
  {
    id: 'history',
    label: 'History',
    group: 'Insights & History',
    activeClass: 'bg-[#005A9E] text-white shadow-sm ring-1 ring-white/80 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <History className="w-3 h-3 text-[#005A9E] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    group: 'Insights & History',
    activeClass: 'bg-slate-900 text-white shadow-sm ring-1 ring-sky-300 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <TrendingUp className="w-3 h-3 text-[#005A9E] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'trends',
    label: 'Performance Trends',
    group: 'Insights & History',
    title:
      'Performance Trends: Recharts historical accuracy per module and learning path over time',
    activeClass:
      'bg-gradient-to-r from-[#0078D4] to-cyan-700 text-white shadow-sm ring-1 ring-sky-200 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <BarChart3 className="w-3 h-3 text-[#0078D4] dark:text-sky-300 shrink-0" />
      ),
  },
  {
    id: 'cohort',
    label: 'Cohort Performance',
    group: 'Insights & History',
    title:
      'Cohort Performance: Compare your module mastery against the anonymized Global Harambee Azure Cohort benchmark via D3.js',
    activeClass:
      'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-sm ring-1 ring-amber-300 font-black',
    fontWeightClass: 'font-extrabold',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Users className="w-3 h-3 text-[#0078D4] dark:text-amber-300 shrink-0" />
      ),
  },
  {
    id: 'assistant',
    label: 'Tutor',
    group: 'AI Tutor & Community',
    activeClass:
      'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm ring-1 ring-yellow-200 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Bot className="w-3 h-3 text-orange-700 dark:text-amber-300 shrink-0" />
      ),
  },
  {
    id: 'leaderboard',
    label: 'Global Peer Leaderboard',
    group: 'AI Tutor & Community',
    title:
      'Global Peer Leaderboard: Top performers from the Global Harambee Azure Cohort ranked by total questions solved',
    activeClass: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-200 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Award className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
      ),
  },
  {
    id: 'profile',
    label: 'Profile',
    group: 'AI Tutor & Community',
    activeClass:
      'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-sm ring-1 ring-purple-300 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <Award className="w-3 h-3 text-purple-700 dark:text-amber-300 shrink-0" />
      ),
  },
  {
    id: 'glossary',
    label: 'Glossary',
    group: 'AI Tutor & Community',
    title:
      'Azure Glossary & Dictionary: All AZ-900 terms, interrelated architecture pinpoints, and verified Microsoft Learn references',
    activeClass:
      'bg-gradient-to-r from-emerald-700 to-[#005A9E] text-white shadow-sm ring-1 ring-emerald-300 font-black',
    renderIcon: (isActive) =>
      isActive ? (
        <WarriorSpearBadge size={12} />
      ) : (
        <BookOpen className="w-3 h-3 text-emerald-700 dark:text-emerald-300 shrink-0" />
      ),
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPathId = 'all',
  onSelectPath,
  stats,
  onUpdateStats,
  fireStreakTrigger = 0,
  onOpenReviewSession,
  onOpenStudyBreak,
  questions = [],
  searchQuery = '',
  onSearchQueryChange,
  onSelectQuestion,
  onSelectModule,
  onRetryIncorrectPath,
  retryIncorrectPathId = null,
  onOpenUserGuide,
  realtimeStatus = 'connected',
  lastSyncedAt = null,
  onOpenCloudBackend,
  onOpenCurriculumReadiness,
  onOpenAdminBackOffice,
  userEmail = null,
  onLogout,
  isFocusMode = false,
  onToggleFocusMode,
  isDynamicDifficultyEnabled = true,
  onToggleDynamicDifficulty,
  effectiveDynamicDifficulty = 'Intermediate',
  consecutiveCorrect = 0,
  onOpenAccessibilitySettings,
  unresolvedMistakesCount,
  pendingOfflineCount = 0,
  onSelectDifficultyForPractice,
  isAiTutorDrawerOpen = false,
  onToggleAiTutorDrawer,
  currentQuestion = null,
  isQuickStudyMode = false,
  onToggleQuickStudyMode,
  quickStudySecondsLeft = 300,
  quickStudyQuestionCount = 10,
}) => {
  const [showEditDailyGoalModal, setShowEditDailyGoalModal] = useState<boolean>(false);
  const [showGoalAlertsModal, setShowGoalAlertsModal] = useState<boolean>(false);
  const [showDailyGoalCelebrationModal, setShowDailyGoalCelebrationModal] = useState<boolean>(false);
  const [showLocalAccessibilityModal, setShowLocalAccessibilityModal] = useState<boolean>(false);
  const { config: shortcutConfig, platform: detectedPlatform } = useKeyboardShortcutsConfig();
  const openAccessibilityModal = () => {
    if (onOpenAccessibilitySettings) {
      onOpenAccessibilitySettings();
    } else {
      setShowLocalAccessibilityModal(true);
    }
  };
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState<boolean>(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState<boolean>(false);
  const [selectedNavDropdownGroup, setSelectedNavDropdownGroup] = useState<NavGroupName | 'all'>('all');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const [inspectedPathInMenu, setInspectedPathInMenu] = useState<1 | 2 | 3>(
    selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3 ? selectedPathId : 2
  );
  const [isMenuBarHidden, setIsMenuBarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_hide_menu_bar') === 'true';
    } catch {
      return false;
    }
  });

  const activeNavTab = React.useMemo(
    () => NAV_TABS.find((t) => t.id === activeTab) || NAV_TABS[0],
    [activeTab]
  );

  const openCategoryDropdown = (group: NavGroupName | 'all') => {
    if (isNavDropdownOpen && selectedNavDropdownGroup === group) {
      setIsNavDropdownOpen(false);
    } else {
      setSelectedNavDropdownGroup(group);
      setIsNavDropdownOpen(true);
      setIsMobileDetailsOpen(false);
      setIsMoreMenuOpen(false);
      setShowCloudStatsPopup(false);
    }
  };

  // Close dropdown menus cleanly on Escape key or click outside header
  React.useEffect(() => {
    if (!isNavDropdownOpen && !isMobileDetailsOpen && !isMoreMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNavDropdownOpen(false);
        setIsMobileDetailsOpen(false);
        setIsMoreMenuOpen(false);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsNavDropdownOpen(false);
        setIsMobileDetailsOpen(false);
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isNavDropdownOpen, isMobileDetailsOpen, isMoreMenuOpen]);

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

  // Closing hover effect options for the Tabs Menu (Dropdown & Horizontal Tabs Bar)
  const [isDropdownHoverCloseEnabled, setIsDropdownHoverCloseEnabled] = useState<boolean>(true);
  const [isNavBarHoverAutoHide, setIsNavBarHoverAutoHide] = useState<boolean>(false);
  const [isClosingHoverActive, setIsClosingHoverActive] = useState<boolean>(false);
  const navDropdownCloseTimerRef = React.useRef<any>(null);
  const navBarAutoHideTimerRef = React.useRef<any>(null);

  const handleNavDropdownMouseEnter = () => {
    if (navDropdownCloseTimerRef.current) {
      clearTimeout(navDropdownCloseTimerRef.current);
      navDropdownCloseTimerRef.current = null;
    }
    if (navBarAutoHideTimerRef.current) {
      clearTimeout(navBarAutoHideTimerRef.current);
      navBarAutoHideTimerRef.current = null;
    }
    setIsClosingHoverActive(false);
  };

  const handleNavDropdownMouseLeave = () => {
    if (!isDropdownHoverCloseEnabled) return;
    setIsClosingHoverActive(true);
    if (navDropdownCloseTimerRef.current) {
      clearTimeout(navDropdownCloseTimerRef.current);
    }
    navDropdownCloseTimerRef.current = setTimeout(() => {
      setIsNavDropdownOpen(false);
      setIsClosingHoverActive(false);
    }, 360);
  };

  const handleNavBarMouseEnter = () => {
    if (navBarAutoHideTimerRef.current) {
      clearTimeout(navBarAutoHideTimerRef.current);
      navBarAutoHideTimerRef.current = null;
    }
    if (navDropdownCloseTimerRef.current) {
      clearTimeout(navDropdownCloseTimerRef.current);
      navDropdownCloseTimerRef.current = null;
    }
    setIsClosingHoverActive(false);
  };

  const handleNavBarMouseLeave = () => {
    if (!isNavBarHoverAutoHide || isMenuBarHidden) return;
    if (navBarAutoHideTimerRef.current) {
      clearTimeout(navBarAutoHideTimerRef.current);
    }
    navBarAutoHideTimerRef.current = setTimeout(() => {
      setIsMenuBarHidden(true);
    }, 450);
  };

  const handleShowTabsMouseEnter = () => {
    if (navDropdownCloseTimerRef.current) {
      clearTimeout(navDropdownCloseTimerRef.current);
      navDropdownCloseTimerRef.current = null;
    }
    if (navBarAutoHideTimerRef.current) {
      clearTimeout(navBarAutoHideTimerRef.current);
      navBarAutoHideTimerRef.current = null;
    }
    setIsClosingHoverActive(false);
    setIsMenuBarHidden(false);
    setSelectedNavDropdownGroup('all');
    setIsNavDropdownOpen(true);
    setIsMobileDetailsOpen(false);
    setIsMoreMenuOpen(false);
    setShowCloudStatsPopup(false);
  };

  // State & timer handlers for Cloud Logo 1/4 screen student stats popup with random encouraging message
  const [showCloudStatsPopup, setShowCloudStatsPopup] = useState<boolean>(false);
  const closeCloudStatsTimerRef = React.useRef<any>(null);

  const handleCloudMouseEnter = () => {
    if (closeCloudStatsTimerRef.current) {
      clearTimeout(closeCloudStatsTimerRef.current);
      closeCloudStatsTimerRef.current = null;
    }
    setShowCloudStatsPopup(true);
  };

  const handleCloudMouseLeave = () => {
    if (closeCloudStatsTimerRef.current) {
      clearTimeout(closeCloudStatsTimerRef.current);
    }
    closeCloudStatsTimerRef.current = setTimeout(() => {
      setShowCloudStatsPopup(false);
    }, 280);
  };

  const handleCloudLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCloudStatsPopup((prev) => !prev);
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

  const effectiveUnresolvedCount = unresolvedMistakesCount ?? missedCount;

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
  const dailyGoalProgressPct = Math.min(
    100,
    Math.round((todayAnsweredCount / Math.max(1, dailyGoal)) * 100)
  );
  const isDailyGoalReached = todayAnsweredCount >= dailyGoal && dailyGoal > 0;

  // Keep inspectedPathInMenu synced when user changes selectedPathId to a specific path
  React.useEffect(() => {
    if (selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3) {
      setInspectedPathInMenu(selectedPathId);
    }
  }, [selectedPathId]);

  // Compute live Learning Path mastery, completed modules, and missed questions per path
  const pathTelemetry = React.useMemo(() => {
    const completedSet = new Set(stats.completedModules || []);
    const result: Record<
      1 | 2 | 3,
      {
        accuracy: number;
        attemptedQuestions: number;
        totalQuestionsInBank: number;
        missedQuestionCount: number;
        completedModules: number;
        totalModules: number;
        weakestModuleTitle: string;
        weakestModuleId: number;
      }
    > = {
      1: {
        accuracy: 0,
        attemptedQuestions: 0,
        totalQuestionsInBank: 0,
        missedQuestionCount: 0,
        completedModules: 0,
        totalModules: 3,
        weakestModuleTitle: 'Fundamental Cloud Concepts',
        weakestModuleId: 1,
      },
      2: {
        accuracy: 0,
        attemptedQuestions: 0,
        totalQuestionsInBank: 0,
        missedQuestionCount: 0,
        completedModules: 0,
        totalModules: 4,
        weakestModuleTitle: 'Core Azure Architectural Components',
        weakestModuleId: 4,
      },
      3: {
        accuracy: 0,
        attemptedQuestions: 0,
        totalQuestionsInBank: 0,
        missedQuestionCount: 0,
        completedModules: 0,
        totalModules: 4,
        weakestModuleTitle: 'Azure Governance & Compliance Tools',
        weakestModuleId: 9,
      },
    };

    LEARNING_PATHS.forEach((path) => {
      const pId = path.id;
      const pathQuestions = questions.filter((q) => q.learningPathId === pId);
      let correctCount = 0;
      let totalAttemptsCount = 0;
      let missedCountInPath = 0;

      pathQuestions.forEach((q) => {
        const qAttempts = stats.attempts?.[q.id] || [];
        if (qAttempts.length > 0) {
          totalAttemptsCount += 1;
          const latest = [...qAttempts].sort((a, b) => b.timestamp - a.timestamp)[0];
          if (latest.isCorrect) {
            correctCount += 1;
          } else {
            missedCountInPath += 1;
          }
        } else if (
          (stats.mistakesHistory || []).some(
            (m) => m.questionId === q.id && !(stats.reviewedMistakeIds || []).includes(q.id)
          )
        ) {
          missedCountInPath += 1;
        }
      });

      if (missedCountInPath === 0) {
        pathQuestions.forEach((q) => {
          const qAttempts = stats.attempts?.[q.id] || [];
          if (qAttempts.some((a) => !a.isCorrect)) {
            missedCountInPath += 1;
          }
        });
      }

      let lowestModAcc = 101;
      let weakestMod = path.modules[0];
      path.modules.forEach((m) => {
        const modQuestions = pathQuestions.filter((q) => q.moduleId === m.id);
        let mCorrect = 0;
        let mTried = 0;
        modQuestions.forEach((q) => {
          const atts = stats.attempts?.[q.id] || [];
          if (atts.length > 0) {
            mTried += 1;
            const latest = [...atts].sort((a, b) => b.timestamp - a.timestamp)[0];
            if (latest.isCorrect) mCorrect += 1;
          }
        });
        const modAcc = mTried > 0 ? Math.round((mCorrect / mTried) * 100) : 0;
        if (mTried > 0 && modAcc < lowestModAcc) {
          lowestModAcc = modAcc;
          weakestMod = m;
        }
      });

      result[pId] = {
        accuracy: totalAttemptsCount > 0 ? Math.round((correctCount / totalAttemptsCount) * 100) : 0,
        attemptedQuestions: totalAttemptsCount,
        totalQuestionsInBank: pathQuestions.length,
        missedQuestionCount: missedCountInPath,
        completedModules: path.modules.filter((m) => completedSet.has(m.id)).length,
        totalModules: path.modules.length,
        weakestModuleTitle: weakestMod.title,
        weakestModuleId: weakestMod.id,
      };
    });

    return result;
  }, [questions, stats]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 w-full max-w-full bg-white/95 backdrop-blur-md border-b shadow-xs transition-all duration-300 ${
        consecutiveCorrect >= 5
          ? consecutiveCorrect % 5 === 0
            ? 'border-orange-500 animate-five-streak-header-pulse-intense'
            : 'border-orange-400 animate-five-streak-header-pulse'
          : 'border-sky-200/80'
      }`}
    >
      {/* Azure African Fabric Patterns Only (Multiple Opacities of Azure) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <WavyAzureFabricMotif />
      </div>

      <div className="max-w-[1680px] w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 relative z-10 min-w-0">
        {/* =====================================================================
            ELONGATED CENTERED HEADER BRANDING + SINGLE-FILE SCROLL RAIL (NO FLEXBOX)
            - Stationary, enlarged, elongated logo & heading centered on central axis
            - Soft feathered light-azure radial haze behind logo & heading
            - Full-width single-file intuitive horizontal scroll controls below
           ===================================================================== */}
        <div className="relative grid grid-cols-1 gap-1.5 sm:gap-2 w-full pt-2 sm:pt-2.5 pb-1 mobile-landscape:py-1 min-w-0">
          {/* STATIONARY ENLARGED & ELONGATED CENTERED HEADING WITH LIGHT AZURE HAZE */}
          <div className="relative block w-full text-center py-1 px-2 sm:px-6 overflow-visible">
            {/* Soft Feathered Light-Azure Radial Haze Backdrop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94%,48rem)] h-[125%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.26)_0%,rgba(125,211,252,0.14)_50%,rgba(224,242,254,0)_78%)] blur-md"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(86%,42rem)] h-full rounded-full bg-gradient-to-r from-transparent via-sky-200/35 to-transparent"
            />

            <div
              className="relative z-10 inline-block align-middle cursor-pointer group/logo px-4 sm:px-8 py-0.5 max-w-full"
              onClick={handleCloudLogoClick}
              onMouseEnter={handleCloudMouseEnter}
              onMouseLeave={handleCloudMouseLeave}
              title="Click or hover to view Student Stats & Daily Encouragement"
            >
              {/* Enlarged Cloud Emblem & Maasai Medallion */}
              <div className="relative inline-block align-middle w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-md shadow-sky-400/35 group-hover/logo:scale-105 transition-transform mr-2.5 sm:mr-3.5 text-center leading-10 sm:leading-[44px] lg:leading-[48px] ring-2 ring-sky-200/70">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-6.5 lg:h-6.5 text-white inline-block align-middle" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                </svg>
                <div className="absolute -bottom-1 -right-1 leading-none">
                  <MaasaiMedallion size={14} />
                </div>
              </div>

              {/* Elongated Centered Title + Badge + Subtitle */}
              <div className="inline-block align-middle text-left max-w-full">
                <div className="block leading-none">
                  <span className="inline-block align-middle font-black text-[15px] xs:text-[17px] sm:text-xl lg:text-2xl xl:text-[27px] tracking-wide text-black leading-none whitespace-nowrap mr-2 sm:mr-2.5 drop-shadow-[0_1px_4px_rgba(186,230,253,0.75)]">
                    Azure Cloud Explorer
                  </span>
                  <span className="inline-block align-middle px-2 py-0.5 sm:px-2.5 rounded-md text-[10px] sm:text-xs lg:text-[13px] font-black tracking-wider bg-[#0078D4] text-white shadow-xs leading-none ring-1 ring-sky-200/70">
                    AZ-900
                  </span>
                </div>
                <div className="mt-1 block leading-none">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 inline-block align-middle mr-1.5 drop-shadow-[0_1px_1px_rgba(3,21,40,0.2)]" />
                  <span className="inline-block align-middle text-[10.2px] xs:text-[11.25px] sm:text-[12.9px] lg:text-[14.5px] font-normal tracking-[0.14em] uppercase studio-subtitle-azure-shimmer leading-none whitespace-nowrap">
                    Fundamentals Practice Studio
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SINGLE-FILE INTUITIVE HORIZONTAL SCROLL CONTROLS (LEFT <-> RIGHT, NO FLEXBOX) */}
          <SingleFileHorizontalScroller ariaLabel="Single-file Studio Header Controls">
              {/* Search Bar */}
              {onSearchQueryChange && onSelectQuestion && (
                <GlobalSearchBar
                  questions={questions}
                  searchQuery={searchQuery}
                  onSearchQueryChange={onSearchQueryChange}
                  onSelectQuestion={onSelectQuestion}
                  onSelectModule={onSelectModule}
                />
              )}

              {/* Categorized Studio Tabs Dropdown Trigger */}
              <button
                type="button"
                onClick={() => openCategoryDropdown('all')}
                className={`inline-block align-middle px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border whitespace-nowrap ${
                  isNavDropdownOpen
                    ? 'bg-[#005A9E] text-white border-[#004578] ring-2 ring-sky-300/60'
                    : 'bg-sky-50/90 hover:bg-sky-100 text-[#005A9E] border-sky-300/80'
                }`}
                aria-expanded={isNavDropdownOpen}
                aria-haspopup="true"
                aria-label="Open Navigation Tabs Dropdown Menu"
                title="Open Categorized Studio Navigation Dropdown Menu (16 Tabs in 4 Groups)"
              >
                {isNavDropdownOpen ? (
                  <X className="w-3.5 h-3.5 inline-block align-middle mr-1.5" />
                ) : (
                  <Menu className="w-3.5 h-3.5 text-[#0078D4] inline-block align-middle mr-1.5" />
                )}
                <span className="inline-block align-middle">{activeNavTab.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 inline-block align-middle ml-1.5 transition-transform duration-200 ${
                    isNavDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dedicated 'Ask AI Tutor' Slide-Over / Expandable Drawer Button */}
              {onToggleAiTutorDrawer && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleAiTutorDrawer();
                    setIsNavDropdownOpen(false);
                    setIsMobileDetailsOpen(false);
                    setIsMoreMenuOpen(false);
                  }}
                  aria-expanded={isAiTutorDrawerOpen}
                  aria-controls="ai-tutor-drawer"
                  title={
                    currentQuestion
                      ? `Ask AI Tutor about current question (Module ${currentQuestion.moduleId}: ${currentQuestion.moduleTitle})`
                      : 'Open Ask AI Tutor sidebar'
                  }
                  className={`inline-block align-middle px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border whitespace-nowrap ${
                    isAiTutorDrawerOpen
                      ? 'bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#0078D4] text-white border-amber-300 ring-2 ring-amber-300/60'
                      : 'bg-gradient-to-r from-amber-50 to-sky-50 hover:from-amber-100 hover:to-sky-100 text-[#005A9E] border-amber-300/80'
                  }`}
                >
                  <Bot
                    className={`w-3.5 h-3.5 inline-block align-middle mr-1.5 ${
                      isAiTutorDrawerOpen ? 'text-yellow-200' : 'text-[#C2410C]'
                    }`}
                  />
                  <span className="inline-block align-middle">Ask AI Tutor</span>
                  {currentQuestion && (
                    <span
                      className={`inline-block align-middle ml-1.5 w-1.5 h-1.5 rounded-full ${
                        isAiTutorDrawerOpen ? 'bg-emerald-300' : 'bg-[#0078D4]'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )}

              {/* Quick Study Mode Toggle: 5-Minute Sprint Timer & 10 High-Frequency Curated Questions */}
              {onToggleQuickStudyMode && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleQuickStudyMode();
                    setIsNavDropdownOpen(false);
                    setIsMobileDetailsOpen(false);
                    setIsMoreMenuOpen(false);
                  }}
                  aria-pressed={isQuickStudyMode}
                  title={
                    isQuickStudyMode
                      ? `Quick Study Sprint Active (${Math.floor(Math.max(0, quickStudySecondsLeft) / 60)
                          .toString()
                          .padStart(2, '0')}:${(Math.max(0, quickStudySecondsLeft) % 60)
                          .toString()
                          .padStart(2, '0')} remaining • ${quickStudyQuestionCount} high-frequency questions). Click to exit Quick Study.`
                      : 'Start Quick Study Mode: triggers a 5-minute countdown timer and loads 10 curated high-frequency AZ-900 exam questions'
                  }
                  className={`inline-block align-middle px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border whitespace-nowrap ${
                    isQuickStudyMode
                      ? quickStudySecondsLeft <= 60 && quickStudySecondsLeft > 0
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-300 ring-2 ring-rose-300/60'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0078D4] text-white border-emerald-300 ring-2 ring-emerald-300/60'
                      : 'bg-gradient-to-r from-emerald-50 to-sky-50 hover:from-emerald-100 hover:to-sky-100 text-emerald-900 border-emerald-300/80'
                  }`}
                >
                  <Zap
                    className={`w-3.5 h-3.5 inline-block align-middle mr-1.5 ${
                      isQuickStudyMode
                        ? 'text-yellow-200 fill-yellow-300 animate-pulse'
                        : 'text-emerald-600 fill-emerald-200'
                    }`}
                  />
                  <span className="inline-block align-middle">Quick Study</span>
                  <span
                    className={`inline-block align-middle ml-1.5 text-[10px] font-black tabular-nums ${
                      isQuickStudyMode ? 'text-yellow-100' : 'text-emerald-700'
                    }`}
                  >
                    {isQuickStudyMode
                      ? `${Math.floor(Math.max(0, quickStudySecondsLeft) / 60)
                          .toString()
                          .padStart(2, '0')}:${(Math.max(0, quickStudySecondsLeft) % 60)
                          .toString()
                          .padStart(2, '0')} · ${quickStudyQuestionCount}Q`
                      : `5m · ${quickStudyQuestionCount}Q`}
                  </span>
                </button>
              )}

              {/* Daily Study Goal Progress Ring */}
              <DailyStudyGoalRing
                todayAnsweredCount={todayAnsweredCount}
                dailyGoal={dailyGoal}
                streakDays={stats.streakDays || 0}
                onClick={() => setShowEditDailyGoalModal(true)}
                onOpenCelebration={() => setShowDailyGoalCelebrationModal(true)}
                compact={true}
              />

              {/* Tools, Path, Timer & Goal Dropdown Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileDetailsOpen((prev) => !prev);
                  setIsNavDropdownOpen(false);
                  setIsMoreMenuOpen(false);
                }}
                className={`inline-block align-middle px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border whitespace-nowrap ${
                  isMobileDetailsOpen
                    ? 'bg-[#0078D4] text-white border-[#0078D4]'
                    : 'bg-sky-50/80 hover:bg-sky-100 text-[#0078D4] border-sky-200/90'
                }`}
                aria-expanded={isMobileDetailsOpen}
                title="Open Studio Tools, Learning Path Filter, Focus Timer & Goal Dropdown Menu"
              >
                {isMobileDetailsOpen ? (
                  <X className="w-3.5 h-3.5 inline-block align-middle mr-1.5" />
                ) : (
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0078D4] inline-block align-middle mr-1.5" />
                )}
                <span className="inline-block align-middle">Tools &amp; Path</span>
                {missedCount > 0 && (
                  <span className="inline-block align-middle ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white tabular-nums">
                    {missedCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 inline-block align-middle ml-1.5 transition-transform duration-200 ${
                    isMobileDetailsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Difficulty Spectrum Streak Tracker */}
              <DifficultyStreakTracker
                stats={stats}
                questions={questions}
                activeDifficulty={effectiveDynamicDifficulty}
                onSelectDifficultyForPractice={(diff) => {
                  if (onSelectDifficultyForPractice) {
                    onSelectDifficultyForPractice(diff);
                  } else {
                    setActiveTab('quiz');
                  }
                }}
                compact={true}
              />

              {/* Harambee Streak Milestone Indicator (7, 14, 30+ days) */}
              {(() => {
                const streak = stats.streakDays || 0;
                const isMilestone = streak === 7 || streak === 14 || streak === 30 || streak >= 50;
                if (!isMilestone) return null;
                return (
                  <button
                    type="button"
                    onClick={() => setShowDailyGoalCelebrationModal(true)}
                    className="inline-block align-middle px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-black shadow-md animate-goal-celebrate cursor-pointer border border-amber-300 whitespace-nowrap"
                    title={`Harambee Milestone Reached: ${streak}-Day Continuous Study Streak! Click to celebrate & share.`}
                    aria-label={`Harambee Streak Milestone: ${streak} days`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-300 animate-bounce inline-block align-middle mr-1" />
                    <span className="inline-block align-middle">🔥 {streak}d Milestone</span>
                  </button>
                );
              })()}

              {/* Celebrate 100% Goal / Fire Streak Trigger Button */}
              <button
                type="button"
                onClick={() => setShowDailyGoalCelebrationModal(true)}
                className="inline-block align-middle px-2 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-orange-900 border border-amber-300/90 text-xs font-extrabold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                title="Open Interactive 100% Daily Goal Fire-Streak Celebration & Cohort Peer Share Modal"
                aria-label="Open Daily Goal Celebration Modal"
              >
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-amber-400 inline-block align-middle mr-1" />
                <span className="inline-block align-middle">Celebrate</span>
              </button>

              {/* Show / Hide Secondary Tabs Bar */}
              <button
                type="button"
                onClick={toggleMenuBar}
                className={`group/hidetabs inline-block align-middle px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-2xs cursor-pointer border whitespace-nowrap ${
                  isMenuBarHidden
                    ? 'bg-[#0078D4] text-white border-[#005A9E] hover:bg-[#005A9E]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                }`}
                title={isMenuBarHidden ? 'Show navigation tabs bar' : 'Hide navigation tabs bar'}
                aria-expanded={!isMenuBarHidden}
              >
                <Layers
                  className={`w-3.5 h-3.5 inline-block align-middle mr-1 transition-transform duration-200 group-hover/hidetabs:scale-110 ${
                    isMenuBarHidden ? 'text-white' : 'text-[#0078D4] group-hover/hidetabs:text-rose-600'
                  }`}
                />
                <span className="inline-block align-middle">{isMenuBarHidden ? 'Show Nav' : 'Hide Nav'}</span>
                {isMenuBarHidden ? (
                  <ChevronDown className="w-3.5 h-3.5 inline-block align-middle ml-1 text-white transition-transform duration-200 group-hover/hidetabs:translate-y-0.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 inline-block align-middle ml-1 text-slate-500 group-hover/hidetabs:text-rose-600 transition-transform duration-200 group-hover/hidetabs:-translate-y-0.5" />
                )}
              </button>

              {/* Midnight Theme Toggle */}
              <ThemeToggle />

              {/* Real-Time Database Sync Indicator */}
              <div
                className={`inline-block align-middle px-2 py-1.5 rounded-xl text-[11px] font-bold border select-none whitespace-nowrap ${
                  realtimeStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                    : realtimeStatus === 'syncing'
                    ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                    : 'bg-rose-50 text-rose-800 border-rose-200/90'
                }`}
                title={
                  realtimeStatus === 'connected'
                    ? `Cloud Connected${
                        lastSyncedAt
                          ? ` • Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
                          : ''
                      }`
                    : realtimeStatus === 'syncing'
                    ? 'Syncing progress to cloud backend...'
                    : 'Offline — Progress queued locally'
                }
                aria-label={`Real-time sync status: ${realtimeStatus}`}
              >
                {realtimeStatus === 'connected' && (
                  <>
                    <span className="relative inline-block align-middle h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-block h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-block rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Database className="w-3.5 h-3.5 text-emerald-600 inline-block align-middle" />
                  </>
                )}
                {realtimeStatus === 'syncing' && (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin inline-block align-middle" />
                )}
                {realtimeStatus === 'offline' && (
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 inline-block align-middle" />
                )}
                {pendingOfflineCount > 0 && (
                  <span className="inline-block align-middle ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9.5px] font-black">
                    {pendingOfflineCount}
                  </span>
                )}
              </div>

              {/* Focus Session Widget */}
              <div className="inline-block align-middle">
                <FocusSessionWidget onOpenStudyBreak={onOpenStudyBreak} />
              </div>

              {/* Compact Red Sign Out Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="group relative inline-block align-middle text-center hover:text-left px-2.5 hover:px-3.5 py-1.5 max-w-[38px] hover:max-w-[136px] overflow-hidden rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-700 text-xs font-black transition-all duration-300 ease-in-out shadow-2xs hover:shadow-md cursor-pointer whitespace-nowrap"
                  title={userEmail ? `Signed in as ${userEmail} • Click to open 17s Secure Exit & WhatsApp Study Report` : 'Sign out & Save Progress'}
                  aria-label="Sign out"
                >
                  <ArrowLeftOnRectangle className="w-4 h-4 inline-block align-middle transition-transform duration-300 group-hover:-translate-x-0.5" />
                  <span className="inline-block align-middle whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[85px] group-hover:ml-2 transition-all duration-300 ease-in-out font-extrabold tracking-wide overflow-hidden">
                    Sign out
                  </span>
                </button>
              )}

              {/* More Studio Controls Overflow Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen((prev) => !prev);
                  setIsNavDropdownOpen(false);
                  setIsMobileDetailsOpen(false);
                }}
                className={`inline-block align-middle px-2.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer border whitespace-nowrap ${
                  isMoreMenuOpen
                    ? 'bg-[#0078D4] text-white border-[#0078D4] ring-2 ring-sky-300/60'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                }`}
                aria-expanded={isMoreMenuOpen}
                aria-haspopup="true"
                title="Studio Controls Overflow Menu: Celebrate, Show/Hide Nav, Goal Settings, Shortcuts, User Guide & Sign Out"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-300 inline-block align-middle mr-1.5" />
                <span className="text-[11px] font-extrabold inline-block align-middle">More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 inline-block align-middle ml-1.5 transition-transform duration-200 ${
                    isMoreMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
          </SingleFileHorizontalScroller>

          {/* More Menu Dropdown rendered outside the horizontal scroll container so it is NEVER clipped vertically */}
          {isMoreMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 text-xs"
              role="menu"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Studio Controls &amp; Quick Actions
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-100 dark:bg-sky-950 text-[#0078D4] dark:text-sky-300">
                  Studio Hub
                </span>
              </div>

              <div className="space-y-0.5 max-h-[75vh] overflow-y-auto p-0.5">
                {/* Celebrate Daily Goal */}
                <button
                  type="button"
                  onClick={() => {
                    setShowDailyGoalCelebrationModal(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-orange-600 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Celebrate Daily Goal
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {todayAnsweredCount}/{dailyGoal} Qs answered today
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded shrink-0">
                    {todayAnsweredCount >= dailyGoal ? 'Goal Met! 🎉' : `${Math.round((todayAnsweredCount / dailyGoal) * 100)}%`}
                  </span>
                </button>

                {/* Show/Hide Navigation Tabs Bar */}
                <button
                  type="button"
                  onClick={() => {
                    toggleMenuBar();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-[#0078D4] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {isMenuBarHidden ? 'Show Navigation Tabs Bar' : 'Hide Navigation Tabs Bar'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isMenuBarHidden ? 'Reveal 4 categorized dropdown tabs' : 'Maximize quiz vertical space'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                    {isMenuBarHidden ? 'Hidden' : 'Visible'}
                  </span>
                </button>

                {/* Edit Daily Goal Target */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDailyGoalModal(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Edit Daily Study Goal
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Current target: {dailyGoal} questions / day
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded shrink-0">
                    Target: {dailyGoal}Q
                  </span>
                </button>

                {/* Tools, Path & Timer Menu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDetailsOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4 text-[#0078D4]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Tools &amp; Learning Paths
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Focus paths, audio pacing &amp; study decks
                      </div>
                    </div>
                  </div>
                  {missedCount > 0 && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded-full shrink-0">
                      {missedCount} Missed
                    </span>
                  )}
                </button>

                {/* Interactive User Guide */}
                {onOpenUserGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenUserGuide();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          Interactive User Guide
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Tips, architecture pinpoints &amp; AZ-900 rules
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                )}

                {/* Study Break */}
                {onOpenStudyBreak && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenStudyBreak();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          Take a Kahawa Breather
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Mindful pacing, Kenya Big Five &amp; eye rest
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded shrink-0">
                      60s
                    </span>
                  </button>
                )}

                {/* Accessibility & Shortcuts */}
                <button
                  type="button"
                  onClick={() => {
                    openAccessibilityModal();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Accessibility &amp; Shortcuts
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Font size, high contrast &amp; key combos
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                    ⌘ / Ctrl
                  </span>
                </button>

                {/* Backend Database Status */}
                {onOpenCloudBackend && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCloudBackend();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          Cloud Backend Status
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Database connection, sync &amp; audit
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded shrink-0">
                      {realtimeStatus}
                    </span>
                  </button>
                )}

                {/* Sign Out */}
                {onLogout && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowLeftOnRectangle className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-black text-xs">Sign Out</div>
                          <div className="text-[10px] text-red-500 dark:text-red-400">
                            {userEmail || 'Save session & exit'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-red-600 shrink-0">
                        Exit
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            RESPONSIVE TAILWIND CSS NAVIGATION TABS BAR (NO FLEXBOX, PRESERVES SKY GRADIENT BACKGROUND)
           ===================================================================== */}
        <nav
          aria-label="Primary Studio Navigation"
          onMouseEnter={handleNavBarMouseEnter}
          onMouseLeave={handleNavBarMouseLeave}
          className={`relative w-full max-w-full lg:max-w-5xl lg:mx-auto overflow-hidden transition-all duration-300 ease-in-out border-t lg:border border-sky-300/70 dark:border-sky-700/50 rounded-b-xl lg:rounded-lg shadow-xs backdrop-blur-md ${
            isMenuBarHidden
              ? 'max-h-0 opacity-0 pointer-events-none py-0 border-transparent my-0'
              : 'max-h-36 sm:max-h-24 lg:max-h-16 mobile-landscape:max-h-14 opacity-100 py-1 lg:py-0.5 mobile-landscape:py-0.5 mt-0.5 mb-1 mobile-landscape:my-0.5 bg-gradient-to-r from-[#0078D4]/45 via-[#0ea5e9]/50 to-[#0078D4]/45 dark:from-[#0284c7]/45 dark:via-[#0369a1]/50 dark:to-[#0284c7]/45'
          }`}
        >
          <WavyAzureFabricMotif className="opacity-50" />
          <div className="relative z-10 block text-center px-2 py-0.5 lg:py-0 w-full [&>*]:inline-block [&>*]:align-middle [&>*]:m-0.5">
              {/* Left Kenyan Moran Warrior Shield Motif (Darkened for Tabs Bar) */}
              <div
                className="hidden xl:inline-block align-middle px-0.5 opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-transform hover:scale-110"
                title="Kenyan Warrior Heritage Motif"
              >
                <MoranShieldMotif size={15} animate={true} dark={true} />
              </div>

              {/* 4 Categorized Dropdown Triggers */}
              {NAV_TAB_GROUPS.map((groupName) => {
                const groupItems = NAV_TABS.filter((item) => item.group === groupName);
                const activeItemInGroup = groupItems.find((item) => item.id === activeTab);
                const isDropdownOpenForGroup =
                  isNavDropdownOpen &&
                  (selectedNavDropdownGroup === groupName || selectedNavDropdownGroup === 'all');

                return (
                  <button
                    key={groupName}
                    type="button"
                    onClick={() => openCategoryDropdown(groupName)}
                    onMouseEnter={() => {
                      if (isNavDropdownOpen) {
                        setSelectedNavDropdownGroup(groupName);
                      }
                    }}
                    aria-expanded={isDropdownOpenForGroup}
                    aria-haspopup="true"
                    title={`${groupName} Dropdown Menu (${groupItems.map((i) => i.label).join(', ')})`}
                    className={`inline-block align-middle px-2 sm:px-2.5 lg:px-2.5 py-1 lg:py-0.5 mobile-landscape:py-0.5 rounded-lg lg:rounded-md text-[10.5px] sm:text-[11px] lg:text-[10.5px] xl:text-[11px] lg:leading-none mobile-landscape:text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                      activeItemInGroup
                        ? 'bg-[#005A9E] text-white border-amber-300/90 shadow-2xs'
                        : isDropdownOpenForGroup
                        ? 'bg-sky-700 text-white border-sky-300 shadow-2xs'
                        : 'bg-white/75 dark:bg-slate-900/70 text-slate-900 dark:text-white border-white/60 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="inline-block align-middle mr-1">
                      {activeItemInGroup ? (
                        activeItemInGroup.renderIcon(true)
                      ) : (
                        groupItems[0]?.renderIcon(false)
                      )}
                    </span>
                    <span className="inline-block align-middle">{groupName}</span>
                    {activeItemInGroup && (
                      <span className="hidden sm:inline-block align-middle ml-1 text-[9.5px] font-black text-amber-200">
                        · {activeItemInGroup.label}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3 h-3 inline-block align-middle ml-1 transition-transform duration-200 ${
                        isDropdownOpenForGroup && selectedNavDropdownGroup === groupName
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>
                );
              })}

              {/* All 16 Tabs Overview Dropdown Trigger */}
              <button
                type="button"
                onClick={() => openCategoryDropdown('all')}
                aria-expanded={isNavDropdownOpen && selectedNavDropdownGroup === 'all'}
                aria-haspopup="true"
                title="Open All 16 Studio Tabs Mega-Dropdown Menu"
                className={`inline-block align-middle px-2 py-1 lg:py-0.5 mobile-landscape:py-0.5 rounded-lg lg:rounded-md text-[10px] sm:text-[10.5px] lg:text-[10px] lg:leading-none font-black whitespace-nowrap transition-all cursor-pointer border ${
                  isNavDropdownOpen && selectedNavDropdownGroup === 'all'
                    ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 border-white/50 hover:bg-white/90'
                }`}
              >
                <Menu className="w-3 h-3 inline-block align-middle mr-1" />
                <span className="inline-block align-middle">All ({NAV_TABS.length})</span>
                <ChevronDown
                  className={`w-3 h-3 inline-block align-middle ml-1 transition-transform duration-200 ${
                    isNavDropdownOpen && selectedNavDropdownGroup === 'all' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Right Kenyan Moran Warrior Shield Motif (Darkened for Tabs Bar) */}
              <div
                className="hidden xl:inline-block align-middle px-0.5 opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-transform hover:scale-110"
                title="Kenyan Warrior Heritage Motif"
              >
                <MoranShieldMotif size={15} animate={true} dark={true} />
              </div>

              {/* Interactive Auto-Hide + Hide Tabs Controls */}
              <div className="inline-block align-middle pl-1 border-l border-white/35 space-x-1">
                <button
                  type="button"
                  onClick={() => setIsNavBarHoverAutoHide((prev) => !prev)}
                  className={`inline-block align-middle px-1.5 py-0.5 lg:py-0 rounded-md lg:rounded text-[9.5px] lg:text-[9px] lg:leading-tight font-extrabold transition-all cursor-pointer border whitespace-nowrap ${
                    isNavBarHoverAutoHide
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                      : 'bg-white/50 text-slate-800 border-white/60 hover:bg-white/80'
                  }`}
                  title="Toggle Auto-Close on Hover Leave for the Tabs Menu Bar"
                >
                  {isNavBarHoverAutoHide ? 'Auto-Hide: ON' : 'Auto-Hide'}
                </button>

                <button
                  type="button"
                  onClick={toggleMenuBar}
                  className="group/closetabs relative inline-block align-middle text-center hover:text-left px-1.5 hover:px-2 py-0.5 lg:py-0.5 max-w-[24px] hover:max-w-[110px] overflow-hidden rounded-lg lg:rounded-md bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/80 text-[10px] lg:leading-none font-black transition-all duration-300 ease-in-out shadow-2xs hover:shadow-md cursor-pointer whitespace-nowrap"
                  title="Hover & click to collapse/hide the navigation tabs menu bar"
                  aria-label="Hide Tabs Menu"
                >
                  <X className="w-3 h-3 inline-block align-middle transition-transform duration-300 group-hover/closetabs:rotate-90" />
                  <span className="inline-block align-middle whitespace-nowrap opacity-0 group-hover/closetabs:opacity-100 max-w-0 group-hover/closetabs:max-w-[85px] group-hover/closetabs:ml-1 transition-all duration-300 ease-in-out font-extrabold overflow-hidden">
                    Hide Tabs
                  </span>
                </button>
              </div>
          </div>
        </nav>

        {/* =====================================================================
            SOPHISTICATED CATEGORIZED NAVIGATION DROPDOWN MENU (All Viewable Screen Sizes: Desktop, Laptop, Tablet, Mobile — Portrait & Landscape)
            Supports inspecting a specific category group (4 items) or All 16 Tabs + Closing Hover Effect
           ===================================================================== */}
        {isNavDropdownOpen && (
          <div
            role="menu"
            aria-label="All Studio Navigation Tabs"
            onMouseEnter={handleNavDropdownMouseEnter}
            onMouseLeave={handleNavDropdownMouseLeave}
            className={`mt-1 mb-2 p-2.5 sm:p-3 mobile-landscape:p-2 rounded-2xl bg-white/98 border shadow-xl space-y-2.5 mobile-landscape:space-y-1.5 animate-in slide-in-from-top-1 duration-150 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain transition-all ${
              isClosingHoverActive
                ? 'border-rose-300 ring-2 ring-rose-200/70 opacity-90 scale-[0.995]'
                : 'border-sky-200/90'
            }`}
          >
            {/* Dropdown Top Strip: Category Filter Pills + Quick Path Switcher + Closing Hover Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mobile-landscape:pb-1.5 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-1 min-w-0">
                <MoranShieldMotif size={16} animate={false} dark={true} />
                <button
                  type="button"
                  onClick={() => setSelectedNavDropdownGroup('all')}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer border ${
                    selectedNavDropdownGroup === 'all'
                      ? 'bg-[#0078D4] text-white border-[#005A9E] shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  All 16 Tabs
                </button>
                {NAV_TAB_GROUPS.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedNavDropdownGroup(grp)}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer border ${
                      selectedNavDropdownGroup === grp
                        ? 'bg-[#005A9E] text-white border-[#004578] shadow-2xs'
                        : 'bg-sky-50/80 text-[#005A9E] border-sky-200/80 hover:bg-sky-100'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {onSelectPath && (
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-[10.5px] mobile-landscape:text-[9.5px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPath('all');
                        if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        selectedPathId === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    {([1, 2, 3] as const).map((pId) => (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => {
                          onSelectPath(pId);
                          setInspectedPathInMenu(pId);
                          if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          selectedPathId === pId
                            ? 'bg-[#0078D4] text-white font-black'
                            : 'text-slate-600 hover:text-[#0078D4]'
                        }`}
                      >
                        P{pId}
                      </button>
                    ))}
                  </div>
                )}

                {/* Auto-Close on Hover Leave Option Toggle */}
                <button
                  type="button"
                  onClick={() => setIsDropdownHoverCloseEnabled((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                    isDropdownHoverCloseEnabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Toggle automatic closing hover effect when cursor leaves the tabs menu"
                >
                  {isDropdownHoverCloseEnabled ? 'Hover-Close: ON' : 'Hover-Close: OFF'}
                </button>

                {/* Interactive Closing Hover Button (Expands & Rotates on Hover) */}
                <button
                  type="button"
                  onClick={() => setIsNavDropdownOpen(false)}
                  className="group/closedropdown flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-[10.5px] font-black transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
                  title="Close Tabs Dropdown Menu"
                  aria-label="Close Tabs Dropdown Menu"
                >
                  <X className="w-3.5 h-3.5 transition-transform duration-200 group-hover/closedropdown:rotate-90" />
                  <span>Close Menu</span>
                </button>
              </div>
            </div>

            {/* Filtered or Full Grouped Responsive Grid for Nav Bar Dropdown Items */}
            <div className="space-y-2.5 mobile-landscape:space-y-1.5">
              {(selectedNavDropdownGroup === 'all'
                ? NAV_TAB_GROUPS
                : [selectedNavDropdownGroup]
              ).map((groupName) => {
                const items = NAV_TABS.filter((item) => item.group === groupName);
                return (
                  <div key={groupName} className="space-y-1">
                    <div className="flex items-center justify-between text-[9.5px] mobile-landscape:text-[8.5px] font-black uppercase tracking-wider text-slate-500 px-0.5">
                      <span>{groupName}</span>
                      <span>{items.length} Destinations</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 mobile-landscape:grid-cols-4 gap-1.5 mobile-landscape:gap-1">
                      {items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsNavDropdownOpen(false);
                            }}
                            title={item.title}
                            className={`flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 mobile-landscape:px-2 mobile-landscape:py-1 rounded-xl text-[11px] sm:text-xs mobile-landscape:text-[10px] ${
                              item.fontWeightClass || 'font-bold'
                            } transition-all cursor-pointer border text-left min-w-0 ${
                              isActive
                                ? `${item.activeClass} border-transparent`
                                : 'bg-slate-50/90 hover:bg-sky-50 text-slate-900 border-slate-200/80 hover:border-sky-300'
                            }`}
                          >
                            {item.renderIcon(isActive)}
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TOOLS, PATH, FOCUS & GOAL DROPDOWN MENU (All Screen Sizes)
           ===================================================================== */}
        {isMobileDetailsOpen && (() => {
          const activeIntel = PATH_COMPACT_INTEL[inspectedPathInMenu];
          const activeTele = pathTelemetry[inspectedPathInMenu];

          return (
            <div className="mt-1 mb-2 px-3 py-2.5 rounded-2xl bg-white/98 border border-sky-200/90 shadow-xl space-y-2 text-xs animate-in slide-in-from-top-1 duration-150 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain">
              {/* LINE 1: Path Selector + Accuracy, Missed Retry & Live Postgres Sync */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider">Path:</span>
                  <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-[11px] font-bold">
                    {onSelectPath && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPath('all');
                          if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          selectedPathId === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                        }`}
                      >
                        All
                      </button>
                    )}
                    {([1, 2, 3] as const).map((pId) => (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => {
                          setInspectedPathInMenu(pId);
                          if (onSelectPath) onSelectPath(pId);
                          if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          inspectedPathInMenu === pId
                            ? 'bg-[#0078D4] text-white font-black'
                            : 'text-slate-600 hover:text-[#0078D4]'
                        }`}
                      >
                        P{pId} ({PATH_COMPACT_INTEL[pId].examWeight})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                  <span className="font-bold text-slate-600">
                    {activeIntel.code}: {activeTele.attemptedQuestions > 0 ? `${activeTele.accuracy}% Acc` : '0% Acc'} • {activeTele.completedModules}/{activeTele.totalModules} Mods
                  </span>
                  {onRetryIncorrectPath && activeTele.missedQuestionCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onRetryIncorrectPath(inspectedPathInMenu);
                        setIsMobileDetailsOpen(false);
                      }}
                      className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black cursor-pointer"
                    >
                      Retry {activeTele.missedQuestionCount} Missed
                    </button>
                  )}
                </div>
              </div>

              {/* LINE 2: Single-Line Key Exam Trap & Weakest Module Quick-Drill */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-y border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-extrabold text-slate-800 shrink-0">Key Exam Trap:</span>
                  <span className="text-slate-600 truncate">{activeIntel.keyTrapSummary}</span>
                </div>
                {onSelectModule && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectModule(activeTele.weakestModuleId, inspectedPathInMenu);
                      setIsMobileDetailsOpen(false);
                    }}
                    className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Drill Weakest (M{activeTele.weakestModuleId})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* LINE 3: Daily Goal, Streaks, Focus Session Timer & Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <DailyStudyStreak
                    stats={stats}
                    onUpdateStats={onUpdateStats}
                    fireStreakTrigger={fireStreakTrigger}
                    consecutiveCorrect={consecutiveCorrect}
                  />
                  <FocusSessionWidget onOpenStudyBreak={onOpenStudyBreak} />
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditDailyGoalModal(true);
                      setIsMobileDetailsOpen(false);
                    }}
                    className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Target className="w-3 h-3 text-orange-600" />
                    <span>Edit Goal ({todayAnsweredCount}/{dailyGoal})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDailyGoalCelebrationModal(true);
                      setIsMobileDetailsOpen(false);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Flame className="w-3 h-3 text-orange-500 fill-amber-400" />
                    <span>Celebrate 100% Streak</span>
                  </button>
                  {onOpenReviewSession && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenReviewSession();
                        setIsMobileDetailsOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-600" />
                      <span>Review ({missedCount})</span>
                    </button>
                  )}
                  {onOpenUserGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenUserGuide();
                        setIsMobileDetailsOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-[#0078D4]" />
                      <span>Guide &amp; PDF</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <AccessibilityFontSizeControl variant="inline-bar" />
                  <PWAInstallButton />
                  <div className="flex items-center gap-1.5 lg:hidden">
                    <ThemeToggle />
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileDetailsOpen(false);
                          onLogout();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-bold transition-all shadow-2xs hover:scale-105 cursor-pointer"
                        title="Save progress and sign out"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Centered 'Show Tabs' Handle + Right-Aligned 'Review Now' Action Band Above Daily Questions Goal (Non-Flex Tailwind Grid) */}
        {(isMenuBarHidden || (onOpenReviewSession && effectiveUnresolvedCount > 5)) && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-1.5 pt-1.5 pb-0.5 mobile-landscape:py-0.5 relative z-20">
            <div className="hidden sm:block" aria-hidden="true" />

            <div className="text-center">
              {isMenuBarHidden && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuBarHidden(false);
                    try {
                      localStorage.setItem('az900_hide_menu_bar', 'false');
                    } catch (e) {
                      console.error(e);
                    }
                    setSelectedNavDropdownGroup('all');
                    setIsNavDropdownOpen(true);
                  }}
                  onMouseEnter={handleShowTabsMouseEnter}
                  className="inline-block align-middle translate-y-[3px] px-4 py-1 mobile-landscape:px-3 mobile-landscape:py-0.5 rounded-full bg-gradient-to-r from-[#003865] to-[#005a9e] hover:from-[#004578] hover:to-[#0078d4] text-white text-[11px] mobile-landscape:text-[10px] font-extrabold shadow-md border border-sky-400/50 cursor-pointer transition-all hover:scale-105 whitespace-nowrap"
                  title="Hover or click to auto-open the full navigation tabs section"
                >
                  <span className="inline-block align-middle mr-1.5">
                    <MoranShieldMotif size={15} animate={false} dark={true} />
                  </span>
                  <span className="inline-block align-middle">Show Tabs ({activeTab.toUpperCase()})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-sky-200 inline-block align-middle ml-1.5" />
                </button>
              )}
            </div>

            <div className="text-center sm:text-right">
              {onOpenReviewSession && effectiveUnresolvedCount > 5 && (
                <button
                  type="button"
                  onClick={onOpenReviewSession}
                  className="inline-block align-middle px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-700 hover:via-red-700 hover:to-orange-700 text-white text-[11px] font-black shadow-md hover:shadow-lg border border-white/90 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                  title={`You have ${effectiveUnresolvedCount} unresolved missed questions — click to open Review Session`}
                  aria-label={`Review Now: ${effectiveUnresolvedCount} unresolved mistakes`}
                >
                  <span className="relative inline-block align-middle h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inset-0 rounded-full bg-amber-300 opacity-90" />
                    <span className="relative block rounded-full h-2 w-2 bg-amber-200" />
                  </span>
                  <RotateCcw className="w-3 h-3 text-amber-200 inline-block align-middle mr-1" />
                  <span className="inline-block align-middle">Review Now</span>
                  <span className="inline-block align-middle ml-1.5 px-1.5 py-0.2 rounded-full bg-black/25 text-[10px] font-black tabular-nums border border-white/25">
                    {effectiveUnresolvedCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Portal Student Cloud Dossier (Viewable over all the app on hover or tap) */}
      <StudentStatsCloudPopup
        isOpen={showCloudStatsPopup}
        onClose={() => setShowCloudStatsPopup(false)}
        stats={stats}
        todayAnsweredCount={todayAnsweredCount}
        dailyGoal={dailyGoal}
        anchorSide="left"
        onMouseEnter={handleCloudMouseEnter}
        onMouseLeave={handleCloudMouseLeave}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
          setShowCloudStatsPopup(false);
        }}
      />

      {/* Focused Edit Daily Goal Sub-Modal (Triggered from Header's Daily Study Goal Tracker) */}
      <EditDailyGoalModal
        stats={stats}
        todayAnsweredCount={todayAnsweredCount}
        isOpen={showEditDailyGoalModal}
        onClose={() => setShowEditDailyGoalModal(false)}
        onUpdateStats={onUpdateStats}
        onOpenFullReminders={() => setShowGoalAlertsModal(true)}
      />

      {/* 100% Daily Study Goal Fire-Streak Celebration & Cohort Peer Share Modal */}
      <DailyGoalCelebrationModal
        stats={stats}
        todayAnsweredCount={todayAnsweredCount}
        dailyGoal={dailyGoal}
        isOpen={showDailyGoalCelebrationModal}
        onClose={() => setShowDailyGoalCelebrationModal(false)}
        userEmail={userEmail}
        onNavigateToCohort={() => setActiveTab('cohort')}
      />

      {/* Dedicated Daily Goal & Custom Alerts Modal */}
      <DailyGoalAlertsModal
        stats={stats}
        isOpen={showGoalAlertsModal}
        onClose={() => setShowGoalAlertsModal(false)}
        onUpdateStats={onUpdateStats}
      />

      {/* Accessibility Settings Sub-Modal (Fallback if not controlled by App.tsx) */}
      {!onOpenAccessibilitySettings && (
        <AccessibilitySettingsModal
          isOpen={showLocalAccessibilityModal}
          onClose={() => setShowLocalAccessibilityModal(false)}
        />
      )}

      {/* Daily Questions Goal Bar directly follows without overlapping Review Now */}

      {/* Slim, Animated Daily 'Questions to Answer' Goal Progress Bar */}
      <div className="relative z-20 w-full group/goalbar">
        <div className="max-w-[1680px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 grid grid-cols-[1fr_auto] items-center gap-2 text-[10px] leading-none py-0.5 text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() =>
              isDailyGoalReached
                ? setShowDailyGoalCelebrationModal(true)
                : setShowEditDailyGoalModal(true)
            }
            className="inline-block align-middle text-left font-bold hover:text-[#0078D4] transition-colors cursor-pointer"
            title="Click to adjust daily questions goal or view goal celebration"
          >
            <Target
              className={`w-3 h-3 inline-block align-middle mr-1.5 ${
                isDailyGoalReached ? 'text-emerald-600' : 'text-[#0078D4]'
              }`}
            />
            <span className="inline-block align-middle">Daily Questions Goal</span>
            <span aria-hidden="true" className="text-slate-400 inline-block align-middle mx-1">·</span>
            <span className="tabular-nums font-extrabold text-slate-800 dark:text-white inline-block align-middle">
              {todayAnsweredCount} / {dailyGoal}
            </span>
          </button>
          <span
            className={`tabular-nums font-extrabold text-right ${
              isDailyGoalReached
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-[#005A9E] dark:text-sky-300'
            }`}
          >
            {isDailyGoalReached
              ? `Goal Complete (${dailyGoalProgressPct}%)`
              : `${dailyGoalProgressPct}% · ${Math.max(0, dailyGoal - todayAnsweredCount)} left`}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Daily questions to answer goal progress"
          aria-valuenow={todayAnsweredCount}
          aria-valuemin={0}
          aria-valuemax={dailyGoal}
          onClick={() =>
            isDailyGoalReached
              ? setShowDailyGoalCelebrationModal(true)
              : setShowEditDailyGoalModal(true)
          }
          title={`Daily Goal Progress: ${todayAnsweredCount}/${dailyGoal} questions solved today (${dailyGoalProgressPct}%)`}
          className="relative w-full h-[5px] bg-sky-100/90 dark:bg-slate-800/90 overflow-hidden cursor-pointer"
        >
          {/* Subtle 25%, 50%, 75% Quarter Milestone Ticks */}
          <span aria-hidden="true" className="absolute top-0 bottom-0 left-1/4 w-px bg-white/70 dark:bg-slate-900/50 z-10 pointer-events-none" />
          <span aria-hidden="true" className="absolute top-0 bottom-0 left-1/2 w-px bg-white/70 dark:bg-slate-900/50 z-10 pointer-events-none" />
          <span aria-hidden="true" className="absolute top-0 bottom-0 left-3/4 w-px bg-white/70 dark:bg-slate-900/50 z-10 pointer-events-none" />

          {/* Animated Fill Bar */}
          <div
            className={`relative h-full transition-[width] duration-700 ease-out overflow-hidden ${
              isDailyGoalReached
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400'
                : dailyGoalProgressPct >= 50
                ? 'bg-gradient-to-r from-[#0078D4] via-cyan-500 to-emerald-500'
                : 'bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-sky-400'
            }`}
            style={{ width: `${dailyGoalProgressPct}%` }}
          >
            {dailyGoalProgressPct > 0 && (
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-slim-progress-shimmer"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

