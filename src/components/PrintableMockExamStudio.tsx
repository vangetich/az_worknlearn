import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  FileDown,
  Globe,
  BookmarkPlus,
  Trash2,
  FolderOpen,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  BookOpen,
  Loader2,
  Eye,
  Minus,
  Plus,
} from 'lucide-react';
import type { Question, UserStats } from '../types/quiz';
import {
  PRINTABLE_EXAM_TRACKS,
  type GroundingSourceLink,
  type PrintableExamTrack,
  type PrintableMockExam,
} from '../types/printableExam';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  MIN_PRINTABLE_QUESTIONS,
  MAX_PRINTABLE_QUESTIONS,
  buildPrintableMockExamQuestions,
  clampPrintableCount,
  collectGroundingSources,
  deleteSavedPrintableExamLocally,
  loadSavedPrintableExams,
  savePrintableExamLocally,
  validatePrintableQuestionCount,
} from '../utils/printableExamEngine';
import { generatePrintableMockExamPdf } from '../utils/printableExamPdf';
import {
  auth,
  deletePrintableMockExamFromFirestore,
  fetchPrintableMockExamsFromFirestore,
  saveGoogleSourcedQuestionsToFirestore,
  savePrintableMockExamToFirestore,
} from '../lib/firebase';

export interface PrintableMockExamStudioProps {
  questions: Question[];
  stats?: UserStats;
  onAddSourcedQuestions: (newQuestions: Question[]) => void;
  initialTrack?: PrintableExamTrack;
}

const QUICK_COUNTS = [20, 25, 30, 35, 40, 45] as const;
const GOOGLE_BATCH_SIZES = [5, 10, 15, 20] as const;

