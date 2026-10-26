import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  X,
  Save,
  Trash2,
  Sparkles,
  Check,
  Lightbulb,
  AlertTriangle,
  Zap,
  BookmarkCheck,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { getQuestionNote, saveQuestionNote } from '../utils/storage';
import { MaasaiMedallion } from './MotifDecorations';

interface QuickNotesDrawerProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved?: (text: string) => void;
}

export const QuickNotesDrawer: React.FC<QuickNotesDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onNoteSaved,
}) => {
  const [noteText, setNoteText] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [hasExistingNote, setHasExistingNote] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing note when drawer opens or question changes
  useEffect(() => {
    if (question?.id) {
      const existing = getQuestionNote(question.id);
      setNoteText(existing);
      setHasExistingNote(Boolean(existing.trim()));
    }
  }, [question?.id, isOpen]);

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = () => {
    saveQuestionNote(question.id, noteText);
    setHasExistingNote(Boolean(noteText.trim()));
    setSaveToast(true);
    if (onNoteSaved) {
      onNoteSaved(noteText.trim());
    }
    setTimeout(() => setSaveToast(false), 2200);
  };

  const handleDelete = () => {
    saveQuestionNote(question.id, '');
    setNoteText('');
    setHasExistingNote(false);
    if (onNoteSaved) {
      onNoteSaved('');
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const insertSnippet = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNoteText((prev) => (prev ? `${prev}\n${prefix}` : prefix));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = noteText;
    const addition = (start > 0 && current[start - 1] !== '\n' ? '\n' : '') + prefix;
    const updated = current.substring(0, start) + addition + current.substring(end);

    setNoteText(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + addition.length, start + addition.length);
    }, 50);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="relative w-full max-w-[min(32rem,100vw)] bg-white h-[100dvh] max-h-[100dvh] shadow-2xl border-l border-slate-200 flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0078D4] border border-blue-200/80 shadow-2xs mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-900">
                  Personal Quick Notes &amp; Mnemonics
                </h3>
                {hasExistingNote && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Save your memory anchors and rules for this specific Azure concept. Persists locally.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Question Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="text-[#0078D4] font-black">
                M{question.moduleId}: {question.moduleTitle}
              </span>
              <span className="text-slate-400 font-medium">Path {question.learningPathId}</span>
            </div>
            <p className="text-xs text-slate-800 font-semibold line-clamp-2">
              {question.question}
            </p>
          </div>

          {/* Quick Mnemonic Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Format Shortcuts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertSnippet('💡 Mnemonic: ')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Mnemonic</span>
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('⚠️ Exam Trap: ')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>+ Exam Trap</span>
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('⚡ Rule: ')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>+ Rule</span>
              </button>
            </div>
          </div>

          {/* Note Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="quick-note-textarea" className="font-extrabold text-slate-700">
                Your Personal Note:
              </label>
              <span className="text-slate-400 text-[11px]">
                {noteText.length} characters
              </span>
            </div>
            <textarea
              id="quick-note-textarea"
              ref={textareaRef}
              rows={8}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Remember: LRS has 3 copies in single datacenter. ExpressRoute never touches public internet. Azure Policy enforces compliance before deployment."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans resize-y shadow-2xs focus:outline-hidden"
            />
          </div>

          {/* Exam Anchor Reference Tip */}
          {question.examTip && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
              <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Curriculum Anchor Reference</span>
              </span>
              <p className="leading-relaxed text-amber-900">{question.examTip}</p>
            </div>
          )}

          {/* Status Feedback */}
          {saveToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
              <span>Note saved successfully! Persisted in your browser.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          {hasExistingNote ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Delete this note"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
