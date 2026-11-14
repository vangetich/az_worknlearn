import React, { useState, useMemo } from 'react';
import {
  Compass,
  Sparkles,
  Bot,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Zap,
  Target,
  ChevronRight,
  TrendingUp,
  Layers,
  Lightbulb,
  Check,
  RotateCcw,
} from 'lucide-react';
import { UserStats, Question, ModuleInfo, QuestionAttempt } from '../types/quiz';
import { LEARNING_PATHS, CURRICULUM_MODULES } from '../data/curriculum';
import { KitengeRibbon } from './MotifDecorations';
import { AppTab } from './Header';

export interface AdaptiveLearningPathDashboardProps {
  stats: UserStats;
  questions?: Question[];
  onSelectModuleForPractice?: (moduleId: number, pathId?: 1 | 2 | 3) => void;
  onNavigateToTab?: (tab: AppTab) => void;
  onLaunchAiTutorial?: (topic: string, promptText: string, moduleId: number) => void;
  compact?: boolean;
}

interface ModuleTutorialMapping {
  moduleId: number;
  tutorialTitle: string;
  focusArea: string;
  keyTrap: string;
  recommendedPrompt: string;
}

// Comprehensive mapping of all 12 official AZ-900 modules to targeted Knowledge Assistant tutorials
const MODULE_TUTORIAL_MAPPINGS: Record<number, ModuleTutorialMapping> = {
  1: {
    moduleId: 1,
    tutorialTitle: 'Shared Responsibility & Service Models (IaaS vs PaaS vs SaaS)',
    focusArea: 'Customer vs. Microsoft Security & Management Boundaries, Public/Private/Hybrid',
    keyTrap: 'Believing OS patching is managed by the customer in PaaS, or that data classification is managed by Microsoft.',
    recommendedPrompt: 'Teach me the Shared Responsibility Model across IaaS, PaaS, and SaaS for the AZ-900 exam, plus Public vs. Private vs. Hybrid cloud models.',
  },
  2: {
    moduleId: 2,
    tutorialTitle: 'Cloud Resilience Matrix: High Availability, Scalability & Elasticity',
    focusArea: 'High Availability vs. Vertical/Horizontal Scaling vs. Agility vs. Disaster Recovery',
    keyTrap: 'Mixing vertical scaling (scale-up: larger VM size) with horizontal scaling (scale-out: adding VM instances).',
    recommendedPrompt: 'Break down High Availability, Elasticity, Agility, and Disaster Recovery for AZ-900. Give me a decision tree on when to scale up vs scale out in Azure.',
  },
  3: {
    moduleId: 3,
    tutorialTitle: 'Cloud Financial Models: CapEx vs. OpEx & Consumption Billing',
    focusArea: 'Capital Expenditure vs. Operational Expenditure and Serverless Pricing',
    keyTrap: 'Confusing on-premises upfront hardware purchase (CapEx) with cloud pay-as-you-go operating expenses (OpEx).',
    recommendedPrompt: 'Explain the difference between CapEx and OpEx in Azure, including real-world AZ-900 exam trap questions about consumption-based and serverless pricing models.',
  },
  4: {
    moduleId: 4,
    tutorialTitle: 'Core Azure Hierarchy: Regions, Zones, Subscriptions & Management Groups',
    focusArea: 'Availability Zones, Region Pairs, Resource Groups & Governance Scope',
    keyTrap: 'Thinking a Resource Group can only hold resources from one single Azure region (resources in a group can span regions).',
    recommendedPrompt: 'Explain Azure Regions, Region Pairs, Availability Zones, Resource Groups, Subscriptions, and Management Groups hierarchy for AZ-900.',
  },
  5: {
    moduleId: 5,
    tutorialTitle: 'Azure Compute & Networking: VMs, App Service, AKS, VNets & ExpressRoute',
    focusArea: 'Workload Hosting, Container Orchestration, VNet Peering & Hybrid Connectivity',
    keyTrap: 'Assuming ExpressRoute traverses the public internet instead of a dedicated private fiber connection, or mixing ACI vs AKS.',
    recommendedPrompt: 'Provide an AZ-900 architectural guide for Azure VMs, App Service, ACI vs AKS, VNet Peering, VPN Gateway, and ExpressRoute.',
  },
  6: {
    moduleId: 6,
    tutorialTitle: 'Azure Storage Tiers & Replication Strategies (LRS vs ZRS vs GRS)',
    focusArea: 'Blob Access Tiers (Hot/Cool/Cold/Archive), Azure Files & Redundancy',
    keyTrap: 'Overlooking the hours-long rehydration delay when accessing Archive tier blobs, or picking LRS when zonal resilience is needed.',
    recommendedPrompt: 'Explain Azure Blob Storage access tiers (Hot, Cool, Cold, Archive) and replication modes (LRS, ZRS, GRS, GZRS) plus AzCopy and Data Box for AZ-900.',
  },
  7: {
    moduleId: 7,
    tutorialTitle: 'Identity & Security: Microsoft Entra ID, MFA, RBAC & Zero Trust',
    focusArea: 'Authentication vs Authorization, Conditional Access & Defense-in-Depth',
    keyTrap: 'Confusing Microsoft Entra ID (cloud identity) with on-prem AD DS, or confusing RBAC (access) with Azure Policy (compliance).',
    recommendedPrompt: 'Compare Microsoft Entra ID, MFA, Conditional Access, Azure RBAC, Zero Trust, and Defense in Depth for the AZ-900 exam.',
  },
  8: {
    moduleId: 8,
    tutorialTitle: 'Azure Cost Management: Pricing Calculator, TCO, Reservations & Tags',
    focusArea: 'Estimating Cloud Spend, Hybrid Benefit, Savings Plans & Cost Alerts',
    keyTrap: 'Using the TCO Calculator instead of the Pricing Calculator to estimate costs for a brand-new cloud-native deployment.',
    recommendedPrompt: 'Explain Azure Pricing Calculator vs TCO Calculator, Reserved Instances, Savings Plans, Azure Hybrid Benefit, and Resource Tags for AZ-900.',
  },
  9: {
    moduleId: 9,
    tutorialTitle: 'Azure Governance & Compliance: Policy, Resource Locks & Purview',
    focusArea: 'Enforcing Location/SKU Rules, CanNotDelete vs ReadOnly Locks & Data Governance',
    keyTrap: 'Thinking a CanNotDelete lock prevents owners from modifying a resource, or failing to recognize locks override Owner RBAC permissions.',
    recommendedPrompt: 'Differentiate Azure Policy, Policy Initiatives, Resource Locks (CanNotDelete vs ReadOnly), and Microsoft Purview for AZ-900 governance questions.',
  },
  10: {
    moduleId: 10,
    tutorialTitle: 'Management & Deployment Tools: Cloud Shell, Azure Arc, ARM & Bicep',
    focusArea: 'Infrastructure as Code (IaC), Declarative Templates & Hybrid Management',
    keyTrap: 'Confusing Azure Arc (manage on-prem/multi-cloud servers via Azure) with Azure Migrate (move workloads into Azure).',
    recommendedPrompt: 'Compare Azure Portal, Azure CLI, PowerShell, Cloud Shell, Azure Arc, JSON ARM Templates, and Bicep for AZ-900.',
  },
  11: {
    moduleId: 11,
    tutorialTitle: 'Monitoring & Advisory Tools: Advisor, Service Health & Azure Monitor',
    focusArea: 'Telemetry Collection, Log Analytics, Application Insights & Health Alerts',
    keyTrap: 'Confusing Azure Status (global public status) with Azure Service Health (personalized subscription outage & maintenance alerts).',
    recommendedPrompt: 'Break down Azure Advisor, Azure Service Health vs Azure Status vs Resource Health, Azure Monitor, Log Analytics, and Application Insights for AZ-900.',
  },
  12: {
    moduleId: 12,
    tutorialTitle: 'Real-World Scenario Synthesis, Composite SLAs & Exam Tradeoffs',
    focusArea: 'Cross-Domain Architecture Tradeoffs, Multi-Tier Migrations & Service Lifecycle',
    keyTrap: 'Assuming Public Preview services carry a production SLA guarantee or forgetting how Composite SLAs multiply downtime probabilities.',
    recommendedPrompt: 'Walk me through real-world AZ-900 scenario synthesis: cross-domain architecture tradeoffs, Composite SLAs, and GA vs Preview service lifecycle rules.',
  },
};

