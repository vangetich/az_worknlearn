import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  Copy,
  Check,
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  X,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { ChatMessage, Question } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface KnowledgeAssistantProps {
  initialQuestionContext?: Question | null;
  onClearContext?: () => void;
}

interface OfficialAzureDocEntry {
  id: string;
  title: string;
  service: string;
  learningPath: 'Path 1: Cloud Concepts' | 'Path 2: Architecture & Services' | 'Path 3: Management & Governance';
  moduleId: number;
  url: string;
  keywords: string[];
  groundedSummary: string;
  examRule: string;
}

// Curated index of official Microsoft Azure documentation for instant grounded cross-referencing
const OFFICIAL_MICROSOFT_DOCS_INDEX: OfficialAzureDocEntry[] = [
  {
    id: 'doc-shared-resp',
    title: 'Shared Responsibility in the Cloud',
    service: 'Cloud Security & Models',
    learningPath: 'Path 1: Cloud Concepts',
    moduleId: 1,
    url: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility',
    keywords: ['shared responsibility', 'iaas', 'paas', 'saas', 'data', 'endpoints', 'accounts', 'identity', 'patching'],
    groundedSummary:
      'Official Microsoft documentation states that regardless of deployment type (IaaS, PaaS, SaaS), the customer always retains sole responsibility for information and data, client devices (endpoints), and accounts and identities. Physical datacenter security is always Microsoft’s responsibility.',
    examRule: 'Data, Devices, and Accounts/Identities are 100% customer responsibility in every cloud service model.',
  },
  {
    id: 'doc-capex-opex',
    title: 'Capital Expenditure (CapEx) vs. Operational Expenditure (OpEx)',
    service: 'Cloud Economics & Billing',
    learningPath: 'Path 1: Cloud Concepts',
    moduleId: 3,
    url: 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/4-describe-consumption-based-model',
    keywords: ['capex', 'opex', 'consumption', 'capital expenditure', 'operational expenditure', 'pay-as-you-go', 'upfront'],
    groundedSummary:
      'CapEx is the upfront spending of money on physical infrastructure, which is deducted over time via depreciation. OpEx is spending money on services or products now and being billed for them now (pay-as-you-go consumption model) with no upfront cost.',
    examRule: 'Cloud computing shifts IT budgets from CapEx (upfront hardware) to OpEx (consumption-based pay-as-you-go).',
  },
  {
    id: 'doc-az-regions',
    title: 'Azure Regions, Availability Zones, and Region Pairs',
    service: 'Azure Global Infrastructure',
    learningPath: 'Path 2: Architecture & Services',
    moduleId: 4,
    url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
    keywords: ['availability zones', 'region pairs', 'datacenter', 'high availability', 'disaster recovery', 'sovereign', 'latency'],
    groundedSummary:
      'Availability Zones are physically separate datacenters within a single Azure region, each with independent power, cooling, and networking. Region Pairs consist of two regions within the same geography separated by at least 300 miles for disaster recovery.',
    examRule: 'Single datacenter failure protection = Availability Zones. Large-scale regional outage protection = Region Pairs.',
  },
  {
    id: 'doc-expressroute-vpn',
    title: 'Azure ExpressRoute vs. Azure VPN Gateway',
    service: 'Azure Hybrid Networking',
    learningPath: 'Path 2: Architecture & Services',
    moduleId: 5,
    url: 'https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction',
    keywords: ['expressroute', 'vpn gateway', 'hybrid', 'private connection', 'fiber', 'ipsec', 'peering', 'vnet'],
    groundedSummary:
      'ExpressRoute lets you extend your on-premises networks into the Microsoft cloud over a private connection facilitated by a connectivity provider, bypassing the public internet. VPN Gateway sends encrypted traffic between an Azure VNet and an on-premises location over the public internet.',
    examRule: 'Private dedicated connection bypassing public internet = ExpressRoute. Encrypted tunnel over public internet = VPN Gateway.',
  },
  {
    id: 'doc-blob-tiers',
    title: 'Access Tiers for Blob Data (Hot, Cool, Cold, Archive)',
    service: 'Azure Blob Storage',
    learningPath: 'Path 2: Architecture & Services',
    moduleId: 6,
    url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview',
    keywords: ['blob', 'storage tiers', 'hot', 'cool', 'cold', 'archive', 'retention', 'rehydrate', 'lrs', 'zrs', 'grs', 'gzrs'],
    groundedSummary:
      'Hot tier is optimized for frequent access. Cool tier is for data stored at least 30 days. Cold tier is for data stored at least 90 days. Archive tier is an offline tier for data stored at least 180 days with the lowest storage cost and multi-hour retrieval latency.',
    examRule: '30 days = Cool, 90 days = Cold, 180+ days offline & lowest storage cost = Archive.',
  },
  {
    id: 'doc-storage-redundancy',
    title: 'Azure Storage Redundancy (LRS, ZRS, GRS, GZRS)',
    service: 'Azure Storage Redundancy',
    learningPath: 'Path 2: Architecture & Services',
    moduleId: 6,
    url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy',
    keywords: ['redundancy', 'lrs', 'zrs', 'grs', 'gzrs', 'ra-grs', 'durability', 'copies', 'storage'],
    groundedSummary:
      'LRS replicates data 3 times within a single datacenter. ZRS replicates data synchronously across 3 Azure Availability Zones in the primary region. GRS copies data synchronously 3 times in the primary region (LRS) and asynchronously 3 times to a secondary region (6 copies total).',
    examRule: 'LRS = 1 datacenter (3 copies); ZRS = 3 zones in 1 region; GRS = 2 regions (6 total copies).',
  },
  {
    id: 'doc-entra-conditional-access',
    title: 'Microsoft Entra ID, Conditional Access & Zero Trust',
    service: 'Microsoft Entra ID',
    learningPath: 'Path 2: Architecture & Services',
    moduleId: 7,
    url: 'https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview',
    keywords: ['entra id', 'active directory', 'conditional access', 'mfa', 'sso', 'zero trust', 'pim', 'rbac', 'authentication'],
    groundedSummary:
      'Microsoft Entra ID is a cloud-based identity and access management service. Conditional Access brings signals together (user, location, device, risk) to make decisions and enforce organizational policies such as requiring Multi-Factor Authentication (MFA).',
    examRule: 'Evaluate user/location/device signals to dynamically require MFA or block access = Conditional Access.',
  },
  {
    id: 'doc-tco-pricing',
    title: 'Azure Pricing Calculator vs. Total Cost of Ownership (TCO) Calculator',
    service: 'Azure Cost Management',
    learningPath: 'Path 3: Management & Governance',
    moduleId: 8,
    url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/pricing-overview',
    keywords: ['tco calculator', 'pricing calculator', 'cost management', 'budgets', 'tags', 'reservations', 'spot vm', 'sla'],
    groundedSummary:
      'The Pricing Calculator estimates the hourly or monthly cost of provisioning specific Azure resources. The Total Cost of Ownership (TCO) Calculator estimates the cost savings of migrating on-premises datacenter workloads to Microsoft Azure.',
    examRule: 'Estimate specific cloud resource bill = Pricing Calculator. Compare On-Premises vs. Azure migration savings = TCO Calculator.',
  },
  {
    id: 'doc-policy-rbac-locks',
    title: 'Azure Policy, Initiatives, RBAC, and Resource Locks',
    service: 'Azure Governance',
    learningPath: 'Path 3: Management & Governance',
    moduleId: 9,
    url: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
    keywords: ['azure policy', 'rbac', 'resource locks', 'cannotdelete', 'readonly', 'initiative', 'blueprint', 'purview', 'governance'],
    groundedSummary:
      'Azure Policy evaluates resources in Azure by comparing the properties of those resources to business rules (JSON definitions). RBAC manages who has access to Azure resources. Resource Locks (CanNotDelete or ReadOnly) prevent accidental deletion or modification even by Owners.',
    examRule: 'Enforce allowed SKUs/regions on resources = Azure Policy. Control user permissions = RBAC. Prevent deletion = CanNotDelete Lock.',
  },
  {
    id: 'doc-azure-arc-arm',
    title: 'Azure Arc, ARM Templates, and Bicep Infrastructure as Code',
    service: 'Azure Resource Manager & Arc',
    learningPath: 'Path 3: Management & Governance',
    moduleId: 10,
    url: 'https://learn.microsoft.com/en-us/azure/azure-arc/overview',
    keywords: ['azure arc', 'arm templates', 'bicep', 'cloud shell', 'infrastructure as code', 'hybrid', 'multi-cloud', 'resource manager'],
    groundedSummary:
      'Azure Arc simplifies governance and management by delivering a consistent multi-cloud and on-premises management platform through Azure Resource Manager. ARM templates and Bicep provide declarative Infrastructure as Code (IaC) for repeatable deployments.',
    examRule: 'Project on-premises/multi-cloud servers into Azure Resource Manager & Policy = Azure Arc. Declarative native IaC = ARM / Bicep.',
  },
  {
    id: 'doc-advisor-monitor-health',
    title: 'Azure Advisor, Azure Monitor, Log Analytics & Service Health',
    service: 'Monitoring & Observability',
    learningPath: 'Path 3: Management & Governance',
    moduleId: 11,
    url: 'https://learn.microsoft.com/en-us/azure/advisor/advisor-overview',
    keywords: ['azure advisor', 'azure monitor', 'service health', 'application insights', 'log analytics', 'alerts', 'recommendations'],
    groundedSummary:
      'Azure Advisor analyzes your resource configuration and usage telemetry to offer personalized, actionable recommendations across Reliability, Security, Performance, Cost, and Operational Excellence. Azure Service Health provides personalized alerts and guidance when Azure service issues affect you.',
    examRule: 'Proactive best-practice recommendations (Cost/Security/Reliability) = Azure Advisor. Personalized Azure outage impact = Service Health.',
  },
];

