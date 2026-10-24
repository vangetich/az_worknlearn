import React, { useState, useEffect } from 'react';
import {
  Compass,
  ExternalLink,
  CheckCircle2,
  Users,
  Sparkles,
  BookOpen,
  ArrowRight,
  Share2,
  Check,
  Award,
  Flame,
  MessageCircle,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

export interface CuratedWeeklyService {
  id: string;
  name: string;
  category: string;
  moduleId: number;
  moduleTitle: string;
  focusSummary: string;
  examCue: string;
  docsUrl: string;
  docsLabel: string;
}

export interface RoadmapWeek {
  weekNumber: number;
  swahiliTitle: string;
  englishTheme: string;
  proverbQuote: string;
  communityLearnersCount: number;
  cohortCompletionRate: number;
  topServices: [CuratedWeeklyService, CuratedWeeklyService, CuratedWeeklyService];
}

export const HARAMBEE_WEEKLY_ROADMAP: RoadmapWeek[] = [
  {
    weekNumber: 1,
    swahiliTitle: 'Wiki ya Kwanza • Msingi wa Wingu',
    englishTheme: 'Cloud Foundations, High Availability & Global Infrastructure',
    proverbQuote:
      '"Msingi imara hujenga nyumba ya kudumu" — A strong foundation builds a lasting house.',
    communityLearnersCount: 342,
    cohortCompletionRate: 88,
    topServices: [
      {
        id: 'w1-availability-zones',
        name: 'Azure Availability Zones',
        category: 'High Availability (Path 1 & 2)',
        moduleId: 4,
        moduleTitle: 'Describe the Core Architectural Components of Azure',
        focusSummary:
          'Physically separate datacenters within an Azure region with independent power, cooling, and networking.',
        examCue:
          'Protects workloads against complete datacenter failure with a 99.99% VM uptime SLA.',
        docsUrl: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
        docsLabel: 'MS Learn: Availability Zones',
      },
      {
        id: 'w1-management-groups',
        name: 'Azure Management Groups & Subscriptions',
        category: 'Hierarchy & Scope (Path 2)',
        moduleId: 4,
        moduleTitle: 'Describe the Core Architectural Components of Azure',
        focusSummary:
          'Organize multiple Azure subscriptions into a unified governance hierarchy (up to 6 levels of depth).',
        examCue:
          'RBAC roles and Azure Policies assigned at a Management Group inherit down to Subscriptions, Resource Groups, and Resources.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/governance/management-groups/overview',
        docsLabel: 'MS Learn: Management Groups',
      },
      {
        id: 'w1-shared-responsibility',
        name: 'Shared Responsibility & Service Models (IaaS / PaaS / SaaS)',
        category: 'Cloud Concepts (Path 1)',
        moduleId: 3,
        moduleTitle: 'Describe Cloud Service Types',
        focusSummary:
          'Defines security and operational boundaries between the customer and Microsoft across IaaS, PaaS, and SaaS.',
        examCue:
          'Customer ALWAYS retains responsibility for Data, Endpoints, Account Identities, and Access Management.',
        docsUrl: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility',
        docsLabel: 'MS Learn: Shared Responsibility',
      },
    ],
  },
  {
    weekNumber: 2,
    swahiliTitle: 'Wiki ya Pili • Nguvu ya Kompyuta na Mtandao',
    englishTheme: 'Core Compute, Hybrid Networking & Enterprise Connectivity',
    proverbQuote:
      '"Umoja ni nguvu, utengano ni udhaifu" — Unity is strength; connected networks empower the cloud.',
    communityLearnersCount: 298,
    cohortCompletionRate: 79,
    topServices: [
      {
        id: 'w2-expressroute',
        name: 'Azure ExpressRoute vs. VPN Gateway',
        category: 'Networking (Path 2)',
        moduleId: 5,
        moduleTitle: 'Describe Azure Compute and Networking Services',
        focusSummary:
          'Dedicated private fiber connection from on-premises to Azure via a connectivity provider, bypassing the public internet.',
        examCue:
          'Choose ExpressRoute when a scenario requires private dedicated bandwidth that NEVER traverses the public internet.',
        docsUrl: 'https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction',
        docsLabel: 'MS Learn: Azure ExpressRoute',
      },
      {
        id: 'w2-vmss-functions',
        name: 'Virtual Machine Scale Sets (VMSS) & Azure Functions',
        category: 'Compute & Serverless (Path 2)',
        moduleId: 5,
        moduleTitle: 'Describe Azure Compute and Networking Services',
        focusSummary:
          'VMSS automatically scales up to 1,000 identical VMs; Azure Functions runs event-driven serverless code billed per execution.',
        examCue:
          'Event-driven short code = Azure Functions; visual workflow orchestration = Azure Logic Apps.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview',
        docsLabel: 'MS Learn: VM Scale Sets',
      },
      {
        id: 'w2-vnet-peering',
        name: 'Azure Virtual Network (VNet) Peering & NSGs',
        category: 'Network Security (Path 2)',
        moduleId: 5,
        moduleTitle: 'Describe Azure Compute and Networking Services',
        focusSummary:
          'Seamlessly connects two or more Virtual Networks across the private Microsoft backbone while NSGs filter traffic by 5-tuple rules.',
        examCue:
          'VNet Peering is non-transitive by default; traffic stays completely on Microsoft private backbone.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview',
        docsLabel: 'MS Learn: VNet Peering',
      },
    ],
  },
  {
    weekNumber: 3,
    swahiliTitle: 'Wiki ya Tatu • Hifadhi na Usalama wa Utambulisho',
    englishTheme: 'Resilient Storage Tiers, Zero Trust & Microsoft Entra ID',
    proverbQuote:
      '"Kutoa ni moyo, kulinda ni akili" — Sharing takes heart, protecting identity takes wisdom.',
    communityLearnersCount: 274,
    cohortCompletionRate: 74,
    topServices: [
      {
        id: 'w3-blob-storage',
        name: 'Azure Blob Storage Access Tiers & Redundancy (LRS / ZRS / GRS)',
        category: 'Storage (Path 2)',
        moduleId: 6,
        moduleTitle: 'Describe Azure Storage Services',
        focusSummary:
          'Lifecycle-managed object storage across Hot, Cool (30d), Cold (90d), and Archive (180d offline) tiers with LRS, ZRS, GRS, and GZRS.',
        examCue:
          'Archive tier has the lowest storage price per GB, highest rehydration cost, and requires hours to rehydrate.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview',
        docsLabel: 'MS Learn: Blob Access Tiers',
      },
      {
        id: 'w3-entra-conditional-access',
        name: 'Microsoft Entra ID & Conditional Access',
        category: 'Identity & Access (Path 2)',
        moduleId: 7,
        moduleTitle: 'Describe Azure Identity, Access, and Security',
        focusSummary:
          'Cloud identity and access management service using Zero Trust signals (user, location, device health, risk) to enforce MFA.',
        examCue:
          'Conditional Access uses If-Then signal policies; SSO lets users sign in once to access multiple apps.',
        docsUrl:
          'https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview',
        docsLabel: 'MS Learn: Conditional Access',
      },
      {
        id: 'w3-defender-keyvault',
        name: 'Microsoft Defender for Cloud & Azure Key Vault',
        category: 'Cloud Security (Path 2)',
        moduleId: 7,
        moduleTitle: 'Describe Azure Identity, Access, and Security',
        focusSummary:
          'Defender for Cloud tracks Secure Score and hybrid posture; Azure Key Vault safeguards cryptographic keys, secrets, and certificates.',
        examCue:
          'Never store passwords or API secrets in application code—always store them in Azure Key Vault.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction',
        docsLabel: 'MS Learn: Defender for Cloud',
      },
    ],
  },
  {
    weekNumber: 4,
    swahiliTitle: 'Wiki ya Nne • Utawala, Gharama na Ufuatiliaji',
    englishTheme: 'Governance Guardrails, Cost Management & Observability',
    proverbQuote:
      '"Mpanda ngazi hushuka, lakini mjenzi wa nidhamu hufaulu" — Discipline and governance crown the journey.',
    communityLearnersCount: 315,
    cohortCompletionRate: 84,
    topServices: [
      {
        id: 'w4-policy-vs-rbac',
        name: 'Azure Policy vs. Role-Based Access Control (RBAC) & Locks',
        category: 'Governance (Path 3)',
        moduleId: 9,
        moduleTitle: 'Describe Features and Tools in Azure for Governance and Compliance',
        focusSummary:
          'Azure Policy enforces resource compliance properties (allowed regions/SKUs); RBAC controls user actions; Locks prevent deletion.',
        examCue:
          'ReadOnly Lock prevents starting/stopping a VM because it blocks POST operations on the compute resource.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
        docsLabel: 'MS Learn: Azure Policy',
      },
      {
        id: 'w4-cost-calculators',
        name: 'Azure Pricing Calculator, TCO Calculator & Cost Management',
        category: 'Cost Management (Path 3)',
        moduleId: 8,
        moduleTitle: 'Describe Cost Management in Azure',
        focusSummary:
          'TCO Calculator compares on-premises vs. Azure migration savings; Pricing Calculator estimates cloud service costs; Budgets send alerts.',
        examCue:
          'Inbound data transfer (ingress) into Azure is FREE; outbound data transfer (egress) is billed.',
        docsUrl:
          'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/overview-cost-management',
        docsLabel: 'MS Learn: Cost Management',
      },
      {
        id: 'w4-monitor-service-health',
        name: 'Azure Monitor, Log Analytics & Azure Service Health',
        category: 'Monitoring (Path 3)',
        moduleId: 11,
        moduleTitle: 'Describe Monitoring Tools in Azure',
        focusSummary:
          'Azure Monitor collects metrics and logs; Application Insights tracks APM; Azure Service Health provides personalized outage alerts.',
        examCue:
          'Azure Status = global view; Service Health = personalized view of YOUR subscriptions & regions; Resource Health = single resource.',
        docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
        docsLabel: 'MS Learn: Azure Monitor',
      },
    ],
  },
];

const ROADMAP_PROGRESS_STORAGE_KEY = 'az900_weekly_roadmap_progress_v1';

interface WeeklyLearningRoadmapProps {
  onSelectModule?: (moduleId: number) => void;
  onFilterByServiceTerm?: (serviceTerm: string) => void;
}

export const WeeklyLearningRoadmap: React.FC<WeeklyLearningRoadmapProps> = ({
  onSelectModule,
  onFilterByServiceTerm,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [completedServiceIds, setCompletedServiceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ROADMAP_PROGRESS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['w1-availability-zones', 'w1-shared-responsibility'];
  });
  const [copiedWeekShare, setCopiedWeekShare] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        ROADMAP_PROGRESS_STORAGE_KEY,
        JSON.stringify(completedServiceIds)
      );
    } catch (e) {
      console.error(e);
    }
  }, [completedServiceIds]);

  const toggleServiceCompletion = (id: string) => {
    setCompletedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentWeekData =
    HARAMBEE_WEEKLY_ROADMAP.find((w) => w.weekNumber === selectedWeek) ||
    HARAMBEE_WEEKLY_ROADMAP[0];

  const totalServicesCount = HARAMBEE_WEEKLY_ROADMAP.length * 3;
  const userCompletedCount = completedServiceIds.length;
  const overallProgressPercent = Math.round(
    (userCompletedCount / totalServicesCount) * 100
  );

  const weekCompletedCount = currentWeekData.topServices.filter((s) =>
    completedServiceIds.includes(s.id)
  ).length;

  // WhatsApp Community Share message for the selected week
  const weekWhatsappMessage = `🌍 *Harambee AZ-900 Weekly Learning Roadmap — Week ${currentWeekData.weekNumber}*\n\n✨ *Theme:* ${currentWeekData.englishTheme}\n🗣️ *Wisdom:* ${currentWeekData.proverbQuote}\n\n🔥 *Top 3 Priority Azure Services This Week:*\n1️⃣ ${currentWeekData.topServices[0].name} (${currentWeekData.topServices[0].docsUrl})\n2️⃣ ${currentWeekData.topServices[1].name} (${currentWeekData.topServices[1].docsUrl})\n3️⃣ ${currentWeekData.topServices[2].name} (${currentWeekData.topServices[2].docsUrl})\n\n📊 *My Progress:* ${weekCompletedCount}/3 Services Mastered this week (${overallProgressPercent}% overall). Join our Harambee cohort!`;

  const weekWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(weekWhatsappMessage)}`;

  const handleCopyWeekLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(weekWhatsappUrl);
      setCopiedWeekShare(true);
      setTimeout(() => setCopiedWeekShare(false), 2200);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 card-elevation overflow-hidden shadow-xs">
      {/* Top Harambee Kitenge Accent Ribbon */}
      <KitengeRibbon height={5} />

      {/* Header Banner */}
      <div className="px-6 py-5 bg-gradient-to-r from-[#00345d] via-[#005a9e] to-amber-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 shrink-0 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                Harambee Cohort Progression
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-sky-100 border border-white/20 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-300" />
                <span>{currentWeekData.communityLearnersCount} Active Peers in Week {currentWeekData.weekNumber}</span>
              </span>
            </div>
            <h3 className="font-black text-lg sm:text-xl tracking-tight text-white mt-1">
              Weekly Learning Roadmap • Top 3 Azure Services per Week
            </h3>
            <p className="text-xs text-sky-100/90 mt-0.5">
              Pull together with the community by mastering 3 high-yield Azure services each week with direct Microsoft Learn documentation
            </p>
          </div>
        </div>

        {/* Overall Roadmap Mastery Progress */}
        <div className="bg-slate-950/35 border border-white/15 rounded-xl px-4 py-3 shrink-0 flex items-center gap-4">
          <div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-200">Your 4-Week Mastery</span>
              <span className="font-black text-white">
                {userCompletedCount}/{totalServicesCount} Services ({overallProgressPercent}%)
              </span>
            </div>
            <div className="w-44 bg-white/15 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>
          <MaasaiMedallion size={30} className=" shrink-0" />
        </div>
      </div>

      {/* Week Selector Tabs */}
      <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {HARAMBEE_WEEKLY_ROADMAP.map((week) => {
            const isSelected = week.weekNumber === selectedWeek;
            const doneInWeek = week.topServices.filter((s) =>
              completedServiceIds.includes(s.id)
            ).length;
            const isWeekComplete = doneInWeek === 3;

            return (
              <button
                key={week.weekNumber}
                type="button"
                onClick={() => setSelectedWeek(week.weekNumber)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0078D4] text-white shadow-xs ring-2 ring-[#0078D4]/25'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                }`}
              >
                <span>Week {week.weekNumber}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isWeekComplete
                      ? isSelected
                        ? 'bg-emerald-300 text-slate-950'
                        : 'bg-emerald-100 text-emerald-800'
                      : isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {doneInWeek}/3
                </span>
              </button>
            );
          })}
        </div>

        {/* Share Week Roadmap on WhatsApp */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWeekLink}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy WhatsApp-compatible share link for this week's Top 3 services"
          >
            {copiedWeekShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied Week Link!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Copy Week Link</span>
              </>
            )}
          </button>

          <a
            href={weekWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Share Week {currentWeekData.weekNumber}</span>
          </a>
        </div>
      </div>

      {/* Selected Week Banner & Community Pulse */}
      <div className="p-6 space-y-5">
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-blue-50/50 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-md">
                {currentWeekData.swahiliTitle}
              </span>
              <span className="text-xs font-bold text-[#0078D4]">
                • Top 3 Priority Services
              </span>
            </div>
            <h4 className="font-black text-base sm:text-lg text-slate-900">
              {currentWeekData.englishTheme}
            </h4>
            <p className="text-xs text-slate-600 italic">
              {currentWeekData.proverbQuote}
            </p>
          </div>

          {/* Community Cohort Progress Pill */}
          <div className="p-3 rounded-xl bg-white border border-amber-200/90 shrink-0 space-y-1.5 min-w-[220px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Harambee Cohort Pace:</span>
              </span>
              <span className="font-black text-emerald-700">
                {currentWeekData.cohortCompletionRate}% Completed
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${currentWeekData.cohortCompletionRate}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block">
              {weekCompletedCount === 3
                ? '🎉 You completed all 3 priority services for this week!'
                : `Check off all 3 services below to match this week's cohort milestone`}
            </span>
          </div>
        </div>

        {/* Curated Top 3 Azure Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {currentWeekData.topServices.map((service, idx) => {
            const isCompleted = completedServiceIds.includes(service.id);

            return (
              <div
                key={service.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-[#0078D4] hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0078D4] border border-blue-200">
                      #{idx + 1} • {service.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleServiceCompletion(service.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Mastered' : 'Mark Studied'}</span>
                    </button>
                  </div>

                  {/* Service Name */}
                  <h5 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                    {service.name}
                  </h5>

                  {/* Architectural Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {service.focusSummary}
                  </p>

                  {/* High-Yield Exam Cue Box */}
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      🎯 High-Yield Exam Anchor:
                    </span>
                    <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
                      {service.examCue}
                    </p>
                  </div>
                </div>

                {/* Action Footer: Official MS Learn Docs Link + Practice Drill */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={service.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0078D4] border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{service.docsLabel}</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  {onSelectModule && (
                    <button
                      type="button"
                      onClick={() => onSelectModule(service.moduleId)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Practice Module ${service.moduleId}: ${service.moduleTitle}`}
                    >
                      <span>Drill Module {service.moduleId}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
