import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  CheckCircle,
  XCircle,
  Bookmark,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Info,
  Check,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Maximize2,
  Minimize2,
  FileText,
  Zap,
  Users,
  Volume2,
  VolumeX,
  Square,
  Share2,
  Clock,
  Timer,
  StickyNote,
  Trash2,
  Filter,
  Mic,
  MicOff,
  ShieldCheck,
  Lock,
  Unlock,
  QrCode,
  ChevronDown,
  SlidersHorizontal,
  Layers,
  SkipForward,
  Download,
  Anchor,
  TrendingUp,
  TrendingDown,
  GitBranch,
  ArrowLeftRight,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';
import { KeyConceptSidePanel, extractScenarioTerminology } from './KeyConceptSidePanel';
import { ScenarioTextWithTooltips } from './ScenarioTextWithTooltips';
import { QuickNotesDrawer } from './QuickNotesDrawer';
import { getQuestionNote, saveQuestionNote, markQuestionSkipped } from '../utils/storage';
import { ShareQuestionModal } from './ShareQuestionModal';
import { QuickStudyOverlay } from './QuickStudyOverlay';
import { DeepWorkTimerWidget } from './DeepWorkTimerWidget';
import { SessionCountdownTimer } from './SessionCountdownTimer';
import {
  PersistentExamTimer,
  TARGET_PACE_STORAGE_KEY,
  TARGET_PACE_OPTIONS,
} from './PersistentExamTimer';
import { QuizTtsBar } from './QuizTtsBar';
import { HoverInfoFeedback } from './HoverInfoFeedback';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import {
  downloadNotesAndMemoryAnchorsMarkdown,
  saveMemoryAnchor,
  isMemoryAnchorSaved,
} from '../utils/exportNotesMarkdown';
import { KeyboardShortcutGuidePopover } from './KeyboardShortcutGuide';
import { getThreadTagsForQuestion, ThreadTagMeta } from '../data/azureThemesData';
import { ThreadTagBadge } from './ThreadTagBadge';
import { ThreadContextModal } from './ThreadContextModal';

interface QuizCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onBookmark: (questionId: string) => void;
  isBookmarked: boolean;
  onAskTutorAboutQuestion?: (question: Question) => void;
  onOpenAiTutorDrawer?: (question: Question, selectedOption?: string | null) => void;
  isAiTutorDrawerOpen?: boolean;
  stats?: UserStats;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  dynamicDifficulty?: 'Fundamental' | 'Intermediate' | 'Advanced';
  consecutiveStreak?: number;
  isDynamicDifficultyEnabled?: boolean;
  onToggleDynamicDifficulty?: () => void;
  lockedDifficulty?: 'Fundamental' | 'Intermediate' | 'Advanced' | null;
  onChangeLockedDifficulty?: (nextLock: 'Fundamental' | 'Intermediate' | 'Advanced' | null) => void;
  selectedDifficultyFilter?: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced';
  onSelectDifficultyFilter?: (nextFilter: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced') => void;
  onOpenStudyRoom?: () => void;
  onFinishSession?: () => void;
  onOpenPersonalizedReview?: () => void;
  unresolvedMistakesCount?: number;
  sessionAnsweredCount?: number;
  onToggleRetryIncorrectInPath?: (pathId: 1 | 2 | 3) => void;
  isRetryingIncorrectInPath?: boolean;
  incorrectCountInCurrentPath?: number;
  isAudioMuted?: boolean;
  rollingAverageAccuracy?: number | null;
  rollingWindowCount?: number;
  activeQuickFilter?: 'all' | 'bookmarks' | 'notes' | 'ai' | 'mistakes' | 'retry-queue' | 'confidence';
  onSelectQuickFilter?: (
    nextFilter: 'all' | 'bookmarks' | 'notes' | 'ai' | 'mistakes' | 'retry-queue' | 'confidence'
  ) => void;
  bookmarksCount?: number;
  confidenceCount?: number;
  savedNotesCount?: number;
  aiScenariosCount?: number;
  retryQueueCount?: number;
  retryQueueSecondsLeft?: number;
  questionSortOrder?: 'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first';
  onChangeSortOrder?: (
    nextSort: 'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first'
  ) => void;
  onOpenMockExam?: () => void;
  onOpenAiGenerator?: () => void;
  onNavigateTab?: (
    tab: 'study-decks' | 'flashcards' | 'assistant' | 'adaptive' | 'history' | 'analytics'
  ) => void;
  showWorkspacePanels?: boolean;
  onToggleWorkspacePanels?: () => void;
  externalStudyZoneOpenTrigger?: number;
  onRateConfidence?: (questionId: string, confidence: number) => void;
  onOpenUserGuide?: () => void;
  onSkipQuestion?: (questionId: string) => void;
  onOpenPeerChallenge?: () => void;
  last5DifficultyImpactDelta?: number;
  last5AnsweredCount?: number;
  savedNoteText?: string;
  onUpdateSavedNote?: (questionId: string, text: string) => void;
  onOpenAccessibilitySettings?: () => void;
  externalOpenNotesDrawerTrigger?: number;
  onOpenAzureTheme?: (themeId: string, moduleId?: number) => void;
}

const EXAM_SIMULATION_DURATION_SECONDS = 45 * 60; // 45:00 standard AZ-900 exam duration

// Synthesize subtle Web Audio API sound effects ('ping' on correct, 'woosh' on incorrect)
function playAnswerFeedbackSound(isCorrect: boolean, isMuted: boolean) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (isCorrect) {
      // Soft harmonic 'ping' chime (D5 -> A5 gentle bell)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.11); // A5
      osc2.frequency.setValueAtTime(1174.66, now); // D6 harmonic

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.36);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
      setTimeout(() => ctx.close().catch(() => {}), 450);
    } else {
      // Soft low 'woosh' sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.26);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
      setTimeout(() => ctx.close().catch(() => {}), 380);
    }
  } catch {
    // Ignore audio context restrictions
  }
}

// Generate a concise 1-sentence foundational principle of the Azure service in the current question
function getFoundationalConceptSentence(question: Question): string {
  const firstSentenceMatch = question.whyCorrect.match(/^[^.!?]+[.!?]/);
  const coreSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : question.whyCorrect.trim();
  const correctOpt = question.options.find((o) => o.letter === question.correctAnswer);
  const serviceLabel = correctOpt ? correctOpt.text.replace(/\.$/, '') : `Module ${question.moduleId}`;
  if (coreSentence.toLowerCase().includes(serviceLabel.toLowerCase().slice(0, 12))) {
    return coreSentence;
  }
  return `${serviceLabel} — ${coreSentence}`;
}

// Map each incorrect option (distractor) to a specific common Azure architectural misconception & counter-rule
function getArchitecturalMisconceptionForDistractor(
  question: Question,
  distractorLetter: string,
  distractorReason: string
): {
  misconceptionName: string;
  domainTag: string;
  counterRule: string;
} {
  const optText =
    question.options.find((o) => o.letter === distractorLetter)?.text || '';
  const combined = `${optText} ${distractorReason} ${question.moduleTitle}`.toLowerCase();

  if (
    combined.includes('iaas') ||
    combined.includes('paas') ||
    combined.includes('saas') ||
    combined.includes('shared responsibility') ||
    combined.includes('operating system') ||
    combined.includes('physical')
  ) {
    return {
      misconceptionName: 'IaaS / PaaS / SaaS Shared Responsibility Boundary Confusion',
      domainTag: 'Cloud Concepts • Responsibility Matrix',
      counterRule:
        'Microsoft always manages physical hosts/datacenter; customers always manage Data, Endpoints & Identities. OS patching belongs to the customer only in IaaS.',
    };
  }
  if (
    combined.includes('availability zone') ||
    combined.includes('region pair') ||
    combined.includes('geography') ||
    combined.includes('sovereign')
  ) {
    return {
      misconceptionName: 'Availability Zone vs. Region Pair Blast-Radius Misconception',
      domainTag: 'Azure Architecture • High Availability & DR',
      counterRule:
        'Availability Zones protect against single-datacenter failures within 1 region (99.99% SLA); Region Pairs protect against wide-scale regional disasters 300+ miles apart.',
    };
  }
  if (
    combined.includes('expressroute') ||
    combined.includes('vpn') ||
    combined.includes('peering') ||
    combined.includes('bastion')
  ) {
    return {
      misconceptionName: 'Hybrid Connectivity & Network Transport Misconception',
      domainTag: 'Azure Networking • Hybrid Topology',
      counterRule:
        'VPN Gateway encrypts traffic over the public internet (IPsec/IKE); ExpressRoute uses a dedicated private fiber circuit bypassing the public internet.',
    };
  }
  if (
    combined.includes('lrs') ||
    combined.includes('zrs') ||
    combined.includes('grs') ||
    combined.includes('gzrs') ||
    combined.includes('archive') ||
    combined.includes('cool') ||
    combined.includes('hot')
  ) {
    return {
      misconceptionName: 'Storage Redundancy Scope vs. Access Tier Lifecycle Trap',
      domainTag: 'Azure Storage • Durability & Tiers',
      counterRule:
        'LRS (1 datacenter), ZRS (3 zones in 1 region), and GRS (2 regions) govern durability; Hot/Cool/Cold/Archive govern cost vs. retrieval latency.',
    };
  }
  if (
    combined.includes('policy') ||
    combined.includes('rbac') ||
    combined.includes('lock') ||
    combined.includes('entra') ||
    combined.includes('conditional access')
  ) {
    return {
      misconceptionName: 'RBAC Authorization vs. Azure Policy & Resource Lock Conflation',
      domainTag: 'Identity & Governance • Control Plane',
      counterRule:
        'Entra ID authenticates who you are; RBAC controls what actions a user can perform; Azure Policy enforces resource compliance properties; Locks block deletion/modification even for Owners.',
    };
  }
  if (
    combined.includes('capex') ||
    combined.includes('opex') ||
    combined.includes('pricing calculator') ||
    combined.includes('tco') ||
    combined.includes('cost management')
  ) {
    return {
      misconceptionName: 'Cloud Economics & Cost Estimation Tool Misconception',
      domainTag: 'Cost Management • FinOps',
      counterRule:
        'Pricing Calculator estimates new Azure workload costs; TCO Calculator compares on-premises migration savings; Cost Management tracks actual billed spend & budgets.',
    };
  }
  if (
    combined.includes('monitor') ||
    combined.includes('advisor') ||
    combined.includes('service health') ||
    combined.includes('sentinel') ||
    combined.includes('defender')
  ) {
    return {
      misconceptionName: 'Observability vs. Proactive Advisory & Security Posture Confusion',
      domainTag: 'Monitoring & Security • Operations',
      counterRule:
        'Azure Monitor collects metrics/logs; Service Health tracks Microsoft platform outages; Azure Advisor gives personalized best-practice recommendations.',
    };
  }

  return {
    misconceptionName: `Module ${question.moduleId} Architectural Constraint Mismatch`,
    domainTag: `${question.moduleTitle} • Exam Trap`,
    counterRule:
      'Always verify whether the scenario requires high availability, lowest operational overhead (PaaS/Serverless), or strict governance boundaries before selecting an option.',
  };
}

