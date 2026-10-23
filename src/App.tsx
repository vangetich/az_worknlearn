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
import { AfricanWatermarkPattern, KitengeRibbon, MaasaiMedallion } from './components/MotifDecorations';
import { BUILTIN_QUESTIONS } from './data/questionBank';
import { LEARNING_PATHS } from './data/curriculum';
import { Question, UserStats, QuestionAttempt } from './types/quiz';
import { getInitialStats, saveUserAttempt, toggleBookmark, resetModuleConfidence, saveQuizSession } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('quiz');

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

  // Active question index in filtered list
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Context for passing a question to Knowledge Assistant
  const [tutorQuestionContext, setTutorQuestionContext] = useState<Question | null>(null);

  // Mock exam modal state
  const [showMockExam, setShowMockExam] = useState<boolean>(false);

  // Engagement & Anti-fatigue states
  const [sessionAnswerCount, setSessionAnswerCount] = useState<number>(0);
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

  // Filtered question set
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
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
      return true;
    });
  }, [questions, selectedPathId, selectedModuleId, onlyBookmarks, onlyAiGenerated, stats.bookmarks]);

  // Keep index within bounds
  useEffect(() => {
    if (currentQuestionIndex >= filteredQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, filteredQuestions.length - 1));
    }
  }, [filteredQuestions.length, currentQuestionIndex]);

  // Count questions per module
  const questionCountByModule = useMemo(() => {
    const counts: Record<number, number> = {};
    questions.forEach((q) => {
      counts[q.moduleId] = (counts[q.moduleId] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Answer handler
  const handleAnswerQuestion = (
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean
  ) => {
    const targetQ = questions.find((q) => q.id === questionId);
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

    // Track session count and trigger gentle anti-burnout break every 6 questions
    const nextCount = sessionAnswerCount + 1;
    setSessionAnswerCount(nextCount);
    if (nextCount > 0 && nextCount % 6 === 0) {
      setShowStudyBreak(true);
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = (questionId: string) => {
    const updated = toggleBookmark(stats, questionId);
    setStats(updated);
  };

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
          onSelectPath={(p) => setSelectedPathId(p)}
          stats={stats}
          onOpenExport={() => setShowExportModal(true)}
          onUpdateStats={setStats}
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

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </span>
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
          <div className="space-y-6">
            {/* Centered Hero Section with Light Azure Shimmer, Glassy Dropdown Menu & AZ-900 at the top (Hidden in Focus Mode) */}
            {!isFocusMode && (
              <div className="text-center py-2 sm:py-4 space-y-4 max-w-4xl mx-auto relative z-20">
                {/* AZ-900 Azure fundamentals at the top */}
                <div className="flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-500/10 via-sky-500/20 to-blue-500/10 text-[#0078D4] border border-sky-300/60 shadow-2xs backdrop-blur-xs">
                    <MaasaiMedallion size={16} />
                    <span className="tracking-wide uppercase font-extrabold">AZ-900 Azure Fundamentals</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-600 font-semibold text-[11px] hidden sm:inline">Azure Curriculum</span>
                  </div>
                </div>

                {/* Centred below nav menu and between nav menu and the Heading: Semi-transparent glassy dropdown-menu */}
                <div className="flex justify-center">
                  <GlassyStudyHubDropdown
                    stats={stats}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenExport={() => setShowExportModal(true)}
                    isMenuHidden={isMenuHidden}
                    onToggleSlideMenu={() => setIsMenuHidden(!isMenuHidden)}
                    onOpenResetModal={() => setShowResetModuleModal(true)}
                  />
                </div>

                {/* Heading: Centred as well and font enlarged, looking nice with a light azure blue vibrant shimmer */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight animate-azure-shimmer text-center">
                    AZ-900 Azure Fundamentals Practice Studio
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                    Master official scenario-based questions with instant architectural breakdowns ("why it's right" vs. "why others are wrong"), exam anchor tips, and distraction-free Focus Mode.
                  </p>
                </div>

                {/* Quick Actions Centered */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveTab('adaptive')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Adaptive Quiz Mode</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('flashcards')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Concept Flashcards</span>
                  </button>

                  <button
                    onClick={() => setShowMockExam(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Launch Mock Exam</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ai-builder')}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Create AI Scenario</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Studio Grid: Curriculum Sidebar + Quiz Card (Left sidebar hidden in Focus Mode) */}
            <div className={isFocusMode ? "max-w-4xl mx-auto w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}>
              {/* Left Column: Navigator & Filters (4 cols, hidden during Focus Mode) */}
              {!isFocusMode && (
                <div className="lg:col-span-4 space-y-4">
                {/* Quick Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 card-elevation flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setOnlyBookmarks(!onlyBookmarks);
                      setOnlyAiGenerated(false);
                      setCurrentQuestionIndex(0);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
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
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
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
                />

                {/* African Proverb & Focus Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-4">
                  <div className="flex items-start gap-3">
                    <MaasaiMedallion size={30} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                        Harambee • Exam Wisdom
                      </h4>
                      <p className="text-xs text-amber-950 mt-1 italic leading-relaxed">
                        "Little by little, a little becomes a lot." — Swahili Proverb. Master 5 scenarios daily to guarantee your Microsoft AZ-900 certification!
                      </p>
                      <button
                        onClick={() => setActiveTab('wisdom')}
                        className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-amber-200" />
                        <span>View Technical Wisdom Slides</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* Right Column: Active Scenario Question Card (Takes full width in Focus Mode) */}
              <div className={isFocusMode ? "w-full" : "lg:col-span-8"}>
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
                      {onlyBookmarks
                        ? "You haven't bookmarked any questions yet. Click the bookmark icon on any question to review it here."
                        : onlyAiGenerated
                        ? 'No custom AI scenarios generated yet. Click "Create AI Scenario" to generate dynamic questions.'
                        : 'Try selecting a different Learning Path or clear the current module filter.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPathId('all');
                        setSelectedModuleId('all');
                        setOnlyBookmarks(false);
                        setOnlyAiGenerated(false);
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
      </main>

      {/* Timed Mock Exam Modal Dialog */}
      {showMockExam && (
        <MockExamModal
          questions={questions.slice(0, 35)}
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

      {/* Footer with Microsoft Curriculum Only & African Heritage Accent (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 relative z-10 text-xs text-slate-500">
          <KitengeRibbon height={3} className="mb-4" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MaasaiMedallion size={20} />
              <span className="font-bold text-slate-700">
                Microsoft Curriculum Only: AZ-900 Azure Fundamentals
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
