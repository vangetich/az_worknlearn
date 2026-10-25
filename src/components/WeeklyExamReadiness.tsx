import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Sparkles,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  BookOpen,
  ShieldCheck,
  Zap,
  Award,
  X,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface WeeklyExamReadinessProps {
  stats: UserStats;
  onSelectModule: (moduleId: number) => void;
  onLaunchMicroDrill?: (moduleId: number) => void;
}

interface DailyAzureFactAndTip {
  id: string;
  dayLabel: string;
  category: 'Azure Fact of the Day' | 'Actionable Study Tip' | 'High-Yield Exam Trap';
  title: string;
  fact: string;
  actionableTip: string;
  moduleId: number;
  moduleName: string;
  officialDocUrl: string;
}

const DAILY_AZURE_FACTS_AND_TIPS: DailyAzureFactAndTip[] = [
  {
    id: 'fact-shared-resp',
    dayLabel: 'Monday Readiness Brief',
    category: 'Azure Fact of the Day',
    title: 'Shared Responsibility: The 3 Things You NEVER Delegate',
    fact: 'Across IaaS, PaaS, and SaaS, the customer is ALWAYS 100% responsible for (1) Information & Data, (2) Devices & Endpoints, and (3) Accounts & Identities.',
    actionableTip: 'Drill 3 Module 1 scenarios and verify you can immediately distinguish OS patching (PaaS = Microsoft, IaaS = Customer) from Data governance.',
    moduleId: 1,
    moduleName: 'Cloud Concepts & Shared Responsibility',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility',
  },
  {
    id: 'fact-az-vs-region',
    dayLabel: 'Tuesday Readiness Brief',
    category: 'High-Yield Exam Trap',
    title: 'Availability Zones vs. Region Pairs Latency & Distance',
    fact: 'Availability Zones are physically separate datacenters within a SINGLE region connected by <2ms low-latency fiber, whereas Region Pairs are separated by at least 300 miles.',
    actionableTip: 'When an exam scenario asks for "zero-downtime protection against a single datacenter power failure," always choose Availability Zones (or ZRS).',
    moduleId: 4,
    moduleName: 'Core Architectural Components',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
  },
  {
    id: 'fact-expressroute-vpn',
    dayLabel: 'Wednesday Readiness Brief',
    category: 'Azure Fact of the Day',
    title: 'ExpressRoute Bypasses the Public Internet Completely',
    fact: 'Azure VPN Gateway uses encrypted IPsec tunnels over the public internet, while Azure ExpressRoute uses a private, dedicated fiber circuit via a connectivity provider.',
    actionableTip: 'Scan networking stems for the phrase "must not traverse the public internet" or "predictable bandwidth SLA"—that is your instant trigger for ExpressRoute.',
    moduleId: 5,
    moduleName: 'Compute & Networking Services',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction',
  },
  {
    id: 'fact-blob-tiers',
    dayLabel: 'Thursday Readiness Brief',
    category: 'Actionable Study Tip',
    title: 'Blob Storage Access Tiers: Retention Days & Cost Matrix',
    fact: 'Hot tier has the lowest access cost; Cool requires 30+ days retention; Cold requires 90+ days; Archive requires 180+ days and is offline (hours to rehydrate).',
    actionableTip: 'Memorize the 30 / 90 / 180 day milestones for Cool, Cold, and Archive tiers, and remember Archive has the lowest per-GB storage price but highest retrieval fee.',
    moduleId: 6,
    moduleName: 'Azure Storage Services',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview',
  },
  {
    id: 'fact-policy-vs-rbac',
    dayLabel: 'Friday Readiness Brief',
    category: 'High-Yield Exam Trap',
    title: 'Azure Policy vs. Azure RBAC: Guardrails vs. Permissions',
    fact: 'Azure RBAC controls WHO can perform actions (User/Group permissions), while Azure Policy enforces WHAT resource configurations are allowed—even overriding Subscription Owners.',
    actionableTip: 'Pair Azure Policy with "Initiatives" (groups of policies) and remember that a CanNotDelete Resource Lock stops even an Owner from deleting a resource.',
    moduleId: 9,
    moduleName: 'Governance & Compliance',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
  },
  {
    id: 'fact-tco-vs-pricing',
    dayLabel: 'Saturday Readiness Brief',
    category: 'Azure Fact of the Day',
    title: 'TCO Calculator vs. Pricing Calculator',
    fact: 'The TCO (Total Cost of Ownership) Calculator compares on-premises datacenter costs against Azure migration savings; the Pricing Calculator estimates monthly bills for specific Azure resources.',
    actionableTip: 'Complete a quick drill on Module 8 Cost Management to lock in the difference between Budgets, Pricing Calculator, and TCO Calculator.',
    moduleId: 8,
    moduleName: 'Cost Management & SLAs',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/pricing-overview',
  },
  {
    id: 'fact-azure-arc',
    dayLabel: 'Sunday Readiness Brief',
    category: 'Actionable Study Tip',
    title: 'Azure Arc: Single-Pane Governance Beyond Azure',
    fact: 'Azure Arc projects on-premises physical/virtual servers and multi-cloud Kubernetes clusters into Azure Resource Manager so you can apply Azure Policy and tags everywhere.',
    actionableTip: 'Review Module 10 & 11 tools: ARM Templates/Bicep = declarative IaC; Azure Arc = hybrid/multi-cloud management; Azure Advisor = proactive best-practice recommendations.',
    moduleId: 10,
    moduleName: 'Resource Deployment & Azure Arc',
    officialDocUrl: 'https://learn.microsoft.com/en-us/azure/azure-arc/overview',
  },
];

