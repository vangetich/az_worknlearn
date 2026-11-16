import type { Question } from './quiz';

export type PrintableExamTrack =
  | 'balanced'
  | 'path-1'
  | 'path-2'
  | 'path-3'
  | 'weak-areas'
  | 'progressive'
  | 'scenario-only'
  | 'tricky-traps'
  | 'unseen-fresh';

export interface PrintableExamTrackInfo {
  id: PrintableExamTrack;
  label: string;
  shortLabel: string;
  description: string;
  focusBadge: string;
}

export const PRINTABLE_EXAM_TRACKS: PrintableExamTrackInfo[] = [
  {
    id: 'balanced',
    label: 'Official AZ-900 Blueprint Mix',
    shortLabel: 'Official Mix',
    description:
      'Proportional coverage matching Microsoft exam weights: Path 1 (27%), Path 2 (40%), Path 3 (33%).',
    focusBadge: 'P1 27% · P2 40% · P3 33%',
  },
  {
    id: 'path-1',
    label: 'Path 1 Focus: Cloud Concepts',
    shortLabel: 'Path 1 Only',
    description:
      'Concentrated practice across Modules 1–3: Cloud Models, IaaS/PaaS/SaaS, CapEx vs OpEx, Elasticity & Shared Responsibility.',
    focusBadge: 'Modules 1–3',
  },
  {
    id: 'path-2',
    label: 'Path 2 Focus: Architecture & Services',
    shortLabel: 'Path 2 Only',
    description:
      'Deep focus on Modules 4–7: Regions, Availability Zones, Compute, VNet/ExpressRoute, Storage Tiers & Entra ID.',
    focusBadge: 'Modules 4–7',
  },
  {
    id: 'path-3',
    label: 'Path 3 Focus: Management & Governance',
    shortLabel: 'Path 3 Only',
    description:
      'Targeted drill across Modules 8–12: Cost Management, Azure Policy, RBAC, Resource Locks, Monitoring & Azure Arc.',
    focusBadge: 'Modules 8–12',
  },
  {
    id: 'weak-areas',
    label: 'Master Weak Areas',
    shortLabel: 'Weak Areas',
    description:
      'Automatically prioritizes your recorded misses, skipped items, low-confidence topics, and modules below 75% accuracy.',
    focusBadge: 'Adaptive Targeting',
  },
  {
    id: 'progressive',
    label: 'Progressively Harder Ladder',
    shortLabel: 'Progressive',
    description:
      'Structured difficulty ramp from Part I Fundamental warm-ups through Part II Intermediate scenarios to Part III Advanced traps.',
    focusBadge: 'Tier 1 -> Tier 3',
  },
  {
    id: 'scenario-only',
    label: 'Scenario-Only Case Studies',
    shortLabel: 'Scenarios Only',
    description:
      'Real-world enterprise architecture and migration vignettes requiring constraint analysis before picking the best Azure solution.',
    focusBadge: 'Case Studies',
  },
  {
    id: 'tricky-traps',
    label: 'Exam Traps & Confusable Pairs',
    shortLabel: 'Exam Traps',
    description:
      'High-confusion contrasts: Policy vs RBAC vs Locks, VPN vs ExpressRoute, Availability Sets vs Zones, LRS vs ZRS vs GRS.',
    focusBadge: 'High-Yield Traps',
  },
  {
    id: 'unseen-fresh',
    label: 'Unseen & Google-Sourced Fresh',
    shortLabel: 'Fresh & Unseen',
    description:
      'Prioritizes questions freshly sourced via Google Search and scenarios you have never attempted yet in the studio.',
    focusBadge: 'Fresh Bank',
  },
];

export interface GroundingSourceLink {
  title: string;
  uri: string;
}

export interface PrintableMockExam {
  id: string;
  title: string;
  track: PrintableExamTrack;
  questionCount: number; // Strictly 20..45
  questions: Question[];
  sourcedViaGoogleCount: number;
  groundingSources: GroundingSourceLink[];
  includeAnswerKey: boolean;
  includeExplanations: boolean;
  showMetadataHints: boolean;
  includeBubbleSheet: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
