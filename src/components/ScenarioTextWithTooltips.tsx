import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Info, Check, ChevronRight } from 'lucide-react';
import { ConceptDefinition } from './KeyConceptSidePanel';

interface ScenarioTextWithTooltipsProps {
  text: string;
  concepts: ConceptDefinition[];
  onSelectConcept: (conceptId: string) => void;
  isKnowledgeCheckActive: boolean;
  onActivateKnowledgeCheck: () => void;
}

export const ScenarioTextWithTooltips: React.FC<ScenarioTextWithTooltipsProps> = ({
  text,
  concepts,
  onSelectConcept,
  isKnowledgeCheckActive,
  onActivateKnowledgeCheck,
}) => {
  const [activeTooltipTerm, setActiveTooltipTerm] = useState<{
    concept: ConceptDefinition;
    rect: DOMRect;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveTooltipTerm(null);
      }
    };
    if (activeTooltipTerm) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeTooltipTerm]);

  // If no concepts available, just return raw text
  if (!concepts || concepts.length === 0) {
    return <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">{text}</p>;
  }

  // Create regex pattern matching key terms or acronyms
  const termMatches = concepts
    .map((c) => ({
      concept: c,
      name: c.term.split('(')[0].trim(),
      acronym: c.acronym,
    }))
    .filter((t) => t.name.length >= 3);

  // Highlight words
  const parts: (string | { matchedText: string; concept: ConceptDefinition })[] = [];
  let remainingText = text;

  // Simple token matching
  const regexPatterns = termMatches
    .flatMap((t) => [
      { pattern: t.name, concept: t.concept },
      ...(t.acronym ? [{ pattern: t.acronym, concept: t.concept }] : []),
    ])
    .filter((p) => p.pattern && p.pattern.length >= 3);

  // Build sorted regex pattern
  const escapedPatterns = regexPatterns
    .sort((a, b) => b.pattern.length - a.pattern.length);

  if (escapedPatterns.length === 0) {
    return <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">{text}</p>;
  }

  const combinedRegex = new RegExp(
    `\\b(${escapedPatterns.map((p) => p.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  const splitParts = text.split(combinedRegex);

  return (
    <div className="relative" ref={containerRef}>
      <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
        {splitParts.map((chunk, index) => {
          const matched = escapedPatterns.find(
            (p) => p.pattern.toLowerCase() === chunk.toLowerCase()
          );

          if (matched) {
            return (
              <span
                key={index}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveTooltipTerm({ concept: matched.concept, rect });
                  onSelectConcept(matched.concept.id);
                  if (!isKnowledgeCheckActive) {
                    onActivateKnowledgeCheck();
                  }
                }}
                className="cursor-pointer font-medium text-blue-900 bg-blue-50/70 hover:bg-blue-100/90 border-b-2 border-dashed border-[#0078D4] px-0.5 rounded transition-colors inline-block"
                title={`Knowledge Check: Click to view definition for ${matched.concept.term}`}
              >
                {chunk}
              </span>
            );
          }

          return <span key={index}>{chunk}</span>;
        })}
      </p>

      {/* Floating Concept Definition Tooltip */}
      {activeTooltipTerm && (
        <div
          className="fixed z-50 w-72 sm:w-80 bg-white rounded-xl border border-sky-300 shadow-xl p-3.5 space-y-2 text-left animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: Math.min(window.innerHeight - 220, activeTooltipTerm.rect.bottom + 8),
            left: Math.max(16, Math.min(window.innerWidth - 336, activeTooltipTerm.rect.left - 20)),
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Key Concept Definition</span>
            </span>
            <button
              onClick={() => setActiveTooltipTerm(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>

          <div>
            <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <span>{activeTooltipTerm.concept.term}</span>
              {activeTooltipTerm.concept.acronym && (
                <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                  {activeTooltipTerm.concept.acronym}
                </span>
              )}
            </h5>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              {activeTooltipTerm.concept.officialDefinition}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-400">In-situ definition</span>
            <button
              onClick={() => {
                onSelectConcept(activeTooltipTerm.concept.id);
                onActivateKnowledgeCheck();
                setActiveTooltipTerm(null);
              }}
              className="font-bold text-[#0078D4] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Inspect in side-panel</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
