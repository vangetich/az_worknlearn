import { LEARNING_PATHS } from '../data/curriculum';
import { Question, QuestionAttempt, UserStats } from '../types/quiz';

export interface ConsolidationExerciseStep {
  phase: string;
  durationSec: number;
  prompt: string;
}

export interface ModuleConsolidationExercise {
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  exerciseTitle: string;
  focusTrap: string;
  steps: ConsolidationExerciseStep[];
}

export interface BlockWeakModuleSummary {
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  incorrectCount: number;
  totalInBlock: number;
  exercise: ModuleConsolidationExercise;
}

export const MODULE_CONSOLIDATION_EXERCISES: Record<number, ModuleConsolidationExercise> = {
  1: {
    moduleId: 1,
    moduleTitle: 'Describe Cloud Computing',
    pathId: 1,
    exerciseTitle: 'Shared Responsibility Boundary Sprint',
    focusTrap: 'Customer always retains ownership of Data, Endpoints, and Account Access across IaaS, PaaS, and SaaS.',
    steps: [
      {
        phase: '40s Matrix Check',
        durationSec: 40,
        prompt: 'Recite who manages OS patching, runtime, and applications in On-Premises vs. IaaS vs. PaaS vs. SaaS.',
      },
      {
        phase: '40s Deployment Contrast',
        durationSec: 40,
        prompt: 'Distinguish Public, Private, and Hybrid cloud use cases for compliance vs. burst capacity.',
      },
      {
        phase: '40s Consumption Model',
        durationSec: 40,
        prompt: 'Anchor why cloud converts upfront CapEx hardware bills into flexible OpEx pay-as-you-go charges.',
      },
    ],
  },
  2: {
    moduleId: 2,
    moduleTitle: 'Describe the Benefits of Using Cloud Services',
    pathId: 1,
    exerciseTitle: 'Elasticity vs. High Availability Anchor',
    focusTrap: 'Scale Up/Down (Vertical = CPU/RAM) vs. Scale Out/In (Horizontal = instances); Elasticity = automatic scaling.',
    steps: [
      {
        phase: '40s Scaling Pair Recall',
        durationSec: 40,
        prompt: 'Contrast Vertical scaling (resizing 1 VM) against Horizontal scaling (adding VM instances in a scale set).',
      },
      {
        phase: '40s Resilience Terms',
        durationSec: 40,
        prompt: 'State one concrete scenario each for High Availability, Fault Tolerance, and Disaster Recovery.',
      },
      {
        phase: '40s Predictability Check',
        durationSec: 40,
        prompt: 'Name the Azure tools for cost & performance predictability (Pricing Calculator, TCO, SLA guarantees).',
      },
    ],
  },
  3: {
    moduleId: 3,
    moduleTitle: 'Describe Cloud Service Types',
    pathId: 1,
    exerciseTitle: 'IaaS vs. PaaS vs. SaaS Decision Tree',
    focusTrap: 'PaaS removes OS patching while keeping custom app code control; SaaS leaves only configuration & user access.',
    steps: [
      {
        phase: '40s Service Mapping',
        durationSec: 40,
        prompt: 'Map Azure VMs (IaaS), App Service / Azure SQL (PaaS), and Microsoft 365 (SaaS) to team control levels.',
      },
      {
        phase: '40s Migration Trigger',
        durationSec: 40,
        prompt: 'Identify when "Lift & Shift" requires IaaS vs. when refactoring allows serverless / PaaS savings.',
      },
      {
        phase: '40s Responsibility Rule',
        durationSec: 40,
        prompt: 'Verify which layers shift from customer to Microsoft as you move from IaaS -> PaaS -> SaaS.',
      },
    ],
  },
  4: {
    moduleId: 4,
    moduleTitle: 'Describe the Core Architectural Components of Azure',
    pathId: 2,
    exerciseTitle: 'Physical & Logical Hierarchy Drill',
    focusTrap: 'Availability Zones isolate datacenters inside ONE region; Region Pairs span 300+ miles for cross-region DR.',
    steps: [
      {
        phase: '40s Physical Chain',
        durationSec: 40,
        prompt: 'Trace Datacenter -> Availability Zone (independent power/cooling/network) -> Region -> Geography.',
      },
      {
        phase: '40s Governance Hierarchy',
        durationSec: 40,
        prompt: 'Order Management Groups -> Subscriptions -> Resource Groups -> Resources from top to bottom.',
      },
      {
        phase: '40s Boundary Check',
        durationSec: 40,
        prompt: 'Recall two rules: a resource belongs to 1 Resource Group, and Resource Groups can contain multi-region resources.',
      },
    ],
  },
  5: {
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    pathId: 2,
    exerciseTitle: 'Compute & Connectivity Selector',
    focusTrap: 'ExpressRoute = private fiber (not public internet); VPN Gateway = encrypted tunnel over public internet.',
    steps: [
      {
        phase: '40s Compute Ladder',
        durationSec: 40,
        prompt: 'Match workloads to VMs, Scale Sets, Containers/AKS, App Service, and Azure Functions (event-driven).',
      },
      {
        phase: '40s Network Paths',
        durationSec: 40,
        prompt: 'Compare VNet Peering (same/cross-region backbone) vs. VPN Gateway vs. ExpressRoute vs. Private Link.',
      },
      {
        phase: '40s Public DNS Check',
        durationSec: 40,
        prompt: 'Anchor how Azure DNS resolves domain names vs. Azure Load Balancer distributing Layer-4 traffic.',
      },
    ],
  },
  6: {
    moduleId: 6,
    moduleTitle: 'Describe Azure Storage Services',
    pathId: 2,
    exerciseTitle: 'Redundancy & Access Tiers Synthesis',
    focusTrap: 'Archive tier is offline and requires hours of rehydration before reading; ZRS protects against zone failure.',
    steps: [
      {
        phase: '40s Redundancy Tiers',
        durationSec: 40,
        prompt: 'Recite copy counts and scope: LRS (3 local) -> ZRS (3 zones) -> GRS (6 across paired regions) -> GZRS.',
      },
      {
        phase: '40s Storage Types',
        durationSec: 40,
        prompt: 'Pair Blob (unstructured objects), Azure Files (SMB/NFS shares), Queues (async messages), and Tables (NoSQL).',
      },
      {
        phase: '40s Hot/Cool/Cold/Archive',
        durationSec: 40,
        prompt: 'Connect minimum storage durations (30d Cool, 90d Cold, 180d Archive) and Archive rehydration latency.',
      },
    ],
  },
  7: {
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    pathId: 2,
    exerciseTitle: 'Zero Trust, Entra ID & Defense-in-Depth',
    focusTrap: 'Authentication proves who you are (MFA); Authorization grants permissions (RBAC); Zero Trust = never trust, always verify.',
    steps: [
      {
        phase: '40s AuthN vs. AuthZ',
        durationSec: 40,
        prompt: 'Separate Entra ID / MFA / SSO (Authentication) from RBAC & Conditional Access (Authorization).',
      },
      {
        phase: '40s Zero Trust Pillars',
        durationSec: 40,
        prompt: 'Recite the 3 Zero Trust principles: Verify Explicitly, Least Privilege Access, Assume Breach.',
      },
      {
        phase: '40s Defense Layers',
        durationSec: 40,
        prompt: 'Walk all 7 Defense-in-Depth layers from Physical -> Identity -> Perimeter -> Network -> Compute -> App -> Data.',
      },
    ],
  },
  8: {
    moduleId: 8,
    moduleTitle: 'Describe Cost Management in Azure',
    pathId: 3,
    exerciseTitle: 'Pricing, TCO & Cost Optimization Check',
    focusTrap: 'Pricing Calculator = new Azure monthly estimate; TCO Calculator = on-prem migration savings comparison.',
    steps: [
      {
        phase: '40s Calculator Split',
        durationSec: 40,
        prompt: 'Contrast Pricing Calculator vs. TCO Calculator vs. Cost Management + Billing budgets & alerts.',
      },
      {
        phase: '40s Cost Factors',
        durationSec: 40,
        prompt: 'Recall why outbound bandwidth costs apply while inbound data transfers into Azure are free.',
      },
      {
        phase: '40s Saving Levers',
        durationSec: 40,
        prompt: 'Connect Azure Reservations (1- or 3-year commit), Spot VMs, Azure Hybrid Benefit, and Resource Tags.',
      },
    ],
  },
  9: {
    moduleId: 9,
    moduleTitle: 'Describe Features and Tools in Azure for Governance and Compliance',
    pathId: 3,
    exerciseTitle: 'Policy vs. RBAC vs. Resource Locks',
    focusTrap: 'Resource Locks (CanNotDelete / ReadOnly) block even Owner RBAC deletions until the lock is explicitly removed.',
    steps: [
      {
        phase: '40s Governance Trio',
        durationSec: 40,
        prompt: 'Differentiate Azure Policy (resource compliance rules), RBAC (user actions), and Locks (delete protection).',
      },
      {
        phase: '40s Purview & Trust',
        durationSec: 40,
        prompt: 'Pair Microsoft Purview (data governance/lineage) with Service Trust Portal (audit reports & compliance).',
      },
      {
        phase: '40s Blueprint & Tags',
        durationSec: 40,
        prompt: 'Confirm how Resource Tags do NOT inherit automatically from Resource Groups unless enforced by Azure Policy.',
      },
    ],
  },
  10: {
    moduleId: 10,
    moduleTitle: 'Describe Features and Tools for Managing and Deploying Azure Resources',
    pathId: 3,
    exerciseTitle: 'Portal, CLI, PowerShell, ARM & Arc Recall',
    focusTrap: 'Azure Arc extends Azure Resource Manager governance to multi-cloud and on-premises servers; IaC = declarative JSON/Bicep.',
    steps: [
      {
        phase: '40s Interaction Surface',
        durationSec: 40,
        prompt: 'Compare Azure Portal (visual GUI), Cloud Shell (browser Bash/PowerShell), CLI, and REST APIs via ARM.',
      },
      {
        phase: '40s IaC & Templates',
        durationSec: 40,
        prompt: 'Contrast imperative CLI scripts with idempotent declarative ARM JSON templates & Bicep files.',
      },
      {
        phase: '40s Hybrid Reach',
        durationSec: 40,
        prompt: 'Verify when Azure Arc projects external Kubernetes/servers into Azure for unified Policy & tagging.',
      },
    ],
  },
  11: {
    moduleId: 11,
    moduleTitle: 'Describe Monitoring Tools in Azure',
    pathId: 3,
    exerciseTitle: 'Advisor, Service Health & Monitor Triage',
    focusTrap: 'Azure Advisor = cost/security/reliability recommendations; Service Health = your specific Azure outage notifications; Monitor = metrics & logs.',
    steps: [
      {
        phase: '40s Advisory vs. Telemetry',
        durationSec: 40,
        prompt: 'Split Azure Advisor (best-practice recommendations) from Azure Monitor (Metrics, Log Analytics, App Insights).',
      },
      {
        phase: '40s Health Tools',
        durationSec: 40,
        prompt: 'Compare Azure Status (global public), Service Health (personalized outages), and Resource Health (single VM status).',
      },
      {
        phase: '40s App Telemetry',
        durationSec: 40,
        prompt: 'Anchor Application Insights as the APM tool for live web app latency, exceptions, and dependency tracing.',
      },
    ],
  },
  12: {
    moduleId: 12,
    moduleTitle: 'Cross-Module Exam Strategy & Synthesis',
    pathId: 3,
    exerciseTitle: 'Multi-Domain AZ-900 Keyword Anchor',
    focusTrap: 'Spot subtle keyword boundaries across Cost, Security, Governance, and Reliability in multi-requirement questions.',
    steps: [
      {
        phase: '40s Keyword Elimination',
        durationSec: 40,
        prompt: 'Eliminate answers confusing Identity (Entra ID) with Network (NSG/Firewall) or Governance (Policy/Lock).',
      },
      {
        phase: '40s Constraint Check',
        durationSec: 40,
        prompt: 'Practice spotting qualifiers like "least administrative effort", "lowest cost", and "no downtime".',
      },
      {
        phase: '40s SLA Math Recall',
        durationSec: 40,
        prompt: 'Remember that composite SLAs multiply component SLAs (99.9% × 99.9% = 99.8%), never add.',
      },
    ],
  },
};

