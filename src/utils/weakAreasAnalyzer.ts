import { LEARNING_PATHS } from '../data/curriculum';
import { Question, QuestionAttempt, UserStats } from '../types/quiz';

export type ModulePerformanceStatus = 'critical' | 'needs-work' | 'strong' | 'untested';

export interface ModulePerformanceSummary {
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  pathTitle: string;
  keyTerms: string[];
  /** Stats from the just-completed quiz/session */
  sessionCorrect: number;
  sessionTotal: number;
  sessionWrong: number;
  sessionAccuracy: number | null;
  /** Cumulative stats across all sessions */
  overallCorrect: number;
  overallTotal: number;
  overallAccuracy: number;
  /** Blended score used to rank weakest modules accurately */
  effectiveAccuracy: number;
  hasAttempts: boolean;
  skippedCount: number;
  unresolvedMistakesCount: number;
  availableBankQuestions: number;
  status: ModulePerformanceStatus;
}

export interface QuizAnalysisOverview {
  sourceLabel: string;
  analyzedQuestionCount: number;
  sessionCorrectCount: number;
  sessionAccuracy: number;
  attemptedModulesCount: number;
  weakModulesCount: number;
  moduleSummaries: ModulePerformanceSummary[];
  rankedWeakestModules: ModulePerformanceSummary[];
}

/**
 * Analyzes learner performance across all 12 AZ-900 curriculum modules,
 * combining the current/most recent quiz attempts with cumulative mastery.
 */
export function analyzeModulePerformance(
  stats: UserStats,
  sessionAttempts: QuestionAttempt[] = [],
  allQuestions: Question[] = [],
  sourceLabel = 'Recent Quiz Session'
): QuizAnalysisOverview {
  const skippedSet = new Set(stats.skippedQuestionIds || []);
  const reviewedSet = new Set(stats.reviewedMistakeIds || []);

  // Build bank count & skipped count per module
  const bankCountByModule: Record<number, number> = {};
  const skippedCountByModule: Record<number, number> = {};

  allQuestions.forEach((q) => {
    bankCountByModule[q.moduleId] = (bankCountByModule[q.moduleId] || 0) + 1;
    if (skippedSet.has(q.id)) {
      skippedCountByModule[q.moduleId] = (skippedCountByModule[q.moduleId] || 0) + 1;
    }
  });

  // Unresolved historical mistakes per module
  const unresolvedMistakesByModule: Record<number, number> = {};
  (stats.mistakesHistory || []).forEach((m) => {
    if (!reviewedSet.has(m.questionId)) {
      unresolvedMistakesByModule[m.moduleId] =
        (unresolvedMistakesByModule[m.moduleId] || 0) + 1;
    }
  });

  // Fallback per-module cumulative stats computed from stats.attempts if moduleMastery is sparse
  const fallbackAttemptMastery: Record<number, { correct: number; total: number }> = {};
  Object.values(stats.attempts || {}).forEach((attemptList) => {
    attemptList.forEach((att) => {
      if (!fallbackAttemptMastery[att.moduleId]) {
        fallbackAttemptMastery[att.moduleId] = { correct: 0, total: 0 };
      }
      fallbackAttemptMastery[att.moduleId].total += 1;
      if (att.isCorrect) fallbackAttemptMastery[att.moduleId].correct += 1;
    });
  });

  const summaries: ModulePerformanceSummary[] = [];

  LEARNING_PATHS.forEach((path) => {
    path.modules.forEach((mod) => {
      const modSessionAttempts = sessionAttempts.filter((a) => a.moduleId === mod.id);
      const sessionTotal = modSessionAttempts.length;
      const sessionCorrect = modSessionAttempts.filter((a) => a.isCorrect).length;
      const sessionWrong = sessionTotal - sessionCorrect;
      const sessionAccuracy =
        sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : null;

      const mastery = stats.moduleMastery?.[mod.id];
      const fallback = fallbackAttemptMastery[mod.id] || { correct: 0, total: 0 };

      const baseTotal =
        mastery && mastery.total > 0 ? mastery.total : fallback.total;
      const baseCorrect =
        mastery && mastery.total > 0 ? mastery.correct : fallback.correct;

      // Ensure cumulative counts reflect sessionAttempts even if caller hasn't persisted them into stats yet
      const overallTotal = Math.max(baseTotal, sessionTotal);
      const overallCorrect =
        baseTotal >= sessionTotal ? baseCorrect : sessionCorrect;
      const overallAccuracy =
        overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

      const skippedCount = skippedCountByModule[mod.id] || 0;
      const unresolvedMistakesCount = Math.max(
        unresolvedMistakesByModule[mod.id] || 0,
        sessionWrong
      );

      const hasAttempts = sessionTotal > 0 || overallTotal > 0;

      // Blend just-completed quiz accuracy with cumulative mastery so recent quiz struggles
      // immediately surface in Weakest Areas Review even if cumulative history was high.
      let effectiveAccuracy = overallAccuracy;
      if (sessionAccuracy !== null && overallTotal > sessionTotal) {
        effectiveAccuracy = Math.round(sessionAccuracy * 0.65 + overallAccuracy * 0.35);
      } else if (sessionAccuracy !== null) {
        effectiveAccuracy = sessionAccuracy;
      }

      let status: ModulePerformanceStatus = 'untested';
      if (!hasAttempts) {
        status = 'untested';
      } else if (effectiveAccuracy < 50) {
        status = 'critical';
      } else if (effectiveAccuracy < 70) {
        status = 'needs-work';
      } else {
        status = 'strong';
      }

      summaries.push({
        moduleId: mod.id,
        moduleTitle: mod.title,
        pathId: path.id,
        pathTitle: path.title,
        keyTerms: mod.keyTerms,
        sessionCorrect,
        sessionTotal,
        sessionWrong,
        sessionAccuracy,
        overallCorrect,
        overallTotal,
        overallAccuracy,
        effectiveAccuracy,
        hasAttempts,
        skippedCount,
        unresolvedMistakesCount,
        availableBankQuestions: bankCountByModule[mod.id] || 0,
        status,
      });
    });
  });

  const rankedWeakestModules = rankWeakestModules(summaries, { scopedPathId: 'all' });

  const sessionCorrectCount = sessionAttempts.filter((a) => a.isCorrect).length;
  const sessionAccuracy =
    sessionAttempts.length > 0
      ? Math.round((sessionCorrectCount / sessionAttempts.length) * 100)
      : 0;

  return {
    sourceLabel,
    analyzedQuestionCount: sessionAttempts.length,
    sessionCorrectCount,
    sessionAccuracy,
    attemptedModulesCount: summaries.filter((s) => s.hasAttempts).length,
    weakModulesCount: summaries.filter(
      (s) => s.status === 'critical' || s.status === 'needs-work'
    ).length,
    moduleSummaries: summaries,
    rankedWeakestModules,
  };
}

