import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  Download,
  X,
  Sparkles,
  Zap,
  Target,
  Award,
  Clock,
  Mic,
  SlidersHorizontal,
  RotateCcw,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  Copy,
  Info,
  Lightbulb,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  FAQ_HELP_DATASET,
  FAQ_HELP_CATEGORIES,
  FaqCategoryType,
  FaqHelpItem,
} from '../data/faqHelpData';
import { generateUserManualPdf } from '../utils/pdfGenerator';

interface UserGuideModalProps {
  onClose: () => void;
  onOpenMockExam?: () => void;
  onOpenAdaptive?: () => void;
}

type GuideSection =
  | 'overview'
  | 'workflow'
  | 'features'
  | 'aims'
  | 'faq'
  | 'study-plan'
  | 'readme-history';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  onClose,
  onOpenMockExam,
  onOpenAdaptive,
}) => {
  const [activeSection, setActiveSection] = useState<GuideSection>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<
    'All' | FaqCategoryType
  >('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-gs-1');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Print/Download PDF Generator using print-optimized document
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to open the printable PDF document.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Azure Fundamentals (AZ-900) Practice Studio — Comprehensive User Guide & FAQ</title>
          <style>
            @page {
              size: A4;
              margin: 18mm 16mm 18mm 16mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              line-height: 1.55;
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-size: 11pt;
            }
            .page-break {
              page-break-before: always;
            }
            .no-break {
              page-break-inside: avoid;
            }
            .cover-page {
              padding: 40px 20px;
              text-align: center;
              border-bottom: 4px solid #0078d4;
              margin-bottom: 30px;
            }
            .brand-badge {
              display: inline-block;
              padding: 6px 14px;
              background: #ebf3fc;
              color: #0078d4;
              font-weight: 800;
              font-size: 10pt;
              border-radius: 9999px;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            h1 {
              font-size: 26pt;
              font-weight: 900;
              color: #003e73;
              margin: 0 0 10px 0;
              line-height: 1.2;
            }
            .subtitle {
              font-size: 14pt;
              color: #475569;
              max-width: 650px;
              margin: 0 auto 20px auto;
            }
            .doc-meta {
              display: flex;
              justify-content: center;
              gap: 24px;
              font-size: 9.5pt;
              color: #64748b;
              margin-top: 15px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            h2 {
              font-size: 16pt;
              color: #005a9e;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 6px;
              margin-top: 28px;
              margin-bottom: 14px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            h3 {
              font-size: 12.5pt;
              color: #1e293b;
              margin-top: 18px;
              margin-bottom: 6px;
            }
            p, li {
              color: #334155;
            }
            ul, ol {
              padding-left: 22px;
              margin-top: 6px;
              margin-bottom: 12px;
            }
            li {
              margin-bottom: 4px;
            }
            .callout {
              background: #f8fafc;
              border-left: 4px solid #0078d4;
              padding: 12px 16px;
              border-radius: 0 8px 8px 0;
              margin: 14px 0;
              font-size: 10.5pt;
            }
            .callout-warning {
              background: #fffbeb;
              border-left-color: #d97706;
            }
            .callout-success {
              background: #f0fdf4;
              border-left-color: #16a34a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 14px 0;
              font-size: 10pt;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background: #f1f5f9;
              font-weight: 700;
              color: #1e293b;
            }
            .feature-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 14px;
              background: #ffffff;
            }
            .feature-header {
              font-weight: 800;
              color: #005a9e;
              font-size: 11.5pt;
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .feature-aim {
              font-size: 9.5pt;
              font-style: italic;
              color: #047857;
              margin-bottom: 6px;
            }
            .faq-item {
              margin-bottom: 14px;
              padding-bottom: 12px;
              border-bottom: 1px dashed #cbd5e1;
            }
            .faq-q {
              font-weight: 800;
              color: #0f172a;
              font-size: 11pt;
              margin-bottom: 4px;
            }
            .faq-a {
              font-size: 10pt;
              color: #334155;
            }
            .footer-note {
              margin-top: 40px;
              text-align: center;
              font-size: 8.5pt;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <!-- COVER / HEADER -->
          <div class="cover-page">
            <span class="brand-badge">Official Candidate Handbook &amp; Guide</span>
            <h1>Microsoft Azure Fundamentals (AZ-900)</h1>
            <div class="subtitle">
              Comprehensive Studio User Guide, Special Features Breakdown, Pedagogical Aims &amp; Certification FAQ
            </div>
            <div class="doc-meta">
              <span><strong>Document:</strong> Official Study Guide</span>
              <span><strong>Version:</strong> 2.4.0 (2026 Edition)</span>
              <span><strong>Passing Benchmark:</strong> 700 / 1000 Pts</span>
              <span><strong>Date:</strong> ${today}</span>
            </div>
          </div>

          <!-- SECTION 1: OVERVIEW & BLUEPRINT -->
          <div class="no-break">
            <h2>1. Studio Mission &amp; AZ-900 Exam Blueprint</h2>
            <p>
              The <strong>Azure Fundamentals Practice Studio</strong> is an adaptive, multi-sensory certification preparation environment designed to guide candidates systematically to first-time exam success on the Microsoft AZ-900 examination.
            </p>
            <p>
              The Microsoft AZ-900 exam tests foundational knowledge of cloud services and how Microsoft Azure provides those services, agnostic of specific developer or administrative job roles.
            </p>

            <table>
              <thead>
                <tr>
                  <th>Learning Path</th>
                  <th>Official Weight</th>
                  <th>Key Curriculum Focus</th>
                  <th>Target Questions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Path 1: Cloud Concepts</strong></td>
                  <td>25–30%</td>
                  <td>Cloud models (IaaS/PaaS/SaaS, Public/Private/Hybrid), Shared Responsibility model, Cloud benefits (Elasticity, Scalability, High Availability, Disaster Recovery), CapEx vs. OpEx.</td>
                  <td>~10–15 Qs</td>
                </tr>
                <tr>
                  <td><strong>Path 2: Azure Architecture &amp; Services</strong></td>
                  <td>35–40%</td>
                  <td>Regions, Availability Zones, Resource Groups, Subscriptions, Compute (VMs, Containers, Functions, App Services), Storage Tiers, Networking (VNet, ExpressRoute, VPN), Azure Identity &amp; Entra ID.</td>
                  <td>~15–20 Qs</td>
                </tr>
                <tr>
                  <td><strong>Path 3: Azure Management &amp; Governance</strong></td>
                  <td>30–35%</td>
                  <td>Cost Management, Pricing Calculator vs. TCO, Azure Policy, Role-Based Access Control (RBAC), Resource Locks, Microsoft Purview, Azure Monitor, Service Health.</td>
                  <td>~12–16 Qs</td>
                </tr>
              </tbody>
            </table>

            <div class="callout callout-success">
              <strong>Passing Criteria:</strong> The exam is scaled from 100 to 1,000 points. A scaled score of <strong>700 or higher</strong> is required to pass. There is no penalty for guessing; unanswered questions count as incorrect.
            </div>
          </div>

          <!-- SECTION 2: HOW TO USE THE APP (WORKFLOW) -->
          <div class="page-break"></div>
          <h2>2. Recommended 5-Phase Candidate Workflow</h2>
          <p>
            To maximize retention and pass on your first attempt, follow this recommended sequence:
          </p>

          <ol>
            <li>
              <strong>Phase 1: Baseline Diagnostic (Practice &amp; Adaptive Modes)</strong><br>
              Begin with 20–30 questions in Practice Mode or Adaptive Quiz. Do not look at answers immediately. Pay attention to which topics trigger doubt.
            </li>
            <li>
              <strong>Phase 2: Systematic Domain Mastery (Study Mode &amp; Key Units)</strong><br>
              Switch to <em>Study Mode (Decks)</em>. Step through each of the 12 curriculum modules. Review the granular Unit-by-Unit breakdowns, core Azure service architectures, and real-world examples.
            </li>
            <li>
              <strong>Phase 3: Active Recall Reinforcement (Flashcards &amp; Micro-Drills)</strong><br>
              Solidify terminology (e.g., ExpressRoute vs. VPN Gateway, Fault Domains vs. Update Domains) using the <em>Flashcards Tab</em>. Whenever a module score drops below 70%, trigger a <em>Micro-Drill</em>.
            </li>
            <li>
              <strong>Phase 4: Targeted Remediation (5-Min Quick-Retry &amp; Mistake Review)</strong><br>
              Review all missed items under <em>Mistake Review</em>. Launch the <em>5-Minute Quick-Retry Queue</em> to immediately re-test the questions you got wrong before the memory decays.
            </li>
            <li>
              <strong>Phase 5: Full-Length Exam Readiness Simulation</strong><br>
              Complete at least two full-length 45-minute <em>Mock Exams</em>. Strive for 850+ points before scheduling your official Pearson VUE test appointment.
            </li>
          </ol>

          <!-- SECTION 3: SPECIAL FEATURES BREAKDOWN & AIMS -->
          <div class="page-break"></div>
          <h2>3. Special Features Breakdown &amp; Pedagogical Aims</h2>
          <p>
            Every feature in the Studio is grounded in cognitive learning science, retrieval practice, and error-driven learning:
          </p>

          <div class="feature-card">
            <div class="feature-header">
              <span>1. Dynamic Adaptive Difficulty Engine</span>
              <span>Practice &amp; Adaptive Tabs</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: Maintains study within the Zone of Proximal Development (ZPD) to eliminate boredom and prevent cognitive overload.
            </div>
            <p>
              The engine monitors a rolling window of recent responses. Starting at Medium difficulty, it dynamically promotes candidates to Advanced scenario-based questions when performance exceeds 75%, and gracefully drops down to Fundamental definitions when consecutive errors occur. Candidates can also permanently lock their desired tier.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>2. 1–5 User Confidence Scoring &amp; Metacognitive Matrix</span>
              <span>QuizCard &amp; Analytics</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: Fosters metacognition to isolate "Lucky Guesses" from "Dangerous Blind Spots".
            </div>
            <p>
              After submitting an answer, candidates rate confidence from 1 (Guessing) to 5 (Mastered). The Studio cross-references correctness against confidence. A correct answer with confidence 1 flags a lucky guess requiring review; an incorrect answer with confidence 5 flags an overconfidence blind spot that could cost marks on the real exam.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>3. Concept Summary &amp; ELI5 ("Explain Like I'm 5") Analogies</span>
              <span>QuizCard Interactive Toggle</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: De-abstracts technical jargon into foundational first principles and memorable everyday metaphors.
            </div>
            <p>
              When candidates struggle with technical jargon, the <strong>Concept Summary</strong> replaces dense distractor text with a 1-sentence governing Azure principle. The <strong>ELI5 Analogy</strong> maps complex mechanics (e.g. Availability Zones, Spot Instances, ExpressRoute) to intuitive real-life models (e.g. separate electrical power grids, standby airline tickets, private express toll roads).
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>4. SpeechRecognition Voice Answering &amp; Voice Study Notes</span>
              <span>QuizCard Hands-Free Mode</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: Accessibility, multimodal learning, and dual-coding verbal recall.
            </div>
            <p>
              Users can practice completely hands-free by speaking "Option 1", "Option A", or the option title. The Studio also features a microphone dictation tool allowing candidates to voice-dictate personal study notes per question, which are instantly saved to offline storage.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>5. Study Zone Command Hub (Accordion Menu)</span>
              <span>Practice Toolbar</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: Spatial cognitive ergonomics—eliminates UI clutter while providing instant access to study aids.
            </div>
            <p>
              Centered lower down the viewport, the Study Zone provides 4 structured accordion drawers: (1) Quick-Sorts (Newest First, Hardest First, Module Progression), (2) Mode Calibration (Study vs. 45m Exam Sim, Difficulty Lock), (3) Learning Aids (ELI5, Audio, Read Aloud, Notes), and (4) Simulators &amp; Study Links.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>6. Focus Session &amp; Pomodoro Timer (Cross-Tab Sync)</span>
              <span>Header Top-Bar</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: Encourages deliberate deep work and prevents mental fatigue via scheduled neuro-restorative breaks.
            </div>
            <p>
              Tracks cumulative study seconds across browser tabs via synchronized storage events. Triggers a gentle audio chime and restorative breathing modal every 25 minutes of active problem solving.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>7. 5-Minute Temporary Quick-Retry Queue</span>
              <span>Post-Session &amp; Practice Filters</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: Capitalizes on the "Hypercorrection Effect" by testing missed concepts while feedback is fresh in working memory.
            </div>
            <p>
              Immediately queues all incorrectly answered questions from a practice session into a temporary 5-minute filter. Candidates can re-attempt their mistakes immediately to establish the correct neural pathway.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-header">
              <span>8. Full-Length 45-Minute Mock Exam Simulator</span>
              <span>Mock Exam Tab / Modal</span>
            </div>
            <div class="feature-aim">
              Pedagogical Aim: State-dependent retrieval practice and real test pacing.
            </div>
            <p>
              Simulates official Pearson VUE test conditions with domain-weighted question balances (28% Path 1, 40% Path 2, 32% Path 3), a strict 45-minute countdown, a 700/1000 scaled score, and an in-depth domain breakdown report.
            </p>
          </div>

          <!-- SECTION 4: FREQUENTLY ASKED QUESTIONS (FAQ) -->
          <div class="page-break"></div>
          <h2>4. Frequently Asked Questions (FAQ)</h2>

          <div class="faq-item">
            <div class="faq-q">Q1: What is the format and duration of the official Microsoft AZ-900 exam?</div>
            <div class="faq-a">
              The official AZ-900 exam consists of approximately 40 to 60 questions with an exam duration of 45 to 65 minutes. Question formats include multiple choice, drag-and-drop, case scenarios, and hotspot selections. The passing score is 700 out of 1000.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q2: How does the Adaptive Difficulty engine adjust questions?</div>
            <div class="faq-a">
              The adaptive algorithm maintains a rolling session performance tracker. If you achieve &gt;75% correct answers over your recent window, it serves Intermediate and Advanced questions. If accuracy dips below 50%, it introduces Fundamental definitions to solidify core mental models. You can also lock your difficulty permanently in the Study Zone menu.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q3: Why should I record my confidence level (1–5) after each question?</div>
            <div class="faq-a">
              Confidence tracking is a proven metacognitive technique. It prevents the illusion of competence by distinguishing between lucky guesses (correct + 1/5 confidence) and false mastery blind spots (incorrect + 5/5 confidence). Your Analytics tab highlights which domains suffer from overconfidence.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q4: How does the 5-Minute Quick-Retry Queue work?</div>
            <div class="faq-a">
              At the end of any practice session, clicking 'Quick-Retry' instantly captures all missed questions and activates a temporary 5-minute filter in the practice tab. Testing your mistakes within 5 minutes cements the correct explanation before you forget it.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q5: What is the difference between Concept Summary and ELI5 mode?</div>
            <div class="faq-a">
              Concept Summary condenses the explanation into a single, technically precise architectural rule (e.g., 'ExpressRoute traverses private fiber and does NOT travel over the public internet'). ELI5 ('Explain Like I\\'m 5') translates the mechanism into an intuitive real-world metaphor (e.g., 'ExpressRoute is like having your own private underground VIP tunnel directly into Azure\\'s building').
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q6: Can I use voice recognition to practice completely hands-free?</div>
            <div class="faq-a">
              Yes. Clicking the microphone icon activates Web SpeechRecognition. When prompted, say 'Option 1', 'Option A', or read part of the answer text. The Studio will automatically select the option and submit your answer. You can also dictate inline study notes.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q7: Does this app work offline and as a Progressive Web App (PWA)?</div>
            <div class="faq-a">
              Yes. The Studio is a certified PWA. Click the 'Install App' button in the header to install it as a native desktop or mobile application. All questions, stats, confidence logs, and study notes are stored securely in offline browser storage.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q8: How does the Focus Session Pomodoro timer coordinate across multiple tabs?</div>
            <div class="faq-a">
              The Focus Session timer uses cross-tab localStorage events. Studying in one tab accumulates active seconds across all open tabs, triggering a synchronized 25-minute Pomodoro alert with gentle chimes and calming breathing exercises.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q9: What are the African heritage accents and Harambee proverbs?</div>
            <div class="faq-a">
              Harambee is a Kenyan community tradition of 'pulling together'. The Studio integrates warm earth tones (terracotta, savannah ochre, azure blue), Maasai beadwork medallions, and uplifting Swahili wisdom proverbs to replace sterile corporate software styling with cultural warmth and community perseverance.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q10: How do I export my study progress or print this guide?</div>
            <div class="faq-a">
              Click the 'Export' button or 'Download/Print PDF' in the header or Study Zone. You can export complete performance logs in JSON format or generate high-fidelity printable PDF reports containing 12-module accuracy breakdowns.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q11: How does Authentication &amp; Simultaneous Cross-Platform Cloud Sync work?</div>
            <div class="faq-a">
              Sessions use encrypted OAuth 2.0 / JWT tokens with silent 25-minute background renewal for uninterrupted multi-hour daily study. You can sign in with the same account on your mobile phone and laptop simultaneously—progress, module mastery scores, and streaks merge non-destructively in real time via Cloud Firestore and PostgreSQL. <em>Disclaimer: Always sign out when using shared public or cybercafé computers.</em>
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-q">Q12: How are my data and M-Pesa payments protected (Ref: Kenya Data Protection Act, 2019)?</div>
            <div class="faq-a">
              In compliance with the <strong>Kenya Data Protection Act, No. 24 of 2019 (ODPC Principles)</strong>, we collect only essential learner identity and AZ-900 study telemetry solely for exam preparation—never sold or shared with third parties, with full JSON/PDF export and reset rights. M-Pesa Daraja STK Push prompts run strictly on your phone's encrypted SIM Toolkit; this web app never requests, sees, or stores your M-Pesa PIN.
            </div>
          </div>

          <!-- SECTION 5: RECOMMENDED 4-WEEK STUDY SCHEDULE -->
          <div class="page-break"></div>
          <h2>5. Recommended 4-Week Study Schedule</h2>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Focus Domain</th>
                <th>Key Topics &amp; Practice Tasks</th>
                <th>Target Milestone</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Week 1</strong></td>
                <td>Path 1: Cloud Concepts</td>
                <td>Shared Responsibility Model, IaaS vs. PaaS vs. SaaS, High Availability, Fault Tolerance, Elasticity, CapEx vs. OpEx. Complete Modules 1–3 in Study Mode.</td>
                <td>50+ Questions Solved<br>&ge;80% Accuracy on Path 1</td>
              </tr>
              <tr>
                <td><strong>Week 2</strong></td>
                <td>Path 2: Architecture &amp; Compute</td>
                <td>Regions, Availability Zones, Azure VMs, Containers, Functions, App Services, Virtual Networks, ExpressRoute, Storage Tiers (Hot/Cool/Cold/Archive). Complete Modules 4–7.</td>
                <td>120+ Questions Solved<br>&ge;75% Accuracy on Path 2</td>
              </tr>
              <tr>
                <td><strong>Week 3</strong></td>
                <td>Path 3: Governance &amp; Security</td>
                <td>Azure Entra ID (MFA, Conditional Access), RBAC vs. Resource Locks, Azure Policy, Cost Management &amp; Pricing Calculator, Microsoft Defender for Cloud, Purview. Complete Modules 8–12.</td>
                <td>200+ Questions Solved<br>&ge;80% Accuracy on Path 3</td>
              </tr>
              <tr>
                <td><strong>Week 4</strong></td>
                <td>Mock Exams &amp; Remediation</td>
                <td>Run 3 full-length 45-minute Mock Exams. Use 5-Minute Quick-Retry to drill missed questions. Check Domain Confidence Matrix to eliminate all blind spots.</td>
                <td>Score &ge;850/1000 on Mock Exam<br>Pass Official AZ-900!</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-note">
            Microsoft Azure Fundamentals (AZ-900) Practice Studio &bull; Developed for candidate success &bull; Document printed on ${today}
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 450);
  };

  // Copy Markdown/Text Summary to clipboard
  const handleCopyMarkdown = () => {
    const textContent = `
# Microsoft Azure Fundamentals (AZ-900) Practice Studio — Candidate Handbook
Generated: ${today}

## 1. Exam Blueprint & Weights
- Path 1: Cloud Concepts (25–30%) — Shared responsibility, IaaS/PaaS/SaaS, Cloud economics.
- Path 2: Azure Architecture & Services (35–40%) — Compute, Storage, Networking, Identity.
- Path 3: Azure Management & Governance (30–35%) — Cost management, Policy, RBAC, Locks.
- Passing Mark: 700 / 1000 scaled score.

## 2. Core Special Features & Aims
1. Adaptive Difficulty Engine: Auto-calibrates between Fundamental, Intermediate, and Advanced based on rolling performance.
2. 1-5 Confidence Scoring: Distinguishes lucky guesses (correct + low confidence) from blind spots (incorrect + high confidence).
3. Concept Summary & ELI5 Analogies: Replaces distractor text with 1-sentence governing Azure principles or everyday analogies.
4. SpeechRecognition Voice Answering: Allows hands-free test taking ("Option 1 / Option A") and voice study notes.
5. Study Zone Command Hub: Centered accordion grouping quick-sorts, difficulty locks, and simulators.
6. 5-Minute Quick-Retry Queue: Hyper-focused error drilling right after review sessions.
7. Focus Session Pomodoro: Synchronizes daily study seconds across browser tabs with 25-minute break chimes.
8. Full-Length 45-Minute Mock Exam: Real test conditions, weighted questions, and score breakdown.
9. Simultaneous Cross-Platform Sync & Security: Real-time mobile + laptop sync, silent token refresh for long study hours, M-Pesa STK Push SIM isolation, and Kenya Data Protection Act (2019) compliance.
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopyStatus('Handbook summary copied to clipboard!');
    setTimeout(() => setCopyStatus(null), 3000);
  };

  // Copy individual FAQ item rich text to clipboard
  const handleCopyFaq = (item: FaqHelpItem) => {
    const text = `
**Q: ${item.question}**
Category: ${item.category}

${item.richAnswer.intro}

${
  item.richAnswer.keyPoints
    ? item.richAnswer.keyPoints.map((p) => `• ${p}`).join('\n')
    : ''
}

${
  item.richAnswer.callout
    ? `[${item.richAnswer.callout.type.toUpperCase()}: ${item.richAnswer.callout.title}] ${item.richAnswer.callout.text}`
    : ''
}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopyStatus(`Copied: "${item.question.substring(0, 32)}..."`);
    setTimeout(() => setCopyStatus(null), 2800);
  };

  // Filter FAQ dataset by selected category AND search query
  const filteredFaqs = FAQ_HELP_DATASET.filter((item) => {
    const matchesCategory =
      selectedFaqCategory === 'All' || item.category === selectedFaqCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery =
      item.question.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.richAnswer.intro.toLowerCase().includes(q) ||
      (item.richAnswer.keyPoints &&
        item.richAnswer.keyPoints.some((kp) => kp.toLowerCase().includes(q))) ||
      (item.richAnswer.callout &&
        (item.richAnswer.callout.title.toLowerCase().includes(q) ||
          item.richAnswer.callout.text.toLowerCase().includes(q))) ||
      item.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 card-elevation overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        <KitengeRibbon height={5} />

        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-amber-300">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  Candidate Guide &amp; PDF Manual
                </span>
                <span className="text-xs text-sky-200 hidden sm:inline">
                  • 2026 Edition
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white mt-0.5">
                Azure Fundamentals (AZ-900) Studio Guide &amp; FAQ
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Direct Client-Side jsPDF Download */}
            <button
              onClick={() => generateUserManualPdf()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md cursor-pointer group"
              title="Download official multi-page User Manual as a PDF directly via client-side jsPDF"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Save Manual (.PDF)</span>
            </button>

            {/* Print / Preview PDF Window */}
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-md cursor-pointer group"
              title="Print or view styled printable document"
            >
              <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Print Document</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'overview', label: '1. Blueprint & Overview', icon: BookOpen },
            { id: 'workflow', label: '2. How to Use', icon: Target },
            { id: 'features', label: '3. Special Features', icon: Sparkles },
            { id: 'aims', label: '4. Pedagogical Aims', icon: Zap },
            { id: 'faq', label: '5. FAQ Section', icon: HelpCircle },
            { id: 'study-plan', label: '6. 4-Week Study Plan', icon: Clock },
            { id: 'readme-history', label: '7. README & Build History', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as GuideSection)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          {/* SECTION 1: BLUEPRINT & OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-600 text-white shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sky-950 text-sm">
                    Studio Mission &amp; Purpose
                  </h4>
                  <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                    The <strong>Azure Fundamentals Practice Studio</strong> is built to transform AZ-900 exam preparation from passive memorization into active, confident competence. It combines real-world cloud scenarios, adaptive learning loops, dual-coding audio/visual reinforcement, and African cultural motivation.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2">
                  Official Microsoft AZ-900 Domain Weights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {LEARNING_PATHS.map((path) => (
                    <div
                      key={path.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0078D4] transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-[#0078D4]">
                          Path {path.id}
                        </span>
                        <span className="font-extrabold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {path.examWeight}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                        {path.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">
                        {path.summary}
                      </p>
                      <div className="pt-1 border-t border-slate-100 text-[10px] font-bold text-slate-600">
                        {path.modules.length} Modules • Key Exam Focus
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Exam Pass Criteria &amp; Scoring System</span>
                </div>
                <p className="text-xs leading-relaxed">
                  The actual AZ-900 exam has <strong>40 to 60 questions</strong> to be completed within <strong>45 to 65 minutes</strong>. The passing score is <strong>700 out of 1000</strong>. Questions cover multiple choice, drop-down selections, and drag-and-drop matching. There is no negative marking for incorrect guesses!
                </p>
              </div>
            </div>
          )}

          {/* SECTION 2: HOW TO USE */}
          {activeSection === 'workflow' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-slate-900 text-base">
                How to Use the Azure Fundamentals Practice Studio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-[#0078D4] text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Practice Mode (Quiz Card)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Solve scenario-based multiple-choice questions. Click an answer or speak aloud using the microphone. Read the full explanation or toggle <strong>Concept Summary</strong> or <strong>ELI5</strong> to simplify concepts.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-amber-700 text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>Study Mode (Curriculum Decks)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Walk sequentially through all 12 modules across the 3 Learning Paths. Expand granular Unit-by-Unit breakdowns, inspect core cloud services, and rate your confidence per module.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-indigo-700 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs">
                      3
                    </span>
                    <span>Adaptive Quiz Mode</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Let the intelligent algorithm dynamically adjust question difficulty based on your rolling session accuracy. When you perform well, it tests you on challenging multi-service scenarios.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-emerald-700 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                      4
                    </span>
                    <span>Full-Length 45m Mock Exam</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Simulate real exam pressure! A strict 45-minute timer runs with questions balanced according to Microsoft's official domain weights. Complete it with no hints, then review your domain breakdown report.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Toolbar &amp; Navigation Quick Reference
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-[#0078D4] block">Path Selectors:</span>
                    <span className="text-[11px] text-slate-500">Filter P1, P2, or P3 instantly.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-amber-700 block">Focus Timer:</span>
                    <span className="text-[11px] text-slate-500">Daily study tracker &amp; 25m Pomodoro.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-emerald-700 block">Study Zone:</span>
                    <span className="text-[11px] text-slate-500">Quick-sorts, locks, aids &amp; shortcuts.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-rose-700 block">Review Session:</span>
                    <span className="text-[11px] text-slate-500">Fast re-test of your last 10 missed Qs.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SPECIAL FEATURES BREAKDOWN */}
          {activeSection === 'features' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-slate-900 text-base">
                Special Features Breakdown
              </h3>

              <div className="space-y-3">
                {[
                  {
                    title: '1. Adaptive Difficulty Mechanism',
                    badge: 'Smart Engine',
                    desc: 'Automatically adjusts between Fundamental, Intermediate, and Advanced questions based on rolling accuracy in the current session. Start at medium; exceed 75% to trigger advanced scenarios, or drop to foundational terms if struggling.',
                  },
                  {
                    title: '2. 1–5 User Confidence Scoring',
                    badge: 'Metacognition',
                    desc: 'Rate your confidence after every answer: 1 (Guessing), 2 (Low), 3 (Moderate), 4 (High), or 5 (Mastered). The system records this score and highlights blind spots (high confidence + wrong answer) on the Analytics radar.',
                  },
                  {
                    title: '3. Concept Summary & ELI5 Analogies',
                    badge: 'Learning Aids',
                    desc: 'Toggle Concept Summary to view the single governing architectural principle of the Azure service in 1 sentence. Or toggle ELI5 ("Explain Like I\'m 5") for child-friendly, non-technical real-world analogies (e.g. comparing Availability Zones to separate power grids).',
                  },
                  {
                    title: '4. SpeechRecognition Voice Answering',
                    badge: 'Hands-Free',
                    desc: 'Answer questions hands-free by speaking "Option 1", "Option A", or the text of the answer. You can also dictate study notes directly into the question note pad via the microphone.',
                  },
                  {
                    title: '5. Subtle Multi-Sensory Audio Feedback',
                    badge: 'Audio Cues',
                    desc: 'Soft harmonic chime (D5-A5) on correct answers and a subtle gentle woosh on incorrect answers provide multi-sensory reinforcement without jarring loud sounds. Can be muted at any time via the footer or Study Zone.',
                  },
                  {
                    title: '6. Study Zone Command Hub',
                    badge: 'Centered Accordion',
                    desc: 'Centered popup modal located lower down the screen so it is 100% visible without blocking the navigation header. Contains quick-sort buttons (Newest First, Hardest First, Module Progression), difficulty lock, and quick tool shortcuts.',
                  },
                  {
                    title: '7. 5-Minute Temporary Quick-Retry Queue',
                    badge: 'Rapid Remediation',
                    desc: 'Click "Quick-Retry" at the end of a session to instantly push all missed questions into a temporary 5-minute queue in the practice view for immediate drill-down while memory is fresh.',
                  },
                  {
                    title: '8. Focus Session & Pomodoro Timer',
                    badge: 'Habit Builder',
                    desc: 'Synchronizes daily study time across all browser tabs via localStorage. Prompts a restorative 5-minute break with calming breathing exercises after 25 minutes of active quiz interaction.',
                  },
                  {
                    title: '9. Confetti Burst Celebrations',
                    badge: 'Achievement',
                    desc: 'Vibrant celebratory confetti burst triggers when you exceed your daily quiz target by more than 20% or mark a curriculum module complete in the Module Browser.',
                  },
                  {
                    title: '10. Grounded Knowledge Assistant',
                    badge: 'Official Docs Grounded',
                    desc: 'AI tutor that cross-references official Microsoft Azure documentation to explain complex architectural questions with certified citations and zero hallucinations.',
                  },
                ].map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0078D4] transition-all space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {feat.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-[#0078D4] border border-blue-200">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: PEDAGOGICAL AIMS */}
          {activeSection === 'aims' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-slate-900 text-base">
                Aims and Purposes of Useful Features
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Why was each tool designed this way? Here is the cognitive science and educational rationale behind our architecture:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border-l-4 border-l-[#0078D4] bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-black text-xs text-slate-900 uppercase">
                    Aim: Zone of Proximal Development (Adaptive Engine)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Purpose:</strong> If questions are too simple, learners experience boredom and false confidence. If questions are too difficult, cognitive overload leads to burnout. Adaptive calibration keeps the student constantly challenged at the optimal learning threshold.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-l-4 border-l-amber-600 bg-amber-50/50 border border-amber-200 space-y-1">
                  <div className="font-black text-xs text-amber-950 uppercase">
                    Aim: Calibration of Metacognition (1–5 Confidence Scoring)
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Purpose:</strong> Many candidates fail certification exams because of "illusion of knowing"—they recognize the correct answer when looking at choices, but could not retrieve it independently. Forcing a confidence rating exposes lucky guesses and highlights overconfident mistakes before the real exam.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-l-4 border-l-emerald-600 bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <div className="font-black text-xs text-emerald-950 uppercase">
                    Aim: Anchoring on First Principles (Concept Summary &amp; ELI5)
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    <strong>Purpose:</strong> Long distractor explanations often confuse learners by discussing what is wrong rather than why the correct concept works. Concept Summary provides the one governing truth, while ELI5 builds an intuitive mental scaffold using familiar non-technical metaphors.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-l-4 border-l-rose-600 bg-rose-50/50 border border-rose-200 space-y-1">
                  <div className="font-black text-xs text-rose-950 uppercase">
                    Aim: Hypercorrection Effect (5-Minute Quick-Retry Queue)
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    <strong>Purpose:</strong> Cognitive psychology proves that high-confidence errors corrected immediately produce the deepest, longest-lasting memory improvements. The 5-minute queue creates an immediate re-test loop before the conceptual correction is forgotten.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-l-4 border-l-purple-600 bg-purple-50/50 border border-purple-200 space-y-1">
                  <div className="font-black text-xs text-purple-950 uppercase">
                    Aim: Deep Work &amp; Habit Formation (Focus Session Pomodoro)
                  </div>
                  <p className="text-xs text-purple-900 leading-relaxed">
                    <strong>Purpose:</strong> Marathon cramming produces rapid forgetting. Cross-tab study tracking and structured 25-minute Pomodoro cycles build a sustainable daily study habit that respects candidate focus limits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: FAQ & HELP SECTION */}
          {activeSection === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Candidate FAQ &amp; Knowledge Base
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0078D4]">
                      {filteredFaqs.length} Answers
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search and scan answers by category without exiting your current study session.
                  </p>
                </div>

                {/* FAQ Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search terms, scoring, navigation..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0078D4] bg-white shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setSelectedFaqCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedFaqCategory === 'All'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  All Categories ({FAQ_HELP_DATASET.length})
                </button>
                {FAQ_HELP_CATEGORIES.map((cat) => {
                  const catCount = FAQ_HELP_DATASET.filter(
                    (item) => item.category === cat
                  ).length;
                  const isActive = selectedFaqCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFaqCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#0078D4] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-[#0078D4] hover:bg-white/60'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Succinct Security, Kenya Data Protection Act (2019), Cloud Sync & M-Pesa Disclaimers Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0c2340] text-white border border-sky-500/30 shadow-sm space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Trust &amp; Compliance Notice
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      Security, Kenya Data Protection Act (2019), Cloud Sync &amp; M-Pesa Disclaimers
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFaqCategory('Security, Privacy & Sync')}
                    className="text-[11px] font-extrabold text-sky-300 hover:text-white underline underline-offset-2 cursor-pointer"
                  >
                    Filter Security &amp; Sync FAQs &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-200 leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-sky-300 font-extrabold block mb-0.5">
                      1. Auth &amp; Long-Hour Daily Study Security
                    </strong>
                    Uses OAuth 2.0 / JWT tokens with silent 25-min background renewal for uninterrupted multi-hour study. Passwords are never saved in localStorage. <em>Sign out on shared public devices.</em>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-emerald-300 font-extrabold block mb-0.5">
                      2. Kenya Data Protection Act (KDPA, 2019)
                    </strong>
                    Aligned with ODPC principles (data minimization &amp; purpose limitation). Only AZ-900 progress telemetry is stored; zero data selling; full JSON/PDF export &amp; reset rights at any time.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-amber-300 font-extrabold block mb-0.5">
                      3. Simultaneous Mobile + Laptop Cloud Sync
                    </strong>
                    Use the same account on your phone and laptop at the same time. Firestore live listeners &amp; PostgreSQL sync merge scores non-destructively (keeping highest mastery) with offline fallback.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-purple-300 font-extrabold block mb-0.5">
                      4. Why M-Pesa &amp; Secure Payment Isolation
                    </strong>
                    Enables instant East African mobile unlocks. Safaricom Daraja STK Push prompts appear <em>only</em> on your phone SIM Toolkit—this app never sees or stores your M-Pesa PIN, and unlocks sync across all devices.
                  </div>
                </div>
              </div>

              {/* Rich-Text Accordion FAQ List */}
              <div className="space-y-3">
                {filteredFaqs.map((item) => {
                  const isExpanded = expandedFaqId === item.id;
                  const categoryBadgeColor =
                    item.category === 'Getting Started'
                      ? 'bg-blue-100 text-[#0078D4] border-blue-200'
                      : item.category === 'Understanding Scoring'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : item.category === 'Security, Privacy & Sync'
                      ? 'bg-purple-100 text-purple-900 border-purple-200'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-200';

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'border-[#0078D4]/60 bg-white shadow-md ring-1 ring-[#0078D4]/15'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* Accordion Question Header */}
                      <button
                        onClick={() =>
                          setExpandedFaqId(isExpanded ? null : item.id)
                        }
                        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${categoryBadgeColor}`}
                            >
                              {item.category}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {item.summary}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                            {item.question}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyFaq(item);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy question and answer to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[#0078D4]' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Accordion Expanded Rich-Text Body */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed animate-in slide-in-from-top-1 duration-150">
                          {/* 1. Intro Paragraph */}
                          <p className="text-slate-800 font-medium leading-relaxed">
                            {item.richAnswer.intro}
                          </p>

                          {/* 2. Structured Key Points (Bullets) */}
                          {item.richAnswer.keyPoints &&
                            item.richAnswer.keyPoints.length > 0 && (
                              <div className="space-y-1.5 pl-1">
                                {item.richAnswer.keyPoints.map((point, pIdx) => {
                                  const [boldTitle, ...rest] = point.split(':');
                                  return (
                                    <div
                                      key={pIdx}
                                      className="flex items-start gap-2 text-xs text-slate-700"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4] shrink-0 mt-1.5" />
                                      <p className="leading-relaxed">
                                        {rest.length > 0 ? (
                                          <>
                                            <strong className="text-slate-900 font-bold">
                                              {boldTitle}:
                                            </strong>
                                            {rest.join(':')}
                                          </>
                                        ) : (
                                          point
                                        )}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          {/* 3. Rich Callout Box (tip / info / warning) */}
                          {item.richAnswer.callout && (
                            <div
                              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                                item.richAnswer.callout.type === 'tip'
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                  : item.richAnswer.callout.type === 'warning'
                                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                                  : 'bg-blue-50/80 border-blue-200 text-blue-950'
                              }`}
                            >
                              {item.richAnswer.callout.type === 'tip' ? (
                                <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : item.richAnswer.callout.type === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              ) : (
                                <Info className="w-4 h-4 text-[#0078D4] shrink-0 mt-0.5" />
                              )}
                              <div>
                                <strong className="font-extrabold block mb-0.5">
                                  {item.richAnswer.callout.title}
                                </strong>
                                <span className="leading-relaxed">
                                  {item.richAnswer.callout.text}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 4. Tags Footer */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 text-[11px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Topics:
                            </span>
                            {item.tags.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSearchQuery(t)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-sky-50 text-slate-600 hover:text-[#0078D4] border border-slate-200 text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredFaqs.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      No FAQ entries match "{searchQuery}" in category "{selectedFaqCategory}".
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedFaqCategory('All');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
                    >
                      Clear Search &amp; Show All
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: 4-WEEK STUDY PLAN */}
          {activeSection === 'study-plan' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-slate-900 text-base">
                Recommended 4-Week Study Schedule to Pass AZ-900
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Follow this structured 4-week roadmap using the Studio's built-in tools to guarantee readiness before exam day:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[#0078D4] uppercase">
                      Week 1: Path 1 Mastery (Cloud Concepts 25–30%)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0078D4]">
                      Target: &ge;80% Accuracy
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    <li>Study Modules 1–3 in Study Mode (Shared Responsibility, IaaS vs PaaS vs SaaS, Cloud economics).</li>
                    <li>Solve 40+ practice questions filtered to Path 1.</li>
                    <li>Use Concept Summary on every question to understand provider vs. customer duties.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-emerald-800 uppercase">
                      Week 2: Path 2 Core Services (Architecture 35–40%)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Target: &ge;75% Accuracy
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    <li>Study Modules 4–7 (Regions, Availability Zones, VMs, Containers, Storage Tiers, VNets).</li>
                    <li>Review key distinctions: ExpressRoute vs VPN Gateway; Archive rehydration delay.</li>
                    <li>Use ELI5 toggle for complex concepts like Fault Domains and Update Domains.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-800 uppercase">
                      Week 3: Path 3 Governance (Security &amp; Management 30–35%)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Target: &ge;80% Accuracy
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    <li>Study Modules 8–12 (Azure Policy, RBAC, Resource Locks, Cost Management, Purview).</li>
                    <li>Drill down into critical traps: Resource Locks override Owner RBAC permissions!</li>
                    <li>Complete all module confidence ratings (1–5).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-purple-800 uppercase">
                      Week 4: Mock Exam Simulations &amp; Remediation
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Target: &ge;850/1000 Scaled Points
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    <li>Complete at least 2 full-length 45-minute Mock Exams under realistic timed conditions.</li>
                    <li>Use 5-Minute Quick-Retry to test all missed questions immediately.</li>
                    <li>Check the Confidence Matrix in Analytics to eliminate any remaining blind spots.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: README.MD & BUILD_HISTORY.MD VIEWER & DOWNLOADER */}
          {activeSection === 'readme-history' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    Repository Documentation Files
                  </span>
                  <h3 className="text-base font-black mt-1">
                    Project README.md &amp; Separate BUILD_HISTORY.md
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    Both files are saved in the workspace root (`/README.md` and `/BUILD_HISTORY.md`) and can also be downloaded directly below.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const readmeBlob = new Blob(
                        [
                          `# Microsoft Azure Fundamentals (AZ-900) Smart Quiz Builder & Adaptive Practice Studio\n\nSee /README.md in the project root for full setup, architecture, Adaptive Learning Path, Analyze Distractors, Azure Concept Snap, Daily Study Goal Ring, Global Harambee Peer Leaderboard, and API telemetry documentation.`,
                        ],
                        { type: 'text/markdown;charset=utf-8' }
                      );
                      const url = URL.createObjectURL(readmeBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'README.md';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download README.md</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const historyBlob = new Blob(
                        [
                          `# History of Build — AZ-900 Smart Quiz Builder & Adaptive Practice Studio\n\nSee /BUILD_HISTORY.md in the project root for the chronological engineering log covering Phase 1 (Curriculum Foundation) through Phase 9 (Analyze Distractors, Azure Concept Snap, Daily Study Goal Ring, Global Peer Leaderboard, and Vitest Backend Tests).`,
                        ],
                        { type: 'text/markdown;charset=utf-8' }
                      );
                      const url = URL.createObjectURL(historyBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'BUILD_HISTORY.md';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download BUILD_HISTORY.md</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[#0078D4] uppercase">
                      📄 /README.md (Project Root)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Active &amp; Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Covers full-stack setup (`npm install`, `npm run dev`, `npx vitest run`), official AZ-900 Learning Paths (Cloud Concepts, Azure Architecture &amp; Services, Management &amp; Governance), Adaptive Difficulty &amp; Persistent Override Selector, Study Mode, Analyze Distractors, Azure Concept Snap, Daily Study Goal Ring, Global Peer Leaderboard, `.KenyanFlagQuickSortMotifs` animations, and Express/PostgreSQL API routes.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-900 uppercase">
                      📜 /BUILD_HISTORY.md &amp; /HISTORY.md
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      9 Engineering Phases
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Chronological engineering log detailing Phase 1 (Curriculum &amp; Exam Engine), Phase 2 (Adaptive Learning &amp; Weak Areas Review), Phase 3 (Study Mode &amp; ELI5), Phase 4 (Azure Concept Snap &amp; Analyze Distractors), Phase 5 (`.KenyanFlagQuickSortMotifs` 180° Trend Flip &amp; Shimmer), Phase 6 (Daily Goal Ring &amp; Red Sign-Out Transition), Phase 7 (Global Harambee Leaderboard), and Phase 8 (Recharts Telemetry &amp; Vitest Tests).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Copy summary handbook text to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Summary</span>
            </button>
            {copyStatus && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{copyStatus}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenMockExam && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMockExam();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Launch Mock Exam</span>
              </button>
            )}

            <button
              onClick={() => generateUserManualPdf()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md cursor-pointer group"
              title="Download client-side PDF file directly to disk"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Save Manual (.PDF)</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print View</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
