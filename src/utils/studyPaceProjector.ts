import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats, QuizSessionRecord } from '../types/quiz';
import { getPastQuizSessions } from './storage';
import { getStoredPathStudySeconds } from '../components/BalancedPathIntensityCoach';

export interface ModuleStudyProjection {
  moduleId: number;
  pathId: 1 | 2 | 3;
  title: string;
  examWeight: string;
  accuracyPct: number | null;
  attemptedCount: number;
  totalQuestionsInBank: number;
  isCompleted: boolean;
  unresolvedMistakes: number;
  baselineHoursRemaining: number;
  estimatedHoursRemaining: number;
  rationale: string;
  isAiRefined: boolean;
}

export interface StudyPaceSummary {
  avgSecondsPerQuestion: number;
  questionsPerHour: number;
  sessionsAnalyzed: number;
  totalTimedQuestions: number;
  totalObservedMinutes: number;
  overallAccuracyPct: number;
  totalAnswered: number;
  streakDays: number;
  dailyGoal: number;
  defaultProfileLabel: string;
  totalHoursRemaining: number;
  pathHoursRemaining: Record<1 | 2 | 3, number>;
}

export interface StudyPaceProjectionResult {
  aiPowered: boolean;
  paceSummary: StudyPaceSummary;
  paceProfileLabel: string;
  overallCoachingNote: string;
  recommendedDailyMinutes: number;
  moduleProjections: Record<number, ModuleStudyProjection>;
  signature: string;
}

const AI_PACE_CACHE_PREFIX = 'az900_ai_pace_projection_v1_';

