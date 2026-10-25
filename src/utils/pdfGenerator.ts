import { jsPDF } from 'jspdf';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { FAQ_HELP_DATASET } from '../data/faqHelpData';

// Color definitions matching the Studio's African Heritage + Modern Tech palette
const COLOR_AZURE = [0, 120, 212] as const; // #0078D4
const COLOR_NAVY = [0, 62, 115] as const; // #003E73
const COLOR_TERRACOTTA = [194, 65, 12] as const; // #C2410C
const COLOR_OCHRE = [217, 119, 6] as const; // #D97706
const COLOR_EMERALD = [16, 185, 129] as const; // #10B981
const COLOR_DARK_SLATE = [15, 23, 42] as const; // #0F172A
const COLOR_MUTED = [100, 116, 139] as const; // #64748B
const COLOR_LIGHT_BG = [248, 250, 252] as const; // #F8FAFC
const COLOR_BORDER = [226, 232, 240] as const; // #E2E8F0

/**
 * Draws the African Heritage decorative Kitenge ribbon motif at the top or bottom of a page
 */
function drawKitengeRibbon(doc: jsPDF, y: number, height = 3) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const segmentWidth = pageWidth / 5;

  doc.setFillColor(...COLOR_AZURE);
  doc.rect(0, y, segmentWidth, height, 'F');

  doc.setFillColor(...COLOR_TERRACOTTA);
  doc.rect(segmentWidth, y, segmentWidth, height, 'F');

  doc.setFillColor(...COLOR_OCHRE);
  doc.rect(segmentWidth * 2, y, segmentWidth, height, 'F');

  doc.setFillColor(...COLOR_EMERALD);
  doc.rect(segmentWidth * 3, y, segmentWidth, height, 'F');

  doc.setFillColor(...COLOR_NAVY);
  doc.rect(segmentWidth * 4, y, segmentWidth, height, 'F');
}

/**
 * 1. Client-Side PDF Generation: Domain Confidence Report & Learning Path Progress Map
 */
