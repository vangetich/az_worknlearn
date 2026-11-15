import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Anchor, Maximize2, Minimize2, X } from 'lucide-react';
import { Question } from '../types/quiz';
import { KnowledgeAssistant } from './KnowledgeAssistant';
import { KnowledgeDeckComponent } from './KnowledgeDeckComponent';

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion?: Question | null;
  selectedOption?: string | null;
  onOpenFullTab?: () => void;
  initialSidebarTab?: 'assistant' | 'knowledge-deck';
}

/**
 * Responsive 'Ask AI Tutor' & 'Knowledge Deck' Sidebar
 * - Mobile / Tablet (< lg): Smooth right-to-left slide-over panel covering up to full viewport height
 * - Laptop / Desktop (>= lg): Expandable right-docked drawer toggling between compact (460px) and wide (720px)
 * - Features adjacent sidebar tabs for 'Knowledge Assistant' and 'Knowledge Deck (Memory Anchors)'
 */
export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  currentQuestion,
  selectedOption = null,
  onOpenFullTab,
  initialSidebarTab = 'assistant',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'assistant' | 'knowledge-deck'>(
    initialSidebarTab
  );

  useEffect(() => {
    if (isOpen) {
      setActiveSidebarTab(initialSidebarTab);
    }
  }, [isOpen, initialSidebarTab]);

  // Close drawer cleanly on Escape key press
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

  // Prevent background page scroll on mobile slide-over while keeping laptop drawer interactive
  useEffect(() => {
    if (!isOpen) return;
    const isMobileViewport = window.innerWidth < 1024;
    if (!isMobileViewport) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          key="ai-tutor-drawer-overlay"
          className="fixed inset-0 z-[100] flex justify-end pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-label="Knowledge Assistant and Memory Anchors Sidebar"
          id="ai-tutor-drawer"
        >
          {/* Translucent Backdrop (click outside to dismiss on mobile & laptop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/45 lg:bg-slate-950/25 backdrop-blur-[1px] pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-Over Panel on Mobile / Expandable Drawer on Laptop */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className={`relative z-10 pointer-events-auto h-[100dvh] bg-white dark:bg-slate-900 shadow-2xl border-l border-sky-200/90 dark:border-slate-700 flex flex-col transition-[width] duration-300 ease-out ${
              isExpanded
                ? 'w-full sm:w-[92vw] lg:w-[680px] xl:w-[760px] max-w-[100vw]'
                : 'w-full sm:w-[440px] lg:w-[480px] max-w-[100vw]'
            }`}
          >
            {/* Adjacent Sidebar Tab Switcher: Knowledge Assistant <-> Knowledge Deck (Memory Anchors) */}
            <div
              role="tablist"
              aria-label="Knowledge Sidebar Tabs"
              className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0"
            >
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSidebarTab === 'assistant'}
                  data-testid="sidebar-tab-knowledge-assistant"
                  onClick={() => setActiveSidebarTab('assistant')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSidebarTab === 'assistant'
                      ? 'bg-[#0078D4] text-white shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Knowledge Assistant</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSidebarTab === 'knowledge-deck'}
                  data-testid="sidebar-tab-knowledge-deck"
                  onClick={() => setActiveSidebarTab('knowledge-deck')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSidebarTab === 'knowledge-deck'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-amber-300/90 hover:text-amber-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Anchor className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Knowledge Deck</span>
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  title={isExpanded ? 'Compact sidebar width' : 'Expand sidebar width'}
                  aria-label={isExpanded ? 'Compact sidebar width' : 'Expand sidebar width'}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  title="Close Sidebar (Esc)"
                  aria-label="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Sidebar Tab Content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {activeSidebarTab === 'assistant' ? (
                <KnowledgeAssistant
                  variant="drawer"
                  activeQuestionContext={currentQuestion || null}
                  selectedOptionContext={selectedOption}
                  onCloseDrawer={onClose}
                  onOpenFullTab={onOpenFullTab}
                  isDrawerExpanded={isExpanded}
                  onToggleDrawerExpand={() => setIsExpanded((prev) => !prev)}
                  onSwitchToKnowledgeDeck={() => setActiveSidebarTab('knowledge-deck')}
                />
              ) : (
                <KnowledgeDeckComponent
                  variant="drawer"
                  activeQuestionContext={currentQuestion || null}
                  onAskAssistant={() => {
                    setActiveSidebarTab('assistant');
                  }}
                />
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

