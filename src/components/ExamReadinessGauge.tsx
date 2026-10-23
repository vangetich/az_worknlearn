import React from 'react';
import { Award, CheckCircle2, AlertCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';

interface ExamReadinessGaugeProps {
  pathMastery: Record<number, { correct: number; total: number }>;
  totalAnswered: number;
}

export const ExamReadinessGauge: React.FC<ExamReadinessGaugeProps> = ({
  pathMastery,
  totalAnswered,
}) => {
  // Calculate weighted domain scores based on official AZ-900 exam percentages:
  // Path 1 (Cloud Concepts): 28%
  // Path 2 (Architecture & Services): 38%
  // Path 3 (Management & Governance): 34%
  const weights: Record<number, number> = {
    1: 0.28,
    2: 0.38,
    3: 0.34,
  };

  const domainScores: Record<number, number> = {};
  let totalWeightedScore = 0;
  let totalWeightsApplied = 0;

  [1, 2, 3].forEach((pId) => {
    const data = pathMastery[pId] || { correct: 0, total: 0 };
    const score = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    domainScores[pId] = Math.round(score);

    // If user has attempts in this path, apply weight
    if (data.total > 0) {
      totalWeightedScore += score * weights[pId];
      totalWeightsApplied += weights[pId];
    }
  });

  // If user has attempted at least some questions, calculate weighted percentage
  // Scale with attempt volume factor so 1-2 lucky answers don't falsely claim 100% readiness
  const rawReadiness =
    totalWeightsApplied > 0 ? totalWeightedScore / totalWeightsApplied : 0;

  // Volume factor (need ~20 questions for full confidence calibration)
  const confidenceMultiplier = Math.min(1, Math.max(0.4, totalAnswered / 20));
  const estimatedReadiness = Math.round(rawReadiness * confidenceMultiplier);

  // Scaled score to 1000 (Pass mark: 700)
  const scaledScore = Math.round((estimatedReadiness / 100) * 1000);
  const isPassReady = scaledScore >= 700;

  // SVG Gauge calculations (semi-circle arc)
  // Radius = 80, Circumference = Math.PI * 80 = 251.3
  const radius = 75;
  const arcLength = Math.PI * radius; // ~235.6
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, estimatedReadiness))) / 100;

  // Color determination based on readiness
  let gaugeColor = '#EF4444'; // Red (<50%)
  let statusBadge = {
    label: 'Needs Development',
    bg: 'bg-red-50 text-red-700 border-red-200',
  };

  if (estimatedReadiness >= 75) {
    gaugeColor = '#10B981'; // Emerald (>=75%)
    statusBadge = {
      label: 'Exam Certified Ready (700+ Pts)',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold',
    };
  } else if (estimatedReadiness >= 60) {
    gaugeColor = '#0078D4'; // Azure Blue (60-74%)
    statusBadge = {
      label: 'Approaching Pass Mark',
      bg: 'bg-blue-50 text-[#0078D4] border-blue-200 font-semibold',
    };
  } else if (estimatedReadiness >= 40) {
    gaugeColor = '#D97706'; // Warm Ochre (40-59%)
    statusBadge = {
      label: 'Foundations Progressing',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-7">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Semi-circular SVG Gauge */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
            <svg
              className="w-48 h-48 -rotate-180 transform"
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
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${arcLength}`}
                strokeLinecap="round"
              />

              {/* Progress Arc */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${arcLength}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Central Score Display */}
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {estimatedReadiness}%
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Exam Readiness
              </span>
            </div>
          </div>

          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs border ${statusBadge.bg} shadow-2xs text-center`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Right: Breakdown by Domain Weight */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0078D4]" />
                <span>Weighted AZ-900 Readiness Calculator</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-600">
                Scaled: <strong className={isPassReady ? 'text-emerald-600' : 'text-[#0078D4]'}>{scaledScore}</strong> / 1000
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrated according to official Microsoft Learn domain weights (Passing Threshold: 700 / 1000).
            </p>
          </div>

          {/* 3 Domain Breakdown Bars */}
          <div className="space-y-2.5">
            {LEARNING_PATHS.map((path) => {
              const score = domainScores[path.id] || 0;
              const weightPct = Math.round(weights[path.id] * 100);

              return (
                <div key={path.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate pr-2">
                      Path {path.id}: {path.title}{' '}
                      <span className="text-slate-400 font-normal">({weightPct}% weight)</span>
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${score}%`,
                        backgroundColor:
                          score >= 75
                            ? '#10B981'
                            : score >= 60
                            ? '#0078D4'
                            : score >= 40
                            ? '#D97706'
                            : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Readiness Benchmark Insight */}
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isPassReady
                  ? 'Ready for the real Microsoft exam! Maintain with 1 mock exam weekly.'
                  : `Aim for 75%+ across all 3 paths to ensure a guaranteed first-attempt pass.`}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
