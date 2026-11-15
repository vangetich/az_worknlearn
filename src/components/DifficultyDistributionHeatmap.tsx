import React, { useMemo } from 'react';
import { Layers, Sparkles, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { Question } from '../types/quiz';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import { MaasaiMedallion } from './MotifDecorations';

interface DifficultyDistributionHeatmapProps {
  questions?: Question[];
  onSelectPath?: (pathId: 1 | 2 | 3) => void;
}

interface PathDistributionMeta {
  pathId: 1 | 2 | 3;
  pathTitle: string;
  examWeight: string;
  total: number;
  fundamentalCount: number;
  intermediateCount: number;
  advancedCount: number;
  fundamentalPct: number;
  intermediatePct: number;
  advancedPct: number;
}

export const DifficultyDistributionHeatmap: React.FC<DifficultyDistributionHeatmapProps> = ({
  questions = BUILTIN_QUESTIONS,
  onSelectPath,
}) => {
  const pathDistributions: PathDistributionMeta[] = useMemo(() => {
    const pathsMap: Record<1 | 2 | 3, { title: string; weight: string; fundamental: number; intermediate: number; advanced: number; total: number }> = {
      1: { title: 'Path 1: Cloud Concepts', weight: '25-30%', fundamental: 0, intermediate: 0, advanced: 0, total: 0 },
      2: { title: 'Path 2: Architecture & Services', weight: '35-40%', fundamental: 0, intermediate: 0, advanced: 0, total: 0 },
      3: { title: 'Path 3: Management & Governance', weight: '30-35%', fundamental: 0, intermediate: 0, advanced: 0, total: 0 },
    };

    questions.forEach((q) => {
      const pId = q.learningPathId;
      if (pathsMap[pId]) {
        pathsMap[pId].total += 1;
        if (q.difficulty === 'Fundamental') pathsMap[pId].fundamental += 1;
        else if (q.difficulty === 'Intermediate') pathsMap[pId].intermediate += 1;
        else if (q.difficulty === 'Advanced') pathsMap[pId].advanced += 1;
      }
    });

    return [1, 2, 3].map((pId) => {
      const data = pathsMap[pId as 1 | 2 | 3];
      const tot = Math.max(1, data.total);
      return {
        pathId: pId as 1 | 2 | 3,
        pathTitle: data.title,
        examWeight: data.weight,
        total: data.total,
        fundamentalCount: data.fundamental,
        intermediateCount: data.intermediate,
        advancedCount: data.advanced,
        fundamentalPct: Math.round((data.fundamental / tot) * 100),
        intermediatePct: Math.round((data.intermediate / tot) * 100),
        advancedPct: Math.round((data.advanced / tot) * 100),
      };
    });
  }, [questions]);

  return (
    <div className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/15 border border-white/25 text-amber-300 shadow-xs shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Question Bank Matrix
              </span>
              <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                Difficulty Distribution Heatmap by Learning Path
              </h3>
            </div>
            <p className="text-xs text-sky-100/90 mt-0.5">
              Proportion of Fundamental, Intermediate, and Advanced questions across AZ-900 exam domains.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{questions.length} Total Verified Questions</span>
        </div>
      </div>

      {/* Body / Heatmap Rows */}
      <div className="p-4 sm:p-6 space-y-4">
        {pathDistributions.map((path) => (
          <div
            key={path.pathId}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-sky-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#0078D4] text-white text-xs font-black flex items-center justify-center shrink-0">
                  {path.pathId}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>{path.pathTitle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-[#005A9E]">
                      Exam Weight: {path.examWeight}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {path.total} total questions in this curriculum domain
                  </p>
                </div>
              </div>

              {onSelectPath && (
                <button
                  type="button"
                  onClick={() => onSelectPath(path.pathId)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-[#0078D4] border border-sky-300 text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
                >
                  <span>Practice This Path</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Proportion Stacked Bar */}
            <div className="space-y-1">
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-200 shadow-inner">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${path.fundamentalPct}%` }}
                  title={`Fundamental: ${path.fundamentalCount} (${path.fundamentalPct}%)`}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${path.intermediatePct}%` }}
                  title={`Intermediate: ${path.intermediateCount} (${path.intermediatePct}%)`}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${path.advancedPct}%` }}
                  title={`Advanced: ${path.advancedCount} (${path.advancedPct}%)`}
                />
              </div>

              {/* Legend & Breakdown Stats */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Fundamental</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-950">
                    {path.fundamentalCount} ({path.fundamentalPct}%)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Intermediate</span>
                  </span>
                  <span className="font-mono font-bold text-amber-950">
                    {path.intermediateCount} ({path.intermediatePct}%)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                  <span className="font-semibold text-rose-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Advanced</span>
                  </span>
                  <span className="font-mono font-bold text-rose-950">
                    {path.advancedCount} ({path.advancedPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="p-3.5 rounded-xl bg-sky-50/75 border border-sky-200 flex items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Pro-tip:</strong> Focus on paths with higher Advanced proportions if you are preparing for top-band AZ-900 mastery.
            </span>
          </div>
          <MaasaiMedallion size={24} className="shrink-0 opacity-80" />
        </div>
      </div>
    </div>
  );
};
