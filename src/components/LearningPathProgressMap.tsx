import React, { useState, useMemo } from 'react';
import {
  Map,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  Award,
  Check,
  Minimize2,
  Maximize2,
  Play,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

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
  const [activePathFilter, setActivePathFilter] = useState<1 | 2 | 3 | 'all'>(
    selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3
      ? selectedPathId
      : 'all'
  );

  const completedModules = stats.completedModules || [];

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
      className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                {completedCount}/{allModules.length} Modules ({overallPct}%)
              </span>
            </div>
            <p className="text-[11px] text-sky-100/80 hidden sm:block">
              Interactive step-by-step AZ-900 curriculum map — click any module node to jump directly to its quiz.
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
        <div className="p-3.5 sm:p-5 bg-gradient-to-b from-slate-50/70 to-white space-y-5">
          {displayedPaths.map((path) => {
            const pathDoneCount = path.modules.filter((m) =>
              completedModules.includes(m.id)
            ).length;
            const pathPct = Math.round(
              (pathDoneCount / path.modules.length) * 100
            );

            return (
              <div
                key={path.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3.5"
              >
                {/* Path Header & Progress Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: path.accentColor }}
                    >
                      Path {path.id} • {path.examWeight}
                    </span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900">
                        {path.title}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {pathDoneCount} of {path.modules.length} modules completed ({pathPct}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:w-44">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pathPct}%`,
                          backgroundColor: path.accentColor,
                        }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {pathPct}%
                    </span>
                  </div>
                </div>

                {/* Connected Step-by-Step Path Graphic Nodes */}
                <div className="relative">
                  {/* Horizontal connector line on desktop */}
                  <div
                    className="hidden lg:block absolute top-7 left-8 right-8 h-1 rounded-full bg-slate-200 pointer-events-none"
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

                      return (
                        <div
                          key={mod.id}
                          onClick={() => onSelectModule(mod.id, path.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectModule(mod.id, path.id);
                            }
                          }}
                          className={`group relative rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                            isCurrentSelected
                              ? 'bg-blue-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/25 shadow-sm'
                              : isDone
                              ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-300/90 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-sky-300 shadow-2xs'
                          }`}
                        >
                          {/* Top Node Circle + Step Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-transform group-hover:scale-110 shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white border-emerald-200 shadow-xs'
                                    : isCurrentSelected
                                    ? 'bg-[#0078D4] text-white border-sky-200 shadow-xs'
                                    : 'bg-slate-900 text-white border-slate-200'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  `M${mod.id}`
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                  Step {idx + 1} of {path.modules.length}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isDone
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isCurrentSelected
                                      ? 'bg-[#0078D4] text-white'
                                      : 'bg-slate-100 text-slate-600'
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
                                    : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-slate-200'
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
                            <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors line-clamp-2 leading-snug">
                              {mod.title}
                            </h5>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {mod.keyTerms.slice(0, 2).map((term) => (
                                <span
                                  key={term}
                                  className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 truncate max-w-[110px]"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Footer Jump CTA & Accuracy */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              {accuracyPct !== null ? (
                                <span
                                  className={`font-mono font-extrabold px-1.5 py-0.2 rounded text-[10px] ${
                                    accuracyPct >= 70
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {accuracyPct}% Acc
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Not started
                                </span>
                              )}
                              {qCount > 0 && (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  • {qCount}Q
                                </span>
                              )}
                            </div>

                            <span className="font-extrabold text-[#0078D4] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
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
