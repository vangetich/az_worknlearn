import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Header, AppTab } from './components/Header';
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
import { ReviewHistoryView } from './components/ReviewHistoryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GlassyStudyHubDropdown } from './components/GlassyStudyHubDropdown';
import { ResetModuleModal } from './components/ResetModuleModal';
import { LearningPathOverview } from './components/LearningPathOverview';
import { VirtualStudyRoom } from './components/VirtualStudyRoom';
import { WeakAreasReviewModal } from './components/WeakAreasReviewModal';
import { ReviewSessionModal } from './components/ReviewSessionModal';
import { WeeklyLearningRoadmap } from './components/WeeklyLearningRoadmap';
import { ProfileView } from './components/ProfileView';
import { AchievementOverlay } from './components/AchievementOverlay';
import { PostSessionWeakAreaReview } from './components/PostSessionWeakAreaReview';
import { AzureCloudExplorer } from './components/AzureCloudExplorer';
import { AfricanWatermarkPattern, KitengeRibbon, MaasaiMedallion } from './components/MotifDecorations';
import { BUILTIN_QUESTIONS } from './data/questionBank';
import { LEARNING_PATHS } from './data/curriculum';
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
} from './utils/storage';
import { ThemeToggle } from './components/ThemeToggle';
import { getStoredTheme, applyTheme } from './utils/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('quiz');

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(getStoredTheme());
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

  // Filter selections for Practice Mode
  const [selectedPathId, setSelectedPathId] = useState<number | 'all'>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<number | 'all'>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [onlyAiGenerated, setOnlyAiGenerated] = useState<boolean>(false);
  const [retryIncorrectPathId, setRetryIncorrectPathId] = useState<1 | 2 | 3 | null>(null);
  const [retryIncorrectSnapshotIds, setRetryIncorrectSnapshotIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingJumpQuestionId, setPendingJumpQuestionId] = useState<string | null>(null);

  // Active question index in filtered list
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Context for passing a question to Knowledge Assistant
  const [tutorQuestionContext, setTutorQuestionContext] = useState<Question | null>(null);

  // Mock exam modal state
  const [showMockExam, setShowMockExam] = useState<boolean>(false);

  // Engagement & Anti-fatigue states
  const [sessionAnswerCount, setSessionAnswerCount] = useState<number>(0);
  const [sessionAttempts, setSessionAttempts] = useState<QuestionAttempt[]>([]);
  const [showPostSessionReview, setShowPostSessionReview] = useState<boolean>(false);
  const [showStudyBreak, setShowStudyBreak] = useState<boolean>(false);
  const [showMicroDrill, setShowMicroDrill] = useState<number | false>(false);
  const [microDrillTargetModuleId, setMicroDrillTargetModuleId] = useState<number>(5);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Focus Mode state (minimizes UI by hiding nav bar and footer)
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Slide menu visibility state
  const [isMenuHidden, setIsMenuHidden] = useState<boolean>(false);

  // Scoped reset module modal state
  const [showResetModuleModal, setShowResetModuleModal] = useState<boolean>(false);

  // Virtual Study Room state
  const [showStudyRoom, setShowStudyRoom] = useState<boolean>(false);

  // Weak Areas Review modal state
  const [showWeakAreasReview, setShowWeakAreasReview] = useState<boolean>(false);

  // Review Session Modal state (Last 10 Missed Questions & Re-Test)
  const [showReviewSession, setShowReviewSession] = useState<boolean>(false);

  // Dynamic Difficulty Adjustment state
  const [isDynamicDifficultyEnabled, setIsDynamicDifficultyEnabled] = useState<boolean>(true);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState<number>(0);
  const [dynamicDifficulty, setDynamicDifficulty] = useState<'Fundamental' | 'Intermediate' | 'Advanced'>('Intermediate');

  // Visual Fire-Streak celebration trigger in header
  const [fireStreakTrigger, setFireStreakTrigger] = useState<number>(0);

  // Escape key listener to exit Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Scoped Module Confidence Reset Handler
  const handleResetModuleConfidence = (moduleId: number) => {
    const updated = resetModuleConfidence(stats, moduleId);
    setStats(updated);
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

  // Filtered question set with dynamic difficulty prioritization and global search query
  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const list = questions.filter((q) => {
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
      if (onlyBookmarks && !stats.bookmarks.includes(q.id)) {
        return false;
      }
      if (onlyAiGenerated && !q.isAiGenerated) {
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

    // When a specific learning path is selected, present questions sequentially within that path
    if (selectedPathId !== 'all') {
      return [...list].sort((a, b) => a.moduleId - b.moduleId);
    }

    // If dynamic difficulty is enabled and browsing all modules, prioritize matching difficulty
    if (isDynamicDifficultyEnabled && selectedModuleId === 'all') {
      return [...list].sort((a, b) => {
        if (a.difficulty === dynamicDifficulty && b.difficulty !== dynamicDifficulty) return -1;
        if (b.difficulty === dynamicDifficulty && a.difficulty !== dynamicDifficulty) return 1;
        return 0;
      });
    }

    return list;
  }, [
    questions,
    retryIncorrectPathId,
    retryIncorrectSnapshotIds,
    missedQuestionsByPath,
    selectedPathId,
    selectedModuleId,
    onlyBookmarks,
    onlyAiGenerated,
    searchQuery,
    stats.bookmarks,
    isDynamicDifficultyEnabled,
    dynamicDifficulty,
  ]);

  // Handle jumping directly to a specific question selected in GlobalSearchBar
  useEffect(() => {
    if (!pendingJumpQuestionId) return;
    const idx = filteredQuestions.findIndex((q) => q.id === pendingJumpQuestionId);
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

  // Deep-linking: Load shared question if present in URL query (?q=ID)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sharedQId = params.get('q');
    if (sharedQId) {
      const target = questions.find((q) => q.id === sharedQId);
      if (target) {
        setSelectedPathId(target.learningPathId);
        setSelectedModuleId('all');
        setActiveTab('quiz');
        const targetIdx = filteredQuestions.findIndex((q) => q.id === sharedQId);
        if (targetIdx !== -1) {
          setCurrentQuestionIndex(targetIdx);
        }
      }
    }
  }, [questions, filteredQuestions]);

  // Count questions per module
  const questionCountByModule = useMemo(() => {
    const counts: Record<number, number> = {};
    questions.forEach((q) => {
      counts[q.moduleId] = (counts[q.moduleId] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Answer handler with dynamic difficulty progression
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

    // Dynamic Difficulty Adjustment:
    // If user answers consecutively correct (>=2), step up difficulty: Fundamental -> Intermediate -> Advanced
    // If user struggles (consecutive incorrect >= 1), step down difficulty: Advanced -> Intermediate -> Fundamental
    if (isDynamicDifficultyEnabled) {
      if (isCorrect) {
        const nextCorrectStreak = consecutiveCorrect + 1;
        setConsecutiveCorrect(nextCorrectStreak);
        setConsecutiveIncorrect(0);
        if (nextCorrectStreak >= 2) {
          if (dynamicDifficulty === 'Fundamental') {
            setDynamicDifficulty('Intermediate');
          } else if (dynamicDifficulty === 'Intermediate') {
            setDynamicDifficulty('Advanced');
          }
        }
      } else {
        const nextIncorrectStreak = consecutiveIncorrect + 1;
        setConsecutiveIncorrect(nextIncorrectStreak);
        setConsecutiveCorrect(0);
        if (nextIncorrectStreak >= 1) {
          if (dynamicDifficulty === 'Advanced') {
            setDynamicDifficulty('Intermediate');
          } else if (dynamicDifficulty === 'Intermediate') {
            setDynamicDifficulty('Fundamental');
          }
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
  };

  // Bookmark toggle
  const handleToggleBookmark = (questionId: string) => {
    const updated = toggleBookmark(stats, questionId);
    setStats(updated);
  };

  // Module completion toggle (Curriculum Progress Tracker)
  const handleToggleModuleComplete = (moduleId: number) => {
    const updated = toggleModuleCompletion(stats, moduleId);
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
    setCurrentQuestionIndex(0);
    setActiveTab('quiz');
  };

  const currentQ = filteredQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] relative flex flex-col font-sans">
      {/* Subtle African Kitenge Watermark Background */}
      <AfricanWatermarkPattern opacity={0.04} />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />

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
        />
      )}

      {/* Floating Focus Mode Banner (Minimized UI for Test-Like Concentration) */}
      {isFocusMode && (
        <div className="sticky top-4 z-50 px-4 max-w-4xl w-full mx-auto animate-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 px-5 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400 block">
                  Focus Mode Active
                </span>
                <span className="text-xs text-slate-300 hidden sm:inline">
                  Navigation bar and footer hidden • Test-like exam concentration
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-400">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </span>
              <ThemeToggle />
              <button
                onClick={() => setIsFocusMode(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
                title="Exit Focus Mode (or press Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Focus</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-300">Esc</kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* TAB 1: PRACTICE MODULES */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Compact Responsive Hero Section + Glassy Study Hub Dropdown (Hidden in Focus Mode) */}
            {!isFocusMode && (
              <div className="text-center py-1 sm:py-2 space-y-2.5 max-w-5xl mx-auto relative z-20">
                {/* Top Row: AZ-900 Badge + Glassy Study Hub Dropdown */}
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
                    onOpenStudyRoom={() => setShowStudyRoom(true)}
                  />
                </div>

                {/* Compact Responsive Heading */}
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight animate-azure-shimmer text-center">
                    AZ-900 Azure Fundamentals Practice Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                    Explore official Azure Learning Paths, interactive service definitions, and scenario-based exam questions with instant distractor breakdowns.
                  </p>
                </div>
              </div>
            )}

            {/* Functional, Compact & CSS-Responsive Azure Cloud Explorer Menus Window */}
            {!isFocusMode && (
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
            )}

            {/* Interactive Learning Path Navigation System & Prominent Active Path Display */}
            {!isFocusMode && (
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
                unresolvedMistakesCount={unresolvedMistakesCount}
                onClose={() => setShowPostSessionReview(false)}
              />
            ) : (
            /* Main Studio Grid: Curriculum Sidebar + Quiz Card (Left sidebar hidden in Focus Mode or when collapsed) */
            <div className={isFocusMode ? "max-w-4xl mx-auto w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"}>
              {/* Left Column: Navigator & Filters (4 cols, hidden during Focus Mode or when sidebar is collapsed) */}
              {!isFocusMode && !isMenuHidden && (
                <div className="lg:col-span-4 space-y-3.5">
                {/* Quick Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 card-elevation flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setOnlyBookmarks(!onlyBookmarks);
                      setOnlyAiGenerated(false);
                      setCurrentQuestionIndex(0);
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      onlyBookmarks
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>Bookmarked ({stats.bookmarks.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setOnlyAiGenerated(!onlyAiGenerated);
                      setOnlyBookmarks(false);
                      setCurrentQuestionIndex(0);
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      onlyAiGenerated
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Scenarios ({questions.filter((q) => q.isAiGenerated).length})</span>
                  </button>
                </div>

                {/* Module Browser */}
                <ModuleBrowser
                  selectedPathId={selectedPathId}
                  selectedModuleId={selectedModuleId}
                  onSelectPath={(pathId) => {
                    setSelectedPathId(pathId);
                    setCurrentQuestionIndex(0);
                  }}
                  onSelectModule={(modId) => {
                    setSelectedModuleId(modId);
                    setCurrentQuestionIndex(0);
                  }}
                  stats={stats}
                  questionCountByModule={questionCountByModule}
                  onToggleModuleComplete={handleToggleModuleComplete}
                  onHideSidebar={() => setIsMenuHidden(true)}
                />

                {/* African Proverb & Focus Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <MaasaiMedallion size={26} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                        Harambee • Exam Wisdom
                      </h4>
                      <p className="text-xs text-amber-950 mt-0.5 italic leading-relaxed">
                        "Little by little, a little becomes a lot." — Master 5 scenarios daily!
                      </p>
                      <button
                        onClick={() => setActiveTab('wisdom')}
                        className="mt-2 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 fill-amber-200" />
                        <span>Wisdom Slides</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* Right Column: Active Scenario Question Card (Takes full width in Focus Mode or when sidebar is collapsed) */}
              <div className={isFocusMode || isMenuHidden ? "w-full lg:col-span-12" : "lg:col-span-8"}>
                {/* Sequential Path Focus & Progress Bar when a specific Learning Path is selected */}
                {selectedPathId !== 'all' && (
                  <div className="mb-4 p-4 rounded-xl border bg-gradient-to-r from-slate-50 to-blue-50/60 border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#0078D4] text-white shadow-2xs shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#0078D4]">
                            Sequential Path Focus
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-900">
                            Path {selectedPathId} of 3
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {LEARNING_PATHS.find((p) => p.id === selectedPathId)?.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-slate-700 block">
                          Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                        </span>
                        <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full bg-[#0078D4] transition-all duration-300"
                            style={{
                              width: `${Math.round(((currentQuestionIndex + 1) / Math.max(1, filteredQuestions.length)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPathId('all');
                          setCurrentQuestionIndex(0);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                        title="View all 3 learning paths together"
                      >
                        All Paths
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Global Search Filter Indicator */}
                {searchQuery.trim() && (
                  <div className="mb-4 p-3.5 rounded-xl border bg-blue-50/80 border-blue-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
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

                {filteredQuestions.length > 0 && currentQ ? (
                  <QuizCard
                    question={currentQ}
                    questionIndex={currentQuestionIndex}
                    totalQuestions={filteredQuestions.length}
                    onAnswer={handleAnswerQuestion}
                    onNext={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(filteredQuestions.length - 1, prev + 1)
                      )
                    }
                    onPrev={() =>
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                    }
                    onBookmark={handleToggleBookmark}
                    isBookmarked={stats.bookmarks.includes(currentQ.id)}
                    onAskTutorAboutQuestion={handleAskTutorAboutQuestion}
                    stats={stats}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                    dynamicDifficulty={dynamicDifficulty}
                    consecutiveStreak={consecutiveCorrect}
                    isDynamicDifficultyEnabled={isDynamicDifficultyEnabled}
                    onToggleDynamicDifficulty={() =>
                      setIsDynamicDifficultyEnabled(!isDynamicDifficultyEnabled)
                    }
                    onOpenStudyRoom={() => setShowStudyRoom(true)}
                    onFinishSession={() => setShowPostSessionReview(true)}
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
                  />
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
                        : retryIncorrectPathId !== null
                        ? `No previously missed questions remain in Learning Path ${retryIncorrectPathId}.`
                        : onlyBookmarks
                        ? "You haven't bookmarked any questions yet. Click the bookmark icon on any question to review it here."
                        : onlyAiGenerated
                        ? 'No custom AI scenarios generated yet. Click "Create AI Scenario" to generate dynamic questions.'
                        : 'Try selecting a different Learning Path or clear the current module filter.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPathId('all');
                        setSelectedModuleId('all');
                        setRetryIncorrectPathId(null);
                        setRetryIncorrectSnapshotIds([]);
                        setOnlyBookmarks(false);
                        setOnlyAiGenerated(false);
                        setSearchQuery('');
                        setCurrentQuestionIndex(0);
                      }}
                      className="px-4 py-2 rounded-lg bg-[#0078D4] text-white font-semibold text-xs inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}
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

        {/* TAB: ADAPTIVE QUIZ MODE (DYNAMIC DIFFICULTY BALANCER) */}
        {activeTab === 'adaptive' && (
          <AdaptiveQuizView
            questions={questions}
            stats={stats}
            onUpdateStats={setStats}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToPractice={() => setActiveTab('quiz')}
            onOpenPersonalizedReview={() => setShowReviewSession(true)}
          />
        )}

        {/* TAB: REVIEW HISTORY & LEARNING TRAJECTORY */}
        {activeTab === 'history' && (
          <ReviewHistoryView
            onStartAdaptiveQuiz={() => setActiveTab('adaptive')}
            onRetryQuestion={(qId) => {
              const targetIndex = filteredQuestions.findIndex((q) => q.id === qId);
              if (targetIndex !== -1) {
                setCurrentQuestionIndex(targetIndex);
              }
              setActiveTab('quiz');
            }}
          />
        )}

        {/* TAB: FLASHCARDS (FRONT/BACK SYSTEM FOCUSED ON MISSED CONCEPTS) */}
        {activeTab === 'flashcards' && (
          <FlashcardsView
            stats={stats}
            onPracticeModule={handleSelectModuleFromTracker}
          />
        )}

        {/* TAB: GLOBAL LEARNING LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <GlobalLeaderboard
            stats={stats}
            onPracticeClick={() => setActiveTab('quiz')}
          />
        )}

        {/* TAB: TIMED MOCK EXAM */}
        {activeTab === 'mock' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 card-elevation p-8 max-w-3xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-8 h-8 text-amber-500" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Microsoft Official Exam Simulation
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  AZ-900 Microsoft Azure Fundamentals Mock Exam
                </h2>
                <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                  Experience the realistic test interface: 45 minutes, weighted domain coverage, and instant score report scaled out of 1000 points.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Exam Duration:</span>
                  <span className="text-slate-600">45 Minutes Countdown</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Passing Mark:</span>
                  <span className="text-slate-600">700 / 1000 Scaled Points</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Exam Weight Balance:</span>
                  <span className="text-slate-600">Paths 1, 2, &amp; 3 per Microsoft</span>
                </div>
              </div>

              <button
                onClick={() => setShowMockExam(true)}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:from-[#005A9E] hover:to-[#004578] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Award className="w-5 h-5 text-amber-300" />
                <span>Begin Timed Mock Exam Now</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: AI SCENARIO GENERATOR */}
        {activeTab === 'ai-builder' && (
          <div className="max-w-4xl mx-auto">
            <AiScenarioGenerator
              onQuestionGenerated={handleQuestionGenerated}
            />
          </div>
        )}

        {/* TAB: KNOWLEDGE ASSISTANT & TUTOR */}
        {activeTab === 'assistant' && (
          <div className="max-w-5xl mx-auto">
            <KnowledgeAssistant
              initialQuestionContext={tutorQuestionContext}
              onClearContext={() => setTutorQuestionContext(null)}
            />
          </div>
        )}

        {/* TAB: STUDY DECKS & MATRIX */}
        {activeTab === 'study-decks' && (
          <div className="max-w-5xl mx-auto">
            <StudyDeck />
          </div>
        )}

        {/* TAB: HARAMBEE EXAM WISDOM SLIDES & VITAL CUES */}
        {activeTab === 'wisdom' && (
          <div className="max-w-5xl mx-auto">
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
          <div className="max-w-5xl mx-auto">
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

        {/* TAB: CANDIDATE PROFILE & BADGES */}
        {activeTab === 'profile' && (
          <ProfileView
            stats={stats}
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
          />
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
              title: `Timed Mock Exam (${total} Questions)`,
              mode: 'mock',
              totalQuestions: total,
              correctCount: correct,
              scorePercent,
              passed: scorePercent >= 70,
              missedQuestions: [],
            });
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

      {/* 3-Question Rapid Micro-Drill Modal */}
      {showMicroDrill !== false && (
        <MicroDrillModal
          questions={
            questions.filter((q) => q.moduleId === microDrillTargetModuleId).length > 0
              ? questions.filter((q) => q.moduleId === microDrillTargetModuleId)
              : questions.slice(0, 3)
          }
          targetModuleName={
            LEARNING_PATHS.flatMap((p) => p.modules).find(
              (m) => m.id === microDrillTargetModuleId
            )?.title || 'Weakest Curriculum Area'
          }
          onAnswer={handleAnswerQuestion}
          onClose={() => setShowMicroDrill(false)}
        />
      )}

      {/* Export Progress & Domain Confidence Report Modal */}
      {showExportModal && (
        <ExportProgressModal
          stats={stats}
          onClose={() => setShowExportModal(false)}
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

      {/* Virtual Study Room Side Chat Panel */}
      <VirtualStudyRoom
        currentQuestion={currentQ}
        activeModuleTitle={currentQ?.moduleTitle}
        isOpen={showStudyRoom}
        onClose={() => setShowStudyRoom(false)}
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

      {/* Footer with Azure Curriculum & African Heritage Accent (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 relative z-10 text-xs text-slate-500">
          <KitengeRibbon height={3} className="mb-4" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MaasaiMedallion size={20} />
              <span className="font-bold text-slate-700">
                Azure Curriculum: AZ-900 Fundamentals
              </span>
              <span className="text-slate-400">•</span>
              <span>Official Learning Objectives • Offline PWA Enabled</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-700 font-medium">
                Kenyan Heritage Edition 🇰🇪
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Global Harambee Azure Cohort
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
