import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Network,
  HardDrive,
} from 'lucide-react';
import {
  ThreadTagMeta,
  getThreadContextForModule,
} from '../data/azureThemesData';
import { ThreadTagBadge } from './ThreadTagBadge';

interface ThreadContextModalProps {
  isOpen: boolean;
  tag: ThreadTagMeta | null;
  moduleId: number;
  learningPathId: 1 | 2 | 3;
  moduleTitle: string;
  onClose: () => void;
  onOpenInAzureThemes?: (themeId: string, moduleId: number) => void;
}

export const ThreadContextModal: React.FC<ThreadContextModalProps> = ({
  isOpen,
  tag,
  moduleId,
  learningPathId,
  moduleTitle,
  onClose,
  onOpenInAzureThemes,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tag || typeof document === 'undefined') return null;

  const context = getThreadContextForModule(tag.themeId, moduleId);

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="thread-context-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg my-auto max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl text-left animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="shrink-0 px-5 py-4 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ThreadTagBadge tag={tag} size="sm" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Path {learningPathId} · Module {moduleId}
              </span>
              {context.moduleLink && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950/70 text-[#0078D4] dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {context.moduleLink.roleInThread}
                </span>
              )}
            </div>
            <h3
              id="thread-context-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug"
            >
              {tag.label} in Module {moduleId}: {moduleTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Close thread explanation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {/* Fundamental Application in Current Module */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0078D4] dark:text-sky-400">
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span>How {tag.label} Applies Fundamentally Here</span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {context.explanationSummary}
            </p>
          </div>

          {/* Thread Continuity From Earlier Modules */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              What You Learned Earlier (Thread Continuity)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {context.earlierConnection}
            </p>
          </div>

          {/* Extra Compute / Network / Storage Breakdown when inspecting Scaling */}
          {context.scalingDeepDive && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Compute, Networking &amp; Storage in Module {moduleId}
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/35 border border-sky-200/80 dark:border-sky-800/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#0078D4] dark:text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Compute ({context.scalingDeepDive.compute.primaryMode}):</strong>{' '}
                    {context.scalingDeepDive.compute.primaryMode === 'Vertical'
                      ? context.scalingDeepDive.compute.verticalSpec
                      : context.scalingDeepDive.compute.horizontalSpec}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                  <Network className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Networking ({context.scalingDeepDive.networking.primaryMode}):</strong>{' '}
                    {context.scalingDeepDive.networking.primaryMode === 'Vertical'
                      ? context.scalingDeepDive.networking.verticalSpec
                      : context.scalingDeepDive.networking.horizontalSpec}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Storage ({context.scalingDeepDive.storage.primaryMode}):</strong>{' '}
                    {context.scalingDeepDive.storage.primaryMode === 'Vertical'
                      ? context.scalingDeepDive.storage.verticalSpec
                      : context.scalingDeepDive.storage.horizontalSpec}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connected Azure Services */}
          {context.azureServices.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                Key Services:
              </span>
              {context.azureServices.map((svc) => (
                <span
                  key={svc}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  {svc}
                </span>
              ))}
            </div>
          )}

          {/* AZ-900 Exam Discrimination Rule */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>AZ-900 Exam Rule</span>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed">
              {context.examRule}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Back to Question
          </button>

          {onOpenInAzureThemes && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInAzureThemes(tag.themeId, moduleId);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore Full Thread in Azure Themes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
