import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Check,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { fireModuleCompletionConfetti } from '../utils/confetti';

const ALL_CURRICULUM_MODULES = LEARNING_PATHS.flatMap((p) => p.modules);

interface ModuleBrowserProps {
  selectedPathId: number | 'all';
  selectedModuleId: number | 'all';
  onSelectPath: (pathId: number | 'all') => void;
  onSelectModule: (moduleId: number | 'all') => void;
  stats: UserStats;
  questionCountByModule: Record<number, number>;
  onToggleModuleComplete?: (moduleId: number) => void;
  onHideSidebar?: () => void;
}

export const ModuleBrowser: React.FC<ModuleBrowserProps> = ({
  selectedPathId,
  selectedModuleId,
  onSelectPath,
  onSelectModule,
  stats,
  questionCountByModule,
  onToggleModuleComplete,
  onHideSidebar,
}) => {
  // On mobile/tablet (< lg), allow collapsing the full module tree to save vertical screen space
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  // Track which paths are expanded in the navigator
  const [expandedPaths, setExpandedPaths] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  const togglePathAccordion = (pathId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths((prev) => ({
      ...prev,
      [pathId]: !prev[pathId],
    }));
  };

  const completedModules = stats.completedModules || [];
  const totalCurriculumModules = ALL_CURRICULUM_MODULES.length; // 12
  const overallCompletedCount = completedModules.filter((id) =>
    ALL_CURRICULUM_MODULES.some((m) => m.id === id)
  ).length;
  const overallCompletionPct =
    totalCurriculumModules > 0
      ? Math.round((overallCompletedCount / totalCurriculumModules) * 100)
      : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation p-3.5 sm:p-4 space-y-3">
      {/* Top Filter Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-[#0078D4] shrink-0" />
          <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-800 truncate">
            Cloud Explorer Menu
          </h3>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {overallCompletedCount}/{totalCurriculumModules}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelectPath('all');
              onSelectModule('all');
            }}
            className={`text-[11px] px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedPathId === 'all' && selectedModuleId === 'all'
                ? 'bg-[#0078D4] text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            All (12)
          </button>

          {onHideSidebar && (
            <button
              type="button"
              onClick={onHideSidebar}
              className="hidden lg:inline-flex items-center p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Collapse sidebar menu"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile & Tablet Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
            aria-expanded={isMobileOpen}
          >
            <span>{isMobileOpen ? 'Hide' : 'Browse'}</span>
            {isMobileOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Overall Completion Summary Bar */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Overall Completion</span>
          </span>
          <span className="font-mono font-black text-slate-900">
            {overallCompletedCount}/{totalCurriculumModules} ({overallCompletionPct}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0078D4] to-emerald-500 transition-all duration-500"
            style={{ width: `${overallCompletionPct}%` }}
          />
        </div>
      </div>

      {/* 3 Learning Paths (Always visible on lg+ laptop, collapsible on mobile/tablet) */}
      <div className={`${isMobileOpen ? 'block' : 'hidden lg:block'} space-y-2.5`}>
        {LEARNING_PATHS.map((path) => {
          const isPathSelected = selectedPathId === path.id;
          const isAccordionOpen = expandedPaths[path.id] ?? true;

          const totalPathMods = path.modules.length;
          const completedPathMods = path.modules.filter((m) =>
            completedModules.includes(m.id)
          ).length;
          const pathCompletionPct =
            totalPathMods > 0
              ? Math.round((completedPathMods / totalPathMods) * 100)
              : 0;

          return (
            <div
              key={path.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isPathSelected
                  ? 'border-blue-300 bg-blue-50/20 shadow-2xs'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              {/* Path Header Row */}
              <div className="p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPathId === path.id && selectedModuleId === 'all') {
                        onSelectPath('all');
                      } else {
                        onSelectPath(path.id);
                        onSelectModule('all');
                      }
                    }}
                    className="flex items-start gap-2 text-left min-w-0 flex-1 group cursor-pointer"
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${path.accentColor}20`,
                        color: path.accentColor,
                      }}
                    >
                      P{path.id}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#0078D4] transition-colors leading-snug truncate">
                        {path.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {path.examWeight} · {completedPathMods}/{totalPathMods} Done
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        pathCompletionPct === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pathCompletionPct}%
                    </span>
                    <button
                      type="button"
                      onClick={(e) => togglePathAccordion(path.id, e)}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={isAccordionOpen ? 'Collapse modules' : 'Expand modules'}
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isAccordionOpen ? 'rotate-90 text-[#0078D4]' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Per-Learning-Path Progress Bar */}
                <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${pathCompletionPct}%` }}
                  />
                </div>
              </div>

              {/* Sub-modules Checklist */}
              {isAccordionOpen && (
                <div className="p-1.5 pt-0 space-y-1 bg-white border-t border-slate-100">
                  {path.modules.map((mod) => {
                    const isModSelected = selectedModuleId === mod.id;
                    const isModCompleted = completedModules.includes(mod.id);
                    const qCount = questionCountByModule[mod.id] || 0;
                    const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
                    const modAccuracy =
                      modStat.total > 0
                        ? Math.round((modStat.correct / modStat.total) * 100)
                        : null;

                    return (
                      <div
                        key={mod.id}
                        className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between gap-1.5 transition-colors ${
                          isModSelected
                            ? 'bg-[#0078D4] text-white font-semibold'
                            : isModCompleted
                            ? 'bg-emerald-50/50 text-slate-800 hover:bg-emerald-50'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {onToggleModuleComplete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isModCompleted) {
                                  fireModuleCompletionConfetti(mod.title);
                                }
                                onToggleModuleComplete(mod.id);
                              }}
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 transition-all cursor-pointer ${
                                isModCompleted
                                  ? 'bg-emerald-600 border-emerald-600 text-white scale-110 shadow-xs'
                                  : isModSelected
                                  ? 'border-white/80 bg-transparent hover:scale-105'
                                  : 'border-slate-300 bg-white hover:border-[#0078D4] hover:scale-105'
                              }`}
                              aria-label={
                                isModCompleted
                                  ? `Mark Module ${mod.id} incomplete`
                                  : `Mark Module ${mod.id} complete`
                              }
                            >
                              {isModCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onSelectPath(path.id);
                              onSelectModule(mod.id);
                              setIsMobileOpen(false);
                            }}
                            className="text-left truncate flex-1 text-[11px] cursor-pointer"
                          >
                            M{mod.id}: {mod.title}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {modAccuracy !== null && (
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                isModSelected
                                  ? 'text-sky-100'
                                  : modAccuracy >= 70
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
                              }`}
                            >
                              {modAccuracy}%
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              isModSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {qCount}Q
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

