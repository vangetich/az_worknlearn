import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Zap, X, Sparkles, Brain, Clock } from 'lucide-react';

interface FocusModeSuggestionBannerProps {
  isOpen: boolean;
  onEnterFocusMode: () => void;
  onDismiss: () => void;
  elapsedInteractionMinutes?: number;
}

export const FocusModeSuggestionBanner: React.FC<FocusModeSuggestionBannerProps> = ({
  isOpen,
  onEnterFocusMode,
  onDismiss,
  elapsedInteractionMinutes = 3,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="focus-mode-suggestion-toast"
          data-testid="focus-mode-suggestion-banner"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.22 } }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-[145] max-w-md w-[calc(100vw-1.5rem)] sm:w-auto pointer-events-auto"
          role="alert"
          aria-live="polite"
        >
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-950/95 text-white border-2 border-amber-400/80 shadow-2xl backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Study Flow Coach
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-amber-400" />
                      ~{elapsedInteractionMinutes}m active review
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                    <span>Deep in thought or feeling distracted?</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">
                    We noticed sustained interaction without question completion. Switch to{' '}
                    <strong className="text-amber-300">Focus Mode</strong> to strip away clutter,
                    headers, and sidebars so you can zero in on the scenario.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss Focus Mode suggestion"
                title="Dismiss (snooze suggestion for 10 minutes)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={onEnterFocusMode}
                data-testid="enter-focus-mode-suggestion-btn"
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 text-slate-950 inline-flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Switch to Focus Mode</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
