# ☁️🇰🇪 Microsoft Azure Fundamentals (AZ-900) Smart Quiz Builder & Adaptive Practice Studio

An interactive, full-stack **Microsoft Certified: Azure Fundamentals (AZ-900)** exam preparation platform engineered with an adaptive learning engine, real-time multi-cloud persistence (PostgreSQL, Supabase & Firebase Firestore), **Azure Concept Snap** in-situ service definitions, **Analyze Distractors** architectural misconception mapping, **Daily Study Goal** animated progress rings, **Global Peer Leaderboard** (*Global Harambee Azure Cohort*), and bespoke **Kenyan & Pan-African Heritage** visual motifs.

---

## 🌟 Core Capabilities & Highlights

### 1. 🧭 Official AZ-900 Learning Path & Module Selector
 aligned with the official Microsoft Learn AZ-900 exam skills outline across **3 Learning Paths** and **11 Modules**:
- **Learning Path 1: Cloud Concepts (25–30% Exam Weight)**
  - Module 1: Cloud Computing & Shared Responsibility Model
  - Module 2: Benefits of Using Cloud Services (High Availability, Scalability, Elasticity, Agility, Geo-Distribution)
  - Module 3: Cloud Service Types (IaaS, PaaS, SaaS & Serverless)
- **Learning Path 2: Azure Architecture & Services (35–40% Exam Weight)**
  - Module 4: Core Architectural Components of Azure (Regions, Availability Zones, Region Pairs, Management Groups, Subscriptions, Resource Groups)
  - Module 5: Azure Compute & Networking Services (VMs, App Service, ACI, AKS, Functions, AVD, VNet, VPN Gateway, ExpressRoute, DNS)
  - Module 6: Azure Storage Services (Blob, Files, Queues, Tables, Disks, Access Tiers, LRS/ZRS/GRS/GZRS, AzCopy, Storage Explorer)
  - Module 7: Azure Identity, Access & Security (Microsoft Entra ID, MFA, Conditional Access, RBAC, Zero Trust, Defender for Cloud, Key Vault)
- **Learning Path 3: Azure Management & Governance (30–35% Exam Weight)**
  - Module 8: Cost Management in Azure (Pricing Calculator, TCO Calculator, Cost Management + Billing, Budgets, Tags)
  - Module 9: Features & Tools for Governance and Compliance (Microsoft Purview, Azure Policy, Resource Locks, Blueprints)
  - Module 10: Features & Tools for Managing and Deploying Azure Resources (Azure Portal, Cloud Shell, CLI, PowerShell, Azure Arc, ARM Templates & Bicep)
  - Module 11: Monitoring Tools in Azure (Azure Advisor, Azure Service Health, Azure Monitor, Log Analytics, Application Insights)

---

### 2. ⚡ Adaptive Learning Path Engine & Persistent Difficulty Selector
- **Dynamic Adaptive Difficulty**: Tracks rolling accuracy across recent attempts, module mastery, and confidence ratings (1–5 scale) to dynamically adjust question difficulty (`Fundamental` → `Intermediate` → `Advanced`) and prioritize low-accuracy modules.
- **Persistent Difficulty Level Dropdown Override**: Located directly in the Practice Workspace Toolbar (`.KenyanFlagQuickSortMotifs`), allowing learners to manually filter the question bank by **`Fundamental`**, **`Intermediate`**, or **`Advanced`** (persisted across sessions in `localStorage`) and override automatic difficulty scaling whenever desired.

---

### 3. 🔍 Analyze Distractors (Azure Architectural Misconception Mapper)
- Integrated directly into `QuizCard`, the **Analyze Distractors** engine explains not only *why* the correct answer works, but systematically deconstructs every incorrect option (`A`, `B`, `C`, `D`).
- Maps each distractor to a **Named Azure Architectural Misconception** (e.g., *IaaS vs. PaaS Responsibility Boundary Confusion*, *Availability Zone vs. Region Pair Blast Radius Trap*, *Azure Policy vs. RBAC Governance Scope Conflation*, *VPN Gateway vs. ExpressRoute Transport Trap*, *CapEx vs. OpEx Financial Model Misconception*), complete with a corrective architectural rule.

---

