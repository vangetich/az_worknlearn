import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Zap,
  ArrowRight,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { KitengeRibbon } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

interface StudyBreakModalProps {
  questionsAnsweredCount: number;
  onTakeBreak: () => void;
  onStartMicroDrill: () => void;
  onDismiss: () => void;
}

/**
 * Sophisticated Light-Azure Animated Kenyan Big Five Wildlife Panorama
 * Depicts Kenya's Big Five (Lion, Leopard, African Bush Elephant, Black Rhino, Cape Buffalo)
 * across a gentle Kilimanjaro-to-Acacia savannah skyline in layered translucent light azure.
 */
const KenyaBigFiveAzureScene: React.FC = () => {
  return (
    <div
      className="relative w-full h-24 rounded-xl overflow-hidden border border-sky-200/80 dark:border-sky-800/70 bg-gradient-to-b from-[#F0F9FF] via-[#E0F2FE]/85 to-[#BAE6FD]/60 dark:from-[#07172b] dark:via-[#0a213d] dark:to-[#0d2d52] shadow-2xs select-none"
      aria-label="Animated light azure silhouettes of Kenya's Big Five wildlife: Lion, Leopard, Elephant, Rhino, and Cape Buffalo"
    >
      <svg
        viewBox="0 0 420 96"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMax slice"
        role="img"
      >
        <defs>
          <linearGradient id="azureHorizonGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="azureAcaciaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="bigFiveBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.92" />
          </linearGradient>
        </defs>

        {/* Distant Kilimanjaro / Savannah Ridge in Ultra-Light Azure */}
        <path
          d="M0 78 L58 58 L98 67 L154 34 L182 28 L210 35 L258 65 L322 52 L420 74 L420 96 L0 96 Z"
          fill="url(#azureHorizonGrad)"
        />
        {/* Delicate Snow Crest on Distant Peak */}
        <path
          d="M167 31 L182 28 L196 32 L188 35 L182 32 L175 35 Z"
          fill="#E0F2FE"
          opacity="0.85"
        />

        {/* Soft Sun Halo in Light Azure */}
        <circle cx="348" cy="24" r="14" fill="#BAE6FD" opacity="0.42" />
        <circle cx="348" cy="24" r="9" fill="#E0F2FE" opacity="0.65" />

        {/* Graceful Drifting Azure Savannah Breeze Ribbons */}
        <g className="animate-bigfive-breeze" opacity="0.55">
          <path
            d="M35 22 Q72 17 108 22"
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M235 18 Q268 13 302 18"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>

        {/* Subtle Soaring Savannah Birds */}
        <g className="animate-bigfive-bird" stroke="#38BDF8" strokeWidth="1.2" fill="none" opacity="0.75">
          <path d="M120 20 Q124 16 128 20 Q132 16 136 20" strokeLinecap="round" />
          <path d="M275 27 Q278 24 281 27 Q284 24 287 27" strokeLinecap="round" />
        </g>

        {/* Left Acacia Umbrella Tree (Home to the Leopard) */}
        <g fill="url(#azureAcaciaGrad)">
          <path d="M88 86 L91 42 L84 31 L87 30 L94 40 L105 33 L107 35 L95 45 L94 86 Z" />
          <ellipse cx="96" cy="28" rx="34" ry="7.5" opacity="0.65" />
          <ellipse cx="78" cy="31" rx="18" ry="5" opacity="0.5" />
          <ellipse cx="116" cy="31" rx="16" ry="4.5" opacity="0.45" />
        </g>

        {/* Ground Horizon Grass Strip */}
        <path
          d="M0 84 Q105 79 210 83 T420 82 L420 96 L0 96 Z"
          fill="#0284C7"
          opacity="0.22"
        />

        {/* 1. AFRICAN LEOPARD — Poised gracefully on Left Acacia Branch */}
        <g transform="translate(88, 29)">
          <path
            d="M2 5 C6 2, 14 2, 18 4 C20 5, 22 4, 23 3 C24 3, 25 5, 24 6 C22 7, 19 7, 18 8 L17 12 L15 12 L15 8 L8 8 L7 12 L5 12 L5 7 C3 7, 1 6, 2 5 Z"
            fill="url(#bigFiveBodyGrad)"
          />
          {/* Gently swaying spotted tail */}
          <path
            className="animate-bigfive-tail"
            d="M3 6 C-3 7, -6 12, -3 15 C-1 17, 1 16, 0 14"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        {/* 2. AFRICAN LION — Regal maned silhouette on left rise */}
        <g className="animate-bigfive-lion" transform="translate(16, 56)">
          <path
            d="M8 28 L8 17 C6 15, 6 10, 9 7 C11 5, 16 5, 18 8 C20 9, 24 11, 29 12 C34 12, 37 15, 37 19 L37 28 L34 28 L34 21 L30 21 L30 28 L27 28 L27 20 C23 20, 19 20, 17 20 L16 28 L13 28 L14 20 L11 28 Z"
            fill="url(#bigFiveBodyGrad)"
          />
          {/* Lion Head + Mane Profile */}
          <path
            d="M6 12 C4 8, 7 3, 13 3 C17 3, 20 6, 19 10 C19 13, 16 16, 12 16 C9 16, 7 14, 6 12 Z"
            fill="#0284C7"
            opacity="0.88"
          />
          <path
            className="animate-bigfive-tail"
            d="M36 16 Q43 13 44 19"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>

        {/* 3. AFRICAN BUSH ELEPHANT — Centerpiece majestic profile with swaying trunk */}
        <g className="animate-bigfive-elephant" transform="translate(148, 43)">
          {/* Elephant body + arched back + legs */}
          <path
            d="M6 20 C7 9, 17 3, 29 4 C38 4, 45 9, 47 16 L47 41 L41 41 L41 28 L35 28 L35 41 L29 41 L29 27 C24 27, 20 27, 17 27 L17 41 L11 41 L11 28 L6 41 L2 41 L4 26 C3 24, 4 21, 6 20 Z"
            fill="url(#bigFiveBodyGrad)"
          />
          {/* Iconic Large Savannah Ear */}
          <path
            d="M16 8 C22 7, 26 12, 24 19 C22 24, 15 23, 13 18 C11 13, 12 9, 16 8 Z"
            fill="#7DD3FC"
            opacity="0.72"
          />
          {/* Gently swaying trunk */}
          <path
            className="animate-bigfive-trunk"
            d="M7 15 C3 21, 2 29, 4 33 C5 35, 8 34, 8 31 C8 29, 7 28, 7 25"
            fill="none"
            stroke="#0284C7"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Ivory Tusk in Pure Pale Azure Highlight */}
          <path
            d="M6 21 Q0 22 -2 18"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        {/* 4. BLACK RHINOCEROS — Grounded twin-horn silhouette */}
        <g transform="translate(236, 59)">
          <path
            d="M6 12 C9 7, 19 6, 28 7 C35 8, 39 11, 39 16 L39 26 L34 26 L34 19 L29 19 L29 26 L24 26 L24 19 L16 19 L15 26 L10 26 L10 18 L6 16 Z"
            fill="url(#bigFiveBodyGrad)"
          />
          {/* Twin Curved Rhino Horns */}
          <path
            d="M7 13 Q3 7 6 3 Q8 7 10 11 Z"
            fill="#7DD3FC"
          />
          <path
            d="M11 11 Q10 8 12 6 Q13 8 13 11 Z"
            fill="#BAE6FD"
          />
        </g>

        {/* 5. CAPE BUFFALO — Strong sweeping boss horns on right rise */}
        <g transform="translate(314, 54)">
          <path
            d="M6 12 C9 7, 18 6, 29 7 C37 7, 42 11, 42 17 L42 30 L37 30 L37 21 L32 21 L32 30 L27 30 L27 20 C22 20, 17 20, 15 20 L14 30 L9 30 L9 18 C5 17, 4 14, 6 12 Z"
            fill="url(#bigFiveBodyGrad)"
          />
          {/* Signature Curved Boss Horns */}
          <path
            d="M11 8 C8 3, 3 4, 2 7 C4 6, 7 6, 9 9 Z"
            fill="#BAE6FD"
          />
          <path
            d="M12 8 C15 3, 19 4, 20 7 C18 6, 15 6, 13 9 Z"
            fill="#7DD3FC"
          />
          <path
            className="animate-bigfive-tail"
            d="M41 14 Q45 18 44 23"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Quiet Unboxed Horizon Label */}
      <div className="pointer-events-none absolute bottom-1 right-2.5 flex items-center gap-1.5 text-[9.5px] font-bold tracking-wide text-sky-900/80 dark:text-sky-200/85">
        <span>Kenya&apos;s Big Five</span>
        <span aria-hidden="true">·</span>
        <span>Serene Azure Horizon</span>
      </div>
    </div>
  );
};

