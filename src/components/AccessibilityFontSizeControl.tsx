import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Type, Minus, Plus, RotateCcw, Check, Sparkles } from 'lucide-react';
import {
  getStoredFontScalePercent,
  applyFontScalePercent,
  MIN_FONT_SCALE_PERCENT,
  MAX_FONT_SCALE_PERCENT,
  DEFAULT_FONT_SCALE_PERCENT,
  FONT_SCALE_STEP,
  FONT_SCALE_PRESETS,
} from '../utils/fontSize';

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
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
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

    window.addEventListener('az900-font-size-changed', handleSync);
    return () =>
      window.removeEventListener('az900-font-size-changed', handleSync);
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
            scalePercent !== 100
              ? 'bg-blue-50 text-[#0078D4] border-blue-300 ring-1 ring-blue-400/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
          } ${className}`}
          title={`Accessibility Font Size Adjustment (${scalePercent}%) • Click to increase or decrease app-wide font size beyond +15%`}
          aria-expanded={isPopoverOpen}
          aria-label={`Accessibility font size: ${scalePercent}%`}
        >
          <Type className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
          <span className="tabular-nums">{scalePercent}%</span>
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
                className="fixed w-[min(21rem,94vw)] max-h-[85vh] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-sky-200 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#0078D4]">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Accessibility Font Scale
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Adjust app-wide text size (85% – 150%, beyond +15%)
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

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleAdjust(DEFAULT_FONT_SCALE_PERCENT)}
                    className="text-[11px] font-bold text-slate-600 hover:text-[#0078D4] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to 100%</span>
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
      </>
    );
  }

  // Default: Full Settings Panel Card (used in User Settings / Tools & Goal / Profile / Daily Goal Modal)
  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 border border-sky-200/90 shadow-2xs space-y-3 ${className}`}
      role="region"
      aria-label="Application-wide Font Size Accessibility Settings"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0078D4] text-white shadow-2xs shrink-0">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Accessibility Font Size Adjustment
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0078D4] border border-blue-200">
                85% – 150% Scale
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Increase or decrease application-wide typography beyond the +15% increment for optimal reading comfort
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
        </div>
      </div>

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
    </div>
  );
};
