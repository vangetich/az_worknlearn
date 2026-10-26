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
import { ThemeToggle } from './ThemeToggle';
import { AccessibilityFontSizeControl } from './AccessibilityFontSizeControl';
import { GlobalSearchBar } from './GlobalSearchBar';
import { FocusSessionWidget } from './FocusSessionWidget';
import { SupabaseRealtimeStatus } from '../hooks/usePostgresDatabase';

/**
 * Animated Daily Study Goal Circular Progress Ring
 * Animates stroke-dashoffset smoothly as users answer questions throughout the day.
 */
const DailyStudyGoalRing: React.FC<{
  todayAnsweredCount: number;
  dailyGoal: number;
  onClick: () => void;
  compact?: boolean;
}> = ({ todayAnsweredCount, dailyGoal, onClick, compact = false }) => {
  const safeGoal = Math.max(1, dailyGoal);
  const progressRatio = Math.min(1, todayAnsweredCount / safeGoal);
  const percentage = Math.round(progressRatio * 100);
  const isGoalReached = todayAnsweredCount >= safeGoal;

  const size = compact ? 26 : 30;
  const strokeWidth = compact ? 3 : 3.2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-1.5 ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1'
      } rounded-xl border text-xs font-extrabold transition-all duration-300 shadow-2xs cursor-pointer shrink-0 ${
        isGoalReached
          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/40'
          : 'bg-orange-50/90 hover:bg-orange-100 text-orange-900 border-orange-200/90'
      }`}
      title={`Daily Study Goal: ${todayAnsweredCount}/${safeGoal} questions solved today (${percentage}%) • Click to configure daily session target`}
      aria-label={`Daily Study Goal progress: ${todayAnsweredCount} of ${safeGoal} questions (${percentage}%)`}
    >
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
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
            className={isGoalReached ? 'text-emerald-200' : 'text-orange-200/80'}
          />
          {/* Animated Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={isGoalReached ? '#059669' : '#ea580c'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.75s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black tracking-tighter">
          {isGoalReached ? '✓' : `${percentage}%`}
        </span>
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] uppercase tracking-wider font-black opacity-75 hidden sm:inline">
          Daily Goal
        </span>
        <span className="text-[11px] font-black tabular-nums">
          {todayAnsweredCount}/{safeGoal}
        </span>
      </div>
    </button>
  );
};

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
  userEmail?: string | null;
  onLogout?: () => void;
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
  userEmail = null,
  onLogout,
}) => {
  const [showGoalAlertsModal, setShowGoalAlertsModal] = useState<boolean>(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState<boolean>(false);
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
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-clip bg-white/95 backdrop-blur-md border-b border-sky-200/80 shadow-xs relative">
      {/* Azure African Fabric Patterns Only (Multiple Opacities of Azure) */}
      <WavyAzureFabricMotif />

      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* =====================================================================
            MOBILE & TABLET COMPACT TOP BAR (< lg screens)
           ===================================================================== */}
        <div className="flex lg:hidden items-center justify-between py-2 gap-1.5 sm:gap-2 min-w-0">
          {/* Compact Brand Logo & Title */}
          <div
            className="flex items-center gap-2 cursor-pointer group/logo min-w-0 flex-1"
            onClick={() => setActiveTab('quiz')}
          >
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-xs shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={12} />
              </div>
            </div>

            <div className="truncate text-left min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="font-black text-xs sm:text-base tracking-tight text-slate-900 truncate">
                  Azure Cloud Explorer
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10.35px] sm:text-[11.5px] font-black bg-[#0078D4] text-white shrink-0 shadow-2xs">
                  AZ-900
                </span>
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/35 shadow-2xs max-w-full">
                <Sparkles className="w-3 h-3 text-[#0078D4] shrink-0" />
                <span className="text-[10.35px] sm:text-[12.65px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent truncate studio-subtitle-standout">
                  Fundamentals Practice Studio
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls on Mobile & Tablet */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
            {/* Subtle Supabase Real-Time Connection Status Indicator Icon (Mobile/Tablet) */}
            <button
              type="button"
              onClick={onOpenCloudBackend}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer border ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                  : realtimeStatus === 'syncing'
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/90'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200/90'
              }`}
              title={
                realtimeStatus === 'connected'
                  ? `Supabase / Postgres Connected${
                      lastSyncedAt
                        ? ` • Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
                        : ''
                    } (Click to inspect Cloud DB)`
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
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                </>
              )}
              {realtimeStatus === 'syncing' && (
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              )}
              {realtimeStatus === 'offline' && (
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className="hidden md:inline capitalize">{realtimeStatus}</span>
            </button>

            <div className="hidden md:block">
              <FocusSessionWidget onOpenStudyBreak={onOpenStudyBreak} />
            </div>

            <button
              type="button"
              onClick={toggleMenuBar}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                isMenuBarHidden
                  ? 'bg-blue-50 text-[#0078D4] border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
              title={isMenuBarHidden ? 'Show sliding navigation tabs' : 'Hide sliding navigation tabs'}
              aria-expanded={!isMenuBarHidden}
            >
              <Layers className="w-3.5 h-3.5 text-[#0078D4]" />
              <span className="hidden md:inline">{isMenuBarHidden ? 'Show Tabs' : 'Hide Tabs'}</span>
            </button>

            <DailyStudyGoalRing
              todayAnsweredCount={todayAnsweredCount}
              dailyGoal={dailyGoal}
              onClick={() => setShowGoalAlertsModal(true)}
              compact={true}
            />

            <button
              type="button"
              onClick={() => setIsMobileDetailsOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer border ${
                isMobileDetailsOpen
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90'
              }`}
              aria-expanded={isMobileDetailsOpen}
              aria-label="Toggle Tools and Goal dropdown"
            >
              {isMobileDetailsOpen ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0078D4]" />
              )}
              <span className="hidden sm:inline">Tools &amp; Goal</span>
              <span className="sm:hidden">Tools</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMobileDetailsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Mobile & Tablet Compact Red Sign Out Button with Smooth Width Expansion on Hover */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="group relative flex items-center justify-center hover:justify-start gap-0 hover:gap-2 px-2 hover:px-3 py-1.5 max-w-[34px] sm:max-w-[38px] hover:max-w-[128px] overflow-hidden rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-700 text-xs font-black transition-all duration-300 ease-in-out shadow-2xs hover:shadow-md cursor-pointer shrink-0"
                title={userEmail ? `Signed in as ${userEmail} • Click to open 17s Secure Exit & WhatsApp Study Report` : 'Sign out & Save Progress'}
                aria-label="Sign out"
              >
                <ArrowLeftOnRectangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[80px] transition-all duration-300 ease-in-out font-extrabold tracking-tight">
                  Sign out
                </span>
              </button>
            )}
          </div>
        </div>

        {/* =====================================================================
            LAPTOP & DESKTOP COMPACT NAVIGATION BAR TOP TIER (lg+ screens)
           ===================================================================== */}
        <div className="hidden lg:flex items-center justify-between py-2 gap-3">
          {/* Left Brand: Logo & Compact Azure Curriculum Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group/logo shrink-0"
            onClick={() => setActiveTab('quiz')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-xs shadow-blue-500/20 group-hover/logo:scale-105 transition-transform shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={14} />
              </div>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg xl:text-xl tracking-tight text-slate-900 leading-none">
                  Azure Cloud Explorer
                </span>
                <span className="px-1.5 py-0.5 rounded text-[11.5px] font-black bg-[#0078D4] text-white shadow-2xs">
                  AZ-900
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/40 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#0078D4] shrink-0" />
                <span className="text-[12.65px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent studio-subtitle-standout">
                  Fundamentals Practice Studio
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Global Search, Compact Path Selector, Tools & Goal Dropdown, Goal Ring & Actions */}
          <div className="flex items-center justify-end gap-1.5 xl:gap-2 flex-wrap">
            {onSearchQueryChange && onSelectQuestion && (
              <GlobalSearchBar
                questions={questions}
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
                onSelectQuestion={onSelectQuestion}
                onSelectModule={onSelectModule}
              />
            )}

            {/* Subtle Supabase Real-Time Connection Status Indicator Icon (Desktop) */}
            <button
              type="button"
              onClick={onOpenCloudBackend}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border shrink-0 ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                  : realtimeStatus === 'syncing'
                  ? 'bg-amber-50/90 hover:bg-amber-100 text-amber-800 border-amber-200/90'
                  : 'bg-rose-50/90 hover:bg-rose-100 text-rose-800 border-rose-200/90'
              }`}
              title={
                realtimeStatus === 'connected'
                  ? `Supabase / Postgres Real-Time Status: Connected${
                      lastSyncedAt
                        ? ` • Last synced at ${new Date(lastSyncedAt).toLocaleTimeString()}`
                        : ''
                    } (Click to open Postgres Backend Console)`
                  : realtimeStatus === 'syncing'
                  ? 'Supabase / Postgres Real-Time Status: Syncing progress to relational backend...'
                  : 'Supabase / Postgres Real-Time Status: Offline (Progress buffered locally)'
              }
              aria-label={`Supabase real-time sync status: ${realtimeStatus}`}
            >
              {realtimeStatus === 'connected' && (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden xl:inline">PG Connected</span>
                </>
              )}
              {realtimeStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                  <span className="hidden xl:inline">PG Syncing</span>
                </>
              )}
              {realtimeStatus === 'offline' && (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="hidden xl:inline">PG Offline</span>
                </>
              )}
            </button>

            {onSelectPath && (
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath('all');
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
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
                    setInspectedPathInMenu(1);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedPathId === 1
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 1: Cloud Concepts (25–30%)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>P1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(2);
                    setInspectedPathInMenu(2);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedPathId === 2
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 2: Azure Architecture & Services (35–40%)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>P2</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(3);
                    setInspectedPathInMenu(3);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedPathId === 3
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 3: Management & Governance (30–35%)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>P3</span>
                </button>
              </div>
            )}

            {/* Desktop Tools & Goal Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsMobileDetailsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border shrink-0 ${
                isMobileDetailsOpen
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-sky-50/80 hover:bg-sky-100 text-[#0078D4] border-sky-200/90'
              }`}
              aria-expanded={isMobileDetailsOpen}
              title="Open compact Tools & Goal menu"
            >
              {isMobileDetailsOpen ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0078D4]" />
              )}
              <span>Tools &amp; Goal</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMobileDetailsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <DailyStudyStreak
              stats={stats}
              onUpdateStats={onUpdateStats}
              fireStreakTrigger={fireStreakTrigger}
            />

            <FocusSessionWidget onOpenStudyBreak={onOpenStudyBreak} />

            <DailyStudyGoalRing
              todayAnsweredCount={todayAnsweredCount}
              dailyGoal={dailyGoal}
              onClick={() => setShowGoalAlertsModal(true)}
              compact={false}
            />

            {onOpenReviewSession && (
              <button
                type="button"
                onClick={onOpenReviewSession}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0"
                title="Review Session: quickly review and re-test your last 10 incorrectly answered questions"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600 group-hover:-rotate-45 transition-transform" />
                <span className="hidden xl:inline">Review</span>
                {missedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                    {missedCount}
                  </span>
                )}
              </button>
            )}

            {onOpenUserGuide && (
              <button
                type="button"
                onClick={onOpenUserGuide}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0"
                title="AZ-900 Studio User Guide, README & Build History: Comprehensive features breakdown and printable PDF"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0078D4] group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Guide &amp; README</span>
              </button>
            )}

            <AccessibilityFontSizeControl variant="header-button" />
            <ThemeToggle />
            <PWAInstallButton />

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

            <button
              type="button"
              onClick={toggleMenuBar}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border shrink-0 ${
                isMenuBarHidden
                  ? 'bg-blue-50 text-[#0078D4] border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
              title={isMenuBarHidden ? 'Show sliding navigation tabs' : 'Hide sliding navigation tabs'}
              aria-expanded={!isMenuBarHidden}
            >
              <Layers className="w-3.5 h-3.5 text-[#0078D4]" />
              <span className="hidden 2xl:inline">{isMenuBarHidden ? 'Show Tabs' : 'Hide Tabs'}</span>
              {isMenuBarHidden ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#0078D4]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* =====================================================================
            ULTRA-COMPACT TOOLS & GOAL DROPDOWN (Strictly 3 Concise Lines Max)
           ===================================================================== */}
        {isMobileDetailsOpen && (() => {
          const activeIntel = PATH_COMPACT_INTEL[inspectedPathInMenu];
          const activeTele = pathTelemetry[inspectedPathInMenu];

          return (
            <div className="mb-2 px-3 py-2 rounded-xl bg-white/98 border border-sky-200/90 shadow-lg space-y-1.5 text-xs animate-in slide-in-from-top-1 duration-150 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain">
              {/* LINE 1: Path Selector + Accuracy & Missed Retry */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
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

                <div className="flex items-center gap-1.5 text-[11px]">
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
              <div className="flex flex-wrap items-center justify-between gap-2 py-1 border-y border-slate-100 text-[11px]">
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

              {/* LINE 3: Daily Goal & Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700">
                    Daily Goal: <span className="text-[#0078D4]">{todayAnsweredCount}/{dailyGoal} Qs</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoalAlertsModal(true);
                      setIsMobileDetailsOpen(false);
                    }}
                    className="px-2 py-0.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Target className="w-3 h-3 text-orange-600" />
                    <span>Set Goal</span>
                  </button>
                  {onOpenReviewSession && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenReviewSession();
                        setIsMobileDetailsOpen(false);
                      }}
                      className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold flex items-center gap-1 cursor-pointer"
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
                      className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-[#0078D4]" />
                      <span>Guide &amp; PDF</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <AccessibilityFontSizeControl variant="inline-bar" />
                  <div className="flex items-center gap-1.5 lg:hidden">
                    <ThemeToggle />
                    <PWAInstallButton />
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

        {/* Sliding Menu Bar: 50% Lighter Azure Opacity Shade with Azure Patterns & Warrior Motifs */}
        <div
          className={`relative w-full overflow-hidden transition-all duration-300 ease-in-out border-t border-sky-300/70 dark:border-sky-700/50 rounded-b-2xl shadow-xs backdrop-blur-md ${
            isMenuBarHidden
              ? 'max-h-0 opacity-0 pointer-events-none py-0 border-transparent'
              : 'max-h-24 opacity-100 py-2 bg-gradient-to-r from-[#0078D4]/45 via-[#0ea5e9]/50 to-[#0078D4]/45 dark:from-[#0284c7]/45 dark:via-[#0369a1]/50 dark:to-[#0284c7]/45'
          }`}
        >
          <WavyAzureFabricMotif className="opacity-50" />
          <div className="relative z-10 flex items-center justify-start lg:justify-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none px-2.5 sm:px-3 py-0.5">
            {/* Left Kenyan Moran Warrior Shield Motif */}
            <div className="hidden xl:flex items-center gap-1.5 shrink-0 pl-1 pr-1.5 opacity-95 hover:opacity-100 transition-opacity" title="Kenyan Warrior Heritage Motif">
              <MoranShieldMotif size={22} animate={true} />
            </div>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'quiz'
                  ? 'bg-[#005A9E] text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'quiz' ? <WarriorSpearBadge size={14} /> : <BookOpen className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>Practice</span>
            </button>

            <button
              onClick={() => setActiveTab('study-decks')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'study-decks'
                  ? 'bg-gradient-to-r from-[#0078D4] to-[#005A9E] text-white shadow-md ring-1 ring-amber-300 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
              title="Interactive Study Mode: Select Learning Path & Module to study Unit-by-Unit concepts, Azure services, and examples"
            >
              {activeTab === 'study-decks' ? <WarriorSpearBadge size={14} /> : <Layers className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>Study Mode</span>
            </button>

            {/* Adaptive Quiz Mode with glowing Zap */}
            <button
              onClick={() => setActiveTab('adaptive')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'adaptive'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md ring-1 ring-amber-300 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'adaptive' ? <WarriorSpearBadge size={14} /> : <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 fill-amber-400" />}
              <span>Adaptive Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'flashcards' ? <WarriorSpearBadge size={14} /> : <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />}
              <span>Flashcards</span>
            </button>

            {/* Review History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'bg-[#005A9E] text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'history' ? <WarriorSpearBadge size={14} /> : <History className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('mock')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'mock'
                  ? 'bg-gradient-to-r from-blue-800 to-[#005A9E] text-white shadow-md ring-1 ring-white/80 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'mock' ? <WarriorSpearBadge size={14} /> : <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />}
              <span>Mock Exam</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-md ring-1 ring-sky-300 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'analytics' ? <WarriorSpearBadge size={14} /> : <TrendingUp className="w-3.5 h-3.5 text-[#005A9E] dark:text-sky-300" />}
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'assistant'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md ring-1 ring-yellow-200 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'assistant' ? <WarriorSpearBadge size={14} /> : <Bot className="w-3.5 h-3.5 text-orange-700 dark:text-amber-300" />}
              <span>Tutor</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-200 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
              title="Global Peer Leaderboard: Top performers from the Global Harambee Azure Cohort ranked by total questions solved"
            >
              {activeTab === 'leaderboard' ? <WarriorSpearBadge size={14} /> : <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
              <span>Global Peer Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md ring-1 ring-purple-300 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
            >
              {activeTab === 'profile' ? <WarriorSpearBadge size={14} /> : <Award className="w-3.5 h-3.5 text-purple-700 dark:text-amber-300" />}
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'glossary'
                  ? 'bg-gradient-to-r from-emerald-700 to-[#005A9E] text-white shadow-md ring-1 ring-emerald-300 font-black scale-102'
                  : 'bg-white/45 dark:bg-slate-900/45 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
              }`}
              title="Azure Glossary & Dictionary: All AZ-900 terms, interrelated architecture pinpoints, and verified Microsoft Learn references"
            >
              {activeTab === 'glossary' ? <WarriorSpearBadge size={14} /> : <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />}
              <span>Glossary</span>
            </button>

            {/* Right Kenyan Moran Warrior Shield Motif */}
            <div className="hidden xl:flex items-center gap-1.5 shrink-0 pr-1 pl-1.5 opacity-95 hover:opacity-100 transition-opacity" title="Kenyan Warrior Heritage Motif">
              <MoranShieldMotif size={22} animate={true} />
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

