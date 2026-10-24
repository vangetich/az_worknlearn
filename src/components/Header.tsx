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
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  KitengeRibbon,
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
  onRetryIncorrectPath?: (pathId: 1 | 2 | 3) => void;
  retryIncorrectPathId?: 1 | 2 | 3 | null;
}

const PATH_FREQUENTLY_MISSED_INTEL: Record<
  1 | 2 | 3,
  {
    code: string;
    shortTitle: string;
    examWeight: string;
    hierarchyRule: string;
    criticalTraps: {
      concept: string;
      distinction: string;
      moduleId: number;
    }[];
  }
> = {
  1: {
    code: 'P1 • Cloud Concepts',
    shortTitle: 'Describe Cloud Concepts',
    examWeight: '25–30% of Exam',
    hierarchyRule: 'Customer ALWAYS owns Data, Endpoints, Account & Access across IaaS, PaaS & SaaS.',
    criticalTraps: [
      {
        concept: 'Shared Responsibility (SaaS vs PaaS vs IaaS)',
        distinction:
          'Customer is 100% responsible for Data, Devices/Endpoints & Identities in ALL models. IaaS requires customer OS/patch management; PaaS & SaaS delegate OS to Microsoft.',
        moduleId: 1,
      },
      {
        concept: 'Elasticity vs. Scalability (Horizontal / Vertical)',
        distinction:
          'Elasticity automatically adds AND removes resources dynamically as load drops. Vertical scaling = bigger VM SKU (RAM/CPU); Horizontal scaling = adding more VM instances.',
        moduleId: 2,
      },
      {
        concept: 'CapEx vs. OpEx & Consumption Billing',
        distinction:
          'CapEx = upfront physical infrastructure spend (tax depreciation). OpEx = pay-as-you-go with zero upfront cost. Serverless (Functions) bills only when code actively executes.',
        moduleId: 3,
      },
    ],
  },
  2: {
    code: 'P2 • Architecture & Services',
    shortTitle: 'Describe Azure Architecture & Services',
    examWeight: '35–40% of Exam',
    hierarchyRule: 'Hierarchy: Management Groups → Subscriptions → Resource Groups → Resources.',
    criticalTraps: [
      {
        concept: 'Availability Zones vs. Region Pairs',
        distinction:
          'Availability Zones = separate datacenters in the SAME region (isolated power/cooling). Region Pairs = >=300 miles apart for cross-region disaster recovery.',
        moduleId: 4,
      },
      {
        concept: 'ExpressRoute vs. VPN Gateway & VNet Peering',
        distinction:
          'ExpressRoute = dedicated private fiber bypassing public Internet. VPN Gateway = encrypted IPsec tunnel over public Internet. VNet Peering uses private Azure backbone.',
        moduleId: 5,
      },
      {
        concept: 'Storage Redundancy (LRS/ZRS/GRS) & Archive Tier',
        distinction:
          'LRS = 1 datacenter; ZRS = 3 zones in 1 region; GRS = paired region replication. Archive Blob Tier is offline and MUST be rehydrated to Hot/Cool before reading.',
        moduleId: 6,
      },
      {
        concept: 'Entra ID AuthN vs. AuthZ & Conditional Access',
        distinction:
          'Authentication (MFA/SSO) verifies "Who are you?". Authorization (Azure RBAC) controls "What can you access?". Conditional Access evaluates signals (IP/device) to enforce MFA.',
        moduleId: 7,
      },
    ],
  },
  3: {
    code: 'P3 • Management & Governance',
    shortTitle: 'Describe Azure Management & Governance',
    examWeight: '30–35% of Exam',
    hierarchyRule: 'Resource Locks (ReadOnly / CanNotDelete) override even Owner RBAC permissions.',
    criticalTraps: [
      {
        concept: 'Pricing Calculator vs. TCO Calculator',
        distinction:
          'Pricing Calculator estimates monthly Azure resource bills. TCO Calculator compares on-premises datacenter operating costs against migrating to Azure.',
        moduleId: 8,
      },
      {
        concept: 'Azure Policy vs. RBAC vs. Resource Locks',
        distinction:
          'Azure Policy enforces resource rules (allowed regions, VM SKUs, required tags). RBAC grants user permissions. Resource Locks prevent accidental modification/deletion by anyone.',
        moduleId: 9,
      },
      {
        concept: 'Azure Arc vs. ARM Templates / Bicep',
        distinction:
          'Azure Arc extends Azure governance & policy to on-premises and multi-cloud servers. ARM Templates (JSON) & Bicep provide declarative Infrastructure as Code (IaC).',
        moduleId: 10,
      },
      {
        concept: 'Advisor vs. Service Health vs. Azure Monitor',
        distinction:
          'Azure Advisor = personalized Cost/Security/Reliability recommendations. Service Health = personalized Microsoft outage alerts. Monitor = Log Analytics (KQL) & metrics.',
        moduleId: 11,
      },
    ],
  },
};

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
  onRetryIncorrectPath,
  retryIncorrectPathId = null,
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
          // If never currently wrong on latest, check if historically missed and unresolved in mistakesHistory
        } else if (
          (stats.mistakesHistory || []).some(
            (m) => m.questionId === q.id && !(stats.reviewedMistakeIds || []).includes(q.id)
          )
        ) {
          missedCountInPath += 1;
        }
      });

      // Fallback: if 0 unresolved latest wrong, count any question in path with at least one wrong attempt
      if (missedCountInPath === 0) {
        pathQuestions.forEach((q) => {
          const qAttempts = stats.attempts?.[q.id] || [];
          if (qAttempts.some((a) => !a.isCorrect)) {
            missedCountInPath += 1;
          }
        });
      }

      // Find weakest module in this path
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
                <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 truncate">
                  Azure Cloud Explorer
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
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white shadow-2xs">
                  AZ-900
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#0078D4]/15 via-sky-500/20 to-amber-500/20 border border-[#0078D4]/40 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-[#0078D4] shrink-0" />
                <span className="text-[11px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-[#005A9E] via-[#0078D4] to-amber-700 bg-clip-text text-transparent studio-subtitle-standout">
                  Fundamentals Practice Studio
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Global Search, Compact Path Selector, Tools & Goal Dropdown, Goal Ring & Actions */}
          <div className="flex items-center justify-end gap-1.5 xl:gap-2 flex-wrap">
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

            {/* Path 1, 2, 3 Compact Pills */}
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

            {/* Desktop Tools & Goal Dropdown Button (Learning Path Intelligence & Exam Traps) */}
            <button
              type="button"
              onClick={() => setIsMobileDetailsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border shrink-0 ${
                isMobileDetailsOpen
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-sky-50/80 hover:bg-sky-100 text-[#0078D4] border-sky-200/90'
              }`}
              aria-expanded={isMobileDetailsOpen}
              title="Open Tools & Goal menu with specific AZ-900 Learning Path intelligence and Frequently Missed Exam Traps"
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

            {/* Daily Learning Goal Progress Ring with Fire-Streak Animation */}
            <DailyStudyStreak
              stats={stats}
              onUpdateStats={onUpdateStats}
              fireStreakTrigger={fireStreakTrigger}
            />

            {/* Dedicated Manage Goal Button */}
            <button
              type="button"
              onClick={() => setShowGoalAlertsModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0"
              title="Set daily quiz question goal and custom alert preferences"
            >
              <Target className="w-3.5 h-3.5 text-orange-600 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">Goal</span>
            </button>

            {/* Review Session Button */}
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

            {/* Theme Toggle (Light / Midnight Azure) */}
            <ThemeToggle />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Minimalist & Stylish Toggle for Sliding Menu Bar */}
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
            TOOLS & GOAL DROPDOWN MENU (Responsive across Mobile, Tablet & Desktop)
            Contains Global Search, Specific Learning Path Intelligence, Frequently Missed
            AZ-900 Exam Distinctions, Module Triggers & Daily Goal Controls
           ===================================================================== */}
        {isMobileDetailsOpen && (
          <div className="mb-2.5 p-3.5 sm:p-4 rounded-2xl bg-white/98 border border-sky-200/90 shadow-xl space-y-3.5 animate-in slide-in-from-top-2 duration-150">
            {/* Row 1: Global Search Bar (shown on <lg or quick filter access) */}
            {onSearchQueryChange && onSelectQuestion && (
              <div className="w-full lg:hidden">
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

            {/* Row 2: Rich Learning Path Intelligence & Frequently Missed Information Space */}
            <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/50 via-white to-amber-50/30 p-3 sm:p-3.5 space-y-3">
              {/* Top Header Bar: Learning Path Filter Selector + Active Path Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#0078D4] text-white shadow-2xs">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                        AZ-900 Learning Path &amp; Frequently Missed Exam Intelligence
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        High-Yield Exam Traps
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Select a Learning Path below to filter practice questions and inspect critical exam distinctions &amp; missed concepts
                    </p>
                  </div>
                </div>

                {/* Learning Path Selector Pills */}
                {onSelectPath && (
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/90 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPath('all');
                        if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedPathId === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Paths
                    </button>
                    {([1, 2, 3] as const).map((pId) => {
                      const dotColor =
                        pId === 1 ? 'bg-amber-500' : pId === 2 ? 'bg-[#0078D4]' : 'bg-orange-500';
                      const isSelected = selectedPathId === pId;
                      const isInspected = inspectedPathInMenu === pId;
                      return (
                        <button
                          key={pId}
                          type="button"
                          onClick={() => {
                            setInspectedPathInMenu(pId);
                            onSelectPath(pId);
                            if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                          }}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0078D4] text-white shadow-2xs font-black'
                              : isInspected
                              ? 'bg-sky-100 text-[#0078D4] font-extrabold'
                              : 'text-slate-600 hover:text-[#0078D4]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <span>P{pId}</span>
                          <span className="text-[10px] opacity-80 hidden sm:inline">
                            ({LEARNING_PATHS.find((lp) => lp.id === pId)?.examWeight})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3-Path Summary Cards Strip (Click any card to inspect its frequently missed details) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {LEARNING_PATHS.map((lp) => {
                  const pId = lp.id;
                  const tele = pathTelemetry[pId];
                  const isFocused = inspectedPathInMenu === pId;
                  const isFilterActive = selectedPathId === pId;
                  return (
                    <div
                      key={pId}
                      onClick={() => setInspectedPathInMenu(pId)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isFocused
                          ? 'bg-white border-[#0078D4] ring-2 ring-[#0078D4]/20 shadow-xs'
                          : 'bg-white/80 hover:bg-white border-slate-200/90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                            Path {pId} • {lp.examWeight}
                          </span>
                          <div className="flex items-center gap-1">
                            {tele.missedQuestionCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                {tele.missedQuestionCount} missed
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                tele.accuracy >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tele.accuracy >= 50
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {tele.attemptedQuestions > 0 ? `${tele.accuracy}% Acc` : 'Not started'}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                          {lp.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {lp.summary}
                        </p>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[10px]">
                        <span className="font-bold text-slate-600">
                          Modules: {tele.completedModules}/{tele.totalModules} done • {tele.totalQuestionsInBank} Qs
                        </span>

                        <div className="flex items-center gap-1">
                          {onRetryIncorrectPath && tele.missedQuestionCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRetryIncorrectPath(pId);
                                setIsMobileDetailsOpen(false);
                              }}
                              className={`px-2 py-0.5 rounded font-black transition-colors cursor-pointer ${
                                retryIncorrectPathId === pId
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                              title={`Filter quiz to retry ${tele.missedQuestionCount} missed question(s) in Path ${pId}`}
                            >
                              Retry {tele.missedQuestionCount} Missed
                            </button>
                          )}
                          {onSelectPath && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPath(pId);
                                setActiveTab('quiz');
                                setIsMobileDetailsOpen(false);
                              }}
                              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                                isFilterActive
                                  ? 'bg-[#0078D4] text-white'
                                  : 'bg-sky-50 hover:bg-sky-100 text-[#0078D4]'
                              }`}
                            >
                              {isFilterActive ? 'Active' : 'Focus Path'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Breakdown for Inspected Learning Path: Frequently Missed Exam Traps & Modules */}
              {(() => {
                const activeIntel = PATH_FREQUENTLY_MISSED_INTEL[inspectedPathInMenu];
                const activePathObj = LEARNING_PATHS.find((lp) => lp.id === inspectedPathInMenu)!;
                const activeTele = pathTelemetry[inspectedPathInMenu];

                return (
                  <div className="rounded-xl bg-white border border-slate-200/90 p-3 space-y-2.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0078D4] text-white text-[10px] font-black uppercase">
                          {activeIntel.code} ({activeIntel.examWeight})
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          Critical Exam Distinctions &amp; Frequently Missed Concepts
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>Priority Focus: {activeTele.weakestModuleTitle}</span>
                        </span>
                        {onSelectModule && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectModule(activeTele.weakestModuleId, inspectedPathInMenu);
                              setIsMobileDetailsOpen(false);
                            }}
                            className="px-2 py-0.5 rounded-md bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Drill Module {activeTele.weakestModuleId}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Core Golden Rule Banner for this Path */}
                    <div className="px-3 py-1.5 rounded-lg bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-2 text-[11px] text-amber-950">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Golden Exam Rule:</span>
                        <span className="font-semibold">{activeIntel.hierarchyRule}</span>
                      </div>
                    </div>

                    {/* Frequently Missed Exam Traps Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {activeIntel.criticalTraps.map((trap, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50/90 hover:bg-sky-50/50 border border-slate-200/80 flex flex-col justify-between gap-1.5 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[11px] font-black text-rose-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{trap.concept}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {trap.distinction}
                            </p>
                          </div>

                          {onSelectModule && (
                            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500">
                                Module {trap.moduleId}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectModule(trap.moduleId, inspectedPathInMenu);
                                  setIsMobileDetailsOpen(false);
                                }}
                                className="text-[10px] font-extrabold text-[#0078D4] hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Practice Questions</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Direct Module Pills for this Path */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">
                        Path {inspectedPathInMenu} Modules:
                      </span>
                      {activePathObj.modules.map((mod) => {
                        const isDone = (stats.completedModules || []).includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => {
                              if (onSelectModule) {
                                onSelectModule(mod.id, inspectedPathInMenu);
                                setIsMobileDetailsOpen(false);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-sky-50 hover:text-[#0078D4] hover:border-sky-200'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            <span>
                              M{mod.id}: {mod.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Row 3: Daily Learning Goal Progress Ring + Manage Goal + Review Session + Theme + PWA */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
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
                    <span>Personalized Review Session</span>
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
            >
              {activeTab === 'leaderboard' ? <WarriorSpearBadge size={14} /> : <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
              <span>Ranks</span>
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

