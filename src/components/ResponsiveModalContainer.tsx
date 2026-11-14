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
  sm: 'max-w-[min(28rem,calc(100vw-1.5rem))]',
  md: 'max-w-[min(32rem,calc(100vw-1.5rem))]',
  lg: 'max-w-[min(36rem,calc(100vw-1.5rem))]',
  xl: 'max-w-[min(42rem,calc(100vw-1.5rem))]',
  '2xl': 'max-w-[min(48rem,calc(100vw-1.5rem))]',
  '3xl': 'max-w-[min(56rem,calc(100vw-1.5rem))]',
  '4xl': 'max-w-[min(64rem,calc(100vw-1.5rem))]',
  '5xl': 'max-w-[min(68rem,calc(100vw-1.5rem))]',
  '6xl': 'max-w-[min(72rem,calc(100vw-1.5rem))]',
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
 * Uses strict CSS viewport constraints (dvh, vh, calc(100vh-2rem)) and flexbox (flex-col, min-h-0, overflow-hidden)
 * rendered via createPortal(document.body) so all modals scale and fit strictly within the viewable responsive window space.
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
  const isFocusModeActive =
    document.documentElement.getAttribute('data-focus-mode') === 'true' ||
    document.body.getAttribute('data-focus-mode') === 'true';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={closeOnBackdropClick && onClose ? onClose : undefined}
      className={`unified-modal-viewport-overlay fixed inset-0 ${zIndexClass} w-screen h-screen max-w-full max-h-full flex ${
        isFocusModeActive
          ? 'items-start justify-center pt-2 sm:pt-4 px-2 sm:px-4'
          : 'items-center justify-center p-2 sm:p-4 md:p-6'
      } overflow-y-auto overscroll-contain animate-in fade-in duration-150 ${overlayClassName}`}
    >
      <div
        onClick={closeOnBackdropClick ? (e) => e.stopPropagation() : undefined}
        className={`unified-modal-flex-container w-full ${widthClass} max-h-[min(90vh,90dvh,calc(100vh-2rem))] ${
          isFocusModeActive ? 'mt-0 mb-auto' : 'my-auto'
        } flex flex-col overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200 ${containerClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
