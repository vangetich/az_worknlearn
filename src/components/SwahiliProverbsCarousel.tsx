import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Quote,
  BookOpen,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Compass,
  Lightbulb,
  HeartHandshake,
} from 'lucide-react';
import { SWAHILI_STUDY_PROVERBS, SwahiliProverb } from '../data/swahiliProverbs';
import { MaasaiMedallion, MoranShieldMotif } from './MotifDecorations';

interface SwahiliProverbsCarouselProps {
  onTakeAction?: () => void;
  className?: string;
}

export const SwahiliProverbsCarousel: React.FC<SwahiliProverbsCarouselProps> = ({
  onTakeAction,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const proverb = SWAHILI_STUDY_PROVERBS[currentIndex];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SWAHILI_STUDY_PROVERBS.length);
    }, 8500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SWAHILI_STUDY_PROVERBS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SWAHILI_STUDY_PROVERBS.length) % SWAHILI_STUDY_PROVERBS.length);
  };

  const handleCopy = () => {
    const textToCopy = `"${proverb.swahili}" — ${proverb.englishTranslation}\n\nStudy Wisdom: ${proverb.examMeaning}\nAction: ${proverb.habitAction}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${proverb.swahili}. In English: ${proverb.englishTranslation}. Study wisdom: ${proverb.examMeaning}`
    );
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60 shadow-md card-elevation overflow-hidden transition-all ${className}`}
    >
      {/* Decorative Tribal Header Strip */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 px-5 py-3 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wide text-amber-300 uppercase">
                Methali za Harambee
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                Swahili Study Wisdom • {currentIndex + 1} of {SWAHILI_STUDY_PROVERBS.length}
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80">
              Timeless East African proverbs to anchor your discipline, resilience, and exam confidence
            </p>
          </div>
        </div>

        {/* Carousel Playback & Navigation Quick Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
            }`}
            title={isSpeaking ? 'Stop voice reading' : 'Read proverb aloud with voice'}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-colors"
            title="Copy proverb and study wisdom"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Autoplay Pause/Resume */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-colors"
            title={isPlaying ? 'Pause carousel auto-advance' : 'Resume carousel auto-advance'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Prev/Next arrows */}
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            title="Previous proverb"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-2xs"
            title="Next proverb"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Card Content */}
      <div className="p-5 sm:p-7 space-y-5 relative">
        {/* Subtle decorative watermark icon */}
        <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
          <MaasaiMedallion size={110} />
        </div>

        {/* Proverb Focus Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-2xs ${proverb.accent.badgeBg}`}
            >
              Theme: {proverb.studyTheme}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              East African Heritage Wisdom
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MoranShieldMotif size={22} animate={true} />
          </div>
        </div>

        {/* Large Typography: Swahili Proverb */}
        <div className="relative pl-6 sm:pl-8 border-l-4 border-amber-500/80 space-y-2">
          <Quote className="absolute -left-3 -top-1 w-6 h-6 text-amber-500/40 fill-amber-500/20" />
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            "{proverb.swahili}"
          </h2>
          <p className="text-sm sm:text-base font-semibold text-amber-900/90 italic">
            Literal Meaning: “{proverb.englishTranslation}”
          </p>
        </div>

        {/* Dual Cards: Exam Architectural Meaning vs Daily Study Habit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Exam Wisdom Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
              <Compass className="w-4 h-4 text-[#0078D4]" />
              <span>Azure Exam Blueprint Wisdom</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {proverb.examMeaning}
            </p>
          </div>

          {/* Daily Study Habit Action */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/80 border border-amber-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Recommended Study Habit</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
              {proverb.habitAction}
            </p>
          </div>
        </div>

        {/* Cultural Context Note */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
          <p className="italic">
            <span className="font-bold text-slate-700">Cultural Context:</span> {proverb.culturalContext}
          </p>

          {onTakeAction && (
            <button
              type="button"
              onClick={onTakeAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs shadow-2xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>Apply to Quiz</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}
        </div>

        {/* Bottom Dot Indicators with Auto-Advance Progress */}
        <div className="pt-2 flex items-center justify-center gap-2">
          {SWAHILI_STUDY_PROVERBS.map((p, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  isActive
                    ? 'w-7 h-2.5 bg-gradient-to-r from-amber-600 to-orange-600 shadow-2xs'
                    : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Jump to proverb: ${p.swahili}`}
                aria-label={`Slide ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
