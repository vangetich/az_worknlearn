import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Target,
  Zap,
  Layers,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { UserStats, Question } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import { MODULE_FREQUENTLY_MISSED_TERMS } from '../data/frequentlyMissedTerms';

interface TopMissedServicesTableProps {
  stats: UserStats;
  questions?: Question[];
  onSelectModule: (moduleId: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
}

export interface MissedServiceRow {
  rank: number;
  serviceName: string;
  category: string;
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  incorrectCount: number;
  totalAttempts: number;
  incorrectPercentage: number;
  examTrap: string;
  isLiveUserMetric: boolean;
}

const BENCHMARK_MISSED_SERVICES: Omit<MissedServiceRow, 'rank'>[] = [
  {
    serviceName: 'Azure Policy vs. Azure RBAC',
    category: 'Governance & Access',
    moduleId: 10,
    moduleTitle: 'Describe features and tools in Azure for governance and compliance',
    pathId: 3,
    incorrectCount: 17,
    totalAttempts: 25,
    incorrectPercentage: 68,
    examTrap:
      'Candidates frequently confuse RBAC (who can perform actions) with Azure Policy (what resource configurations and SKUs are allowed).',
    isLiveUserMetric: false,
  },
  {
    serviceName: 'Azure ExpressRoute vs. VPN Gateway',
    category: 'Hybrid Networking',
    moduleId: 6,
    moduleTitle: 'Describe Azure networking services',
    pathId: 2,
    incorrectCount: 13,
    totalAttempts: 21,
    incorrectPercentage: 62,
    examTrap:
      'ExpressRoute uses a dedicated private fiber connection (not the public internet), whereas VPN Gateway sends encrypted traffic over the public internet.',
    isLiveUserMetric: false,
  },
  {
    serviceName: 'Shared Responsibility Model (PaaS vs. IaaS)',
    category: 'Cloud Security Boundary',
    moduleId: 2,
    moduleTitle: 'Describe cloud service types',
    pathId: 1,
    incorrectCount: 11,
    totalAttempts: 19,
    incorrectPercentage: 58,
    examTrap:
      'In PaaS, Microsoft patches the OS; in IaaS, the customer patches the OS. Customer ALWAYS retains responsibility for Data, Endpoints, and Accounts.',
    isLiveUserMetric: false,
  },
  {
    serviceName: 'Availability Zones vs. Availability Sets',
    category: 'High Availability & SLA',
    moduleId: 4,
    moduleTitle: 'Describe the core architectural components of Azure',
    pathId: 2,
    incorrectCount: 9,
    totalAttempts: 17,
    incorrectPercentage: 53,
    examTrap:
      'Availability Zones protect against entire datacenter failures (99.99% SLA), while Availability Sets only protect against rack/power failures within one datacenter (99.95% SLA).',
    isLiveUserMetric: false,
  },
  {
    serviceName: 'Azure Resource Locks (ReadOnly vs. CanNotDelete)',
    category: 'Resource Governance',
    moduleId: 11,
    moduleTitle: 'Describe features and tools for managing and deploying Azure resources',
    pathId: 3,
    incorrectCount: 8,
    totalAttempts: 17,
    incorrectPercentage: 47,
    examTrap:
      'ReadOnly lock prevents even starting/stopping a VM or rotating storage keys. Even Owner role must explicitly remove a lock before deleting a locked resource.',
    isLiveUserMetric: false,
  },
];

export const TopMissedServicesTable: React.FC<TopMissedServicesTableProps> = ({
  stats,
  questions = BUILTIN_QUESTIONS,
  onSelectModule,
  onLaunchMicroDrill,
}) => {
  const top5Services = useMemo<MissedServiceRow[]>(() => {
    const moduleMap = new Map<number, { title: string; pathId: 1 | 2 | 3; keyTerms: string[] }>();
    LEARNING_PATHS.forEach((p) => {
      p.modules.forEach((m) => {
        moduleMap.set(m.id, { title: m.title, pathId: p.id, keyTerms: m.keyTerms });
      });
    });

    // Aggregate attempts per Azure service / concept
    const serviceStats = new Map<
      string,
      {
        serviceName: string;
        category: string;
        moduleId: number;
        moduleTitle: string;
        pathId: 1 | 2 | 3;
        incorrectCount: number;
        totalAttempts: number;
        examTrap: string;
      }
    >();

    Object.entries(stats.attempts || {}).forEach(([qId, attemptList]) => {
      if (!attemptList || attemptList.length === 0) return;
      const question = questions.find((q) => q.id === qId);
      if (!question) return;

      const modInfo = moduleMap.get(question.moduleId);
      const moduleTitle = modInfo?.title || question.moduleTitle;
      const pathId = modInfo?.pathId || question.learningPathId;

      // Determine the specific Azure service / term tested by this question
      const missedTermsForMod = MODULE_FREQUENTLY_MISSED_TERMS[question.moduleId] || [];
      const correctOptionText =
        question.options.find((o) => o.letter === question.correctAnswer)?.text || '';
      const combinedText = `${question.question} ${question.scenario} ${correctOptionText}`.toLowerCase();

      let matchedService = '';
      let matchedCategory = question.errorDiagnostic?.trapType || 'Core Azure Service';
      let matchedTrap =
        question.errorDiagnostic?.correctivePrescription || question.examTip;

      // 1. Check MODULE_FREQUENTLY_MISSED_TERMS
      for (const item of missedTermsForMod) {
        const keywords = item.term.toLowerCase().split(/\s+vs\.?\s+|\s+\/\s+/);
        if (keywords.some((kw) => kw.length > 2 && combinedText.includes(kw))) {
          matchedService = item.term;
          matchedCategory = item.category;
          matchedTrap = item.examTrap;
          break;
        }
      }

      // 2. Fallback to curriculum keyTerms
      if (!matchedService && modInfo) {
        for (const kt of modInfo.keyTerms) {
          if (combinedText.includes(kt.toLowerCase())) {
            matchedService = kt;
            break;
          }
        }
      }

      // 3. Fallback to correct answer option text if concise
      if (!matchedService) {
        matchedService =
          correctOptionText.length > 0 && correctOptionText.length <= 42
            ? correctOptionText
            : `Module ${question.moduleId} Core Services`;
      }

      const key = `${question.moduleId}::${matchedService}`;
      const existing = serviceStats.get(key) || {
        serviceName: matchedService,
        category: matchedCategory,
        moduleId: question.moduleId,
        moduleTitle,
        pathId,
        incorrectCount: 0,
        totalAttempts: 0,
        examTrap: matchedTrap,
      };

      attemptList.forEach((att) => {
        existing.totalAttempts += 1;
        if (!att.isCorrect) {
          existing.incorrectCount += 1;
        }
      });

      serviceStats.set(key, existing);
    });

    // Filter to services with at least 1 incorrect attempt and sort by incorrectPercentage DESC, then incorrectCount DESC
    const liveMissed = Array.from(serviceStats.values())
      .filter((s) => s.incorrectCount > 0 && s.totalAttempts > 0)
      .map((s) => ({
        ...s,
        incorrectPercentage: Math.round((s.incorrectCount / s.totalAttempts) * 100),
        isLiveUserMetric: true,
      }))
      .sort((a, b) => {
        if (b.incorrectPercentage !== a.incorrectPercentage) {
          return b.incorrectPercentage - a.incorrectPercentage;
        }
        return b.incorrectCount - a.incorrectCount;
      });

    // Combine live user missed services with benchmark services to always show a full Top 5
    const combined: Omit<MissedServiceRow, 'rank'>[] = [...liveMissed.slice(0, 5)];
    for (const bench of BENCHMARK_MISSED_SERVICES) {
      if (combined.length >= 5) break;
      const alreadyIncluded = combined.some(
        (c) =>
          c.serviceName.toLowerCase() === bench.serviceName.toLowerCase() ||
          (c.moduleId === bench.moduleId && c.isLiveUserMetric)
      );
      if (!alreadyIncluded) {
        combined.push(bench);
      }
    }

    return combined.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [stats.attempts, questions]);

  const hasLiveMistakes = top5Services.some((s) => s.isLiveUserMetric);

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-[#00345d] to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                Top 5 Most Frequently Missed Azure Services
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {hasLiveMistakes ? 'Personalized Telemetry + Benchmark' : 'AZ-900 Exam Priority Benchmark'}
              </span>
            </div>
            <p className="text-xs text-sky-200/90 mt-0.5">
              Prioritize your revision by targeting the exact Azure services and module boundaries with the highest incorrect attempt rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold text-sky-100">
            <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
            <span>Sorted by Error Rate %</span>
          </span>
        </div>
      </div>

      {/* Responsive Detailed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 pl-6 pr-3 w-16">Rank</th>
              <th className="py-3.5 px-4">Azure Service &amp; Exam Trap</th>
              <th className="py-3.5 px-4">Respective Module Name</th>
              <th className="py-3.5 px-4 w-48">Incorrect Attempts %</th>
              <th className="py-3.5 pl-4 pr-6 text-right w-40">Priority Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 text-xs">
            {top5Services.map((row) => {
              const isHighRisk = row.incorrectPercentage >= 60;
              const isMediumRisk = row.incorrectPercentage >= 45 && row.incorrectPercentage < 60;

              return (
                <tr
                  key={`${row.rank}-${row.serviceName}`}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* Rank Column */}
                  <td className="py-4 pl-6 pr-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shadow-2xs ${
                          row.rank === 1
                            ? 'bg-rose-600 text-white'
                            : row.rank === 2
                            ? 'bg-orange-500 text-white'
                            : row.rank === 3
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        #{row.rank}
                      </span>
                    </div>
                  </td>

                  {/* Service Name & Trap Breakdown */}
                  <td className="py-4 px-4 align-top max-w-md">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900">
                          {row.serviceName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {row.category}
                        </span>
                        {row.isLiveUserMetric ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            Your Attempts
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0078D4] border border-blue-200">
                            Exam Benchmark
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Why Missed:</strong> {row.examTrap}
                      </p>
                    </div>
                  </td>

                  {/* Respective Module Name */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          row.pathId === 1
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : row.pathId === 2
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-orange-50 text-orange-900 border-orange-200'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>Path {row.pathId} • Module {row.moduleId}</span>
                      </span>
                      <p className="font-bold text-slate-800 leading-snug max-w-[230px]">
                        {row.moduleTitle}
                      </p>
                    </div>
                  </td>

                  {/* Percentage of Incorrect Attempts */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-black text-sm ${
                            isHighRisk
                              ? 'text-rose-600'
                              : isMediumRisk
                              ? 'text-orange-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {row.incorrectPercentage}% Incorrect
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          ({row.incorrectCount}/{row.totalAttempts} missed)
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHighRisk
                              ? 'bg-gradient-to-r from-rose-500 to-red-600'
                              : isMediumRisk
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-500'
                          }`}
                          style={{ width: `${Math.min(100, row.incorrectPercentage)}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-bold text-slate-500 block">
                        {isHighRisk
                          ? 'High Priority Review'
                          : isMediumRisk
                          ? 'Moderate Priority'
                          : 'Reinforce Concept'}
                      </span>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="py-4 pl-4 pr-6 align-top text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectModule(row.moduleId)}
                        className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Study Module {row.moduleId}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {onLaunchMicroDrill && (
                        <button
                          type="button"
                          onClick={() => onLaunchMicroDrill(row.moduleId)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px] transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                          <span>3-Q Rapid Drill</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
