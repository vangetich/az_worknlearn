import React, { useState } from 'react';
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
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';
import { KeyConceptSidePanel, extractScenarioTerminology } from './KeyConceptSidePanel';
import { ScenarioTextWithTooltips } from './ScenarioTextWithTooltips';
import { QuickNotesDrawer } from './QuickNotesDrawer';
import { getQuestionNote, saveQuestionNote } from '../utils/storage';
import { ShareQuestionModal } from './ShareQuestionModal';
import { QuickStudyOverlay } from './QuickStudyOverlay';
import { DeepWorkTimerWidget } from './DeepWorkTimerWidget';

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
  activeQuickFilter?: 'all' | 'bookmarks' | 'ai' | 'mistakes' | 'retry-queue';
  onSelectQuickFilter?: (
    nextFilter: 'all' | 'bookmarks' | 'ai' | 'mistakes' | 'retry-queue'
  ) => void;
  bookmarksCount?: number;
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
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [userConfidence, setUserConfidence] = useState<number | null>(() => stats?.confidenceScores?.[question.id] || null);
  const [confidenceToast, setConfidenceToast] = useState<string | null>(null);
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState<boolean>(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [showQuickNotes, setShowQuickNotes] = useState<boolean>(false);
  const [questionNoteText, setQuestionNoteText] = useState<string>(() => getQuestionNote(question.id));
  const [hasNote, setHasNote] = useState<boolean>(() => Boolean(getQuestionNote(question.id)));
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);
  const [retryNoticeMessage, setRetryNoticeMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopiedToast, setShareCopiedToast] = useState<boolean>(false);
  const [showQuickStudy, setShowQuickStudy] = useState<boolean>(false);
  const [showStudyZoneMenu, setShowStudyZoneMenu] = useState<boolean>(false);
  const studyZoneMenuRef = React.useRef<HTMLDivElement>(null);

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

  // ELI5 (Explain Like I'm 5) analogy toggle state
  const [showEli5Analogy, setShowEli5Analogy] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_eli5_enabled') === 'true';
    } catch {
      return false;
    }
  });

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
      id: 'all' | 'bookmarks' | 'ai' | 'mistakes' | 'retry-queue';
      label: string;
      shortLabel: string;
      count?: number;
    }> = [
      { id: 'all', label: 'All Questions', shortLabel: 'All Qs', count: totalQuestions },
      { id: 'bookmarks', label: 'Bookmarks', shortLabel: 'Saved', count: bookmarksCount },
      { id: 'ai', label: 'AI Scenarios', shortLabel: 'AI Set', count: aiScenariosCount },
      { id: 'mistakes', label: 'Unresolved Mistakes', shortLabel: 'Mistakes', count: unresolvedMistakesCount },
    ];
    if (retryQueueCount > 0 && retryQueueSecondsLeft > 0) {
      items.unshift({
        id: 'retry-queue',
        label: `Retry Queue (${Math.floor(retryQueueSecondsLeft / 60)}:${
          retryQueueSecondsLeft % 60 < 10 ? '0' : ''
        }${retryQueueSecondsLeft % 60})`,
        shortLabel: '5m Retry Queue',
        count: retryQueueCount,
      });
    }
    return items;
  }, [
    totalQuestions,
    bookmarksCount,
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
      if (
        studyZoneMenuRef.current &&
        !studyZoneMenuRef.current.contains(event.target as Node)
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
    setUserConfidence(stats?.confidenceScores?.[question.id] || null);
    setConfidenceToast(null);
    setExamFeedbackRevealed(false);
    setElapsedSeconds(0);
    setShowKnowledgeCheck(false);
    setSelectedConceptId(null);
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
    setHasNote(Boolean(nextVal.trim()));
    setNoteSavedFeedback(true);
  };

  const handleClearInlineNote = () => {
    setQuestionNoteText('');
    saveQuestionNote(question.id, '');
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

  // Increment per-question timer every second until user submits an answer
  React.useEffect(() => {
    if (hasSubmitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasSubmitted, question.id]);

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
    <div
      onTouchStart={handleCardTouchStart}
      onTouchEnd={handleCardTouchEnd}
      className="bg-white rounded-xl border border-slate-200/90 card-elevation overflow-visible transition-all"
    >
      {/* Mobile-Responsive 'Quick Switcher' Swipe Gesture Bar (Toggle Active Filtered Lists Without Opening Menu) */}
      {onSelectQuickFilter && (
        <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2 rounded-t-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1 shrink-0 mr-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Quick Switcher:</span>
            </span>

            {quickSwitcherOptions.map((item) => {
              const isActive = activeQuickFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectQuickFilter(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    isActive
                      ? item.id === 'retry-queue'
                        ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                        : 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                  title={`Switch active question list to ${item.label} (or swipe horizontally on the card)`}
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

      {/* Uncluttered, Neatly Ordered Top Header Bar with Study Zone Dropdown Menu */}
      <div
        className={`relative px-4 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 ${
          !onSelectQuickFilter ? 'rounded-t-xl' : ''
        }`}
      >
        {/* Left Group: Path/Module Identity + Compact Difficulty Status + Active Mode Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${pathColor}`}
          >
            Path {question.learningPathId}: Module {question.moduleId}
          </span>

          <span className="text-xs font-semibold text-slate-700 hidden md:inline max-w-[230px] truncate">
            {question.moduleTitle}
          </span>

          {/* Compact Difficulty & Adaptive Status Pill */}
          <button
            type="button"
            onClick={handleCycleDifficultyBadgeFilter}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              question.difficulty === 'Fundamental'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : question.difficulty === 'Intermediate'
                ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
            title={`Question Difficulty: ${question.difficulty} • Adaptive Tier: ${
              activeLockedDifficulty
                ? `Locked (${activeLockedDifficulty})`
                : dynamicDifficulty || 'Intermediate'
            }. Click to cycle difficulty filter or open Study Zone menu for granular controls.`}
          >
            <span>{question.difficulty}</span>
            <span className="opacity-40">•</span>
            <span className="text-[10px] font-extrabold text-slate-600">
              {activeLockedDifficulty
                ? `🔒 ${activeLockedDifficulty.slice(0, 4)}`
                : `Adaptive: ${
                    (dynamicDifficulty || 'Intermediate') === 'Fundamental'
                      ? 'Easy'
                      : (dynamicDifficulty || 'Intermediate') === 'Intermediate'
                      ? 'Med'
                      : 'Hard'
                  }`}
            </span>
            {consecutiveStreak > 0 && (
              <span className="text-[10px] font-black bg-amber-200/90 text-amber-950 px-1 rounded-sm">
                {consecutiveStreak}🔥
              </span>
            )}
          </button>

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

        {/* Right Group: Compact Question Timer + Question X of Y + Neatly Ordered Study Zone Dropdown + Bookmark */}
        <div className="flex items-center gap-2">
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

          {/* STUDY ZONE ACCORDION MENU (Centered Popup Modal in Middle of Page) */}
          <div className="relative">
            <button
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

            {/* Centered Modal Popup in the Middle of the Page (Not Sideways, Comfortably Lower Down) */}
            {showStudyZoneMenu && (
              <div
                className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 pb-10 px-4 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
                onClick={() => setShowStudyZoneMenu(false)}
              >
                <div
                  ref={studyZoneMenuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xl my-auto sm:my-0 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl text-left animate-in slide-in-from-top-4 zoom-in-95 duration-200"
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-white/10 border border-white/15 text-amber-300">
                        <SlidersHorizontal className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black uppercase tracking-wider text-white">
                            Study Zone Command Hub
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
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
                  <div className="p-4 sm:p-5 space-y-3">
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

                            {/* Study Notes Drawer */}
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuickNotes(true);
                                setShowStudyZoneMenu(false);
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
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
                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                  isFocusMode
                                    ? 'bg-[#0078D4] text-white border-[#0078D4]'
                                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                }`}
                              >
                                {isFocusMode ? (
                                  <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                                ) : (
                                  <Maximize2 className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                                )}
                                <span>{isFocusMode ? 'Exit Focus UI' : 'Focus Mode UI'}</span>
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
              </div>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onBookmark(question.id)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-400 hover:text-amber-600 border-slate-200'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for revision'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Live Color-Coded Question Pace Bar (Green -> Amber -> Red Exam Readiness Indicator) */}
      <div className="px-6 py-2 bg-slate-50/90 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Timer className={`w-3.5 h-3.5 ${timerColorConfig.icon}`} />
            <span>Question Timer:</span>
          </span>
          <span className="font-mono font-black text-slate-900">
            {formatTimer(elapsedSeconds)}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${timerColorConfig.badge}`}
          >
            {hasSubmitted ? `Completed in ${formatTimer(elapsedSeconds)}` : timerColorConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5 grow sm:grow-0 sm:min-w-[240px]">
          <div className="w-full sm:w-36 h-2 rounded-full bg-slate-200/90 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${timerColorConfig.bar} transition-all duration-500`}
              style={{
                width: `${Math.min(100, Math.round((elapsedSeconds / (avgCompletionSeconds * 1.4)) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
            Avg Pace: <strong className="text-slate-700">{formatTimer(avgCompletionSeconds)}</strong>
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
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

        <div className={`grid gap-6 ${showKnowledgeCheck ? 'grid-cols-1 lg:grid-cols-12 items-start' : 'grid-cols-1'}`}>
          {/* Main Question & Answering Column */}
          <div className={`space-y-6 ${showKnowledgeCheck ? 'lg:col-span-8' : 'w-full'}`}>
            {/* Scenario Narrative Box */}
            <div className="relative bg-slate-50/80 rounded-xl p-5 border-l-4 border-[#0078D4] border-t border-r border-b border-slate-200/60 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 grow">
                  <div className="p-2 rounded-lg bg-blue-100/70 text-[#0078D4] shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="grow">
                    <h3 className="text-xs font-bold tracking-wider uppercase text-blue-900 mb-1.5 flex items-center gap-1.5 flex-wrap">
                      <span>Scenario Context</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">(hover/click highlighted terms for quick concept definition)</span>
                    </h3>
                    <ScenarioTextWithTooltips
                      text={question.scenario}
                      concepts={scenarioConcepts}
                      onSelectConcept={setSelectedConceptId}
                      isKnowledgeCheckActive={showKnowledgeCheck}
                      onActivateKnowledgeCheck={() => setShowKnowledgeCheck(true)}
                    />
                  </div>
                </div>

                {/* ELI5 Analogy & Knowledge Check Toggle Switches (Hidden in Exam Simulation Mode) */}
                {!isExamMode ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 text-amber-300 border border-slate-700 shrink-0 self-start">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Exam Mode • Hints Disabled</span>
                  </span>
                )}
              </div>

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
            </div>

        {/* Actual Exam Question + Hands-Free Voice Option Answering Control */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {question.question}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose the single best answer that meets all architectural criteria (or use Voice Answer and say &ldquo;Option one&rdquo; – &ldquo;Option four&rdquo;):
            </p>
          </div>

          {!hasSubmitted && (
            <button
              type="button"
              onClick={handleToggleVoiceAnswer}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border shrink-0 self-start transition-all cursor-pointer ${
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

        {/* 4 Choices (A, B, C, D) */}
        <div className="space-y-3">
          {question.options.map((option) => {
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
              <button
                key={option.letter}
                onClick={() => handleSelect(option.letter)}
                disabled={hasSubmitted}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group ${cardStyles}`}
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

                {showImmediateFeedback && isCorrectOption && (
                  <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md self-center">
                    Correct Answer
                  </span>
                )}
                {isAnswered && isExamMode && !examFeedbackRevealed && isSelected && (
                  <span className="shrink-0 text-xs font-bold text-[#0078D4] bg-blue-100 px-2.5 py-1 rounded-md self-center">
                    Answer Recorded
                  </span>
                )}
              </button>
            );
          })}
        </div>

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
            </div>
          </div>

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
          <div className="mt-8 space-y-5 animate-feedback-entrance">
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

              {onAskTutorAboutQuestion && (
                <button
                  onClick={() => onAskTutorAboutQuestion(question)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ask AI Tutor</span>
                </button>
              )}
            </div>

            {/* If Incorrect: Targeted Diagnostic Analysis */}
            {!isSelectedCorrect && selectedOption && (
              <div className="bg-red-50/70 rounded-xl p-5 border border-red-200 space-y-2.5 animate-cascade-2">
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
            )}

            {/* Why It's Correct */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200 animate-cascade-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Why Option {question.correctAnswer} is Correct:</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {question.whyCorrect}
              </p>
            </div>

            {/* Why Other Options Are Incorrect (Distractor Breakdown) OR 1-Sentence Concept Summary Toggle */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 animate-cascade-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  {showConceptSummaryOnly ? (
                    <>
                      <BookOpen className="w-4 h-4 text-[#0078D4]" />
                      <span>Foundational Principle (1-Sentence Concept Summary):</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-slate-500" />
                      <span>Why Other Options Are Incorrect (Exam Distractors):</span>
                    </>
                  )}
                </div>

                {/* Concept Summary Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleConceptSummary}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    showConceptSummaryOnly
                      ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                      : 'bg-white hover:bg-blue-50 text-[#0078D4] border-sky-200 shadow-2xs'
                  }`}
                  title="Toggle Concept Summary: Replace distractor explanations with a 1-sentence foundational principle of the Azure service in this question"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${showConceptSummaryOnly ? 'text-amber-300' : 'text-[#0078D4]'}`} />
                  <span>Concept Summary</span>
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
              </div>

              {showConceptSummaryOnly ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-amber-50/40 border-l-4 border-[#0078D4] border-t border-r border-b border-sky-200/80 text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed shadow-2xs">
                  {getFoundationalConceptSentence(question)}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {question.distractorBreakdown.map((distractor) => (
                    <div
                      key={distractor.letter}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 p-2.5 rounded-lg bg-white border border-slate-200/70"
                    >
                      <span className="font-bold text-red-600 shrink-0 px-1.5 py-0.5 bg-red-50 rounded border border-red-200 text-xs">
                        Option {distractor.letter}
                      </span>
                      <p className="leading-relaxed font-normal">{distractor.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Tip Card - Savannah Gold / Warm Ochre */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-50/80 to-yellow-50 rounded-xl p-5 border border-amber-300/80 shadow-xs animate-cascade-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-xs tracking-wider uppercase text-amber-900">
                      💡 Exam Anchor Tip
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
          </div>
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
      </div>

        {/* Right Side-Panel: Concise Key Concept Definition specifically for this scenario */}
        {showKnowledgeCheck && (
          <div className="lg:col-span-4 sticky top-4">
            <KeyConceptSidePanel
              question={question}
              isOpen={showKnowledgeCheck}
              onClose={() => setShowKnowledgeCheck(false)}
              selectedConceptId={selectedConceptId}
              onSelectConceptId={setSelectedConceptId}
              onAskTutor={onAskTutorAboutQuestion}
            />
          </div>
        )}
      </div>
    </div>

    {/* Quick Notes Slide-Out Panel */}
    <QuickNotesDrawer
      question={question}
      isOpen={showQuickNotes}
      onClose={() => setShowQuickNotes(false)}
      onNoteSaved={(txt) => {
        setQuestionNoteText(txt);
        setHasNote(Boolean(txt.trim()));
      }}
    />

    {/* Share Question Modal (Link & QR Code) */}
    <ShareQuestionModal
      question={question}
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
    />
  </div>
);
};