export const PrintableMockExamStudio: React.FC<PrintableMockExamStudioProps> = ({
  questions,
  stats,
  onAddSourcedQuestions,
  initialTrack = 'balanced',
}) => {
  const [selectedTrack, setSelectedTrack] = useState<PrintableExamTrack>(initialTrack);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [questionCountInput, setQuestionCountInput] = useState<string>('25');
  const [printValidationError, setPrintValidationError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number>(1);
  const [focusModuleIds, setFocusModuleIds] = useState<number[]>([]);

  // Print formatting toggles
  const [customTitle, setCustomTitle] = useState<string>('');
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [showMetadataHints, setShowMetadataHints] = useState<boolean>(false);
  const [includeBubbleSheet, setIncludeBubbleSheet] = useState<boolean>(true);
  const [prioritizeGoogleSourced, setPrioritizeGoogleSourced] = useState<boolean>(true);

  // Google Search sourcing state
  const [googleBatchCount, setGoogleBatchCount] = useState<number>(10);
  const [googleTopicPrompt, setGoogleTopicPrompt] = useState<string>('');
  const [isSourcingGoogle, setIsSourcingGoogle] = useState<boolean>(false);
  const [sourcingError, setSourcingError] = useState<string | null>(null);
  const [sourcingFeedback, setSourcingFeedback] = useState<string | null>(null);
  const [latestGroundingLinks, setLatestGroundingLinks] = useState<GroundingSourceLink[]>([]);

  // Saved library state
  const [savedExams, setSavedExams] = useState<PrintableMockExam[]>(() => loadSavedPrintableExams());
  const [loadedSavedExam, setLoadedSavedExam] = useState<PrintableMockExam | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [previewAllQuestions, setPreviewAllQuestions] = useState<boolean>(false);

  // Auto-detect weak modules from stats for Google sourcing context & UI
  const weakModuleIds = useMemo(() => {
    const ids: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const mod = stats?.moduleMastery?.[m];
      if (mod && mod.total > 0 && mod.correct / mod.total < 0.75) {
        ids.push(m);
      }
      const conf = stats?.moduleConfidenceScores?.[m];
      if (typeof conf === 'number' && conf <= 3 && !ids.includes(m)) {
        ids.push(m);
      }
    }
    return ids;
  }, [stats]);

  // Hydrate cloud-saved printable exam metadata if user is signed in
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    let active = true;
    fetchPrintableMockExamsFromFirestore(currentUser.uid)
      .then((cloudDocs) => {
        if (!active || !Array.isArray(cloudDocs) || cloudDocs.length === 0) return;
        const qById = new Map(questions.map((q) => [q.id, q]));
        const localExisting = loadSavedPrintableExams();
        const mergedMap = new Map(localExisting.map((e) => [e.id, e]));

        cloudDocs.forEach((docItem: any) => {
          const rawIds: string[] = Array.isArray(docItem.questionIds) ? docItem.questionIds : [];
          const resolvedQs = rawIds
            .map((id) => qById.get(id))
            .filter((q): q is Question => Boolean(q));
          if (resolvedQs.length >= MIN_PRINTABLE_QUESTIONS) {
            const cleanId = String(docItem.docId || '').replace(`${currentUser.uid}_`, '');
            if (cleanId && !mergedMap.has(cleanId)) {
              mergedMap.set(cleanId, {
                id: cleanId,
                title: String(docItem.title || 'Synced Printable Exam'),
                track: (docItem.track || 'balanced') as PrintableExamTrack,
                questionCount: resolvedQs.length,
                questions: resolvedQs,
                sourcedViaGoogleCount: Number(docItem.sourcedViaGoogleCount || 0),
                groundingSources: collectGroundingSources(resolvedQs),
                includeAnswerKey: Boolean(docItem.includeAnswerKey ?? true),
                includeExplanations: Boolean(docItem.includeExplanations ?? true),
                showMetadataHints: Boolean(docItem.showMetadataHints ?? false),
                includeBubbleSheet: true,
                notes: String(docItem.notes || ''),
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
          }
        });

        setSavedExams(Array.from(mergedMap.values()));
      })
      .catch(() => {
        // Local storage remains authoritative offline
      });
    return () => {
      active = false;
    };
  }, [questions]);

  const activeTrackMeta = useMemo(
    () => PRINTABLE_EXAM_TRACKS.find((t) => t.id === selectedTrack) || PRINTABLE_EXAM_TRACKS[0],
    [selectedTrack]
  );

  const generatedQuestions = useMemo(() => {
    if (loadedSavedExam) {
      return loadedSavedExam.questions;
    }
    return buildPrintableMockExamQuestions({
      allQuestions: questions,
      track: selectedTrack,
      targetCount: questionCount,
      stats,
      seed,
      prioritizeGoogleSourced,
      focusModuleIds,
    });
  }, [
    loadedSavedExam,
    questions,
    selectedTrack,
    questionCount,
    stats,
    seed,
    prioritizeGoogleSourced,
    focusModuleIds,
  ]);

  const effectiveExam: PrintableMockExam = useMemo(() => {
    const qs = generatedQuestions;
    const googleCount = qs.filter((q) => q.sourcedViaGoogle).length;
    const links = [
      ...latestGroundingLinks,
      ...collectGroundingSources(qs),
    ].filter((item, index, arr) => arr.findIndex((x) => x.uri === item.uri) === index);

    const defaultTitle = `AZ-900 ${activeTrackMeta.shortLabel} (${qs.length}Q)`;
    return {
      id: loadedSavedExam?.id || `printable-${selectedTrack}-${qs.length}-${seed}`,
      title: customTitle.trim() || loadedSavedExam?.title || defaultTitle,
      track: loadedSavedExam?.track || selectedTrack,
      questionCount: clampPrintableCount(qs.length),
      questions: qs,
      sourcedViaGoogleCount: googleCount,
      groundingSources: links,
      includeAnswerKey,
      includeExplanations,
      showMetadataHints,
      includeBubbleSheet,
      notes: studyNotes,
      createdAt: loadedSavedExam?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }, [
    generatedQuestions,
    latestGroundingLinks,
    activeTrackMeta.shortLabel,
    loadedSavedExam,
    selectedTrack,
    seed,
    customTitle,
    includeAnswerKey,
    includeExplanations,
    showMetadataHints,
    includeBubbleSheet,
    studyNotes,
  ]);

  const statsBreakdown = useMemo(() => {
    const qs = effectiveExam.questions;
    return {
      p1: qs.filter((q) => q.learningPathId === 1).length,
      p2: qs.filter((q) => q.learningPathId === 2).length,
      p3: qs.filter((q) => q.learningPathId === 3).length,
      fund: qs.filter((q) => q.difficulty === 'Fundamental').length,
      inter: qs.filter((q) => q.difficulty === 'Intermediate').length,
      adv: qs.filter((q) => q.difficulty === 'Advanced').length,
      googleCount: qs.filter((q) => q.sourcedViaGoogle).length,
    };
  }, [effectiveExam.questions]);

  const googleBankTotal = useMemo(
    () => questions.filter((q) => q.sourcedViaGoogle).length,
    [questions]
  );

  const createdDateLabel = useMemo(
    () =>
      new Date(effectiveExam.createdAt || Date.now()).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [effectiveExam.createdAt]
  );

  const handleTrackChange = (trackId: PrintableExamTrack) => {
    setLoadedSavedExam(null);
    setSelectedTrack(trackId);
    setSeed((prev) => prev + 1);
  };

  const handleCountChange = (val: number) => {
    setLoadedSavedExam(null);
    const clamped = clampPrintableCount(val);
    setQuestionCount(clamped);
    setQuestionCountInput(String(clamped));
    setPrintValidationError(null);
  };

  const handleNumericCountInputChange = (raw: string) => {
    setLoadedSavedExam(null);
    setQuestionCountInput(raw);
    const parsed = Number(raw);
    const check = validatePrintableQuestionCount(parsed);
    if (check.valid) {
      setQuestionCount(parsed);
      setPrintValidationError(null);
    } else if (raw.trim() === '') {
      setPrintValidationError(null);
    }
  };

  const toggleWeakModuleFilter = (modId: number) => {
    setLoadedSavedExam(null);
    setFocusModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleSourceViaGoogle = async () => {
    if (isSourcingGoogle) return;
    setIsSourcingGoogle(true);
    setSourcingError(null);
    setSourcingFeedback(null);

    try {
      const existingSnippets = questions
        .slice(-25)
        .map((q) => q.question.slice(0, 100));

      const response = await fetch('/api/mock-exam/source-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          count: googleBatchCount,
          customTopic: googleTopicPrompt.trim(),
          weakModuleIds: focusModuleIds.length > 0 ? focusModuleIds : weakModuleIds,
          existingQuestionSnippets: existingSnippets,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to source questions via Google Search.');
      }

      const newlySourced: Question[] = Array.isArray(data?.questions) ? data.questions : [];
      if (newlySourced.length === 0) {
        throw new Error('No valid AZ-900 questions were returned from Google Search.');
      }

      onAddSourcedQuestions(newlySourced);

      if (auth.currentUser?.emailVerified) {
        saveGoogleSourcedQuestionsToFirestore(auth.currentUser.uid, newlySourced).catch((err) =>
          console.warn('Firestore sync for sourced questions skipped:', err)
        );
      }

      if (Array.isArray(data?.groundingSources)) {
        setLatestGroundingLinks(data.groundingSources);
      }

      setLoadedSavedExam(null);
      setPrioritizeGoogleSourced(true);
      setSeed((prev) => prev + 1);
      setSourcingFeedback(
        `Sourced ${newlySourced.length} fresh Microsoft Learn-grounded questions via Google Search and stored them in your app bank.`
      );
    } catch (err: any) {
      setSourcingError(err?.message || 'Unable to source questions via Google Search.');
    } finally {
      setIsSourcingGoogle(false);
    }
  };

  const handleSaveExamPacket = async () => {
    const idToSave = loadedSavedExam?.id || `exam-${Date.now()}`;
    const packetToSave: PrintableMockExam = {
      ...effectiveExam,
      id: idToSave,
      updatedAt: Date.now(),
    };
    const updatedList = savePrintableExamLocally(packetToSave);
    setSavedExams(updatedList);
    setLoadedSavedExam(packetToSave);

    if (auth.currentUser?.emailVerified) {
      try {
        await savePrintableMockExamToFirestore(auth.currentUser.uid, {
          id: packetToSave.id,
          title: packetToSave.title,
          track: packetToSave.track,
          questionCount: packetToSave.questions.length,
          questionIds: packetToSave.questions.map((q) => q.id),
          sourcedViaGoogleCount: packetToSave.sourcedViaGoogleCount,
          includeAnswerKey: packetToSave.includeAnswerKey,
          includeExplanations: packetToSave.includeExplanations,
          showMetadataHints: packetToSave.showMetadataHints,
          notes: packetToSave.notes,
        });
        setSaveToast('Saved to App Library & synced to your Firestore cloud.');
      } catch {
        setSaveToast('Saved to App Library locally.');
      }
    } else {
      setSaveToast('Saved to App Library for offline & future printing.');
    }
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleLoadSavedExam = (saved: PrintableMockExam) => {
    setLoadedSavedExam(saved);
    setSelectedTrack(saved.track);
    const clamped = clampPrintableCount(saved.questions.length);
    setQuestionCount(clamped);
    setQuestionCountInput(String(clamped));
    setPrintValidationError(null);
    setCustomTitle(saved.title);
    setStudyNotes(saved.notes || '');
    setIncludeAnswerKey(saved.includeAnswerKey);
    setIncludeExplanations(saved.includeExplanations);
    setShowMetadataHints(saved.showMetadataHints);
    setIncludeBubbleSheet(saved.includeBubbleSheet ?? true);
  };

  const handleDeleteSavedExam = async (examId: string) => {
    const next = deleteSavedPrintableExamLocally(examId);
    setSavedExams(next);
    if (loadedSavedExam?.id === examId) {
      setLoadedSavedExam(null);
    }
    if (auth.currentUser?.emailVerified) {
      deletePrintableMockExamFromFirestore(auth.currentUser.uid, examId).catch(() => {});
    }
  };

  const handleBrowserPrint = useCallback(() => {
    const requestedCount = loadedSavedExam
      ? loadedSavedExam.questions.length
      : questionCountInput.trim() === ''
      ? Number.NaN
      : Number(questionCountInput);

    const validation = validatePrintableQuestionCount(
      requestedCount,
      effectiveExam.questions.length
    );

    if (!validation.valid) {
      setPrintValidationError(validation.error);
      return;
    }

    setPrintValidationError(null);
    window.print();
  }, [loadedSavedExam, questionCountInput, effectiveExam.questions.length]);

  const handleDownloadPdf = useCallback(() => {
    const requestedCount = loadedSavedExam
      ? loadedSavedExam.questions.length
      : questionCountInput.trim() === ''
      ? Number.NaN
      : Number(questionCountInput);

    const validation = validatePrintableQuestionCount(
      requestedCount,
      effectiveExam.questions.length
    );

    if (!validation.valid) {
      setPrintValidationError(validation.error);
      return;
    }

    setPrintValidationError(null);
    generatePrintableMockExamPdf(effectiveExam);
  }, [loadedSavedExam, questionCountInput, effectiveExam]);

  const visiblePreviewQuestions = previewAllQuestions
    ? effectiveExam.questions
    : effectiveExam.questions.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Top Action & Summary Strip */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-900">Self-Paced Printable Study Booklet</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">20 Min to 45 Max Unique Questions</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{questions.length} Questions in App Bank</span>
            {googleBankTotal > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#0078D4] font-semibold tabular-nums">
                  {googleBankTotal} Sourced via Google
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-600">
            Configure an untimed mock exam tailored to a learning path, weak areas, progressive difficulty, or case-study scenarios—then print or save as PDF to study anywhere at your own pace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveExamPacket}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Save to App</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2 rounded-lg border border-[#0078D4] bg-white hover:bg-sky-50 text-[#0078D4] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF ({effectiveExam.questions.length}Q)</span>
          </button>
          <button
            type="button"
            data-testid="printable-exam-print-btn"
            onClick={handleBrowserPrint}
            className="px-4 py-2 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Mock Exam</span>
          </button>
        </div>
      </div>

      {printValidationError && (
        <div
          role="alert"
          data-testid="printable-exam-validation-error"
          className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{printValidationError}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCountChange(clampPrintableCount(Number(questionCountInput) || 25))}
            className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold whitespace-nowrap cursor-pointer"
          >
            Reset to Valid Range
          </button>
        </div>
      )}

      {saveToast && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Two-Zone Studio Grid: Left Builder Controls | Right Live Booklet Preview & Saved Packets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Strategy, 20-45 Volume, Google Sourcing & Print Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Exam Strategy & Curriculum Focus */}
          <section className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0078D4]" />
                <span>01. Select Study Strategy &amp; Exam Track</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">{activeTrackMeta.focusBadge}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {PRINTABLE_EXAM_TRACKS.map((track) => {
                const isActive = selectedTrack === track.id && !loadedSavedExam;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleTrackChange(track.id)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
                      isActive
                        ? 'border-[#0078D4] bg-sky-50/70 text-slate-900 ring-1 ring-[#0078D4]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {track.shortLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                        {track.focusBadge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {track.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Optional Weak Modules Selector when Weak Areas track is active */}
            {selectedTrack === 'weak-areas' && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Focus Specific Modules (optional — auto-detects{' '}
                    {weakModuleIds.length > 0 ? `Mod ${weakModuleIds.join(', ')}` : 'your misses'} if empty)
                  </span>
                  {focusModuleIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFocusModuleIds([])}
                      className="text-[#0078D4] font-semibold hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {LEARNING_PATHS.flatMap((p) => p.modules).map((mod) => {
                    const selected = focusModuleIds.includes(mod.id);
                    const isDetectedWeak = weakModuleIds.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleWeakModuleFilter(mod.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : isDetectedWeak
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        M{mod.id}: {mod.title.split(' ').slice(0, 2).join(' ')}
                        {isDetectedWeak ? ' *' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 2. Question Volume (20 Minimum to 45 Maximum) */}
          <section className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  02. Exam Length (20–45 Unique Questions)
                </h3>
                <p className="text-xs text-slate-500">
                  Pick any count from 20 minimum to 45 maximum. Duplicates are automatically filtered out.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease question count"
                  disabled={questionCount <= MIN_PRINTABLE_QUESTIONS}
                  onClick={() => handleCountChange(questionCount - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 text-white">
                  <input
                    type="number"
                    min={MIN_PRINTABLE_QUESTIONS}
                    max={MAX_PRINTABLE_QUESTIONS}
                    step={1}
                    data-testid="printable-question-count-input"
                    aria-label="Selected printable question count (20 to 45)"
                    value={loadedSavedExam ? String(loadedSavedExam.questions.length) : questionCountInput}
                    onChange={(e) => handleNumericCountInputChange(e.target.value)}
                    className="w-12 bg-transparent text-white font-mono text-sm font-bold tabular-nums text-center focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-300 pr-1">Qs</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase question count"
                  disabled={questionCount >= MAX_PRINTABLE_QUESTIONS}
                  onClick={() => handleCountChange(questionCount + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={MIN_PRINTABLE_QUESTIONS}
                max={MAX_PRINTABLE_QUESTIONS}
                step={1}
                value={clampPrintableCount(
                  loadedSavedExam ? loadedSavedExam.questions.length : questionCount
                )}
                onChange={(e) => handleCountChange(Number(e.target.value))}
                aria-label="Printable mock exam question count between 20 and 45"
                className="w-full accent-[#0078D4] cursor-pointer"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_COUNTS.map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleCountChange(cnt)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer tabular-nums ${
                        (loadedSavedExam ? loadedSavedExam.questions.length : questionCount) === cnt
                          ? 'bg-[#0078D4] text-white border-[#0078D4]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoadedSavedExam(null);
                    setSeed((prev) => prev + 1);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Reshuffle Set</span>
                </button>
              </div>
            </div>
          </section>

          {/* 3. Source Fresh Questions via Google Search & Store in App */}
          <section className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0078D4]" />
                <span>03. Source Fresh Questions via Google &amp; Store in App</span>
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {googleBankTotal} stored Google-grounded Qs
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Fetch newly written AZ-900 questions grounded in live Microsoft Learn search results, save them into your in-app question bank, and automatically include them in your printable booklet.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Topic or Focus Constraint (optional)
                </label>
                <input
                  type="text"
                  value={googleTopicPrompt}
                  onChange={(e) => setGoogleTopicPrompt(e.target.value)}
                  placeholder="e.g., Entra ID vs RBAC, Azure Arc, FinOps budgets"
                  maxLength={160}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Fetch Count
                </label>
                <select
                  value={googleBatchCount}
                  onChange={(e) => setGoogleBatchCount(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                >
                  {GOOGLE_BATCH_SIZES.map((n) => (
                    <option key={n} value={n}>
                      +{n} Questions
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleSourceViaGoogle}
                  disabled={isSourcingGoogle}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isSourcingGoogle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sourcing...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-sky-300" />
                      <span>Source &amp; Store</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {sourcingError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{sourcingError}</span>
              </div>
            )}

            {sourcingFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{sourcingFeedback}</span>
              </div>
            )}

            {effectiveExam.groundingSources.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Microsoft Learn &amp; Google Search Grounding References:
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {effectiveExam.groundingSources.slice(0, 4).map((src, i) => (
                    <a
                      key={`${src.uri}-${i}`}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#0078D4] hover:underline inline-flex items-center gap-1"
                    >
                      <span className="truncate max-w-[220px]">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 4. Self-Paced Booklet Customization */}
          <section className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              04. Self-Paced Study Layout &amp; Answer Key Options
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Custom Exam Packet Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`AZ-900 ${activeTrackMeta.shortLabel} (${effectiveExam.questions.length}Q)`}
                  maxLength={120}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cover Study Notes (optional)
                </label>
                <input
                  type="text"
                  value={studyNotes}
                  onChange={(e) => setStudyNotes(e.target.value)}
                  placeholder="e.g., Sunday quiet review — focus on why distractors fail"
                  maxLength={240}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="sm:col-span-2 p-3 rounded-lg border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Print Answer Key</span>
                  <span className="text-[11px] text-slate-600">
                    {includeAnswerKey
                      ? 'Enabled — adds a separate page at the end with correct answers and brief explanations.'
                      : 'Hidden — prints questions only for a clean test-like environment.'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeAnswerKey}
                  aria-label="Print Answer Key"
                  data-testid="print-answer-key-toggle"
                  onClick={() => setIncludeAnswerKey((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:ring-offset-1 ${
                    includeAnswerKey ? 'bg-[#0078D4]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      includeAnswerKey ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={includeExplanations}
                  disabled={!includeAnswerKey}
                  onChange={(e) => setIncludeExplanations(e.target.checked)}
                  className="rounded border-slate-300 text-[#0078D4] focus:ring-[#0078D4] disabled:opacity-40"
                />
                <span>Include Brief Explanations in Answer Key</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showMetadataHints}
                  onChange={(e) => setShowMetadataHints(e.target.checked)}
                  className="rounded border-slate-300 text-[#0078D4] focus:ring-[#0078D4]"
                />
                <span>Show Module &amp; Difficulty Labels on Questions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={includeBubbleSheet}
                  onChange={(e) => setIncludeBubbleSheet(e.target.checked)}
                  className="rounded border-slate-300 text-[#0078D4] focus:ring-[#0078D4]"
                />
                <span>Include Page-1 Tear-Off Bubble Grid</span>
              </label>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols): Saved Exams Library & Live Booklet Preview */}
        <div className="lg:col-span-5 space-y-5">
          {/* Stored Printable Exams Library */}
          <section className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#0078D4]" />
                <span>Saved Printable Exams ({savedExams.length})</span>
              </h3>
              {loadedSavedExam && (
                <button
                  type="button"
                  onClick={() => setLoadedSavedExam(null)}
                  className="text-xs font-semibold text-[#0078D4] hover:underline cursor-pointer"
                >
                  Back to Live Builder
                </button>
              )}
            </div>

            {savedExams.length === 0 ? (
              <p className="text-xs text-slate-500">
                No saved printable exam packets yet. Click <strong>Save to App</strong> to keep any 20–45 question set for repeat offline study.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedExams.map((saved) => {
                  const isCurrent = loadedSavedExam?.id === saved.id;
                  const dateLabel = new Date(saved.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div
                      key={saved.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'border-[#0078D4] bg-sky-50/70'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadSavedExam(saved)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {saved.title}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {saved.questions.length} Qs · {saved.track} · Saved {dateLabel}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedExam(saved.id)}
                        title="Delete saved printable exam"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Live Print Booklet Sheet Preview */}
          <section className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0078D4]" />
                <span>Print Sheet Preview</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewAllQuestions((prev) => !prev)}
                  className="text-xs font-semibold text-[#0078D4] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {previewAllQuestions
                      ? 'Show Compact Preview'
                      : `Inspect All ${effectiveExam.questions.length} Qs`}
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="printable-exam-preview-print-btn"
                  onClick={handleBrowserPrint}
                  className="px-2.5 py-1 rounded-md bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Packet Composition Stats (Clean Unboxed Metrics) */}
            <div className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1 tabular-nums">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-bold text-slate-900">Domains:</span>
                <span>P1 Cloud Concepts ({statsBreakdown.p1})</span>
                <span aria-hidden="true">·</span>
                <span>P2 Architecture ({statsBreakdown.p2})</span>
                <span aria-hidden="true">·</span>
                <span>P3 Governance ({statsBreakdown.p3})</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-slate-600">
                <span className="font-bold text-slate-900">Progression:</span>
                <span>Fundamental ({statsBreakdown.fund})</span>
                <span aria-hidden="true">·</span>
                <span>Intermediate ({statsBreakdown.inter})</span>
                <span aria-hidden="true">·</span>
                <span>Advanced ({statsBreakdown.adv})</span>
                {statsBreakdown.googleCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#0078D4] font-semibold">
                      Google Sourced ({statsBreakdown.googleCount})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Paper Mockup Preview */}
            <div className="p-4 rounded-lg border border-slate-300 bg-white max-h-[420px] overflow-y-auto space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#0078D4]/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0078D4] text-white flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-950 leading-tight">
                        AZ-900 Smart Quiz Builder
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Official Self-Paced Study Material
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-600 tabular-nums">
                    <div>Created: {createdDateLabel}</div>
                    <div className="font-semibold text-[#0078D4]">
                      {effectiveExam.includeAnswerKey ? 'Answer Key Included' : 'Test-Only Printout'}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {effectiveExam.title}
                </div>
                <div className="text-[11px] text-slate-600 tabular-nums">
                  {effectiveExam.questions.length} Unique Questions · Strategy: {activeTrackMeta.shortLabel}
                </div>
                <div className="pt-1 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-slate-200">
                  <span>Student Signature: ________________________</span>
                  <span>Date Taken: ____________</span>
                </div>
              </div>

              {visiblePreviewQuestions.map((q, idx) => (
                <div key={q.id} className="pb-3 border-b border-slate-100 last:border-b-0 space-y-1.5">
                  {showMetadataHints && (
                    <div className="text-[10px] font-semibold text-[#0078D4]">
                      Path {q.learningPathId} · Mod {q.moduleId}: {q.moduleTitle} · {q.difficulty}
                      {q.sourcedViaGoogle ? ' · Google Grounded' : ''}
                    </div>
                  )}
                  {q.scenario && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                      {q.scenario}
                    </p>
                  )}
                  {q.imageUrl && (
                    <figure className="my-2">
                      <img
                        src={q.imageUrl}
                        alt={q.imageAlt || `Question ${idx + 1} Azure architecture diagram`}
                        className="max-w-full h-auto rounded border border-slate-200 object-contain"
                      />
                    </figure>
                  )}
                  <p className="font-bold text-slate-900 leading-snug">
                    {idx + 1}. {q.question}
                  </p>
                  <ul className="space-y-1 pl-2 text-[11px] text-slate-700">
                    {q.options.map((opt) => (
                      <li key={opt.letter} className="flex items-start gap-2">
                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>{opt.letter})</strong> {opt.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {!previewAllQuestions && effectiveExam.questions.length > 6 && (
                <p className="text-center text-[11px] text-slate-500 pt-1">
                  Showing 6 of {effectiveExam.questions.length} questions. Print or download PDF for the full booklet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Hidden Clean Print Portal mounted on document.body for native window.print() */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="printable-mock-exam-portal" aria-hidden="true">
            {/* Cover Exam Metadata Header */}
            <header className="print-exam-metadata-header">
              {/* Custom AZ-900 Smart Quiz Builder Brand Lockup & Date of Creation */}
              <div className="print-brand-header">
                <div className="print-brand-lockup">
                  <span className="print-brand-logo-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-base font-extrabold tracking-tight text-slate-950">
                      AZ-900 Smart Quiz Builder
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0078D4]">
                      Microsoft Azure Fundamentals · Self-Paced Study Booklet
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-700 tabular-nums">
                  <div>
                    <strong>Date of Creation:</strong> {createdDateLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {activeTrackMeta.shortLabel} · {effectiveExam.questions.length} Unique Questions
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-950 mt-1">{effectiveExam.title}</h1>
              <div className="text-xs text-slate-700 mt-1">
                Study Strategy: {activeTrackMeta.label} · Passing Benchmark: 70% (700/1000)
              </div>

              <div className="print-exam-meta-grid">
                <div>
                  <strong>Exam Track:</strong> {activeTrackMeta.shortLabel} ({activeTrackMeta.focusBadge})
                </div>
                <div>
                  <strong>Total Questions:</strong> {effectiveExam.questions.length} (Range: 20–45)
                </div>
                <div>
                  <strong>Domain Split:</strong> P1 ({statsBreakdown.p1}) · P2 ({statsBreakdown.p2}) · P3 ({statsBreakdown.p3})
                </div>
                <div>
                  <strong>Sources:</strong> {effectiveExam.questions.length - statsBreakdown.googleCount} Built-in · {statsBreakdown.googleCount} Google-Grounded
                </div>
                <div>
                  <strong>Date of Creation:</strong> {createdDateLabel}
                </div>
                <div>
                  <strong>Print Answer Key:</strong> {effectiveExam.includeAnswerKey ? 'Included (Separate End Page)' : 'Hidden (Clean Test Environment)'}
                </div>
                <div className="col-span-2 print-signature-row">
                  <div>
                    <strong>Student Name:</strong> ___________________________________
                  </div>
                  <div>
                    <strong>Date Completed:</strong> ______________________
                  </div>
                  <div>
                    <strong>Student Signature:</strong> ________________________________
                  </div>
                  <div>
                    <strong>Score:</strong> ______ / {effectiveExam.questions.length}
                  </div>
                </div>
              </div>

              {effectiveExam.notes && effectiveExam.notes.trim() && (
                <div className="mt-3 p-2.5 border border-slate-200 bg-slate-50 rounded text-xs text-slate-700">
                  <strong>Study Notes:</strong> {effectiveExam.notes.trim()}
                </div>
              )}

              {/* Cover Answer Bubble Grid */}
              {effectiveExam.includeBubbleSheet && (
                <div className="mt-4">
                  <div className="text-xs font-bold text-slate-900 mb-2">
                    Self-Test Answer Sheet (Circle your choice before checking the Answer Key)
                  </div>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-xs font-mono">
                    {effectiveExam.questions.map((q, i) => (
                      <div key={`bubble-${q.id}`} className="flex items-center gap-2">
                        <span className="w-6 font-bold">{String(i + 1).padStart(2, '0')}.</span>
                        {['A', 'B', 'C', 'D'].map((ltr) => (
                          <span
                            key={ltr}
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-600 text-[10px] font-sans font-bold"
                          >
                            {ltr}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </header>

            {/* Section I: Questions with Repeating Exam Metadata Header */}
            <div className="print-page-break-before">
              <table className="print-exam-table">
                <thead className="print-repeating-header">
                  <tr>
                    <th className="print-repeating-header-cell">
                      <div className="flex items-center justify-between gap-4">
                        <span>
                          <strong>AZ-900 Smart Quiz Builder</strong> · {effectiveExam.title}
                        </span>
                        <span>
                          Created {createdDateLabel} · {effectiveExam.questions.length} Questions
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {effectiveExam.questions.map((q, idx) => {
                        const prevQ = idx > 0 ? effectiveExam.questions[idx - 1] : null;
                        const showTierHeader =
                          effectiveExam.track === 'progressive' &&
                          (!prevQ || prevQ.difficulty !== q.difficulty);

                        return (
                          <React.Fragment key={`print-q-${q.id}`}>
                            {showTierHeader && (
                              <div className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider mt-4 mb-2">
                                {q.difficulty === 'Fundamental'
                                  ? 'Part I — Fundamental Concepts Warm-Up'
                                  : q.difficulty === 'Intermediate'
                                  ? 'Part II — Intermediate Architecture & Scenarios'
                                  : 'Part III — Advanced Multi-Constraint Mastery'}
                              </div>
                            )}
                            <article className="print-question-card">
                              {effectiveExam.showMetadataHints && (
                                <div className="print-question-meta">
                                  Path {q.learningPathId} · Module {q.moduleId}: {q.moduleTitle} · {q.difficulty}
                                  {q.sourcedViaGoogle ? ' · Google Grounded' : ''}
                                </div>
                              )}
                              {q.scenario && (
                                <div className="print-question-scenario">
                                  {q.scenario}
                                </div>
                              )}
                              {q.imageUrl && (
                                <figure className="my-2">
                                  <img
                                    src={q.imageUrl}
                                    alt={q.imageAlt || `Question ${idx + 1} Azure diagram`}
                                    className="print-exam-image"
                                  />
                                </figure>
                              )}
                              <div className="print-question-stem">
                                {idx + 1}. {q.question}
                              </div>
                              <div className="print-options-list">
                                {q.options.map((opt) => (
                                  <div key={opt.letter} className="print-option-item">
                                    <span className="print-option-bubble" />
                                    <span>
                                      <strong>{opt.letter})</strong> {opt.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </article>
                          </React.Fragment>
                        );
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section II: Separate End Page Answer Key */}
            {effectiveExam.includeAnswerKey && (
              <section
                data-testid="printable-answer-key-section"
                className="print-page-break-before print-answer-key-page space-y-4"
              >
                <div className="border-b-2 border-slate-900 pb-2 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#0078D4]">
                      AZ-900 Smart Quiz Builder · Separate Answer Key
                    </div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Answer Key &amp; Brief Explanations ({effectiveExam.questions.length} Questions)
                    </h2>
                    <p className="text-xs text-slate-600">{effectiveExam.title}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-600 tabular-nums">
                    Created: {createdDateLabel}
                  </div>
                </div>

                {/* Compact Quick Answer Grid */}
                <div className="grid grid-cols-5 gap-2 p-3 border border-slate-300 rounded bg-slate-50 text-xs font-mono">
                  {effectiveExam.questions.map((q, idx) => (
                    <div key={`key-grid-${q.id}`}>
                      <strong>{String(idx + 1).padStart(2, '0')}:</strong> {q.correctAnswer}
                    </div>
                  ))}
                </div>

                {effectiveExam.includeExplanations && (
                  <div className="space-y-3 pt-2">
                    {effectiveExam.questions.map((q, idx) => {
                      const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
                      return (
                        <div
                          key={`key-detail-${q.id}`}
                          className="print-question-card pb-2.5 border-b border-slate-200 text-[9.5pt]"
                        >
                          <div className="font-bold text-slate-950">
                            Q{idx + 1}. Answer: {q.correctAnswer}) {correctOpt?.text}{' '}
                            <span className="font-normal text-slate-600">
                              (Module {q.moduleId} · {q.difficulty})
                            </span>
                          </div>
                          <div className="text-slate-800 mt-1">
                            <strong>Why:</strong> {q.whyCorrect}
                          </div>
                          <div className="text-sky-900 italic mt-0.5">
                            <strong>Exam Tip:</strong> {q.examTip}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {effectiveExam.groundingSources.length > 0 && (
                  <div className="pt-3 border-t border-slate-300 text-xs text-slate-700">
                    <strong>Google Search Grounding References:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                      {effectiveExam.groundingSources.map((src, i) => (
                        <li key={`${src.uri}-${i}`}>
                          {src.title} — {src.uri}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
