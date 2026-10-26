import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Layers,
  Filter,
  Sparkles,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { BUILTIN_QUESTIONS } from '../data/questionBank';

export interface DomainAccuracyHeatmapD3Props {
  stats: UserStats;
  onSelectModule?: (moduleId: number, pathId?: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
  onDrillWeakAreas?: (moduleIds: number[]) => void;
  compact?: boolean;
}

interface HeatmapCellDatum {
  id: string;
  rowIndex: number;
  colIndex: number;
  rowLabel: string;
  rowShortLabel: string;
  colLabel: string;
  pathId: 1 | 2 | 3;
  moduleId: number;
  moduleTitle: string;
  accuracy: number | null; // null when unattempted
  correct: number;
  total: number;
  examWeight: string;
  tierLabel: string;
  difficultyLabel?: string;
}

type HeatmapDimensionMode = 'domain-modules' | 'domain-difficulty';

export const DomainAccuracyHeatmapD3: React.FC<DomainAccuracyHeatmapD3Props> = ({
  stats,
  onSelectModule,
  onLaunchMicroDrill,
  onDrillWeakAreas,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [dimensionMode, setDimensionMode] = useState<HeatmapDimensionMode>('domain-modules');
  const [containerWidth, setContainerWidth] = useState<number>(780);
  const [selectedCell, setSelectedCell] = useState<HeatmapCellDatum | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellDatum | null>(null);

  // Map questionId -> difficulty from built-in bank for difficulty-tier breakdown
  const questionDifficultyMap = useMemo(() => {
    const map = new Map<string, 'Fundamental' | 'Intermediate' | 'Advanced'>();
    BUILTIN_QUESTIONS.forEach((q) => {
      map.set(q.id, q.difficulty);
    });
    return map;
  }, []);

  // Build heatmap cells for Mode 1 (3 AZ-900 Domains x 4 Module Slots) and Mode 2 (3 AZ-900 Domains x Difficulty Tiers)
  const heatmapCells = useMemo<HeatmapCellDatum[]>(() => {
    if (dimensionMode === 'domain-modules') {
      const cells: HeatmapCellDatum[] = [];
      LEARNING_PATHS.forEach((path, rIdx) => {
        path.modules.forEach((mod, cIdx) => {
          const mastery = stats.moduleMastery?.[mod.id] || { correct: 0, total: 0 };
          const acc =
            mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : null;

          const tierLabel =
            acc === null
              ? 'Unattempted'
              : acc >= 85
              ? 'Mastery (85%+)'
              : acc >= 70
              ? 'Passing (70–84%)'
              : acc >= 50
              ? 'Developing (50–69%)'
              : 'Critical Weak Area (<50%)';

          cells.push({
            id: `p${path.id}-m${mod.id}`,
            rowIndex: rIdx,
            colIndex: cIdx,
            rowLabel: `Path ${path.id}: ${
              path.id === 1
                ? 'Cloud Concepts'
                : path.id === 2
                ? 'Architecture & Services'
                : 'Management & Governance'
            }`,
            rowShortLabel: `Path ${path.id} (${path.examWeight})`,
            colLabel: `Domain Slot ${cIdx + 1}`,
            pathId: path.id,
            moduleId: mod.id,
            moduleTitle: `M${mod.id}: ${mod.title}`,
            accuracy: acc,
            correct: mastery.correct,
            total: mastery.total,
            examWeight: path.examWeight,
            tierLabel,
          });
        });
      });
      return cells;
    }

    // Mode 2: 3 AZ-900 Domains x 4 Columns (Fundamental, Intermediate, Advanced, Domain Overall)
    const difficulties: Array<'Fundamental' | 'Intermediate' | 'Advanced' | 'Overall'> = [
      'Fundamental',
      'Intermediate',
      'Advanced',
      'Overall',
    ];

    const cells: HeatmapCellDatum[] = [];
    LEARNING_PATHS.forEach((path, rIdx) => {
      // Find weakest module in this path so clicking drills that module
      let weakestMod = path.modules[0];
      let lowestAcc = 101;
      path.modules.forEach((m) => {
        const mStat = stats.moduleMastery?.[m.id] || { correct: 0, total: 0 };
        const pct = mStat.total > 0 ? Math.round((mStat.correct / mStat.total) * 100) : 0;
        if (pct < lowestAcc) {
          lowestAcc = pct;
          weakestMod = m;
        }
      });

      difficulties.forEach((diff, cIdx) => {
        let correct = 0;
        let total = 0;

        if (diff === 'Overall') {
          const pStat = stats.pathMastery?.[path.id] || { correct: 0, total: 0 };
          correct = pStat.correct;
          total = pStat.total;
        } else {
          Object.entries(stats.attempts || {}).forEach(([qId, attemptList]) => {
            const qDiff = questionDifficultyMap.get(qId) || 'Intermediate';
            if (qDiff !== diff) return;
            attemptList.forEach((att) => {
              if (att.pathId === path.id) {
                total += 1;
                if (att.isCorrect) correct += 1;
              }
            });
          });
        }

        const acc = total > 0 ? Math.round((correct / total) * 100) : null;
        const tierLabel =
          acc === null
            ? 'Unattempted'
            : acc >= 85
            ? 'Mastery (85%+)'
            : acc >= 70
            ? 'Passing (70–84%)'
            : acc >= 50
            ? 'Developing (50–69%)'
            : 'Critical Weak Area (<50%)';

        cells.push({
          id: `p${path.id}-diff-${diff}`,
          rowIndex: rIdx,
          colIndex: cIdx,
          rowLabel: `Path ${path.id}: ${
            path.id === 1
              ? 'Cloud Concepts'
              : path.id === 2
              ? 'Architecture & Services'
              : 'Management & Governance'
          }`,
          rowShortLabel: `Path ${path.id} (${path.examWeight})`,
          colLabel: diff === 'Overall' ? 'Domain Total' : diff,
          pathId: path.id,
          moduleId: weakestMod.id,
          moduleTitle: `${diff} Tier • Weakest: M${weakestMod.id} (${weakestMod.title})`,
          accuracy: acc,
          correct,
          total,
          examWeight: path.examWeight,
          tierLabel,
          difficultyLabel: diff,
        });
      });
    });

    return cells;
  }, [dimensionMode, stats, questionDifficultyMap]);

  // Identify weak modules (<70% or unattempted) for instant action buttons
  const weakAreasSummary = useMemo(() => {
    const weakList: Array<{
      moduleId: number;
      pathId: 1 | 2 | 3;
      title: string;
      accuracy: number | null;
      total: number;
    }> = [];

    LEARNING_PATHS.forEach((p) => {
      p.modules.forEach((m) => {
        const st = stats.moduleMastery?.[m.id] || { correct: 0, total: 0 };
        const acc = st.total > 0 ? Math.round((st.correct / st.total) * 100) : null;
        if (acc === null || acc < 70) {
          weakList.push({
            moduleId: m.id,
            pathId: p.id,
            title: m.title,
            accuracy: acc,
            total: st.total,
          });
        }
      });
    });

    // Sort attempted lowest accuracy first, then unattempted
    weakList.sort((a, b) => {
      if (a.accuracy !== null && b.accuracy !== null) return a.accuracy - b.accuracy;
      if (a.accuracy !== null) return -1;
      if (b.accuracy !== null) return 1;
      return a.moduleId - b.moduleId;
    });

    return weakList;
  }, [stats.moduleMastery]);

  // Observe container width for responsive Computer, Laptop, Tablet, and Mobile rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(Math.floor(rect.width));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Render D3.js Heatmap inside SVG
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const isMobile = containerWidth < 520;
    const isTablet = containerWidth >= 520 && containerWidth < 768;

    const margin = {
      top: isMobile ? 34 : 40,
      right: isMobile ? 10 : 18,
      bottom: isMobile ? 14 : 18,
      left: isMobile ? 96 : isTablet ? 150 : 210,
    };

    const rowHeight = compact ? (isMobile ? 64 : 70) : isMobile ? 72 : 82;
    const numRows = 3;
    const svgHeight = margin.top + numRows * rowHeight + margin.bottom;
    const innerWidth = Math.max(200, containerWidth - margin.left - margin.right);
    const innerHeight = numRows * rowHeight;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${containerWidth} ${svgHeight}`)
      .attr('width', '100%')
      .attr('height', svgHeight);

    const rowDomain = ['0', '1', '2'];
    const colDomain = ['0', '1', '2', '3'];

    const xScale = d3
      .scaleBand<string>()
      .domain(colDomain)
      .range([0, innerWidth])
      .paddingInner(isMobile ? 0.06 : 0.08)
      .paddingOuter(0.02);

    const yScale = d3
      .scaleBand<string>()
      .domain(rowDomain)
      .range([0, innerHeight])
      .paddingInner(0.12)
      .paddingOuter(0.04);

    // D3 piecewise color scale mapping 0..100% accuracy to intuitive semantic colors
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 49, 50, 69, 70, 84, 85, 100])
      .range([
        '#fee2e2', // 0% soft crimson
        '#fecaca', // 49% crimson
        '#fef3c7', // 50% warm amber
        '#fde68a', // 69% amber
        '#e0f2fe', // 70% passing azure sky
        '#bae6fd', // 84% azure sky
        '#d1fae5', // 85% mastery emerald
        '#a7f3d0', // 100% rich emerald
      ])
      .clamp(true);

    const strokeColorForCell = (acc: number | null): string => {
      if (acc === null) return '#cbd5e1';
      if (acc >= 85) return '#10b981';
      if (acc >= 70) return '#0078d4';
      if (acc >= 50) return '#f59e0b';
      return '#ef4444';
    };

    const badgeBgForCell = (acc: number | null): string => {
      if (acc === null) return '#64748b';
      if (acc >= 85) return '#047857';
      if (acc >= 70) return '#0078d4';
      if (acc >= 50) return '#b45309';
      return '#dc2626';
    };

    const rootG = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Column Headers
    const colLabels =
      dimensionMode === 'domain-modules'
        ? isMobile
          ? ['Mod Slot 1', 'Mod Slot 2', 'Mod Slot 3', 'Mod Slot 4']
          : ['Domain Module 1', 'Domain Module 2', 'Domain Module 3', 'Domain Module 4']
        : isMobile
        ? ['Fund.', 'Interm.', 'Adv.', 'Overall']
        : ['Fundamental', 'Intermediate', 'Advanced', 'Domain Overall'];

    rootG
      .selectAll('.heatmap-col-label')
      .data(colDomain)
      .enter()
      .append('text')
      .attr('class', 'heatmap-col-label')
      .attr('x', (d) => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .style('font-size', isMobile ? '10px' : '11px')
      .style('font-weight', '800')
      .text((_, i) => colLabels[i]);

    // Row Labels (3 AZ-900 Domains with Exam Weights)
    const rowMeta = LEARNING_PATHS.map((p) => ({
      id: p.id,
      title: isMobile
        ? `Path ${p.id}`
        : isTablet
        ? `Path ${p.id}: ${
            p.id === 1 ? 'Concepts' : p.id === 2 ? 'Architecture' : 'Governance'
          }`
        : `Path ${p.id}: ${
            p.id === 1
              ? 'Cloud Concepts'
              : p.id === 2
              ? 'Architecture & Services'
              : 'Management & Governance'
          }`,
      weight: `Weight: ${p.examWeight}`,
      accent: p.accentColor,
    }));

    const rowG = rootG
      .selectAll('.heatmap-row-label')
      .data(rowMeta)
      .enter()
      .append('g')
      .attr('class', 'heatmap-row-label')
      .attr(
        'transform',
        (_, i) => `translate(-10, ${(yScale(String(i)) || 0) + yScale.bandwidth() / 2})`
      );

    rowG
      .append('text')
      .attr('x', 0)
      .attr('y', -4)
      .attr('text-anchor', 'end')
      .attr('fill', '#0f172a')
      .style('font-size', isMobile ? '10.5px' : '12px')
      .style('font-weight', '800')
      .text((d) => d.title);

    rowG
      .append('text')
      .attr('x', 0)
      .attr('y', 11)
      .attr('text-anchor', 'end')
      .attr('fill', '#0078d4')
      .style('font-size', isMobile ? '9.5px' : '10.5px')
      .style('font-weight', '700')
      .text((d) => d.weight);

    // Heatmap Cells
    const cellGroups = rootG
      .selectAll('.heatmap-cell-group')
      .data(heatmapCells, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell-group')
      .attr(
        'transform',
        (d) =>
          `translate(${xScale(String(d.colIndex)) || 0}, ${yScale(String(d.rowIndex)) || 0})`
      )
      .style('cursor', 'pointer')
      .on('mouseenter', function (_, d) {
        setHoveredCell(d);
        d3.select(this)
          .select('rect.cell-bg')
          .transition()
          .duration(150)
          .attr('stroke-width', 2.5)
          .attr('transform', 'scale(1.015)');
      })
      .on('mouseleave', function (_, d) {
        setHoveredCell(null);
        const isSelected = selectedCell?.id === d.id;
        d3.select(this)
          .select('rect.cell-bg')
          .transition()
          .duration(150)
          .attr('stroke-width', isSelected ? 2.5 : 1.5)
          .attr('transform', 'scale(1)');
      })
      .on('click', (_, d) => {
        setSelectedCell(d);
      });

    // Cell Background Rect with D3 Entrance Transition
    cellGroups
      .append('rect')
      .attr('class', 'cell-bg')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', (d) => (d.accuracy === null ? '#f8fafc' : colorScale(d.accuracy)))
      .attr('stroke', (d) => strokeColorForCell(d.accuracy))
      .attr('stroke-width', (d) => (selectedCell?.id === d.id ? 2.5 : 1.5))
      .attr('opacity', 0)
      .transition()
      .duration(420)
      .delay((_, i) => i * 28)
      .attr('opacity', 1);

    // Module Code / Tier Header inside cell
    cellGroups
      .append('text')
      .attr('x', 8)
      .attr('y', isMobile ? 15 : 18)
      .attr('fill', '#0f172a')
      .style('font-size', isMobile ? '9.5px' : '11px')
      .style('font-weight', '800')
      .text((d) => {
        if (dimensionMode === 'domain-difficulty') {
          return d.colLabel;
        }
        const maxChars = isMobile ? 10 : isTablet ? 14 : 20;
        const cleanTitle = d.moduleTitle;
        return cleanTitle.length > maxChars
          ? `${cleanTitle.slice(0, maxChars - 1)}…`
          : cleanTitle;
      });

    // Accuracy Pill Badge inside cell
    const badgeWidth = isMobile ? 42 : 52;
    const badgeHeight = isMobile ? 18 : 20;

    cellGroups
      .append('rect')
      .attr('x', 8)
      .attr('y', isMobile ? 23 : 27)
      .attr('width', badgeWidth)
      .attr('height', badgeHeight)
      .attr('rx', 5)
      .attr('fill', (d) => badgeBgForCell(d.accuracy));

    cellGroups
      .append('text')
      .attr('x', 8 + badgeWidth / 2)
      .attr('y', (isMobile ? 23 : 27) + badgeHeight / 2 + 3.5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .style('font-size', isMobile ? '9.5px' : '10.5px')
      .style('font-weight', '900')
      .text((d) => (d.accuracy === null ? 'NEW' : `${d.accuracy}%`));

    // Attempt count & status label at bottom of cell
    cellGroups
      .append('text')
      .attr('x', 8)
      .attr('y', yScale.bandwidth() - (isMobile ? 7 : 9))
      .attr('fill', '#334155')
      .style('font-size', isMobile ? '8.5px' : '10px')
      .style('font-weight', '700')
      .text((d) => {
        if (d.total === 0) return isMobile ? '0 Qs' : '0 attempted • Click to drill';
        if (isMobile) return `${d.correct}/${d.total} Qs`;
        return `${d.correct}/${d.total} correct ${d.accuracy !== null && d.accuracy < 70 ? '• Weak' : '• Ready'}`;
      });
  }, [heatmapCells, containerWidth, dimensionMode, compact, selectedCell]);

  const activeInspectedCell = hoveredCell || selectedCell || heatmapCells[0];

  return (
    <section
      aria-label="D3 Domain Accuracy Heatmap"
      className="bg-white rounded-xl border border-slate-200/90 card-elevation overflow-hidden w-full min-w-0"
    >
      {/* Top Header Strip */}
      <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-[#0B2545] to-[#005A9E] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              D3.js Visual Diagnostic Matrix
            </span>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
              AZ-900 Domain Accuracy Heatmap
            </h3>
          </div>
          <p className="text-xs text-sky-100/90">
            Interactive D3.js accuracy matrix across all 3 official AZ-900 domains and 12 modules — click any cell to inspect or drill weak areas
          </p>
        </div>

        {/* Dimension Switcher Buttons (Always clearly visible across Mobile, Tablet, Laptop & Computer) */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setDimensionMode('domain-modules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
              dimensionMode === 'domain-modules'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>By Domain &amp; Module (12)</span>
          </button>

          <button
            type="button"
            onClick={() => setDimensionMode('domain-difficulty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
              dimensionMode === 'domain-difficulty'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>By Difficulty Tier</span>
          </button>
        </div>
      </div>

      {/* Color Scale Legend & Quick Weak-Area Summary Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">
            Accuracy Scale:
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <span className="w-3 h-3 rounded-xs bg-red-200 border border-red-500 inline-block" />
            <span>&lt;50% Critical</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <span className="w-3 h-3 rounded-xs bg-amber-200 border border-amber-500 inline-block" />
            <span>50–69% Developing</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <span className="w-3 h-3 rounded-xs bg-sky-200 border border-[#0078D4] inline-block" />
            <span>70–84% Passing</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <span className="w-3 h-3 rounded-xs bg-emerald-200 border border-emerald-600 inline-block" />
            <span>85%+ Mastery</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-400 inline-block" />
            <span>New</span>
          </span>
        </div>

        {weakAreasSummary.length > 0 && onDrillWeakAreas && (
          <button
            type="button"
            onClick={() => onDrillWeakAreas(weakAreasSummary.map((w) => w.moduleId))}
            className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
            <span>Drill All {weakAreasSummary.length} Weak/New Modules</span>
          </button>
        )}
      </div>

      {/* Responsive D3 SVG Canvas Container */}
      <div className="p-3 sm:p-5 space-y-4">
        <div
          ref={containerRef}
          className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-1 sm:p-2"
        >
          <svg
            ref={svgRef}
            role="img"
            aria-label="D3.js AZ-900 Domain Accuracy Heatmap"
            className="w-full block select-none"
          />
        </div>

        {/* Interactive Cell Inspector & Direct Action Bar */}
        {activeInspectedCell && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#0078D4]/10 text-[#0078D4]">
                  {activeInspectedCell.rowShortLabel}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    activeInspectedCell.accuracy === null
                      ? 'bg-slate-200 text-slate-700'
                      : activeInspectedCell.accuracy >= 70
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activeInspectedCell.tierLabel}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {activeInspectedCell.accuracy !== null
                    ? `${activeInspectedCell.accuracy}% Accuracy (${activeInspectedCell.correct}/${activeInspectedCell.total} correct)`
                    : 'No attempts recorded yet'}
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                {activeInspectedCell.moduleTitle}
              </h4>

              <p className="text-[11px] text-slate-600">
                {activeInspectedCell.accuracy === null
                  ? 'Start practicing this module to establish your baseline AZ-900 domain accuracy.'
                  : activeInspectedCell.accuracy < 70
                  ? `Below the 70% Microsoft passing benchmark (${70 - activeInspectedCell.accuracy}% gap). Prioritize this module for active recall.`
                  : 'Exceeds the 70% AZ-900 passing mark. Keep reinforcing with periodic spaced-repetition drills.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onSelectModule && (
                <button
                  type="button"
                  onClick={() =>
                    onSelectModule(activeInspectedCell.moduleId, activeInspectedCell.pathId)
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Practice Module {activeInspectedCell.moduleId}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}

              {onLaunchMicroDrill && (
                <button
                  type="button"
                  onClick={() => onLaunchMicroDrill(activeInspectedCell.moduleId)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                  <span>5-Q Rapid Micro-Drill</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Priority Weak Areas Quick-Action Pills */}
        {weakAreasSummary.length > 0 ? (
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-rose-800 flex items-center gap-1 mr-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Priority Focus Modules (&lt;70%):</span>
            </span>
            {weakAreasSummary.slice(0, 6).map((item) => (
              <button
                key={item.moduleId}
                type="button"
                onClick={() => {
                  if (onSelectModule) {
                    onSelectModule(item.moduleId, item.pathId);
                  } else if (onLaunchMicroDrill) {
                    onLaunchMicroDrill(item.moduleId);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                title={`Practice Module ${item.moduleId}: ${item.title}`}
              >
                <span>M{item.moduleId}</span>
                <span className="font-mono text-[10px] px-1 rounded bg-rose-200/80 text-rose-950">
                  {item.accuracy !== null ? `${item.accuracy}%` : 'New'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="pt-1 flex items-center gap-2 text-xs font-extrabold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All 12 AZ-900 modules are currently at or above the 70% passing threshold!</span>
          </div>
        )}
      </div>
    </section>
  );
};