export const AdaptiveLearningPathDashboard: React.FC<AdaptiveLearningPathDashboardProps> = ({
  stats,
  onSelectModuleForPractice,
  onNavigateToTab,
  onLaunchAiTutorial,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'low-accuracy' | 'unresolved'>('all');

  // Compute accuracy and attempt volume per module from attempts history + moduleMastery
  const modulePerformanceMap = useMemo(() => {
    const map: Record<
      number,
      {
        total: number;
        correct: number;
        accuracy: number;
        unresolvedCount: number;
        status: 'exam-ready' | 'developing' | 'needs-remediation' | 'not-started';
      }
    > = {};

    const allAttempts: QuestionAttempt[] = Object.values(stats.attempts || {}).flat();
    const reviewedSet = new Set(stats.reviewedMistakeIds || []);

    CURRICULUM_MODULES.forEach((mod: ModuleInfo) => {
      const modAttempts = allAttempts
        .filter((a) => a.moduleId === mod.id)
        .sort((a, b) => a.timestamp - b.timestamp);

      const mastery = stats.moduleMastery?.[mod.id];
      const total = Math.max(modAttempts.length, mastery?.total || 0);
      const correct =
        modAttempts.length >= (mastery?.total || 0)
          ? modAttempts.filter((a) => a.isCorrect).length
          : mastery?.correct || 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Count recent unresolved mistakes in the last attempts for this module
      const lastAttempts = modAttempts.slice(-5);
      const unresolvedCount = lastAttempts.filter(
        (a) => !a.isCorrect && !reviewedSet.has(a.questionId)
      ).length;

      let status: 'exam-ready' | 'developing' | 'needs-remediation' | 'not-started' = 'not-started';
      if (total === 0) {
        status = 'not-started';
      } else if (accuracy >= 80) {
        status = 'exam-ready';
      } else if (accuracy >= 70) {
        status = 'developing';
      } else {
        status = 'needs-remediation';
      }

      map[mod.id] = { total, correct, accuracy, unresolvedCount, status };
    });

    return map;
  }, [stats.attempts, stats.moduleMastery, stats.reviewedMistakeIds]);

  // Priority "What to Study Next" Queue (Top 3 remediation targets)
  const priorityStudyNextQueue = useMemo(() => {
    return CURRICULUM_MODULES.map((mod: ModuleInfo) => {
      const perf = modulePerformanceMap[mod.id];
      const tutorial = MODULE_TUTORIAL_MAPPINGS[mod.id];
      const isCompleted = stats.completedModules?.includes(mod.id);

      // Priority score: lower accuracy & higher unresolved mistakes = higher urgency
      let priorityScore = 0;
      if (perf.status === 'needs-remediation') priorityScore += 50 + (100 - perf.accuracy);
      else if (perf.status === 'developing') priorityScore += 30 + (100 - perf.accuracy);
      else if (perf.status === 'not-started') priorityScore += 20;

      priorityScore += perf.unresolvedCount * 15;
      if (isCompleted) priorityScore -= 25;

      return {
        module: mod,
        perf,
        tutorial,
        priorityScore,
      };
    })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
  }, [modulePerformanceMap, stats.completedModules]);

  // Overall Curriculum Accuracy
  const overallStats = useMemo(() => {
    let totalAttempts = 0;
    let totalCorrect = 0;
    let modulesWithAttempts = 0;
    let lowAccuracyCount = 0;

    Object.values(modulePerformanceMap).forEach((m) => {
      totalAttempts += m.total;
      totalCorrect += m.correct;
      if (m.total > 0) modulesWithAttempts++;
      if (m.status === 'needs-remediation') lowAccuracyCount++;
    });

    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const completedCount = stats.completedModules?.length || 0;

    return { totalAttempts, totalCorrect, accuracy, modulesWithAttempts, completedCount, lowAccuracyCount };
  }, [modulePerformanceMap, stats.completedModules]);

  const handleOpenTutorial = (mapping: ModuleTutorialMapping) => {
    if (onLaunchAiTutorial) {
      onLaunchAiTutorial(mapping.tutorialTitle, mapping.recommendedPrompt, mapping.moduleId);
    } else {
      // Dispatch global window event so Knowledge Assistant / AI Tutor picks up the prompt automatically
      window.dispatchEvent(
        new CustomEvent('az900_open_ai_tutorial', {
          detail: {
            topic: mapping.tutorialTitle,
            prompt: mapping.recommendedPrompt,
            moduleId: mapping.moduleId,
          },
        })
      );
      if (onNavigateToTab) {
        onNavigateToTab('assistant');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full text-slate-900">
      {/* Top Banner: Adaptive Summary & Recommendations */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#003865] to-[#005A9E] text-white p-4 sm:p-6 shadow-md relative overflow-hidden">
        <KitengeRibbon height={3} />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-1">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0078D4] to-sky-400 text-white flex items-center justify-center shrink-0 shadow-md">
              <Compass className="w-6 h-6 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
                  Adaptive Guidance
                </span>
                <span className="text-xs text-sky-200 font-mono font-bold">
                  AZ-900 Curriculum Diagnostic Engine
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Adaptive Learning Path Summary Dashboard
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                Automatically maps your module mastery to targeted Knowledge Assistant tutorials for low-accuracy topics (&lt;70%), pinpointing high-priority exam areas to study next.
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 bg-white/10 p-2.5 rounded-xl border border-white/15 backdrop-blur-xs shrink-0 text-center">
            <div className="px-2">
              <span className="text-[10px] font-bold uppercase text-sky-200 block">
                Avg Accuracy
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {overallStats.accuracy}%
              </span>
            </div>
            <div className="px-2 border-x border-white/20">
              <span className="text-[10px] font-bold uppercase text-sky-200 block">
                Modules Done
              </span>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                {overallStats.completedCount}/12
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-bold uppercase text-rose-300 block">
                Needs Attention
              </span>
              <span className="text-base sm:text-lg font-black text-rose-300 font-mono">
                {overallStats.lowAccuracyCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: "WHAT TO STUDY NEXT" PRIORITY REMEDIATION QUEUE
         ===================================================================== */}
      <section aria-label="What to Study Next Recommendations" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="font-black text-sm sm:text-base text-slate-900">
              Recommended: What to Study Next (Top Remediation Queue)
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Personalized based on mistakes &amp; low accuracy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {priorityStudyNextQueue.map((item, idx: number) => {
            const mod = item.module;
            const perf = item.perf;
            const tutorial = item.tutorial;
            const pathInfo = LEARNING_PATHS.find((p) => p.id === mod.pathId);

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group"
              >
                {/* Priority Ribbon */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                    #{idx + 1} Priority Next
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Path {mod.pathId} • {pathInfo?.title}
                  </span>
                </div>

                <div>
                  <h5 className="font-black text-sm text-slate-900 leading-snug">
                    Module {mod.id}: {mod.title}
                  </h5>
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <span
                      className={`font-mono font-black px-1.5 py-0.2 rounded text-[11px] ${
                        perf.accuracy < 60
                          ? 'bg-rose-100 text-rose-700'
                          : perf.accuracy < 75
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {perf.total > 0 ? `${perf.accuracy}% Accuracy` : 'No attempts yet'}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {perf.total} attempts ({perf.unresolvedCount} recent errors)
                    </span>
                  </div>
                </div>

                {/* Mapped Knowledge Assistant Tutorial Card */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-sky-800 font-extrabold text-xs">
                    <Bot className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span className="truncate">{tutorial.tutorialTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    <strong className="text-slate-800">Exam Trap:</strong> {tutorial.keyTrap}
                  </p>
                </div>

                {/* 1-Tap Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenTutorial(tutorial)}
                    className="px-2.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    title="Open this specific topic tutorial in the AI Tutor"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Study in AI Tutor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectModuleForPractice) {
                        onSelectModuleForPractice(mod.id, mod.pathId);
                      }
                      if (onNavigateToTab) {
                        onNavigateToTab('quiz');
                      }
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Practice questions specifically for this module"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Drill Module {mod.id}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: COMPLETE 12-MODULE ADAPTIVE CURRICULUM TUTORIAL MAP
         ===================================================================== */}
      <section aria-label="Curriculum Modules to Tutorials Mapping" className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden shadow-xs">
        <KitengeRibbon height={3} />
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0078D4]" />
              <span>Full AZ-900 Curriculum Tutorial &amp; Accuracy Mapping</span>
            </h4>
            <p className="text-xs text-slate-500">
              Select an Azure service module to launch targeted AI Knowledge Assistant breakdowns or practice question sets.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Filter:</span>
            {(
              [
                { id: 'all', label: 'All Modules' },
                { id: 'low-accuracy', label: 'Low Accuracy (<70%)' },
                { id: 'unresolved', label: 'Recent Mistakes' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterMode(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  filterMode === opt.id
                    ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Learning Paths Container */}
        <div className="p-4 sm:p-5 space-y-6">
          {LEARNING_PATHS.map((path) => {
            const pathModules = CURRICULUM_MODULES.filter((m: ModuleInfo) => m.pathId === path.id);
            const filteredModules = pathModules.filter((m: ModuleInfo) => {
              const perf = modulePerformanceMap[m.id];
              if (filterMode === 'low-accuracy') return perf.accuracy < 70 && perf.total > 0;
              if (filterMode === 'unresolved') return perf.unresolvedCount > 0;
              return true;
            });

            if (filteredModules.length === 0) return null;

            return (
              <div key={path.id} className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0078D4] text-white font-black text-xs flex items-center justify-center">
                      P{path.id}
                    </span>
                    <h5 className="font-black text-sm text-slate-900">
                      Learning Path {path.id}: {path.title}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {path.examWeight} Exam Weight • {filteredModules.length} Modules
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredModules.map((mod: ModuleInfo) => {
                    const perf = modulePerformanceMap[mod.id];
                    const tutorial = MODULE_TUTORIAL_MAPPINGS[mod.id];
                    const isComplete = stats.completedModules?.includes(mod.id);

                    return (
                      <div
                        key={mod.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                          perf.status === 'needs-remediation'
                            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                            : perf.status === 'exam-ready'
                            ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                            : 'bg-slate-50/60 border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] font-black text-[#0078D4]">
                                Module {mod.id}
                              </span>
                              {isComplete && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Complete</span>
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase ${
                                  perf.status === 'exam-ready'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : perf.status === 'developing'
                                    ? 'bg-amber-100 text-amber-800'
                                    : perf.status === 'needs-remediation'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {perf.status === 'exam-ready'
                                  ? 'Exam Ready'
                                  : perf.status === 'developing'
                                  ? 'Developing'
                                  : perf.status === 'needs-remediation'
                                  ? 'Needs Remediation'
                                  : 'Not Started'}
                              </span>
                            </div>
                            <h6 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                              {mod.title}
                            </h6>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-900 font-mono block">
                              {perf.total > 0 ? `${perf.accuracy}%` : '—'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {perf.total} attempts
                            </span>
                          </div>
                        </div>

                        {/* Mapped Knowledge Assistant Tutorial Pill */}
                        <div className="p-2 rounded-lg bg-white border border-slate-200/90 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Bot className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 truncate">
                              {tutorial.tutorialTitle}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenTutorial(tutorial)}
                            className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-[#0078D4] text-[#0078D4] hover:text-white border border-sky-200 text-[10px] font-black transition-colors cursor-pointer shrink-0"
                          >
                            Launch AI Tutorial
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
