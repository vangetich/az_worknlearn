import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, Database, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  getPendingOfflineSessions,
  OFFLINE_SYNC_STATUS_EVENT,
  OfflineSyncStatusDetail,
} from '../utils/offlineSyncQueue';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(
    () => getPendingOfflineSessions().length
  );
  const [syncAlert, setSyncAlert] = useState<{
    phase: 'syncing' | 'synced';
    count: number;
    titles: string[];
    syncedAt?: number;
  } | null>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<OfflineSyncStatusDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      setPendingCount(detail.pendingCount);

      if (detail.phase === 'syncing') {
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
        }
        setSyncAlert({
          phase: 'syncing',
          count: detail.pendingCount,
          titles: [],
        });
      } else if (detail.phase === 'synced' && (detail.syncedCount || 0) > 0) {
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
        }
        setSyncAlert({
          phase: 'synced',
          count: detail.syncedCount || 1,
          titles: detail.syncedTitles || [],
          syncedAt: detail.syncedAt || Date.now(),
        });
        autoHideTimerRef.current = setTimeout(() => {
          setSyncAlert(null);
        }, 10000);
      } else if (detail.phase === 'idle') {
        setSyncAlert((prev) => (prev?.phase === 'syncing' ? null : prev));
      }
    };

    window.addEventListener(OFFLINE_SYNC_STATUS_EVENT, handleSyncEvent);
    return () => {
      window.removeEventListener(OFFLINE_SYNC_STATUS_EVENT, handleSyncEvent);
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white border border-amber-500/40 px-3.5 py-2.5 text-xs font-semibold shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 max-w-sm">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-amber-300 font-bold flex items-center gap-2 flex-wrap">
            <span>Offline Study Mode Active</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-black text-amber-200">
                {pendingCount} queued
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 leading-snug">
            {pendingCount > 0
              ? `${pendingCount} completed quiz session${
                  pendingCount === 1 ? '' : 's'
                } saved locally — will push to Postgres when back online.`
              : 'Azure Curriculum, flashcards, and quizzes cached locally.'}
          </div>
        </div>
      </div>
    );
  }

  if (syncAlert?.phase === 'syncing') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white border border-sky-400/60 px-3.5 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 max-w-sm"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div className="min-w-0">
          <div className="text-sky-300 font-black flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Background Syncing to Postgres...</span>
          </div>
          <div className="text-[11px] text-slate-300 leading-snug">
            Connection restored — pushing {syncAlert.count} offline quiz session
            {syncAlert.count === 1 ? '' : 's'} to Postgres.
          </div>
        </div>
      </div>
    );
  }

  if (syncAlert?.phase === 'synced') {
    const previewTitles = syncAlert.titles.slice(0, 2).join(', ');
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 flex items-start gap-2.5 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white border-2 border-emerald-400 px-3.5 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 max-w-md"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shrink-0 mt-0.5">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-300 font-black">
              Background Sync Complete • Postgres Updated
            </span>
          </div>
          <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
            <strong>{syncAlert.count}</strong> previously completed offline quiz session
            {syncAlert.count === 1 ? '' : 's'} pushed to Postgres now that connectivity is restored
            {previewTitles ? ` (${previewTitles})` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSyncAlert(null)}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss Postgres background sync notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
