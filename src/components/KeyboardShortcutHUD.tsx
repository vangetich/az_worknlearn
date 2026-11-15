import React, { useState, useEffect } from 'react';
import { Keyboard, X, ChevronUp, ChevronDown, Sparkles, Zap, Maximize2, RotateCcw, Bookmark, FileText } from 'lucide-react';
import { isHudCurrentlySnoozed, snoozeHudFor20Mins, HudId } from '../utils/hudSnooze';

export interface KeyboardShortcutHUDProps {
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onRetryQuestion?: () => void;
  onToggleBookmark?: () => void;
  onOpenNotes?: () => void;
  onStartSprint?: () => void;
  onOpenShortcutGuide?: () => void;
}

export const KeyboardShortcutHUD: React.FC<KeyboardShortcutHUDProps> = ({
  isFocusMode = false,
  onToggleFocusMode,
  onRetryQuestion,
  onToggleBookmark,
  onOpenNotes,
  onStartSprint,
  onOpenShortcutGuide,
}) => {
  const HUD_STORAGE_KEY = 'az900_keyboard_shortcut_hud_expanded_v1';
  const HUD_ID: HudId = 'keyboard-shortcuts';

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(HUD_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isSnoozedState, setIsSnoozedState] = useState<boolean>(() => isHudCurrentlySnoozed(HUD_ID));
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);

  // Sync snoozed state
  useEffect(() => {
    const checkSnooze = () => {
      setIsSnoozedState(isHudCurrentlySnoozed(HUD_ID));
    };
    window.addEventListener('az900-hud-snooze-changed', checkSnooze);
    return () => {
      window.removeEventListener('az900-hud-snooze-changed', checkSnooze);
    };
  }, []);

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HUD_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Double-click to snooze for 20 minutes to reduce visual cognitive load
  const handleDoubleClick = () => {
    snoozeHudFor20Mins(HUD_ID);
    setIsSnoozedState(true);
  };

  // Global keydown handler for 'R' and 'F'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        e.altKey ||
        e.metaKey
      ) {
        return;
      }

      // 'F' or 'Ctrl+F' -> Toggle Focus Mode
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          // If plain 'F', toggle focus mode
          e.preventDefault();
          if (onToggleFocusMode) {
            onToggleFocusMode();
            setLastActionToast(isFocusMode ? 'Exited Focus Mode (F)' : 'Entered Focus Mode (F)');
            setTimeout(() => setLastActionToast(null), 1800);
          }
        }
      }

      // 'R' -> Retry / Reset Question
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) {
        e.preventDefault();
        if (onRetryQuestion) {
          onRetryQuestion();
          setLastActionToast('Question Retried (R)');
          setTimeout(() => setLastActionToast(null), 1800);
        }
      }

      // 'B' -> Bookmark Question
      if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey) {
        if (onToggleBookmark) {
          e.preventDefault();
          onToggleBookmark();
          setLastActionToast('Bookmark Toggled (B)');
          setTimeout(() => setLastActionToast(null), 1800);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode, onToggleFocusMode, onRetryQuestion, onToggleBookmark]);

  if (isSnoozedState) {
    return null;
  }

  return (
    <aside
      id="keyboard-shortcut-hud"
      data-testid="keyboard-shortcut-hud"
      aria-label="Keyboard Shortcut HUD"
      onDoubleClick={handleDoubleClick}
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end select-none pointer-events-auto"
      title="Persistent Keyboard Shortcut HUD • Double-click to hide for 20 minutes"
    >
      {/* Toast Feedback */}
      {lastActionToast && (
        <div className="mb-2 px-3 py-1 bg-slate-950/90 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-black shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          ⚡ {lastActionToast}
        </div>
      )}

      {/* Expanded HUD Panel */}
      {isExpanded ? (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden max-w-xs transition-all duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white px-3.5 py-2 flex items-center justify-between gap-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                Shortcuts HUD
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleExpanded}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Collapse HUD"
                aria-label="Collapse shortcuts HUD"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDoubleClick}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Hide HUD for 20 minutes (or double-click anywhere on HUD)"
                aria-label="Hide shortcuts HUD for 20 minutes"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Shortcut Items */}
          <div className="p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {/* Option Select */}
              <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Answer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-black text-[10px] text-slate-900 dark:text-white shadow-2xs">
                  1-4 / A-D
                </kbd>
              </div>

              {/* Submit / Next */}
              <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Submit</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-black text-[10px] text-slate-900 dark:text-white shadow-2xs">
                  Space ↵
                </kbd>
              </div>

              {/* R: Retry */}
              <button
                type="button"
                onClick={onRetryQuestion}
                className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 text-left cursor-pointer transition-colors"
                title="Retry or reset current question"
              >
                <span className="text-[11px] font-black text-sky-900 dark:text-sky-200 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-[#0078D4]" />
                  Retry
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-sky-300 dark:border-sky-700 font-mono font-black text-[10px] text-[#0078D4] dark:text-sky-300 shadow-2xs">
                  R
                </kbd>
              </button>

              {/* F: Focus Mode */}
              <button
                type="button"
                onClick={onToggleFocusMode}
                className={`flex items-center justify-between gap-1.5 p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  isFocusMode
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle distraction-free Focus Mode"
              >
                <span className="text-[11px] font-black flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  {isFocusMode ? 'Exit Focus' : 'Focus'}
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-black text-[10px] text-slate-900 dark:text-white shadow-2xs">
                  F
                </kbd>
              </button>

              {/* B: Bookmark */}
              <button
                type="button"
                onClick={onToggleBookmark}
                className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-left cursor-pointer transition-colors"
                title="Bookmark active question"
              >
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-amber-500" />
                  Bookmark
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-black text-[10px] text-slate-900 dark:text-white shadow-2xs">
                  B
                </kbd>
              </button>

              {/* N: Notes */}
              <button
                type="button"
                onClick={onOpenNotes}
                className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-left cursor-pointer transition-colors"
                title="Open notes drawer"
              >
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-500" />
                  Notes
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-black text-[10px] text-slate-900 dark:text-white shadow-2xs">
                  N
                </kbd>
              </button>
            </div>

            {/* Bottom helper */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
              <span>Double-click to snooze 20m</span>
              {onOpenShortcutGuide && (
                <button
                  type="button"
                  onClick={onOpenShortcutGuide}
                  className="text-[#0078D4] dark:text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  All Shortcuts ↗
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Floating Chip */
        <button
          type="button"
          onClick={toggleExpanded}
          className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          title="Expand Keyboard Shortcuts HUD (Double-click to snooze for 20m)"
        >
          <Keyboard className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-100">Shortcuts (R / F)</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </aside>
  );
};
