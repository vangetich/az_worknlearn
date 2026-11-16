import { jsPDF } from 'jspdf';
import { PRINTABLE_EXAM_TRACKS, type PrintableMockExam } from '../types/printableExam';

const COLOR_AZURE = [0, 120, 212] as const; // #0078D4
const COLOR_NAVY = [15, 23, 42] as const; // #0F172A
const COLOR_TERRACOTTA = [194, 65, 12] as const;
const COLOR_OCHRE = [217, 119, 6] as const;
const COLOR_EMERALD = [5, 150, 105] as const;
const COLOR_MUTED = [100, 116, 139] as const;
const COLOR_BORDER = [203, 213, 225] as const;
const COLOR_SURFACE = [248, 250, 252] as const;

function drawRibbon(doc: jsPDF, y: number, height = 2.5) {
  const w = doc.internal.pageSize.getWidth();
  const seg = w / 5;
  doc.setFillColor(...COLOR_AZURE);
  doc.rect(0, y, seg, height, 'F');
  doc.setFillColor(...COLOR_TERRACOTTA);
  doc.rect(seg, y, seg, height, 'F');
  doc.setFillColor(...COLOR_OCHRE);
  doc.rect(seg * 2, y, seg, height, 'F');
  doc.setFillColor(...COLOR_EMERALD);
  doc.rect(seg * 3, y, seg, height, 'F');
  doc.setFillColor(...COLOR_NAVY);
  doc.rect(seg * 4, y, seg, height, 'F');
}

