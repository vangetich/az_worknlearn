import { Question, UserStats } from '../types/quiz';

// Official AZ-900 Virtual Study Room Areas mapped to official exam objectives, domain weights, module links & cross-chamber interoperability

export type CanonicalChamberId =
  | 'AZ900-CONCEPTS'
  | 'AZ900-SERVICES'
  | 'AZ900-SECURITY'
  | 'AZ900-GOVERNANCE'
  | 'AZ900-WAR-ROOM'
  | 'AZ900-CLINIC';

export interface ChamberLinkTarget {
  targetId: CanonicalChamberId;
  relationship: string;
  actionLabel: string;
}

export interface VirtualStudyArea {
  id: CanonicalChamberId;
  name: string;
  shortCode: string;
  tagline: string;
  domainFocus: string;
  examWeight: string;
  pathId?: 1 | 2 | 3;
  moduleIds: number[];
  threadTags: string[];
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  onlineCount: number;
  mission: string;
  keyTopics: string[];
  recommendedDuration: string;
  defaultDurationSeconds: number;
  ambianceLabel: string;
  linkedChambers: ChamberLinkTarget[];
  activePeers: {
    name: string;
    avatar: string;
    location: string;
    role: string;
  }[];
  topicCues: string[];
}

export const VIRTUAL_STUDY_AREAS: VirtualStudyArea[] = [
  {
    id: 'AZ900-CONCEPTS',
    name: 'Cloud Principles & Economics Hub',
    shortCode: 'Concepts Hub',
    tagline: 'CapEx vs OpEx, Consumption Models & Shared Responsibility Matrix',
    domainFocus: 'Describe Cloud Concepts (Path 1 · M1–M3)',
    examWeight: '25–30%',
    pathId: 1,
    moduleIds: [1, 2, 3],
    threadTags: ['Responsibility', 'Scaling', 'FinOps'],
    themeColor: 'from-blue-600 to-sky-700',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800',
    badgeText: 'text-blue-600 dark:text-sky-400',
    borderAccent: 'border-blue-500/40',
    onlineCount: 0,
    mission:
      'Solidify foundational cloud definitions, composite SLA math, CapEx/OpEx tradeoffs, and IaaS/PaaS/SaaS boundary lines.',
    keyTopics: [
      'CapEx (Upfront Infrastructure) vs OpEx (Pay-As-You-Go)',
      'Consumption-based Pricing Model (Elastic Scaling)',
      'Shared Responsibility Matrix (IaaS vs PaaS vs SaaS)',
      'Cloud Deployment Models: Public, Private, Hybrid & Multi-Cloud',
      'High Availability, Scalability, Elasticity, Agility & Disaster Recovery',
    ],
    recommendedDuration: '25 Mins (Pomodoro)',
    defaultDurationSeconds: 25 * 60,
    ambianceLabel: 'Nairobi Silicon Savannah Focus',
    linkedChambers: [
      {
        targetId: 'AZ900-SERVICES',
        relationship: 'Carry Elasticity & HA into Azure infrastructure',
        actionLabel: 'Handoff to Services Lab',
      },
      {
        targetId: 'AZ900-GOVERNANCE',
        relationship: 'Connect OpEx pricing theory to Cost Budgets & TCO',
        actionLabel: 'Bridge to Governance Arena',
      },
      {
        targetId: 'AZ900-CLINIC',
        relationship: 'Escalate tricky CapEx/Responsibility edge cases',
        actionLabel: 'Escalate to Traps Clinic',
      },
    ],
    activePeers: [
      { name: 'Amara', avatar: '👩🏾‍💻', location: 'Nairobi, KE', role: 'Solutions Architect Track' },
      { name: 'Kofi', avatar: '👨🏿‍💻', location: 'Accra, GH', role: 'DevOps Track' },
      { name: 'Fatima', avatar: '👩🏽‍💻', location: 'Cairo, EG', role: 'Cloud Economics Scholar' },
    ],
    topicCues: [
      'In SaaS, Microsoft manages physical hosts, OS, and application; you manage data, devices, and accounts.',
      'Serverless computing eliminates idle server costs; you pay only per function execution duration.',
      'Composite SLA multiplies dependent services: 99.95% × 99.9% ≈ 99.85%.',
    ],
  },
  {
    id: 'AZ900-SERVICES',
    name: 'Core Architecture & Services Lab',
    shortCode: 'Services Lab',
    tagline: 'Regions, Availability Zones, VMs, Containers & Storage Redundancy',
    domainFocus: 'Describe Azure Architecture & Services (Path 2 · M4–M6)',
    examWeight: '35–40%',
    pathId: 2,
    moduleIds: [4, 5, 6],
    threadTags: ['Scaling', 'Reliability', 'FinOps'],
    themeColor: 'from-indigo-600 to-purple-700',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    borderAccent: 'border-indigo-500/40',
    onlineCount: 0,
    mission:
      'Master physical & logical Azure infrastructure: Availability Zones, compute tiers, private VNet/ExpressRoute links, and Blob storage redundancy.',
    keyTopics: [
      'Azure Geographies, Regions & Availability Zones (Min. 3 Zones per Region)',
      'Region Pairs (300+ miles separation for regional disaster recovery)',
      'Compute Comparison: VMs vs VMSS vs App Services vs ACI vs AKS',
      'Networking: VNets, Subnets, VPN Gateway vs ExpressRoute (Private Fiber)',
      'Storage Redundancy: LRS, ZRS, GRS, GZRS & Blob Tiers (Hot, Cool, Cold, Archive)',
    ],
    recommendedDuration: '35 Mins (Architect Drill)',
    defaultDurationSeconds: 35 * 60,
    ambianceLabel: 'Subsea Fiber Topology Lab',
    linkedChambers: [
      {
        targetId: 'AZ900-SECURITY',
        relationship: 'Secure VNets & Storage endpoints with Entra ID & NSGs',
        actionLabel: 'Handoff to Security Chamber',
      },
      {
        targetId: 'AZ900-GOVERNANCE',
        relationship: 'Lock storage tiers & enforce allowed regions via Policy',
        actionLabel: 'Send to Governance Arena',
      },
      {
        targetId: 'AZ900-CLINIC',
        relationship: 'Dissect ExpressRoute vs VPN & Archive rehydration traps',
        actionLabel: 'Escalate to Traps Clinic',
      },
    ],
    activePeers: [
      { name: 'Tariq', avatar: '👨🏾‍💻', location: 'Lagos, NG', role: 'Infrastructure Specialist' },
      { name: 'Elena', avatar: '👩🏻‍💻', location: 'Madrid, ES', role: 'Systems Engineer' },
      { name: 'Mwangi', avatar: '👨🏾‍💻', location: 'Mombasa, KE', role: 'Network Architect' },
    ],
    topicCues: [
      'ExpressRoute never traverses the public internet; it uses private fiber circuits via a connectivity provider.',
      'Availability Zones protect against datacenter failures within a region using independent power & cooling.',
      'Blob Archive tier is offline and requires hours of rehydration latency before reads.',
    ],
  },
  {
    id: 'AZ900-SECURITY',
    name: 'Entra ID Security & Zero Trust Chamber',
    shortCode: 'Security Chamber',
    tagline: 'Verify Explicitly, Least Privilege, MFA, RBAC & Conditional Access',
    domainFocus: 'Identity, Access & Zero Trust (Path 2 · M7)',
    examWeight: '15–20%',
    pathId: 2,
    moduleIds: [7],
    threadTags: ['Security', 'Responsibility'],
    themeColor: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    borderAccent: 'border-emerald-500/40',
    onlineCount: 0,
    mission:
      'Fortify identity as the primary security perimeter using Microsoft Entra ID, Conditional Access, Defense-in-Depth rings, and Defender/Sentinel.',
    keyTopics: [
      'Microsoft Entra ID (AuthN: Who you are) vs Azure RBAC (AuthZ: What you can do)',
      'Zero Trust Principles: Verify explicitly, Least privilege, Assume breach',
      'Conditional Access: Signals (User, IP, Device) -> Decision -> Enforcement (MFA/Block)',
      'Defense in Depth Layers: Physical -> Identity -> Perimeter -> Network -> Compute -> App -> Data',
      'Microsoft Defender for Cloud (Posture) & Microsoft Sentinel (SIEM/SOAR)',
    ],
    recommendedDuration: '30 Mins (Zero Trust Sprint)',
    defaultDurationSeconds: 30 * 60,
    ambianceLabel: 'Zero Trust SecOps Chamber',
    linkedChambers: [
      {
        targetId: 'AZ900-GOVERNANCE',
        relationship: 'Contrast RBAC authorization against Azure Policy & Locks',
        actionLabel: 'Bridge to Governance Arena',
      },
      {
        targetId: 'AZ900-SERVICES',
        relationship: 'Apply NSGs & Private Endpoints to VNet compute',
        actionLabel: 'Back to Services Lab',
      },
      {
        targetId: 'AZ900-CLINIC',
        relationship: 'Escalate Entra ID vs RBAC vs Policy exam confusions',
        actionLabel: 'Escalate to Traps Clinic',
      },
    ],
    activePeers: [
      { name: 'Amina', avatar: '👩🏾‍💻', location: 'Nairobi, KE', role: 'Security Compliance Lead' },
      { name: 'Kiprono', avatar: '👨🏾‍💻', location: 'Eldoret, KE', role: 'Identity Admin' },
      { name: 'Zainab', avatar: '👩🏽‍💻', location: 'Alexandria, EG', role: 'Cloud SecOps' },
    ],
    topicCues: [
      'Entra ID proves identity (Authentication); Azure RBAC controls access scope (Authorization).',
      'Conditional Access requires Entra ID P1+ and evaluates risk signals before granting tokens.',
      'Defense in Depth protects through 7 layered rings so a single breach stays contained.',
    ],
  },
  {
    id: 'AZ900-GOVERNANCE',
    name: 'Governance, Policy & Cost Arena',
    shortCode: 'Governance Arena',
    tagline: 'Azure Policy, Resource Locks Precedence, Cost Budgets & Azure Arc',
    domainFocus: 'Describe Azure Management & Governance (Path 3 · M8–M12)',
    examWeight: '30–35%',
    pathId: 3,
    moduleIds: [8, 9, 10, 11, 12],
    threadTags: ['Security', 'FinOps', 'Hybrid/IaC'],
    themeColor: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-600 dark:text-amber-400',
    borderAccent: 'border-amber-500/40',
    onlineCount: 0,
    mission:
      'Master governance scope inheritance, CanNotDelete lock precedence over Owners, Cost Management vs Calculators, ARM/Bicep, and Azure Arc.',
    keyTopics: [
      'Azure Policy vs Initiatives (Compliance enforcement across ARM control plane)',
      'Resource Locks: ReadOnly vs CanNotDelete (Overrides Owner RBAC delete)',
      'Microsoft Purview: Data governance, lineage & sensitivity classification',
      'Cost Management + Budgets vs Pricing Calculator vs TCO Calculator',
      'Azure Arc & Bicep: Declarative IaC and hybrid/multi-cloud management',
    ],
    recommendedDuration: '25 Mins (Governance Drill)',
    defaultDurationSeconds: 25 * 60,
    ambianceLabel: 'Enterprise Governance Control Plane',
    linkedChambers: [
      {
        targetId: 'AZ900-WAR-ROOM',
        relationship: 'All 3 domains aligned? Advance to 45-min timed simulation',
        actionLabel: 'Advance to War Room Sim',
      },
      {
        targetId: 'AZ900-SECURITY',
        relationship: 'Verify identity + RBAC scope boundaries in ARM',
        actionLabel: 'Cross-check Security Chamber',
      },
      {
        targetId: 'AZ900-CLINIC',
        relationship: 'Send Policy vs RBAC vs Locks traps to Clinic',
        actionLabel: 'Escalate to Traps Clinic',
      },
    ],
    activePeers: [
      { name: 'Wanjiku', avatar: '👩🏾‍💻', location: 'Nakuru, KE', role: 'FinOps Lead' },
      { name: 'Kwame', avatar: '👨🏿‍💻', location: 'Kumasi, GH', role: 'Enterprise Governance' },
      { name: 'Sarah', avatar: '👩🏾‍💻', location: 'Kigali, RW', role: 'Cloud Auditor' },
    ],
    topicCues: [
      'Even a Subscription Owner CANNOT delete a resource with a CanNotDelete lock until the lock is removed.',
      'Pricing Calculator estimates future monthly bills; TCO Calculator compares on-prem migration savings.',
      'Azure Arc projects on-prem, AWS, and GCP servers directly into Azure Resource Manager.',
    ],
  },
  {
    id: 'AZ900-WAR-ROOM',
    name: '45-Minute Timed Mock Exam War Room',
    shortCode: 'War Room Sim',
    tagline: 'High-Stakes Timed Simulation: Balanced 3-Path Sprint & 700 Cut-off',
    domainFocus: 'Full Exam Simulation (All 3 Paths · M1–M12)',
    examWeight: '100% Comprehensive',
    moduleIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    threadTags: ['Scaling', 'Reliability', 'Security', 'Responsibility', 'FinOps', 'Hybrid/IaC'],
    themeColor: 'from-rose-600 to-red-800',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
    badgeText: 'text-rose-600 dark:text-rose-400',
    borderAccent: 'border-rose-500/40',
    onlineCount: 0,
    mission:
      'Execute realistic exam-pace timed sprints spanning all 3 AZ-900 domains, calculate scaled score (/1000 vs 700 pass), and route misses into Traps Clinic.',
    keyTopics: [
      'Pacing Strategy: ~55 seconds average per scenario question',
      'Passing Threshold: 700 / 1000 scaled points (70% baseline)',
      'Balanced Weighting: Cloud Concepts (25–30%), Architecture (35–40%), Governance (30–35%)',
      'Distractor Elimination: Rapidly striking 2 clearly invalid services',
      'Post-Sprint Feedback Loop: Auto-feed missed items to Traps Clinic',
    ],
    recommendedDuration: '45 Mins (Full Timed Mock)',
    defaultDurationSeconds: 45 * 60,
    ambianceLabel: 'Silent Exam Room Countdown Clock',
    linkedChambers: [
      {
        targetId: 'AZ900-CLINIC',
        relationship: 'Automatically send missed or flagged War Room questions to Clinic',
        actionLabel: 'Route Misses to Traps Clinic',
      },
      {
        targetId: 'AZ900-SERVICES',
        relationship: 'Weak on 35–40% Architecture? Drill Services Lab',
        actionLabel: 'Patch in Services Lab',
      },
      {
        targetId: 'AZ900-GOVERNANCE',
        relationship: 'Weak on 30–35% Policy & Cost? Review Governance Arena',
        actionLabel: 'Patch in Governance Arena',
      },
    ],
    activePeers: [
      { name: 'David', avatar: '👨🏾‍💻', location: 'Nairobi, KE', role: 'Exam Candidate' },
      { name: 'Grace', avatar: '👩🏾‍💻', location: 'Kampala, UG', role: 'Exam Candidate' },
      { name: 'Samuel', avatar: '👨🏿‍💻', location: 'Abidjan, CI', role: 'Exam Candidate' },
    ],
    topicCues: [
      'Do not spend more than 90 seconds on any single question; flag it for final review.',
      'There is NO negative marking for wrong answers on Microsoft exams—answer every item.',
      'Read the final question sentence first on long enterprise migration scenarios.',
    ],
  },
  {
    id: 'AZ900-CLINIC',
    name: 'Rapid Distractor & Exam Traps Clinic',
    shortCode: 'Traps Clinic',
    tagline: 'Triage Missed Items, Escalated Questions & Confusing Keywords',
    domainFocus: 'Escalated Queue, Weak Areas & Distractor Autopsy',
    examWeight: 'High Failure Rate Items',
    moduleIds: [2, 5, 6, 7, 8, 9, 11, 12],
    threadTags: ['Security', 'Reliability', 'FinOps', 'Hybrid/IaC'],
    themeColor: 'from-amber-500 to-yellow-600',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-600 dark:text-amber-400',
    borderAccent: 'border-amber-500/40',
    onlineCount: 0,
    mission:
      'Receive live handoffs & missed items from every chamber, dissect confusing service pairs side-by-side, and clear weak spots before retesting.',
    keyTopics: [
      'ExpressRoute vs VPN Gateway (Private Fiber vs Public Internet IPsec)',
      'Resource Locks vs RBAC vs Azure Policy precedence',
      'LRS vs ZRS vs GRS vs GZRS durability & 300+ mile failover',
      'Archive vs Cold Blob Storage rehydration latency traps',
      'Azure Advisor (Recommendations) vs Monitor (Telemetry) vs Service Health',
    ],
    recommendedDuration: '20 Mins (Rapid Trap Triage)',
    defaultDurationSeconds: 20 * 60,
    ambianceLabel: 'Trap Autopsy & Triage Focus',
    linkedChambers: [
      {
        targetId: 'AZ900-WAR-ROOM',
        relationship: 'Traps cleared? Re-enter War Room timed simulation to verify mastery',
        actionLabel: 'Retest in War Room',
      },
      {
        targetId: 'AZ900-SECURITY',
        relationship: 'Revisit identity & RBAC fundamentals in Security Chamber',
        actionLabel: 'Verify in Security Chamber',
      },
      {
        targetId: 'AZ900-CONCEPTS',
        relationship: 'Reinforce cloud principles & SLA math in Concepts Hub',
        actionLabel: 'Verify in Concepts Hub',
      },
    ],
    activePeers: [
      { name: 'Brian', avatar: '👨🏾‍💻', location: 'Nairobi, KE', role: 'Cohort Mentor' },
      { name: 'Nadia', avatar: '👩🏽‍💻', location: 'Tunis, TN', role: 'Trap Specialist' },
      { name: 'Ochieng', avatar: '👨🏾‍💻', location: 'Kisumu, KE', role: 'Cloud Explorer' },
    ],
    topicCues: [
      'Azure Advisor generates best-practice RECOMMENDATIONS; Azure Monitor collects METRICS & LOGS.',
      'Public Cloud still protects tenant data via private VNets and encryption—never assume public visibility.',
      'CanNotDelete locks block deletion even for Subscription Owners.',
    ],
  },
];