export function computeBaselinePaceProjection(
  stats: UserStats,
  questionCountByModule: Record<number, number> = {}
): StudyPaceProjectionResult {
  const pastSessions: QuizSessionRecord[] = getPastQuizSessions();
  const pathStudySeconds = getStoredPathStudySeconds();
  const completedSet = new Set<number>(stats.completedModules || []);
  const reviewedSet = new Set<string>(stats.reviewedMistakeIds || []);

  // 1. Analyze timed historical sessions for pace (seconds per question)
  const timedSessions = pastSessions.filter(
    (s) =>
      typeof s.durationSeconds === 'number' &&
      s.durationSeconds > 0 &&
      s.totalQuestions > 0
  );

  let weightedSecSum = 0;
  let totalTimedQuestions = 0;
  timedSessions.forEach((sess, idx) => {
    // Give slightly more weight to recent sessions (index 0 is newest)
    const recencyWeight = idx < 3 ? 1.4 : 1.0;
    const clampedSessSec = Math.max(
      sess.totalQuestions * 15,
      Math.min(sess.totalQuestions * 240, sess.durationSeconds || 0)
    );
    weightedSecSum += clampedSessSec * recencyWeight;
    totalTimedQuestions += sess.totalQuestions * recencyWeight;
  });

  const rawAvgSecPerQ =
    totalTimedQuestions > 0 ? weightedSecSum / totalTimedQuestions : 45;
  const avgSecondsPerQuestion = Math.max(20, Math.min(180, Math.round(rawAvgSecPerQ)));
  const questionsPerHour = Math.max(20, Math.round(3600 / avgSecondsPerQuestion));

  const sessionDurationTotalSec = timedSessions.reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const pathTimerTotalSec =
    (pathStudySeconds[1] || 0) +
    (pathStudySeconds[2] || 0) +
    (pathStudySeconds[3] || 0);
  const totalObservedMinutes = Math.round(
    (sessionDurationTotalSec + pathTimerTotalSec) / 60
  );

  const overallAccuracyPct =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const paceFactor = avgSecondsPerQuestion / 45; // 1.0 = ~45s/Q baseline

  // Count unresolved mistakes per module
  const unresolvedByModule: Record<number, number> = {};
  (stats.mistakesHistory || []).forEach((m) => {
    if (!reviewedSet.has(m.questionId)) {
      unresolvedByModule[m.moduleId] = (unresolvedByModule[m.moduleId] || 0) + 1;
    }
  });

  // Also count missed questions from most recent session if unresolved
  if (pastSessions[0]?.missedQuestions) {
    pastSessions[0].missedQuestions.forEach((mq) => {
      if (!reviewedSet.has(mq.questionId) && !unresolvedByModule[mq.moduleId]) {
        unresolvedByModule[mq.moduleId] = 1;
      }
    });
  }

  const moduleProjections: Record<number, ModuleStudyProjection> = {};
  const pathHoursRemaining: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };

  for (const path of LEARNING_PATHS) {
    for (const mod of path.modules) {
      const mastery = stats.moduleMastery?.[mod.id];
      const attemptedCount = mastery?.total || 0;
      const accuracyPct =
        attemptedCount > 0
          ? Math.round(((mastery?.correct || 0) / attemptedCount) * 100)
          : null;
      const isCompleted = completedSet.has(mod.id);
      const totalQuestionsInBank = Math.max(8, questionCountByModule[mod.id] || 10);
      const unresolvedMistakes = unresolvedByModule[mod.id] || 0;

      // Curriculum depth hours: reading units + conceptual review + drill practice
      const unitEffortHrs = Math.max(0.8, mod.units.length * 0.28);
      const drillBaselineHrs = (totalQuestionsInBank * avgSecondsPerQuestion * 1.35) / 3600;
      const fullModuleHrs = unitEffortHrs + drillBaselineHrs;

      let remainingHrs = 0;
      let defaultRationale = '';

      if (isCompleted && (accuracyPct === null || accuracyPct >= 80) && unresolvedMistakes === 0) {
        remainingHrs = 0;
        defaultRationale = `Module complete${
          accuracyPct !== null ? ` at ${accuracyPct}% mastery` : ''
        } with 0 unresolved mistakes.`;
      } else if (isCompleted) {
        // Marked complete, yet accuracy < 80% or unresolved traps remain
        const polishHrs = Math.max(
          0.2,
          ((80 - Math.min(80, accuracyPct ?? 70)) / 100) * 0.8 +
            unresolvedMistakes * 0.12
        );
        remainingHrs = Math.min(1.5, Math.round(polishHrs * paceFactor * 10) / 10);
        defaultRationale = `Marked done, but ${
          accuracyPct !== null ? `${accuracyPct}% accuracy` : 'pending review'
        } suggests a brief targeted recap.`;
      } else if (accuracyPct === null || attemptedCount === 0) {
        // Unstarted module scaled by user's observed question speed
        remainingHrs = Math.max(
          0.8,
          Math.min(3.5, Math.round(fullModuleHrs * (0.75 + 0.25 * paceFactor) * 10) / 10)
        );
        defaultRationale = `Not yet started — covers ${mod.units.length} curriculum units at your ${avgSecondsPerQuestion}s/Q pace.`;
      } else {
        // Active in-progress module: scale by progress coverage, accuracy gap, and unresolved mistakes
        const coverageRatio = Math.min(0.85, attemptedCount / totalQuestionsInBank);
        const accuracyMultiplier =
          accuracyPct >= 80
            ? 0.55
            : accuracyPct >= 70
            ? 0.85
            : accuracyPct >= 55
            ? 1.15
            : 1.35;
        const mistakeRemediationHrs = unresolvedMistakes * 0.15;
        const raw =
          fullModuleHrs * (1 - coverageRatio * 0.65) * accuracyMultiplier +
          mistakeRemediationHrs;
        remainingHrs = Math.max(0.2, Math.min(3.5, Math.round(raw * 10) / 10));
        defaultRationale =
          accuracyPct < 75
            ? `${accuracyPct}% accuracy across ${attemptedCount} Qs — includes remediation time for ${unresolvedMistakes} missed concept(s).`
            : `Strong ${accuracyPct}% accuracy on ${attemptedCount} Qs — finish remaining scenarios to lock in 80%+ mastery.`;
      }

      pathHoursRemaining[path.id] =
        Math.round((pathHoursRemaining[path.id] + remainingHrs) * 10) / 10;

      moduleProjections[mod.id] = {
        moduleId: mod.id,
        pathId: path.id,
        title: mod.title,
        examWeight: path.examWeight,
        accuracyPct,
        attemptedCount,
        totalQuestionsInBank,
        isCompleted,
        unresolvedMistakes,
        baselineHoursRemaining: remainingHrs,
        estimatedHoursRemaining: remainingHrs,
        rationale: defaultRationale,
        isAiRefined: false,
      };
    }
  }

  const totalHoursRemaining =
    Math.round(
      (pathHoursRemaining[1] + pathHoursRemaining[2] + pathHoursRemaining[3]) * 10
    ) / 10;

  const defaultProfileLabel =
    avgSecondsPerQuestion <= 35 && overallAccuracyPct >= 75
      ? 'Rapid High-Accuracy Sprinter'
      : avgSecondsPerQuestion <= 45
      ? 'Steady Exam Pacer'
      : overallAccuracyPct >= 75
      ? 'Methodical Deep Learner'
      : 'Foundational Concept Builder';

  const dailyGoal = stats.dailyGoal || 10;
  const recommendedDailyMinutes = Math.max(
    15,
    Math.min(90, Math.round((dailyGoal * avgSecondsPerQuestion) / 60))
  );

  const signature = `${stats.totalAnswered}:${stats.totalCorrect}:${completedSet.size}:${pastSessions.length}:${Math.round(avgSecondsPerQuestion)}`;

  return {
    aiPowered: false,
    paceSummary: {
      avgSecondsPerQuestion,
      questionsPerHour,
      sessionsAnalyzed: timedSessions.length,
      totalTimedQuestions: Math.round(totalTimedQuestions),
      totalObservedMinutes,
      overallAccuracyPct,
      totalAnswered: stats.totalAnswered,
      streakDays: stats.streakDays || 1,
      dailyGoal,
      defaultProfileLabel,
      totalHoursRemaining,
      pathHoursRemaining,
    },
    paceProfileLabel: defaultProfileLabel,
    overallCoachingNote:
      totalHoursRemaining === 0
        ? 'All 12 modules are complete at exam mastery — maintain readiness with timed mock exams.'
        : `At your observed pace of ${avgSecondsPerQuestion}s/question (${questionsPerHour} Qs/hr across ${timedSessions.length} past session${
            timedSessions.length === 1 ? '' : 's'
          }), you have ~${totalHoursRemaining}h of focused study left.`,
    recommendedDailyMinutes,
    moduleProjections,
    signature,
  };
}