export function generatePrintableMockExamPdf(exam: PrintableMockExam): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const today = new Date(exam.createdAt || Date.now()).toISOString().split('T')[0];

  const trackMeta =
    PRINTABLE_EXAM_TRACKS.find((t) => t.id === exam.track) || PRINTABLE_EXAM_TRACKS[0];

  const addPageChrome = (headerRight: string) => {
    drawRibbon(doc, 0, 2.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(`AZ-900 Self-Paced Printable Mock Exam · ${exam.title}`, margin, 9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(headerRight, pageWidth - margin, 9, { align: 'right' });
    doc.setDrawColor(...COLOR_BORDER);
    doc.line(margin, 11.5, pageWidth - margin, 11.5);
  };

  // =========================================================================
  // PAGE 1: COVER SHEET, SELF-PACED CHECKLIST & OPTIONAL ANSWER BUBBLE GRID
  // =========================================================================
  drawRibbon(doc, 0, 4);

  doc.setFillColor(...COLOR_NAVY);
  doc.roundedRect(margin, 11, contentWidth, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(253, 230, 138);
  doc.text('AZ-900 SMART QUIZ BUILDER  ·  OFFICIAL STUDY MATERIAL', margin + 6, 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 242, 254);
  doc.text(`Created: ${today}`, pageWidth - margin - 6, 18.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(exam.title, contentWidth - 12);
  doc.text(titleLines.slice(0, 2), margin + 6, 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254);
  doc.text(
    `Strategy: ${trackMeta.label} · ${exam.questions.length} Unique Questions · Answer Key: ${
      exam.includeAnswerKey ? 'Included' : 'Test-Only Mode'
    }`,
    margin + 6,
    41.5
  );

  // Candidate Self-Paced Log & Signature Box
  let y = 52;
  doc.setFillColor(...COLOR_SURFACE);
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(margin, y, contentWidth, 31, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('Candidate Self-Paced Study Log & Sign-Off', margin + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Student Name: _________________________________', margin + 5, y + 13.5);
  doc.text('Date Taken: ____________________', margin + 102, y + 13.5);
  doc.text('Student Signature: _____________________________', margin + 5, y + 20.5);
  doc.text(`Score: ______ / ${exam.questions.length}   (Pass >= 70%)`, margin + 102, y + 20.5);
  doc.text('Start Time: ____________   Finish Time: ____________', margin + 5, y + 27);

  // Composition Breakdown
  y = 88;
  const p1Count = exam.questions.filter((q) => q.learningPathId === 1).length;
  const p2Count = exam.questions.filter((q) => q.learningPathId === 2).length;
  const p3Count = exam.questions.filter((q) => q.learningPathId === 3).length;
  const fundCount = exam.questions.filter((q) => q.difficulty === 'Fundamental').length;
  const intCount = exam.questions.filter((q) => q.difficulty === 'Intermediate').length;
  const advCount = exam.questions.filter((q) => q.difficulty === 'Advanced').length;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_AZURE);
  doc.text('Exam Packet Blueprint & Distribution', margin + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_NAVY);
  doc.text(
    `Domains: Path 1 (Cloud Concepts): ${p1Count} Qs  ·  Path 2 (Architecture & Services): ${p2Count} Qs  ·  Path 3 (Governance): ${p3Count} Qs`,
    margin + 5,
    y + 13
  );
  doc.text(
    `Difficulty Mix: Fundamental ${fundCount} · Intermediate ${intCount} · Advanced ${advCount}  ·  Google-Grounded Additions: ${exam.sourcedViaGoogleCount}`,
    margin + 5,
    y + 19.5
  );

  y = 117;

  // Optional Self-Test Answer Bubble Grid on Cover Page
  if (exam.includeBubbleSheet) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_NAVY);
    doc.text('Tear-Off / Cover Answer Sheet (Circle Your Choice Before Checking Key)', margin, y);
    y += 5;

    const cols = 3;
    const rowsPerCol = Math.ceil(exam.questions.length / cols);
    const colWidth = (contentWidth - 8) / cols;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    for (let i = 0; i < exam.questions.length; i++) {
      const colIdx = Math.floor(i / rowsPerCol);
      const rowIdx = i % rowsPerCol;
      const cellX = margin + colIdx * (colWidth + 4);
      const cellY = y + rowIdx * 6.5;

      doc.setTextColor(...COLOR_NAVY);
      const numLabel = String(i + 1).padStart(2, '0');
      doc.text(`${numLabel}.`, cellX, cellY + 3.5);

      ['A', 'B', 'C', 'D'].forEach((ltr, optIdx) => {
        const cx = cellX + 12 + optIdx * 9.5;
        doc.setDrawColor(...COLOR_MUTED);
        doc.circle(cx, cellY + 2.3, 2.3, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(ltr, cx - 1.1, cellY + 3.1);
      });
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
    }
    y += rowsPerCol * 6.5 + 8;
  }

  if (exam.notes && exam.notes.trim()) {
    doc.setFillColor(...COLOR_SURFACE);
    doc.setDrawColor(...COLOR_BORDER);
    const noteLines = doc.splitTextToSize(`Study Notes: ${exam.notes.trim()}`, contentWidth - 10);
    const noteH = Math.max(14, noteLines.length * 4.5 + 6);
    if (y + noteH < pageHeight - 20) {
      doc.roundedRect(margin, y, contentWidth, noteH, 2, 2, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_NAVY);
      doc.text(noteLines, margin + 5, y + 6);
    }
  }

  // =========================================================================
  // SECTION I: QUESTIONS BOOKLET (Starts cleanly on Page 2)
  // =========================================================================
  doc.addPage();
  addPageChrome('Questions Booklet');
  y = 18;

  let currentDifficultyBanner = '';

  exam.questions.forEach((q, idx) => {
    const qNum = idx + 1;

    // Optional tier divider in Progressive mode
    if (exam.track === 'progressive' && q.difficulty !== currentDifficultyBanner) {
      currentDifficultyBanner = q.difficulty;
      const bannerTitle =
        q.difficulty === 'Fundamental'
          ? 'PART I — FUNDAMENTAL CONCEPTS WARM-UP'
          : q.difficulty === 'Intermediate'
          ? 'PART II — INTERMEDIATE ARCHITECTURE & SCENARIOS'
          : 'PART III — ADVANCED MULTI-CONSTRAINT MASTERY';
      if (y + 18 > pageHeight - 20) {
        doc.addPage();
        addPageChrome('Questions Booklet');
        y = 18;
      }
      doc.setFillColor(...COLOR_NAVY);
      doc.roundedRect(margin, y, contentWidth, 8.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(253, 230, 138);
      doc.text(bannerTitle, margin + 4, y + 5.7);
      y += 12;
    }

    // Measure height of question block to avoid mid-question page splits
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const scenarioLines = q.scenario
      ? doc.splitTextToSize(q.scenario.trim(), contentWidth - 6)
      : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const questionLines = doc.splitTextToSize(`${qNum}. ${q.question.trim()}`, contentWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const optionLinesList = q.options.map((opt) =>
      doc.splitTextToSize(`${opt.letter})  ${opt.text}`, contentWidth - 10)
    );
    const optionsHeight = optionLinesList.reduce((sum, lines) => sum + lines.length * 4.5 + 1.5, 0);

    const metaHeight = exam.showMetadataHints ? 5 : 0;
    const scenarioHeight = scenarioLines.length > 0 ? scenarioLines.length * 4.2 + 4 : 0;
    const totalBlockHeight =
      metaHeight + scenarioHeight + questionLines.length * 4.7 + 3 + optionsHeight + 7;

    if (y + totalBlockHeight > pageHeight - 16) {
      doc.addPage();
      addPageChrome('Questions Booklet');
      y = 18;
    }

    // Optional metadata line
    if (exam.showMetadataHints) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_AZURE);
      const sourceLabel = q.sourcedViaGoogle ? ' · Google Grounded' : '';
      doc.text(
        `Path ${q.learningPathId} · Mod ${q.moduleId}: ${q.moduleTitle} · ${q.difficulty}${sourceLabel}`,
        margin,
        y
      );
      y += 4.5;
    }

    // Scenario context
    if (scenarioLines.length > 0) {
      const boxH = scenarioLines.length * 4.2 + 3.5;
      doc.setFillColor(...COLOR_SURFACE);
      doc.setDrawColor(...COLOR_BORDER);
      doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(scenarioLines, margin + 3, y + 4.5);
      y += boxH + 3;
    }

    // Question stem
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(questionLines, margin, y);
    y += questionLines.length * 4.7 + 2;

    // Options A-D with empty bubble circle
    q.options.forEach((opt, optIdx) => {
      const optLines = optionLinesList[optIdx];
      doc.setDrawColor(...COLOR_MUTED);
      doc.circle(margin + 3.2, y - 1.1, 1.8, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(optLines, margin + 8, y);
      y += optLines.length * 4.5 + 1.5;
    });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 6;
  });

  // =========================================================================
  // SECTION II: DETACHED ANSWER KEY & RATIONALES (Optional, starts on new page)
  // =========================================================================
  if (exam.includeAnswerKey) {
    doc.addPage();
    addPageChrome('Detached Answer Key');
    y = 18;

    doc.setFillColor(...COLOR_EMERALD);
    doc.roundedRect(margin, y, contentWidth, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Detached Answer Key & Study Explanations (${exam.questions.length} Questions)`, margin + 5, y + 7.2);
    y += 16;

    // Compact quick-grade grid (5 columns)
    const gridCols = 5;
    const gridColW = contentWidth / gridCols;
    const gridRows = Math.ceil(exam.questions.length / gridCols);

    doc.setFillColor(...COLOR_SURFACE);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(margin, y, contentWidth, gridRows * 6 + 4, 1.5, 1.5, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    for (let i = 0; i < exam.questions.length; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const q = exam.questions[i];
      doc.setTextColor(...COLOR_NAVY);
      doc.text(`${String(i + 1).padStart(2, '0')}: ${q.correctAnswer}`, margin + 4 + col * gridColW, y + 5.5 + row * 6);
    }
    y += gridRows * 6 + 10;

    if (exam.includeExplanations) {
      exam.questions.forEach((q, idx) => {
        const qNum = idx + 1;
        const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const headText = `Q${qNum}. Correct Answer: ${q.correctAnswer}) ${correctOpt?.text || ''}  [Mod ${q.moduleId} · ${q.difficulty}]`;
        const headLines = doc.splitTextToSize(headText, contentWidth - 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const whyLines = doc.splitTextToSize(`Why: ${q.whyCorrect}`, contentWidth - 6);
        const tipLines = doc.splitTextToSize(`Exam Tip: ${q.examTip}`, contentWidth - 6);

        const neededH = headLines.length * 4 + whyLines.length * 3.8 + tipLines.length * 3.8 + 8;
        if (y + neededH > pageHeight - 16) {
          doc.addPage();
          addPageChrome('Answer Key & Explanations');
          y = 18;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...COLOR_EMERALD);
        doc.text(headLines, margin, y);
        y += headLines.length * 4 + 1;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(whyLines, margin + 2, y);
        y += whyLines.length * 3.8 + 1;

        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLOR_AZURE);
        doc.text(tipLines, margin + 2, y);
        y += tipLines.length * 3.8 + 4;

        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y - 1.5, pageWidth - margin, y - 1.5);
      });
    }

    if (exam.groundingSources.length > 0) {
      if (y + 30 > pageHeight - 16) {
        doc.addPage();
        addPageChrome('Google Search References');
        y = 18;
      }
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_NAVY);
      doc.text('Google Search Grounding Sources:', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);
      exam.groundingSources.slice(0, 8).forEach((src) => {
        const line = doc.splitTextToSize(`• ${src.title}: ${src.uri}`, contentWidth);
        if (y + line.length * 3.5 < pageHeight - 14) {
          doc.text(line, margin, y);
          y += line.length * 3.5 + 1;
        }
      });
    }
  }

  // Page numbers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      `AZ-900 Self-Paced Printable Study Booklet · ${exam.questions.length} Unique Questions`,
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    drawRibbon(doc, pageHeight - 2.5, 2.5);
  }

  const slug = exam.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  doc.save(`${slug || 'az900-printable-mock-exam'}-${exam.questions.length}q.pdf`);
}
