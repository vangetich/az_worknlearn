import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  getStoredFocusSessions,
  recordFocusSession,
  getWeeklyFocusSummaries,
  getFocusSessionStats,
  resetFocusSessionsToSample,
  WEEKLY_FOCUS_GOAL_MINUTES,
} from './focusSessionTracker';

// Polyfill window & localStorage for Node test runner
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

afterAll(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
  delete (globalThis as any).CustomEvent;
});

describe('focusSessionTracker utility & D3 analytics', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('automatically seeds sample focus sessions when storage is empty', () => {
    const sessions = getStoredFocusSessions();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0]).toHaveProperty('durationMinutes');
    expect(sessions[0]).toHaveProperty('durationSeconds');
  });

  it('records a new focus session and prepends it to history', () => {
    const newSession = recordFocusSession(1800, 8, 'prolonged_prompt', 'Test Drill');
    expect(newSession.durationMinutes).toBe(30);
    expect(newSession.questionsAnsweredCount).toBe(8);
    expect(newSession.source).toBe('prolonged_prompt');

    const updated = getStoredFocusSessions();
    expect(updated[0].id).toBe(newSession.id);
    expect(updated[0].durationMinutes).toBe(30);
  });

  it('aggregates sessions into weekly summaries for D3 bar chart', () => {
    const summaries = getWeeklyFocusSummaries(undefined, 6);
    expect(summaries).toHaveLength(6);
    expect(summaries[summaries.length - 1].isCurrentWeek).toBe(true);
    expect(summaries[summaries.length - 1].weekLabel).toBe('This Week');

    // Total minutes across summaries should be positive
    const totalMinutes = summaries.reduce((acc, w) => acc + w.totalMinutes, 0);
    expect(totalMinutes).toBeGreaterThan(0);
  });

  it('computes high-level statistics correctly', () => {
    const stats = getFocusSessionStats();
    expect(stats.totalMinutes).toBeGreaterThan(0);
    expect(stats.totalHours).toBeCloseTo(stats.totalMinutes / 60, 1);
    expect(stats.avgMinutesPerSession).toBeGreaterThan(0);
    expect(stats.currentWeekGoalPercent).toBeLessThanOrEqual(100);
  });

  it('resets focus sessions back to sample baseline', () => {
    recordFocusSession(3600, 12, 'manual');
    const sample = resetFocusSessionsToSample();
    expect(sample.length).toBeGreaterThanOrEqual(10);
  });
});
