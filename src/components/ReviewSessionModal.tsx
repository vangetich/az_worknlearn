import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Question, UserStats, QuestionAttempt } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface ReviewSessionModalProps {
  stats: UserStats;
  allQuestions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onAnswerQuestion: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
}

interface QuestionReviewItem {
  question: Question;
  lastWrongAnswer: string;
  timestamp: number;
  trapType?: string;
  isResolved?: boolean;
}

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
  stats,
  allQuestions,
  isOpen,
  onClose,
  onAnswerQuestion,
}) => {
  // Track inline re-testing state per questionId
  const [activeRetestId, setActiveRetestId] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [retestResults, setRetestResults] = useState<
    Record<string, { isCorrect: boolean; submitted: boolean; feedback?: string }>
  >({});
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'resolved'>('all');

  // Extract last 10 incorrectly answered questions
  const missedQuestionsList: QuestionReviewItem[] = useMemo(() => {
    const wrongMap = new Map<string, { lastWrongAnswer: string; timestamp: number; trapType?: string }>();

    // 1. Check stats.attempts
    if (stats.attempts) {
      Object.entries(stats.attempts).forEach(([qId, attempts]) => {
        // Find latest attempt
        if (attempts && attempts.length > 0) {
          const sorted = [...attempts].sort((a, b) => b.timestamp - a.timestamp);
          const latest = sorted[0];
          // If latest attempt is wrong, or if there's any wrong attempt that hasn't been re-verified
          if (!latest.isCorrect) {
            wrongMap.set(qId, {
              lastWrongAnswer: latest.selectedAnswer,
              timestamp: latest.timestamp,
              trapType: latest.trapType,
            });
          }
        }
      });
    }

    // 2. Check stats.mistakesHistory
    if (stats.mistakesHistory && stats.mistakesHistory.length > 0) {
      stats.mistakesHistory.forEach((m) => {
        const existing = wrongMap.get(m.questionId);
        if (!existing || m.timestamp > existing.timestamp) {
          wrongMap.set(m.questionId, {
            lastWrongAnswer: m.wrongChoice,
            timestamp: m.timestamp,
            trapType: m.trapType,
          });
        }
      });
    }

    // Convert to array, sort by timestamp descending, take top 10
    const sortedEntries = Array.from(wrongMap.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 10);

    const items: QuestionReviewItem[] = [];
    for (const [qId, data] of sortedEntries) {
      const q = allQuestions.find((item) => item.id === qId);
      if (q) {
        items.push({
          question: q,
          lastWrongAnswer: data.lastWrongAnswer,
          timestamp: data.timestamp,
          trapType: data.trapType || q.errorDiagnostic?.trapType,
          isResolved: resolvedIds.has(qId),
        });
      }
    }

    // Fallback: if user hasn't made mistakes yet, or has fewer than 10, fill with questions if they want to test
    return items;
  }, [stats.attempts, stats.mistakesHistory, allQuestions, resolvedIds]);

  if (!isOpen) return null;

  const totalMissedCount = missedQuestionsList.length;
  const verifiedCount = missedQuestionsList.filter((m) => resolvedIds.has(m.question.id)).length;
  const pendingCount = totalMissedCount - verifiedCount;

  const filteredList = missedQuestionsList.filter((item) => {
    const isRes = resolvedIds.has(item.question.id);
    if (filterMode === 'pending') return !isRes;
    if (filterMode === 'resolved') return isRes;
    return true;
  });

  const handleSelectChoice = (questionId: string, choiceLetter: string) => {
    setSelectedChoices((prev) => ({ ...prev, [questionId]: choiceLetter }));
  };

  const handleExecuteRetest = (question: Question) => {
    const chosen = selectedChoices[question.id];
    if (!chosen) return;

    const isCorrect = chosen === question.correctAnswer;
    setRetestResults((prev) => ({
      ...prev,
      [question.id]: {
        isCorrect,
        submitted: true,
        feedback: isCorrect ? question.whyCorrect : undefined,
      },
    }));

    if (isCorrect) {
      setResolvedIds((prev) => new Set(prev).add(question.id));
      onAnswerQuestion(question.id, chosen, true);
    } else {
      onAnswerQuestion(question.id, chosen, false);
    }
  };

  const handleResetQuestionRetest = (questionId: string) => {
    setSelectedChoices((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setRetestResults((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden card-elevation">
        {/* Kitenge Accent Ribbon */}
        <KitengeRibbon height={4} />

        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-600 text-white shadow-md">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl tracking-tight">
                  Review Session
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                  Last 10 Missed Questions
                </span>
              </div>
              <p className="text-xs text-blue-200/90">
                Re-test and re-verify your architectural mastery on previously missed questions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close review session"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Status Strip & Filter Pills */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Target Queue: {totalMissedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Re-Verified: {verifiedCount}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pending: {pendingCount}</span>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-0.5 bg-white rounded-lg border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterMode === 'all'
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalMissedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterMode === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('resolved')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterMode === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Re-Verified ({verifiedCount})
            </button>
          </div>
        </div>

        {/* Scrollable Questions List Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {totalMissedCount === 0 ? (
            /* Empty state when user has no missed questions */
            <div className="text-center py-12 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Hongera! Zero Unresolved Mistakes
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You currently have no recorded missed questions in your active session. Keep testing your knowledge in the Practice Quiz or Timed Mock Exam!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold shadow-md transition-colors inline-flex items-center gap-2"
              >
                <span>Continue Practice Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No questions match the "{filterMode}" filter.
            </div>
          ) : (
            filteredList.map((item, index) => {
              const q = item.question;
              const isRetestOpen = activeRetestId === q.id;
              const isResolved = resolvedIds.has(q.id);
              const selectedChoice = selectedChoices[q.id];
              const result = retestResults[q.id];

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                    isResolved
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-200/90 bg-white hover:border-blue-300'
                  }`}
                >
                  {/* Card Top Header */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                        Path {q.learningPathId} • Module {q.moduleId}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                        {q.moduleTitle}
                      </span>
                      {item.trapType && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Trap: {item.trapType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Knowledge Re-Verified ✓</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveRetestId(isRetestOpen ? null : q.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                            isRetestOpen
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                              : 'bg-[#0078D4] hover:bg-[#005A9E] text-white'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isRetestOpen ? 'Close Re-Test' : 'Re-Test Question'}</span>
                          {isRetestOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Scenario Context */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      <span className="font-bold text-slate-900 block mb-1">
                        Scenario Context:
                      </span>
                      {q.scenario}
                    </div>

                    {/* Question Statement */}
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    {/* Previous Mistake Notice */}
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-900">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong className="font-bold">Previously Chose:</strong> Option{' '}
                          <span className="font-black uppercase">{item.lastWrongAnswer}</span> (Incorrect)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Inline Re-Test Interactive Container */}
                    {isRetestOpen && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4 animate-in slide-in-from-top-3 duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#0078D4]" />
                            <span>Interactive Re-Test Mode</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Select the architectural solution and confirm
                          </span>
                        </div>

                        {/* Options Grid */}
                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const isChosen = selectedChoice === opt.letter;
                            const isCorrectOpt = opt.letter === q.correctAnswer;
                            const isSubmitted = result?.submitted;

                            let optionClasses = 'bg-white border-slate-200 text-slate-800 hover:border-blue-400';
                            if (isSubmitted) {
                              if (isCorrectOpt) {
                                optionClasses = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                              } else if (isChosen && !isCorrectOpt) {
                                optionClasses = 'bg-rose-100 border-rose-400 text-rose-950';
                              }
                            } else if (isChosen) {
                              optionClasses = 'bg-[#0078D4] text-white border-[#0078D4] font-bold shadow-2xs';
                            }

                            return (
                              <button
                                key={opt.letter}
                                type="button"
                                disabled={isSubmitted && result.isCorrect}
                                onClick={() => !isSubmitted && handleSelectChoice(q.id, opt.letter)}
                                className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionClasses}`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                    isChosen && !isSubmitted
                                      ? 'bg-white text-[#0078D4]'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {opt.letter}
                                </span>
                                <span className="flex-1 mt-0.5">{opt.text}</span>
                                {isSubmitted && isCorrectOpt && (
                                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Re-test Action Buttons & Feedback */}
                        {!result?.submitted ? (
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setActiveRetestId(null)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!selectedChoice}
                              onClick={() => handleExecuteRetest(q)}
                              className="px-5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Verify Knowledge</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-2">
                            {result.isCorrect ? (
                              <div className="p-4 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 space-y-2">
                                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-emerald-900">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                                  <span>Hongera! Re-Test Succeeded — Concept Mastered!</span>
                                </div>
                                <p className="text-xs text-emerald-900 leading-relaxed font-normal">
                                  {q.whyCorrect}
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-950 space-y-2">
                                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-rose-900">
                                  <XCircle className="w-5 h-5 text-rose-700" />
                                  <span>Incorrect. Let's inspect the architectural explanation:</span>
                                </div>
                                <p className="text-xs text-rose-900 leading-relaxed font-normal">
                                  {q.whyCorrect}
                                </p>
                                <div className="pt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleResetQuestionRetest(q.id)}
                                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Try Re-Testing Again</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* If question was resolved, show permanent verification banner */}
                    {isResolved && !isRetestOpen && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            Verified Correct Answer: Option <strong>{q.correctAnswer}</strong>. Mastery restored!
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveRetestId(q.id)}
                          className="text-xs font-bold text-emerald-800 hover:underline"
                        >
                          Review details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <MaasaiMedallion size={18} />
            <span>
              Harambee Diagnostic Review: Retesting reinforces long-term synaptic retention for AZ-900.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Finished Review
          </button>
        </div>
      </div>
    </div>
  );
};
