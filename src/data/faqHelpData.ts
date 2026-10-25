export interface FaqHelpItem {
  id: string;
  category:
    | 'Getting Started'
    | 'Understanding Scoring'
    | 'Advanced Features'
    | 'Security, Privacy & Sync';
  question: string;
  summary: string;
  richAnswer: {
    intro: string;
    keyPoints?: string[];
    callout?: {
      type: 'tip' | 'info' | 'warning';
      title: string;
      text: string;
    };
    deepDive?: string;
  };
  tags: string[];
}

export const FAQ_HELP_CATEGORIES = [
  'Getting Started',
  'Understanding Scoring',
  'Advanced Features',
  'Security, Privacy & Sync',
] as const;

export type FaqCategoryType = (typeof FAQ_HELP_CATEGORIES)[number];

export const FAQ_HELP_DATASET: FaqHelpItem[] = [
  // -------------------------------------------------------------
  // CATEGORY 1: GETTING STARTED
  // -------------------------------------------------------------
  {
    id: 'faq-gs-1',
    category: 'Getting Started',
    question: 'How do I navigate between Practice, Study Decks, and Mock Exams?',
    summary: 'Use the sliding navigation bar, quick switcher swipe, or header tabs.',
    richAnswer: {
      intro:
        'The Studio provides multiple intuitive ways to transition between learning modes without losing your place:',
      keyPoints: [
        'Top Navigation Bar: Switch between Practice, Study Mode, Adaptive Quiz, Flashcards, Mock Exam, Tutor, and Analytics.',
        'Quick Switcher Horizontal Swipe (Mobile): On any touch screen, swipe left or right across the QuizCard to toggle filters (All, Bookmarks, AI Scenarios, Mistakes, or 5-Min Retry Queue).',
        'Study Zone Command Hub: Click the "Study Zone" button on the QuizCard toolbar to access quick links to all modes in a centered drawer.',
        'Keyboard Shortcuts: Press Arrow Right for Next Question, Arrow Left for Previous, and Escape to toggle Focus Mode.',
      ],
      callout: {
        type: 'tip',
        title: 'Pro-Tip for Fast Navigation',
        text: 'If the top menu bar is hidden to save screen space, click "Show Tabs" or the Layers icon in the top right header to expand it instantly.',
      },
    },
    tags: ['Navigation', 'Mobile Swipe', 'Study Zone', 'Shortcuts'],
  },
  {
    id: 'faq-gs-2',
    category: 'Getting Started',
    question: 'How do I choose one of the three AZ-900 Learning Paths to focus on?',
    summary: 'Use the header P1/P2/P3 pills or the collapsible Learning Path Selector in the Practice tab.',
    richAnswer: {
      intro:
        'Targeting specific learning paths helps you focus on weak areas without being overwhelmed by the entire 12-module curriculum:',
      keyPoints: [
        'Header Path Selector: Click P1 (Cloud Concepts: 25–30%), P2 (Azure Architecture & Services: 35–40%), or P3 (Management & Governance: 30–35%) at the top of the screen.',
        'In-Practice Focus Card: Expand the "Select Focus Path" accordion in the practice workspace to review exam weights and confirm your selection.',
        'Reset to All: Click the "All" pill at any time to return to the full blended question bank.',
      ],
      callout: {
        type: 'info',
        title: 'Official Domain Weights',
        text: 'Path 2 (Azure Architecture & Services) carries the largest exam weight (35–40%), making it the most critical domain to master early.',
      },
    },
    tags: ['Learning Paths', 'Curriculum', 'Path Selection', 'Domain Focus'],
  },
  {
    id: 'faq-gs-3',
    category: 'Getting Started',
    question: 'Does the app work offline and how do I install it as a PWA?',
    summary: 'The app is a certified Progressive Web App that works 100% offline.',
    richAnswer: {
      intro:
        'The Azure Fundamentals Practice Studio is fully offline-capable and requires no constant internet connection once loaded:',
      keyPoints: [
        'Desktop Installation: Click the "Install App" button in the header (or the browser address bar icon in Chrome/Edge) to install it as a standalone desktop app.',
        'Mobile Installation (iOS/Android): In Safari, tap Share > "Add to Home Screen". In Chrome on Android, tap the three dots > "Install app".',
        'Offline Persistence: All 12 curriculum modules, built-in questions, personal study notes, bookmark lists, and confidence logs are stored securely in browser localStorage.',
        'Offline Indicator: When your internet disconnects, an amber offline badge appears, but all quizzing and analytics continue seamlessly.',
      ],
      callout: {
        type: 'tip',
        title: 'Zero Latency Studying',
        text: 'Studying in offline mode prevents network lag and distraction, ideal for flights, train commutes, or low-connectivity environments.',
      },
    },
    tags: ['PWA', 'Offline Mode', 'Installation', 'Local Storage'],
  },
  {
    id: 'faq-gs-4',
    category: 'Getting Started',
    question: 'Can I use speech recognition to answer multiple-choice questions hands-free?',
    summary: 'Yes! Speak option indices like "Option 1" or "Option A" to answer hands-free.',
    richAnswer: {
      intro:
        'The Studio includes built-in SpeechRecognition API integration for effortless voice answering and dictation:',
      keyPoints: [
        'Voice Answering: Click the microphone icon above the question options. When listening, say "Option 1", "Option A", "Option 2", or read key words from the choice.',
        'Automatic Selection: The voice parser recognizes your command, highlights the chosen option, and plays the audio chime automatically.',
        'Voice Study Notes: Click the microphone inside the Study Notes drawer to dictate custom notes per question without typing.',
      ],
      callout: {
        type: 'info',
        title: 'Browser Compatibility',
        text: 'The Web SpeechRecognition API is natively supported in Google Chrome, Microsoft Edge, and modern Chromium browsers on desktop and Android.',
      },
    },
    tags: ['Voice Input', 'SpeechRecognition', 'Hands-Free', 'Study Notes'],
  },

  // -------------------------------------------------------------
  // CATEGORY 2: UNDERSTANDING SCORING
  // -------------------------------------------------------------
  {
    id: 'faq-sc-1',
    category: 'Understanding Scoring',
    question: 'What is the official AZ-900 exam passing mark and how are scores scaled?',
    summary: 'Passing benchmark is 700 out of 1000 scaled points (70%).',
    richAnswer: {
      intro:
        'Microsoft evaluates candidate competency using a scaled scoring model rather than raw percentages:',
      keyPoints: [
        'Passing Score: Exactly 700 out of 1,000 points. Any score of 700 or above is a Pass.',
        'Scaled Points: Questions are weighted based on complexity and psychometric calibration; multi-part scenario questions carry proportional value.',
        'No Negative Marking: There is no penalty for guessing. Unanswered questions are scored as incorrect, so always select an answer!',
        'Exam Duration: Real exam has 40–60 questions within a 45–65 minute time window.',
      ],
      callout: {
        type: 'warning',
        title: 'Studio Readiness Metric',
        text: 'To ensure a comfortable safety margin on exam day, aim to consistently score 800+ points on Studio Mock Exams before taking the real test.',
      },
    },
    tags: ['Passing Mark', 'Scaled Score', '700 Points', 'Exam Format'],
  },
  {
    id: 'faq-sc-2',
    category: 'Understanding Scoring',
    question: 'Why does the app ask for my Confidence Level (1–5) and how is it used?',
    summary: 'Metacognitive calibration separates lucky guesses from dangerous blind spots.',
    richAnswer: {
      intro:
        'Rating your confidence after answering an item is a proven cognitive technique called Metacognitive Calibration:',
      keyPoints: [
        'The 1–5 Scale: 1 = Guessing, 2 = Low Confidence, 3 = Moderate, 4 = High, 5 = Mastered.',
        'Lucky Guess Detection: If you answer correctly with a 1 or 2 confidence, the system flags that topic for review so you don’t assume false mastery.',
        'Blind Spot Warning: If you answer incorrectly with a 4 or 5 confidence, the system alerts you to an active misconception.',
        'Domain Confidence Matrix: The Analytics tab graphs confidence vs. accuracy across all 12 modules, revealing your highest-risk topics.',
      ],
      callout: {
        type: 'tip',
        title: 'Be Honest With Ratings',
        text: 'Rating your true subjective certainty trains your brain to evaluate certainty accurately, preventing exam-day panic.',
      },
    },
    tags: ['Confidence Score', 'Metacognition', 'Blind Spots', 'Lucky Guesses'],
  },
  {
    id: 'faq-sc-3',
    category: 'Understanding Scoring',
    question: 'How is the Rolling Average Accuracy in the Adaptive Engine calculated?',
    summary: 'Tracks a rolling window of your most recent 8 to 12 quiz responses.',
    richAnswer: {
      intro:
        'Rather than judging you on total lifetime history, the Adaptive Engine uses recent session momentum:',
      keyPoints: [
        'Rolling Window: Evaluates your last 8 to 12 answered questions in the active practice session.',
        'Dynamic Tier Adjustments: Over 75% accuracy promotes you to Advanced scenarios; below 50% drops down to Fundamental definitions.',
        'Resilience: A bad session from last week won’t drag down your current adaptive flow; the engine responds to how you are performing right now.',
      ],
      callout: {
        type: 'info',
        title: 'Manual Tier Lock',
        text: 'Want only Advanced questions? In the Study Zone menu, click 🔒A to lock difficulty permanently.',
      },
    },
    tags: ['Rolling Average', 'Adaptive Engine', 'Dynamic Tiers', 'Difficulty'],
  },
  {
    id: 'faq-sc-4',
    category: 'Understanding Scoring',
    question: 'How do Module Progress Checkboxes and Mastery Percentages work?',
    summary: 'Combines quiz accuracy with manual completion tracking for full control.',
    richAnswer: {
      intro:
        'The Studio provides dual tracking: automated algorithmic scoring plus candidate-driven completion checklist:',
      keyPoints: [
        'Algorithmic Mastery: Calculated as (Correct Answers / Total Attempts) per module. 85%+ = Mastery (Green), 70–84% = Solid (Blue), 50–69% = Developing (Amber), <50% = Critical Focus (Red).',
        'Mark Complete Checkbox: In the Module Browser or Curriculum Overview, clicking "Mark Complete" celebrates your progress with an African-palette confetti burst and updates your overall readiness gauge.',
        'Reset Confidence: Want to start a module fresh? Click "Reset Confidence" in the Study Zone or Glassy Hub to clear that module’s past attempt history.',
      ],
    },
    tags: ['Module Mastery', 'Completion', 'Checkboxes', 'Reset'],
  },

  // -------------------------------------------------------------
  // CATEGORY 3: ADVANCED FEATURES
  // -------------------------------------------------------------
  {
    id: 'faq-adv-1',
    category: 'Advanced Features',
    question: 'What is the 5-Minute Temporary Quick-Retry Queue and why does it expire?',
    summary: 'A fast error-rehabilitation queue utilizing the Hypercorrection Effect.',
    richAnswer: {
      intro:
        'The Quick-Retry Queue is a specialized spaced-retrieval mechanism designed to fix errors while working memory is warm:',
      keyPoints: [
        'One-Click Activation: At the conclusion of any review session, click "Quick-Retry" in the Post-Session Review banner.',
        'Instant Filter: It isolates all incorrectly answered questions from that session into a dedicated 5-minute queue.',
        '5-Minute Expiration: Research in cognitive psychology shows that reviewing mistakes within 5 minutes yields maximum retention before misconceptions solidify into long-term memory.',
        'Countdown Banner: A live countdown timer shows minutes and seconds remaining, auto-clearing the queue when time expires.',
      ],
      callout: {
        type: 'tip',
        title: 'Hypercorrection in Action',
        text: 'Errors made with high confidence produce the strongest memory improvement when corrected immediately!',
      },
    },
    tags: ['Quick-Retry', 'Hypercorrection', '5-Minute Queue', 'Mistake Review'],
  },
  {
    id: 'faq-adv-2',
    category: 'Advanced Features',
    question: 'How do Concept Summary and ELI5 ("Explain Like I’m 5") Analogies differ?',
    summary: 'Concept Summary gives governing technical truth; ELI5 provides intuitive real-world metaphors.',
    richAnswer: {
      intro:
        'Both tools are located on the QuizCard to demystify complex questions without reading long paragraphs of distractor analysis:',
      keyPoints: [
        'Concept Summary: Condenses the explanation into 1 foundational, architecturally precise principle (e.g. "ExpressRoute never traverses the public internet—it uses dedicated private fiber circuits").',
        'ELI5 Analogy: Translates the mechanics into everyday metaphors (e.g. "Availability Zones are like 3 separate electrical power plants in different corners of your city; if a storm takes down one substation, the other two keep the lights on").',
        'Toggle On/Off: You can toggle either mode on or off at any moment using the buttons on the card or in the Study Zone menu.',
      ],
    },
    tags: ['Concept Summary', 'ELI5 Analogies', 'Mental Models', 'Simplification'],
  },
  {
    id: 'faq-adv-3',
    category: 'Advanced Features',
    question: 'How does the Focus Session Pomodoro timer synchronize across tabs?',
    summary: 'Tracks active study seconds across all open tabs with a 25-minute break chime.',
    richAnswer: {
      intro:
        'The Focus Session widget in the header acts as an anti-fatigue companion:',
      keyPoints: [
        'Cross-Tab Storage Sync: It uses localStorage and the window "storage" event. If you have 3 tabs open, total daily study seconds increment together without double-counting.',
        'Configurable Sessions: Choose 15m, 20m, 25m (standard Pomodoro), 30m, or 45m deep-work blocks.',
        'Restorative Break Alert: At 25 minutes of continuous quizzing, a pleasant chime plays and a modal suggests 3 calming breathing cycles and a rapid 3-question micro-drill.',
        'Daily Target Tracking: Automatically records total daily study time against your daily exam goal.',
      ],
      callout: {
        type: 'info',
        title: 'Audio Settings',
        text: 'The break chime respects your audio preferences; if muted in the footer, visual break alerts still appear smoothly.',
      },
    },
    tags: ['Focus Session', 'Pomodoro', 'Cross-Tab Sync', 'Study Habits'],
  },
  {
    id: 'faq-adv-4',
    category: 'Advanced Features',
    question: 'How does the Grounded Knowledge Assistant cross-reference Microsoft Learn?',
    summary: 'AI tutor grounded in official Microsoft architecture frameworks to eliminate hallucinations.',
    richAnswer: {
      intro:
        'Unlike generic AI chatbots that hallucinate outdated Azure SKU names or deprecated services, the Studio Knowledge Assistant is strictly grounded:',
      keyPoints: [
        'Official Grounding: Answers are verified against official Microsoft Azure Architecture Centers, Microsoft Learn documentation, and the AZ-900 exam syllabus.',
        '1-Click "Ask Tutor": When stumped by any practice question, click "Ask Tutor" to import the exact scenario context directly into the assistant tab.',
        'Dedicated Search Bar: Type any Azure service or query (e.g., "Azure Cosmos DB Consistency Levels" or "Spot VM Eviction Policies") for verified explanations.',
      ],
    },
    tags: ['AI Tutor', 'Knowledge Assistant', 'Microsoft Learn', 'Official Docs'],
  },
  {
    id: 'faq-adv-5',
    category: 'Advanced Features',
    question: 'How do I generate client-side PDF reports of my Domain Confidence and Learning Paths?',
    summary: 'Use the Export Modal or Candidate Guide to generate instant local PDF documents via jsPDF.',
    richAnswer: {
      intro:
        'The Studio provides full client-side PDF generation that runs locally in your browser with zero server dependencies:',
      keyPoints: [
        'Domain Confidence & Learning Path PDF: Open the Export Modal (via Header or Study Zone) and click "Download PDF Report (jsPDF)". It compiles your accuracy percentages, 12-module matrix, and exam readiness badge into a formatted PDF saved to your downloads.',
        'Candidate Manual PDF: Open the User Guide and click "Download / Print PDF" to export the full 5-chapter candidate handbook with all features and FAQs.',
        'Raw Data Backup: You can also export a complete JSON snapshot containing all timestamped question attempts and study notes for offline archival.',
      ],
      callout: {
        type: 'tip',
        title: 'Instant Local Save',
        text: 'Because generation happens via client-side jsPDF, reports download instantly without popup blockers or server delays.',
      },
    },
    tags: ['PDF Generation', 'jsPDF', 'Domain Report', 'Progress Export'],
  },

  // -------------------------------------------------------------
  // CATEGORY 4: SECURITY, PRIVACY & SYNC (KDPA 2019 • M-PESA • CROSS-PLATFORM)
  // -------------------------------------------------------------
  {
    id: 'faq-sec-1',
    category: 'Security, Privacy & Sync',
    question: 'How does Authentication work and keep daily long-hour study sessions secure?',
    summary: 'OAuth 2.0 & JWT tokens with silent background renewal keep multi-hour sessions uninterrupted.',
    richAnswer: {
      intro:
        'The Studio uses encrypted token-based authentication designed for reliable daily study—even across 3 to 6+ hour marathon exam-prep sessions:',
      keyPoints: [
        'Token-Only Identity: Sign in via Google Cloud / Firebase OAuth 2.0 or Supabase/Postgres credentials. Raw passwords are never stored in browser localStorage.',
        'Silent Long-Hour Token Refresh: An automatic background heartbeat renews your authentication token every 25 minutes and whenever your screen wakes up, preventing sudden logouts mid-quiz or during timed Mock Exams.',
        'Local-First Safety Net: Every answer, confidence rating, and study note is saved locally first before syncing to the cloud—so brief Wi-Fi drops never lose your work.',
        'Input & Session Hardening: All user inputs and API requests are sanitized and bound to your authenticated UID with strict role-based access rules.',
      ],
      callout: {
        type: 'info',
        title: 'Authentication Disclaimer',
        text: 'On personal phones and laptops, your session remains safely persisted for daily study. Always click "Sign Out" in the header when studying on shared cybercafé, library, or workplace computers.',
      },
    },
    tags: ['Authentication', 'Long-Hour Security', 'OAuth 2.0', 'Session Refresh', 'Disclaimer'],
  },
  {
    id: 'faq-sec-2',
    category: 'Security, Privacy & Sync',
    question: 'How is my data protected under the Kenya Data Protection Act (KDPA, 2019)?',
    summary: 'Strict data minimization, educational purpose limitation, and full user export/erasure rights.',
    richAnswer: {
      intro:
        'We handle learner data in strict alignment with the Kenya Data Protection Act, No. 24 of 2019 (ODPC Principles) and international privacy standards:',
      keyPoints: [
        'Data Minimization: We collect only your account identifier (email, display name, role) and AZ-900 study telemetry (module mastery scores, quiz attempts, study streak, and personal notes).',
        'Purpose Limitation: Your data is used exclusively to calculate exam readiness, power adaptive weak-area drills, and synchronize your progress across your devices.',
        'Zero Third-Party Sale or Profiling: We never sell, rent, or share learner data with advertisers or external brokers.',
        'Right to Access, Portability & Erasure: You can download a complete JSON or PDF copy of your records at any time via the Export Hub, or reset/clear module history directly in the app.',
      ],
      callout: {
        type: 'warning',
        title: 'Data Privacy Disclaimer (Ref: Kenya Data Protection Act, 2019)',
        text: 'By signing in, you consent to the processing of your learning progress for AZ-900 certification prep. Please do not enter confidential corporate credentials or sensitive personal data into custom study notes.',
      },
    },
    tags: ['Kenya Data Protection Act', 'KDPA 2019', 'Data Privacy', 'ODPC', 'Disclaimer'],
  },
  {
    id: 'faq-sec-3',
    category: 'Security, Privacy & Sync',
    question: 'Can I use the same account on my Mobile Phone and Laptop simultaneously?',
    summary: 'Yes! Real-time Cloud Sync merges progress across mobile and laptop at the same time.',
    richAnswer: {
      intro:
        'You can stay signed in with the same learner account on your mobile phone, tablet, and laptop simultaneously without losing or overwriting progress:',
      keyPoints: [
        'Simultaneous Multi-Device Study: Review Architecture Study Decks on your laptop while answering Quick-Drill flashcards on your phone—both sessions stay active concurrently.',
        'Real-Time Cloud Listeners: Cloud Firestore live listeners (onSnapshot) and PostgreSQL sync reconcile your module scores and premium unlocks across active devices automatically.',
        'Conflict-Free Smart Merging: When two devices sync at once, the engine preserves your highest module mastery score, merges answered questions, and keeps your daily Harambee streak intact.',
        'Live Header Sync Badge: Check the header indicator ("Synced", "Syncing...", or "Offline") at any time to confirm your progress is backed up to the cloud.',
      ],
      callout: {
        type: 'tip',
        title: 'Seamless Device Handoff',
        text: 'Switching between laptop and mobile? Simply bring the app window into focus and your latest cloud mastery scores reconcile automatically within seconds.',
      },
    },
    tags: ['Cross-Platform', 'Simultaneous Use', 'Cloud Sync', 'Mobile & Laptop', 'Multi-Device'],
  },
  {
    id: 'faq-sec-4',
    category: 'Security, Privacy & Sync',
    question: 'Why is M-Pesa supported and how are mobile payments kept secure across devices?',
    summary: 'Safaricom Daraja STK Push keeps PIN entry strictly on your phone SIM Toolkit and unlocks all devices.',
    richAnswer: {
      intro:
        'M-Pesa (Safaricom Daraja API) provides accessible, instant mobile micro-payments for learners across Kenya and East Africa without needing international credit cards:',
      keyPoints: [
        'Zero PIN Exposure in the App: When you trigger an M-Pesa STK Push, the PIN prompt appears strictly on your mobile phone via Safaricom’s encrypted SIM Toolkit. This web app never asks for, sees, or stores your M-Pesa PIN.',
        'Server-Side API Isolation: All Daraja consumer keys, passkeys, and webhook callbacks are processed on our hardened backend server over HTTPS/TLS—never exposed in client browser code.',
        'Instant Cross-Platform Unlock: Once your CheckoutRequestID is confirmed, your account’s premium entitlement syncs immediately to both your mobile phone and laptop.',
        'Verifiable Transaction Logs: Every transaction status (pending, completed, or failed) is logged with an auditable receipt ID tied to your learner UID.',
      ],
      callout: {
        type: 'warning',
        title: 'M-Pesa Security Disclaimer',
        text: 'Always verify the merchant name and amount on your phone screen before entering your M-Pesa PIN. Never type your M-Pesa PIN into any website, chat window, or email.',
      },
    },
    tags: ['M-Pesa', 'Daraja STK Push', 'Payment Security', 'Cross-Platform Unlock', 'Disclaimer'],
  },
];
