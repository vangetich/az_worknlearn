import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  BookOpen,
  Zap,
  Layers,
  Filter,
  Sparkles,
  CornerDownLeft,
  Compass,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { MODULE_FREQUENTLY_MISSED_TERMS } from '../data/frequentlyMissedTerms';

interface GlobalSearchBarProps {
  questions: Question[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSelectQuestion: (question: Question) => void;
  onSelectModule?: (moduleId: number, pathId: number) => void;
}

interface IndexedTerm {
  term: string;
  category: string;
  moduleId: number;
  moduleTitle: string;
  pathId: 1 | 2 | 3;
  definition?: string;
  examTrap?: string;
}

const POPULAR_SEARCH_TERMS = [
  'ExpressRoute',
  'RBAC',
  'Azure Policy',
  'Availability Zones',
  'CapEx vs OpEx',
  'PaaS',
  'Resource Locks',
  'Cosmos DB',
  'Entra ID',
  'Azure Arc',
];

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  questions,
  searchQuery,
  onSearchQueryChange,
  onSelectQuestion,
  onSelectModule,
}) => {
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local input when external searchQuery changes (e.g. cleared from banner)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Global keyboard shortcut (Cmd+K or Ctrl+K) to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build unified index of key terms & Azure services across all 12 modules
  const allIndexedTerms = useMemo<IndexedTerm[]>(() => {
    const termsList: IndexedTerm[] = [];
    const seen = new Set<string>();

    LEARNING_PATHS.forEach((path) => {
      path.modules.forEach((mod) => {
        // Add frequently missed terms with rich definitions first
        const missed = MODULE_FREQUENTLY_MISSED_TERMS[mod.id] || [];
        missed.forEach((m) => {
          const key = `${mod.id}-${m.term.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            termsList.push({
              term: m.term,
              category: m.category,
              moduleId: mod.id,
              moduleTitle: mod.title,
              pathId: path.id,
              definition: m.definition,
              examTrap: m.examTrap,
            });
          }
        });

        // Add curriculum keyTerms
        mod.keyTerms.forEach((kt) => {
          const key = `${mod.id}-${kt.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            termsList.push({
              term: kt,
              category: 'Azure Service / Concept',
              moduleId: mod.id,
              moduleTitle: mod.title,
              pathId: path.id,
              definition: mod.description,
            });
          }
        });
      });
    });

    return termsList;
  }, []);

  const normalizedQuery = inputValue.trim().toLowerCase();

  // Filter matching key terms / services
  const matchingTerms = useMemo(() => {
    if (!normalizedQuery) return [];
    return allIndexedTerms
      .filter(
        (item) =>
          item.term.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery) ||
          (item.definition && item.definition.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, 4);
  }, [allIndexedTerms, normalizedQuery]);

  // Filter matching questions in the question bank
  const matchingQuestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return questions.filter((q) => {
      const inQuestion = q.question.toLowerCase().includes(normalizedQuery);
      const inScenario = q.scenario.toLowerCase().includes(normalizedQuery);
      const inModule = q.moduleTitle.toLowerCase().includes(normalizedQuery);
      const inOptions = q.options.some((opt) => opt.text.toLowerCase().includes(normalizedQuery));
      const inWhy = q.whyCorrect.toLowerCase().includes(normalizedQuery);
      const inTip = q.examTip.toLowerCase().includes(normalizedQuery);
      return inQuestion || inScenario || inModule || inOptions || inWhy || inTip;
    });
  }, [questions, normalizedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onSearchQueryChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    setInputValue('');
    onSearchQueryChange('');
    inputRef.current?.focus();
  };

  const handleApplyTermFilter = (term: string) => {
    setInputValue(term);
    onSearchQueryChange(term);
    setIsOpen(false);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchQueryChange(inputValue.trim());
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md sm:w-72 md:w-80 lg:w-96">
      {/* Search Input Box */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all bg-slate-50/90 ${
          isOpen || inputValue.trim().length > 0
            ? 'border-[#0078D4] ring-2 ring-[#0078D4]/20 bg-white shadow-xs'
            : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <Search className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDownInput}
          placeholder="Search Azure services, terms, or scenarios..."
          aria-label="Global search for Azure services or key terms in question bank"
          className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />

        {inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Clear search filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 text-slate-500 border border-slate-300/60 shrink-0">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown Search Results & Quick Filter Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:left-0 sm:right-auto sm:w-[min(30rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl card-elevation z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
          {!normalizedQuery ? (
            /* Empty Query State: Popular Azure Services & Key Terms */
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Quick Filter by Azure Service or Exam Term</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {questions.length} Total Questions
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCH_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleApplyTermFilter(term)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0078D4] hover:text-white text-slate-700 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Type any service, SLA, or governance concept to filter questions</span>
                <span className="hidden sm:inline font-semibold">ESC to close</span>
              </div>
            </div>
          ) : (
            /* Active Search Results State */
            <div className="max-h-[72vh] overflow-y-auto divide-y divide-slate-100">
              {/* Top Bar: Apply Filter Across Active Quiz Deck */}
              <div className="p-3 bg-blue-50/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Filter className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>
                    Filtering Question Bank for{' '}
                    <span className="text-[#0078D4] font-black">"{inputValue}"</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0078D4] text-white">
                    {matchingQuestions.length} match{matchingQuestions.length === 1 ? '' : 'es'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>View Deck</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>

              {/* Section 1: Matching Key Terms & Azure Services */}
              {matchingTerms.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Matching Azure Services & Key Terms ({matchingTerms.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {matchingTerms.map((item, idx) => (
                      <div
                        key={`${item.moduleId}-${item.term}-${idx}`}
                        className="p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200/80 transition-all flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900">
                              {item.term}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-amber-900 border border-amber-200">
                              Module {item.moduleId}: {item.moduleTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApplyTermFilter(item.term)}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10px] transition-colors cursor-pointer"
                            >
                              Filter Term
                            </button>
                            {onSelectModule && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectModule(item.moduleId, item.pathId);
                                  setIsOpen(false);
                                }}
                                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Module {item.moduleId}
                              </button>
                            )}
                          </div>
                        </div>

                        {item.definition && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {item.definition}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Matching Questions in Question Bank */}
              <div className="p-3.5 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Matching Questions in Bank ({matchingQuestions.length})</span>
                  </span>
                  {matchingQuestions.length > 6 && (
                    <span className="text-[10px] text-[#0078D4] font-semibold">
                      Showing top 6 • Press Enter for all
                    </span>
                  )}
                </div>

                {matchingQuestions.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <Compass className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      No direct questions matched "{inputValue}"
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Try searching for core Azure services like "ExpressRoute", "RBAC", "Locks", "VMSS", or "PaaS".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {matchingQuestions.slice(0, 6).map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          onSelectQuestion(q);
                          setIsOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-[#0078D4] transition-all text-left group cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                              Path {q.learningPathId} • Mod {q.moduleId}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[160px]">
                              {q.moduleTitle}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                q.difficulty === 'Fundamental'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : q.difficulty === 'Intermediate'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-[#0078D4] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                            <span>Jump</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 line-clamp-1">
                          {q.question}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {q.scenario}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
