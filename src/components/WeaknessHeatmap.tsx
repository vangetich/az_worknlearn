import React, { useState, useMemo } from 'react';
import {
  Grid,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Flame,
  Zap,
  Info,
  Layers,
  Server,
  Cloud,
  Shield,
  Database,
  Lock,
  DollarSign,
  Activity,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { BUILTIN_QUESTIONS } from '../data/questionBank';

interface WeaknessHeatmapProps {
  moduleMastery: Record<number, { correct: number; total: number }>;
  onSelectModule: (moduleId: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
  stats?: UserStats;
}

interface LowestModule {
  id: number;
  title: string;
  score: number;
}

interface AzureServiceDef {
  id: string;
  name: string;
  category: 'Compute' | 'Networking' | 'Storage' | 'Security & Identity' | 'Governance' | 'Cost & Management' | 'Concepts';
  moduleId: number;
  pathId: 1 | 2 | 3;
  keywords: string[];
}

const AZURE_SERVICES_CATALOG: AzureServiceDef[] = [
  {
    id: 'vm',
    name: 'Azure Virtual Machines & Scale Sets',
    category: 'Compute',
    moduleId: 5,
    pathId: 2,
    keywords: ['virtual machine', 'vm', 'scale set', 'iaas', 'operating system'],
  },
  {
    id: 'app-service',
    name: 'Azure App Service & Functions',
    category: 'Compute',
    moduleId: 5,
    pathId: 2,
    keywords: ['app service', 'function', 'serverless', 'web app', 'paas'],
  },
  {
    id: 'aks',
    name: 'Azure Containers & AKS',
    category: 'Compute',
    moduleId: 5,
    pathId: 2,
    keywords: ['aks', 'container', 'kubernetes', 'docker'],
  },
  {
    id: 'vnet-vpn',
    name: 'Virtual Network (VNet) & VPN Gateway',
    category: 'Networking',
    moduleId: 6,
    pathId: 2,
    keywords: ['vnet', 'virtual network', 'vpn gateway', 'subnet', 'peering'],
  },
  {
    id: 'expressroute',
    name: 'Azure ExpressRoute',
    category: 'Networking',
    moduleId: 6,
    pathId: 2,
    keywords: ['expressroute', 'private connection', 'telecom', 'dedicated circuit'],
  },
  {
    id: 'blob-storage',
    name: 'Azure Blob Storage & Access Tiers',
    category: 'Storage',
    moduleId: 7,
    pathId: 2,
    keywords: ['blob', 'access tier', 'hot', 'cool', 'cold', 'archive', 'unstructured'],
  },
  {
    id: 'storage-redundancy',
    name: 'Storage Redundancy (LRS, ZRS, GRS)',
    category: 'Storage',
    moduleId: 7,
    pathId: 2,
    keywords: ['lrs', 'zrs', 'grs', 'gzrs', 'redundancy', 'datacenter', 'replication'],
  },
  {
    id: 'cosmos-sql',
    name: 'Azure Cosmos DB & Azure SQL',
    category: 'Storage',
    moduleId: 7,
    pathId: 2,
    keywords: ['cosmos', 'sql database', 'nosql', 'relational', 'multi-region'],
  },
  {
    id: 'entra-id',
    name: 'Microsoft Entra ID (Azure AD)',
    category: 'Security & Identity',
    moduleId: 8,
    pathId: 2,
    keywords: ['entra', 'azure ad', 'single sign-on', 'mfa', 'conditional access', 'identity'],
  },
  {
    id: 'rbac',
    name: 'Azure Role-Based Access Control (RBAC)',
    category: 'Security & Identity',
    moduleId: 8,
    pathId: 2,
    keywords: ['rbac', 'role-based', 'permissions', 'contributor', 'owner', 'reader'],
  },
  {
    id: 'azure-policy',
    name: 'Azure Policy & Initiatives',
    category: 'Governance',
    moduleId: 10,
    pathId: 3,
    keywords: ['policy', 'initiative', 'compliance', 'enforce', 'allowed locations', 'governance'],
  },
  {
    id: 'resource-locks',
    name: 'Azure Resource Locks (ReadOnly / CanNotDelete)',
    category: 'Governance',
    moduleId: 10,
    pathId: 3,
    keywords: ['lock', 'readonly', 'cannotdelete', 'accidental deletion'],
  },
  {
    id: 'cost-pricing',
    name: 'Cost Management & Pricing Calculator',
    category: 'Cost & Management',
    moduleId: 9,
    pathId: 3,
    keywords: ['pricing calculator', 'tco', 'cost management', 'budget', 'spending alert', 'capex', 'opex'],
  },
  {
    id: 'arm-bicep',
    name: 'ARM Templates, Bicep & Cloud Shell',
    category: 'Cost & Management',
    moduleId: 11,
    pathId: 3,
    keywords: ['arm template', 'bicep', 'cloud shell', 'cli', 'powershell', 'infrastructure as code'],
  },
  {
    id: 'azure-arc',
    name: 'Azure Arc (Hybrid Cloud)',
    category: 'Cost & Management',
    moduleId: 11,
    pathId: 3,
    keywords: ['azure arc', 'arc', 'hybrid', 'on-premises', 'multicloud'],
  },
  {
    id: 'monitor-health',
    name: 'Azure Monitor & Service Health',
    category: 'Cost & Management',
    moduleId: 12,
    pathId: 3,
    keywords: ['monitor', 'service health', 'log analytics', 'application insights', 'alert', 'metrics'],
  },
];

export const WeaknessHeatmap: React.FC<WeaknessHeatmapProps> = ({
  moduleMastery,
  onSelectModule,
  onLaunchMicroDrill,
  stats,
}) => {
  const [heatmapView, setHeatmapView] = useState<'services' | 'modules'>('services');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'gaps' | 'mastered'>('all');

  // Compute Module Status
  const getModuleStatus = (moduleId: number) => {
    const data = moduleMastery[moduleId] || { correct: 0, total: 0 };
    if (data.total === 0) {
      return {
        score: null,
        tier: 'new',
        label: 'Unattempted',
        bg: 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70',
        text: 'text-slate-700',
        badge: 'bg-slate-200 text-slate-600',
        dot: 'bg-slate-300',
      };
    }

    const pct = Math.round((data.correct / data.total) * 100);

    if (pct >= 85) {
      return {
        score: pct,
        tier: 'mastery',
        label: 'Mastery (Exam Ready)',
        bg: 'bg-emerald-50 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/80',
        text: 'text-emerald-950',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-500',
      };
    } else if (pct >= 70) {
      return {
        score: pct,
        tier: 'solid',
        label: 'Solid (Passing)',
        bg: 'bg-sky-50 border-sky-300 hover:border-[#0078D4] hover:bg-sky-100/80',
        text: 'text-sky-950',
        badge: 'bg-[#0078D4] text-white',
        dot: 'bg-[#0078D4]',
      };
    } else if (pct >= 50) {
      return {
        score: pct,
        tier: 'developing',
        label: 'Developing',
        bg: 'bg-amber-50 border-amber-300 hover:border-amber-500 hover:bg-amber-100/80',
        text: 'text-amber-950',
        badge: 'bg-amber-600 text-white',
        dot: 'bg-amber-500',
      };
    } else {
      return {
        score: pct,
        tier: 'critical',
        label: 'Low Confidence (Needs Focus)',
        bg: 'bg-red-50 border-red-300 hover:border-red-500 hover:bg-red-100/80',
        text: 'text-red-950',
        badge: 'bg-red-600 text-white',
        dot: 'bg-red-500',
      };
    }
  };

  // Find lowest scoring module
  const lowestScoringModule = useMemo<LowestModule | null>(() => {
    let result: LowestModule | null = null;
    for (const path of LEARNING_PATHS) {
      for (const mod of path.modules) {
        const data = moduleMastery[mod.id];
        if (data && data.total > 0) {
          const pct = Math.round((data.correct / data.total) * 100);
          if (result === null || pct < result.score) {
            result = { id: mod.id, title: mod.title, score: pct };
          }
        }
      }
    }
    return result;
  }, [moduleMastery]);

  // Compute Service-level Knowledge Gaps from question attempts & mistakes
  const serviceGaps = useMemo(() => {
    const attempts = stats?.attempts || {};
    const mistakes = stats?.mistakesHistory || [];

    // Map each service to questions and attempts
    return AZURE_SERVICES_CATALOG.map((svc) => {
      // Find all questions associated with this service
      const matchingQuestions = BUILTIN_QUESTIONS.filter((q) => {
        if (q.moduleId === svc.moduleId) return true;
        const text = `${q.scenario} ${q.question} ${q.whyCorrect}`.toLowerCase();
        return svc.keywords.some((kw) => text.includes(kw.toLowerCase()));
      });

      const qIds = new Set(matchingQuestions.map((q) => q.id));

      let totalAnswers = 0;
      let totalCorrect = 0;
      let totalMissed = 0;

      // Count attempts for these questions
      qIds.forEach((id) => {
        const attList = attempts[id] || [];
        attList.forEach((att) => {
          totalAnswers++;
          if (att.isCorrect) {
            totalCorrect++;
          } else {
            totalMissed++;
          }
        });
      });

      // Also factor in mistakesHistory
      mistakes.forEach((m) => {
        if (m.moduleId === svc.moduleId || qIds.has(m.questionId)) {
          // If not already captured in attempts
          if (totalAnswers === 0) {
            totalAnswers++;
            totalMissed++;
          }
        }
      });

      const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

      let riskTier: 'critical' | 'moderate' | 'mastered' | 'untested';
      if (totalAnswers === 0) {
        riskTier = 'untested';
      } else if (accuracy < 60 || totalMissed >= 2) {
        riskTier = 'critical';
      } else if (accuracy < 75 || totalMissed >= 1) {
        riskTier = 'moderate';
      } else {
        riskTier = 'mastered';
      }

      return {
        ...svc,
        totalAnswers,
        totalCorrect,
        totalMissed,
        accuracy,
        riskTier,
        questionCount: matchingQuestions.length,
      };
    });
  }, [stats]);

  const criticalGapsCount = serviceGaps.filter((s) => s.riskTier === 'critical').length;
  const moderateGapsCount = serviceGaps.filter((s) => s.riskTier === 'moderate').length;

  const filteredServiceGaps = useMemo(() => {
    return serviceGaps.filter((s) => {
      if (serviceFilter === 'gaps') return s.riskTier === 'critical' || s.riskTier === 'moderate';
      if (serviceFilter === 'mastered') return s.riskTier === 'mastered';
      return true;
    });
  }, [serviceGaps, serviceFilter]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation p-6 sm:p-8 space-y-6">
      {/* Heatmap Top Bar with Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-[#0078D4]" />
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Curriculum &amp; Azure Services Knowledge Gap Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual diagnosis of frequently missed Azure services and curriculum modules to pinpoint revision priorities.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setHeatmapView('services')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                heatmapView === 'services'
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Azure Services ({criticalGapsCount > 0 ? `${criticalGapsCount} Gaps` : 'All'})</span>
            </button>
            <button
              onClick={() => setHeatmapView('modules')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                heatmapView === 'modules'
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>12 Modules Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: AZURE SERVICES KNOWLEDGE GAP HEATMAP */}
      {heatmapView === 'services' && (
        <div className="space-y-6">
          {/* Summary Alert if Knowledge Gaps Detected */}
          {criticalGapsCount > 0 ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Knowledge Gap Detected:</span> You have frequently missed questions in{' '}
                  <strong>{criticalGapsCount} Azure {criticalGapsCount === 1 ? 'service' : 'services'}</strong>.
                  Focus on these before taking the certification exam.
                </div>
              </div>
              <button
                onClick={() => setServiceFilter('gaps')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-colors"
              >
                Filter Gaps Only
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Balanced Knowledge Base:</strong> No critical knowledge gaps detected across your Azure services practice.
              </span>
            </div>
          )}

          {/* Quick Sub-Filter */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setServiceFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  serviceFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Services ({serviceGaps.length})
              </button>
              <button
                onClick={() => setServiceFilter('gaps')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  serviceFilter === 'gaps'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Knowledge Gaps ({criticalGapsCount + moderateGapsCount})</span>
              </button>
              <button
                onClick={() => setServiceFilter('mastered')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  serviceFilter === 'mastered'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>High Confidence ({serviceGaps.filter((s) => s.riskTier === 'mastered').length})</span>
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Critical Gap (&lt;60%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Needs Review (60-74%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Mastered (&ge;75%)</span>
              </span>
            </div>
          </div>

          {/* Azure Services Heatmap Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredServiceGaps.map((svc) => {
              let cardBg = 'bg-slate-50 border-slate-200 hover:border-slate-300';
              let badgeColor = 'bg-slate-200 text-slate-700';
              let dotColor = 'bg-slate-300';
              let statusLabel = 'Untested';

              if (svc.riskTier === 'critical') {
                cardBg = 'bg-rose-50/90 border-rose-300 hover:border-rose-500 shadow-2xs';
                badgeColor = 'bg-rose-600 text-white';
                dotColor = 'bg-rose-500';
                statusLabel = `${svc.totalMissed} Missed (${svc.accuracy}%)`;
              } else if (svc.riskTier === 'moderate') {
                cardBg = 'bg-amber-50/90 border-amber-300 hover:border-amber-500 shadow-2xs';
                badgeColor = 'bg-amber-600 text-white';
                dotColor = 'bg-amber-500';
                statusLabel = `${svc.totalMissed} Missed (${svc.accuracy}%)`;
              } else if (svc.riskTier === 'mastered') {
                cardBg = 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-500 shadow-2xs';
                badgeColor = 'bg-emerald-600 text-white';
                dotColor = 'bg-emerald-500';
                statusLabel = `${svc.accuracy}% Passing`;
              }

              return (
                <div
                  key={svc.id}
                  onClick={() => onSelectModule(svc.moduleId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${cardBg}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {svc.category} • M{svc.moduleId}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 ${badgeColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-white shrink-0`} />
                        <span>{statusLabel}</span>
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-[#0078D4] transition-colors line-clamp-2">
                      {svc.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {svc.totalAnswers > 0
                        ? `${svc.totalCorrect} / ${svc.totalAnswers} answered correctly`
                        : `${svc.questionCount} questions available`}
                    </span>
                    <span className="text-[#0078D4] font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Practice</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 12-MODULE CURRICULUM MAP */}
      {heatmapView === 'modules' && (
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="font-bold text-slate-700">Domain Performance Legend:</span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Mastery (&ge;85%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#0078D4]" />
              <span>Passing (70-84%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Developing (50-69%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>Critical Risk (&lt;50%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span>Unattempted</span>
            </span>
          </div>

          {/* Module Heatmap Columns grouped by Path 1, 2, 3 */}
          <div className="space-y-4">
            {LEARNING_PATHS.map((path) => (
              <div key={path.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: path.accentColor }}
                    />
                    <span>Path {path.id}: {path.title}</span>
                    <span className="text-slate-400 font-normal">({path.examWeight})</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {path.modules.length} Modules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {path.modules.map((mod) => {
                    const status = getModuleStatus(mod.id);
                    const data = moduleMastery[mod.id] || { correct: 0, total: 0 };

                    return (
                      <div
                        key={mod.id}
                        onClick={() => onSelectModule(mod.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs group relative ${status.bg}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${status.dot} shrink-0`} />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              M{mod.id}
                            </span>
                          </div>

                          {status.score !== null ? (
                            <span
                              className={`text-xs font-extrabold px-1.5 py-0.5 rounded shadow-2xs ${status.badge}`}
                            >
                              {status.score}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                              Unattempted
                            </span>
                          )}
                        </div>

                        <h5
                          className={`text-xs font-bold mt-1.5 line-clamp-1 group-hover:text-blue-900 transition-colors ${status.text}`}
                        >
                          {mod.title}
                        </h5>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {data.total > 0
                              ? `${data.correct}/${data.total} correct`
                              : '0 questions solved'}
                          </span>
                          <span className="text-[#0078D4] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Practice</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap Quick Remediation Banner */}
          {lowestScoringModule !== null && lowestScoringModule.score < 70 ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>Heatmap Alert:</strong> M{lowestScoringModule.id} ({lowestScoringModule.title}) has the lowest confidence score ({lowestScoringModule.score}%).
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onLaunchMicroDrill && (
                  <button
                    onClick={() => onLaunchMicroDrill(lowestScoringModule.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Drill M{lowestScoringModule.id}</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectModule(lowestScoringModule.id)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-900 font-semibold transition-colors"
                >
                  View Questions
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