export const StudyBreakModal: React.FC<StudyBreakModalProps> = ({
  questionsAnsweredCount,
  onStartMicroDrill,
  onDismiss,
}) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  return (
    <ResponsiveModalContainer
      isOpen={true}
      onClose={onDismiss}
      maxWidth="sm"
      closeOnBackdropClick={true}
      ariaLabel="Mindful Study Rhythm — Quick Kahawa Breather"
    >
      <div className="shrink-0">
        <KitengeRibbon height={3} />
      </div>

      {/* Compact Modal Header (Zero static pills — crisp typographic hierarchy) */}
      <div className="shrink-0 px-3.5 py-2.5 bg-gradient-to-r from-sky-50/90 via-white to-amber-50/70 dark:from-[#0b1b32] dark:via-[#0d2038] dark:to-[#132238] border-b border-sky-200/70 dark:border-sky-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0284C7] dark:text-sky-300">
              <span>Mindful Study Rhythm ☕</span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
              Time for a Quick Kahawa Breather!
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight mt-0.5">
              You&apos;ve solved{' '}
              <strong className="text-slate-900 dark:text-white tabular-nums">
                {questionsAnsweredCount} scenario{questionsAnsweredCount === 1 ? '' : 's'}
              </strong>{' '}
              in this session.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Close breather modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Modal Body */}
      <div className="p-3 sm:p-3.5 space-y-2.5 overflow-y-auto overscroll-contain flex-1 min-h-0">
        {/* Sophisticated Light-Azure Animated Kenyan Big Five Wildlife Panorama */}
        <KenyaBigFiveAzureScene />

        {/* Compact Proverb Line */}
        <div className="px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
          <span className="font-bold text-[#0078D4] dark:text-sky-300">Hekima · </span>
          <span className="italic">
            &ldquo;Haraka haraka haina baraka.&rdquo;
          </span>{' '}
          <span className="text-slate-500 dark:text-slate-400">
            (Steady progress builds lasting mastery.)
          </span>
        </div>

        {/* Sleek Inline 60-Second Mindful Breathing Reset */}
        <div className="px-3 py-2 rounded-xl bg-sky-50/75 dark:bg-sky-950/35 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-[#38BDF8] flex items-center justify-center font-mono font-extrabold text-xs text-slate-900 dark:text-sky-100 shrink-0 tabular-nums shadow-2xs">
              {timerSeconds}s
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold text-sky-950 dark:text-sky-100 leading-tight">
                60-Second Reset
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight truncate">
                Inhale 4s · Hold 4s · Exhale slowly
              </div>
            </div>
          </div>

          {!timerRunning ? (
            <button
              type="button"
              onClick={() => setTimerRunning(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Play className="w-3 h-3" />
              <span>Breathe</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(60);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Compact Choice of Actions */}
        <div className="grid grid-cols-1 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={onStartMicroDrill}
            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#005A9E] hover:from-[#0078D4] hover:to-[#004578] text-white font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>3-Question Weak-Spot Drill</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            I feel refreshed — resume study
          </button>
        </div>
      </div>
    </ResponsiveModalContainer>
  );
};
