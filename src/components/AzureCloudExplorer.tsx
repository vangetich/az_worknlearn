import React, { useState, useMemo } from 'react';
import {
  Compass,
  Cloud,
  Layers,
  ShieldCheck,
  Search,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  AlertTriangle,
  Users,
  Award,
  Bot,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Minimize2,
  Maximize2,
  Filter,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { MODULE_FREQUENTLY_MISSED_TERMS } from '../data/frequentlyMissedTerms';
import { UserStats } from '../types/quiz';
import { AppTab } from './Header';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

export interface AzureCloudExplorerProps {
  selectedPathId: number | 'all';
  selectedModuleId: number | 'all';
  onSelectPath: (pathId: 1 | 2 | 3 | 'all') => void;
  onSelectModule: (moduleId: number | 'all', pathId?: 1 | 2 | 3 | 'all') => void;
  stats: UserStats;
  questionCountByModule: Record<number, number>;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onToggleModuleComplete: (moduleId: number) => void;
  onOpenPersonalizedReview: () => void;
  onOpenWeakAreasReview: () => void;
  onOpenStudyRoom: () => void;
  onOpenMockExam: () => void;
  unresolvedMistakesCount: number;
  isSidebarHidden: boolean;
  onToggleSidebar: () => void;
  isOpenExternal?: boolean;
  onToggleExternal?: () => void;
}

type ExplorerMenuSection = 'curriculum' | 'services' | 'actions';

interface ExplorerServiceItem {
  term: string;
  category: string;
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  definition: string;
  examTrap: string;
}

const PATH_META = [
  {
    id: 1 as const,
    short: 'Path 1: Cloud Concepts',
    badge: 'P1 · 25–30%',
    icon: Cloud,
    accent: '#D97706',
    bgActive: 'bg-amber-600 text-white border-amber-600',
    bgIdle: 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 border-amber-200/80',
  },
  {
    id: 2 as const,
    short: 'Path 2: Architecture & Services',
    badge: 'P2 · 35–40%',
    icon: Layers,
    accent: '#0078D4',
    bgActive: 'bg-[#0078D4] text-white border-[#0078D4]',
    bgIdle: 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-950 border-blue-200/80',
  },
  {
    id: 3 as const,
    short: 'Path 3: Mgmt & Governance',
    badge: 'P3 · 30–35%',
    icon: ShieldCheck,
    accent: '#C2410C',
    bgActive: 'bg-orange-700 text-white border-orange-700',
    bgIdle: 'bg-orange-50/70 hover:bg-orange-100/80 text-orange-950 border-orange-200/80',
  },
];

export const AzureCloudExplorer: React.FC<AzureCloudExplorerProps> = ({
  selectedPathId,
  selectedModuleId,
  onSelectPath,
  onSelectModule,
  stats,
  questionCountByModule,
  searchQuery,
  onSearchQueryChange,
  activeTab,
  setActiveTab,
  onToggleModuleComplete,
  onOpenPersonalizedReview,
  onOpenWeakAreasReview,
  onOpenStudyRoom,
  onOpenMockExam,
  unresolvedMistakesCount,
  isSidebarHidden,
  onToggleSidebar,
  isOpenExternal,
  onToggleExternal,
}) => {
  const [internalExpanded, setInternalExpanded] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<ExplorerMenuSection>('curriculum');
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('All');
  const [activeServiceDetail, setActiveServiceDetail] = useState<ExplorerServiceItem | null>(null);

  const isExpanded = isOpenExternal !== undefined ? isOpenExternal : internalExpanded;
  const handleToggleExpand = () => {
    if (onToggleExternal) {
      onToggleExternal();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

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

  // Build indexed Azure services list from curriculum & frequently missed terms
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
      const matchesPath = selectedPathId === 'all' || s.pathId === selectedPathId;
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
  }, [allServices, selectedPathId, selectedServiceCategory, serviceSearch]);

  // Visible modules based on selectedPathId
  const visibleModules = useMemo(() => {
    if (selectedPathId === 'all') return allModules;
    return allModules.filter((m) => m.pathId === selectedPathId);
  }, [selectedPathId, allModules]);

  const getModuleMasteryPct = (modId: number) => {
    const m = stats.moduleMastery?.[modId];
    if (!m || m.total === 0) return null;
    return Math.round((m.correct / m.total) * 100);
  };

  return (
    <section
      aria-label="Azure Cloud Explorer Menus Window"
      className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden transition-all shadow-xs mb-4"
    >
      <KitengeRibbon height={3} />

      {/* =====================================================================
          WINDOW TITLE BAR (Compact on Mobile, Tablet & Laptop)
         ===================================================================== */}
      <div className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-wrap items-center justify-between gap-2">
        {/* Left: Window Icon, Title & Active Status Badges */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-300/40 flex items-center justify-center text-sky-300 shrink-0 shadow-2xs">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-black text-xs sm:text-sm tracking-tight text-white truncate">
                Azure Cloud Explorer
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-sky-500/30 text-sky-100 border border-sky-300/30 shrink-0">
                {selectedPathId === 'all' ? 'All Paths' : `Path ${selectedPathId}`}
                {selectedModuleId !== 'all' ? ` • M${selectedModuleId}` : ''}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                {completedCount}/{allModules.length} ({completionPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Menu Mode Switcher Tabs + Window Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap ml-auto">
          {/* 3 Functional Menu Tabs inside Explorer Window */}
          <div
            className="flex items-center bg-slate-950/45 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold"
            role="tablist"
            aria-label="Azure Cloud Explorer Menu Modes"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMenu === 'curriculum'}
              onClick={() => {
                setActiveMenu('curriculum');
                if (!isExpanded) handleToggleExpand();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeMenu === 'curriculum' && isExpanded
                  ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 shrink-0" />
              <span>Modules</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeMenu === 'services'}
              onClick={() => {
                setActiveMenu('services');
                if (!isExpanded) handleToggleExpand();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeMenu === 'services' && isExpanded
                  ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              <Cloud className="w-3 h-3 shrink-0" />
              <span>Services</span>
              <span className="hidden xs:inline text-[9px] px-1 rounded bg-white/15">
                {allServices.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeMenu === 'actions'}
              onClick={() => {
                setActiveMenu('actions');
                if (!isExpanded) handleToggleExpand();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeMenu === 'actions' && isExpanded
                  ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3 shrink-0" />
              <span>Modes</span>
              {unresolvedMistakesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {unresolvedMistakesCount}
                </span>
              )}
            </button>
          </div>

          {/* Laptop Sidebar Toggle Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-100 border border-white/15 text-[11px] font-bold transition-colors cursor-pointer"
            title={
              isSidebarHidden
                ? 'Pin side Curriculum Navigator open'
                : 'Collapse side Curriculum Navigator for wider quiz view'
            }
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{isSidebarHidden ? 'Show Sidebar' : 'Hide Sidebar'}</span>
          </button>

          {/* Compact / Expand Explorer Window Toggle */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-bold transition-colors cursor-pointer"
            aria-expanded={isExpanded}
            title={isExpanded ? 'Minimize Azure Cloud Explorer window' : 'Expand Azure Cloud Explorer window'}
          >
            {isExpanded ? (
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

      {/* =====================================================================
          ALWAYS-ON COMPACT RIBBON (Quick Path Filter + Active Search Filter)
          Responsive single-row on laptop, clean wrap on mobile & tablet
         ===================================================================== */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Path Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              onSelectPath('all');
              onSelectModule('all', 'all');
            }}
            className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] whitespace-nowrap transition-all border cursor-pointer ${
              selectedPathId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            All Paths (12)
          </button>

          {PATH_META.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPathId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectPath(p.id);
                  onSelectModule('all', p.id);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all border flex items-center gap-1 cursor-pointer ${
                  isSelected ? p.bgActive : p.bgIdle
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">{p.short}</span>
                <span className="sm:hidden">{p.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Launch Pills (Review Wrong, Weak Areas, Adaptive) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {unresolvedMistakesCount > 0 && (
            <button
              type="button"
              onClick={onOpenPersonalizedReview}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] whitespace-nowrap flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Review ({unresolvedMistakesCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenWeakAreasReview}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Weak Areas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adaptive')}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0078D4] border border-blue-200 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Adaptive</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          EXPANDABLE EXPLORER MENU WINDOW BODY
          Responsive Grid:
          - Mobile (< 640px): 1-column compact cards with scrollable list
          - Tablet (640px - 1024px): 2-column responsive grid
          - Laptop (>= 1024px): 3- or 4-column high-density explorer grid
         ===================================================================== */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-white">
          {/* -----------------------------------------------------------------
              TAB 1: CURRICULUM & MODULES EXPLORER
             ----------------------------------------------------------------- */}
          {activeMenu === 'curriculum' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800">
                    {selectedPathId === 'all'
                      ? 'All 12 Official AZ-900 Modules'
                      : `Path ${selectedPathId} Modules (${visibleModules.length})`}
                  </span>
                  {selectedModuleId !== 'all' && (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectModule('all', selectedPathId as 1 | 2 | 3 | 'all')
                      }
                      className="text-[11px] font-bold text-[#0078D4] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear Module Filter</span>
                    </button>
                  )}
                </div>

                {/* Overall Progress Bar Pill */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-semibold">
                    Progress: <strong className="text-slate-900">{completedCount}/{allModules.length}</strong>
                  </span>
                  <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0078D4] to-emerald-500 transition-all duration-300"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Compact Responsive Modules Grid: 1 col mobile, 2 cols tablet, 3-4 cols laptop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {visibleModules.map((mod) => {
                  const isModActive = selectedModuleId === mod.id;
                  const isModDone = completedModules.includes(mod.id);
                  const qCount = questionCountByModule[mod.id] || 0;
                  const masteryPct = getModuleMasteryPct(mod.id);

                  return (
                    <div
                      key={mod.id}
                      className={`group rounded-xl border p-2.5 transition-all flex items-center justify-between gap-2 ${
                        isModActive
                          ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-xs'
                          : isModDone
                          ? 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/90 text-slate-900'
                          : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-sky-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Completion Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleModuleComplete(mod.id);
                          }}
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                            isModDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isModActive
                              ? 'border-white/80 bg-white/10'
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

                        {/* Module Select Trigger */}
                        <button
                          type="button"
                          onClick={() => onSelectModule(mod.id, mod.pathId)}
                          className="text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                                isModActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              M{mod.id}
                            </span>
                            <span className="text-xs font-bold truncate block">
                              {mod.title}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Right Metrics Badge */}
                      <button
                        type="button"
                        onClick={() => onSelectModule(mod.id, mod.pathId)}
                        className="flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {masteryPct !== null && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              isModActive
                                ? 'bg-white/20 text-white'
                                : masteryPct >= 70
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {masteryPct}%
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            isModActive
                              ? 'bg-blue-900/40 text-sky-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {qCount}Q
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 2: AZURE CLOUD SERVICES DIRECTORY & DRILL EXPLORER
             ----------------------------------------------------------------- */}
          {activeMenu === 'services' && (
            <div className="space-y-3">
              {/* Compact Search & Category Filter Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Filter Azure services (e.g., ExpressRoute, RBAC, Blob, Locks)..."
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

                {/* Category Chips */}
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

              {/* Responsive Split: Services Grid + Optional Active Service Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    activeServiceDetail ? 'lg:col-span-7' : 'lg:col-span-12 lg:grid-cols-3'
                  } gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin`}
                >
                  {filteredServices.map((srv, idx) => {
                    const isSelected = activeServiceDetail?.term === srv.term;
                    const isFilteredInQuiz =
                      searchQuery.toLowerCase() === srv.term.toLowerCase();

                    return (
                      <div
                        key={`${srv.moduleId}-${srv.term}-${idx}`}
                        onClick={() => setActiveServiceDetail(isSelected ? null : srv)}
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
                              onSearchQueryChange(isFilteredInQuiz ? '' : srv.term);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-colors cursor-pointer ${
                              isFilteredInQuiz
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#0078D4] hover:bg-[#005A9E] text-white'
                            }`}
                          >
                            {isFilteredInQuiz ? 'Filtered ✓' : 'Drill Qs →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compact Service Inspector Card (when a service is clicked) */}
                {activeServiceDetail && (
                  <div className="lg:col-span-5 p-3.5 rounded-xl bg-gradient-to-br from-blue-50/90 via-white to-amber-50/50 border border-sky-300 shadow-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] block">
                          Path {activeServiceDetail.pathId} • Module {activeServiceDetail.moduleId}
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
                          onSearchQueryChange(activeServiceDetail.term);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filter Questions by "{activeServiceDetail.term}"</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectModule(
                            activeServiceDetail.moduleId,
                            activeServiceDetail.pathId
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer"
                      >
                        Go to Module {activeServiceDetail.moduleId}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 3: COMPACT STUDIO MODES & QUICK ACTIONS LAUNCHER
             ----------------------------------------------------------------- */}
          {activeMenu === 'actions' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('adaptive')}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-left flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/15 shrink-0">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">Adaptive Quiz</div>
                  <div className="text-[10px] text-sky-100 truncate">Auto-targets weak areas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenPersonalizedReview}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">
                    Personalized Review ({unresolvedMistakesCount})
                  </div>
                  <div className="text-[10px] text-amber-900 truncate">
                    Re-test missed questions
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenWeakAreasReview}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">Weak Areas Drill</div>
                  <div className="text-[10px] text-rose-800 truncate">
                    5–10 targeted scenarios
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenMockExam}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-[#0078D4] text-white shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">Timed Mock Exam</div>
                  <div className="text-[10px] text-blue-800 truncate">
                    700/1000 exam simulation
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('flashcards')}
                className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">Concept Flashcards</div>
                  <div className="text-[10px] text-indigo-800 truncate">
                    32 core Azure terms
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenStudyRoom}
                className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-sky-600 text-white shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">Virtual Study Room</div>
                  <div className="text-[10px] text-sky-800 truncate">
                    Live Harambee peer circle
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai-builder')}
                className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-orange-600 text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">AI Scenario Builder</div>
                  <div className="text-[10px] text-orange-800 truncate">
                    Generate custom questions
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assistant')}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">AI Knowledge Tutor</div>
                  <div className="text-[10px] text-slate-600 truncate">
                    Ask architecture questions
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
