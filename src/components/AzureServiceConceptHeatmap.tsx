import React, { useState, useMemo } from 'react';
import {
  Flame,
  BookOpen,
  Layers,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';

export interface AzureServiceConceptItem {
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
}

export const AZ900_SERVICE_CONCEPTS: AzureServiceConceptItem[] = [
  {
    id: 'concept-m1-shared-resp',
    serviceName: 'Shared Responsibility Model (IaaS / PaaS / SaaS)',
    shortName: 'Shared Responsibility',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    pathId: 1,
    pathLabel: 'Path 1: Cloud Concepts',
    keywords: ['shared responsibility', 'iaas', 'paas', 'saas', 'physical', 'operating system'],
    governingRule:
      'Customer always retains responsibility for data, endpoints, accounts, and access management across all cloud models.',
    commonTrap:
      'Assuming Microsoft manages guest OS patching in IaaS Virtual Machines (customer responsibility).',
  },
  {
    id: 'concept-m1-cloud-models',
    serviceName: 'Public, Private & Hybrid Cloud Deployment',
    shortName: 'Hybrid & Multi-Cloud',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    pathId: 1,
    pathLabel: 'Path 1: Cloud Concepts',
    keywords: ['public', 'private', 'hybrid', 'multi-cloud', 'on-premises'],
    governingRule:
      'Hybrid cloud bridges on-premises datacenters with public Azure resources for gradual migration or regulatory residency.',
    commonTrap:
      'Confusing multi-cloud (using two public clouds) with hybrid cloud (public + private on-prem).',
  },
  {
    id: 'concept-m2-ha-dr',
    serviceName: 'High Availability (HA) & Disaster Recovery',
    shortName: 'High Availability & DR',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    pathId: 1,
    pathLabel: 'Path 1: Cloud Concepts',
    keywords: ['availability', 'sla', 'disaster', 'reliability', 'uptime', 'fault'],
    governingRule:
      'High Availability maximizes continuous uptime during component failures; Disaster Recovery restores workloads after catastrophic regional events.',
    commonTrap:
      'Equating vertical scaling with High Availability—single large VMs still represent a single point of failure.',
  },
  {
    id: 'concept-m2-elasticity-scale',
    serviceName: 'Elasticity vs. Horizontal & Vertical Scaling',
    shortName: 'Elasticity & Scaling',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    pathId: 1,
    pathLabel: 'Path 1: Cloud Concepts',
    keywords: ['elasticity', 'horizontal', 'vertical', 'scale out', 'scale up', 'autoscale'],
    governingRule:
      'Horizontal scaling (scale out/in) adds or removes instances; vertical scaling (scale up/down) resizes CPU/RAM on an existing instance.',
    commonTrap:
      'Choosing vertical scaling when zero-downtime elastic auto-scaling across multiple instances is required.',
  },
  {
    id: 'concept-m3-capex-opex',
    serviceName: 'CapEx vs. OpEx Cloud Economics',
    shortName: 'CapEx vs. OpEx',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    pathId: 1,
    pathLabel: 'Path 1: Cloud Concepts',
    keywords: ['capex', 'opex', 'capital', 'operational', 'upfront', 'depreciation'],
    governingRule:
      'Public cloud shifts upfront physical hardware investments (CapEx) into pay-as-you-go operational expenses (OpEx).',
    commonTrap:
      'Classifying monthly pay-as-you-go Azure subscriptions as Capital Expenditure (CapEx).',
  },
  {
    id: 'concept-m3-serverless-consumption',
    serviceName: 'Consumption-Based & Serverless Billing',
    shortName: 'Consumption & Serverless',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    pathId: 1,
    pathLabel: 'Path 1: Cloud Concepts',
    keywords: ['consumption', 'serverless', 'pay-as-you-go', 'execution', 'functions'],
    governingRule:
      'Consumption plans bill strictly for actual execution time and resources consumed, dropping to zero cost when idle.',
    commonTrap:
      'Assuming Stopped (Allocated) VMs stop compute billing—VMs must be Stopped (Deallocated) to halt compute charges.',
  },
  {
    id: 'concept-m4-az-regions',
    serviceName: 'Availability Zones & Region Pairs',
    shortName: 'Availability Zones',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['availability zone', 'region pair', 'sovereign', 'datacenter', 'geography'],
    governingRule:
      'Availability Zones are physically separate datacenters within a single Azure region with independent power, cooling, and networking.',
    commonTrap:
      'Assuming Availability Zones protect against a full region-wide natural disaster (requires GRS / Region Pairs).',
  },
  {
    id: 'concept-m4-hierarchy-rg',
    serviceName: 'Management Groups, Subscriptions & Resource Groups',
    shortName: 'Resource Hierarchy',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['management group', 'subscription', 'resource group', 'hierarchy', 'lifecycle'],
    governingRule:
      'Hierarchy flows Management Groups → Subscriptions → Resource Groups → Resources; policies and RBAC inherit downward.',
    commonTrap:
      'Attempting to nest one Resource Group inside another Resource Group or assign a resource to two Resource Groups.',
  },
  {
    id: 'concept-m5-compute-containers',
    serviceName: 'VM Scale Sets, App Service, ACI & AKS',
    shortName: 'Compute & Containers',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['scale set', 'vmss', 'app service', 'aci', 'aks', 'kubernetes', 'container', 'avd'],
    governingRule:
      'ACI runs isolated containers without orchestration; AKS provides full enterprise Kubernetes orchestration; App Service hosts managed PaaS web apps.',
    commonTrap:
      'Deploying full AKS clusters when a simple serverless single-container burst workload (ACI) is requested.',
  },
  {
    id: 'concept-m5-networking-expressroute',
    serviceName: 'VNets, VNet Peering, VPN Gateway & ExpressRoute',
    shortName: 'ExpressRoute & VNets',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['expressroute', 'vpn gateway', 'peering', 'vnet', 'subnet', 'private endpoint', 'dns'],
    governingRule:
      'ExpressRoute establishes a dedicated private fiber connection that bypasses the public internet; VPN Gateway sends encrypted traffic over the public internet.',
    commonTrap:
      'Selecting Site-to-Site VPN when the scenario mandates predictable bandwidth and zero public internet traversal.',
  },
  {
    id: 'concept-m6-blob-tiers',
    serviceName: 'Blob Storage Access Tiers (Hot, Cool, Cold, Archive)',
    shortName: 'Blob Access Tiers',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['hot', 'cool', 'cold', 'archive', 'rehydrate', 'blob', 'tier'],
    governingRule:
      'Archive tier offers the lowest storage cost for 180+ day retention but is offline and requires hours of rehydration before reading.',
    commonTrap:
      'Using Archive tier for files that require immediate millisecond read access upon request.',
  },
  {
    id: 'concept-m6-redundancy-migration',
    serviceName: 'Storage Redundancy (LRS/ZRS/GRS) & AzCopy / Data Box',
    shortName: 'LRS / ZRS / GRS & Data Box',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['lrs', 'zrs', 'grs', 'gzrs', 'ra-grs', 'azcopy', 'data box', 'file sync', 'redundancy'],
    governingRule:
      'LRS keeps 3 copies in 1 datacenter; ZRS spreads 3 copies across 3 Availability Zones; GRS replicates 6 copies across paired regions.',
    commonTrap:
      'Using network transfer instead of physical Azure Data Box appliances when migrating 50+ TB over slow links.',
  },
  {
    id: 'concept-m7-entra-conditional',
    serviceName: 'Microsoft Entra ID, SSO, MFA & Conditional Access',
    shortName: 'Entra ID & Cond. Access',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['entra', 'conditional access', 'mfa', 'sso', 'authentication', 'active directory'],
    governingRule:
      'Conditional Access evaluates if-then signals (user role, location, device health, risk) before granting or requiring MFA for access.',
    commonTrap:
      'Confusing Authentication (proving identity via Entra ID/MFA) with Authorization (granting resource permissions via RBAC).',
  },
  {
    id: 'concept-m7-rbac-zerotrust',
    serviceName: 'Azure RBAC, Zero Trust & Defense-in-Depth',
    shortName: 'RBAC & Zero Trust',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    pathId: 2,
    pathLabel: 'Path 2: Architecture & Services',
    keywords: ['rbac', 'zero trust', 'defense in depth', 'authorization', 'least privilege'],
    governingRule:
      'Zero Trust assumes breach ("never trust, always verify"); Defense-in-Depth surrounds Data at the center with 7 concentric security layers.',
    commonTrap:
      'Using Azure RBAC to block an Owner from deleting a resource (requires a CanNotDelete Resource Lock).',
  },
  {
    id: 'concept-m8-calculators-cost',
    serviceName: 'Pricing Calculator vs. TCO Calculator & Cost Alerts',
    shortName: 'Pricing vs. TCO Calc',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['pricing calculator', 'tco', 'total cost', 'budget', 'egress', 'bandwidth'],
    governingRule:
      'Pricing Calculator estimates monthly cost of new Azure services; TCO Calculator compares on-premises datacenter costs against Azure migration savings.',
    commonTrap:
      'Using the Pricing Calculator when an executive requests an on-premises vs. cloud migration ROI comparison report.',
  },
  {
    id: 'concept-m8-reservations-tags',
    serviceName: 'Reserved Instances, Savings Plans, Hybrid Benefit & Tags',
    shortName: 'Reservations & AHB',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['reserved', 'reservation', 'savings plan', 'hybrid benefit', 'tag', 'ahb'],
    governingRule:
      'Reserved Instances (1 or 3 yr) discount up to 72% for predictable workloads; Azure Hybrid Benefit reuses on-premises Windows/SQL licenses.',
    commonTrap:
      'Assuming Resource Tags are automatically inherited by child resources inside a Resource Group (requires Azure Policy).',
  },
  {
    id: 'concept-m9-policy-purview',
    serviceName: 'Azure Policy, Initiatives & Microsoft Purview',
    shortName: 'Azure Policy & Purview',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['azure policy', 'initiative', 'purview', 'compliance', 'allowed locations'],
    governingRule:
      'Azure Policy enforces resource configuration rules (e.g., allowed regions/SKUs); Microsoft Purview governs enterprise data discovery and classification.',
    commonTrap:
      'Confusing Azure Policy (what resource configurations are allowed) with Azure RBAC (who can perform actions).',
  },
  {
    id: 'concept-m9-resource-locks',
    serviceName: 'Resource Locks (CanNotDelete vs. ReadOnly)',
    shortName: 'Resource Locks',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['lock', 'cannotdelete', 'readonly', 'delete'],
    governingRule:
      'Resource Locks apply regardless of RBAC role—even Subscription Owners must explicitly remove a CanNotDelete lock before deleting a resource.',
    commonTrap:
      'Applying a ReadOnly lock to a Storage Account or SQL database that applications actively write data into.',
  },
  {
    id: 'concept-m10-arc-shell',
    serviceName: 'Azure Arc, Cloud Shell, CLI & PowerShell',
    shortName: 'Azure Arc & Cloud Shell',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['arc', 'cloud shell', 'cli', 'powershell', 'portal'],
    governingRule:
      'Azure Arc projects non-Azure servers and multi-cloud Kubernetes clusters into Azure Resource Manager for unified Policy and tagging.',
    commonTrap:
      'Assuming Azure Cloud Shell runs without an attached Azure Storage Account for persistent $HOME file storage.',
  },
  {
    id: 'concept-m10-arm-bicep',
    serviceName: 'Declarative IaC: ARM Templates & Bicep',
    shortName: 'Bicep & ARM IaC',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['bicep', 'arm template', 'declarative', 'infrastructure as code', 'json'],
    governingRule:
      'Bicep is a concise, domain-specific declarative IaC language that transpiles cleanly into standard JSON ARM templates for repeatable deployments.',
    commonTrap:
      'Using imperative CLI scripts when idempotent, declarative Infrastructure as Code template validation is required.',
  },
  {
    id: 'concept-m11-advisor-health',
    serviceName: 'Azure Advisor & Azure Service Health Suite',
    shortName: 'Advisor & Service Health',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['advisor', 'service health', 'resource health', 'azure status'],
    governingRule:
      'Azure Status shows global outages; Service Health shows personalized subscription/region events; Resource Health diagnoses a single specific VM/resource.',
    commonTrap:
      'Checking global Azure Status instead of Resource Health when diagnosing a single unresponsive Virtual Machine.',
  },
  {
    id: 'concept-m11-monitor-insights',
    serviceName: 'Azure Monitor, Log Analytics & Application Insights',
    shortName: 'Monitor & App Insights',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['azure monitor', 'log analytics', 'application insights', 'kql', 'telemetry', 'alert'],
    governingRule:
      'Azure Monitor collects platform Metrics and Logs; Log Analytics runs KQL queries; Application Insights provides live web APM telemetry.',
    commonTrap:
      'Using Azure Advisor instead of Application Insights to trace live HTTP request latency and exceptions in a web app.',
  },
  {
    id: 'concept-m12-multitier-ha',
    serviceName: 'Multi-Tier HA & Cross-Region Architecture Synthesis',
    shortName: 'Multi-Tier HA Design',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['multi-tier', 'synthesis', 'tradeoff', 'end-to-end'],
    governingRule:
      'Combine Availability Zones for in-region 99.99% VM uptime with GRS/Region Pairs for cross-region disaster recovery.',
    commonTrap:
      'Over-engineering a dev/test workload with GZRS and ExpressRoute when LRS and Spot VMs satisfy the budget.',
  },
  {
    id: 'concept-m12-governance-finops',
    serviceName: 'Enterprise Governance & FinOps Synthesis',
    shortName: 'Governance & FinOps',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    pathId: 3,
    pathLabel: 'Path 3: Management & Governance',
    keywords: ['finops', 'regulatory', 'enterprise', 'compliance'],
    governingRule:
      'Layer Management Group Policy Initiatives, RBAC least privilege, CanNotDelete locks, and Cost Budgets for defense-in-depth governance.',
    commonTrap:
      'Relying on Cost Alerts alone to automatically shut down or restrict expensive VM SKU deployments (requires Azure Policy).',
  },
];

export interface ComputedServiceConceptHeatCell extends AzureServiceConceptItem {
  missedCount: number;
  correctCount: number;
  totalAttempts: number;
  accuracy: number | null;
  severity: 'critical' | 'repeated' | 'single' | 'clean' | 'unattempted';
}

interface AzureServiceConceptHeatmapProps {
  stats: UserStats;
  questions: Question[];
  onOpenStudyModule: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onOpenFlashcards: (moduleId: number) => void;
  onPracticeConcept?: (moduleId: number, pathId: 1 | 2 | 3, keyword: string) => void;
}

export const AzureServiceConceptHeatmap: React.FC<AzureServiceConceptHeatmapProps> = ({
  stats,
  questions,
  onOpenStudyModule,
  onOpenFlashcards,
  onPracticeConcept,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'missed-multiple' | 1 | 2 | 3>('all');
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    AZ900_SERVICE_CONCEPTS[0].id
  );
  const [simulateDemoMisses, setSimulateDemoMisses] = useState<boolean>(false);

  const heatCells = useMemo<ComputedServiceConceptHeatCell[]>(() => {
    // Map questionId -> Question
    const qMap = new Map<string, Question>();
    questions.forEach((q) => qMap.set(q.id, q));

    // Collect per-concept stats from user attempts + mistakesHistory
    return AZ900_SERVICE_CONCEPTS.map((concept, idx) => {
      let missedCount = 0;
      let correctCount = 0;

      // 1. Check attempts in stats.attempts
      Object.entries(stats.attempts || {}).forEach(([qId, attemptList]) => {
        const q = qMap.get(qId);
        if (!q || q.moduleId !== concept.moduleId) return;

        const textBlob = `${q.question} ${q.scenario} ${q.whyCorrect} ${q.examTip}`.toLowerCase();
        const matchesKeyword = concept.keywords.some((kw) => textBlob.includes(kw.toLowerCase()));

        // If question matches concept keyword (or if it's the primary concept of the module)
        if (matchesKeyword || idx % 2 === 0) {
          attemptList.forEach((att) => {
            if (att.isCorrect) {
              correctCount += 1;
            } else {
              missedCount += 1;
            }
          });
        }
      });

      // 2. Also check mistakesHistory for any additional recorded misses
      if (stats.mistakesHistory && stats.mistakesHistory.length > 0) {
        stats.mistakesHistory.forEach((m) => {
          if (m.moduleId !== concept.moduleId) return;
          const q = qMap.get(m.questionId);
          if (q) {
            const textBlob = `${q.question} ${q.scenario} ${q.whyCorrect}`.toLowerCase();
            if (concept.keywords.some((kw) => textBlob.includes(kw.toLowerCase()))) {
              missedCount = Math.max(missedCount, 1);
            }
          }
        });
      }

      // 3. Fallback to moduleMastery misses if attempts array wasn't populated directly
      const modMastery = stats.moduleMastery?.[concept.moduleId];
      if (modMastery && modMastery.total > 0 && missedCount === 0 && correctCount === 0) {
        const modWrong = Math.max(0, modMastery.total - modMastery.correct);
        if (idx % 2 === 0) {
          missedCount = Math.ceil(modWrong / 2);
          correctCount = Math.ceil(modMastery.correct / 2);
        } else {
          missedCount = Math.floor(modWrong / 2);
          correctCount = Math.floor(modMastery.correct / 2);
        }
      }

      // 4. Optional Demo Simulation when learner wants to preview multi-miss heatmap highlights
      if (simulateDemoMisses && missedCount === 0) {
        const demoPattern = [3, 1, 0, 2, 0, 3, 2, 0, 1, 4, 3, 0, 2, 3, 1, 2, 3, 4, 0, 2, 1, 3, 2, 0];
        missedCount = demoPattern[idx % demoPattern.length];
        correctCount = missedCount > 0 ? 2 : 4;
      }

      const totalAttempts = missedCount + correctCount;
      const accuracy =
        totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null;

      const severity: ComputedServiceConceptHeatCell['severity'] =
        missedCount >= 3
          ? 'critical'
          : missedCount === 2
          ? 'repeated'
          : missedCount === 1
          ? 'single'
          : totalAttempts > 0
          ? 'clean'
          : 'unattempted';

      return {
        ...concept,
        missedCount,
        correctCount,
        totalAttempts,
        accuracy,
        severity,
      };
    });
  }, [stats, questions, simulateDemoMisses]);

  const multiMissedCount = useMemo(
    () => heatCells.filter((c) => c.missedCount >= 2).length,
    [heatCells]
  );

  const totalMissedConceptsCount = useMemo(
    () => heatCells.filter((c) => c.missedCount >= 1).length,
    [heatCells]
  );

  const filteredCells = useMemo(() => {
    if (filterMode === 'missed-multiple') {
      const multi = heatCells.filter((c) => c.missedCount >= 2);
      return multi.length > 0 ? multi : heatCells.filter((c) => c.missedCount >= 1);
    }
    if (filterMode === 1 || filterMode === 2 || filterMode === 3) {
      return heatCells.filter((c) => c.pathId === filterMode);
    }
    return heatCells;
  }, [heatCells, filterMode]);

  const activeCell = useMemo(() => {
    return (
      heatCells.find((c) => c.id === selectedConceptId) ||
      heatCells.find((c) => c.missedCount >= 2) ||
      heatCells[0]
    );
  }, [heatCells, selectedConceptId]);

  const getCellStyle = (cell: ComputedServiceConceptHeatCell, isSelected: boolean) => {
    const ringClass = isSelected ? 'ring-2 ring-offset-1 ring-slate-900 scale-[1.015]' : '';
    switch (cell.severity) {
      case 'critical':
        return `bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-800 shadow-sm ${ringClass}`;
      case 'repeated':
        return `bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-700 shadow-xs ${ringClass}`;
      case 'single':
        return `bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-300 ${ringClass}`;
      case 'clean':
        return `bg-emerald-50/90 hover:bg-emerald-100/80 text-emerald-950 border-emerald-300 ${ringClass}`;
      default:
        return `bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 ${ringClass}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 card-elevation overflow-hidden">
      {/* Top Header Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/25 border border-rose-400/40 text-rose-200 text-[10px] font-black uppercase tracking-wider">
              <Flame className="w-3 h-3 text-amber-300" />
              <span>Service Concept Mistake Heatmap</span>
            </span>
            <span className="text-xs text-sky-200 font-semibold">
              {multiMissedCount} Concept{multiMissedCount === 1 ? '' : 's'} Missed Multiple Times (2+) • {totalMissedConceptsCount} Total Flagged
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
            AZ-900 Azure Service Concept Vulnerability Heatmap
          </h3>
          <p className="text-xs text-sky-100/90 max-w-3xl">
            Highlights specific Azure service concepts you have missed multiple times across all 12 curriculum modules, with instant 1-click access to the matching Study Module or Flashcard deck.
          </p>
        </div>

        {/* Filter & Demo Controls */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div
            className="inline-flex items-center p-1 rounded-xl bg-slate-950/50 border border-white/15"
            role="group"
            aria-label="Filter Azure Service Concept Heatmap"
          >
            {(
              [
                { id: 'all', label: 'All 24 Concepts' },
                { id: 'missed-multiple', label: `Missed 2+ (${multiMissedCount})` },
                { id: 1, label: 'Path 1' },
                { id: 2, label: 'Path 2' },
                { id: 3, label: 'Path 3' },
              ] as const
            ).map((tab) => {
              const isActive = filterMode === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-2xs'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSimulateDemoMisses((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
              simulateDemoMisses
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-sky-100 border-white/20'
            }`}
            title="Preview how repeated concept misses (2+ and 3+ misses) light up across the curriculum"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulateDemoMisses ? 'Demo Heat: ON' : 'Preview Heat'}</span>
          </button>
        </div>
      </div>

      {/* Heat Legend Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#0078D4]" />
            <span>Heat Intensity Legend:</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-rose-800">
            <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block" />
            <span>Critical (3+ Misses)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-800">
            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
            <span>Repeated (2 Misses)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-900">
            <span className="w-3 h-3 rounded-xs bg-amber-200 border border-amber-400 inline-block" />
            <span>Single Miss (1)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
            <span className="w-3 h-3 rounded-xs bg-emerald-200 border border-emerald-400 inline-block" />
            <span>Mastered (0 Misses)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
            <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300 inline-block" />
            <span>Unattempted</span>
          </span>
        </div>

        <span className="text-slate-500 font-medium">
          Click any concept tile to inspect &amp; launch 1-click Study Module or Flashcards
        </span>
      </div>

      {/* Main Heatmap Grid */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredCells.map((cell) => {
            const isSelected = activeCell?.id === cell.id;
            const isHot = cell.missedCount >= 2;
            return (
              <div
                key={cell.id}
                onClick={() => setSelectedConceptId(cell.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedConceptId(cell.id);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2.5 ${getCellStyle(
                  cell,
                  isSelected
                )}`}
              >
                {/* Top Row: Module ID + Miss Counter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold">
                    <span className={isHot ? 'text-white/90' : 'text-slate-500'}>
                      Mod {cell.moduleId} · P{cell.pathId}
                    </span>
                    <span
                      className={`font-black ${
                        cell.missedCount >= 3
                          ? 'text-amber-200'
                          : cell.missedCount === 2
                          ? 'text-white'
                          : cell.missedCount === 1
                          ? 'text-amber-900'
                          : cell.severity === 'clean'
                          ? 'text-emerald-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {cell.missedCount >= 2
                        ? `🔥 ${cell.missedCount}x Missed`
                        : cell.missedCount === 1
                        ? '1x Missed'
                        : cell.severity === 'clean'
                        ? '✓ 0 Missed'
                        : 'Not Tested'}
                    </span>
                  </div>

                  <div className="text-xs font-black leading-snug line-clamp-2">
                    {cell.serviceName}
                  </div>
                </div>

                {/* Bottom Row: Direct 1-Click Study Module & Flashcards Buttons */}
                <div className="pt-2 border-t border-current/15 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenStudyModule(cell.moduleId, cell.pathId);
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isHot
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-white hover:bg-sky-50 text-[#0078D4] border border-slate-200/90'
                    }`}
                    title={`One-click access to Study Module ${cell.moduleId}: ${cell.moduleTitle}`}
                  >
                    <BookOpen className="w-3 h-3 shrink-0" />
                    <span>Study Mod</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFlashcards(cell.moduleId);
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isHot
                        ? 'bg-slate-950/35 hover:bg-slate-950/55 text-amber-200'
                        : 'bg-white hover:bg-amber-50 text-amber-900 border border-slate-200/90'
                    }`}
                    title={`One-click access to Module ${cell.moduleId} Flashcards`}
                  >
                    <RotateCw className="w-3 h-3 shrink-0" />
                    <span>Flashcards</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Concept Deep-Dive & One-Click Remediation Bar */}
        {activeCell && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-black text-amber-300 uppercase tracking-wider">
                  Module {activeCell.moduleId}: {activeCell.moduleTitle}
                </span>
                <span aria-hidden="true" className="text-slate-500">
                  ·
                </span>
                <span className="text-sky-300 font-semibold">{activeCell.pathLabel}</span>
                <span aria-hidden="true" className="text-slate-500">
                  ·
                </span>
                <span
                  className={
                    activeCell.missedCount >= 2
                      ? 'text-rose-300 font-extrabold'
                      : 'text-emerald-300 font-bold'
                  }
                >
                  {activeCell.missedCount} Missed / {activeCell.totalAttempts} Attempts
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-white">
                {activeCell.serviceName}
              </h4>

              <p className="text-xs text-slate-200 leading-relaxed">
                <strong className="text-emerald-300">Governing AZ-900 Rule:</strong>{' '}
                {activeCell.governingRule}
              </p>
              <p className="text-xs text-amber-200/95 leading-relaxed">
                <strong className="text-rose-300">Common Exam Trap:</strong>{' '}
                {activeCell.commonTrap}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenStudyModule(activeCell.moduleId, activeCell.pathId)}
                className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Study Module {activeCell.moduleId}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenFlashcards(activeCell.moduleId)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Module {activeCell.moduleId} Flashcards</span>
              </button>

              {onPracticeConcept && (
                <button
                  type="button"
                  onClick={() =>
                    onPracticeConcept(
                      activeCell.moduleId,
                      activeCell.pathId,
                      activeCell.keywords[0] || activeCell.shortName
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Drill Concept Qs</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
