import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  X,
  ChevronRight,
  BookmarkCheck,
  Check,
  ExternalLink,
  Target,
  Layers,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { AZ900_FLASHCARDS, Flashcard } from '../data/flashcardsData';
import { resolveAzureDocsLink } from '../data/azureGlossaryData';

export interface ConceptDefinition {
  id: string;
  term: string;
  acronym?: string;
  officialDefinition: string;
  scenarioRelevance?: string;
  examTrap?: string;
  memoryRule?: string;
  category?: string;
  isCorrectTerm?: boolean;
}

export function extractScenarioTerminology(question: Question): ConceptDefinition[] {
  const qText = `${question.scenario} ${question.question} ${question.options.map((o) => o.text).join(' ')}`.toLowerCase();
  const definitions: ConceptDefinition[] = [];
  const seenTerms = new Set<string>();

  // 1. First, check options to see which Azure services/concepts are candidates
  question.options.forEach((opt) => {
    const optLower = opt.text.toLowerCase();
    const isCorrect = opt.letter === question.correctAnswer;

    // Find best flashcard match
    const matchedCard = AZ900_FLASHCARDS.find((card) => {
      const termLower = card.term.toLowerCase();
      const acronymLower = (card.acronym || '').toLowerCase();
      return (
        optLower.includes(termLower) ||
        termLower.includes(optLower) ||
        (card.acronym && optLower.includes(card.acronym.toLowerCase())) ||
        (acronymLower.length > 2 && optLower.includes(acronymLower))
      );
    });

    if (matchedCard && !seenTerms.has(matchedCard.term)) {
      seenTerms.add(matchedCard.term);
      const distractor = question.distractorBreakdown.find((d) => d.letter === opt.letter);
      definitions.push({
        id: matchedCard.id,
        term: matchedCard.term,
        acronym: matchedCard.acronym,
        officialDefinition: matchedCard.officialDefinition,
        scenarioRelevance: isCorrect
          ? question.whyCorrect
          : distractor?.reason || `Evaluated in Option ${opt.letter} for this scenario.`,
        examTrap: matchedCard.examTrap,
        memoryRule: matchedCard.memoryRule,
        category: matchedCard.category,
        isCorrectTerm: isCorrect,
      });
    } else if (!seenTerms.has(opt.text)) {
      // Dynamic fallback for custom options
      seenTerms.add(opt.text);
      const distractor = question.distractorBreakdown.find((d) => d.letter === opt.letter);
      definitions.push({
        id: `opt-${opt.letter}`,
        term: opt.text,
        officialDefinition: isCorrect
          ? question.whyCorrect
          : distractor?.reason || `Azure service or architecture option evaluated in choice ${opt.letter}.`,
        scenarioRelevance: isCorrect
          ? 'This is the optimal Microsoft Azure architecture solution satisfying all constraints in the scenario.'
          : distractor?.reason,
        examTrap: question.examTip,
        isCorrectTerm: isCorrect,
      });
    }
  });

  // 2. Also check if any key flashcards in this module appear in scenario text
  AZ900_FLASHCARDS.filter((c) => c.moduleId === question.moduleId).forEach((card) => {
    if (seenTerms.has(card.term)) return;
    const termLower = card.term.toLowerCase();
    const acronymLower = (card.acronym || '').toLowerCase();
    if (qText.includes(termLower) || (acronymLower.length > 2 && qText.includes(acronymLower))) {
      seenTerms.add(card.term);
      definitions.push({
        id: card.id,
        term: card.term,
        acronym: card.acronym,
        officialDefinition: card.officialDefinition,
        examTrap: card.examTrap,
        memoryRule: card.memoryRule,
        category: card.category,
      });
    }
  });

  return definitions.slice(0, 5);
}

interface KeyConceptSidePanelProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  selectedConceptId?: string | null;
  onSelectConceptId?: (id: string) => void;
  onAskTutor?: (q: Question) => void;
}

