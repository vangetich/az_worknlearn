import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Sparkles,
  Flame,
  Award,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AZ900_FLASHCARDS, Flashcard } from '../data/flashcardsData';
import { UserStats } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface FlashcardsViewProps {
  stats: UserStats;
  onPracticeModule?: (moduleId: number) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  stats,
  onPracticeModule,
}) => {
  const [activeFilter, setActiveFilter] = useState<'missed' | 'all' | 1 | 2 | 3 | 'starred'>('missed');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('az900_mastered_flashcards_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [starredCards, setStarredCards] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('az900_starred_flashcards_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save mastery and starred lists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('az900_mastered_flashcards_v1', JSON.stringify(masteredCards));
    } catch (e) {
      console.error(e);
    }
  }, [masteredCards]);

  useEffect(() => {
    try {
      localStorage.setItem('az900_starred_flashcards_v1', JSON.stringify(starredCards));
    } catch (e) {
      console.error(e);
    }
  }, [starredCards]);

  // Identify modules or concepts where the user made mistakes in quiz history
  const missedModuleIds = useMemo(() => {
    const modulesWithErrors = new Set<number>();
    
    // Check mistakesHistory
    if (stats.mistakesHistory && stats.mistakesHistory.length > 0) {
      stats.mistakesHistory.forEach((m) => modulesWithErrors.add(m.moduleId));
    }

    // Check moduleMastery where accuracy is less than 75%
    Object.entries(stats.moduleMastery || {}).forEach(([modStr, record]) => {
      if (record.total > 0 && (record.correct / record.total) < 0.75) {
        modulesWithErrors.add(Number(modStr));
      }
    });

    // Check attempts history
    Object.values(stats.attempts || {}).forEach((attempts) => {
      attempts.forEach((a) => {
        if (!a.isCorrect && a.moduleId) {
          modulesWithErrors.add(a.moduleId);
        }
      });
    });

    return modulesWithErrors;
  }, [stats]);

  // Filtered list of cards
  const cardList = useMemo(() => {
    let list: Flashcard[] = [];

    if (activeFilter === 'missed') {
      // Prioritize flashcards whose moduleId matches the user's missed history
      list = AZ900_FLASHCARDS.filter((c) => missedModuleIds.has(c.moduleId));
      // If user hasn't made mistakes yet, provide recommended core concepts
      if (list.length === 0) {
        list = AZ900_FLASHCARDS.slice(0, 10);
      }
    } else if (activeFilter === 'starred') {
      list = AZ900_FLASHCARDS.filter((c) => starredCards.includes(c.id));
      if (list.length === 0) {
        list = AZ900_FLASHCARDS;
      }
    } else if (activeFilter === 'all') {
      list = AZ900_FLASHCARDS;
    } else {
      // 1, 2, or 3
      list = AZ900_FLASHCARDS.filter((c) => c.pathId === activeFilter);
    }

    return list;
  }, [activeFilter, missedModuleIds, starredCards]);

  // Reset index and flipped state on filter change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeFilter]);

  const currentCard: Flashcard | undefined = cardList[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1 < cardList.length ? prev + 1 : 0));
    }, 120);
  }, [cardList.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : cardList.length - 1));
    }, 120);
  }, [cardList.length]);

  const handleShuffle = () => {
    setIsFlipped(false);
    if (cardList.length > 1) {
      const randomIndex = Math.floor(Math.random() * cardList.length);
      setCurrentIndex(randomIndex === currentIndex ? (randomIndex + 1) % cardList.length : randomIndex);
    }
  };

  const toggleMastered = (cardId: string) => {
    setMasteredCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const toggleStarred = (cardId: string) => {
    setStarredCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Keyboard navigation: Space to flip, ArrowLeft to prev, ArrowRight to next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const isCurrentMastered = currentCard ? masteredCards.includes(currentCard.id) : false;
  const isCurrentStarred = currentCard ? starredCards.includes(currentCard.id) : false;
  const isCurrentMissed = currentCard ? missedModuleIds.has(currentCard.moduleId) : false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 left-0 right-0">
          <KitengeRibbon height={3} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0078D4] text-white tracking-wide uppercase">
                Microsoft Curriculum Only
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Front / Back Core Review
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AZ-900 Concept Flashcards
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Rapidly reinforce core definitions and tricky exam traps aligned strictly with the official Microsoft curriculum. Priority cards surface definitions from your quiz error patterns.
            </p>
          </div>

          {/* Quick Mastery Stat */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 shrink-0">
            <MaasaiMedallion size={36} />
            <div>
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                Cards Mastered
              </div>
              <div className="text-xl font-black text-white">
                {masteredCards.length} <span className="text-xs text-slate-400 font-normal">/ {AZ900_FLASHCARDS.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('missed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'missed'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Missed in Quiz History ({missedModuleIds.size > 0 ? AZ900_FLASHCARDS.filter(c => missedModuleIds.has(c.moduleId)).length : 'Top 10'})</span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Cards ({AZ900_FLASHCARDS.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 1
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Path 1: Cloud Concepts</span>
          </button>

          <button
            onClick={() => setActiveFilter(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 2
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Path 2: Architecture & Compute</span>
          </button>

          <button
            onClick={() => setActiveFilter(3)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 3
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Path 3: Governance</span>
          </button>

          <button
            onClick={() => setActiveFilter('starred')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'starred'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-300" />
            <span>Starred ({starredCards.length})</span>
          </button>
        </div>

        {/* Shuffle Button */}
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0078D4] hover:bg-blue-50 border border-slate-200 transition-colors"
          title="Shuffle Cards"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>
      </div>

      {/* Progress & Card Index */}
      {cardList.length > 0 && currentCard && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Card {currentIndex + 1} of {cardList.length}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              {currentCard.pathTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-slate-400">
              Press [Space] to flip • [← / →] to navigate
            </span>
          </div>
        </div>
      )}

      {/* Main Flashcard Container */}
      {cardList.length === 0 || !currentCard ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No cards in this filter</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You haven't starred any cards yet, or there are no cards matching this filter.
          </p>
          <button
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2 bg-[#0078D4] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Show All Flashcards
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Flip Presentation */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group cursor-pointer select-none min-h-[380px] sm:min-h-[350px] relative rounded-2xl bg-white border-2 border-slate-200 hover:border-[#0078D4] transition-all shadow-md hover:shadow-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-2 ${
                currentCard.pathId === 1
                  ? 'bg-amber-500'
                  : currentCard.pathId === 2
                  ? 'bg-[#0078D4]'
                  : 'bg-emerald-600'
              }`}
            />

            {/* Top Bar of the Card */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {currentCard.category}
                </span>

                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0078D4] border border-blue-200">
                  Module {currentCard.moduleId}: {currentCard.moduleTitle}
                </span>

                {isCurrentMissed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    Quiz Focus Area
                  </span>
                )}
              </div>

              {/* Action Buttons: Star and Flip */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleStarred(currentCard.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    isCurrentStarred
                      ? 'text-amber-500 bg-amber-50'
                      : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                  }`}
                  title={isCurrentStarred ? 'Unstar this card' : 'Star for focus review'}
                >
                  <Star className={`w-4 h-4 ${isCurrentStarred ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#0078D4] hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Flip Card"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="hidden sm:inline">{isFlipped ? 'Show Term' : 'Show Definition'}</span>
                </button>
              </div>
            </div>

            {/* Main Content Area: Front vs Back */}
            <div className="py-6 sm:py-8">
              {!isFlipped ? (
                /* FRONT OF CARD */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs uppercase font-extrabold text-[#0078D4] tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Official Concept &amp; Scenario Trigger</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    {currentCard.term}
                  </h2>

                  {currentCard.acronym && (
                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      {currentCard.acronym}
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-sm font-medium leading-relaxed">
                    <span className="font-bold text-amber-900 block mb-1">Exam Scenario Trigger:</span>
                    {currentCard.frontPrompt}
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Click anywhere or press Space to reveal the Microsoft official definition and exam trap!</span>
                  </div>
                </div>
              ) : (
                /* BACK OF CARD */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Microsoft Official Definition</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{currentCard.term}</span>
                  </div>

                  <div className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {currentCard.officialDefinition}
                  </div>

                  {/* Exam Trap Warning */}
                  <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-950 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-900">{currentCard.examTrap}</span>
                    </div>
                  </div>

                  {/* Harambee Memory Hook */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900">Harambee Memory Rule: </span>
                      <span>{currentCard.memoryRule}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar: Mastery Toggle and Practice Navigation */}
            <div
              className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => toggleMastered(currentCard.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isCurrentMastered
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCurrentMastered ? 'Mastered! (Click to reset)' : 'Mark as Mastered'}</span>
              </button>

              {onPracticeModule && (
                <button
                  onClick={() => onPracticeModule(currentCard.moduleId)}
                  className="flex items-center gap-1 text-xs font-bold text-[#0078D4] hover:text-blue-800 transition-colors"
                >
                  <span>Practice Module {currentCard.moduleId} Questions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 shadow-2xs transition-all hover:scale-[1.02] active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Centered Flip Button */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              <span>{isFlipped ? 'Flip to Question' : 'Flip to Definition'}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 shadow-2xs transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
