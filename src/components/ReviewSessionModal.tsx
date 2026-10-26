import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Layers,
  ListChecks,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, UserStats } from '../types/quiz';
import { getUnresolvedMistakesMap } from '../utils/storage';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

interface ReviewSessionModalProps {
  stats: UserStats;
  allQuestions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onAnswerQuestion: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onMarkQuestionReviewed?: (questionId: string) => void;
}

interface QuestionReviewItem {
  question: Question;
  lastWrongAnswer: string;
  timestamp: number;
  trapType?: string;
  isResolved: boolean;
}

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
  stats,
  allQuestions,
  isOpen,
  onClose,
  onAnswerQuestion,
  onMarkQuestionReviewed,
}) => {
  // Presentation mode: 'step' (1-by-1 Personalized Review Session) or 'list' (All Wrong Questions)
  const [presentationMode, setPresentationMode] = useState<'step' | 'list'>('step');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Track inline re-testing state per questionId
  const [activeRetestId, setActiveRetestId] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [retestResults, setRetestResults] = useState<
    Record<string, { isCorrect: boolean; submitted: boolean; feedback?: string }>
  >({});

  // Track questions reviewed during THIS modal session so user sees immediate confirmation
  // before they vanish from future review sessions
  const [sessionSnapshotItems, setSessionSnapshotItems] = useState<
    Array<{ questionId: string; lastWrongAnswer: string; timestamp: number; trapType?: string }>
  >([]);
  const [resolvedInCurrentSession, setResolvedInCurrentSession] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'resolved'>('all');

  // Whenever the modal opens, snapshot the current unresolved wrong questions
  // so that questions reviewed in PREVIOUS sessions are excluded, while questions
  // reviewed in THIS session can show a "Removed from Future Sessions ✓" badge until closed.
  useEffect(() => {
    if (isOpen) {
      const unresolvedMap = getUnresolvedMistakesMap(stats);
      const sortedEntries = Array.from(unresolvedMap.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .map(([questionId, data]) => ({
          questionId,
          lastWrongAnswer: data.lastWrongAnswer,
          timestamp: data.timestamp,
          trapType: data.trapType,
        }));
      setSessionSnapshotItems(sortedEntries);
      setResolvedInCurrentSession(new Set());
      setSelectedChoices({});
      setRetestResults({});
      setActiveRetestId(null);
      setCurrentStepIndex(0);
      setFilterMode('all');
    }
    // Only snapshot when modal transitions to open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Also include any brand-new mistakes if stats updates while open
  const missedQuestionsList: QuestionReviewItem[] = useMemo(() => {
    const liveUnresolved = getUnresolvedMistakesMap(stats);
    const mergedMap = new Map<
      string,
      { lastWrongAnswer: string; timestamp: number; trapType?: string }
    >();

    sessionSnapshotItems.forEach((item) => {
      mergedMap.set(item.questionId, {
        lastWrongAnswer: item.lastWrongAnswer,
        timestamp: item.timestamp,
        trapType: item.trapType,
      });
    });

    liveUnresolved.forEach((val, qId) => {
      if (!mergedMap.has(qId)) {
        mergedMap.set(qId, val);
      }
    });

    const items: QuestionReviewItem[] = [];
    for (const [qId, data] of mergedMap.entries()) {
      const q = allQuestions.find((item) => item.id === qId);
      if (q) {
        const isResolved =
          resolvedInCurrentSession.has(qId) || !liveUnresolved.has(qId);
        items.push({
          question: q,
          lastWrongAnswer: data.lastWrongAnswer,
          timestamp: data.timestamp,
          trapType: data.trapType || q.errorDiagnostic?.trapType,
          isResolved,
        });
      }
    }

    return items;
  }, [sessionSnapshotItems, stats, allQuestions, resolvedInCurrentSession]);

  if (!isOpen) return null;

  const totalMissedCount = missedQuestionsList.length;
  const verifiedCount = missedQuestionsList.filter((m) => m.isResolved).length;
  const pendingCount = totalMissedCount - verifiedCount;
  const totalHistoricallyReviewedCount = (stats.reviewedMistakeIds || []).length;

  const filteredList = missedQuestionsList.filter((item) => {
    if (filterMode === 'pending') return !item.isResolved;
    if (filterMode === 'resolved') return item.isResolved;
    return true;
  });

  const safeStepIndex = Math.min(
    currentStepIndex,
    Math.max(0, missedQuestionsList.length - 1)
  );
  const currentStepItem = missedQuestionsList[safeStepIndex];

  const handleSelectChoice = (questionId: string, choiceLetter: string) => {
    setSelectedChoices((prev) => ({ ...prev, [questionId]: choiceLetter }));
  };

  const handleMarkReviewedSuccess = (question: Question, chosenAnswer?: string) => {
    setResolvedInCurrentSession((prev) => new Set(prev).add(question.id));
    if (onMarkQuestionReviewed) {
      onMarkQuestionReviewed(question.id);
    } else {
      onAnswerQuestion(question.id, chosenAnswer || question.correctAnswer, true);
    }
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore confetti errors
    }
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
      setResolvedInCurrentSession((prev) => new Set(prev).add(question.id));
      onAnswerQuestion(question.id, chosen, true);
      if (onMarkQuestionReviewed) {
        onMarkQuestionReviewed(question.id);
      }
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
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

  const renderQuestionReviewCard = (item: QuestionReviewItem, index: number) => {
    const q = item.question;
    const isRetestOpen = activeRetestId === q.id;
    const isResolved = item.isResolved;
    const selectedChoice = selectedChoices[q.id];
    const result = retestResults[q.id];

    const wrongOptionObj = q.options.find((o) => o.letter === item.lastWrongAnswer);
    const correctOptionObj = q.options.find((o) => o.letter === q.correctAnswer);
    const specificDistractorReason = q.distractorBreakdown.find(
      (d) => d.letter === item.lastWrongAnswer
    )?.reason;

    return (
      <div
        key={q.id}
        className={`rounded-2xl border transition-all shadow-2xs overflow-hidden ${
          isResolved
            ? 'border-emerald-300 bg-emerald-50/25'
            : 'border-slate-200/90 bg-white'
        }`}
      >
        {/* Card Top Header */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-2xs">
              #{index + 1}
            </span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
              Path {q.learningPathId} • Module {q.moduleId}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {q.moduleTitle}
            </span>
            {item.trapType && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                Weakness Area: {item.trapType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isResolved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reviewed &amp; Removed from Future Sessions ✓</span>
              </span>
            ) : (
              <>
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
                  <span>{isRetestOpen ? 'Hide Interactive Re-Test' : 'Re-Test Yourself'}</span>
                  {isRetestOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkReviewedSuccess(q)}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Mark this missed question as reviewed and remove it from future Personalized Review Sessions"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Reviewed &amp; Mastered</span>
                </button>
              </>
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

          {/* Side-by-Side Comparison: What You Answered Wrong vs. Correct Answer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* User's Wrong Choice */}
            <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Your Incorrect Answer: Option {item.lastWrongAnswer}</span>
                </span>
                <span className="text-[11px] text-rose-700 font-medium">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {wrongOptionObj && (
                <p className="text-xs font-bold text-rose-950 bg-white/80 p-2 rounded-lg border border-rose-200/60">
                  {wrongOptionObj.letter}. {wrongOptionObj.text}
                </p>
              )}
              {specificDistractorReason && (
                <p className="text-xs text-rose-800 leading-relaxed pt-0.5">
                  <strong className="font-bold">Why it was wrong:</strong> {specificDistractorReason}
                </p>
              )}
            </div>

            {/* Official Correct Answer */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Correct Answer: Option {q.correctAnswer}</span>
              </div>
              {correctOptionObj && (
                <p className="text-xs font-bold text-emerald-950 bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                  {correctOptionObj.letter}. {correctOptionObj.text}
                </p>
              )}
              <p className="text-xs text-emerald-800 leading-relaxed pt-0.5">
                <strong className="font-bold">Key Takeaway:</strong> Matches all architectural and governance constraints in the scenario.
              </p>
            </div>
          </div>

          {/* Full Explanation & Distractor Breakdown (Always visible in Personalized Review Session) */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0078D4]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Architectural Explanation (Why Option {q.correctAnswer} is Correct)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {q.whyCorrect}
              </p>
            </div>

            {q.distractorBreakdown && q.distractorBreakdown.length > 0 && (
              <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                  Complete Option &amp; Distractor Breakdown:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.distractorBreakdown.map((d) => (
                    <div
                      key={d.letter}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed"
                    >
                      <strong className="text-rose-700 font-bold">
                        Option {d.letter}:
                      </strong>{' '}
                      {d.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Anchor Tip */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold uppercase tracking-wider text-[11px] text-amber-900 block">
                  Official Exam Anchor Tip
                </strong>
                <span>{q.examTip}</span>
              </div>
            </div>
          </div>

          {/* Optional Interactive Re-Test Container */}
          {isRetestOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Interactive Knowledge Verification</span>
                </span>
                <span className="text-[11px] text-slate-300">
                  Answer correctly to mark as reviewed and remove from future sessions
                </span>
              </div>

              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isChosen = selectedChoice === opt.letter;
                  const isCorrectOpt = opt.letter === q.correctAnswer;
                  const isSubmitted = result?.submitted;

                  let optionClasses =
                    'bg-slate-800 border-slate-700 text-slate-100 hover:border-sky-400';
                  if (isSubmitted) {
                    if (isCorrectOpt) {
                      optionClasses =
                        'bg-emerald-900/80 border-emerald-400 text-emerald-100 font-bold';
                    } else if (isChosen && !isCorrectOpt) {
                      optionClasses =
                        'bg-rose-900/80 border-rose-400 text-rose-100';
                    }
                  } else if (isChosen) {
                    optionClasses =
                      'bg-[#0078D4] text-white border-sky-300 font-bold shadow-2xs';
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
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {opt.letter}
                      </span>
                      <span className="flex-1 mt-0.5">{opt.text}</span>
                      {isSubmitted && isCorrectOpt && (
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {!result?.submitted ? (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveRetestId(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={!selectedChoice}
                    onClick={() => handleExecuteRetest(q)}
                    className="px-5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Submit Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {result.isCorrect ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>
                          Verified! This question has been removed from future review sessions.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Not quite. Review the explanation above and try again.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResetQuestionRetest(q.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Try Again</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      ariaLabel="Personalized Review Session"
    >
        <div className="shrink-0">
          <KitengeRibbon height={4} />
        </div>

        {/* Modal Header */}
        <div className="shrink-0 px-4 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-600 text-white shadow-md">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl tracking-tight">
                  Personalized Review Session
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-400 text-slate-950">
                  {pendingCount} Active Mistake{pendingCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-blue-200/90">
                Presenting only the questions you got wrong with full architectural explanations. Reviewed questions are automatically removed from future sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalMissedCount > 0 && (
              <div className="flex items-center p-0.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPresentationMode('step')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    presentationMode === 'step'
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Guided Step-by-Step</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPresentationMode('list')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    presentationMode === 'list'
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>All Missed ({totalMissedCount})</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Personalized Review Session"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Status Strip & Filter Controls */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Needs Review: {pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reviewed This Session: {verifiedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Total Mastered &amp; Removed All-Time: {totalHistoricallyReviewedCount}</span>
            </div>
          </div>

          {presentationMode === 'list' && totalMissedCount > 0 && (
            <div className="flex items-center p-0.5 bg-white rounded-lg border border-slate-200 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
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
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterMode === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unreviewed ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('resolved')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterMode === 'resolved'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reviewed ({verifiedCount})
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {totalMissedCount === 0 ? (
            /* Empty state when user has no unresolved missed questions */
            <div className="text-center py-12 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">
                  Hongera! Zero Unresolved Missed Questions
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have reviewed and mastered all previously missed questions ({totalHistoricallyReviewedCount} removed from review queue). If you answer any future quiz questions incorrectly, they will automatically appear here with full architectural explanations.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Return to Practice Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : presentationMode === 'step' && currentStepItem ? (
            <div className="space-y-4">
              {/* Step Progress Bar & Question Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-700 mr-1">
                    Missed Question {safeStepIndex + 1} of {missedQuestionsList.length}:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {missedQuestionsList.map((mItem, idx) => (
                      <button
                        key={mItem.question.id}
                        type="button"
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border transition-all cursor-pointer ${
                          idx === safeStepIndex
                            ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                            : mItem.isResolved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Missed Question #${idx + 1} (${mItem.isResolved ? 'Reviewed' : 'Needs Review'})`}
                      >
                        {mItem.isResolved ? '✓' : idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeStepIndex === 0}
                    onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    disabled={safeStepIndex >= missedQuestionsList.length - 1}
                    onClick={() =>
                      setCurrentStepIndex((p) =>
                        Math.min(missedQuestionsList.length - 1, p + 1)
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {renderQuestionReviewCard(currentStepItem, safeStepIndex)}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No questions match the &ldquo;{filterMode}&rdquo; filter.
            </div>
          ) : (
            <div className="space-y-5">
              {filteredList.map((item, idx) => renderQuestionReviewCard(item, idx))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <MaasaiMedallion size={18} />
            <span>
              Once marked as reviewed or answered correctly in Re-Test, questions are automatically removed from future review sessions.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Done with Review Session
          </button>
        </div>
    </ResponsiveModalContainer>
  );
};
