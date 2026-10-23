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
} from 'lucide-react';
import { Header } from './components/Header';
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
import { AfricanWatermarkPattern, KitengeRibbon, MaasaiMedallion } from './components/MotifDecorations';
import { BUILTIN_QUESTIONS } from './data/questionBank';
import { LEARNING_PATHS } from './data/curriculum';
import { Question, UserStats, QuestionAttempt } from './types/quiz';
import { getInitialStats, saveUserAttempt, toggleBookmark } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'quiz' | 'mock' | 'ai-builder' | 'assistant' | 'study-decks' | 'analytics' | 'wisdom'
  >('quiz');

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
  const [showMicroDrill, setShowMicroDrill] = useState<boolean>(false);
  const [microDrillTargetModuleId, setMicroDrillTargetModuleId] = useState<number>(5);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

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
      {/* Subtle African Kitenge Watermark Background (0.04-0.08 opacity) */}
      <AfricanWatermarkPattern opacity={0.04} />

      {/* Primary Header with African Motif Ribbon */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenExport={() => setShowExportModal(true)}
        onUpdateStats={setStats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* TAB 1: PRACTICE MODULES */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {/* Top Banner with African Heritage Accent */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#005A9E] to-[#0078D4] text-white p-6 sm:p-7 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                      AZ-900 Exam Engine
                    </span>
                    <span className="text-xs text-blue-200">
                      Official Scenario Practice
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                    Microsoft Azure Fundamentals Practice Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                    Master scenario-based questions with instant architectural breakdowns ("why it's right" vs. "why others are wrong") and exam anchor tips.
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowMockExam(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>Launch Mock Exam</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ai-builder')}
                    className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-xs transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Create AI Scenario</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Challenge Notification System based on Heatmap lowest confidence */}
            <DailyChallengeBanner
              stats={stats}
              onLaunchChallenge={(modId) => {
                setMicroDrillTargetModuleId(modId);
                setShowMicroDrill(true);
              }}
            />

            {/* Main Studio Grid: Curriculum Sidebar + Quiz Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Navigator & Filters (4 cols) */}
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

              {/* Right Column: Active Scenario Question Card (8 cols) */}
              <div className="lg:col-span-8">
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
          </div>
        )}

        {/* TAB 2: TIMED MOCK EXAM */}
        {activeTab === 'mock' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 card-elevation p-8 max-w-3xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-8 h-8 text-amber-500" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Official Exam Simulation
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
                  <span className="text-slate-600">Paths 1, 2, & 3 per Microsoft</span>
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

        {/* TAB 3: AI SCENARIO GENERATOR */}
        {activeTab === 'ai-builder' && (
          <div className="max-w-4xl mx-auto">
            <AiScenarioGenerator
              onQuestionGenerated={handleQuestionGenerated}
            />
          </div>
        )}

        {/* TAB 4: KNOWLEDGE ASSISTANT & TUTOR */}
        {activeTab === 'assistant' && (
          <div className="max-w-5xl mx-auto">
            <KnowledgeAssistant
              initialQuestionContext={tutorQuestionContext}
              onClearContext={() => setTutorQuestionContext(null)}
            />
          </div>
        )}

        {/* TAB 5: STUDY DECKS & MATRIX */}
        {activeTab === 'study-decks' && (
          <div className="max-w-5xl mx-auto">
            <StudyDeck />
          </div>
        )}

        {/* TAB 6: HARAMBEE EXAM WISDOM SLIDES & VITAL CUES */}
        {activeTab === 'wisdom' && (
          <div className="max-w-5xl mx-auto">
            <HarambeeWisdomDeck
              onQuizTopic={(modId) => {
                setMicroDrillTargetModuleId(modId);
                setShowMicroDrill(true);
              }}
            />
          </div>
        )}

        {/* TAB 7: DOMAIN CONFIDENCE */}
        {activeTab === 'analytics' && (
          <div className="max-w-5xl mx-auto">
            <DomainConfidenceTracker
              stats={stats}
              onDrillWeakAreas={handleDrillWeakAreas}
              onSelectModule={handleSelectModuleFromTracker}
              onLaunchMicroDrill={(moduleId) => {
                setMicroDrillTargetModuleId(moduleId);
                setShowMicroDrill(true);
              }}
              onOpenStudyBreak={() => setShowStudyBreak(true)}
              onOpenExport={() => setShowExportModal(true)}
            />
          </div>
        )}
      </main>

      {/* Timed Mock Exam Modal Dialog */}
      {showMockExam && (
        <MockExamModal
          questions={questions.slice(0, 35)}
          onFinish={(correct, total) => {
            console.log(`Exam finished: ${correct}/${total}`);
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
            setShowMicroDrill(true);
          }}
          onDismiss={() => setShowStudyBreak(false)}
        />
      )}

      {/* 3-Question Rapid Micro-Drill Modal */}
      {showMicroDrill && (
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

      {/* Footer with African Heritage Accent */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 relative z-10 text-xs text-slate-500">
        <KitengeRibbon height={3} className="mb-4" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MaasaiMedallion size={20} />
            <span className="font-bold text-slate-700">
              AZ-900 Smart Quiz Builder & Knowledge Assistant
            </span>
            <span className="text-slate-400">•</span>
            <span>Aligned with Microsoft Learn AZ-900 Exam Specifications</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-700 font-medium">
              Kenyan Heritage Edition 🇰🇪
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Designed for Azure Certified Learners
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
