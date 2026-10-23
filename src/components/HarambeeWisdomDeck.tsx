import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Zap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { HARAMBEE_SLIDES, VITAL_EXAM_CUES, WisdomSlide, VitalCue } from '../data/harambeeWisdom';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface HarambeeWisdomDeckProps {
  onQuizTopic?: (moduleId: number) => void;
}

export const HarambeeWisdomDeck: React.FC<HarambeeWisdomDeckProps> = ({ onQuizTopic }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [showVitalCuesDrawer, setShowVitalCuesDrawer] = useState<boolean>(false);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);

  const currentSlide = HARAMBEE_SLIDES[currentSlideIndex];

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HARAMBEE_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HARAMBEE_SLIDES.length) % HARAMBEE_SLIDES.length);
  };

  return (
    <div className="space-y-6">
      {/* Harambee Technical Wisdom Slide Carousel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 card-elevation overflow-hidden transition-all shadow-md">
        {/* African Kitenge Ribbon */}
        <KitengeRibbon height={5} />

        {/* Carousel Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-amber-950 to-orange-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Sparkles className="w-6 h-6 fill-amber-200 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight">
                  Harambee Exam Wisdom
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  Slide {currentSlideIndex + 1} of {HARAMBEE_SLIDES.length}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Technical Know-How & Architectural Blueprints for Microsoft Azure Fundamentals
              </p>
            </div>
          </div>

          {/* Quick toggle to pop out vital cues */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVitalCuesDrawer(!showVitalCuesDrawer)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                showVitalCuesDrawer
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>{showVitalCuesDrawer ? 'Hide Vital Cues' : 'Pop Out Vital Cues (6)'}</span>
            </button>
          </div>
        </div>

        {/* Active Slide Canvas */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Swahili Proverb Header & English Anchor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                {currentSlide.swahiliTitle} • {currentSlide.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {currentSlide.englishTitle}
              </h2>
            </div>

            <MaasaiMedallion size={36} className="hidden sm:block opacity-60" />
          </div>

          {/* Golden Core Rule Card */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">
                Foundational Technical Rule:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-amber-950 mt-0.5 leading-relaxed">
                {currentSlide.coreRule}
              </p>
            </div>
          </div>

          {/* Technical Know-How Breakdown Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentSlide.technicalBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 hover:border-[#0078D4] hover:bg-blue-50/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    {item.label}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0078D4] shadow-2xs">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Often Missed Trap Cue on this Slide */}
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-900 block">
                ⚠️ Often Missed on Test (High-Yield Cue):
              </span>
              <p className="text-xs sm:text-sm text-orange-950 mt-0.5 font-normal leading-relaxed">
                {currentSlide.oftenMissedCue}
              </p>
            </div>
          </div>

          {/* Exam Shortcut Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <span className="font-bold text-[#0078D4]">Exam Anchor Shortcut:</span>
              <span>{currentSlide.examShortcut}</span>
            </div>

            {onQuizTopic && (
              <button
                onClick={() => onQuizTopic(5)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold shrink-0 shadow-2xs flex items-center gap-1 transition-colors"
              >
                <span>Quiz Me</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Carousel Slide Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Slide</span>
            </button>

            {/* Direct Slide Jump Pills */}
            <div className="flex items-center gap-1.5">
              {HARAMBEE_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    i === currentSlideIndex
                      ? 'bg-amber-600 text-white shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Next Slide</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* POP-OUT VITAL EXAM CUES DRAWER / EXPANDABLE TRAY */}
      {showVitalCuesDrawer && (
        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/70 rounded-2xl border border-amber-300 card-elevation p-6 sm:p-7 space-y-5 animate-in slide-in-from-top-4 duration-300 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Vital Information Queues • Frequently Missed on the Exam
                </h3>
                <p className="text-xs text-slate-600">
                  Quick cues that differentiate candidates who pass with 850+ from those who narrowly miss the 700 threshold.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowVitalCuesDrawer(false)}
              className="text-xs font-bold text-amber-900 hover:text-amber-700 self-end sm:self-center px-3 py-1 bg-amber-200/60 rounded-lg transition-colors"
            >
              Collapse Cues
            </button>
          </div>

          {/* Grid of 6 High-Yield Cues */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VITAL_EXAM_CUES.map((cue) => {
              const isSelected = selectedCueId === cue.id;

              return (
                <div
                  key={cue.id}
                  onClick={() => setSelectedCueId(isSelected ? null : cue.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs space-y-2.5 ${
                    isSelected
                      ? 'bg-white border-[#0078D4] ring-2 ring-[#0078D4]/20'
                      : 'bg-white/90 border-slate-200 hover:border-amber-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      Module {cue.moduleId}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Click to reveal detail
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {cue.topic}
                  </h4>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                    "{cue.questionTrigger}"
                  </div>

                  {/* Common Trap */}
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-red-600 block text-[11px]">
                      ❌ Common Mistake:
                    </span>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      {cue.commonMistake}
                    </p>
                  </div>

                  {/* Vital Correction */}
                  <div className="text-xs space-y-1 pt-1 border-t border-slate-100">
                    <span className="font-bold text-emerald-700 block text-[11px]">
                      ✓ Vital Architectural Fact:
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed">
                      {cue.vitalCorrection}
                    </p>
                  </div>

                  {/* Key Trigger Words */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {cue.keyTriggerWords.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#0078D4] border border-blue-200 font-semibold"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
