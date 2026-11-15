import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Sparkles, Filter, Layers, Target, BookOpen, AlertTriangle, CheckCircle2, RotateCw, ExternalLink } from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { AZ900_SERVICE_CONCEPTS, AzureServiceConceptItem } from './AzureServiceConceptHeatmap';

export interface AzureConceptMasteryD3HeatmapProps {
  stats: UserStats;
  questions: Question[];
  onOpenStudyModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onPracticeConcept?: (moduleId: number, pathId: 1 | 2 | 3, keyword: string) => void;
}

interface ConceptHeatmapDatum {
  id: string;
  serviceName: string;
  shortName: string;
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  pathLabel: string;
  keywords: string[];
  governingRule: string;
  commonTrap: string;
  correctCount: number;
  missedCount: number;
  totalAttempts: number;
  masteryPercent: number; // 0..100
  confidenceScore: number; // 1..5
  status: 'mastered' | 'developing' | 'needs_review' | 'unattempted';
}

export const AzureConceptMasteryD3Heatmap: React.FC<AzureConceptMasteryD3HeatmapProps> = ({
  stats,
  questions,
  onOpenStudyModule,
  onPracticeConcept,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedPathFilter, setSelectedPathFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [hoveredConcept, setHoveredConcept] = useState<ConceptHeatmapDatum | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<ConceptHeatmapDatum | null>(null);
  const [sortBy, setSortBy] = useState<'module' | 'mastery-asc' | 'mastery-desc'>('module');

  // Compute metrics for each concept
  const conceptData = useMemo<ConceptHeatmapDatum[]>(() => {
    const qMap = new Map<string, Question>();
    questions.forEach((q) => qMap.set(q.id, q));

    return AZ900_SERVICE_CONCEPTS.map((concept) => {
      let correctCount = 0;
      let missedCount = 0;
      let confidenceSum = 0;
      let confidenceCount = 0;

      // Check user attempts
      Object.entries(stats.attempts || {}).forEach(([qId, attemptList]) => {
        const q = qMap.get(qId);
        if (!q || q.moduleId !== concept.moduleId) return;

        const textBlob = `${q.question} ${q.scenario} ${q.whyCorrect} ${q.examTip}`.toLowerCase();
        const matchesKeyword = concept.keywords.some((kw) => textBlob.includes(kw.toLowerCase()));

        if (matchesKeyword) {
          attemptList.forEach((att) => {
            if (att.isCorrect) correctCount += 1;
            else missedCount += 1;
          });
        }
      });

      // Check confidence scores for questions in this concept
      questions.forEach((q) => {
        if (q.moduleId === concept.moduleId) {
          const textBlob = `${q.question} ${q.scenario} ${q.whyCorrect}`.toLowerCase();
          if (concept.keywords.some((kw) => textBlob.includes(kw.toLowerCase()))) {
            const conf = stats.confidenceScores?.[q.id];
            if (conf) {
              confidenceSum += conf;
              confidenceCount += 1;
            }
          }
        }
      });

      // Fallback to moduleMastery if concept-level attempts are scarce
      if (correctCount === 0 && missedCount === 0 && stats.moduleMastery?.[concept.moduleId]) {
        const mod = stats.moduleMastery[concept.moduleId];
        if (mod.total > 0) {
          correctCount = Math.round(mod.correct / 2);
          missedCount = Math.round((mod.total - mod.correct) / 2);
        }
      }

      const totalAttempts = correctCount + missedCount;
      const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
      const avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : stats.moduleConfidenceScores?.[concept.moduleId] || 3;

      // Calculate composite mastery (70% accuracy + 30% confidence scale)
      let masteryPercent = 0;
      let status: ConceptHeatmapDatum['status'] = 'unattempted';

      if (totalAttempts > 0) {
        masteryPercent = Math.min(100, Math.round(accuracyPercent * 0.75 + (avgConfidence / 5) * 25));
        if (masteryPercent >= 80) status = 'mastered';
        else if (masteryPercent >= 55) status = 'developing';
        else status = 'needs_review';
      } else {
        masteryPercent = 0;
        status = 'unattempted';
      }

      return {
        ...concept,
        correctCount,
        missedCount,
        totalAttempts,
        masteryPercent,
        confidenceScore: Math.round(avgConfidence * 10) / 10,
        status,
      };
    });
  }, [stats, questions]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = conceptData;
    if (selectedPathFilter !== 'all') {
      result = result.filter((c) => c.pathId === selectedPathFilter);
    }

    if (sortBy === 'mastery-asc') {
      return [...result].sort((a, b) => a.masteryPercent - b.masteryPercent);
    }
    if (sortBy === 'mastery-desc') {
      return [...result].sort((a, b) => b.masteryPercent - a.masteryPercent);
    }
    return [...result].sort((a, b) => a.moduleId - b.moduleId);
  }, [conceptData, selectedPathFilter, sortBy]);

  // Set default selected concept
  useEffect(() => {
    if (!selectedConcept && filteredData.length > 0) {
      setSelectedConcept(filteredData[0]);
    }
  }, [filteredData, selectedConcept]);

  // D3 Heatmap Rendering
  useEffect(() => {
    if (!svgRef.current || filteredData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 50, right: 30, bottom: 40, left: 190 };
    const width = 850;
    const rowHeight = 32;
    const height = margin.top + margin.bottom + filteredData.length * rowHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', 'auto');

    // Gradient definitions
    const defs = svg.append('defs');

    // Color scales for heatmap cells
    const getColor = (d: ConceptHeatmapDatum) => {
      if (d.status === 'unattempted') return '#94A3B8'; // Slate 400
      if (d.masteryPercent >= 80) return '#059669'; // Emerald 600
      if (d.masteryPercent >= 65) return '#10B981'; // Emerald 500
      if (d.masteryPercent >= 50) return '#F59E0B'; // Amber 500
      if (d.masteryPercent >= 35) return '#F97316'; // Orange 500
      return '#DC2626'; // Rose 600
    };

    // Columns representing metrics: [Mastery %, Accuracy, Confidence, Status]
    const columns = [
      { key: 'mastery', label: 'Mastery Level', x: 200, width: 220 },
      { key: 'accuracy', label: 'Drill Accuracy', x: 440, width: 130 },
      { key: 'confidence', label: 'Self Confidence', x: 590, width: 110 },
      { key: 'status', label: 'Readiness Tier', x: 720, width: 110 },
    ];

    const mainG = svg.append('g').attr('transform', `translate(0, ${margin.top})`);

    // Column Headers
    const headerG = svg.append('g').attr('transform', `translate(0, 30)`);

    headerG
      .append('text')
      .attr('x', margin.left - 10)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('class', 'text-[11px] font-black fill-slate-700 dark:fill-slate-300 uppercase tracking-wider')
      .text('Azure Service Concept');

    columns.forEach((col) => {
      headerG
        .append('text')
        .attr('x', col.x + col.width / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[11px] font-black fill-slate-700 dark:fill-slate-300 uppercase tracking-wider')
        .text(col.label);
    });

    // Header divider line
    svg
      .append('line')
      .attr('x1', 20)
      .attr('x2', width - 20)
      .attr('y1', 40)
      .attr('y2', 40)
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', 1.5);

    // Concept Rows
    const rows = mainG
      .selectAll('.concept-row')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'concept-row cursor-pointer transition-all')
      .attr('transform', (_, i) => `translate(0, ${i * rowHeight})`)
      .on('mouseenter', (event: any, d) => {
        setHoveredConcept(d);
        d3.select(event.currentTarget as SVGGElement).select('.row-bg').attr('fill', '#F1F5F9').attr('fill-opacity', 0.8);
      })
      .on('mouseleave', (event: any, d) => {
        setHoveredConcept(null);
        const isCurrentSelected = selectedConcept?.id === d.id;
        d3.select(event.currentTarget as SVGGElement)
          .select('.row-bg')
          .attr('fill', isCurrentSelected ? '#E0F2FE' : '#FFFFFF')
          .attr('fill-opacity', isCurrentSelected ? 1 : 0);
      })
      .on('click', (_, d) => {
        setSelectedConcept(d);
      });

    // Row Background Hover & Active Highlight
    rows
      .append('rect')
      .attr('class', 'row-bg')
      .attr('x', 15)
      .attr('y', 0)
      .attr('width', width - 30)
      .attr('height', rowHeight - 4)
      .attr('rx', 8)
      .attr('fill', (d) => (selectedConcept?.id === d.id ? '#E0F2FE' : '#FFFFFF'))
      .attr('fill-opacity', (d) => (selectedConcept?.id === d.id ? 1 : 0))
      .attr('stroke', (d) => (selectedConcept?.id === d.id ? '#0284C7' : 'transparent'))
      .attr('stroke-width', 1.5);

    // Concept Name Label (Left Axis)
    rows
      .append('text')
      .attr('x', margin.left - 12)
      .attr('y', rowHeight / 2 - 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'text-xs font-bold fill-slate-900 dark:fill-slate-100')
      .text((d) => (d.shortName.length > 24 ? d.shortName.slice(0, 23) + '…' : d.shortName));

    // Module Badge Next to Name
    rows
      .append('rect')
      .attr('x', margin.left - 180)
      .attr('y', 5)
      .attr('width', 38)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', (d) => (d.pathId === 1 ? '#FEF3C7' : d.pathId === 2 ? '#E0F2FE' : '#F3E8FF'))
      .attr('stroke', (d) => (d.pathId === 1 ? '#F59E0B' : d.pathId === 2 ? '#0284C7' : '#9333EA'))
      .attr('stroke-width', 0.8);

    rows
      .append('text')
      .attr('x', margin.left - 161)
      .attr('y', 17)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-black')
      .attr('fill', (d) => (d.pathId === 1 ? '#B45309' : d.pathId === 2 ? '#0369A1' : '#7E22CE'))
      .text((d) => `M${d.moduleId}`);

    // Column 1: Mastery Level Heatmap Bar + Percent
    const col1 = columns[0];
    const barG = rows.append('g').attr('transform', `translate(${col1.x}, 4)`);

    // Track
    barG
      .append('rect')
      .attr('x', 0)
      .attr('y', 2)
      .attr('width', 150)
      .attr('height', 16)
      .attr('rx', 6)
      .attr('fill', '#E2E8F0');

    // Heat Bar
    barG
      .append('rect')
      .attr('x', 0)
      .attr('y', 2)
      .attr('width', (d) => (d.status === 'unattempted' ? 12 : Math.max(12, (d.masteryPercent / 100) * 150)))
      .attr('height', 16)
      .attr('rx', 6)
      .attr('fill', getColor);

    // Percentage Label
    barG
      .append('text')
      .attr('x', 160)
      .attr('y', 14)
      .attr('class', 'text-xs font-black fill-slate-800 dark:fill-slate-200')
      .text((d) => (d.status === 'unattempted' ? 'Unattempted' : `${d.masteryPercent}%`));

    // Column 2: Accuracy (Correct / Total)
    const col2 = columns[1];
    rows
      .append('text')
      .attr('x', col2.x + col2.width / 2)
      .attr('y', rowHeight / 2 - 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'text-xs font-bold fill-slate-700 dark:fill-slate-300')
      .text((d) => (d.totalAttempts > 0 ? `${d.correctCount}/${d.totalAttempts} correct` : '—'));

    // Column 3: Confidence Score (1-5 Stars/Number)
    const col3 = columns[2];
    rows
      .append('text')
      .attr('x', col3.x + col3.width / 2)
      .attr('y', rowHeight / 2 - 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'text-xs font-black fill-slate-800 dark:fill-slate-200')
      .text((d) => `★ ${d.confidenceScore} / 5`);

    // Column 4: Readiness Status Badge
    const col4 = columns[3];
    const statusG = rows.append('g').attr('transform', `translate(${col4.x + 10}, 4)`);

    statusG
      .append('rect')
      .attr('x', 0)
      .attr('y', 1)
      .attr('width', 90)
      .attr('height', 18)
      .attr('rx', 6)
      .attr('fill', (d) => {
        if (d.status === 'mastered') return '#D1FAE5';
        if (d.status === 'developing') return '#FEF3C7';
        if (d.status === 'needs_review') return '#FFE4E6';
        return '#F1F5F9';
      })
      .attr('stroke', (d) => {
        if (d.status === 'mastered') return '#10B981';
        if (d.status === 'developing') return '#F59E0B';
        if (d.status === 'needs_review') return '#F43F5E';
        return '#CBD5E1';
      })
      .attr('stroke-width', 0.8);

    statusG
      .append('text')
      .attr('x', 45)
      .attr('y', 13)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-black uppercase tracking-wider')
      .attr('fill', (d) => {
        if (d.status === 'mastered') return '#065F46';
        if (d.status === 'developing') return '#92400E';
        if (d.status === 'needs_review') return '#9F1239';
        return '#475569';
      })
      .text((d) => {
        if (d.status === 'mastered') return 'Mastered';
        if (d.status === 'developing') return 'Developing';
        if (d.status === 'needs_review') return 'Needs Focus';
        return 'Not Tested';
      });
  }, [filteredData, selectedConcept]);

  return (
    <div
      ref={containerRef}
      data-testid="azure-concept-mastery-d3-heatmap"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-[#004C87] to-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Sparkles className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                D3 Concept Mastery Analytics
              </span>
              <span className="text-xs text-sky-200 font-bold">24 AZ-900 Architectural Domains</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Azure Service Concepts Mastery Heatmap (D3.js)
            </h3>
            <p className="text-xs text-sky-100 max-w-xl">
              Visualizes accuracy, question attempts, and self-calibrated confidence across granular Azure services
              to identify weak architectural boundaries before exam day.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/20 text-xs">
            <button
              type="button"
              onClick={() => setSelectedPathFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPathFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              All Paths
            </button>
            <button
              type="button"
              onClick={() => setSelectedPathFilter(1)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPathFilter === 1 ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Path 1
            </button>
            <button
              type="button"
              onClick={() => setSelectedPathFilter(2)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPathFilter === 2 ? 'bg-sky-400 text-slate-950 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Path 2
            </button>
            <button
              type="button"
              onClick={() => setSelectedPathFilter(3)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPathFilter === 3 ? 'bg-purple-400 text-slate-950 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Path 3
            </button>
          </div>

          <div className="flex items-center bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/20 text-xs">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs font-bold cursor-pointer outline-hidden px-2 py-1"
            >
              <option value="module" className="text-slate-900">
                Sort by Module
              </option>
              <option value="mastery-asc" className="text-slate-900">
                Weakest First
              </option>
              <option value="mastery-desc" className="text-slate-900">
                Strongest First
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-extrabold text-slate-700 dark:text-slate-300">Mastery Heatmap Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">80-100% (Mastered)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">50-79% (Developing)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">&lt;50% (Needs Focus)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Unattempted</span>
          </div>
        </div>

        <span className="text-slate-500 text-[11px] font-medium">Click any row below for deep-dive analysis</span>
      </div>

      {/* Main D3 Heatmap SVG Container */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <svg ref={svgRef} className="w-full min-w-[750px]" />
      </div>

      {/* Selected Concept Deep Dive Drilldown Panel */}
      {selectedConcept && (
        <div className="bg-gradient-to-br from-sky-50/70 via-blue-50/40 to-white dark:from-slate-800 dark:to-slate-900 border-t border-sky-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#0078D4] text-white">
                  Module {selectedConcept.moduleId}: {selectedConcept.moduleTitle}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800">
                  {selectedConcept.pathLabel}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {selectedConcept.serviceName}
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onPracticeConcept && (
                <button
                  type="button"
                  onClick={() =>
                    onPracticeConcept(
                      selectedConcept.moduleId,
                      selectedConcept.pathId,
                      selectedConcept.keywords[0] || selectedConcept.shortName
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  <span>Practice Concept Questions</span>
                </button>
              )}
              {onOpenStudyModule && (
                <button
                  type="button"
                  onClick={() => onOpenStudyModule(selectedConcept.moduleId, selectedConcept.pathId)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Study Guide</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Governing Rule */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <span className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Exam Governing Rule
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {selectedConcept.governingRule}
              </p>
            </div>

            {/* Common Trap */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <span className="font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Frequent Exam Distractor Trap
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {selectedConcept.commonTrap}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
