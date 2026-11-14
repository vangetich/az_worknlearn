import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../types/quiz';
import { KnowledgeAssistant } from './KnowledgeAssistant';

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion?: Question | null;
  selectedOption?: string | null;
  onOpenFullTab?: () => void;
}

/**
 * Responsive 'Ask AI Tutor' Sidebar
 * - Mobile / Tablet (< lg): Smooth right-to-left slide-over panel covering up to full viewport height
 * - Laptop / Desktop (>= lg): Expandable right-docked drawer toggling between compact (460px) and wide (720px)
 * - Keeps the active quiz question and distractor breakdown synced and pre-filled without leaving the quiz
 */
export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  currentQuestion,
  selectedOption = null,
  onOpenFullTab,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
          aria-label="Ask AI Tutor Sidebar"
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
                : 'w-full sm:w-[440px] lg:w-[460px] max-w-[100vw]'
            }`}
          >
            <KnowledgeAssistant
              variant="drawer"
              activeQuestionContext={currentQuestion || null}
              selectedOptionContext={selectedOption}
              onCloseDrawer={onClose}
              onOpenFullTab={onOpenFullTab}
              isDrawerExpanded={isExpanded}
              onToggleDrawerExpand={() => setIsExpanded((prev) => !prev)}
            />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
