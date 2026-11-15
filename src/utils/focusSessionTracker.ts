import { useState, useEffect, useCallback } from 'react';

export interface FocusSessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  durationMinutes: number;
  questionsAnsweredCount: number;
  source: 'manual' | 'prolonged_prompt' | 'floating_toggle' | 'sample';
  notes?: string;
}

export interface WeeklyFocusSummary {
  weekKey: string; // e.g. "2026-W46"
  weekLabel: string; // e.g. "Nov 10 - Nov 16" or "This Week"
  shortLabel: string; // e.g. "Nov 10" or "W46"
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalSeconds: number;
  sessionCount: number;
  averageMinutes: number;
  isCurrentWeek: boolean;
  sessions: FocusSessionRecord[];
}

export interface FocusSessionStats {
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  avgMinutesPerSession: number;
  currentWeekMinutes: number;
  currentWeekSessions: number;
  currentWeekGoalPercent: number; // vs 60m weekly target
  longestSessionMinutes: number;
}

export const FOCUS_SESSIONS_STORAGE_KEY = 'az900_focus_sessions_history_v1';
export const FOCUS_SESSION_EVENT = 'az900-focus-session-recorded';
export const WEEKLY_FOCUS_GOAL_MINUTES = 60; // Standard 1-hour weekly focus goal

/**
 * Returns ISO-like year-week string (e.g., "2026-W46")
 */
function getWeekKey(d: Date): string {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Generates sample focus sessions distributed across the past 6 weeks if user has no recorded sessions yet.
 */
function generateSampleFocusSessions(): FocusSessionRecord[] {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Realistic sample focus sessions:
  // W-5: 2 sessions (18m, 22m = 40m)
  // W-4: 3 sessions (15m, 25m, 30m = 70m)
  // W-3: 2 sessions (20m, 35m = 55m)
  // W-2: 3 sessions (28m, 18m, 24m = 70m)
  // W-1: 3 sessions (32m, 20m, 25m = 77m)
  // W-0 (current): 2 sessions (22m, 26m = 48m)
  const templateDurations = [
    { daysAgo: 38, mins: 18, qs: 5, src: 'floating_toggle' as const },
    { daysAgo: 35, mins: 22, qs: 6, src: 'manual' as const },
    { daysAgo: 29, mins: 15, qs: 4, src: 'manual' as const },
    { daysAgo: 27, mins: 25, qs: 8, src: 'prolonged_prompt' as const },
    { daysAgo: 25, mins: 30, qs: 10, src: 'floating_toggle' as const },
    { daysAgo: 21, mins: 20, qs: 6, src: 'manual' as const },
    { daysAgo: 18, mins: 35, qs: 11, src: 'manual' as const },
    { daysAgo: 14, mins: 28, qs: 9, src: 'prolonged_prompt' as const },
    { daysAgo: 12, mins: 18, qs: 5, src: 'floating_toggle' as const },
    { daysAgo: 10, mins: 24, qs: 7, src: 'manual' as const },
    { daysAgo: 6, mins: 32, qs: 10, src: 'manual' as const },
    { daysAgo: 4, mins: 20, qs: 6, src: 'prolonged_prompt' as const },
    { daysAgo: 3, mins: 25, qs: 8, src: 'floating_toggle' as const },
    { daysAgo: 1, mins: 22, qs: 7, src: 'manual' as const },
    { daysAgo: 0, mins: 26, qs: 9, src: 'prolonged_prompt' as const },
  ];

  return templateDurations.map((item, idx) => {
    const end = now - item.daysAgo * ONE_DAY_MS - idx * 1000 * 60;
    const durSec = item.mins * 60;
    const start = end - durSec * 1000;
    return {
      id: `sample-focus-${idx + 1}-${start}`,
      startTime: start,
      endTime: end,
      durationSeconds: durSec,
      durationMinutes: item.mins,
      questionsAnsweredCount: item.qs,
      source: item.src,
      notes: 'AZ-900 Distraction-free Study Session',
    };
  });
}

/**
 * Retrieves stored focus sessions from localStorage.
 * Automatically seeds sample data if storage is completely empty.
 */
export function getStoredFocusSessions(): FocusSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY);
    if (!raw) {
      const sample = generateSampleFocusSessions();
      localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(sample));
      return sample;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const sample = generateSampleFocusSessions();
    localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(sample));
    return sample;
  } catch {
    return generateSampleFocusSessions();
  }
}

/**
 * Saves a new completed focus session.
 */
