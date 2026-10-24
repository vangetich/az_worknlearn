import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Layers,
  Cloud,
  ShieldCheck,
  Target,
  Award,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LEARNING_PATHS } from '../data/curriculum';
import { Question, UserStats, QuestionAttempt } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

export interface WeakModuleSummary {
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  pathTitle: string;
  accuracy: number;
  correct: number;
  total: number;
  sessionWrong: number;
  keyTerms: string[];
}

interface PostSessionWeakAreaReviewProps {
  stats: UserStats;
  sessionAttempts: QuestionAttempt[];
  allQuestions: Question[];
  selectedPathId: number | 'all';
  onAnswerReviewQuestion: (questionId: string, selectedAnswer: string, isCorrect: boolean, generatedQuestion?: Question) => void;
  onAddGeneratedQuestionsToBank?: (questions: Question[]) => void;
  onSelectPathForPractice?: (pathId: 1 | 2 | 3 | 'all', moduleId?: number | 'all') => void;
  onStartPersonalizedReview?: () => void;
  unresolvedMistakesCount?: number;
  onClose: () => void;
}

// Rich module-specific AZ-900 remediation scenario templates so fresh questions are always authentic
const MODULE_REMEDIATION_TEMPLATES: Record<
  number,
  Array<{
    scenario: string;
    question: string;
    options: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    whyCorrect: string;
    distractorBreakdown: { letter: 'A' | 'B' | 'C' | 'D'; reason: string }[];
    examTip: string;
  }>