const QUICK_QUESTIONS = [
  'What is the difference between Azure Policy and Azure RBAC?',
  'When should I choose Azure App Service vs Azure Virtual Machines?',
  'Explain Storage Access Tiers: Hot vs Cool vs Cold vs Archive',
  'What is the difference between Availability Zones and Region Pairs?',
  'How does CapEx differ from OpEx on the AZ-900 exam?',
  'Explain the Shared Responsibility Model with a simple analogy',
  'What is the difference between Azure VPN Gateway and ExpressRoute?',
];

export const KnowledgeAssistant: React.FC<KnowledgeAssistantProps> = ({
  initialQuestionContext,
  onClearContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Karibu! Welcome to your AZ-900 Knowledge Assistant 🇰🇪 ☁️

I am your dedicated Microsoft Azure tutor, grounded in official **Microsoft Learn documentation**.
- Use the **Official Microsoft Azure Documentation Search Bar** above to cross-reference any service or exam concept with ` + '`learn.microsoft.com`' + `
- Clarify tricky architectural scenarios (e.g., *PaaS vs. IaaS*, *ZRS vs. GRS*, *Azure Policy vs. RBAC*)
- Break down any question you got stuck on!

What concept would you like to master today?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [docsSearchQuery, setDocsSearchQuery] = useState<string>('');
  const [selectedDocEntry, setSelectedDocEntry] = useState<OfficialAzureDocEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Cross-reference user query in the Microsoft Azure Documentation search bar
  const matchedDocs = useMemo(() => {
    const q = docsSearchQuery.trim().toLowerCase();
    if (!q) return OFFICIAL_MICROSOFT_DOCS_INDEX.slice(0, 4);
    return OFFICIAL_MICROSOFT_DOCS_INDEX.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.service.toLowerCase().includes(q) ||
        doc.groundedSummary.toLowerCase().includes(q) ||
        doc.examRule.toLowerCase().includes(q) ||
        doc.keywords.some((kw) => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase()))
    );
  }, [docsSearchQuery]);

  // Helper to find relevant official docs for any query
  const findGroundedDocsForQuery = (queryText: string): OfficialAzureDocEntry[] => {
    const q = queryText.toLowerCase();
    const hits = OFFICIAL_MICROSOFT_DOCS_INDEX.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.service.toLowerCase().includes(q) ||
        doc.keywords.some((kw) => q.includes(kw.toLowerCase()))
    );
    return hits.length > 0 ? hits.slice(0, 2) : [OFFICIAL_MICROSOFT_DOCS_INDEX[0]];
  };

  // Auto-fill context if candidate clicked "Ask AI Tutor" from a question card
  useEffect(() => {
    if (initialQuestionContext) {
      const prompt = `Can you explain the key concepts in this question from Module ${initialQuestionContext.moduleId} (${initialQuestionContext.moduleTitle}) and cross-reference it with official Microsoft Azure documentation?\n\nScenario: "${initialQuestionContext.scenario}"\nQuestion: "${initialQuestionContext.question}"\nWhy is ${initialQuestionContext.correctAnswer} correct, and how can I remember this pattern for the exam?`;
      handleSendMessage(prompt);
      if (onClearContext) onClearContext();
    }
  }, [initialQuestionContext]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string, groundedDocContext?: OfficialAzureDocEntry) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const matchedGroundedDocs = groundedDocContext
      ? [groundedDocContext]
      : findGroundedDocsForQuery(query);

    const groundingContextText = matchedGroundedDocs
      .map(
        (d) =>
          `[Official Microsoft Docs Reference: "${d.title}" (${d.url}) — Summary: ${d.groundedSummary} | Exam Rule: ${d.examRule}]`
      )
      .join('\n');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.content,
        }));

      const res = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${query}\n\nPlease cross-reference and cite this official Microsoft Azure documentation context:\n${groundingContextText}`,
          history: history.slice(-6),
          currentContext: initialQuestionContext?.moduleTitle || groundedDocContext?.title,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to query assistant');
      }

      const data = await res.json();
      const citationFooter = `\n\n---\n📚 **Verified Microsoft Learn Citations:**\n${matchedGroundedDocs
        .map((d) => `- **${d.title}** (${d.service}): ${d.url}`)
        .join('\n')}`;

      const hasLearnUrl = (data.answer || '').includes('learn.microsoft.com');
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: hasLearnUrl ? data.answer : `${data.answer}${citationFooter}`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('API fetch issue, using Microsoft Docs grounded fallback:', err);
      const fallbackText = getCurriculumFallback(query, matchedGroundedDocs);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: fallbackText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrossReferenceSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = docsSearchQuery.trim();
    if (!q) return;
    const topMatch = matchedDocs[0];
    if (topMatch) {
      setSelectedDocEntry(topMatch);
    }
    handleSendMessage(
      `Cross-reference "${q}" with official Microsoft Azure documentation and explain the core AZ-900 exam concept, key differentiators, and official citations.`,
      topMatch
    );
  };

  const getCurriculumFallback = (qText: string, groundedDocs: OfficialAzureDocEntry[]): string => {
    const primaryDoc = groundedDocs[0] || OFFICIAL_MICROSOFT_DOCS_INDEX[0];
    const citationsList = groundedDocs
      .map((d) => `- **${d.title}** (${d.learningPath} · Module ${d.moduleId}): ${d.url}`)
      .join('\n');

    const q = qText.toLowerCase();
    if (q.includes('policy') || q.includes('rbac') || q.includes('lock')) {
      return `### 💡 Grounded Microsoft Learn Analysis: Azure Policy, RBAC & Resource Locks

