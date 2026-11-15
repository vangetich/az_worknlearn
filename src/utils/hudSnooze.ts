import { useState, useEffect, useCallback } from 'react';

export type HudId = 'rolling-accuracy' | 'confidence-streak' | 'quick-retry' | 'keyboard-shortcuts';

export interface HudSnoozeMap {
  'rolling-accuracy'?: number;
  'confidence-streak'?: number;
  'quick-retry'?: number;
  'keyboard-shortcuts'?: number;
}

export const HUD_SNOOZE_DURATION_MS = 20 * 60 * 1000; // 20 minutes
const HUD_SNOOZE_STORAGE_KEY = 'az900_hud_snooze_until_v1';
const HUD_SNOOZE_EVENT = 'az900-hud-snooze-changed';

export const NOTIFICATIONS_SUPPRESSED_STORAGE_KEY = 'az900_notifications_suppressed_until_v1';
export const NOTIFICATIONS_SUPPRESSION_EVENT = 'az900-notifications-suppression-changed';

export interface HudSnoozeEventDetail {
  map: HudSnoozeMap;
  lastSnoozedLabel?: string;
}

export interface NotificationsSuppressionEventDetail {
  suppressedUntil: number | null;
  reason?: string;
}

export function getStoredHudSnoozeMap(): HudSnoozeMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(HUD_SNOOZE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HudSnoozeMap;
    const now = Date.now();
    const cleaned: HudSnoozeMap = {};
    (['rolling-accuracy', 'confidence-streak', 'quick-retry', 'keyboard-shortcuts'] as HudId[]).forEach(
      (id) => {
        const until = parsed?.[id];
        if (typeof until === 'number' && until > now) {
          cleaned[id] = until;
        }
      }
    );
    return cleaned;
  } catch {
    return {};
  }
}

export function isHudCurrentlySnoozed(target: HudId): boolean {
  if (typeof window === 'undefined') return false;
  const map = getStoredHudSnoozeMap();
  const until = map[target];
  return typeof until === 'number' && until > Date.now();
}

export function getStoredNotificationsSuppressedUntil(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_SUPPRESSED_STORAGE_KEY);
    if (!raw) return null;
    const val = Number(raw);
    if (!isNaN(val) && val > Date.now()) {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

export function areNotificationsSuppressedNow(): boolean {
  const until = getStoredNotificationsSuppressedUntil();
  return typeof until === 'number' && until > Date.now();
}

export function suppressNotificationsFor20Mins(reason?: string): number {
  if (typeof window === 'undefined') return 0;
  const expiresAt = Date.now() + HUD_SNOOZE_DURATION_MS;
  try {
    localStorage.setItem(NOTIFICATIONS_SUPPRESSED_STORAGE_KEY, String(expiresAt));
  } catch {
    // ignore
  }

  window.dispatchEvent(
    new CustomEvent<NotificationsSuppressionEventDetail>(NOTIFICATIONS_SUPPRESSION_EVENT, {
      detail: {
        suppressedUntil: expiresAt,
        reason: reason || 'Notifications suppressed for 20 minutes to reduce information density',
      },
    })
  );

  return expiresAt;
}

export function restoreNotifications(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(NOTIFICATIONS_SUPPRESSED_STORAGE_KEY);
  } catch {
    // ignore
  }

  window.dispatchEvent(
    new CustomEvent<NotificationsSuppressionEventDetail>(NOTIFICATIONS_SUPPRESSION_EVENT, {
      detail: {
        suppressedUntil: null,
      },
    })
  );
}