> = {
  1: [
    {
      scenario:
        'A financial services startup is migrating its core relational databases to Azure SQL Database (PaaS) while keeping legacy custom ERP virtual machines on Azure IaaS. The Chief Information Security Officer asks your team to clarify which security responsibilities remain strictly with the customer across all cloud service models.',
      question:
        'According to the Microsoft Azure Shared Responsibility Model, which layer is ALWAYS the sole responsibility of the customer regardless of whether the deployment is IaaS, PaaS, or SaaS?',
      options: [
        { letter: 'A', text: 'Information, data, client endpoints, and account/access management' },
        { letter: 'B', text: 'Operating system kernel patching and hypervisor isolation' },
        { letter: 'C', text: 'Physical datacenter biometric security and power redundancy' },
        { letter: 'D', text: 'Virtual network controller firmware and physical switch routing' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'In the Shared Responsibility Model, the customer is ALWAYS responsible for their information and data, client devices/endpoints, and identity/account access management across IaaS, PaaS, and SaaS.',
      distractorBreakdown: [
        { letter: 'B', reason: 'OS patching is Microsoft’s responsibility in PaaS and SaaS, and hypervisor hosts are always managed by Microsoft.' },
        { letter: 'C', reason: 'Physical datacenter security and power are 100% Microsoft’s responsibility in public cloud.' },
        { letter: 'D', reason: 'Physical network infrastructure and fabric controllers are managed by Microsoft.' },
      ],
      examTip: 'Exam Anchor: Data, Devices (Endpoints), and Accounts/Identities are ALWAYS 100% customer responsibility in every cloud model.',
    },
  ],
  2: [
    {
      scenario:
        'An e-commerce platform experiences a 900% traffic spike every Friday evening during flash sales. The engineering team configures Azure Virtual Machine Scale Sets to automatically add 12 instances when CPU exceeds 75% and remove them when demand drops below 30%.',
      question:
        'Which pair of cloud computing benefits is directly demonstrated by adding additional VM instances dynamically based on workload demand?',
      options: [
        { letter: 'A', text: 'Vertical Scaling (Scale Up) and Capital Expenditure (CapEx)' },
        { letter: 'B', text: 'Horizontal Scaling (Scale Out) and Elasticity' },
        { letter: 'C', text: 'Geo-Redundancy and Data Sovereignty' },
        { letter: 'D', text: 'Vertical Scaling (Scale Down) and Predictive Latency' },
      ],
      correctAnswer: 'B',
      whyCorrect:
        'Adding more instances in parallel is Horizontal Scaling (Scaling Out), and doing so automatically in response to changing workload demand is the exact definition of Elasticity.',
      distractorBreakdown: [
        { letter: 'A', reason: 'Vertical scaling changes VM RAM/CPU size on a single instance rather than adding more instances.' },
        { letter: 'C', reason: 'Geo-redundancy replicates data across regions for disaster recovery, not auto-scaling compute capacity.' },
        { letter: 'D', reason: 'Scaling down reduces single-VM resources rather than adding horizontal instances.' },
      ],
      examTip: 'Exam Anchor: Scale Up/Down = Vertical (more CPU/RAM). Scale Out/In = Horizontal (more VM instances). Automatic scaling = Elasticity.',
    },
  ],
  3: [
    {
      scenario:
        'A media company wants to eliminate upfront server hardware purchases and instead pay only for the exact number of seconds its video transcoding code executes when a user uploads a file.',
      question:
        'Which expenditure and pricing model combination does this serverless architecture represent?',
      options: [
        { letter: 'A', text: 'Capital Expenditure (CapEx) with dedicated 3-year physical host reservations' },
        { letter: 'B', text: 'Operational Expenditure (OpEx) with a consumption-based pricing model' },
        { letter: 'C', text: 'Capital Expenditure (CapEx) with fixed monthly depreciation' },
        { letter: 'D', text: 'On-premises sunk hardware cost with manual capacity provisioning' },
      ],
      correctAnswer: 'B',
      whyCorrect:
        'Paying as you go with zero upfront hardware investment is Operational Expenditure (OpEx), and billing strictly per execution second is consumption-based pricing.',
      distractorBreakdown: [
        { letter: 'A', reason: 'CapEx involves upfront capital investment in physical infrastructure.' },
        { letter: 'C', reason: 'Depreciation of owned physical assets is a characteristic of CapEx, not serverless cloud billing.' },
        { letter: 'D', reason: 'On-premises hardware purchases require upfront CapEx rather than consumption-based OpEx.' },
      ],
      examTip: 'Exam Anchor: No upfront hardware cost + pay-as-you-go = OpEx & Consumption-based model.',
    },
  ],
  4: [
    {
      scenario:
        'A healthcare enterprise deploys mission-critical patient portal Virtual Machines in the East US Azure Region. They must ensure the application stays online with zero downtime even if an entire datacenter building in East US loses power and cooling.',
      question:
        'Which Azure architectural feature should be used to protect against a single datacenter failure within the same Azure Region?',
      options: [
        { letter: 'A', text: 'Availability Zones' },
        { letter: 'B', text: 'Azure Management Groups' },
        { letter: 'C', text: 'Resource Group Tags' },
        { letter: 'D', text: 'Locally Redundant Storage (LRS)' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'Availability Zones are physically separate datacenters within a single Azure Region, each with independent power, cooling, and networking.',
      distractorBreakdown: [
        { letter: 'B', reason: 'Management Groups organize subscriptions for governance and policy inheritance, not datacenter fault tolerance.' },
        { letter: 'C', reason: 'Resource Group Tags are key-value metadata for billing and organization, offering no physical redundancy.' },
        { letter: 'D', reason: 'LRS keeps 3 copies within a single datacenter facility and does not survive a full datacenter outage.' },
      ],
      examTip: 'Exam Anchor: Protect against single datacenter failure in one region = Availability Zones. Protect against entire regional disaster = Region Pairs.',
    },
  ],
  5: [
    {
      scenario:
        'A defense contractor requires a dedicated, private fiber-optic connection between its on-premises headquarters and Azure that does NOT traverse the public internet and guarantees predictable bandwidth and low latency.',
      question:
        'Which Azure networking service fulfills this requirement?',
      options: [
        { letter: 'A', text: 'Azure VPN Gateway (Site-to-Site IPsec)' },
        { letter: 'B', text: 'Azure ExpressRoute' },
        { letter: 'C', text: 'Virtual Network (VNet) Peering' },
        { letter: 'D', text: 'Azure Bastion' },
      ],
      correctAnswer: 'B',
      whyCorrect:
        'Azure ExpressRoute establishes a private, dedicated connection between on-premises infrastructure and Azure through a connectivity provider, bypassing the public internet entirely.',
      distractorBreakdown: [
        { letter: 'A', reason: 'VPN Gateway sends encrypted traffic over the public internet rather than a dedicated private fiber circuit.' },
        { letter: 'C', reason: 'VNet Peering connects two Azure Virtual Networks together, not an on-premises datacenter to Azure.' },
        { letter: 'D', reason: 'Azure Bastion provides secure RDP/SSH browser access to VMs, not hybrid datacenter connectivity.' },
      ],
      examTip: 'Exam Anchor: Encrypted over public internet = VPN Gateway. Dedicated private circuit bypassing public internet = ExpressRoute.',
    },
  ],
  6: [
    {
      scenario:
        'A hospital must retain medical imaging archives for 7 years to satisfy regulatory audits. The files are almost never accessed, the hospital wants the lowest possible gigabyte storage cost, and a retrieval latency of several hours is acceptable.',
      question:
        'Which Azure Blob Storage access tier is most cost-effective for this workload?',
      options: [
        { letter: 'A', text: 'Hot Access Tier' },
        { letter: 'B', text: 'Cool Access Tier' },
        { letter: 'C', text: 'Cold Access Tier' },
        { letter: 'D', text: 'Archive Access Tier' },
      ],
      correctAnswer: 'D',
      whyCorrect:
        'The Archive tier is an offline tier optimized for data that is rarely accessed and stored for at least 180 days, offering the lowest storage cost per GB with multi-hour rehydration latency.',
      distractorBreakdown: [
        { letter: 'A', reason: 'Hot tier has the highest storage cost and is meant for frequently accessed active data.' },
        { letter: 'B', reason: 'Cool tier is for 30+ days retention with immediate millisecond access, costing more per GB than Archive.' },
        { letter: 'C', reason: 'Cold tier is for 90+ days retention with online access, costing more per GB than the offline Archive tier.' },
      ],
      examTip: 'Exam Anchor: Lowest storage cost + 180+ days retention + hours of retrieval latency = Archive Tier.',
    },
  ],
  7: [
    {
      scenario:
        'A multinational bank wants to automatically require Multi-Factor Authentication (MFA) only when an employee attempts to sign in from an unrecognized country or an unmanaged personal device, while allowing seamless sign-in from corporate offices.',
      question:
        'Which Microsoft Entra ID feature evaluates user, location, device, and risk signals to enforce dynamic access controls?',
      options: [
        { letter: 'A', text: 'Conditional Access' },
        { letter: 'B', text: 'Resource Locks (CanNotDelete)' },
        { letter: 'C', text: 'Azure Network Security Groups (NSGs)' },
        { letter: 'D', text: 'Azure DDoS Protection' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'Microsoft Entra Conditional Access uses if-then policies based on identity signals (user role, location, device compliance, sign-in risk) to allow, block, or require MFA.',
      distractorBreakdown: [
        { letter: 'B', reason: 'Resource Locks prevent accidental deletion or modification of Azure resources, not user sign-in authentication.' },
        { letter: 'C', reason: 'NSGs filter network packet traffic by IP/port/protocol at the subnet or NIC level, not identity sign-in risk.' },
        { letter: 'D', reason: 'DDoS Protection mitigates volumetric network traffic attacks, not identity authentication.' },
      ],
      examTip: 'Exam Anchor: Signals (Location + Device + Risk) -> Decision (Allow / Require MFA / Block) = Conditional Access.',
    },
  ],
  8: [
    {
      scenario:
        'A Chief Technology Officer is preparing a business case to migrate 250 on-premises physical servers, SAN storage arrays, and datacenter electricity/cooling contracts to Microsoft Azure. They need a report comparing current on-premises operational expenses against projected Azure costs over 3 years.',
      question:
        'Which Azure tool should the CTO use to generate this comparison report?',
      options: [
        { letter: 'A', text: 'Total Cost of Ownership (TCO) Calculator' },
        { letter: 'B', text: 'Azure Pricing Calculator' },
        { letter: 'C', text: 'Azure Monitor Log Analytics' },
        { letter: 'D', text: 'Azure Service Health' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'The Total Cost of Ownership (TCO) Calculator is specifically designed to compare the cost of running workloads in an on-premises datacenter versus migrating them to Azure.',
      distractorBreakdown: [
        { letter: 'B', reason: 'The Pricing Calculator estimates the monthly cost of specific Azure resources, without comparing on-premises power/hardware savings.' },
        { letter: 'C', reason: 'Log Analytics queries operational telemetry logs, not pre-migration financial comparisons.' },
        { letter: 'D', reason: 'Service Health tracks Azure regional outages and maintenance events.' },
      ],
      examTip: 'Exam Anchor: Compare On-Premises vs. Azure savings = TCO Calculator. Estimate specific Azure services = Pricing Calculator.',
    },
  ],
  9: [
    {
      scenario:
        'A cloud governance team wants to ensure that even users assigned the Subscription Owner role cannot accidentally delete a production Azure SQL Server, while still allowing engineers to create and update databases inside it.',
      question:
        'Which governance mechanism should be applied to the Azure SQL Server resource?',
      options: [
        { letter: 'A', text: 'A CanNotDelete Resource Lock' },
        { letter: 'B', text: 'A ReadOnly Resource Lock' },
        { letter: 'C', text: 'An Azure RBAC Reader Role assignment' },
        { letter: 'D', text: 'A Cost Management Billing Tag' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'A CanNotDelete resource lock allows authorized users to read and modify a resource, but prevents anyone—including Subscription Owners—from deleting it until the lock is removed.',
      distractorBreakdown: [
        { letter: 'B', reason: 'A ReadOnly lock prevents any modifications or updates in addition to preventing deletion.' },
        { letter: 'C', reason: 'RBAC Reader roles do not override an Owner’s permission to delete resources.' },
        { letter: 'D', reason: 'Tags are metadata for organization and billing and do not restrict resource deletion.' },
      ],
      examTip: 'Exam Anchor: Prevent deletion even by Owners while allowing updates = CanNotDelete Lock.',
    },
  ],
  10: [
    {
      scenario:
        'An enterprise operates Linux and Windows servers in its own on-premises datacenters as well as Kubernetes clusters in AWS. They want to project these non-Azure resources into Azure Resource Manager so they can enforce Azure Policy and apply tags from a single pane of glass.',
      question:
        'Which Azure management service extends Azure governance and management to hybrid and multi-cloud environments?',
      options: [
        { letter: 'A', text: 'Azure Arc' },
        { letter: 'B', text: 'Azure Cloud Shell' },
        { letter: 'C', text: 'Azure Bastion' },
        { letter: 'D', text: 'Azure Migrate' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'Azure Arc extends Azure Resource Manager capabilities (such as Azure Policy, RBAC, tags, and monitoring) to servers and Kubernetes clusters running on-premises or in other clouds.',
      distractorBreakdown: [
        { letter: 'B', reason: 'Cloud Shell is a browser-based command-line terminal for running CLI/PowerShell scripts.' },
        { letter: 'C', reason: 'Bastion provides secure RDP/SSH connectivity to Azure VMs.' },
        { letter: 'D', reason: 'Azure Migrate assesses and migrates workloads into Azure rather than managing workloads that remain on-premises.' },
      ],
      examTip: 'Exam Anchor: Manage on-premises and multi-cloud servers using Azure Policy/ARM = Azure Arc.',
    },
  ],
  11: [
    {
      scenario:
        'A cloud administrator wants personalized, automated recommendations to reduce unused VM costs, improve security posture, and increase high availability across all subscriptions, with one-click "Quick Fix" remediation options.',
      question:
        'Which Azure service provides these proactive best-practice recommendations across Reliability, Security, Performance, Cost, and Operational Excellence?',
      options: [
        { letter: 'A', text: 'Azure Advisor' },
        { letter: 'B', text: 'Azure Status' },
        { letter: 'C', text: 'Azure Resource Health' },
        { letter: 'D', text: 'Azure Network Watcher' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'Azure Advisor analyzes your resource configuration and usage telemetry to provide personalized, actionable recommendations across the 5 Well-Architected pillars.',
      distractorBreakdown: [
        { letter: 'B', reason: 'Azure Status shows a global public view of widespread Azure service outages.' },
        { letter: 'C', reason: 'Resource Health diagnoses the current and past availability of a single specific resource instance.' },
        { letter: 'D', reason: 'Network Watcher diagnoses packet-level virtual network routing and connectivity issues.' },
      ],
      examTip: 'Exam Anchor: Personalized best-practice recommendations (Cost, Security, Reliability, Performance, Ops Excellence) = Azure Advisor.',
    },
  ],
  12: [
    {
      scenario:
        'A regulated banking institution is deploying a new customer portal in Azure. They must enforce that resources can ONLY be created in European Union regions, automatically audit non-compliant resources, and prevent any administrator from deleting the production Virtual Network.',
      question:
        'Which combination of Azure governance tools should the cloud architect implement?',
      options: [
        { letter: 'A', text: 'Azure Policy (Allowed Locations) combined with a CanNotDelete Resource Lock' },
        { letter: 'B', text: 'Azure Advisor combined with Locally Redundant Storage (LRS)' },
        { letter: 'C', text: 'Azure Pricing Calculator combined with VNet Peering' },
        { letter: 'D', text: 'Microsoft Entra SSO combined with Azure Files Cool Tier' },
      ],
      correctAnswer: 'A',
      whyCorrect:
        'Azure Policy enforces allowed deployment regions and audits compliance across resources, while a CanNotDelete Resource Lock prevents accidental or unauthorized deletion of the production VNet.',
      distractorBreakdown: [
        { letter: 'B', reason: 'Advisor gives recommendations without enforcing region restrictions, and LRS is storage redundancy.' },
        { letter: 'C', reason: 'Pricing Calculator estimates costs and VNet Peering connects networks, neither enforcing compliance or deletion locks.' },
        { letter: 'D', reason: 'SSO handles user authentication and Azure Files is shared storage.' },
      ],
      examTip: 'Exam Anchor: Enforce resource rules/regions = Azure Policy. Prevent resource deletion = Resource Locks.',
    },
  ],
};

export const PostSessionWeakAreaReview: React.FC<PostSessionWeakAreaReviewProps> = ({
  stats,
  sessionAttempts,
  allQuestions,
  selectedPathId,
  onAnswerReviewQuestion,
  onAddGeneratedQuestionsToBank,
  onSelectPathForPractice,
  onStartPersonalizedReview,
  unresolvedMistakesCount = 0,
  onClose,
}) => {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);
  const [reviewAnswers, setReviewAnswers] = useState<
    Record<string, { selected: string; isCorrect: boolean }>
  >({});
  const [viewMode, setViewMode] = useState<'overview' | 'review-quiz' | 'summary'>('overview');
  const [savedToBank, setSavedToBank] = useState<boolean>(false);

  // 1. Compute performance across all 3 Learning Paths
  const pathPerformance = useMemo(() => {
    return LEARNING_PATHS.map((path) => {
      const pathStat = stats.pathMastery[path.id] || { correct: 0, total: 0 };
      const sessionForPath = sessionAttempts.filter((a) => a.pathId === path.id);
      const sessionCorrect = sessionForPath.filter((a) => a.isCorrect).length;
      const sessionTotal = sessionForPath.length;

      const effectiveTotal = pathStat.total;
      const effectiveCorrect = pathStat.correct;
      const accuracy =
        effectiveTotal > 0 ? Math.round((effectiveCorrect / effectiveTotal) * 100) : 0;
      const sessionAccuracy =
        sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : null;

      return {
        ...path,
        accuracy,
        correct: effectiveCorrect,
        total: effectiveTotal,
        sessionCorrect,
        sessionTotal,
        sessionAccuracy,
      };
    });
  }, [stats.pathMastery, sessionAttempts]);

  // 2. Compute performance across all 12 Modules and identify the lowest-scoring weak modules
  const allModulePerformance: WeakModuleSummary[] = useMemo(() => {
    const list: WeakModuleSummary[] = [];

    LEARNING_PATHS.forEach((path) => {
      path.modules.forEach((mod) => {
        const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const sessionWrong = sessionAttempts.filter(
          (a) => a.moduleId === mod.id && !a.isCorrect
        ).length;
        const sessionTotal = sessionAttempts.filter((a) => a.moduleId === mod.id).length;

        const accuracy =
          modStat.total > 0 ? Math.round((modStat.correct / modStat.total) * 100) : 0;

        list.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          pathId: path.id,
          pathTitle: path.title,
          accuracy,
          correct: modStat.correct,
          total: modStat.total > 0 ? modStat.total : sessionTotal,
          sessionWrong,
          keyTerms: mod.keyTerms,
        });
      });
    });

    return list;
  }, [stats.moduleMastery, sessionAttempts]);

  // Identify the 3 lowest-scoring modules (prioritizing modules within selectedPathId if a path is focused, or modules with session mistakes / lowest accuracy)
  const weakestModules = useMemo(() => {
    const scoped =
      selectedPathId !== 'all'
        ? allModulePerformance.filter((m) => m.pathId === selectedPathId)
        : allModulePerformance;

    const candidates = scoped.length > 0 ? [...scoped] : [...allModulePerformance];

    candidates.sort((a, b) => {
      // 1. Prioritize modules where the user missed questions in this quiz session
      if (a.sessionWrong !== b.sessionWrong) {
        return b.sessionWrong - a.sessionWrong;
      }
      // 2. Prioritize attempted modules with low accuracy (< 75%) over untouched modules
      const aAttemptedLow = a.total > 0 && a.accuracy < 75 ? 1 : 0;
      const bAttemptedLow = b.total > 0 && b.accuracy < 75 ? 1 : 0;
      if (aAttemptedLow !== bAttemptedLow) {
        return bAttemptedLow - aAttemptedLow;
      }
      // 3. Lowest accuracy score first
      if (a.accuracy !== b.accuracy) {
        return a.accuracy - b.accuracy;
      }
      return a.moduleId - b.moduleId;
    });

    return candidates.slice(0, 3);
  }, [allModulePerformance, selectedPathId]);

  // 3. Generate a new set of practice questions specifically focused on those weak modules
  const generateWeakAreaQuestions = useCallback(async () => {
    setIsGenerating(true);
    setActiveReviewIndex(0);
    setReviewAnswers({});
    setSavedToBank(false);

    const targetWeak = weakestModules.slice(0, 3);

    try {
      const response = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId: selectedPathId === 'all' ? undefined : selectedPathId,
          difficulty: 'Intermediate',
          count: 3,
          weakModules: targetWeak.map((wm) => ({
            moduleId: wm.moduleId,
            moduleTitle: wm.moduleTitle,
            pathId: wm.pathId,
            pathTitle: wm.pathTitle,
            accuracy: wm.accuracy,
          })),
          customPrompt: `Generate targeted remediation scenarios focusing on the user's lowest-scoring weak modules: ${targetWeak
            .map((w) => `Module ${w.moduleId} (${w.moduleTitle} - ${w.keyTerms.join(', ')})`)
            .join('; ')}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          const normalizedAiQuestions: Question[] = data.questions.map(
            (q: any, idx: number) => {
              const targetMod = targetWeak[idx % targetWeak.length] || targetWeak[0];
              return {
                id: `weak-review-ai-${Date.now()}-${idx}`,
                learningPathId: (q.learningPathId || targetMod.pathId) as 1 | 2 | 3,
                learningPathTitle: q.learningPathTitle || targetMod.pathTitle,
                moduleId: q.moduleId || targetMod.moduleId,
                moduleTitle: q.moduleTitle || targetMod.moduleTitle,
                difficulty: (q.difficulty || 'Intermediate') as
                  | 'Fundamental'
                  | 'Intermediate'
                  | 'Advanced',
                scenario: q.scenario,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                whyCorrect: q.whyCorrect,
                distractorBreakdown: q.distractorBreakdown || [],
                examTip:
                  q.examTip ||
                  'Focus on official AZ-900 service boundaries and architectural keywords.',
                isAiGenerated: true,
              };
            }
          );

          // Combine AI-generated questions with 1 targeted scenario per weak module from the remediation deck for a comprehensive 6-question review set
          const supplemental: Question[] = targetWeak.map((wm, idx) => {
            const templates =
              MODULE_REMEDIATION_TEMPLATES[wm.moduleId] || MODULE_REMEDIATION_TEMPLATES[1];
            const tpl = templates[0];
            return {
              id: `weak-review-synth-${wm.moduleId}-${Date.now()}-${idx}`,
              learningPathId: wm.pathId,
              learningPathTitle: wm.pathTitle,
              moduleId: wm.moduleId,
              moduleTitle: wm.moduleTitle,
              difficulty: 'Intermediate',
              scenario: tpl.scenario,
              question: tpl.question,
              options: tpl.options,
              correctAnswer: tpl.correctAnswer,
              whyCorrect: tpl.whyCorrect,
              distractorBreakdown: tpl.distractorBreakdown,
              examTip: tpl.examTip,
              isAiGenerated: true,
            };
          });

          setGeneratedQuestions([...normalizedAiQuestions, ...supplemental].slice(0, 6));
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // Fallback to deterministic synthesis below if offline or API key not set
    }

    // Deterministic Synthesis: Build a fresh 6-question Weak-Area Review Set focused strictly on the 3 lowest-scoring modules
    const synthesized: Question[] = [];

    targetWeak.forEach((wm, idx) => {
      const templates =
        MODULE_REMEDIATION_TEMPLATES[wm.moduleId] || MODULE_REMEDIATION_TEMPLATES[1];
      const tpl = templates[0];

      synthesized.push({
        id: `weak-remediation-${wm.moduleId}-${Date.now()}-${idx}`,
        learningPathId: wm.pathId,
        learningPathTitle: wm.pathTitle,
        moduleId: wm.moduleId,
        moduleTitle: wm.moduleTitle,
        difficulty: 'Intermediate',
        scenario: tpl.scenario,
        question: tpl.question,
        options: tpl.options,
        correctAnswer: tpl.correctAnswer,
        whyCorrect: tpl.whyCorrect,
        distractorBreakdown: tpl.distractorBreakdown,
        examTip: tpl.examTip,
        isAiGenerated: true,
      });

      // Also pull 1 unseen or previously missed question from this weak module in the bank
      const matchingBank = allQuestions.filter((q) => q.moduleId === wm.moduleId);
      if (matchingBank.length > 0) {
        const picked = matchingBank[idx % matchingBank.length];
        synthesized.push({
          ...picked,
          id: `weak-bank-${picked.id}-${Date.now()}-${idx}`,
        });
      }
    });

    setGeneratedQuestions(synthesized.slice(0, 6));
    setIsGenerating(false);
  }, [weakestModules, selectedPathId, allQuestions]);

  // Automatically generate the focused weak-area review set on mount
  useEffect(() => {
    generateWeakAreaQuestions();
  }, [generateWeakAreaQuestions]);

  const currentReviewQ = generatedQuestions[activeReviewIndex];
  const currentAnswerState = currentReviewQ ? reviewAnswers[currentReviewQ.id] : undefined;

  const handleSelectOption = (letter: string) => {
    if (!currentReviewQ || currentAnswerState) return;
    const isCorrect = letter === currentReviewQ.correctAnswer;

    setReviewAnswers((prev) => ({
      ...prev,
      [currentReviewQ.id]: { selected: letter, isCorrect },
    }));

    onAnswerReviewQuestion(currentReviewQ.id, letter, isCorrect, currentReviewQ);
  };

  const reviewCorrectCount = Object.values(reviewAnswers).filter((a) => a.isCorrect).length;
  const reviewAnsweredCount = Object.keys(reviewAnswers).length;
  const reviewAccuracy =
    reviewAnsweredCount > 0
      ? Math.round((reviewCorrectCount / reviewAnsweredCount) * 100)
      : 0;

  const getPathIcon = (pathId: number) => {
    if (pathId === 1) return <Cloud className="w-4 h-4" />;
    if (pathId === 2) return <Layers className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden space-y-0 animate-in fade-in duration-200">
      <KitengeRibbon height={4} />

      {/* Top Studio Header Bar */}
      <div className="p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-[#0b192f] to-slate-950 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-bold uppercase tracking-wider">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Post-Session Diagnostic &amp; Dedicated Weak-Area Review Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Learning Path &amp; Weak-Module Remediation</span>
              <MaasaiMedallion size={24} />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your performance across all 3 AZ-900 Learning Paths and 12 Modules has been analyzed. We identified your lowest-scoring modules and generated a separate set of focused practice questions below.
            </p>
          </div>

          {/* Segmented View Switcher (Separate Presentation Tabs) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center p-1 rounded-xl bg-white/10 border border-white/15">
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'overview'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                1. Path &amp; Module Scores
              </button>
              <button
                type="button"
                onClick={() => setViewMode('review-quiz')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'review-quiz'
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>2. Weak-Area Review Set ({generatedQuestions.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Return to Standard Bank</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: PERFORMANCE MATRIX ACROSS LEARNING PATHS & WEAKEST MODULES
         ===================================================================== */}
      {viewMode === 'overview' && (
        <div className="p-6 sm:p-8 space-y-8">
          {/* Post-Quiz Personalized Review Session Callout (When User Has Answered Any Questions Incorrectly) */}
          {onStartPersonalizedReview && unresolvedMistakesCount > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-rose-50/60 border border-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-amber-500 text-slate-950 shrink-0 mt-0.5 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    Personalized Mistake Remediation Available
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    You have {unresolvedMistakesCount} incorrectly answered question{unresolvedMistakesCount === 1 ? '' : 's'} ready for Personalized Review
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    Launch your Personalized Review Session to focus strictly on the questions you got wrong, study their architectural explanations and distractor breakdowns, and mark them reviewed to remove them from future review sessions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartPersonalizedReview}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <span>Start Personalized Review Session ({unresolvedMistakesCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section A: 3 Learning Paths Performance Breakdown */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Performance Across Official AZ-900 Learning Paths
                </h3>
                <p className="text-xs text-slate-500">
                  Cumulative mastery and session accuracy across the three Microsoft exam domains
                </p>
              </div>
              {sessionAttempts.length > 0 && (
                <div className="text-xs text-slate-600 font-semibold">
                  Recent Session Answered: <strong className="text-slate-900">{sessionAttempts.length} questions</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pathPerformance.map((p) => {
                const isPassing = p.accuracy >= 70;
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-2 rounded-xl text-white shadow-2xs"
                            style={{ backgroundColor: p.accentColor }}
                          >
                            {getPathIcon(p.id)}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-500">
                              Learning Path {p.id} · {p.examWeight}
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                              {p.title}
                            </h4>
                          </div>
                        </div>

                        <span
                          className={`text-sm font-black font-mono ${
                            p.total === 0
                              ? 'text-slate-400'
                              : isPassing
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {p.total > 0 ? `${p.accuracy}%` : 'Untested'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPassing ? 'bg-emerald-500' : p.total > 0 ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${p.total > 0 ? Math.max(6, p.accuracy) : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                          Correct: <strong className="text-slate-900">{p.correct}/{p.total}</strong>
                        </span>
                        {p.sessionTotal > 0 && (
                          <span>
                            This Session: <strong className="text-[#0078D4]">{p.sessionCorrect}/{p.sessionTotal} ({p.sessionAccuracy}%)</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {onSelectPathForPractice && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPathForPractice(p.id, 'all');
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Focus Practice on Path {p.id}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#0078D4]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Lowest-Scoring Weak Modules Identified for Targeted Review */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Identified Lowest-Scoring Modules (Priority Weak Areas)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  These 3 modules have the lowest scores or highest recent misses and are targeted in your separate review question set
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('review-quiz')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Start Separate Weak-Area Review ({generatedQuestions.length} Qs)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weakestModules.map((wm, index) => (
                <div
                  key={wm.moduleId}
                  className="p-5 rounded-xl border border-rose-200/90 bg-rose-50/30 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
                      <span>Priority Weak Area #{index + 1} · Path {wm.pathId}</span>
                      <span className="font-mono font-black text-rose-700">
                        {wm.total > 0 ? `${wm.accuracy}% Score` : '0% (Untested)'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Module {wm.moduleId}: {wm.moduleTitle}
                    </h4>

                    <p className="text-xs text-slate-600">
                      Answered <strong className="text-slate-900">{wm.correct} of {wm.total}</strong> correctly
                      {wm.sessionWrong > 0 ? ` · ${wm.sessionWrong} missed in this session` : ''}.
                    </p>

                    <div className="pt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Key Focus Terms: </span>
                      <span>{wm.keyTerms.join(' · ')}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReviewIndex(0);
                        setViewMode('review-quiz');
                      }}
                      className="text-xs font-extrabold text-[#0078D4] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Practice Generated Review Qs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: All 12 Curriculum Modules Score Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Complete 12-Module Curriculum Score Ledger
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Module</th>
                    <th className="py-2.5 px-4">Learning Path</th>
                    <th className="py-2.5 px-4 text-right">Attempts</th>
                    <th className="py-2.5 px-4 text-right">Score</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allModulePerformance.map((mod) => {
                    const isWeak = weakestModules.some((w) => w.moduleId === mod.moduleId);
                    return (
                      <tr key={mod.moduleId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          Module {mod.moduleId}: {mod.moduleTitle}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          Path {mod.pathId}: {mod.pathTitle}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                          {mod.correct}/{mod.total}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {mod.total > 0 ? `${mod.accuracy}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isWeak ? (
                            <span className="text-rose-700 font-bold">Targeted for Remediation</span>
                          ) : mod.accuracy >= 70 ? (
                            <span className="text-emerald-700 font-bold">Exam Ready</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Developing</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: SEPARATE WEAK-AREA REVIEW QUESTION STUDIO
         ===================================================================== */}
      {viewMode === 'review-quiz' && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Top Remediation Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Separate Weak-Area Practice Set · Dynamically Generated for Lowest-Scoring Modules</span>
              </div>
              <p className="text-xs text-slate-500">
                Targeting: {weakestModules.map((w) => `Module ${w.moduleId} (${w.moduleTitle})`).join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-slate-700">
                Remediation Score:{' '}
                <strong className="font-mono text-[#0078D4]">
                  {reviewCorrectCount}/{reviewAnsweredCount} ({reviewAccuracy}%)
                </strong>
              </span>

              <button
                type="button"
                disabled={isGenerating}
                onClick={generateWeakAreaQuestions}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0078D4]" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-[#0078D4]" />
                )}
                <span>Generate New Weak-Area Set</span>
              </button>

              {onAddGeneratedQuestionsToBank && !savedToBank && generatedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onAddGeneratedQuestionsToBank(generatedQuestions);
                    setSavedToBank(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Save Set to Custom Bank</span>
                </button>
              )}
              {savedToBank && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved to Question Bank</span>
                </span>
              )}
            </div>
          </div>

          {isGenerating ? (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#0078D4] mx-auto" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900">
                  Generating Targeted Practice Questions for Your Weakest Modules...
                </h4>
                <p className="text-xs text-slate-500">
                  Synthesizing scenario-based questions for{' '}
                  {weakestModules.map((w) => `Module ${w.moduleId}: ${w.moduleTitle}`).join(', ')}
                </p>
              </div>
            </div>
          ) : currentReviewQ ? (
            <div className="space-y-6">
              {/* Question Selector Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {generatedQuestions.map((q, idx) => {
                    const ans = reviewAnswers[q.id];
                    const isCurrent = idx === activeReviewIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveReviewIndex(idx)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
                          isCurrent
                            ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-xs'
                            : ans
                            ? ans.isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  <span>
                    Path {currentReviewQ.learningPathId}: {currentReviewQ.learningPathTitle}
                  </span>
                  <span className="mx-1.5">·</span>
                  <strong className="text-rose-700">
                    Weak Area Target: Module {currentReviewQ.moduleId} ({currentReviewQ.moduleTitle})
                  </strong>
                </div>
              </div>

              {/* Scenario Narrative */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0078D4] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Targeted Remediation Scenario · Question {activeReviewIndex + 1} of {generatedQuestions.length}</span>
                </div>
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                  {currentReviewQ.scenario}
                </p>
              </div>

              {/* Question Prompt */}
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  {currentReviewQ.question}
                </h3>
              </div>

              {/* 4 Options */}
              <div className="space-y-3">
                {currentReviewQ.options.map((opt) => {
                  const isSelected = currentAnswerState?.selected === opt.letter;
                  const isCorrectOpt = opt.letter === currentReviewQ.correctAnswer;

                  let cardStyle =
                    'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800';
                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';

                  if (currentAnswerState) {
                    if (isCorrectOpt) {
                      cardStyle =
                        'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20';
                      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                    } else if (isSelected) {
                      cardStyle =
                        'border-rose-400 bg-rose-50/80 text-rose-950 ring-2 ring-rose-400/20';
                      badgeStyle = 'bg-rose-600 text-white border-rose-600';
                    } else {
                      cardStyle = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={Boolean(currentAnswerState)}
                      onClick={() => handleSelectOption(opt.letter)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${cardStyle}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${badgeStyle}`}
                      >
                        {currentAnswerState && isCorrectOpt ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : currentAnswerState && isSelected && !isCorrectOpt ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          opt.letter
                        )}
                      </span>
                      <span className="text-sm sm:text-base font-medium pt-1 grow leading-relaxed">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Architectural Explanation */}
              {currentAnswerState && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      currentAnswerState.isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    {currentAnswerState.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div className="text-xs sm:text-sm font-bold">
                      {currentAnswerState.isCorrect
                        ? `Excellent! You strengthened your mastery in Module ${currentReviewQ.moduleId}: ${currentReviewQ.moduleTitle}.`
                        : `Correct Answer: Option ${currentReviewQ.correctAnswer}. Review the architectural breakdown below:`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      Why Option {currentReviewQ.correctAnswer} is Correct:
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {currentReviewQ.whyCorrect}
                    </p>
                  </div>

                  {currentReviewQ.distractorBreakdown &&
                    currentReviewQ.distractorBreakdown.length > 0 && (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                          Distractor Breakdown:
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          {currentReviewQ.distractorBreakdown.map((d) => (
                            <div key={d.letter}>
                              <strong className="text-slate-900">Option {d.letter}:</strong>{' '}
                              <span>{d.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold block">Exam Anchor Tip:</strong>
                      <span>{currentReviewQ.examTip}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={activeReviewIndex === 0}
                  onClick={() => setActiveReviewIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Review Question</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('overview')}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    View Module Scores
                  </button>

                  {activeReviewIndex < generatedQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReviewIndex((prev) =>
                          Math.min(generatedQuestions.length - 1, prev + 1)
                        )
                      }
                      className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Next Review Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          confetti({
                            particleCount: 65,
                            spread: 70,
                            origin: { y: 0.6 },
                          });
                        } catch {
                          // ignore confetti errors
                        }
                        setViewMode('overview');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Complete Weak-Area Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
