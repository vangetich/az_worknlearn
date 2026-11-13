import React, { useEffect, useRef, useState } from 'react';
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
  Loader2,
  CloudCheck,
  Download,
  Anchor,
  Mic,
  MicOff,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';
import { useDebouncedNotes } from '../hooks/useDebouncedNotes';
import { saveQuestionNote } from '../utils/storage';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import {
  downloadNotesAndMemoryAnchorsMarkdown,
  saveMemoryAnchor,
  isMemoryAnchorSaved,
} from '../utils/exportNotesMarkdown';

interface QuickNotesDrawerProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved?: (text: string) => void;
  allQuestions?: Question[];
}

export const QuickNotesDrawer: React.FC<QuickNotesDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onNoteSaved,
  allQuestions,
}) => {
  const {
    noteText,
    setNoteText,
    saveStatus,
    lastSavedTimestamp,
    forceSave,
    deleteNote,
    hasExistingNote,
  } = useDebouncedNotes({
    questionId: question?.id || '',
    delayMs: 450,
    onSaved: onNoteSaved,
  });

  const [anchorPinned, setAnchorPinned] = useState<boolean>(() =>
    question ? isMemoryAnchorSaved(`anchor-${question.id}`) : false
  );
  const [markdownExportToast, setMarkdownExportToast] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (question) {
      setAnchorPinned(isMemoryAnchorSaved(`anchor-${question.id}`));
    }
    setSpeechError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsDictating(false);
    }
  }, [question, isOpen]);

  const handlePinMemoryAnchor = () => {
    if (!question) return;
    saveMemoryAnchor({
      id: `anchor-${question.id}`,
      questionId: question.id,
      moduleId: question.moduleId,
      moduleTitle: question.moduleTitle,
      title: `${question.id.toUpperCase()}: ${question.moduleTitle}`,
      anchorText:
        noteText.trim() ||
        question.examTip ||
        question.whyCorrect,
      examTrap: question.examTip,
    });
    setAnchorPinned(true);
  };

  const handleExportMarkdown = () => {
    forceSave();
    const pool = allQuestions && allQuestions.length > 0 ? allQuestions : BUILTIN_QUESTIONS;
    const result = downloadNotesAndMemoryAnchorsMarkdown(pool);
    setMarkdownExportToast(
      `Exported ${result.notesCount} notes & ${result.anchorsCount} memory anchors to ${result.filename}!`
    );
    setTimeout(() => setMarkdownExportToast(null), 4000);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    forceSave();
  };

  const handleDelete = () => {
    deleteNote();
  };

  const handleToggleVoiceDictation = () => {
    setSpeechError(null);
    if (isDictating && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setSpeechError('Web Speech API voice dictation requires Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onresult = (event: any) => {
        let spoken = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            spoken += event.results[i][0].transcript + ' ';
          }
        }
        const cleaned = spoken.trim();
        if (cleaned && question?.id) {
          setNoteText((prev) => {
            const combined = prev.trim() ? `${prev.trim()} ${cleaned}` : cleaned;
            saveQuestionNote(question.id, combined);
            if (onNoteSaved) {
              onNoteSaved(combined);
            }
            return combined;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          setSpeechError(`Voice input stopped (${event.error || 'mic permission required'}).`);
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError('Could not initialize browser microphone dictation.');
      setIsDictating(false);
    }
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-slate-900">
                  Personal Quick Notes &amp; Mnemonics
                </h3>
                {saveStatus === 'saving' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Auto-saving...</span>
                  </span>
                ) : hasExistingNote ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Auto-saved</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Notes auto-save as you type and persist locally in browser storage.
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

          {/* Note Textarea + Web Speech API Microphone Dictation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor="quick-note-textarea" className="font-extrabold text-slate-700">
                Your Personal Note (Markdown supported):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleVoiceDictation}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border flex items-center gap-1 transition-all cursor-pointer ${
                    isDictating
                      ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-xs'
                      : 'bg-sky-50 hover:bg-sky-100 text-[#0078D4] border-sky-200 shadow-2xs'
                  }`}
                  title="Dictate study notes into savedNotesMap via Web Speech API"
                >
                  {isDictating ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop Dictation</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Dictate Note</span>
                    </>
                  )}
                </button>
                <span className="text-slate-400 text-[11px]">
                  {noteText.length} characters
                </span>
              </div>
            </div>

            {speechError && (
              <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center justify-between gap-2">
                <span>{speechError}</span>
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="font-bold underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                id="quick-note-textarea"
                ref={textareaRef}
                rows={8}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  isDictating
                    ? 'Listening... Speak your study notes clearly to transcribe straight into savedNotesMap...'
                    : 'e.g. Remember: **LRS** has 3 copies in single datacenter. ExpressRoute never touches public internet.'
                }
                className={`w-full p-3.5 pr-10 rounded-xl border text-xs sm:text-sm text-slate-800 leading-relaxed font-sans resize-y shadow-2xs focus:outline-hidden ${
                  isDictating
                    ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/30'
                    : 'border-slate-300 focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20'
                }`}
              />
              <button
                type="button"
                onClick={handleToggleVoiceDictation}
                className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDictating
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-slate-400 hover:text-[#0078D4] hover:bg-blue-50'
                }`}
                title="Tap microphone to dictate study notes"
                aria-label="Toggle microphone voice dictation"
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Exam Anchor Reference Tip & Pin Memory Anchor */}
          {question.examTip && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Curriculum Memory Anchor</span>
                </span>
                <button
                  type="button"
                  onClick={handlePinMemoryAnchor}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border flex items-center gap-1 transition-colors cursor-pointer ${
                    anchorPinned
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  <Anchor className="w-3 h-3" />
                  <span>{anchorPinned ? 'Memory Anchor Pinned ✓' : 'Pin Memory Anchor'}</span>
                </button>
              </div>
              <p className="leading-relaxed text-amber-900">{question.examTip}</p>
            </div>
          )}

          {/* Offline Markdown Export Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-white to-emerald-50/60 border border-sky-200/90 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-extrabold text-slate-900 block">
                Export All Saved Question Notes &amp; Memory Anchors (.MD)
              </span>
              <span className="text-[11px] text-slate-600 block">
                Download a formatted Markdown study file for offline revision.
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
          </div>

          {markdownExportToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{markdownExportToast}</span>
            </div>
          )}

          {/* Status Feedback */}
          {saveStatus === 'saving' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Auto-saving study note to localStorage...</span>
            </div>
          )}
          {saveStatus === 'saved' && hasExistingNote && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
              <span>Note automatically saved &amp; persisted! No manual click required.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {hasExistingNote && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete this note"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-[#0078D4] border border-sky-200 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export all saved question notes and memory anchors as a formatted Markdown (.md) file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
          </div>

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
