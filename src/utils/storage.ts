import { UserStats, QuestionAttempt, QuizSessionRecord } from '../types/quiz';

const STORAGE_KEY = 'az900_quiz_builder_stats_v1';

export function getInitialStats(): UserStats {
  const defaultStats: UserStats = {
    totalAnswered: 0,
    totalCorrect: 0,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    dailyGoal: 10,
    bookmarks: [],
    attempts: {},
    moduleMastery: {},
    pathMastery: {
      1: { correct: 0, total: 0 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 },
    },
    completedModules: [],
    reviewedMistakeIds: [],
    reviewedMistakeTimestamps: {},
    confidenceScores: {},
    moduleConfidenceScores: {},
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedGoal = localStorage.getItem('az900_daily_goal');
    const parsedGoal = savedGoal ? parseInt(savedGoal, 10) : null;
    if (parsedGoal && !isNaN(parsedGoal) && parsedGoal > 0) {
      defaultStats.dailyGoal = parsedGoal;
    }

    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);
    if (parsedGoal && !isNaN(parsedGoal) && parsedGoal > 0) {
      parsed.dailyGoal = parsedGoal;
    }

    // Update streak if needed
    const today = new Date().toISOString().split('T')[0];
    if (parsed.lastActiveDate !== today) {
      const last = new Date(parsed.lastActiveDate);
      const diffTime = Math.abs(new Date(today).getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        parsed.streakDays = (parsed.streakDays || 0) + 1;
      } else if (diffDays > 1) {
        parsed.streakDays = 1;
      }
      parsed.lastActiveDate = today;
    }

    return { ...defaultStats, ...parsed };
  } catch (e) {
    console.error('Failed to read stats from localStorage', e);
    return defaultStats;
  }
}

export function saveUserAttempt(
  stats: UserStats,
  attempt: QuestionAttempt
): UserStats {
  const newAttempts = { ...stats.attempts };
  const history = newAttempts[attempt.questionId] || [];
  newAttempts[attempt.questionId] = [...history, attempt];

  // Update overall
  const totalAnswered = stats.totalAnswered + 1;
  const totalCorrect = stats.totalCorrect + (attempt.isCorrect ? 1 : 0);

  // Update module mastery
  const moduleMastery = { ...stats.moduleMastery };
  const currentMod = moduleMastery[attempt.moduleId] || { correct: 0, total: 0 };
  moduleMastery[attempt.moduleId] = {
    correct: currentMod.correct + (attempt.isCorrect ? 1 : 0),
    total: currentMod.total + 1,
  };

  // Update path mastery
  const pathMastery = { ...stats.pathMastery };
  const currentPath = pathMastery[attempt.pathId] || { correct: 0, total: 0 };
  pathMastery[attempt.pathId] = {
    correct: currentPath.correct + (attempt.isCorrect ? 1 : 0),
    total: currentPath.total + 1,
  };

  // Update mistakes history & reviewedMistakeIds
  let mistakesHistory = stats.mistakesHistory || [];
  let reviewedMistakeIds = stats.reviewedMistakeIds || [];
  const reviewedMistakeTimestamps = { ...(stats.reviewedMistakeTimestamps || {}) };

  if (!attempt.isCorrect) {
    const mistakeEntry = {
      questionId: attempt.questionId,
      moduleId: attempt.moduleId,
      wrongChoice: attempt.selectedAnswer,
      correctChoice: '', // will be resolved if needed
      timestamp: attempt.timestamp,
      trapType: attempt.trapType || 'Conceptual Gap',
    };
    mistakesHistory = [mistakeEntry, ...mistakesHistory.filter(m => m.questionId !== attempt.questionId)].slice(0, 50);
    // Since user just got it wrong again, remove from reviewedMistakeIds so it appears in review sessions
    reviewedMistakeIds = reviewedMistakeIds.filter(id => id !== attempt.questionId);
    delete reviewedMistakeTimestamps[attempt.questionId];
  } else {
    // If user answered correctly, remove from active mistake review and record as reviewed
    mistakesHistory = mistakesHistory.filter(m => m.questionId !== attempt.questionId);
    if (!reviewedMistakeIds.includes(attempt.questionId)) {
      reviewedMistakeIds = [...reviewedMistakeIds, attempt.questionId];
    }
    reviewedMistakeTimestamps[attempt.questionId] = attempt.timestamp;
  }

  const updated: UserStats = {
    ...stats,
    totalAnswered,
    totalCorrect,
    attempts: newAttempts,
    moduleMastery,
    pathMastery,
    mistakesHistory,
    reviewedMistakeIds,
    reviewedMistakeTimestamps,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('az900_question_completed'));
    }
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  return updated;
}

