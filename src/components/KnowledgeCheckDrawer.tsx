import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  BookmarkCheck,
  Check,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { AZ900_FLASHCARDS, Flashcard } from '../data/flashcardsData';

interface KnowledgeCheckDrawerProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onAskTutor?: (q: Question) => void;
}

export const KnowledgeCheckDrawer: React.FC<KnowledgeCheckDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onAskTutor,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  // Extract scenario text keywords to identify highest-relevance concepts
  const relevantConcepts = useMemo(() => {
    const qText = `${question.scenario} ${question.question} ${question.options.map((o) => o.text).join(' ')}`.toLowerCase();

    // Score all flashcards by relevance to this question
    const scored = AZ900_FLASHCARDS.map((card) => {
      let score = 0;
      const termLower = card.term.toLowerCase();
      const acronymLower = (card.acronym || '').toLowerCase();

      // High match: explicit term or acronym in scenario or options
      if (termLower.split(' ').some((word) => word.length > 3 && qText.includes(word))) {
        score += 8;
      }
      if (acronymLower && qText.includes(acronymLower)) {
        score += 10;
      }
      if (card.keyUnits.some((unit) => qText.includes(unit.toLowerCase()))) {
        score += 6;
      }
      // Module match
      if (card.moduleId === question.moduleId) {
        score += 5;
      }
      // Learning path match
      if (card.pathId === question.learningPathId) {
        score += 2;
      }

      return { card, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((item) => item.card);
  }, [question]);

  // Set default concept when question changes or drawer opens
  useEffect(() => {
    if (relevantConcepts.length > 0) {
      setSelectedConceptId(relevantConcepts[0].id);
    }
  }, [relevantConcepts]);

  // Filtered concepts based on user search query
  const displayedConcepts = useMemo(() => {
    if (!searchTerm.trim()) {
      return relevantConcepts;
    }
    const query = searchTerm.toLowerCase();
    return AZ900_FLASHCARDS.filter(
      (c) =>
        c.term.toLowerCase().includes(query) ||
        (c.acronym && c.acronym.toLowerCase().includes(query)) ||
        c.officialDefinition.toLowerCase().includes(query) ||
        c.keyUnits.some((u) => u.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [searchTerm, relevantConcepts]);

  const activeConcept: Flashcard | undefined = useMemo(() => {
    if (selectedConceptId) {
      const found = AZ900_FLASHCARDS.find((c) => c.id === selectedConceptId);
      if (found) return found;
    }
    return displayedConcepts[0] || relevantConcepts[0] || AZ900_FLASHCARDS[0];
  }, [selectedConceptId, displayedConcepts, relevantConcepts]);

  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-b from-blue-50/90 via-white to-slate-50/80 rounded-xl border border-blue-200/90 p-4 sm:p-5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#0078D4] text-white shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                Knowledge Check • In-Situ Concept Review
              </h3>
              <span className="text-[10px] font-bold bg-blue-100 text-[#0078D4] px-1.5 py-0.5 rounded">
                Module {question.moduleId}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Review Azure Curriculum definitions &amp; common exam traps without losing your quiz position
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Close Knowledge Check"
          aria-label="Close Knowledge Check"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Concept Selector Chips & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-600">
            Relevant Concepts for this Scenario:
          </span>

          {/* Quick Filter Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search any Azure concept..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0078D4] focus:border-[#0078D4] placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Concept Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {displayedConcepts.map((concept) => {
            const isSelected = activeConcept?.id === concept.id;
            return (
              <button
                key={concept.id}
                type="button"
                onClick={() => setSelectedConceptId(concept.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                  isSelected
                    ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/90'
                }`}
              >
                <span>{concept.acronym || concept.term.split('(')[0].trim()}</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Concept Definition Card */}
      {activeConcept && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs">
          {/* Concept Title & Category */}
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>{activeConcept.term}</span>
                {activeConcept.acronym && (
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {activeConcept.acronym}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Path {activeConcept.pathId} • {activeConcept.moduleTitle}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {activeConcept.keyUnits.slice(0, 3).map((unit, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                >
                  {unit}
                </span>
              ))}
            </div>
          </div>

          {/* Official Definition */}
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0078D4] flex items-center gap-1">
              <BookmarkCheck className="w-3 h-3" />
              <span>Azure Curriculum Definition</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-blue-50/40 p-3 rounded-lg border border-blue-100/80">
              {activeConcept.officialDefinition}
            </p>
          </div>

          {/* Two-Column Grid: Exam Trap vs. Memory Anchor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Exam Trap */}
            <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-200/70 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Exam Trap &amp; Distinction</span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed font-normal">
                {activeConcept.examTrap}
              </p>
            </div>

            {/* Memory Anchor / Analogy */}
            <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-200/70 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Harambee Memory Anchor</span>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-normal">
                {activeConcept.memoryRule}
              </p>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 italic">
              💡 Reviewing definitions builds conceptual anchors before committing to an answer.
            </span>

            {onAskTutor && (
              <button
                type="button"
                onClick={() => onAskTutor(question)}
                className="text-[11px] font-bold text-[#0078D4] hover:text-[#005A9E] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Deep dive with AI Tutor</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