export function recordFocusSession(
  durationSeconds: number,
  questionsAnsweredCount: number,
  source: 'manual' | 'prolonged_prompt' | 'floating_toggle' | 'sample' = 'manual',
  notes?: string
): FocusSessionRecord {
  const now = Date.now();
  const startTime = now - durationSeconds * 1000;
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  const newRecord: FocusSessionRecord = {
    id: `focus-sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    startTime,
    endTime: now,
    durationSeconds,
    durationMinutes,
    questionsAnsweredCount,
    source,
    notes: notes || 'Distraction-free Focus Session',
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredFocusSessions();
      const updated = [newRecord, ...existing];
      localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(updated));

      window.dispatchEvent(
        new CustomEvent<FocusSessionRecord>(FOCUS_SESSION_EVENT, {
          detail: newRecord,
        })
      );
    } catch {
      // ignore storage errors
    }
  }

  return newRecord;
}

/**
 * Clears or resets focus sessions back to sample state.
 */
export function resetFocusSessionsToSample(): FocusSessionRecord[] {
  if (typeof window === 'undefined') return [];
  const sample = generateSampleFocusSessions();
  try {
    localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(sample));
    window.dispatchEvent(new CustomEvent(FOCUS_SESSION_EVENT));
  } catch {
    // ignore
  }
  return sample;
}

/**
 * Groups sessions into weekly summaries for the past N weeks (e.g. 6 weeks).
 */
export function getWeeklyFocusSummaries(
  sessions?: FocusSessionRecord[],
  numWeeks = 6
): WeeklyFocusSummary[] {
  const records = sessions || getStoredFocusSessions();
  const now = new Date();

  // Determine current week key
  const currentWeekKey = getWeekKey(now);

  // Generate slots for the last `numWeeks` weeks
  const weekSlots: WeeklyFocusSummary[] = [];
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = numWeeks - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * ONE_DAY_MS);
    // Adjust to Monday of that week
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d.getTime() - day * ONE_DAY_MS);
    const sunday = new Date(monday.getTime() + 6 * ONE_DAY_MS);

    const weekKey = getWeekKey(monday);
    const isCurrentWeek = weekKey === currentWeekKey;

    const startMonth = monday.toLocaleDateString(undefined, { month: 'short' });
    const endMonth = sunday.toLocaleDateString(undefined, { month: 'short' });
    const weekLabel =
      isCurrentWeek
        ? 'This Week'
        : startMonth === endMonth
        ? `${startMonth} ${monday.getDate()}–${sunday.getDate()}`
        : `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}`;

    const shortLabel = isCurrentWeek ? 'This Wk' : `${startMonth} ${monday.getDate()}`;

    weekSlots.push({
      weekKey,
      weekLabel,
      shortLabel,
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
      totalMinutes: 0,
      totalSeconds: 0,
      sessionCount: 0,
      averageMinutes: 0,
      isCurrentWeek,
      sessions: [],
    });
  }

  // Populate sessions into matching week slots
  const slotMap = new Map<string, WeeklyFocusSummary>();
  weekSlots.forEach((slot) => slotMap.set(slot.weekKey, slot));

  records.forEach((sess) => {
    const sessDate = new Date(sess.endTime || sess.startTime);
    const key = getWeekKey(sessDate);
    const slot = slotMap.get(key);
    if (slot) {
      slot.totalMinutes += sess.durationMinutes;
      slot.totalSeconds += sess.durationSeconds;
      slot.sessionCount += 1;
      slot.sessions.push(sess);
    }
  });

  // Calculate averages
  weekSlots.forEach((slot) => {
    slot.averageMinutes =
      slot.sessionCount > 0 ? Math.round(slot.totalMinutes / slot.sessionCount) : 0;
  });

  return weekSlots;
}

/**
 * Calculates high-level focus session statistics.
 */
export function getFocusSessionStats(sessions?: FocusSessionRecord[]): FocusSessionStats {
  const records = sessions || getStoredFocusSessions();
  const summaries = getWeeklyFocusSummaries(records, 6);
  const currentWeek = summaries.find((s) => s.isCurrentWeek) || summaries[summaries.length - 1];

  let totalMinutes = 0;
  let longestSessionMinutes = 0;

  records.forEach((sess) => {
    totalMinutes += sess.durationMinutes;
    if (sess.durationMinutes > longestSessionMinutes) {
      longestSessionMinutes = sess.durationMinutes;
    }
  });

  const totalSessions = records.length;
  const avgMinutesPerSession =
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  const currentWeekMinutes = currentWeek?.totalMinutes || 0;
  const currentWeekSessions = currentWeek?.sessionCount || 0;
  const currentWeekGoalPercent = Math.min(
    100,
    Math.round((currentWeekMinutes / WEEKLY_FOCUS_GOAL_MINUTES) * 100)
  );

  return {
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    totalSessions,
    avgMinutesPerSession,
    currentWeekMinutes,
    currentWeekSessions,
    currentWeekGoalPercent,
    longestSessionMinutes,
  };
}

/**
 * React hook for consuming and reacting to live focus session updates.
 */
export function useFocusSessionHistory(numWeeks = 6) {
  const [sessions, setSessions] = useState<FocusSessionRecord[]>(getStoredFocusSessions);

  const refreshSessions = useCallback(() => {
    setSessions(getStoredFocusSessions());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      refreshSessions();
    };

    window.addEventListener(FOCUS_SESSION_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(FOCUS_SESSION_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshSessions]);

  const weeklySummaries = getWeeklyFocusSummaries(sessions, numWeeks);
  const stats = getFocusSessionStats(sessions);

  const addManualSession = useCallback(
    (
      minutes: number,
      questionsCount = 5,
      source: 'manual' | 'prolonged_prompt' | 'floating_toggle' = 'manual'
    ) => {
      const rec = recordFocusSession(minutes * 60, questionsCount, source);
      refreshSessions();
      return rec;
    },
    [refreshSessions]
  );

  const resetData = useCallback(() => {
    const sample = resetFocusSessionsToSample();
    setSessions(sample);
  }, []);

  return {
    sessions,
    weeklySummaries,
    stats,
    addManualSession,
    resetData,
    refreshSessions,
  };
}
