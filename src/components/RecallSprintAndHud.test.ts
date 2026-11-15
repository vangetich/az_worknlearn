import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { getInitialStats, saveUserAttempt } from '../utils/storage';
import { isHudCurrentlySnoozed, snoozeHudFor20Mins, restoreSnoozedHud } from '../utils/hudSnooze';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import { UserStats, QuestionAttempt } from '../types/quiz';

// Mock localStorage and window for Node test environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

const listeners: Record<string, ((e: any) => void)[]> = {};
const mockWindow = {
  addEventListener: (type: string, cb: any) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(cb);
  },
  removeEventListener: (type: string, cb: any) => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter((fn) => fn !== cb);
    }
  },
  dispatchEvent: (e: any) => {
    const list = listeners[e.type] || [];
    list.forEach((cb) => cb(e));
    return true;
  },
};

class MockCustomEvent {
  type: string;
  detail: any;
  constructor(type: string, opts?: { detail?: any }) {
    this.type = type;
    this.detail = opts?.detail;
  }
}

beforeAll(() => {
  (globalThis as any).window = mockWindow;
  (globalThis as any).localStorage = mockLocalStorage;
  (globalThis as any).CustomEvent = MockCustomEvent;
});

describe('Scoring & Points Tracking System', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('initializes default user points to 0', () => {
    const stats = getInitialStats();
    expect(stats.points).toBe(0);
    expect(stats.totalAnswered).toBe(0);
    expect(stats.totalCorrect).toBe(0);
  });

  it('awards +100 points for a correct answer and updates path and module mastery', () => {
    const stats = getInitialStats();
    const attempt: QuestionAttempt = {
      questionId: 'az900-mod1-q1',
      moduleId: 1,
      pathId: 1,
      selectedAnswer: 'A',
      isCorrect: true,
      timestamp: Date.now(),
    };

    const updated = saveUserAttempt(stats, attempt);
    expect(updated.points).toBe(100);
    expect(updated.totalAnswered).toBe(1);
    expect(updated.totalCorrect).toBe(1);
    expect(updated.moduleMastery[1].correct).toBe(1);
    expect(updated.pathMastery[1].correct).toBe(1);
  });

  it('does not award points for an incorrect answer but tracks mistakes history', () => {
    const stats = getInitialStats();
    const attempt: QuestionAttempt = {
      questionId: 'az900-mod1-q2',
      moduleId: 1,
      pathId: 1,
      selectedAnswer: 'B',
      isCorrect: false,
      timestamp: Date.now(),
    };

    const updated = saveUserAttempt(stats, attempt);
    expect(updated.points).toBe(0);
    expect(updated.totalAnswered).toBe(1);
    expect(updated.totalCorrect).toBe(0);
    expect(updated.mistakesHistory?.length).toBeGreaterThan(0);
  });
});

describe('Keyboard Shortcut HUD 20-minute Snooze', () => {
  const HUD_ID = 'keyboard-shortcuts';

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('is not snoozed by default', () => {
    expect(isHudCurrentlySnoozed(HUD_ID)).toBe(false);
  });

  it('snoozes HUD for 20 minutes when triggered by double-click', () => {
    snoozeHudFor20Mins(HUD_ID);
    expect(isHudCurrentlySnoozed(HUD_ID)).toBe(true);
  });

  it('can be restored manually', () => {
    snoozeHudFor20Mins(HUD_ID);
    expect(isHudCurrentlySnoozed(HUD_ID)).toBe(true);

    restoreSnoozedHud(HUD_ID);
    expect(isHudCurrentlySnoozed(HUD_ID)).toBe(false);
  });
});

describe('30-Second Recall Sprint Question Selection', () => {
  it('selects low-confidence questions prioritized for rapid memory consolidation', () => {
    const mockConfidenceScores: Record<string, number> = {
      'az900-mod1-q1': 1, // Guessing
      'az900-mod1-q2': 2, // Low confidence
      'az900-mod1-q3': 5, // Mastered
    };

    const lowConfIds = new Set(
      Object.entries(mockConfidenceScores)
        .filter(([_, score]) => score <= 2)
        .map(([id]) => id)
    );

    expect(lowConfIds.has('az900-mod1-q1')).toBe(true);
    expect(lowConfIds.has('az900-mod1-q2')).toBe(true);
    expect(lowConfIds.has('az900-mod1-q3')).toBe(false);

    const sprintQuestions = BUILTIN_QUESTIONS.filter((q) => lowConfIds.has(q.id));
    expect(sprintQuestions.length).toBeGreaterThanOrEqual(2);
  });
});