- **Azure Policy**: Evaluates and enforces **resource properties and compliance guardrails** via JSON rules (e.g., allowed regions, required tags, allowed VM SKUs).
- **Azure RBAC (Role-Based Access Control)**: Controls **user authorization** (who can read, modify, or delete resources via Owner, Contributor, Reader roles).
- **Resource Locks**: Prevents accidental deletion (\`CanNotDelete\`) or modification (\`ReadOnly\`) even by Subscription Owners.

**💡 Exam Anchor Tip**: ${primaryDoc.examRule}

---
📚 **Official Microsoft Azure Documentation References:**
${citationsList}`;
    }

    return `### 💡 Grounded Microsoft Learn Analysis: ${primaryDoc.title}

**Official Microsoft Documentation Summary (${primaryDoc.service}):**
${primaryDoc.groundedSummary}

**💡 Exam Anchor Tip:**
${primaryDoc.examRule}

---
📚 **Official Microsoft Azure Documentation References:**
${citationsList}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation flex flex-col min-h-[780px] overflow-hidden">
      {/* Header */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#0078D4] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
            <Bot className="w-6 h-6 text-yellow-200" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2 flex-wrap">
              <span>AZ-900 Knowledge Assistant</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                Grounded in Microsoft Learn Docs
              </span>
            </h3>
            <p className="text-amber-100 text-xs">
              Cross-reference official Microsoft Azure documentation, analogies &amp; exam shortcuts
            </p>
          </div>
        </div>

        <MaasaiMedallion size={34} className="opacity-90" />
      </div>

      {/* DEDICATED OFFICIAL MICROSOFT AZURE DOCUMENTATION SEARCH BAR */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white px-4 sm:px-6 py-3.5 border-b border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-200">
              Official Microsoft Azure Documentation Search &amp; Grounding
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
              learn.microsoft.com
            </span>
          </div>
          <span className="text-[11px] text-slate-300">
            {matchedDocs.length} official reference{matchedDocs.length === 1 ? '' : 's'} matched
          </span>
        </div>

        <form onSubmit={handleCrossReferenceSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={docsSearchQuery}
              onChange={(e) => setDocsSearchQuery(e.target.value)}
              placeholder="Search Microsoft Azure Docs (e.g., 'ExpressRoute', 'Shared Responsibility', 'Archive Tier', 'Azure Arc', 'Locks')..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950/80 border border-slate-600 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
            {docsSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setDocsSearchQuery('');
                  setSelectedDocEntry(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                aria-label="Clear documentation search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!docsSearchQuery.trim() || isLoading}
            className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Cross-Reference &amp; Ask AI</span>
          </button>
        </form>

        {/* Matched Official Microsoft Learn Reference Chips / Cards */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {matchedDocs.map((doc) => {
            const isSelected = selectedDocEntry?.id === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() =>
                  setSelectedDocEntry(isSelected ? null : doc)
                }
                className={`px-3 py-1.5 rounded-lg border text-left transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-2xs'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <div>
                  <div className="text-[11px] font-extrabold leading-tight">{doc.title}</div>
                  <div className="text-[10px] text-sky-200/80">
                    Module {doc.moduleId} • {doc.service}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Grounded Reference Card when user selects or searches a Microsoft Learn topic */}
        {selectedDocEntry && (
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-sky-500/40 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-black text-[10px] uppercase">
                    {selectedDocEntry.learningPath} · Module {selectedDocEntry.moduleId}
                  </span>
                  <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Microsoft Learn Grounding
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white mt-1">
                  {selectedDocEntry.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDocEntry(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Close documentation card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-200 leading-relaxed">
              {selectedDocEntry.groundedSummary}
            </p>

            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200">
              <strong className="font-extrabold text-amber-300">💡 Exam Rule: </strong>
              {selectedDocEntry.examRule}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <a
                href={selectedDocEntry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 font-bold underline"
              >
                <span>Open Official Microsoft Learn Article</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    `Using official Microsoft Azure documentation for "${selectedDocEntry.title}", explain how it is tested on the AZ-900 exam and give me a realistic practice scenario.`,
                    selectedDocEntry
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ask AI Tutor with This Doc</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts Carousel */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Quick Prompts:
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[450px]">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isBot ? 'justify-start' : 'justify-end'
              }`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2410C] to-[#D97706] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative max-w-2xl rounded-xl p-4 sm:p-5 text-sm leading-relaxed ${
                  isBot
                    ? 'bg-slate-50 text-slate-800 border border-slate-200 shadow-xs'
                    : 'bg-[#0078D4] text-white rounded-br-none shadow-xs'
                }`}
              >
                {/* Copy Button for Bot answers */}
                {isBot && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold prose-strong:text-slate-950 prose-code:text-[#C2410C] prose-code:bg-orange-50 prose-code:px-1 prose-code:rounded whitespace-pre-line">
                  {msg.content}
                </div>
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-xs">
                  YOU
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2410C] to-[#D97706] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Loader2 className="w-4 h-4 text-[#D97706] animate-spin" />
              <span>Cross-referencing official Microsoft Azure documentation...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about AZ-900 (grounded in official Microsoft Learn documentation)..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-semibold text-sm flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
