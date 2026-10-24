import React, { useState } from 'react';
import {
  Zap,
  X,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MODULE_FREQUENTLY_MISSED_TERMS, FrequentlyMissedTerm } from '../data/frequentlyMissedTerms';

interface QuickStudyOverlayProps {
  moduleId: number;
  moduleTitle: string;
  onClose: () => void;
}

export const QuickStudyOverlay: React.FC<QuickStudyOverlayProps> = ({
  moduleId,
  moduleTitle,
  onClose,
}) => {
  const terms: FrequentlyMissedTerm[] = MODULE_FREQUENTLY_MISSED_TERMS[moduleId] || [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (terms.length === 0) return null;

  return (
    <div className="relative my-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/95 via-orange-50/80 to-amber-50/95 border border-amber-300/80 shadow-md animate-in slide-in-from-top-2 fade-in duration-200">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
            <Zap className="w-4 h-4 fill-amber-200 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">
                Quick Study • Top Missed Exam Terms
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-200/90 text-amber-900">
                M{moduleId}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium">
              Commonly confused concepts in {moduleTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 transition-colors cursor-pointer"
          title="Close Quick Study overlay"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Terms Chips & Collapsible Definitions */}
      <div className="pt-2.5 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {terms.map((item, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isExpanded
                    ? 'bg-white/95 border-amber-300 shadow-xs'
                    : 'bg-white/60 hover:bg-white/90 border-amber-200/60'
                }`}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {item.term}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
                      {item.category}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-amber-100 text-left space-y-1.5 animate-in fade-in duration-150">
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      {item.definition}
                    </p>
                    <div className="flex items-start gap-1 p-1.5 rounded-lg bg-orange-100/70 border border-orange-200/80 text-[10px] text-orange-950 font-bold">
                      <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0 mt-0.5" />
                      <span>{item.examTrap}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
