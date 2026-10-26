import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Compass,
  Sparkles,
  Award,
  Briefcase,
  CheckCircle2,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Layers,
  Eye,
  EyeOff,
  Clock,
  Type,
} from 'lucide-react';
import { MaasaiMedallion } from './MotifDecorations';
import { AppTab } from './Header';
import {
  getStoredFontScalePercent,
  applyFontScalePercent,
  MIN_FONT_SCALE_PERCENT,
  MAX_FONT_SCALE_PERCENT,
  FONT_SCALE_STEP,
} from '../utils/fontSize';

export type HarambeeDisplayMode = 'auto-retract' | 'view' | 'hide';

interface HarambeeSuccessCompanionProps {
  selectedPathId: number | 'all';
  isExpanded: boolean;
  onToggleExpand: () => void;
  displayMode?: HarambeeDisplayMode;
  onChangeDisplayMode?: (mode: HarambeeDisplayMode) => void;
  autoRetractTrigger?: number;
  isModuleBrowserCollapsed: boolean;
  onToggleModuleBrowserCollapse: () => void;
  onNavigateTab: (tab: AppTab) => void;
  completedModulesCount: number;
  totalAnswered: number;
}

interface MotivationalQuote {
  proverb: string;
  translation: string;
  origin: string;
  examCoaching: string;
}

interface CareerPathInsight {
  id: string;
  pathId: 1 | 2 | 3 | 'all';
  roleTitle: string;
  trackBadge: string;
  salaryAndDemand: string;
  nextCerts: string[];
  coreServices: string[];
  randomFacts: string[];
}

const HARAMBEE_MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    proverb: 'Haba na haba hujaza kibaba.',
    translation: 'Little by little fills the measure.',
    origin: 'Swahili Wisdom • East Africa',
    examCoaching:
      'Mastering 3–5 Azure Glossary terms and 1 Study Deck unit every morning compounds into effortless 850+ exam-day recall.',
  },
  {
    proverb: 'Umoja ni nguvu, utengano ni udhaifu.',
    translation: 'Unity is strength, division is weakness.',
    origin: 'Harambee Philosophy • Kenya',
    examCoaching:
      'Connect Cloud Concepts (Path 1), Core Architecture (Path 2), and Governance (Path 3) into one unified mental blueprint rather than isolated facts.',
  },
  {
    proverb: 'Mwenda pole hajikwai.',
    translation: 'One who walks steadily does not stumble.',
    origin: 'Swahili Proverb',
    examCoaching:
      'Read the Scenario Context carefully for cost, SLA, and compliance keywords before choosing between IaaS, PaaS, and SaaS.',
  },
  {
    proverb: 'Elimu ni bahari, haina mwisho.',
    translation: 'Knowledge is an ocean without end.',
    origin: 'Coastal East African Wisdom',
    examCoaching:
      'Your AZ-900 study habit is more than a test prep routine—it builds the architectural foundation for AI, DevOps, and Cloud Security.',
  },
  {
    proverb: 'Kazi mbi si mchezo mwema.',
    translation: 'Dedicated effort always outperforms idle talent.',
    origin: 'Kenyan Heritage Proverb',
    examCoaching:
      'Reviewing why each distractor option is wrong eliminates architectural misconceptions permanently.',
  },
];

const AZ900_CERTIFICATION_ADVANTAGES = [
  {
    title: 'Lifetime Credential (Never Expires)',
    detail:
      'Unlike Associate or Expert certifications that require annual renewal, Microsoft Certified: Azure Fundamentals (AZ-900) is permanent for life on your official transcript.',
    badge: 'Permanent Badge',
  },
  {
    title: 'Universal Cloud & FinOps Vocabulary',
    detail:
      'Proves to employers and clients that you understand CapEx vs. OpEx, Shared Responsibility, High Availability SLAs, Zero Trust, and Azure Cost Management.',
    badge: 'Employer Trust',
  },
  {
    title: 'Fast-Track to Role-Based Certifications',
    detail:
      'Builds 45%+ of the conceptual foundation tested in AZ-104 (Admin), AZ-204 (Developer), AZ-305 (Solutions Architect), and AI-102 (AI Engineer).',
    badge: 'Career Launchpad',
  },
  {
    title: 'Cross-Functional Career Mobility',
    detail:
      'Unlocks Cloud Support, Solutions Engineering, FinOps Analyst, Technical Project Management, and Junior Cloud Architect roles globally.',
    badge: 'High ROI',
  },
];

