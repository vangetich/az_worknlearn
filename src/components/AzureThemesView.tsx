import React, { useState, useMemo, useEffect } from 'react';
import {
  GitBranch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layers,
  Image as ImageIcon,
  ShieldAlert,
  RotateCcw,
  Compass,
  Filter,
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  AZURE_THEME_THREADS,
  AzureThemeThread,
  ServiceCategoryKey,
  ThemeModuleLink,
  doesModuleMatchThemeSearch,
} from '../data/azureThemesData';
import { ScalingArchitectureDiagram } from './ScalingArchitectureDiagram';
import { AzureThemesDeepDive } from './AzureThemesDeepDive';
import { ThemeMasteryTimeline } from './ThemeMasteryTimeline';

interface AzureThemesViewProps {
  stats: UserStats;
  onPracticeModule: (moduleId: number) => void;
  onOpenImageTutor?: () => void;
  onOpenStudyDecksModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  initialThemeId?: string | null;
  initialModuleId?: number | null;
}

export const AzureThemesView: React.FC<AzureThemesViewProps> = ({
  stats,
  onPracticeModule,
  onOpenImageTutor,
  onOpenStudyDecksModule,
  initialThemeId,
  initialModuleId,
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'deep-dive'>('overview');
  const [themeSearchQuery, setThemeSearchQuery] = useState<string>('');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    initialThemeId || AZURE_THEME_THREADS[0].id
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ServiceCategoryKey | 'All'>('All');
  const [selectedModuleId, setSelectedModuleId] = useState<number>(
    initialModuleId || AZURE_THEME_THREADS[0].moduleConnections[0].moduleId
  );

  useEffect(() => {
    if (!initialThemeId) return;
    const matchedTheme = AZURE_THEME_THREADS.find((t) => t.id === initialThemeId);
    if (!matchedTheme) return;
    setSelectedThemeId(matchedTheme.id);
    setSelectedCategoryFilter('All');
    if (matchedTheme.id !== 'scaling-elasticity') {
      setViewMode('overview');
    }
    if (
      initialModuleId &&
      matchedTheme.moduleConnections.some((c) => c.moduleId === initialModuleId)
    ) {
      setSelectedModuleId(initialModuleId);
    } else {
      setSelectedModuleId(matchedTheme.moduleConnections[0].moduleId);
    }
  }, [initialThemeId, initialModuleId]);

  // Interactive bridge quiz state keyed by quiz.id
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const activeTheme: AzureThemeThread = useMemo(
    () => AZURE_THEME_THREADS.find((t) => t.id === selectedThemeId) || AZURE_THEME_THREADS[0],
    [selectedThemeId]
  );

  const visibleConnections = useMemo(() => {
    if (selectedCategoryFilter === 'All') return activeTheme.moduleConnections;
    return activeTheme.moduleConnections.filter(
      (c) => c.serviceCategory === selectedCategoryFilter
    );
  }, [activeTheme, selectedCategoryFilter]);

  const activeModuleLink: ThemeModuleLink = useMemo(() => {
    const exact = visibleConnections.find((m) => m.moduleId === selectedModuleId);
    if (exact) return exact;
    return visibleConnections[0] || activeTheme.moduleConnections[0];
  }, [visibleConnections, selectedModuleId, activeTheme]);

  const allModulesFlat = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({
          ...m,
          pathTitle: p.title,
          examWeight: p.examWeight,
        }))
      ),
    []
  );

  const matchingModuleIds = useMemo(() => {
    if (!themeSearchQuery.trim()) return null;
    const matched = new Set<number>();
    for (const mod of allModulesFlat) {
      if (doesModuleMatchThemeSearch(mod.id, themeSearchQuery, mod.title)) {
        matched.add(mod.id);
      }
    }
    return matched;
  }, [themeSearchQuery, allModulesFlat]);

  const filteredModulesFlat = useMemo(() => {
    if (!matchingModuleIds) return allModulesFlat;
    return allModulesFlat.filter((m) => matchingModuleIds.has(m.id));
  }, [allModulesFlat, matchingModuleIds]);

  const handleSelectTheme = (theme: AzureThemeThread) => {
    setSelectedThemeId(theme.id);
    setSelectedCategoryFilter('All');
    setSelectedModuleId(theme.moduleConnections[0].moduleId);
  };

  const handleSelectCategoryFilter = (cat: ServiceCategoryKey | 'All') => {
    setSelectedCategoryFilter(cat);
    const matching =
      cat === 'All'
        ? activeTheme.moduleConnections
        : activeTheme.moduleConnections.filter((m) => m.serviceCategory === cat);
    if (matching.length > 0 && !matching.some((m) => m.moduleId === selectedModuleId)) {
      setSelectedModuleId(matching[0].moduleId);
    }
  };

  const handleSelectQuizOption = (quizId: string, optionIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [quizId]: optionIdx }));
  };

  const handleResetThemeQuizzes = () => {
    setQuizAnswers((prev) => {
      const next = { ...prev };
      activeTheme.bridgeQuizzes.forEach((q) => {
        delete next[q.id];
      });
      return next;
    });
  };

  const getModuleMasteryPct = (modId: number): number | null => {
    const m = stats.moduleMastery?.[modId];
    if (!m || m.total === 0) return null;
    return Math.round((m.correct / m.total) * 100);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Editorial Section Header */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>AZ-900 Conceptual Continuity</span>
              <span aria-hidden="true">·</span>
              <span>6 Woven Architecture Theories</span>
              <span aria-hidden="true">·</span>
              <span>Paths 1, 2 &amp; 3 Across All 12 Modules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
              Azure Themes: Interconnecting Threads Across All 12 Modules
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Trace how core foundations from Learning Path 1 &amp; 2—such as vertical vs. horizontal scaling, shared responsibility, and blast-radius isolation—carry directly into Azure Compute, Networking, Storage, Cost, Governance, and Exam Synthesis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Mode Switcher: Thread Overview vs Deep-Dive Scaling Mapper */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Azure Themes View Mode"
            >
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  viewMode === 'overview'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                <span>Thread Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('deep-dive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  viewMode === 'deep-dive'
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Deep-Dive Mode</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Active Thread Coverage
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {activeTheme.moduleConnections.length} of 12 Modules
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Service Sub-Areas
                </div>
                <div className="text-sm font-bold text-[#0078D4] dark:text-sky-400 mt-0.5">
                  {activeTheme.serviceCategoriesCarried.length} Categories
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Level Search Bar: Filter 12 Modules by Theme Keywords or Azure Service Types */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={themeSearchQuery}
                onChange={(e) => setThemeSearchQuery(e.target.value)}
                placeholder="Search 12 modules by theme keyword or Azure service (e.g., VMSS, ExpressRoute, Entra ID, Blob, FinOps, Policy)..."
                aria-label="Filter the 12 modules by theme keywords or service types"
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078D4]/30 focus:border-[#0078D4]"
              />
              {themeSearchQuery && (
                <button
                  type="button"
                  onClick={() => setThemeSearchQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label="Clear theme search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-xs tabular-nums">
              <span className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
                {filteredModulesFlat.length} / 12 Modules
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400 mr-0.5">
              Quick Filter:
            </span>
            {['VMSS', 'Horizontal', 'ExpressRoute', 'Storage', 'Entra ID', 'FinOps', 'Arc'].map(
              (preset) => {
                const isActive =
                  themeSearchQuery.trim().toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setThemeSearchQuery(isActive ? '' : preset)}
                    className={`px-2 py-0.5 rounded-md border font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0078D4] text-white border-[#0078D4]'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0078D4]'
                    }`}
                  >
                    {preset}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Theme Selector Grid (Shown in Overview Mode) */}
        {viewMode === 'overview' && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
            role="tablist"
            aria-label="Azure Conceptual Themes"
          >
            {AZURE_THEME_THREADS.map((theme) => {
              const isSelected = theme.id === activeTheme.id;
              const matchedModulesInTheme = matchingModuleIds
                ? theme.moduleConnections.filter((c) => matchingModuleIds.has(c.moduleId)).length
                : theme.moduleConnections.length;

              return (
                <button
                  key={theme.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectTheme(theme)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 focus-visible:outline-2 focus-visible:outline-[#0078D4] ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-sky-950/90 text-white border-slate-900 dark:border-sky-500 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
                  } ${matchingModuleIds && matchedModulesInTheme === 0 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                    <span
                      className={
                        isSelected ? 'text-sky-300' : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {theme.numberLabel}
                    </span>
                    <span
                      className={`tabular-nums ${
                        isSelected ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {matchingModuleIds
                        ? `${matchedModulesInTheme}/${theme.moduleConnections.length} match`
                        : `${theme.moduleConnections.length} modules`}
                    </span>
                  </div>
                  <div className="font-bold text-sm leading-snug">{theme.shortTitle}</div>
                  <div
                    className={`text-xs line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {theme.serviceCategoriesCarried.slice(0, 4).join(' · ')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {viewMode === 'deep-dive' ? (
        <AzureThemesDeepDive
          stats={stats}
          initialModuleId={initialModuleId ?? selectedModuleId}
          searchQuery={themeSearchQuery}
          onClearSearch={() => setThemeSearchQuery('')}
          onPracticeModule={onPracticeModule}
        />
      ) : (
        <>

      {/* Active Theme Core Theory & Interactive 12-Module Continuum */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Core Theory & Exam Payoff Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] dark:text-sky-400">
              <GitBranch className="w-4 h-4 shrink-0" />
              <span>{activeTheme.numberLabel} · Core Interconnecting Theory</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 text-balance">
              {activeTheme.title}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeTheme.coreTheory}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
              Origin Anchor: {activeTheme.originSummary}
            </p>
          </div>

          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Compass className="w-4 h-4 text-[#0078D4] dark:text-sky-400 shrink-0" />
              <span>Why This Thread Wins Exam Questions</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeTheme.examPayoffSummary}
            </p>
            {activeTheme.id === 'scaling-elasticity' && (
              <button
                type="button"
                onClick={() => setViewMode('deep-dive')}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Open Compute · Network · Storage Deep-Dive Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Theme Mastery Progress Timeline */}
        <ThemeMasteryTimeline
          theme={activeTheme}
          stats={stats}
          selectedModuleId={activeModuleLink.moduleId}
          matchingModuleIds={matchingModuleIds}
          onSelectModule={(modId) => {
            setSelectedCategoryFilter('All');
            setSelectedModuleId(modId);
          }}
          onPracticeModule={onPracticeModule}
        />

        {/* Explicit Horizontal vs. Vertical Scaling Interactive 12-Module Visual Map */}
        {activeTheme.id === 'scaling-elasticity' && (
          <ScalingArchitectureDiagram
            selectedModuleId={activeModuleLink.moduleId}
            connectedModuleIds={activeTheme.moduleConnections.map((c) => c.moduleId)}
            onSelectModule={(modId) => {
              setSelectedCategoryFilter('All');
              setSelectedModuleId(modId);
            }}
          />
        )}

        {/* Interactive Service Category Filter */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
              <span>Filter Thread by Azure Service Category:</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Showing {visibleConnections.length} module link
              {visibleConnections.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategoryFilter === 'All'
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {activeTheme.serviceCategoriesCarried.map((cat) => {
              const isActive = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0078D4] text-white border-[#0078D4]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 12-Module Thread Continuum Selector */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Select any connected module below to inspect how earlier Path 1/2 ideas continue into that module:
          </div>
          {filteredModulesFlat.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                No modules matched &ldquo;{themeSearchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setThemeSearchQuery('')}
                className="px-3 py-1.5 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredModulesFlat.map((mod) => {
                const linkMatch = visibleConnections.find((c) => c.moduleId === mod.id);
                const isSelected = activeModuleLink.moduleId === mod.id;
                const masteryPct = getModuleMasteryPct(mod.id);

              return (
                <button
                  key={mod.id}
                  type="button"
                  disabled={!linkMatch}
                  onClick={() => linkMatch && setSelectedModuleId(mod.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                    !linkMatch
                      ? 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60 opacity-45 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-sm cursor-pointer'
                      : 'bg-white dark:bg-slate-800/70 hover:border-[#0078D4] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span className={isSelected ? 'text-sky-100 font-bold' : 'text-slate-500 dark:text-slate-400 font-bold'}>
                      M{mod.id} · P{mod.pathId}
                    </span>
                    {masteryPct !== null && (
                      <span
                        className={`font-bold ${
                          isSelected
                            ? 'text-amber-200'
                            : masteryPct >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {masteryPct}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold leading-tight line-clamp-2">
                    {mod.title}
                  </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {linkMatch ? linkMatch.serviceCategory : 'Outside active filter'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Two-Zone Detail Stage: Module Bridge Inspector + Thread Recall Check */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* Left Zone (7 Cols): Deep-Dive Bridge Card */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Module {activeModuleLink.moduleId}</span>
                  <span aria-hidden="true">·</span>
                  <span>Learning Path {activeModuleLink.pathId}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeModuleLink.serviceCategory}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[#0078D4] dark:text-sky-400">
                    {activeModuleLink.roleInThread}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
                  {activeModuleLink.moduleTitle}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPracticeModule(activeModuleLink.moduleId)}
                  className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Practice Module {activeModuleLink.moduleId}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recall From Earlier */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                What You Learned Earlier (Thread Continuity)
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeModuleLink.earlierRecallPrompt}
              </p>
            </div>

            {/* Service Application */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                How {activeModuleLink.serviceCategory} Carries This Theme
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeModuleLink.serviceApplication}
              </p>
              <div className="pt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Azure Services Connected:{' '}
                </span>
                {activeModuleLink.azureServices.join(' · ')}
              </div>
            </div>

            {/* Exam Trap Guard */}
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>AZ-900 Exam Trap &amp; Discrimination Rule</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100/90 leading-relaxed">
                {activeModuleLink.examTrapGuard}
              </p>
            </div>

            {/* Secondary Cross-Tab Study Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onOpenStudyDecksModule && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenStudyDecksModule(activeModuleLink.moduleId, activeModuleLink.pathId)
                  }
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                  <span>Open M{activeModuleLink.moduleId} Study Deck</span>
                </button>
              )}
              {onOpenImageTutor && (
                <button
                  type="button"
                  onClick={onOpenImageTutor}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                  <span>Inspect Diagram in Image Tutor</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Zone (5 Cols): Interactive Thread Bridge Check */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Check Your Thread Intuition
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect earlier Path 1/2 concepts directly to service decisions
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetThemeQuizzes}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset thread questions"
                aria-label="Reset thread questions"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {activeTheme.bridgeQuizzes.map((quiz, qIdx) => {
                const selectedIdx = quizAnswers[quiz.id];
                const hasAnswered = selectedIdx !== undefined;
                const isCorrect = hasAnswered && selectedIdx === quiz.correctIndex;

                return (
                  <div
                    key={quiz.id}
                    className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0"
                  >
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {qIdx + 1}. {quiz.prompt}
                    </p>

                    <div className="space-y-1.5">
                      {quiz.options.map((opt, idx) => {
                        const isPicked = selectedIdx === idx;
                        const isRightOpt = idx === quiz.correctIndex;

                        let btnClass =
                          'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#0078D4]';
                        if (hasAnswered) {
                          if (isRightOpt) {
                            btnClass =
                              'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-950 dark:text-emerald-100 font-semibold';
                          } else if (isPicked) {
                            btnClass =
                              'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-100';
                          } else {
                            btnClass =
                              'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectQuizOption(quiz.id, idx)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs leading-relaxed flex items-start justify-between gap-2 transition-colors cursor-pointer ${btnClass}`}
                          >
                            <span>{opt}</span>
                            {hasAnswered && isRightOpt && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            {hasAnswered && isPicked && !isRightOpt && (
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {hasAnswered && (
                      <div
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          isCorrect
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                            : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                        }`}
                      >
                        <strong className="block font-bold mb-0.5">
                          {isCorrect ? 'Thread Connection Verified' : 'Cross-Module Thread Insight'}
                        </strong>
                        {quiz.threadInsight}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Complete 12-Module Woven Coverage Reference Table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              12-Module Woven Thread Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any active thread cell to jump directly to how that earlier theory applies inside that module.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            12 Modules · 6 Themes
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                <th className="py-3 px-3.5 whitespace-nowrap">AZ-900 Module</th>
                {AZURE_THEME_THREADS.map((theme) => (
                  <th key={theme.id} className="py-3 px-2.5 text-center whitespace-nowrap">
                    {theme.numberLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredModulesFlat.length === 0 ? (
                <tr>
                  <td
                    colSpan={1 + AZURE_THEME_THREADS.length}
                    className="py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No modules match &ldquo;{themeSearchQuery}&rdquo;. Clear the search bar above to inspect all 12 modules.
                  </td>
                </tr>
              ) : (
                filteredModulesFlat.map((mod) => (
                <tr
                  key={mod.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      M{mod.id}: {mod.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Path {mod.pathId} · {mod.examWeight}
                    </div>
                  </td>

                  {AZURE_THEME_THREADS.map((theme) => {
                    const connection = theme.moduleConnections.find(
                      (c) => c.moduleId === mod.id
                    );
                    const isCurrentCell =
                      theme.id === activeTheme.id && activeModuleLink.moduleId === mod.id;

                    return (
                      <td key={`${mod.id}-${theme.id}`} className="py-2.5 px-2 text-center">
                        {connection ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedThemeId(theme.id);
                              setSelectedCategoryFilter('All');
                              setSelectedModuleId(mod.id);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                              isCurrentCell
                                ? 'bg-[#0078D4] text-white border-[#0078D4]'
                                : connection.roleInThread === 'Origin Anchor'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:border-[#0078D4]'
                                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800 hover:border-[#0078D4]'
                            }`}
                            title={`${theme.shortTitle} in M${mod.id}: ${connection.serviceCategory}`}
                          >
                            {connection.roleInThread === 'Origin Anchor'
                              ? 'Origin'
                              : connection.serviceCategory.split(' ')[0]}
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </section>
        </>
      )}
    </div>
  );
};
