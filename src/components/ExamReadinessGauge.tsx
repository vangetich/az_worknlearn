import React, { useMemo } from 'react';
import { Award, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Compass, Layers } from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';

interface ExamReadinessGaugeProps {
  moduleMastery?: Record<number, { correct: number; total: number }>;
  pathMastery?: Record<number, { correct: number; total: number }>;
  totalAnswered: number;
}

export const ExamReadinessGauge: React.FC<ExamReadinessGaugeProps> = ({
  moduleMastery = {},
  pathMastery = {},
  totalAnswered,
}) => {
  // Calculate average domain confidence across all 12 modules
  const {
    averageDomainConfidence,
    moduleScores,
    attemptedCount,
    readyCount,
    scaledScore,
    isPassReady,
  } = useMemo(() => {
    let totalConfidenceSum = 0;
    const scores: Record<number, { percent: number; correct: number; total: number }> = {};
    let attempted = 0;
    let ready = 0;

    // Collect all 12 modules from LEARNING_PATHS
    const allModules: number[] = [];
    LEARNING_PATHS.forEach((p) => {
      p.modules.forEach((m) => allModules.push(m.id));
    });

    allModules.forEach((modId) => {
      const data = moduleMastery[modId] || { correct: 0, total: 0 };
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      scores[modId] = { percent: pct, correct: data.correct, total: data.total };

      if (data.total > 0) {
        attempted += 1;
      }
      if (pct >= 70 && data.total >= 2) {
        ready += 1;
      }
      totalConfidenceSum += pct;
    });

    // Average domain confidence across all 12 modules
    const avgConfidence = allModules.length > 0 ? Math.round(totalConfidenceSum / allModules.length) : 0;

    // If user has answered at least 1 question, scale calibrated score
    const volumeMultiplier = Math.min(1, Math.max(0.35, totalAnswered / 20));
    const effectiveReadiness = Math.round(avgConfidence * volumeMultiplier);
    const scaled = Math.round((effectiveReadiness / 100) * 1000);

    return {
      averageDomainConfidence: avgConfidence,
      moduleScores: scores,
      attemptedCount: attempted,
      readyCount: ready,
      scaledScore: scaled,
      isPassReady: scaled >= 700 || (avgConfidence >= 70 && attempted >= 6),
    };
  }, [moduleMastery, totalAnswered]);

  // SVG Gauge calculations (semi-circle arc)
  const radius = 78;
  const arcLength = Math.PI * radius; // ~245
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, averageDomainConfidence))) / 100;

  // Color determination based on average domain confidence
  let gaugeColor = '#0078D4'; // Azure Brand Color
  let statusBadge = {
    label: 'Needs Foundations Review',
    bg: 'bg-red-50 text-red-700 border-red-200',
  };

  if (averageDomainConfidence >= 80) {
    gaugeColor = '#10B981'; // Emerald
    statusBadge = {
      label: '★ Exam Certified Ready (700+ Pts)',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold',
    };
  } else if (averageDomainConfidence >= 65) {
    gaugeColor = '#0078D4'; // Azure Blue
    statusBadge = {
      label: 'Solid Pass Zone (Approaching 700)',
      bg: 'bg-blue-50 text-[#0078D4] border-blue-200 font-bold',
    };
  } else if (averageDomainConfidence >= 40) {
    gaugeColor = '#D97706'; // Warm Amber
    statusBadge = {
      label: 'Developing Proficiency',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    };
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-7">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Semi-circular SVG Gauge in Azure Color */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-52 h-32 flex items-end justify-center overflow-hidden">
            <svg
              className="w-52 h-52 -rotate-180 transform"
              viewBox="0 0 180 180"
              style={{ overflow: 'visible' }}
            >
              {/* Background Arc */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="15"
                strokeDasharray={`${arcLength} ${arcLength}`}
                strokeLinecap="round"
              />

              {/* Progress Arc in Azure #0078D4 / Status Color */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="15"
                strokeDasharray={`${arcLength} ${arcLength}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Central Score Display */}
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                {averageDomainConfidence}%
              </span>
              <span className="text-[11px] font-extrabold text-[#0078D4] uppercase tracking-wider">
                Exam Readiness
              </span>
            </div>
          </div>

          <span
            className={`mt-3 px-3.5 py-1 rounded-full text-xs border ${statusBadge.bg} shadow-2xs text-center`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Right: Average Domain Confidence Metrics & 12-Module Coverage */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0078D4]" />
                <span>Exam Readiness Gauge • 12-Module Average</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  Scaled: <strong className={isPassReady ? 'text-emerald-600' : 'text-[#0078D4]'}>{scaledScore}</strong> / 1000
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  (Pass Benchmark: 700)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calculates your live readiness score based on average domain confidence across all 12 modules of the Azure Curriculum.
            </p>
          </div>

          {/* Quick Stats: Modules Covered vs. Exam Ready Modules */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Confidence</span>
              <span className="text-lg font-black text-[#0078D4]">{averageDomainConfidence}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Modules Attempted</span>
              <span className="text-lg font-black text-slate-800">{attemptedCount} / 12</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">70%+ Solid Modules</span>
              <span className="text-lg font-black text-emerald-600">{readyCount} / 12</span>
            </div>
          </div>

          {/* 3 Paths Average Confidence Bars */}
          <div className="space-y-2 pt-1">
            {LEARNING_PATHS.map((path) => {
              // Average confidence of modules in this path
              const pathModScores = path.modules.map((m) => moduleScores[m.id]?.percent || 0);
              const pathAvg = Math.round(pathModScores.reduce((a, b) => a + b, 0) / path.modules.length);

              return (
                <div key={path.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate pr-2">
                      Path {path.id}: {path.title}{' '}
                      <span className="text-slate-400 font-normal">({path.examWeight})</span>
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      {pathAvg}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pathAvg}%`,
                        backgroundColor:
                          pathAvg >= 75
                            ? '#10B981'
                            : pathAvg >= 55
                            ? '#0078D4'
                            : pathAvg >= 35
                            ? '#D97706'
                            : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benchmark Insight Note */}
          <div className="flex items-center justify-between text-xs pt-2 text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isPassReady
                  ? '🎉 High confidence! You meet the 700+ point passing threshold for the Azure Curriculum.'
                  : `Focus on modules below 70% to boost your average readiness above the 700-point pass mark.`}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
