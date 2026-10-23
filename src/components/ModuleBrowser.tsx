import React from 'react';
import {
  Layers,
  ChevronRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Award,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';

interface ModuleBrowserProps {
  selectedPathId: number | 'all';
  selectedModuleId: number | 'all';
  onSelectPath: (pathId: number | 'all') => void;
  onSelectModule: (moduleId: number | 'all') => void;
  stats: UserStats;
  questionCountByModule: Record<number, number>;
}

export const ModuleBrowser: React.FC<ModuleBrowserProps> = ({
  selectedPathId,
  selectedModuleId,
  onSelectPath,
  onSelectModule,
  stats,
  questionCountByModule,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation p-5 space-y-4">
      {/* Top Filter Chips */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0078D4]" />
          <span>Curriculum Navigator</span>
        </h3>

        <button
          onClick={() => {
            onSelectPath('all');
            onSelectModule('all');
          }}
          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
            selectedPathId === 'all' && selectedModuleId === 'all'
              ? 'bg-[#0078D4] text-white'
              : 'text-slate-500 hover:text-slate-900 bg-slate-100'
          }`}
        >
          All Modules
        </button>
      </div>

      {/* 3 Learning Paths */}
      <div className="space-y-3">
        {LEARNING_PATHS.map((path) => {
          const isPathSelected = selectedPathId === path.id;
          const pathStat = stats.pathMastery[path.id] || { correct: 0, total: 0 };
          const pathPct =
            pathStat.total > 0
              ? Math.round((pathStat.correct / pathStat.total) * 100)
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
              {/* Path Header Button */}
              <button
                onClick={() => {
                  if (selectedPathId === path.id && selectedModuleId === 'all') {
                    // Toggle off to all
                    onSelectPath('all');
                  } else {
                    onSelectPath(path.id);
                    onSelectModule('all');
                  }
                }}
                className="w-full text-left p-3.5 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${path.accentColor}20`,
                      color: path.accentColor,
                    }}
                  >
                    P{path.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors">
                      {path.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Weight: {path.examWeight}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pathStat.total > 0 && (
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        pathPct >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pathPct}%
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isPathSelected ? 'rotate-90 text-[#0078D4]' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Sub-modules */}
              {isPathSelected && (
                <div className="p-2 pt-0 space-y-1 bg-white border-t border-slate-100">
                  {path.modules.map((mod) => {
                    const isModSelected = selectedModuleId === mod.id;
                    const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
                    const qCount = questionCountByModule[mod.id] || 0;

                    return (
                      <button
                        key={mod.id}
                        onClick={() => onSelectModule(mod.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                          isModSelected
                            ? 'bg-[#0078D4] text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate pr-2">
                          M{mod.id}: {mod.title}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isModSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {qCount} Qs
                          </span>
                        </div>
                      </button>
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