const CAREER_PATH_INSIGHTS: Record<1 | 2 | 3 | 'all', CareerPathInsight> = {
  1: {
    id: 'finops-strategy',
    pathId: 1,
    roleTitle: 'Cloud Economics, FinOps & Strategy Advisor',
    trackBadge: 'Path 1 Career Track • Cloud Concepts (25–30%)',
    salaryAndDemand: 'High demand across enterprise digital transformation & FinOps teams',
    nextCerts: ['AZ-900', 'DP-900', 'AZ-305 (Solutions Architect)', 'FinOps Certified Practitioner'],
    coreServices: [
      'Azure Pricing Calculator',
      'TCO Calculator',
      'Shared Responsibility Matrix',
      'Consumption vs. Reserved Instances',
      'VM Scale Sets (Elasticity)',
    ],
    randomFacts: [
      'Organizations migrating from on-premises datacenters (CapEx) to Azure PaaS/Serverless (OpEx) routinely cut idle infrastructure waste by 30–45% when guided by a Cloud FinOps specialist.',
      'In Path 1 interviews, hiring managers frequently ask: "Which 3 layers does the customer ALWAYS remain responsible for?" Answer: Data, Endpoints, and Accounts/Identities!',
      'Understanding Horizontal Scaling (Scale Out) vs. Vertical Scaling (Scale Up) is the #1 architectural concept used when designing auto-scaling e-commerce and mobile money platforms.',
      'Multi-cloud and Hybrid Cloud strategists use Path 1 principles to decide which legacy workloads stay on-premises via Azure Arc and which move to public cloud.',
      'High Availability (SLA uptime) and Disaster Recovery (Region Pairs) are distinct: knowing how they differ sets apart true Cloud Strategists from beginners.',
    ],
  },
  2: {
    id: 'cloud-architect',
    pathId: 2,
    roleTitle: 'Azure Cloud Infrastructure & Solutions Architect',
    trackBadge: 'Path 2 Career Track • Architecture & Services (35–40%)',
    salaryAndDemand: 'Top-tier technical track • Core backbone of cloud engineering teams',
    nextCerts: ['AZ-900', 'AZ-104 (Administrator)', 'AZ-204 (Developer)', 'AZ-305 (Architect Expert)'],
    coreServices: [
      'Azure Virtual Networks & ExpressRoute',
      'Azure Kubernetes Service (AKS)',
      'Azure Functions & App Service',
      'Blob Storage Tiers (Hot/Cool/Cold/Archive)',
      'Availability Zones & Region Pairs',
    ],
    randomFacts: [
      'Path 2 represents the largest weight on the AZ-900 exam (35–40%) and directly mirrors the day-to-day architecture decisions made by Azure Solutions Architects.',
      'Architects designing mission-critical fintech or healthcare workloads combine Availability Zones (99.99% VM SLA within 1 region) with GRS/GZRS storage across Region Pairs.',
      'Knowing when to choose ExpressRoute (dedicated private fiber bypassing the public internet) over a Site-to-Site VPN Gateway (IPsec over public internet) is a classic Solutions Architect interview scenario.',
      'Serverless architectures using Azure Functions and Logic Apps allow startups and enterprises to process millions of events while paying $0 when no requests are running.',
      'Moving rarely accessed compliance logs from the Hot tier to the Archive tier (180+ days) reduces storage costs by up to 90%—as long as your team accounts for rehydration latency.',
    ],
  },
  3: {
    id: 'cloud-governance-security',
    pathId: 3,
    roleTitle: 'Cloud Governance, DevSecOps & Compliance Engineer',
    trackBadge: 'Path 3 Career Track • Management & Governance (30–35%)',
    salaryAndDemand: 'Rapidly growing security, compliance & platform engineering specialty',
    nextCerts: ['AZ-900', 'SC-900', 'AZ-500 (Security Engineer)', 'AZ-400 (DevOps Engineer)'],
    coreServices: [
      'Azure Policy & Initiatives',
      'Resource Locks (CanNotDelete / ReadOnly)',
      'ARM Templates & Azure Bicep (IaC)',
      'Azure Arc & Microsoft Purview',
      'Azure Monitor, Service Health & Advisor',
    ],
    randomFacts: [
      'Even a user with the Owner RBAC role cannot delete a critical production database if a CanNotDelete Resource Lock is applied—they must explicitly remove the lock first!',
      'Platform Engineers use Azure Policy to enforce automated guardrails (e.g., "Only allow resources in East Africa / Europe regions" or "Require CostCenter tags") across hundreds of subscriptions.',
      'Azure Bicep and ARM Templates enable Infrastructure as Code (IaC), ensuring dev, staging, and production environments are deployed identically with zero manual drift.',
      'Azure Arc lets Cloud Governance Engineers apply Azure Policy, Defender for Cloud, and tags to Linux/Windows servers running on-premises or in AWS/GCP from a single control plane.',
      'Distinguishing Azure Monitor (metrics/logs telemetry), Azure Service Health (Microsoft platform outage alerts), and Azure Advisor (proactive cost/security recommendations) is essential on exam day.',
    ],
  },
  all: {
    id: 'full-stack-cloud',
    pathId: 'all',
    roleTitle: 'Full-Spectrum Azure Cloud & AI Practitioner',
    trackBadge: 'All 3 AZ-900 Domains • Complete Cloud Career Readiness',
    salaryAndDemand: 'Versatile cloud foundation across Engineering, AI, Security & Product roles',
    nextCerts: ['AZ-900', 'AZ-104 (Cloud Admin)', 'AI-900 / AI-102 (Azure AI)', 'AZ-305 (Solutions Architect)'],
    coreServices: [
      'Microsoft Entra ID & Zero Trust',
      'Azure Compute, Networking & Storage',
      'Azure Policy, RBAC & Resource Locks',
      'Azure Cost Management & Pricing',
      'Azure Arc & Bicep Automation',
    ],
    randomFacts: [
      'Over 95% of Fortune 500 enterprises and leading African tech hubs ("Silicon Savannah" fintechs, telcos, and banks) run production workloads on Microsoft Azure and Entra ID.',
      'Candidates who score 800+ on AZ-900 master the "Big 3 Contrasts": IaaS vs. PaaS vs. SaaS, Authentication (Entra MFA) vs. Authorization (RBAC), and RBAC (who can act) vs. Policy (what resources are allowed).',
      'Combining AZ-900 with hands-on Bicep/CLI practice and AI fundamentals positions you for hybrid Cloud + AI Solutions Engineering roles.',
      'Consistent daily reading of 10–15 minutes activates spaced-repetition memory, making complex scenario distractors easy to spot in under 35 seconds per question.',
      'You can select Path 1, Path 2, or Path 3 in the Session Learning Path Focus panel on the right to tailor these career insights to a specific cloud specialization!',
    ],
  },
};

