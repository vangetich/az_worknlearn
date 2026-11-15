import React, { useState, useEffect, useMemo } from 'react';
import {
  Anchor,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  AlertTriangle,
  Search,
  Layers,
  List,
  BookOpen,
  Copy,
  Bot,
  X,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  SavedMemoryAnchor,
  getSavedMemoryAnchors,
  saveMemoryAnchor,
  removeMemoryAnchor,
} from '../utils/exportNotesMarkdown';

export interface KnowledgeDeckComponentProps {
  activeQuestionContext?: Question | null;
  variant?: 'sidebar' | 'page' | 'drawer';
  onAskAssistant?: (prompt: string) => void;
  onClose?: () => void;
}

const DEFAULT_STARTER_ANCHORS: SavedMemoryAnchor[] = [
  {
    id: 'starter-shared-resp',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    title: 'Shared Responsibility: The 3 Always-Customer Items',
    anchorText:
      'No matter the cloud model (IaaS, PaaS, or SaaS), the customer ALWAYS owns: (1) Data & Information, (2) Endpoints/Devices, and (3) Accounts & Identities.',
    examTrap:
      'Exam distractors claim SaaS shifts data governance or user account security to Microsoft. It never does!',
    createdAt: 1710000001000,
  },
  {
    id: 'starter-az-vs-region-pairs',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    title: 'Availability Zones vs. Region Pairs',
    anchorText:
      'Single Datacenter failure protection = Availability Zones (3 separate datacenters in 1 region, 99.99% VM SLA). Entire Region disaster protection = Region Pairs (300+ miles apart).',
    examTrap:
      'Do not pick Availability Sets for datacenter power/cooling failure—Availability Sets only protect against rack/hardware faults inside ONE datacenter.',
    createdAt: 1710000002000,
  },
  {
    id: 'starter-expressroute-vs-vpn',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    title: 'ExpressRoute vs. VPN Gateway',
    anchorText:
      'Dedicated private fiber bypassing the public internet = ExpressRoute. Encrypted IPsec tunnel over the public internet = VPN Gateway.',
    examTrap:
      'If a scenario requires "no traffic traversing the public internet" or "predictable ultra-low latency," VPN Gateway is a trap—choose ExpressRoute.',
    createdAt: 1710000003000,
  },
  {
    id: 'starter-rbac-vs-policy',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance',
    title: 'Azure RBAC vs. Azure Policy vs. Resource Locks',
    anchorText:
      'WHO can perform actions = Azure RBAC. WHAT resource configurations are allowed = Azure Policy. PREVENT accidental deletion/modification = Resource Locks.',
    examTrap:
      'Even a user with Owner RBAC permissions cannot delete a resource protected by a CanNotDelete lock until the lock is removed first.',
    createdAt: 1710000004000,
  },
];

const MASTERED_ANCHORS_STORAGE_KEY = 'az900_mastered_memory_anchors_v1';

