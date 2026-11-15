import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Target,
  ExternalLink,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import {
  AZURE_CONCEPT_SERVICES,
  AzureConceptServiceNode,
  ConceptServiceCategory,
} from '../data/azureConceptMapData';
import { LEARNING_PATHS } from '../data/curriculum';

export interface DomainKnowledgeMapD3Props {
  onPracticeModule?: (moduleId: number) => void;
  onNavigateToPractice?: () => void;
}

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  shortLabel: string;
  category: ConceptServiceCategory;
  summary: string;
  examRule: string;
  relatedModuleIds: number[];
  connectedEdges: Array<{ targetId: string; relationship: string }>;
  color: string;
  radius: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string | SimulationNode;
  target: string | SimulationNode;
  relationship: string;
}

const CATEGORY_COLORS: Record<ConceptServiceCategory, string> = {
  Storage: '#0284C7', // Sky 600
  Compute: '#4F46E5', // Indigo 600
  Networking: '#059669', // Emerald 600
  'Identity & Security': '#7C3AED', // Violet 600
  'Governance & Compliance': '#D97706', // Amber 600
  'Cost & FinOps': '#EA580C', // Orange 600
  'Deployment & Monitoring': '#E11D48', // Rose 600
};

export const DomainKnowledgeMapD3: React.FC<DomainKnowledgeMapD3Props> = ({
  onPracticeModule,
  onNavigateToPractice,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ConceptServiceCategory | 'All'>('All');
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Prepare graph data
  const { nodes, links } = useMemo(() => {
    const rawNodes =
      selectedCategory === 'All'
        ? AZURE_CONCEPT_SERVICES
        : AZURE_CONCEPT_SERVICES.filter((s) => s.category === selectedCategory);

    const nodeIds = new Set(rawNodes.map((n) => n.id));

    const simNodes: SimulationNode[] = rawNodes.map((s) => ({
      ...s,
      color: CATEGORY_COLORS[s.category] || '#0078D4',
      radius: s.connectedEdges.length >= 3 ? 24 : 18,
    }));

    const simLinks: SimulationLink[] = [];
    rawNodes.forEach((sourceNode) => {
      sourceNode.connectedEdges.forEach((edge) => {
        if (nodeIds.has(edge.targetId)) {
          simLinks.push({
            source: sourceNode.id,
            target: edge.targetId,
            relationship: edge.relationship,
          });
        }
      });
    });

    return { nodes: simNodes, links: simLinks };
  }, [selectedCategory]);

  // Set default selected node
  useEffect(() => {
    if (!selectedNode && nodes.length > 0) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes, selectedNode]);

  // D3 Force Simulation & Rendering
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = 900;
    const height = 520;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', 'auto');

    // Arrow marker definition
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 26)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94A3B8');

    // Highlighting arrow
    defs
      .append('marker')
      .attr('id', 'arrow-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 26)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#0284C7');

    const containerG = svg.append('g').attr('class', 'network-container');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        containerG.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 18));

    // Links
    const linkG = containerG
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 2')
      .attr('marker-end', 'url(#arrow)');

    // Nodes container
    const nodeG = containerG
      .append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer')
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer glow / circle
    nodeG
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2.5)
      .attr('class', 'transition-all duration-150');

    // Node Text Label
    nodeG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 14)
      .attr('class', 'text-[11px] font-bold fill-slate-800 dark:fill-slate-100 pointer-events-none select-none')
      .text((d) => d.shortLabel);

    // Hover interactions
    nodeG
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);

        // Highlight connected nodes and edges
        const connectedTargetIds = new Set(d.connectedEdges.map((e) => e.targetId));
        connectedTargetIds.add(d.id);

        nodeG.selectAll('circle').attr('opacity', (n: any) =>
          connectedTargetIds.has(n.id) || n.connectedEdges.some((e: any) => e.targetId === d.id) ? 1 : 0.25
        );

        linkG
          .attr('stroke', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? '#0284C7' : '#E2E8F0'
          )
          .attr('stroke-width', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? 2.5 : 1
          )
          .attr('marker-end', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? 'url(#arrow-active)' : 'url(#arrow)'
          );
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        nodeG.selectAll('circle').attr('opacity', 1);
        linkG.attr('stroke', '#CBD5E1').attr('stroke-width', 1.5).attr('marker-end', 'url(#arrow)');
      })
      .on('click', (_, d) => {
        setSelectedNode(d);
      });

    // Tick updates
    simulation.on('tick', () => {
      linkG
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const activeFocus = hoveredNode || selectedNode;

  return (
    <div
      ref={containerRef}
      data-testid="domain-knowledge-map-d3"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-[#004C87] to-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                Interactive D3 Graph
              </span>
              <span className="text-xs text-sky-200 font-bold">Azure Service Relationship Network</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Domain Knowledge Map (D3.js Force Network)
            </h3>
            <p className="text-xs text-sky-100 max-w-xl">
              Hover over any service node to reveal architectural relationships, interconnected Azure dependencies,
              and direct curriculum module source mapping.
            </p>
          </div>
        </div>

        {/* Zoom & Navigation Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            title="Zoom in network map"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            title="Zoom out network map"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            title="Reset map view"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-xs font-black text-slate-700 dark:text-slate-300 shrink-0 mr-2">
          Domain Category:
        </span>
        {(['All', 'Compute', 'Storage', 'Networking', 'Identity & Security', 'Governance & Compliance', 'Cost & FinOps'] as const).map(
          (cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {cat}
              </button>
            );
          }
        )}
      </div>

      {/* D3 Graph Viewport */}
      <div className="relative bg-slate-50/50 dark:bg-slate-950/40 p-2 sm:p-4 min-h-[460px] flex items-center justify-center overflow-hidden">
        <svg ref={svgRef} className="w-full h-auto cursor-grab active:cursor-grabbing" />

        {/* Floating Node Details Card (Updates on Hover & Selection) */}
        {activeFocus && (
          <div className="absolute top-4 right-4 max-w-sm w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-sky-300 dark:border-slate-700 shadow-xl p-4 text-xs space-y-3 pointer-events-auto transition-all animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeFocus.color }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {activeFocus.category}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {activeFocus.name}
                </h4>
              </div>

              {/* Module Source Badges */}
              <div className="flex flex-wrap gap-1">
                {activeFocus.relatedModuleIds.map((mId) => (
                  <span
                    key={mId}
                    className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#0078D4] dark:text-sky-300 font-black text-[10px] border border-sky-200 dark:border-sky-800"
                    title={`Module ${mId}`}
                  >
                    M{mId}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {activeFocus.summary}
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="font-black text-amber-950 dark:text-amber-200 text-[11px] block">
                Exam Rule Anchor
              </span>
              <p className="text-amber-900 dark:text-amber-300 text-[11px] mt-0.5 font-medium">
                {activeFocus.examRule}
              </p>
            </div>

            {/* Interconnected Service Relationships */}
            {activeFocus.connectedEdges.length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                  Service Relationships ({activeFocus.connectedEdges.length})
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {activeFocus.connectedEdges.map((edge) => {
                    const targetService = AZURE_CONCEPT_SERVICES.find((s) => s.id === edge.targetId);
                    return (
                      <div
                        key={edge.targetId}
                        className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {targetService?.shortLabel || edge.targetId}
                        </span>
                        <span className="text-[10px] font-bold text-[#0078D4] dark:text-sky-300 shrink-0 ml-2">
                          {edge.relationship}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Action */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              {onPracticeModule && (
                <button
                  type="button"
                  onClick={() => onPracticeModule(activeFocus.relatedModuleIds[0] || 1)}
                  className="w-full py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Practice Module {activeFocus.relatedModuleIds[0] || 1}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
