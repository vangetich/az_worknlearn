import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  MoveHorizontal,
  ArrowUpDown,
  Cpu,
  Network,
  HardDrive,
  CheckCircle2,
  Circle,
  BookOpen,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  SCALING_DEEP_DIVE_MODULES,
  ScalingDeepDiveModule,
  ScalingPillarDetail,
  doesModuleMatchThemeSearch,
} from '../data/azureThemesData';
import { UserStats } from '../types/quiz';

interface AzureThemesDeepDiveProps {
  stats: UserStats;
  initialModuleId?: number | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onPracticeModule: (moduleId: number) => void;
}

type ChosenThreadAxis = 'both' | 'horizontal' | 'vertical';
type PillarFilter = 'all' | 'compute' | 'networking' | 'storage';

const STORAGE_KEY_MAPPED_MODULES = 'az900_scaling_deepdive_mapped_v1';

export const AzureThemesDeepDive: React.FC<AzureThemesDeepDiveProps> = ({
  stats,
  initialModuleId,
  searchQuery = '',
  onClearSearch,
  onPracticeModule,
}) => {
  const [chosenThread, setChosenThread] = useState<ChosenThreadAxis>('both');
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>('all');
  const [activeModuleId, setActiveModuleId] = useState<number>(
    initialModuleId && initialModuleId >= 1 && initialModuleId <= 12 ? initialModuleId : 2
  );
  const [mappedModuleIds, setMappedModuleIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MAPPED_MODULES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((n) => typeof n === 'number');
      }
    } catch {
      // Ignore storage failures
    }
    return [2, 5, 6];
  });

  useEffect(() => {
    if (initialModuleId && initialModuleId >= 1 && initialModuleId <= 12) {
      setActiveModuleId(initialModuleId);
    }
  }, [initialModuleId]);

  const persistMappedIds = (next: number[]) => {
    setMappedModuleIds(next);
    try {
      localStorage.setItem(STORAGE_KEY_MAPPED_MODULES, JSON.stringify(next));
    } catch {
      // Ignore storage failures
    }
  };

  const toggleModuleMapped = (modId: number) => {
    if (mappedModuleIds.includes(modId)) {
      persistMappedIds(mappedModuleIds.filter((id) => id !== modId));
    } else {
      persistMappedIds([...mappedModuleIds, modId].sort((a, b) => a - b));
    }
  };

  const filteredDeepDiveModules = useMemo(() => {
    if (!searchQuery.trim()) return SCALING_DEEP_DIVE_MODULES;
    return SCALING_DEEP_DIVE_MODULES.filter((m) =>
      doesModuleMatchThemeSearch(m.moduleId, searchQuery, m.moduleTitle)
    );
  }, [searchQuery]);

  const activeModule: ScalingDeepDiveModule = useMemo(
    () =>
      filteredDeepDiveModules.find((m) => m.moduleId === activeModuleId) ||
      filteredDeepDiveModules[0] ||
      SCALING_DEEP_DIVE_MODULES.find((m) => m.moduleId === activeModuleId) ||
      SCALING_DEEP_DIVE_MODULES[0],
    [activeModuleId, filteredDeepDiveModules]
  );

  const getModuleMasteryPct = (modId: number): number | null => {
    const m = stats.moduleMastery?.[modId];
    if (!m || m.total === 0) return null;
    return Math.round((m.correct / m.total) * 100);
  };

  const pillarEntries: Array<{
    key: 'compute' | 'networking' | 'storage';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    detail: ScalingPillarDetail;
  }> = useMemo(() => {
    const all = [
      {
        key: 'compute' as const,
        title: 'Compute Layer',
        subtitle: 'VMs, Scale Sets, App Service, Containers & Serverless',
        icon: <Cpu className="w-4 h-4 text-[#0078D4] dark:text-sky-400 shrink-0" />,
        detail: activeModule.compute,
      },
      {
        key: 'networking' as const,
        title: 'Networking Layer',
        subtitle: 'Load Balancers, VNets, ExpressRoute, Gateways & Egress',
        icon: <Network className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        detail: activeModule.networking,
      },
      {
        key: 'storage' as const,
        title: 'Storage Layer',
        subtitle: 'Managed Disk IOPS SKUs, Blob Partitions, Files & Tiers',
        icon: <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
        detail: activeModule.storage,
      },
    ];
    if (pillarFilter === 'all') return all;
    return all.filter((item) => item.key === pillarFilter);
  }, [activeModule, pillarFilter]);

  const mappedPct = Math.round((mappedModuleIds.length / 12) * 100);

  return (
    <div className="space-y-6">
      {/* Deep-Dive Thread Configuration Header */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#0078D4] dark:text-sky-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Deep-Dive Architecture Mapper · All 12 AZ-900 Modules</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 text-balance">
              Map Horizontal &amp; Vertical Scaling Across Compute, Networking, and Storage
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Select a scaling thread axis and infrastructure pillar below, then walk through Modules 1 to 12 to inspect the exact mechanisms each Azure service layer uses to scale out or scale up.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 tabular-nums">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Thread Map Progress
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {mappedModuleIds.length}/12 Modules ({mappedPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Thread & Pillar Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chosen Scaling Thread Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Chosen Scaling Thread to Map
            </span>
            <div
              className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Choose scaling thread axis"
            >
              <button
                type="button"
                onClick={() => setChosenThread('both')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  chosenThread === 'both'
                    ? 'bg-slate-900 dark:bg-[#0078D4] text-white shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Both (H &amp; V)</span>
              </button>
              <button
                type="button"
                onClick={() => setChosenThread('horizontal')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  chosenThread === 'horizontal'
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
                }`}
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
                <span>Horizontal Only</span>
              </button>
              <button
                type="button"
                onClick={() => setChosenThread('vertical')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  chosenThread === 'vertical'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Vertical Only</span>
              </button>
            </div>
          </div>

          {/* Resource Pillar Focus Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Infrastructure Pillar Focus
            </span>
            <div
              className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Filter by infrastructure pillar"
            >
              {(
                [
                  { id: 'all', label: 'All 3 Pillars' },
                  { id: 'compute', label: 'Compute' },
                  { id: 'networking', label: 'Networking' },
                  { id: 'storage', label: 'Storage' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPillarFilter(opt.id)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    pillarFilter === opt.id
                      ? 'bg-white dark:bg-slate-900 text-[#0078D4] dark:text-sky-300 shadow-2xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 12-Module Interactive Mapper Strip */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Interactive 12-Module Continuum (click any module to map Compute, Networking &amp; Storage):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveModuleId((prev) => Math.max(1, prev - 1))}
                disabled={activeModuleId <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModuleId((prev) => Math.min(12, prev + 1))}
                disabled={activeModuleId >= 12}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filteredDeepDiveModules.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                No modules matched &ldquo;{searchQuery}&rdquo; in Deep-Dive Mode.
              </p>
              {onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-3 py-1.5 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredDeepDiveModules.map((mod) => {
              const isSelected = mod.moduleId === activeModule.moduleId;
              const isMapped = mappedModuleIds.includes(mod.moduleId);
              const masteryPct = getModuleMasteryPct(mod.moduleId);

              const matchesThread =
                chosenThread === 'both' ||
                (chosenThread === 'horizontal' &&
                  (mod.compute.primaryMode !== 'Vertical' ||
                    mod.networking.primaryMode !== 'Vertical' ||
                    mod.storage.primaryMode !== 'Vertical')) ||
                (chosenThread === 'vertical' &&
                  (mod.compute.primaryMode !== 'Horizontal' ||
                    mod.networking.primaryMode !== 'Horizontal' ||
                    mod.storage.primaryMode !== 'Horizontal'));

              return (
                <button
                  key={mod.moduleId}
                  type="button"
                  onClick={() => setActiveModuleId(mod.moduleId)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-sm'
                      : !matchesThread
                      ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-55 hover:opacity-100'
                      : isMapped
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-800/70 text-slate-900 dark:text-slate-100 hover:border-[#0078D4]'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#0078D4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                    <span className="font-bold">
                      M{mod.moduleId} · P{mod.pathId}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {masteryPct !== null && (
                        <span
                          className={`text-[10px] font-bold ${
                            isSelected ? 'text-amber-200' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {masteryPct}%
                        </span>
                      )}
                      {isMapped ? (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            isSelected
                              ? 'text-emerald-200'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                      ) : (
                        <Circle
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-sky-200' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      )}
                    </span>
                  </div>
                  <div className="text-xs font-semibold leading-tight line-clamp-2">
                    {mod.moduleTitle}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[9.5px] font-mono ${
                      isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={
                        !isSelected &&
                        ((chosenThread === 'horizontal' && mod.compute.primaryMode !== 'Vertical') ||
                          (chosenThread === 'vertical' && mod.compute.primaryMode !== 'Horizontal'))
                          ? 'font-bold text-[#0078D4] dark:text-sky-400'
                          : ''
                      }
                    >
                      C:{mod.compute.primaryMode[0]}
                    </span>
                    <span>·</span>
                    <span
                      className={
                        !isSelected &&
                        ((chosenThread === 'horizontal' && mod.networking.primaryMode !== 'Vertical') ||
                          (chosenThread === 'vertical' && mod.networking.primaryMode !== 'Horizontal'))
                          ? 'font-bold text-[#0078D4] dark:text-sky-400'
                          : ''
                      }
                    >
                      N:{mod.networking.primaryMode[0]}
                    </span>
                    <span>·</span>
                    <span
                      className={
                        !isSelected &&
                        ((chosenThread === 'horizontal' && mod.storage.primaryMode !== 'Vertical') ||
                          (chosenThread === 'vertical' && mod.storage.primaryMode !== 'Horizontal'))
                          ? 'font-bold text-[#0078D4] dark:text-sky-400'
                          : ''
                      }
                    >
                      S:{mod.storage.primaryMode[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* Active Module Compute / Networking / Storage Deep-Dive Breakdown */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Learning Path {activeModule.pathId}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0078D4] dark:text-sky-400">
                Module {activeModule.moduleId} of 12
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
              M{activeModule.moduleId}: {activeModule.moduleTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {activeModule.moduleFocusSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleModuleMapped(activeModule.moduleId)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                mappedModuleIds.includes(activeModule.moduleId)
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0078D4]'
              }`}
            >
              {mappedModuleIds.includes(activeModule.moduleId) ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Mapped in Thread</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mark Module Mapped</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onPracticeModule(activeModule.moduleId)}
              className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Practice Module {activeModule.moduleId}</span>
            </button>
          </div>
        </div>

        {/* Pillar Breakdown Cards */}
        <div
          className={`grid gap-4 ${
            pillarEntries.length === 1
              ? 'grid-cols-1'
              : pillarEntries.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-3'
          }`}
        >
          {pillarEntries.map((pillar) => {
            const isHorizontalHighlighted = chosenThread === 'horizontal';
            const isVerticalHighlighted = chosenThread === 'vertical';
            const pillarMatchesChosen =
              chosenThread === 'both' ||
              (chosenThread === 'horizontal' && pillar.detail.primaryMode !== 'Vertical') ||
              (chosenThread === 'vertical' && pillar.detail.primaryMode !== 'Horizontal');

            return (
              <div
                key={pillar.key}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all ${
                  pillarMatchesChosen
                    ? 'border-slate-200 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-800/40'
                    : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/35 dark:bg-slate-900/40 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                        {pillar.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          {pillar.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {pillar.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                      {pillar.detail.primaryMode === 'Both'
                        ? 'H + V Active'
                        : `${pillar.detail.primaryMode} Lead`}
                    </span>
                  </div>

                  {/* Horizontal Implementation Spec (Highlighted dynamically on Horizontal focus) */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 transition-all ${
                      isHorizontalHighlighted
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-[#0078D4] ring-1 ring-[#0078D4]/40'
                        : isVerticalHighlighted
                        ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800 opacity-55'
                        : 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/80 dark:border-sky-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0078D4] dark:text-sky-300">
                      <MoveHorizontal className="w-3.5 h-3.5 shrink-0" />
                      <span>Horizontal Scaling (Scale Out / In)</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {pillar.detail.horizontalSpec}
                    </p>
                  </div>

                  {/* Vertical Implementation Spec (Highlighted dynamically on Vertical focus) */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 transition-all ${
                      isVerticalHighlighted
                        ? 'bg-amber-50 dark:bg-amber-950/55 border-amber-500 ring-1 ring-amber-500/40'
                        : isHorizontalHighlighted
                        ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800 opacity-55'
                        : 'bg-amber-50/80 dark:bg-amber-950/35 border-amber-200/80 dark:border-amber-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                      <span>Vertical Scaling (Scale Up / Down)</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {pillar.detail.verticalSpec}
                    </p>
                  </div>
                </div>

                {/* Azure Components + Exam Rule */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.detail.azureComponents.map((comp) => (
                      <span
                        key={comp}
                        className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                    <Compass className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Rule:</strong> {pillar.detail.keyExamRule}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Complete 12-Module Cross-Pillar Scaling Map Table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50">
              Complete 12-Module Scaling Matrix ({chosenThread === 'both' ? 'Horizontal & Vertical' : chosenThread === 'horizontal' ? 'Horizontal Scale-Out' : 'Vertical Scale-Up'})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any module row to inspect its Compute, Networking, and Storage implementation above.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            12 Modules × 3 Pillars
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                <th className="py-3 px-3.5 whitespace-nowrap">Module</th>
                {(pillarFilter === 'all' || pillarFilter === 'compute') && (
                  <th className="py-3 px-3.5 min-w-[210px]">Compute Implementation</th>
                )}
                {(pillarFilter === 'all' || pillarFilter === 'networking') && (
                  <th className="py-3 px-3.5 min-w-[210px]">Networking Implementation</th>
                )}
                {(pillarFilter === 'all' || pillarFilter === 'storage') && (
                  <th className="py-3 px-3.5 min-w-[210px]">Storage Implementation</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredDeepDiveModules.length === 0 ? (
                <tr>
                  <td
                    colSpan={1 + (pillarFilter === 'all' ? 3 : 1)}
                    className="py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No modules match &ldquo;{searchQuery}&rdquo;. Clear the search filter above to view all 12 modules.
                  </td>
                </tr>
              ) : (
                filteredDeepDiveModules.map((mod) => {
                const isSelectedRow = mod.moduleId === activeModule.moduleId;
                const renderCellSummary = (detail: ScalingPillarDetail) => {
                  if (chosenThread === 'horizontal') return detail.horizontalSpec;
                  if (chosenThread === 'vertical') return detail.verticalSpec;
                  return detail.primaryMode === 'Vertical'
                    ? detail.verticalSpec
                    : detail.horizontalSpec;
                };

                return (
                  <tr
                    key={mod.moduleId}
                    onClick={() => setActiveModuleId(mod.moduleId)}
                    className={`cursor-pointer transition-colors ${
                      isSelectedRow
                        ? 'bg-sky-50/90 dark:bg-sky-950/40'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3.5 align-top">
                      <div className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        M{mod.moduleId}: {mod.moduleTitle}
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Path {mod.pathId}
                      </div>
                    </td>

                    {(pillarFilter === 'all' || pillarFilter === 'compute') && (
                      <td className="py-3 px-3.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="inline-block mr-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {mod.compute.primaryMode}
                        </span>
                        {renderCellSummary(mod.compute)}
                      </td>
                    )}

                    {(pillarFilter === 'all' || pillarFilter === 'networking') && (
                      <td className="py-3 px-3.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="inline-block mr-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {mod.networking.primaryMode}
                        </span>
                        {renderCellSummary(mod.networking)}
                      </td>
                    )}

                    {(pillarFilter === 'all' || pillarFilter === 'storage') && (
                      <td className="py-3 px-3.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="inline-block mr-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {mod.storage.primaryMode}
                        </span>
                        {renderCellSummary(mod.storage)}
                      </td>
                    )}
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
