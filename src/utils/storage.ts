import { UserStats, QuestionAttempt } from '../types/quiz';

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
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);

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

  // Update mistakes history if incorrect
  let mistakesHistory = stats.mistakesHistory || [];
  if (!attempt.isCorrect) {
    const mistakeEntry = {
      questionId: attempt.questionId,
      moduleId: attempt.moduleId,
      wrongChoice: attempt.selectedAnswer,
      correctChoice: '', // will be resolved if needed
      timestamp: attempt.timestamp,
      trapType: attempt.trapType || 'Conceptual Gap',
    };
    mistakesHistory = [mistakeEntry, ...mistakesHistory.filter(m => m.questionId !== attempt.questionId)].slice(0, 25);
  } else {
    // If user answered correctly, remove from immediate active mistake review
    mistakesHistory = mistakesHistory.filter(m => m.questionId !== attempt.questionId);
  }

  const updated: UserStats = {
    ...stats,
    totalAnswered,
    totalCorrect,
    attempts: newAttempts,
    moduleMastery,
    pathMastery,
    mistakesHistory,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
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
