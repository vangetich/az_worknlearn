import React, { useMemo, useState, useEffect } from 'react';
import {
  Network,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  BookOpen,
  HelpCircle,
  GitBranch,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Lightbulb,
  Play,
  Sparkles,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import {
  AZURE_CONCEPT_SERVICES,
  AzureConceptServiceNode,
  ConceptServiceCategory,
  resolveServiceConceptNode,
} from '../data/azureConceptMapData';
import { THREAD_TAG_META } from '../data/azureThemesData';

interface AzureConceptMapViewProps {
  stats: UserStats;
  questions?: Question[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onPracticeModule: (moduleId: number) => void;
  onPracticeQuestion?: (questionId: string, moduleId: number) => void;
  onOpenStudyDecksModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onInspectTheme: (themeId: string, moduleId?: number) => void;
}

const CATEGORY_ORDER: Array<ConceptServiceCategory | 'All'> = [
  'All',
  'Storage',
  'Compute',
  'Networking',
  'Identity & Security',
  'Governance & Compliance',
  'Cost & FinOps',
  'Deployment & Monitoring',
];

const CATEGORY_BADGE_STYLES: Record<ConceptServiceCategory, string> = {
  Storage:
    'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
  Compute:
    'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800',
  Networking:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
  'Identity & Security':
    'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800',
  'Governance & Compliance':
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
  'Cost & FinOps':
    'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800',
  'Deployment & Monitoring':
    'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-800',
};

const DEFAULT_SERVICE_ID = 'azure-blob-storage';

export const AzureConceptMapView: React.FC<AzureConceptMapViewProps> = ({
  stats,
  questions = [],
  searchQuery = '',
  onClearSearch,
  onPracticeModule,
  onPracticeQuestion,
  onOpenStudyDecksModule,
  onInspectTheme,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(DEFAULT_SERVICE_ID);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ConceptServiceCategory | 'All'>('All');
  const [inspectorTab, setInspectorTab] = useState<
    'all' | 'questions' | 'modules' | 'threads'
  >('all');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredServices = useMemo(() => {
    return AZURE_CONCEPT_SERVICES.filter((svc) => {
      if (selectedCategory !== 'All' && svc.category !== selectedCategory) {
        return false;
      }
      if (!normalizedSearch) return true;

      const haystack = [
        svc.name,
        svc.shortLabel,
        svc.category,
        svc.summary,
        svc.examRule,
        ...svc.matchKeywords,
        ...svc.threadTags,
        ...svc.relatedModuleIds.map((id) => `m${id} module ${id}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [selectedCategory, normalizedSearch]);

  // If the top-level search narrows services and the current node isn't in it, jump to the top match
  useEffect(() => {
    if (
      normalizedSearch &&
      filteredServices.length > 0 &&
      !filteredServices.some((s) => s.id === selectedServiceId)
    ) {
      setSelectedServiceId(filteredServices[0].id);
      setExpandedQuestionIds({});
      setShowAllQuestions(false);
    }
  }, [normalizedSearch, filteredServices, selectedServiceId]);

  const resolvedNode = useMemo(
    () => resolveServiceConceptNode(selectedServiceId, stats, questions),
    [selectedServiceId, stats, questions]
  );

  // Precompute question counts for all services so the service directory chips display live totals
  const serviceQuestionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const svc of AZURE_CONCEPT_SERVICES) {
      counts[svc.id] = resolveServiceConceptNode(svc.id, stats, questions).relatedQuestions.length;
    }
    return counts;
  }, [stats, questions]);

  const handleSelectService = (nextId: string, pushHistory = true) => {
    if (nextId === selectedServiceId) return;
    if (pushHistory) {
      setNavigationHistory((prev) => [...prev.slice(-9), selectedServiceId]);
    }
    setSelectedServiceId(nextId);
    setExpandedQuestionIds({});
    setShowAllQuestions(false);
  };

  const handleGoBack = () => {
    if (navigationHistory.length === 0) return;
    const prevId = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory((prev) => prev.slice(0, -1));
    setSelectedServiceId(prevId);
    setExpandedQuestionIds({});
    setShowAllQuestions(false);
  };

  const toggleQuestionReveal = (questionId: string) => {
    setExpandedQuestionIds((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const { service, relatedQuestions, relatedModules, relatedThreads, connectedServices } =
    resolvedNode;

  const visibleQuestions = showAllQuestions ? relatedQuestions : relatedQuestions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Service Directory & Category Filter */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] dark:text-sky-400">
              <Network className="w-4 h-4 shrink-0" />
              <span>Interactive Azure Concept Map · {AZURE_CONCEPT_SERVICES.length} Core Services</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">
              Select an Azure Service to Explore Connected Questions, Modules &amp; Threads
            </h2>
          </div>

          {navigationHistory.length > 0 && (
            <button
              type="button"
              onClick={handleGoBack}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Node</span>
            </button>
          )}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Service Category Filter">
          {CATEGORY_ORDER.map((cat) => {
            const count =
              cat === 'All'
                ? AZURE_CONCEPT_SERVICES.length
                : AZURE_CONCEPT_SERVICES.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-600'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0078D4]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] tabular-nums ${
                    isSelected ? 'text-sky-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clickable Service Nodes Grid */}
        {filteredServices.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No Azure services matched &ldquo;{searchQuery}&rdquo; in this category.
            </p>
            <div className="flex items-center justify-center gap-2">
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
              {onClearSearch && normalizedSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-3 py-1.5 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {filteredServices.map((svc: AzureConceptServiceNode) => {
              const isSelected = svc.id === service.id;
              const qCount = serviceQuestionCounts[svc.id] ?? 0;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => handleSelectService(svc.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 focus-visible:outline-2 focus-visible:outline-[#0078D4] ${
                    isSelected
                      ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-sm'
                      : 'bg-slate-50/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-semibold">
                    <span
                      className={`truncate ${
                        isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {svc.category}
                    </span>
                    <span
                      className={`tabular-nums shrink-0 ${
                        isSelected ? 'text-amber-200' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {qCount}Q
                    </span>
                  </div>
                  <div className="text-xs font-bold leading-snug line-clamp-2">
                    {svc.shortLabel}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Radial Hub-and-Spoke Topology Canvas */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-md border text-[11px] font-bold ${CATEGORY_BADGE_STYLES[service.category]}`}
            >
              {service.category}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
              {service.name}
            </h3>
          </div>
          <a
            href={service.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0078D4] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>MS Learn Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Desktop Visual Topology Canvas (SVG connectors + HTML interactive nodes) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 p-4 sm:p-5 space-y-4">
          <div className="relative lg:h-[360px]">
            {/* SVG Connector Lines (Desktop lg+) */}
            <svg
              viewBox="0 0 1000 360"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Left Threads -> Center Service Hub */}
              {relatedThreads.map((tLink, idx) => {
                const count = Math.max(1, relatedThreads.length);
                const startY = ((idx + 0.5) / count) * 360;
                return (
                  <path
                    key={`edge-thread-${tLink.tagId}`}
                    d={`M 242 ${startY} C 288 ${startY}, 292 180, 336 180`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    vectorEffect="non-scaling-stroke"
                    className="text-sky-500/55 dark:text-sky-400/50"
                  />
                );
              })}

              {/* Center Service Hub -> Right Connected Neighbor Services */}
              {connectedServices.map((neighbor, idx) => {
                const count = Math.max(1, connectedServices.length);
                const endY = ((idx + 0.5) / count) * 360;
                return (
                  <path
                    key={`edge-neighbor-${neighbor.service.id}`}
                    d={`M 664 180 C 708 180, 712 ${endY}, 758 ${endY}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    className="text-indigo-500/55 dark:text-indigo-400/50"
                  />
                );
              })}
            </svg>

            {/* 3-Column Interactive Graph Layout */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 h-full items-stretch">
              {/* LEFT COLUMN: Interconnecting Threads */}
              <div className="lg:col-span-3 flex flex-col justify-between gap-2.5 lg:h-full">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 lg:sr-only">
                  Interconnecting Threads
                </div>
                {relatedThreads.map((tLink) => {
                  const meta = THREAD_TAG_META[tLink.tagId];
                  return (
                    <div
                      key={tLink.tagId}
                      className="flex-1 flex items-center"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onInspectTheme(tLink.theme.id, relatedModules[0]?.moduleId)
                        }
                        className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#0078D4] dark:hover:border-sky-500 shadow-2xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#0078D4] dark:group-hover:text-sky-400 inline-flex items-center gap-0.5">
                            Thread <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {tLink.theme.shortTitle}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* CENTER HUB: Selected Azure Service */}
              <div className="lg:col-span-6 flex items-center justify-center lg:px-10">
                <div className="w-full max-w-md rounded-2xl bg-slate-900 dark:bg-slate-900 border-2 border-[#0078D4] dark:border-sky-500 text-white p-5 shadow-md space-y-3.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-sky-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Active Concept Hub
                    </span>
                    <span className="tabular-nums text-slate-300">
                      {service.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white leading-snug">
                      {service.name}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                      {service.summary}
                    </p>
                  </div>

                  {/* Key Graph Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-1 tabular-nums">
                    <button
                      type="button"
                      onClick={() => setInspectorTab('questions')}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-medium text-sky-200">Questions</div>
                      <div className="text-base font-bold text-white">
                        {relatedQuestions.length}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('modules')}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-medium text-sky-200">Modules</div>
                      <div className="text-base font-bold text-white">
                        {relatedModules.length}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('threads')}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-medium text-sky-200">Threads</div>
                      <div className="text-base font-bold text-white">
                        {relatedThreads.length}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Connected Azure Services (Click to Traverse) */}
              <div className="lg:col-span-3 flex flex-col justify-between gap-2.5 lg:h-full">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 lg:sr-only">
                  Connected Azure Services (Click to Traverse)
                </div>
                {connectedServices.map(({ service: neighbor, relationship }) => (
                  <div
                    key={neighbor.id}
                    className="flex-1 flex items-center"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectService(neighbor.id)}
                      className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-2xs transition-all cursor-pointer group"
                    >
                      <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mb-0.5">
                        {relationship}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0078D4] dark:group-hover:text-sky-400 line-clamp-1">
                          {neighbor.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0078D4] dark:group-hover:text-sky-400 shrink-0" />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Linked Modules Ribbon */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                Connected Curriculum Modules ({relatedModules.length})
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any module node to jump into focused practice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
              {relatedModules.map((mod) => (
                <button
                  key={mod.moduleId}
                  type="button"
                  onClick={() => onPracticeModule(mod.moduleId)}
                  className="text-left p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#0078D4] dark:hover:border-sky-400 transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold tabular-nums">
                    <span className="text-[#0078D4] dark:text-sky-400">
                      M{mod.moduleId} · P{mod.pathId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        mod.accuracyPct !== null
                          ? mod.accuracyPct >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {mod.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      {mod.accuracyPct !== null ? `${mod.accuracyPct}%` : 'New'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                    {mod.moduleTitle}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AZ-900 Exam Rule Callout */}
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed">
            <span className="font-bold">AZ-900 Exam Rule: </span>
            {service.examRule}
          </div>
        </div>
      </section>

      {/* Detailed Service Inspector: Questions, Study Modules & Interconnecting Threads */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {service.shortLabel} Study &amp; Assessment Inspector
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect every exam question, study module context, and architectural thread mapped to {service.name}.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            role="tablist"
            aria-label="Service Concept Inspector Sections"
          >
            {(
              [
                { id: 'all', label: 'All Connected', count: null },
                { id: 'questions', label: 'Quiz Questions', count: relatedQuestions.length },
                { id: 'modules', label: 'Study Modules', count: relatedModules.length },
                { id: 'threads', label: 'Threads', count: relatedThreads.length },
              ] as const
            ).map((tab) => {
              const isSelected = inspectorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setInspectorTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. RELATED QUIZ QUESTIONS */}
        {(inspectorTab === 'all' || inspectorTab === 'questions') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0078D4] dark:text-sky-400" />
                <span>Related Quiz Questions ({relatedQuestions.length})</span>
              </h4>
              {relatedQuestions.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllQuestions((v) => !v)}
                  className="text-xs font-bold text-[#0078D4] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {showAllQuestions
                    ? 'Show Top 6'
                    : `Show All ${relatedQuestions.length} Questions`}
                </button>
              )}
            </div>

            {relatedQuestions.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                No exact question keyword matches found in the active bank—launch any related module below to generate AI practice questions for {service.shortLabel}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleQuestions.map((q) => {
                  const isExpanded = !!expandedQuestionIds[q.id];
                  const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
                  return (
                    <article
                      key={q.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                          <span className="text-[#0078D4] dark:text-sky-400 truncate">
                            Module {q.moduleId} · {q.moduleTitle}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            {q.difficulty}
                          </span>
                        </div>
                        {q.scenario && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {q.scenario}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {q.question}
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5 text-xs">
                          <div className="font-bold text-emerald-700 dark:text-emerald-300">
                            Answer ({q.correctAnswer}): {correctOpt?.text}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {q.whyCorrect}
                          </p>
                          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            Exam Tip: {q.examTip}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={() => toggleQuestionReveal(q.id)}
                          className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Hide Answer</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Show Solution &amp; Tip</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onPracticeQuestion
                              ? onPracticeQuestion(q.id, q.moduleId)
                              : onPracticeModule(q.moduleId)
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#0066B5] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Play className="w-3 h-3" />
                          <span>Practice Question</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. RELATED STUDY MODULES */}
        {(inspectorTab === 'all' || inspectorTab === 'modules') && (
          <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0078D4] dark:text-sky-400" />
              <span>Related Study Modules ({relatedModules.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedModules.map((mod) => (
                <div
                  key={mod.moduleId}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold tabular-nums">
                      <span className="text-[#0078D4] dark:text-sky-400">
                        Module {mod.moduleId} · Path {mod.pathId}
                      </span>
                      <span
                        className={
                          mod.accuracyPct !== null
                            ? mod.accuracyPct >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }
                      >
                        {mod.accuracyPct !== null
                          ? `${mod.accuracyPct}% (${mod.attemptedCount}Q)`
                          : 'Unattempted'}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {mod.moduleTitle}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {mod.serviceApplication}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                    <button
                      type="button"
                      onClick={() => onPracticeModule(mod.moduleId)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#0066B5] text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>Practice M{mod.moduleId}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {onOpenStudyDecksModule && (
                      <button
                        type="button"
                        onClick={() => onOpenStudyDecksModule(mod.moduleId, mod.pathId)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#0078D4] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                      >
                        Study Deck
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. INTERCONNECTING THREADS */}
        {(inspectorTab === 'all' || inspectorTab === 'threads') && (
          <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#0078D4] dark:text-sky-400" />
              <span>Interconnecting Conceptual Threads ({relatedThreads.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedThreads.map((tLink) => {
                const meta = THREAD_TAG_META[tLink.tagId];
                return (
                  <div
                    key={tLink.tagId}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {tLink.theme.numberLabel}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {tLink.theme.title}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {tLink.roleSummary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onInspectTheme(tLink.theme.id, relatedModules[0]?.moduleId)
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Inspect Full Thread</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