### 4. ✨ Azure Concept Snap (Hover & Click Service Definition Cards)
- Automatically detects Azure services, architectural terms, and acronyms inside both the **Scenario Context** and the **Question Prompt** text.
- **Hovering** or **clicking** on any highlighted service keyword (or clicking the quick Concept Snap chips below the question) triggers a smooth, animated **Azure Concept Snap** floating card showing:
  - Official Azure Service Definition & Acronym
  - Curriculum Domain & Category Badge
  - Key Exam Anchor Tip & One-Click Side-Panel Pinning

---

### 5. 🎯 Daily Study Goal Circular Progress Ring
- Embedded directly in the `Header` component across mobile, tablet, and desktop viewports.
- Uses an animated SVG circular progress ring (`stroke-dasharray` / `stroke-dashoffset` CSS transition) that fills dynamically as questions are answered throughout the day (`todayAnsweredCount / dailyGoal`).
- Turns emerald/gold upon reaching 100% of the daily target and opens the customizable **Daily Goal & Alerts Modal** on click.

---

### 6. 🏆 Global Peer Leaderboard (`Global Harambee Azure Cohort`)
- Dedicated **Global Peer Leaderboard** tab showcasing top performers from the **Global Harambee Azure Cohort** (Nairobi, Lagos, Johannesburg, Addis Ababa, Accra, Kigali, Cairo, Kisumu, London, Toronto, and your live profile).
- Ranks learners by **Total Questions Solved**, **Active Study Streak**, and **Accuracy %**, with cohort region filters and interactive milestone badges.

---

### 7. 📚 Integrated Study Mode & Weak Areas Review
- **Study This Topic / Study Mode**: Every question links directly to relevant Microsoft Learn AZ-900 documentation units, interactive cheat sheets, ELI5 child-friendly analogies, and unit-by-unit Study Decks.
- **Post-Session Weak Areas Review**: Analyzes session attempts at the end of every practice run, isolates modules with `< 80%` accuracy or skipped questions, and launches a targeted **Weak Areas Review** drill or a 5-minute **Quick-Retry Queue**.

---

### 8. 🇰🇪 Kenyan & Pan-African Heritage Design System
- **`.KenyanFlagQuickSortMotifs` Container**:
  - Features subtle Kenyan flag geometry (Black, Red `#BB0000`, Green `#006600`, White) with a **CSS-only shimmer loading animation** triggered automatically during Supabase/PostgreSQL network sync states.
  - Includes a **Performance Trend Indicator** with a smooth **180-degree CSS transform flip transition** (`rotate(180deg)`) whenever quiz performance trend data updates.
- **Compact Red Sign-Out Button with Hover Expansion**:
  - Uses the `ArrowLeftOnRectangle` icon in a high-contrast red container that remains compact as a symbol when idle and smoothly expands its width via CSS transitions on hover to reveal the `"Sign out"` label.
  - Clicking Sign Out opens the **17-Second African Heritage Exit Modal** featuring curated African proverbs and a 1-click **WhatsApp Study Summary Handoff**.

---

## 🏗️ Technical Architecture & Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite 6 | Modular SPA with responsive Tailwind CSS v4 styling |
| **Data Visualization** | Recharts 3.10 + Custom SVG Gauges | Domain Radar, Accuracy Trajectory, and `/api/quiz/submit` & `/api/payments/webhook` Telemetry Line Charts |
| **Backend Server** | Express.js (`server.ts`) + `tsx` | REST API proxy, Gemini AI scenario generation, telemetry aggregation, and PostgreSQL/Supabase persistence |
| **Cloud Databases** | PostgreSQL + Supabase + Firebase Firestore | Multi-cloud progress sync, RBAC security rules (`firestore.rules`), and offline-first `localStorage` fallback |
| **Audio & Speech** | Web Audio API + Web Speech API | Synthesized answer chimes, hands-free TTS question reader, and SpeechRecognition voice answering/notes |
| **Unit Testing** | Vitest 5 (`npm test`) | Automated unit tests for authentication, PostgreSQL backend latency, and sync error resilience |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** `>= 20.x` (or **Bun** `>= 1.1`)
- **npm** `>= 10.x`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and populate any optional cloud credentials (the app includes resilient local fallback if external database keys are omitted):
```bash
cp .env.example .env
```

