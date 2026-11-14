import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Map,
  CheckCircle2,
  Sparkles,
  Check,
  Minimize2,
  Maximize2,
  Play,
  Clock,
  RefreshCw,
  TrendingUp,
  Network,
  Link2,
  ArrowRight,
  X,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';

interface AzureServiceCluster {
  id: string;
  title: string;
  shortLabel: string;
  accentHex: string;
  moduleIds: number[];
  connectedServices: Array<{
    service: string;
    moduleId: number;
    role: string;
  }>;
  masteryInsight: string;
}

const AZURE_SERVICE_CLUSTERS: AzureServiceCluster[] = [
  {
    id: 'resilience',
    title: 'Global Resilience & High Availability',
    shortLabel: 'Availability & Redundancy',
    accentHex: '#0078D4',
    moduleIds: [2, 4, 6],
    connectedServices: [
      { service: 'High Availability & DR', moduleId: 2, role: 'Resiliency goal' },
      { service: 'Availability Zones', moduleId: 4, role: 'Zone isolation' },
      { service: 'Region Pairs', moduleId: 4, role: 'Geo disaster recovery' },
      { service: 'ZRS / GRS / GZRS', moduleId: 6, role: 'Storage replication' },
    ],
    masteryInsight:
      'Study M2, M4, and M6 together: Availability Zones (M4) isolate datacenter failures, ZRS mirrors storage across those zones (M6), and Region Pairs + GRS execute geo-disaster recovery (M2).',
  },
  {
    id: 'identity-governance',
    title: 'Zero Trust Identity, Access & Guardrails',
    shortLabel: 'Identity & Governance',
    accentHex: '#C2410C',
    moduleIds: [1, 7, 9],
    connectedServices: [
      { service: 'Shared Responsibility', moduleId: 1, role: 'Customer owns Identity' },
      { service: 'Microsoft Entra ID', moduleId: 7, role: 'Authentication (AuthN)' },
      { service: 'Azure RBAC', moduleId: 7, role: 'User Authorization' },
      { service: 'Azure Policy & Locks', moduleId: 9, role: 'Resource guardrails' },
    ],
    masteryInsight:
      'Study M1, M7, and M9 together: Customers always own Identity & Data (M1); Entra ID verifies who you are (M7), RBAC grants role permissions (M7), while Policy & Resource Locks override even Owner rights (M9).',
  },
  {
    id: 'hybrid-network',
    title: 'Hybrid Cloud & Private Connectivity',
    shortLabel: 'Hybrid & Networking',
    accentHex: '#0284c7',
    moduleIds: [1, 5, 10],
    connectedServices: [
      { service: 'Hybrid & Multi-Cloud', moduleId: 1, role: 'Deployment topology' },
      { service: 'VNet & Peering', moduleId: 5, role: 'Private Azure mesh' },
      { service: 'VPN vs. ExpressRoute', moduleId: 5, role: 'On-prem tunnel / fiber' },
      { service: 'Azure Arc', moduleId: 10, role: 'Single control plane' },
    ],
    masteryInsight:
      'Study M1, M5, and M10 together: Hybrid deployment boundaries (M1) connect to Azure VNets over public VPN or dedicated ExpressRoute fiber (M5) and unify under Azure Arc governance (M10).',
  },
  {
    id: 'finops-elasticity',
    title: 'FinOps, Elasticity & Cost Control',
    shortLabel: 'Pricing & Cost Control',
    accentHex: '#D97706',
    moduleIds: [3, 5, 8, 11],
    connectedServices: [
      { service: 'CapEx vs. OpEx', moduleId: 3, role: 'Consumption model' },
      { service: 'VM Scale Sets (VMSS)', moduleId: 5, role: 'Elastic compute' },
      { service: 'Pricing & TCO Calculators', moduleId: 8, role: 'Cost planning & budgets' },
      { service: 'Azure Advisor', moduleId: 11, role: 'Right-sizing tips' },
    ],
    masteryInsight:
      'Study M3, M5, M8, and M11 together: OpEx billing (M3) scales dynamically via VMSS (M5), is forecasted/tracked in Cost Management & TCO (M8), and continuously trimmed by Azure Advisor (M11).',
  },
  {
    id: 'observability-ops',
    title: 'Lifecycle Deployment & Observability',
    shortLabel: 'Deploy & Monitor',
    accentHex: '#059669',
    moduleIds: [4, 9, 10, 11],
    connectedServices: [
      { service: 'Resource Groups', moduleId: 4, role: 'Lifecycle container' },
      { service: 'ARM Templates & Bicep', moduleId: 10, role: 'Declarative IaC' },
      { service: 'Purview & Initiatives', moduleId: 9, role: 'Compliance audit' },
      { service: 'Monitor & Service Health', moduleId: 11, role: 'Telemetry & outages' },
    ],
    masteryInsight:
      'Study M4, M9, M10, and M11 together: Declarative Bicep/ARM templates (M10) deploy into Resource Groups (M4) governed by Policy Initiatives (M9) and observed through Azure Monitor & Service Health (M11).',
  },
];
import { KitengeRibbon } from './MotifDecorations';
import {
  computeBaselinePaceProjection,
  fetchAiStudyPaceProjection,
  StudyPaceProjectionResult,
} from '../utils/studyPaceProjector';