export function getStudyAreaById(areaId?: string): VirtualStudyArea {
  if (!areaId) return VIRTUAL_STUDY_AREAS[0];
  const normalized = areaId.trim().toUpperCase();
  const exact = VIRTUAL_STUDY_AREAS.find((a) => a.id.toUpperCase() === normalized);
  if (exact) return exact;
  const partial = VIRTUAL_STUDY_AREAS.find((a) => a.id.toUpperCase().includes(normalized));
  return partial || VIRTUAL_STUDY_AREAS[0];
}

export function getQuestionsForStudyArea(
  areaId: string,
  allQuestions: Question[],
  stats?: UserStats
): Question[] {
  const normalized = areaId.trim().toUpperCase();
  if (!allQuestions || allQuestions.length === 0) return [];

  if (normalized === 'AZ900-CONCEPTS') {
    const matched = allQuestions.filter((q) => q.learningPathId === 1 || q.moduleId <= 3);
    return matched.length > 0 ? matched : allQuestions;
  }

  if (normalized === 'AZ900-SERVICES') {
    const matched = allQuestions.filter(
      (q) => q.moduleId === 4 || q.moduleId === 5 || q.moduleId === 6
    );
    return matched.length > 0 ? matched : allQuestions;
  }

  if (normalized === 'AZ900-SECURITY') {
    const matched = allQuestions.filter((q) => {
      if (q.moduleId === 7) return true;
      const hay = `${q.scenario} ${q.question} ${q.moduleTitle}`.toLowerCase();
      return (
        hay.includes('entra') ||
        hay.includes('zero trust') ||
        hay.includes('mfa') ||
        hay.includes('conditional access') ||
        hay.includes('rbac') ||
        hay.includes('defender') ||
        hay.includes('sentinel') ||
        hay.includes('nsg')
      );
    });
    return matched.length > 0 ? matched : allQuestions;
  }

  if (normalized === 'AZ900-GOVERNANCE') {
    const matched = allQuestions.filter((q) => q.learningPathId === 3 || q.moduleId >= 8);
    return matched.length > 0 ? matched : allQuestions;
  }

  if (normalized === 'AZ900-CLINIC') {
    const mistakeIds = new Set(
      (stats?.mistakesHistory || [])
        .filter((m) => !(stats?.reviewedMistakeIds || []).includes(m.questionId))
        .map((m) => m.questionId)
    );
    const lowConfidenceIds = new Set(
      Object.entries(stats?.confidenceScores || {})
        .filter(([, score]) => score <= 2)
        .map(([id]) => id)
    );

    const prioritized = allQuestions.filter(
      (q) =>
        mistakeIds.has(q.id) ||
        lowConfidenceIds.has(q.id) ||
        q.difficulty === 'Advanced' ||
        (q.distractorBreakdown || []).length >= 3
    );

    // Put active user mistakes & low confidence items at the very front
    prioritized.sort((a, b) => {
      const aUrgent = mistakeIds.has(a.id) || lowConfidenceIds.has(a.id) ? 1 : 0;
      const bUrgent = mistakeIds.has(b.id) || lowConfidenceIds.has(b.id) ? 1 : 0;
      return bUrgent - aUrgent;
    });

    return prioritized.length > 0 ? prioritized : allQuestions;
  }

  // AZ900-WAR-ROOM or general comprehensive pool: balanced mix prioritizing Intermediate/Advanced & full coverage
  return allQuestions;
}

export function computeChamberMasteryPct(
  areaId: string,
  stats: UserStats
): { masteryPct: number | null; attemptedCount: number; correctCount: number } {
  const area = getStudyAreaById(areaId);
  let correctCount = 0;
  let attemptedCount = 0;

  for (const modId of area.moduleIds) {
    const m = stats.moduleMastery?.[modId];
    if (m && m.total > 0) {
      correctCount += m.correct;
      attemptedCount += m.total;
    }
  }

  return {
    masteryPct: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : null,
    attemptedCount,
    correctCount,
  };
}
