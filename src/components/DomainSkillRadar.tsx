import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  Compass,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { calculateDomainConfidence } from '../utils/storage';
import { KitengeRibbon } from './MotifDecorations';

export interface OfficialDomainSkillPoint {
  id: string;
  domainNumber: number;
  title: string;
  shortLabel: string;
  examWeight: string;
  moduleIds: number[];
  proficiency: number;
  cohortAvg: number;
  passTarget: number;
  correct: number;
  total: number;
  rating: string;
  color: string;
  isLive: boolean;
}

interface DomainSkillRadarProps {
  stats: UserStats;
  onDrillDomain?: (moduleIds: number[]) => void;
  onSelectModule?: (moduleId: number) => void;
}

const OFFICIAL_SIX_DOMAINS: Array<{
  id: string;
  domainNumber: number;
  title: string;
  shortLabel: string;
  examWeight: string;
  moduleIds: number[];
  cohortAvg: number;
  fallbackScore: number;
  color: string;
}> = [
  {
    id: 'cloud-concepts',
    domainNumber: 1,
    title: 'Cloud Concepts & Shared Responsibility',
    shortLabel: '1. Cloud Concepts',
    examWeight: '15–20%',
    moduleIds: [1, 2],
    cohortAvg: 78,
    fallbackScore: 76,
    color: '#D97706',
  },
  {
    id: 'cloud-models',
    domainNumber: 2,
    title: 'Cloud Models & Consumption Economics',
    shortLabel: '2. Cloud Models',
    examWeight: '10–15%',
    moduleIds: [3],
    cohortAvg: 75,
    fallbackScore: 72,
    color: '#EA580C',
  },
  {
    id: 'core-architecture',
    domainNumber: 3,
    title: 'Core Azure Architectural Components',
    shortLabel: '3. Architecture',
    examWeight: '10–15%',
    moduleIds: [4],
    cohortAvg: 73,
    fallbackScore: 70,
    color: '#0284C7',
  },
  {
    id: 'compute-net-storage',
    domainNumber: 4,
    title: 'Compute, Networking & Storage Services',
    shortLabel: '4. Compute & Storage',
    examWeight: '15–20%',
    moduleIds: [5, 6],
    cohortAvg: 71,
    fallbackScore: 68,
    color: '#0078D4',
  },
  {
    id: 'identity-security',
    domainNumber: 5,
    title: 'Identity, Access & Zero-Trust Security',
    shortLabel: '5. Identity & Security',
    examWeight: '10–15%',
    moduleIds: [7],
    cohortAvg: 74,
    fallbackScore: 74,
    color: '#4F46E5',
  },
  {
    id: 'cost-governance',
    domainNumber: 6,
    title: 'Cost Mgmt, Governance & Monitoring',
    shortLabel: '6. Cost & Governance',
    examWeight: '30–35%',
    moduleIds: [8, 9, 10, 11, 12],
    cohortAvg: 72,
    fallbackScore: 69,
    color: '#059669',
  },
];

