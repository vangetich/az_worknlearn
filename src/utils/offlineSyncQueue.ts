import { QuizSessionRecord } from '../types/quiz';

export const OFFLINE_SESSIONS_QUEUE_KEY = 'az900_pending_postgres_sessions_v1';
export const OFFLINE_SYNC_STATUS_EVENT = 'az900-offline-sync-status';
export const QUIZ_SESSION_COMPLETED_EVENT = 'az900-quiz-session-completed';

export interface PendingOfflineQuizSession {
  id: string;
  title: string;
  mode: QuizSessionRecord['mode'];
  questionsAnswered: number;
  correctCount: number;
  scorePercent: number;
  completedAt: number;
}

export type OfflineSyncPhase = 'idle' | 'queued' | 'syncing' | 'synced';

export interface OfflineSyncStatusDetail {
  phase: OfflineSyncPhase;
  pendingCount: number;
  syncedCount?: number;
  syncedTitles?: string[];
  syncedAt?: number;
}

let activeFlushPromise: Promise<number> | null = null;

export function getPendingOfflineSessions(): PendingOfflineQuizSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_SESSIONS_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingOfflineSessions(list: PendingOfflineQuizSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (list.length === 0) {
      localStorage.removeItem(OFFLINE_SESSIONS_QUEUE_KEY);
    } else {
      localStorage.setItem(OFFLINE_SESSIONS_QUEUE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to persist pending offline quiz sessions:', e);
  }
}

export function dispatchOfflineSyncStatus(detail: OfflineSyncStatusDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<OfflineSyncStatusDetail>(OFFLINE_SYNC_STATUS_EVENT, {
      detail,
    })
  );
}

/**
 * Queues a completed quiz session in localStorage so it will be pushed to Postgres
 * automatically as soon as connectivity is restored.
 */
export function enqueueOfflineQuizSession(
  session: QuizSessionRecord
): PendingOfflineQuizSession[] {
  const current = getPendingOfflineSessions();
  if (current.some((s) => s.id === session.id)) {
    return current;
  }

  const entry: PendingOfflineQuizSession = {
    id: session.id,
    title: session.title,
    mode: session.mode,
    questionsAnswered: Math.max(1, session.totalQuestions),
    correctCount: Math.max(0, session.correctCount),
    scorePercent: session.scorePercent,
    completedAt: session.timestamp || Date.now(),
  };

  const next = [...current, entry].slice(-50);
  writePendingOfflineSessions(next);

  dispatchOfflineSyncStatus({
    phase: 'queued',
    pendingCount: next.length,
  });

  return next;
}

/**
 * Flushes all queued offline quiz sessions sequentially using the provided Postgres sync callback.
 * Uses a single-flight lock to avoid duplicate pushes on simultaneous reconnect/focus events.
 */
export async function flushOfflineSessionsToPostgres(
  pushSessionToPostgres: (session: PendingOfflineQuizSession) => Promise<void>
): Promise<number> {
  if (activeFlushPromise) {
    return activeFlushPromise;
  }

  const initialPending = getPendingOfflineSessions();
  if (initialPending.length === 0) {
    return 0;
  }

  activeFlushPromise = (async () => {
    const queue = getPendingOfflineSessions();
    if (queue.length === 0) return 0;

    dispatchOfflineSyncStatus({
      phase: 'syncing',
      pendingCount: queue.length,
    });

    const pushedIds = new Set<string>();
    const pushedTitles: string[] = [];

    for (const item of queue) {
      try {
        await pushSessionToPostgres(item);
        pushedIds.add(item.id);
        pushedTitles.push(item.title);
      } catch {
        // Stop on network failure and keep remaining queued items intact
        break;
      }
    }

    const latestQueue = getPendingOfflineSessions();
    const remaining = latestQueue.filter((item) => !pushedIds.has(item.id));
    writePendingOfflineSessions(remaining);

    if (pushedIds.size > 0) {
      dispatchOfflineSyncStatus({
        phase: 'synced',
        pendingCount: remaining.length,
        syncedCount: pushedIds.size,
        syncedTitles: pushedTitles,
        syncedAt: Date.now(),
      });
    } else {
      dispatchOfflineSyncStatus({
        phase: remaining.length > 0 ? 'queued' : 'idle',
        pendingCount: remaining.length,
      });
    }

    return pushedIds.size;
  })().finally(() => {
    activeFlushPromise = null;
  });

  return activeFlushPromise;
}