function findModuleMeta(moduleId: number) {
  for (const path of LEARNING_PATHS) {
    const mod = path.modules.find((m) => m.id === moduleId);
    if (mod) return { mod, path };
  }
  return null;
}

/**
 * Identifies the modules with the most incorrect answers in the previous 6-question block
 * and attaches specific 2-minute knowledge consolidation exercises for each.
 */
export function getMostIncorrectModulesInBlock(
  recentBlockAttempts: QuestionAttempt[] = [],
  stats?: UserStats
): {
  weakModulesInBlock: BlockWeakModuleSummary[];
  blockTotalQuestions: number;
  blockIncorrectCount: number;
} {
  const block = recentBlockAttempts.slice(-6);
  const byMod = new Map<
    number,
    { incorrectCount: number; totalInBlock: number; lastSeenTs: number }
  >();

  block.forEach((att) => {
    const prev = byMod.get(att.moduleId) || {
      incorrectCount: 0,
      totalInBlock: 0,
      lastSeenTs: 0,
    };
    byMod.set(att.moduleId, {
      incorrectCount: prev.incorrectCount + (att.isCorrect ? 0 : 1),
      totalInBlock: prev.totalInBlock + 1,
      lastSeenTs: Math.max(prev.lastSeenTs, att.timestamp || 0),
    });
  });

  const blockIncorrectCount = block.filter((a) => !a.isCorrect).length;

  const summaries: BlockWeakModuleSummary[] = Array.from(byMod.entries())
    .filter(([, data]) => data.incorrectCount > 0)
    .sort((a, b) => {
      if (b[1].incorrectCount !== a[1].incorrectCount) {
        return b[1].incorrectCount - a[1].incorrectCount;
      }
      const aAcc = a[1].totalInBlock > 0 ? 1 - a[1].incorrectCount / a[1].totalInBlock : 1;
      const bAcc = b[1].totalInBlock > 0 ? 1 - b[1].incorrectCount / b[1].totalInBlock : 1;
      if (aAcc !== bAcc) return aAcc - bAcc;
      return b[1].lastSeenTs - a[1].lastSeenTs;
    })
    .map(([moduleId, data]) => {
      const meta = findModuleMeta(moduleId);
      const exercise =
        MODULE_CONSOLIDATION_EXERCISES[moduleId] || MODULE_CONSOLIDATION_EXERCISES[1];
      return {
        moduleId,
        moduleTitle: meta?.mod.title || exercise.moduleTitle,
        pathId: (meta?.path.id || exercise.pathId) as 1 | 2 | 3,
        incorrectCount: data.incorrectCount,
        totalInBlock: data.totalInBlock,
        exercise,
      };
    });

  // If the 6-question block had 0 errors, fall back gracefully to the lowest cumulative module
  // or most recently practiced module in the block so the 2-min consolidation exercise stays actionable.
  if (summaries.length === 0) {
    let fallbackModuleId = 1;
    if (stats?.moduleMastery) {
      let lowestAcc = 101;
      for (const [modIdStr, m] of Object.entries(stats.moduleMastery)) {
        if (m.total > 0) {
          const acc = Math.round((m.correct / m.total) * 100);
          if (acc < lowestAcc) {
            lowestAcc = acc;
            fallbackModuleId = Number(modIdStr);
          }
        }
      }
    }
    if (lowestAccUnset(stats) && block.length > 0) {
      fallbackModuleId = block[block.length - 1].moduleId;
    }
    const meta = findModuleMeta(fallbackModuleId);
    const exercise =
      MODULE_CONSOLIDATION_EXERCISES[fallbackModuleId] || MODULE_CONSOLIDATION_EXERCISES[1];
    const blockEntry = byMod.get(fallbackModuleId);
    summaries.push({
      moduleId: fallbackModuleId,
      moduleTitle: meta?.mod.title || exercise.moduleTitle,
      pathId: (meta?.path.id || exercise.pathId) as 1 | 2 | 3,
      incorrectCount: 0,
      totalInBlock: blockEntry?.totalInBlock || 0,
      exercise,
    });
  }

  return {
    weakModulesInBlock: summaries,
    blockTotalQuestions: block.length,
    blockIncorrectCount,
  };
}

