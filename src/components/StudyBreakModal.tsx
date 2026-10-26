import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Play,
  RotateCcw,
  CheckCircle,
  Smile,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface StudyBreakModalProps {
  questionsAnsweredCount: number;
  onTakeBreak: () => void;
  onStartMicroDrill: () => void;
  onDismiss: () => void;
}

export const StudyBreakModal: React.FC<StudyBreakModalProps> = ({
  questionsAnsweredCount,
  onTakeBreak,
  onStartMicroDrill,
  onDismiss,
}) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="bg-white w-full max-w-[min(32rem,calc(100vw-1.25rem))] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto rounded-2xl border border-slate-200 card-elevation overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="shrink-0">
          <KitengeRibbon height={5} />
        </div>

        {/* Header */}
        <div className="shrink-0 p-4 sm:p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/80 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#C2410C] text-white shadow-xs">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                Mindful Study Rhythm ☕
              </span>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 mt-1">
                Time for a Quick Kahawa Breather!
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                You've solved <strong className="text-slate-900">{questionsAnsweredCount} scenarios</strong> in this session.
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with Swahili Wisdom and Relaxation */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {/* Proverb card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-amber-800 uppercase tracking-wider block text-[10px]">
              East African Proverb • Hekima
            </span>
            <p className="italic font-medium text-slate-800">
              "Haraka haraka haina baraka." (Hurry hurry has no blessing — steady, patient progress builds true wisdom).
            </p>
            <p className="text-slate-500 pt-1 text-[11px]">
              Taking a 60-second break boosts memory retention by over 30% and keeps studying fun!
            </p>
          </div>

          {/* Interactive 60-second Breathing / Mind Reset Circle */}
          <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200 text-center space-y-3">
            <span className="text-xs font-bold text-blue-900 block uppercase tracking-wider">
              60-Second Mindful Breathing
            </span>

            <div className="flex items-center justify-center gap-3">
              <div className="relative w-16 h-16 rounded-full bg-white border-4 border-[#0078D4] flex items-center justify-center font-mono font-extrabold text-lg text-slate-900 shadow-2xs">
                {timerSeconds}s
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Inhale deeply for 4s, hold for 4s, exhale slowly. Let your mind organize the Azure concepts.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              {!timerRunning ? (
                <button
                  onClick={() => setTimerRunning(true)}
                  className="px-4 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start 60s Breathing</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(60);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Choice of Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={onStartMicroDrill}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs transition-all"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-200" />
                <span>Try a 3-Question Pop-Up Quiz on Weak Points</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              I feel refreshed, keep normal study going!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
