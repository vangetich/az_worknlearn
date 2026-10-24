import React, { useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Compass,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { calculateDomainConfidence } from '../utils/storage';
import { MaasaiMedallion } from './MotifDecorations';

interface DomainConfidenceRadarProps {
  stats: UserStats;
  onDrillDomain?: (moduleIds: number[]) => void;
  compact?: boolean;
}

type RadarViewMode = 'domains' | 'paths' | 'modules';

interface RadarDataPoint {
  subject: string;
  shortSubject: string;
  score: number;
  benchmark: number;
  correct: number;
  total: number;
  rating: string;
  moduleIds: number[];
  color: string;
}

export const DomainConfidenceRadar: React.FC<DomainConfidenceRadarProps> = ({
  stats,
  onDrillDomain,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<RadarViewMode>('domains');

  // Compute domain data points based on user stats
  const radarData: RadarDataPoint[] = useMemo(() => {
    if (viewMode === 'paths') {
      return LEARNING_PATHS.map((path) => {
        const pm = stats.pathMastery[path.id] || { correct: 0, total: 0 };
        const conf = calculateDomainConfidence(pm.correct, pm.total);
        const moduleIds = path.modules.map((m) => m.id);

        return {
          subject: path.title.replace('Describe ', ''),
          shortSubject: `Path ${path.id}`,
          score: pm.total > 0 ? conf.percentage : 0,
          benchmark: 70,
          correct: pm.correct,
          total: pm.total,
          rating: pm.total > 0 ? conf.rating : 'Untested',
          moduleIds,
          color: path.accentColor,
        };
      });
    }

    if (viewMode === 'modules') {
      const allModules = LEARNING_PATHS.flatMap((p) => p.modules);
      return allModules.map((m) => {
        const mm = stats.moduleMastery[m.id] || { correct: 0, total: 0 };
        const conf = calculateDomainConfidence(mm.correct, mm.total);

        return {
          subject: m.title,
          shortSubject: `M${m.id}`,
          score: mm.total > 0 ? conf.percentage : 0,
          benchmark: 70,
          correct: mm.correct,
          total: mm.total,
          rating: mm.total > 0 ? conf.rating : 'Untested',
          moduleIds: [m.id],
          color: m.pathId === 1 ? '#D97706' : m.pathId === 2 ? '#0078D4' : '#C2410C',
        };
      });
    }

    // Default: 6 Core AZ-900 Domain Areas
    const domainDefinitions = [
      {
        subject: 'Cloud Concepts',
        shortSubject: 'Concepts',
        moduleIds: [1, 2, 3],
        color: '#D97706',
      },
      {
        subject: 'Core Architecture',
        shortSubject: 'Architecture',
        moduleIds: [4],
        color: '#0284C7',
      },
      {
        subject: 'Compute & Network',
        shortSubject: 'Compute/Net',
        moduleIds: [5],
        color: '#0078D4',
      },
      {
        subject: 'Storage & Data',
        shortSubject: 'Storage',
        moduleIds: [6],
        color: '#2563EB',
      },
      {
        subject: 'Identity & Security',
        shortSubject: 'Security',
        moduleIds: [7],
        color: '#4F46E5',
      },
      {
        subject: 'Cost & Governance',
        shortSubject: 'Governance',
        moduleIds: [8, 9, 10, 11, 12],
        color: '#C2410C',
      },
    ];

    return domainDefinitions.map((dom) => {
      let correct = 0;
      let total = 0;
      dom.moduleIds.forEach((mId) => {
        const mm = stats.moduleMastery[mId];
        if (mm) {
          correct += mm.correct;
          total += mm.total;
        }
      });

      const conf = calculateDomainConfidence(correct, total);

      return {
        subject: dom.subject,
        shortSubject: dom.shortSubject,
        score: total > 0 ? conf.percentage : 0,
        benchmark: 70,
        correct,
        total,
        rating: total > 0 ? conf.rating : 'Untested',
        moduleIds: dom.moduleIds,
        color: dom.color,
      };
    });
  }, [stats, viewMode]);

  // Determine strongest and weakest tested domains
  const testedDomains = useMemo(() => {
    return radarData.filter((d) => d.total > 0);
  }, [radarData]);

  const strongestDomain = useMemo(() => {
    if (testedDomains.length === 0) return null;
    return [...testedDomains].sort((a, b) => b.score - a.score)[0];
  }, [testedDomains]);

  const weakestDomain = useMemo(() => {
    if (testedDomains.length === 0) return null;
    return [...testedDomains].sort((a, b) => a.score - b.score)[0];
  }, [testedDomains]);

  const averageScore = useMemo(() => {
    if (testedDomains.length === 0) return 0;
    const sum = testedDomains.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / testedDomains.length);
  }, [testedDomains]);

  // Custom Radar Tooltip
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: RadarDataPoint = payload[0].payload;
      const isAboveTarget = data.score >= 70;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl border border-sky-400/30 text-xs min-w-50 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-1.5 mb-2">
            <span className="font-extrabold text-sky-200">{data.subject}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                data.score >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : data.score >= 70
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : data.score >= 50
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {data.rating}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span>Your Confidence:</span>
              <span className="font-black text-white text-sm">{data.score}%</span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Passing Target:</span>
              <span className="font-semibold text-emerald-400">70% passing</span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Question History:</span>
              <span className="font-medium text-slate-200">
                {data.correct} / {data.total} correct
              </span>
            </div>

            <div className="pt-1 border-t border-slate-800 text-[10px] flex items-center justify-between">
              <span className="text-slate-400">Gap to Target:</span>
              <span
                className={`font-black ${
                  isAboveTarget ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {data.score >= 70
                  ? `+${data.score - 70}% above`
                  : `-${70 - data.score}% needed`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-5 sm:p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                Domain Confidence Radar
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0078D4] border border-blue-200">
                Live Poly-Mesh
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Multi-axial visualization of Azure readiness against the 70% passing threshold
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('domains')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'domains'
                ? 'bg-[#0078D4] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 Core Domains
          </button>
          <button
            type="button"
            onClick={() => setViewMode('paths')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'paths'
                ? 'bg-[#0078D4] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3 Paths
          </button>
          <button
            type="button"
            onClick={() => setViewMode('modules')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'modules'
                ? 'bg-[#0078D4] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            12 Modules
          </button>
        </div>
      </div>

      {/* Main Grid: Radar Chart & Metrics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Chart Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[340px]">
          <div className="w-full h-[300px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius={compact ? '70%' : '75%'}
                data={radarData}
              >
                <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="shortSubject"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#94A3B8"
                  tick={{ fontSize: 9, fill: '#64748B' }}
                />
                <Tooltip content={<CustomRadarTooltip />} />
                {/* Benchmark line: 70% passing threshold */}
                <Radar
                  name="Exam Passing Target (70%)"
                  dataKey="benchmark"
                  stroke="#16A34A"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  fill="#16A34A"
                  fillOpacity={0.06}
                />
                {/* User Confidence Radar Polygon */}
                <Radar
                  name="Your Confidence Score"
                  dataKey="score"
                  stroke="#0078D4"
                  strokeWidth={2.5}
                  fill="#0078D4"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Legend & Key Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#0078D4] border border-blue-600 inline-block" />
              <span>Your Confidence Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" />
              <span>Target Benchmark (70%)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Breakdown & Quick Drill Action */}
        <div className="lg:col-span-5 space-y-3.5 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Radar Diagnostics
            </span>
            <span className="text-xs font-extrabold text-[#0078D4]">
              Avg: {averageScore}%
            </span>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Strongest Domain */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wide">
                  Top Strength
                </span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 truncate">
                {strongestDomain ? strongestDomain.subject : 'Take a quiz to score'}
              </p>
              <p className="text-[11px] font-bold text-emerald-600">
                {strongestDomain ? `${strongestDomain.score}% accuracy` : '0%'}
              </p>
            </div>

            {/* Weakest / Focus Area */}
            <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wide">
                  Focus Priority
                </span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 truncate">
                {weakestDomain ? weakestDomain.subject : 'No weaknesses yet'}
              </p>
              <p className="text-[11px] font-bold text-rose-600">
                {weakestDomain ? `${weakestDomain.score}% accuracy` : '0%'}
              </p>
            </div>
          </div>

          {/* Domain Breakdown Mini-List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {radarData.map((d, idx) => {
              const isPassing = d.score >= 70;
              return (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="font-bold text-slate-800 truncate">
                      {d.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {d.total > 0 ? `${d.correct}/${d.total}` : 'Unanswered'}
                    </span>
                    <span
                      className={`font-black text-xs px-1.5 py-0.5 rounded ${
                        d.total === 0
                          ? 'bg-slate-100 text-slate-500'
                          : isPassing
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {d.total > 0 ? `${d.score}%` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drill Weakest Domain Action */}
          {weakestDomain && onDrillDomain && (
            <button
              type="button"
              onClick={() => onDrillDomain(weakestDomain.moduleIds)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Drill Priority: {weakestDomain.subject}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
