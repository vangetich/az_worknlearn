import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Layers,
  Crown,
  BookOpen,
  Edit3,
  Check,
  Zap,
  Compass,
  Cloud,
  Search,
  RotateCcw,
  AlertTriangle,
  Minimize2,
  Maximize2,
  LayoutGrid,
  X,
  Filter,
  FileText,
  Printer,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { BADGE_DEFINITIONS, BadgeTier, BadgeCategory } from './BadgeSystem';
import { LEARNING_PATHS } from '../data/curriculum';
import { MODULE_FREQUENTLY_MISSED_TERMS } from '../data/frequentlyMissedTerms';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { DailyAccuracyTrajectoryChart } from './DailyAccuracyTrajectoryChart';
import { DailyLearningGoal } from './DailyLearningGoal';
import { LearningPathProgressMap } from './LearningPathProgressMap';
import { triggerAchievementOverlay } from './AchievementOverlay';
import { AppTab } from './Header';
import { StreakActivityGraph } from './StreakActivityGraph';
import { DailyStudyReminder } from './DailyStudyReminder';
import { getUnresolvedMistakesMap } from '../utils/storage';
import { BUILTIN_QUESTIONS } from '../data/questionBank';

export interface ProfileViewProps {
  stats: UserStats;
  onUpdateStats?: (newStats: UserStats) => void;
  onNavigateToPractice: () => void;
  onNavigateToMock: () => void;
  onOpenManageGoal: () => void;
  onSelectPath?: (pathId: 1 | 2 | 3 | 'all') => void;
  onSelectModule?: (moduleId: number | 'all', pathId?: 1 | 2 | 3 | 'all') => void;
  onToggleModuleComplete?: (moduleId: number) => void;
  onSearchService?: (serviceTerm: string) => void;
  onOpenPersonalizedReview?: () => void;
  onOpenWeakAreasReview?: () => void;
  setActiveTab?: (tab: AppTab) => void;
  unresolvedMistakesCount?: number;
  questionCountByModule?: Record<number, number>;
  onOpenUserGuide?: () => void;
}

type ProfileExplorerTab = 'paths' | 'modules' | 'services' | 'gaps' | 'actions';