export function generateDomainConfidencePdf(stats: UserStats): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const today = new Date().toISOString().split('T')[0];

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;
  const scaledScore = Math.round((overallAccuracy / 100) * 1000);
  const isExamReady = scaledScore >= 700;

  // Ribbon Motif
  drawKitengeRibbon(doc, 0, 3.5);

  // Document Header
  doc.setFillColor(...COLOR_NAVY);
  doc.rect(margin, 10, contentWidth, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Microsoft Azure Fundamentals (AZ-900)', margin + 6, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(224, 242, 254);
  doc.text(
    'Candidate Domain Confidence Report & Learning Path Progress Map',
    margin + 6,
    27
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(253, 230, 138); // Yellow ochre
  doc.text(`Generated: ${today} • Streak: ${stats.streakDays} Days`, margin + 6, 33);

  // Metrics Grid Cards (4 cards)
  let currentY = 41;
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

type RGB = readonly [number, number, number];

  const cardsData: Array<{
    label: string;
    value: string;
    sub: string;
    color: RGB;
  }> = [
    {
      label: 'ESTIMATED SCORE',
      value: `${scaledScore} / 1000`,
      sub: isExamReady ? 'Passing Ready' : 'Pass mark: 700',
      color: isExamReady ? COLOR_EMERALD : COLOR_AZURE,
    },
    {
      label: 'OVERALL ACCURACY',
      value: `${overallAccuracy}%`,
      sub: `${stats.totalCorrect}/${stats.totalAnswered} correct`,
      color: COLOR_AZURE,
    },
    {
      label: 'SOLVED QUESTIONS',
      value: `${stats.totalAnswered}`,
      sub: `${stats.bookmarks.length} bookmarked`,
      color: COLOR_OCHRE,
    },
    {
      label: 'READINESS STATUS',
      value: isExamReady ? 'EXAM READY' : 'IN PROGRESS',
      sub: isExamReady ? 'Benchmark Met' : 'Target: 700 pts',
      color: isExamReady ? COLOR_EMERALD : COLOR_TERRACOTTA,
    },
  ];

  cardsData.forEach((card, index) => {
    const cardX = margin + index * (cardWidth + 3);
    doc.setFillColor(...COLOR_LIGHT_BG);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(card.label, cardX + 3.5, currentY + 5.5);

    doc.setFontSize(11);
    doc.setTextColor(...card.color);
    doc.text(card.value, cardX + 3.5, currentY + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(card.sub, cardX + 3.5, currentY + 18);
  });

  // Section 1: Official Domain Confidence Breakdown Table
  currentY += cardHeight + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('1. Official AZ-900 Domain Confidence Breakdown', margin, currentY);

  currentY += 4;
  // Table Header
  doc.setFillColor(...COLOR_AZURE);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Learning Path Domain', margin + 3, currentY + 4.8);
  doc.text('Exam Weight', margin + 92, currentY + 4.8);
  doc.text('Questions Solved', margin + 125, currentY + 4.8);
  doc.text('Domain Accuracy', margin + 158, currentY + 4.8);

  currentY += 7;

  LEARNING_PATHS.forEach((path, idx) => {
    const mastery = stats.pathMastery[path.id] || { correct: 0, total: 0 };
    const pct =
      mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;
    const isEven = idx % 2 === 0;

    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(margin, currentY, contentWidth, 8.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(`P${path.id}: ${path.title}`, margin + 3, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(path.examWeight, margin + 92, currentY + 5.5);

    doc.text(`${mastery.correct} / ${mastery.total}`, margin + 125, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    if (pct >= 80) doc.setTextColor(...COLOR_EMERALD);
    else if (pct >= 65) doc.setTextColor(...COLOR_AZURE);
    else if (pct >= 50) doc.setTextColor(...COLOR_OCHRE);
    else doc.setTextColor(...COLOR_TERRACOTTA);

    doc.text(`${pct}% (${pct >= 70 ? 'Pass Level' : 'Focus Required'})`, margin + 158, currentY + 5.5);

    currentY += 8.5;
  });

  // Section 2: Learning Path Progress Map (12 Curriculum Modules with Progress Bars)
  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('2. Learning Path Progress Map (12 Modules)', margin, currentY);

  currentY += 4;
  // Module Table Header
  doc.setFillColor(...COLOR_NAVY);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Module Title', margin + 3, currentY + 4.8);
  doc.text('Path', margin + 85, currentY + 4.8);
  doc.text('Solved', margin + 102, currentY + 4.8);
  doc.text('Accuracy Progress', margin + 122, currentY + 4.8);
  doc.text('Status', margin + 165, currentY + 4.8);

  currentY += 7;

  const allModules = LEARNING_PATHS.flatMap((p) => p.modules);

  allModules.forEach((mod, idx) => {
    const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
    const pct = modStat.total > 0 ? Math.round((modStat.correct / modStat.total) * 100) : 0;
    const isCompleted = (stats.completedModules || []).includes(mod.id);
    const isEven = idx % 2 === 0;

    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(margin, currentY, contentWidth, 7.8, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK_SLATE);
    const shortTitle = `M${mod.id}: ${mod.title}`.substring(0, 44);
    doc.text(shortTitle, margin + 3, currentY + 5);

    // Path
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`P${mod.pathId}`, margin + 85, currentY + 5);

    // Solved
    doc.text(`${modStat.correct}/${modStat.total}`, margin + 102, currentY + 5);

    // Graphical Progress Bar
    const barWidth = 36;
    const barHeight = 3.5;
    const barX = margin + 122;
    const barY = currentY + 2.2;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

    const fillW = Math.max(1, (pct / 100) * barWidth);
    if (pct >= 85) doc.setFillColor(...COLOR_EMERALD);
    else if (pct >= 70) doc.setFillColor(...COLOR_AZURE);
    else if (pct >= 50) doc.setFillColor(...COLOR_OCHRE);
    else doc.setFillColor(...COLOR_TERRACOTTA);

    doc.roundedRect(barX, barY, fillW, barHeight, 1, 1, 'F');

    // Status Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (isCompleted) {
      doc.setTextColor(...COLOR_EMERALD);
      doc.text('✓ Complete', margin + 165, currentY + 5);
    } else if (pct >= 85) {
      doc.setTextColor(...COLOR_EMERALD);
      doc.text('Mastery', margin + 165, currentY + 5);
    } else if (pct >= 70) {
      doc.setTextColor(...COLOR_AZURE);
      doc.text('Solid', margin + 165, currentY + 5);
    } else if (pct >= 50) {
      doc.setTextColor(...COLOR_OCHRE);
      doc.text('Developing', margin + 165, currentY + 5);
    } else if (modStat.total === 0) {
      doc.setTextColor(...COLOR_MUTED);
      doc.text('Unattempted', margin + 165, currentY + 5);
    } else {
      doc.setTextColor(...COLOR_TERRACOTTA);
      doc.text('Needs Drill', margin + 165, currentY + 5);
    }

    currentY += 7.8;
  });

  // Footer / Signature Callout
  currentY += 4;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('Official Examination Readiness Verdict:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  const verdictText = isExamReady
    ? 'Congratulations! Your estimated scaled score exceeds the 700-point passing mark. Review any remaining blind spots and schedule your AZ-900 exam with Pearson VUE.'
    : 'Your preparation is actively progressing. We recommend targeting your lowest scoring modules above with 5-minute Quick-Retries and completing at least 2 full Mock Exams to reach 750+ scaled points.';
  doc.text(verdictText, margin + 4, currentY + 11, { maxWidth: contentWidth - 8 });

  // Bottom Kitenge Ribbon
  drawKitengeRibbon(doc, pageHeight - 3.5, 3.5);

  // Trigger instant local file download
  doc.save(`Azure_AZ900_Domain_Confidence_Report_${today}.pdf`);
}

/**
 * 2. Client-Side PDF Generation: Azure Fundamentals Practice Studio User Manual
 */
export function generateUserManualPdf(): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const today = new Date().toISOString().split('T')[0];

  // Helper for adding headers with Kitenge Ribbon on new pages
  const addPageHeader = (pageTitle: string) => {
    drawKitengeRibbon(doc, 0, 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_NAVY);
    doc.text('Azure Fundamentals (AZ-900) Practice Studio — Candidate Manual', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(pageTitle, pageWidth - margin, 10, { align: 'right' });

    doc.setDrawColor(...COLOR_BORDER);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  const addPageFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text('Harambee African Heritage Edition • Aligned with Microsoft Learn', margin, pageHeight - 8);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    drawKitengeRibbon(doc, pageHeight - 3, 3);
  };

  // -------------------------------------------------------------
  // PAGE 1: COVER PAGE
  // -------------------------------------------------------------
  drawKitengeRibbon(doc, 0, 5);

  // Decorative Maasai Banner
  doc.setFillColor(...COLOR_NAVY);
  doc.rect(margin, 25, contentWidth, 75, 'F');

  doc.setFillColor(...COLOR_TERRACOTTA);
  doc.rect(margin, 98, contentWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(253, 230, 138); // Yellow ochre
  doc.text('OFFICIAL CANDIDATE HANDBOOK & USER MANUAL', margin + 8, 42);

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Microsoft Azure Fundamentals', margin + 8, 56);
  doc.text('(AZ-900) Practice Studio', margin + 8, 66);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(224, 242, 254);
  doc.text(
    'A Complete Guide to Navigation, Special Features, Adaptive Engine & Exam Readiness FAQ',
    margin + 8,
    78,
    { maxWidth: contentWidth - 16 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(253, 230, 138);
  doc.text(`Version 2.4 • Updated ${today} • Passing Standard: 700 / 1000 Pts`, margin + 8, 92);

  // Executive Overview Box
  let y = 115;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(margin, y, contentWidth, 45, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('Studio Architecture & Educational Mission', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK_SLATE);
  const missionText =
    'The Azure Fundamentals Practice Studio is an adaptive, multi-sensory candidate prep system engineered to guide students to first-attempt AZ-900 certification success. By synthesizing cognitive retrieval science (Zone of Proximal Development, Hypercorrection Effect, Metacognition) with African community perseverance ("Harambee"), the Studio offers an empowering alternative to sterile corporate study platforms.';
  doc.text(missionText, margin + 6, y + 16, { maxWidth: contentWidth - 12 });

  // Table of Contents Box
  y = 168;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLOR_AZURE);
  doc.roundedRect(margin, y, contentWidth, 75, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_AZURE);
  doc.text('Table of Contents', margin + 6, y + 9);

  const tocItems = [
    { num: '1.', title: 'Exam Blueprint & Official Weight Distribution', page: 'Page 2' },
    { num: '2.', title: 'Five-Phase Recommended Candidate Study Workflow', page: 'Page 2' },
    { num: '3.', title: 'Special Features Breakdown & Pedagogical Aims', page: 'Page 3' },
    { num: '4.', title: 'Adaptive Difficulty System & Metacognitive Calibration', page: 'Page 3' },
    { num: '5.', title: 'Frequently Asked Questions (FAQ & Help)', page: 'Page 4' },
    { num: '6.', title: 'Four-Week Certification Study Schedule & Checklist', page: 'Page 5' },
  ];

  let tocY = y + 18;
  tocItems.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(`${item.num} ${item.title}`, margin + 8, tocY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(item.page, pageWidth - margin - 8, tocY, { align: 'right' });

    doc.setDrawColor(...COLOR_BORDER);
    doc.line(margin + 8, tocY + 2, pageWidth - margin - 8, tocY + 2);

    tocY += 9;
  });

  addPageFooter(1);

  // -------------------------------------------------------------
  // PAGE 2: BLUEPRINT & 5-PHASE WORKFLOW
  // -------------------------------------------------------------
  doc.addPage();
  addPageHeader('1. Exam Blueprint & 5-Phase Candidate Workflow');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('1. Official AZ-900 Exam Blueprint', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text(
    'The AZ-900 exam tests candidate understanding of cloud services and how Microsoft Azure provides those services, agnostic of developer or admin job roles.',
    margin,
    y,
    { maxWidth: contentWidth }
  );

  y += 10;
  // Domain table
  doc.setFillColor(...COLOR_AZURE);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Learning Path Domain', margin + 3, y + 4.8);
  doc.text('Exam Weight', margin + 70, y + 4.8);
  doc.text('Core Curriculum Focus', margin + 105, y + 4.8);

  y += 7;
  const pathData = [
    {
      name: 'Path 1: Describe Cloud Concepts',
      weight: '25–30%',
      desc: 'IaaS/PaaS/SaaS, Shared Responsibility, High Availability, Elasticity, CapEx vs. OpEx.',
    },
    {
      name: 'Path 2: Azure Architecture & Services',
      weight: '35–40%',
      desc: 'Regions, Availability Zones, VMs, Containers, Storage Tiers, VNets, ExpressRoute.',
    },
    {
      name: 'Path 3: Azure Management & Governance',
      weight: '30–35%',
      desc: 'Cost Management, Azure Policy, RBAC vs. Resource Locks, Purview, Service Health.',
    },
  ];

  pathData.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(margin, y, contentWidth, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(p.name, margin + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_OCHRE);
    doc.text(p.weight, margin + 70, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(p.desc, margin + 105, y + 5, { maxWidth: 75 });

    y += 12;
  });

  // Section 2: Recommended 5-Phase Candidate Workflow
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('2. Recommended 5-Phase Candidate Workflow', margin, y);

  y += 6;
  const workflowSteps = [
    {
      step: 'Phase 1: Baseline Diagnostic (Practice & Adaptive)',
      text: 'Begin by answering 25–30 mixed questions in Practice Mode. Do not look at answers immediately. Establish your baseline accuracy across all 3 paths.',
    },
    {
      step: 'Phase 2: Systematic Domain Study (Study Mode & Key Units)',
      text: 'Switch to Study Mode. Walk through all 12 modules sequentially. Review the granular Unit-by-Unit breakdowns, core service architectures, and real-world examples.',
    },
    {
      step: 'Phase 3: Active Recall Reinforcement (Flashcards & Micro-Drills)',
      text: 'Cement terminology (ExpressRoute vs. VPN Gateway, Fault Domains vs. Update Domains) using Flashcards. Trigger 3-question Micro-Drills on modules scoring under 70%.',
    },
    {
      step: 'Phase 4: Targeted Remediation (5-Min Quick-Retry Queue)',
      text: 'Review incorrectly answered questions in the Post-Session Review. Immediately launch the 5-Minute Quick-Retry Queue to re-test mistakes while working memory is warm.',
    },
    {
      step: 'Phase 5: Full-Length Exam Readiness Simulation',
      text: 'Complete at least two full 45-minute Mock Exams under realistic timed conditions. Strive for 800+ scaled points before scheduling your test with Pearson VUE.',
    },
  ];

  workflowSteps.forEach((wf) => {
    doc.setFillColor(...COLOR_LIGHT_BG);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(wf.step, margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(wf.text, margin + 4, y + 9, { maxWidth: contentWidth - 8 });

    y += 16.5;
  });

  addPageFooter(2);

  // -------------------------------------------------------------
  // PAGE 3: SPECIAL FEATURES BREAKDOWN & AIMS
  // -------------------------------------------------------------
  doc.addPage();
  addPageHeader('3. Special Features Breakdown & Pedagogical Aims');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('3. Special Features Breakdown & Pedagogical Aims', margin, y);

  y += 5;
  const featuresList = [
    {
      title: 'Adaptive Difficulty Mechanism (Rolling Performance)',
      aim: 'Pedagogical Aim: Zone of Proximal Development (ZPD)',
      desc: 'Monitors recent session outcomes (rolling window of 8–12 questions). Starts at Medium (Intermediate); promotes to Advanced scenario questions when accuracy exceeds 75%, and drops to Fundamental definitions below 50%. Eliminates boredom and prevents cognitive fatigue.',
    },
    {
      title: '1–5 Confidence Scoring & Metacognitive Matrix',
      aim: 'Pedagogical Aim: Metacognitive Calibration',
      desc: 'Prompts users to rate certainty (1: Guessing to 5: Mastered) after answering. Exposes "Lucky Guesses" (correct + low confidence) and dangerous "Blind Spots" (incorrect + high confidence), preventing the illusion of competence before the official exam.',
    },
    {
      title: 'Grounded AI Knowledge Assistant',
      aim: 'Pedagogical Aim: Hallucination-Free Deep Learning',
      desc: 'Cross-references user queries with official Microsoft Azure architecture documentation and the AZ-900 syllabus. Features 1-click "Ask Tutor" to import the exact scenario context from the current question into the assistant tab.',
    },
    {
      title: 'Full-Length 45-Minute Mock Exam Simulator',
      aim: 'Pedagogical Aim: State-Dependent Retrieval & Time Management',
      desc: 'Simulates official test conditions with domain-weighted question balances (28% Path 1, 40% Path 2, 32% Path 3), a live 45-minute countdown, 700/1000 scaled score passing benchmark, and domain-by-domain diagnostic review.',
    },
    {
      title: 'Concept Summary & ELI5 ("Explain Like I’m 5") Analogies',
      aim: 'Pedagogical Aim: Anchoring on First Principles',
      desc: 'Replaces dense distractor explanations with a 1-sentence foundational governing principle. ELI5 translates cloud abstractions into memorable real-world metaphors (e.g. Availability Zones compared to separate municipal power substations).',
    },
    {
      title: '5-Minute Temporary Quick-Retry Queue',
      aim: 'Pedagogical Aim: Capitalizing on the Hypercorrection Effect',
      desc: 'Allows users to immediately capture all missed review questions into a temporary 5-minute queue in the practice view. Retesting errors while memory is fresh ensures the correct neural pathway is formed.',
    },
    {
      title: 'Focus Session Pomodoro Timer with Cross-Tab Sync',
      aim: 'Pedagogical Aim: Deliberate Deep Work Habit Formation',
      desc: 'Tracks cumulative daily study seconds across multiple browser tabs via localStorage. Alerts users after 25 minutes of continuous quizzing with gentle chimes and mindful anti-fatigue breathing cycles.',
    },
  ];

  featuresList.forEach((feat) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(margin, y, contentWidth, 23.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(feat.title, margin + 4, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_EMERALD);
    doc.text(feat.aim, margin + 4, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(feat.desc, margin + 4, y + 13.5, { maxWidth: contentWidth - 8 });

    y += 26;
  });

  addPageFooter(3);

  // -------------------------------------------------------------
  // PAGE 4: FREQUENTLY ASKED QUESTIONS (FAQ & HELP)
  // -------------------------------------------------------------
  doc.addPage();
  addPageHeader('4. Frequently Asked Questions (FAQ & Help)');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('4. Frequently Asked Questions (FAQ & Help)', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    'Categorized answers to common questions about navigation, scoring, and advanced features:',
    margin,
    y
  );

  y += 6;
  // Selected key FAQ items for the PDF manual
  const selectedFaqs = FAQ_HELP_DATASET.slice(0, 7);

  selectedFaqs.forEach((faq) => {
    doc.setFillColor(...COLOR_LIGHT_BG);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_AZURE);
    doc.text(`[${faq.category.toUpperCase()}]`, margin + 3.5, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(faq.question, margin + 3.5, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(faq.richAnswer.intro, margin + 3.5, y + 13.5, {
      maxWidth: contentWidth - 7,
    });

    if (faq.richAnswer.keyPoints && faq.richAnswer.keyPoints.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(`• ${faq.richAnswer.keyPoints[0]}`, margin + 3.5, y + 18, {
        maxWidth: contentWidth - 7,
      });
    }

    y += 26.5;
  });

  addPageFooter(4);

  // -------------------------------------------------------------
  // PAGE 5: 4-WEEK STUDY SCHEDULE & EXAM CHECKLIST
  // -------------------------------------------------------------
  doc.addPage();
  addPageHeader('5. Four-Week Study Plan & Candidate Checklist');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('5. Recommended 4-Week Study Plan to Pass AZ-900', margin, y);

  y += 6;
  const scheduleWeeks = [
    {
      week: 'Week 1: Path 1 Mastery (Cloud Concepts 25–30%)',
      tasks:
        'Complete Modules 1–3 in Study Mode (Shared Responsibility, IaaS vs. PaaS vs. SaaS, CapEx vs. OpEx). Solve 40+ practice questions. Target: ≥80% Path 1 accuracy.',
    },
    {
      week: 'Week 2: Path 2 Core Services (Architecture 35–40%)',
      tasks:
        'Complete Modules 4–7 (Regions, Availability Zones, VMs, Containers, Storage Tiers, VNets). Use ELI5 toggle for Fault Domains and Update Domains. Target: ≥75% Path 2 accuracy.',
    },
    {
      week: 'Week 3: Path 3 Governance & Security (30–35%)',
      tasks:
        'Complete Modules 8–12 (Azure Policy, RBAC, Resource Locks, Cost Management, Microsoft Defender). Critical Trap: Resource Locks override Owner RBAC permissions! Target: ≥80% Path 3 accuracy.',
    },
    {
      week: 'Week 4: Mock Exam Simulations & Final Calibration',
      tasks:
        'Complete two 45-minute timed Mock Exams. Drill missed items using the 5-Minute Quick-Retry Queue. Check Domain Confidence Matrix to eliminate all blind spots. Target: ≥800 / 1000 scaled points.',
    },
  ];

  scheduleWeeks.forEach((sw) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_TERRACOTTA);
    doc.text(sw.week, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(sw.tasks, margin + 4, y + 10, { maxWidth: contentWidth - 8 });

    y += 21;
  });

  // Candidate Final Verification Checklist
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_DARK_SLATE);
  doc.text('Candidate Pre-Exam Readiness Checklist', margin, y);

  y += 5;
  const checklistItems = [
    'I have completed all 12 curriculum modules in Study Mode.',
    'My estimated scaled score in the Studio is at or above 750 points.',
    'I have resolved all items in the Mistakes Review queue.',
    'I can explain the difference between Azure Policy and RBAC in 30 seconds.',
    'I understand that ExpressRoute does NOT use the public internet.',
    'I scored 800+ on at least one full-length 45-minute Mock Exam.',
  ];

  checklistItems.forEach((ci) => {
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(margin + 2, y + 0.5, 3.5, 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK_SLATE);
    doc.text(ci, margin + 8, y + 3.5);

    y += 6.5;
  });

  // Sign-off note
  y += 4;
  doc.setFillColor(...COLOR_NAVY);
  doc.rect(margin, y, contentWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 230, 138);
  doc.text('Harambee! "Haba na haba hujaza kibaba" — Little by little fills the measure.', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(224, 242, 254);
  doc.text('You have the tools, the knowledge, and the confidence to succeed. Best of luck on your AZ-900 exam!', margin + 4, y + 10.5);

  addPageFooter(5);

  doc.save('Azure_Fundamentals_AZ900_Studio_User_Manual.pdf');
}
