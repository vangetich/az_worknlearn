import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Award,
  Sparkles,
  Bot,
  Layers,
  Compass,
  Bookmark,
  Target,
  ArrowRight,
  Flame,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Users,
  Maximize2,
  Minimize2,
  Zap,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Cloud,
  Download,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  StickyNote,
  Eye,
  EyeOff,
} from 'lucide-react';
import * as d3 from 'd3';
import { Header, AppTab } from './components/Header';
import { HarambeeSuccessCompanion } from './components/HarambeeSuccessCompanion';
import { QuizCard } from './components/QuizCard';
import { ModuleBrowser } from './components/ModuleBrowser';
import { AiScenarioGenerator } from './components/AiScenarioGenerator';
import { KnowledgeAssistant } from './components/KnowledgeAssistant';
import { MockExamModal } from './components/MockExamModal';
import { DomainConfidenceTracker } from './components/DomainConfidenceTracker';
import { StudyDeck } from './components/StudyDeck';
import { MicroDrillModal } from './components/MicroDrillModal';
import { StudyBreakModal } from './components/StudyBreakModal';
import { DailyChallengeBanner } from './components/DailyChallengeBanner';
import { HarambeeWisdomDeck } from './components/HarambeeWisdomDeck';
import { ExportProgressModal } from './components/ExportProgressModal';
import { FlashcardsView } from './components/FlashcardsView';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { AdaptiveQuizView } from './components/AdaptiveQuizView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { AzureImageTutorView } from './components/AzureImageTutorView';
import { AzureThemesView } from './components/AzureThemesView';
import { ReviewHistoryView } from './components/ReviewHistoryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DailyGoalMilestoneOverlay } from './components/DailyGoalMilestoneOverlay';
import { GlassyStudyHubDropdown } from './components/GlassyStudyHubDropdown';
import { ResetModuleModal } from './components/ResetModuleModal';
import { LearningPathOverview } from './components/LearningPathOverview';
import { VirtualStudyRoom } from './components/VirtualStudyRoom';
import { WeakAreasReviewModal } from './components/WeakAreasReviewModal';
import { ReviewSessionModal } from './components/ReviewSessionModal';
import { WeeklyLearningRoadmap } from './components/WeeklyLearningRoadmap';
import { ProfileView } from './components/ProfileView';
import { AzureGlossaryView } from './components/AzureGlossaryView';
import { AchievementOverlay } from './components/AchievementOverlay';
import { PostSessionWeakAreaReview } from './components/PostSessionWeakAreaReview';
import { AzureCloudExplorer } from './components/AzureCloudExplorer';
import { LearningPathProgressMap } from './components/LearningPathProgressMap';
import { WeeklyExamReadiness } from './components/WeeklyExamReadiness';
import { UserGuideModal } from './components/UserGuideModal';
import { BackendCloudModal, HubSection } from './components/BackendCloudModal';
import { ApiDocumentationModal } from './components/ApiDocumentationModal';
import { CurriculumReadinessModal } from './components/CurriculumReadinessModal';
import { AdminBackOfficeModal } from './components/AdminBackOfficeModal';
import { DomainAccuracyHeatmapD3 } from './components/DomainAccuracyHeatmapD3';
import { PerformanceTrendsView } from './components/PerformanceTrendsView';
import { CohortPerformanceView } from './components/CohortPerformanceView';
import { ExitStudySessionModal } from './components/ExitStudySessionModal';
import { ProtectedRoute, AuthenticatedSupabaseUser } from './components/ProtectedRoute';
import { PaymentGatekeeper } from './components/PaymentGatekeeper';
import { SubscriptionTierSelection } from './components/SubscriptionTierSelection';
import { PeerChallengeModal } from './components/PeerChallengeModal';
import { PracticeControlOverflowMenu } from './components/PracticeControlOverflowMenu';
import { ThreadMultiSelectDropdown } from './components/ThreadMultiSelectDropdown';
import { ThreadTagId, getThreadTagsForQuestion } from './data/azureThemesData';
import {
  useQuizFocusTimer,
  QuizFocusTimerPill,
  QuizBreakTriviaModal,
} from './components/QuizFocusTimer';
import { downloadNotesAndMemoryAnchorsMarkdown } from './utils/exportNotesMarkdown';
import { usePostgresDatabase } from './hooks/usePostgresDatabase';
import { authService } from './services/authService';
import { isWhitelistedAdminEmail } from './utils/adminSecurity';
import {
  getStoredReminderSettings,
  saveReminderSettings,
  getTodaySolvedQuestionsCount,
  triggerBrowserStudyNotification,
} from './components/DailyStudyReminder';
import {
  AfricanWatermarkPattern,
  KitengeRibbon,
  MaasaiMedallion,
  FooterAfricanMotifsBackground,
  KenyanFlagQuickSortMotifs,
  KenyanFlagMiniEmblem,
} from './components/MotifDecorations';
import { BUILTIN_QUESTIONS } from './data/questionBank';
import { LEARNING_PATHS } from './data/curriculum';
import { CURRICULUM_STUDY_MODULES } from './data/studyNotes';
import { Question, UserStats, QuestionAttempt } from './types/quiz';
import {
  getInitialStats,
  saveUserAttempt,
  toggleBookmark,
  resetModuleConfidence,
  saveQuizSession,
  toggleModuleCompletion,
  markQuestionReviewedSuccessfully,
  getUnresolvedMissedQuestionsCount,
  getUnresolvedMistakesMap,
  saveQuestionConfidence,
  markQuestionSkipped,
  getPastQuizSessions,
  saveHarambeeDrillCompletion,
  mergeCloudProgressIntoLocalStats,
  getAllQuestionNotes,
  saveQuestionNote,
} from './utils/storage';
import { HoverInfoFeedback } from './components/HoverInfoFeedback';
import { generateDomainConfidencePdf } from './utils/pdfGenerator';
import { fireModuleCompletionConfetti } from './utils/confetti';
import { ThemeToggle } from './components/ThemeToggle';
import { getStoredTheme, applyTheme } from './utils/theme';
import { getStoredFontScalePercent, applyFontScalePercent } from './utils/fontSize';
import { AccessibilityFontSizeControl } from './components/AccessibilityFontSizeControl';
import {
  KeyboardShortcutGuidePopover,
  AccessibilitySettingsModal,
  useKeyboardShortcutsConfig,
} from './components/KeyboardShortcutGuide';
import {
  matchesShortcutEvent,
  formatShortcutCombo,
  DEFAULT_SHORTCUT_CONFIG,
  isSameBinding,
} from './utils/keyboardShortcuts';
import { PersonalStudyNotesSidebar } from './components/PersonalStudyNotesSidebar';
import {
  BalancedPathIntensityCoach,
  getStoredPathStudySeconds,
  incrementPathStudySecond,
  PathStudySecondsMap,
} from './components/BalancedPathIntensityCoach';

const QUIZ_SESSION_AUTOSAVE_KEY = 'az900_quiz_session_autosave_v1';
const AUTOSAVE_INTERVAL_MS = 30_000; // Auto-save every 30 seconds

interface AutoSavedQuizSessionState {
  currentQuestionIndex: number;
  lastActiveQuestionId: string | null;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  sessionRollingOutcomes: boolean[];
  dynamicDifficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  selectedPathId: number | 'all';
  selectedModuleId: number | 'all';
  confirmedFocusPathId: 1 | 2 | 3 | null;
  sessionAnswerCount: number;
  savedAt: number;
}