interface ExplorerServiceItem {
  term: string;
  category: string;
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  definition: string;
  examTrap: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  onUpdateStats,
  onNavigateToPractice,
  onNavigateToMock,
  onOpenManageGoal,
  onSelectPath,
  onSelectModule,
  onToggleModuleComplete,
  onSearchService,
  onOpenPersonalizedReview,
  onOpenWeakAreasReview,
  setActiveTab,
  unresolvedMistakesCount = 0,
  questionCountByModule = {},
  onOpenUserGuide,
}) => {
  const [candidateName, setCandidateName] = useState<string>(() => {
    return localStorage.getItem('az900_candidate_name') || 'Azure Cloud Explorer';
  });
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(candidateName);

  // Top-level ProfileView Tab ('overview' | 'gaps')
  const [profileMainTab, setProfileMainTab] = useState<'overview' | 'gaps'>('overview');
  const [expandedGapModuleId, setExpandedGapModuleId] = useState<number | null>(null);

  // Compact Azure Cloud Explorer Menus Window state in Profile tab
  const [isExplorerExpanded, setIsExplorerExpanded] = useState<boolean>(true);
  const [explorerTab, setExplorerTab] = useState<ProfileExplorerTab>('paths');
  const [selectedPathFilter, setSelectedPathFilter] = useState<1 | 2 | 3 | 'all'>('all');
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('All');
  const [activeServiceDetail, setActiveServiceDetail] = useState<ExplorerServiceItem | null>(null);
  const [gapsFilter, setGapsFilter] = useState<'all' | 'unresolved'>('all');

  // Badges section state
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [filterUnlocked, setFilterUnlocked] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [compactBadges, setCompactBadges] = useState<boolean>(false);

  const accuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  // Calculate user level & rank
  const candidateLevel = useMemo(() => {
    const q = stats.totalAnswered;
    if (q >= 100 && accuracy >= 80)
      return {
        title: 'Master Cloud Architect',
        level: 5,
        color: 'text-amber-200 bg-amber-500/25 border-amber-300/40',
      };
    if (q >= 50 && accuracy >= 70)
      return {
        title: 'Senior Azure Scholar',
        level: 4,
        color: 'text-purple-200 bg-purple-500/25 border-purple-300/40',
      };
    if (q >= 25)
      return {
        title: 'Cloud Practitioner',
        level: 3,
        color: 'text-sky-200 bg-sky-500/25 border-sky-300/40',
      };
    if (q >= 10)
      return {
        title: 'Cloud Apprentice',
        level: 2,
        color: 'text-emerald-200 bg-emerald-500/25 border-emerald-300/40',
      };
    return {
      title: 'Azure Novice',
      level: 1,
      color: 'text-slate-200 bg-white/15 border-white/25',
    };
  }, [stats.totalAnswered, accuracy]);

  // Curriculum modules completion tracking
  const completedModules = stats.completedModules || [];
  const allModules = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({ ...m, pathId: p.id }))
      ),
    []
  );
  const completedCount = completedModules.filter((id) =>
    allModules.some((m) => m.id === id)
  ).length;
  const completionPct =
    allModules.length > 0 ? Math.round((completedCount / allModules.length) * 100) : 0;

  const visibleModules = useMemo(() => {
    if (selectedPathFilter === 'all') return allModules;
    return allModules.filter((m) => m.pathId === selectedPathFilter);
  }, [selectedPathFilter, allModules]);

  // Indexed Azure services for the Explorer Window
  const allServices = useMemo<ExplorerServiceItem[]>(() => {
    const list: ExplorerServiceItem[] = [];
    LEARNING_PATHS.forEach((path) => {
      path.modules.forEach((mod) => {
        const missed = MODULE_FREQUENTLY_MISSED_TERMS[mod.id] || [];
        missed.forEach((m) => {
          list.push({
            term: m.term,
            category: m.category,
            moduleId: mod.id,
            moduleTitle: mod.title,
            pathId: path.id,
            definition: m.definition,
            examTrap: m.examTrap,
          });
        });
      });
    });
    return list;
  }, []);

  const serviceCategories = useMemo(() => {
    const cats = new Set<string>(['All']);
    allServices.forEach((s) => cats.add(s.category));
    return Array.from(cats);
  }, [allServices]);

  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      const matchesPath =
        selectedPathFilter === 'all' || s.pathId === selectedPathFilter;
      const matchesCat =
        selectedServiceCategory === 'All' || s.category === selectedServiceCategory;
      const q = serviceSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.term.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q) ||
        s.moduleTitle.toLowerCase().includes(q);
      return matchesPath && matchesCat && matchesSearch;
    });
  }, [allServices, selectedPathFilter, selectedServiceCategory, serviceSearch]);

  // Evaluated badges
  const evaluatedBadges = useMemo(() => {
    return BADGE_DEFINITIONS.map((def) => {
      const unlocked = def.isUnlocked(stats, accuracy);
      const curr = def.getCurrentValue(stats, accuracy);
      const progress = Math.min(100, Math.round((curr / def.targetValue) * 100));
      return {
        ...def,
        unlocked,
        currentValue: curr,
        progress,
      };
    });
  }, [stats, accuracy]);

  const unlockedCount = evaluatedBadges.filter((b) => b.unlocked).length;
  const totalBadges = evaluatedBadges.length;

  const filteredBadges = useMemo(() => {
    return evaluatedBadges.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (filterUnlocked === 'unlocked' && !b.unlocked) return false;
      if (filterUnlocked === 'locked' && b.unlocked) return false;
      return true;
    });
  }, [evaluatedBadges, selectedCategory, filterUnlocked]);

  const handleSaveName = () => {
    const trimmed = tempName.trim() || 'Azure Cloud Explorer';
    setCandidateName(trimmed);
    localStorage.setItem('az900_candidate_name', trimmed);
    setIsEditingName(false);
  };

  const getModuleMasteryPct = (modId: number) => {
    const m = stats.moduleMastery?.[modId];
    if (!m || m.total === 0) return null;
    return Math.round((m.correct / m.total) * 100);
  };

  // Knowledge Gaps Table Data: rank Azure service modules by highest unresolved mistakes
  const moduleKnowledgeGaps = useMemo(() => {
    const unresolvedMap = getUnresolvedMistakesMap(stats);
    const questionToModule = new Map<string, number>();

    BUILTIN_QUESTIONS.forEach((q) => {
      questionToModule.set(q.id, q.moduleId);
    });

    if (stats.mistakesHistory) {
      stats.mistakesHistory.forEach((entry) => {
        if (entry.questionId && entry.moduleId) {
          questionToModule.set(entry.questionId, entry.moduleId);
        }
      });
    }

    if (stats.attempts) {
      Object.entries(stats.attempts).forEach(([qId, list]) => {
        if (list && list.length > 0 && list[0].moduleId) {
          questionToModule.set(qId, list[0].moduleId);
        }
      });
    }

    // Group unresolved mistakes by moduleId
    const unresolvedByModule: Record<
      number,
      Array<{ questionId: string; lastWrongAnswer: string; timestamp: number; trapType?: string }>
    > = {};

    unresolvedMap.forEach((val, qId) => {
      let modId = questionToModule.get(qId);
      if (!modId) {
        const match = qId.match(/mod(\d+)/i);
        if (match) modId = parseInt(match[1], 10);
      }
      if (modId) {
        if (!unresolvedByModule[modId]) unresolvedByModule[modId] = [];
        unresolvedByModule[modId].push({ questionId: qId, ...val });
      }
    });

    return allModules
      .map((mod) => {
        const unresolvedList = unresolvedByModule[mod.id] || [];
        const unresolvedCount = unresolvedList.length;
        const mStats = stats.moduleMastery?.[mod.id];
        const totalAttempts = mStats?.total || 0;
        const correctAttempts = mStats?.correct || 0;
        const wrongAttempts = Math.max(0, totalAttempts - correctAttempts);
        const masteryPct =
          totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;

        const trapCounts: Record<string, number> = {};
        unresolvedList.forEach((u) => {
          const t = u.trapType || 'Conceptual Confusion';
          trapCounts[t] = (trapCounts[t] || 0) + 1;
        });

        const sortedTraps = Object.entries(trapCounts).sort((a, b) => b[1] - a[1]);
        const primaryTrap =
          sortedTraps.length > 0
            ? sortedTraps[0][0]
            : wrongAttempts > 0
            ? 'Service Scope Distractor'
            : 'No Active Traps';

        const keyServices = (MODULE_FREQUENTLY_MISSED_TERMS[mod.id] || []).map((t) => t.term);
        const lastMistakeTimestamp =
          unresolvedList.length > 0
            ? Math.max(...unresolvedList.map((u) => u.timestamp))
            : null;

        const severity: 'critical' | 'warning' | 'healthy' =
          unresolvedCount >= 2 || (masteryPct !== null && masteryPct < 60)
            ? 'critical'
            : unresolvedCount === 1 || (masteryPct !== null && masteryPct < 75)
            ? 'warning'
            : 'healthy';

        const unresolvedDetails = unresolvedList.map((u) => {
          const qObj = BUILTIN_QUESTIONS.find((q) => q.id === u.questionId);
          return {
            questionId: u.questionId,
            questionText: qObj?.question || `Scenario Question (${u.questionId})`,
            lastWrongAnswer: u.lastWrongAnswer,
            correctAnswer: qObj?.correctAnswer || '—',
            trapType: u.trapType || 'Conceptual Confusion',
            timestamp: u.timestamp,
          };
        });

        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          pathId: mod.pathId,
          unresolvedCount,
          unresolvedDetails,
          wrongAttempts,
          totalAttempts,
          masteryPct,
          primaryTrap,
          keyServices,
          lastMistakeTimestamp,
          severity,
        };
      })
      .sort((a, b) => {
        if (b.unresolvedCount !== a.unresolvedCount) {
          return b.unresolvedCount - a.unresolvedCount;
        }
        if (b.wrongAttempts !== a.wrongAttempts) {
          return b.wrongAttempts - a.wrongAttempts;
        }
        const aPct = a.masteryPct ?? 101;
        const bPct = b.masteryPct ?? 101;
        if (aPct !== bPct) {
          return aPct - bPct;
        }
        return a.moduleId - b.moduleId;
      });
  }, [stats, allModules]);

  const totalUnresolvedAcrossModules = useMemo(
    () => moduleKnowledgeGaps.reduce((sum, item) => sum + item.unresolvedCount, 0),
    [moduleKnowledgeGaps]
  );

  const visibleKnowledgeGaps = useMemo(() => {
    const pathFiltered =
      selectedPathFilter === 'all'
        ? moduleKnowledgeGaps
        : moduleKnowledgeGaps.filter((g) => g.pathId === selectedPathFilter);
    if (gapsFilter === 'unresolved') {
      return pathFiltered.filter((g) => g.unresolvedCount > 0 || g.wrongAttempts > 0);
    }
    return pathFiltered;
  }, [moduleKnowledgeGaps, selectedPathFilter, gapsFilter]);

  const tierColors: Record<
    BadgeTier,
    { bg: string; text: string; border: string; ring: string }
  > = {
    bronze: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      ring: 'ring-amber-400/20',
    },
    silver: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      ring: 'ring-slate-400/20',
    },
    gold: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      border: 'border-yellow-400',
      ring: 'ring-yellow-400/30',
    },
    diamond: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-900',
      border: 'border-cyan-300',
      ring: 'ring-cyan-400/30',
    },
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-6xl mx-auto">
      {/* =====================================================================
          TOP-LEVEL PROFILE VIEW NAVIGATION TABS ('Overview' vs 'Knowledge Gaps')
         ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div
          className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80"
          role="tablist"
          aria-label="Profile View Sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={profileMainTab === 'overview'}
            onClick={() => setProfileMainTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              profileMainTab === 'overview'
                ? 'bg-[#0078D4] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Profile &amp; Progress</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={profileMainTab === 'gaps'}
            onClick={() => setProfileMainTab('gaps')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              profileMainTab === 'gaps'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 shrink-0 ${
                profileMainTab === 'gaps' ? 'text-amber-200' : 'text-rose-600'
              }`}
            />
            <span>Knowledge Gaps</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                profileMainTab === 'gaps'
                  ? 'bg-white text-rose-700'
                  : totalUnresolvedAcrossModules > 0
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {Math.max(totalUnresolvedAcrossModules, unresolvedMistakesCount)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
          <span className="hidden sm:inline font-medium">
            {totalUnresolvedAcrossModules > 0
              ? `Highest unresolved mistakes in Module ${moduleKnowledgeGaps[0]?.moduleId}: ${moduleKnowledgeGaps[0]?.moduleTitle}`
              : 'All 12 Azure service modules monitored for unresolved mistakes'}
          </span>
          {profileMainTab === 'overview' && (
            <button
              type="button"
              onClick={() => setProfileMainTab('gaps')}
              className="text-rose-600 hover:text-rose-700 font-extrabold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Knowledge Gaps Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          DEDICATED TOP-LEVEL 'KNOWLEDGE GAPS' TAB VIEW
         ===================================================================== */}
      {profileMainTab === 'gaps' && (
        <section
          aria-label="Knowledge Gaps Diagnostic Table"
          className="bg-white rounded-2xl border border-rose-200 card-elevation overflow-hidden shadow-xs"
        >
          <KitengeRibbon height={4} />

          {/* Header Banner */}
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600/30 border border-rose-400/40 text-amber-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/30 text-rose-200 border border-rose-400/30">
                    Diagnostic Analysis
                  </span>
                  <h2 className="font-black text-base sm:text-lg text-white">
                    Azure Service Modules — Knowledge Gaps Table
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Identifies the specific Azure service modules where you have the highest number of unresolved mistakes, ranked by remediation priority.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenPersonalizedReview && totalUnresolvedAcrossModules > 0 && (
                <button
                  type="button"
                  onClick={onOpenPersonalizedReview}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resolve All {totalUnresolvedAcrossModules} Mistakes</span>
                </button>
              )}
              {onOpenWeakAreasReview && (
                <button
                  type="button"
                  onClick={onOpenWeakAreasReview}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Launch Weak Areas Drill</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* 3 Diagnostic KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                    Total Unresolved Mistakes
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {totalUnresolvedAcrossModules}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Across {moduleKnowledgeGaps.filter((m) => m.unresolvedCount > 0).length} of 12 Azure modules
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                    Highest Priority Module
                  </span>
                  <span className="text-sm font-black text-slate-900 truncate block">
                    M{moduleKnowledgeGaps[0]?.moduleId}: {moduleKnowledgeGaps[0]?.moduleTitle}
                  </span>
                  <span className="text-[11px] text-amber-900 font-semibold block">
                    {moduleKnowledgeGaps[0]?.unresolvedCount || 0} unresolved •{' '}
                    {moduleKnowledgeGaps[0]?.masteryPct !== null
                      ? `${moduleKnowledgeGaps[0]?.masteryPct}% mastery`
                      : 'No attempts yet'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] block">
                    Primary Exam Trap Pattern
                  </span>
                  <span className="text-sm font-black text-slate-900 truncate block">
                    {moduleKnowledgeGaps[0]?.primaryTrap || 'No Active Traps'}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Click any service chip below to drill
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#0078D4] text-white flex items-center justify-center font-black shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-slate-700 px-1">Learning Path:</span>
                {(['all', 1, 2, 3] as const).map((pid) => (
                  <button
                    key={String(pid)}
                    type="button"
                    onClick={() => setSelectedPathFilter(pid)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedPathFilter === pid
                        ? 'bg-[#0078D4] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pid === 'all' ? 'All Paths' : `Path ${pid}`}
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGapsFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    gapsFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All 12 Modules Ranked
                </button>
                <button
                  type="button"
                  onClick={() => setGapsFilter('unresolved')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    gapsFilter === 'unresolved'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Modules With Mistakes Only
                </button>
              </div>
            </div>

            {/* Knowledge Gaps Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3.5">Rank &amp; Status</th>
                    <th className="py-3 px-3.5">Azure Service Module</th>
                    <th className="py-3 px-3.5">Key Azure Services</th>
                    <th className="py-3 px-3.5 text-center">Unresolved Mistakes</th>
                    <th className="py-3 px-3.5">Dominant Exam Trap</th>
                    <th className="py-3 px-3.5 text-center">Accuracy</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {visibleKnowledgeGaps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 px-4 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <span className="font-extrabold text-sm text-slate-800">
                            No unresolved mistakes in this view!
                          </span>
                          <span className="text-xs text-slate-500">
                            Switch to &ldquo;All 12 Modules Ranked&rdquo; to view all Azure service modules.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleKnowledgeGaps.map((row, idx) => {
                      const isCritical = row.severity === 'critical';
                      const isWarning = row.severity === 'warning';
                      const isExpanded = expandedGapModuleId === row.moduleId;

                      return (
                        <React.Fragment key={row.moduleId}>
                          <tr
                            className={`transition-colors ${
                              row.unresolvedCount > 0
                                ? 'bg-rose-50/40 hover:bg-rose-50/80'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 rounded-lg font-mono text-xs font-black flex items-center justify-center ${
                                    isCritical
                                      ? 'bg-rose-600 text-white'
                                      : isWarning
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    isCritical
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : isWarning
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isCritical ? 'High Gap' : isWarning ? 'Needs Review' : 'Clear'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3.5">
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-[#0078D4]">
                                  Module {row.moduleId}
                                </span>
                                <span>{row.moduleTitle}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Learning Path {row.pathId} • {row.totalAttempts} total attempts ({row.wrongAttempts} missed)
                              </div>
                            </td>

                            <td className="py-3 px-3.5">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {row.keyServices.slice(0, 3).map((srv) => (
                                  <button
                                    key={srv}
                                    type="button"
                                    onClick={() => {
                                      if (onSearchService) onSearchService(srv);
                                      onNavigateToPractice();
                                    }}
                                    className="px-2 py-0.5 rounded bg-sky-50 hover:bg-[#0078D4] text-sky-900 hover:text-white border border-sky-200 text-[10px] font-semibold transition-colors cursor-pointer truncate max-w-[140px]"
                                    title={`Drill Azure service: ${srv}`}
                                  >
                                    {srv}
                                  </button>
                                ))}
                              </div>
                            </td>

                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {row.unresolvedCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedGapModuleId(isExpanded ? null : row.moduleId)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-black shadow-2xs cursor-pointer"
                                  title="Click to inspect unresolved questions in this module"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                                  <span>{row.unresolvedCount} Unresolved</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px] font-bold">
                                  <Check className="w-3 h-3" />
                                  <span>0 Unresolved</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                  row.unresolvedCount > 0
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {row.primaryTrap}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {row.masteryPct !== null ? (
                                <div className="inline-flex flex-col items-center gap-1 w-24">
                                  <span
                                    className={`font-mono text-xs font-black ${
                                      row.masteryPct >= 75
                                        ? 'text-emerald-700'
                                        : row.masteryPct >= 50
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                    }`}
                                  >
                                    {row.masteryPct}%
                                  </span>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        row.masteryPct >= 75
                                          ? 'bg-emerald-500'
                                          : row.masteryPct >= 50
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${row.masteryPct}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-400">
                                  Not Practiced
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {row.unresolvedCount > 0 && onOpenPersonalizedReview && (
                                  <button
                                    type="button"
                                    onClick={onOpenPersonalizedReview}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Fix ({row.unresolvedCount})</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSelectModule) {
                                      onSelectModule(row.moduleId, row.pathId);
                                    }
                                    onNavigateToPractice();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Drill Module</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Unresolved Questions Breakdown */}
                          {isExpanded && row.unresolvedDetails.length > 0 && (
                            <tr className="bg-rose-50/70">
                              <td colSpan={7} className="p-3.5 border-t border-rose-200">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-extrabold text-rose-950">
                                    <span>
                                      Unresolved Questions in Module {row.moduleId} ({row.moduleTitle}):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedGapModuleId(null)}
                                      className="text-rose-700 hover:text-rose-900 text-[11px] font-bold cursor-pointer"
                                    >
                                      Hide Details
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {row.unresolvedDetails.map((detail) => (
                                      <div
                                        key={detail.questionId}
                                        className="p-2.5 rounded-xl bg-white border border-rose-200 flex flex-col justify-between gap-1.5"
                                      >
                                        <p className="text-xs font-bold text-slate-900 leading-snug">
                                          {detail.questionText}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 text-[11px]">
                                          <span className="text-rose-700 font-mono font-bold">
                                            Your Last Answer: {detail.lastWrongAnswer} (Correct: {detail.correctAnswer})
                                          </span>
                                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                                            {detail.trapType}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          AZURE CLOUD EXPLORER MENUS WINDOW (PROFILE TAB)
          Functionally compact & CSS-responsive across Mobile, Tablet & Laptop
         ===================================================================== */}
      <section
        aria-label="Azure Cloud Explorer Profile & Menus Window"
        className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
      >
        <KitengeRibbon height={3} />

        {/* 1. COMPACT WINDOW TITLE BAR */}
        <div className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-wrap items-center justify-between gap-2">
          {/* Left: Candidate Avatar, Editable Name & Rank Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0078D4] via-blue-600 to-[#C2410C] flex items-center justify-center text-white font-black text-sm sm:text-base shadow-2xs border border-white/80">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <MaasaiMedallion size={14} />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                      }}
                      className="px-2 py-0.5 text-xs sm:text-sm font-bold text-slate-900 bg-white border border-sky-300 rounded-lg focus:outline-none w-40 sm:w-48"
                      maxLength={30}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                      title="Save profile name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-black text-xs sm:text-sm tracking-tight text-white truncate">
                      {candidateName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setTempName(candidateName);
                        setIsEditingName(true);
                      }}
                      className="p-0.5 text-sky-200/80 hover:text-white transition-colors cursor-pointer"
                      title="Edit candidate name"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold border shrink-0 ${candidateLevel.color}`}
                >
                  <Crown className="w-2.5 h-2.5" />
                  <span>
                    Lv.{candidateLevel.level} {candidateLevel.title}
                  </span>
                </span>

                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  {completedCount}/{allModules.length} ({completionPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right: 4 Explorer Menu Tabs + Compact/Expand Toggle */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap ml-auto">
            <div
              className="flex items-center bg-slate-950/45 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold"
              role="tablist"
              aria-label="Profile Azure Cloud Explorer Menu Tabs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={explorerTab === 'paths'}
                onClick={() => {
                  setExplorerTab('paths');
                  if (!isExplorerExpanded) setIsExplorerExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  explorerTab === 'paths' && isExplorerExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 shrink-0" />
                <span>Paths</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={explorerTab === 'modules'}
                onClick={() => {
                  setExplorerTab('modules');
                  if (!isExplorerExpanded) setIsExplorerExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  explorerTab === 'modules' && isExplorerExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>Modules</span>
                <span className="hidden xs:inline text-[9px] px-1 rounded bg-white/15">
                  {completedCount}/12
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={explorerTab === 'services'}
                onClick={() => {
                  setExplorerTab('services');
                  if (!isExplorerExpanded) setIsExplorerExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  explorerTab === 'services' && isExplorerExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <Cloud className="w-3 h-3 shrink-0" />
                <span>Services</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={explorerTab === 'gaps'}
                onClick={() => {
                  setExplorerTab('gaps');
                  if (!isExplorerExpanded) setIsExplorerExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  explorerTab === 'gaps' && isExplorerExpanded
                    ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-300" />
                <span>Knowledge Gaps</span>
                {(totalUnresolvedAcrossModules > 0 || unresolvedMistakesCount > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {Math.max(totalUnresolvedAcrossModules, unresolvedMistakesCount)}
                  </span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={explorerTab === 'actions'}
                onClick={() => {
                  setExplorerTab('actions');
                  if (!isExplorerExpanded) setIsExplorerExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  explorerTab === 'actions' && isExplorerExpanded
                    ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3 shrink-0" />
                <span>Modes</span>
              </button>
            </div>

            {/* Compact / Expand Explorer Toggle */}
            <button
              type="button"
              onClick={() => setIsExplorerExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-bold transition-colors cursor-pointer"
              aria-expanded={isExplorerExpanded}
              title={
                isExplorerExpanded
                  ? 'Minimize Azure Cloud Explorer window'
                  : 'Expand Azure Cloud Explorer window'
              }
            >
              {isExplorerExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3 text-sky-200" />
                  <span className="hidden sm:inline">Compact</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-sky-200" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. ALWAYS-ON COMPACT KPI & QUICK-LAUNCH RIBBON */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50/95 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
          {/* 4-Metric KPI Strip (2x2 on mobile, 4-col inline on tablet & laptop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 flex-1">
            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0" />
                <span>Streak</span>
              </span>
              <span className="font-black text-xs sm:text-sm text-slate-900">
                {stats.streakDays || 1}d
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#0078D4] shrink-0" />
                <span>Solved</span>
              </span>
              <span className="font-black text-xs sm:text-sm text-slate-900">
                {stats.totalAnswered}
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Accuracy</span>
              </span>
              <span className="font-black text-xs sm:text-sm text-[#0078D4]">
                {accuracy}%
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Badges</span>
              </span>
              <span className="font-black text-xs sm:text-sm text-slate-900">
                {unlockedCount}/{totalBadges}
              </span>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0 scrollbar-thin">
            <button
              type="button"
              onClick={onNavigateToPractice}
              className="px-2.5 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-[11px] whitespace-nowrap flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Practice Studio</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToMock}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] whitespace-nowrap flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Award className="w-3 h-3" />
              <span>Mini-Mock</span>
            </button>

            {unresolvedMistakesCount > 0 && onOpenPersonalizedReview && (
              <button
                type="button"
                onClick={onOpenPersonalizedReview}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>Review ({unresolvedMistakesCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenManageGoal}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer"
            >
              Daily Goal ({stats.dailyGoal || 10}Q)
            </button>
          </div>
        </div>

        {/* 3. EXPANDABLE AZURE CLOUD EXPLORER WINDOW BODY */}
        {isExplorerExpanded && (
          <div className="p-3 sm:p-4 bg-white">
            {/* ===============================================================
                EXPLORER TAB 1: OFFICIAL 3 LEARNING PATHS PROGRESS & LAUNCHER
               =============================================================== */}
            {explorerTab === 'paths' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span className="font-extrabold text-slate-800">
                      Official AZ-900 Learning Paths Explorer
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500 font-semibold">
                      Modules Completed:{' '}
                      <strong className="text-slate-900">
                        {completedCount}/{allModules.length} ({completionPct}%)
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExplorerTab('modules')}
                      className="text-[#0078D4] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View 12 Modules</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Responsive 3-Col Grid on Tablet/Laptop, 1-Col on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {LEARNING_PATHS.map((path) => {
                    const mastery = stats.pathMastery?.[path.id] || {
                      correct: 0,
                      total: 0,
                    };
                    const pathAcc =
                      mastery.total > 0
                        ? Math.round((mastery.correct / mastery.total) * 100)
                        : 0;
                    const pathModIds = path.modules.map((m) => m.id);
                    const pathDoneCount = pathModIds.filter((id) =>
                      completedModules.includes(id)
                    ).length;
                    const pathDonePct = Math.round(
                      (pathDoneCount / pathModIds.length) * 100
                    );

                    return (
                      <div
                        key={path.id}
                        className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-sky-300 transition-all flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-black"
                              style={{
                                backgroundColor: `${path.accentColor}18`,
                                color: path.accentColor,
                              }}
                            >
                              Path {path.id} ({path.examWeight})
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-700">
                              {pathAcc}% Acc • {pathDoneCount}/{pathModIds.length} Mods
                            </span>
                          </div>

                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">
                            {path.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {path.summary}
                          </p>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                              <span>
                                Solved: {mastery.correct}/{mastery.total}
                              </span>
                              <span>Checklist: {pathDonePct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.max(
                                    pathDonePct,
                                    Math.min(100, (mastery.total / 15) * 100)
                                  )}%`,
                                  backgroundColor: path.accentColor,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPath) {
                                  onSelectPath(path.id);
                                }
                                onNavigateToPractice();
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Practice Path {path.id}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPathFilter(path.id);
                                setExplorerTab('modules');
                              }}
                              className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Modules
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                EXPLORER TAB 2: 12-MODULE COMPLETION CHECKLIST & DRILL GRID
               =============================================================== */}
            {explorerTab === 'modules' && (
              <div className="space-y-3">
                {/* Path Filter Pills + Overall Progress Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setSelectedPathFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] whitespace-nowrap border transition-all cursor-pointer ${
                        selectedPathFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      All Paths (12)
                    </button>
                    {([1, 2, 3] as const).map((pid) => (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => setSelectedPathFilter(pid)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap border transition-all cursor-pointer ${
                          selectedPathFilter === pid
                            ? 'bg-[#0078D4] text-white border-[#0078D4]'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Path {pid}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500 font-semibold">
                      Completed:{' '}
                      <strong className="text-slate-900">
                        {completedCount}/{allModules.length} ({completionPct}%)
                      </strong>
                    </span>
                    <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0078D4] to-emerald-500 transition-all duration-300"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Responsive Modules Grid: 1 col mobile, 2 cols tablet, 3-4 cols laptop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {visibleModules.map((mod) => {
                    const isModDone = completedModules.includes(mod.id);
                    const qCount = questionCountByModule[mod.id] || 0;
                    const masteryPct = getModuleMasteryPct(mod.id);

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-xl border p-2.5 transition-all flex items-center justify-between gap-2 ${
                          isModDone
                            ? 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/90 text-slate-900'
                            : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-sky-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {onToggleModuleComplete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleModuleComplete(mod.id);
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                                isModDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-[#0078D4]'
                              }`}
                              title={
                                isModDone
                                  ? `Mark Module ${mod.id} incomplete`
                                  : `Mark Module ${mod.id} complete`
                              }
                            >
                              {isModDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectModule) {
                                onSelectModule(mod.id, mod.pathId);
                              }
                              onNavigateToPractice();
                            }}
                            className="text-left min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                                M{mod.id}
                              </span>
                              <span className="text-xs font-bold truncate block">
                                {mod.title}
                              </span>
                            </div>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectModule) {
                              onSelectModule(mod.id, mod.pathId);
                            }
                            onNavigateToPractice();
                          }}
                          className="flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {masteryPct !== null && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                masteryPct >= 70
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {masteryPct}%
                            </span>
                          )}
                          {qCount > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                              {qCount}Q
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                EXPLORER TAB 3: AZURE CLOUD SERVICES DIRECTORY & DRILL
               =============================================================== */}
            {explorerTab === 'services' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Search Azure services (e.g., ExpressRoute, RBAC, Blob, Locks)..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0078D4]"
                    />
                    {serviceSearch && (
                      <button
                        type="button"
                        onClick={() => setServiceSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                    {serviceCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedServiceCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedServiceCategory === cat
                            ? 'bg-[#0078D4] text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      activeServiceDetail
                        ? 'lg:col-span-7'
                        : 'lg:col-span-12 lg:grid-cols-3'
                    } gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin`}
                  >
                    {filteredServices.map((srv, idx) => {
                      const isSelected = activeServiceDetail?.term === srv.term;
                      return (
                        <div
                          key={`${srv.moduleId}-${srv.term}-${idx}`}
                          onClick={() =>
                            setActiveServiceDetail(isSelected ? null : srv)
                          }
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-blue-50/90 border-[#0078D4] ring-1 ring-[#0078D4]/30'
                              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900 leading-snug">
                              {srv.term}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-[#0078D4] border border-blue-200 shrink-0">
                              M{srv.moduleId}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {srv.definition}
                          </p>

                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] font-semibold text-slate-500 truncate">
                              {srv.category}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSearchService) {
                                  onSearchService(srv.term);
                                }
                                onNavigateToPractice();
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#0078D4] hover:bg-[#005A9E] text-white transition-colors cursor-pointer"
                            >
                              Drill Qs →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {activeServiceDetail && (
                    <div className="lg:col-span-5 p-3.5 rounded-xl bg-gradient-to-br from-blue-50/90 via-white to-amber-50/50 border border-sky-300 shadow-xs space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] block">
                            Path {activeServiceDetail.pathId} • Module{' '}
                            {activeServiceDetail.moduleId}
                          </span>
                          <h4 className="font-black text-sm text-slate-900">
                            {activeServiceDetail.term}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveServiceDetail(null)}
                          className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeServiceDetail.definition}
                      </p>

                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-950 space-y-0.5">
                        <span className="font-black uppercase text-[10px] text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Microsoft Exam Trap:</span>
                        </span>
                        <p className="font-medium leading-relaxed">
                          {activeServiceDetail.examTrap}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSearchService) {
                              onSearchService(activeServiceDetail.term);
                            }
                            onNavigateToPractice();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Filter className="w-3 h-3" />
                          <span>Drill "{activeServiceDetail.term}"</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectModule) {
                              onSelectModule(
                                activeServiceDetail.moduleId,
                                activeServiceDetail.pathId
                              );
                            }
                            onNavigateToPractice();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer"
                        >
                          Practice Module {activeServiceDetail.moduleId}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                EXPLORER TAB 4: KNOWLEDGE GAPS DIAGNOSTIC TABLE
               =============================================================== */}
            {explorerTab === 'gaps' && (
              <div className="space-y-3">
                {/* Top Summary & Filter Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-2xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Azure Service Module Knowledge Gaps
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          {totalUnresolvedAcrossModules} Unresolved Mistake{totalUnresolvedAcrossModules === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Modules ranked by highest number of unresolved mistakes and lowest accuracy to prioritize your study remediation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setGapsFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          gapsFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Modules ({allModules.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGapsFilter('unresolved')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          gapsFilter === 'unresolved'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        With Mistakes Only
                      </button>
                    </div>

                    {onOpenPersonalizedReview && totalUnresolvedAcrossModules > 0 && (
                      <button
                        type="button"
                        onClick={onOpenPersonalizedReview}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Review All Mistakes</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Knowledge Gaps Structured Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Azure Service Module</th>
                        <th className="py-2.5 px-3">Affected Azure Services</th>
                        <th className="py-2.5 px-3 text-center">Unresolved Mistakes</th>
                        <th className="py-2.5 px-3">Primary Exam Trap</th>
                        <th className="py-2.5 px-3 text-center">Module Mastery</th>
                        <th className="py-2.5 px-3 text-right">Remediation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {visibleKnowledgeGaps.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              <span className="font-bold text-slate-800">
                                Zero unresolved mistakes found for this filter!
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Switch to &ldquo;All Modules&rdquo; to inspect full curriculum mastery or launch a practice session.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        visibleKnowledgeGaps.map((row, idx) => {
                          const isCritical = row.severity === 'critical';
                          const isWarning = row.severity === 'warning';

                          return (
                            <tr
                              key={row.moduleId}
                              className={`transition-colors ${
                                row.unresolvedCount > 0
                                  ? 'bg-rose-50/35 hover:bg-rose-50/70'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Priority Rank */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-5 h-5 rounded-md font-mono text-[10px] font-black flex items-center justify-center ${
                                      isCritical
                                        ? 'bg-rose-600 text-white'
                                        : isWarning
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    #{idx + 1}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      isCritical
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : isWarning
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {isCritical ? 'High Gap' : isWarning ? 'Needs Review' : 'Solid'}
                                  </span>
                                </div>
                              </td>

                              {/* Azure Service Module */}
                              <td className="py-2.5 px-3">
                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-[#0078D4]">
                                    M{row.moduleId}
                                  </span>
                                  <span>{row.moduleTitle}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  Learning Path {row.pathId} • {row.totalAttempts} attempt{row.totalAttempts === 1 ? '' : 's'} ({row.wrongAttempts} missed)
                                </div>
                              </td>

                              {/* Affected Azure Services */}
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {row.keyServices.slice(0, 3).map((srv) => (
                                    <button
                                      key={srv}
                                      type="button"
                                      onClick={() => {
                                        if (onSearchService) onSearchService(srv);
                                        onNavigateToPractice();
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-sky-50 hover:bg-[#0078D4] text-sky-900 hover:text-white border border-sky-200 text-[10px] font-semibold transition-colors cursor-pointer truncate max-w-[135px]"
                                      title={`Drill service: ${srv}`}
                                    >
                                      {srv}
                                    </button>
                                  ))}
                                </div>
                              </td>

                              {/* Unresolved Mistakes Count */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {row.unresolvedCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-black shadow-2xs">
                                    <AlertTriangle className="w-3 h-3 text-amber-200" />
                                    {row.unresolvedCount} Unresolved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                                    <Check className="w-3 h-3" />0 Unresolved
                                  </span>
                                )}
                              </td>

                              {/* Primary Exam Trap */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    row.unresolvedCount > 0
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {row.primaryTrap}
                                </span>
                              </td>

                              {/* Module Mastery % */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {row.masteryPct !== null ? (
                                  <div className="inline-flex flex-col items-center gap-1 w-20">
                                    <span
                                      className={`font-mono text-xs font-black ${
                                        row.masteryPct >= 75
                                          ? 'text-emerald-700'
                                          : row.masteryPct >= 50
                                          ? 'text-amber-700'
                                          : 'text-rose-700'
                                      }`}
                                    >
                                      {row.masteryPct}%
                                    </span>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          row.masteryPct >= 75
                                            ? 'bg-emerald-500'
                                            : row.masteryPct >= 50
                                            ? 'bg-amber-500'
                                            : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${row.masteryPct}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    Untested
                                  </span>
                                )}
                              </td>

                              {/* Action Button */}
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {row.unresolvedCount > 0 && onOpenPersonalizedReview && (
                                    <button
                                      type="button"
                                      onClick={onOpenPersonalizedReview}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="Resolve mistakes in Personalized Review"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Fix ({row.unresolvedCount})</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onSelectModule) {
                                        onSelectModule(row.moduleId, row.pathId);
                                      }
                                      onNavigateToPractice();
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Drill M{row.moduleId}</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===============================================================
                EXPLORER TAB 5: COMPACT STUDIO MODES & ACTIONS LAUNCHER
               =============================================================== */}
            {explorerTab === 'actions' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={onNavigateToPractice}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-700 text-white text-left flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-white/15 shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs truncate">
                      Practice Modules
                    </div>
                    <div className="text-[10px] text-sky-100 truncate">
                      12 official modules
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToMock}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-amber-500 text-slate-950 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs truncate">
                      Timed Mini-Mock
                    </div>
                    <div className="text-[10px] text-amber-900 truncate">
                      700/1000 exam simulation
                    </div>
                  </div>
                </button>

                {onOpenPersonalizedReview && (
                  <button
                    type="button"
                    onClick={onOpenPersonalizedReview}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">
                        Review Wrong ({unresolvedMistakesCount})
                      </div>
                      <div className="text-[10px] text-rose-800 truncate">
                        Master missed questions
                      </div>
                    </div>
                  </button>
                )}

                {onOpenWeakAreasReview && (
                  <button
                    type="button"
                    onClick={onOpenWeakAreasReview}
                    className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-orange-600 text-white shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">
                        Weak Areas Drill
                      </div>
                      <div className="text-[10px] text-orange-800 truncate">
                        Target lowest modules
                      </div>
                    </div>
                  </button>
                )}

                {setActiveTab && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('adaptive')}
                      className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs truncate">
                          Adaptive Quiz
                        </div>
                        <div className="text-[10px] text-indigo-800 truncate">
                          Dynamic difficulty
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('flashcards')}
                      className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-sky-600 text-white shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs truncate">
                          Concept Flashcards
                        </div>
                        <div className="text-[10px] text-sky-800 truncate">
                          32 core Azure terms
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('analytics')}
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs truncate">
                          Confidence Radar
                        </div>
                        <div className="text-[10px] text-emerald-800 truncate">
                          Multi-axial diagnostics
                        </div>
                      </div>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={onOpenManageGoal}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4 text-sky-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs truncate">
                      Daily Goal Config
                    </div>
                    <div className="text-[10px] text-slate-600 truncate">
                      Target: {stats.dailyGoal || 10} Qs/day
                    </div>
                  </div>
                </button>

                {onOpenUserGuide && (
                  <button
                    type="button"
                    onClick={onOpenUserGuide}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-sky-300 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate flex items-center gap-1">
                        <span>Candidate Guide (PDF)</span>
                      </div>
                      <div className="text-[10px] text-sky-700 truncate">
                        Manual, aims &amp; FAQ
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Daily Learning Goal Component with Circular Progress Ring & Celebration Animation */}
      <DailyLearningGoal
        stats={stats}
        onUpdateStats={onUpdateStats}
        onStartPractice={onNavigateToPractice}
      />

      {/* Interactive Step-by-Step Learning Path Progress Map */}
      <LearningPathProgressMap
        stats={stats}
        onSelectModule={(modId, pathId) => {
          if (onSelectModule) {
            onSelectModule(modId, pathId);
          }
          onNavigateToPractice();
        }}
        onToggleModuleComplete={onToggleModuleComplete}
        questionCountByModule={questionCountByModule}
        defaultExpanded={false}
      />

      {/* Daily Study Reminder System (Browser Notification API) */}
      <DailyStudyReminder
        stats={stats}
        onStartScenarioQuestion={onNavigateToPractice}
      />

      {/* 30-Day Streak Activity & Study Consistency Graph (Recharts) */}
      <StreakActivityGraph stats={stats} />

      {/* 30-Day Daily Accuracy Percentage Line Chart (Recharts) */}
      <DailyAccuracyTrajectoryChart stats={stats} />

      {/* =====================================================================
          COMPACT & RESPONSIVE BADGES & MILESTONE ACHIEVEMENTS SECTION
         ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Azure Virtual Badges &amp; Achievement System
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                {unlockedCount}/{totalBadges} Unlocked
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Custom-designed virtual badges for milestones like &lsquo;First 100 Questions&rsquo;, &lsquo;Mastered Networking Path&rsquo;, and &lsquo;7-Day Streak&rsquo;. Click any badge to launch the CSS-animated reveal overlay!
            </p>
          </div>

          {/* Featured Milestone Reveal Showcase Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => triggerAchievementOverlay('first-100-questions')}
              className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
              title="Reveal CSS-animated overlay for First 100 Questions"
            >
              <Sparkles className="w-3 h-3 text-[#0078D4]" />
              <span>Reveal: First 100 Questions</span>
            </button>
            <button
              type="button"
              onClick={() => triggerAchievementOverlay('mastered-networking-path')}
              className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
              title="Reveal CSS-animated overlay for Mastered Networking Path"
            >
              <Compass className="w-3 h-3 text-amber-600" />
              <span>Reveal: Mastered Networking</span>
            </button>
            <button
              type="button"
              onClick={() => triggerAchievementOverlay('safari-marathon')}
              className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
              title="Reveal CSS-animated overlay for 7-Day Streak"
            >
              <Flame className="w-3 h-3 text-orange-600 fill-orange-500" />
              <span>Reveal: 7-Day Streak</span>
            </button>
          </div>
        </div>

        {/* Filter Pills + Compact Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterUnlocked('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterUnlocked === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalBadges})
              </button>
              <button
                type="button"
                onClick={() => setFilterUnlocked('unlocked')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  filterUnlocked === 'unlocked'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Unlocked ({unlockedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterUnlocked('locked')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  filterUnlocked === 'locked'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Locked ({totalBadges - unlockedCount})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCompactBadges((prev) => !prev)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Toggle compact or detailed badge cards"
            >
              {compactBadges ? (
                <>
                  <Maximize2 className="w-3 h-3 text-[#0078D4]" />
                  <span>Detailed</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3 text-[#0078D4]" />
                  <span>Compact</span>
                </>
              )}
            </button>
          </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'consistency', label: 'Streaks & Consistency' },
            { id: 'mastery', label: 'Exam Mastery' },
            { id: 'curriculum', label: 'Curriculum Paths' },
            { id: 'milestones', label: 'Volume Milestones' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as BadgeCategory)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Responsive Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBadges.map((badge) => {
            const tierStyle = tierColors[badge.tier];

            return (
              <div
                key={badge.id}
                onClick={() => triggerAchievementOverlay(badge.id)}
                className={`group relative rounded-xl border cursor-pointer ${
                  compactBadges ? 'p-3' : 'p-4'
                } transition-all flex flex-col justify-between ${
                  badge.unlocked
                    ? `${tierStyle.bg} ${tierStyle.border} shadow-xs ring-1 ${tierStyle.ring} hover:scale-[1.01]`
                    : 'bg-slate-50/70 border-slate-200 opacity-85 hover:opacity-100 hover:border-sky-300'
                }`}
                title={`Click to launch CSS-animated achievement reveal for ${badge.title}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0 transition-transform group-hover:scale-110 ${
                          badge.unlocked
                            ? 'bg-gradient-to-br from-amber-400 via-[#0078D4] to-indigo-700 text-white border border-white'
                            : 'bg-slate-200 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {badge.unlocked ? (
                          <Award className="w-5 h-5 text-amber-200 fill-amber-300/30" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <span className="absolute -bottom-1 -right-1">
                          <MaasaiMedallion size={12} />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate group-hover:text-[#0078D4] transition-colors">
                          {badge.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-500 block truncate">
                          {badge.subtitle}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${tierStyle.border} ${tierStyle.text} bg-white/80`}
                    >
                      {badge.tier}
                    </span>
                  </div>

                  {!compactBadges && (
                    <>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {badge.description}
                      </p>

                      <blockquote className="text-[11px] italic text-amber-900/80 bg-white/60 p-2 rounded-lg border border-amber-200/50 mb-2 leading-snug">
                        {badge.proverbQuote}
                      </blockquote>
                    </>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span
                      className={
                        badge.unlocked
                          ? 'text-emerald-700 flex items-center gap-1'
                          : 'text-slate-500'
                      }
                    >
                      {badge.unlocked ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Unlocked</span>
                        </>
                      ) : (
                        <span>
                          {badge.currentValue} / {badge.targetValue} {badge.unit}
                        </span>
                      )}
                    </span>
                    <span className="text-[#0078D4] font-extrabold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Reveal</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked ? 'bg-emerald-500' : 'bg-[#0078D4]'
                      }`}
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>

                  {!badge.unlocked && !compactBadges && (
                    <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                      💡 {badge.tipToUnlock}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