export async function fetchAiStudyPaceProjection(
  baseline: StudyPaceProjectionResult,
  forceRefresh = false
): Promise<StudyPaceProjectionResult> {
  const cacheKey = `${AI_PACE_CACHE_PREFIX}${baseline.signature}`;

  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached) as StudyPaceProjectionResult;
      }
    } catch {
      // ignore storage errors
    }
  }

  const modulesTelemetry = Object.values(baseline.moduleProjections).map((m) => ({
    moduleId: m.moduleId,
    title: m.title,
    pathId: m.pathId,
    examWeight: m.examWeight,
    accuracyPct: m.accuracyPct,
    attemptedCount: m.attemptedCount,
    totalQuestionsInBank: m.totalQuestionsInBank,
    isCompleted: m.isCompleted,
    unresolvedMistakes: m.unresolvedMistakes,
    baselineHoursRemaining: m.baselineHoursRemaining,
    defaultRationale: m.rationale,
  }));

  const response = await fetch('/api/ai/study-pace-projection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paceSummary: baseline.paceSummary,
      modulesTelemetry,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `AI projection failed (${response.status})`);
  }

  const data = await response.json();
  const updatedModules: Record<number, ModuleStudyProjection> = {
    ...baseline.moduleProjections,
  };
  const updatedPathHours: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };

  if (Array.isArray(data.moduleProjections)) {
    for (const aiMod of data.moduleProjections) {
      const existing = updatedModules[aiMod.moduleId];
      if (existing) {
        updatedModules[aiMod.moduleId] = {
          ...existing,
          estimatedHoursRemaining:
            typeof aiMod.estimatedHoursRemaining === 'number'
              ? Math.max(0, Math.round(aiMod.estimatedHoursRemaining * 10) / 10)
              : existing.baselineHoursRemaining,
          rationale: aiMod.rationale || existing.rationale,
          isAiRefined: Boolean(data.aiPowered),
        };
      }
    }
  }

  Object.values(updatedModules).forEach((m) => {
    updatedPathHours[m.pathId] =
      Math.round((updatedPathHours[m.pathId] + m.estimatedHoursRemaining) * 10) / 10;
  });

  const totalHoursRemaining =
    Math.round(
      (updatedPathHours[1] + updatedPathHours[2] + updatedPathHours[3]) * 10
    ) / 10;

  const merged: StudyPaceProjectionResult = {
    aiPowered: Boolean(data.aiPowered),
    paceSummary: {
      ...baseline.paceSummary,
      totalHoursRemaining,
      pathHoursRemaining: updatedPathHours,
    },
    paceProfileLabel: data.paceProfileLabel || baseline.paceProfileLabel,
    overallCoachingNote: data.overallCoachingNote || baseline.overallCoachingNote,
    recommendedDailyMinutes:
      typeof data.recommendedDailyMinutes === 'number'
        ? data.recommendedDailyMinutes
        : baseline.recommendedDailyMinutes,
    moduleProjections: updatedModules,
    signature: baseline.signature,
  };

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(merged));
    } catch {
      // ignore storage errors
    }
  }

  return merged;
}
