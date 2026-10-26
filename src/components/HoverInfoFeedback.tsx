import React, { useState, useRef, useEffect } from 'react';

export interface HoverInfoFeedbackProps {
  title: string;
  badge?: string;
  badgeColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'slate';
  description: string;
  tip?: string;
  shortcut?: string;
  align?: 'left' | 'center' | 'right';
  side?: 'top' | 'bottom';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const HoverInfoFeedback: React.FC<HoverInfoFeedbackProps> = ({
  title,
  badge,
  badgeColor = 'amber',
  description,
  tip,
  shortcut,
  align = 'center',
  side = 'bottom',
  children,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const badgeColorClasses = {
    amber: 'bg-amber-400 text-slate-950 border-amber-300',
    blue: 'bg-sky-400 text-slate-950 border-sky-300',
    emerald: 'bg-emerald-400 text-slate-950 border-emerald-300',
    purple: 'bg-purple-300 text-slate-950 border-purple-200',
    rose: 'bg-rose-400 text-white border-rose-300',
    slate: 'bg-slate-700 text-slate-200 border-slate-600',
  }[badgeColor];

  const alignClasses = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
  }[align];

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  }[side];

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          aria-hidden={!isVisible}
          className={`absolute ${sideClasses} ${alignClasses} z-50 pointer-events-none w-64 sm:w-72 p-3 bg-slate-950/95 text-white text-left rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in duration-150 text-xs select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-800">
            <span className="font-extrabold text-white text-[11.5px] tracking-tight truncate">
              {title}
            </span>
            {badge && (
              <span
                className={`text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${badgeColorClasses}`}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[11px] text-slate-300 leading-relaxed mt-1.5">
            {description}
          </p>

          {/* Optional Tip or Shortcut */}
          {(tip || shortcut) && (
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px] text-amber-300/90 font-medium">
              {tip && <span className="truncate">{tip}</span>}
              {shortcut && (
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 font-mono text-[9px] shrink-0 ml-auto">
                  {shortcut}
                </kbd>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
