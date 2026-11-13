import React, { useMemo, useState } from 'react';
import {
  Route,
  ArrowRight,
  BookOpen,
  Layers,
  Compass,
  CheckCircle2,
  Clock,
  Circle,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  ThreadTagId,
  THREAD_TAG_META,
  THREAD_PATH_NAMES,
  buildThreadCentricLearningPath,
  doesModuleMatchThemeSearch,
} from '../data/azureThemesData';

interface ThreadCentricLearningPathsViewProps {
  selectedTagId: ThreadTagId;
  onSelectTagId: (tagId: ThreadTagId) => void;
  stats: UserStats;
  questions: Question[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onPracticeModule: (moduleId: number) => void;
  onOpenStudyDecksModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onInspectInOverview: (themeId: string, moduleId: number) => void;
}

const ORDERED_TAGS: ThreadTagId[] = [
  'Security',
  'Scaling',
  'Reliability',
  'FinOps',
  'Responsibility',
  'Hybrid/IaC',
];

export const ThreadCentricLearningPathsView: React.FC<
  ThreadCentricLearningPathsViewProps
> = ({
  selectedTagId,
  onSelectTagId,
  stats,
  questions,
  searchQuery = '',
  onClearSearch,
  onPracticeModule,
  onOpenStudyDecksModule,
  onInspectInOverview,
}) => {
  const [sequenceMode, setSequenceMode] = useState<'priority' | 'curriculum'>('priority');
  const [heavyFocusOnly, setHeavyFocusOnly] = useState<boolean>(false);

  const moduleCatalog = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({
          id: m.id,
          pathId: p.id,
          title: m.title,
          keyTerms: m.keyTerms,
        }))
      ),
    []
  );

  const completedSet = useMemo(
    () => new Set(stats.completedModules || []),
    [stats.completedModules]
  );

  const getModuleStatus = (modId: number) => {
    const modStat = stats.moduleMastery?.[modId];
    const accuracy =
      modStat && modStat.total > 0
        ? Math.round((modStat.correct / modStat.total) * 100)
        : null;
    const isMastered = completedSet.has(modId) || (accuracy !== null && accuracy >= 75);
    const isInProgress = !isMastered && Boolean(modStat && modStat.total > 0);
    return {
      accuracy,
      tier: isMastered
        ? ('mastered' as const)
        : isInProgress
        ? ('in-progress' as const)
        : ('not-started' as const),
    };
  };

  // Precompute summaries for all 6 path selector buttons
  const pathSummaries = useMemo(() => {
    return ORDERED_TAGS.map((tagId) => {
      const built = buildThreadCentricLearningPath(
        tagId,
        sequenceMode,
        moduleCatalog,
        questions,
        !heavyFocusOnly
      );
      const masteredCount = built.steps.filter(
        (s) => getModuleStatus(s.moduleId).tier === 'mastered'
      ).length;
      return {
        tagId,
        title: THREAD_PATH_NAMES[tagId].title,
        stepCount: built.steps.length,
        masteredCount,
        accentHex: built.theme.accentHex,
      };
    });
  }, [sequenceMode, moduleCatalog, questions, heavyFocusOnly, stats.moduleMastery, completedSet]);

  const activePath = useMemo(
    () =>
      buildThreadCentricLearningPath(
        selectedTagId,
        sequenceMode,
        moduleCatalog,
        questions,
        !heavyFocusOnly
      ),
    [selectedTagId, sequenceMode, moduleCatalog, questions, heavyFocusOnly]
  );

  const visibleSteps = useMemo(() => {
    if (!searchQuery.trim()) return activePath.steps;
    return activePath.steps.filter((step) =>
      doesModuleMatchThemeSearch(step.moduleId, searchQuery, step.moduleTitle)
    );
  }, [activePath.steps, searchQuery]);

  const masteredInPath = useMemo(
    () =>
      activePath.steps.filter((s) => getModuleStatus(s.moduleId).tier === 'mastered')
        .length,
    [activePath.steps, stats.moduleMastery, completedSet]
  );

  const nextUnmasteredStep = useMemo(
    () =>
      activePath.steps.find((s) => getModuleStatus(s.moduleId).tier !== 'mastered') ||
      activePath.steps[0],
    [activePath.steps, stats.moduleMastery, completedSet]
  );

  const pathMasteryPct =
    activePath.steps.length > 0
      ? Math.round((masteredInPath / activePath.steps.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Selector & Sequencing Controls */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] dark:text-sky-400">
              <Route className="w-4 h-4 shrink-0" />
              <span>Thread-Centric Learning Paths</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 text-balance">
              Automatically Filter &amp; Sequence Modules Around One Theme
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Choose a theme path below—such as the Security-First Path or Scaling &amp; Elasticity Path—to isolate only the modules carrying that theme and order them by focus intensity or curriculum progression.
            </p>
          </div>

          {/* Sequencing + Focus Depth Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Module sequence order"
            >
              <button
                type="button"
                onClick={() => setSequenceMode('priority')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  sequenceMode === 'priority'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                <span>Heaviest Focus First</span>
              </button>
              <button
                type="button"
                onClick={() => setSequenceMode('curriculum')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  sequenceMode === 'curriculum'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Curriculum (M1→M12)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setHeavyFocusOnly((prev) => !prev)}
              aria-pressed={heavyFocusOnly}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                heavyFocusOnly
                  ? 'bg-[#0078D4] text-white border-[#0078D4]'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#0078D4]'
              }`}
            >
              {heavyFocusOnly ? 'Showing Heavy (#1 & #2) Only' : 'All Tagged Modules'}
            </button>
          </div>
        </div>

        {/* 6 Thread-Centric Path Selector Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          role="tablist"
          aria-label="Select Thread-Centric Learning Path"
        >
          {pathSummaries.map((p) => {
            const isSelected = p.tagId === selectedTagId;
            return (
              <button
                key={p.tagId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectTagId(p.tagId)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-sky-950/90 text-white border-slate-900 dark:border-sky-500 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-xs shrink-0"
                      style={{ backgroundColor: p.accentHex }}
                      aria-hidden="true"
                    />
                    <span className={isSelected ? 'text-sky-300' : 'text-slate-500 dark:text-slate-400'}>
                      {THREAD_TAG_META[p.tagId].label}
                    </span>
                  </span>
                  <span
                    className={`tabular-nums ${
                      isSelected ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {p.masteredCount}/{p.stepCount} mastered
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug">{p.title}</div>
                <div
                  className={`text-xs ${
                    isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {p.stepCount} sequenced modules
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Path Banner + Visual Sequence Rail */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-bold text-[#0078D4] dark:text-sky-400">
                {activePath.steps.length}-Module Sequenced Track
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {sequenceMode === 'priority'
                  ? 'Ordered by Heaviest Theme Focus (#1 → #3)'
                  : 'Ordered by Curriculum Progression (M1 → M12)'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {masteredInPath}/{activePath.steps.length} Mastered ({pathMasteryPct}%)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
              {activePath.pathName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activePath.pathTagline}
            </p>
          </div>

          {nextUnmasteredStep && (
            <button
              type="button"
              onClick={() => onPracticeModule(nextUnmasteredStep.moduleId)}
              className="px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {masteredInPath === activePath.steps.length
                  ? `Review Path: M${nextUnmasteredStep.moduleId}`
                  : `Start Next Step: M${nextUnmasteredStep.moduleId}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Path Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pathMasteryPct}%` }}
          />
        </div>

        {/* Visual Sequenced Step Rail */}
        {visibleSteps.length > 0 && (
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 min-w-max py-1">
              {visibleSteps.map((step, idx) => {
                const status = getModuleStatus(step.moduleId);
                return (
                  <React.Fragment key={step.moduleId}>
                    {idx > 0 && (
                      <ArrowRight
                        className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onPracticeModule(step.moduleId)}
                      className={`px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                        status.tier === 'mastered'
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 text-slate-900 dark:text-slate-100'
                          : status.tier === 'in-progress'
                          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/80 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#0078D4]'
                      }`}
                    >
                      <span className="text-[11px] font-mono font-bold text-[#0078D4] dark:text-sky-400">
                        {String(step.stepNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="text-xs font-bold whitespace-nowrap">
                          M{step.moduleId} · {step.focusTierLabel}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 max-w-[145px] truncate">
                          {step.moduleTitle}
                        </div>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Ordered Step Cards */}
        {visibleSteps.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              No steps in {activePath.pathName} matched &ldquo;{searchQuery}&rdquo;.
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
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {visibleSteps.map((step) => {
              const status = getModuleStatus(step.moduleId);
              return (
                <div
                  key={step.moduleId}
                  className="p-4 sm:p-5 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/35 transition-colors space-y-3"
                >
                  {/* Step Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold text-[#0078D4] dark:text-sky-400">
                          Step {String(step.stepNumber).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Module {step.moduleId} (Path {step.pathId})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-bold ${
                            step.focusRank === 1
                              ? 'text-[#0078D4] dark:text-sky-400'
                              : step.focusRank === 2
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          #{step.focusRank} {step.focusTierLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {step.questionCountForTheme} themed Qs
                        </span>
                        <span aria-hidden="true">·</span>
                        {status.tier === 'mastered' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              Mastered{status.accuracy !== null ? ` (${status.accuracy}%)` : ''}
                            </span>
                          </span>
                        ) : status.tier === 'in-progress' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress ({status.accuracy}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <Circle className="w-3.5 h-3.5" />
                            <span>Not Started</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50">
                        M{step.moduleId}: {step.moduleTitle}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onInspectInOverview(activePath.theme.id, step.moduleId)
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-[#0078D4] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                        <span>Bridge</span>
                      </button>

                      {onOpenStudyDecksModule && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenStudyDecksModule(step.moduleId, step.pathId)
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-[#0078D4] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400" />
                          <span>Study Deck</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onPracticeModule(step.moduleId)}
                        className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Practice M{step.moduleId}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs sm:text-sm">
                    <div className="lg:col-span-8 space-y-2">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {step.serviceApplication}
                      </p>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Key Services &amp; Concepts:{' '}
                        </span>
                        {step.azureServices.join(' · ')}
                      </div>
                    </div>

                    <div className="lg:col-span-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Exam Discrimination Rule</span>
                      </div>
                      <p className="text-amber-950 dark:text-amber-100/90 leading-relaxed">
                        {step.examTrapGuard}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Excluded Modules Notice */}
        {activePath.excludedModuleIds.length > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Filtered out of {activePath.pathName}:{' '}
            </span>
            {activePath.excludedModuleIds.map((id) => `M${id}`).join(', ')} (not primarily tagged with{' '}
            {THREAD_TAG_META[selectedTagId].label}).
          </div>
        )}
      </section>
    </div>
  );
};
