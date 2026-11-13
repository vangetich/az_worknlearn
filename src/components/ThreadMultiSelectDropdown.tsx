import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, ChevronDown, Check, X } from 'lucide-react';
import { THREAD_TAG_META, ThreadTagId } from '../data/azureThemesData';
import { getThreadTagIcon } from './ThreadTagBadge';

interface ThreadMultiSelectDropdownProps {
  selectedThreads: ThreadTagId[];
  onToggleThread: (threadId: ThreadTagId) => void;
  onClearThreads: () => void;
  threadCounts?: Partial<Record<ThreadTagId, number>>;
  variant?: 'compact' | 'expanded';
}

const ORDERED_THREAD_IDS: ThreadTagId[] = [
  'Scaling',
  'Reliability',
  'Security',
  'Responsibility',
  'FinOps',
  'Hybrid/IaC',
];

export const ThreadMultiSelectDropdown: React.FC<ThreadMultiSelectDropdownProps> = ({
  selectedThreads,
  onToggleThread,
  onClearThreads,
  threadCounts = {},
  variant = 'compact',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current || typeof window === 'undefined') return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = Math.min(320, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
    setCoords({
      top: rect.bottom + 6,
      left,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const activeCount = selectedThreads.length;
  const summaryLabel =
    activeCount === 0
      ? 'All Themes'
      : activeCount === 1
      ? selectedThreads[0]
      : `${activeCount} Selected`;

  return (
    <div className="relative inline-block shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1 border shadow-2xs transition-all cursor-pointer whitespace-nowrap ${
          variant === 'expanded'
            ? 'px-2.5 py-1.5 rounded-xl text-xs font-extrabold'
            : 'px-2 py-1 rounded-lg text-[11px] font-black'
        } ${
          activeCount > 0
            ? 'bg-sky-50 dark:bg-sky-950/70 text-[#0078D4] dark:text-sky-200 border-[#0078D4]/60 dark:border-sky-500'
            : 'bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:border-[#0078D4]'
        }`}
        title="Filter questions by one or more interconnecting AZ-900 curriculum threads"
      >
        <GitBranch className="w-3 h-3 text-[#0078D4] dark:text-sky-400 shrink-0" />
        <span
          className={`uppercase tracking-wider font-black ${
            variant === 'expanded' ? 'text-[11px]' : 'text-[10px]'
          } ${activeCount > 0 ? 'text-[#0078D4] dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}
        >
          Thread:
        </span>
        <span className="truncate max-w-[115px]">{summaryLabel}</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#0078D4] text-white tabular-nums">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed w-[min(20rem,calc(100vw-1rem))] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-[140] p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            role="listbox"
            aria-multiselectable="true"
            aria-label="Filter questions by interconnecting AZ-900 threads"
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-slate-50">
                  Filter by Thread (Multi-Select)
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  Select one or more interconnecting themes
                </div>
              </div>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onClearThreads}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10.5px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto overscroll-contain pr-0.5">
              {ORDERED_THREAD_IDS.map((threadId) => {
                const meta = THREAD_TAG_META[threadId];
                const isChecked = selectedThreads.includes(threadId);
                const count = threadCounts[threadId] ?? 0;

                return (
                  <button
                    key={threadId}
                    type="button"
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => onToggleThread(threadId)}
                    className={`w-full text-left p-2 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isChecked
                        ? 'bg-sky-50/90 dark:bg-sky-950/50 border-[#0078D4] dark:border-sky-500'
                        : 'bg-slate-50/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-[#0078D4] border-[#0078D4] text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold border ${meta.badgeClass}`}
                        >
                          {getThreadTagIcon(meta.id, 'w-3 h-3 shrink-0')}
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10.5px] font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                          {count}Q
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-snug mt-1">
                        {meta.shortDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
