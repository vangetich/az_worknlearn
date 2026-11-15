import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Briefcase,
  Lightbulb,
  Anchor,
  HelpCircle,
  ExternalLink,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Question } from '../types/quiz';
import {
  ConceptRefinementResult,
  refineConceptWithAi,
  formatRefinementMarkdown,
} from '../services/conceptRefinementService';
import { saveMemoryAnchor, isMemoryAnchorSaved } from '../utils/exportNotesMarkdown';

export interface ConceptRefinementOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  selectedOption?: string | null;
  onOpenAiTutorDrawer?: (question: Question, selectedOption?: string | null) => void;
}

export const ConceptRefinementOverlay: React.FC<ConceptRefinementOverlayProps> = ({
  isOpen,
  onClose,
  question,
  selectedOption,
  onOpenAiTutorDrawer,
}) => {
  const [activeTab, setActiveTab] = useState<'analogy' | 'real_world' | 'both'>('analogy');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refinement, setRefinement] = useState<ConceptRefinementResult | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSavedAnchor, setIsSavedAnchor] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, ConceptRefinementResult>>({});

  // Check if memory anchor is already saved for this question
  useEffect(() => {
    if (question?.id) {
      setIsSavedAnchor(isMemoryAnchorSaved(`anchor-refine-${question.id}`));
    }
  }, [question?.id]);

  // Fetch or retrieve cached refinement whenever overlay opens or question changes
  const loadRefinement = useCallback(
    async (forceFresh: boolean = false) => {
      if (!question) return;

      const cacheKey = `${question.id}-${question.moduleId}`;
      if (!forceFresh && cache[cacheKey]) {
        setRefinement(cache[cacheKey]);
        return;
      }

      setIsLoading(true);
      try {
        const correctOpt = question.options.find((o) => o.letter === question.correctAnswer);
        const result = await refineConceptWithAi({
          question: question.question,
          scenario: question.scenario,
          correctAnswer: question.correctAnswer,
          correctAnswerText: correctOpt?.text,
          whyCorrect: question.whyCorrect,
          distractorBreakdown: question.distractorBreakdown,
          learningPathId: question.learningPathId,
          learningPathTitle: question.learningPathTitle,
          moduleId: question.moduleId,
          moduleTitle: question.moduleTitle,
          difficulty: question.difficulty,
          refinementType: 'both',
        });

        setRefinement(result);
        setCache((prev) => ({ ...prev, [cacheKey]: result }));
      } catch (err) {
        console.error('Failed to load concept refinement:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [question, cache]
  );

  useEffect(() => {
    if (isOpen) {
      loadRefinement(false);
    }
  }, [isOpen, question?.id, loadRefinement]);

  // Handle Escape key to close overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!refinement) return;
    try {
      const markdown = formatRefinementMarkdown(refinement);
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      // Fallback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleSaveAnchor = () => {
    if (!refinement) return;
    const anchorId = `anchor-refine-${question.id}`;
    saveMemoryAnchor({
      id: anchorId,
      questionId: question.id,
      moduleId: question.moduleId,
      moduleTitle: question.moduleTitle,
      title: `${refinement.conceptName} (${refinement.analogyTitle})`,
      anchorText: `💡 Analogy: ${refinement.simplerAnalogy}\n\n🏢 Enterprise: ${refinement.realWorldMapping}`,
      examTrap: refinement.examMemoryAnchor,
    });
    setIsSavedAnchor(true);
  };

  const handleOpenTutor = () => {
    if (onOpenAiTutorDrawer) {
      onOpenAiTutorDrawer(question, selectedOption);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Concept Refinement"
      data-testid="concept-refinement-overlay"
      className="absolute inset-0 z-50 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col border-2 border-amber-400 dark:border-amber-500 shadow-2xl overflow-hidden transition-all duration-200"
    >
      {/* Top Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-sky-600 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs text-yellow-100 flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
            <Sparkles className="w-5 h-5 fill-yellow-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/25">
                AI Concept Refinement
              </span>
              <span className="text-[11px] font-bold text-amber-100 truncate">
                Module {question.moduleId}: {question.moduleTitle}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white truncate">
              {refinement?.conceptName || 'Simpler Analogy & Real-World Enterprise Mapping'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => loadRefinement(true)}
            disabled={isLoading}
            title="Re-generate concept refinement with AI Assistant"
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Regenerate refinement"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Close concept refinement overlay"
            title="Close overlay (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-amber-50/80 dark:bg-slate-800/80 border-b border-amber-200/70 dark:border-slate-700/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 p-1 rounded-xl border border-amber-200/60 dark:border-slate-600 shadow-2xs">
          <button
            type="button"
            data-testid="tab-simpler-analogy"
            onClick={() => setActiveTab('analogy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analogy'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Simpler Analogy</span>
          </button>

          <button
            type="button"
            data-testid="tab-real-world"
            onClick={() => setActiveTab('real_world')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'real_world'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Real-World Mapping</span>
          </button>

          <button
            type="button"
            data-testid="tab-both-views"
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'both'
                ? 'bg-gradient-to-r from-amber-500 to-[#0078D4] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Both Views</span>
          </button>
        </div>

        {refinement && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                refinement.isAiGenerated
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
              }`}
            >
              {refinement.isAiGenerated ? '✨ Gemini 3.8 Flash' : '🎯 Verified Domain Baseline'}
            </span>
          </div>
        )}
      </div>

      {/* Main Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0078D4] flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                AZ
              </div>
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Refining Concept with AI Assistant...
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Synthesizing an everyday relatable metaphor and production enterprise mapping specifically for
                Module {question.moduleId}: {question.moduleTitle}
              </p>
            </div>
            <div className="w-48 h-1.5 bg-amber-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#0078D4] animate-pulse rounded-full" />
            </div>
          </div>
        ) : refinement ? (
          <div className="space-y-4">
            {/* Grid layout for 'both' view, or single column for individual tabs */}
            <div
              className={`grid gap-4 ${
                activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {/* Card 1: Simpler Analogy */}
              {(activeTab === 'analogy' || activeTab === 'both') && (
                <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-700/60 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 dark:border-slate-700 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Lightbulb className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Simpler Analogy
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {refinement.analogyTitle}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {refinement.simplerAnalogy}
                  </p>

                  <div className="bg-amber-100/70 dark:bg-amber-950/50 rounded-xl p-3 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                        Core Takeaway
                      </span>
                      <p className="text-xs text-amber-900 dark:text-amber-300 mt-0.5 font-medium">
                        {refinement.analogyCoreTakeaway}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Real-World Enterprise Mapping */}
              {(activeTab === 'real_world' || activeTab === 'both') && (
                <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-white dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 rounded-2xl p-5 border-2 border-sky-200 dark:border-sky-700/60 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between gap-2 border-b border-sky-200/80 dark:border-slate-700 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0078D4] text-white flex items-center justify-center shadow-xs">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
                          Enterprise Implementation
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Role: {refinement.realWorldRole}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {refinement.realWorldMapping}
                  </p>

                  <div className="bg-sky-100/70 dark:bg-sky-950/50 rounded-xl p-3 border border-sky-300 dark:border-sky-800 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#0078D4] dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-black text-sky-950 dark:text-sky-200 block">
                        Business & Architectural Value
                      </span>
                      <p className="text-xs text-sky-900 dark:text-sky-300 mt-0.5 font-medium">
                        {refinement.businessValue}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exam Memory Anchor Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 dark:from-emerald-950/40 dark:to-sky-950/40 rounded-xl p-3.5 border border-emerald-300 dark:border-emerald-700 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Anchor className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  AZ-900 Exam Memory Anchor
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {refinement.examMemoryAnchor}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-600 dark:text-slate-400 text-xs">
            No concept refinement generated yet. Click Re-generate above to prompt the AI assistant.
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="refinement-copy-btn"
            onClick={handleCopy}
            disabled={!refinement}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCopied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied Markdown!' : 'Copy Analogy & Mapping'}</span>
          </button>

          <button
            type="button"
            data-testid="refinement-save-anchor-btn"
            onClick={handleToggleSaveAnchor}
            disabled={!refinement || isSavedAnchor}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSavedAnchor
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300'
                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-amber-50'
            }`}
          >
            <Anchor className="w-3.5 h-3.5 text-amber-600" />
            <span>{isSavedAnchor ? 'Saved to Memory Anchors' : 'Save as Memory Anchor'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAiTutorDrawer && (
            <button
              type="button"
              data-testid="refinement-ask-tutor-btn"
              onClick={handleOpenTutor}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 fill-slate-950" />
              <span>Ask in Knowledge Assistant</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