function lowestAccUnset(stats?: UserStats): boolean {
  if (!stats?.moduleMastery) return true;
  return !Object.values(stats.moduleMastery).some((m) => m.total > 0);
}

/**
 * Formats the current quiz question, explanation, and user's selected distractor
 * into a clean Markdown snippet for pasting directly into an AI Knowledge Assistant.
 */
export function formatQuestionContextMarkdown(
  question: Question,
  selectedOption: string | null,
  hasSubmitted: boolean
): string {
  const correctOpt = question.options.find((o) => o.letter === question.correctAnswer);
  const selectedOpt = selectedOption
    ? question.options.find((o) => o.letter === selectedOption)
    : undefined;
  const isSelectedCorrect = selectedOption === question.correctAnswer;
  const selectedDistractor =
    selectedOption && !isSelectedCorrect
      ? question.distractorBreakdown?.find((d) => d.letter === selectedOption)
      : undefined;

  const lines: string[] = [
    `### AZ-900 Question Context — Module ${question.moduleId}: ${question.moduleTitle}`,
    `**Learning Path ${question.learningPathId}:** ${question.learningPathTitle} · **Difficulty:** ${question.difficulty}`,
    '',
    '**Scenario:**',
    question.scenario,
    '',
    '**Question:**',
    question.question,
    '',
    '**Options:**',
    ...question.options.map((opt) => `- **${opt.letter}:** ${opt.text}`),
    '',
  ];

  if (selectedOption) {
    lines.push(
      `**My Selected Answer:** Option ${selectedOption}${
        selectedOpt ? ` — ${selectedOpt.text}` : ''
      } (${hasSubmitted ? (isSelectedCorrect ? 'Correct' : 'Incorrect Distractor') : 'Selected'})`
    );
  } else {
    lines.push('**My Selected Answer:** Not yet selected');
  }

  lines.push(
    `**Correct Answer:** Option ${question.correctAnswer}${
      correctOpt ? ` — ${correctOpt.text}` : ''
    }`
  );
  lines.push('');
  lines.push('**Explanation (Why Correct):**');
  lines.push(question.whyCorrect);

  if (selectedDistractor) {
    lines.push('');
    lines.push(`**Why My Selected Distractor (Option ${selectedOption}) Is Incorrect:**`);
    lines.push(selectedDistractor.reason);
  } else if (question.distractorBreakdown && question.distractorBreakdown.length > 0) {
    lines.push('');
    lines.push('**Distractor Breakdown:**');
    question.distractorBreakdown.forEach((d) => {
      lines.push(`- **Option ${d.letter}:** ${d.reason}`);
    });
  }

  if (question.examTip) {
    lines.push('');
    lines.push(`**AZ-900 Exam Rule:** ${question.examTip}`);
  }

  lines.push('');
  lines.push('---');
  lines.push(
    selectedOption && !isSelectedCorrect
      ? `**Prompt for AI Knowledge Assistant:** Please break down why Option ${selectedOption} is an incorrect distractor compared to Option ${question.correctAnswer} in this scenario, and give me a quick memory anchor so I don't miss this again.`
      : '**Prompt for AI Knowledge Assistant:** Please reinforce the core Azure architectural distinction tested here and highlight the most common exam trap for this topic.'
  );

  return lines.join('\n');
}

