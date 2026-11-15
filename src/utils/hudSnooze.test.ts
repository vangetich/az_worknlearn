import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  snoozeHudFor20Mins,
  restoreSnoozedHud,
  toggleQuickRetryHudAndNotifications,
  areNotificationsSuppressedNow,
  suppressNotificationsFor20Mins,
  restoreNotifications,
  getStoredHudSnoozeMap,
  HUD_SNOOZE_DURATION_MS,
} from './hudSnooze';

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

describe('hudSnooze utility & 20-minute notification suppression', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('initially reports no notifications suppressed and empty snooze map', () => {
    expect(areNotificationsSuppressedNow()).toBe(false);
    expect(getStoredHudSnoozeMap()).toEqual({});
  });

  it('toggles Quick-Retry HUD off and suppresses notifications for 20 minutes on first toggle', () => {
    const res = toggleQuickRetryHudAndNotifications();
    expect(res.isSnoozed).toBe(true);
    expect(areNotificationsSuppressedNow()).toBe(true);

    const map = getStoredHudSnoozeMap();
    expect(typeof map['quick-retry']).toBe('number');
    expect((map['quick-retry'] as number) - Date.now()).toBeGreaterThan(HUD_SNOOZE_DURATION_MS - 5000);
  });

  it('toggles Quick-Retry HUD back on and restores notifications on subsequent toggle', () => {
    // First toggle: OFF
    toggleQuickRetryHudAndNotifications();
    expect(areNotificationsSuppressedNow()).toBe(true);

    // Second toggle: ON
    const res = toggleQuickRetryHudAndNotifications();
    expect(res.isSnoozed).toBe(false);
    expect(areNotificationsSuppressedNow()).toBe(false);

    const map = getStoredHudSnoozeMap();
    expect(map['quick-retry']).toBeUndefined();
  });

  it('suppresses notifications for 20 minutes and can be manually restored', () => {
    suppressNotificationsFor20Mins('Manual suppression');
    expect(areNotificationsSuppressedNow()).toBe(true);

    restoreNotifications();
    expect(areNotificationsSuppressedNow()).toBe(false);
  });

  it('snoozing all HUDs also suppresses notifications, and restoring all restores notifications', () => {
    snoozeHudFor20Mins('all');
    expect(areNotificationsSuppressedNow()).toBe(true);
    const map = getStoredHudSnoozeMap();
    expect(map['rolling-accuracy']).toBeDefined();
    expect(map['confidence-streak']).toBeDefined();
    expect(map['quick-retry']).toBeDefined();

    restoreSnoozedHud('all');
    expect(areNotificationsSuppressedNow()).toBe(false);
    const restoredMap = getStoredHudSnoozeMap();
    expect(restoredMap['quick-retry']).toBeUndefined();
    expect(restoredMap['rolling-accuracy']).toBeUndefined();
  });
});
