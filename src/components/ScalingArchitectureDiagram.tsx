import React, { useState } from 'react';
import {
  ArrowUpDown,
  MoveHorizontal,
  ArrowUp,
  Cpu,
  HardDrive,
  Network,
  Activity,
  DollarSign,
  Server,
  ShieldCheck,
} from 'lucide-react';

interface ScalingArchitectureDiagramProps {
  selectedModuleId: number;
  connectedModuleIds: number[];
  onSelectModule: (moduleId: number) => void;
}

type FocusAxis = 'both' | 'vertical' | 'horizontal';

interface ModuleScalingNode {
  moduleId: number;
  pathId: 1 | 2 | 3;
  shortTitle: string;
  axis: 'vertical' | 'horizontal' | 'both' | 'context';
  verticalLabel?: string;
  horizontalLabel?: string;
  contextNote?: string;
  serviceCategory: string;
}

const ALL_12_SCALING_NODES: ModuleScalingNode[] = [
  {
    moduleId: 1,
    pathId: 1,
    shortTitle: 'Cloud Concepts',
    axis: 'context',
    contextNote: 'Defines IaaS vs PaaS operational boundaries before choosing VM vs App Service scale.',
    serviceCategory: 'Foundations',
  },
  {
    moduleId: 2,
    pathId: 1,
    shortTitle: 'Cloud Benefits',
    axis: 'both',
    verticalLabel: 'Origin: Scale Up/Down capacity on single host',
    horizontalLabel: 'Origin: Scale Out/In + automated Elasticity',
    serviceCategory: 'Origin Theory',
  },
  {
    moduleId: 3,
    pathId: 1,
    shortTitle: 'Pricing & Consumption',
    axis: 'horizontal',
    horizontalLabel: 'OpEx Consumption: billing drops when elastic nodes scale in to zero',
    serviceCategory: 'Cost & OpEx',
  },
  {
    moduleId: 4,
    pathId: 2,
    shortTitle: 'Architecture & AZs',
    axis: 'horizontal',
    horizontalLabel: 'Places horizontal instances across Zones 1, 2, 3 for 99.99% HA',
    serviceCategory: 'Geography & AZs',
  },
  {
    moduleId: 5,
    pathId: 2,
    shortTitle: 'Compute & Networking',
    axis: 'both',
    verticalLabel: 'Single VM Size SKU upgrade · ExpressRoute bandwidth tiers (50M→10G)',
    horizontalLabel: 'VMSS, App Service Autoscale, AKS Pods, Load Balancer pools',
    serviceCategory: 'Compute & Net',
  },
  {
    moduleId: 6,
    pathId: 2,
    shortTitle: 'Storage Services',
    axis: 'both',
    verticalLabel: 'Managed Disk tiering (Standard → Premium P10/P30/P80 IOPS)',
    horizontalLabel: 'Blob Storage automatic key-range partitioning for high concurrency',
    serviceCategory: 'Storage',
  },
  {
    moduleId: 7,
    pathId: 2,
    shortTitle: 'Identity & Security',
    axis: 'context',
    contextNote: 'Managed Identities scale uniformly across new VMSS/AKS nodes via Entra ID.',
    serviceCategory: 'Security Support',
  },
  {
    moduleId: 8,
    pathId: 3,
    shortTitle: 'Cost Management',
    axis: 'both',
    verticalLabel: 'Right-size oversized vertical SKUs to cut idle compute spend',
    horizontalLabel: 'Combine 1–3 yr Reservations (floor) + PAYG autoscale (burst)',
    serviceCategory: 'FinOps',
  },
  {
    moduleId: 9,
    pathId: 3,
    shortTitle: 'Governance & Policy',
    axis: 'context',
    contextNote: 'Azure Policy constrains allowed vertical VM SKUs & horizontal max counts.',
    serviceCategory: 'Policy Guardrail',
  },
  {
    moduleId: 10,
    pathId: 3,
    shortTitle: 'Management & Arc',
    axis: 'context',
    contextNote: 'Bicep / ARM Templates stamp repeatable horizontal scaling fleets cleanly.',
    serviceCategory: 'IaC Deployment',
  },
  {
    moduleId: 11,
    pathId: 3,
    shortTitle: 'Monitor & Advisor',
    axis: 'both',
    verticalLabel: 'Azure Advisor flags underutilized vertical VMs for scale-down',
    horizontalLabel: 'Azure Monitor metrics (CPU/Queue) fire horizontal autoscale rules',
    serviceCategory: 'Telemetry Loop',
  },
  {
    moduleId: 12,
    pathId: 3,
    shortTitle: 'Exam Synthesis',
    axis: 'both',
    verticalLabel: 'Stateful legacy monolith needing instant RAM → Scale Up',
    horizontalLabel: 'Stateless unpredictable web spike → Scale Out + Autoscale',
    serviceCategory: 'AZ-900 Payoff',
  },
];

