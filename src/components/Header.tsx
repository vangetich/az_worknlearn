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
    <div className="inline-flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={isGoalReached && onOpenCelebration ? onOpenCelebration : onClick}
        className={`group relative flex items-center gap-1.5 ${
          compact ? 'px-2 py-1' : 'px-2.5 py-1'
        } rounded-xl border text-xs font-extrabold transition-all duration-300 shadow-2xs cursor-pointer shrink-0 overflow-visible ${
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
      setShowCloudStatsPopup(false);
    }
  };

  // Close dropdown menus cleanly on Escape key or click outside header
  React.useEffect(() => {
    if (!isNavDropdownOpen && !isMobileDetailsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNavDropdownOpen(false);
        setIsMobileDetailsOpen(false);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsNavDropdownOpen(false);
        setIsMobileDetailsOpen(false);
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
  }, [isNavDropdownOpen, isMobileDetailsOpen]);

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

      <div className="max-w-7xl w-full mx-auto px-2.5 sm:px-5 lg:px-6 relative z-10 min-w-0">
        {/* =====================================================================
            MOBILE & TABLET COMPACT TOP BAR (< lg screens)
            - Always displays Azure Cloud Explorer • AZ-900 • Fundamentals Practice Studio
            - Compact 2-row stack on narrow portrait phones (< sm)
            - Slim 1-row bar with slightly smaller text on mobile landscape
            - Clean 1-row tablet portrait bar with dedicated All-Tabs Dropdown Menu
           ===================================================================== */}
        <div className="flex lg:hidden flex-wrap sm:flex-nowrap mobile-landscape:flex-nowrap items-center justify-between py-1.5 sm:py-2 mobile-landscape:py-1 gap-1.5 sm:gap-2 mobile-landscape:gap-1 min-w-0 w-full">
          {/* Brand Logo + Always-Viewable App Title + Hover/Tap Student Stats Pop-up */}
          <div className="relative flex items-center min-w-0 basis-full sm:basis-auto sm:flex-1 mobile-landscape:basis-auto mobile-landscape:flex-1">
            <div
              className="flex items-center gap-1.5 sm:gap-2 mobile-landscape:gap-1.5 cursor-pointer group/logo min-w-0 max-w-full"
              onClick={handleCloudLogoClick}
              onMouseEnter={handleCloudMouseEnter}
              onMouseLeave={handleCloudMouseLeave}
              title="Click or hover to view Student Stats & Daily Encouragement"
            >
              <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mobile-landscape:w-7 mobile-landscape:h-7 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-xs shrink-0 group-hover/logo:scale-105 transition-transform">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mobile-landscape:w-3.5 mobile-landscape:h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                </svg>
                <div className="absolute -bottom-1 -right-1">
                  <MaasaiMedallion size={10} />
                </div>
              </div>

              <div className="block min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-black text-xs xs:text-[13px] sm:text-sm mobile-landscape:text-[11px] tracking-tight text-slate-900 leading-tight truncate">
                    Azure Cloud Explorer
                  </span>
                  <span className="px-1 xs:px-1.5 py-0.2 rounded text-[8.5px] xs:text-[9.5px] sm:text-[10px] mobile-landscape:text-[8.5px] font-black bg-[#0078D4] text-white shrink-0 shadow-2xs">
                    AZ-900
                  </span>
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/35 shadow-2xs max-w-full">
                  <Sparkles className="w-2.5 h-2.5 mobile-landscape:w-2 mobile-landscape:h-2 text-[#0078D4] shrink-0" />
                  <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10.5px] mobile-landscape:text-[8px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent truncate studio-subtitle-standout">
                    Fundamentals Practice Studio
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls on Mobile & Tablet */}
          <div className="flex items-center justify-between sm:justify-end mobile-landscape:justify-end gap-1 sm:gap-1.5 mobile-landscape:gap-1 w-full sm:w-auto mobile-landscape:w-auto shrink-0 min-w-0">
            {/* Tablet Portrait & Mobile Navigation Dropdown Menu Trigger (Accommodates all 16 Nav Bar Buttons) */}
            <button
              type="button"
              onClick={() => openCategoryDropdown('all')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 mobile-landscape:px-2 py-1 sm:py-1.5 mobile-landscape:py-1 rounded-xl text-[11px] sm:text-xs mobile-landscape:text-[10px] font-extrabold transition-all shadow-xs cursor-pointer border shrink-0 min-w-0 ${
                isNavDropdownOpen
                  ? 'bg-[#005A9E] text-white border-[#004578] ring-2 ring-sky-300/60'
                  : 'bg-sky-50/90 hover:bg-sky-100 text-[#005A9E] border-sky-300/80'
              }`}
              aria-expanded={isNavDropdownOpen}
              aria-haspopup="true"
              aria-label="Open Navigation Tabs Dropdown Menu"
              title="Open Navigation Dropdown Menu with all 16 studio tabs"
            >
              {isNavDropdownOpen ? (
                <X className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 shrink-0" />
              ) : (
                <Menu className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 text-[#0078D4] shrink-0" />
              )}
              <span className="truncate max-w-[115px] xs:max-w-[140px] sm:max-w-[135px] mobile-landscape:max-w-[95px]">
                {activeNavTab.label}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 shrink-0 transition-transform duration-200 ${
                  isNavDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className="flex items-center gap-1 sm:gap-1.5 mobile-landscape:gap-1 shrink-0">
              {/* Subtle Supabase Real-Time Connection Status Indicator (Mobile/Tablet) */}
              <div
                className={`flex items-center gap-1 px-1.5 sm:px-2 mobile-landscape:px-1.5 py-1 sm:py-1.5 mobile-landscape:py-1 rounded-xl text-[11px] mobile-landscape:text-[10px] font-bold border select-none ${
                  realtimeStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                    : realtimeStatus === 'syncing'
                    ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                    : 'bg-rose-50 text-rose-800 border-rose-200/90'
                }`}
                title={
                  realtimeStatus === 'connected'
                    ? `Supabase / Postgres Connected${
                        lastSyncedAt
                          ? ` • Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
                          : ''
                      }`
                    : realtimeStatus === 'syncing'
                    ? 'Syncing progress to Supabase / Postgres backend...'
                    : 'Supabase / Postgres Offline — Progress queued locally'
                }
                aria-label={`Supabase real-time sync status: ${realtimeStatus}`}
              >
                {realtimeStatus === 'connected' && (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Database className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 text-emerald-600" />
                  </>
                )}
                {realtimeStatus === 'syncing' && (
                  <RefreshCw className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 text-amber-600 animate-spin" />
                )}
                {realtimeStatus === 'offline' && (
                  <WifiOff className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 text-rose-600" />
                )}
                {pendingOfflineCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9.5px] font-black">
                    {pendingOfflineCount}
                  </span>
                )}
              </div>

              <div className="hidden md:block mobile-landscape:hidden">
                <FocusSessionWidget onOpenStudyBreak={onOpenStudyBreak} />
              </div>

              {/* Show/Hide Tabs toggle — Visible in ALL viewable screen sizes (Portrait & Landscape) */}
              <button
                type="button"
                onClick={toggleMenuBar}
                className={`group/hidetabs flex items-center gap-1 px-2 sm:px-2.5 mobile-landscape:px-2 py-1 sm:py-1.5 mobile-landscape:py-1 rounded-xl text-[10px] sm:text-[11px] mobile-landscape:text-[10px] font-extrabold transition-all duration-200 shadow-2xs cursor-pointer border shrink-0 ${
                  isMenuBarHidden
                    ? 'bg-[#0078D4] text-white border-[#005A9E] hover:bg-[#005A9E]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                }`}
                title={isMenuBarHidden ? 'Show navigation tabs bar' : 'Hide navigation tabs bar'}
                aria-expanded={!isMenuBarHidden}
                aria-label={isMenuBarHidden ? 'Show Tabs' : 'Hide Tabs'}
              >
                <Layers
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover/hidetabs:scale-110 ${
                    isMenuBarHidden ? 'text-white' : 'text-[#0078D4] group-hover/hidetabs:text-rose-600'
                  }`}
                />
                <span>{isMenuBarHidden ? 'Show Tabs' : 'Hide Tabs'}</span>
                {isMenuBarHidden ? (
                  <ChevronDown className="w-3 h-3 text-white transition-transform duration-200 group-hover/hidetabs:translate-y-0.5" />
                ) : (
                  <ChevronUp className="w-3 h-3 text-slate-500 group-hover/hidetabs:text-rose-600 transition-transform duration-200 group-hover/hidetabs:-translate-y-0.5" />
                )}
              </button>

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

              <DailyStudyGoalRing
                todayAnsweredCount={todayAnsweredCount}
                dailyGoal={dailyGoal}
                streakDays={stats.streakDays || 0}
                onClick={() => setShowEditDailyGoalModal(true)}
                onOpenCelebration={() => setShowDailyGoalCelebrationModal(true)}
                compact={true}
              />

              <button
                type="button"
                onClick={() => {
                  setIsMobileDetailsOpen((prev) => !prev);
                  setIsNavDropdownOpen(false);
                }}
                className={`flex items-center gap-1 px-2 sm:px-2.5 mobile-landscape:px-2 py-1 sm:py-1.5 mobile-landscape:py-1 rounded-xl text-[11px] sm:text-xs mobile-landscape:text-[10px] font-extrabold transition-all shadow-xs cursor-pointer border ${
                  isMobileDetailsOpen
                    ? 'bg-[#0078D4] text-white border-[#0078D4]'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90'
                }`}
                aria-expanded={isMobileDetailsOpen}
                aria-label="Toggle Tools and Goal dropdown"
              >
                {isMobileDetailsOpen ? (
                  <X className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3" />
                ) : (
                  <SlidersHorizontal className="w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 text-[#0078D4]" />
                )}
                <span className="hidden sm:inline mobile-landscape:hidden">Tools &amp; Goal</span>
                <span className="sm:hidden mobile-landscape:inline">Tools</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 mobile-landscape:w-3 mobile-landscape:h-3 transition-transform duration-200 ${
                    isMobileDetailsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Mobile & Tablet Compact Red Sign Out Button with Smooth Width Expansion on Hover */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="group relative flex items-center justify-center hover:justify-start gap-0 hover:gap-2 px-2 hover:px-3 py-1 sm:py-1.5 mobile-landscape:py-1 max-w-[34px] sm:max-w-[38px] hover:max-w-[128px] overflow-hidden rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-700 text-xs mobile-landscape:text-[10px] font-black transition-all duration-300 ease-in-out shadow-2xs hover:shadow-md cursor-pointer shrink-0"
                  title={userEmail ? `Signed in as ${userEmail} • Click to open 17s Secure Exit & WhatsApp Study Report` : 'Sign out & Save Progress'}
                  aria-label="Sign out"
                >
                  <ArrowLeftOnRectangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mobile-landscape:w-3.5 mobile-landscape:h-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
                  <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[80px] transition-all duration-300 ease-in-out font-extrabold tracking-tight">
                    Sign out
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            LAPTOP & DESKTOP PERMANENT SLIM NAVIGATION BAR TOP TIER (lg+ screens)
           ===================================================================== */}
        <div className="hidden lg:flex items-center justify-between py-1 gap-2">
          {/* Left Brand: Logo & Slightly Larger Azure Curriculum Title in Laptop & Desktop Views */}
          <div className="relative shrink-0 flex items-center">
            <div
              className="flex items-center gap-2.5 cursor-pointer group/logo shrink-0"
              onClick={handleCloudLogoClick}
              onMouseEnter={handleCloudMouseEnter}
              onMouseLeave={handleCloudMouseLeave}
              title="Click or hover to view Student Stats & Daily Encouragement"
            >
              <div className="relative flex items-center justify-center w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-xs shadow-blue-500/20 group-hover/logo:scale-105 transition-transform shrink-0">
                <svg className="w-4.5 h-4.5 xl:w-5 xl:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                </svg>
                <div className="absolute -bottom-1 -right-1">
                  <MaasaiMedallion size={13} />
                </div>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg xl:text-xl 2xl:text-[22px] tracking-tight text-slate-900 leading-none">
                    Azure Cloud Explorer
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] xl:text-xs font-black bg-[#0078D4] text-white shadow-2xs leading-none">
                    AZ-900
                  </span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/40 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#0078D4] shrink-0" />
                  <span className="text-[11px] xl:text-xs font-extrabold tracking-wider uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent studio-subtitle-standout leading-none">
                    Fundamentals Practice Studio
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls: Compact Single-Row Layout Utilizing Dropdown Menus across Laptop & Desktop */}
          <div className="flex items-center justify-end gap-1 xl:gap-1.5 flex-nowrap shrink-0">
            {onSearchQueryChange && onSelectQuestion && (
              <GlobalSearchBar
                questions={questions}
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
                onSelectQuestion={onSelectQuestion}
                onSelectModule={onSelectModule}
              />
            )}

            {/* Categorized Studio Tabs Dropdown Trigger (Desktop & Laptop) */}
            <button
              type="button"
              onClick={() => openCategoryDropdown('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border shrink-0 whitespace-nowrap ${
                isNavDropdownOpen
                  ? 'bg-[#005A9E] text-white border-[#004578] ring-2 ring-sky-300/60'
                  : 'bg-sky-50/90 hover:bg-sky-100 text-[#005A9E] border-sky-300/80'
              }`}
              aria-expanded={isNavDropdownOpen}
              aria-haspopup="true"
              title="Open Categorized Studio Navigation Dropdown Menu (16 Tabs in 4 Groups)"
            >
              {isNavDropdownOpen ? (
                <X className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Menu className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
              )}
              <span>{activeNavTab.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  isNavDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

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

            <DailyStudyGoalRing
              todayAnsweredCount={todayAnsweredCount}
              dailyGoal={dailyGoal}
              streakDays={stats.streakDays || 0}
              onClick={() => setShowEditDailyGoalModal(true)}
              onOpenCelebration={() => setShowDailyGoalCelebrationModal(true)}
              compact={true}
            />

            {/* Celebrate 100% Goal / Fire Streak Trigger Button */}
            <button
              type="button"
              onClick={() => setShowDailyGoalCelebrationModal(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-orange-900 border border-amber-300/90 text-xs font-extrabold transition-all shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
              title="Open Interactive 100% Daily Goal Fire-Streak Celebration & Cohort Peer Share Modal"
              aria-label="Open Daily Goal Celebration Modal"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-amber-400 shrink-0" />
              <span className="hidden xl:inline">Celebrate</span>
            </button>

            {/* Desktop Tools, Path, Timer & Goal Dropdown Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileDetailsOpen((prev) => !prev);
                setIsNavDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border shrink-0 whitespace-nowrap ${
                isMobileDetailsOpen
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-sky-50/80 hover:bg-sky-100 text-[#0078D4] border-sky-200/90'
              }`}
              aria-expanded={isMobileDetailsOpen}
              title="Open Studio Tools, Learning Path Filter, Focus Timer & Goal Dropdown Menu"
            >
              {isMobileDetailsOpen ? (
                <X className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
              )}
              <span>Tools &amp; Path</span>
              {missedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white tabular-nums">
                  {missedCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  isMobileDetailsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Focus Mode Indicator with Hover-Only Platform-Aware Keyboard Shortcut Guide */}
            <div className="relative group/focusguide shrink-0">
              <button
                type="button"
                onClick={onToggleFocusMode}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border whitespace-nowrap ${
                  isFocusMode
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700'
                }`}
                aria-label="Focus Mode indicator — hover to view platform-aware keyboard shortcuts"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden 2xl:inline">Focus</span>
                <kbd className="px-1 py-0.2 rounded bg-white/15 text-[9.5px] font-mono text-sky-200">
                  {formatShortcutCombo(shortcutConfig.focusMode, detectedPlatform)}
                </kbd>
              </button>

              <KeyboardShortcutGuidePopover
                isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
                effectiveDynamicDifficulty={effectiveDynamicDifficulty}
                onToggleDynamicDifficulty={onToggleDynamicDifficulty}
                onOpenAccessibilitySettings={openAccessibilityModal}
                align="right"
              />
            </div>

            <button
              type="button"
              onClick={toggleMenuBar}
              className={`group/hidetabs flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-2xs cursor-pointer border shrink-0 whitespace-nowrap ${
                isMenuBarHidden
                  ? 'bg-[#0078D4] text-white border-[#005A9E] hover:bg-[#005A9E]'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
              }`}
              title={isMenuBarHidden ? 'Show compact dropdown navigation bar' : 'Hide compact dropdown navigation bar'}
              aria-expanded={!isMenuBarHidden}
            >
              <Layers
                className={`w-3.5 h-3.5 transition-transform duration-200 group-hover/hidetabs:scale-110 ${
                  isMenuBarHidden ? 'text-white' : 'text-[#0078D4] group-hover/hidetabs:text-rose-600'
                }`}
              />
              <span className="hidden xl:inline">{isMenuBarHidden ? 'Show Nav' : 'Hide Nav'}</span>
              {isMenuBarHidden ? (
                <ChevronDown className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover/hidetabs:translate-y-0.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover/hidetabs:text-rose-600 transition-transform duration-200 group-hover/hidetabs:-translate-y-0.5" />
              )}
            </button>

            <ThemeToggle />

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="group relative flex items-center justify-center hover:justify-start gap-0 hover:gap-2 px-2.5 hover:px-3.5 py-1.5 max-w-[38px] hover:max-w-[136px] overflow-hidden rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-700 text-xs font-black transition-all duration-300 ease-in-out shadow-2xs hover:shadow-md cursor-pointer shrink-0"
                title={userEmail ? `Signed in as ${userEmail} • Click to open 17s Secure Exit & WhatsApp Study Report` : 'Sign out & Save Progress'}
                aria-label="Sign out"
              >
                <ArrowLeftOnRectangle className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[85px] transition-all duration-300 ease-in-out font-extrabold tracking-wide">
                  Sign out
                </span>
              </button>
            )}
          </div>
        </div>

        {/* =====================================================================
            COMPACT DROPDOWN-DRIVEN NAVIGATION BAR (All Screen Sizes: Desktop, Laptop, Tablet, Mobile — Portrait & Landscape)
            Replaces 16 sprawling buttons with 4 Categorized Dropdown Menus + All-Tabs Trigger to minimize Nav Bar size
           ===================================================================== */}
        <nav
          aria-label="Primary Studio Navigation"
          onMouseEnter={handleNavBarMouseEnter}
          onMouseLeave={handleNavBarMouseLeave}
          className={`relative w-full lg:w-fit lg:max-w-full lg:mx-auto overflow-hidden transition-all duration-300 ease-in-out border-t lg:border border-sky-300/70 dark:border-sky-700/50 rounded-b-xl lg:rounded-lg lg:mb-0.5 shadow-xs backdrop-blur-md ${
            isMenuBarHidden
              ? 'max-h-0 opacity-0 pointer-events-none py-0 border-transparent lg:mb-0'
              : 'max-h-24 sm:max-h-14 lg:max-h-8 mobile-landscape:max-h-10 opacity-100 py-1 lg:py-0.5 mobile-landscape:py-0.5 bg-gradient-to-r from-[#0078D4]/45 via-[#0ea5e9]/50 to-[#0078D4]/45 dark:from-[#0284c7]/45 dark:via-[#0369a1]/50 dark:to-[#0284c7]/45'
          }`}
        >
          <WavyAzureFabricMotif className="opacity-50" />
          <div className="relative z-10 flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-start sm:justify-center gap-1 sm:gap-1.5 px-2 lg:px-2 py-0.5 lg:py-0 max-w-full">
            {/* Left Kenyan Moran Warrior Shield Motif */}
            <div
              className="hidden xl:flex items-center shrink-0 px-0.5 opacity-95 hover:opacity-100 transition-opacity"
              title="Kenyan Warrior Heritage Motif"
            >
              <MoranShieldMotif size={14} animate={true} />
            </div>

            {/* 4 Space-Saving Categorized Dropdown Menus (Employed at ALL Screen Sizes: Desktop, Laptop, Tablet & Mobile) */}
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
                  className={`flex items-center gap-1 px-2 sm:px-2.5 lg:px-2.5 py-1 lg:py-0.5 mobile-landscape:py-0.5 rounded-lg lg:rounded-md text-[10.5px] sm:text-[11px] lg:text-[10.5px] xl:text-[11px] lg:leading-none mobile-landscape:text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    activeItemInGroup
                      ? 'bg-[#005A9E] text-white border-amber-300/90 shadow-2xs'
                      : isDropdownOpenForGroup
                      ? 'bg-sky-700 text-white border-sky-300 shadow-2xs'
                      : 'bg-white/75 dark:bg-slate-900/70 text-slate-900 dark:text-white border-white/60 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  {activeItemInGroup ? (
                    activeItemInGroup.renderIcon(true)
                  ) : (
                    groupItems[0]?.renderIcon(false)
                  )}
                  <span>{groupName}</span>
                  {activeItemInGroup && (
                    <span className="hidden sm:inline text-[9.5px] font-black text-amber-200">
                      · {activeItemInGroup.label}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
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
              className={`flex items-center gap-1 px-2 py-1 lg:py-0.5 mobile-landscape:py-0.5 rounded-lg lg:rounded-md text-[10px] sm:text-[10.5px] lg:text-[10px] lg:leading-none font-black whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                isNavDropdownOpen && selectedNavDropdownGroup === 'all'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 border-white/50 hover:bg-white/90'
              }`}
            >
              <Menu className="w-3 h-3 shrink-0" />
              <span>All ({NAV_TABS.length})</span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                  isNavDropdownOpen && selectedNavDropdownGroup === 'all' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Right Kenyan Moran Warrior Shield Motif */}
            <div
              className="hidden xl:flex items-center shrink-0 px-0.5 opacity-95 hover:opacity-100 transition-opacity"
              title="Kenyan Warrior Heritage Motif"
            >
              <MoranShieldMotif size={14} animate={true} />
            </div>

            {/* Interactive Closing Hover Effect Control for Tabs Menu Bar + Auto-Hide Option */}
            <div className="flex items-center gap-1 pl-1 border-l border-white/35 shrink-0">
              <button
                type="button"
                onClick={() => setIsNavBarHoverAutoHide((prev) => !prev)}
                className={`px-1.5 py-0.5 lg:py-0 rounded-md lg:rounded text-[9.5px] lg:text-[9px] lg:leading-tight font-extrabold transition-all cursor-pointer border whitespace-nowrap ${
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
                className="group/closetabs relative flex items-center justify-center hover:justify-start gap-0 hover:gap-1 px-1.5 hover:px-2 py-0.5 lg:py-0.5 max-w-[24px] hover:max-w-[110px] overflow-hidden rounded-lg lg:rounded-md bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/80 text-[10px] lg:leading-none font-black transition-all duration-300 ease-in-out shadow-2xs hover:shadow-md cursor-pointer shrink-0"
                title="Hover & click to collapse/hide the navigation tabs menu bar"
                aria-label="Hide Tabs Menu"
              >
                <X className="w-3 h-3 shrink-0 transition-transform duration-300 group-hover/closetabs:rotate-90" />
                <span className="whitespace-nowrap opacity-0 group-hover/closetabs:opacity-100 max-w-0 group-hover/closetabs:max-w-[85px] transition-all duration-300 ease-in-out font-extrabold">
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
                <MoranShieldMotif size={15} animate={false} />
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

        {/* Minimalist Floating Expand Handle (Visible across ALL screen sizes — Portrait & Landscape — when menu bar is hidden) */}
        {isMenuBarHidden && (
          <div className="flex justify-center -mt-0.5 mb-1.5 py-1 mobile-landscape:py-0.5 relative z-20">
            <button
              type="button"
              onClick={toggleMenuBar}
              className="inline-flex items-center gap-1.5 px-4 py-1 mobile-landscape:px-3 mobile-landscape:py-0.5 rounded-full bg-gradient-to-r from-[#003865] to-[#005a9e] hover:from-[#004578] hover:to-[#0078d4] text-white text-[11px] mobile-landscape:text-[10px] font-extrabold shadow-md border border-sky-400/50 cursor-pointer transition-all hover:scale-105"
              title="Expand navigation menu tabs"
            >
              <MoranShieldMotif size={14} animate={false} />
              <span>Show Tabs ({activeTab.toUpperCase()})</span>
              <ChevronDown className="w-3.5 h-3.5 text-sky-200" />
            </button>
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

      {/* Floating 'Review Now' Pill Button (Appears when unresolvedMistakesCount > 5) */}
      {onOpenReviewSession && effectiveUnresolvedCount > 5 && (
        <div className="pointer-events-none absolute right-3 sm:right-6 -bottom-4 z-40">
          <button
            type="button"
            onClick={onOpenReviewSession}
            className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-700 hover:via-red-700 hover:to-orange-700 text-white text-xs font-black shadow-lg hover:shadow-xl border-2 border-white/90 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-top-2 duration-200"
            title={`You have ${effectiveUnresolvedCount} unresolved missed questions — click to open Review Session`}
            aria-label={`Review Now: ${effectiveUnresolvedCount} unresolved mistakes`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-90" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200" />
            </span>
            <RotateCcw className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            <span>Review Now</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px] font-black tabular-nums border border-white/25">
              {effectiveUnresolvedCount}
            </span>
          </button>
        </div>
      )}
    </header>
  );
};

