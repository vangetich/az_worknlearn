import React, { useState, useMemo } from 'react';
import {
  History,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  Trash2,
  BookOpen,
  Filter,
  Check,
  Lightbulb,
} from 'lucide-react';
import { QuizSessionRecord, QuizSessionMissedQuestion } from '../types/quiz';
import { getPastQuizSessions, deleteQuizSession } from '../utils/storage';
import { MaasaiMedallion } from './MotifDecorations';

interface ReviewHistoryViewProps {
  onStartAdaptiveQuiz: () => void;
  onRetryQuestion?: (questionId: string) => void;
}

export const ReviewHistoryView: React.FC<ReviewHistoryViewProps> = ({
  onStartAdaptiveQuiz,
  onRetryQuestion,
}) => {
  const [sessions, setSessions] = useState<QuizSessionRecord[]>(getPastQuizSessions);
  const [filterMode, setFilterMode] = useState<'all' | 'adaptive' | 'mock' | 'practice'>('all');
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({
    // Expand the first session by default so the user immediately sees missed questions
    [sessions[0]?.id || '']: true,
  });

  const toggleExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteQuizSession(id);
    setSessions(updated);
  };

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterMode === 'all') return true;
      return s.mode === filterMode;
    });
  }, [sessions, filterMode]);

  // Aggregate trajectory metrics
  const { totalSessions, avgScore, passRate, totalMissed } = useMemo(() => {
    if (sessions.length === 0) {
      return { totalSessions: 0, avgScore: 0, passRate: 0, totalMissed: 0 };
    }
    const total = sessions.length;
    const scoreSum = sessions.reduce((acc, s) => acc + s.scorePercent, 0);
    const passedCount = sessions.filter((s) => s.passed).length;
    const missedSum = sessions.reduce((acc, s) => acc + s.missedQuestions.length, 0);

    return {
      totalSessions: total,
      avgScore: Math.round(scoreSum / total),
      passRate: Math.round((passedCount / total) * 100),
      totalMissed: missedSum,
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white shadow-sm shrink-0">
              <History className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Quiz Session Review &amp; Learning Trajectory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0078D4] border border-blue-200">
                  {totalSessions} Sessions Logged
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                Track your AZ-900 test performance over time. Review missed scenario questions with in-depth concept breakdowns to eliminate recurring knowledge traps.
              </p>
            </div>
          </div>

          {/* Quick Action: Launch New Adaptive Session */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onStartAdaptiveQuiz}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-200" />
              <span>Start Adaptive Quiz</span>
            </button>
          </div>
        </div>

        {/* Trajectory Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Sessions
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalSessions}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Average Score
            </span>
            <span className="text-2xl font-black text-[#0078D4] mt-1 block">
              {avgScore}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Passing Benchmark (70%+)
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {passRate}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Missed Questions Logged
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {totalMissed}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & History List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900">
            Session History Trajectory
          </span>
          <span className="text-xs text-slate-500">
            (Showing {filteredSessions.length} sessions)
          </span>
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('adaptive')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'adaptive'
                ? 'bg-white text-[#0078D4] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adaptive
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('mock')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'mock'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mock Exams
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('practice')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'practice'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Practice Sets
          </button>
        </div>
      </div>

      {/* Session Cards List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              No sessions found in this category
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Complete an adaptive quiz or timed mock exam to automatically record your score and review missed questions here.
            </p>
          </div>
          <button
            onClick={onStartAdaptiveQuiz}
            className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Launch Adaptive Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session, index) => {
            const isExpanded = Boolean(expandedSessionIds[session.id]);
            const isPassing = session.passed;

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden transition-all"
              >
                {/* Session Summary Bar */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl text-white shadow-2xs shrink-0 mt-0.5 ${
                        session.mode === 'adaptive'
                          ? 'bg-gradient-to-br from-[#0078D4] to-blue-600'
                          : session.mode === 'mock'
                          ? 'bg-gradient-to-br from-purple-600 to-indigo-600'
                          : 'bg-gradient-to-br from-amber-600 to-orange-600'
                      }`}
                    >
                      {session.mode === 'adaptive' ? (
                        <Zap className="w-5 h-5 text-amber-200" />
                      ) : session.mode === 'mock' ? (
                        <Award className="w-5 h-5 text-amber-200" />
                      ) : (
                        <BookOpen className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-base text-slate-900">
                          {session.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                            isPassing
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isPassing ? 'Passed (700+ Benchmark)' : 'Needs Review'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.dateStr}</span>
                        </span>
                        {session.durationSeconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                            </span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-slate-700 font-semibold">
                          {session.correctCount} of {session.totalQuestions} questions correct
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Score & Toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="flex items-baseline md:justify-end gap-1.5">
                        <span
                          className={`text-2xl font-black ${
                            isPassing ? 'text-emerald-600' : 'text-[#0078D4]'
                          }`}
                        >
                          {session.scorePercent}%
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          ({session.correctCount}/{session.totalQuestions})
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {session.missedQuestions.length === 0
                          ? '🌟 Perfect score'
                          : `${session.missedQuestions.length} missed question${
                              session.missedQuestions.length > 1 ? 's' : ''
                            }`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete session record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Breakdown of Missed Questions */}
                {isExpanded && (
                  <div className="border-t border-slate-200/80 bg-slate-50/50 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>
                          Questions Missed in this Session ({session.missedQuestions.length})
                        </span>
                      </h5>
                      {session.missedQuestions.length > 0 && (
                        <span className="text-[11px] text-slate-500">
                          Review explanations to lock in the Azure Curriculum concept
                        </span>
                      )}
                    </div>

                    {session.missedQuestions.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>
                          Fantastic job! You answered every question correctly in this session.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {session.missedQuestions.map((q, qIndex) => (
                          <div
                            key={q.questionId || qIndex}
                            className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-2xs"
                          >
                            {/* Question Header & Module Tag */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <span className="text-xs font-bold text-slate-700">
                                Question #{qIndex + 1} •{' '}
                                <span className="text-[#0078D4] font-extrabold">
                                  {q.moduleTitle}
                                </span>{' '}
                                <span className="text-slate-400">({q.learningPathTitle})</span>
                              </span>

                              {onRetryQuestion && (
                                <button
                                  onClick={() => onRetryQuestion(q.questionId)}
                                  className="text-[11px] font-bold text-[#0078D4] hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Practice Question</span>
                                </button>
                              )}
                            </div>

                            {/* Scenario Context */}
                            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-normal">
                              {q.scenario}
                            </p>

                            {/* Specific Question Prompt */}
                            <p className="text-xs font-bold text-slate-900">
                              {q.question}
                            </p>

                            {/* Your Choice vs Correct Choice Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              {/* Wrong Choice */}
                              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold uppercase tracking-wider text-[10px] text-rose-800 block">
                                    Your Answer ({q.selectedAnswer})
                                  </span>
                                  <span className="font-medium mt-0.5 block">
                                    {q.selectedAnswerText || `Choice ${q.selectedAnswer}`}
                                  </span>
                                </div>
                              </div>

                              {/* Correct Choice */}
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-800 block">
                                    Correct Azure Curriculum Answer ({q.correctAnswer})
                                  </span>
                                  <span className="font-medium mt-0.5 block">
                                    {q.correctAnswerText || `Choice ${q.correctAnswer}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Why it's correct concept definition */}
                            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#0078D4] text-[11px] uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Concept Explanation</span>
                              </div>
                              <p className="leading-relaxed text-slate-700">
                                {q.whyCorrect}
                              </p>
                            </div>

                            {/* Exam Memory Anchor Tip */}
                            {q.examTip && (
                              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
                                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-bold text-amber-950">
                                    Exam Anchor Tip:{' '}
                                  </strong>
                                  <span>{q.examTip}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