/**
 * Ranks modules from weakest to strongest.
 * Key invariant: Modules where the user has actually scored poorly (or has missed/skipped items)
 * ALWAYS sort ahead of untouched (0/0) modules, avoiding the classic bug where untested modules
 * rank as "0%" above a module where a student scored 25% or 40%.
 */
export function rankWeakestModules(
  summaries: ModulePerformanceSummary[],
  options?: {
    scopedPathId?: 1 | 2 | 3 | 'all';
    limit?: number;
  }
): ModulePerformanceSummary[] {
  const scopedPathId = options?.scopedPathId ?? 'all';
  const filtered =
    scopedPathId === 'all'
      ? [...summaries]
      : summaries.filter((m) => m.pathId === scopedPathId);

  const candidates = filtered.length > 0 ? filtered : [...summaries];

  candidates.sort((a, b) => {
    // 1. Modules with actual attempts or skipped items rank BEFORE purely untested (0/0) modules
    const aHasSignal = a.hasAttempts || a.skippedCount > 0 ? 1 : 0;
    const bHasSignal = b.hasAttempts || b.skippedCount > 0 ? 1 : 0;
    if (aHasSignal !== bHasSignal) {
      return bHasSignal - aHasSignal;
    }

    // 2. If user just finished a quiz, prioritize modules attempted in that quiz that scored < 75%
    const aSessionWeak = a.sessionTotal > 0 && (a.sessionAccuracy ?? 100) < 75 ? 1 : 0;
    const bSessionWeak = b.sessionTotal > 0 && (b.sessionAccuracy ?? 100) < 75 ? 1 : 0;
    if (aSessionWeak !== bSessionWeak) {
      return bSessionWeak - aSessionWeak;
    }

    // 3. Lowest effective accuracy first
    if (a.effectiveAccuracy !== b.effectiveAccuracy) {
      return a.effectiveAccuracy - b.effectiveAccuracy;
    }

    // 4. More missed questions in recent quiz first
    if (a.sessionWrong !== b.sessionWrong) {
      return b.sessionWrong - a.sessionWrong;
    }

    // 5. More skipped / unresolved mistakes first
    const aIssues = a.skippedCount + a.unresolvedMistakesCount;
    const bIssues = b.skippedCount + b.unresolvedMistakesCount;
    if (aIssues !== bIssues) {
      return bIssues - aIssues;
    }

    // 6. More cumulative attempts at the same low score indicates a more persistent gap
    if (a.overallTotal !== b.overallTotal) {
      return b.overallTotal - a.overallTotal;
    }

    return a.moduleId - b.moduleId;
  });

  if (options?.limit && options.limit > 0) {
    return candidates.slice(0, options.limit);
  }
  return candidates;
}

