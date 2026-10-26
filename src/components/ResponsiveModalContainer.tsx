import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ModalMaxWidthSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl';

const MAX_WIDTH_VW_MAP: Record<ModalMaxWidthSize, string> = {
  sm: 'max-w-[min(28rem,95vw)]',
  md: 'max-w-[min(32rem,95vw)]',
  lg: 'max-w-[min(36rem,95vw)]',
  xl: 'max-w-[min(42rem,95vw)]',
  '2xl': 'max-w-[min(48rem,95vw)]',
  '3xl': 'max-w-[min(56rem,95vw)]',
  '4xl': 'max-w-[min(64rem,95vw)]',
  '5xl': 'max-w-[min(68rem,96vw)]',
  '6xl': 'max-w-[min(72rem,96vw)]',
};

export interface ResponsiveModalContainerProps {
  isOpen?: boolean;
  onClose?: () => void;
  maxWidth?: ModalMaxWidthSize;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  zIndexClass?: string;
  overlayClassName?: string;
  containerClassName?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Unified Responsive Container Wrapper for all pop-up modals.
 * Uses CSS viewport units (vh, vw, dvh, dvw) and flexbox constraints (flex-col, min-h-0, overflow-hidden)
 * rendered via createPortal(document.body) so modals automatically scale and fit within the user's active device screen.
 */
export const ResponsiveModalContainer: React.FC<
  ResponsiveModalContainerProps
> = ({
  isOpen = true,
  onClose,
  maxWidth = 'lg',
  closeOnBackdropClick = false,
  closeOnEscape = true,
  zIndexClass = 'z-[120]',
  overlayClassName = 'bg-slate-950/65 backdrop-blur-sm',
  containerClassName = 'bg-white rounded-2xl border border-slate-200 shadow-2xl',
  ariaLabel,
  children,
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const widthClass = MAX_WIDTH_VW_MAP[maxWidth] || MAX_WIDTH_VW_MAP.lg;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={closeOnBackdropClick && onClose ? onClose : undefined}
      className={`unified-modal-viewport-overlay fixed inset-0 ${zIndexClass} w-[100vw] h-[100vh] max-w-[100vw] max-h-[100vh] flex items-center justify-center p-[1.5vh_2.5vw] sm:p-[2.5vh_3vw] overflow-y-auto overscroll-contain animate-in fade-in duration-150 ${overlayClassName}`}
    >
      <div
        onClick={closeOnBackdropClick ? (e) => e.stopPropagation() : undefined}
        className={`unified-modal-flex-container w-full ${widthClass} max-h-[94vh] sm:max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${containerClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