Key environment variables (`.env.example`):
- `GEMINI_API_KEY` — Server-side Google Gemini API key for dynamic AZ-900 scenario generation and AI Tutor explanations.
- `DATABASE_URL` — PostgreSQL connection string for persistent module progress and quiz telemetry.
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` — Optional Supabase real-time client configuration.

### 3. Start the Full-Stack Development Server
Runs the Express + Vite middleware server on `http://localhost:3000`:
```bash
npm run dev
```

### 4. Run Unit Tests & Linting
```bash
# Run Vitest unit test suites (including quizBackend.test.ts)
npx vitest run

# Type-check and lint the codebase
npm run lint

# Build production bundle
npm run build
```

---

## 📡 Backend API Endpoints (`server.ts`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server status, database connectivity, and uptime telemetry |
| `POST` | `/api/quiz/submit` | Records question attempt, latency telemetry, and updates user module progress |
| `POST` | `/api/progress/module` | Persists module-level accuracy, completion state, and study streak to PostgreSQL |
| `POST` | `/api/payments/webhook` | Processes premium cohort unlock webhooks with signature verification & latency tracking |
| `GET` | `/api/telemetry/endpoints` | Returns time-series latency (`ms`) and error rate (`%`) telemetry for `/api/quiz/submit` and `/api/payments/webhook` |
| `POST` | `/api/ai/generate-scenario` | Server-side Gemini API route that generates custom AZ-900 exam scenarios with distractor breakdowns |

---

## 📂 Project Directory Structure

```text
├── README.md                                 # Project documentation & setup guide
├── BUILD_HISTORY.md                          # Chronological engineering & feature build history
├── server.ts                                 # Express full-stack backend & API routes
├── firestore.rules                           # Firebase Firestore security rules
├── package.json                              # Dependencies & scripts
└── src/
    ├── App.tsx                               # Main application state, routing & Practice toolbar
    ├── index.css                             # Tailwind CSS v4 + custom Kenyan motif & shimmer animations
    ├── components/
    │   ├── Header.tsx                        # Navigation, Daily Study Goal Ring & compact red Sign-Out button
    │   ├── QuizCard.tsx                      # Scenario reader, Analyze Distractors & Azure Concept Snap
    │   ├── ScenarioTextWithTooltips.tsx      # Hover/Click Azure Concept Snap floating card engine
    │   ├── GlobalLeaderboard.tsx             # Global Harambee Azure Cohort Peer Leaderboard
    │   ├── AdaptiveQuizView.tsx              # Adaptive Learning Path & weak-module prioritization engine
    │   ├── StudyDeck.tsx                     # Interactive Study Mode & Microsoft Learn topic explorer
    │   ├── PostSessionWeakAreaReview.tsx     # End-of-session weak area diagnostics & retry launcher
    │   ├── BackendTelemetryLineChart.tsx     # Recharts latency & error-rate visualization
    │   ├── ApiDocumentationModal.tsx         # Live API documentation & telemetry dashboard
    │   ├── ExitStudySessionModal.tsx         # 17s African Heritage Exit screen & WhatsApp handoff
    │   ├── MotifDecorations.tsx              # KenyanFlagQuickSortMotifs, MoranShield & MaasaiMedallion
    │   └── UserGuideModal.tsx                # Printable User Manual, FAQ & README/Build History viewer
    ├── data/
    │   ├── curriculum.ts                     # Official AZ-900 Learning Paths, Modules & Question Bank
    │   └── faqHelpData.ts                    # Structured FAQ & architectural trap reference
    ├── hooks/
    │   └── usePostgresDatabase.ts            # Real-time PostgreSQL/Supabase synchronization hook
    ├── services/
    │   ├── postgresBackendService.ts         # Backend client with retry, latency tracking & offline queue
    │   ├── authService.ts                    # Authentication & session lifecycle service
    │   └── __tests__/
    │       └── quizBackend.test.ts           # Vitest unit tests for submitQuestionAnswer & writeModuleProgress
    └── utils/
        ├── storage.ts                        # LocalStorage persistence, streak & weak-area calculations
        └── pdfGenerator.ts                   # Printable PDF report & study certificate generator
```

---

## 📜 Build History
For a complete chronological log of architectural phases, feature implementations, UI/UX refinements, and testing milestones, see **[BUILD_HISTORY.md](./BUILD_HISTORY.md)**.