/**
 * Ensures every question object has complete explanation metadata (whyCorrect,
 * option-by-option distractorBreakdown for all non-correct options, and examTip).
 */
export function ensureCompleteExplanations(question: Question): Question {
  const existingBreakdownMap = new Map(
    (question.distractorBreakdown || []).map((d) => [d.letter, d.reason])
  );

  const normalizedBreakdown = question.options
    .filter((opt) => opt.letter !== question.correctAnswer)
    .map((opt) => ({
      letter: opt.letter,
      reason:
        existingBreakdownMap.get(opt.letter) ||
        `"${opt.text}" does not satisfy the scenario requirements for ${question.moduleTitle}. Review how Option ${question.correctAnswer} directly addresses the core Azure capability described.`,
    }));

  return {
    ...question,
    whyCorrect:
      question.whyCorrect && question.whyCorrect.trim().length > 0
        ? question.whyCorrect
        : `Option ${question.correctAnswer} is the official Microsoft Azure recommendation for ${question.moduleTitle}.`,
    distractorBreakdown: normalizedBreakdown,
    examTip:
      question.examTip && question.examTip.trim().length > 0
        ? question.examTip
        : `AZ-900 Exam Rule (${question.moduleTitle}): Focus on matching the scenario's operational requirement to the exact Azure service boundary.`,
  };
}

export interface BuildPracticeSetOptions {
  targetModuleIds: number[];
  allQuestions: Question[];
  stats: UserStats;
  sessionAttempts?: QuestionAttempt[];
  questionCount?: number;
}

/**
 * Selects a balanced practice question set drawn strictly from the user's
 * lowest-scoring modules, prioritizing missed & unseen questions and distributing
 * questions across all target modules in round-robin order.
 */
export function buildWeakestAreasPracticeSet({
  targetModuleIds,
  allQuestions,
  stats,
  sessionAttempts = [],
  questionCount = 8,
}: BuildPracticeSetOptions): Question[] {
  const validModuleIds =
    targetModuleIds.length > 0 ? targetModuleIds : [1, 2, 3];
  const targetSet = new Set(validModuleIds);

  const sessionWrongIds = new Set(
    sessionAttempts.filter((a) => !a.isCorrect).map((a) => a.questionId)
  );
  const skippedIds = new Set(stats.skippedQuestionIds || []);
  const reviewedSet = new Set(stats.reviewedMistakeIds || []);
  const unresolvedMistakeIds = new Set(
    (stats.mistakesHistory || [])
      .filter((m) => !reviewedSet.has(m.questionId))
      .map((m) => m.questionId)
  );

  // Score each question inside target modules by remediation relevance
  const byModuleBuckets: Record<number, Question[]> = {};
  validModuleIds.forEach((id) => {
    byModuleBuckets[id] = [];
  });

  allQuestions.forEach((q) => {
    if (targetSet.has(q.moduleId)) {
      byModuleBuckets[q.moduleId].push(ensureCompleteExplanations(q));
    }
  });

  // Sort each module's question bucket by remediation priority
  validModuleIds.forEach((modId) => {
    byModuleBuckets[modId].sort((a, b) => {
      const scoreQuestion = (q: Question): number => {
        if (sessionWrongIds.has(q.id)) return 100;
        if (skippedIds.has(q.id)) return 85;
        if (unresolvedMistakeIds.has(q.id)) return 75;
        const attempts = stats.attempts?.[q.id] || [];
        if (attempts.length === 0) return 60; // Unseen question for fresh practice
        const latest = [...attempts].sort((x, y) => y.timestamp - x.timestamp)[0];
        if (!latest.isCorrect) return 50;
        return 10; // Previously mastered
      };

      const diff = scoreQuestion(b) - scoreQuestion(a);
      if (diff !== 0) return diff;

      // Prefer Fundamental & Intermediate questions for remediation
      const diffRank = (d: Question['difficulty']) =>
        d === 'Fundamental' ? 0 : d === 'Intermediate' ? 1 : 2;
      return diffRank(a.difficulty) - diffRank(b.difficulty);
    });
  });

  // Round-robin pick across target modules so every weak module gets practice coverage
  const selected: Question[] = [];
  const usedIds = new Set<string>();
  const cursors: Record<number, number> = {};
  validModuleIds.forEach((id) => {
    cursors[id] = 0;
  });

  let progress = true;
  while (selected.length < questionCount && progress) {
    progress = false;
    for (const modId of validModuleIds) {
      if (selected.length >= questionCount) break;
      const bucket = byModuleBuckets[modId] || [];
      while (cursors[modId] < bucket.length && usedIds.has(bucket[cursors[modId]].id)) {
        cursors[modId]++;
      }
      if (cursors[modId] < bucket.length) {
        const picked = bucket[cursors[modId]];
        cursors[modId]++;
        usedIds.add(picked.id);
        selected.push(picked);
        progress = true;
      }
    }
  }

  return selected;
}