export function markQuestionReviewedSuccessfully(
  stats: UserStats,
  questionId: string
): UserStats {
  const now = Date.now();
  const mistakesHistory = (stats.mistakesHistory || []).filter(
    (m) => m.questionId !== questionId
  );
  const existingReviewed = stats.reviewedMistakeIds || [];
  const reviewedMistakeIds = existingReviewed.includes(questionId)
    ? existingReviewed
    : [...existingReviewed, questionId];
  const reviewedMistakeTimestamps = {
    ...(stats.reviewedMistakeTimestamps || {}),
    [questionId]: now,
  };

  const updated: UserStats = {
    ...stats,
    mistakesHistory,
    reviewedMistakeIds,
    reviewedMistakeTimestamps,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save reviewed mistake status', e);
  }

  return updated;
}

export function getUnresolvedMistakesMap(
  stats: UserStats
): Map<string, { lastWrongAnswer: string; timestamp: number; trapType?: string }> {
  const wrongMap = new Map<
    string,
    { lastWrongAnswer: string; timestamp: number; trapType?: string }
  >();
  const reviewedSet = new Set(stats.reviewedMistakeIds || []);
  const reviewedTimestamps = stats.reviewedMistakeTimestamps || {};

  // 1. Check stats.attempts
  if (stats.attempts) {
    Object.entries(stats.attempts).forEach(([qId, attempts]) => {
      if (attempts && attempts.length > 0) {
        const sorted = [...attempts].sort((a, b) => b.timestamp - a.timestamp);
        const latest = sorted[0];
        const reviewedAt = reviewedTimestamps[qId] || 0;
        if (!latest.isCorrect && (!reviewedSet.has(qId) || latest.timestamp > reviewedAt)) {
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
      const reviewedAt = reviewedTimestamps[m.questionId] || 0;
      if (reviewedSet.has(m.questionId) && m.timestamp <= reviewedAt) {
        return;
      }
      // Also check if latest attempt in stats.attempts was actually correct
      const qAttempts = stats.attempts?.[m.questionId];
      if (qAttempts && qAttempts.length > 0) {
        const latest = [...qAttempts].sort((a, b) => b.timestamp - a.timestamp)[0];
        if (latest.isCorrect && latest.timestamp >= m.timestamp) {
          return;
        }
      }
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

  return wrongMap;
}

export function getUnresolvedMissedQuestionsCount(stats: UserStats): number {
  return getUnresolvedMistakesMap(stats).size;
}

export function toggleModuleCompletion(
  stats: UserStats,
  moduleId: number
): UserStats {
  const current = stats.completedModules || [];
  const exists = current.includes(moduleId);
  const completedModules = exists
    ? current.filter((id) => id !== moduleId)
    : [...current, moduleId].sort((a, b) => a - b);

  const updated: UserStats = {
    ...stats,
    completedModules,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save module completion', e);
  }

  return updated;
}

export function toggleBookmark(stats: UserStats, questionId: string): UserStats {
  const exists = stats.bookmarks.includes(questionId);
  const bookmarks = exists
    ? stats.bookmarks.filter((id) => id !== questionId)
    : [...stats.bookmarks, questionId];

  const updated: UserStats = {
    ...stats,
    bookmarks,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save bookmark', e);
  }

  return updated;
}

export function setDailyGoal(stats: UserStats, goal: number): UserStats {
  const safeGoal = Math.max(1, Math.min(100, Math.round(goal)));
  const updated: UserStats = {
    ...stats,
    dailyGoal: safeGoal,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('az900_daily_goal', safeGoal.toString());
  } catch (e) {
    console.error('Failed to save daily goal', e);
  }

  return updated;
}

export function calculateDomainConfidence(
  correct: number,
  total: number
): { percentage: number; rating: 'Needs Review' | 'Developing' | 'Solid' | 'Exam Ready'; color: string } {
  if (total === 0) {
    return { percentage: 0, rating: 'Needs Review', color: '#94A3B8' };
  }
  const percentage = Math.round((correct / total) * 100);

  if (percentage >= 85) {
    return { percentage, rating: 'Exam Ready', color: '#16A34A' };
  } else if (percentage >= 70) {
    return { percentage, rating: 'Solid', color: '#0078D4' };
  } else if (percentage >= 50) {
    return { percentage, rating: 'Developing', color: '#D97706' };
  } else {
    return { percentage, rating: 'Needs Review', color: '#C2410C' };
  }
}

/**
 * Resets confidence and attempt history for a specific module without clearing the entire app data
 */
export function resetModuleConfidence(
  stats: UserStats,
  moduleId: number
): UserStats {
  // 1. Filter out attempts belonging to this moduleId
  const newAttempts: Record<string, QuestionAttempt[]> = {};
  Object.entries(stats.attempts || {}).forEach(([qId, list]) => {
    const kept = list.filter((a) => a.moduleId !== moduleId);
    if (kept.length > 0) {
      newAttempts[qId] = kept;
    }
  });

  // 2. Clear module mastery entry for this module
  const newModuleMastery = { ...stats.moduleMastery };
  delete newModuleMastery[moduleId];

  // 3. Recalculate pathMastery, totalAnswered, and totalCorrect from remaining attempts
  const newPathMastery: Record<number, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
  };
  let newTotalAnswered = 0;
  let newTotalCorrect = 0;

  Object.values(newAttempts).forEach((list) => {
    list.forEach((att) => {
      newTotalAnswered += 1;
      if (att.isCorrect) newTotalCorrect += 1;
      if (newPathMastery[att.pathId]) {
        newPathMastery[att.pathId].total += 1;
        if (att.isCorrect) newPathMastery[att.pathId].correct += 1;
      }
    });
  });

  // 4. Clean mistakes history for this module
  const newMistakes = (stats.mistakesHistory || []).filter(
    (m) => m.moduleId !== moduleId
  );

  const updated: UserStats = {
    ...stats,
    totalAnswered: newTotalAnswered,
    totalCorrect: newTotalCorrect,
    attempts: newAttempts,
    moduleMastery: newModuleMastery,
    pathMastery: newPathMastery,
    mistakesHistory: newMistakes,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save reset module stats', e);
  }

  return updated;
}

const SESSIONS_STORAGE_KEY = 'az900_quiz_sessions_v1';

export function getPastQuizSessions(): QuizSessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read quiz sessions', e);
  }

  // Provide initial baseline session for realistic trajectory demonstration if first time
  const baselineSessions: QuizSessionRecord[] = [
    {
      id: 'session-demo-1',
      timestamp: Date.now() - 1000 * 60 * 60 * 22,
      dateStr: new Date(Date.now() - 1000 * 60 * 60 * 22).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: 'Adaptive Sprint • Cloud Architecture & Services',
      mode: 'adaptive',
      totalQuestions: 10,
      correctCount: 8,
      scorePercent: 80,
      passed: true,
      durationSeconds: 380,
      missedQuestions: [
        {
          questionId: 'm4-q2',
          scenario: 'A retail company needs to connect their on-premises datacenter to Azure over a dedicated private connection that completely bypasses the public internet with speeds up to 100 Gbps.',
          question: 'Which Azure hybrid networking service should they deploy to meet these requirements?',
          selectedAnswer: 'B',
          selectedAnswerText: 'Azure VPN Gateway with IPsec',
          correctAnswer: 'A',
          correctAnswerText: 'Azure ExpressRoute',
          whyCorrect: 'Azure ExpressRoute provides dedicated, private layer 3 connectivity directly to Microsoft cloud services bypassing the public Internet, supporting high bandwidth up to 100 Gbps.',
          examTip: 'Exam Anchor: Whenever a scenario demands bypassing the public internet with dedicated bandwidth, the answer is always ExpressRoute.',
          moduleId: 4,
          moduleTitle: 'Azure Networking Core',
          learningPathTitle: 'Azure Architecture & Services',
        },
        {
          questionId: 'm5-q1',
          scenario: 'An accounting firm requires high-durability storage in a single region that protects against localized datacenter outages by synchronously replicating data across three separate physical availability zones.',
          question: 'Which Azure Storage redundancy tier must be configured?',
          selectedAnswer: 'A',
          selectedAnswerText: 'Locally Redundant Storage (LRS)',
          correctAnswer: 'B',
          correctAnswerText: 'Zone-Redundant Storage (ZRS)',
          whyCorrect: 'Zone-Redundant Storage (ZRS) synchronously replicates data across three Azure availability zones in the primary region, safeguarding data against datacenter-level hardware failures.',
          examTip: 'Remember: LRS = 1 datacenter, 3 copies. ZRS = 3 zones, 1 region. GRS = 2 regions, 6 copies.',
          moduleId: 5,
          moduleTitle: 'Azure Storage & Redundancy',
          learningPathTitle: 'Azure Architecture & Services',
        },
      ],
    },
    {
      id: 'session-demo-2',
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
      dateStr: new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: 'Practice Drill • Cloud Concepts & Shared Responsibility',
      mode: 'practice',
      totalQuestions: 8,
      correctCount: 7,
      scorePercent: 88,
      passed: true,
      durationSeconds: 240,
      missedQuestions: [
        {
          questionId: 'm1-q3',
          scenario: 'An IT director asks who is responsible for physical server hardware maintenance and host operating system patching when deploying Azure SQL Database.',
          question: 'Under the cloud Shared Responsibility Model, which party owns host maintenance in a PaaS model?',
          selectedAnswer: 'A',
          selectedAnswerText: 'The Customer',
          correctAnswer: 'B',
          correctAnswerText: 'The Cloud Provider (Microsoft)',
          whyCorrect: 'In Platform as a Service (PaaS), the cloud provider manages physical hardware, network infrastructure, virtualization layer, and operating system updates.',
          examTip: 'PaaS Rule: Customer only manages data, application code, and user identity.',
          moduleId: 1,
          moduleTitle: 'Cloud Models & Benefits',
          learningPathTitle: 'Cloud Concepts',
        },
      ],
    },
  ];

  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(baselineSessions));
  } catch (e) {}

  return baselineSessions;
}