export const KeyConceptSidePanel: React.FC<KeyConceptSidePanelProps> = ({
  question,
  isOpen,
  onClose,
  selectedConceptId: externalSelectedId,
  onSelectConceptId,
  onAskTutor,
}) => {
  const terminologyList = useMemo(() => extractScenarioTerminology(question), [question]);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeId = externalSelectedId || internalSelectedId || terminologyList[0]?.id;

  const activeConcept = useMemo(() => {
    return (
      terminologyList.find((c) => c.id === activeId) ||
      terminologyList[0] ||
      null
    );
  }, [terminologyList, activeId]);

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectConceptId) {
      onSelectConceptId(id);
    }
  };

  // Reset selected concept on question change
  useEffect(() => {
    if (terminologyList.length > 0) {
      setInternalSelectedId(terminologyList[0].id);
    }
  }, [question.id, terminologyList]);

  if (!isOpen) return null;

  return (
    <aside
      className="bg-white rounded-xl border border-sky-200/90 shadow-md p-4 sm:p-5 flex flex-col justify-between space-y-4 animate-in fade-in slide-in-from-right-3 duration-200"
      aria-label="Knowledge Check Key Concept Definition"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0078D4] text-white shadow-2xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                  Key Concept Definition
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-[#0078D4]">
                  In-Situ
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Core Azure terminology used in this scenario
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Knowledge Check panel"
            aria-label="Close Knowledge Check panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminology Selector Chips */}
        {terminologyList.length > 1 && (
          <div className="pt-3 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Core Terms in Scenario:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {terminologyList.map((concept) => {
                const isSelected = concept.id === activeConcept?.id;
                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => handleSelect(concept.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{concept.acronym || concept.term.split('(')[0].trim()}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Concept Body */}
        {activeConcept && (
          <div className="mt-3.5 space-y-3">
            {/* Term Title */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {activeConcept.term}
                </h4>
                {activeConcept.acronym && (
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {activeConcept.acronym}
                  </span>
                )}
                {activeConcept.isCorrectTerm && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Correct Solution
                  </span>
                )}
              </div>
            </div>

            {/* Official Definition */}
            <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] flex items-center gap-1">
                <BookmarkCheck className="w-3 h-3" />
                <span>Azure Curriculum Definition</span>
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {activeConcept.officialDefinition}
              </p>
            </div>

            {/* Scenario Relevance */}
            {activeConcept.scenarioRelevance && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Target className="w-3 h-3 text-[#0078D4]" />
                  <span>Why It Matters in this Scenario</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {activeConcept.scenarioRelevance}
                </p>
              </div>
            )}

            {/* High-Yield Exam Trap / Keyword Cue */}
            {activeConcept.examTrap && (
              <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Exam Keyword Trap &amp; Trigger</span>
                </span>
                <p className="text-xs text-amber-950 leading-relaxed font-normal">
                  {activeConcept.examTrap}
                </p>
              </div>
            )}

            {/* Verified Official Microsoft Learn Reference Link */}
            {(() => {
              const docsRef = resolveAzureDocsLink(activeConcept.term, question.moduleId);
              return (
                <div className="pt-1">
                  <a
                    href={docsRef.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-2 rounded-xl bg-blue-50/90 hover:bg-[#0078D4] text-[#0078D4] hover:text-white border border-blue-200 hover:border-[#0078D4] text-xs font-extrabold flex items-center justify-between gap-2 transition-all shadow-2xs cursor-pointer"
                    title={`Open verified Microsoft Learn documentation: ${docsRef.url}`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{docsRef.label}</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Bottom Footer Action */}
      {onAskTutor && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Verify before choosing
          </span>
          <button
            type="button"
            onClick={() => onAskTutor(question)}
            className="text-[11px] font-bold text-[#0078D4] hover:text-[#005A9E] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Ask AI Tutor</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </aside>
  );
};