export const HarambeeSuccessCompanion: React.FC<HarambeeSuccessCompanionProps> = ({
  selectedPathId,
  isExpanded,
  onToggleExpand,
  displayMode: controlledDisplayMode,
  onChangeDisplayMode,
  autoRetractTrigger = 0,
  isModuleBrowserCollapsed,
  onToggleModuleBrowserCollapse,
  onNavigateTab,
  completedModulesCount,
  totalAnswered,
}) => {
  // Default mode is 'auto-retract' as requested
  const [internalMode, setInternalMode] = useState<HarambeeDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('az900_harambee_display_mode_v2');
      if (saved === 'auto-retract' || saved === 'view' || saved === 'hide') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'auto-retract';
  });

  const activeMode = controlledDisplayMode ?? internalMode;

  // When in 'auto-retract' mode, starts retracted (false) by default, and can be temporarily peeked/expanded
  const [isAutoPeekOpen, setIsAutoPeekOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [factIndex, setFactIndex] = useState<number>(0);
  const [selectedCareerOverride, setSelectedCareerOverride] = useState<1 | 2 | 3 | 'all' | null>(
    null
  );
  const [showAllAdvantages, setShowAllAdvantages] = useState<boolean>(true);
  const [fontScalePercent, setFontScalePercent] = useState<number>(getStoredFontScalePercent);

  // Sync with global application-wide font size changes
  useEffect(() => {
    const handleFontSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ percent?: number }>;
      if (typeof customEvent.detail?.percent === 'number') {
        setFontScalePercent(customEvent.detail.percent);
      } else {
        setFontScalePercent(getStoredFontScalePercent());
      }
    };
    window.addEventListener('az900-font-size-changed', handleFontSync);
    return () => window.removeEventListener('az900-font-size-changed', handleFontSync);
  }, []);

  const handleSetMode = (nextMode: HarambeeDisplayMode) => {
    if (onChangeDisplayMode) {
      onChangeDisplayMode(nextMode);
    } else {
      setInternalMode(nextMode);
      try {
        localStorage.setItem('az900_harambee_display_mode_v2', nextMode);
      } catch {
        // ignore
      }
    }

    if (nextMode === 'auto-retract') {
      setIsAutoPeekOpen(false);
      if (isExpanded) onToggleExpand();
    } else if (nextMode === 'view') {
      setIsAutoPeekOpen(true);
      if (!isExpanded) onToggleExpand();
    } else if (nextMode === 'hide') {
      setIsAutoPeekOpen(false);
    }
  };

  // Automatically retract when user answers/navigates questions while in 'auto-retract' mode
  useEffect(() => {
    if (activeMode === 'auto-retract' && isAutoPeekOpen) {
      setIsAutoPeekOpen(false);
    }
  }, [autoRetractTrigger, selectedPathId]);

  // Also auto-retract after 25 seconds of idle reading when in 'auto-retract' mode and not hovered
  useEffect(() => {
    if (activeMode !== 'auto-retract' || !isAutoPeekOpen || isHovered) return;
    const timer = setTimeout(() => {
      setIsAutoPeekOpen(false);
    }, 25000);
    return () => clearTimeout(timer);
  }, [activeMode, isAutoPeekOpen, isHovered]);

  // Sync career path insight automatically when selectedPathId changes
  useEffect(() => {
    setSelectedCareerOverride(null);
    setFactIndex(0);
  }, [selectedPathId]);

  const normalizedSelectedPath: 1 | 2 | 3 | 'all' =
    selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3 ? selectedPathId : 'all';

  const effectiveCareerKey: 1 | 2 | 3 | 'all' =
    selectedCareerOverride !== null ? selectedCareerOverride : normalizedSelectedPath;

  const activeCareer = useMemo(
    () => CAREER_PATH_INSIGHTS[effectiveCareerKey] || CAREER_PATH_INSIGHTS.all,
    [effectiveCareerKey]
  );

  const activeQuote = HARAMBEE_MOTIVATIONAL_QUOTES[quoteIndex % HARAMBEE_MOTIVATIONAL_QUOTES.length];
  const activeRandomFact =
    activeCareer.randomFacts[factIndex % activeCareer.randomFacts.length] ||
    activeCareer.randomFacts[0];

  const handleShuffleInsight = () => {
    setQuoteIndex((prev) => (prev + 1) % HARAMBEE_MOTIVATIONAL_QUOTES.length);
    setFactIndex((prev) => (prev + 1) % activeCareer.randomFacts.length);
  };

  const handleShuffleCareerFactOnly = () => {
    setFactIndex((prev) => (prev + 1) % activeCareer.randomFacts.length);
  };

  const handleAdjustFont = (nextPercent: number) => {
    const applied = applyFontScalePercent(nextPercent);
    setFontScalePercent(applied);
  };

  // Determine whether the detailed body is currently shown
  const isCurrentlyShowingFullBody =
    activeMode === 'view' || (activeMode === 'auto-retract' && isAutoPeekOpen);

  // If mode is 'hide', render a sleek, minimal 1-line restore bar so the user can unhide or switch to Auto-Retract / View anytime
  if (activeMode === 'hide') {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/95 border border-amber-300/80 px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2 transition-all duration-200">
        <div className="flex items-center gap-2 min-w-0">
          <MaasaiMedallion size={18} className="shrink-0" />
          <span className="text-xs font-extrabold text-amber-950 truncate">
            Harambee • Consistent Reading &amp; Exam Success
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            Hidden
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleSetMode('auto-retract')}
            className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
            title="Restore to Auto-Retract mode (Default)"
          >
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Auto-Retract</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetMode('view')}
            className="px-2 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
            title="Set to Always View (Expanded)"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/95 via-orange-50/80 to-sky-50/95 border border-amber-300/90 shadow-xs transition-all duration-300 ease-in-out flex flex-col justify-between ${
        isCurrentlyShowingFullBody ? 'p-4 sm:p-5 lg:flex-1' : 'p-3.5'
      }`}
    >
      {/* Top Decorative Kenyan / Azure Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F172A] via-[#BB0000] to-[#006600] opacity-85" />

      <div className="space-y-3">
        {/* Header Bar with Mode Switcher (Auto-Retract Default | View | Hide) & Accessibility Font Controls */}
        <div className="flex flex-col gap-2 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <MaasaiMedallion size={26} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-950">
                    Harambee • Consistent Reading &amp; Exam Success
                  </h4>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-[#006600] border border-emerald-300">
                    {activeMode === 'auto-retract' ? 'Auto-Retract (Default)' : 'Pinned View'}
                  </span>
                </div>
                <p className="text-xs text-amber-950/90 mt-0.5 italic font-semibold leading-snug">
                  &ldquo;{activeQuote.proverb}&rdquo; — {activeQuote.translation}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShuffleInsight}
              className="p-1.5 rounded-xl bg-white/90 hover:bg-amber-100 text-amber-900 border border-amber-300/90 shadow-2xs transition-all cursor-pointer shrink-0"
              title="Shuffle motivational proverb & random career path insight"
              aria-label="Shuffle motivational proverb and career insight"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0078D4]" />
            </button>
          </div>

          {/* Unified Control Bar: Mode Selector (Auto-Retract | View | Hide) + Font Size Accessibility Adjuster (Beyond +15%) */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-amber-200/60">
            {/* Segmented Mode Control: Auto-Retract (Default) | View | Hide */}
            <div
              className="inline-flex items-center p-0.5 rounded-xl bg-white/90 border border-amber-300/80 shadow-2xs"
              role="group"
              aria-label="Harambee Companion Display Mode"
            >
              <button
                type="button"
                onClick={() => handleSetMode('auto-retract')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  activeMode === 'auto-retract'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-700 hover:bg-amber-50'
                }`}
                title="Auto-Retract Mode (Default): Stays compact by default and automatically retracts when advancing questions"
              >
                <Clock className="w-3 h-3" />
                <span>Auto-Retract</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetMode('view')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  activeMode === 'view'
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
                title="Set to View: Keep AZ-900 advantages & career insights expanded"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetMode('hide')}
                className="px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                title="Set to Hide: Minimize Harambee box into a compact restore pill"
              >
                <EyeOff className="w-3 h-3" />
                <span>Hide</span>
              </button>
            </div>

            {/* Quick Accessibility Font Scale Adjuster (85% to 150%, beyond +15%) */}
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-white/90 border border-sky-200/90 text-[10px] font-extrabold text-slate-700 shadow-2xs"
              title="Increase or decrease application-wide font size beyond the 15% increment (85% – 150%)"
            >
              <Type className="w-3 h-3 text-[#0078D4] shrink-0" />
              <button
                type="button"
                onClick={() => handleAdjustFont(fontScalePercent - FONT_SCALE_STEP)}
                disabled={fontScalePercent <= MIN_FONT_SCALE_PERCENT}
                className="px-1 py-0.2 rounded hover:bg-slate-200 disabled:opacity-40 font-black text-slate-900 cursor-pointer"
                title="Decrease font size (-5%)"
              >
                A-
              </button>
              <span className="px-1 rounded bg-sky-50 text-[#0078D4] font-black tabular-nums">
                {fontScalePercent}%
              </span>
              <button
                type="button"
                onClick={() => handleAdjustFont(fontScalePercent + FONT_SCALE_STEP)}
                disabled={fontScalePercent >= MAX_FONT_SCALE_PERCENT}
                className="px-1 py-0.2 rounded hover:bg-slate-200 disabled:opacity-40 font-black text-slate-900 cursor-pointer"
                title="Increase font size (+5%) beyond 15%"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAdjustFont(fontScalePercent < 125 ? 125 : fontScalePercent < 135 ? 135 : 100)
                }
                className="px-1.5 py-0.2 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 font-black cursor-pointer"
                title="Cycle extended accessibility font size (+25% / +35% / 100%)"
              >
                {fontScalePercent < 125 ? '+25%' : fontScalePercent < 135 ? '+35%' : '100%'}
              </button>
            </div>
          </div>
        </div>

        {/* Retracted Compact Summary View (Default state when in 'auto-retract' mode) */}
        {!isCurrentlyShowingFullBody && (
          <div className="space-y-2 pt-1 border-t border-amber-200/70">
            <p className="text-[11px] text-slate-700 leading-relaxed">
              <strong>Daily Exam-Pass Habit:</strong> {activeQuote.examCoaching}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab('glossary')}
                  className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Read Glossary</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('study-decks')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <Compass className="w-3 h-3 text-[#0078D4]" />
                  <span>Study Decks</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoPeekOpen(true)}
                className="text-[11px] font-extrabold text-[#0078D4] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Peek Insights &amp; AZ-900 Advantages</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Expanded Rich View: Shown when Mode === 'view' OR when temporarily peeked in 'auto-retract' mode */}
        {isCurrentlyShowingFullBody && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {activeMode === 'auto-retract' && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-between gap-2 text-[10px] font-bold text-amber-950">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>Auto-Retract active: automatically retracts on next question</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetMode('view')}
                    className="underline font-black text-[#0078D4] cursor-pointer"
                  >
                    Pin to View
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setIsAutoPeekOpen(false)}
                    className="underline font-black text-amber-900 cursor-pointer"
                  >
                    Retract Now
                  </button>
                </div>
              </div>
            )}

            {/* 1. Motivational Daily Exam-Pass Coaching Card */}
            <div className="p-3 rounded-xl bg-white/90 border border-amber-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Daily Harambee Exam Mindset • {activeQuote.origin}</span>
                </span>
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {completedModulesCount}/12 Modules • {totalAnswered} Solved
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Consistent Reading Strategy:</strong>{' '}
                {activeQuote.examCoaching}
              </p>
            </div>

            {/* 2. Career Path Random Insight Box (Synced with Selected Learning Path) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-[#002B52] to-[#0F172A] text-white border border-sky-400/30 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                    Selected Career Path Spotlight
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleShuffleCareerFactOnly}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-300/30 text-[10px] font-extrabold transition-colors cursor-pointer"
                  title="Load another random career fact for this path"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Next Career Fact ({factIndex + 1}/{activeCareer.randomFacts.length})</span>
                </button>
              </div>

              {/* Career Track Selector Pills (Auto-follows Learning Path or allows manual inspection) */}
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'all', label: 'All Tracks' },
                    { id: 1, label: 'P1: FinOps & Strategy' },
                    { id: 2, label: 'P2: Cloud Architect' },
                    { id: 3, label: 'P3: Sec & Governance' },
                  ] as const
                ).map((tab) => {
                  const isActive = effectiveCareerKey === tab.id;
                  return (
                    <button
                      key={String(tab.id)}
                      type="button"
                      onClick={() => {
                        setSelectedCareerOverride(tab.id);
                        setFactIndex(0);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 shadow-2xs'
                          : 'bg-white/10 hover:bg-white/20 text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>{activeCareer.roleTitle}</span>
                </div>
                <div className="text-[10px] font-bold text-sky-300 mt-0.5">
                  {activeCareer.trackBadge} • {activeCareer.salaryAndDemand}
                </div>
              </div>

              {/* Dynamic / Random Career Insight Callout */}
              <div className="p-2.5 rounded-lg bg-white/10 border border-white/15 text-xs text-sky-50 leading-relaxed">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                  <Zap className="w-3 h-3" />
                  <span>Real-World Career Insight #{(factIndex % activeCareer.randomFacts.length) + 1}:</span>
                </span>
                {activeRandomFact}
              </div>

              {/* Core Services & Next Certification Ladder */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
                  Key Services &amp; Certification Progression:
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeCareer.coreServices.map((srv) => (
                    <span
                      key={srv}
                      className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-[10px] font-bold text-sky-100"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px] font-black text-amber-300">
                  <Award className="w-3 h-3 shrink-0" />
                  <span>Roadmap: {activeCareer.nextCerts.join(' → ')}</span>
                </div>
              </div>
            </div>

            {/* 3. Concrete Advantages of Having the AZ-900 Certification */}
            <div className="p-3 rounded-xl bg-white/95 border border-sky-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#005A9E]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Why Earn AZ-900? Certification Advantages</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllAdvantages((prev) => !prev)}
                  className="text-[10px] font-extrabold text-slate-600 hover:text-[#0078D4] flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{showAllAdvantages ? 'Compact' : 'Show All 4'}</span>
                  {showAllAdvantages ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {(showAllAdvantages
                  ? AZ900_CERTIFICATION_ADVANTAGES
                  : AZ900_CERTIFICATION_ADVANTAGES.slice(0, 2)
                ).map((adv) => (
                  <div
                    key={adv.title}
                    className="p-2.5 rounded-lg bg-slate-50/90 border border-slate-200/80 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{adv.title}</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-50 text-[#0078D4] border border-blue-200 shrink-0">
                        {adv.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                      {adv.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer: Quick Study Links + Desktop Workspace Space Fill Toggle */}
      {isCurrentlyShowingFullBody && (
        <div className="pt-3 mt-3 border-t border-amber-200/80 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigateTab('glossary')}
              className="px-2.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Read Glossary</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('study-decks')}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3 text-[#0078D4]" />
              <span>Study Decks</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('wisdom')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 fill-amber-200" />
              <span>Wisdom</span>
            </button>

            <button
              type="button"
              onClick={onToggleModuleBrowserCollapse}
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-[11px] ml-auto transition-colors cursor-pointer"
              title={
                isModuleBrowserCollapsed
                  ? 'Show Cloud Explorer Module List below this box'
                  : 'Collapse Cloud Explorer Module List so Harambee Success Box fills the full left column space beside Quick Switcher & Session Learning Path Focus'
              }
            >
              <Layers className="w-3 h-3" />
              <span>
                {isModuleBrowserCollapsed ? 'Show Module List' : 'Fill Full Left Space'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