export function saveQuizSession(session: QuizSessionRecord): QuizSessionRecord[] {
  const current = getPastQuizSessions();
  const updated = [session, ...current.filter((s) => s.id !== session.id)].slice(0, 50);

  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quiz session to localStorage', e);
  }

  return updated;
}

export function deleteQuizSession(sessionId: string): QuizSessionRecord[] {
  const current = getPastQuizSessions();
  const updated = current.filter((s) => s.id !== sessionId);

  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete quiz session', e);
  }

  return updated;
}

const QUESTION_NOTES_STORAGE_KEY = 'az900_question_notes_v1';

export function getQuestionNote(questionId: string): string {
  try {
    const raw = localStorage.getItem(QUESTION_NOTES_STORAGE_KEY);
    if (raw) {
      const notes = JSON.parse(raw);
      return notes[questionId] || '';
    }
  } catch (e) {
    console.error('Failed to get question note', e);
  }
  return '';
}

export function saveQuestionNote(questionId: string, text: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(QUESTION_NOTES_STORAGE_KEY);
    const notes: Record<string, string> = raw ? JSON.parse(raw) : {};
    const trimmed = text.trim();
    if (trimmed) {
      notes[questionId] = trimmed;
    } else {
      delete notes[questionId];
    }
    localStorage.setItem(QUESTION_NOTES_STORAGE_KEY, JSON.stringify(notes));
    return notes;
  } catch (e) {
    console.error('Failed to save question note', e);
    return {};
  }
}

export function getAllQuestionNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(QUESTION_NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveQuestionConfidence(
  stats: UserStats,
  questionId: string,
  confidence: number
): UserStats {
  const confidenceScores = {
    ...(stats.confidenceScores || {}),
    [questionId]: confidence,
  };
  const updated: UserStats = {
    ...stats,
    confidenceScores,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save confidence score', e);
  }
  return updated;
}

export function saveModuleConfidence(
  stats: UserStats,
  moduleId: number,
  confidence: number
): UserStats {
  const moduleConfidenceScores = {
    ...(stats.moduleConfidenceScores || {}),
    [moduleId]: confidence,
  };
  const updated: UserStats = {
    ...stats,
    moduleConfidenceScores,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save module confidence score', e);
  }
  return updated;
}



