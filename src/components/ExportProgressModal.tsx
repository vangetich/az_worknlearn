import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  FileCode,
  Printer,
  CheckCircle2,
  X,
  Award,
  Sparkles,
  BookOpen,
  Bookmark,
  StickyNote,
  Anchor,
  Eye,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { calculateDomainConfidence, getAllQuestionNotes } from '../utils/storage';
import { KitengeRibbon } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import {
  generateDomainConfidencePdf,
  generateUserManualPdf,
  generateComprehensiveStudyReportPdf,
} from '../utils/pdfGenerator';
import {
  downloadNotesAndMemoryAnchorsMarkdown,
  getSavedMemoryAnchors,
} from '../utils/exportNotesMarkdown';
import { BUILTIN_QUESTIONS } from '../data/questionBank';

interface ExportProgressModalProps {
  stats: UserStats;
  questions?: Question[];
  onClose: () => void;
  onOpenUserGuide?: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  stats,
  questions,
  onClose,
  onOpenUserGuide,
}) => {
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'options' | 'printable-report'>('options');

  const pool = useMemo(
    () => (questions && questions.length > 0 ? questions : BUILTIN_QUESTIONS),
    [questions]
  );

  const notesMap = useMemo(() => getAllQuestionNotes(), []);
  const savedAnchors = useMemo(() => getSavedMemoryAnchors(), []);
  const questionById = useMemo(
    () => new Map<string, Question>(pool.map((q) => [q.id, q])),
    [pool]
  );

  const notedEntries = useMemo(() => {
    return Object.entries(notesMap)
      .filter(([, text]) => Boolean(text && text.trim()))
      .map(([id, text]) => ({
        questionId: id,
        noteText: text.trim(),
        question: questionById.get(id),
      }));
  }, [notesMap, questionById]);

  const bookmarkedQuestions = useMemo(() => {
    return (stats.bookmarks || [])
      .map((id) => questionById.get(id))
      .filter((q): q is Question => Boolean(q));
  }, [stats.bookmarks, questionById]);

  const moduleConfidenceRows = useMemo(() => {
    const confidenceMap = stats.confidenceScores || {};
    return LEARNING_PATHS.flatMap((p) => p.modules).map((mod) => {
      const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
      const accuracyPct =
        modStat.total > 0 ? Math.round((modStat.correct / modStat.total) * 100) : 0;
      const modQuestions = pool.filter((q) => q.moduleId === mod.id);
      const ratedInMod = modQuestions
        .map((q) => confidenceMap[q.id])
        .filter((v): v is 1 | 2 | 3 => typeof v === 'number');
      const selfRatedPct =
        ratedInMod.length > 0
          ? Math.round(
              (ratedInMod.reduce((acc, v) => acc + v, 0) / (ratedInMod.length * 3)) * 100
            )
          : accuracyPct;
      const confidenceScore =
        modStat.total > 0 ? Math.round(accuracyPct * 0.7 + selfRatedPct * 0.3) : 0;

      return {
        moduleId: mod.id,
        title: mod.title,
        pathId: mod.pathId,
        correct: modStat.correct,
        total: modStat.total,
        accuracyPct,
        confidenceScore,
      };
    });
  }, [stats.moduleMastery, stats.confidenceScores, pool]);

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const scaledScore = Math.round((overallAccuracy / 100) * 1000);
  const isPassReady = scaledScore >= 700;
  const today = new Date().toISOString().split('T')[0];

  // 0. NEW: Export Comprehensive Study Report (Saved Notes + Bookmarks + Module Confidence Scores) as Printable PDF
  const handleExportStudyReportPdf = () => {
    try {
      const res = generateComprehensiveStudyReportPdf(stats, pool);
      setCopiedNotification(
        `Exported Study Report PDF (${res.notesCount} Notes, ${res.bookmarksCount} Bookmarks & 12 Module Confidence Scores)!`
      );
      setTimeout(() => setCopiedNotification(null), 4000);
    } catch (e) {
      console.error(e);
      setActiveTab('printable-report');
      setTimeout(() => window.print(), 250);
    }
  };

  // 1. Export as JSON
  const handleExportJSON = () => {
    const reportData = {
      reportTitle: 'Microsoft AZ-900 Study Progress & Domain Confidence Report',
      generatedDate: new Date().toISOString(),
      applet: 'AZ-900 Smart Quiz Builder & Knowledge Assistant',
      summary: {
        totalQuestionsAnswered: stats.totalAnswered,
        totalCorrectAnswers: stats.totalCorrect,
        overallAccuracyPercentage: overallAccuracy,
        estimatedExamScore: scaledScore,
        passingThreshold: 700,
        isExamReady: isPassReady,
        currentStreakDays: stats.streakDays,
        bookmarkedQuestionsCount: stats.bookmarks.length,
        savedNotesCount: notedEntries.length,
        customMemoryAnchorsCount: savedAnchors.length,
      },
      learningPathMastery: LEARNING_PATHS.map((path) => {
        const mastery = stats.pathMastery[path.id] || { correct: 0, total: 0 };
        const conf = calculateDomainConfidence(mastery.correct, mastery.total);
        return {
          pathId: path.id,
          title: path.title,
          examWeight: path.examWeight,
          correct: mastery.correct,
          total: mastery.total,
          accuracyPercentage: conf.percentage,
          rating: conf.rating,
        };
      }),
      moduleConfidenceDetails: moduleConfidenceRows,
      savedNotes: notedEntries.map((n) => ({
        questionId: n.questionId,
        moduleTitle: n.question?.moduleTitle,
        noteText: n.noteText,
      })),
      bookmarkedQuestions: bookmarkedQuestions.map((q) => ({
        id: q.id,
        moduleId: q.moduleId,
        moduleTitle: q.moduleTitle,
        question: q.question,
        correctAnswer: q.correctAnswer,
        examTip: q.examTip,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `az900-study-report-${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedNotification('JSON study report downloaded successfully!');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // 2. Direct Client-Side PDF Generation via jsPDF (Domain Confidence Report & Learning Path Progress Map)
  const handleDownloadClientPdf = () => {
    try {
      generateDomainConfidencePdf(stats);
      setCopiedNotification(
        'Domain Confidence Report & Learning Path Progress Map saved as PDF!'
      );
      setTimeout(() => setCopiedNotification(null), 3500);
    } catch (e) {
      console.error(e);
      handlePrintPDF();
    }
  };

  // 3. Direct Client-Side Studio User Manual PDF Generation via jsPDF
  const handleDownloadManualPdf = () => {
    try {
      generateUserManualPdf();
      setCopiedNotification('Azure Fundamentals Practice Studio User Manual saved as PDF!');
      setTimeout(() => setCopiedNotification(null), 3500);
    } catch (e) {
      console.error(e);
      if (onOpenUserGuide) {
        onClose();
        onOpenUserGuide();
      }
    }
  };

  // 3.5 Export Saved Question Notes & Memory Anchors as Formatted Markdown (.md)
  const handleExportNotesMarkdown = () => {
    const result = downloadNotesAndMemoryAnchorsMarkdown(pool, stats);
    setCopiedNotification(
      `Exported ${result.notesCount} question notes & ${result.anchorsCount} memory anchors to ${result.filename}!`
    );
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  // 4. Print Structured Study Report directly in-frame without window.open or alert
  const handlePrintPDF = () => {
    setActiveTab('printable-report');
    setCopiedNotification('Opening system print dialog for your structured Study Report...');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <ResponsiveModalContainer
      isOpen={true}
      onClose={onClose}
      maxWidth="lg"
      closeOnBackdropClick={true}
      ariaLabel="Export Study Report & Domain Confidence"
    >
      <div className="shrink-0">
        <KitengeRibbon height={5} />
      </div>

      {/* Header */}
      <div className="shrink-0 p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-400/30">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">
              Export Study Report &amp; Offline Review
            </h3>
            <p className="text-xs text-slate-400">
              Aggregate saved notes, bookmarked questions &amp; module confidence scores into a printable PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-xs font-bold">
            <button
              type="button"
              data-testid="export-tab-options"
              onClick={() => setActiveTab('options')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'options'
                  ? 'bg-[#0078D4] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Export Formats
            </button>
            <button
              type="button"
              data-testid="export-tab-printable-preview"
              onClick={() => setActiveTab('printable-report')}
              className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'printable-report'
                  ? 'bg-amber-400 text-slate-950 font-extrabold'
                  : 'text-amber-300 hover:text-amber-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Printable Report</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
        {activeTab === 'options' ? (
          <>
            {/* Status Snapshot Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Scaled Score
                </span>
                <div className="text-sm font-mono font-black text-slate-900 tabular-nums mt-0.5">
                  {scaledScore} / 1000
                </div>
                <span
                  className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    isPassReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPassReady ? 'Exam Ready' : 'Developing'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Saved Notes
                </span>
                <div className="text-sm font-mono font-black text-[#0078D4] tabular-nums mt-0.5">
                  {notedEntries.length} Notes
                </div>
                <span className="text-[10px] text-slate-500">
                  + {savedAnchors.length} Memory Anchors
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Bookmarks
                </span>
                <div className="text-sm font-mono font-black text-amber-700 tabular-nums mt-0.5">
                  {bookmarkedQuestions.length} Saved
                </div>
                <span className="text-[10px] text-slate-500">With explanations</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Modules Tracked
                </span>
                <div className="text-sm font-mono font-black text-emerald-700 tabular-nums mt-0.5">
                  12 Modules
                </div>
                <span className="text-[10px] text-slate-500">{overallAccuracy}% Accuracy</span>
              </div>
            </div>

            {/* Export Options Grid */}
            <div className="space-y-2.5 max-h-[390px] overflow-y-auto pr-1">
              {/* FEATURED: Comprehensive 'Export Study Report' Printable PDF */}
              <div
                data-testid="export-study-report-btn"
                onClick={handleExportStudyReportPdf}
                className="p-4 rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/70 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Export Study Report (Notes + Bookmarks + Confidence .PDF)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                        Complete Report
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        Offline Review
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Aggregates all {notedEntries.length} saved notes, {bookmarkedQuestions.length} bookmarked questions, {savedAnchors.length} memory anchors, and 12 module confidence scores into a structured PDF report.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0 ml-2">
                  <Download className="w-4 h-4" />
                </div>
              </div>

              {/* Primary Option: Client-Side Vector PDF via jsPDF */}
              <div
                onClick={handleDownloadClientPdf}
                className="p-3.5 rounded-xl border-2 border-[#0078D4] bg-blue-50/40 hover:bg-blue-50 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0078D4] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors">
                        Domain Confidence &amp; Progress Map (.PDF)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white">
                        jsPDF
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Vector PDF with scaled scores, P1-P3 domain ratings, and 12-module visual progress bars
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-blue-100/60 text-[#0078D4] group-hover:bg-[#0078D4] group-hover:text-white transition-all shrink-0 ml-2">
                  <Download className="w-4 h-4" />
                </div>
              </div>

              {/* Option 1B: Export Saved Question Notes & Memory Anchors (.MD) */}
              <div
                onClick={handleExportNotesMarkdown}
                className="p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50/50 hover:bg-amber-50 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                        Saved Question Notes &amp; Memory Anchors (.MD)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-900 text-amber-300">
                        Markdown
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Formatted Markdown guide with all your saved question notes, pinned memory anchors &amp; exam traps
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-amber-100 text-amber-900 group-hover:bg-slate-900 group-hover:text-amber-300 transition-all shrink-0 ml-2">
                  <Download className="w-4 h-4" />
                </div>
              </div>

              {/* Option 2: Studio User Manual & FAQ (.PDF) */}
              <div
                onClick={handleDownloadManualPdf}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 hover:border-rose-400 hover:bg-rose-50/60 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-700 transition-colors">
                        Studio User Manual &amp; FAQ (.PDF)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white">
                        5 Pages
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Complete candidate guide, Adaptive Engine breakdown, and 13 categorized FAQs
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0 ml-2">
                  <Download className="w-4 h-4" />
                </div>
              </div>

              {/* Option 3: Browser Print Dialog */}
              <div
                onClick={handlePrintPDF}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-slate-800 transition-colors">
                      Printable Study Report View &amp; System Print
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Preview structured offline Study Report and print via system printer dialog
                    </p>
                  </div>
                </div>

                <Printer className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 ml-2" />
              </div>

              {/* Option 4: Raw JSON Export */}
              <div
                onClick={handleExportJSON}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Download Raw Data (.JSON)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Raw JSON progress backup of attempts, notes, bookmarks, and timestamps
                    </p>
                  </div>
                </div>

                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-2" />
              </div>

              {/* Interactive User Guide Modal Link */}
              {onOpenUserGuide && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenUserGuide();
                  }}
                  className="p-3 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 cursor-pointer transition-all flex items-center justify-between text-xs font-semibold text-sky-900"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Looking for instant answers? Open Interactive FAQ &amp; Guide</span>
                  </div>
                  <span className="text-[#0078D4] hover:underline">Read Now &rarr;</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* =====================================================================
             STRUCTURED PRINTABLE STUDY REPORT PREVIEW (NOTES + BOOKMARKS + CONFIDENCE)
             ===================================================================== */
          <div
            data-testid="printable-study-report-preview"
            className="space-y-5 bg-white text-slate-900 p-4 rounded-2xl border border-slate-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#0078D4]">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  AZ-900 Comprehensive Offline Study Report
                </h4>
                <p className="text-xs text-slate-500">
                  Generated {today} • Scaled Readiness: {scaledScore}/1000 ({overallAccuracy}%)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportStudyReportPdf}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {/* 1. Module Confidence Scores Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-[#0078D4]">
                1. Module Confidence Scores (Modules 1–12)
              </h5>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-2 px-3">Module</th>
                      <th className="py-2 px-2 text-center">Solved</th>
                      <th className="py-2 px-2 text-right">Accuracy</th>
                      <th className="py-2 px-3 text-right">Confidence Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {moduleConfidenceRows.map((row) => (
                      <tr key={row.moduleId}>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">
                          M{row.moduleId}: {row.title}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono tabular-nums text-slate-600">
                          {row.correct}/{row.total}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold tabular-nums text-slate-800">
                          {row.accuracyPct}%
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-black tabular-nums text-[#0078D4]">
                          {row.total > 0 ? `${row.confidenceScore}%` : 'Unattempted'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Saved Study Notes & Custom Memory Anchors */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                <span>
                  2. Saved Study Notes ({notedEntries.length}) &amp; Memory Anchors ({savedAnchors.length})
                </span>
              </h5>
              {notedEntries.length === 0 && savedAnchors.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No personal question notes or memory anchors saved yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {notedEntries.map((entry) => (
                    <div
                      key={entry.questionId}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900">
                        [{entry.questionId.toUpperCase()}]{' '}
                        {entry.question
                          ? `M${entry.question.moduleId}: ${entry.question.moduleTitle}`
                          : ''}
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{entry.noteText}</p>
                    </div>
                  ))}
                  {savedAnchors.map((anchor) => (
                    <div
                      key={anchor.id}
                      className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-200 text-xs space-y-1"
                    >
                      <div className="font-bold text-[#005A9E] flex items-center gap-1">
                        <Anchor className="w-3 h-3" />
                        <span>
                          {anchor.title} (M{anchor.moduleId}: {anchor.moduleTitle})
                        </span>
                      </div>
                      <p className="text-slate-800">{anchor.anchorText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Bookmarked Questions */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                <span>3. Bookmarked Questions ({bookmarkedQuestions.length})</span>
              </h5>
              {bookmarkedQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No bookmarked questions yet. Bookmark questions during practice to include them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {bookmarkedQuestions.map((q, idx) => {
                    const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="font-extrabold text-slate-900">
                          {idx + 1}. [{q.id.toUpperCase()}] M{q.moduleId}: {q.moduleTitle}
                        </div>
                        <p className="font-semibold text-slate-800">{q.question}</p>
                        <p className="text-emerald-700 font-bold">
                          Correct Answer ({q.correctAnswer}): {correctOpt?.text}
                        </p>
                        <p className="text-slate-600">{q.whyCorrect}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alert Notification */}
        {copiedNotification && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Close button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </ResponsiveModalContainer>
  );
};

