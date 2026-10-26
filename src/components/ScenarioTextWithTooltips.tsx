import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { ConceptDefinition } from './KeyConceptSidePanel';

interface ScenarioTextWithTooltipsProps {
  text: string;
  concepts: ConceptDefinition[];
  onSelectConcept: (conceptId: string) => void;
  isKnowledgeCheckActive: boolean;
  onActivateKnowledgeCheck: () => void;
  textClassName?: string;
}

export const ScenarioTextWithTooltips: React.FC<ScenarioTextWithTooltipsProps> = ({
  text,
  concepts,
  onSelectConcept,
  isKnowledgeCheckActive,
  onActivateKnowledgeCheck,
  textClassName = 'text-slate-700 text-sm sm:text-base leading-relaxed font-normal',
}) => {
  const [activeTooltipTerm, setActiveTooltipTerm] = useState<{
    concept: ConceptDefinition;
    rect: DOMRect;
    pinnedByClick?: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipCardRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimeoutRef = useRef<number | null>(null);

  const clearHoverCloseTimeout = () => {
    if (hoverCloseTimeoutRef.current !== null) {
      window.clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
  };

  const scheduleHoverClose = () => {
    clearHoverCloseTimeout();
    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveTooltipTerm((prev) => (prev?.pinnedByClick ? prev : null));
    }, 220);
  };

  // Close tooltip on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!tooltipCardRef.current || !tooltipCardRef.current.contains(target))
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

  useEffect(() => {
    return () => clearHoverCloseTimeout();
  }, []);

  // If no concepts available, just return raw text
  if (!concepts || concepts.length === 0) {
    return <p className={`w-full max-w-none ${textClassName}`}>{text}</p>;
  }

  // Create regex pattern matching key terms or acronyms
  const termMatches = concepts
    .map((c) => ({
      concept: c,
      name: c.term.split('(')[0].trim(),
      acronym: c.acronym,
    }))
    .filter((t) => t.name.length >= 3);

  const regexPatterns = termMatches
    .flatMap((t) => [
      { pattern: t.name, concept: t.concept },
      ...(t.acronym ? [{ pattern: t.acronym, concept: t.concept }] : []),
    ])
    .filter((p) => p.pattern && p.pattern.length >= 3);

  const escapedPatterns = regexPatterns.sort(
    (a, b) => b.pattern.length - a.pattern.length
  );

  if (escapedPatterns.length === 0) {
    return <p className={`w-full max-w-none ${textClassName}`}>{text}</p>;
  }

  const combinedRegex = new RegExp(
    `\\b(${escapedPatterns
      .map((p) => p.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})\\b`,
    'gi'
  );

  const splitParts = text.split(combinedRegex);

  return (
    <div className="relative w-full max-w-none" ref={containerRef}>
      <p className={`w-full max-w-none ${textClassName}`}>
        {splitParts.map((chunk, index) => {
          const matched = escapedPatterns.find(
            (p) => p.pattern.toLowerCase() === chunk.toLowerCase()
          );

          if (matched) {
            return (
              <span
                key={index}
                onMouseEnter={(e) => {
                  clearHoverCloseTimeout();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveTooltipTerm((prev) => ({
                    concept: matched.concept,
                    rect,
                    pinnedByClick: prev?.pinnedByClick || false,
                  }));
                }}
                onMouseLeave={scheduleHoverClose}
                onClick={(e) => {
                  e.stopPropagation();
                  clearHoverCloseTimeout();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveTooltipTerm({
                    concept: matched.concept,
                    rect,
                    pinnedByClick: true,
                  });
                  onSelectConcept(matched.concept.id);
                  if (!isKnowledgeCheckActive) {
                    onActivateKnowledgeCheck();
                  }
                }}
                className="cursor-pointer font-semibold text-[#005A9E] bg-sky-50/90 hover:bg-sky-100 border-b-2 border-dashed border-[#0078D4] px-1 py-0.2 rounded-md transition-all duration-150 inline-flex items-center gap-0.5 hover:shadow-2xs"
                title={`Azure Concept Snap: Hover or click to view definition for ${matched.concept.term}`}
              >
                <Zap className="w-3 h-3 text-[#0078D4] fill-sky-200 shrink-0 inline" />
                <span>{chunk}</span>
              </span>
            );
          }

          return <span key={index}>{chunk}</span>;
        })}
      </p>

      {/* Floating Animated Azure Concept Snap Definition Card — Fitted to Active Viewport */}
      {activeTooltipTerm &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipCardRef}
            onMouseEnter={clearHoverCloseTimeout}
            onMouseLeave={scheduleHoverClose}
            className="fixed z-[125] w-[min(22rem,calc(100vw-1rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain bg-white rounded-2xl border-2 border-[#0078D4]/40 shadow-2xl p-4 space-y-2.5 text-left animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-200"
            style={{
              top: Math.max(
                12,
                Math.min(
                  (typeof window !== 'undefined' ? window.innerHeight : 800) - 270,
                  activeTooltipTerm.rect.bottom + 8
                )
              ),
              left: Math.max(
                8,
                Math.min(
                  (typeof window !== 'undefined' ? window.innerWidth : 1024) -
                    Math.min(356, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 16),
                  activeTooltipTerm.rect.left - 16
                )
              ),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0078D4] to-[#005A9E] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Azure Concept Snap</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveTooltipTerm(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                aria-label="Close Azure Concept Snap"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                  <span>{activeTooltipTerm.concept.term}</span>
                </h5>
                {activeTooltipTerm.concept.acronym && (
                  <span className="text-[10px] font-black bg-sky-100 text-[#005A9E] px-2 py-0.5 rounded-md border border-sky-200">
                    {activeTooltipTerm.concept.acronym}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80">
                {activeTooltipTerm.concept.officialDefinition}
              </p>
              {activeTooltipTerm.concept.scenarioRelevance && (
                <div className="text-[11px] text-amber-950 bg-amber-50/90 px-2.5 py-1.5 rounded-lg border border-amber-200/80 leading-snug">
                  <strong className="font-extrabold text-amber-800">Exam Role: </strong>
                  {activeTooltipTerm.concept.scenarioRelevance}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400 font-semibold">
                Hover or click service keywords
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectConcept(activeTooltipTerm.concept.id);
                  onActivateKnowledgeCheck();
                  setActiveTooltipTerm(null);
                }}
                className="font-extrabold text-[#0078D4] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Pin to Side-Panel</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