function loadAutoSavedQuizSession(): Partial<AutoSavedQuizSessionState> | null {
  try {
    const raw = localStorage.getItem(QUIZ_SESSION_AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load auto-saved quiz session:', e);
  }
  return null;
}

function extractRecentHistoricalOutcomes(stats: UserStats, limit = 20): boolean[] {
  try {
    const allAttempts = Object.values(stats.attempts || {})
      .flat()
      .filter((a) => a && typeof a.timestamp === 'number')
      .sort((a, b) => a.timestamp - b.timestamp);
    return allAttempts.slice(-limit).map((a) => Boolean(a.isCorrect));
  } catch {
    return [];
  }
}

export default function App() {
  const initialAutoSavedSession = useMemo(() => loadAutoSavedQuizSession(), []);
  const [activeTab, setActiveTab] = useState<AppTab>('quiz');
  const [azureThemesFocus, setAzureThemesFocus] = useState<{
    themeId: string;
    moduleId?: number;
  } | null>(null);

  const handleOpenAzureTheme = (themeId: string, moduleId?: number) => {
    setAzureThemesFocus({ themeId, moduleId });
    setActiveTab('azure-themes');
  };

  // Initialize theme and accessibility font size scale on mount
  useEffect(() => {
    applyTheme(getStoredTheme());
    applyFontScalePercent(getStoredFontScalePercent());
  }, []);

  // Questions state (built-in + any AI generated)
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const stored = localStorage.getItem('az900_custom_questions_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...BUILTIN_QUESTIONS, ...parsed];
      }
    } catch (e) {
      console.error(e);
    }
    return BUILTIN_QUESTIONS;
  });

  // User performance stats
  const [stats, setStats] = useState<UserStats>(getInitialStats);
  const todayAnsweredCount = useMemo(() => getTodaySolvedQuestionsCount(stats), [stats]);

  // Postgres & Supabase Database Utility Hook for curriculum modules & progress writes
  const {
    writeModuleProgress,
    submitQuestionAnswer,
    realtimeStatus,
    lastSyncedAt,
    isLoading: isPostgresLoading,
    isSyncing: isPostgresSyncing,
    pendingOfflineCount,
  } = usePostgresDatabase();
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedSupabaseUser | null>(null);

  // Listen for simultaneous cross-device (Mobile + Laptop) and cross-tab progress updates
  useEffect(() => {
    const handleCrossDeviceSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        records?: Array<{
          moduleId: number;
          score: number;
          status: 'not_started' | 'in_progress' | 'mastered';
        }>;
      }>;
      const records = customEvent.detail?.records;
      if (records && records.length > 0) {
        setStats((prev) => {
          const { stats: merged, changed } = mergeCloudProgressIntoLocalStats(prev, records);
          return changed ? merged : prev;
        });
      }
    };

    const handleCrossTabStorage = (e: StorageEvent) => {
      if (e.key === 'az900_quiz_builder_stats_v1' && e.newValue) {
        try {
          const nextStats = JSON.parse(e.newValue) as UserStats;
          setStats((prev) => {
            if ((nextStats.totalAnswered || 0) >= (prev.totalAnswered || 0)) {
              return { ...prev, ...nextStats };
            }
            return prev;
          });
        } catch {
          // ignore malformed storage payload
        }
      }
    };

    window.addEventListener('az900-cross-device-sync', handleCrossDeviceSync);
    window.addEventListener('storage', handleCrossTabStorage);
    return () => {
      window.removeEventListener('az900-cross-device-sync', handleCrossDeviceSync);
      window.removeEventListener('storage', handleCrossTabStorage);
    };
  }, []);

  // Filter selections for Practice Mode (Restored from 30s auto-save if available)
  const [selectedPathId, setSelectedPathId] = useState<number | 'all'>(() => {
    const saved = initialAutoSavedSession?.selectedPathId;
    if (saved === 'all' || typeof saved === 'number') return saved;
    return 'all';
  });
  const [selectedModuleId, setSelectedModuleId] = useState<number | 'all'>(() => {
    const saved = initialAutoSavedSession?.selectedModuleId;
    if (saved === 'all' || typeof saved === 'number') return saved;
    return 'all';
  });
  const [selectedDifficultyFilter, setSelectedDifficultyFilterState] = useState<
    'all' | 'Fundamental' | 'Intermediate' | 'Advanced'
  >(() => {
    try {
      const saved = localStorage.getItem('az900_persistent_difficulty_filter_v1');
      if (
        saved === 'Fundamental' ||
        saved === 'Intermediate' ||
        saved === 'Advanced' ||
        saved === 'all'
      ) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'all';
  });
  const [selectedThreadFilters, setSelectedThreadFilters] = useState<ThreadTagId[]>([]);

  const handleToggleThreadFilter = (threadId: ThreadTagId) => {
    setSelectedThreadFilters((prev) =>
      prev.includes(threadId) ? prev.filter((t) => t !== threadId) : [...prev, threadId]
    );
    setCurrentQuestionIndex(0);
  };

  const handleClearThreadFilters = () => {
    setSelectedThreadFilters([]);
    setCurrentQuestionIndex(0);
  };

  const [isMotifShimmering, setIsMotifShimmering] = useState<boolean>(false);
  const [trendScoreFlipParity, setTrendScoreFlipParity] = useState<boolean>(false);
  const [isHarambeeExpanded, setIsHarambeeExpanded] = useState<boolean>(() => {
    try {
      const savedMode = localStorage.getItem('az900_harambee_display_mode_v2');
      if (savedMode === 'view') return true;
      return false; // Auto-retract as default
    } catch {
      return false;
    }
  });
  const [isDesktopModuleListCollapsed, setIsDesktopModuleListCollapsed] = useState<boolean>(false);
  const [pathAllTimeHighs, setPathAllTimeHighs] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('az900_path_all_time_high_scores_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return { all: 82, '1': 84, '2': 80, '3': 81 };
  });
  const [allTimeHighToast, setAllTimeHighToast] = useState<string | null>(null);
  const [showCurriculumReadinessModal, setShowCurriculumReadinessModal] = useState<boolean>(false);
  const [showAdminBackOfficeModal, setShowAdminBackOfficeModal] = useState<boolean>(false);
  const [tierSelectionLockedModuleId, setTierSelectionLockedModuleId] = useState<number | null>(
    null
  );
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{
    receiptNumber: string;
    planLabel: string;
    amountUsd: number;
  } | null>(null);

  // Auto-dismiss All-Time High toast after 5.5s
  useEffect(() => {
    if (!allTimeHighToast) return;
    const timer = setTimeout(() => setAllTimeHighToast(null), 5500);
    return () => clearTimeout(timer);
  }, [allTimeHighToast]);

  // Listen for Stripe checkout return (?payment_status=success) or 'az900-payment-success' event
  // to display global 'Payment Successful' toast and refresh Supabase profile without a page reload
  useEffect(() => {
    const handlePaymentSuccessEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        receiptNumber?: string;
        planLabel?: string;
        amountUsd?: number;
        unlockedModules?: number[];
      }>;
      const detail = customEvent.detail || {};
      const refreshedProfile = authService.getStoredBackendUser();
      if (refreshedProfile) {
        setAuthenticatedUser((prev) =>
          prev
            ? {
                ...prev,
                is_premium: refreshedProfile.is_premium,
                paid_status: refreshedProfile.paid_status || 'active',
                unlocked_modules: refreshedProfile.unlocked_modules,
              }
            : {
                id: refreshedProfile.id,
                email: refreshedProfile.email,
                full_name: refreshedProfile.full_name,
                role: refreshedProfile.role,
                is_premium: refreshedProfile.is_premium,
                paid_status: refreshedProfile.paid_status || 'active',
                unlocked_modules: refreshedProfile.unlocked_modules,
                auth_source: 'postgres_backend',
              }
        );
      }
      setPaymentSuccessToast({
        receiptNumber: detail.receiptNumber || `STRP-${Date.now().toString().slice(-6)}`,
        planLabel: detail.planLabel || 'AZ-900 Pro All-Access Pass (Modules 1–12)',
        amountUsd: detail.amountUsd ?? 15,
      });
    };

    window.addEventListener('az900-payment-success', handlePaymentSuccessEvent);

    // Check URL query parameters for returning from external Stripe Checkout redirect
    try {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment_status') || params.get('stripe_checkout');
      if (paymentStatus === 'success') {
        const updatedProfile = authService.updateStoredUser({
          is_premium: true,
          paid_status: 'active',
          unlocked_modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        });
        if (updatedProfile) {
          setAuthenticatedUser((prev) =>
            prev
              ? {
                  ...prev,
                  is_premium: true,
                  paid_status: 'active',
                  unlocked_modules: updatedProfile.unlocked_modules,
                }
              : null
          );
        }
        setPaymentSuccessToast({
          receiptNumber: params.get('receipt') || `STRP-${Date.now().toString().slice(-6)}`,
          planLabel: 'AZ-900 Pro All-Access Pass (Modules 1–12)',
          amountUsd: 15,
        });
        params.delete('payment_status');
        params.delete('stripe_checkout');
        const nextSearch = params.toString();
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
        );
      }
    } catch {
      // ignore URL parsing errors
    }

    return () => {
      window.removeEventListener('az900-payment-success', handlePaymentSuccessEvent);
    };
  }, []);

  useEffect(() => {
    if (!paymentSuccessToast) return;
    const timer = setTimeout(() => setPaymentSuccessToast(null), 7500);
    return () => clearTimeout(timer);
  }, [paymentSuccessToast]);

  const isModuleLockedForCurrentUser = (modId: number | 'all'): boolean => {
    if (modId === 'all' || modId <= 4) return false;
    const stored = authService.getStoredBackendUser();
    const email = authenticatedUser?.email || stored?.email;
    if (isWhitelistedAdminEmail(email)) return false;
    const isPaid =
      stored?.paid_status === 'active' ||
      authenticatedUser?.paid_status === 'active' ||
      Boolean(stored?.is_premium) ||
      Boolean(authenticatedUser?.is_premium);
    if (isPaid) return false;
    const unlocked = stored?.unlocked_modules || authenticatedUser?.unlocked_modules || [1, 2, 3, 4];
    return !unlocked.includes(modId);
  };

  const handleToggleHarambeeExpanded = () => {
    setIsHarambeeExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_harambee_companion_expanded_v1', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const triggerMotifShimmer = () => {
    setIsMotifShimmering(true);
    setTimeout(() => setIsMotifShimmering(false), 750);
  };

  const setSelectedDifficultyFilter = (
    nextFilter: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced'
  ) => {
    setSelectedDifficultyFilterState(nextFilter);
    try {
      localStorage.setItem('az900_persistent_difficulty_filter_v1', nextFilter);
    } catch {
      // ignore storage errors
    }
    triggerMotifShimmer();
  };
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [onlySavedNotes, setOnlySavedNotes] = useState<boolean>(false);
  const [savedNotesMap, setSavedNotesMap] = useState<Record<string, string>>(() => getAllQuestionNotes());
  const [onlyAiGenerated, setOnlyAiGenerated] = useState<boolean>(false);
  const [onlyUnresolvedMistakes, setOnlyUnresolvedMistakes] = useState<boolean>(false);
  const [retryQueueQuestionIds, setRetryQueueQuestionIds] = useState<string[]>([]);
  const [retryQueueExpiresAt, setRetryQueueExpiresAt] = useState<number | null>(null);
  const [retryQueueSecondsLeft, setRetryQueueSecondsLeft] = useState<number>(0);
  const [onlyRetryQueue, setOnlyRetryQueue] = useState<boolean>(false);
  const [retryIncorrectPathId, setRetryIncorrectPathId] = useState<1 | 2 | 3 | null>(null);
  const [retryIncorrectSnapshotIds, setRetryIncorrectSnapshotIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingJumpQuestionId, setPendingJumpQuestionId] = useState<string | null>(
    () => initialAutoSavedSession?.lastActiveQuestionId || null
  );
  const [showBackendCloudModal, setShowBackendCloudModal] = useState<boolean>(false);
  const [backendModalSection, setBackendModalSection] = useState<HubSection>('auth-progress');
  const [showApiDocumentationModal, setShowApiDocumentationModal] = useState<boolean>(false);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);
  const [externalOpenNotesDrawerTrigger, setExternalOpenNotesDrawerTrigger] = useState<number>(0);
  const [pathStudySeconds, setPathStudySeconds] = useState<PathStudySecondsMap>(
    getStoredPathStudySeconds
  );
  const { config: activeShortcuts, platform: detectedPlatform } = useKeyboardShortcutsConfig();
  const initialDeepLinkHandledRef = React.useRef<boolean>(false);

  // Update savedNotesMap & persist to localStorage cleanly
  const handleUpdateSavedNote = useCallback((questionId: string, text: string) => {
    saveQuestionNote(questionId, text);
    setSavedNotesMap((prev) => {
      const next = { ...prev };
      if (text.trim()) {
        next[questionId] = text;
      } else {
        delete next[questionId];
      }
      return next;
    });
  }, []);

  // Sync saved notes map when notes are created, modified or deleted in any component
  useEffect(() => {
    const handleNotesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ notes: Record<string, string> }>;
      if (customEvent.detail?.notes) {
        setSavedNotesMap(customEvent.detail.notes);
      } else {
        setSavedNotesMap(getAllQuestionNotes());
      }
    };
    window.addEventListener('az900-notes-updated', handleNotesUpdated);
    return () => window.removeEventListener('az900-notes-updated', handleNotesUpdated);
  }, []);

  const savedNotesCount = useMemo(() => {
    return Object.keys(savedNotesMap).filter((id) => Boolean(savedNotesMap[id]?.trim())).length;
  }, [savedNotesMap]);

  // Tick down temporary 5-minute 'Retry Queue' filter every second and auto-expire after 5 minutes
  useEffect(() => {
    if (!retryQueueExpiresAt) {
      setRetryQueueSecondsLeft(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((retryQueueExpiresAt - Date.now()) / 1000));
      setRetryQueueSecondsLeft(remaining);
      if (remaining <= 0) {
        setRetryQueueExpiresAt(null);
        setRetryQueueQuestionIds([]);
        setOnlyRetryQueue(false);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [retryQueueExpiresAt]);

  // Handler for 'Quick-Retry' button in PostSessionWeakAreaReview (5-minute temporary Retry Queue)
  const handleQuickRetrySessionQuestions = (questionsToQueue: Question[]) => {
    if (questionsToQueue.length === 0) return;

    setQuestions((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const uniqueNew = questionsToQueue.filter((q) => !existingIds.has(q.id));
      if (uniqueNew.length === 0) return prev;
      return [...uniqueNew, ...prev];
    });

    const queuedIds = questionsToQueue.map((q) => q.id);
    setRetryQueueQuestionIds(queuedIds);
    setRetryQueueExpiresAt(Date.now() + 5 * 60 * 1000); // 5 minutes
    setRetryQueueSecondsLeft(300);
    setOnlyRetryQueue(true);
    setOnlyBookmarks(false);
    setOnlySavedNotes(false);
    setOnlyAiGenerated(false);
    setOnlyUnresolvedMistakes(false);
    setRetryIncorrectPathId(null);
    setRetryIncorrectSnapshotIds([]);
    setSelectedPathId('all');
    setSelectedModuleId('all');
    setSelectedDifficultyFilter('all');
    setSearchQuery('');
    setCurrentQuestionIndex(0);
    setShowPostSessionReview(false);
    setActiveTab('quiz');
  };

  // Active Quick Switcher filter state & handler for mobile horizontal swipe or pill tap
  const activeQuickFilter: 'all' | 'bookmarks' | 'notes' | 'ai' | 'mistakes' | 'retry-queue' =
    onlyRetryQueue && retryQueueSecondsLeft > 0
      ? 'retry-queue'
      : onlyBookmarks
      ? 'bookmarks'
      : onlySavedNotes
      ? 'notes'
      : onlyAiGenerated
      ? 'ai'
      : onlyUnresolvedMistakes
      ? 'mistakes'
      : 'all';

  const handleSelectQuickFilter = (
    nextFilter: 'all' | 'bookmarks' | 'notes' | 'ai' | 'mistakes' | 'retry-queue'
  ) => {
    setRetryIncorrectPathId(null);
    setRetryIncorrectSnapshotIds([]);
    setOnlyBookmarks(nextFilter === 'bookmarks');
    setOnlySavedNotes(nextFilter === 'notes');
    setOnlyAiGenerated(nextFilter === 'ai');
    setOnlyUnresolvedMistakes(nextFilter === 'mistakes');
    setOnlyRetryQueue(nextFilter === 'retry-queue' && retryQueueSecondsLeft > 0);
    if (nextFilter !== 'all') {
      setSelectedPathId('all');
      setSelectedModuleId('all');
    }
    setCurrentQuestionIndex(0);
  };

  // Active question index in filtered list (restored from 30s auto-save)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() =>
    typeof initialAutoSavedSession?.currentQuestionIndex === 'number' &&
    initialAutoSavedSession.currentQuestionIndex >= 0
      ? initialAutoSavedSession.currentQuestionIndex
      : 0
  );

  // Quick-Sort order for Practice Tab question list
  const [questionSortOrder, setQuestionSortOrder] = useState<
    'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first'
  >('default');

  // Toggle for secondary Practice workspace panels (keeps Practice view clean & uncluttered)
  const [showWorkspacePanels, setShowWorkspacePanels] = useState<boolean>(false);
  const [showPracticeHeatmap, setShowPracticeHeatmap] = useState<boolean>(false);

  // Trigger to open the centered Study Zone accordion modal from the Practice toolbar
  const [externalStudyZoneOpenTrigger, setExternalStudyZoneOpenTrigger] = useState<number>(0);

  // Compact single-line setting for Quick-Sort & Study Tools toolbar (default true so Sort, Diff, Heatmap, Maps, Study Zone stay on a single line)
  const [isQuickSortCompact, setIsQuickSortCompact] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('az900_quicksort_toolbar_compact_v2');
      if (saved !== null) return saved === 'true';
      return true;
    } catch {
      return true;
    }
  });

  // Neatly hide/collapse the entire Sort/Diff/Heatmap/Maps/Study Zone control bar
  const [isToolbarHidden, setIsToolbarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_practice_toolbar_hidden_v1') === 'true';
    } catch {
      return false;
    }
  });

  // Touch-friendly overflow menu for Sort, Diff, Heatmap, Maps, and Study Zone on mobile devices
  const [showMobileControlOverflow, setShowMobileControlOverflow] = useState<boolean>(false);

  const handleToggleToolbarHidden = () => {
    setIsToolbarHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_practice_toolbar_hidden_v1', String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleQuickSortCompact = () => {
    setIsQuickSortCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_quicksort_toolbar_compact_v2', String(next));
      } catch {}
      return next;
    });
  };

  const handleChangeSortOrder = (
    nextSort: 'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first'
  ) => {
    setQuestionSortOrder(nextSort);
    setCurrentQuestionIndex(0);
  };

  // Context for passing a question to Knowledge Assistant
  const [tutorQuestionContext, setTutorQuestionContext] = useState<Question | null>(null);

  // Mock exam modal state
  const [showMockExam, setShowMockExam] = useState<boolean>(false);
  const [adaptiveFocusPathId, setAdaptiveFocusPathId] = useState<1 | 2 | 3 | null>(null);
  const [adaptiveFocusModuleId, setAdaptiveFocusModuleId] = useState<number | null>(null);
  const [showFoundationalPrimerInPractice, setShowFoundationalPrimerInPractice] =
    useState<boolean>(true);

  // Engagement & Anti-fatigue states (restored from 30s auto-save)
  const [sessionAnswerCount, setSessionAnswerCount] = useState<number>(() =>
    typeof initialAutoSavedSession?.sessionAnswerCount === 'number'
      ? initialAutoSavedSession.sessionAnswerCount
      : 0
  );
  const [sessionAttempts, setSessionAttempts] = useState<QuestionAttempt[]>([]);
  const [showPostSessionReview, setShowPostSessionReview] = useState<boolean>(false);
  const [showStudyBreak, setShowStudyBreak] = useState<boolean>(false);
  const [showMicroDrill, setShowMicroDrill] = useState<number | false>(false);
  const [microDrillTargetModuleId, setMicroDrillTargetModuleId] = useState<number>(5);
  const [fundamentalsResetModules, setFundamentalsResetModules] = useState<number[] | null>(
    null
  );
  const [dismissedFundamentalsPairKey, setDismissedFundamentalsPairKey] = useState<
    string | null
  >(null);
  const [showPeerChallengeModal, setShowPeerChallengeModal] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('peer_challenge'));
    } catch {
      return false;
    }
  });
  const [peerChallengeModuleId, setPeerChallengeModuleId] = useState<number | 'all'>('all');
  const [peerChallengeInitialCode, setPeerChallengeInitialCode] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('peer_challenge');
    } catch {
      return null;
    }
  });
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState<boolean>(false);
  const [showExitSessionModal, setShowExitSessionModal] = useState<boolean>(false);

  // Focus Mode state (minimizes UI by hiding nav bar and footer)
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [focusModeToast, setFocusModeToast] = useState<string | null>(null);
  const quizFocusTimer = useQuizFocusTimer();

  // Auto-dismiss Focus Mode toast after 3s
  useEffect(() => {
    if (!focusModeToast) return;
    const timer = setTimeout(() => setFocusModeToast(null), 3000);
    return () => clearTimeout(timer);
  }, [focusModeToast]);

  const toggleFocusMode = useCallback(
    (_source?: 'shortcut' | 'button') => {
      const comboLabel = formatShortcutCombo(activeShortcuts.focusMode, detectedPlatform);
      setIsFocusMode((prev) => {
        const next = !prev;
        setFocusModeToast(
          next
            ? `Focus Mode ON • Distraction-free exam UI (Press '${comboLabel}' or 'Esc' to exit)`
            : 'Focus Mode OFF • Standard exam layout restored'
        );
        return next;
      });
    },
    [activeShortcuts.focusMode, detectedPlatform]
  );

  // Subtle Audio Feedback Mute state (persisted in localStorage, controlled in footer settings)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_audio_muted') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAudioMute = () => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_audio_muted', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Slide menu visibility state
  const [isMenuHidden, setIsMenuHidden] = useState<boolean>(false);

  // Scoped reset module modal state
  const [showResetModuleModal, setShowResetModuleModal] = useState<boolean>(false);

  // Virtual Study Room state (auto-opens if ?hub=CODE is present in URL)
  const [showStudyRoom, setShowStudyRoom] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('hub'));
    } catch {
      return false;
    }
  });

  const [selectedStudyRoomAreaId, setSelectedStudyRoomAreaId] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hub = params.get('hub');
      if (hub) return hub.trim().toUpperCase();
      return localStorage.getItem('az900_collab_room_id_v1') || 'AZ900-CONCEPTS';
    } catch {
      return 'AZ900-CONCEPTS';
    }
  });

  // Weak Areas Review modal state
  const [showWeakAreasReview, setShowWeakAreasReview] = useState<boolean>(false);

  // Review Session Modal state (Last 10 Missed Questions & Re-Test)
  const [showReviewSession, setShowReviewSession] = useState<boolean>(false);

  // Dynamic Difficulty Adjustment & Permanent Difficulty Lock state
  const [isDynamicDifficultyEnabled, setIsDynamicDifficultyEnabled] = useState<boolean>(true);
  const [lockedDifficulty, setLockedDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced' | null
  >(() => {
    try {
      const saved = localStorage.getItem('az900_locked_difficulty');
      if (saved === 'Fundamental' || saved === 'Intermediate' || saved === 'Advanced') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });
  const ROLLING_WINDOW_SIZE = 20;
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(() =>
    typeof initialAutoSavedSession?.consecutiveCorrect === 'number'
      ? initialAutoSavedSession.consecutiveCorrect
      : 0
  );
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState<number>(() =>
    typeof initialAutoSavedSession?.consecutiveIncorrect === 'number'
      ? initialAutoSavedSession.consecutiveIncorrect
      : 0
  );
  const [sessionRollingOutcomes, setSessionRollingOutcomes] = useState<boolean[]>(() => {
    if (
      Array.isArray(initialAutoSavedSession?.sessionRollingOutcomes) &&
      initialAutoSavedSession.sessionRollingOutcomes.length > 0
    ) {
      return initialAutoSavedSession.sessionRollingOutcomes
        .slice(-ROLLING_WINDOW_SIZE)
        .map(Boolean);
    }
    return extractRecentHistoricalOutcomes(getInitialStats(), ROLLING_WINDOW_SIZE);
  });
  const [dynamicDifficulty, setDynamicDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced'
  >(() => {
    try {
      const saved = localStorage.getItem('az900_locked_difficulty');
      if (saved === 'Fundamental' || saved === 'Intermediate' || saved === 'Advanced') {
        return saved;
      }
    } catch {
      // ignore
    }
    const autoSavedDiff = initialAutoSavedSession?.dynamicDifficulty;
    if (
      autoSavedDiff === 'Fundamental' ||
      autoSavedDiff === 'Intermediate' ||
      autoSavedDiff === 'Advanced'
    ) {
      return autoSavedDiff;
    }
    return 'Intermediate'; // Always start at Medium (Intermediate) difficulty
  });

  // Learning Path Focus Selection & Explicit Confirmation state for upcoming quiz session
  const [pendingFocusPathId, setPendingFocusPathId] = useState<1 | 2 | 3>(() => {
    const saved = initialAutoSavedSession?.confirmedFocusPathId;
    if (saved === 1 || saved === 2 || saved === 3) return saved;
    return 1;
  });
  const [confirmedFocusPathId, setConfirmedFocusPathId] = useState<1 | 2 | 3 | null>(() => {
    const saved = initialAutoSavedSession?.confirmedFocusPathId;
    if (saved === 1 || saved === 2 || saved === 3) return saved;
    return null;
  });
  const [isPathSelectorExpanded, setIsPathSelectorExpanded] = useState<boolean>(false);

  // Rolling average accuracy across the last 20 questions in the session
  const rollingAverageAccuracy = useMemo(() => {
    if (sessionRollingOutcomes.length === 0) return null;
    const correctInWindow = sessionRollingOutcomes.filter(Boolean).length;
    return Math.round((correctInWindow / sessionRollingOutcomes.length) * 100);
  }, [sessionRollingOutcomes]);

  // Step-by-step rolling average accuracy series over the last up to 20 questions for the header sparkline
  const rolling20AccuracySeries = useMemo<number[]>(() => {
    if (sessionRollingOutcomes.length === 0) return [];
    let runningCorrect = 0;
    return sessionRollingOutcomes.map((outcome, idx) => {
      if (outcome) runningCorrect += 1;
      return Math.round((runningCorrect / (idx + 1)) * 100);
    });
  }, [sessionRollingOutcomes]);

  // Performance trend indicator over the last 20 questions
  const rolling20Trend = useMemo<{
    delta: number;
    direction: 'up' | 'down' | 'steady';
    label: string;
  }>(() => {
    if (rolling20AccuracySeries.length < 2) {
      return { delta: 0, direction: 'steady', label: 'Calibrating' };
    }
    const latest = rolling20AccuracySeries[rolling20AccuracySeries.length - 1];
    const baselineIdx = Math.max(0, Math.floor(rolling20AccuracySeries.length / 2) - 1);
    const baseline = rolling20AccuracySeries[baselineIdx];
    const delta = latest - baseline;
    if (delta >= 2) {
      return { delta, direction: 'up', label: `+${delta}% Improving` };
    }
    if (delta <= -2) {
      return { delta, direction: 'down', label: `${delta}% Dipping` };
    }
    return { delta, direction: 'steady', label: 'Steady Pace' };
  }, [rolling20AccuracySeries]);

  // Last 5 questions '+/-' trend percentage indicator highlighting impact on dynamic difficulty level
  const last5QuestionsImpact = useMemo<{
    count: number;
    correctCount: number;
    accuracyPercent: number;
    deltaPercent: number;
    formattedDelta: string;
    direction: 'up' | 'down' | 'steady';
    impactSummary: string;
  }>(() => {
    const last5 = sessionRollingOutcomes.slice(-5);
    if (last5.length === 0) {
      return {
        count: 0,
        correctCount: 0,
        accuracyPercent: 50,
        deltaPercent: 0,
        formattedDelta: '+0%',
        direction: 'steady',
        impactSummary: 'Neutral baseline (0/5 answered)',
      };
    }
    const correctCount = last5.filter(Boolean).length;
    const accuracyPercent = Math.round((correctCount / last5.length) * 100);
    // Relative to 50% Medium equilibrium baseline: +50% max upward pressure, -50% max downward pressure
    const deltaPercent = accuracyPercent - 50;
    const formattedDelta =
      deltaPercent > 0 ? `+${deltaPercent}%` : deltaPercent < 0 ? `${deltaPercent}%` : '+0%';
    const direction = deltaPercent > 0 ? 'up' : deltaPercent < 0 ? 'down' : 'steady';
    const impactSummary =
      deltaPercent >= 25
        ? `Escalating difficulty upward (${correctCount}/${last5.length} correct in last 5)`
        : deltaPercent <= -10
        ? `Stepping difficulty downward (${correctCount}/${last5.length} correct in last 5)`
        : `Maintaining current difficulty (${correctCount}/${last5.length} correct in last 5)`;

    return {
      count: last5.length,
      correctCount,
      accuracyPercent,
      deltaPercent,
      formattedDelta,
      direction,
      impactSummary,
    };
  }, [sessionRollingOutcomes]);

  // Confirm selected Learning Path focus and generate/reset quiz session starting at Medium difficulty
  const handleConfirmLearningPathFocus = (pathToConfirm: 1 | 2 | 3) => {
    setConfirmedFocusPathId(pathToConfirm);
    setPendingFocusPathId(pathToConfirm);
    setRetryIncorrectPathId(null);
    setRetryIncorrectSnapshotIds([]);
    setSelectedPathId(pathToConfirm);
    setSelectedModuleId('all');
    setSelectedDifficultyFilter('all');
    setOnlyBookmarks(false);
    setOnlyAiGenerated(false);
    setSearchQuery('');
    setSessionRollingOutcomes([]);
    setConsecutiveCorrect(0);
    setConsecutiveIncorrect(0);
    if (!lockedDifficulty) {
      setDynamicDifficulty('Intermediate'); // Start fresh session at Medium difficulty
    }
    setCurrentQuestionIndex(0);
    setShowPostSessionReview(false);
    setIsPathSelectorExpanded(false);
  };

  // Handler to permanently lock or unlock dynamic difficulty
  const handleChangeLockedDifficulty = (
    nextLock: 'Fundamental' | 'Intermediate' | 'Advanced' | null
  ) => {
    setLockedDifficulty(nextLock);
    try {
      if (nextLock) {
        localStorage.setItem('az900_locked_difficulty', nextLock);
      } else {
        localStorage.removeItem('az900_locked_difficulty');
      }
    } catch (e) {
      console.error(e);
    }
    if (nextLock) {
      setDynamicDifficulty(nextLock);
      setIsDynamicDifficultyEnabled(true);
    }
  };

  // Effective dynamic difficulty respects permanent lock override
  const effectiveDynamicDifficulty = lockedDifficulty || dynamicDifficulty;

  // Visual Fire-Streak celebration trigger in header
  const [fireStreakTrigger, setFireStreakTrigger] = useState<number>(0);

  // Global Keyboard Shortcut handler honoring platform defaults + user-customized Accessibility bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const focusLabel = formatShortcutCombo(activeShortcuts.focusMode, detectedPlatform);
      const adaptiveLabel = formatShortcutCombo(
        activeShortcuts.adaptiveDifficulty,
        detectedPlatform
      );

      // 1. Escape key exits Focus Mode
      if (e.key === 'Escape' && isFocusMode && !showAccessibilityModal) {
        e.preventDefault();
        setIsFocusMode(false);
        setFocusModeToast(`Focus Mode OFF • Press '${focusLabel}' to re-enter`);
        return;
      }

      // Skip global shortcuts while editing form inputs or inside accessibility binding recorder
      if (showAccessibilityModal) return;

      const isDefaultFocus = isSameBinding(
        activeShortcuts.focusMode,
        DEFAULT_SHORTCUT_CONFIG.focusMode
      );
      const isDefaultAdaptive = isSameBinding(
        activeShortcuts.adaptiveDifficulty,
        DEFAULT_SHORTCUT_CONFIG.adaptiveDifficulty
      );

      // 2. Focus Mode Toggle (configured combo, plus single-key 'F' fallback when using default)
      if (
        matchesShortcutEvent(
          e,
          activeShortcuts.focusMode,
          Boolean(isEditable),
          isDefaultFocus ? 'f' : undefined
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
        toggleFocusMode('shortcut');
        return;
      }

      // 3. Adaptive Difficulty Toggle (configured combo, plus single-key 'A' fallback when using default)
      if (
        matchesShortcutEvent(
          e,
          activeShortcuts.adaptiveDifficulty,
          Boolean(isEditable),
          isDefaultAdaptive ? 'a' : undefined
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsDynamicDifficultyEnabled((prev) => {
          const next = !prev;
          setFocusModeToast(
            next
              ? `Adaptive Difficulty ON • Auto-adjusting difficulty from your last 5–20 answers (${adaptiveLabel})`
              : `Adaptive Difficulty PAUSED • Difficulty level held steady (${adaptiveLabel} to re-enable)`
          );
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    toggleFocusMode,
    activeShortcuts,
    detectedPlatform,
    showAccessibilityModal,
  ]);

  // Scoped Module Confidence Reset Handler
  const handleResetModuleConfidence = (moduleId: number) => {
    const updated = resetModuleConfidence(stats, moduleId);
    setStats(updated);
  };

  // Mark Question Skipped for Weak Areas Review without penalty or completion
  const handleSkipQuestion = (questionId: string) => {
    setStats((prev) => markQuestionSkipped(prev, questionId));
  };

  // Previously missed question IDs grouped by Learning Path (1, 2, 3)
  const missedQuestionsByPath = useMemo(() => {
    const unresolvedMap = getUnresolvedMistakesMap(stats);
    const grouped: Record<1 | 2 | 3, string[]> = { 1: [], 2: [], 3: [] };

    ([1, 2, 3] as const).forEach((pId) => {
      const pathQs = questions.filter((q) => q.learningPathId === pId);
      // Primary: unresolved mistakes or latest attempt is incorrect
      const primaryMissed = pathQs
        .filter((q) => {
          if (unresolvedMap.has(q.id)) return true;
          const atts = stats.attempts?.[q.id] || [];
          if (atts.length > 0) {
            const latest = [...atts].sort((a, b) => b.timestamp - a.timestamp)[0];
            if (!latest.isCorrect) return true;
          }
          return false;
        })
        .map((q) => q.id);

      if (primaryMissed.length > 0) {
        grouped[pId] = primaryMissed;
      } else {
        // Fallback: any question in this path that was previously missed at least once
        grouped[pId] = pathQs
          .filter((q) => (stats.attempts?.[q.id] || []).some((a) => !a.isCorrect))
          .map((q) => q.id);
      }
    });

    return grouped;
  }, [questions, stats]);

  // Toggle 'Retry Incorrect' filter for a specific Learning Path
  const handleToggleRetryIncorrectInPath = (pathId: 1 | 2 | 3) => {
    if (retryIncorrectPathId === pathId) {
      setRetryIncorrectPathId(null);
      setRetryIncorrectSnapshotIds([]);
      setCurrentQuestionIndex(0);
      return;
    }

    const missedIds = missedQuestionsByPath[pathId] || [];
    if (missedIds.length === 0) return;

    setRetryIncorrectPathId(pathId);
    setRetryIncorrectSnapshotIds(missedIds);
    setSelectedPathId(pathId);
    setSelectedModuleId('all');
    setOnlyBookmarks(false);
    setOnlyAiGenerated(false);
    setCurrentQuestionIndex(0);
    setShowPostSessionReview(false);
    setActiveTab('quiz');
  };

  // Filtered question set with multi-state difficulty filter, dynamic difficulty lock, 5m retry queue, and global search
  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const unresolvedMap = getUnresolvedMistakesMap(stats);

    const list = questions.filter((q) => {
      if (onlyRetryQueue && retryQueueSecondsLeft > 0 && retryQueueQuestionIds.length > 0) {
        if (!retryQueueQuestionIds.includes(q.id)) return false;
      }
      if (retryIncorrectPathId !== null) {
        if (q.learningPathId !== retryIncorrectPathId) return false;
        const allowedIds =
          retryIncorrectSnapshotIds.length > 0
            ? retryIncorrectSnapshotIds
            : missedQuestionsByPath[retryIncorrectPathId] || [];
        if (!allowedIds.includes(q.id)) return false;
      }
      if (selectedPathId !== 'all' && q.learningPathId !== selectedPathId) {
        return false;
      }
      if (selectedModuleId !== 'all' && q.moduleId !== selectedModuleId) {
        return false;
      }
      if (selectedDifficultyFilter !== 'all' && q.difficulty !== selectedDifficultyFilter) {
        return false;
      }
      if (selectedThreadFilters.length > 0) {
        const qThreads = getThreadTagsForQuestion(q, 3).map((t) => t.id);
        if (!selectedThreadFilters.some((tag) => qThreads.includes(tag))) {
          return false;
        }
      }
      if (onlyBookmarks && !stats.bookmarks.includes(q.id)) {
        return false;
      }
      if (onlySavedNotes && (!savedNotesMap[q.id] || !savedNotesMap[q.id].trim())) {
        return false;
      }
      if (onlyAiGenerated && !q.isAiGenerated) {
        return false;
      }
      if (onlyUnresolvedMistakes && !unresolvedMap.has(q.id)) {
        return false;
      }
      if (normalizedSearch) {
        const matchesSearch =
          q.question.toLowerCase().includes(normalizedSearch) ||
          q.scenario.toLowerCase().includes(normalizedSearch) ||
          q.moduleTitle.toLowerCase().includes(normalizedSearch) ||
          q.options.some((opt) => opt.text.toLowerCase().includes(normalizedSearch)) ||
          q.whyCorrect.toLowerCase().includes(normalizedSearch) ||
          q.examTip.toLowerCase().includes(normalizedSearch);
        if (!matchesSearch) {
          return false;
        }
      }
      return true;
    });

    // Apply explicit Quick-Sort toggle order when selected by student
    if (questionSortOrder === 'newest-first') {
      const reversed = [...list].reverse();
      return reversed.sort((a, b) => {
        if (a.isAiGenerated && !b.isAiGenerated) return -1;
        if (b.isAiGenerated && !a.isAiGenerated) return 1;
        return 0;
      });
    }

    if (questionSortOrder === 'hardest-first') {
      const difficultyWeight: Record<'Fundamental' | 'Intermediate' | 'Advanced', number> = {
        Advanced: 3,
        Intermediate: 2,
        Fundamental: 1,
      };
      return [...list].sort((a, b) => {
        const diffDelta = difficultyWeight[b.difficulty] - difficultyWeight[a.difficulty];
        if (diffDelta !== 0) return diffDelta;
        return a.learningPathId - b.learningPathId || a.moduleId - b.moduleId;
      });
    }

    if (questionSortOrder === 'easiest-first') {
      const difficultyWeight: Record<'Fundamental' | 'Intermediate' | 'Advanced', number> = {
        Fundamental: 1,
        Intermediate: 2,
        Advanced: 3,
      };
      return [...list].sort((a, b) => {
        const diffDelta = difficultyWeight[a.difficulty] - difficultyWeight[b.difficulty];
        if (diffDelta !== 0) return diffDelta;
        return a.learningPathId - b.learningPathId || a.moduleId - b.moduleId;
      });
    }

    if (questionSortOrder === 'module-progression') {
      return [...list].sort(
        (a, b) => a.learningPathId - b.learningPathId || a.moduleId - b.moduleId
      );
    }

    // If dynamic difficulty is permanently locked, prioritize the locked difficulty
    if (lockedDifficulty !== null) {
      return [...list].sort((a, b) => {
        if (a.difficulty === lockedDifficulty && b.difficulty !== lockedDifficulty) return -1;
        if (b.difficulty === lockedDifficulty && a.difficulty !== lockedDifficulty) return 1;
        return a.moduleId - b.moduleId;
      });
    }

    // If adaptive difficulty is enabled (rolling average mechanism), prioritize questions matching effectiveDynamicDifficulty
    // while preserving module order as secondary tie-breaker (works both within a focused Learning Path and across all paths)
    if (isDynamicDifficultyEnabled && selectedDifficultyFilter === 'all') {
      return [...list].sort((a, b) => {
        if (
          a.difficulty === effectiveDynamicDifficulty &&
          b.difficulty !== effectiveDynamicDifficulty
        )
          return -1;
        if (
          b.difficulty === effectiveDynamicDifficulty &&
          a.difficulty !== effectiveDynamicDifficulty
        )
          return 1;
        return a.moduleId - b.moduleId;
      });
    }

    // When a specific learning path is selected and dynamic difficulty is off, present sequentially
    if (selectedPathId !== 'all') {
      return [...list].sort((a, b) => a.moduleId - b.moduleId);
    }

    return list;
  }, [
    questions,
    onlyRetryQueue,
    retryQueueSecondsLeft,
    retryQueueQuestionIds,
    retryIncorrectPathId,
    retryIncorrectSnapshotIds,
    missedQuestionsByPath,
    selectedPathId,
    selectedModuleId,
    selectedDifficultyFilter,
    selectedThreadFilters,
    onlyBookmarks,
    onlySavedNotes,
    savedNotesMap,
    onlyAiGenerated,
    onlyUnresolvedMistakes,
    searchQuery,
    stats,
    isDynamicDifficultyEnabled,
    effectiveDynamicDifficulty,
    lockedDifficulty,
    questionSortOrder,
  ]);

  const threadQuestionCounts = useMemo(() => {
    const counts: Partial<Record<ThreadTagId, number>> = {};
    for (const q of questions) {
      if (selectedPathId !== 'all' && q.learningPathId !== selectedPathId) continue;
      if (selectedModuleId !== 'all' && q.moduleId !== selectedModuleId) continue;
      const tags = getThreadTagsForQuestion(q, 3);
      for (const tag of tags) {
        counts[tag.id] = (counts[tag.id] || 0) + 1;
      }
    }
    return counts;
  }, [questions, selectedPathId, selectedModuleId]);

  // Handle jumping directly to a specific question selected in GlobalSearchBar or via Deep-Link
  useEffect(() => {
    if (!pendingJumpQuestionId) return;
    const idx = filteredQuestions.findIndex(
      (q) => q.id.toLowerCase() === pendingJumpQuestionId.toLowerCase()
    );
    if (idx !== -1) {
      setCurrentQuestionIndex(idx);
      setPendingJumpQuestionId(null);
    }
  }, [pendingJumpQuestionId, filteredQuestions]);

  // Keep index within bounds
  useEffect(() => {
    if (currentQuestionIndex >= filteredQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, filteredQuestions.length - 1));
    }
  }, [filteredQuestions.length, currentQuestionIndex]);

  // Deep-linking: Automatically navigate to shared question (?q=ID&path=X) and open its learning path
  useEffect(() => {
    if (typeof window === 'undefined' || initialDeepLinkHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sharedQId = params.get('q');
    const sharedPathParam = params.get('path');

    if (sharedQId && questions.length > 0) {
      const target = questions.find((q) => q.id.toLowerCase() === sharedQId.toLowerCase());
      if (target) {
        initialDeepLinkHandledRef.current = true;
        setRetryIncorrectPathId(null);
        setRetryIncorrectSnapshotIds([]);
        setSelectedPathId(target.learningPathId);
        setSelectedModuleId('all');
        setSelectedDifficultyFilter('all');
        setOnlyBookmarks(false);
        setOnlyAiGenerated(false);
        setSearchQuery('');
        setShowPostSessionReview(false);
        setActiveTab('quiz');
        setPendingJumpQuestionId(target.id);
      }
    } else if (sharedPathParam) {
      const parsedPath = Number(sharedPathParam);
      if (parsedPath === 1 || parsedPath === 2 || parsedPath === 3) {
        initialDeepLinkHandledRef.current = true;
        setSelectedPathId(parsedPath);
        setSelectedModuleId('all');
        setActiveTab('quiz');
      }
    }
  }, [questions]);

  // Global Daily Study Reminder scheduler (fires browser Notification at user-defined time if not yet fired today)
  useEffect(() => {
    const checkGlobalReminder = async () => {
      const settings = getStoredReminderSettings();
      if (!settings.enabled) return;

      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      if (currentHHMM === settings.reminderTime && settings.lastNotifiedDate !== todayKey) {
        saveReminderSettings({
          ...settings,
          lastNotifiedDate: todayKey,
        });

        const solvedToday = getTodaySolvedQuestionsCount(stats);
        const title =
          solvedToday === 0
            ? `🔥 Keep Your ${stats.streakDays || 1}-Day AZ-900 Streak Alive!`
            : `⚡ Daily AZ-900 Study Check-In (${settings.reminderTime})`;
        const body =
          solvedToday === 0
            ? 'Complete at least 1 scenario-based question today to maintain your study streak!'
            : `Awesome job completing ${solvedToday} question(s) today! Ready for 1 bonus scenario?`;

        await triggerBrowserStudyNotification(title, body, () => {
          setActiveTab('quiz');
        });
      }
    };

    const timer = setInterval(checkGlobalReminder, 20000);
    return () => clearInterval(timer);
  }, [stats]);

  // Count questions per module
  const questionCountByModule = useMemo(() => {
    const counts: Record<number, number> = {};
    questions.forEach((q) => {
      counts[q.moduleId] = (counts[q.moduleId] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Answer handler with dynamic difficulty progression (respecting permanent difficulty lock)
  const handleAnswerQuestion = (
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    customQuestionObj?: Question
  ) => {
    const targetQ = customQuestionObj || questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    const attempt: QuestionAttempt = {
      questionId,
      moduleId: targetQ.moduleId,
      pathId: targetQ.learningPathId,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
    };

    const updatedStats = saveUserAttempt(stats, attempt);
    setStats(updatedStats);
    setSessionAttempts((prev) => [...prev, attempt]);

    // Write user progress update & evaluate answer via the Postgres / Supabase database utility hook
    if (['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      submitQuestionAnswer(
        questionId,
        selectedAnswer as 'A' | 'B' | 'C' | 'D',
        false
      ).catch(() => {});
    }

    const modStat = updatedStats.moduleMastery[targetQ.moduleId];
    if (modStat && modStat.total > 0) {
      const modScore = Math.round((modStat.correct / modStat.total) * 100);
      const modStatus = modScore >= 80 ? 'mastered' : 'in_progress';
      writeModuleProgress({
        moduleId: targetQ.moduleId,
        score: modScore,
        status: modStatus,
        attemptsCount: modStat.total,
        correctCount: modStat.correct,
      }).catch(() => {});
    }

    // Update rolling window of recent answers in current session (last 5 answers)
    const nextRollingWindow = [...sessionRollingOutcomes, isCorrect].slice(-ROLLING_WINDOW_SIZE);
    setSessionRollingOutcomes(nextRollingWindow);
    const nextRollingAvg = Math.round(
      (nextRollingWindow.filter(Boolean).length / nextRollingWindow.length) * 100
    );

    // Maintain streak counters
    if (isCorrect) {
      setConsecutiveCorrect((prev) => prev + 1);
      setConsecutiveIncorrect(0);
    } else {
      setConsecutiveIncorrect((prev) => prev + 1);
      setConsecutiveCorrect(0);
    }

    // Rolling-Average Adaptive Difficulty Mechanism:
    // Starts at Medium ('Intermediate') and dynamically adjusts up or down based on the rolling average
    // of correct/incorrect answers within the current session (when not permanently locked).
    if (isDynamicDifficultyEnabled && lockedDifficulty === null && nextRollingWindow.length >= 2) {
      if (nextRollingAvg >= 75) {
        if (dynamicDifficulty === 'Fundamental') {
          setDynamicDifficulty('Intermediate');
        } else if (dynamicDifficulty === 'Intermediate') {
          setDynamicDifficulty('Advanced');
        }
      } else if (nextRollingAvg <= 40) {
        if (dynamicDifficulty === 'Advanced') {
          setDynamicDifficulty('Intermediate');
        } else if (dynamicDifficulty === 'Intermediate') {
          setDynamicDifficulty('Fundamental');
        }
      } else {
        // Balanced rolling average (41% - 74%) calibrates toward Medium (Intermediate)
        if (nextRollingWindow.length >= 3 && dynamicDifficulty !== 'Intermediate') {
          setDynamicDifficulty('Intermediate');
        }
      }
    }

    // Track session count and trigger gentle anti-burnout break every 6 questions
    const nextCount = sessionAnswerCount + 1;
    setSessionAnswerCount(nextCount);
    if (nextCount > 0 && nextCount % 6 === 0) {
      setShowStudyBreak(true);
    }

    // Trigger celebratory fire-streak momentum animation in header
    setFireStreakTrigger((prev) => prev + 1);
    setTrendScoreFlipParity((prev) => !prev);
    triggerMotifShimmer();

    // Check if the updated performance marks a new all-time high score for the active Learning Path
    const pathKey = String(selectedPathId === 'all' ? targetQ.learningPathId : selectedPathId);
    const nextAttempts = [...sessionAttempts, attempt];
    const pathSessionAttempts = nextAttempts.filter(
      (a) => String(a.pathId) === pathKey || selectedPathId === 'all'
    );
    if (pathSessionAttempts.length > 0 && isCorrect) {
      const nextPathScore = Math.round(
        (pathSessionAttempts.filter((a) => a.isCorrect).length / pathSessionAttempts.length) * 100
      );
      const prevHigh = pathAllTimeHighs[pathKey] ?? 80;
      if (nextPathScore >= prevHigh) {
        const updatedHighs = { ...pathAllTimeHighs, [pathKey]: nextPathScore };
        setPathAllTimeHighs(updatedHighs);
        try {
          localStorage.setItem('az900_path_all_time_high_scores_v1', JSON.stringify(updatedHighs));
        } catch {
          // ignore
        }
        const pathLabel =
          pathKey === 'all' ? 'All Paths' : `Learning Path ${pathKey}`;
        setAllTimeHighToast(`New All-Time High! ${pathLabel}: ${nextPathScore}%`);
      }
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = (questionId: string) => {
    const updated = toggleBookmark(stats, questionId);
    setStats(updated);
  };

  // Module completion toggle (Curriculum Progress Tracker)
  const handleToggleModuleComplete = (moduleId: number) => {
    const isCurrentlyComplete = stats.completedModules?.includes(moduleId);
    if (!isCurrentlyComplete) {
      fireModuleCompletionConfetti(`Module ${moduleId}`);
    }
    const updated = toggleModuleCompletion(stats, moduleId);
    setStats(updated);
  };

  // User confidence scoring rating handler (1-5 scale)
  const handleRateConfidence = (questionId: string, confidence: number) => {
    const updated = saveQuestionConfidence(stats, questionId, confidence);
    setStats(updated);
  };

  // Mark a missed question as reviewed successfully to remove from future review sessions
  const handleMarkQuestionReviewed = (questionId: string) => {
    const updated = markQuestionReviewedSuccessfully(stats, questionId);
    setStats(updated);
  };

  const unresolvedMistakesCount = useMemo(
    () => getUnresolvedMissedQuestionsCount(stats),
    [stats]
  );

  // Detect if rolling average accuracy dropped below 60% across two consecutive modules
  const consecutiveLowAccuracyModulesAlert = useMemo(() => {
    // Collect recent chronological attempts across stats.attempts + current sessionAttempts
    const dedupMap = new Map<string, QuestionAttempt>();
    Object.values(stats.attempts || {}).forEach((list) => {
      list.forEach((att) => {
        dedupMap.set(`${att.questionId}-${att.timestamp}`, att);
      });
    });
    sessionAttempts.forEach((att) => {
      dedupMap.set(`${att.questionId}-${att.timestamp}`, att);
    });

    const chronological = Array.from(dedupMap.values())
      .filter((a) => typeof a.moduleId === 'number' && a.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-80);

    if (chronological.length < 4) return null;

    // Build rolling recent attempts per module & track the order of distinct modules practiced
    const perModuleOutcomes = new Map<number, boolean[]>();
    const moduleOrder: number[] = [];

    chronological.forEach((att) => {
      const existing = perModuleOutcomes.get(att.moduleId) || [];
      perModuleOutcomes.set(att.moduleId, [...existing, att.isCorrect].slice(-10));

      const prevIdx = moduleOrder.indexOf(att.moduleId);
      if (prevIdx !== -1) {
        moduleOrder.splice(prevIdx, 1);
      }
      moduleOrder.push(att.moduleId);
    });

    // Keep modules with at least 2 recent attempts to compute meaningful rolling module accuracy
    const qualifiedModules = moduleOrder
      .map((modId) => {
        const outcomes = perModuleOutcomes.get(modId) || [];
        const total = outcomes.length;
        const correct = outcomes.filter(Boolean).length;
        const rollingAccuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
        const modMeta = LEARNING_PATHS.flatMap((p) => p.modules).find(
          (m) => m.id === modId
        );
        return {
          moduleId: modId,
          title: modMeta?.title || `Module ${modId}`,
          total,
          correct,
          rollingAccuracy,
        };
      })
      .filter((m) => m.total >= 2);

    if (qualifiedModules.length < 2) return null;

    const prevMod = qualifiedModules[qualifiedModules.length - 2];
    const currMod = qualifiedModules[qualifiedModules.length - 1];

    if (prevMod.rollingAccuracy < 60 && currMod.rollingAccuracy < 60) {
      return {
        prevMod,
        currMod,
        pairKey: `${prevMod.moduleId}-${currMod.moduleId}`,
      };
    }

    return null;
  }, [stats.attempts, sessionAttempts]);

  // Reset dismissed state once the user recovers rolling accuracy above 60%
  useEffect(() => {
    if (!consecutiveLowAccuracyModulesAlert && dismissedFundamentalsPairKey !== null) {
      setDismissedFundamentalsPairKey(null);
    }
  }, [consecutiveLowAccuracyModulesAlert, dismissedFundamentalsPairKey]);

  const showFundamentalsResetAlert =
    consecutiveLowAccuracyModulesAlert !== null &&
    consecutiveLowAccuracyModulesAlert.pairKey !== dismissedFundamentalsPairKey;

  // Add newly generated AI question
  const handleQuestionGenerated = (newQ: Question) => {
    setQuestions((prev) => {
      const updated = [newQ, ...prev];
      try {
        const customOnly = updated.filter((q) => q.isAiGenerated);
        localStorage.setItem('az900_custom_questions_v1', JSON.stringify(customOnly));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Switch to quiz view and show the new question
    setSelectedPathId(newQ.learningPathId);
    setSelectedModuleId(newQ.moduleId);
    setOnlyBookmarks(false);
    setOnlyAiGenerated(false);
    setCurrentQuestionIndex(0);
    setActiveTab('quiz');
  };

  // Ask AI Tutor about current question
  const handleAskTutorAboutQuestion = (q: Question) => {
    setTutorQuestionContext(q);
    setActiveTab('assistant');
  };

  // 1-Click drill for weak areas
  const handleDrillWeakAreas = (moduleIds: number[]) => {
    if (moduleIds.length === 0) return;
    setSelectedPathId('all');
    setSelectedModuleId(moduleIds[0]);
    setCurrentQuestionIndex(0);
    setActiveTab('quiz');
  };

  // Select module from confidence tracker or curriculum
  const handleSelectModuleFromTracker = (moduleId: number) => {
    const foundPath = LEARNING_PATHS.find((p) =>
      p.modules.some((m) => m.id === moduleId)
    );
    if (foundPath) {
      setSelectedPathId(foundPath.id);
      setSelectedModuleId(moduleId);
    }
    if (isModuleLockedForCurrentUser(moduleId)) {
      setTierSelectionLockedModuleId(moduleId);
    }
    setCurrentQuestionIndex(0);
    setActiveTab('quiz');
  };

  const currentQ = filteredQuestions[currentQuestionIndex];

  // Track active study seconds per Azure Learning Path (1, 2, 3) when tab is visible
  useEffect(() => {
    const activePath: 1 | 2 | 3 | null =
      activeTab === 'quiz'
        ? currentQ?.learningPathId === 1 ||
          currentQ?.learningPathId === 2 ||
          currentQ?.learningPathId === 3
          ? currentQ.learningPathId
          : selectedPathId === 1 || selectedPathId === 2 || selectedPathId === 3
          ? selectedPathId
          : null
        : activeTab === 'adaptive' &&
          (adaptiveFocusPathId === 1 || adaptiveFocusPathId === 2 || adaptiveFocusPathId === 3)
        ? adaptiveFocusPathId
        : null;

    if (!activePath) return;

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setPathStudySeconds(incrementPathStudySecond(activePath));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, currentQ?.learningPathId, selectedPathId, adaptiveFocusPathId]);

  // Periodic 30-second Auto-Save of current quiz session state (last active question, current streak, rolling accuracy) to localStorage
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(() =>
    initialAutoSavedSession?.savedAt || null
  );
  const latestQuizSessionRef = React.useRef<AutoSavedQuizSessionState>({
    currentQuestionIndex,
    lastActiveQuestionId: currentQ?.id || null,
    consecutiveCorrect,
    consecutiveIncorrect,
    sessionRollingOutcomes,
    dynamicDifficulty,
    selectedPathId,
    selectedModuleId,
    confirmedFocusPathId,
    sessionAnswerCount,
    savedAt: Date.now(),
  });

  useEffect(() => {
    latestQuizSessionRef.current = {
      currentQuestionIndex,
      lastActiveQuestionId: currentQ?.id || null,
      consecutiveCorrect,
      consecutiveIncorrect,
      sessionRollingOutcomes,
      dynamicDifficulty,
      selectedPathId,
      selectedModuleId,
      confirmedFocusPathId,
      sessionAnswerCount,
      savedAt: Date.now(),
    };
  }, [
    currentQuestionIndex,
    currentQ?.id,
    consecutiveCorrect,
    consecutiveIncorrect,
    sessionRollingOutcomes,
    dynamicDifficulty,
    selectedPathId,
    selectedModuleId,
    confirmedFocusPathId,
    sessionAnswerCount,
  ]);

  const persistQuizSessionStateNow = useCallback(() => {
    try {
      const now = Date.now();
      const payload: AutoSavedQuizSessionState = {
        ...latestQuizSessionRef.current,
        savedAt: now,
      };
      localStorage.setItem(QUIZ_SESSION_AUTOSAVE_KEY, JSON.stringify(payload));
      setLastAutoSavedAt(now);
    } catch (e) {
      console.error('Failed to auto-save quiz session state:', e);
    }
  }, []);

  useEffect(() => {
    // 1. Periodic 30-second auto-save interval
    const intervalId = setInterval(() => {
      persistQuizSessionStateNow();
    }, AUTOSAVE_INTERVAL_MS);

    // 2. Immediate flush if browser tab closes or hides unexpectedly
    const handleBeforeUnload = () => {
      persistQuizSessionStateNow();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistQuizSessionStateNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [persistQuizSessionStateNow]);

  return (
    <ProtectedRoute onUserChange={setAuthenticatedUser}>
      <div className="min-h-screen w-[100vw] max-w-[100vw] overflow-x-hidden bg-[var(--theme-bg-body)] text-[var(--theme-text-primary)] transition-colors duration-300 relative flex flex-col font-sans">
        {/* Subtle African Kitenge Watermark Background */}
        <AfricanWatermarkPattern opacity={0.04} />

        {/* Offline & Postgres Background Sync Status Indicator */}
        <OfflineIndicator />

        {/* Celebratory 25% & 50% Daily Study Goal Milestone Badge Overlay */}
        <DailyGoalMilestoneOverlay
          todayAnsweredCount={todayAnsweredCount}
          dailyGoal={stats.dailyGoal || 10}
        />

        {/* Global Notifications Stack: Payment, All-Time High, Focus Mode & Fundamentals Reset Alert */}
        {(paymentSuccessToast ||
          allTimeHighToast ||
          focusModeToast ||
          showFundamentalsResetAlert) && (
          <div
            className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-2 sm:px-0"
            aria-live="polite"
          >
            {showFundamentalsResetAlert && consecutiveLowAccuracyModulesAlert && (
              <div
                role="alert"
                className="pointer-events-auto p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-rose-950 to-amber-950 text-white border-2 border-amber-400 shadow-2xl space-y-2.5 animate-in slide-in-from-top-3 duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-400 text-slate-950 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-amber-300 leading-snug">
                        Rolling Accuracy Below 60% (2 Consecutive Modules)
                      </div>
                      <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                        Your rolling accuracy dipped below 60% in{' '}
                        <strong className="text-rose-300">
                          M{consecutiveLowAccuracyModulesAlert.prevMod.moduleId} (
                          {consecutiveLowAccuracyModulesAlert.prevMod.rollingAccuracy}%)
                        </strong>{' '}
                        and{' '}
                        <strong className="text-rose-300">
                          M{consecutiveLowAccuracyModulesAlert.currMod.moduleId} (
                          {consecutiveLowAccuracyModulesAlert.currMod.rollingAccuracy}%)
                        </strong>
                        . Rebuild core concepts with a <strong>Fundamentals Reset</strong> drill.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDismissedFundamentalsPairKey(
                        consecutiveLowAccuracyModulesAlert.pairKey
                      )
                    }
                    className="text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer shrink-0"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const targetIds = [
                        consecutiveLowAccuracyModulesAlert.currMod.moduleId,
                        consecutiveLowAccuracyModulesAlert.prevMod.moduleId,
                      ];
                      setFundamentalsResetModules(targetIds);
                      setMicroDrillTargetModuleId(targetIds[0]);
                      setShowMicroDrill(targetIds[0]);
                      setDismissedFundamentalsPairKey(
                        consecutiveLowAccuracyModulesAlert.pairKey
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start Fundamentals Reset Drill</span>
                  </button>
                </div>
              </div>
            )}

            {paymentSuccessToast && (
              <div
                role="status"
                className="pointer-events-auto p-4 rounded-2xl bg-slate-900 text-white border-2 border-emerald-400 shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-top-3 duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-emerald-300">
                        Payment Successful!
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-mono text-[10px] font-black">
                        #{paymentSuccessToast.receiptNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                      {paymentSuccessToast.planLabel} (${paymentSuccessToast.amountUsd}.00 USD) unlocked. Your Supabase profile{' '}
                      <code className="font-mono text-amber-300">paid_status</code> has been refreshed to{' '}
                      <code className="font-mono text-emerald-300">active</code>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentSuccessToast(null)}
                  className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {allTimeHighToast && (
              <div
                role="status"
                className="pointer-events-auto p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#006600] to-slate-900 text-white border border-amber-300 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200"
              >
                <div className="flex items-center gap-2.5 text-xs font-black">
                  <Award className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{allTimeHighToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllTimeHighToast(null)}
                  className="text-[11px] font-bold text-amber-200 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {focusModeToast && (
              <div
                role="status"
                className="pointer-events-auto p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-[#0078D4] text-white border border-sky-400 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200"
              >
                <div className="flex items-center gap-2.5 text-xs font-black">
                  <Maximize2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{focusModeToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFocusModeToast(null)}
                  className="text-[11px] font-bold text-sky-200 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* Primary Header with African Motif Ribbon & Azure Curriculum Branding (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedPathId={selectedPathId}
            onSelectPath={(p) => {
              setRetryIncorrectPathId(null);
              setRetryIncorrectSnapshotIds([]);
              setSelectedPathId(p);
            }}
            stats={stats}
            onOpenExport={() => setShowExportModal(true)}
            onUpdateStats={setStats}
            fireStreakTrigger={fireStreakTrigger}
            onOpenReviewSession={() => setShowReviewSession(true)}
            questions={questions}
            searchQuery={searchQuery}
            onSearchQueryChange={(query) => {
              setSearchQuery(query);
              setCurrentQuestionIndex(0);
              if (query.trim() && activeTab !== 'quiz') {
                setActiveTab('quiz');
              }
            }}
            onSelectQuestion={(targetQ) => {
              setSearchQuery('');
              setRetryIncorrectPathId(null);
              setRetryIncorrectSnapshotIds([]);
              setSelectedPathId('all');
              setSelectedModuleId('all');
              setOnlyBookmarks(false);
              setOnlyAiGenerated(false);
              setActiveTab('quiz');
              setPendingJumpQuestionId(targetQ.id);
            }}
            onSelectModule={(modId, pathId) => {
              setSearchQuery('');
              setRetryIncorrectPathId(null);
              setRetryIncorrectSnapshotIds([]);
              setSelectedPathId(pathId);
              setSelectedModuleId(modId);
              setOnlyBookmarks(false);
              setOnlyAiGenerated(false);
              setCurrentQuestionIndex(0);
              setActiveTab('quiz');
            }}
            onRetryIncorrectPath={handleToggleRetryIncorrectInPath}
            retryIncorrectPathId={retryIncorrectPathId}
            onOpenStudyBreak={() => setShowStudyBreak(true)}
            onOpenUserGuide={() => setShowUserGuideModal(true)}
            onOpenCurriculumReadiness={() => setShowCurriculumReadinessModal(true)}
            onOpenAdminBackOffice={() => setShowAdminBackOfficeModal(true)}
            realtimeStatus={realtimeStatus}
            lastSyncedAt={lastSyncedAt}
            onOpenCloudBackend={() => setShowBackendCloudModal(true)}
            userEmail={authenticatedUser?.email || null}
            onLogout={() => {
              setShowExitSessionModal(true);
            }}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => toggleFocusMode('button')}
            isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
            onToggleDynamicDifficulty={() =>
              setIsDynamicDifficultyEnabled((prev) => !prev)
            }
            effectiveDynamicDifficulty={effectiveDynamicDifficulty}
            consecutiveCorrect={consecutiveCorrect}
            onOpenAccessibilitySettings={() => setShowAccessibilityModal(true)}
            unresolvedMistakesCount={unresolvedMistakesCount}
            pendingOfflineCount={pendingOfflineCount}
          />
        )}

      {/* Floating Focus Mode Banner (Minimized UI for Test-Like Concentration) */}
      {isFocusMode && (
        <div className="sticky top-4 z-50 px-4 max-w-4xl w-full mx-auto animate-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 px-5 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-4">
            <div className="relative group/floatingfocus flex items-center gap-3 cursor-pointer">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400 block">
                  Focus Mode Active (Hover for Shortcuts)
                </span>
                <span className="text-xs text-slate-300 hidden sm:inline">
                  Navigation bar and footer hidden • Test-like exam concentration
                </span>
              </div>

              {/* Hover-Only Dynamic Platform-Aware Keyboard Shortcut Guide */}
              <KeyboardShortcutGuidePopover
                isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
                effectiveDynamicDifficulty={effectiveDynamicDifficulty}
                onToggleDynamicDifficulty={() =>
                  setIsDynamicDifficultyEnabled((prev) => !prev)
                }
                onOpenAccessibilitySettings={() => setShowAccessibilityModal(true)}
                align="left"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <span className="text-xs font-bold text-slate-400">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </span>
              <QuizFocusTimerPill timer={quizFocusTimer} compact />
              <ThemeToggle />
              <button
                onClick={() => toggleFocusMode('button')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
                title={`Exit Focus Mode (or press ${formatShortcutCombo(
                  activeShortcuts.focusMode,
                  detectedPlatform
                )} or Esc)`}
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Focus</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-300">
                  {formatShortcutCombo(activeShortcuts.focusMode, detectedPlatform)} / Esc
                </kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-[100vw] max-w-[100vw] min-w-0 overflow-x-hidden mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        {/* TAB 1: PRACTICE MODULES */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 sm:space-y-5 w-full min-w-0">
            {/* Compact Responsive Hero Section + Glassy Study Hub Dropdown (Hidden in Focus Mode) */}
            {!isFocusMode && (
              <div className="text-center py-1 sm:py-2 space-y-2.5 max-w-5xl mx-auto relative z-20">
                {/* Top Row: AZ-900 Badge + Glassy Study Hub Dropdown + Student Cohort Links */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-blue-500/10 via-sky-500/20 to-blue-500/10 text-[#0078D4] border border-sky-300/60 shadow-2xs backdrop-blur-xs">
                    <MaasaiMedallion size={14} />
                    <span className="tracking-wide uppercase font-extrabold">
                      AZ-900 Azure Cloud Explorer
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <GlassyStudyHubDropdown
                    stats={stats}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenExport={() => setShowExportModal(true)}
                    isMenuHidden={isMenuHidden}
                    onToggleSlideMenu={() => setIsMenuHidden(!isMenuHidden)}
                    onOpenResetModal={() => setShowResetModuleModal(true)}
                    onUpdateStats={setStats}
                    onDrillDomain={(moduleIds) => {
                      if (moduleIds.length > 0) {
                        setSelectedModuleId(moduleIds[0]);
                      }
                      setActiveTab('quiz');
                      setCurrentQuestionIndex(0);
                    }}
                    onOpenWeakAreasReview={() => setShowWeakAreasReview(true)}
                    onOpenStudyRoom={(areaId) => {
                      if (areaId) setSelectedStudyRoomAreaId(areaId);
                      setShowStudyRoom(true);
                    }}
                    onOpenUserGuide={() => setShowUserGuideModal(true)}
                  />

                  <button
                    type="button"
                    onClick={() => setActiveTab('cohort')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-xs transition-all cursor-pointer"
                    title="Open Cohort Performance: Compare your domain mastery against the Global Harambee Azure Cohort"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-200" />
                    <span>Cohort Performance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('leaderboard')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xs transition-all cursor-pointer"
                    title="Open Global Peer Leaderboard: Top performers from the Global Harambee Azure Cohort"
                  >
                    <Award className="w-3.5 h-3.5 text-slate-950" />
                    <span>Global Peer Leaderboard</span>
                  </button>
                </div>

                {/* Compact Responsive Heading */}
                <div
                  key={`heading-search-${searchQuery.trim() ? 'filtered' : 'all'}`}
                  className="space-y-1 animate-search-fade-in"
                >
                  <h1
                    className={`text-[1.725rem] sm:text-[2.156rem] lg:text-[2.588rem] font-black tracking-tight leading-tight animate-azure-shimmer text-center transition-all duration-300 ${
                      searchQuery.trim() ? 'scale-[1.01]' : 'scale-100'
                    }`}
                  >
                    AZ-900 Azure Fundamentals Practice Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal transition-opacity duration-300">
                    {searchQuery.trim()
                      ? `Showing ${filteredQuestions.length} filtered result${
                          filteredQuestions.length === 1 ? '' : 's'
                        } matching "${searchQuery}" across official Azure Learning Paths.`
                      : 'Explore official Azure Learning Paths, interactive service definitions, and scenario-based exam questions with instant distractor breakdowns.'}
                  </p>
                </div>
              </div>
            )}

            {/* Clean, Uncluttered Practice Control Strip with Tasteful, Partially Animated Kenyan Flag Motifs */}
            {!isFocusMode && (() => {
              const pastSessions = getPastQuizSessions();
              const lastSessionScore = pastSessions[0]?.scorePercent ?? 80;
              const prevSessionScore = pastSessions[1]?.scorePercent ?? 75;
              const currentPerf =
                sessionAttempts.length > 0
                  ? Math.round(
                      (sessionAttempts.filter((a) => a.isCorrect).length /
                        sessionAttempts.length) *
                        100
                    )
                  : stats.totalAnswered > 0
                  ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
                  : lastSessionScore;
              const referenceScore =
                sessionAttempts.length > 0 || stats.totalAnswered > 0
                  ? lastSessionScore
                  : prevSessionScore;
              const trendDelta = currentPerf - referenceScore;
              const isImproved = trendDelta >= 0;

              const isFetchingState =
                isPostgresLoading ||
                isPostgresSyncing ||
                realtimeStatus === 'syncing' ||
                isMotifShimmering;
              const shouldFlipTrendArrow = !isImproved || trendScoreFlipParity;

              const activePathKey = String(selectedPathId);
              const storedPathHigh = pathAllTimeHighs[activePathKey] ?? 80;
              const isAllTimeHighReached =
                (isImproved && currentPerf >= storedPathHigh) || Boolean(allTimeHighToast);

              // Build 5-session score array for D3 sparkline trend chart
              const historicalScores = pastSessions
                .slice(0, 4)
                .map((s) => s.scorePercent)
                .reverse();
              const paddedHistory = [72, 76, 74, 80, ...historicalScores].slice(-4);
              const sparklineSessionScores = [...paddedHistory, currentPerf];

              const sparkW = 64;
              const sparkH = 20;
              const xScale = d3
                .scaleLinear()
                .domain([0, sparklineSessionScores.length - 1])
                .range([3, sparkW - 3]);
              const minScore = Math.max(0, Math.min(...sparklineSessionScores) - 8);
              const maxScore = Math.min(100, Math.max(...sparklineSessionScores) + 6);
              const yScale = d3
                .scaleLinear()
                .domain([minScore, Math.max(minScore + 10, maxScore)])
                .range([sparkH - 3, 3]);

              const lineGen = d3
                .line<number>()
                .x((_, idx) => xScale(idx))
                .y((val) => yScale(val))
                .curve(d3.curveMonotoneX);

              const areaGen = d3
                .area<number>()
                .x((_, idx) => xScale(idx))
                .y0(sparkH - 2)
                .y1((val) => yScale(val))
                .curve(d3.curveMonotoneX);

              const sparklinePathD = lineGen(sparklineSessionScores) || '';
              const sparklineAreaD = areaGen(sparklineSessionScores) || '';

              return (
              <div
                data-fetching={isFetchingState ? 'true' : 'false'}
                className={`KenyanFlagQuickSortMotifs ${
                  isFetchingState ? 'is-fetching' : ''
                } ${
                  isAllTimeHighReached ? 'is-all-time-high' : ''
                } group relative overflow-hidden w-full max-w-full min-w-0 bg-white rounded-xl border border-slate-200/90 hover:border-[#006600]/40 card-elevation transition-all duration-200 ease-out ${
                  isToolbarHidden
                    ? 'py-1 px-2.5 bg-slate-50/90'
                    : isQuickSortCompact
                    ? 'py-1.5 px-2.5 sm:px-3'
                    : 'p-3 sm:px-4'
                }`}
              >
                {/* Random & Partially Animated Kenyan Motifs in Kenyan Flag Colours (Black, Red #BB0000, Green #006600, White) */}
                {!isToolbarHidden && <KenyanFlagQuickSortMotifs isFetching={isFetchingState} />}

                {isToolbarHidden ? (
                  /* =====================================================================
                     NEATLY HIDDEN / COLLAPSED STATE: Ultra-Slim Single-Line Pill Bar
                     ===================================================================== */
                  <div className="relative z-10 flex items-center justify-between gap-2 w-full flex-nowrap overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-0 text-[11px] text-slate-600 whitespace-nowrap">
                      <KenyanFlagMiniEmblem size={12} />
                      <span className="font-extrabold text-slate-700">Toolbar Hidden:</span>
                      <span className="text-slate-500 truncate">
                        Sort ({questionSortOrder === 'default' ? 'Adaptive Default' : questionSortOrder}) • Diff ({selectedDifficultyFilter === 'all' ? 'All Levels' : selectedDifficultyFilter}) • Heatmap • Maps • Study Zone
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPeerChallengeModuleId(selectedModuleId);
                          setShowPeerChallengeModal(true);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006600] border border-emerald-300 text-[10px] font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Launch 5-Question Cohort Peer Challenge"
                      >
                        <Users className="w-3 h-3" />
                        <span>Peer Challenge</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleToolbarHidden}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[10px] font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Show Sort, Diff, Heatmap, Maps & Study Zone controls"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Show Controls</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : isQuickSortCompact ? (
                  /* =====================================================================
                     SINGLE-LINE COMPACT BAR: Sort, Diff, Heatmap, Maps & Study Zone in 1 Line
                     ===================================================================== */
                  <div className="relative z-10 flex items-center justify-between gap-1.5 w-full flex-nowrap overflow-x-auto py-0.5">
                    {/* Mobile Touch-Friendly Overflow Button (< md screens): Bundles Sort, Diff, Heatmap, Maps & Study Zone without line wrapping */}
                    <div className="flex md:hidden items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowMobileControlOverflow(true)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] hover:opacity-95 text-white text-[11px] font-black flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
                        aria-label="Open Practice Controls overflow menu"
                        title="Open touch-friendly menu for Sort, Diff, Heatmap, Maps & Study Zone"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                        <span>Controls</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9.5px] font-bold text-amber-200">
                          {questionSortOrder === 'default' ? 'Adaptive' : questionSortOrder} • {selectedDifficultyFilter === 'all' ? 'All' : selectedDifficultyFilter}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300" />
                      </button>
                    </div>

                    {/* Desktop & Tablet Inline Controls (md+ screens): 1. Sort, 2. Diff, 3. Heatmap, 4. Maps, 5. Study Zone */}
                    <div className="hidden md:flex items-center gap-1.5 flex-nowrap shrink-0">
                      {/* 1. Sort: Adaptive Default */}
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 border border-slate-300 shadow-2xs shrink-0 whitespace-nowrap">
                        <KenyanFlagMiniEmblem size={13} />
                        <ArrowUpDown className="w-3 h-3 text-[#BB0000] shrink-0" />
                        <label
                          htmlFor="compact-quick-sort-selector"
                          className="text-[10px] font-black uppercase tracking-wider text-slate-700"
                        >
                          Sort:
                        </label>
                        <select
                          id="compact-quick-sort-selector"
                          value={questionSortOrder}
                          onChange={(e) => {
                            handleChangeSortOrder(e.target.value as any);
                            triggerMotifShimmer();
                          }}
                          className="text-[11px] font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                          aria-label="Quick-Sort question order"
                        >
                          <option value="default">Adaptive Default</option>
                          <option value="newest-first">Newest First</option>
                          <option value="hardest-first">Hardest First</option>
                          <option value="module-progression">Module Progression</option>
                          <option value="easiest-first">Easiest First</option>
                        </select>
                      </div>

                      {/* 2. Diff: All Levels (Adaptive Auto) */}
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 border border-slate-300 shadow-2xs shrink-0 whitespace-nowrap">
                        <Filter className="w-3 h-3 text-[#0078D4] shrink-0" />
                        <label
                          htmlFor="compact-difficulty-selector"
                          className="text-[10px] font-black uppercase tracking-wider text-slate-700"
                        >
                          Diff:
                        </label>
                        <select
                          id="compact-difficulty-selector"
                          value={selectedDifficultyFilter}
                          onChange={(e) => {
                            const val = e.target.value as
                              | 'all'
                              | 'Fundamental'
                              | 'Intermediate'
                              | 'Advanced';
                            setSelectedDifficultyFilter(val);
                            handleChangeLockedDifficulty(val === 'all' ? null : val);
                            setCurrentQuestionIndex(0);
                          }}
                          className="text-[11px] font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                          aria-label="Filter difficulty"
                        >
                          <option value="all">All Levels (Adaptive Auto)</option>
                          <option value="Fundamental">Fundamental (Override)</option>
                          <option value="Intermediate">Intermediate (Override)</option>
                          <option value="Advanced">Advanced (Override)</option>
                        </select>
                        {selectedDifficultyFilter !== 'all' && (
                          <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 text-[8px] font-black uppercase">
                            Locked
                          </span>
                        )}
                      </div>

                      {/* 2b. Interconnecting Thread Multi-Select Filter */}
                      <ThreadMultiSelectDropdown
                        selectedThreads={selectedThreadFilters}
                        onToggleThread={handleToggleThreadFilter}
                        onClearThreads={handleClearThreadFilters}
                        threadCounts={threadQuestionCounts}
                        variant="compact"
                      />

                      {/* 3. Heatmap */}
                      <button
                        type="button"
                        onClick={() => setShowPracticeHeatmap((prev) => !prev)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          showPracticeHeatmap
                            ? 'bg-[#0078D4] text-white border-[#005A9E] shadow-2xs'
                            : 'bg-white/95 hover:bg-sky-50 text-slate-800 hover:text-[#0078D4] border-slate-300 shadow-2xs'
                        }`}
                        title="Toggle Domain Accuracy Heatmap"
                      >
                        <Target
                          className={`w-3 h-3 ${
                            showPracticeHeatmap ? 'text-amber-300' : 'text-[#0078D4]'
                          }`}
                        />
                        <span>Heatmap</span>
                      </button>

                      {/* 4. Maps */}
                      <button
                        type="button"
                        onClick={() => setShowWorkspacePanels((prev) => !prev)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          showWorkspacePanels
                            ? 'bg-amber-50/95 text-amber-900 border-amber-300 shadow-2xs'
                            : 'bg-white/95 hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                        }`}
                        title="Toggle Maps & Readiness workspace panels"
                      >
                        <Layers className="w-3 h-3 text-[#006600]" />
                        <span>Maps</span>
                      </button>

                      {/* 5. Study Zone */}
                      <button
                        type="button"
                        onClick={() => setExternalStudyZoneOpenTrigger((prev) => prev + 1)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] hover:opacity-95 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Open Centered Study Zone Accordion Menu"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                        <span>Study Zone</span>
                      </button>
                    </div>

                    {/* Right Side Single-Line Actions: Peer Challenge, Export .MD, Trend, Expand & Hide */}
                    <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                      {/* Peer Challenge (5-Question Cohort Speed Race) */}
                      <button
                        type="button"
                        onClick={() => {
                          setPeerChallengeModuleId(selectedModuleId);
                          setShowPeerChallengeModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#006600] to-emerald-700 hover:opacity-95 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Launch Peer Challenge Mode: Invite cohort peers to solve the same 5-question micro-drill and compare completion times"
                      >
                        <Users className="w-3 h-3 text-amber-300" />
                        <span>Peer Challenge</span>
                      </button>

                      {/* Export Saved Notes & Memory Anchors (.MD) */}
                      <button
                        type="button"
                        onClick={() => {
                          const res = downloadNotesAndMemoryAnchorsMarkdown(questions, stats);
                          setAllTimeHighToast(
                            `Exported ${res.notesCount} Notes & ${res.anchorsCount} Memory Anchors to ${res.filename}`
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Export all saved question notes and memory anchors as a formatted Markdown (.md) file for offline study"
                      >
                        <Download className="w-3 h-3 text-amber-700" />
                        <span>Notes .MD</span>
                      </button>

                      {/* Compact Trend Indicator */}
                      <div
                        onClick={() => {
                          setTrendScoreFlipParity((prev) => !prev);
                          const pathLabel =
                            selectedPathId === 'all' ? 'All Paths' : `Path ${selectedPathId}`;
                          const nextHigh = Math.max(currentPerf, storedPathHigh);
                          setAllTimeHighToast(`All-Time High! ${pathLabel}: ${nextHigh}%`);
                        }}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-black hidden xl:flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer select-none ${
                          isImproved
                            ? 'bg-emerald-50/95 text-[#006600] border-emerald-300'
                            : 'bg-red-50/95 text-[#BB0000] border-red-300'
                        }`}
                        title={`Trend: ${isImproved ? `+${trendDelta}%` : `${trendDelta}%`}`}
                      >
                        <TrendingUp
                          className={`w-3 h-3 ${isImproved ? 'text-[#006600]' : 'text-[#BB0000]'}`}
                        />
                        <span>{isImproved ? `+${trendDelta}%` : `${trendDelta}%`}</span>
                      </div>

                      {/* Expand to Full Multi-Button Bar */}
                      <button
                        type="button"
                        onClick={handleToggleQuickSortCompact}
                        className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-300 text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Expand toolbar to view all individual sort buttons"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span className="hidden md:inline">Expand</span>
                      </button>

                      {/* Neatly Hide Controls Bar */}
                      <button
                        type="button"
                        onClick={handleToggleToolbarHidden}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Neatly hide this control bar into a minimal header strip"
                      >
                        <EyeOff className="w-3 h-3 text-slate-600" />
                        <span>Hide</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* =====================================================================
                     EXPANDED SETTING: Full Multi-Button Bar with Single-Line & Hide Toggles
                     ===================================================================== */
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 w-full">
                    {/* Mobile Touch-Friendly Overflow Button (< md screens): Replaces multi-line button wrapping */}
                    <div className="flex md:hidden items-center shrink-0 w-full mb-1">
                      <button
                        type="button"
                        onClick={() => setShowMobileControlOverflow(true)}
                        className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] hover:opacity-95 text-white text-xs font-black flex items-center justify-between shadow-xs cursor-pointer"
                        title="Open touch-friendly menu for Sort, Diff, Heatmap, Maps & Study Zone"
                      >
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                          <span>Practice Controls &amp; Filters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold text-amber-200">
                            {questionSortOrder === 'default' ? 'Adaptive' : questionSortOrder} • {selectedDifficultyFilter === 'all' ? 'All' : selectedDifficultyFilter}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      </button>
                    </div>

                    {/* Desktop & Tablet Inline Controls (md+ screens) */}
                    <div className="hidden md:flex relative z-10 flex-wrap items-center gap-1.5">
                      <span
                        className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mr-1 px-2.5 py-1 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs backdrop-blur-xs"
                        title="Kenyan Heritage Quick-Sort Dashboard (Black • Red • Green • White)"
                      >
                        <KenyanFlagMiniEmblem size={16} />
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#BB0000]" />
                        <span>Quick-Sort:</span>
                      </span>

                      {(
                        [
                          { id: 'newest-first', label: 'Newest First' },
                          { id: 'hardest-first', label: 'Hardest First' },
                          { id: 'module-progression', label: 'Module Progression' },
                          { id: 'easiest-first', label: 'Easiest First' },
                          { id: 'default', label: 'Adaptive Default' },
                        ] as const
                      ).map((sortOpt) => {
                        const isActive = questionSortOrder === sortOpt.id;
                        return (
                          <button
                            key={sortOpt.id}
                            type="button"
                            onClick={() => {
                              handleChangeSortOrder(sortOpt.id);
                              triggerMotifShimmer();
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-xs ${
                              isActive
                                ? 'bg-gradient-to-r from-[#0F172A] via-[#BB0000] to-[#006600] text-white border-white/40 shadow-xs ring-2 ring-[#006600]/25'
                                : 'bg-white/90 hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs'
                            }`}
                          >
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                            <span>{sortOpt.label}</span>
                          </button>
                        );
                      })}

                      {/* Persistent Difficulty Level Dropdown Selector */}
                      <div className="inline-flex items-center gap-1.5 ml-0.5 px-2.5 py-1 rounded-xl bg-white/95 border border-slate-300 shadow-2xs backdrop-blur-xs">
                        <Filter className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                        <label
                          htmlFor="persistent-difficulty-selector"
                          className="text-[11px] font-black uppercase tracking-wider text-slate-700 whitespace-nowrap"
                        >
                          Diff:
                        </label>
                        <select
                          id="persistent-difficulty-selector"
                          aria-label="Persistent difficulty level filter"
                          value={selectedDifficultyFilter}
                          onChange={(e) => {
                            const val = e.target.value as
                              | 'all'
                              | 'Fundamental'
                              | 'Intermediate'
                              | 'Advanced';
                            setSelectedDifficultyFilter(val);
                            handleChangeLockedDifficulty(val === 'all' ? null : val);
                            setCurrentQuestionIndex(0);
                          }}
                          className="text-xs font-extrabold text-slate-900 bg-transparent focus:outline-none cursor-pointer pr-1"
                        >
                          <option value="all">All Levels (Adaptive Auto)</option>
                          <option value="Fundamental">Fundamental (Override)</option>
                          <option value="Intermediate">Intermediate (Override)</option>
                          <option value="Advanced">Advanced (Override)</option>
                        </select>
                      </div>

                      {/* Interconnecting Thread Multi-Select Filter */}
                      <ThreadMultiSelectDropdown
                        selectedThreads={selectedThreadFilters}
                        onToggleThread={handleToggleThreadFilter}
                        onClearThreads={handleClearThreadFilters}
                        threadCounts={threadQuestionCounts}
                        variant="expanded"
                      />
                    </div>

                    {/* Right: Actions, Single-Line Collapse & Hide Toggles */}
                    <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPeerChallengeModuleId(selectedModuleId);
                          setShowPeerChallengeModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#006600] to-emerald-700 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-300" />
                        <span>Peer Challenge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const res = downloadNotesAndMemoryAnchorsMarkdown(questions, stats);
                          setAllTimeHighToast(
                            `Exported ${res.notesCount} Notes & ${res.anchorsCount} Memory Anchors to ${res.filename}`
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-700" />
                        <span>Export Notes (.MD)</span>
                      </button>

                      {/* Domain Accuracy Heatmap Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPracticeHeatmap((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs ${
                          showPracticeHeatmap
                            ? 'bg-[#0078D4] text-white border-[#005A9E] shadow-2xs'
                            : 'bg-white/95 hover:bg-sky-50 text-slate-800 hover:text-[#0078D4] border-slate-300 shadow-2xs'
                        }`}
                      >
                        <Target className={`w-3.5 h-3.5 ${showPracticeHeatmap ? 'text-amber-300' : 'text-[#0078D4]'}`} />
                        <span>Heatmap</span>
                      </button>

                      {/* Maps & Readiness Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowWorkspacePanels((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs ${
                          showWorkspacePanels
                            ? 'bg-amber-50/95 text-amber-900 border-amber-300 shadow-2xs'
                            : 'bg-white/90 hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-[#006600]" />
                        <span>Maps</span>
                      </button>

                      {/* Study Zone Menu Button */}
                      <button
                        type="button"
                        onClick={() => setExternalStudyZoneOpenTrigger((prev) => prev + 1)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                        <span>Study Zone</span>
                      </button>

                      {/* Collapse to Single Line Button */}
                      <button
                        type="button"
                        onClick={handleToggleQuickSortCompact}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title="Collapse controls into a single compact line"
                      >
                        <Minimize2 className="w-3.5 h-3.5 text-[#0078D4]" />
                        <span>Single Line</span>
                      </button>

                      {/* Hide Controls Button */}
                      <button
                        type="button"
                        onClick={handleToggleToolbarHidden}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title="Neatly hide this control bar"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        <span>Hide</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {/* Interactive D3.js Domain Accuracy Heatmap (Toggled directly in Practice Workspace or inside Workspace Panels) */}
            {!isFocusMode && (showPracticeHeatmap || showWorkspacePanels) && (
              <div className="animate-quiz-card-fade-in-up">
                <DomainAccuracyHeatmapD3
                  stats={stats}
                  onSelectModule={(modId, pathId) => {
                    if (pathId !== undefined) setSelectedPathId(pathId);
                    setSelectedModuleId(modId);
                    setCurrentQuestionIndex(0);
                    setShowPostSessionReview(false);
                  }}
                  onLaunchMicroDrill={(modId) => {
                    setMicroDrillTargetModuleId(modId);
                    setShowMicroDrill(modId);
                  }}
                  onDrillWeakAreas={handleDrillWeakAreas}
                />
              </div>
            )}

            {/* Collapsible Practice Workspace Panels (Grouped to keep Practice view clean and uncluttered) */}
            {!isFocusMode && showWorkspacePanels && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Functional, Compact & CSS-Responsive Azure Cloud Explorer Menus Window */}
                <AzureCloudExplorer
                  selectedPathId={selectedPathId}
                  selectedModuleId={selectedModuleId}
                  onSelectPath={(pathId) => {
                    setSelectedPathId(pathId);
                    setSelectedModuleId('all');
                    setCurrentQuestionIndex(0);
                    setShowPostSessionReview(false);
                  }}
                  onSelectModule={(modId, pathId) => {
                    if (pathId !== undefined) setSelectedPathId(pathId);
                    setSelectedModuleId(modId);
                    setCurrentQuestionIndex(0);
                    setShowPostSessionReview(false);
                  }}
                  stats={stats}
                  questionCountByModule={questionCountByModule}
                  searchQuery={searchQuery}
                  onSearchQueryChange={(q) => {
                    setSearchQuery(q);
                    setCurrentQuestionIndex(0);
                  }}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onToggleModuleComplete={handleToggleModuleComplete}
                  onOpenPersonalizedReview={() => setShowReviewSession(true)}
                  onOpenWeakAreasReview={() => setShowPostSessionReview(true)}
                  onOpenStudyRoom={() => setShowStudyRoom(true)}
                  onOpenMockExam={() => setShowMockExam(true)}
                  unresolvedMistakesCount={unresolvedMistakesCount}
                  isSidebarHidden={isMenuHidden}
                  onToggleSidebar={() => setIsMenuHidden((prev) => !prev)}
                />

                {/* Interactive Learning Path Navigation System & Prominent Active Path Display */}
                <LearningPathOverview
                  selectedPathId={selectedPathId}
                  selectedModuleId={selectedModuleId}
                  onSelectPath={(pathId) => {
                    setSelectedPathId(pathId);
                    setSelectedModuleId('all');
                    setCurrentQuestionIndex(0);
                    setShowPostSessionReview(false);
                  }}
                  onSelectModule={(modId, pathId) => {
                    if (pathId !== undefined) setSelectedPathId(pathId);
                    setSelectedModuleId(modId);
                    setCurrentQuestionIndex(0);
                    setShowPostSessionReview(false);
                  }}
                  stats={stats}
                  sessionAttempts={sessionAttempts}
                  onFinishSessionAndReviewWeakAreas={() => setShowPostSessionReview(true)}
                  onStartPersonalizedReview={() => setShowReviewSession(true)}
                  onToggleModuleComplete={handleToggleModuleComplete}
                  filteredQuestionsCount={filteredQuestions.length}
                  currentQuestionIndex={currentQuestionIndex}
                />

                {/* Step-by-Step Visual Learning Path Progress Map */}
                <LearningPathProgressMap
                  stats={stats}
                  selectedPathId={selectedPathId}
                  selectedModuleId={selectedModuleId}
                  onSelectModule={(modId, pathId) => {
                    setSelectedPathId(pathId);
                    setSelectedModuleId(modId);
                    if (typeof modId === 'number' && isModuleLockedForCurrentUser(modId)) {
                      setTierSelectionLockedModuleId(modId);
                    }
                    setCurrentQuestionIndex(0);
                    setShowPostSessionReview(false);
                  }}
                  onToggleModuleComplete={handleToggleModuleComplete}
                  questionCountByModule={questionCountByModule}
                  defaultExpanded={false}
                />

                {/* Weekly Exam Readiness & Daily 'Azure Fact of the Day' Notification Component */}
                <WeeklyExamReadiness
                  stats={stats}
                  onSelectModule={handleSelectModuleFromTracker}
                  onLaunchMicroDrill={(moduleId) => {
                    setMicroDrillTargetModuleId(moduleId);
                    setShowMicroDrill(moduleId);
                  }}
                />
              </div>
            )}

            {/* Separate Post-Session Weak-Area Review & Practice Question Generator */}
            {showPostSessionReview ? (
              <PostSessionWeakAreaReview
                stats={stats}
                sessionAttempts={sessionAttempts}
                allQuestions={questions}
                selectedPathId={selectedPathId}
                onAnswerReviewQuestion={handleAnswerQuestion}
                onAddGeneratedQuestionsToBank={(newQs) => {
                  setQuestions((prev) => {
                    const existingIds = new Set(prev.map((q) => q.id));
                    const uniqueNew = newQs.filter((q) => !existingIds.has(q.id));
                    const updated = [...uniqueNew, ...prev];
                    try {
                      const customOnly = updated.filter((q) => q.isAiGenerated);
                      localStorage.setItem('az900_custom_questions_v1', JSON.stringify(customOnly));
                    } catch (e) {
                      console.error(e);
                    }
                    return updated;
                  });
                }}
                onSelectPathForPractice={(pId, mId = 'all') => {
                  setSelectedPathId(pId);
                  setSelectedModuleId(mId);
                  setCurrentQuestionIndex(0);
                  setShowPostSessionReview(false);
                }}
                onStartPersonalizedReview={() => setShowReviewSession(true)}
                onQuickRetrySessionQuestions={handleQuickRetrySessionQuestions}
                unresolvedMistakesCount={unresolvedMistakesCount}
                onClose={() => setShowPostSessionReview(false)}
              />
            ) : (
            /* Main Studio Layout: Permanently Slim Desktop Navigation Sidebar + Quiz Card (Left sidebar hidden in Focus Mode or when collapsed) */
            <div
              className={
                isFocusMode
                  ? 'max-w-4xl mx-auto w-full min-w-0'
                  : 'flex flex-col lg:flex-row gap-4 items-start lg:items-stretch w-full min-w-0'
              }
            >
              {/* Left Column: Expandable Harambee Companion + Permanently Slim Desktop Navigator & Filters */}
              {!isFocusMode && !isMenuHidden && (
                <div
                  className={`w-full min-w-0 shrink-0 flex flex-col gap-3 lg:self-stretch transition-all duration-300 ${
                    isHarambeeExpanded
                      ? 'lg:w-[350px] xl:w-[380px]'
                      : 'lg:w-[252px] xl:w-[268px]'
                  }`}
                >
                  {/* Expandable & Retractable Harambee • Consistent Reading & Exam Success Box (Positioned directly on the left of Session Learning Path Focus & Quick Switcher on laptop/desktop screens) */}
                  <HarambeeSuccessCompanion
                    selectedPathId={selectedPathId}
                    isExpanded={isHarambeeExpanded}
                    onToggleExpand={handleToggleHarambeeExpanded}
                    autoRetractTrigger={currentQuestionIndex + sessionAnswerCount}
                    isModuleBrowserCollapsed={isDesktopModuleListCollapsed}
                    onToggleModuleBrowserCollapse={() =>
                      setIsDesktopModuleListCollapsed((prev) => !prev)
                    }
                    onNavigateTab={setActiveTab}
                    completedModulesCount={(stats.completedModules || []).length}
                    totalAnswered={stats.totalAnswered || 0}
                  />

                  {/* Quick Filters with Adaptive Saved Notes Bookmark & Hover State Information Feedback */}
                  <div className="bg-white rounded-xl border border-slate-200 p-2 card-elevation flex items-center justify-between gap-1.5">
                    <HoverInfoFeedback
                      title="Revision Bookmarks"
                      badge={`${stats.bookmarks.length} Saved`}
                      badgeColor="amber"
                      description="Filters question bank to your bookmarked questions for targeted review and consolidation."
                      tip="Click to isolate bookmarked questions"
                      className="flex-1 min-w-0"
                    >
                      <button
                        onClick={() => {
                          setOnlyBookmarks(!onlyBookmarks);
                          setOnlySavedNotes(false);
                          setOnlyAiGenerated(false);
                          setCurrentQuestionIndex(0);
                        }}
                        className={`w-full py-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          onlyBookmarks
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Bookmark className="w-3 h-3 fill-current shrink-0" />
                        <span className="truncate">Bookmarked ({stats.bookmarks.length})</span>
                      </button>
                    </HoverInfoFeedback>

                    <HoverInfoFeedback
                      title="Adaptive Notes Bookmark"
                      badge={`${savedNotesCount} Notes`}
                      badgeColor="blue"
                      description="Adaptive filter dynamically showing only questions where you have saved personal study notes, reminders, or memory cues."
                      tip="Click to isolate questions with personal study notes"
                      className="flex-1 min-w-0"
                    >
                      <button
                        onClick={() => {
                          setOnlySavedNotes(!onlySavedNotes);
                          setOnlyBookmarks(false);
                          setOnlyAiGenerated(false);
                          setCurrentQuestionIndex(0);
                        }}
                        className={`w-full py-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          onlySavedNotes
                            ? 'bg-[#0078D4] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <StickyNote className="w-3 h-3 shrink-0 text-amber-500 fill-amber-500/20" />
                        <span className="truncate">Notes ({savedNotesCount})</span>
                      </button>
                    </HoverInfoFeedback>

                    <HoverInfoFeedback
                      title="AI-Synthesized Scenarios"
                      badge={`${questions.filter((q) => q.isAiGenerated).length} Scenarios`}
                      badgeColor="purple"
                      description="Filters to custom scenario-based questions generated dynamically using Google GenAI."
                      tip="Generate new scenarios in the AI Builder tab"
                      className="flex-1 min-w-0"
                    >
                      <button
                        onClick={() => {
                          setOnlyAiGenerated(!onlyAiGenerated);
                          setOnlyBookmarks(false);
                          setOnlySavedNotes(false);
                          setCurrentQuestionIndex(0);
                        }}
                        className={`w-full py-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          onlyAiGenerated
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="truncate">AI ({questions.filter((q) => q.isAiGenerated).length})</span>
                      </button>
                    </HoverInfoFeedback>
                  </div>

                  {/* Module Browser (Can be collapsed on laptop/desktop so Harambee Success Companion fills 100% of left space) */}
                  {!isDesktopModuleListCollapsed && (
                    <ModuleBrowser
                      selectedPathId={selectedPathId}
                      selectedModuleId={selectedModuleId}
                      onSelectPath={(pathId) => {
                        setSelectedPathId(pathId);
                        setCurrentQuestionIndex(0);
                        triggerMotifShimmer();
                      }}
                      onSelectModule={(modId) => {
                        setSelectedModuleId(modId);
                        if (typeof modId === 'number' && isModuleLockedForCurrentUser(modId)) {
                          setTierSelectionLockedModuleId(modId);
                        }
                        setCurrentQuestionIndex(0);
                        triggerMotifShimmer();
                      }}
                      stats={stats}
                      questionCountByModule={questionCountByModule}
                      onToggleModuleComplete={handleToggleModuleComplete}
                      onHideSidebar={() => setIsMenuHidden(true)}
                      onOpenAzureTheme={handleOpenAzureTheme}
                    />
                  )}
                </div>
              )}

              {/* Right Column: Active Scenario Question Card (Takes full remaining width seamlessly) */}
              <div className="flex-1 min-w-0 w-full max-w-full">
                {/* Learning Path Focus Selector & Confirmation + Rolling-Average Adaptive Difficulty Bar */}
                {!isFocusMode && (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-white card-elevation overflow-hidden w-full min-w-0">
                    {/* Top Summary Bar: Active Path Focus + Rolling-Average Adaptive Difficulty Status */}
                    <div className="p-3.5 sm:px-4 bg-gradient-to-r from-slate-900 via-[#0078D4] to-sky-700 text-white flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white/15 text-amber-300 shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                              Session Learning Path Focus
                            </span>
                            {confirmedFocusPathId !== null && selectedPathId === confirmedFocusPathId ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950">
                                <CheckCircle2 className="w-3 h-3" />
                                Confirmed: Path {confirmedFocusPathId}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-300 text-slate-950">
                                {selectedPathId === 'all'
                                  ? 'All 3 AZ-900 Paths'
                                  : `Path ${selectedPathId} Selected`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-extrabold text-white mt-0.5">
                            {selectedPathId === 'all'
                              ? 'Select one of the 3 AZ-900 Learning Paths below to focus your quiz session'
                              : LEARNING_PATHS.find((p) => p.id === selectedPathId)?.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Rolling-Average Adaptive Difficulty Pill + Last 5 Questions '+/-' Trend Percentage Indicator */}
                        <div
                          className="px-2.5 py-1 rounded-lg bg-black/25 border border-white/15 text-[11px] flex flex-wrap items-center gap-1.5"
                          title="Adaptive difficulty starts at Medium (Intermediate) and dynamically increases or decreases based on your rolling average of recent answers in this session."
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span className="text-sky-100 font-semibold">Adaptive Difficulty:</span>
                          <span className="font-black text-white">
                            {effectiveDynamicDifficulty === 'Fundamental'
                              ? 'Easy (Fundamental)'
                              : effectiveDynamicDifficulty === 'Intermediate'
                              ? 'Medium (Intermediate)'
                              : 'Hard (Advanced)'}
                          </span>
                          {/* Small '+/-' Trend Percentage Indicator for Last 5 Questions Impact */}
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums border ${
                              last5QuestionsImpact.direction === 'up'
                                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                                : last5QuestionsImpact.direction === 'down'
                                ? 'bg-rose-500/25 text-rose-200 border-rose-400/40'
                                : 'bg-white/15 text-sky-100 border-white/20'
                            }`}
                            title={`Last 5 Questions Impact on Dynamic Difficulty: ${last5QuestionsImpact.formattedDelta} (${last5QuestionsImpact.impactSummary})`}
                          >
                            {last5QuestionsImpact.direction === 'up' ? (
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-300 shrink-0" />
                            ) : last5QuestionsImpact.direction === 'down' ? (
                              <TrendingDown className="w-2.5 h-2.5 text-rose-300 shrink-0" />
                            ) : null}
                            <span>{last5QuestionsImpact.formattedDelta} (5Q)</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-white/15 text-[10px] font-black text-amber-200">
                            {rollingAverageAccuracy !== null
                              ? `Rolling Avg: ${rollingAverageAccuracy}% (${sessionRollingOutcomes.length}/${ROLLING_WINDOW_SIZE})`
                              : 'Starts at Medium'}
                          </span>
                        </div>

                        {/* Focus Mode Indicator in Quiz Session Header with Dynamic Platform-Aware Hover Guide */}
                        <div className="relative group/focusguide">
                          <button
                            type="button"
                            onClick={() => toggleFocusMode('button')}
                            className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 border border-white/20 text-[10.5px] font-black text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                            aria-label="Focus Mode indicator — hover to view keyboard shortcuts"
                          >
                            <Maximize2 className="w-3 h-3 text-amber-300 shrink-0" />
                            <span>Focus Mode</span>
                            <kbd className="px-1 py-0.2 rounded bg-white/15 font-mono text-[9.5px] text-sky-200">
                              {formatShortcutCombo(activeShortcuts.focusMode, detectedPlatform)}
                            </kbd>
                          </button>

                          <KeyboardShortcutGuidePopover
                            isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
                            effectiveDynamicDifficulty={effectiveDynamicDifficulty}
                            onToggleDynamicDifficulty={() =>
                              setIsDynamicDifficultyEnabled((prev) => !prev)
                            }
                            onOpenAccessibilitySettings={() => setShowAccessibilityModal(true)}
                            align="right"
                          />
                        </div>

                        {/* Quiz Session Pomodoro Focus Timer (25m block -> 5m break & Azure trivia) */}
                        <QuizFocusTimerPill timer={quizFocusTimer} />

                        {/* 20-Question Rolling Average Accuracy Mini Line Chart & Trend Indicator */}
                        <div
                          className="px-2.5 py-1 rounded-lg bg-slate-950/45 border border-sky-300/30 text-[11px] flex items-center gap-2 shadow-2xs"
                          title={`Rolling Average Accuracy Trend over the last ${sessionRollingOutcomes.length}/${ROLLING_WINDOW_SIZE} questions • Current: ${
                            rollingAverageAccuracy ?? 50
                          }% (${rolling20Trend.label}). Dashed line marks the 70% AZ-900 pass target.`}
                        >
                          {/* Mini SVG Sparkline Chart */}
                          <div className="relative flex items-center shrink-0">
                            {(() => {
                              const chartW = 68;
                              const chartH = 22;
                              const padX = 3;
                              const padY = 3;
                              const innerW = chartW - padX * 2;
                              const innerH = chartH - padY * 2;
                              const pts =
                                rolling20AccuracySeries.length > 0
                                  ? rolling20AccuracySeries
                                  : [50];
                              const coords = pts.map((val, i) => {
                                const x =
                                  pts.length === 1
                                    ? chartW / 2
                                    : padX + (i / (pts.length - 1)) * innerW;
                                const y =
                                  padY + innerH - (Math.max(0, Math.min(100, val)) / 100) * innerH;
                                return { x, y, val };
                              });
                              const polylinePoints = coords
                                .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
                                .join(' ');
                              const areaPath =
                                coords.length > 1
                                  ? `M ${coords[0].x.toFixed(1)},${(padY + innerH).toFixed(1)} L ` +
                                    coords
                                      .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
                                      .join(' L ') +
                                    ` L ${coords[coords.length - 1].x.toFixed(1)},${(
                                      padY + innerH
                                    ).toFixed(1)} Z`
                                  : '';
                              const passLineY = padY + innerH - 0.7 * innerH;
                              const lastCoord = coords[coords.length - 1];
                              const strokeColor =
                                rolling20Trend.direction === 'up'
                                  ? '#34d399'
                                  : rolling20Trend.direction === 'down'
                                  ? '#fbbf24'
                                  : '#38bdf8';

                              return (
                                <svg
                                  width={chartW}
                                  height={chartH}
                                  viewBox={`0 0 ${chartW} ${chartH}`}
                                  className="overflow-visible rounded bg-slate-900/70 border border-white/10"
                                  aria-label="Rolling average accuracy line chart over the last 20 questions"
                                >
                                  <defs>
                                    <linearGradient
                                      id="rolling20Grad"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
                                      <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
                                    </linearGradient>
                                  </defs>
                                  {/* 70% AZ-900 Passing Benchmark Dashed Line */}
                                  <line
                                    x1={padX}
                                    y1={passLineY}
                                    x2={chartW - padX}
                                    y2={passLineY}
                                    stroke="rgba(255,255,255,0.28)"
                                    strokeWidth="0.8"
                                    strokeDasharray="2,2"
                                  />
                                  {/* Area under rolling accuracy curve */}
                                  {areaPath && <path d={areaPath} fill="url(#rolling20Grad)" />}
                                  {/* Rolling accuracy polyline */}
                                  {coords.length > 1 && (
                                    <polyline
                                      fill="none"
                                      stroke={strokeColor}
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      points={polylinePoints}
                                    />
                                  )}
                                  {/* Latest accuracy endpoint dot */}
                                  {lastCoord && (
                                    <circle
                                      cx={lastCoord.x}
                                      cy={lastCoord.y}
                                      r="2.3"
                                      fill={strokeColor}
                                      stroke="#0f172a"
                                      strokeWidth="0.8"
                                    />
                                  )}
                                </svg>
                              );
                            })()}
                          </div>

                          {/* Trend Direction & Delta Badge */}
                          <div className="flex items-center gap-1">
                            {rolling20Trend.direction === 'up' ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                            ) : rolling20Trend.direction === 'down' ? (
                              <TrendingDown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            ) : (
                              <ArrowRight className="w-3 h-3 text-sky-300 shrink-0" />
                            )}
                            <span
                              className={`text-[10px] font-black whitespace-nowrap ${
                                rolling20Trend.direction === 'up'
                                  ? 'text-emerald-300'
                                  : rolling20Trend.direction === 'down'
                                  ? 'text-amber-300'
                                  : 'text-sky-200'
                              }`}
                            >
                              {rolling20Trend.label}
                            </span>
                            <span className="text-[9.5px] text-sky-200/80 font-semibold hidden sm:inline">
                              (20-Q)
                            </span>
                          </div>
                        </div>

                        {/* 30-Second Session Auto-Save Status Indicator */}
                        <button
                          type="button"
                          onClick={persistQuizSessionStateNow}
                          className="px-2 py-1 rounded-lg bg-black/20 hover:bg-black/35 border border-white/15 text-[10px] font-bold text-sky-100 flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Quiz session state (Question #${currentQuestionIndex + 1} ${
                            currentQ?.id || ''
                          } & Streak: ${consecutiveCorrect}) auto-saves to localStorage every 30 seconds${
                            lastAutoSavedAt
                              ? ` • Last saved at ${new Date(lastAutoSavedAt).toLocaleTimeString()}`
                              : ''
                          }. Click to save immediately.`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span>
                            Auto-Save (30s) • Streak: {consecutiveCorrect}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsPathSelectorExpanded((prev) => !prev)}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          {isPathSelectorExpanded ? 'Hide Path Selector' : 'Select Focus Path'}
                        </button>
                      </div>
                    </div>

                    {/* Interactive 3-Learning-Path Selection & Explicit Confirmation Step */}
                    {(isPathSelectorExpanded || confirmedFocusPathId === null) && (
                      <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                              1. Choose Your AZ-900 Learning Path Focus
                            </h4>
                            <p className="text-[11px] text-slate-600">
                              Select one of the three official AZ-900 Learning Paths and confirm below to generate your focused quiz session.
                            </p>
                          </div>
                          {selectedPathId !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmedFocusPathId(null);
                                setSelectedPathId('all');
                                setCurrentQuestionIndex(0);
                              }}
                              className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              Reset to All 3 Paths
                            </button>
                          )}
                        </div>

                        {/* 3 Learning Path Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {LEARNING_PATHS.map((path) => {
                            const isCandidate = pendingFocusPathId === path.id;
                            const isConfirmed =
                              confirmedFocusPathId === path.id && selectedPathId === path.id;
                            const pathQCount = questions.filter(
                              (q) => q.learningPathId === path.id
                            ).length;
                            const shortName =
                              path.id === 1
                                ? 'Cloud Concepts'
                                : path.id === 2
                                ? 'Azure Architecture & Services'
                                : 'Management & Governance';

                            return (
                              <button
                                key={path.id}
                                type="button"
                                onClick={() => setPendingFocusPathId(path.id)}
                                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                  isCandidate
                                    ? 'bg-blue-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/20 shadow-2xs'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#0078D4]/10 text-[#0078D4]">
                                      Learning Path {path.id}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {path.examWeight}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-extrabold text-slate-900 mt-1.5">
                                    {shortName}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                    {path.modules.length} Modules • {pathQCount} Questions
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[10px] font-bold">
                                  {isConfirmed ? (
                                    <span className="text-emerald-700 flex items-center gap-1 font-extrabold">
                                      <CheckCircle2 className="w-3 h-3" /> Active Session Focus
                                    </span>
                                  ) : isCandidate ? (
                                    <span className="text-[#0078D4] font-extrabold">
                                      Selected — Ready to Confirm
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Click to select</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Step 2: Explicit Confirmation Bar before generating session questions */}
                        {(() => {
                          const candidatePath = LEARNING_PATHS.find(
                            (p) => p.id === pendingFocusPathId
                          );
                          const candidateQCount = questions.filter(
                            (q) => q.learningPathId === pendingFocusPathId
                          ).length;
                          const isAlreadyConfirmed =
                            confirmedFocusPathId === pendingFocusPathId &&
                            selectedPathId === pendingFocusPathId;

                          return (
                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 via-sky-50 to-emerald-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4]">
                                    2. Confirm Learning Path Focus
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white border border-blue-200 text-slate-700">
                                    Starts at Medium Difficulty
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900">
                                  {candidatePath?.title} ({candidateQCount} questions across{' '}
                                  {candidatePath?.modules.length} modules • Weight:{' '}
                                  {candidatePath?.examWeight})
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleConfirmLearningPathFocus(pendingFocusPathId)}
                                className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                              >
                                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                                <span>
                                  {isAlreadyConfirmed
                                    ? `Restart Path ${pendingFocusPathId} Session`
                                    : `Confirm Path ${pendingFocusPathId} & Generate Questions`}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Active Global Search Filter Indicator */}
                {searchQuery.trim() && (
                  <div
                    key={`search-banner-${searchQuery}`}
                    className="mb-4 p-3.5 rounded-xl border bg-blue-50/80 border-blue-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 animate-search-fade-in"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Search className="w-4 h-4 text-[#0078D4]" />
                      <span>
                        Filtering Question Bank for Azure Service / Term:{' '}
                        <span className="text-[#0078D4] font-black">"{searchQuery}"</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0078D4] text-white">
                        {filteredQuestions.length} match{filteredQuestions.length === 1 ? '' : 'es'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentQuestionIndex(0);
                      }}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  </div>
                )}

                {/* Temporary 5-Minute 'Retry Queue' Filter Banner (From Post-Session Weak-Area Quick-Retry) */}
                {retryQueueSecondsLeft > 0 && retryQueueQuestionIds.length > 0 && (
                  <div className="mb-4 p-3.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
                      <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950">
                        <Clock className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-amber-950 uppercase tracking-wider">
                            Temporary Quick-Retry Queue
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-amber-300 font-mono">
                            Expires in {Math.floor(retryQueueSecondsLeft / 60)}:
                            {retryQueueSecondsLeft % 60 < 10 ? '0' : ''}
                            {retryQueueSecondsLeft % 60}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950">
                            {retryQueueQuestionIds.length} Review Questions
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {onlyRetryQueue
                            ? 'Drilling strictly on your Post-Session Weak-Area Review queue.'
                            : 'Your 5-minute Retry Queue is available—click below to filter to it.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOnlyRetryQueue((prev) => !prev);
                          setCurrentQuestionIndex(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          onlyRetryQueue
                            ? 'bg-slate-900 text-amber-300'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        }`}
                      >
                        {onlyRetryQueue ? 'Show All Questions' : 'Activate Retry Queue Filter'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRetryQueueExpiresAt(null);
                          setRetryQueueQuestionIds([]);
                          setOnlyRetryQueue(false);
                          setCurrentQuestionIndex(0);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-bold cursor-pointer"
                      >
                        Clear Queue
                      </button>
                    </div>
                  </div>
                )}

                {/* Adaptive Module Learning Path Engine Banner (Remediation for Struggling Modules & Scenario Escalation for Excelling Modules) */}
                {currentQ && (() => {
                  const activeModId = currentQ.moduleId;
                  const modQuestions = questions.filter((q) => q.moduleId === activeModId);
                  const modAttempts = modQuestions
                    .flatMap((q) => stats.attempts?.[q.id] || [])
                    .sort((a, b) => a.timestamp - b.timestamp);
                  const recentModAttempts = modAttempts.slice(-4);
                  const recentWrongCount = recentModAttempts.filter((a) => !a.isCorrect).length;
                  const recentCorrectCount = recentModAttempts.filter((a) => a.isCorrect).length;

                  const isStrugglingInModule =
                    recentModAttempts.length >= 2 && recentWrongCount >= 2;
                  const isExcellingInModule =
                    !isStrugglingInModule &&
                    recentModAttempts.length >= 2 &&
                    recentCorrectCount >= 2 &&
                    recentModAttempts[recentModAttempts.length - 1]?.isCorrect &&
                    recentModAttempts[recentModAttempts.length - 2]?.isCorrect;

                  if (!isStrugglingInModule && !isExcellingInModule) return null;

                  const studyMod = CURRICULUM_STUDY_MODULES.find(
                    (m) => m.moduleId === activeModId
                  );

                  if (isStrugglingInModule) {
                    return (
                      <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50/70 p-4 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 mt-0.5">
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                                  Adaptive Path Remediation • Module {activeModId}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">
                                  {currentQ.moduleTitle}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                You missed {recentWrongCount} of your last {recentModAttempts.length} questions in Module {activeModId}. Review the foundational explanation below and lock onto targeted Fundamental questions for this module before moving on.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setShowFoundationalPrimerInPractice((prev) => !prev)
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              {showFoundationalPrimerInPractice
                                ? 'Hide Foundational Primer'
                                : 'Show Foundational Primer'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPathId(currentQ.learningPathId);
                                setSelectedModuleId(activeModId);
                                setSelectedDifficultyFilter('Fundamental');
                                setCurrentQuestionIndex(0);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
                            >
                              Target Module {activeModId} Fundamentals
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdaptiveFocusPathId(currentQ.learningPathId);
                                setAdaptiveFocusModuleId(activeModId);
                                setActiveTab('adaptive');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-extrabold transition-colors cursor-pointer"
                            >
                              Open Adaptive Remediation Engine
                            </button>
                          </div>
                        </div>

                        {showFoundationalPrimerInPractice && studyMod && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/80">
                            {studyMod.units.slice(0, 2).map((unit) => (
                              <div
                                key={unit.id}
                                className="p-3 rounded-xl bg-white border border-amber-200/90 space-y-1"
                              >
                                <div className="text-xs font-extrabold text-slate-900">
                                  {unit.unitTitle}
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  {unit.conceptExplanation}
                                </p>
                                <div className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200/60">
                                  Exam Takeaway: {unit.examTakeaway}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="mb-4 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-sky-50 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                          <Zap className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-950">
                              Adaptive Mastery Escalation • Module {activeModId}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              Excelling in {currentQ.moduleTitle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Strong accuracy streak detected in Module {activeModId}! Ready to step up to complex, multi-service Advanced architecture scenarios?
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPathId(currentQ.learningPathId);
                            setSelectedModuleId(activeModId);
                            setSelectedDifficultyFilter('Advanced');
                            setCurrentQuestionIndex(0);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
                        >
                          Challenge Advanced Scenarios (Mod {activeModId})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdaptiveFocusPathId(currentQ.learningPathId);
                            setAdaptiveFocusModuleId(activeModId);
                            setActiveTab('adaptive');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-extrabold transition-colors cursor-pointer"
                        >
                          Adaptive Escalation Mode
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Equal-Intensity Balanced Path Coach & Target Grade Tracker */}
                {!isFocusMode && (
                  <div className="mb-4">
                    <BalancedPathIntensityCoach
                      stats={stats}
                      questions={questions}
                      pathStudySeconds={pathStudySeconds}
                      selectedPathId={selectedPathId}
                      defaultExpanded={false}
                      onFocusPath={(pId, modId) => {
                        setRetryIncorrectPathId(null);
                        setRetryIncorrectSnapshotIds([]);
                        setSelectedPathId(pId);
                        setSelectedModuleId(modId ?? 'all');
                        setCurrentQuestionIndex(0);
                        setShowPostSessionReview(false);
                        setActiveTab('quiz');
                      }}
                    />
                  </div>
                )}

                <div
                  key={`filtered-results-${searchQuery}-${currentQ?.id || currentQuestionIndex}`}
                  className="animate-quiz-card-fade-in-up"
                >
                <PaymentGatekeeper
                  moduleId={
                    selectedModuleId !== 'all'
                      ? selectedModuleId
                      : currentQ?.moduleId ?? 'all'
                  }
                  user={authenticatedUser}
                  onRedirectToPaymentPage={() => {
                    setActiveTab('profile');
                    setTimeout(() => {
                      document
                        .getElementById('profile-subscription-panel')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 120);
                  }}
                  onOpenTierSelectionModal={(lockedModId) =>
                    setTierSelectionLockedModuleId(lockedModId)
                  }
                  onSelectFreeModule={(freeModId) => {
                    setSelectedPathId(1);
                    setSelectedModuleId(freeModId);
                    setCurrentQuestionIndex(0);
                  }}
                >
                {filteredQuestions.length > 0 && currentQ ? (
                  <div className="flex flex-col xl:flex-row gap-4 items-start w-full min-w-0">
                    <div className="flex-1 min-w-0 w-full">
                      <QuizCard
                        key={currentQ.id}
                        question={currentQ}
                        questionIndex={currentQuestionIndex}
                        totalQuestions={filteredQuestions.length}
                        onAnswer={handleAnswerQuestion}
                        onNext={() =>
                          setCurrentQuestionIndex((prev) =>
                            prev + 1 < filteredQuestions.length ? prev + 1 : 0
                          )
                        }
                        onPrev={() =>
                          setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                        }
                        onSkipQuestion={handleSkipQuestion}
                        onBookmark={handleToggleBookmark}
                        isBookmarked={stats.bookmarks.includes(currentQ.id)}
                        onAskTutorAboutQuestion={handleAskTutorAboutQuestion}
                        stats={stats}
                        isFocusMode={isFocusMode}
                        onToggleFocusMode={() => toggleFocusMode('button')}
                        dynamicDifficulty={effectiveDynamicDifficulty}
                        consecutiveStreak={consecutiveCorrect}
                        isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
                        onToggleDynamicDifficulty={() =>
                          setIsDynamicDifficultyEnabled(!isDynamicDifficultyEnabled)
                        }
                        lockedDifficulty={lockedDifficulty}
                        onChangeLockedDifficulty={handleChangeLockedDifficulty}
                        selectedDifficultyFilter={selectedDifficultyFilter}
                        onSelectDifficultyFilter={(nextFilter) => {
                          setSelectedDifficultyFilter(nextFilter);
                          setCurrentQuestionIndex(0);
                        }}
                        onOpenStudyRoom={() => setShowStudyRoom(true)}
                        onFinishSession={() => {
                          if (sessionAttempts.length > 0) {
                            const correctCount = sessionAttempts.filter((a) => a.isCorrect).length;
                            const totalCount = sessionAttempts.length;
                            const scorePercent = Math.round((correctCount / totalCount) * 100);
                            saveQuizSession({
                              id: `session-practice-${Date.now()}`,
                              timestamp: Date.now(),
                              dateStr: new Date().toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                              title: `Practice Quiz Session (${totalCount} Questions)`,
                              mode: 'practice',
                              totalQuestions: totalCount,
                              correctCount,
                              scorePercent,
                              passed: scorePercent >= 70,
                              missedQuestions: [],
                            });
                          }
                          setShowPostSessionReview(true);
                        }}
                        onOpenPersonalizedReview={() => setShowReviewSession(true)}
                        unresolvedMistakesCount={unresolvedMistakesCount}
                        sessionAnsweredCount={sessionAttempts.length}
                        onToggleRetryIncorrectInPath={handleToggleRetryIncorrectInPath}
                        isRetryingIncorrectInPath={
                          retryIncorrectPathId === currentQ.learningPathId
                        }
                        incorrectCountInCurrentPath={
                          missedQuestionsByPath[currentQ.learningPathId]?.length || 0
                        }
                        isAudioMuted={isAudioMuted}
                        rollingAverageAccuracy={rollingAverageAccuracy}
                        rollingWindowCount={sessionRollingOutcomes.length}
                        activeQuickFilter={activeQuickFilter}
                        onSelectQuickFilter={handleSelectQuickFilter}
                        bookmarksCount={stats.bookmarks.length}
                        savedNotesCount={savedNotesCount}
                        aiScenariosCount={questions.filter((q) => q.isAiGenerated).length}
                        retryQueueCount={retryQueueQuestionIds.length}
                        retryQueueSecondsLeft={retryQueueSecondsLeft}
                        questionSortOrder={questionSortOrder}
                        onChangeSortOrder={handleChangeSortOrder}
                        onOpenMockExam={() => setShowMockExam(true)}
                        onOpenAiGenerator={() => setActiveTab('ai-builder')}
                        onNavigateTab={(tab) => setActiveTab(tab)}
                        showWorkspacePanels={showWorkspacePanels}
                        onToggleWorkspacePanels={() => setShowWorkspacePanels((prev) => !prev)}
                        externalStudyZoneOpenTrigger={externalStudyZoneOpenTrigger}
                        onRateConfidence={handleRateConfidence}
                        onOpenUserGuide={() => setShowUserGuideModal(true)}
                        onOpenPeerChallenge={() => {
                          setPeerChallengeModuleId(currentQ.moduleId);
                          setShowPeerChallengeModal(true);
                        }}
                        last5DifficultyImpactDelta={last5QuestionsImpact.deltaPercent}
                        last5AnsweredCount={last5QuestionsImpact.count}
                        savedNoteText={savedNotesMap[currentQ.id] ?? ''}
                        onUpdateSavedNote={handleUpdateSavedNote}
                        onOpenAccessibilitySettings={() => setShowAccessibilityModal(true)}
                        externalOpenNotesDrawerTrigger={externalOpenNotesDrawerTrigger}
                        onOpenAzureTheme={handleOpenAzureTheme}
                      />
                    </div>
                    <PersonalStudyNotesSidebar
                      question={currentQ}
                      savedNotesMap={savedNotesMap}
                      onUpdateSavedNote={handleUpdateSavedNote}
                      onExportAllMarkdown={() => {
                        const res = downloadNotesAndMemoryAnchorsMarkdown(questions, stats);
                        setAllTimeHighToast(
                          `Exported ${res.notesCount} Notes & ${res.anchorsCount} Memory Anchors to Markdown`
                        );
                      }}
                      onOpenFullDrawer={() =>
                        setExternalOpenNotesDrawerTrigger((prev) => prev + 1)
                      }
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 card-elevation p-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">
                      No Questions Found in Selected Filter
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                      {searchQuery.trim()
                        ? `No questions matched "${searchQuery}". Try another Azure service or clear the search filter.`
                        : selectedThreadFilters.length > 0
                        ? `No questions matched the selected Thread filter (${selectedThreadFilters.join(', ')}) within your current Learning Path/Module scope.`
                        : selectedDifficultyFilter !== 'all'
                        ? `No "${selectedDifficultyFilter}" questions matched the current filter selection.`
                        : retryIncorrectPathId !== null
                        ? `No previously missed questions remain in Learning Path ${retryIncorrectPathId}.`
                        : onlyBookmarks
                        ? "You haven't bookmarked any questions yet. Click the bookmark icon on any question to review it here."
                        : onlySavedNotes
                        ? "No questions with saved study notes yet. Click the 'Notes' icon or drawer on any question to add your personal study cues and memory anchors."
                        : onlyAiGenerated
                        ? 'No custom AI scenarios generated yet. Click "Create AI Scenario" to generate dynamic questions.'
                        : 'Try selecting a different Learning Path or clear the current module filter.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPathId('all');
                        setSelectedModuleId('all');
                        setSelectedDifficultyFilter('all');
                        setSelectedThreadFilters([]);
                        setRetryIncorrectPathId(null);
                        setRetryIncorrectSnapshotIds([]);
                        setOnlyBookmarks(false);
                        setOnlySavedNotes(false);
                        setOnlyAiGenerated(false);
                        setSearchQuery('');
                        setCurrentQuestionIndex(0);
                      }}
                      className="px-4 py-2 rounded-lg bg-[#0078D4] text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}
                </PaymentGatekeeper>
                </div>
              </div>
            </div>
            )}

            {/* Harambee Weekly Learning Roadmap (Curated Top 3 Azure Services per Week + Docs Links) */}
            {!isFocusMode && (
              <WeeklyLearningRoadmap
                onSelectModule={handleSelectModuleFromTracker}
              />
            )}

            {/* Daily Harambee Challenge Unit (Positioned at bottom of page below question area, above footer) */}
            <DailyChallengeBanner
              stats={stats}
              onLaunchChallenge={(modId) => {
                setMicroDrillTargetModuleId(modId);
                setShowMicroDrill(modId);
              }}
            />
          </div>
        )}

        {/* TAB: ADAPTIVE QUIZ MODE (DYNAMIC DIFFICULTY BALANCER & MODULE LEARNING PATH ENGINE) */}
        {activeTab === 'adaptive' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <AdaptiveQuizView
              questions={questions}
              stats={stats}
              onUpdateStats={setStats}
              onNavigateToHistory={() => setActiveTab('history')}
              onNavigateToPractice={() => setActiveTab('quiz')}
              onOpenPersonalizedReview={() => setShowReviewSession(true)}
              onSelectModuleForPractice={handleSelectModuleFromTracker}
              initialFocusPathId={adaptiveFocusPathId}
              initialFocusModuleId={adaptiveFocusModuleId}
            />
          </div>
        )}

        {/* TAB: PERSONALIZED STUDY PLANNER (TARGET EXAM DATE & CONFIDENCE SCHEDULE) */}
        {activeTab === 'planner' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <StudyPlannerView
              stats={stats}
              onSelectModulePractice={(modId) => {
                handleSelectModuleFromTracker(modId);
              }}
              onLaunchAdaptiveModule={(modId, pathId) => {
                setAdaptiveFocusPathId(pathId);
                setAdaptiveFocusModuleId(modId);
                setActiveTab('adaptive');
              }}
              onLaunchMockSimulation={() => setShowMockExam(true)}
              onOpenStudyGuideModule={(modId) => {
                const foundPath = LEARNING_PATHS.find((p) =>
                  p.modules.some((m) => m.id === modId)
                );
                if (foundPath) setSelectedPathId(foundPath.id);
                setSelectedModuleId(modId);
                setActiveTab('study-decks');
              }}
            />
          </div>
        )}

        {/* TAB: IMAGE TUTOR (MICROSOFT CERTIFIED: AZURE FUNDAMENTALS VISUAL DIAGRAMS FOR ALL 12 MODULES) */}
        {activeTab === 'image-tutor' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <AzureImageTutorView
              stats={stats}
              onPracticeModule={(modId) => {
                handleSelectModuleFromTracker(modId);
              }}
              onOpenStudyDecksModule={(modId, pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId(modId);
                setActiveTab('study-decks');
              }}
            />
          </div>
        )}

        {/* TAB: AZURE THEMES (INTERCONNECTING WOVEN THEORIES ACROSS ALL 12 MODULES) */}
        {activeTab === 'azure-themes' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <AzureThemesView
              stats={stats}
              questions={questions}
              initialThemeId={azureThemesFocus?.themeId}
              initialModuleId={azureThemesFocus?.moduleId}
              onPracticeModule={(modId) => {
                handleSelectModuleFromTracker(modId);
              }}
              onPracticeQuestion={(questionId, moduleId) => {
                setSelectedPathId('all');
                setSelectedModuleId(moduleId);
                setOnlyBookmarks(false);
                setOnlyAiGenerated(false);
                setShowPostSessionReview(false);
                setPendingJumpQuestionId(questionId);
                setActiveTab('quiz');
              }}
              onOpenImageTutor={() => setActiveTab('image-tutor')}
              onOpenStudyDecksModule={(modId, pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId(modId);
                setActiveTab('study-decks');
              }}
            />
          </div>
        )}

        {/* TAB: REVIEW HISTORY & LEARNING TRAJECTORY */}
        {activeTab === 'history' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <ReviewHistoryView
              stats={stats}
              onStartAdaptiveQuiz={() => setActiveTab('adaptive')}
              onRetryQuestion={(qId) => {
                const targetIndex = filteredQuestions.findIndex((q) => q.id === qId);
                if (targetIndex !== -1) {
                  setCurrentQuestionIndex(targetIndex);
                }
                setActiveTab('quiz');
              }}
              onSelectPathForPractice={(pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId('all');
                setCurrentQuestionIndex(0);
                setActiveTab('quiz');
              }}
            />
          </div>
        )}

        {/* TAB: FLASHCARDS (FRONT/BACK SYSTEM FOCUSED ON MISSED CONCEPTS) */}
        {activeTab === 'flashcards' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <FlashcardsView
              stats={stats}
              onPracticeModule={handleSelectModuleFromTracker}
            />
          </div>
        )}

        {/* TAB: GLOBAL PEER LEADERBOARD (GLOBAL HARAMBEE AZURE COHORT) */}
        {activeTab === 'leaderboard' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <GlobalLeaderboard
              stats={stats}
              onPracticeClick={() => setActiveTab('quiz')}
              onLaunchCompetitiveDrill={(modId) => {
                setMicroDrillTargetModuleId(modId);
                setShowMicroDrill(modId);
              }}
              onFetchingChange={setIsMotifShimmering}
            />
          </div>
        )}

        {/* TAB: TIMED MOCK EXAM SIMULATION (50-60 QUESTIONS) */}
        {activeTab === 'mock' && (
          <div className="responsive-tab-page-shell max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 card-elevation p-5 sm:p-8 max-w-3xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-8 h-8 text-amber-500" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Official Exam Simulation • 50–60 Questions
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  AZ-900 Timed Mock Exam Simulation
                </h2>
                <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                  Experience the realistic Microsoft Pearson VUE exam simulation: 50 to 60 timed questions across all three learning paths (60 minutes), scaled score out of 1000 points, and a detailed post-exam performance breakdown by Learning Path and Module.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Simulation Format:</span>
                  <span className="text-slate-600">50–60 Questions • 60 Minutes</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Passing Score:</span>
                  <span className="text-slate-600">700 / 1000 Scaled Points (70%)</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Domain Breakdown:</span>
                  <span className="text-slate-600">Detailed Path 1, 2 &amp; 3 Report</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowMockExam(true)}
                  className="px-6 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:from-[#005A9E] hover:to-[#004578] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-5 h-5 text-amber-300 shrink-0" />
                  <span>Launch 50–60Q Mock Exam Simulation</span>
                </button>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Study Planner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI SCENARIO GENERATOR */}
        {activeTab === 'ai-builder' && (
          <div className="responsive-tab-page-shell max-w-5xl mx-auto">
            <AiScenarioGenerator
              onQuestionGenerated={handleQuestionGenerated}
            />
          </div>
        )}

        {/* TAB: KNOWLEDGE ASSISTANT & TUTOR */}
        {activeTab === 'assistant' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <KnowledgeAssistant
              initialQuestionContext={tutorQuestionContext}
              onClearContext={() => setTutorQuestionContext(null)}
            />
          </div>
        )}

        {/* TAB: STUDY DECKS & MATRIX */}
        {activeTab === 'study-decks' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <StudyDeck onPracticeModule={handleSelectModuleFromTracker} />
          </div>
        )}

        {/* TAB: HARAMBEE EXAM WISDOM SLIDES & VITAL CUES */}
        {activeTab === 'wisdom' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <HarambeeWisdomDeck
              onQuizTopic={(modId) => {
                setMicroDrillTargetModuleId(modId);
                setShowMicroDrill(modId);
              }}
            />
          </div>
        )}

        {/* TAB: DOMAIN CONFIDENCE */}
        {activeTab === 'analytics' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto space-y-5">
            <BalancedPathIntensityCoach
              stats={stats}
              questions={questions}
              pathStudySeconds={pathStudySeconds}
              selectedPathId={selectedPathId}
              defaultExpanded={true}
              onFocusPath={(pId, modId) => {
                setRetryIncorrectPathId(null);
                setRetryIncorrectSnapshotIds([]);
                setSelectedPathId(pId);
                setSelectedModuleId(modId ?? 'all');
                setCurrentQuestionIndex(0);
                setShowPostSessionReview(false);
                setActiveTab('quiz');
              }}
            />
            <DomainConfidenceTracker
              stats={stats}
              onDrillWeakAreas={handleDrillWeakAreas}
              onSelectModule={handleSelectModuleFromTracker}
              onLaunchMicroDrill={(moduleId) => {
                setMicroDrillTargetModuleId(moduleId);
                setShowMicroDrill(moduleId);
              }}
              onOpenStudyBreak={() => setShowStudyBreak(true)}
              onOpenExport={() => setShowExportModal(true)}
              onResetModuleConfidence={handleResetModuleConfidence}
            />
          </div>
        )}

        {/* TAB: PERFORMANCE TRENDS (RECHARTS HISTORICAL MODULE & PATH ACCURACY) */}
        {activeTab === 'trends' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <PerformanceTrendsView
              stats={stats}
              questions={questions}
              onPracticeModule={(modId, pathId) => {
                setRetryIncorrectPathId(null);
                setRetryIncorrectSnapshotIds([]);
                setSelectedPathId(pathId);
                setSelectedModuleId(modId);
                setOnlyBookmarks(false);
                setOnlyAiGenerated(false);
                setCurrentQuestionIndex(0);
                setShowPostSessionReview(false);
                setActiveTab('quiz');
              }}
            />
          </div>
        )}

        {/* TAB: COHORT PERFORMANCE VISUALIZATION (D3.js GLOBAL HARAMBEE AZURE COHORT BENCHMARKS) */}
        {activeTab === 'cohort' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <CohortPerformanceView
              stats={stats}
              onSelectPathForPractice={(pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId('all');
                setCurrentQuestionIndex(0);
                setActiveTab('quiz');
              }}
              onSelectModuleForPractice={(moduleId, pathId) => {
                if (pathId !== undefined) setSelectedPathId(pathId);
                setSelectedModuleId(moduleId);
                setCurrentQuestionIndex(0);
                setActiveTab('quiz');
              }}
              onNavigateToPractice={() => setActiveTab('quiz')}
              onOpenPeerChallenge={(modId) => {
                setPeerChallengeModuleId(modId ?? 'all');
                setShowPeerChallengeModal(true);
              }}
            />
          </div>
        )}

        {/* TAB: CANDIDATE PROFILE & BADGES */}
        {activeTab === 'profile' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <ProfileView
              stats={stats}
              onUpdateStats={setStats}
              onNavigateToPractice={() => setActiveTab('quiz')}
              onNavigateToMock={() => setShowMockExam(true)}
              onOpenManageGoal={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPath={(pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId('all');
                setCurrentQuestionIndex(0);
                setShowPostSessionReview(false);
              }}
              onSelectModule={(modId, pathId) => {
                if (pathId !== undefined) setSelectedPathId(pathId);
                setSelectedModuleId(modId);
                setCurrentQuestionIndex(0);
                setShowPostSessionReview(false);
              }}
              onToggleModuleComplete={handleToggleModuleComplete}
              onSearchService={(term) => {
                setSearchQuery(term);
                setCurrentQuestionIndex(0);
              }}
              onOpenPersonalizedReview={() => setShowReviewSession(true)}
              onOpenWeakAreasReview={() => setShowWeakAreasReview(true)}
              setActiveTab={setActiveTab}
              unresolvedMistakesCount={unresolvedMistakesCount}
              questionCountByModule={questionCountByModule}
              onOpenUserGuide={() => setShowUserGuideModal(true)}
            />
          </div>
        )}

        {/* TAB: AZURE GLOSSARY & DICTIONARY (PLACED AFTER PROFILE) */}
        {activeTab === 'glossary' && (
          <div className="responsive-tab-page-shell max-w-6xl mx-auto">
            <AzureGlossaryView
              onDrillTermInPractice={(term) => {
                setSearchQuery(term);
                setCurrentQuestionIndex(0);
                setActiveTab('quiz');
              }}
              onSelectModule={(modId, pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId(modId);
                setCurrentQuestionIndex(0);
                setShowPostSessionReview(false);
                setActiveTab('quiz');
              }}
              onOpenStudyMode={(modId, pathId) => {
                setSelectedPathId(pathId);
                setSelectedModuleId(modId);
                setActiveTab('study-decks');
              }}
            />
          </div>
        )}
      </main>

      {/* Timed Mock Exam Modal Dialog */}
      {showMockExam && (
        <MockExamModal
          questions={questions}
          onFinish={(correct, total) => {
            const scorePercent = Math.round((correct / total) * 100);
            saveQuizSession({
              id: `session-mock-${Date.now()}`,
              timestamp: Date.now(),
              dateStr: new Date().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              title: `Timed Mock Exam Simulation (${total} Questions)`,
              mode: 'mock',
              totalQuestions: total,
              correctCount: correct,
              scorePercent,
              passed: scorePercent >= 70,
              missedQuestions: [],
            });
          }}
          onLaunchAdaptiveForPath={(pathId) => {
            setShowMockExam(false);
            setAdaptiveFocusPathId(pathId);
            setAdaptiveFocusModuleId(null);
            setActiveTab('adaptive');
          }}
          onOpenStudyPlanner={() => {
            setShowMockExam(false);
            setActiveTab('planner');
          }}
          onClose={() => setShowMockExam(false)}
        />
      )}

      {/* Mindful Anti-Fatigue Study Break Modal */}
      {showStudyBreak && (
        <StudyBreakModal
          questionsAnsweredCount={sessionAnswerCount}
          onTakeBreak={() => setShowStudyBreak(false)}
          onStartMicroDrill={() => {
            setShowStudyBreak(false);
            setShowMicroDrill(microDrillTargetModuleId || 5);
          }}
          onDismiss={() => setShowStudyBreak(false)}
        />
      )}

      {/* 5-Question Rapid Micro-Drill Modal (Daily Harambee Weakness Challenge / Fundamentals Reset) */}
      {showMicroDrill !== false && (() => {
        const targetModId = microDrillTargetModuleId || 11;
        const targetModInfo = LEARNING_PATHS.flatMap((p) => p.modules).find(
          (m) => m.id === targetModId
        );
        const isFundamentalsReset =
          fundamentalsResetModules !== null && fundamentalsResetModules.length > 0;
        const resetSet = new Set(fundamentalsResetModules || []);

        const combinedDrillPool = isFundamentalsReset
          ? [
              ...questions.filter(
                (q) => resetSet.has(q.moduleId) && q.difficulty === 'Fundamental'
              ),
              ...questions.filter((q) => resetSet.has(q.moduleId)),
              ...questions.filter((q) => q.difficulty === 'Fundamental'),
              ...questions,
            ]
          : [
              ...questions.filter((q) => q.moduleId === targetModId),
              ...questions.filter(
                (q) =>
                  q.learningPathId === (targetModInfo?.pathId || 3) &&
                  q.moduleId !== targetModId
              ),
              ...questions,
            ];

        const uniqueDrillFive: Question[] = [];
        const seenIds = new Set<string>();
        for (const q of combinedDrillPool) {
          if (!seenIds.has(q.id)) {
            seenIds.add(q.id);
            uniqueDrillFive.push(q);
          }
          if (uniqueDrillFive.length >= 5) break;
        }

        return (
          <MicroDrillModal
            questions={uniqueDrillFive}
            targetModuleId={targetModId}
            targetModuleName={
              targetModInfo?.title || 'Azure Monitoring & Advisory Tools'
            }
            drillVariant={isFundamentalsReset ? 'fundamentals-reset' : 'standard'}
            fundamentalsResetSubtitle={
              isFundamentalsReset
                ? `Foundation reset across Module${
                    fundamentalsResetModules.length > 1 ? 's' : ''
                  } ${fundamentalsResetModules.map((id) => `M${id}`).join(' & ')}`
                : undefined
            }
            onAnswer={handleAnswerQuestion}
            onCompleteDrill={(modId, score, total) => {
              setStats((prev) => saveHarambeeDrillCompletion(prev, modId, score, total));
              const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
              saveQuizSession({
                id: `session-drill-${Date.now()}`,
                timestamp: Date.now(),
                dateStr: new Date().toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                title: isFundamentalsReset
                  ? `Fundamentals Reset • Modules ${(fundamentalsResetModules || [modId])
                      .map((id) => `M${id}`)
                      .join(' & ')}`
                  : `Harambee 5-Q Drill • Module ${modId}`,
                mode: 'micro-drill',
                totalQuestions: total,
                correctCount: score,
                scorePercent,
                passed: scorePercent >= 80,
                missedQuestions: [],
              });
            }}
            onLaunchPeerChallenge={(modId) => {
              setPeerChallengeModuleId(modId);
              setShowPeerChallengeModal(true);
            }}
            onClose={() => {
              setShowMicroDrill(false);
              setFundamentalsResetModules(null);
            }}
          />
        );
      })()}

      {/* Peer Challenge 5-Question Cohort Speed Micro-Drill Modal */}
      {showPeerChallengeModal && (
        <PeerChallengeModal
          isOpen={showPeerChallengeModal}
          onClose={() => {
            setShowPeerChallengeModal(false);
            setPeerChallengeInitialCode(null);
          }}
          questions={questions}
          stats={stats}
          initialModuleId={peerChallengeModuleId}
          initialChallengeCode={peerChallengeInitialCode}
          userName={authenticatedUser?.full_name || authenticatedUser?.email || null}
          onAnswerQuestion={handleAnswerQuestion}
          onCompleteChallenge={(modId, score, total, elapsedSec) => {
            setStats((prev) => saveHarambeeDrillCompletion(prev, modId, score, total));
            const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
            saveQuizSession({
              id: `session-peer-challenge-${Date.now()}`,
              timestamp: Date.now(),
              dateStr: new Date().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              title: `Peer Challenge 5-Q Sprint (${elapsedSec}s)`,
              mode: 'micro-drill',
              totalQuestions: total,
              correctCount: score,
              scorePercent,
              passed: scorePercent >= 80,
              durationSeconds: Math.round(elapsedSec),
              missedQuestions: [],
            });
          }}
        />
      )}

      {/* Pomodoro 5-Minute Break Suggestion & Azure Trivia Modal */}
      <QuizBreakTriviaModal timer={quizFocusTimer} />

      {/* Touch-Friendly Practice Control Overflow Menu for Mobile Devices (Sort, Diff, Heatmap, Maps & Study Zone) */}
      <PracticeControlOverflowMenu
        isOpen={showMobileControlOverflow}
        onClose={() => setShowMobileControlOverflow(false)}
        questionSortOrder={questionSortOrder}
        onSortChange={(order) => {
          handleChangeSortOrder(order);
          triggerMotifShimmer();
        }}
        selectedDifficultyFilter={selectedDifficultyFilter}
        onDifficultyChange={(diff) => {
          setSelectedDifficultyFilter(diff);
          handleChangeLockedDifficulty(diff === 'all' ? null : diff);
          setCurrentQuestionIndex(0);
        }}
        selectedThreadFilters={selectedThreadFilters}
        onToggleThreadFilter={handleToggleThreadFilter}
        onClearThreadFilters={handleClearThreadFilters}
        showPracticeHeatmap={showPracticeHeatmap}
        onToggleHeatmap={() => setShowPracticeHeatmap((prev) => !prev)}
        showWorkspacePanels={showWorkspacePanels}
        onToggleWorkspacePanels={() => setShowWorkspacePanels((prev) => !prev)}
        onOpenStudyZone={() => setExternalStudyZoneOpenTrigger((prev) => prev + 1)}
        onOpenPeerChallenge={() => {
          setPeerChallengeModuleId(selectedModuleId);
          setShowPeerChallengeModal(true);
        }}
        onExportNotesMarkdown={() => {
          const res = downloadNotesAndMemoryAnchorsMarkdown(questions, stats);
          setAllTimeHighToast(
            `Exported ${res.notesCount} Notes & ${res.anchorsCount} Memory Anchors to ${res.filename}`
          );
        }}
      />

      {/* Export Progress & Domain Confidence Report Modal */}
      {showExportModal && (
        <ExportProgressModal
          stats={stats}
          questions={questions}
          onClose={() => setShowExportModal(false)}
          onOpenUserGuide={() => setShowUserGuideModal(true)}
        />
      )}

      {/* Comprehensive Candidate User Guide & Printable/Downloadable PDF Manual */}
      {showUserGuideModal && (
        <UserGuideModal
          onClose={() => setShowUserGuideModal(false)}
          onOpenMockExam={() => {
            setShowUserGuideModal(false);
            setShowMockExam(true);
          }}
          onOpenAdaptive={() => {
            setShowUserGuideModal(false);
            setActiveTab('adaptive');
          }}
        />
      )}

      {/* Scoped Reset Module Confidence Modal */}
      {showResetModuleModal && (
        <ResetModuleModal
          stats={stats}
          onReset={handleResetModuleConfidence}
          onClose={() => setShowResetModuleModal(false)}
        />
      )}

      {/* Virtual Study Room Side Chat & Live Collaboration Hub */}
      <VirtualStudyRoom
        currentQuestion={currentQ}
        activeModuleTitle={currentQ?.moduleTitle}
        isOpen={showStudyRoom}
        onClose={() => setShowStudyRoom(false)}
        onSelectSharedQuestion={(qId) => setPendingJumpQuestionId(qId)}
        initialRoomAreaId={selectedStudyRoomAreaId}
      />

      {/* Weak Areas Review Mode Modal */}
      <WeakAreasReviewModal
        stats={stats}
        allQuestions={questions}
        isOpen={showWeakAreasReview}
        onClose={() => setShowWeakAreasReview(false)}
        onAnswerQuestion={handleAnswerQuestion}
      />

      {/* Personalized Review Session Modal: Incorrectly Answered Questions & Explanations */}
      <ReviewSessionModal
        stats={stats}
        allQuestions={questions}
        isOpen={showReviewSession}
        onClose={() => setShowReviewSession(false)}
        onAnswerQuestion={handleAnswerQuestion}
        onMarkQuestionReviewed={handleMarkQuestionReviewed}
      />

      {/* Celebratory Achievement Unlock Overlay (Master of Governance, 5-Day Streak, etc.) */}
      <AchievementOverlay
        stats={stats}
        onViewBadges={() => setActiveTab('profile')}
      />

      <BackendCloudModal
        isOpen={showBackendCloudModal}
        onClose={() => setShowBackendCloudModal(false)}
        stats={stats}
        onOpenApiDocs={() => setShowApiDocumentationModal(true)}
        onOpenAdminBackOffice={() => setShowAdminBackOfficeModal(true)}
        initialSection={backendModalSection}
        onQuestionSaved={(savedQ) => {
          setQuestions((prev) => {
            const exists = prev.some((q) => q.id === savedQ.id);
            if (exists) {
              return prev.map((q) => (q.id === savedQ.id ? savedQ : q));
            }
            return [savedQ, ...prev];
          });
        }}
      />

      <CurriculumReadinessModal
        isOpen={showCurriculumReadinessModal}
        onClose={() => setShowCurriculumReadinessModal(false)}
        stats={stats}
        questions={questions}
        onSyncCurriculumQuestions={(syncedQuestions) => {
          setQuestions((prev) => {
            const byId = new Map<string, Question>(prev.map((q) => [q.id, q]));
            for (const sq of syncedQuestions) {
              if (sq && sq.id) {
                byId.set(sq.id, { ...(byId.get(sq.id) || {}), ...sq });
              }
            }
            return Array.from(byId.values());
          });
        }}
        onSelectModuleForPractice={(moduleId, pathId) => {
          setSelectedPathId(pathId);
          setSelectedModuleId(moduleId);
          setActiveTab('quiz');
          setCurrentQuestionIndex(0);
        }}
        onOpenStudyMode={() => {
          setActiveTab('study-decks');
        }}
        onOpenAdaptiveQuiz={() => {
          setIsDynamicDifficultyEnabled(true);
          setActiveTab('adaptive');
        }}
        onOpenMockExam={() => setShowMockExam(true)}
        onOpenWeakAreasReview={() => setShowWeakAreasReview(true)}
        onLaunchMicroDrill={(moduleId) => {
          setMicroDrillTargetModuleId(moduleId);
          setShowMicroDrill(moduleId);
        }}
      />

      <AdminBackOfficeModal
        isOpen={showAdminBackOfficeModal}
        onClose={() => setShowAdminBackOfficeModal(false)}
        userEmail={authenticatedUser?.email || null}
        onOpenCurriculumReadiness={() => setShowCurriculumReadinessModal(true)}
        onOpenCloudSyncPortal={() => setShowBackendCloudModal(true)}
        onQuestionSaved={(savedQ) => {
          setQuestions((prev) => {
            const exists = prev.some((q) => q.id === savedQ.id);
            if (exists) {
              return prev.map((q) => (q.id === savedQ.id ? savedQ : q));
            }
            return [savedQ, ...prev];
          });
        }}
      />

      <ApiDocumentationModal
        isOpen={showApiDocumentationModal}
        onClose={() => setShowApiDocumentationModal(false)}
      />

      {/* 17-Second African Heritage Exit Page with WhatsApp Study Summary Handoff */}
      <ExitStudySessionModal
        isOpen={showExitSessionModal}
        onClose={() => setShowExitSessionModal(false)}
        onConfirmSignOut={() => {
          setShowExitSessionModal(false);
          authService.logout();
        }}
        stats={stats}
        userEmail={authenticatedUser?.email || null}
        userName={authenticatedUser?.full_name || null}
        todayAnsweredCount={todayAnsweredCount}
      />

      {/* Subscription Tier Selection Modal (Triggers when selecting a locked premium AZ-900 module) */}
      <SubscriptionTierSelection
        isOpen={tierSelectionLockedModuleId !== null}
        lockedModuleId={tierSelectionLockedModuleId}
        onClose={() => setTierSelectionLockedModuleId(null)}
        onRedirectToProfileSubscription={() => {
          setTierSelectionLockedModuleId(null);
          setActiveTab('profile');
          setTimeout(() => {
            document
              .getElementById('profile-subscription-panel')
              ?.scrollIntoView({ behavior: 'smooth' });
          }, 120);
        }}
      />

      {/* Footer with Randomly Placed Light-Azure Animated African Motifs & Heritage Accent (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <footer className="mt-auto border-t border-sky-200/80 bg-white py-7 relative overflow-hidden z-10 text-xs text-slate-500">
          {/* Randomly Placed African Motifs Partially Animated in Light Azure Colors */}
          <FooterAfricanMotifsBackground />

          <KitengeRibbon height={3} className="mb-4 relative z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <MaasaiMedallion size={20} />
              <span className="font-bold text-slate-700">
                Azure Curriculum: AZ-900 Fundamentals
              </span>
              <span className="text-slate-400">•</span>
              <span>Official Learning Objectives • Offline PWA Enabled</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Footer User Settings: Application-Wide Accessibility Font Size Adjustment Control */}
              <AccessibilityFontSizeControl variant="inline-bar" />
              <span className="text-slate-300">|</span>
              {/* Footer Settings: Audio Feedback Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleAudioMute}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  isAudioMuted
                    ? 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                    : 'bg-sky-50 text-[#0078D4] border-sky-200 hover:bg-sky-100'
                }`}
                title={
                  isAudioMuted
                    ? 'Audio Feedback Muted: Click to enable subtle ping/woosh quiz interaction sounds'
                    : 'Audio Feedback Active: Soft ping on correct, soft woosh on incorrect. Click to mute.'
                }
                aria-label="Toggle quiz interaction audio feedback"
              >
                {isAudioMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audio: Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Audio SFX: On</span>
                  </>
                )}
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-amber-700 font-medium">
                Kenyan Heritage Edition 🇰🇪
              </span>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setShowAdminBackOfficeModal(true)}
                className="text-slate-500 hover:text-slate-900 font-bold underline decoration-dotted cursor-pointer"
                title="Authorized Admin Console (Route Guard Protected: vangetich@gmail.com)"
              >
                Admin Console
              </button>
            </div>
          </div>
        </footer>
      )}
      <AccessibilitySettingsModal
        isOpen={showAccessibilityModal}
        onClose={() => setShowAccessibilityModal(false)}
      />
      </div>
    </ProtectedRoute>
  );
}
