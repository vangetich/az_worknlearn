// Official AZ-900 Virtual Study Room Areas mapped to official exam objectives, domain weights, and peer cohorts

export interface VirtualStudyArea {
  id: string; // Authoritative Room ID, e.g. 'AZ900-CONCEPTS'
  name: string;
  shortCode: string;
  tagline: string;
  domainFocus: string;
  examWeight: string;
  pathId?: 1 | 2 | 3;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  onlineCount: number;
  mission: string;
  keyTopics: string[];
  recommendedDuration: string;
  ambianceLabel: string;
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
    tagline: 'CapEx vs OpEx, Consumption Models, and Shared Responsibility Matrix',
    domainFocus: 'Describe Cloud Concepts (Path 1)',
    examWeight: '25–30%',
    pathId: 1,
    themeColor: 'from-blue-600 to-sky-700',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeText: 'text-blue-600',
    borderAccent: 'border-blue-500/40',
    onlineCount: 8,
    mission: 'Solidify foundational cloud definitions, financial expenditure tradeoffs, and boundary lines between customer and cloud provider.',
    keyTopics: [
      'CapEx (Upfront Infrastructure) vs OpEx (Pay-As-You-Go)',
      'Consumption-based Pricing Model (Elastic Scaling)',
      'Shared Responsibility Matrix (IaaS vs PaaS vs SaaS)',
      'Cloud Deployment Models: Public, Private, Hybrid & Multi-Cloud',
      'High Availability, Scalability, Elasticity, Agility & Disaster Recovery',
    ],
    recommendedDuration: '25 Mins (Pomodoro)',
    ambianceLabel: 'Nairobi Silicon Savannah Lofi',
    activePeers: [
      { name: 'Amara', avatar: '👩🏾‍💻', location: 'Nairobi, KE', role: 'Solutions Architect Track' },
      { name: 'Kofi', avatar: '👨🏿‍💻', location: 'Accra, GH', role: 'DevOps Track' },
      { name: 'Fatima', avatar: '👩🏽‍💻', location: 'Cairo, EG', role: 'Cloud Economics Scholar' },
    ],
    topicCues: [
      'Remember: In SaaS, Microsoft manages physical hosts, OS, and application; you only manage data & devices.',
      'Serverless computing eliminates idle server costs; you pay only per function execution duration.',
      'SLA formulas: 99.9% uptime permits ~43.8 minutes of unplanned downtime per month.',
    ],
  },
  {
    id: 'AZ900-SERVICES',
    name: 'Core Architecture & Services Lab',
    shortCode: 'Services Lab',
    tagline: 'Regions, Availability Zones, VMs, Containers & Storage Redundancy',
    domainFocus: 'Describe Azure Architecture & Services (Path 2)',
    examWeight: '35–40%',
    pathId: 2,
    themeColor: 'from-indigo-600 to-purple-700',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    badgeText: 'text-indigo-600',
    borderAccent: 'border-indigo-500/40',
    onlineCount: 14,
    mission: 'Explore physical and logical Azure infrastructure: availability zones, compute options, networking tunnels, and tiered blob storage.',
    keyTopics: [
      'Azure Geographies, Regions & Availability Zones (Min. 3 Zones per Region)',
      'Region Pairs (At least 300 miles separation for disaster recovery)',
      'Compute Comparison: Virtual Machines vs App Services vs ACI vs AKS',
      'Virtual Networking: VNets, Subnets, VPN Gateway & ExpressRoute (Private Line)',
      'Storage Redundancy: LRS, ZRS, GRS, GZRS & Access Tiers (Hot, Cool, Cold, Archive)',
    ],
    recommendedDuration: '35 Mins (Architect Drill)',
    ambianceLabel: 'Subsea Cable Fiber Optic Stream',
    activePeers: [
      { name: 'Tariq', avatar: '👨🏾‍💻', location: 'Lagos, NG', role: 'Infrastructure Specialist' },
      { name: 'Elena', avatar: '👩🏻‍💻', location: 'Madrid, ES', role: 'Systems Engineer' },
      { name: 'Mwangi', avatar: '👨🏾‍💻', location: 'Mombasa, KE', role: 'Network Architect' },
    ],
    topicCues: [
      'ExpressRoute never travels over the public internet; it uses private fiber leased lines.',
      'Availability Zones protect against datacenter failures within a region with independent power & cooling.',
      'Blob Archive tier requires hours of rehydration latency before blobs can be read or modified.',
    ],
  },
  {
    id: 'AZ900-SECURITY',
    name: 'Entra ID Security & Zero Trust Chamber',
    shortCode: 'Security Chamber',
    tagline: 'Verify Explicitly, Least Privilege, MFA & Conditional Access',
    domainFocus: 'Identity, Access & Zero Trust (Path 2)',
    examWeight: '15–20%',
    pathId: 2,
    themeColor: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'text-emerald-600',
    borderAccent: 'border-emerald-500/40',
    onlineCount: 9,
    mission: 'Fortify your understanding of identity as the primary security perimeter using Microsoft Entra ID and Zero Trust guidelines.',
    keyTopics: [
      'Microsoft Entra ID (formerly Azure AD) vs Active Directory Domain Services',
      'Zero Trust 3 Core Principles: 1) Verify explicitly, 2) Least privilege, 3) Assume breach',
      'Conditional Access: Signals (User, IP, Device) -> Decision -> Enforcement (MFA, Block)',
      'Role-Based Access Control (RBAC): Built-in Owner, Contributor, Reader, User Access Admin',
      'Microsoft Defender for Cloud (Posture Management) & Microsoft Sentinel (SIEM/SOAR)',
    ],
    recommendedDuration: '30 Mins (Zero Trust Sprint)',
    ambianceLabel: 'Cyber Defense White Noise',
    activePeers: [
      { name: 'Amina', avatar: '👩🏾‍💻', location: 'Nairobi, KE', role: 'Security Compliance Lead' },
      { name: 'Kiprono', avatar: '👨🏾‍💻', location: 'Eldoret, KE', role: 'Identity Admin' },
      { name: 'Zainab', avatar: '👩🏽‍💻', location: 'Alexandria, EG', role: 'Cloud SecOps' },
    ],
    topicCues: [
      'RBAC assigns access permissions to Azure resources; Entra ID roles assign administrative directory permissions.',
      'Conditional Access requires at least Microsoft Entra ID P1 license; evaluate signals before allowing access.',
      'Defense in Depth requires multiple rings: Physical -> Identity -> Perimeter -> Network -> Compute -> Application -> Data.',
    ],
  },
  {
    id: 'AZ900-GOVERNANCE',
    name: 'Governance, Policy & Cost Arena',
    shortCode: 'Governance Arena',
    tagline: 'Azure Policy Compliance, Resource Locks Precedence & Cost Budgets',
    domainFocus: 'Describe Azure Management & Governance (Path 3)',
    examWeight: '30–35%',
    pathId: 3,
    themeColor: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'text-amber-600',
    borderAccent: 'border-amber-500/40',
    onlineCount: 11,
    mission: 'Master corporate compliance guardrails, cost alerts, multi-cloud Azure Arc management, and resource lock hierarchies.',
    keyTopics: [
      'Azure Policy vs Initiatives (Policy Sets for regulatory compliance like ISO/PCI)',
      'Resource Locks: ReadOnly vs CanNotDelete (Always overrides RBAC Owner delete permissions)',
      'Microsoft Purview: Automated metadata cataloging & sensitive data governance',
      'Azure Cost Management + Billing: Budgets, Cost Alerts, Pricing & TCO Calculators',
      'Azure Arc: Extend ARM templates and Azure Policy to on-premises and multi-cloud servers',
    ],
    recommendedDuration: '25 Mins (Governance Drill)',
    ambianceLabel: 'Focused Rainfall & Soft Alpha Waves',
    activePeers: [
      { name: 'Wanjiku', avatar: '👩🏾‍💻', location: 'Nakuru, KE', role: 'Financial FinOps Lead' },
      { name: 'Kwame', avatar: '👨🏿‍💻', location: 'Kumasi, GH', role: 'Enterprise Governance' },
      { name: 'Sarah', avatar: '👩🏾‍💻', location: 'Kigali, RW', role: 'Cloud Auditor' },
    ],
    topicCues: [
      'CRITICAL: Even a Subscription Owner CANNOT delete a resource locked with CanNotDelete without unlocking it first.',
      'Pricing Calculator estimates monthly operational costs; TCO Calculator compares on-prem datacenter migration savings.',
      'Azure Policy enforces compliance at resource creation time; it does not replace role-based authorization.',
    ],
  },
  {
    id: 'AZ900-WAR-ROOM',
    name: '45-Minute Timed Mock Exam War Room',
    shortCode: 'War Room Sim',
    tagline: 'High-Stakes Timed Simulation: 35-45 Questions, 700 Passing Cut-off',
    domainFocus: 'Full Exam Simulation (All 3 Paths)',
    examWeight: '100% Comprehensive',
    themeColor: 'from-rose-600 to-red-800',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    badgeText: 'text-rose-600',
    borderAccent: 'border-rose-500/40',
    onlineCount: 18,
    mission: 'Experience true test-center pressure: 45-minute countdown clock, timed question pacing, no intermediate answers, and final scaled score calculation.',
    keyTopics: [
      'Pacing Strategy: ~55 seconds average per scenario question',
      'Passing Threshold: 700 / 1000 scaled points (70% minimum)',
      'Question Structure: Single-choice, multi-choice, drag-and-drop hot-spot matching',
      'Distractor Elimination: Swiftly crossing off 2 clearly wrong options',
      'Flag for Review: Marking uncertain questions for final 5-minute sweep',
    ],
    recommendedDuration: '45 Mins (Full Timed Mock)',
    ambianceLabel: 'Silent Exam Room Countdown Clock',
    activePeers: [
      { name: 'David', avatar: '👨🏾‍💻', location: 'Nairobi, KE', role: 'Exam Candidate' },
      { name: 'Grace', avatar: '👩🏾‍💻', location: 'Kampala, UG', role: 'Exam Candidate' },
      { name: 'Samuel', avatar: '👨🏿‍💻', location: 'Abidjan, CI', role: 'Exam Candidate' },
    ],
    topicCues: [
      'Do not spend more than 90 seconds on any single question; flag it and proceed.',
      'There is NO negative marking for wrong answers on Microsoft certification exams; always answer every question.',
      'Read the final sentence of long scenario questions first to immediately identify the core requirement.',
    ],
  },
  {
    id: 'AZ900-CLINIC',
    name: 'Rapid Distractor & Exam Traps Clinic',
    shortCode: 'Traps Clinic',
    tagline: 'Dissect Confusing Keywords, Subtleties, and High-Failure Questions',
    domainFocus: 'Edge Cases & Confusing Distractors',
    examWeight: 'High Failure Rate Items',
    themeColor: 'from-amber-500 to-yellow-600',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'text-amber-600',
    borderAccent: 'border-amber-500/40',
    onlineCount: 12,
    mission: 'Deconstruct trick questions and distractor patterns where students commonly confuse similar services or oversight keywords.',
    keyTopics: [
      'ExpressRoute vs Site-to-Site VPN: Which traverses the public internet?',
      'Resource Locks vs RBAC: Can an Owner delete a CanNotDelete locked SQL Database?',
      'GRS vs ZRS: Which provides geographical resilience 300+ miles away?',
      'Archive vs Cold Blob Storage: Rehydration latency traps',
      'Azure Advisor vs Azure Monitor: Recommendations vs Telemetry & Metrics',
    ],
    recommendedDuration: '20 Mins (Rapid Trap Triage)',
    ambianceLabel: 'Rapid Synapse Focus Beats',
    activePeers: [
      { name: 'Brian', avatar: '👨🏾‍💻', location: 'Nairobi, KE', role: 'Tutor Assistant' },
      { name: 'Nadia', avatar: '👩🏽‍💻', location: 'Tunis, TN', role: 'Trap Specialist' },
      { name: 'Ochieng', avatar: '👨🏾‍💻', location: 'Kisumu, KE', role: 'Cloud Explorer' },
    ],
    topicCues: [
      'TRAP: Azure Advisor generates best practice RECOMMENDATIONS; Azure Monitor collects METRICS & LOGS.',
      'TRAP: Public Cloud does NOT mean data is publicly visible; it means multi-tenant hardware owned by Microsoft.',
      'TRAP: Serverless computing STILL runs on physical servers; the difference is the customer does not manage or provision them.',
    ],
  },
];

export function getStudyAreaById(areaId?: string): VirtualStudyArea {
  if (!areaId) return VIRTUAL_STUDY_AREAS[0];
  const normalized = areaId.trim().toUpperCase();
  const found = VIRTUAL_STUDY_AREAS.find(
    (a) => a.id.toUpperCase() === normalized || a.id.toUpperCase().includes(normalized)
  );
  return found || VIRTUAL_STUDY_AREAS[0];
}