// Predefined child-friendly, non-technical ELI5 Azure analogies mapped to question concepts & modules
function getEli5AnalogyForQuestion(question: Question): {
  title: string;
  analogy: string;
  takeaway: string;
} {
  const combined = `${question.scenario} ${question.question} ${question.whyCorrect} ${question.moduleTitle}`.toLowerCase();

  if (combined.includes('shared responsibility') || combined.includes('iaas') || combined.includes('paas') || combined.includes('saas')) {
    return {
      title: 'The Apartment vs. Hotel Analogy (Shared Responsibility)',
      analogy:
        'Imagine living in a house: with IaaS, Microsoft builds the empty apartment building, and you bring your own furniture and cook your own food. With PaaS, Microsoft furnishes the kitchen and cleans the stove—you just bring your recipe and ingredients. With SaaS, it is like ordering at a restaurant! But in ALL three, you are always in charge of locking your own diary (your Data), holding your own phone (Endpoints), and deciding who gets a spare key (Accounts & Identities).',
      takeaway: 'No matter how much Microsoft manages the building, your Data, Devices, and Keys (Identities) always belong to you!',
    };
  }
  if (combined.includes('scale out') || combined.includes('scale up') || combined.includes('horizontal') || combined.includes('vertical') || combined.includes('elasticity')) {
    return {
      title: 'The Grocery Store Checkout Lanes (Scaling & Elasticity)',
      analogy:
        'Vertical Scaling (Scale Up) is like giving one cashier superpowers so they scan items twice as fast. Horizontal Scaling (Scale Out) is like opening 5 more checkout lanes when a big crowd arrives. Elasticity is an automatic sensor that opens extra lanes when the line gets long and closes them when shoppers go home!',
      takeaway: 'Scale Up = 1 bigger machine. Scale Out = more machines working together. Elasticity = automatic!',
    };
  }
  if (combined.includes('capex') || combined.includes('opex') || combined.includes('consumption')) {
    return {
      title: 'Buying a School Bus vs. Riding a City Bus (CapEx vs. OpEx)',
      analogy:
        'CapEx is like buying a whole school bus upfront with a giant piggy bank—even if it sits parked all summer. OpEx (Cloud) is like tapping a bus card only when you actually take a ride: zero upfront cost, and you only pay for the exact minutes you travel!',
      takeaway: 'CapEx = big upfront purchase. OpEx = pay-as-you-go for what you use right now.',
    };
  }
  if (combined.includes('availability zone') || combined.includes('region pair')) {
    return {
      title: 'Three Treehouses in One Backyard vs. Another City (AZs vs. Region Pairs)',
      analogy:
        'Availability Zones are 3 separate treehouses in the same neighborhood, each with its own flashlight and snack box—if one tree branch shakes, your friends hop to the next treehouse in seconds. A Region Pair is a backup clubhouse 300 miles away in another town in case a huge snowstorm hits your whole city!',
      takeaway: 'Same neighborhood, separate power = Availability Zones. 300+ miles away = Region Pairs.',
    };
  }
  if (combined.includes('expressroute') || combined.includes('vpn gateway') || combined.includes('peering')) {
    return {
      title: 'Public Highway Tunnel vs. Private Underground Train (VPN vs. ExpressRoute)',
      analogy:
        'A VPN Gateway is like driving an armored car on the busy public highway—your boxes are locked inside, but you still share the road with everyone else. ExpressRoute is your own private underground train track straight to Azure where nobody else is allowed!',
      takeaway: 'Encrypted over public internet = VPN Gateway. Private dedicated track bypassing the internet = ExpressRoute.',
    };
  }
  if (combined.includes('archive') || combined.includes('cool') || combined.includes('hot tier') || combined.includes('access tier')) {
    return {
      title: 'Backpack, Bedroom Closet, and Grandpa’s Attic (Storage Tiers)',
      analogy:
        'The Hot Tier is your school backpack—you grab pencils every 5 minutes, so it stays right beside you. The Cool/Cold Tier is your bedroom closet for winter jackets you only wear next month. The Archive Tier is a locked box in the deep attic: super cheap to leave there for years, but it takes a few hours to climb up the ladder and unpack it!',
      takeaway: 'Everyday use = Hot. Occasional = Cool (30d) / Cold (90d). Deep long-term storage (180d+, hours to fetch) = Archive.',
    };
  }
  if (combined.includes('lrs') || combined.includes('zrs') || combined.includes('grs') || combined.includes('redundancy')) {
    return {
      title: 'Photocopying Your Favorite Drawing (LRS, ZRS & GRS)',
      analogy:
        'LRS means making 3 photocopies of your drawing and keeping all 3 in your desk drawer (1 building). ZRS puts 1 copy in your house, 1 at your neighbor’s, and 1 at the library down the street (3 buildings in 1 town). GRS makes 3 copies in your town PLUS mails 3 extra copies to your cousin 300 miles away (6 copies total)!',
      takeaway: 'LRS = 1 building (3 copies). ZRS = 3 buildings in 1 region. GRS = 2 regions (6 copies).',
    };
  }
  if (combined.includes('conditional access') || combined.includes('entra') || combined.includes('mfa') || combined.includes('zero trust')) {
    return {
      title: 'The Smart Clubhouse Bouncer (Conditional Access & Zero Trust)',
      analogy:
        'When you walk up to the clubhouse door from your normal bicycle, the bouncer recognizes your badge right away. But if you show up at midnight wearing a space helmet from another country, the bouncer says: "Hold on! Show me your secret second password (MFA) first!"',
      takeaway: 'Checking WHO you are + WHERE you are + WHAT device you use before opening the door = Conditional Access.',
    };
  }
  if (combined.includes('tco') || combined.includes('pricing calculator') || combined.includes('cost management')) {
    return {
      title: 'Moving Cost Estimator vs. Grocery Receipt Calculator (TCO vs. Pricing)',
      analogy:
        'The TCO Calculator is like comparing how much money your family saves by selling a gas-guzzling van and electricity bills versus switching to the cloud. The Pricing Calculator is like adding items to a shopping cart to see how much 3 cloud computers will cost per month!',
      takeaway: 'Compare old basement servers vs. Azure savings = TCO Calculator. Price out new Azure toys = Pricing Calculator.',
    };
  }
  if (combined.includes('policy') || combined.includes('rbac') || combined.includes('lock') || combined.includes('cannotdelete')) {
    return {
      title: 'Hall Pass vs. School Rules vs. Superglue (RBAC, Policy & Locks)',
      analogy:
        'RBAC is your hall pass—it says WHO is allowed into the art room. Azure Policy is the school rulebook—it says "Everyone may only use washable paint, never permanent markers!" And a CanNotDelete Lock is like putting safety superglue on the class trophy so even the Principal cannot accidentally throw it in the trash!',
      takeaway: 'RBAC = Who has permission. Policy = What rules resources must follow. Lock = Nobody can accidentally delete it!',
    };
  }
  if (combined.includes('arc') || combined.includes('bicep') || combined.includes('arm template')) {
    return {
      title: 'The Universal Remote & LEGO Instruction Book (Azure Arc & ARM/Bicep)',
      analogy:
        'ARM Templates and Bicep are like an official LEGO instruction booklet—hand it to Azure and it builds the exact same castle every single time. Azure Arc is a universal remote control that lets Azure manage toys sitting in your own bedroom or even at a friend’s house!',
      takeaway: 'Repeatable blueprint = ARM/Bicep. Manage servers outside Azure from one screen = Azure Arc.',
    };
  }

  return {
    title: `Kid-Friendly Cloud Analogy • Module ${question.moduleId}`,
    analogy:
      'Think of Azure like a giant, friendly utility company for computer power. Instead of buying heavy machines and keeping them in your garage, you rent just the exact puzzle piece you need—and Microsoft takes care of the plugs, security guards, and backup generators!',
    takeaway: `Focus on the main goal in the story: pick the simplest Azure tool that solves the problem without extra chore work.`,
  };
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onNext,
  onPrev,
  onBookmark,
  isBookmarked,
  onAskTutorAboutQuestion,
  onOpenAiTutorDrawer,
  isAiTutorDrawerOpen = false,
  stats,
  isFocusMode = false,
  onToggleFocusMode,
  dynamicDifficulty,
  consecutiveStreak = 0,
  isDynamicDifficultyEnabled = false,
  onToggleDynamicDifficulty,
  lockedDifficulty = null,
  onChangeLockedDifficulty,
  selectedDifficultyFilter = 'all',
  onSelectDifficultyFilter,
  onOpenStudyRoom,
  onFinishSession,
  onOpenPersonalizedReview,
  unresolvedMistakesCount = 0,
  sessionAnsweredCount = 0,
  onToggleRetryIncorrectInPath,
  isRetryingIncorrectInPath = false,
  incorrectCountInCurrentPath = 0,
  isAudioMuted,
  rollingAverageAccuracy = null,
  rollingWindowCount = 0,
  activeQuickFilter = 'all',
  onSelectQuickFilter,
  bookmarksCount = 0,
  confidenceCount = 0,
  savedNotesCount = 0,
  aiScenariosCount = 0,
  retryQueueCount = 0,
  retryQueueSecondsLeft = 0,
  questionSortOrder = 'default',
  onChangeSortOrder,
  onOpenMockExam,
  onOpenAiGenerator,
  onNavigateTab,
  showWorkspacePanels = false,
  onToggleWorkspacePanels,
  externalStudyZoneOpenTrigger = 0,
  onRateConfidence,
  onOpenUserGuide,
  onSkipQuestion,
  onOpenPeerChallenge,
  last5DifficultyImpactDelta = 0,
  last5AnsweredCount = 0,
  savedNoteText,
  onUpdateSavedNote,
  onOpenAccessibilitySettings,
  externalOpenNotesDrawerTrigger = 0,
  onOpenAzureTheme,
}) => {
  const questionThreadTags = React.useMemo(
    () => getThreadTagsForQuestion(question, 3),
    [question]
  );
  const [activeThreadModalTag, setActiveThreadModalTag] = useState<ThreadTagMeta | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [skipFeedbackToast, setSkipFeedbackToast] = useState<string | null>(null);
  const [userConfidence, setUserConfidence] = useState<number | null>(() => stats?.confidenceScores?.[question.id] || null);
  const [confidenceToast, setConfidenceToast] = useState<string | null>(null);
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState<boolean>(false);
  const [showAiTutorSidebar, setShowAiTutorSidebar] = useState<boolean>(false);
  const [focusedAiOption, setFocusedAiOption] = useState<string | null>(null);
  const [isAiTutorLoading, setIsAiTutorLoading] = useState<boolean>(false);
  const [isAiContextExpanded, setIsAiContextExpanded] = useState<boolean>(true);
  const [aiTutorMessages, setAiTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Karibu! I am your Contextual Ask AI Tutor & Knowledge Assistant.\n\nI have pre-loaded Module ${question.moduleId} (${question.moduleTitle}) and all 4 option boundaries. Click "Ask AI" on any option (A–D) for a targeted distractor breakdown, or ask for a clarification below without leaving your quiz card.`,
    },
  ]);
  const [aiTutorInput, setAiTutorInput] = useState<string>(
    `Clarify Module ${question.moduleId} (${question.moduleTitle}): "${question.question}" — what is the core Azure decision rule here?`
  );
  const [isRecordingAiTutor, setIsRecordingAiTutor] = useState<boolean>(false);
  const aiTutorRecognitionRef = React.useRef<any>(null);
  const aiTutorFeedBottomRef = React.useRef<HTMLDivElement>(null);

  // Keep the contextual Ask AI Tutor sidebar pre-filled whenever the active question changes
  React.useEffect(() => {
    setFocusedAiOption(null);
    setAiTutorInput(
      `Clarify Module ${question.moduleId} (${question.moduleTitle}): "${question.question}" — what is the core Azure decision rule here?`
    );
    setAiTutorMessages([
      {
        role: 'assistant',
        text: `Context updated to Module ${question.moduleId} (${question.moduleTitle} • ${question.difficulty}).\n\nScenario & options A–D are pre-filled above. Click "Ask AI" on any quiz option to see why a distractor is incorrect, or send a question below!`,
      },
    ]);
  }, [question.id]);

  React.useEffect(() => {
    if (showAiTutorSidebar) {
      aiTutorFeedBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [aiTutorMessages, isAiTutorLoading, showAiTutorSidebar]);

  const handleSendAiTutorClarification = async (customPrompt?: string) => {
    const queryText = (customPrompt ?? aiTutorInput).trim();
    if (!queryText || isAiTutorLoading) return;

    setShowAiTutorSidebar(true);
    setAiTutorMessages((prev) => [...prev, { role: 'user', text: queryText }]);
    if (!customPrompt) {
      setAiTutorInput('');
    }
    setIsAiTutorLoading(true);

    const distractorLines = (question.distractorBreakdown || [])
      .map((d) => {
        const optText = question.options.find((o) => o.letter === d.letter)?.text || '';
        return `Option ${d.letter}${optText ? ` (${optText})` : ''}: ${d.reason}`;
      })
      .join('\n- ');

    const contextPayload = `${queryText}\n\n[Active QuizCard Context — Module ${question.moduleId}: ${question.moduleTitle} | Difficulty: ${question.difficulty}]\nScenario: ${question.scenario}\nQuestion: ${question.question}\nOptions: ${question.options.map((o) => `${o.letter}. ${o.text}`).join(' | ')}\nCorrect Answer: Option ${question.correctAnswer}\nWhy Correct: ${question.whyCorrect}\nDistractors:\n- ${distractorLines}\nExam Tip: ${question.examTip}`;

    try {
      const res = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: contextPayload,
          history: aiTutorMessages.slice(-4),
          currentContext: question.moduleTitle,
        }),
      });
      if (!res.ok) throw new Error('Assistant request failed');
      const data = await res.json();
      setAiTutorMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            data.answer ||
            `For Module ${question.moduleId} (${question.moduleTitle}), Option ${question.correctAnswer} is correct because: ${question.whyCorrect}\n\n💡 Exam Tip: ${question.examTip}`,
        },
      ]);
    } catch {
      const correctOptText =
        question.options.find((o) => o.letter === question.correctAnswer)?.text || '';
      setAiTutorMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            `💡 Contextual Clarification (${question.moduleTitle}):\n\n` +
            `• Correct Choice — Option ${question.correctAnswer}${correctOptText ? ` (${correctOptText})` : ''}: ${question.whyCorrect}\n\n` +
            `• Key Distractor Traps:\n${(question.distractorBreakdown || [])
              .map((d) => `  - Option ${d.letter}: ${d.reason}`)
              .join('\n')}\n\n` +
            `🎯 AZ-900 Exam Rule: ${question.examTip}`,
        },
      ]);
    } finally {
      setIsAiTutorLoading(false);
    }
  };

  const handleToggleAiTutorVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      return;
    }

    if (isRecordingAiTutor) {
      if (aiTutorRecognitionRef.current) {
        aiTutorRecognitionRef.current.stop();
      }
      setIsRecordingAiTutor(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecordingAiTutor(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAiTutorInput(transcript);
      };

      recognition.onerror = () => {
        setIsRecordingAiTutor(false);
      };

      recognition.onend = () => {
        setIsRecordingAiTutor(false);
      };

      aiTutorRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecordingAiTutor(false);
    }
  };

  const handleAskAiAboutOption = (option: { letter: string; text: string }) => {
    setShowAiTutorSidebar(true);
    setFocusedAiOption(option.letter);

    const isCorrect = option.letter === question.correctAnswer;
    const distractor = question.distractorBreakdown?.find((d) => d.letter === option.letter);
    const misconception = getArchitecturalMisconceptionForDistractor(
      question,
      option.letter,
      distractor?.reason || ''
    );
    const correctOpt = question.options.find((o) => o.letter === question.correctAnswer);

    const userPrompt = isCorrect
      ? `Ask AI (Option ${option.letter}): Why is "${option.text}" the correct Azure solution for this scenario?`
      : `Ask AI (Option ${option.letter}): Why is "${option.text}" an incorrect distractor in this scenario?`;

    const assistantReply = isCorrect
      ? `✅ Option ${option.letter} ("${option.text}") is the CORRECT Answer!\n\n` +
        `• Core Azure Principle:\n${question.whyCorrect}\n\n` +
        `• Why Distractors Fail:\n${(question.distractorBreakdown || [])
          .map((d) => `  - Option ${d.letter}: ${d.reason}`)
          .join('\n')}\n\n` +
        `💡 Exam Memory Anchor: ${question.examTip}`
      : `❌ Contextual Distractor Breakdown — Option ${option.letter} ("${option.text}"):\n\n` +
        `• Why Option ${option.letter} is Incorrect:\n${
          distractor?.reason ||
          'This option fails to satisfy the specific workload constraints, security boundary, or SLA tier required in this Azure scenario.'
        }\n\n` +
        `• Architectural Trap (${misconception.misconceptionName}):\n${misconception.counterRule}\n\n` +
        `• Contrast with Correct Answer — Option ${question.correctAnswer}${
          correctOpt ? ` ("${correctOpt.text}")` : ''
        }:\n${question.whyCorrect}\n\n` +
        `💡 AZ-900 Exam Rule: ${question.examTip}`;

    setAiTutorInput(
      isCorrect
        ? `Give me a real-world example of when to use Option ${option.letter} (${option.text}) on the AZ-900 exam.`
        : `When WOULD Option ${option.letter} (${option.text}) be the right answer instead of Option ${question.correctAnswer}?`
    );

    setAiTutorMessages((prev) => [
      ...prev,
      { role: 'user', text: userPrompt },
      { role: 'assistant', text: assistantReply },
    ]);
  };
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [showQuickNotes, setShowQuickNotes] = useState<boolean>(false);
  const [questionNoteText, setQuestionNoteText] = useState<string>(() =>
    savedNoteText !== undefined ? savedNoteText : getQuestionNote(question.id)
  );
  const [hasNote, setHasNote] = useState<boolean>(() =>
    Boolean((savedNoteText !== undefined ? savedNoteText : getQuestionNote(question.id)).trim())
  );
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);
  const [isAnchorPinned, setIsAnchorPinned] = useState<boolean>(() =>
    isMemoryAnchorSaved(`anchor-${question.id}`)
  );
  const [markdownExportToast, setMarkdownExportToast] = useState<string | null>(null);
  const [retryNoticeMessage, setRetryNoticeMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingWhyCorrect, setIsSpeakingWhyCorrect] = useState<boolean>(false);
  const [ttsFeedbackError, setTtsFeedbackError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopiedToast, setShareCopiedToast] = useState<boolean>(false);
  const [showQuickStudy, setShowQuickStudy] = useState<boolean>(false);
  const [showStudyZoneMenu, setShowStudyZoneMenu] = useState<boolean>(false);
  const studyZoneMenuRef = React.useRef<HTMLDivElement>(null);
  const studyZoneButtonRef = React.useRef<HTMLButtonElement>(null);

  const [isRationaleExpanded, setIsRationaleExpanded] = useState<boolean>(true);
  const [showQuickDrillModal, setShowQuickDrillModal] = useState<boolean>(false);
  const [quickDrillQuestions, setQuickDrillQuestions] = useState<Question[]>([]);
  const [quickDrillIndex, setQuickDrillIndex] = useState<number>(0);
  const [quickDrillSelectedOption, setQuickDrillSelectedOption] = useState<string | null>(null);
  const [quickDrillHasSubmitted, setQuickDrillHasSubmitted] = useState<boolean>(false);
  const [quickDrillCorrectCount, setQuickDrillCorrectCount] = useState<number>(0);
  const [quickDrillCompleted, setQuickDrillCompleted] = useState<boolean>(false);
  const [quickDrillTimeLeft, setQuickDrillTimeLeft] = useState<number>(30);
  const [quickDrillTimedOut, setQuickDrillTimedOut] = useState<boolean>(false);

  React.useEffect(() => {
    if (!showQuickDrillModal || quickDrillCompleted || quickDrillHasSubmitted) return;
    const timer = setInterval(() => {
      setQuickDrillTimeLeft((prev) => {
        if (prev <= 1) {
          setQuickDrillTimedOut(true);
          setQuickDrillHasSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showQuickDrillModal, quickDrillCompleted, quickDrillHasSubmitted, quickDrillIndex]);

  const handleLaunchQuickDrill = () => {
    const missedIds = new Set((stats?.mistakesHistory || []).map((m) => m.questionId));
    const missedPool = BUILTIN_QUESTIONS.filter((q) => missedIds.has(q.id));
    const fallbackPool = BUILTIN_QUESTIONS.filter((q) => !missedIds.has(q.id));
    const combined = [...missedPool, ...fallbackPool].slice(0, 3);
    setQuickDrillQuestions(combined);
    setQuickDrillIndex(0);
    setQuickDrillSelectedOption(null);
    setQuickDrillHasSubmitted(false);
    setQuickDrillCorrectCount(0);
    setQuickDrillCompleted(false);
    setQuickDrillTimeLeft(30);
    setQuickDrillTimedOut(false);
    setShowQuickDrillModal(true);
  };

  // Floating Scenario Pace Timer & Target Pace State
  const [scenarioElapsedSeconds, setScenarioElapsedSeconds] = useState<number>(0);
  const [targetPaceSeconds, setTargetPaceSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TARGET_PACE_STORAGE_KEY);
      return saved ? parseInt(saved, 10) || 60 : 60;
    } catch {
      return 60;
    }
  });
  const [isScenarioTimerRunning, setIsScenarioTimerRunning] = useState<boolean>(true);
  const [isExamTimerPaused, setIsExamTimerPaused] = useState<boolean>(false);
  const [showPaceSettingsPopover, setShowPaceSettingsPopover] = useState<boolean>(false);
  const cardRootRef = React.useRef<HTMLDivElement>(null);
  const feedbackExplanationRef = React.useRef<HTMLDivElement>(null);
  const prevAutoScrollQuestionIdRef = React.useRef<string>(question.id);
  const prevAutoScrollShownRef = React.useRef<boolean>(false);

  const handleChangeTargetPace = React.useCallback((secs: number) => {
    const validSecs = Math.max(15, Math.round(secs));
    setTargetPaceSeconds(validSecs);
    try {
      localStorage.setItem(TARGET_PACE_STORAGE_KEY, String(validSecs));
    } catch {
      // ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    setScenarioElapsedSeconds(0);
    setIsScenarioTimerRunning(true);
  }, [question.id]);

  React.useEffect(() => {
    if (!isScenarioTimerRunning || hasSubmitted || isExamTimerPaused) return;
    const interval = setInterval(() => {
      setScenarioElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isScenarioTimerRunning, hasSubmitted, isExamTimerPaused]);

  const handlePinCurrentAnchor = () => {
    saveMemoryAnchor({
      id: `anchor-${question.id}`,
      questionId: question.id,
      moduleId: question.moduleId,
      moduleTitle: question.moduleTitle,
      title: `${question.id.toUpperCase()}: ${question.moduleTitle}`,
      anchorText: question.examTip || questionNoteText.trim() || question.whyCorrect,
      examTrap: question.examTip,
    });
    setIsAnchorPinned(true);
    setMarkdownExportToast('Memory Anchor pinned for offline Markdown export!');
    setTimeout(() => setMarkdownExportToast(null), 3200);
  };

  const handleExportAllNotesMarkdown = () => {
    if (questionNoteText.trim()) {
      saveQuestionNote(question.id, questionNoteText);
    }
    const result = downloadNotesAndMemoryAnchorsMarkdown(BUILTIN_QUESTIONS, stats);
    setMarkdownExportToast(
      `Downloaded ${result.filename} (${result.notesCount} notes & ${result.anchorsCount} anchors)`
    );
    setTimeout(() => setMarkdownExportToast(null), 4000);
  };

  // Accordion section states inside the centered Study Zone popup
  const [openStudyZoneSections, setOpenStudyZoneSections] = useState<{
    sort: boolean;
    mode: boolean;
    aids: boolean;
    tools: boolean;
  }>({
    sort: true,
    mode: true,
    aids: false,
    tools: true,
  });

  const toggleStudyZoneSection = (section: 'sort' | 'mode' | 'aids' | 'tools') => {
    setOpenStudyZoneSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  React.useEffect(() => {
    if (externalStudyZoneOpenTrigger > 0) {
      setShowStudyZoneMenu(true);
    }
  }, [externalStudyZoneOpenTrigger]);

  React.useEffect(() => {
    if (externalOpenNotesDrawerTrigger > 0) {
      setShowQuickNotes(true);
    }
  }, [externalOpenNotesDrawerTrigger]);

  React.useEffect(() => {
    if (savedNoteText !== undefined && savedNoteText !== questionNoteText) {
      setQuestionNoteText(savedNoteText);
      setHasNote(Boolean(savedNoteText.trim()));
    }
  }, [savedNoteText]);

  // ELI5 (Explain Like I'm 5) analogy toggle state
  const [showEli5Analogy, setShowEli5Analogy] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_eli5_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [showAnalyzeDistractorsPanel, setShowAnalyzeDistractorsPanel] = useState<boolean>(false);

  const handleToggleEli5 = () => {
    setShowEli5Analogy((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_eli5_enabled', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const eli5Content = React.useMemo(() => getEli5AnalogyForQuestion(question), [question]);

  // Mobile-responsive Quick Switcher horizontal swipe state
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [swipeFeedbackToast, setSwipeFeedbackToast] = useState<string | null>(null);

  const quickSwitcherOptions = React.useMemo(() => {
    const items: Array<{
      id: 'all' | 'bookmarks' | 'notes' | 'ai' | 'mistakes' | 'retry-queue' | 'confidence';
      label: string;
      shortLabel: string;
      count?: number;
      description: string;
      tip?: string;
    }> = [
      {
        id: 'all',
        label: 'All Questions',
        shortLabel: 'All Qs',
        count: totalQuestions,
        description: 'Complete AZ-900 question bank covering Cloud Concepts, Architecture, and Governance.',
        tip: 'Default progressive study queue',
      },
      {
        id: 'bookmarks',
        label: 'Bookmarks',
        shortLabel: 'Saved',
        count: bookmarksCount,
        description: 'Questions you marked with the bookmark icon for targeted review.',
        tip: 'Click bookmark icon on any question to add',
      },
      {
        id: 'notes',
        label: 'Saved Notes',
        shortLabel: 'Notes',
        count: savedNotesCount,
        description: 'Adaptive queue containing questions where you recorded personal notes and exam cues.',
        tip: 'Click Notes on any card to record memory anchors',
      },
      {
        id: 'ai',
        label: 'AI Scenarios',
        shortLabel: 'AI Set',
        count: aiScenariosCount,
        description: 'Synthetic exam scenarios generated dynamically via Google GenAI.',
        tip: 'Generate more in the AI Builder tab',
      },
      {
        id: 'mistakes',
        label: 'Unresolved Mistakes',
        shortLabel: 'Mistakes',
        count: unresolvedMistakesCount,
        description: 'Questions missed during previous drills that need mastery before the real exam.',
        tip: 'High-impact remediation queue',
      },
      {
        id: 'confidence',
        label: 'Confidence Review (1-2★)',
        shortLabel: 'Confidence Review',
        count: confidenceCount,
        description: 'Questions where you self-rated with 1 or 2 stars, enabling focused review on least confident topics.',
        tip: 'Low confidence review queue',
      },
    ];
    if (retryQueueCount > 0 && retryQueueSecondsLeft > 0) {
      items.unshift({
        id: 'retry-queue',
        label: `Retry Queue (${Math.floor(retryQueueSecondsLeft / 60)}:${
          retryQueueSecondsLeft % 60 < 10 ? '0' : ''
        }${retryQueueSecondsLeft % 60})`,
        shortLabel: '5m Retry Queue',
        count: retryQueueCount,
        description: 'Temporary 5-minute drill session launched from post-session weak area review.',
        tip: 'Auto-expires when the countdown finishes',
      });
    }
    return items;
  }, [
    totalQuestions,
    bookmarksCount,
    confidenceCount,
    savedNotesCount,
    aiScenariosCount,
    unresolvedMistakesCount,
    retryQueueCount,
    retryQueueSecondsLeft,
  ]);

  const handleCycleQuickFilter = (direction: 'next' | 'prev') => {
    if (!onSelectQuickFilter || quickSwitcherOptions.length === 0) return;
    const currentIdx = Math.max(
      0,
      quickSwitcherOptions.findIndex((o) => o.id === activeQuickFilter)
    );
    const nextIdx =
      direction === 'next'
        ? (currentIdx + 1) % quickSwitcherOptions.length
        : (currentIdx - 1 + quickSwitcherOptions.length) % quickSwitcherOptions.length;
    const target = quickSwitcherOptions[nextIdx];
    onSelectQuickFilter(target.id);
    setSwipeFeedbackToast(`Switched to: ${target.label}`);
    setTimeout(() => setSwipeFeedbackToast(null), 2200);
  };

  const handleCardTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Trigger Quick Switcher horizontal swipe when horizontal movement > 68px and dominates vertical scroll
    if (Math.abs(dx) > 68 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      if (dx < 0) {
        handleCycleQuickFilter('next');
      } else {
        handleCycleQuickFilter('prev');
      }
    }
  };

  // Close Study Zone dropdown when clicking outside or pressing Escape
  React.useEffect(() => {
    if (!showStudyZoneMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        studyZoneMenuRef.current &&
        !studyZoneMenuRef.current.contains(target) &&
        (!studyZoneButtonRef.current || !studyZoneButtonRef.current.contains(target))
      ) {
        setShowStudyZoneMenu(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStudyZoneMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showStudyZoneMenu]);

  // Local fallback state for permanent difficulty lock if parent doesn't control it
  const [localLockedDifficulty, setLocalLockedDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced' | null
  >(() => {
    try {
      const saved = localStorage.getItem('az900_locked_difficulty');
      if (saved === 'Fundamental' || saved === 'Intermediate' || saved === 'Advanced') {
        return saved;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const activeLockedDifficulty =
    onChangeLockedDifficulty !== undefined ? lockedDifficulty : localLockedDifficulty;

  const handleSetLockedDifficulty = (
    level: 'Fundamental' | 'Intermediate' | 'Advanced' | null
  ) => {
    if (onChangeLockedDifficulty) {
      onChangeLockedDifficulty(level);
    } else {
      setLocalLockedDifficulty(level);
      try {
        if (level) {
          localStorage.setItem('az900_locked_difficulty', level);
        } else {
          localStorage.removeItem('az900_locked_difficulty');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Multi-state difficulty badge cycle handler (Fundamental -> Intermediate -> Advanced -> All)
  const handleCycleDifficultyBadgeFilter = () => {
    if (!onSelectDifficultyFilter) return;
    const cycleOrder: Array<'all' | 'Fundamental' | 'Intermediate' | 'Advanced'> = [
      'all',
      'Fundamental',
      'Intermediate',
      'Advanced',
    ];
    const currentIndex = cycleOrder.indexOf(selectedDifficultyFilter);
    const nextFilter = cycleOrder[(currentIndex + 1) % cycleOrder.length];
    onSelectDifficultyFilter(nextFilter);
  };

  // Instant Share Deep-Link Copy Handler
  const handleShareDeepLinkCopy = async () => {
    if (typeof window === 'undefined') return;
    const deepLinkUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(
      question.id
    )}&path=${question.learningPathId}&mod=${question.moduleId}`;

    try {
      window.history.replaceState(
        null,
        '',
        `?q=${encodeURIComponent(question.id)}&path=${question.learningPathId}&mod=${question.moduleId}`
      );
    } catch {
      // ignore history errors in restricted iframes
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(deepLinkUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = deepLinkUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShareCopiedToast(true);
      setTimeout(() => setShareCopiedToast(false), 2600);
    } catch {
      // Fallback: open share modal if clipboard is blocked
      setShowShareModal(true);
    }
  };

  // Global Toggle: 'study' (Study Mode: immediate feedback, hints, distractor explanations)
  // vs 'exam' (Exam Simulation Mode: no hints, no immediate feedback, live Time Remaining countdown)
  const [quizCardMode, setQuizCardMode] = useState<'study' | 'exam'>(() => {
    try {
      const saved = localStorage.getItem('az900_quiz_card_mode');
      return saved === 'exam' ? 'exam' : 'study';
    } catch {
      return 'study';
    }
  });
  const [examFeedbackRevealed, setExamFeedbackRevealed] = useState<boolean>(false);

  // Exam Simulation Mode 'Time Remaining' Countdown Timer (45:00 certification pressure timer)
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('az900_exam_sim_time_remaining');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return EXAM_SIMULATION_DURATION_SECONDS;
  });

  // Tick down 'Time Remaining' every second when in Exam Simulation Mode
  React.useEffect(() => {
    if (quizCardMode !== 'exam') return;
    const countdownInterval = setInterval(() => {
      setExamTimeRemaining((prev) => {
        const nextVal = Math.max(0, prev - 1);
        try {
          sessionStorage.setItem('az900_exam_sim_time_remaining', String(nextVal));
        } catch {
          // ignore
        }
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [quizCardMode]);

  const handleResetExamCountdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExamTimeRemaining(EXAM_SIMULATION_DURATION_SECONDS);
    try {
      sessionStorage.setItem(
        'az900_exam_sim_time_remaining',
        String(EXAM_SIMULATION_DURATION_SECONDS)
      );
    } catch {
      // ignore
    }
  };

  const handleToggleQuizCardMode = (nextMode: 'study' | 'exam') => {
    setQuizCardMode(nextMode);
    try {
      localStorage.setItem('az900_quiz_card_mode', nextMode);
    } catch (e) {
      console.error(e);
    }
    if (nextMode === 'exam') {
      setShowKnowledgeCheck(false);
      setShowQuickStudy(false);
      if (examTimeRemaining === 0) {
        setExamTimeRemaining(EXAM_SIMULATION_DURATION_SECONDS);
      }
    }
  };

  // SpeechRecognition API state for hands-free Study Notes dictation & Voice Option Answering
  const [isRecordingNote, setIsRecordingNote] = useState<boolean>(false);
  const [isListeningVoiceAnswer, setIsListeningVoiceAnswer] = useState<boolean>(false);
  const [voiceAnswerTranscript, setVoiceAnswerTranscript] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const voiceAnswerRecognitionRef = React.useRef<any>(null);

  // Concept Summary toggle state (replaces distractor explanations with a 1-sentence foundational principle)
  const [showConceptSummaryOnly, setShowConceptSummaryOnly] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_concept_summary_toggle') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleConceptSummary = () => {
    setShowConceptSummaryOnly((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_concept_summary_toggle', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [isDeepWorkEnabled, setIsDeepWorkEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_deep_work_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDeepWork = () => {
    setIsDeepWorkEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_deep_work_enabled', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // 'Quick-Swap' Active Recall Mode: Toggle between 'question-first' and 'answer-first' views
  const [quickSwapMode, setQuickSwapMode] = useState<'question-first' | 'answer-first'>(() => {
    try {
      const saved = localStorage.getItem('az900_quick_swap_mode_v1');
      if (saved === 'answer-first' || saved === 'question-first') return saved;
    } catch {
      // ignore
    }
    return 'question-first';
  });
  const [isAnswerFirstScenarioRevealed, setIsAnswerFirstScenarioRevealed] =
    useState<boolean>(false);

  const handleSetQuickSwapMode = (mode: 'question-first' | 'answer-first') => {
    setQuickSwapMode(mode);
    try {
      localStorage.setItem('az900_quick_swap_mode_v1', mode);
    } catch {
      // ignore
    }
  };

  const handleToggleQuickSwapMode = () => {
    handleSetQuickSwapMode(
      quickSwapMode === 'question-first' ? 'answer-first' : 'question-first'
    );
  };

  // 'Blind Recall' Mode: Questions are displayed without multiple-choice options initially;
  // the user attempts to answer/describe the concept first, then reveals the options to check understanding.
  const [isBlindRecallMode, setIsBlindRecallMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_blind_recall_mode_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [blindRecallAttemptText, setBlindRecallAttemptText] = useState<string>('');
  const [isBlindRecallOptionsRevealed, setIsBlindRecallOptionsRevealed] =
    useState<boolean>(false);

  const handleToggleBlindRecallMode = () => {
    setIsBlindRecallMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_blind_recall_mode_v1', String(next));
      } catch {
        // ignore
      }
      if (next) {
        setIsBlindRecallOptionsRevealed(false);
      }
      return next;
    });
  };

  // Per-Question Exam Readiness Timer & Rolling Average Completion Time
  const QUESTION_TIMING_STORAGE_KEY = 'az900_question_timing_v1';
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [avgCompletionSeconds, setAvgCompletionSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUESTION_TIMING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.count > 0 && parsed.totalSeconds > 0) {
          return Math.max(10, Math.round(parsed.totalSeconds / parsed.count));
        }
      }
    } catch {
      // ignore storage errors
    }
    return 45; // Default AZ-900 exam benchmark: 45s per question
  });

  const scenarioConcepts = React.useMemo(() => extractScenarioTerminology(question), [question]);

  // Reset state, question timer, study note & cancel audio when question changes
  React.useEffect(() => {
    setSelectedOption(null);
    setHasSubmitted(false);
    setShowAnalyzeDistractorsPanel(false);
    setUserConfidence(stats?.confidenceScores?.[question.id] || null);
    setConfidenceToast(null);
    setExamFeedbackRevealed(false);
    setElapsedSeconds(0);
    setShowKnowledgeCheck(false);
    setSelectedConceptId(null);
    setIsAnswerFirstScenarioRevealed(false);
    setBlindRecallAttemptText('');
    setIsBlindRecallOptionsRevealed(false);
    const savedNote = getQuestionNote(question.id);
    setQuestionNoteText(savedNote);
    setHasNote(Boolean(savedNote.trim()));
    setNoteSavedFeedback(false);
    setRetryNoticeMessage(null);
    setSpeechError(null);
    setVoiceAnswerTranscript(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecordingNote(false);
    }
    if (voiceAnswerRecognitionRef.current) {
      try {
        voiceAnswerRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningVoiceAnswer(false);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsSpeakingWhyCorrect(false);
    setTtsFeedbackError(null);
  }, [question.id, stats?.confidenceScores]);

  const handleRateConfidence = (level: number) => {
    setUserConfidence(level);
    const label =
      level === 1
        ? 'Guessing (1/5)'
        : level === 2
        ? 'Low Confidence (2/5)'
        : level === 3
        ? 'Moderate Confidence (3/5)'
        : level === 4
        ? 'High Confidence (4/5)'
        : 'Mastered (5/5)';
    setConfidenceToast(`Recorded: ${label}`);
    setTimeout(() => setConfidenceToast(null), 3000);
    if (onRateConfidence) {
      onRateConfidence(question.id, level);
    }
  };

  const handleInlineNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setQuestionNoteText(nextVal);
    saveQuestionNote(question.id, nextVal);
    if (onUpdateSavedNote) {
      onUpdateSavedNote(question.id, nextVal);
    }
    setHasNote(Boolean(nextVal.trim()));
    setNoteSavedFeedback(true);
  };

  const handleClearInlineNote = () => {
    setQuestionNoteText('');
    saveQuestionNote(question.id, '');
    if (onUpdateSavedNote) {
      onUpdateSavedNote(question.id, '');
    }
    setHasNote(false);
    setNoteSavedFeedback(false);
  };

  // Toggle SpeechRecognition API dictation for Study Notes
  const handleToggleVoiceNote = () => {
    setSpeechError(null);
    if (isRecordingNote && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecordingNote(false);
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        'Voice dictation (SpeechRecognition API) is not supported in this browser. Try Chrome or Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecordingNote(true);
      };

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (newTranscript.trim()) {
          setQuestionNoteText((prev) => {
            const combined = prev.trim()
              ? `${prev.trim()} ${newTranscript.trim()}`
              : newTranscript.trim();
            saveQuestionNote(question.id, combined);
            if (onUpdateSavedNote) {
              onUpdateSavedNote(question.id, combined);
            }
            setHasNote(Boolean(combined.trim()));
            setNoteSavedFeedback(true);
            return combined;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          setSpeechError(`Voice input stopped (${event.error || 'microphone permission required'}).`);
        }
        setIsRecordingNote(false);
      };

      recognition.onend = () => {
        setIsRecordingNote(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError('Could not start microphone transcription.');
      setIsRecordingNote(false);
    }
  };

  const handleRetryIncorrectClick = () => {
    if (!onToggleRetryIncorrectInPath) return;
    if (!isRetryingIncorrectInPath && incorrectCountInCurrentPath === 0) {
      setRetryNoticeMessage(
        `You currently have 0 missed questions in Learning Path ${question.learningPathId}. Answer questions in this path first—any missed questions will automatically be queued for Retry Incorrect!`
      );
      return;
    }
    setRetryNoticeMessage(null);
    onToggleRetryIncorrectInPath(question.learningPathId);
  };

  // Increment per-question timer every second until user submits an answer (respects active pause)
  React.useEffect(() => {
    if (hasSubmitted || isExamTimerPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasSubmitted, question.id, isExamTimerPaused]);

  // Cancel speech on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  // Color-code timer (Green -> Amber -> Red) based on average completion time
  const timerRatio = avgCompletionSeconds > 0 ? elapsedSeconds / avgCompletionSeconds : 0;
  const timerPaceZone: 'green' | 'amber' | 'red' =
    timerRatio <= 0.75 ? 'green' : timerRatio <= 1.15 ? 'amber' : 'red';

  const timerColorConfig = {
    green: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20',
      icon: 'text-emerald-600',
      dot: 'bg-emerald-500',
      bar: 'from-emerald-500 to-teal-500',
      label: 'Optimal Exam Pace',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-500/25',
      icon: 'text-amber-600',
      dot: 'bg-amber-500',
      bar: 'from-amber-400 to-orange-500',
      label: 'Near Average Pace',
    },
    red: {
      badge: 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-500/25',
      icon: 'text-rose-600 animate-pulse',
      dot: 'bg-rose-600 animate-ping',
      bar: 'from-rose-500 to-red-600',
      label: 'Over Average Time',
    },
  }[timerPaceZone];

  const handleToggleReadQuestion = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeakingWhyCorrect(false);

    const optionsText = question.options
      .map((o) => `Option ${o.letter}: ${o.text}`)
      .join('. ');
    const speechText = `Scenario context: ${question.scenario}. Question: ${question.question}. Choices: ${optionsText}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeakWhyCorrect = () => {
    setTtsFeedbackError(null);
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsFeedbackError('Text-to-speech (Web Speech API) is not supported in this browser.');
      return;
    }

    if (isSpeakingWhyCorrect) {
      window.speechSynthesis.cancel();
      setIsSpeakingWhyCorrect(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const speechText = `Why Option ${question.correctAnswer} is correct: ${question.whyCorrect}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.96;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeakingWhyCorrect(false);
    };
    utterance.onerror = () => {
      setIsSpeakingWhyCorrect(false);
    };

    setIsSpeakingWhyCorrect(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (letter: string) => {
    if (hasSubmitted) return;
    setSelectedOption(letter);
    setHasSubmitted(true);

    // Record question completion time to update rolling average
    try {
      const timeSpent = Math.max(1, Math.min(300, elapsedSeconds));
      const raw = localStorage.getItem(QUESTION_TIMING_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : { totalSeconds: 45, count: 1 };
      const nextTotal = (parsed.totalSeconds || 45) + timeSpent;
      const nextCount = (parsed.count || 1) + 1;
      localStorage.setItem(
        QUESTION_TIMING_STORAGE_KEY,
        JSON.stringify({ totalSeconds: nextTotal, count: nextCount })
      );
      setAvgCompletionSeconds(Math.max(10, Math.round(nextTotal / nextCount)));
    } catch {
      // ignore storage errors
    }

    const isCorrect = letter === question.correctAnswer;
    const effectiveMuted =
      isAudioMuted !== undefined
        ? isAudioMuted
        : typeof window !== 'undefined' && localStorage.getItem('az900_audio_muted') === 'true';
    playAnswerFeedbackSound(isCorrect, effectiveMuted);
    onAnswer(question.id, letter, isCorrect);
  };

  // Parse spoken command (e.g., 'Option one', 'Option two', 'Option A') into option letter A/B/C/D
  const parseSpokenOptionCommand = (transcript: string): 'A' | 'B' | 'C' | 'D' | null => {
    const clean = transcript.toLowerCase().trim();
    if (
      /\b(option\s*(one|1|a)|choice\s*(one|1|a)|first\s*option|number\s*(one|1)|^one$|^1$|^a$)\b/i.test(
        clean
      )
    ) {
      return 'A';
    }
    if (
      /\b(option\s*(two|to|too|2|b)|choice\s*(two|2|b)|second\s*option|number\s*(two|2)|^two$|^2$|^b$)\b/i.test(
        clean
      )
    ) {
      return 'B';
    }
    if (
      /\b(option\s*(three|3|c)|choice\s*(three|3|c)|third\s*option|number\s*(three|3)|^three$|^3$|^c$)\b/i.test(
        clean
      )
    ) {
      return 'C';
    }
    if (
      /\b(option\s*(four|for|4|d)|choice\s*(four|4|d)|fourth\s*option|number\s*(four|4)|^four$|^4$|^d$)\b/i.test(
        clean
      )
    ) {
      return 'D';
    }
    return null;
  };

  // Toggle SpeechRecognition API for hands-free multiple-choice answering ("Option one", "Option two", etc.)
  const handleToggleVoiceAnswer = () => {
    if (hasSubmitted) return;
    setSpeechError(null);

    if (isListeningVoiceAnswer && voiceAnswerRecognitionRef.current) {
      try {
        voiceAnswerRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningVoiceAnswer(false);
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        'Voice answering (SpeechRecognition API) is not supported in this browser. Try Chrome or Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoiceAnswer(true);
        setVoiceAnswerTranscript('Listening... Say "Option one", "Option two", "Option three", or "Option four"');
      };

      recognition.onresult = (event: any) => {
        let heard = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          heard += event.results[i][0].transcript + ' ';
        }
        const trimmed = heard.trim();
        const matchedLetter = parseSpokenOptionCommand(trimmed);
        if (matchedLetter) {
          const optIdx = ['A', 'B', 'C', 'D'].indexOf(matchedLetter) + 1;
          setVoiceAnswerTranscript(`Heard "${trimmed}" → Selected Option ${optIdx} (${matchedLetter})`);
          handleSelect(matchedLetter);
        } else {
          setVoiceAnswerTranscript(
            `Heard "${trimmed}" — try saying "Option one", "Option two", "Option three", or "Option four".`
          );
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          setVoiceAnswerTranscript(`Voice command paused (${event.error || 'check mic permission'}).`);
        }
        setIsListeningVoiceAnswer(false);
      };

      recognition.onend = () => {
        setIsListeningVoiceAnswer(false);
      };

      voiceAnswerRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceAnswerTranscript('Could not start voice command listener.');
      setIsListeningVoiceAnswer(false);
    }
  };

  const isAnswered = hasSubmitted && selectedOption !== null;
  const isExamMode = quizCardMode === 'exam';
  const showImmediateFeedback = isAnswered && (!isExamMode || examFeedbackRevealed);
  const isSelectedCorrect = selectedOption === question.correctAnswer;
  const isQuestionSkipped = Boolean(stats?.skippedQuestionIds?.includes(question.id));

  // Smoothly auto-scroll to center QuizCard in the viewport after submitting an answer,
  // keeping the question feedback & explanation clearly visible
  React.useEffect(() => {
    if (prevAutoScrollQuestionIdRef.current !== question.id) {
      prevAutoScrollQuestionIdRef.current = question.id;
      prevAutoScrollShownRef.current = showImmediateFeedback;
      return;
    }

    const justRevealedFeedback = showImmediateFeedback && !prevAutoScrollShownRef.current;
    prevAutoScrollShownRef.current = showImmediateFeedback;

    if (!justRevealedFeedback || typeof window === 'undefined') {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId: number | null = null;
    let cancelled = false;

    const cancelOnUserInput = () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    window.addEventListener('wheel', cancelOnUserInput, { passive: true, once: true });
    window.addEventListener('touchstart', cancelOnUserInput, { passive: true, once: true });

    const timerId = window.setTimeout(() => {
      if (cancelled || !cardRootRef.current) return;

      const cardEl = cardRootRef.current;
      const expEl = feedbackExplanationRef.current;
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const cardRect = cardEl.getBoundingClientRect();

      if (cardRect.height === 0 && typeof cardEl.scrollIntoView === 'function') {
        cardEl.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
        });
        return;
      }

      const currentY = window.scrollY || window.pageYOffset || 0;
      const cardTop = currentY + cardRect.top;
      let targetY: number;

      if (isFocusMode) {
        targetY =
          cardRect.height <= vh * 0.9
            ? Math.max(0, cardTop - (vh - cardRect.height) / 2)
            : Math.max(0, cardTop - 16);
      } else if (cardRect.height <= vh * 0.92) {
        targetY = Math.max(0, cardTop - (vh - cardRect.height) / 2);
      } else if (expEl) {
        const expRect = expEl.getBoundingClientRect();
        const expTop = currentY + expRect.top;
        const expVisibleTarget = Math.min(expRect.height, vh * 0.72);
        const explanationCenteredY = Math.max(0, expTop - (vh - expVisibleTarget) / 2);
        const cardCenterY = Math.max(0, cardTop + cardRect.height / 2 - vh / 2);
        const maxTopBeforeClippingExplanation = Math.max(0, expTop - 24);
        const minTopToKeepExplanationVisible = Math.max(
          0,
          expTop + Math.min(expVisibleTarget, 260) - vh + 24
        );
        targetY = Math.min(
          maxTopBeforeClippingExplanation,
          Math.max(
            cardCenterY,
            minTopToKeepExplanationVisible,
            explanationCenteredY * 0.65 + cardCenterY * 0.35
          )
        );
      } else {
        targetY = Math.max(0, cardTop + cardRect.height / 2 - vh / 2);
      }

      if (prefersReducedMotion || typeof window.requestAnimationFrame !== 'function') {
        if (typeof window.scrollTo === 'function') {
          window.scrollTo({ top: targetY, behavior: 'auto' });
        }
        return;
      }

      const startY = window.scrollY || window.pageYOffset || 0;
      const distance = targetY - startY;
      if (Math.abs(distance) < 4) return;

      const durationMs = 440;
      const startTime = performance.now();
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        window.scrollTo(0, startY + distance * easeOutCubic(progress));
        if (progress < 1) {
          rafId = window.requestAnimationFrame(step);
        } else {
          rafId = null;
        }
      };

      rafId = window.requestAnimationFrame(step);
    }, prefersReducedMotion ? 0 : 210);

    return () => {
      window.clearTimeout(timerId);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('wheel', cancelOnUserInput);
      window.removeEventListener('touchstart', cancelOnUserInput);
    };
  }, [showImmediateFeedback, isFocusMode, question.id]);

  // Color-coded Difficulty Badge Configuration (Fundamental, Intermediate, Advanced)
  const difficultyBadgeConfig =
    question.difficulty === 'Fundamental'
      ? {
          label: 'Fundamental',
          pillClass:
            'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200/80 ring-1 ring-emerald-500/20',
          dotClass: 'bg-emerald-600',
          subLabel: 'Foundational Concept',
        }
      : question.difficulty === 'Intermediate'
      ? {
          label: 'Intermediate',
          pillClass:
            'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200/80 ring-1 ring-amber-500/25',
          dotClass: 'bg-amber-600',
          subLabel: 'Scenario Application',
        }
      : {
          label: 'Advanced',
          pillClass:
            'bg-rose-100 text-rose-900 border-rose-400 hover:bg-rose-200/80 ring-1 ring-rose-500/25',
          dotClass: 'bg-rose-600',
          subLabel: 'Complex Architecture',
        };

  // Skip handler: moves to next question without penalty or completion, marking for Weak Areas review
  const handleSkipQuestion = () => {
    if (hasSubmitted) {
      onNext();
      return;
    }
    if (onSkipQuestion) {
      onSkipQuestion(question.id);
    } else if (stats) {
      markQuestionSkipped(stats, question.id);
    }
    setSkipFeedbackToast(
      `Skipped Question ${questionIndex + 1} without penalty — queued in Weak Areas for later review`
    );
    setTimeout(() => setSkipFeedbackToast(null), 2600);
    onNext();
  };

  // Path styling tags
  const pathColor =
    question.learningPathId === 1
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : question.learningPathId === 2
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : 'border-orange-200 bg-orange-50 text-orange-800';

  // Count active Study Zone tools/filters so user can see at a glance
  const activeStudyZoneToolsCount = [
    isExamMode,
    selectedDifficultyFilter !== 'all',
    activeLockedDifficulty !== null,
    showEli5Analogy && !isExamMode,
    showQuickStudy && !isExamMode,
    showKnowledgeCheck && !isExamMode,
    isSpeaking,
    hasNote,
    isDeepWorkEnabled,
    isFocusMode,
    isRetryingIncorrectInPath,
  ].filter(Boolean).length;

  return (
    <motion.div
      ref={cardRootRef}
      layout
      initial={{ opacity: 0, y: 14, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.992 }}
      transition={{
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      }}
      onTouchStart={handleCardTouchStart}
      onTouchEnd={handleCardTouchEnd}
      className="w-full max-w-full min-w-0 bg-white rounded-xl border border-slate-200/90 card-elevation overflow-hidden"
    >
      {/* Mobile-Responsive 'Quick Switcher' Swipe Gesture Bar (Toggle Active Filtered Lists Without Opening Menu) */}
      {onSelectQuickFilter && (
        <div className="px-3 sm:px-5 py-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2 rounded-t-xl min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 min-w-0 max-w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1 shrink-0 mr-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Quick Switcher:</span>
            </span>

            {quickSwitcherOptions.map((item) => {
              const isActive = activeQuickFilter === item.id;
              const badgeColor =
                item.id === 'bookmarks'
                  ? 'amber'
                  : item.id === 'notes'
                  ? 'blue'
                  : item.id === 'ai'
                  ? 'purple'
                  : item.id === 'mistakes'
                  ? 'rose'
                  : item.id === 'confidence'
                  ? 'amber'
                  : item.id === 'retry-queue'
                  ? 'amber'
                  : 'slate';

              return (
                <HoverInfoFeedback
                  key={item.id}
                  title={item.label}
                  badge={item.count !== undefined ? `${item.count} Qs` : undefined}
                  badgeColor={badgeColor}
                  description={item.description}
                  tip={item.tip}
                  side="bottom"
                  align="center"
                >
                  <button
                    type="button"
                    onClick={() => onSelectQuickFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isActive
                        ? item.id === 'retry-queue'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                          : 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200'
                    }`}
                  >
                    <span>{item.shortLabel}</span>
                    {item.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-black/20 text-current' : 'bg-white/15 text-slate-300'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                </HoverInfoFeedback>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {swipeFeedbackToast ? (
              <span className="text-[10px] font-extrabold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md animate-pulse">
                {swipeFeedbackToast}
              </span>
            ) : (
              <span className="text-[10px] text-slate-300 hidden sm:inline">
                Swipe ⇄ on card to switch lists
              </span>
            )}
            <div className="inline-flex items-center rounded-lg bg-white/10 border border-white/15 p-0.5">
              <button
                type="button"
                onClick={() => handleCycleQuickFilter('prev')}
                className="p-1 hover:bg-white/15 rounded text-slate-200 hover:text-white cursor-pointer"
                title="Previous filtered list"
                aria-label="Previous filtered list"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleCycleQuickFilter('next')}
                className="p-1 hover:bg-white/15 rounded text-slate-200 hover:text-white cursor-pointer"
                title="Next filtered list"
                aria-label="Next filtered list"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uncluttered, Neatly Ordered Top Header Bar with Persistent Difficulty Dropdown & Study Zone Menu */}
      <div
        className={`relative px-3.5 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 min-w-0 w-full ${
          !onSelectQuickFilter ? 'rounded-t-xl' : ''
        }`}
      >
        {/* Left Group: Path/Module Identity + Persistent Difficulty Level Dropdown Selector + Active Mode Indicators */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${pathColor}`}
          >
            Path {question.learningPathId}: Module {question.moduleId}
          </span>

          <span className="text-xs font-semibold text-slate-700 hidden md:inline max-w-[200px] truncate">
            {question.moduleTitle}
          </span>

          {/* Clear Color-Coded Difficulty Badge */}
          <button
            type="button"
            onClick={handleCycleDifficultyBadgeFilter}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-2xs ${difficultyBadgeConfig.pillClass}`}
            title={`Current Question Difficulty: ${difficultyBadgeConfig.label} (${difficultyBadgeConfig.subLabel}). Click to cycle difficulty filter.`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${difficultyBadgeConfig.dotClass}`} />
            <span>{difficultyBadgeConfig.label}</span>
            {consecutiveStreak > 0 && (
              <span className="text-[10px] font-black bg-amber-200/90 text-amber-950 px-1 rounded-sm">
                {consecutiveStreak}🔥
              </span>
            )}
          </button>

          {/* Small '+/-' Trend Percentage Indicator Highlighting Last 5 Questions Impact on Dynamic Difficulty */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black border tabular-nums shadow-2xs select-none ${
              last5DifficultyImpactDelta > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : last5DifficultyImpactDelta < 0
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title={`Last 5 Questions Impact on Dynamic Difficulty (${last5AnsweredCount}/5 recent questions): ${
              last5DifficultyImpactDelta > 0
                ? `+${last5DifficultyImpactDelta}% upward pressure toward Harder (Advanced) scenarios`
                : last5DifficultyImpactDelta < 0
                ? `${last5DifficultyImpactDelta}% downward pressure toward Easier (Fundamental) concepts`
                : '0% neutral baseline (Medium / Intermediate equilibrium)'
            }`}
          >
            {last5DifficultyImpactDelta > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : last5DifficultyImpactDelta < 0 ? (
              <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
            ) : (
              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <span>
              {last5DifficultyImpactDelta > 0
                ? `+${last5DifficultyImpactDelta}%`
                : last5DifficultyImpactDelta < 0
                ? `${last5DifficultyImpactDelta}%`
                : '+0%'}
            </span>
            <span className="text-[9.5px] font-bold opacity-75 hidden sm:inline">(5Q)</span>
          </span>

          {/* Persistent Difficulty Level Dropdown Selector in Practice Workspace Toolbar (Overrides Dynamic Difficulty) */}
          {onSelectDifficultyFilter && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
              <Filter className="w-3 h-3 text-[#0078D4] shrink-0" />
              <label
                htmlFor="quizcard-difficulty-dropdown"
                className="text-[10px] font-black uppercase tracking-wider text-slate-600 hidden sm:inline"
              >
                Level:
              </label>
              <select
                id="quizcard-difficulty-dropdown"
                aria-label="Filter question bank by difficulty level"
                value={selectedDifficultyFilter}
                onChange={(e) => {
                  const nextLevel = e.target.value as
                    | 'all'
                    | 'Fundamental'
                    | 'Intermediate'
                    | 'Advanced';
                  onSelectDifficultyFilter(nextLevel);
                  handleSetLockedDifficulty(nextLevel === 'all' ? null : nextLevel);
                }}
                className="text-[11px] font-extrabold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                title="Persistent Difficulty Level Selector: Manually filter question bank (Fundamental, Intermediate, Advanced), overriding dynamic difficulty adjustment"
              >
                <option value="all">Adaptive (Auto)</option>
                <option value="Fundamental">Fundamental</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          )}

          {isQuestionSkipped && !hasSubmitted && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-orange-100 text-orange-900 border border-orange-300"
              title="Previously skipped without penalty — marked for review in Weak Areas"
            >
              <SkipForward className="w-3 h-3 text-orange-600" />
              <span>Skipped • In Weak Areas</span>
            </span>
          )}

          {question.isAiGenerated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>AI</span>
            </span>
          )}

          {/* Exam Simulation Live Countdown Pill (Only shown when Exam Mode is active) */}
          {isExamMode && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-extrabold shadow-2xs ${
                examTimeRemaining <= 180
                  ? 'bg-rose-950 text-rose-200 border-rose-500 animate-pulse'
                  : 'bg-slate-900 text-amber-300 border-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-white">
                {examTimeRemaining > 0 ? formatTimer(examTimeRemaining) : '0:00'}
              </span>
              <button
                type="button"
                onClick={handleResetExamCountdown}
                className="p-0.5 rounded hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
                title="Reset 45:00 Exam Simulation timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active ELI5 Indicator Chip */}
          {showEli5Analogy && !isExamMode && (
            <button
              type="button"
              onClick={handleToggleEli5}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300 cursor-pointer"
              title="ELI5 Child-Friendly Analogy active. Click to hide."
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>ELI5 On</span>
            </button>
          )}
        </div>

        {/* Right Group: Scenario Pace Timer + Question Timer + Question X of Y + Study Zone Dropdown + Bookmark */}
        <div className="flex items-center gap-2">
          {/* Compact Target Pace Trigger synced with PersistentExamTimer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaceSettingsPopover((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                scenarioElapsedSeconds <= targetPaceSeconds * 0.8
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : scenarioElapsedSeconds <= targetPaceSeconds
                  ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                  : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
              }`}
              title={`Scenario Pace: ${formatTimer(scenarioElapsedSeconds)} vs Target ${targetPaceSeconds}s per question • Click to adjust target pace`}
            >
              {scenarioElapsedSeconds > targetPaceSeconds ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              ) : (
                <Clock
                  className={`w-3.5 h-3.5 shrink-0 ${
                    scenarioElapsedSeconds <= targetPaceSeconds * 0.8
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                />
              )}
              <span className="font-mono tabular-nums tracking-tight">
                {formatTimer(scenarioElapsedSeconds)}
              </span>
              <span className="text-[10px] opacity-85 font-mono tabular-nums">
                /{targetPaceSeconds}s
              </span>
            </button>

            {/* Target Pace Selection Popover */}
            {showPaceSettingsPopover && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-left space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black uppercase text-slate-900">Target Pace / Question</span>
                  <button
                    type="button"
                    onClick={() => setShowPaceSettingsPopover(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {TARGET_PACE_OPTIONS.map((secs) => {
                    const isSelected = targetPaceSeconds === secs;
                    return (
                      <button
                        key={secs}
                        type="button"
                        onClick={() => {
                          handleChangeTargetPace(secs);
                          setShowPaceSettingsPopover(false);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected ? 'bg-[#0078D4] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {secs}s
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* Compact Color-Coded Question Timer Pill */}
          <div
            className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 shadow-2xs ${timerColorConfig.badge}`}
            title={`Question Timer: ${formatTimer(elapsedSeconds)} spent vs. ${formatTimer(
              avgCompletionSeconds
            )} avg (${timerColorConfig.label})`}
          >
            <Timer className={`w-3.5 h-3.5 ${timerColorConfig.icon}`} />
            <span className="font-mono tracking-tight">{formatTimer(elapsedSeconds)}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${timerColorConfig.dot}`} />
          </div>

          {/* Question Counter */}
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap px-1">
            Q {questionIndex + 1}/{totalQuestions}
          </span>

          {/* Focus Mode Indicator in Quiz Header with Hover-Only On-Screen Keyboard Shortcut Guide */}
          {onToggleFocusMode && (
            <div className="relative group/cardfocusguide">
              <button
                type="button"
                onClick={onToggleFocusMode}
                className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isFocusMode
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
                aria-label="Focus Mode indicator — hover for keyboard shortcut guide"
              >
                {isFocusMode ? (
                  <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-[#0078D4]" />
                )}
                <span className="hidden sm:inline">
                  {isFocusMode ? 'Focus ON' : 'Focus Mode'}
                </span>
              </button>

              {/* Hover-Only Dynamic Platform-Aware Keyboard Shortcut Guide */}
              <KeyboardShortcutGuidePopover
                isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
                effectiveDynamicDifficulty={dynamicDifficulty || 'Intermediate'}
                onToggleDynamicDifficulty={onToggleDynamicDifficulty}
                onOpenAccessibilitySettings={() => onOpenAccessibilitySettings?.()}
                align="right"
              />
            </div>
          )}

          {/* Persistent 'Ask AI Tutor' Sidebar Button: Opens Contextual AI Tutor Sidebar Next to QuizCard */}
          <button
            id="quizcard-ask-ai-btn"
            type="button"
            onClick={() => {
              setShowAiTutorSidebar((prev) => !prev);
            }}
            aria-pressed={showAiTutorSidebar || isAiTutorDrawerOpen}
            title={`Toggle Contextual Ask AI Tutor sidebar next to QuizCard with Module ${question.moduleId} question and distractor context pre-filled`}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 ${
              showAiTutorSidebar || isAiTutorDrawerOpen
                ? 'bg-gradient-to-r from-[#C2410C] to-[#D97706] text-white border-amber-400 ring-2 ring-amber-400/35'
                : 'bg-gradient-to-r from-amber-50 via-white to-sky-50 hover:from-amber-100 hover:to-sky-100 text-slate-900 border-amber-300/90'
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 shrink-0 ${
                showAiTutorSidebar || isAiTutorDrawerOpen ? 'text-yellow-200' : 'text-[#C2410C]'
              }`}
            />
            <span>Ask AI Tutor</span>
          </button>

          {/* Quick-Drill (3 Missed Questions) Button */}
          <button
            type="button"
            onClick={handleLaunchQuickDrill}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            title="Launch a rapid 3-question Quick-Drill of previously missed questions without leaving your flow"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden sm:inline">⚡ Quick-Drill (3 Missed)</span>
            <span className="sm:hidden">⚡ Quick-Drill</span>
          </button>

          {/* STUDY ZONE ACCORDION MENU (Centered Popup Modal in Middle of Page) */}
          <div className="relative">
            <button
              ref={studyZoneButtonRef}
              type="button"
              onClick={() => setShowStudyZoneMenu((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                showStudyZoneMenu
                  ? 'bg-[#0078D4] text-white border-[#0078D4] ring-2 ring-[#0078D4]/25'
                  : 'bg-gradient-to-r from-sky-50 via-white to-blue-50 hover:from-sky-100 hover:to-blue-100 text-slate-900 border-sky-300'
              }`}
              aria-expanded={showStudyZoneMenu}
              aria-haspopup="dialog"
              title="Open Study Zone (Centered Accordion Menu): Quick-Sort, Quiz Mode, Difficulty Calibration, ELI5 Analogy, Audio, Notes, Simulators & Study Links"
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 ${showStudyZoneMenu ? 'text-amber-300' : 'text-[#0078D4]'}`}
              />
              <span>Study Zone</span>
              {activeStudyZoneToolsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    showStudyZoneMenu
                      ? 'bg-amber-300 text-slate-950'
                      : 'bg-[#0078D4] text-white'
                  }`}
                >
                  {activeStudyZoneToolsCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showStudyZoneMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Modal Popup Fitted Cleanly into the Active Viewport (Top-aligned in Focus Mode) */}
            {showStudyZoneMenu &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  className={`fixed inset-0 z-[120] flex ${
                    isFocusMode ? 'items-start pt-3 sm:pt-4' : 'items-center'
                  } justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150`}
                  onClick={() => setShowStudyZoneMenu(false)}
                >
                  <div
                    ref={studyZoneMenuRef}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-[min(36rem,calc(100vw-1.25rem))] ${
                      isFocusMode ? 'mt-0 mb-auto' : 'my-auto'
                    } max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl text-left animate-in zoom-in-95 duration-200`}
                  >
                    {/* Modal Header */}
                    <div className="shrink-0 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-2 rounded-xl bg-white/10 border border-white/15 text-amber-300 shrink-0">
                          <SlidersHorizontal className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                              Study Zone Command Hub
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shrink-0">
                              Accordion Menu
                            </span>
                          </div>
                          <p className="text-[11px] text-sky-100/90 mt-0.5">
                            Expand any section below to sort questions, calibrate difficulty, or launch study tools
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStudyZoneMenu(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition-colors cursor-pointer shrink-0"
                      >
                        Close ✕
                      </button>
                    </div>

                    {/* Accordion Sections Container */}
                    <div className="p-3.5 sm:p-5 space-y-3 overflow-y-auto overscroll-contain flex-1 min-h-0">
                    {/* ACCORDION SECTION 1: Quick-Sort & Question Queue Filters */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleStudyZoneSection('sort')}
                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0078D4] flex items-center justify-center font-black text-xs">
                            1
                          </span>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              Question Quick-Sort &amp; Active Filters
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Re-order questions dynamically by Newest, Hardest, or Module Progression
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#0078D4] uppercase">
                            {questionSortOrder === 'newest-first'
                              ? 'Newest First'
                              : questionSortOrder === 'hardest-first'
                              ? 'Hardest First'
                              : questionSortOrder === 'module-progression'
                              ? 'Module Order'
                              : questionSortOrder === 'easiest-first'
                              ? 'Easiest First'
                              : 'Adaptive Order'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              openStudyZoneSections.sort ? 'rotate-180 text-[#0078D4]' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {openStudyZoneSections.sort && (
                        <div className="p-3.5 pt-2 border-t border-slate-200/80 space-y-3 bg-slate-50/70">
                          {onChangeSortOrder && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Quick-Sort Question Order
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {(
                                  [
                                    {
                                      id: 'newest-first',
                                      label: 'Newest First',
                                      desc: 'Latest & AI scenarios first',
                                    },
                                    {
                                      id: 'hardest-first',
                                      label: 'Hardest First',
                                      desc: 'Advanced → Fundamental',
                                    },
                                    {
                                      id: 'module-progression',
                                      label: 'Module Progression',
                                      desc: 'Path 1 → 3 sequential',
                                    },
                                    {
                                      id: 'easiest-first',
                                      label: 'Easiest First',
                                      desc: 'Fundamental → Advanced',
                                    },
                                    {
                                      id: 'default',
                                      label: 'Adaptive Default',
                                      desc: 'Smart rolling calibration',
                                    },
                                  ] as const
                                ).map((opt) => {
                                  const isSelected = questionSortOrder === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => onChangeSortOrder(opt.id)}
                                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                                      }`}
                                    >
                                      <div className="text-xs font-extrabold flex items-center justify-between gap-1">
                                        <span>{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                                      </div>
                                      <div
                                        className={`text-[10px] mt-0.5 ${
                                          isSelected ? 'text-sky-100' : 'text-slate-500'
                                        }`}
                                      >
                                        {opt.desc}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {onSelectQuickFilter && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Filter Question Pool
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {quickSwitcherOptions.map((item) => {
                                  const isActive = activeQuickFilter === item.id;
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => onSelectQuickFilter(item.id)}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                        isActive
                                          ? 'bg-slate-900 text-amber-300 border-slate-900'
                                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <span>{item.label}</span>
                                      {typeof item.count === 'number' && (
                                        <span
                                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                            isActive
                                              ? 'bg-amber-400 text-slate-950'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {item.count}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION SECTION 2: Quiz Mode & Difficulty Calibration */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleStudyZoneSection('mode')}
                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs">
                            2
                          </span>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              Mode &amp; Difficulty Calibration
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Switch Study vs. Exam Mode, filter by tier, or lock adaptive difficulty
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase">
                            {isExamMode ? 'Exam Sim' : 'Study Mode'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              openStudyZoneSections.mode ? 'rotate-180 text-[#0078D4]' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {openStudyZoneSections.mode && (
                        <div className="p-3.5 pt-2 border-t border-slate-200/80 space-y-2.5 bg-slate-50/70">
                          {/* Study Mode vs Exam Simulation */}
                          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/70 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleToggleQuizCardMode('study')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                !isExamMode
                                  ? 'bg-[#0078D4] text-white shadow-2xs'
                                  : 'text-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Study Mode (Guided)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleQuizCardMode('exam')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isExamMode
                                  ? 'bg-slate-900 text-amber-300 shadow-2xs'
                                  : 'text-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Exam Sim (45m Timer)</span>
                            </button>
                          </div>

                          {/* Quick-Swap Active Recall View Toggle (Question-First vs Answer-First) */}
                          {!isExamMode && (
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-indigo-200">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Quick-Swap Active Recall:</span>
                              </span>
                              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleSetQuickSwapMode('question-first')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                                    quickSwapMode === 'question-first'
                                      ? 'bg-[#0078D4] text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Question-First
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetQuickSwapMode('answer-first')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                                    quickSwapMode === 'answer-first'
                                      ? 'bg-indigo-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Answer-First
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Blind Recall Mode Toggle (Hide Multiple-Choice Options Initially) */}
                          {!isExamMode && (
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-emerald-200">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <EyeOff className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Blind Recall Mode (Hide Options First):</span>
                              </span>
                              <button
                                type="button"
                                onClick={handleToggleBlindRecallMode}
                                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                  isBlindRecallMode
                                    ? 'bg-emerald-700 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {isBlindRecallMode ? 'Blind Recall: ON' : 'Blind Recall: OFF'}
                              </button>
                            </div>
                          )}

                          {/* Question Difficulty Filter */}
                          {onSelectDifficultyFilter && (
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-[#0078D4]" />
                                <span>Difficulty Filter:</span>
                              </span>
                              <div className="inline-flex items-center gap-1">
                                {(['all', 'Fundamental', 'Intermediate', 'Advanced'] as const).map(
                                  (level) => {
                                    const isFiltered = selectedDifficultyFilter === level;
                                    const label =
                                      level === 'all'
                                        ? 'All'
                                        : level === 'Fundamental'
                                        ? 'Fundamental'
                                        : level === 'Intermediate'
                                        ? 'Intermediate'
                                        : 'Advanced';
                                    return (
                                      <button
                                        key={level}
                                        type="button"
                                        onClick={() => onSelectDifficultyFilter(level)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                          isFiltered
                                            ? 'bg-[#0078D4] text-white shadow-2xs'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          {/* Adaptive Difficulty & Lock Selector */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => {
                                if (activeLockedDifficulty !== null) {
                                  handleSetLockedDifficulty(null);
                                } else if (onToggleDynamicDifficulty) {
                                  onToggleDynamicDifficulty();
                                }
                              }}
                              className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer hover:text-[#0078D4]"
                            >
                              {activeLockedDifficulty !== null ? (
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-[#0078D4]" />
                              )}
                              <span>
                                {activeLockedDifficulty
                                  ? `Locked: ${activeLockedDifficulty}`
                                  : `Adaptive Engine (${
                                      rollingAverageAccuracy !== null
                                        ? `Avg ${rollingAverageAccuracy}%`
                                        : 'Auto'
                                    })`}
                              </span>
                            </button>

                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetLockedDifficulty(null)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
                                  activeLockedDifficulty === null
                                    ? 'bg-sky-600 text-white border-sky-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                Auto
                              </button>
                              {(['Fundamental', 'Intermediate', 'Advanced'] as const).map((mode) => {
                                const isLocked = activeLockedDifficulty === mode;
                                const shortMode =
                                  mode === 'Fundamental' ? 'F' : mode === 'Intermediate' ? 'I' : 'A';
                                return (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() =>
                                      handleSetLockedDifficulty(isLocked ? null : mode)
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
                                      isLocked
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                    title={`Lock difficulty to ${mode}`}
                                  >
                                    🔒{shortMode}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACCORDION SECTION 3: Learning Aids & Concept Simplifiers */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleStudyZoneSection('aids')}
                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                            3
                          </span>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              Learning Aids, Audio &amp; Notes
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ELI5 analogies, Key Terms overlay, Read Aloud speech, and Study Notes
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(showEli5Analogy || showQuickStudy || isSpeaking || hasNote) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              openStudyZoneSections.aids ? 'rotate-180 text-[#0078D4]' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {openStudyZoneSections.aids && (
                        <div className="p-3.5 pt-2 border-t border-slate-200/80 bg-slate-50/70">
                          <div className="grid grid-cols-2 gap-2">
                            {/* ELI5 Analogy Toggle */}
                            {!isExamMode && (
                              <button
                                type="button"
                                onClick={handleToggleEli5}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                  showEli5Analogy
                                    ? 'bg-amber-50 text-amber-950 border-amber-300 ring-1 ring-amber-400/30'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>ELI5 Analogy</span>
                                </span>
                                <span className="text-[10px] font-black uppercase">
                                  {showEli5Analogy ? 'ON' : 'OFF'}
                                </span>
                              </button>
                            )}

                            {/* Quick Study Key Terms */}
                            {!isExamMode && (
                              <button
                                type="button"
                                onClick={() => setShowQuickStudy(!showQuickStudy)}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                  showQuickStudy
                                    ? 'bg-orange-50 text-orange-950 border-orange-300 ring-1 ring-orange-400/30'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Key Terms</span>
                                </span>
                                <span className="text-[10px] font-black uppercase">
                                  {showQuickStudy ? 'ON' : 'OFF'}
                                </span>
                              </button>
                            )}

                            {/* Read Aloud (SpeechSynthesis) */}
                            <button
                              type="button"
                              onClick={handleToggleReadQuestion}
                              className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isSpeaking
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {isSpeaking ? (
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5 text-[#0078D4]" />
                                )}
                                <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                              </span>
                            </button>

                            {/* Study Notes Drawer with Hover Feedback */}
                            <HoverInfoFeedback
                              title="Adaptive Study Notes"
                              badge={hasNote ? 'Note Attached' : 'Empty'}
                              badgeColor={hasNote ? 'amber' : 'slate'}
                              description="Write down your personal takeaways, memory mnemonics, or tricky traps for this Azure service."
                              tip="Notes dynamically feed the Adaptive Notes Bookmark filter"
                              className="w-full"
                              align="center"
                              side="bottom"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setShowQuickNotes(true);
                                  setShowStudyZoneMenu(false);
                                }}
                                className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                  hasNote
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Study Notes</span>
                                </span>
                                {hasNote && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                              </button>
                            </HoverInfoFeedback>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACCORDION SECTION 4: Grouped Practice Tools, Simulators & Study Navigation */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleStudyZoneSection('tools')}
                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
                            4
                          </span>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              Practice Tools, Simulators &amp; Study Shortcuts
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Mock Exam, AI Scenarios, Spaced Review, Timers, Study Room &amp; Guides
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            openStudyZoneSections.tools ? 'rotate-180 text-[#0078D4]' : ''
                          }`}
                        />
                      </button>

                      {openStudyZoneSections.tools && (
                        <div className="p-3.5 pt-2 border-t border-slate-200/80 space-y-3 bg-slate-50/70">
                          {/* Candidate Guide & PDF Manual Highlight Card */}
                          {onOpenUserGuide && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenUserGuide();
                                setShowStudyZoneMenu(false);
                              }}
                              className="w-full p-2.5 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 via-white to-blue-50 hover:from-sky-100 hover:to-blue-100 text-slate-900 text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-lg bg-blue-100 text-[#0078D4] group-hover:scale-105 transition-transform">
                                  <BookOpen className="w-4 h-4" />
                                </span>
                                <div className="text-left">
                                  <span className="block font-black text-slate-900 text-xs">
                                    📘 Candidate Guide, Special Features &amp; FAQ
                                  </span>
                                  <span className="block text-[10px] text-slate-500 font-normal">
                                    How to use the studio, aims of features, 4-week study plan &amp; downloadable PDF
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-600 hover:bg-rose-500 text-white shadow-2xs shrink-0 flex items-center gap-1">
                                <span>PDF / Print</span>
                              </span>
                            </button>
                          )}

                          {/* Primary Practice Tools Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {onOpenMockExam && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenMockExam();
                                  setShowStudyZoneMenu(false);
                                }}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/60 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                                <span>45m Mock Exam</span>
                              </button>
                            )}

                            {onOpenAiGenerator && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenAiGenerator();
                                  setShowStudyZoneMenu(false);
                                }}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50/70 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Create AI Scenario</span>
                              </button>
                            )}

                            {onOpenPersonalizedReview && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenPersonalizedReview();
                                  setShowStudyZoneMenu(false);
                                }}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50/60 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Mistake Review ({unresolvedMistakesCount})</span>
                              </button>
                            )}

                            {onFinishSession && (
                              <button
                                type="button"
                                onClick={() => {
                                  onFinishSession();
                                  setShowStudyZoneMenu(false);
                                }}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/60 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Session Summary ({sessionAnsweredCount})</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={handleToggleDeepWork}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                isDeepWorkEnabled
                                  ? 'bg-blue-50 text-[#0078D4] border-blue-300'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                            >
                              <Timer className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                              <span>Deep Work Timer</span>
                            </button>

                            {onOpenStudyRoom && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenStudyRoom();
                                  setShowStudyZoneMenu(false);
                                }}
                                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-[#0078D4] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 shrink-0" />
                                <span>Peer Study Room</span>
                              </button>
                            )}

                            {onToggleFocusMode && (
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleFocusMode();
                                  setShowStudyZoneMenu(false);
                                }}
                                title={
                                  isFocusMode
                                    ? "Exit Focus Mode (press 'Ctrl+F', 'F', or 'Esc')"
                                    : "Enter Distraction-Free Focus Mode (press 'Ctrl+F' or 'F')"
                                }
                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  isFocusMode
                                    ? 'bg-[#0078D4] text-white border-[#0078D4]'
                                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isFocusMode ? (
                                    <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                                  ) : (
                                    <Maximize2 className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                                  )}
                                  <span className="truncate">{isFocusMode ? 'Exit Focus UI' : 'Focus Mode UI'}</span>
                                </div>
                                <kbd
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                    isFocusMode
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  Ctrl+F / F
                                </kbd>
                              </button>
                            )}

                            {onToggleWorkspacePanels && (
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleWorkspacePanels();
                                  setShowStudyZoneMenu(false);
                                }}
                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                  showWorkspacePanels
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>
                                  {showWorkspacePanels ? 'Hide Maps & Explorer' : 'Show Maps & Explorer'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Quick Jump Links to Study Guide, Cheat Sheets, Flashcards & AI Tutor */}
                          {onNavigateTab && (
                            <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Quick Jump to Study Resources
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(
                                  [
                                    { id: 'study-decks', label: 'Study Mode & Cheat Sheets' },
                                    { id: 'flashcards', label: 'Flashcards Deck' },
                                    { id: 'adaptive', label: 'Adaptive Lab' },
                                    { id: 'assistant', label: 'Knowledge Assistant' },
                                    { id: 'history', label: 'Review History' },
                                  ] as const
                                ).map((nav) => (
                                  <button
                                    key={nav.id}
                                    type="button"
                                    onClick={() => {
                                      onNavigateTab(nav.id);
                                      setShowStudyZoneMenu(false);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0078D4] border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>{nav.label}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Path Mistake Retry & Deep-Link Sharing Footer */}
                          <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                            {onToggleRetryIncorrectInPath && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleRetryIncorrectClick();
                                  setShowStudyZoneMenu(false);
                                }}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                                  isRetryingIncorrectInPath
                                    ? 'bg-rose-600 text-white border-rose-700'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                                }`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>
                                  {isRetryingIncorrectInPath
                                    ? 'Exit Retry Incorrect'
                                    : `Retry Incorrect (${incorrectCountInCurrentPath} • P${question.learningPathId})`}
                                </span>
                              </button>
                            )}

                            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden ml-auto">
                              <button
                                type="button"
                                onClick={handleShareDeepLinkCopy}
                                className={`px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer ${
                                  shareCopiedToast
                                    ? 'bg-emerald-600 text-white'
                                    : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {shareCopiedToast ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3.5 h-3.5 text-[#0078D4]" />
                                    <span>Share Link</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowShareModal(true);
                                  setShowStudyZoneMenu(false);
                                }}
                                className="px-2 py-1.5 border-l border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0078D4] cursor-pointer"
                                title="Open QR Code Modal"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Bookmark Button with Hover State Information Feedback */}
          <HoverInfoFeedback
            title={isBookmarked ? 'Bookmarked for Revision' : 'Bookmark Question'}
            badge={isBookmarked ? 'Saved' : 'Revision'}
            badgeColor={isBookmarked ? 'amber' : 'slate'}
            description={
              isBookmarked
                ? 'This question is currently in your high-yield bookmarks list. Click to remove.'
                : 'Bookmark this scenario to quickly review and drill on it prior to exam day.'
            }
            tip="Accessible across all devices via the Quick Filters & Switcher"
            side="bottom"
            align="right"
          >
            <button
              type="button"
              onClick={() => onBookmark(question.id)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-400 hover:text-amber-600 border-slate-200'
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark for revision'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          </HoverInfoFeedback>
        </div>
      </div>

      {/* Persistent Optional Session Countdown Timer with Gentle Milestone Alert */}
      <SessionCountdownTimer
        sessionAnsweredCount={sessionAnsweredCount}
        isAudioMuted={isAudioMuted}
        onFinishSession={onFinishSession}
      />

      {/* Persistent Exam Timer Component (Tracks active session time + visual warning when exceeding target pace) */}
      <PersistentExamTimer
        questionElapsedSeconds={scenarioElapsedSeconds}
        targetPaceSeconds={targetPaceSeconds}
        onChangeTargetPace={handleChangeTargetPace}
        hasSubmitted={hasSubmitted}
        avgCompletionSeconds={avgCompletionSeconds}
        onPausedStateChange={setIsExamTimerPaused}
      />

      <div className="p-4 sm:p-6 lg:p-8 min-w-0 w-full">
        {/* Optional Deep Work Timer Widget */}
        <DeepWorkTimerWidget
          moduleId={question.moduleId}
          moduleTitle={question.moduleTitle}
          stats={stats}
          isEnabled={isDeepWorkEnabled}
          onToggleEnabled={handleToggleDeepWork}
          className="mb-5"
        />

        {/* Quick Study Non-Obtrusive Overlay: Most Frequently Missed Key Terms for Current Module */}
        {showQuickStudy && (
          <QuickStudyOverlay
            moduleId={question.moduleId}
            moduleTitle={question.moduleTitle}
            onClose={() => setShowQuickStudy(false)}
          />
        )}

        <motion.div
          key={`quiz-card-body-${question.id}`}
          layout
          transition={{ layout: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } }}
          className={`grid gap-6 min-w-0 w-full ${
            showKnowledgeCheck || showAiTutorSidebar ? 'grid-cols-1 lg:grid-cols-12 items-start' : 'grid-cols-1'
          }`}
        >
          {/* Main Question & Answering Column */}
          <motion.div layout className={`space-y-6 min-w-0 ${showKnowledgeCheck || showAiTutorSidebar ? 'lg:col-span-8' : 'w-full'}`}>
            {/* Focus Mode Top Review Window: Presented at the top part of the view when a question is answered in Focus Mode */}
            {isFocusMode && showImmediateFeedback && (
              <div
                role="region"
                aria-label="Focus Mode Top Answer Review Window"
                className={`p-4 sm:p-5 rounded-2xl border-2 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isSelectedCorrect
                    ? 'bg-emerald-50/95 border-emerald-400 text-emerald-950'
                    : 'bg-rose-50/95 border-rose-400 text-rose-950'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    {isSelectedCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-amber-300">
                          Focus Mode Top Review Window
                        </span>
                        <span className="font-black text-sm sm:text-base">
                          {isSelectedCorrect
                            ? `Correct! Option ${question.correctAnswer} Verified`
                            : `Incorrect (Selected ${selectedOption}) • Correct Answer: Option ${question.correctAnswer}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenPersonalizedReview && unresolvedMistakesCount > 0 && (
                      <button
                        type="button"
                        onClick={onOpenPersonalizedReview}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Review Queue ({unresolvedMistakesCount})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onNext}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsRationaleExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-white/60 hover:bg-white text-xs font-bold text-slate-700 border border-slate-200 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isRationaleExpanded ? 'Hide Rationale & Exam Tip' : 'Inspect Rationale & Exam Tip (Why Correct & Tip)'}</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRationaleExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isRationaleExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                          Why Option {question.correctAnswer} is Correct
                        </span>
                        <p className="text-slate-800 leading-relaxed">{question.whyCorrect}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white/90 border border-amber-200 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                          {!isSelectedCorrect && selectedOption
                            ? `Why Option ${selectedOption} Was a Distractor`
                            : 'AZ-900 Exam Anchor Tip'}
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                          {!isSelectedCorrect && selectedOption
                            ? question.distractorBreakdown.find((d) => d.letter === selectedOption)
                                ?.reason || question.examTip
                            : question.examTip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hands-Free Text-to-Speech (TTS) Audio Reader Toolbar */}
            <QuizTtsBar
              question={question}
              showExplanation={showImmediateFeedback}
              onSpeakingChange={setIsSpeaking}
            />

            {/* Interconnecting AZ-900 Thread Tags Bar */}
            {questionThreadTags.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-0.5 whitespace-nowrap">
                    <GitBranch className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400 shrink-0" />
                    <span>Woven Threads:</span>
                  </span>
                  {questionThreadTags.map((tag) => (
                    <ThreadTagBadge
                      key={tag.id}
                      tag={tag}
                      size="sm"
                      animateOnHover
                      customTooltip={`${tag.label} — Click to view how ${tag.label} applies fundamentally in Module ${question.moduleId}`}
                      onClick={(clickedTag) => setActiveThreadModalTag(clickedTag)}
                    />
                  ))}
                </div>
                {onOpenAzureTheme && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenAzureTheme(questionThreadTags[0].themeId, question.moduleId)
                    }
                    className="text-[11px] font-semibold text-[#0078D4] dark:text-sky-400 hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Inspect in Azure Themes →
                  </button>
                )}
              </div>
            )}

            {/* Scenario Narrative Box (Full-Width Text Layout) */}
            <div className="relative w-full bg-slate-50/80 rounded-xl p-4 sm:p-5 border-l-4 border-[#0078D4] border-t border-r border-b border-slate-200/60 shadow-xs space-y-3">
              {/* Top Header Row: Scenario Context Label + Analyze Distractors / ELI5 / Knowledge Check Toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-100/70 text-[#0078D4] shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-blue-900 flex items-center gap-1.5 flex-wrap">
                    <span>Scenario Context</span>
                    <span className="text-[10px] text-slate-500 font-normal lowercase">
                      (hover/click highlighted terms for quick concept definition)
                    </span>
                  </h3>
                </div>

                {/* Quick-Swap, Analyze Distractors, ELI5 Analogy & Knowledge Check Toggle Switches (Hidden in Exam Simulation Mode) */}
                {!isExamMode ? (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Quick-Swap Segmented Mode Toggle: Question-First <-> Answer-First */}
                    <div
                      className="inline-flex items-center p-0.5 rounded-xl bg-indigo-50/90 border border-indigo-200 shadow-2xs"
                      role="group"
                      aria-label="Quick-Swap mode: toggle between Question-First and Answer-First active recall views"
                    >
                      <button
                        type="button"
                        onClick={handleToggleQuickSwapMode}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-900 hover:text-indigo-700 cursor-pointer"
                        title="Quick-Swap Mode: Instantly flip between Question-First and Answer-First views for active recall"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="hidden xl:inline">Quick-Swap:</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickSwapMode('question-first')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          quickSwapMode === 'question-first'
                            ? 'bg-[#0078D4] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Standard Question-First view: Read the scenario and select the correct option"
                      >
                        Question-First
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickSwapMode('answer-first')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          quickSwapMode === 'answer-first'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Answer-First Active Recall view: Inspect the target Azure solution and principle first, then recall the governing scenario"
                      >
                        Answer-First
                      </button>
                    </div>

                    {/* Blind Recall Mode Toggle Button */}
                    <button
                      type="button"
                      onClick={handleToggleBlindRecallMode}
                      aria-pressed={isBlindRecallMode}
                      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border shadow-2xs ${
                        isBlindRecallMode
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white border-emerald-800 ring-2 ring-emerald-400/30'
                          : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}
                      title="Blind Recall Mode: Hide the multiple-choice options initially so you can formulate or describe the concept first before revealing options"
                    >
                      {isBlindRecallMode ? (
                        <EyeOff className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>Blind Recall</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase ${
                          isBlindRecallMode
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isBlindRecallMode ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Interactive 'Analyze Distractors' Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAnalyzeDistractorsPanel((prev) => !prev);
                        setShowConceptSummaryOnly(false);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border shadow-2xs ${
                        showAnalyzeDistractorsPanel
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-700 ring-2 ring-rose-400/30'
                          : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                      title="Analyze Distractors: Explain why the incorrect answer options are wrong and map them to common Azure architectural misconceptions"
                    >
                      <ShieldAlert
                        className={`w-3.5 h-3.5 ${
                          showAnalyzeDistractorsPanel ? 'text-amber-200' : 'text-rose-600'
                        }`}
                      />
                      <span>Analyze Distractors</span>
                    </button>

                    {/* ELI5 Toggle Button */}
                    <button
                      type="button"
                      onClick={handleToggleEli5}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border shadow-2xs ${
                        showEli5Analogy
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 ring-2 ring-amber-400/30'
                          : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                      title="ELI5 (Explain Like I'm 5): Simplify this question's Azure concept into child-friendly, non-technical language"
                    >
                      <Sparkles
                        className={`w-3.5 h-3.5 ${
                          showEli5Analogy ? 'text-yellow-200' : 'text-amber-500'
                        }`}
                      />
                      <span>ELI5</span>
                      <div
                        className={`w-6 h-3.5 rounded-full transition-colors flex items-center p-0.5 ${
                          showEli5Analogy ? 'bg-amber-900/40' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                            showEli5Analogy ? 'translate-x-2.5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Knowledge Check Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setShowKnowledgeCheck(!showKnowledgeCheck)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                        showKnowledgeCheck
                          ? 'bg-gradient-to-r from-blue-50 to-sky-50 text-[#0078D4] border-sky-300 ring-2 ring-sky-400/20'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                      title="Toggle concise Key Concept Definition side-panel for core Azure terminology in this scenario"
                    >
                      <BookOpen className={`w-3.5 h-3.5 ${showKnowledgeCheck ? 'text-[#0078D4]' : 'text-slate-400'}`} />
                      <span>Knowledge Check</span>

                      <div
                        className={`w-7 h-4 rounded-full transition-colors flex items-center p-0.5 ${
                          showKnowledgeCheck ? 'bg-[#0078D4]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                            showKnowledgeCheck ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 text-amber-300 border border-slate-700 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Exam Mode • Hints Disabled</span>
                  </span>
                )}
              </div>

              {/* Answer-First Active Recall Card (Shown at the top when Quick-Swap is set to 'answer-first') */}
              {!isExamMode && quickSwapMode === 'answer-first' && (() => {
                const targetOption = question.options.find(
                  (o) => o.letter === question.correctAnswer
                );
                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-[#003E73] text-white border border-indigo-400/40 shadow-lg space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/15">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white border border-indigo-300/50 flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3 text-amber-300" />
                          <span>Quick-Swap • Answer-First Active Recall</span>
                        </span>
                        <span className="text-[11px] text-indigo-200 font-semibold hidden sm:inline">
                          Study the solution first, then recall the scenario &amp; requirement it solves
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetQuickSwapMode('question-first')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 border border-white/20 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Swap to Question-First</span>
                      </button>
                    </div>

                    {/* Target Correct Solution Banner */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-start gap-3">
                      <span className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {question.correctAnswer}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                          Target Azure Solution / Answer
                        </div>
                        <div className="text-base sm:text-lg font-black text-white leading-snug">
                          {targetOption?.text || question.correctAnswer}
                        </div>
                      </div>
                    </div>

                    {/* Core Architectural Rationale & Exam Tip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Governing Architectural Rationale</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {question.whyCorrect}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                          <span>AZ-900 Exam Anchor Cue</span>
                        </div>
                        <p className="text-xs text-amber-100 leading-relaxed">
                          {question.examTip}
                        </p>
                      </div>
                    </div>

                    {/* Active Recall Prompt & Self-Verification Controls */}
                    <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-xs text-indigo-100 font-semibold">
                        <strong className="text-amber-300">Active Recall Prompt:</strong> Which business scenario &amp; requirement uniquely demands{' '}
                        <span className="underline decoration-emerald-400 font-bold text-white">
                          {targetOption?.text}
                        </span>
                        ?
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setIsAnswerFirstScenarioRevealed((prev) => !prev)
                          }
                          className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {isAnswerFirstScenarioRevealed
                              ? 'Hide Scenario Prompt'
                              : 'Reveal Scenario & Question'}
                          </span>
                        </button>

                        {!hasSubmitted && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSelect(question.correctAnswer)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                              title="Record that you accurately recalled the matching scenario and principle"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Recalled Correctly</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const fallbackWrong =
                                  question.options.find(
                                    (o) => o.letter !== question.correctAnswer
                                  )?.letter || 'A';
                                handleSelect(fallbackWrong);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-400/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Mark this concept for spaced repetition review"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Need Practice</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Full-Width Scenario Text Body (Always visible in Question-First mode, or when revealed in Answer-First mode) */}
              {(isExamMode ||
                quickSwapMode === 'question-first' ||
                isAnswerFirstScenarioRevealed ||
                hasSubmitted) && (
                <div className="w-full max-w-none">
                  <ScenarioTextWithTooltips
                    text={question.scenario}
                    concepts={scenarioConcepts}
                    onSelectConcept={setSelectedConceptId}
                    isKnowledgeCheckActive={showKnowledgeCheck}
                    onActivateKnowledgeCheck={() => setShowKnowledgeCheck(true)}
                    textClassName="w-full max-w-none text-slate-700 text-sm sm:text-base leading-relaxed font-normal"
                  />
                </div>
              )}

              {/* ELI5 Child-Friendly Analogy Card (When ELI5 Toggle is Active) */}
              {showEli5Analogy && !isExamMode && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50/70 to-orange-50/60 border border-amber-300/90 space-y-2 shadow-2xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px]">
                        ELI5 Analogy
                      </span>
                      <span>{eli5Content.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleEli5}
                      className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      Hide ELI5
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {eli5Content.analogy}
                  </p>
                  <div className="pt-1.5 border-t border-amber-200/80 text-xs text-amber-950 font-semibold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Simple Rule:</strong> {eli5Content.takeaway}
                    </span>
                  </div>
                </div>
              )}

              {/* On-Demand 'Analyze Distractors' Architectural Misconception Drawer (When toggled in Study Mode before answering) */}
              {showAnalyzeDistractorsPanel && !showImmediateFeedback && !isExamMode && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-rose-50/85 via-white to-amber-50/50 border border-rose-200/90 space-y-3 shadow-xs animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-rose-200/70">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-900">
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px]">
                        Analyze Distractors
                      </span>
                      <span>Azure Architectural Misconception Breakdown</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAnalyzeDistractorsPanel(false)}
                      className="text-[11px] font-bold text-rose-800 hover:underline cursor-pointer"
                    >
                      Hide Distractor Analysis
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {question.distractorBreakdown.map((distractor) => {
                      const misconception = getArchitecturalMisconceptionForDistractor(
                        question,
                        distractor.letter,
                        distractor.reason
                      );
                      const distractorOptionText =
                        question.options.find((o) => o.letter === distractor.letter)?.text || '';
                      return (
                        <div
                          key={distractor.letter}
                          className="p-3 rounded-xl bg-white border border-rose-200/80 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-black">
                                Option {distractor.letter}
                              </span>
                              <span className="text-xs font-extrabold text-slate-900">
                                {distractorOptionText}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                              <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{misconception.misconceptionName}</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <strong className="text-slate-900">Why Incorrect: </strong>
                            {distractor.reason}
                          </p>
                          <div className="px-2.5 py-1.5 rounded-lg bg-sky-50/80 border border-sky-200/70 text-[11px] text-slate-700">
                            <strong className="text-[#005A9E] font-extrabold">
                              Architectural Rule ({misconception.domainTag}):{' '}
                            </strong>
                            <span>{misconception.counterRule}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

        {/* Skip Notification Banner */}
        {skipFeedbackToast && (
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <SkipForward className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{skipFeedbackToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSkipFeedbackToast(null)}
              className="text-[11px] font-extrabold text-amber-800 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Actual Exam Question + Prominent Difficulty Badge + Voice Answer & Skip Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${difficultyBadgeConfig.pillClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${difficultyBadgeConfig.dotClass}`} />
                <span>Difficulty: {difficultyBadgeConfig.label}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {difficultyBadgeConfig.subLabel}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              <ScenarioTextWithTooltips
                text={question.question}
                concepts={scenarioConcepts}
                onSelectConcept={setSelectedConceptId}
                isKnowledgeCheckActive={showKnowledgeCheck}
                onActivateKnowledgeCheck={() => setShowKnowledgeCheck(true)}
                textClassName="text-base sm:text-lg font-bold text-slate-900 leading-snug"
              />
            </div>

            {/* Azure Concept Snap Interactive Service Pills */}
            {!isExamMode && scenarioConcepts.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#0078D4] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80">
                  <Zap className="w-3 h-3 text-[#0078D4] fill-sky-200" />
                  <span>Azure Concept Snap:</span>
                </span>
                {scenarioConcepts.slice(0, 4).map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => {
                      setSelectedConceptId(concept.id);
                      setShowKnowledgeCheck(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0078D4] border border-slate-200 hover:border-sky-300 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                    title={`${concept.term}: ${concept.officialDefinition}`}
                  >
                    <span>{concept.term.split('(')[0].trim()}</span>
                    {concept.acronym && (
                      <span className="text-[9px] font-black text-[#005A9E] bg-sky-100 px-1 rounded">
                        {concept.acronym}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Choose the single best answer that meets all architectural criteria (or click <strong>Skip</strong> to defer for Weak Areas review without penalty):
            </p>
          </div>

          {!hasSubmitted && (
            <div className="flex items-center gap-2 shrink-0 self-start">
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all cursor-pointer"
                title="Skip this question without penalty or completion and mark it for later review in Weak Areas"
              >
                <SkipForward className="w-3.5 h-3.5 text-amber-600" />
                <span>Skip</span>
              </button>

              <button
                type="button"
                onClick={handleToggleVoiceAnswer}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  isListeningVoiceAnswer
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/40 animate-pulse'
                    : 'bg-sky-50 hover:bg-sky-100 text-[#0078D4] border-sky-200 shadow-2xs'
                }`}
                title='Speak option index (e.g., "Option one", "Option two", "Option three", "Option four") to answer hands-free'
              >
                {isListeningVoiceAnswer ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span>Listening (&ldquo;Option 1–4&rdquo;)...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Voice Answer</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {voiceAnswerTranscript && (
          <div className="px-3.5 py-2 rounded-xl bg-sky-50/90 border border-sky-200 text-xs font-semibold text-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
              <span>{voiceAnswerTranscript}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceAnswerTranscript(null)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* BLIND RECALL MODE: Initial Concept Formulation Gate (Hides 4 Choices Until User Attempts Recall & Reveals Options) */}
        {!isExamMode && isBlindRecallMode && !isBlindRecallOptionsRevealed && !hasSubmitted ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/40 shadow-lg space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/15">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <EyeOff className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block">
                    Blind Recall Mode • Multiple-Choice Options Hidden
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Attempt to answer or describe the target Azure concept in your own words first, then reveal the options to verify your understanding.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBlindRecallMode}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Exit Blind Recall
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`blind-recall-input-${question.id}`}
                className="block text-xs font-extrabold text-amber-300"
              >
                Your Initial Answer / Concept Hypothesis:
              </label>
              <textarea
                id={`blind-recall-input-${question.id}`}
                rows={2}
                value={blindRecallAttemptText}
                onChange={(e) => setBlindRecallAttemptText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    setIsBlindRecallOptionsRevealed(true);
                  }
                }}
                placeholder="Type the Azure service name, architectural tier, or governing concept you believe solves this question (or formulate it mentally)..."
                className="w-full rounded-xl bg-slate-950/80 border border-emerald-400/40 focus:border-amber-400 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <span className="text-[11px] text-slate-300">
                {blindRecallAttemptText.trim().length > 0
                  ? `✓ Concept drafted (${blindRecallAttemptText.trim().split(/\s+/).length} words) — ready to reveal options!`
                  : 'Tip: Even a 2–3 word service guess strengthens long-term retrieval pathways.'}
              </span>

              <button
                type="button"
                onClick={() => setIsBlindRecallOptionsRevealed(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>Reveal Multiple-Choice Options (A–D)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Compact Summary Banner when Blind Recall Options have been revealed */}
            {!isExamMode && isBlindRecallMode && (isBlindRecallOptionsRevealed || hasSubmitted) && (
              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="truncate">
                    <span className="font-black uppercase tracking-wider text-[10px] text-emerald-800 mr-1.5">
                      Your Blind Recall Hypothesis:
                    </span>
                    <span className="font-semibold italic text-slate-800">
                      {blindRecallAttemptText.trim()
                        ? `"${blindRecallAttemptText.trim()}"`
                        : '(Mental recall formulated)'}
                    </span>
                  </div>
                </div>
                {!hasSubmitted && (
                  <button
                    type="button"
                    onClick={() => setIsBlindRecallOptionsRevealed(false)}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    Hide Options Again
                  </button>
                )}
              </div>
            )}

            {/* 4 Choices (A, B, C, D) with subtle staggered fade-in-up entrance animation */}
            <div className="space-y-3">
              {question.options.map((option, optIdx) => {
            const isSelected = selectedOption === option.letter;
            const isCorrectOption = option.letter === question.correctAnswer;

            let cardStyles =
              'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800';
            let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';

            if (showImmediateFeedback) {
              if (isCorrectOption) {
                cardStyles =
                  'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20';
                badgeStyles = 'bg-emerald-600 text-white border-emerald-600';
              } else if (isSelected && !isCorrectOption) {
                cardStyles =
                  'border-red-400 bg-red-50/80 text-red-950 ring-2 ring-red-400/20';
                badgeStyles = 'bg-red-600 text-white border-red-600';
              } else {
                cardStyles = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60';
                badgeStyles = 'bg-slate-200 text-slate-400 border-slate-300';
              }
            } else if (isSelected) {
              cardStyles =
                'border-[#0078D4] bg-blue-50/70 text-blue-900 ring-2 ring-[#0078D4]/20';
              badgeStyles = 'bg-[#0078D4] text-white border-[#0078D4]';
            }

            return (
              <div
                key={`${question.id}-${option.letter}`}
                style={{ animationDelay: `${optIdx * 45}ms` }}
                className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 sm:gap-3.5 group animate-quiz-option-fade-in-up ${cardStyles}`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(option.letter)}
                  disabled={hasSubmitted}
                  className="flex items-start gap-3 sm:gap-3.5 grow text-left cursor-pointer focus:outline-none min-w-0"
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${badgeStyles}`}
                  >
                    {showImmediateFeedback && isCorrectOption ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : showImmediateFeedback && isSelected && !isCorrectOption ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      option.letter
                    )}
                  </span>
                  <span className="text-sm sm:text-base font-medium pt-1 grow leading-relaxed">
                    {option.text}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center mt-1 sm:mt-0">
                  {showImmediateFeedback && isCorrectOption && (
                    <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                      Correct Answer
                    </span>
                  )}
                  {isAnswered && isExamMode && !examFeedbackRevealed && isSelected && (
                    <span className="shrink-0 text-xs font-bold text-[#0078D4] bg-blue-100 px-2.5 py-1 rounded-md">
                      Answer Recorded
                    </span>
                  )}

                  {/* 'Ask AI' button for this option */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAiAboutOption(option);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300/80 shadow-2xs hover:shadow-xs hover:border-amber-400 transition-all cursor-pointer shrink-0"
                    title={`Ask AI why Option ${option.letter} is ${isCorrectOption ? 'correct' : 'incorrect'} in the Knowledge Assistant sidebar`}
                    aria-label={`Ask AI why Option ${option.letter} is ${isCorrectOption ? 'correct' : 'incorrect'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 fill-amber-400" />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
          </>
        )}

        {/* Exam Simulation Mode Locked Answer Banner (No Immediate Feedback) */}
        {isAnswered && isExamMode && !examFeedbackRevealed && (
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold block text-white">
                  Exam Simulation Mode: Option {selectedOption} Recorded
                </span>
                <span className="text-slate-300">
                  Immediate feedback and hints are hidden during Exam Simulation Mode. Proceed to the next question or inspect the breakdown below.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExamFeedbackRevealed(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors cursor-pointer"
              >
                Reveal Explanation
              </button>
              {questionIndex < totalQuestions - 1 && (
                <button
                  type="button"
                  onClick={onNext}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active 'Retry Incorrect' Filter Banner or Info Notice */}
        {(isRetryingIncorrectInPath || retryNoticeMessage) && (
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 text-xs ${
              isRetryingIncorrectInPath
                ? 'bg-rose-50/90 border-rose-300 text-rose-900'
                : 'bg-amber-50/90 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Filter
                className={`w-4 h-4 shrink-0 ${
                  isRetryingIncorrectInPath ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <span>
                {isRetryingIncorrectInPath
                  ? `Filtered to Previously Missed Questions in Learning Path ${question.learningPathId} (${questionIndex + 1} of ${totalQuestions})`
                  : retryNoticeMessage}
              </span>
            </div>
            {isRetryingIncorrectInPath ? (
              <button
                type="button"
                onClick={() =>
                  onToggleRetryIncorrectInPath &&
                  onToggleRetryIncorrectInPath(question.learningPathId)
                }
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] transition-colors cursor-pointer"
              >
                Show All Path {question.learningPathId} Questions
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRetryNoticeMessage(null)}
                className="px-2 py-0.5 rounded bg-white/80 hover:bg-white text-amber-900 border border-amber-300 font-bold text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* INLINE PERSONAL STUDY NOTES TEXT-AREA (Persisted to LocalStorage per Question) */}
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-4 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={`study-note-textarea-${question.id}`}
              className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900 cursor-pointer"
            >
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200/80">
                <StickyNote className="w-3.5 h-3.5" />
              </span>
              <span>Personal Study Notes • Question {question.id.toUpperCase()}</span>
              {hasNote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Check className="w-2.5 h-2.5" />
                  {noteSavedFeedback ? 'Saved to LocalStorage' : 'Saved Note'}
                </span>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {/* Browser SpeechRecognition API Microphone Button for Hands-Free Study Notes */}
              <button
                type="button"
                onClick={handleToggleVoiceNote}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                  isRecordingNote
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/40 animate-pulse'
                    : 'bg-white hover:bg-blue-50 text-[#0078D4] border-blue-200 shadow-2xs'
                }`}
                title={
                  isRecordingNote
                    ? 'Stop voice transcription'
                    : 'Record and transcribe your study notes hands-free using browser SpeechRecognition'
                }
              >
                {isRecordingNote ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span>Stop Dictation</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Voice Note</span>
                  </>
                )}
              </button>

              {hasNote && (
                <button
                  type="button"
                  onClick={handleClearInlineNote}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Clear personal note for this question"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowQuickNotes(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <FileText className="w-3 h-3 text-amber-600" />
                <span>All Saved Notes</span>
              </button>
              <button
                type="button"
                onClick={handleExportAllNotesMarkdown}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-extrabold transition-colors shadow-2xs cursor-pointer"
                title="Export all saved question notes and memory anchors as a formatted Markdown (.md) file for offline study"
              >
                <Download className="w-3 h-3" />
                <span>Export Notes &amp; Anchors (.md)</span>
              </button>
            </div>
          </div>

          {markdownExportToast && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{markdownExportToast}</span>
              </span>
              <button
                type="button"
                onClick={() => setMarkdownExportToast(null)}
                className="text-emerald-700 font-extrabold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {speechError && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center justify-between gap-2">
              <span>{speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              id={`study-note-textarea-${question.id}`}
              value={questionNoteText}
              onChange={handleInlineNoteChange}
              rows={2}
              placeholder={
                isRecordingNote
                  ? 'Listening... Speak your study note clearly to transcribe hands-free...'
                  : `Attach your personal study notes, memory hooks, or click 'Voice Note' to dictate hands-free for ${question.moduleTitle} (${question.id.toUpperCase()})...`
              }
              className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-y leading-relaxed ${
                isRecordingNote
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-amber-200/90 bg-white/95 focus:ring-[#0078D4] focus:border-[#0078D4]'
              }`}
            />
            <button
              type="button"
              onClick={handleToggleVoiceNote}
              className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                isRecordingNote
                  ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                  : 'text-slate-400 hover:text-[#0078D4] hover:bg-blue-50'
              }`}
              title={
                isRecordingNote
                  ? 'Stop hands-free voice dictation'
                  : 'Dictate study note with microphone (SpeechRecognition API)'
              }
              aria-label="Toggle microphone voice dictation for study notes"
            >
              {isRecordingNote ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {isRecordingNote ? (
                <strong className="text-rose-600 animate-pulse">
                  ● Recording &amp; transcribing speech into your study note...
                </strong>
              ) : (
                <>
                  Persisted automatically in browser local storage for Question{' '}
                  <strong className="text-slate-700">{question.id.toUpperCase()}</strong>
                </>
              )}
            </span>
            <span>{questionNoteText.length} chars</span>
          </div>
        </div>

        {/* INSTANT FEEDBACK & BREAKDOWN ENGINE (Shown immediately in Study Mode, or when revealed in Exam Mode) */}
        {showImmediateFeedback && (
          <motion.div
            ref={feedbackExplanationRef}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 space-y-5"
          >
            {/* Status Header Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-cascade-1 ${
                isSelectedCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isSelectedCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-base">
                    {isSelectedCorrect
                      ? 'Spot On! Correct Choice.'
                      : `Not Quite. The correct answer is ${question.correctAnswer}`}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Review the Azure Curriculum architecture breakdown below:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAiTutorSidebar(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Ask AI Tutor</span>
              </button>
            </div>

            {/* If Incorrect: Targeted Diagnostic Analysis & Smart Knowledge Assistant Explanation */}
            {!isSelectedCorrect && selectedOption && (
              <div className="space-y-4 animate-cascade-2">
                <div className="bg-red-50/70 rounded-xl p-5 border border-red-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      !
                    </span>
                    <span>Diagnostic Breakdown: Where & Why You Stumbled</span>
                  </div>
                  <div className="text-xs sm:text-sm text-red-950 bg-white/80 p-3.5 rounded-lg border border-red-200/60 leading-relaxed">
                    <span className="font-bold text-red-700 block mb-1">
                      Your Selection: Option {selectedOption}
                    </span>
                    {question.distractorBreakdown.find((d) => d.letter === selectedOption)?.reason ||
                      'This option does not satisfy all architectural constraints in the scenario.'}
                  </div>
                  <div className="text-xs text-red-800 flex items-center gap-1.5 pt-1 font-medium">
                    <span className="font-bold">Corrective Prescription:</span>
                    <span>Review the constraints in the scenario carefully before deciding between IaaS, PaaS, or SaaS boundaries.</span>
                  </div>
                </div>

                {/* Smart Explanation from Knowledge Assistant */}
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-xl p-5 border-2 border-orange-300 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-orange-950 font-black text-sm">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs shadow-xs">
                        🤖
                      </div>
                      <span>Smart Knowledge Assistant Explanation &amp; Trap Analysis</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-200 text-orange-950">
                      Personalized Breakdown
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-900 bg-white/90 p-4 rounded-xl border border-orange-200 shadow-2xs space-y-2.5 leading-relaxed">
                    <div>
                      <span className="font-extrabold text-orange-800 block text-xs uppercase tracking-wide">
                        Trap Analysis (Why Option {selectedOption} misled you):
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {question.distractorBreakdown.find((d) => d.letter === selectedOption)?.reason ||
                          'This choice overlooks the primary architectural boundary or pricing/governance tier required in the scenario.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-orange-100">
                      <span className="font-extrabold text-emerald-800 block text-xs uppercase tracking-wide">
                        Step-by-Step Correct Principle (Why Option {question.correctAnswer} is correct):
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {question.whyCorrect}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-orange-100 flex items-start gap-2 bg-amber-50/80 p-2.5 rounded-lg border border-amber-300/60">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-amber-950 text-xs">Exam Memory Anchor Rule:</span>
                        <p className="text-amber-900 text-xs mt-0.5">{question.examTip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Why It's Correct */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200 animate-cascade-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Why Option {question.correctAnswer} is Correct:</span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSpeakWhyCorrect}
                  aria-label={
                    isSpeakingWhyCorrect
                      ? 'Stop reading why option is correct aloud'
                      : 'Read why option is correct aloud'
                  }
                  aria-pressed={isSpeakingWhyCorrect}
                  title={
                    isSpeakingWhyCorrect
                      ? 'Stop reading explanation'
                      : 'Hear explanation read aloud (Web Speech API)'
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                    isSpeakingWhyCorrect
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs ring-2 ring-emerald-400/40'
                      : 'bg-white hover:bg-emerald-100/70 text-emerald-800 border-emerald-300 shadow-2xs'
                  }`}
                >
                  {isSpeakingWhyCorrect ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                      <span>Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {question.whyCorrect}
              </p>
              {ttsFeedbackError && (
                <p className="mt-2 text-xs font-semibold text-rose-700">
                  {ttsFeedbackError}
                </p>
              )}
            </div>

            {/* Analyze Distractors (Azure Architectural Misconception Mapper) OR 1-Sentence Concept Summary Toggle */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 animate-cascade-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  {showConceptSummaryOnly ? (
                    <>
                      <BookOpen className="w-4 h-4 text-[#0078D4]" />
                      <span>Foundational Principle (1-Sentence Concept Summary):</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Analyze Distractors • Azure Architectural Misconception Mapper:</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {showConceptSummaryOnly && (
                    <button
                      type="button"
                      onClick={() => setShowConceptSummaryOnly(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-600 text-white border border-rose-700 shadow-2xs cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Analyze Distractors</span>
                    </button>
                  )}

                  {/* Concept Summary Toggle Button with Hover State Information */}
                  <HoverInfoFeedback
                    title="Concept Summary vs. Distractors"
                    badge={showConceptSummaryOnly ? 'Concept View' : 'Distractor View'}
                    badgeColor="blue"
                    description="Switch between an architectural misconception breakdown for each wrong choice, or a concise 1-sentence foundational rule."
                    tip="High-yield synthesis for rapid revision"
                    side="top"
                    align="right"
                  >
                    <button
                      type="button"
                      onClick={handleToggleConceptSummary}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        showConceptSummaryOnly
                          ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                          : 'bg-white hover:bg-blue-50 text-[#0078D4] border-sky-200 shadow-2xs'
                      }`}
                      aria-label="Toggle between Analyze Distractors and 1-Sentence Concept Summary"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${showConceptSummaryOnly ? 'text-amber-300' : 'text-[#0078D4]'}`} />
                      <span>{showConceptSummaryOnly ? 'Showing Summary' : 'Concept Summary'}</span>
                      <div
                        className={`w-6 h-3.5 rounded-full transition-colors flex items-center p-0.5 ${
                          showConceptSummaryOnly ? 'bg-amber-400' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                            showConceptSummaryOnly ? 'translate-x-2.5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </HoverInfoFeedback>
                </div>
              </div>

              {showConceptSummaryOnly ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-amber-50/40 border-l-4 border-[#0078D4] border-t border-r border-b border-sky-200/80 text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed shadow-2xs">
                  {getFoundationalConceptSentence(question)}
                </div>
              ) : (
                <div className="space-y-3">
                  {question.distractorBreakdown.map((distractor) => {
                    const misconception = getArchitecturalMisconceptionForDistractor(
                      question,
                      distractor.letter,
                      distractor.reason
                    );
                    const distractorOptionText =
                      question.options.find((o) => o.letter === distractor.letter)?.text || '';
                    const wasChosenByUser = selectedOption === distractor.letter;

                    return (
                      <div
                        key={distractor.letter}
                        className={`p-3.5 rounded-xl bg-white border transition-all space-y-2 ${
                          wasChosenByUser
                            ? 'border-red-300 ring-2 ring-red-500/15 bg-red-50/20'
                            : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-red-700 shrink-0 px-2 py-0.5 bg-red-50 rounded-md border border-red-200 text-xs">
                              Option {distractor.letter}
                            </span>
                            {distractorOptionText && (
                              <span className="text-xs font-extrabold text-slate-900">
                                {distractorOptionText}
                              </span>
                            )}
                            {wasChosenByUser && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                                Your Choice
                              </span>
                            )}
                          </div>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Misconception: {misconception.misconceptionName}</span>
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                          <strong className="font-bold text-slate-900">Why It Is Wrong: </strong>
                          {distractor.reason}
                        </p>

                        <div className="px-3 py-2 rounded-lg bg-sky-50/70 border border-sky-200/70 text-[11px] text-slate-700 flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-[#0078D4] shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-extrabold text-[#005A9E]">
                              Azure Architectural Rule ({misconception.domainTag}):{' '}
                            </strong>
                            <span>{misconception.counterRule}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Exam Tip Card - Savannah Gold / Warm Ochre */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-50/80 to-yellow-50 rounded-xl p-5 border border-amber-300/80 shadow-xs animate-cascade-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                  <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-extrabold text-xs tracking-wider uppercase text-amber-900">
                        💡 Exam Memory Anchor Tip
                      </h5>
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                        High Yield
                      </span>
                    </div>
                    <p className="text-amber-950 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                      {question.examTip}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handlePinCurrentAnchor}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border flex items-center gap-1 transition-colors cursor-pointer ${
                      isAnchorPinned
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                    title="Pin this question's memory anchor for offline Markdown export"
                  >
                    <Anchor className="w-3 h-3" />
                    <span>{isAnchorPinned ? 'Anchor Pinned ✓' : 'Pin Memory Anchor'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAllNotesMarkdown}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Export all saved question notes and memory anchors as a formatted Markdown (.md) file"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export .MD</span>
                  </button>
                </div>
              </div>
            </div>

            {/* User Confidence Scoring Prompt (1-5 Scale) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-[#0B2545] to-[#134074] text-white border border-slate-800 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                      Confidence Check
                    </span>
                    <h5 className="text-xs font-bold text-sky-100">
                      Rate your confidence for this question:
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Helps isolate lucky guesses from solid comprehension across Azure topics.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { level: 1, label: 'Guessing', color: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border-rose-500/40' },
                    { level: 2, label: 'Low', color: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500 hover:text-white border-orange-500/40' },
                    { level: 3, label: 'Moderate', color: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border-amber-500/40' },
                    { level: 4, label: 'High', color: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border-sky-500/40' },
                    { level: 5, label: 'Mastered', color: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border-emerald-500/40' },
                  ].map((item) => {
                    const isSelected = userConfidence === item.level;
                    return (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => handleRateConfidence(item.level)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm scale-105 ring-2 ring-amber-300/50'
                            : item.color
                        }`}
                        title={`Rate confidence: ${item.level} (${item.label})`}
                      >
                        <span>{item.level}</span>
                        <span className="hidden sm:inline text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {confidenceToast && (
                <div className="mt-2 text-center text-[11px] font-bold text-amber-300 animate-pulse">
                  ✓ {confidenceToast}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={questionIndex === 0}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct 'Retry Incorrect' Button in Footer for Current Learning Path */}
            {onToggleRetryIncorrectInPath && (
              <button
                type="button"
                onClick={handleRetryIncorrectClick}
                className={`px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRetryingIncorrectInPath
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs'
                    : incorrectCountInCurrentPath > 0
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
                title={`Filter current quiz session to only show previously missed questions in Learning Path ${question.learningPathId}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {isRetryingIncorrectInPath
                    ? `Exit Retry Incorrect (Path ${question.learningPathId})`
                    : `Retry Incorrect (${incorrectCountInCurrentPath} in Path ${question.learningPathId})`}
                </span>
              </button>
            )}

            {isAnswered && (
              <button
                onClick={() => {
                  setSelectedOption(null);
                  setHasSubmitted(false);
                }}
                className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset and re-attempt this specific question"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Attempt Question</span>
              </button>
            )}

            {onFinishSession && (isAnswered || sessionAnsweredCount > 0 || questionIndex === totalQuestions - 1) && (
              <button
                type="button"
                onClick={onFinishSession}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Conclude this quiz session, identify your lowest-scoring modules, and generate a separate Weak-Area Review question set"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Finish Session &amp; Review Weak Areas</span>
              </button>
            )}

            {!isAnswered && (
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-sm font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Skip question without penalty or completion and mark it for later review in Weak Areas"
              >
                <SkipForward className="w-4 h-4 text-amber-600" />
                <span>Skip</span>
              </button>
            )}

            {questionIndex < totalQuestions - 1 && (
              <button
                onClick={onNext}
                className="px-5 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

        {/* Right Side-Panel: Contextual 'Ask AI Tutor' & Knowledge Assistant Sidebar Next to QuizCard */}
        {(showKnowledgeCheck || showAiTutorSidebar) && (
          <div className="lg:col-span-4 sticky top-4 space-y-4">
            {showAiTutorSidebar && (
              <aside
                aria-label="Contextual Ask AI Tutor & Knowledge Assistant Sidebar"
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-400/90 dark:border-amber-500/80 shadow-xl overflow-hidden flex flex-col max-h-[680px] animate-in slide-in-from-right-4 duration-200"
              >
                {/* Sidebar Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#0078D4] text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-yellow-200 flex items-center justify-center font-black shrink-0 border border-white/25">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
                          Ask AI Tutor · Knowledge Assistant
                        </h4>
                      </div>
                      <p className="text-[11px] font-semibold text-amber-100 truncate">
                        Pre-filled · Module {question.moduleId}: {question.moduleTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenAiTutorDrawer && (
                      <button
                        type="button"
                        onClick={() => onOpenAiTutorDrawer(question, focusedAiOption || selectedOption)}
                        className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-extrabold border border-white/25 transition-colors cursor-pointer"
                        title="Open in expandable full-height Knowledge Assistant drawer"
                      >
                        Drawer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAiTutorSidebar(false)}
                      className="text-white/85 hover:text-white p-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                      aria-label="Close Ask AI Tutor sidebar"
                      title="Close Ask AI Tutor sidebar"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pre-Filled Active Question & Option Distractor Context Box */}
                <div className="bg-sky-50/90 dark:bg-slate-800/90 border-b border-sky-200 dark:border-slate-700 px-3.5 py-2.5 shrink-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-[10px] uppercase tracking-wider text-[#005A9E] dark:text-sky-300 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>Pre-Filled Question Details ({question.difficulty})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAiContextExpanded((prev) => !prev)}
                      className="text-[10px] font-extrabold text-[#0078D4] hover:underline cursor-pointer"
                    >
                      {isAiContextExpanded ? 'Collapse' : 'Expand Details'}
                    </button>
                  </div>

                  <p className="font-bold text-slate-900 dark:text-white leading-snug text-xs">
                    {question.question}
                  </p>

                  {isAiContextExpanded && (
                    <div className="space-y-1.5 pt-1 border-t border-sky-200/70 dark:border-slate-700">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                        Scenario: {question.scenario}
                      </p>
                      {/* Per-Option Quick Distractor Breakdown Pills inside Sidebar */}
                      <div className="pt-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          Click an option to analyze why it is right or wrong:
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          {question.options.map((opt) => {
                            const isFocused = focusedAiOption === opt.letter;
                            return (
                              <button
                                key={opt.letter}
                                type="button"
                                onClick={() => handleAskAiAboutOption(opt)}
                                className={`px-2 py-1 rounded-lg border text-left text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1 ${
                                  isFocused
                                    ? 'bg-amber-100 border-amber-400 text-amber-950 ring-1 ring-amber-400/50'
                                    : 'bg-white dark:bg-slate-900 hover:bg-amber-50/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                                title={`Trigger contextual breakdown for Option ${opt.letter}: ${opt.text}`}
                              >
                                <span className="truncate">
                                  <strong className="text-[#005A9E] dark:text-sky-300">{opt.letter}.</strong> {opt.text}
                                </span>
                                <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1-Tap Clarification Chips */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <button
                      type="button"
                      disabled={isAiTutorLoading}
                      onClick={() =>
                        handleSendAiTutorClarification(
                          `Clarify the key Azure concept in this Module ${question.moduleId} question and how to spot the right answer quickly.`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-[#0078D4] hover:bg-[#005A9E] text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-40"
                    >
                      Clarify Concept
                    </button>
                    <button
                      type="button"
                      disabled={isAiTutorLoading}
                      onClick={() =>
                        handleSendAiTutorClarification(
                          `Break down why each distractor in this question is incorrect and what exam trap it represents.`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-50 text-slate-800 border border-slate-300 text-[10px] font-extrabold cursor-pointer disabled:opacity-40"
                    >
                      All Distractors
                    </button>
                    <button
                      type="button"
                      disabled={isAiTutorLoading}
                      onClick={() =>
                        handleSendAiTutorClarification(
                          `Give me a simple analogy and memory rule for this AZ-900 scenario.`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-sky-50 text-[#005A9E] border border-sky-200 text-[10px] font-extrabold cursor-pointer disabled:opacity-40"
                    >
                      Memory Analogy
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/50 text-xs min-h-[220px]">
                  {aiTutorMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                        msg.role === 'assistant'
                          ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs'
                          : 'bg-[#0078D4] text-white ml-5 shadow-2xs'
                      }`}
                    >
                      <span className="font-black block text-[10px] uppercase tracking-wider mb-1 opacity-80">
                        {msg.role === 'assistant' ? 'Knowledge Assistant • AI Tutor' : 'You'}
                      </span>
                      {msg.text}
                    </div>
                  ))}
                  {isAiTutorLoading && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>Analyzing scenario &amp; Microsoft Learn grounding...</span>
                    </div>
                  )}
                  <div ref={aiTutorFeedBottomRef} />
                </div>

                {/* Clarification Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiTutorClarification();
                  }}
                  className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 items-center shrink-0"
                >
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={aiTutorInput}
                      onChange={(e) => setAiTutorInput(e.target.value)}
                      placeholder={
                        isRecordingAiTutor
                          ? 'Listening to your voice...'
                          : 'Ask for clarification on this question...'
                      }
                      className={`w-full px-3 py-2 pr-8 rounded-xl border text-xs focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${
                        isRecordingAiTutor
                          ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-400'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-[#0078D4]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleToggleAiTutorVoice}
                      className={`absolute right-2 p-1 rounded-lg transition-colors cursor-pointer ${
                        isRecordingAiTutor
                          ? 'text-rose-600 bg-rose-100 animate-pulse'
                          : 'text-slate-400 hover:text-orange-600'
                      }`}
                      title={
                        isRecordingAiTutor
                          ? 'Stop voice recording'
                          : 'Speak your question (Web Speech API)'
                      }
                      aria-label="Toggle microphone voice input for AI tutor"
                    >
                      {isRecordingAiTutor ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!aiTutorInput.trim() || isAiTutorLoading}
                    className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-40 text-white font-black text-xs shadow-xs cursor-pointer shrink-0"
                  >
                    Ask
                  </button>
                </form>
              </aside>
            )}

            {showKnowledgeCheck && (
              <KeyConceptSidePanel
                question={question}
                isOpen={showKnowledgeCheck}
                onClose={() => setShowKnowledgeCheck(false)}
                selectedConceptId={selectedConceptId}
                onSelectConceptId={setSelectedConceptId}
                onAskTutor={(q) => {
                  setShowAiTutorSidebar(true);
                  if (onAskTutorAboutQuestion) onAskTutorAboutQuestion(q);
                }}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>

    {/* Quick Notes Slide-Out Panel */}
    <QuickNotesDrawer
      question={question}
      isOpen={showQuickNotes}
      onClose={() => setShowQuickNotes(false)}
      onNoteSaved={(txt) => {
        setQuestionNoteText(txt);
        setHasNote(Boolean(txt.trim()));
        if (onUpdateSavedNote) {
          onUpdateSavedNote(question.id, txt);
        }
      }}
    />

    {/* Share Question Modal (Link & QR Code) */}
    <ShareQuestionModal
      question={question}
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
    />

    {/* Mini-Modal Explaining How Clicked Theme Applies in Current Module */}
    <ThreadContextModal
      isOpen={Boolean(activeThreadModalTag)}
      tag={activeThreadModalTag}
      moduleId={question.moduleId}
      learningPathId={question.learningPathId}
      moduleTitle={question.moduleTitle}
      onClose={() => setActiveThreadModalTag(null)}
      onOpenInAzureThemes={onOpenAzureTheme}
    />

    {/* Quick-Drill Rapid-Fire Modal (3 Missed Questions Sequence) */}
    {showQuickDrillModal &&
      typeof document !== 'undefined' &&
      createPortal(
        <div className="fixed inset-0 z-[130] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[min(32rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-2rem)] my-auto rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-200 text-left">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#004C87] to-slate-950 text-white p-5">
              <div className="absolute top-0 left-0 right-0">
                <KitengeRibbon height={3} />
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                    <Zap className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                      ⚡ Quick-Drill Rapid-Fire
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                      {quickDrillCompleted ? 'Quick-Drill Complete!' : `Drill Question ${quickDrillIndex + 1} of ${quickDrillQuestions.length}`}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickDrillModal(false)}
                  className="text-slate-300 hover:text-white p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {quickDrillCompleted ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900">
                      Drill Finished: {quickDrillCorrectCount}/{quickDrillQuestions.length} Correct
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      You successfully completed this rapid-fire memory consolidation sprint without leaving your flow!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickDrillModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-xs shadow-md cursor-pointer"
                  >
                    Return to Main Quiz Flow
                  </button>
                </div>
              ) : quickDrillQuestions[quickDrillIndex] ? (
                <div className="space-y-4">
                  {/* 30-Second Quick-Drill Timer Overlay HUD */}
                  <div
                    role="timer"
                    aria-live="polite"
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      quickDrillTimedOut || quickDrillTimeLeft <= 10
                        ? 'bg-rose-950 text-white border-rose-600'
                        : 'bg-slate-900 text-white border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Timer
                        className={`w-4 h-4 shrink-0 ${
                          quickDrillTimeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                        }`}
                      />
                      <span className="font-mono font-black text-sm tabular-nums">
                        00:{String(quickDrillTimeLeft).padStart(2, '0')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase">
                        30s Quick-Drill Timer
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300">
                      {quickDrillTimedOut
                        ? 'Time Expired!'
                        : `Question ${quickDrillIndex + 1} / ${quickDrillQuestions.length}`}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#0078D4] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      Module {quickDrillQuestions[quickDrillIndex].moduleId}: {quickDrillQuestions[quickDrillIndex].moduleTitle}
                    </span>
                    <p className="text-sm font-bold text-slate-900 leading-snug">
                      {quickDrillQuestions[quickDrillIndex].scenario}
                    </p>
                    <p className="text-xs font-semibold text-slate-800">
                      {quickDrillQuestions[quickDrillIndex].question}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {quickDrillQuestions[quickDrillIndex].options.map((opt) => {
                      const isSelected = quickDrillSelectedOption === opt.letter;
                      const isCorrectOpt = opt.letter === quickDrillQuestions[quickDrillIndex].correctAnswer;
                      let style = 'bg-white hover:bg-sky-50/80 text-slate-800 border-slate-200';
                      if (quickDrillHasSubmitted) {
                        if (isCorrectOpt) {
                          style = 'bg-emerald-50 text-emerald-950 border-emerald-500 font-extrabold';
                        } else if (isSelected) {
                          style = 'bg-rose-50 text-rose-950 border-rose-500 font-bold';
                        } else {
                          style = 'bg-slate-50 text-slate-400 border-slate-200';
                        }
                      }
                      return (
                        <button
                          key={opt.letter}
                          type="button"
                          disabled={quickDrillHasSubmitted}
                          onClick={() => {
                            setQuickDrillSelectedOption(opt.letter);
                            setQuickDrillHasSubmitted(true);
                            if (opt.letter === quickDrillQuestions[quickDrillIndex].correctAnswer) {
                              setQuickDrillCorrectCount((prev) => prev + 1);
                            }
                          }}
                          className={`w-full p-3 rounded-xl border-2 text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer ${style}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-black shrink-0 text-slate-800">
                            {opt.letter}
                          </span>
                          <span className="leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {quickDrillHasSubmitted && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in duration-150 text-xs">
                      <p className="font-bold text-slate-900">
                        <strong className="text-emerald-700">Why Correct: </strong>
                        {quickDrillQuestions[quickDrillIndex].whyCorrect}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (quickDrillIndex + 1 < quickDrillQuestions.length) {
                            setQuickDrillIndex((prev) => prev + 1);
                            setQuickDrillSelectedOption(null);
                            setQuickDrillHasSubmitted(false);
                            setQuickDrillTimeLeft(30);
                            setQuickDrillTimedOut(false);
                          } else {
                            setQuickDrillCompleted(true);
                          }
                        }}
                        className="w-full py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>{quickDrillIndex + 1 < quickDrillQuestions.length ? 'Next Drill Question (30s)' : 'View Drill Summary'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
  </motion.div>
);
};
