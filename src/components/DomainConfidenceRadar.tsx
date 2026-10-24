import React, { useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Layers,
  Compass,
  Minimize2,
  Maximize2,
  Filter,
  Target,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { calculateDomainConfidence } from '../utils/storage';

interface DomainConfidenceRadarProps {
  stats: UserStats;
  onDrillDomain?: (moduleIds: number[]) => void;
  onSelectModule?: (moduleId: number) => void;
  compact?: boolean;
  embedded?: boolean;
}

type RadarViewMode = 'domains' | 'paths' | 'modules';
type StatusFilter = 'all' | 'weak' | 'passing';

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
  onSelectModule,
  compact = false,
  embedded = false,
}) => {
  const [viewMode, setViewMode] = useState<RadarViewMode>('domains');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

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

  // Filtered list for breakdown menu
  const filteredList = useMemo(() => {
    if (statusFilter === 'weak') {
      return radarData.filter((d) => d.score < 70 || d.total === 0);
    }
    if (statusFilter === 'passing') {
      return radarData.filter((d) => d.score >= 70 && d.total > 0);
    }
    return radarData;
  }, [radarData, statusFilter]);

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
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-2.5 shadow-2xl border border-sky-400/30 text-xs min-w-44 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 mb-1.5">
            <span className="font-extrabold text-sky-200 truncate">{data.subject}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
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

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span>Confidence:</span>
              <span className="font-black text-white">{data.score}%</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Answered:</span>
              <span className="font-medium text-slate-200">
                {data.correct}/{data.total} correct
              </span>
            </div>

            <div className="pt-1 border-t border-slate-800 text-[10px] flex items-center justify-between">
              <span className="text-slate-400">vs 70% Pass:</span>
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
    <div
      className={
        embedded
          ? 'bg-white rounded-xl border border-slate-200/90 overflow-hidden'
          : 'bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden'
      }
    >
      {/* Compact Responsive Header Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-2xs shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                Multi-Axial Confidence Mesh
              </h3>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-[#0078D4] border border-blue-200 shrink-0">
                Avg {averageScore}%
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-500">
                • 70% Target Threshold
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Axis View Switcher + Compact/Expand Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          <div
            className="flex items-center p-0.5 bg-slate-200/75 rounded-lg border border-slate-300/60 text-[11px] font-bold"
            role="tablist"
            aria-label="Radar Axis Granularity"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'domains'}
              onClick={() => {
                setViewMode('domains');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'domains'
                  ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Domains
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'paths'}
              onClick={() => {
                setViewMode('paths');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'paths'
                  ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 Paths
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'modules'}
              onClick={() => {
                setViewMode('modules');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'modules'
                  ? 'bg-[#0078D4] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Modules
            </button>
          </div>

          {!embedded && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse Radar Mesh' : 'Expand Radar Mesh'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3 text-[#0078D4]" />
                  <span className="hidden sm:inline">Compact</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-[#0078D4]" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Body: Responsive 12-Col Split across Tablet & Laptop, Compact Stack on Mobile */}
      {isExpanded && (
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Left Column: Responsive Radar Chart Container */}
          <div className="md:col-span-6 lg:col-span-6 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 p-2">
            <div className="w-full h-[220px] sm:h-[250px] lg:h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius={compact ? '68%' : '72%'}
                  data={radarData}
                >
                  <PolarGrid stroke="#CBD5E1" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="shortSubject"
                    tick={{ fill: '#1E293B', fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 8, fill: '#64748B' }}
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
                    strokeWidth={2.2}
                    fill="#0078D4"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Compact Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-slate-600 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4] inline-block" />
                <span>Your Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" />
                <span>Pass Target (70%)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Compact Diagnostics, Filter Pills & Interactive Domain Drill List */}
          <div className="md:col-span-6 lg:col-span-6 space-y-2.5 bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
            {/* Top Strength & Focus Priority Mini Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 shadow-2xs">
                <div className="flex items-center justify-between gap-1 text-emerald-700">
                  <span className="text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Top Strength</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-600">
                    {strongestDomain ? `${strongestDomain.score}%` : '—'}
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-900 truncate mt-0.5">
                  {strongestDomain ? strongestDomain.subject : 'Solve Qs to rank'}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-rose-200/80 shadow-2xs">
                <div className="flex items-center justify-between gap-1 text-rose-700">
                  <span className="text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Priority Gap</span>
                  </span>
                  <span className="text-[10px] font-black text-rose-600">
                    {weakestDomain ? `${weakestDomain.score}%` : '—'}
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-900 truncate mt-0.5">
                  {weakestDomain ? weakestDomain.subject : 'No weak areas yet'}
                </p>
              </div>
            </div>

            {/* Filter Bar for Axis List */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#0078D4]" />
                <span>Interactive Axis Drill ({filteredList.length})</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'weak', label: '<70%' },
                    { id: 'passing', label: '≥70%' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain Breakdown Interactive Mini-List */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
              {filteredList.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 bg-white rounded-lg border border-slate-200/70">
                  No domains match this filter.
                </div>
              ) : (
                filteredList.map((d, idx) => {
                  const isPassing = d.score >= 70;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (onSelectModule && d.moduleIds.length === 1) {
                          onSelectModule(d.moduleIds[0]);
                        } else if (onDrillDomain) {
                          onDrillDomain(d.moduleIds);
                        }
                      }}
                      className="bg-white hover:bg-blue-50/40 p-2 rounded-lg border border-slate-200/90 hover:border-[#0078D4] flex items-center justify-between text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="font-bold text-slate-800 group-hover:text-[#0078D4] truncate">
                          {d.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {d.total > 0 ? `${d.correct}/${d.total}` : '0/0'}
                        </span>
                        <span
                          className={`font-black text-[11px] px-1.5 py-0.5 rounded min-w-10 text-center ${
                            d.total === 0
                              ? 'bg-slate-100 text-slate-500'
                              : isPassing
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.total > 0 ? `${d.score}%` : 'New'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drill Weakest Domain Action */}
            {weakestDomain && onDrillDomain && (
              <button
                type="button"
                onClick={() => onDrillDomain(weakestDomain.moduleIds)}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                <span className="truncate">Drill Priority: {weakestDomain.subject}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
