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
  Zap,
  XCircle,
  Clock,
  Target,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { AZ900_FLASHCARDS, Flashcard, FlashcardType } from '../data/flashcardsData';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface FlashcardsViewProps {
  stats: UserStats;
  initialModuleId?: number | 'all';
  onPracticeModule?: (moduleId: number) => void;
}

interface ShuffledQuickFireQuestion {
  card: Flashcard;
  options: string[];
  correctIndex: number;
}

interface QuickFireAnswerRecord {
  card: Flashcard;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  stats,
  initialModuleId = 'all',
  onPracticeModule,
}) => {
  // Primary mode: 'study' (Front/Back Flip Cards) vs 'quickfire' (15-20 Card Rapid Knowledge Drill)
  const [practiceMode, setPracticeMode] = useState<'study' | 'quickfire'>('study');
  const [activeFilter, setActiveFilter] = useState<
    'missed' | 'all' | 1 | 2 | 3 | 'starred'
  >('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<number | 'all'>(initialModuleId);
  const [selectedCardType, setSelectedCardType] = useState<FlashcardType | 'all'>('all');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    if (initialModuleId !== undefined) {
      setSelectedModuleFilter(initialModuleId);
      setActiveFilter('all');
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [initialModuleId]);

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
  const [needsReviewCards, setNeedsReviewCards] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('az900_needs_review_flashcards_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Quick-Fire 15-20 Drill State
  const [quickFireCount, setQuickFireCount] = useState<15 | 20>(15);
  const [quickFireDeck, setQuickFireDeck] = useState<ShuffledQuickFireQuestion[]>([]);
  const [quickFireIndex, setQuickFireIndex] = useState<number>(0);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [quickFireAnswers, setQuickFireAnswers] = useState<QuickFireAnswerRecord[]>([]);
  const [quickFireCompleted, setQuickFireCompleted] = useState<boolean>(false);
  const [quickFireStreak, setQuickFireStreak] = useState<number>(0);
  const [cardElapsedSeconds, setCardElapsedSeconds] = useState<number>(0);

  // Blind Recall Mode State
  const [isBlindRecallMode, setIsBlindRecallMode] = useState<boolean>(false);
  const [blindRecallInput, setBlindRecallInput] = useState<string>('');
  const [blindRecallSubmitted, setBlindRecallSubmitted] = useState<boolean>(false);
  const [blindRecallCorrect, setBlindRecallCorrect] = useState<boolean | null>(null);

  const handleSubmitBlindRecall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || !blindRecallInput.trim()) return;
    const guess = blindRecallInput.trim().toLowerCase();
    const term = currentCard.term.toLowerCase();
    const acronym = (currentCard.acronym || '').toLowerCase();
    const isCorrect: boolean = Boolean(
      term.includes(guess) || guess.includes(term) || (acronym && acronym === guess)
    );
    setBlindRecallSubmitted(true);
    setBlindRecallCorrect(isCorrect);
    if (isCorrect) {
      if (!masteredCards.includes(currentCard.id)) {
        setMasteredCards((prev) => [...prev, currentCard.id]);
      }
      setNeedsReviewCards((prev) => prev.filter((id) => id !== currentCard.id));
    } else {
      markCardNeedsReview(currentCard.id);
    }
  };

  useEffect(() => {
    setBlindRecallInput('');
    setBlindRecallSubmitted(false);
    setBlindRecallCorrect(null);
  }, [currentIndex, activeFilter, selectedModuleFilter, selectedCardType]);

  // Persist mastery, starred, and needs-review lists
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

  useEffect(() => {
    try {
      localStorage.setItem('az900_needs_review_flashcards_v1', JSON.stringify(needsReviewCards));
    } catch (e) {
      console.error(e);
    }
  }, [needsReviewCards]);

  // Identify modules where the user made mistakes in quiz history
  const missedModuleIds = useMemo(() => {
    const modulesWithErrors = new Set<number>();

    if (stats.mistakesHistory && stats.mistakesHistory.length > 0) {
      stats.mistakesHistory.forEach((m) => modulesWithErrors.add(m.moduleId));
    }

    Object.entries(stats.moduleMastery || {}).forEach(([modStr, record]) => {
      if (record.total > 0 && record.correct / record.total < 0.75) {
        modulesWithErrors.add(Number(modStr));
      }
    });

    Object.values(stats.attempts || {}).forEach((attempts) => {
      attempts.forEach((a) => {
        if (!a.isCorrect && a.moduleId) {
          modulesWithErrors.add(a.moduleId);
        }
      });
    });

    return modulesWithErrors;
  }, [stats]);

  const allModulesList = useMemo(() => {
    return LEARNING_PATHS.flatMap((p) => p.modules);
  }, []);

  // Filtered list of cards
  const cardList = useMemo(() => {
    let list: Flashcard[] = [...AZ900_FLASHCARDS];

    if (activeFilter === 'missed') {
      const filteredMissed = list.filter(
        (c) => missedModuleIds.has(c.moduleId) || needsReviewCards.includes(c.id)
      );
      list = filteredMissed.length > 0 ? filteredMissed : list.slice(0, 15);
    } else if (activeFilter === 'starred') {
      const filteredStarred = list.filter((c) => starredCards.includes(c.id));
      list = filteredStarred.length > 0 ? filteredStarred : list;
    } else if (activeFilter === 1 || activeFilter === 2 || activeFilter === 3) {
      list = list.filter((c) => c.pathId === activeFilter);
    }

    if (selectedModuleFilter !== 'all') {
      list = list.filter((c) => c.moduleId === selectedModuleFilter);
    }

    if (selectedCardType !== 'all') {
      list = list.filter((c) => c.cardType === selectedCardType);
    }

    return list;
  }, [
    activeFilter,
    selectedModuleFilter,
    selectedCardType,
    missedModuleIds,
    starredCards,
    needsReviewCards,
  ]);

  // Build a Quick-Fire 15 or 20 Card Deck with deterministically shuffled options
  const startQuickFireSession = useCallback(
    (targetCount: 15 | 20 = quickFireCount, customPool?: Flashcard[]) => {
      const sourcePool =
        customPool && customPool.length > 0
          ? customPool
          : cardList.length >= 5
          ? cardList
          : AZ900_FLASHCARDS;

      // Prioritize missed/unmastered cards first, then shuffle
      const prioritized = [...sourcePool].sort((a, b) => {
        const aPriority =
          needsReviewCards.includes(a.id) || missedModuleIds.has(a.moduleId) ? 0 : 1;
        const bPriority =
          needsReviewCards.includes(b.id) || missedModuleIds.has(b.moduleId) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return Math.random() - 0.5;
      });

      // If sourcePool has fewer than targetCount, supplement from full bank without duplicates
      const selectedCards: Flashcard[] = [...prioritized.slice(0, targetCount)];
      if (selectedCards.length < targetCount) {
        const usedIds = new Set(selectedCards.map((c) => c.id));
        const extras = AZ900_FLASHCARDS.filter((c) => !usedIds.has(c.id)).sort(
          () => Math.random() - 0.5
        );
        selectedCards.push(...extras.slice(0, targetCount - selectedCards.length));
      }

      const builtDeck: ShuffledQuickFireQuestion[] = selectedCards.map((card) => {
        const rawOptions =
          card.quickFireOptions && card.quickFireOptions.length === 4
            ? card.quickFireOptions
            : [
                card.officialDefinition,
                'Applies only to on-premises physical mainframes without cloud connectivity',
                'Automatically bypasses all Microsoft Entra ID and Azure Policy guardrails',
                'Requires manual hardware procurement and 5-year CapEx depreciation',
              ];
        const rawCorrectText = rawOptions[card.quickFireCorrectIndex ?? 0];

        // Shuffle options while tracking the correct answer index
        const indexed = rawOptions.map((opt) => ({
          text: opt,
          isCorrect: opt === rawCorrectText,
        }));
        for (let i = indexed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
        }

        return {
          card,
          options: indexed.map((item) => item.text),
          correctIndex: indexed.findIndex((item) => item.isCorrect),
        };
      });

      setQuickFireCount(targetCount);
      setQuickFireDeck(builtDeck);
      setQuickFireIndex(0);
      setSelectedChoiceIdx(null);
      setQuickFireAnswers([]);
      setQuickFireCompleted(false);
      setQuickFireStreak(0);
      setCardElapsedSeconds(0);
      setPracticeMode('quickfire');
    },
    [cardList, missedModuleIds, needsReviewCards, quickFireCount]
  );

  // Per-card timer in Quick-Fire mode
  useEffect(() => {
    if (practiceMode !== 'quickfire' || quickFireCompleted || selectedChoiceIdx !== null) {
      return;
    }
    const timer = setInterval(() => {
      setCardElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [practiceMode, quickFireCompleted, selectedChoiceIdx, quickFireIndex]);

  // Reset index and flipped state on filter change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeFilter, selectedModuleFilter, selectedCardType]);

  const currentCard: Flashcard | undefined = cardList[currentIndex];
  const currentQuickFireItem: ShuffledQuickFireQuestion | undefined =
    quickFireDeck[quickFireIndex];

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
      setCurrentIndex(
        randomIndex === currentIndex ? (randomIndex + 1) % cardList.length : randomIndex
      );
    }
  };

  const toggleMastered = (cardId: string) => {
    setMasteredCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
    setNeedsReviewCards((prev) => prev.filter((id) => id !== cardId));
  };

  const markCardNeedsReview = (cardId: string) => {
    setNeedsReviewCards((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
    setMasteredCards((prev) => prev.filter((id) => id !== cardId));
  };

  const toggleStarred = (cardId: string) => {
    setStarredCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const handleSelectQuickFireChoice = (choiceIdx: number) => {
    if (!currentQuickFireItem || selectedChoiceIdx !== null) return;
    setSelectedChoiceIdx(choiceIdx);

    const isCorrect = choiceIdx === currentQuickFireItem.correctIndex;
    const record: QuickFireAnswerRecord = {
      card: currentQuickFireItem.card,
      selectedOption: currentQuickFireItem.options[choiceIdx],
      correctOption: currentQuickFireItem.options[currentQuickFireItem.correctIndex],
      isCorrect,
      timeSpentSeconds: Math.max(1, cardElapsedSeconds),
    };

    setQuickFireAnswers((prev) => [...prev, record]);
    if (isCorrect) {
      setQuickFireStreak((prev) => prev + 1);
      if (!masteredCards.includes(currentQuickFireItem.card.id)) {
        setMasteredCards((prev) => [...prev, currentQuickFireItem.card.id]);
      }
      setNeedsReviewCards((prev) =>
        prev.filter((id) => id !== currentQuickFireItem.card.id)
      );
    } else {
      setQuickFireStreak(0);
      markCardNeedsReview(currentQuickFireItem.card.id);
    }
  };

  const handleNextQuickFireCard = () => {
    if (quickFireIndex + 1 < quickFireDeck.length) {
      setQuickFireIndex((prev) => prev + 1);
      setSelectedChoiceIdx(null);
      setCardElapsedSeconds(0);
    } else {
      setQuickFireCompleted(true);
    }
  };

  // Keyboard navigation in Study Mode: Space to flip, ArrowLeft/ArrowRight to navigate
  useEffect(() => {
    if (practiceMode !== 'study') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
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
  }, [practiceMode, handleNext, handlePrev]);

  const isCurrentMastered = currentCard ? masteredCards.includes(currentCard.id) : false;
  const isCurrentStarred = currentCard ? starredCards.includes(currentCard.id) : false;
  const isCurrentMissed = currentCard
    ? missedModuleIds.has(currentCard.moduleId) || needsReviewCards.includes(currentCard.id)
    : false;

  const quickFireCorrectCount = useMemo(
    () => quickFireAnswers.filter((a) => a.isCorrect).length,
    [quickFireAnswers]
  );
  const quickFireAccuracy = useMemo(() => {
    if (quickFireAnswers.length === 0) return 0;
    return Math.round((quickFireCorrectCount / quickFireAnswers.length) * 100);
  }, [quickFireAnswers.length, quickFireCorrectCount]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 left-0 right-0">
          <KitengeRibbon height={3} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0078D4] text-white tracking-wide uppercase">
                12 Modules • {AZ900_FLASHCARDS.length} Deep Cards
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Quick-Fire 15–20 Knowledge Drills &amp; Flip Deck
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              AZ-900 Concept Flashcards &amp; Quick-Fire Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Study deep architectural comparisons, exam traps, and memory hooks across all 12 modules, or launch a <strong>15–20 Card Quick-Fire Drill</strong> to actively test your recall, understand mistakes immediately, and lock in Azure Fundamentals mastery.
            </p>
          </div>

          {/* Right Mode Switcher & Mastery Stat */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15">
              <MaasaiMedallion size={30} />
              <div>
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Mastered
                </div>
                <div className="text-lg font-black text-white leading-tight">
                  {masteredCards.length}{' '}
                  <span className="text-xs text-slate-300 font-normal">
                    / {AZ900_FLASHCARDS.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick-Fire 15 / 20 Launch Buttons */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => startQuickFireSession(15)}
                className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                  practiceMode === 'quickfire' && quickFireCount === 15
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-white'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Quick-Fire 15 Cards</span>
              </button>
              <button
                type="button"
                onClick={() => startQuickFireSession(20)}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                  practiceMode === 'quickfire' && quickFireCount === 20
                    ? 'bg-sky-400 text-slate-950 border-white font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Quick-Fire 20 Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher + Path, Module & Card-Type Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Mode Tabs: Flip Deck vs Quick-Fire Drill */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setPracticeMode('study')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                practiceMode === 'study'
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Flip-Card Study Deck</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (quickFireDeck.length === 0) {
                  startQuickFireSession(15);
                } else {
                  setPracticeMode('quickfire');
                }
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                practiceMode === 'quickfire'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick-Fire Knowledge Drill ({quickFireCount}Q)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPracticeMode('study');
                setIsBlindRecallMode((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                isBlindRecallMode
                  ? 'bg-purple-700 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 bg-purple-50/60'
              }`}
              title="Blind Recall: Type the service name before revealing"
            >
              <Target className="w-3.5 h-3.5 text-purple-600" />
              <span>Blind Recall {isBlindRecallMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Right Filter Selectors: Module & Card Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedModuleFilter}
              onChange={(e) =>
                setSelectedModuleFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              aria-label="Filter flashcards by module"
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">All 12 Modules ({AZ900_FLASHCARDS.length})</option>
              {allModulesList.map((m) => (
                <option key={m.id} value={m.id}>
                  M{m.id}: {m.title}
                </option>
              ))}
            </select>

            <select
              value={selectedCardType}
              onChange={(e) => setSelectedCardType(e.target.value as any)}
              aria-label="Filter flashcards by card depth type"
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">All Card Depth Types</option>
              <option value="Service Comparison">Service Comparisons</option>
              <option value="Exam Trap & Distinction">Exam Traps &amp; Distinctions</option>
              <option value="Concept & Architecture">Core Architecture</option>
              <option value="Governance, SLA & Cost">Governance, SLA &amp; Cost</option>
            </select>

            {practiceMode === 'study' && (
              <button
                type="button"
                onClick={handleShuffle}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0078D4] hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                title="Shuffle Cards"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            )}
          </div>
        </div>

        {/* Path & Focus Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#0078D4] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Cards ({AZ900_FLASHCARDS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('missed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'missed'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Focus &amp; Missed (
              {missedModuleIds.size > 0 || needsReviewCards.length > 0
                ? AZ900_FLASHCARDS.filter(
                    (c) =>
                      missedModuleIds.has(c.moduleId) || needsReviewCards.includes(c.id)
                  ).length
                : 15}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 1
                ? 'bg-[#D97706] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Path 1: Concepts
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(2)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 2
                ? 'bg-[#0078D4] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Path 2: Architecture &amp; Services
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(3)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 3
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Path 3: Governance &amp; Security
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('starred')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'starred'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Starred ({starredCards.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODE A: QUICK-FIRE 15–20 CARD KNOWLEDGE DRILL & MISTAKE DIAGNOSTICS
         ===================================================================== */}
      {practiceMode === 'quickfire' ? (
        <div className="space-y-4">
          {quickFireCompleted ? (
            /* Quick-Fire Session Summary & Mistake Remediation View */
            <div className="bg-white rounded-2xl border-2 border-sky-200 p-5 sm:p-7 shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${
                      quickFireAccuracy >= 75
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}
                  >
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-[#005A9E]">
                      Quick-Fire {quickFireDeck.length}-Card Drill Complete
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                      Score: {quickFireAccuracy}% ({quickFireCorrectCount}/{quickFireDeck.length}{' '}
                      Correct)
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {quickFireAnswers.some((a) => !a.isCorrect) && (
                    <button
                      type="button"
                      onClick={() => {
                        const missedOnly = quickFireAnswers
                          .filter((a) => !a.isCorrect)
                          .map((a) => a.card);
                        startQuickFireSession(15, missedOnly);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        Drill {quickFireAnswers.filter((a) => !a.isCorrect).length} Missed Cards
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => startQuickFireSession(15)}
                    className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>New 15-Card Quick-Fire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startQuickFireSession(20)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>New 20-Card Quick-Fire</span>
                  </button>
                </div>
              </div>

              {/* Mistake Review List */}
              {quickFireAnswers.filter((a) => !a.isCorrect).length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Flawless Quick-Fire Sprint! Every concept and exam distinction was answered accurately.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Mistakes to Understand &amp; Lock In (
                      {quickFireAnswers.filter((a) => !a.isCorrect).length})
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {quickFireAnswers
                      .filter((a) => !a.isCorrect)
                      .map((ans, idx) => (
                        <div
                          key={`${ans.card.id}-${idx}`}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-900">
                              {ans.card.term} (M{ans.card.moduleId}: {ans.card.moduleTitle})
                            </span>
                            {onPracticeModule && (
                              <button
                                type="button"
                                onClick={() => onPracticeModule(ans.card.moduleId)}
                                className="text-[#0078D4] hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                              >
                                <span>Drill Module {ans.card.moduleId}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                              <strong className="block text-[10px] uppercase">Your Choice:</strong>
                              <span>{ans.selectedOption}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                              <strong className="block text-[10px] uppercase">
                                Correct Concept:
                              </strong>
                              <span>{ans.correctOption}</span>
                            </div>
                          </div>
                          {ans.card.mistakeDiagnostic && (
                            <p className="text-slate-700 font-semibold">
                              <strong>Why it matters: </strong>
                              {ans.card.mistakeDiagnostic}
                            </p>
                          )}
                          <p className="text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <strong>{ans.card.examTrap}</strong>
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : currentQuickFireItem ? (
            /* Active Quick-Fire Question Card */
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-5">
              {/* Top Progress & Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0078D4] text-white text-xs font-black">
                    Quick-Fire {quickFireIndex + 1} / {quickFireDeck.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                    Module {currentQuickFireItem.card.moduleId}:{' '}
                    {currentQuickFireItem.card.moduleTitle}
                  </span>
                  {currentQuickFireItem.card.cardType && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0078D4] border border-blue-200 text-[11px] font-extrabold">
                      {currentQuickFireItem.card.cardType}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-amber-400" />
                    <span>Streak: {quickFireStreak}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>{cardElapsedSeconds}s</span>
                  </span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => startQuickFireSession(15)}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        quickFireCount === 15
                          ? 'bg-[#0078D4] text-white font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      15Q
                    </button>
                    <button
                      type="button"
                      onClick={() => startQuickFireSession(20)}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        quickFireCount === 20
                          ? 'bg-[#0078D4] text-white font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      20Q
                    </button>
                  </div>
                </div>
              </div>

              {/* Prompt & Concept Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {currentQuickFireItem.card.term}
                  </h2>
                  {currentQuickFireItem.card.acronym && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      {currentQuickFireItem.card.acronym}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-800 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
                  {currentQuickFireItem.card.frontPrompt}
                </p>
              </div>

              {/* 4 Multiple-Choice Options */}
              <div className="space-y-2.5">
                {currentQuickFireItem.options.map((opt, idx) => {
                  const isAnswered = selectedChoiceIdx !== null;
                  const isSelected = selectedChoiceIdx === idx;
                  const isCorrectOption = idx === currentQuickFireItem.correctIndex;

                  let btnStyle =
                    'bg-slate-50 hover:bg-sky-50/80 text-slate-800 border-slate-200 hover:border-[#0078D4]';
                  if (isAnswered) {
                    if (isCorrectOption) {
                      btnStyle =
                        'bg-emerald-50 text-emerald-950 border-emerald-500 ring-1 ring-emerald-400 font-extrabold';
                    } else if (isSelected) {
                      btnStyle =
                        'bg-rose-50 text-rose-950 border-rose-500 ring-1 ring-rose-400 font-bold';
                    } else {
                      btnStyle = 'bg-slate-50/60 text-slate-400 border-slate-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectQuickFireChoice(idx)}
                      className={`w-full p-3.5 rounded-xl border-2 text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </div>
                      {isAnswered && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Mistake Breakdown & Deep Concept Explanation */}
              {selectedChoiceIdx !== null && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 ${
                        selectedChoiceIdx === currentQuickFireItem.correctIndex
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {selectedChoiceIdx === currentQuickFireItem.correctIndex ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Spot On! Concept Locked In</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Mistake Breakdown — Added to Focus Review</span>
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextQuickFireCard}
                      className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>
                        {quickFireIndex + 1 < quickFireDeck.length
                          ? 'Next Quick-Fire Card'
                          : 'View Drill Results'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {currentQuickFireItem.card.mistakeDiagnostic && (
                    <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                      <strong className="text-[#0078D4]">Key Distinction: </strong>
                      {currentQuickFireItem.card.mistakeDiagnostic}
                    </div>
                  )}

                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    <strong className="text-slate-900">Official Curriculum Definition: </strong>
                    {currentQuickFireItem.card.officialDefinition}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950">
                      <strong className="font-extrabold">{currentQuickFireItem.card.examTrap}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
                      <strong>Harambee Memory Rule: </strong>
                      {currentQuickFireItem.card.memoryRule}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        /* =====================================================================
            MODE B: INTERACTIVE FRONT/BACK STUDY DECK
           ===================================================================== */
        <>
          {/* Progress & Card Index */}
          {cardList.length > 0 && currentCard && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">
                  Card {currentIndex + 1} of {cardList.length}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">{currentCard.pathTitle}</span>
                {currentCard.cardType && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="px-2 py-0.5 rounded bg-sky-50 text-[#0078D4] border border-sky-200 font-bold text-[11px]">
                      {currentCard.cardType}
                    </span>
                  </>
                )}
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
                No flashcards match this combination of filters. Reset filters to view all{' '}
                {AZ900_FLASHCARDS.length} cards.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedModuleFilter('all');
                  setSelectedCardType('all');
                }}
                className="px-4 py-2 bg-[#0078D4] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
              >
                Show All {AZ900_FLASHCARDS.length} Flashcards
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

                    {currentCard.difficulty && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        {currentCard.difficulty}
                      </span>
                    )}

                    {isCurrentMissed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Focus Review Area
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Star and Flip */}
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => toggleStarred(currentCard.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isCurrentStarred
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                      }`}
                      title={
                        isCurrentStarred ? 'Unstar this card' : 'Star for focus review'
                      }
                    >
                      <Star
                        className={`w-4 h-4 ${isCurrentStarred ? 'fill-amber-400' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0078D4] hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Flip Card"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {isFlipped ? 'Show Term' : 'Show Definition'}
                      </span>
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
                        <span>
                          {isBlindRecallMode
                            ? 'Blind Recall Mode — Name the Azure Service / Concept'
                            : 'Official Concept & Scenario Trigger'}
                        </span>
                      </div>

                      {isBlindRecallMode && !blindRecallSubmitted ? (
                        <div className="space-y-4 pt-2">
                          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-sm font-medium leading-relaxed">
                            <span className="font-bold text-purple-950 block mb-1">
                              Recall Challenge (Define/Trigger):
                            </span>
                            {currentCard.frontPrompt}
                            <div className="text-xs text-purple-800 mt-2">
                              <em>Hint categories:</em> {currentCard.category} • Module {currentCard.moduleId}
                            </div>
                          </div>

                          <form onSubmit={handleSubmitBlindRecall} className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Type Azure Service Name or Concept Term:
                              </label>
                              <input
                                type="text"
                                value={blindRecallInput}
                                onChange={(e) => setBlindRecallInput(e.target.value)}
                                placeholder="e.g. Azure Policy, ExpressRoute, LRS..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
                                autoFocus
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={!blindRecallInput.trim()}
                                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-sm cursor-pointer disabled:opacity-40"
                              >
                                Submit Recall Answer
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBlindRecallSubmitted(true);
                                  setBlindRecallCorrect(false);
                                }}
                                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                              >
                                Reveal Answer
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                              {currentCard.term}
                            </h2>
                            {isBlindRecallMode && blindRecallSubmitted && (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                                  blindRecallCorrect
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {blindRecallCorrect ? 'Correct Recall! ✓' : 'Incorrect — Review Correct Term'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {currentCard.acronym && (
                              <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
                                {currentCard.acronym}
                              </div>
                            )}
                            {currentCard.keyUnits.map((unit) => (
                              <span
                                key={unit}
                                className="px-2 py-0.5 rounded-md bg-sky-50 text-[#005A9E] border border-sky-200/80 text-[11px] font-bold"
                              >
                                {unit}
                              </span>
                            ))}
                          </div>

                          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-sm font-medium leading-relaxed">
                            <span className="font-bold text-amber-900 block mb-1">
                              Exam Scenario Trigger:
                            </span>
                            {currentCard.frontPrompt}
                          </div>

                          <div className="flex items-center gap-2 pt-2 text-xs text-slate-400 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              Click anywhere or press Space to reveal the Azure Curriculum definition, mistake diagnostic, and exam trap!
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* BACK OF CARD */
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Azure Curriculum Definition &amp; Deep Comparison</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          {currentCard.term}
                        </span>
                      </div>

                      <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {currentCard.officialDefinition}
                      </div>

                      {currentCard.mistakeDiagnostic && (
                        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
                          <strong className="font-extrabold text-[#0078D4]">
                            Key Takeaway:{' '}
                          </strong>
                          <span>{currentCard.mistakeDiagnostic}</span>
                        </div>
                      )}

                      {/* Exam Trap Warning */}
                      <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-950 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-red-900">
                            {currentCard.examTrap}
                          </span>
                        </div>
                      </div>

                      {/* Harambee Memory Hook */}
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900">
                            Harambee Memory Rule:{' '}
                          </span>
                          <span>{currentCard.memoryRule}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Self-Assessment Confidence & Module Practice */}
                <div
                  className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleMastered(currentCard.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isCurrentMastered
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {isCurrentMastered ? 'Mastered ✓' : 'Mark as Mastered'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => markCardNeedsReview(currentCard.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        needsReviewCards.includes(currentCard.id)
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {needsReviewCards.includes(currentCard.id)
                          ? 'In Focus Queue'
                          : 'Needs More Drill'}
                      </span>
                    </button>
                  </div>

                  {onPracticeModule && (
                    <button
                      type="button"
                      onClick={() => onPracticeModule(currentCard.moduleId)}
                      className="flex items-center gap-1 text-xs font-bold text-[#0078D4] hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      <span>Practice Module {currentCard.moduleId} Questions</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 shadow-2xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Centered Flip Button */}
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{isFlipped ? 'Flip to Question' : 'Flip to Definition'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 shadow-2xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