export function snoozeHudFor20Mins(
  target: HudId | 'all',
  label?: string
): HudSnoozeMap {
  if (typeof window === 'undefined') return {};
  const current = getStoredHudSnoozeMap();
  const expiresAt = Date.now() + HUD_SNOOZE_DURATION_MS;
  const next: HudSnoozeMap = { ...current };

  if (target === 'all') {
    next['rolling-accuracy'] = expiresAt;
    next['confidence-streak'] = expiresAt;
    next['quick-retry'] = expiresAt;
    suppressNotificationsFor20Mins('All HUDs hidden & notifications suppressed for 20 minutes');
  } else {
    next[target] = expiresAt;
    if (target === 'quick-retry') {
      suppressNotificationsFor20Mins(
        label || 'Quick-Retry HUD hidden & all notifications suppressed for 20 minutes'
      );
    }
  }

  try {
    localStorage.setItem(HUD_SNOOZE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(
    new CustomEvent<HudSnoozeEventDetail>(HUD_SNOOZE_EVENT, {
      detail: {
        map: next,
        lastSnoozedLabel:
          label ||
          (target === 'all'
            ? 'All HUDs hidden & notifications suppressed for 20 minutes'
            : target === 'rolling-accuracy'
            ? 'Rolling Accuracy HUD hidden for 20 minutes'
            : target === 'confidence-streak'
            ? 'Confidence Streak HUD hidden for 20 minutes'
            : 'Quick-Retry HUD hidden & all notifications suppressed for 20 mins'),
      },
    })
  );

  return next;
}

export function restoreSnoozedHud(target: HudId | 'all'): HudSnoozeMap {
  if (typeof window === 'undefined') return {};
  const current = getStoredHudSnoozeMap();
  const next: HudSnoozeMap = { ...current };

  if (target === 'all') {
    delete next['rolling-accuracy'];
    delete next['confidence-streak'];
    delete next['quick-retry'];
    restoreNotifications();
  } else {
    delete next[target];
    if (target === 'quick-retry') {
      restoreNotifications();
    }
  }

  try {
    localStorage.setItem(HUD_SNOOZE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(
    new CustomEvent<HudSnoozeEventDetail>(HUD_SNOOZE_EVENT, {
      detail: { map: next },
    })
  );

  return next;
}

/**
 * Double-click toggle interaction on Quick-Retry HUD:
 * Toggles its visibility and suppresses all notifications for 20 minutes to reduce information density.
 * If currently active -> hides Quick-Retry HUD and suppresses all notifications for 20 mins.
 * If currently snoozed -> restores Quick-Retry HUD and restores notifications.
 */
export function toggleQuickRetryHudAndNotifications(): { isSnoozed: boolean; message: string } {
  if (typeof window === 'undefined') return { isSnoozed: false, message: '' };
  const currentMap = getStoredHudSnoozeMap();
  const now = Date.now();
  const isCurrentlySnoozed = typeof currentMap['quick-retry'] === 'number' && currentMap['quick-retry'] > now;

  if (isCurrentlySnoozed) {
    // Toggle ON: restore Quick-Retry and restore notifications
    restoreSnoozedHud('quick-retry');
    restoreNotifications();
    const msg = 'Quick-Retry HUD restored & notifications enabled';
    window.dispatchEvent(
      new CustomEvent<HudSnoozeEventDetail>(HUD_SNOOZE_EVENT, {
        detail: {
          map: getStoredHudSnoozeMap(),
          lastSnoozedLabel: msg,
        },
      })
    );
    return { isSnoozed: false, message: msg };
  } else {
    // Toggle OFF: hide Quick-Retry HUD and suppress all notifications for 20 minutes
    suppressNotificationsFor20Mins('Quick-Retry HUD toggled off & all notifications suppressed for 20 minutes');
    const msg = 'Quick-Retry HUD hidden & all notifications suppressed for 20 mins';
    snoozeHudFor20Mins('quick-retry', msg);
    return { isSnoozed: true, message: msg };
  }
}

export function useHudSnooze() {
  const [snoozeMap, setSnoozeMap] = useState<HudSnoozeMap>(getStoredHudSnoozeMap);
  const [notificationsSuppressedUntil, setNotificationsSuppressedUntil] = useState<number | null>(
    getStoredNotificationsSuppressedUntil
  );
  const [snoozeToast, setSnoozeToast] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const handleSnoozeUpdate = (e: Event) => {
      const custom = e as CustomEvent<HudSnoozeEventDetail>;
      setSnoozeMap(custom.detail?.map ?? getStoredHudSnoozeMap());
      setNowMs(Date.now());
      if (custom.detail?.lastSnoozedLabel) {
        setSnoozeToast(custom.detail.lastSnoozedLabel);
      }
    };

    const handleNotificationsUpdate = (e: Event) => {
      const custom = e as CustomEvent<NotificationsSuppressionEventDetail>;
      setNotificationsSuppressedUntil(custom.detail?.suppressedUntil ?? getStoredNotificationsSuppressedUntil());
      setNowMs(Date.now());
      if (custom.detail?.reason) {
        setSnoozeToast(custom.detail.reason);
      }
    };

    window.addEventListener(HUD_SNOOZE_EVENT, handleSnoozeUpdate);
    window.addEventListener(NOTIFICATIONS_SUPPRESSION_EVENT, handleNotificationsUpdate);
    return () => {
      window.removeEventListener(HUD_SNOOZE_EVENT, handleSnoozeUpdate);
      window.removeEventListener(NOTIFICATIONS_SUPPRESSION_EVENT, handleNotificationsUpdate);
    };
  }, []);

  useEffect(() => {
    if (!snoozeToast) return;
    const t = window.setTimeout(() => setSnoozeToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [snoozeToast]);

  // Periodically check expiration so snoozed HUDs & suppressed notifications automatically restore after 20 minutes
  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      setSnoozeMap(getStoredHudSnoozeMap());
      setNotificationsSuppressedUntil(getStoredNotificationsSuppressedUntil());
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const isHudSnoozed = useCallback(
    (id: HudId): boolean => {
      const until = snoozeMap[id];
      return typeof until === 'number' && until > nowMs;
    },
    [snoozeMap, nowMs]
  );

  const areNotificationsSuppressed = typeof notificationsSuppressedUntil === 'number' && notificationsSuppressedUntil > nowMs;

  const notificationsSuppressedRemainingMins = areNotificationsSuppressed
    ? Math.max(1, Math.ceil(((notificationsSuppressedUntil as number) - nowMs) / 60000))
    : 0;

  const getRemainingMinutes = useCallback(
    (id: HudId): number => {
      const until = snoozeMap[id];
      if (typeof until !== 'number' || until <= nowMs) return 0;
      return Math.max(1, Math.ceil((until - nowMs) / 60000));
    },
    [snoozeMap, nowMs]
  );

  const toggleQuickRetryWithNotificationSuppression = useCallback(() => {
    const res = toggleQuickRetryHudAndNotifications();
    setSnoozeToast(res.message);
    setSnoozeMap(getStoredHudSnoozeMap());
    setNotificationsSuppressedUntil(getStoredNotificationsSuppressedUntil());
    setNowMs(Date.now());
    return res.isSnoozed;
  }, []);

  return {
    snoozeMap,
    isHudSnoozed,
    getRemainingMinutes,
    areNotificationsSuppressed,
    notificationsSuppressedRemainingMins,
    snoozeHudFor20Mins,
    restoreSnoozedHud,
    suppressNotificationsFor20Mins,
    restoreNotifications,
    toggleQuickRetryWithNotificationSuppression,
    snoozeToast,
    dismissSnoozeToast: () => setSnoozeToast(null),
  };
}
