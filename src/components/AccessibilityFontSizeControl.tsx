import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Type,
  Minus,
  Plus,
  RotateCcw,
  Check,
  Sparkles,
  Contrast,
  KeyRound,
  Info,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import {
  getStoredFontScalePercent,
  applyFontScalePercent,
  MIN_FONT_SCALE_PERCENT,
  MAX_FONT_SCALE_PERCENT,
  DEFAULT_FONT_SCALE_PERCENT,
  FONT_SCALE_STEP,
  FONT_SCALE_PRESETS,
} from '../utils/fontSize';
import {
  getStoredHighContrast,
  applyHighContrast,
} from '../utils/highContrast';
import { ResetPasswordModal } from './ResetPasswordModal';

interface AccessibilityFontSizeControlProps {
  variant?: 'panel' | 'inline-bar' | 'header-button';
  className?: string;
}

export const AccessibilityFontSizeControl: React.FC<
  AccessibilityFontSizeControlProps
> = ({ variant = 'panel', className = '' }) => {
  const [scalePercent, setScalePercent] = useState<number>(
    getStoredFontScalePercent
  );
  const [isHighContrast, setIsHighContrast] = useState<boolean>(
    getStoredHighContrast
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(false);
  const [isPanelCompact, setIsPanelCompact] = useState<boolean>(false);
  const [showScaleInfoTooltip, setShowScaleInfoTooltip] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    left: number;
  }>({ top: 56, left: 16 });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ percent?: number }>;
      if (typeof customEvent.detail?.percent === 'number') {
        setScalePercent(customEvent.detail.percent);
      } else {
        setScalePercent(getStoredFontScalePercent());
      }
    };

    const handleHighContrastSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === 'boolean') {
        setIsHighContrast(customEvent.detail.enabled);
      } else {
        setIsHighContrast(getStoredHighContrast());
      }
    };

    window.addEventListener('az900-font-size-changed', handleSync);
    window.addEventListener('az900-high-contrast-changed', handleHighContrastSync);
    return () => {
      window.removeEventListener('az900-font-size-changed', handleSync);
      window.removeEventListener('az900-high-contrast-changed', handleHighContrastSync);
    };
  }, []);

  useEffect(() => {
    if (!isPopoverOpen || variant !== 'header-button') return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popoverWidth = Math.min(340, vw - 20);
      const left = Math.max(
        10,
        Math.min(rect.right - popoverWidth, vw - popoverWidth - 10)
      );
      const top = Math.min(rect.bottom + 8, vh - 260);
      setPopoverCoords({ top: Math.max(8, top), left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isPopoverOpen, variant]);

  const handleAdjust = (nextVal: number) => {
    const applied = applyFontScalePercent(nextVal);
    setScalePercent(applied);
  };

  const handleStep = (delta: number) => {
    handleAdjust(scalePercent + delta);
  };

  const handleToggleHighContrast = (enabled: boolean) => {
    applyHighContrast(enabled);
    setIsHighContrast(enabled);
  };

  const deltaFromBase = scalePercent - 100;
  const deltaBadgeText =
    deltaFromBase === 0
      ? 'Base (100%)'
      : deltaFromBase > 0
      ? `+${deltaFromBase}% (${scalePercent}%)`
      : `${deltaFromBase}% (${scalePercent}%)`;

  if (variant === 'inline-bar') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 border border-sky-200/90 shadow-2xs text-xs ${className}`}
        role="group"
        aria-label="Application-wide accessibility font size adjustment"
      >
        <span className="inline-flex items-center gap-1 font-extrabold text-slate-700">
          <Type className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
          <span>Font Size:</span>
        </span>

        <button
          type="button"
          onClick={() => handleStep(-FONT_SCALE_STEP)}
          disabled={scalePercent <= MIN_FONT_SCALE_PERCENT}
          className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-black transition-colors cursor-pointer"
          title={`Decrease app font size (-${FONT_SCALE_STEP}%)`}
          aria-label="Decrease application font size"
        >
          A-
        </button>

        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0078D4] border border-blue-200 font-black tabular-nums">
          {scalePercent}%
        </span>

        <button
          type="button"
          onClick={() => handleStep(FONT_SCALE_STEP)}
          disabled={scalePercent >= MAX_FONT_SCALE_PERCENT}
          className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-black transition-colors cursor-pointer"
          title={`Increase app font size (+${FONT_SCALE_STEP}%) beyond 15%`}
          aria-label="Increase application font size"
        >
          A+
        </button>

        {/* Quick Preset Chips including +15%, +25%, +35% */}
        <div className="hidden sm:inline-flex items-center gap-1 pl-1 border-l border-slate-200">
          {[100, 115, 125, 135].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAdjust(preset)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                scalePercent === preset
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-[#0078D4]'
              }`}
              title={
                preset === 115
                  ? 'Set to +15% (115%) scale'
                  : preset > 115
                  ? `Set to +${preset - 100}% (${preset}%) accessibility scale beyond 15%`
                  : 'Reset to 100% standard scale'
              }
            >
              {preset === 100 ? '100%' : `+${preset - 100}%`}
            </button>
          ))}
        </div>

        {/* High-Contrast Focus Mode Quick Button */}
        <button
          type="button"
          onClick={() => handleToggleHighContrast(!isHighContrast)}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ml-1 border ${
            isHighContrast
              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title="High-Contrast Focus Mode: increases font weights and sharpens borders"
        >
          <Contrast className="w-3 h-3 text-[#0078D4]" />
          <span>High Contrast: {isHighContrast ? 'ON' : 'OFF'}</span>
        </button>

        {/* Settings Panel: Reset Password Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsResetPasswordOpen(true)}
          className="px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200"
          title="Reset Account Password (verify current password and set a new secure password)"
        >
          <KeyRound className="w-3 h-3 text-[#0078D4]" />
          <span>Reset Password</span>
        </button>

        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
        />
      </div>
    );
  }

  if (variant === 'header-button') {
    return (
      <>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border shrink-0 ${
            isHighContrast
              ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400/50'
              : scalePercent !== 100
              ? 'bg-blue-50 text-[#0078D4] border-blue-300 ring-1 ring-blue-400/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
          } ${className}`}
          title={`Accessibility Panel (Font Scale: ${scalePercent}%, High-Contrast Focus: ${isHighContrast ? 'Active' : 'Off'}) • Click to adjust typography weight & contrast`}
          aria-expanded={isPopoverOpen}
          aria-label={`Accessibility panel: ${scalePercent}% font size, high contrast focus ${isHighContrast ? 'active' : 'inactive'}`}
        >
          {isHighContrast ? (
            <Contrast className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <Type className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
          )}
          <span className="tabular-nums">{scalePercent}%</span>
          {isHighContrast && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
          )}
        </button>

        {isPopoverOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-0 z-[135]"
              onClick={() => setIsPopoverOpen(false)}
            >
              <div
                style={{
                  top: `${popoverCoords.top}px`,
                  left: `${popoverCoords.left}px`,
                }}
                onClick={(e) => e.stopPropagation()}
                className="fixed w-[min(22rem,94vw)] max-h-[85vh] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-sky-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#0078D4]">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Accessibility &amp; Focus Panel
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Visual comfort &amp; high-contrast study assistance
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0078D4] text-white tabular-nums">
                    {deltaBadgeText}
                  </span>
                </div>

                {/* Stepper + Range Slider */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStep(-FONT_SCALE_STEP)}
                      disabled={scalePercent <= MIN_FONT_SCALE_PERCENT}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-black text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>A-</span>
                    </button>

                    <input
                      type="range"
                      min={MIN_FONT_SCALE_PERCENT}
                      max={MAX_FONT_SCALE_PERCENT}
                      step={FONT_SCALE_STEP}
                      value={scalePercent}
                      onChange={(e) =>
                        handleAdjust(parseInt(e.target.value, 10))
                      }
                      className="flex-1 accent-[#0078D4] cursor-pointer"
                      aria-label="Application-wide font size percentage slider"
                    />

                    <button
                      type="button"
                      onClick={() => handleStep(FONT_SCALE_STEP)}
                      disabled={scalePercent >= MAX_FONT_SCALE_PERCENT}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-black text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>A+</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
                    <span>85% (Compact)</span>
                    <span>115% (+15%)</span>
                    <span>150% (+50%)</span>
                  </div>
                </div>

                {/* Preset Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {FONT_SCALE_PRESETS.map((preset) => {
                    const isSelected = scalePercent === preset.percent;
                    return (
                      <button
                        key={preset.percent}
                        type="button"
                        onClick={() => handleAdjust(preset.percent)}
                        className={`px-2 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                            : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border-slate-200'
                        }`}
                        title={preset.description}
                      >
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                        <span>
                          {preset.percent === 100
                            ? '100% Base'
                            : preset.percent > 100
                            ? `+${preset.percent - 100}% (${preset.percent}%)`
                            : `${preset.percent}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dedicated High-Contrast Focus Mode Toggle Section */}
                <div className="pt-2 border-t border-slate-100">
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    isHighContrast
                      ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-slate-50 border-slate-200/90'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isHighContrast ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                        }`}>
                          <Contrast className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs font-black text-slate-900 leading-tight">
                              High-Contrast Focus Mode
                            </h5>
                            {isHighContrast && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                            Heavier font weights &amp; high-contrast borders for visual clarity
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isHighContrast}
                        onClick={() => handleToggleHighContrast(!isHighContrast)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isHighContrast ? 'bg-[#0078D4]' : 'bg-slate-300'
                        }`}
                        title={isHighContrast ? 'Turn off High-Contrast Focus Mode' : 'Turn on High-Contrast Focus Mode (Assists visual impairments)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isHighContrast ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Security: Reset Password Option in Settings Panel */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-[#0078D4] text-white shrink-0">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-900 leading-tight">
                          Account Security
                        </h5>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Verify current password &amp; set a new one
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPopoverOpen(false);
                        setIsResetPasswordOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-[10px] font-black shrink-0 cursor-pointer transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleAdjust(DEFAULT_FONT_SCALE_PERCENT);
                      if (isHighContrast) handleToggleHighContrast(false);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-[#0078D4] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPopoverOpen(false)}
                    className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
        />
      </>
    );
  }

  // Default: Full Settings Panel Card (used in User Settings / Tools & Goal / Profile / Daily Goal Modal)
  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 border border-sky-200/90 shadow-2xs space-y-3 transition-all ${className}`}
      role="region"
      aria-label="Application-wide Font Size and High-Contrast Accessibility Settings"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0078D4] text-white shadow-2xs shrink-0">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap relative">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Accessibility Font Size Adjustment
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0078D4] border border-blue-200">
                85% – 150% Scale
              </span>
              {/* Info Icon & Tooltip explaining how the 85%-150% scale improves readability */}
              <div
                className="relative inline-flex items-center"
                onMouseEnter={() => setShowScaleInfoTooltip(true)}
                onMouseLeave={() => setShowScaleInfoTooltip(false)}
              >
                <button
                  type="button"
                  onClick={() => setShowScaleInfoTooltip((prev) => !prev)}
                  className="p-1 rounded-full text-[#0078D4] hover:bg-blue-100/80 transition-colors cursor-pointer"
                  aria-label="Information about how 85% to 150% font scaling improves readability"
                  title="How 85%–150% scaling assists different visual needs"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showScaleInfoTooltip && (
                  <div
                    role="tooltip"
                    className="absolute left-0 top-full mt-1.5 z-40 w-72 sm:w-80 p-3 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-sky-400/40 space-y-1.5 animate-in fade-in duration-150"
                  >
                    <div className="font-black text-amber-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>How 85%–150% Scaling Improves Readability</span>
                    </div>
                    <p className="text-slate-200">
                      • <strong className="text-white">85%–95% (High-Density):</strong> Fits complex Azure architectural tables and multi-clause scenarios on compact screens with minimal scrolling.
                    </p>
                    <p className="text-slate-200">
                      • <strong className="text-white">100%–115% (Comfort Reading):</strong> Reduces eye strain during multi-hour AZ-900 study sessions.
                    </p>
                    <p className="text-slate-200">
                      • <strong className="text-white">125%–150% (Low-Vision &amp; WCAG AAA):</strong> Enlarges root REM typography across all question cards, glossary terms, and diagrams for learners with low vision or presbyopia.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {!isPanelCompact && (
              <p className="text-[11px] text-slate-600">
                Increase or decrease application-wide typography beyond the +15% increment for optimal reading comfort
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isPanelCompact && (
            <div className="inline-flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => handleStep(-FONT_SCALE_STEP)}
                disabled={scalePercent <= MIN_FONT_SCALE_PERCENT}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-900 border border-slate-200 font-black text-xs cursor-pointer"
                title="Decrease font size (-5%)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleStep(FONT_SCALE_STEP)}
                disabled={scalePercent >= MAX_FONT_SCALE_PERCENT}
                className="px-2 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-40 text-white font-black text-xs cursor-pointer"
                title="Increase font size (+5%)"
              >
                A+
              </button>
            </div>
          )}

          <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-black text-xs tabular-nums">
            {deltaBadgeText}
          </span>
          {scalePercent !== DEFAULT_FONT_SCALE_PERCENT && (
            <button
              type="button"
              onClick={() => handleAdjust(DEFAULT_FONT_SCALE_PERCENT)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset application font size to 100%"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPanelCompact((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0078D4] border border-slate-200 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
            aria-expanded={!isPanelCompact}
            title={
              isPanelCompact
                ? 'Expand Accessibility Font Size & High-Contrast controls'
                : 'Compact this panel to reduce vertical footprint'
            }
          >
            {isPanelCompact ? (
              <>
                <Maximize2 className="w-3 h-3 text-[#0078D4]" />
                <span>Expand</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3 text-[#0078D4]" />
                <span>Compact</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isPanelCompact && (
        <>
          {/* Interactive Slider + Decrease / Increase Buttons */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/90">
            <button
              type="button"
              onClick={() => handleStep(-FONT_SCALE_STEP)}
              disabled={scalePercent <= MIN_FONT_SCALE_PERCENT}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-900 font-black text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Decrease font size (-5%)"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Decrease (A-)</span>
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min={MIN_FONT_SCALE_PERCENT}
                max={MAX_FONT_SCALE_PERCENT}
                step={FONT_SCALE_STEP}
                value={scalePercent}
                onChange={(e) => handleAdjust(parseInt(e.target.value, 10))}
                className="w-full accent-[#0078D4] cursor-pointer"
                aria-label="Adjust application-wide font scale percentage"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-0.5">
                <span>85%</span>
                <span>100%</span>
                <span className="text-[#0078D4] font-extrabold">115% (+15%)</span>
                <span>130% (+30%)</span>
                <span>150% (+50%)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStep(FONT_SCALE_STEP)}
              disabled={scalePercent >= MAX_FONT_SCALE_PERCENT}
              className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-40 text-white font-black text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Increase font size (+5%) beyond 15%"
            >
              <span>Increase (A+)</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
            {FONT_SCALE_PRESETS.map((preset) => {
              const isActive = scalePercent === preset.percent;
              return (
                <button
                  key={preset.percent}
                  type="button"
                  onClick={() => handleAdjust(preset.percent)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-xs ring-2 ring-[#0078D4]/25'
                      : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200'
                  }`}
                  title={preset.description}
                >
                  {preset.percent === 115 && (
                    <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  )}
                  <span>
                    {preset.percent === 100
                      ? '100% (Base)'
                      : preset.percent > 100
                      ? `+${preset.percent - 100}% (${preset.percent}%)`
                      : `${preset.percent}%`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Full Panel: High-Contrast Focus Mode Section */}
          <div className="pt-3 border-t border-sky-100">
            <div className={`p-3 rounded-xl border transition-all ${
              isHighContrast
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isHighContrast ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Contrast className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-black text-slate-900">
                        High-Contrast Focus Mode
                      </h5>
                      {isHighContrast && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Increases typography font-weights across questions and headers, and replaces subtle greys with sharp high-contrast outlines for visual clarity during intense study sessions.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isHighContrast}
                  onClick={() => handleToggleHighContrast(!isHighContrast)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out self-end sm:self-center focus:outline-none ${
                    isHighContrast ? 'bg-[#0078D4]' : 'bg-slate-300'
                  }`}
                  title={isHighContrast ? 'Deactivate High-Contrast Focus Mode' : 'Activate High-Contrast Focus Mode'}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isHighContrast ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Full Panel: Account Password Reset Section */}
          <div className="pt-2 border-t border-sky-100">
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-50 text-[#0078D4] border border-sky-200 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-900">
                    Email Account Password Reset
                  </h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Update your email-authenticated account credentials by verifying your current password and setting a new secure one.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPasswordOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Password</span>
              </button>
            </div>
          </div>
        </>
      )}

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
      />
    </div>
  );
};