export const WeeklyExamReadiness: React.FC<WeeklyExamReadinessProps> = ({
  stats,
  onSelectModule,
  onLaunchMicroDrill,
}) => {
  // Determine initial tip based on day of week so it rotates automatically each day
  const defaultDayIndex = useMemo(() => {
    const day = new Date().getDay(); // 0 = Sun .. 6 = Sat
    return day === 0 ? 6 : day - 1;
  }, []);

  const [activeTipIndex, setActiveTipIndex] = useState<number>(defaultDayIndex);
  const [showLivePushToast, setShowLivePushToast] = useState<boolean>(true);
  const [notificationsSubscribed, setNotificationsSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_weekly_readiness_push') !== 'false';
    } catch {
      return true;
    }
  });
  const [completedTipsToday, setCompletedTipsToday] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('az900_completed_daily_tips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentTip = DAILY_AZURE_FACTS_AND_TIPS[activeTipIndex];
  const isTipCompleted = completedTipsToday.includes(currentTip.id);

  // Compute Weekly Exam Readiness metrics
  const readinessMetrics = useMemo(() => {
    const overallAccuracy =
      stats.totalAnswered > 0
        ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
        : 0;

    // Count unique modules attempted out of 12
    const modulesAttempted = Object.values(stats.moduleMastery || {}).filter(
      (m) => m.total > 0
    ).length;
    const moduleCoveragePct = Math.round((modulesAttempted / 12) * 100);

    // Daily goal progress
    const dailyTarget = typeof stats.dailyGoal === 'number' && stats.dailyGoal > 0 ? stats.dailyGoal : 10;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();
    const dailyCompleted = Object.values(stats.attempts || {})
      .flat()
      .filter((a) => a.timestamp >= todayTs).length;
    const dailyPct = Math.min(100, Math.round((dailyCompleted / dailyTarget) * 100));

    // Weighted Exam Readiness Score (0 - 100)
    const readinessScore =
      stats.totalAnswered === 0
        ? 35
        : Math.min(
            100,
            Math.round(overallAccuracy * 0.55 + moduleCoveragePct * 0.3 + dailyPct * 0.15)
          );

    const statusLabel =
      readinessScore >= 80
        ? 'Exam Ready • High Confidence'
        : readinessScore >= 65
        ? 'On Track • Building Mastery'
        : 'Foundational • Keep Drilling Daily';

    return {
      readinessScore,
      overallAccuracy,
      modulesAttempted,
      moduleCoveragePct,
      dailyCompleted,
      dailyTarget,
      statusLabel,
    };
  }, [stats]);

  const handleNextTip = () => {
    setActiveTipIndex((prev) => (prev + 1) % DAILY_AZURE_FACTS_AND_TIPS.length);
    setShowLivePushToast(true);
  };

  const handleToggleCompleteTip = (id: string) => {
    setCompletedTipsToday((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('az900_completed_daily_tips', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleTogglePushSubscription = () => {
    setNotificationsSubscribed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_weekly_readiness_push', String(next));
      } catch {
        // ignore
      }
      if (next) setShowLivePushToast(true);
      return next;
    });
  };

  useEffect(() => {
    // Gently pulse notification banner when tip changes
    setShowLivePushToast(true);
  }, [activeTipIndex]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden">
      {/* Top Header Strip */}
      <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-900 via-[#0078D4] to-sky-800 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/15 text-amber-300 shrink-0 relative">
            <Bell className="w-4 h-4" />
            {notificationsSubscribed && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase">
                Weekly Exam Readiness &amp; Azure Fact of the Day
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                {readinessMetrics.readinessScore}% Readiness
              </span>
            </div>
            <p className="text-[11px] text-sky-100">
              {readinessMetrics.statusLabel} • {readinessMetrics.modulesAttempted}/12 Modules Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePushSubscription}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              notificationsSubscribed
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
            }`}
            title="Toggle daily actionable study tips & Azure Fact of the Day notifications"
          >
            <Bell className="w-3 h-3" />
            <span>{notificationsSubscribed ? 'Daily Tips: Active' : 'Daily Tips: Paused'}</span>
          </button>

          <button
            type="button"
            onClick={handleNextTip}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-colors cursor-pointer"
            title="Push next Azure Fact of the Day or actionable study tip"
          >
            <RefreshCw className="w-3 h-3 text-amber-300" />
            <span>Next Fact</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Left = Pushed Daily Notification Card | Right = Weekly Readiness Progress */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 8 Cols: Active Pushed Notification Card (Azure Fact of the Day + Actionable Study Tip) */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-amber-50/40 p-4 shadow-2xs relative">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    currentTip.category === 'Azure Fact of the Day'
                      ? 'bg-[#0078D4] text-white'
                      : currentTip.category === 'High-Yield Exam Trap'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{currentTip.category}</span>
                </span>

                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#0078D4]" />
                  <span>{currentTip.dayLabel}</span>
                </span>

                <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                  Module {currentTip.moduleId}: {currentTip.moduleName}
                </span>
              </div>

              {showLivePushToast && notificationsSubscribed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Pushed to Dashboard</span>
                  <button
                    type="button"
                    onClick={() => setShowLivePushToast(false)}
                    className="ml-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Dismiss push indicator"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              {currentTip.title}
            </h4>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/90 p-3 rounded-lg border border-slate-200/80">
              <strong className="text-[#0078D4] font-extrabold">⚡ Azure Fact: </strong>
              {currentTip.fact}
            </p>

            <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold">Actionable Study Tip: </strong>
                <span>{currentTip.actionableTip}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-3 mt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectModule(currentTip.moduleId)}
                className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Practice Module {currentTip.moduleId}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onLaunchMicroDrill && (
                <button
                  type="button"
                  onClick={() => onLaunchMicroDrill(currentTip.moduleId)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-700" />
                  <span>3-Q Rapid Drill</span>
                </button>
              )}

              <a
                href={currentTip.officialDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>MS Learn Doc</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => handleToggleCompleteTip(currentTip.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isTipCompleted
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTipCompleted ? 'Tip Completed' : 'Mark Tip Done'}</span>
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Weekly Exam Readiness Breakdown & Day Selector */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Weekly Readiness Pulse</span>
              </span>
              <MaasaiMedallion size={18} />
            </div>

            {/* Readiness Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Composite Exam Readiness</span>
                <span className="font-black text-[#0078D4]">
                  {readinessMetrics.readinessScore}% / 100%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0078D4] via-sky-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${readinessMetrics.readinessScore}%` }}
                />
              </div>
            </div>

            {/* Mini KPI Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-center">
                <div className="text-[10px] font-bold text-slate-500">Accuracy</div>
                <div className="text-xs font-black text-slate-900">
                  {readinessMetrics.overallAccuracy}%
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-center">
                <div className="text-[10px] font-bold text-slate-500">Modules</div>
                <div className="text-xs font-black text-slate-900">
                  {readinessMetrics.modulesAttempted}/12
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-center">
                <div className="text-[10px] font-bold text-slate-500">Tips Done</div>
                <div className="text-xs font-black text-emerald-700">
                  {completedTipsToday.length}/{DAILY_AZURE_FACTS_AND_TIPS.length}
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Fact Switcher Strip */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              7-Day Azure Fact &amp; Tip Schedule:
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, idx) => {
                const tipItem = DAILY_AZURE_FACTS_AND_TIPS[idx];
                const isSelected = idx === activeTipIndex;
                const isDone = completedTipsToday.includes(tipItem.id);
                return (
                  <button
                    key={tipItem.id}
                    type="button"
                    onClick={() => setActiveTipIndex(idx)}
                    className={`py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`${tipItem.dayLabel}: ${tipItem.title}`}
                  >
                    <span>{dayChar}</span>
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected
                          ? 'bg-amber-300'
                          : isDone
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