interface LearningPathProgressMapProps {
  stats: UserStats;
  selectedPathId?: number | 'all';
  selectedModuleId?: number | 'all';
  onSelectModule: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onToggleModuleComplete?: (moduleId: number) => void;
  questionCountByModule?: Record<number, number>;
  defaultExpanded?: boolean;
}

export const LearningPathProgressMap: React.FC<LearningPathProgressMapProps> = ({
  stats,
  selectedPathId = 'all',
  selectedModuleId = 'all',
  onSelectModule,
  onToggleModuleComplete,
  questionCountByModule = {},
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [isServiceFocusOpen, setIsServiceFocusOpen] = useState<boolean>(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string>(AZURE_SERVICE_CLUSTERS[0].id);
  const [activePathFilter, setActivePathFilter] = useState<1 | 2 | 3 | 'all'>(
    selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3
      ? selectedPathId
      : 'all'
  );

  const activeServiceCluster = useMemo(
    () =>
      AZURE_SERVICE_CLUSTERS.find((c) => c.id === selectedClusterId) ||
      AZURE_SERVICE_CLUSTERS[0],
    [selectedClusterId]
  );

  const completedModules = stats.completedModules || [];

  const baselineProjection = useMemo(
    () => computeBaselinePaceProjection(stats, questionCountByModule),
    [stats, questionCountByModule]
  );

  const [aiProjection, setAiProjection] = useState<StudyPaceProjectionResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeProjection =
    aiProjection && aiProjection.signature === baselineProjection.signature
      ? aiProjection
      : baselineProjection;

  const runAiProjection = useCallback(
    async (forceRefresh = false) => {
      setIsLoadingAi(true);
      setAiError(null);
      try {
        const result = await fetchAiStudyPaceProjection(baselineProjection, forceRefresh);
        setAiProjection(result);
      } catch (err: any) {
        setAiError(
          err?.message || 'Unable to reach AI pace service — showing local session pace.'
        );
      } finally {
        setIsLoadingAi(false);
      }
    },
    [baselineProjection]
  );

  // Automatically fetch cached or fresh AI projections when expanded and signature changes
  useEffect(() => {
    if (!isExpanded) return;
    if (aiProjection && aiProjection.signature === baselineProjection.signature) return;

    let cancelled = false;
    (async () => {
      setIsLoadingAi(true);
      setAiError(null);
      try {
        const result = await fetchAiStudyPaceProjection(baselineProjection, false);
        if (!cancelled) {
          setAiProjection(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setAiError(
            err?.message || 'Unable to reach AI pace service — showing local session pace.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAi(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isExpanded, baselineProjection, aiProjection]);

  const allModules = useMemo(
    () =>
      LEARNING_PATHS.flatMap((path) =>
        path.modules.map((mod, idx) => ({
          ...mod,
          pathTitle: path.title,
          pathWeight: path.examWeight,
          accentColor: path.accentColor,
          stepInPath: idx + 1,
        }))
      ),
    []
  );

  const completedCount = completedModules.filter((id) =>
    allModules.some((m) => m.id === id)
  ).length;
  const overallPct =
    allModules.length > 0
      ? Math.round((completedCount / allModules.length) * 100)
      : 0;

  const displayedPaths = useMemo(() => {
    if (activePathFilter === 'all') return LEARNING_PATHS;
    return LEARNING_PATHS.filter((p) => p.id === activePathFilter);
  }, [activePathFilter]);

  return (
    <section
      aria-label="AZ-900 Learning Path Progress Map"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/90 dark:border-slate-800 card-elevation overflow-hidden shadow-xs"
    >
      <KitengeRibbon height={3} />

      {/* Compact Header Bar */}
      <div className="px-3.5 sm:px-5 py-3 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/15 border border-white/20 text-sky-200 shrink-0">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
                Learning Path Progress Map
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 tabular-nums">
                {completedCount}/{allModules.length} Modules ({overallPct}%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/25 text-sky-100 border border-sky-300/30 inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>~{activeProjection.paceSummary.totalHoursRemaining.toFixed(1)} hrs left</span>
              </span>
            </div>
            <p className="text-[11px] text-sky-100/80 hidden sm:block">
              Interactive curriculum map with AI-driven study hours remaining based on your past session pace.
            </p>
          </div>
        </div>

        {/* Path Filter Pills + Collapse Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          <div className="flex items-center bg-slate-950/45 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setActivePathFilter('all');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activePathFilter === 'all'
                  ? 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              All 3 Paths
            </button>
            {([1, 2, 3] as const).map((pid) => (
              <button
                key={pid}
                type="button"
                onClick={() => {
                  setActivePathFilter(pid);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activePathFilter === pid
                    ? 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                Path {pid}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const nextState = !isServiceFocusOpen;
              setIsServiceFocusOpen(nextState);
              if (nextState) {
                setIsExpanded(true);
                setActivePathFilter('all');
              }
            }}
            aria-pressed={isServiceFocusOpen}
            title="Toggle Azure Service Focus overlay to highlight cross-module Azure service connections"
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              isServiceFocusOpen
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm ring-2 ring-amber-300/50'
                : 'bg-sky-500/25 hover:bg-sky-500/40 text-white border-sky-300/40'
            }`}
          >
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span>Azure Service Focus</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3 h-3 text-sky-200" />
                <span className="hidden sm:inline">Compact</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 text-sky-200" />
                <span className="hidden sm:inline">Expand Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step-by-Step Visual Curriculum Map Body */}
      {isExpanded && (
        <div className="relative p-3.5 sm:p-5 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900 dark:to-slate-950 space-y-5">
          {/* 'AZURE SERVICE FOCUS' OVERLAY PANEL */}
          {isServiceFocusOpen && (
            <div
              role="region"
              aria-label="Azure Service Focus Overlay"
              className="relative rounded-2xl border-2 border-[#0078D4] bg-gradient-to-br from-slate-950 via-[#00284d] to-[#003c75] text-white p-4 sm:p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Overlay Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/15">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Network className="w-4 h-4 text-amber-300 shrink-0" />
                    <h4 className="text-sm sm:text-base font-black tracking-tight text-white">
                      Azure Service Focus Overlay
                    </h4>
                    <span className="text-[11px] font-bold text-sky-200">
                      · Cross-Module Service Connections
                    </span>
                  </div>
                  <p className="text-xs text-sky-100/85 leading-relaxed max-w-3xl">
                    Select an Azure service cluster below to spotlight connected modules directly on the Learning Path Map and study interrelated concepts together.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsServiceFocusOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white border border-white/15 transition-colors cursor-pointer shrink-0"
                  aria-label="Close Azure Service Focus overlay"
                  title="Close Azure Service Focus overlay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cluster Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {AZURE_SERVICE_CLUSTERS.map((cluster) => {
                  const isActive = cluster.id === activeServiceCluster.id;
                  return (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => setSelectedClusterId(cluster.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-sky-100 border-white/15'
                      }`}
                    >
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span>{cluster.shortLabel}</span>
                      <span
                        className={`text-[10px] font-black tabular-nums ${
                          isActive ? 'text-slate-900' : 'text-sky-300'
                        }`}
                      >
                        ({cluster.moduleIds.map((id) => `M${id}`).join('+')})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Connected Services Chain & Conceptual Rationale */}
              <div className="rounded-xl bg-slate-900/75 border border-sky-400/30 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-black text-amber-300">
                    {activeServiceCluster.title}
                  </span>
                  <span className="text-[11px] font-bold text-sky-200 tabular-nums">
                    Study Modules Together: {activeServiceCluster.moduleIds.map((m) => `Module ${m}`).join(' → ')}
                  </span>
                </div>

                {/* Connected Service Chain Diagram */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeServiceCluster.connectedServices.map((node, index) => {
                    const modObj = allModules.find((m) => m.id === node.moduleId);
                    const isModDone = completedModules.includes(node.moduleId);
                    return (
                      <React.Fragment key={`${node.service}-${node.moduleId}`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (modObj) {
                              onSelectModule(modObj.id, modObj.pathId as 1 | 2 | 3);
                            }
                          }}
                          className="group/node text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-[#0078D4] border border-sky-300/30 hover:border-amber-300 transition-all cursor-pointer"
                          title={`Jump to Module ${node.moduleId} Quiz: ${modObj?.title || ''}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300">
                            <span>M{node.moduleId}</span>
                            <span aria-hidden="true">·</span>
                            <span className={isModDone ? 'text-emerald-300' : 'text-sky-200'}>
                              {isModDone ? 'Completed' : node.role}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-white mt-0.5 flex items-center gap-1">
                            <span>{node.service}</span>
                            <Play className="w-2.5 h-2.5 opacity-0 group-hover/node:opacity-100 transition-opacity fill-current text-amber-300" />
                          </div>
                        </button>
                        {index < activeServiceCluster.connectedServices.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-sky-300 shrink-0 hidden sm:inline-block" aria-hidden="true" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {activeServiceCluster.masteryInsight}
                </p>
              </div>
            </div>
          )}
          {/* AI-Driven Pace & Study Hours Remaining Summary Card */}
          <div className="rounded-2xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-[#0078D4] dark:text-sky-400">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {activeProjection.aiPowered
                        ? 'AI Pace Projection'
                        : 'Session Pace Projection'}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                    ·
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeProjection.paceProfileLabel}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                    ·
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {activeProjection.paceSummary.avgSecondsPerQuestion}s/Q (
                    {activeProjection.paceSummary.questionsPerHour} Qs/hr across{' '}
                    {activeProjection.paceSummary.sessionsAnalyzed} past session
                    {activeProjection.paceSummary.sessionsAnalyzed === 1 ? '' : 's'})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeProjection.overallCoachingNote}
                </p>
                {aiError && (
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    {aiError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 tabular-nums">
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Total Study Left
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">
                    ~{activeProjection.paceSummary.totalHoursRemaining.toFixed(1)} hrs
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Daily Cadence
                  </div>
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{activeProjection.recommendedDailyMinutes} min/day</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runAiProjection(true)}
                  disabled={isLoadingAi}
                  className="px-3 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`}
                  />
                  <span>{isLoadingAi ? 'Projecting...' : 'Recalculate AI'}</span>
                </button>
              </div>
            </div>
          </div>

          {displayedPaths.map((path) => {
            const pathDoneCount = path.modules.filter((m) =>
              completedModules.includes(m.id)
            ).length;
            const pathPct = Math.round(
              (pathDoneCount / path.modules.length) * 100
            );
            const pathHoursLeft =
              activeProjection.paceSummary.pathHoursRemaining[path.id] ?? 0;

            return (
              <div
                key={path.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-2xs space-y-3.5"
              >
                {/* Path Header & Progress Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: path.accentColor }}
                    >
                      Path {path.id} • {path.examWeight}
                    </span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {path.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {pathDoneCount} of {path.modules.length} modules completed ({pathPct}%) ·{' '}
                        <strong className="text-[#0078D4] dark:text-sky-400">
                          ~{pathHoursLeft.toFixed(1)} hrs left
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:w-44">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pathPct}%`,
                          backgroundColor: path.accentColor,
                        }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                      {pathPct}%
                    </span>
                  </div>
                </div>

                {/* Connected Step-by-Step Path Graphic Nodes */}
                <div className="relative">
                  {/* Horizontal connector line on desktop */}
                  <div
                    className="hidden lg:block absolute top-7 left-8 right-8 h-1 rounded-full bg-slate-200 dark:bg-slate-800 pointer-events-none"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pathPct}%`,
                        backgroundColor: path.accentColor,
                      }}
                    />
                  </div>

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      path.modules.length === 3
                        ? 'lg:grid-cols-3'
                        : path.modules.length === 4
                        ? 'lg:grid-cols-4'
                        : 'lg:grid-cols-5'
                    } gap-3 relative z-10`}
                  >
                    {path.modules.map((mod, idx) => {
                      const isDone = completedModules.includes(mod.id);
                      const isCurrentSelected = selectedModuleId === mod.id;
                      const mastery = stats.moduleMastery?.[mod.id];
                      const accuracyPct =
                        mastery && mastery.total > 0
                          ? Math.round((mastery.correct / mastery.total) * 100)
                          : null;
                      const qCount = questionCountByModule[mod.id] || 0;
                      const modProj = activeProjection.moduleProjections[mod.id];
                      const estHrs = modProj?.estimatedHoursRemaining ?? 1.2;
                      const isConnectedInFocus =
                        isServiceFocusOpen && activeServiceCluster.moduleIds.includes(mod.id);
                      const isDimmedByFocus = isServiceFocusOpen && !isConnectedInFocus;
                      const connectedServiceNode = isConnectedInFocus
                        ? activeServiceCluster.connectedServices.find((s) => s.moduleId === mod.id)
                        : null;

                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            if (isServiceFocusOpen) {
                              const matchingCluster = AZURE_SERVICE_CLUSTERS.find((c) =>
                                c.moduleIds.includes(mod.id)
                              );
                              if (matchingCluster && !activeServiceCluster.moduleIds.includes(mod.id)) {
                                setSelectedClusterId(matchingCluster.id);
                                return;
                              }
                            }
                            onSelectModule(mod.id, path.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectModule(mod.id, path.id);
                            }
                          }}
                          title={
                            connectedServiceNode
                              ? `Connected Service Focus: ${connectedServiceNode.service} (${connectedServiceNode.role})`
                              : modProj?.rationale
                          }
                          className={`group relative rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                            isConnectedInFocus
                              ? 'bg-sky-50/95 dark:bg-sky-950/60 border-amber-400 ring-2 ring-amber-400/70 shadow-md scale-[1.01]'
                              : isCurrentSelected
                              ? 'bg-blue-50/90 dark:bg-sky-950/50 border-[#0078D4] ring-2 ring-[#0078D4]/25 shadow-sm'
                              : isDone
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/25 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300/90 dark:border-emerald-800 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 border-slate-200/90 dark:border-slate-700 hover:border-sky-300 shadow-2xs'
                          } ${isDimmedByFocus ? 'opacity-50 hover:opacity-85' : ''}`}
                        >
                          {isConnectedInFocus && connectedServiceNode && (
                            <div className="-mt-1 mb-0.5 flex items-center justify-between gap-1 text-[10px] font-black text-[#005A9E] dark:text-amber-300">
                              <span className="inline-flex items-center gap-1 truncate">
                                <Link2 className="w-3 h-3 text-amber-600 dark:text-amber-300 shrink-0" />
                                <span className="truncate">{connectedServiceNode.service}</span>
                              </span>
                              <span className="text-[9.5px] text-amber-700 dark:text-amber-200 shrink-0">
                                Study Together
                              </span>
                            </div>
                          )}
                          {/* Top Node Circle + Step Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-transform group-hover:scale-110 shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white border-emerald-200 dark:border-emerald-700 shadow-xs'
                                    : isCurrentSelected
                                    ? 'bg-[#0078D4] text-white border-sky-200 dark:border-sky-700 shadow-xs'
                                    : 'bg-slate-900 dark:bg-slate-700 text-white border-slate-200 dark:border-slate-600'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  `M${mod.id}`
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                  Step {idx + 1} of {path.modules.length}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isDone
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                                      : isCurrentSelected
                                      ? 'bg-[#0078D4] text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {isDone
                                    ? 'Completed'
                                    : isCurrentSelected
                                    ? 'Active Quiz'
                                    : 'Click to Quiz'}
                                </span>
                              </div>
                            </div>

                            {/* Optional Complete Toggle Checkbox */}
                            {onToggleModuleComplete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleModuleComplete(mod.id);
                                }}
                                className={`p-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white border-slate-200 dark:border-slate-700'
                                }`}
                                title={
                                  isDone
                                    ? `Mark Module ${mod.id} incomplete`
                                    : `Mark Module ${mod.id} complete`
                                }
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Module Title & Key Terms */}
                          <div>
                            <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0078D4] dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                              {mod.title}
                            </h5>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {mod.keyTerms.slice(0, 2).map((term) => (
                                <span
                                  key={term}
                                  className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[110px]"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Estimated Study Hours Remaining Row */}
                          <div className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                            <div className="flex items-center justify-between text-[10.5px] tabular-nums">
                              <span className="font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#0078D4] dark:text-sky-400 shrink-0" />
                                <span>Est. remaining</span>
                              </span>
                              <span
                                className={`font-extrabold ${
                                  estHrs === 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : estHrs >= 2.0
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-[#0078D4] dark:text-sky-300'
                                }`}
                              >
                                {estHrs === 0 ? '0.0 hrs · Done' : `~${estHrs.toFixed(1)} hrs`}
                              </span>
                            </div>
                            {modProj?.rationale && (
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {modProj.rationale}
                              </p>
                            )}
                          </div>

                          {/* Footer Jump CTA & Accuracy */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 tabular-nums">
                              {accuracyPct !== null ? (
                                <span
                                  className={`font-mono font-extrabold px-1.5 py-0.2 rounded text-[10px] ${
                                    accuracyPct >= 70
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                                  }`}
                                >
                                  {accuracyPct}% Acc
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                  Not started
                                </span>
                              )}
                              {qCount > 0 && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                  • {qCount}Q
                                </span>
                              )}
                            </div>

                            <span className="font-extrabold text-[#0078D4] dark:text-sky-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Quiz</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
