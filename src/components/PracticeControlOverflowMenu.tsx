import React from 'react';
import {
  ArrowUpDown,
  Filter,
  Target,
  Layers,
  SlidersHorizontal,
  X,
  Check,
  Sparkles,
  Users,
  Download,
} from 'lucide-react';
import { KenyanFlagMiniEmblem, MaasaiMedallion } from './MotifDecorations';

interface PracticeControlOverflowMenuProps {
  isOpen: boolean;
  onClose: () => void;
  // 1. Sort
  questionSortOrder: 'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first';
  onSortChange: (order: 'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first') => void;
  // 2. Diff
  selectedDifficultyFilter: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced';
  onDifficultyChange: (diff: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced') => void;
  // 3. Heatmap
  showPracticeHeatmap: boolean;
  onToggleHeatmap: () => void;
  // 4. Maps
  showWorkspacePanels: boolean;
  onToggleWorkspacePanels: () => void;
  // 5. Study Zone
  onOpenStudyZone: () => void;
  // Optional companion actions
  onOpenPeerChallenge?: () => void;
  onExportNotesMarkdown?: () => void;
}

export const PracticeControlOverflowMenu: React.FC<PracticeControlOverflowMenuProps> = ({
  isOpen,
  onClose,
  questionSortOrder,
  onSortChange,
  selectedDifficultyFilter,
  onDifficultyChange,
  showPracticeHeatmap,
  onToggleHeatmap,
  showWorkspacePanels,
  onToggleWorkspacePanels,
  onOpenStudyZone,
  onOpenPeerChallenge,
  onExportNotesMarkdown,
}) => {
  if (!isOpen) return null;

  const SORT_OPTIONS: Array<{
    id: 'default' | 'newest-first' | 'hardest-first' | 'module-progression' | 'easiest-first';
    label: string;
    sublabel: string;
  }> = [
    { id: 'default', label: 'Adaptive Default', sublabel: 'AI-guided weakness priority' },
    { id: 'newest-first', label: 'Newest First', sublabel: 'Latest added questions' },
    { id: 'hardest-first', label: 'Hardest First', sublabel: 'Prioritize lowest cohort accuracy' },
    { id: 'module-progression', label: 'Module Progression', sublabel: 'Syllabus sequential order' },
    { id: 'easiest-first', label: 'Easiest First', sublabel: 'Confidence-building flow' },
  ];

  const DIFFICULTY_OPTIONS: Array<{
    id: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced';
    label: string;
    description: string;
    accent: string;
  }> = [
    { id: 'all', label: 'All Levels (Adaptive Auto)', description: 'Auto-adapts to your streak', accent: 'bg-[#0078D4]' },
    { id: 'Fundamental', label: 'Fundamental', description: 'Core cloud definitions', accent: 'bg-emerald-600' },
    { id: 'Intermediate', label: 'Intermediate', description: 'Architectural scenarios', accent: 'bg-sky-600' },
    { id: 'Advanced', label: 'Advanced', description: 'Complex governance traps', accent: 'bg-purple-600' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Practice Controls Overflow Menu"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Touch Handle for Mobile Sheet Pull */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-sky-50/50 to-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white flex items-center justify-center shadow-xs shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                  Practice Controls &amp; Tools
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 shrink-0">
                  Touch Menu
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Configure Sort, Diff, Heatmap, Maps &amp; Study Zone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Controls Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 text-left overscroll-contain">
          {/* ==========================================
              CONTROL 1: QUESTION SORT ORDER
             ========================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#BB0000]" />
                <span>1. Question Sort Order ('Sort')</span>
              </label>
              <span className="text-[11px] font-bold text-[#0078D4]">
                {SORT_OPTIONS.find((s) => s.id === questionSortOrder)?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = questionSortOrder === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSortChange(opt.id);
                    }}
                    className={`min-h-[46px] p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{opt.label}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {opt.sublabel}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==========================================
              CONTROL 2: DIFFICULTY LEVEL
             ========================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>2. Difficulty Level ('Diff')</span>
              </label>
              <span className="text-[11px] font-bold text-[#0078D4]">
                {selectedDifficultyFilter === 'all' ? 'All Levels' : selectedDifficultyFilter}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = selectedDifficultyFilter === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      onDifficultyChange(diff.id);
                    }}
                    className={`min-h-[46px] p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0078D4] text-white border-[#005A9E] shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{diff.label}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                        {diff.description}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-white text-[#0078D4] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==========================================
              CONTROLS 3, 4 & 5: HEATMAP, MAPS & STUDY ZONE
             ========================================== */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              3, 4 &amp; 5. Visual Workspace &amp; Study Tools
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 3. Heatmap */}
              <button
                type="button"
                onClick={() => {
                  onToggleHeatmap();
                }}
                className={`min-h-[50px] p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  showPracticeHeatmap
                    ? 'bg-[#0078D4] text-white border-[#005A9E] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg ${showPracticeHeatmap ? 'bg-white/20' : 'bg-sky-100 text-[#0078D4]'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">Heatmap</div>
                    <div className={`text-[10px] ${showPracticeHeatmap ? 'text-sky-100' : 'text-slate-500'}`}>
                      {showPracticeHeatmap ? 'Active (Visible)' : 'Hidden'}
                    </div>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                  showPracticeHeatmap ? 'bg-amber-300 text-slate-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {showPracticeHeatmap ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 4. Maps */}
              <button
                type="button"
                onClick={() => {
                  onToggleWorkspacePanels();
                }}
                className={`min-h-[50px] p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  showWorkspacePanels
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg ${showWorkspacePanels ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">Maps &amp; Readiness</div>
                    <div className={`text-[10px] ${showWorkspacePanels ? 'text-amber-100' : 'text-slate-500'}`}>
                      {showWorkspacePanels ? 'Active (Visible)' : 'Hidden'}
                    </div>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                  showWorkspacePanels ? 'bg-white text-amber-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {showWorkspacePanels ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 5. Study Zone */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudyZone();
                }}
                className="min-h-[50px] p-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#0078D4] hover:opacity-95 text-white border border-slate-800 shadow-xs text-left flex items-center justify-between gap-2 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-white/20 text-amber-300">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">Study Zone</div>
                    <div className="text-[10px] text-sky-200 truncate">Open Accordion</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-900">
                  Open
                </span>
              </button>
            </div>
          </div>

          {/* Quick Companion Actions: Peer Challenge & Export Notes .MD */}
          {(onOpenPeerChallenge || onExportNotesMarkdown) && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              {onOpenPeerChallenge && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPeerChallenge();
                  }}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006600] border border-emerald-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Peer Challenge</span>
                </button>
              )}

              {onExportNotesMarkdown && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExportNotesMarkdown();
                  }}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>Export Notes (.MD)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <KenyanFlagMiniEmblem size={13} />
            <span className="hidden sm:inline">Settings applied instantly to practice session</span>
            <span className="sm:hidden">Applied instantly</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
