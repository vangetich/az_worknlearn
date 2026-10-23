import React from 'react';
import {
  Grid,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Flame,
  Zap,
  Info,
  Layers,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';

interface WeaknessHeatmapProps {
  moduleMastery: Record<number, { correct: number; total: number }>;
  onSelectModule: (moduleId: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
}

interface LowestModule {
  id: number;
  title: string;
  score: number;
}

export const WeaknessHeatmap: React.FC<WeaknessHeatmapProps> = ({
  moduleMastery,
  onSelectModule,
  onLaunchMicroDrill,
}) => {
  // Helper to determine status and color-code
  const getModuleStatus = (moduleId: number) => {
    const data = moduleMastery[moduleId] || { correct: 0, total: 0 };
    if (data.total === 0) {
      return {
        score: null,
        tier: 'new',
        label: 'Unattempted',
        bg: 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70',
        text: 'text-slate-700',
        badge: 'bg-slate-200 text-slate-600',
        dot: 'bg-slate-300',
      };
    }

    const pct = Math.round((data.correct / data.total) * 100);

    if (pct >= 85) {
      return {
        score: pct,
        tier: 'mastery',
        label: 'Mastery (Exam Ready)',
        bg: 'bg-emerald-50 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/80',
        text: 'text-emerald-950',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-500',
      };
    } else if (pct >= 70) {
      return {
        score: pct,
        tier: 'solid',
        label: 'Solid (Passing)',
        bg: 'bg-sky-50 border-sky-300 hover:border-[#0078D4] hover:bg-sky-100/80',
        text: 'text-sky-950',
        badge: 'bg-[#0078D4] text-white',
        dot: 'bg-[#0078D4]',
      };
    } else if (pct >= 50) {
      return {
        score: pct,
        tier: 'developing',
        label: 'Developing',
        bg: 'bg-amber-50 border-amber-300 hover:border-amber-500 hover:bg-amber-100/80',
        text: 'text-amber-950',
        badge: 'bg-amber-600 text-white',
        dot: 'bg-amber-500',
      };
    } else {
      return {
        score: pct,
        tier: 'critical',
        label: 'Low Confidence (Needs Focus)',
        bg: 'bg-red-50 border-red-300 hover:border-red-500 hover:bg-red-100/80',
        text: 'text-red-950',
        badge: 'bg-red-600 text-white',
        dot: 'bg-red-500',
      };
    }
  };

  // Find lowest scoring module using useMemo
  const lowestScoringModule = React.useMemo<LowestModule | null>(() => {
    let result: LowestModule | null = null;
    for (const path of LEARNING_PATHS) {
      for (const mod of path.modules) {
        const data = moduleMastery[mod.id];
        if (data && data.total > 0) {
          const pct = Math.round((data.correct / data.total) * 100);
          if (result === null || pct < result.score) {
            result = { id: mod.id, title: mod.title, score: pct };
          }
        }
      }
    }
    return result;
  }, [moduleMastery]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-50 text-[#C2410C]">
              <Grid className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Curriculum Weakness Heatmap (12 Modules)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual performance map across all official modules. Color-coded from red (critical focus) to green (mastery).
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600" /> &lt;50% Focus
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 50–69% Developing
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-50 text-sky-800 border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-[#0078D4]" /> 70–84% Solid
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> 85%+ Mastery
          </span>
        </div>
      </div>

      {/* Heatmap Grid Grouped by Learning Paths */}
      <div className="space-y-4">
        {LEARNING_PATHS.map((path) => (
          <div key={path.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-100">
              <span>
                Path {path.id}: {path.title}{' '}
                <span className="text-slate-400 font-normal">({path.examWeight})</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {path.modules.length} Modules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {path.modules.map((mod) => {
                const status = getModuleStatus(mod.id);
                const data = moduleMastery[mod.id] || { correct: 0, total: 0 };

                return (
                  <div
                    key={mod.id}
                    onClick={() => onSelectModule(mod.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs group relative ${status.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${status.dot} shrink-0`} />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          M{mod.id}
                        </span>
                      </div>

                      {status.score !== null ? (
                        <span
                          className={`text-xs font-extrabold px-1.5 py-0.5 rounded shadow-2xs ${status.badge}`}
                        >
                          {status.score}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          Unattempted
                        </span>
                      )}
                    </div>

                    <h5
                      className={`text-xs font-bold mt-1.5 line-clamp-1 group-hover:text-blue-900 transition-colors ${status.text}`}
                    >
                      {mod.title}
                    </h5>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {data.total > 0
                          ? `${data.correct}/${data.total} correct`
                          : '0 questions solved'}
                      </span>
                      <span className="text-[#0078D4] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Practice</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap Quick Remediation Banner */}
      {lowestScoringModule !== null && lowestScoringModule.score < 70 ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Heatmap Alert:</strong> M{lowestScoringModule.id} ({lowestScoringModule.title}) has the lowest confidence score ({lowestScoringModule.score}%).
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onLaunchMicroDrill && (
              <button
                onClick={() => onLaunchMicroDrill(lowestScoringModule.id)}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Drill M{lowestScoringModule.id}</span>
              </button>
            )}
            <button
              onClick={() => onSelectModule(lowestScoringModule.id)}
              className="px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-900 font-semibold transition-colors"
            >
              View Questions
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