export const DomainSkillRadar: React.FC<DomainSkillRadarProps> = ({
  stats,
  onDrillDomain,
  onSelectModule,
}) => {
  const [rendererMode, setRendererMode] = useState<'d3' | 'recharts'>('d3');
  const [showCohortOverlay, setShowCohortOverlay] = useState<boolean>(true);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('compute-net-storage');
  const [hoveredDomainId, setHoveredDomainId] = useState<string | null>(null);

  const domainSkills: OfficialDomainSkillPoint[] = useMemo(() => {
    return OFFICIAL_SIX_DOMAINS.map((dom) => {
      let correct = 0;
      let total = 0;

      dom.moduleIds.forEach((mId) => {
        const mm = stats.moduleMastery?.[mId];
        if (mm) {
          correct += mm.correct;
          total += mm.total;
        }
      });

      const isLive = total > 0;
      const conf = calculateDomainConfidence(correct, total);
      const proficiency = isLive ? conf.percentage : dom.fallbackScore;

      return {
        id: dom.id,
        domainNumber: dom.domainNumber,
        title: dom.title,
        shortLabel: dom.shortLabel,
        examWeight: dom.examWeight,
        moduleIds: dom.moduleIds,
        proficiency,
        cohortAvg: dom.cohortAvg,
        passTarget: 70,
        correct,
        total,
        rating: isLive ? conf.rating : proficiency >= 70 ? 'Ready (Preview)' : 'Focus Area',
        color: dom.color,
        isLive,
      };
    });
  }, [stats.moduleMastery]);

  const overallProficiency = useMemo(() => {
    if (domainSkills.length === 0) return 0;
    return Math.round(
      domainSkills.reduce((acc, d) => acc + d.proficiency, 0) / domainSkills.length
    );
  }, [domainSkills]);

  const strongestDomain = useMemo(() => {
    return [...domainSkills].sort((a, b) => b.proficiency - a.proficiency)[0];
  }, [domainSkills]);

  const weakestDomain = useMemo(() => {
    return [...domainSkills].sort((a, b) => a.proficiency - b.proficiency)[0];
  }, [domainSkills]);

  const weakDomains = useMemo(() => {
    const belowTarget = domainSkills.filter((d) => d.proficiency < 70);
    return belowTarget.length > 0 ? belowTarget : weakestDomain ? [weakestDomain] : [];
  }, [domainSkills, weakestDomain]);

  const allWeakModuleIds = useMemo(() => {
    const set = new Set<number>();
    weakDomains.forEach((d) => d.moduleIds.forEach((m) => set.add(m)));
    return Array.from(set);
  }, [weakDomains]);

  const inspectedDomain = useMemo(() => {
    const activeId = hoveredDomainId || selectedDomainId;
    return domainSkills.find((d) => d.id === activeId) || weakestDomain || domainSkills[0];
  }, [domainSkills, hoveredDomainId, selectedDomainId, weakestDomain]);

  // Precompute D3 radial spider geometry for the 6 official domains
  const d3SpiderGeometry = useMemo(() => {
    const size = 296;
    const center = size / 2;
    const maxRadius = 96;
    const radiusScale = d3.scaleLinear().domain([0, 100]).range([0, maxRadius]);
    const angleStep = (Math.PI * 2) / domainSkills.length;

    const radialGenerator = d3
      .lineRadial<number>()
      .angle((_, i) => i * angleStep)
      .radius((val) => radiusScale(val))
      .curve(d3.curveLinearClosed);

    const userPath = radialGenerator(domainSkills.map((d) => d.proficiency)) || '';
    const cohortPath = radialGenerator(domainSkills.map((d) => d.cohortAvg)) || '';
    const targetPath = radialGenerator(domainSkills.map(() => 70)) || '';

    const axes = domainSkills.map((d, idx) => {
      const angle = idx * angleStep - Math.PI / 2;
      const xEnd = center + Math.cos(angle) * maxRadius;
      const yEnd = center + Math.sin(angle) * maxRadius;
      const labelRadius = maxRadius + 24;
      const xLabel = center + Math.cos(angle) * labelRadius;
      const yLabel = center + Math.sin(angle) * labelRadius;
      const rVal = radiusScale(d.proficiency);
      const xVertex = center + Math.cos(angle) * rVal;
      const yVertex = center + Math.sin(angle) * rVal;

      return {
        ...d,
        xEnd,
        yEnd,
        xLabel,
        yLabel,
        xVertex,
        yVertex,
      };
    });

    return {
      size,
      center,
      rings: [25, 50, 70, 100].map((pct) => ({
        pct,
        r: radiusScale(pct),
      })),
      userPath,
      cohortPath,
      targetPath,
      axes,
    };
  }, [domainSkills]);

  const CustomSpiderTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: OfficialDomainSkillPoint = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl border border-sky-400/35 text-xs min-w-52 z-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5 mb-1.5">
          <span className="font-black text-sky-300">{data.title}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-amber-300 shrink-0">
            {data.examWeight}
          </span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Your Proficiency:</span>
            <span
              className={`font-black ${
                data.proficiency >= 70 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {data.proficiency}% ({data.rating})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Harambee Cohort Avg:</span>
            <span className="font-bold text-sky-200">{data.cohortAvg}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Questions Answered:</span>
            <span className="font-semibold text-slate-200">
              {data.isLive ? `${data.correct}/${data.total} correct` : 'Baseline projection'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="AZ-900 Six-Domain Skill Radar Spider Chart"
      className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
    >
      <KitengeRibbon height={3} />

      {/* Top Header Bar */}
      <div className="px-3.5 sm:px-5 py-3 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-sky-400/20 border border-sky-300/40 text-sky-200 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-xs sm:text-sm md:text-base tracking-tight text-white">
                Domain Skill Radar • 6 Official AZ-900 Exam Domains
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                Avg Proficiency: {overallProficiency}%
              </span>
            </div>
            <p className="text-[11px] text-sky-100/80 hidden sm:block">
              Interactive D3 spider chart across all 6 official AZ-900 domains — click any vertex or card to drill weak domains
            </p>
          </div>
        </div>

        {/* Engine Switcher (D3 Spider Chart vs Recharts Spider) + Cohort Toggle + Drill All Weak Domains CTA */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {onDrillDomain && allWeakModuleIds.length > 0 && (
            <button
              type="button"
              onClick={() => onDrillDomain(allWeakModuleIds)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-xs flex items-center gap-1 cursor-pointer transition-all"
              title={`Launch targeted drill across weak domains (${weakDomains.map((d) => d.shortLabel).join(', ')})`}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Drill Weak Domains ({weakDomains.length})</span>
            </button>
          )}

          <div
            className="flex items-center bg-slate-950/45 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold"
            role="tablist"
            aria-label="Spider Chart Engine Switcher"
          >
            <button
              type="button"
              role="tab"
              aria-selected={rendererMode === 'd3'}
              onClick={() => setRendererMode('d3')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                rendererMode === 'd3'
                  ? 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              D3 Spider Chart
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rendererMode === 'recharts'}
              onClick={() => setRendererMode('recharts')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                rendererMode === 'recharts'
                  ? 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              Recharts Spider
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCohortOverlay((prev) => !prev)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              showCohortOverlay
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            Cohort Overlay
          </button>
        </div>
      </div>

      {/* Main Spider Chart + 6-Domain Breakdown Grid */}
      <div className="p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Column: Spider Visualization + Interactive Domain Drill-Down Bar (6 cols) */}
        <div className="lg:col-span-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 flex flex-col items-center justify-center space-y-2.5">
          {rendererMode === 'recharts' ? (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={domainSkills}>
                  <PolarGrid stroke="#CBD5E1" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="shortLabel"
                    tick={{ fill: '#0F172A', fontSize: 10.5, fontWeight: 800 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    ticks={[25, 50, 70, 100]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 8.5, fill: '#64748B' }}
                  />
                  <Tooltip content={<CustomSpiderTooltip />} />

                  {/* 70% Pass Threshold Polygon */}
                  <Radar
                    name="70% Pass Target"
                    dataKey="passTarget"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="#10B981"
                    fillOpacity={0.05}
                  />

                  {/* Optional Harambee Cohort Avg Overlay */}
                  {showCohortOverlay && (
                    <Radar
                      name="Cohort Avg"
                      dataKey="cohortAvg"
                      stroke="#F59E0B"
                      strokeWidth={1.8}
                      strokeDasharray="3 3"
                      fill="#F59E0B"
                      fillOpacity={0.12}
                    />
                  )}

                  {/* User Proficiency Spider Polygon */}
                  <Radar
                    name="Your Proficiency"
                    dataKey="proficiency"
                    stroke="#0078D4"
                    strokeWidth={2.5}
                    fill="#0078D4"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-64 sm:h-72 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${d3SpiderGeometry.size} ${d3SpiderGeometry.size}`}
                className="w-full h-full max-w-[300px] max-h-[300px] overflow-visible"
                role="img"
                aria-label="D3 Six-Domain Spider Chart"
              >
                {/* Concentric D3 Polar Rings */}
                {d3SpiderGeometry.rings.map((ring) => (
                  <g key={ring.pct}>
                    <circle
                      cx={d3SpiderGeometry.center}
                      cy={d3SpiderGeometry.center}
                      r={ring.r}
                      fill="none"
                      stroke={ring.pct === 70 ? '#10B981' : '#CBD5E1'}
                      strokeWidth={ring.pct === 70 ? 1.5 : 1}
                      strokeDasharray={ring.pct === 70 ? '4 3' : '2 2'}
                    />
                    <text
                      x={d3SpiderGeometry.center + 4}
                      y={d3SpiderGeometry.center - ring.r + 9}
                      className="text-[8px] font-bold fill-slate-500"
                    >
                      {ring.pct}%
                    </text>
                  </g>
                ))}

                {/* Radial Spokes (Highlight active/weak spoke) */}
                {d3SpiderGeometry.axes.map((axis) => {
                  const isFocused = inspectedDomain?.id === axis.id;
                  const isWeak = axis.proficiency < 70;
                  return (
                    <line
                      key={`axis-${axis.id}`}
                      x1={d3SpiderGeometry.center}
                      y1={d3SpiderGeometry.center}
                      x2={axis.xEnd}
                      y2={axis.yEnd}
                      stroke={isFocused ? '#0078D4' : isWeak ? '#F59E0B' : '#CBD5E1'}
                      strokeWidth={isFocused ? 2 : 1.1}
                      strokeDasharray={isWeak && !isFocused ? '3 2' : undefined}
                    />
                  );
                })}

                {/* 70% Pass Threshold D3 Polygon */}
                <g transform={`translate(${d3SpiderGeometry.center}, ${d3SpiderGeometry.center})`}>
                  <path
                    d={d3SpiderGeometry.targetPath}
                    fill="rgba(16, 185, 129, 0.05)"
                    stroke="#10B981"
                    strokeWidth={1.4}
                    strokeDasharray="4 3"
                  />
                </g>

                {/* Cohort Benchmark Polygon */}
                {showCohortOverlay && (
                  <g transform={`translate(${d3SpiderGeometry.center}, ${d3SpiderGeometry.center})`}>
                    <path
                      d={d3SpiderGeometry.cohortPath}
                      fill="rgba(245, 158, 11, 0.14)"
                      stroke="#F59E0B"
                      strokeWidth={1.75}
                      strokeDasharray="3 3"
                    />
                  </g>
                )}

                {/* User Proficiency D3 Spider Polygon */}
                <g transform={`translate(${d3SpiderGeometry.center}, ${d3SpiderGeometry.center})`}>
                  <path
                    d={d3SpiderGeometry.userPath}
                    fill="rgba(0, 120, 212, 0.32)"
                    stroke="#0078D4"
                    strokeWidth={2.5}
                  />
                </g>

                {/* Interactive Vertices & Axis Labels (Click or Hover to Inspect / Drill Weak Domain) */}
                {d3SpiderGeometry.axes.map((axis) => {
                  const isSelected = inspectedDomain?.id === axis.id;
                  const isWeak = axis.proficiency < 70;
                  return (
                    <g
                      key={`vertex-${axis.id}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDomainId(axis.id)}
                      onMouseLeave={() => setHoveredDomainId(null)}
                      onClick={() => {
                        setSelectedDomainId(axis.id);
                      }}
                    >
                      {isWeak && (
                        <circle
                          cx={axis.xVertex}
                          cy={axis.yVertex}
                          r={isSelected ? 10 : 8}
                          fill="rgba(245, 158, 11, 0.25)"
                        />
                      )}
                      <circle
                        cx={axis.xVertex}
                        cy={axis.yVertex}
                        r={isSelected ? 6.5 : 5}
                        fill={axis.proficiency >= 70 ? '#10B981' : '#F59E0B'}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      <text
                        x={axis.xLabel}
                        y={axis.yLabel}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`text-[8.5px] font-extrabold transition-colors ${
                          isSelected
                            ? 'fill-[#0078D4]'
                            : isWeak
                            ? 'fill-amber-800'
                            : 'fill-slate-800'
                        }`}
                      >
                        {axis.shortLabel} ({axis.proficiency}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Spider Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-slate-600 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4] inline-block" />
              <span>Your Proficiency</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Weak Domain (&lt;70%)</span>
            </span>
            {showCohortOverlay && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
                <span>Cohort Benchmark</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" />
              <span>70% Exam Pass Target</span>
            </span>
          </div>

          {/* Interactive Selected / Weak Domain Drill-Down Inspector Bar */}
          {inspectedDomain && (
            <div className="w-full p-2.5 rounded-xl bg-white border border-sky-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-[#0078D4] text-[9.5px] font-black uppercase">
                    Selected Vertex: D{inspectedDomain.domainNumber}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    {inspectedDomain.title}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                      inspectedDomain.proficiency >= 70
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {inspectedDomain.proficiency}% ({inspectedDomain.proficiency >= 70 ? 'Passing' : `${70 - inspectedDomain.proficiency}% to 70% Target`})
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-0.5">
                  Exam Weight: <strong>{inspectedDomain.examWeight}</strong> • Modules:{' '}
                  <strong>{inspectedDomain.moduleIds.map((m) => `M${m}`).join(', ')}</strong> • Cohort Avg: {inspectedDomain.cohortAvg}%
                </p>
              </div>

              {(onDrillDomain || onSelectModule) && (
                <button
                  type="button"
                  onClick={() => {
                    if (onDrillDomain) {
                      onDrillDomain(inspectedDomain.moduleIds);
                    } else if (onSelectModule) {
                      onSelectModule(inspectedDomain.moduleIds[0]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-black flex items-center gap-1 shadow-2xs cursor-pointer shrink-0 transition-colors"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Drill D{inspectedDomain.domainNumber} ({inspectedDomain.moduleIds.map((m) => `M${m}`).join(', ')})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Six Official AZ-900 Domains Interactive Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-2.5">
          {/* Top Strength vs Priority Gap Strip */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-800">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  Strongest Domain
                </span>
                <span>{strongestDomain?.proficiency}%</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                {strongestDomain?.title}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-900">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Priority Focus Domain
                </span>
                <span>{weakestDomain?.proficiency}%</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                {weakestDomain?.title}
              </p>
            </div>
          </div>

          {/* 6 Official Domain Skill Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {domainSkills.map((dom) => {
              const isPassing = dom.proficiency >= 70;
              const isSelected = inspectedDomain?.id === dom.id;
              return (
                <div
                  key={dom.id}
                  onClick={() => setSelectedDomainId(dom.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-sky-50/90 border-[#0078D4] ring-1 ring-[#0078D4]/30 shadow-2xs'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/90 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Domain {dom.domainNumber} • {dom.examWeight}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {dom.title}
                      </h4>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 ${
                        isPassing
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {dom.proficiency}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dom.proficiency}%`,
                        backgroundColor: dom.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold pt-0.5">
                    <span className="text-slate-500">
                      Mods {dom.moduleIds.map((m) => `M${m}`).join(', ')}
                    </span>
                    {onDrillDomain ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrillDomain(dom.moduleIds);
                        }}
                        className="text-[#0078D4] hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Drill Domain</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ) : onSelectModule ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectModule(dom.moduleIds[0]);
                        }}
                        className="text-[#0078D4] hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Practice</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