export interface ConfidenceStreakState {
  currentStreak: number;
  bestStreak: number;
  lastRatedQuestionId: string | null;
  lastConfidenceLevel: number | null;
}

/**
 * Computes updated consecutive high-confidence streak (confidence >= 4 out of 5).
 * Avoids double-incrementing when a learner updates the confidence rating on the same question.
 */
export function computeNextConfidenceStreakState(
  prev: ConfidenceStreakState,
  questionId: string,
  confidence: number
): ConfidenceStreakState {
  const isHighConfidence = confidence >= 4;

  if (!isHighConfidence) {
    return {
      currentStreak: 0,
      bestStreak: prev.bestStreak,
      lastRatedQuestionId: questionId,
      lastConfidenceLevel: confidence,
    };
  }

  // Re-rating the same question consecutively preserves current streak count instead of double counting
  if (prev.lastRatedQuestionId === questionId && prev.currentStreak > 0) {
    return {
      ...prev,
      lastConfidenceLevel: confidence,
    };
  }

  const nextStreak = prev.currentStreak + 1;
  return {
    currentStreak: nextStreak,
    bestStreak: Math.max(prev.bestStreak, nextStreak),
    lastRatedQuestionId: questionId,
    lastConfidenceLevel: confidence,
  };
}

export function getQuestionTags(q: Question): string[] {
  const tags: string[] = [];
  const text = `${q.moduleTitle} ${q.question} ${q.scenario} ${q.whyCorrect}`.toLowerCase();
  if (text.includes('price') || text.includes('cost') || text.includes('pricing') || text.includes('capex') || text.includes('opex') || text.includes('calculator') || text.includes('billing')) {
    tags.push('Pricing');
  }
  if (text.includes('compliance') || text.includes('governance') || text.includes('policy') || text.includes('privacy') || text.includes('regulatory') || text.includes('sovereign')) {
    tags.push('Compliance');
  }
  if (text.includes('security') || text.includes('identity') || text.includes('entra') || text.includes('defender') || text.includes('key vault') || text.includes('authentication')) {
    tags.push('Security');
  }
  if (text.includes('scale') || text.includes('availability') || text.includes('redundancy') || text.includes('zones') || text.includes('load balancer') || text.includes('backup')) {
    tags.push('Scaling');
  }
  if (tags.length === 0) {
    tags.push('Core Service');
  }
  if (q.threadTags && q.threadTags.length > 0) {
    q.threadTags.forEach((t) => {
      if (!tags.includes(t)) tags.push(t);
    });
  }
  return tags;
}