export const ScalingArchitectureDiagram: React.FC<ScalingArchitectureDiagramProps> = ({
  selectedModuleId,
  connectedModuleIds,
  onSelectModule,
}) => {
  const [focusAxis, setFocusAxis] = useState<FocusAxis>('both');

  const pathGroups: Array<{ pathId: 1 | 2 | 3; label: string; weight: string }> = [
    { pathId: 1, label: 'Path 1 · Cloud Concepts', weight: '25–30%' },
    { pathId: 2, label: 'Path 2 · Azure Architecture & Services', weight: '35–40%' },
    { pathId: 3, label: 'Path 3 · Management & Governance', weight: '30–35%' },
  ];

  const isVerticalDimmed = focusAxis === 'horizontal';
  const isHorizontalDimmed = focusAxis === 'vertical';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-6 space-y-5">
      {/* Header + Interactive Axis Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0078D4] dark:text-sky-400">
            <ArrowUpDown className="w-4 h-4 shrink-0" />
            <span>Visual Architecture Map · Horizontal vs. Vertical Scaling Across 12 Modules</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Compare single-node tier upgrades (Vertical) against load-balanced multi-instance elasticity (Horizontal), then click any mapped module node below to inspect its AZ-900 details.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0"
          role="group"
          aria-label="Highlight scaling dimension"
        >
          <button
            type="button"
            onClick={() => setFocusAxis('both')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
              focusAxis === 'both'
                ? 'bg-slate-900 dark:bg-[#0078D4] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Compare Both
          </button>
          <button
            type="button"
            onClick={() => setFocusAxis('vertical')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
              focusAxis === 'vertical'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Vertical (Up/Down)
          </button>
          <button
            type="button"
            onClick={() => setFocusAxis('horizontal')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
              focusAxis === 'horizontal'
                ? 'bg-[#0078D4] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Horizontal (Out/In)
          </button>
        </div>
      </div>

      {/* Side-by-Side Geometric Visual Schematics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vertical Scaling Schematic */}
        <div
          className={`rounded-xl border p-4 bg-white dark:bg-slate-900 transition-opacity ${
            isVerticalDimmed
              ? 'opacity-45 border-slate-200 dark:border-slate-800'
              : 'border-amber-300/90 dark:border-amber-700/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                <ArrowUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  Vertical Scaling (Scale Up / Down)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Grow one resource&apos;s hardware tier or throughput ceiling
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
              1 Node · Hardware Cap
            </span>
          </div>

          {/* Crisp SVG Schematic for Vertical Stack */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-3">
            <svg
              viewBox="0 0 420 128"
              className="w-full h-auto"
              role="img"
              aria-label="Vertical scaling schematic showing a single node stepping up from Standard B2s to D4s to D16s tiers"
            >
              {/* Small Node */}
              <rect
                x="14"
                y="72"
                width="84"
                height="42"
                rx="8"
                className="fill-amber-100/80 dark:fill-amber-950/60 stroke-amber-400 dark:stroke-amber-700"
                strokeWidth="1.5"
              />
              <text
                x="56"
                y="90"
                textAnchor="middle"
                className="fill-slate-800 dark:fill-slate-100 text-[10px] font-bold"
              >
                B2s · P10 Disk
              </text>
              <text
                x="56"
                y="104"
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 text-[9px]"
              >
                2 vCPU · 4 GB
              </text>

              {/* Arrow 1 */}
              <path
                d="M104 93 L130 78"
                className="stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2"
                strokeDasharray="3 2"
                fill="none"
              />
              <polygon
                points="132,76 124,76 128,83"
                className="fill-amber-600 dark:fill-amber-400"
              />

              {/* Medium Node */}
              <rect
                x="138"
                y="46"
                width="104"
                height="68"
                rx="8"
                className="fill-amber-200/70 dark:fill-amber-900/50 stroke-amber-500 dark:stroke-amber-600"
                strokeWidth="1.75"
              />
              <text
                x="190"
                y="72"
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-50 text-[10.5px] font-bold"
              >
                D4s · P30 Disk
              </text>
              <text
                x="190"
                y="87"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[9px]"
              >
                4 vCPU · 16 GB
              </text>
              <text
                x="190"
                y="102"
                textAnchor="middle"
                className="fill-amber-800 dark:fill-amber-300 text-[8.5px] font-semibold"
              >
                SKU Resize / Reboot
              </text>

              {/* Arrow 2 */}
              <path
                d="M248 72 L276 52"
                className="stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2"
                strokeDasharray="3 2"
                fill="none"
              />
              <polygon
                points="279,50 270,50 275,57"
                className="fill-amber-600 dark:fill-amber-400"
              />

              {/* Large Node */}
              <rect
                x="284"
                y="14"
                width="122"
                height="100"
                rx="10"
                className="fill-amber-500/20 dark:fill-amber-700/40 stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2"
              />
              <text
                x="345"
                y="36"
                textAnchor="middle"
                className="fill-slate-900 dark:fill-white text-[11px] font-extrabold"
              >
                D16s · P80 Disk
              </text>
              <text
                x="345"
                y="52"
                textAnchor="middle"
                className="fill-slate-700 dark:fill-slate-200 text-[9.5px]"
              >
                16 vCPU · 64 GB RAM
              </text>
              <text
                x="345"
                y="68"
                textAnchor="middle"
                className="fill-slate-700 dark:fill-slate-200 text-[9px]"
              >
                ExpressRoute 10 Gbps
              </text>
              <rect
                x="298"
                y="81"
                width="94"
                height="20"
                rx="5"
                className="fill-amber-600 dark:fill-amber-500"
              />
              <text
                x="345"
                y="94"
                textAnchor="middle"
                className="fill-white text-[8.5px] font-bold"
              >
                UPPER SKU LIMIT
              </text>
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">M5: VM Size</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">M5: ExpressRoute</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">M6: Disk IOPS</span>
            </div>
          </div>
        </div>

        {/* Horizontal Scaling Schematic */}
        <div
          className={`rounded-xl border p-4 bg-white dark:bg-slate-900 transition-opacity ${
            isHorizontalDimmed
              ? 'opacity-45 border-slate-200 dark:border-slate-800'
              : 'border-sky-300/90 dark:border-sky-700/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-[#0078D4] dark:text-sky-300">
                <MoveHorizontal className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  Horizontal Scaling (Scale Out / In &amp; Elasticity)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add or remove identical parallel instances driven by telemetry
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-[#0078D4] dark:text-sky-200 border border-sky-200 dark:border-sky-800 whitespace-nowrap">
              Multi-Zone · Zero Downtime
            </span>
          </div>

          {/* Crisp SVG Schematic for Horizontal Load Balanced Pool */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-3">
            <svg
              viewBox="0 0 420 128"
              className="w-full h-auto"
              role="img"
              aria-label="Horizontal scaling schematic showing Azure Monitor autoscale rules directing Azure Load Balancer to distribute traffic across Availability Zone 1, 2, and 3 backend instances"
            >
              {/* Monitor Metric Trigger */}
              <rect
                x="12"
                y="14"
                width="108"
                height="42"
                rx="8"
                className="fill-emerald-50 dark:fill-emerald-950/60 stroke-emerald-500 dark:stroke-emerald-600"
                strokeWidth="1.5"
              />
              <text
                x="66"
                y="32"
                textAnchor="middle"
                className="fill-emerald-900 dark:fill-emerald-200 text-[9.5px] font-bold"
              >
                M11: Azure Monitor
              </text>
              <text
                x="66"
                y="46"
                textAnchor="middle"
                className="fill-emerald-700 dark:fill-emerald-300 text-[8.5px]"
              >
                CPU &gt; 75% → Scale Out
              </text>

              {/* Load Balancer */}
              <rect
                x="12"
                y="70"
                width="108"
                height="44"
                rx="8"
                className="fill-sky-100 dark:fill-sky-950/80 stroke-[#0078D4] dark:stroke-sky-500"
                strokeWidth="1.75"
              />
              <text
                x="66"
                y="89"
                textAnchor="middle"
                className="fill-slate-900 dark:fill-white text-[10px] font-bold"
              >
                Load Balancer
              </text>
              <text
                x="66"
                y="103"
                textAnchor="middle"
                className="fill-sky-800 dark:fill-sky-300 text-[8.5px]"
              >
                Distributes Traffic
              </text>

              {/* Connector Lines to AZ 1, 2, 3 */}
              <path
                d="M120 92 L166 28 M120 92 L166 64 M120 92 L166 100"
                className="stroke-[#0078D4] dark:stroke-sky-400"
                strokeWidth="1.75"
                fill="none"
              />

              {/* AZ1 Node */}
              <rect
                x="170"
                y="12"
                width="108"
                height="30"
                rx="6"
                className="fill-white dark:fill-slate-900 stroke-[#0078D4] dark:stroke-sky-500"
                strokeWidth="1.5"
              />
              <text
                x="224"
                y="31"
                textAnchor="middle"
                className="fill-slate-800 dark:fill-slate-100 text-[9.5px] font-bold"
              >
                Zone 1 · VMSS #1
              </text>

              {/* AZ2 Node */}
              <rect
                x="170"
                y="49"
                width="108"
                height="30"
                rx="6"
                className="fill-white dark:fill-slate-900 stroke-[#0078D4] dark:stroke-sky-500"
                strokeWidth="1.5"
              />
              <text
                x="224"
                y="68"
                textAnchor="middle"
                className="fill-slate-800 dark:fill-slate-100 text-[9.5px] font-bold"
              >
                Zone 2 · VMSS #2
              </text>

              {/* AZ3 Node */}
              <rect
                x="170"
                y="86"
                width="108"
                height="30"
                rx="6"
                className="fill-sky-50 dark:fill-sky-950/70 stroke-sky-500 dark:stroke-sky-400"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x="224"
                y="105"
                textAnchor="middle"
                className="fill-[#0078D4] dark:fill-sky-300 text-[9.5px] font-bold"
              >
                Zone 3 · +Elastic #3
              </text>

              {/* Storage Partition / Elasticity Payoff Box */}
              <rect
                x="294"
                y="14"
                width="114"
                height="100"
                rx="8"
                className="fill-sky-500/15 dark:fill-sky-900/40 stroke-sky-400 dark:stroke-sky-600"
                strokeWidth="1.5"
              />
              <text
                x="351"
                y="35"
                textAnchor="middle"
                className="fill-slate-900 dark:fill-white text-[9.5px] font-extrabold"
              >
                Elastic Fleet
              </text>
              <text
                x="351"
                y="53"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[8.5px]"
              >
                VMSS · App Service
              </text>
              <text
                x="351"
                y="68"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[8.5px]"
              >
                AKS Pods · Functions
              </text>
              <text
                x="351"
                y="83"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[8.5px]"
              >
                M6: Blob Partitions
              </text>
              <text
                x="351"
                y="102"
                textAnchor="middle"
                className="fill-emerald-700 dark:fill-emerald-300 text-[8.5px] font-bold"
              >
                M3/M8: OpEx Savings
              </text>
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400 shrink-0" />
              <span className="truncate">M4/M5: VMSS &amp; AZs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400 shrink-0" />
              <span className="truncate">M11: Autoscale</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400 shrink-0" />
              <span className="truncate">M3/M8: OpEx Burst</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit 12-Module Scaling Thread Flow */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-100">
            12-Module Scaling Thread Progression (Path 1 → Path 2 → Path 3)
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Vertical
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0078D4] inline-block" /> Horizontal
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400" /> Supporting Guardrail
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {pathGroups.map((group) => {
            const groupNodes = ALL_12_SCALING_NODES.filter((n) => n.pathId === group.pathId);
            return (
              <div
                key={group.pathId}
                className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {group.weight}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupNodes.map((node) => {
                    const isInspectable = connectedModuleIds.includes(node.moduleId);
                    const isActive = selectedModuleId === node.moduleId;
                    const dimmedByFilter =
                      (focusAxis === 'vertical' && node.axis === 'horizontal') ||
                      (focusAxis === 'horizontal' && node.axis === 'vertical');

                    return (
                      <button
                        key={node.moduleId}
                        type="button"
                        disabled={!isInspectable}
                        onClick={() => isInspectable && onSelectModule(node.moduleId)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                          !isInspectable
                            ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 opacity-75 cursor-default'
                            : isActive
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-[#0078D4] ring-1 ring-[#0078D4] cursor-pointer'
                            : 'bg-slate-50/40 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-[#0078D4] cursor-pointer'
                        } ${dimmedByFilter ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                            M{node.moduleId}: {node.shortTitle}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {node.serviceCategory}
                          </span>
                        </div>

                        {node.verticalLabel && (
                          <div className="text-[10.5px] leading-snug text-amber-900 dark:text-amber-200 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded px-2 py-1">
                            <strong className="font-bold">Vertical:</strong> {node.verticalLabel}
                          </div>
                        )}
                        {node.horizontalLabel && (
                          <div className="text-[10.5px] leading-snug text-sky-900 dark:text-sky-200 bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded px-2 py-1">
                            <strong className="font-bold">Horizontal:</strong> {node.horizontalLabel}
                          </div>
                        )}
                        {node.contextNote && (
                          <div className="text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
                            {node.contextNote}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