export const KnowledgeDeckComponent: React.FC<KnowledgeDeckComponentProps> = ({
  activeQuestionContext,
  variant = 'sidebar',
  onAskAssistant,
  onClose,
}) => {
  const allModules = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({
          id: m.id,
          title: m.title,
          pathId: p.id,
          pathTitle: p.title,
        }))
      ),
    []
  );

  const [savedAnchors, setSavedAnchors] = useState<SavedMemoryAnchor[]>(() => {
    const existing = getSavedMemoryAnchors();
    if (existing.length > 0) return existing;
    // Seed starter anchors on first load so users can immediately toggle through a deck
    try {
      localStorage.setItem('az900_saved_memory_anchors_v1', JSON.stringify(DEFAULT_STARTER_ANCHORS));
    } catch {
      // ignore storage errors
    }
    return DEFAULT_STARTER_ANCHORS;
  });

  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MASTERED_ANCHORS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // View state: 'deck' (card toggle carousel) vs 'list' (searchable list)
  const [viewMode, setViewMode] = useState<'deck' | 'list'>('deck');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state for creating/editing a custom Memory Anchor
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAnchorId, setEditingAnchorId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState<string>('');
  const [moduleIdInput, setModuleIdInput] = useState<number>(
    activeQuestionContext?.moduleId || 1
  );
  const [anchorTextInput, setAnchorTextInput] = useState<string>('');
  const [examTrapInput, setExamTrapInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync with external memory anchor updates (e.g. from QuizCard "Pin Memory Anchor")
  useEffect(() => {
    const syncAnchors = () => {
      const latest = getSavedMemoryAnchors();
      if (latest.length > 0) {
        setSavedAnchors(latest);
      }
    };
    window.addEventListener('az900-memory-anchors-updated', syncAnchors);
    return () => window.removeEventListener('az900-memory-anchors-updated', syncAnchors);
  }, []);

  // Keep module input synced when active question changes if form isn't mid-edit
  useEffect(() => {
    if (activeQuestionContext && !editingAnchorId && !titleInput) {
      setModuleIdInput(activeQuestionContext.moduleId);
    }
  }, [activeQuestionContext, editingAnchorId, titleInput]);

  const filteredAnchors = useMemo(() => {
    return savedAnchors.filter((anchor) => {
      const matchesModule =
        selectedModuleFilter === 'all' || anchor.moduleId === selectedModuleFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        anchor.title.toLowerCase().includes(q) ||
        anchor.anchorText.toLowerCase().includes(q) ||
        (anchor.examTrap && anchor.examTrap.toLowerCase().includes(q)) ||
        anchor.moduleTitle.toLowerCase().includes(q);
      return matchesModule && matchesSearch;
    });
  }, [savedAnchors, selectedModuleFilter, searchQuery]);

  // Keep currentIndex within bounds when filtering or deleting
  useEffect(() => {
    if (currentIndex >= filteredAnchors.length && filteredAnchors.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredAnchors.length, currentIndex]);

  const activeAnchor = filteredAnchors[currentIndex] || null;

  const handleToggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(MASTERED_ANCHORS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handlePrevAnchor = () => {
    if (filteredAnchors.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredAnchors.length) % filteredAnchors.length);
  };

  const handleNextAnchor = () => {
    if (filteredAnchors.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredAnchors.length);
  };

  const handlePrefillFromQuestion = () => {
    if (!activeQuestionContext) return;
    const correctOpt = activeQuestionContext.options.find(
      (o) => o.letter === activeQuestionContext.correctAnswer
    );
    const firstDistractor = activeQuestionContext.distractorBreakdown?.[0];
    setModuleIdInput(activeQuestionContext.moduleId);
    setTitleInput(
      `${activeQuestionContext.moduleTitle}: ${
        correctOpt ? correctOpt.text.slice(0, 52) : activeQuestionContext.question.slice(0, 52)
      }`
    );
    setAnchorTextInput(
      activeQuestionContext.examTip || activeQuestionContext.whyCorrect.slice(0, 220)
    );
    setExamTrapInput(
      firstDistractor
        ? `Option ${firstDistractor.letter}: ${firstDistractor.reason}`
        : ''
    );
    setIsFormOpen(true);
  };

  const handleStartEdit = (anchor: SavedMemoryAnchor) => {
    setEditingAnchorId(anchor.id);
    setTitleInput(anchor.title);
    setModuleIdInput(anchor.moduleId);
    setAnchorTextInput(anchor.anchorText);
    setExamTrapInput(anchor.examTrap || '');
    setIsFormOpen(true);
  };

  const handleResetForm = () => {
    setEditingAnchorId(null);
    setTitleInput('');
    setAnchorTextInput('');
    setExamTrapInput('');
    setIsFormOpen(false);
  };

  const handleSaveCustomAnchor = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = titleInput.trim();
    const cleanAnchor = anchorTextInput.trim();
    if (!cleanTitle || !cleanAnchor) return;

    const modInfo = allModules.find((m) => m.id === moduleIdInput);
    const moduleTitle = modInfo ? modInfo.title : `Module ${moduleIdInput}`;

    const newId = editingAnchorId || `custom-anchor-${Date.now()}`;
    const updated = saveMemoryAnchor({
      id: newId,
      questionId: activeQuestionContext?.id,
      moduleId: moduleIdInput,
      moduleTitle,
      title: cleanTitle,
      anchorText: cleanAnchor,
      examTrap: examTrapInput.trim() || undefined,
    });

    setSavedAnchors(updated);
    setCurrentIndex(0);
    setIsFlipped(false);
    handleResetForm();
    setSaveFeedback('Memory Anchor saved to Knowledge Deck!');
    setTimeout(() => setSaveFeedback(null), 2600);
  };

  const handleDeleteAnchor = (id: string) => {
    const updated = removeMemoryAnchor(id);
    setSavedAnchors(updated);
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const handleCopyAnchor = async (anchor: SavedMemoryAnchor) => {
    const snippet = `⚓ **AZ-900 Memory Anchor — ${anchor.title}** (Module ${anchor.moduleId}: ${anchor.moduleTitle})\n- **Golden Rule:** ${anchor.anchorText}${
      anchor.examTrap ? `\n- **Exam Trap:** ${anchor.examTrap}` : ''
    }`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedId(anchor.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      data-testid="knowledge-deck-component"
      className={`flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
        variant === 'drawer'
          ? 'h-full overflow-y-auto'
          : variant === 'page'
          ? 'rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden'
          : 'rounded-2xl border border-amber-300/80 dark:border-amber-500/40 shadow-md overflow-hidden'
      }`}
    >
      {/* Header Banner */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-[#003B73] to-slate-900 text-white border-b border-sky-500/30 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
            <Anchor className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                Knowledge Deck · Memory Anchors
              </h3>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-mono font-bold tabular-nums">
                {savedAnchors.length}
              </span>
            </div>
            <p className="text-[11px] text-sky-200/90 truncate">
              Create, save &amp; toggle through custom AZ-900 concept anchors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="open-create-memory-anchor-btn"
            onClick={() => {
              if (isFormOpen) {
                handleResetForm();
              } else {
                setIsFormOpen(true);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer ${
              isFormOpen
                ? 'bg-slate-800 text-slate-200 border border-slate-600'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
            }`}
          >
            {isFormOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>New Anchor</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close Knowledge Deck"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Save Confirmation Toast Banner */}
      {saveFeedback && (
        <div
          role="status"
          className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between gap-2"
        >
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {saveFeedback}
          </span>
        </div>
      )}

      {/* Active Question Pre-fill Bar when practicing */}
      {activeQuestionContext && !isFormOpen && (
        <div className="px-3.5 py-2 bg-amber-50/90 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between gap-2">
          <div className="text-[11px] text-amber-900 dark:text-amber-200 truncate">
            <span className="font-black">Active Q ({activeQuestionContext.id.toUpperCase()}):</span>{' '}
            M{activeQuestionContext.moduleId} · {activeQuestionContext.moduleTitle}
          </div>
          <button
            type="button"
            data-testid="prefill-anchor-from-question-btn"
            onClick={handlePrefillFromQuestion}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-400/60 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-300" />
            <span>Anchor This Concept</span>
          </button>
        </div>
      )}

      {/* Create / Edit Memory Anchor Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveCustomAnchor}
          data-testid="memory-anchor-form"
          className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#0078D4] dark:text-sky-400 flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5" />
              {editingAnchorId ? 'Edit Custom Memory Anchor' : 'Create Custom Memory Anchor'}
            </span>
            {activeQuestionContext && (
              <button
                type="button"
                onClick={handlePrefillFromQuestion}
                className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
              >
                Auto-fill from current question
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Difficult Azure Concept / Title *
              </label>
              <input
                type="text"
                required
                data-testid="memory-anchor-title-input"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g., Availability Sets vs. Availability Zones"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                AZ-900 Module
              </label>
              <select
                data-testid="memory-anchor-module-select"
                value={moduleIdInput}
                onChange={(e) => setModuleIdInput(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              >
                {allModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    M{m.id}: {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Memory Anchor Rule / Mnemonic *
            </label>
            <textarea
              required
              rows={3}
              data-testid="memory-anchor-rule-input"
              value={anchorTextInput}
              onChange={(e) => setAnchorTextInput(e.target.value)}
              placeholder="Write a sticky 1-2 sentence rule or analogy that locks this concept into memory..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Common Exam Distractor Trap (Optional)
            </label>
            <input
              type="text"
              data-testid="memory-anchor-trap-input"
              value={examTrapInput}
              onChange={(e) => setExamTrapInput(e.target.value)}
              placeholder="e.g., Watch out for questions confusing Azure Policy with RBAC..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-custom-memory-anchor-btn"
              className="px-4 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingAnchorId ? 'Update Anchor' : 'Save Memory Anchor'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Controls Bar: Filter by Module, Search, and Toggle View Mode (Deck vs List) */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="memory-anchor-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              placeholder="Filter anchors..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
            />
          </div>

          <select
            aria-label="Filter memory anchors by module"
            data-testid="memory-anchor-module-filter"
            value={selectedModuleFilter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedModuleFilter(val === 'all' ? 'all' : Number(val));
              setCurrentIndex(0);
            }}
            className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Modules ({savedAnchors.length})</option>
            {allModules.map((m) => (
              <option key={m.id} value={m.id}>
                M{m.id}: {m.title.slice(0, 22)}
              </option>
            ))}
          </select>
        </div>

        {/* Deck Toggle vs List Mode Switcher */}
        <div className="inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-800 p-0.5 border border-slate-300/60 dark:border-slate-700">
          <button
            type="button"
            data-testid="knowledge-deck-mode-carousel"
            onClick={() => setViewMode('deck')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'deck'
                ? 'bg-white dark:bg-slate-900 text-[#0078D4] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Deck</span>
          </button>
          <button
            type="button"
            data-testid="knowledge-deck-mode-list"
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-[#0078D4] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <List className="w-3 h-3" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {filteredAnchors.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <Anchor className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              No Memory Anchors Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Create a custom Memory Anchor for a tricky Azure concept or clear your search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedModuleFilter('all');
                setIsFormOpen(true);
              }}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#0078D4] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Memory Anchor</span>
            </button>
          </div>
        ) : viewMode === 'deck' && activeAnchor ? (
          /* =====================================================================
             INTERACTIVE DECK CAROUSEL / TOGGLE VIEW
             ===================================================================== */
          <div data-testid="knowledge-deck-carousel" className="space-y-3">
            {/* Progress & Counter Row */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                Anchor {currentIndex + 1} of {filteredAnchors.length}
              </span>
              <div className="flex items-center gap-1">
                {filteredAnchors.map((a, idx) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Jump to Memory Anchor ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex
                        ? 'w-5 bg-[#0078D4]'
                        : masteredIds.includes(a.id)
                        ? 'w-2 bg-emerald-400'
                        : 'w-2 bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Interactive Memory Anchor Card */}
            <div
              data-testid="active-memory-anchor-card"
              className={`rounded-2xl border-2 p-4 transition-all shadow-md ${
                isFlipped
                  ? 'bg-gradient-to-br from-rose-50/90 via-white to-amber-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/30 border-rose-300 dark:border-rose-500/50'
                  : 'bg-gradient-to-br from-amber-50/80 via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 border-amber-300/90 dark:border-amber-500/40'
              }`}
            >
              {/* Module Badge & Mastered Status */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#0078D4]/10 dark:bg-sky-500/20 text-[#005A9E] dark:text-sky-300 border border-[#0078D4]/20 text-[10px] font-extrabold uppercase tracking-wider">
                  Module {activeAnchor.moduleId}: {activeAnchor.moduleTitle}
                </span>

                <button
                  type="button"
                  data-testid="toggle-anchor-mastered-btn"
                  onClick={() => handleToggleMastered(activeAnchor.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    masteredIds.includes(activeAnchor.id)
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>{masteredIds.includes(activeAnchor.id) ? 'Anchored' : 'Mark Anchored'}</span>
                </button>
              </div>

              {/* Concept Title */}
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug mb-3">
                {activeAnchor.title}
              </h4>

              {/* Golden Memory Anchor Rule */}
              <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-950/80 border border-amber-200/90 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Anchor className="w-3.5 h-3.5 shrink-0" />
                  <span>Golden Memory Anchor</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {activeAnchor.anchorText}
                </p>
              </div>

              {/* Flip / Exam Trap Section */}
              {activeAnchor.examTrap && (
                <div className="mt-3">
                  {isFlipped ? (
                    <div
                      data-testid="memory-anchor-trap-box"
                      className="p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Exam Distractor Trap to Watch
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsFlipped(false)}
                          className="text-[10px] underline cursor-pointer"
                        >
                          Hide
                        </button>
                      </div>
                      <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                        {activeAnchor.examTrap}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="memory-anchor-flip-btn"
                      onClick={() => setIsFlipped(true)}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-rose-300 dark:border-rose-700/70 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Toggle Exam Trap &amp; Distractor Cue</span>
                    </button>
                  )}
                </div>
              )}

              {/* Card Action Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopyAnchor(activeAnchor)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    title="Copy Memory Anchor as Markdown"
                  >
                    {copiedId === activeAnchor.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(activeAnchor)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    title="Edit Memory Anchor"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAnchor(activeAnchor.id)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1 cursor-pointer"
                    title="Delete Memory Anchor"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>

                {onAskAssistant && (
                  <button
                    type="button"
                    data-testid="ask-assistant-about-anchor-btn"
                    onClick={() =>
                      onAskAssistant(
                        `Quiz me on my AZ-900 Memory Anchor "${activeAnchor.title}" (Module ${activeAnchor.moduleId}): "${activeAnchor.anchorText}". Give me 1 quick scenario trap to test if I truly understand it.`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#0078D4]/10 hover:bg-[#0078D4]/20 text-[#0078D4] dark:text-sky-300 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Test Me in AI Tutor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Previous / Next Deck Toggle Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                data-testid="memory-anchor-prev-btn"
                onClick={handlePrevAnchor}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Anchor</span>
              </button>

              <button
                type="button"
                data-testid="memory-anchor-next-btn"
                onClick={handleNextAnchor}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span>Next Anchor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* =====================================================================
             ALL ANCHORS LIST VIEW
             ===================================================================== */
          <div
            data-testid="knowledge-deck-list"
            className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1"
          >
            {filteredAnchors.map((anchor, idx) => (
              <div
                key={anchor.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#0078D4]/50 transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] dark:text-sky-400">
                      M{anchor.moduleId}: {anchor.moduleTitle}
                    </span>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">
                      {anchor.title}
                    </h5>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setViewMode('deck');
                      }}
                      className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-[#005A9E] dark:text-sky-300 text-[10px] font-bold cursor-pointer"
                    >
                      Open Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(anchor)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      aria-label={`Edit ${anchor.title}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnchor(anchor.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label={`Delete ${anchor.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {anchor.anchorText}
                </p>
                {anchor.examTrap && (
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/50">
                    <strong>Trap:</strong> {anchor.examTrap}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Summary */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>
              {masteredIds.length} of {savedAnchors.length} Anchors Mastered
            </span>
          </span>
          <span className="text-[10px] font-mono">Included in Export Study Report PDF</span>
        </div>
      </div>
    </div>
  );
};
