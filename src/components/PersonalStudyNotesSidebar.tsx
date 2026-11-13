import React, { useEffect, useRef, useState } from 'react';
import {
  StickyNote,
  Mic,
  MicOff,
  Eye,
  Edit3,
  Check,
  Trash2,
  Bold,
  Italic,
  List,
  Code,
  Heading2,
  Quote,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Download,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { getQuestionNote, saveQuestionNote } from '../utils/storage';

interface PersonalStudyNotesSidebarProps {
  question: Question;
  savedNotesMap: Record<string, string>;
  onUpdateSavedNote: (questionId: string, text: string) => void;
  onExportAllMarkdown?: () => void;
  onOpenFullDrawer?: () => void;
}

const SIDEBAR_OPEN_STORAGE_KEY = 'az900_personal_notes_sidebar_open_v1';

/**
 * Lightweight, safe React Markdown inline formatter (bold, italic, inline code, links).
 * Avoids dangerouslySetInnerHTML completely.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`md-code-${keyCounter++}`}
          className="px-1 py-0.2 rounded bg-slate-100 text-[#005A9E] border border-slate-200 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`md-b-${keyCounter++}`} className="font-extrabold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`md-i-${keyCounter++}`} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={`md-a-${keyCounter++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0078D4] underline font-semibold hover:text-[#005A9E]"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export const MarkdownNotesPreview: React.FC<{ markdown: string }> = ({ markdown }) => {
  if (!markdown.trim()) {
    return (
      <div className="p-3 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/40 text-[11px] text-slate-500 italic">
        No Markdown notes saved for this question yet. Switch to Write mode or tap the microphone icon to dictate your study cues!
      </div>
    );
  }

  const lines = markdown.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let keyCounter = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === 'ol') {
      elements.push(
        <ol key={`md-ol-${keyCounter++}`} className="list-decimal pl-4 space-y-1 text-xs text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`md-ul-${keyCounter++}`} className="list-disc pl-4 space-y-1 text-xs text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith('```')) {
      flushList();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLines = [];
      } else {
        elements.push(
          <pre
            key={`md-pre-${keyCounter++}`}
            className="p-2.5 rounded-lg bg-slate-900 text-sky-200 font-mono text-[11px] overflow-x-auto"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h5 key={`md-h3-${keyCounter++}`} className="text-xs font-extrabold text-slate-900 pt-1">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h5>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h4 key={`md-h2-${keyCounter++}`} className="text-[13px] font-black text-[#005A9E] pt-1">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h4>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h3 key={`md-h1-${keyCounter++}`} className="text-sm font-black text-slate-900 border-b border-slate-200 pb-1">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h3>
      );
    } else if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`md-bq-${keyCounter++}`}
          className="pl-2.5 py-1 border-l-3 border-amber-500 bg-amber-50/70 rounded-r-lg text-xs text-amber-950 font-medium"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
    } else if (/^[-*+]\s+/.test(trimmed)) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(trimmed.replace(/^[-*+]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
    } else {
      flushList();
      elements.push(
        <p key={`md-p-${keyCounter++}`} className="text-xs text-slate-700 leading-relaxed">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  flushList();
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre
        key={`md-pre-end-${keyCounter++}`}
        className="p-2.5 rounded-lg bg-slate-900 text-sky-200 font-mono text-[11px] overflow-x-auto"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-2">{elements}</div>;
};

export const PersonalStudyNotesSidebar: React.FC<PersonalStudyNotesSidebarProps> = ({
  question,
  savedNotesMap,
  onUpdateSavedNote,
  onExportAllMarkdown,
  onOpenFullDrawer,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const currentSavedText =
    savedNotesMap[question.id] !== undefined
      ? savedNotesMap[question.id]
      : getQuestionNote(question.id);

  const [draftText, setDraftText] = useState<string>(currentSavedText);
  const [viewMode, setViewMode] = useState<'write' | 'preview'>(() =>
    currentSavedText.trim() ? 'preview' : 'write'
  );
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync automatically whenever user switches or revisits a question
  useEffect(() => {
    const loaded =
      savedNotesMap[question.id] !== undefined
        ? savedNotesMap[question.id]
        : getQuestionNote(question.id);
    setDraftText(loaded);
    setJustSaved(false);
    setSpeechError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsDictating(false);
    }
  }, [question.id, savedNotesMap]);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const persistText = (nextVal: string) => {
    setDraftText(nextVal);
    saveQuestionNote(question.id, nextVal);
    onUpdateSavedNote(question.id, nextVal);
    setJustSaved(true);
  };

  const applyMarkdownWrap = (before: string, after = '', placeholder = 'text') => {
    const textarea = textareaRef.current;
    if (viewMode === 'preview') setViewMode('write');

    if (!textarea) {
      const snippet = `${before}${placeholder}${after}`;
      persistText(draftText ? `${draftText}\n${snippet}` : snippet);
      return;
    }

    const start = textarea.selectionStart ?? draftText.length;
    const end = textarea.selectionEnd ?? draftText.length;
    const selected = draftText.slice(start, end) || placeholder;
    const updated =
      draftText.slice(0, start) + before + selected + after + draftText.slice(end);
    persistText(updated);

    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length + selected.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 30);
  };

  const handleToggleDictation = () => {
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
      setSpeechError('Web Speech API dictation requires Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsDictating(true);
        if (viewMode === 'preview') setViewMode('write');
      };

      recognition.onresult = (event: any) => {
        let spoken = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            spoken += event.results[i][0].transcript + ' ';
          }
        }
        const cleaned = spoken.trim();
        if (cleaned) {
          setDraftText((prev) => {
            const combined = prev.trim() ? `${prev.trim()}\n- ${cleaned}` : `- ${cleaned}`;
            saveQuestionNote(question.id, combined);
            onUpdateSavedNote(question.id, combined);
            setJustSaved(true);
            return combined;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          setSpeechError(`Mic paused (${event.error || 'permission denied'}).`);
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError('Unable to access microphone for speech dictation.');
      setIsDictating(false);
    }
  };

  const hasSavedNote = Boolean(draftText.trim());

  if (!isOpen) {
    return (
      <div className="w-full xl:w-auto shrink-0">
        <button
          type="button"
          onClick={toggleOpen}
          className="w-full xl:w-11 xl:min-h-[260px] px-3 py-2.5 xl:px-2 xl:py-4 rounded-xl bg-gradient-to-b from-amber-50 via-white to-orange-50 hover:from-amber-100 border border-amber-300/90 shadow-xs flex xl:flex-col items-center justify-between xl:justify-center gap-2 text-amber-950 font-extrabold text-xs cursor-pointer transition-all"
          title="Expand Personal Study Notes Sidebar (Markdown + Voice Dictation)"
        >
          <div className="flex xl:flex-col items-center gap-2">
            <ChevronLeft className="w-4 h-4 text-amber-700 hidden xl:block" />
            <StickyNote className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="xl:[writing-mode:vertical-rl] xl:rotate-180 tracking-wide">
              Personal Study Notes
            </span>
          </div>
          {hasSavedNote && (
            <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-600 text-white">
              Saved
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Personal Study Notes Sidebar"
      className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 xl:sticky xl:top-20 rounded-xl border border-amber-200/90 bg-white card-elevation overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-3.5 py-3 bg-gradient-to-r from-amber-50 via-orange-50/70 to-white border-b border-amber-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs shrink-0">
            <StickyNote className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-slate-900 truncate">
                Personal Study Notes
              </h3>
              {hasSavedNote && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  {justSaved ? 'Synced' : 'Saved'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              Markdown • {question.id.toUpperCase()} • Auto-reloads on revisit
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleOpen}
          className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
          title="Collapse Personal Study Notes Sidebar"
          aria-label="Collapse Personal Study Notes Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher + Web Speech Mic Button */}
      <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              viewMode === 'write'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3 h-3 text-[#0078D4]" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3 h-3 text-emerald-600" />
            <span>Markdown</span>
          </button>
        </div>

        {/* Web Speech API Dictation Button */}
        <button
          type="button"
          onClick={handleToggleDictation}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border flex items-center gap-1 transition-all cursor-pointer ${
            isDictating
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-xs'
              : 'bg-white hover:bg-sky-50 text-[#0078D4] border-sky-200 shadow-2xs'
          }`}
          title="Dictate study notes straight into savedNotesMap using Web Speech API"
        >
          {isDictating ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Dictate</span>
            </>
          )}
        </button>
      </div>

      {/* Markdown Formatting Toolbar */}
      <div className="px-3 py-1.5 bg-white border-b border-slate-100 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => applyMarkdownWrap('## ', '', 'Key Concept')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Heading (## )"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyMarkdownWrap('**', '**', 'important')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyMarkdownWrap('*', '*', 'emphasis')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Italic (*text*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyMarkdownWrap('`', '`', 'Azure Service')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Inline Code (`service`)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyMarkdownWrap('- ', '', 'Bullet takeaway')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Bullet List (- item)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyMarkdownWrap('> **Exam Tip:** ', '', 'Verify boundary')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Exam Tip Callout (> quote)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Editor or Rendered Markdown Preview */}
      <div className="p-3.5 space-y-2.5 flex-1">
        {speechError && (
          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[10.5px] font-semibold text-rose-800 flex items-center justify-between gap-2">
            <span>{speechError}</span>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="font-bold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {isDictating && (
          <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Listening... Spoken words save directly as bullet notes.</span>
          </div>
        )}

        {viewMode === 'write' ? (
          <textarea
            ref={textareaRef}
            rows={10}
            value={draftText}
            onChange={(e) => persistText(e.target.value)}
            placeholder={`## ${question.moduleTitle}\n- Write **Markdown** notes or tap *Dictate*\n> Exam trap reminder...`}
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 text-xs text-slate-800 font-mono leading-relaxed resize-y focus:outline-none bg-slate-50/40"
          />
        ) : (
          <div className="min-h-[180px] max-h-[340px] overflow-y-auto p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <MarkdownNotesPreview markdown={draftText} />
          </div>
        )}

        {/* Quick Context Exam Tip Anchor */}
        {question.examTip && (
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-extrabold text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Quick Exam Cue</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const insertion = `> **Exam Cue:** ${question.examTip}`;
                  persistText(draftText.trim() ? `${draftText.trim()}\n${insertion}` : insertion);
                }}
                className="text-[10px] font-extrabold text-[#0078D4] hover:underline cursor-pointer"
              >
                + Copy to Note
              </button>
            </div>
            <p className="text-[10.5px] text-amber-900 leading-snug line-clamp-3">
              {question.examTip}
            </p>
          </div>
        )}
      </div>

      {/* Footer Status & Actions */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Check className={`w-3.5 h-3.5 ${hasSavedNote ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{draftText.length} chars</span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasSavedNote && (
            <button
              type="button"
              onClick={() => persistText('')}
              className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1 cursor-pointer"
              title="Clear saved note for this question"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          {onOpenFullDrawer && (
            <button
              type="button"
              onClick={onOpenFullDrawer}
              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Expand
            </button>
          )}
          {onExportAllMarkdown && (
            <button
              type="button"
              onClick={onExportAllMarkdown}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold flex items-center gap-1 cursor-pointer"
              title="Download all notes as Markdown (.md)"
            >
              <Download className="w-3 h-3" />
              <span>.MD</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
