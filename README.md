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

### 9. 🏛️ Virtual Study Room Areas, Shared Whiteboard & Cohort Presence Indicator (`Study Hub`)
- Located directly inside the **Study Hub** menu (`GlassyStudyHubDropdown.tsx`) and **Virtual Study Room** (`VirtualStudyRoom.tsx`), featuring **6 specialized Study Room Areas**:
  1. `AZ900-CONCEPTS` — Path 1 Cloud Concepts & Economics Lounge (`25–30%`)
  2. `AZ900-SERVICES` — Path 2 Core Architecture, Compute & Storage Lab (`35–40%`)
  3. `AZ900-SECURITY` — Path 2 Entra ID, Zero Trust & Defense-in-Depth Vault (`35–40%`)
  4. `AZ900-GOVERNANCE` — Path 3 Cost, Policy, Locks & Monitoring Command (`30–35%`)
  5. `AZ900-WAR-ROOM` — 700+ Score Timed Mock Exam War Room (`100% Full Syllabus`)
  6. `AZ900-CLINIC` — Harambee Distractor & Misconception Clinic (`High-Yield Traps`)
- **Shared Whiteboard View**: Interactive HTML5 freehand sketching canvas + draggable Azure Concept Cards (`Compute`, `Networking`, `Storage`, `Identity`, `Governance`) synchronized in real time via WebSockets (`/api/collab-ws`) and `/api/study-hub/:roomId/event`.
- **Cohort Member Presence Indicator**: Real-time badge in the Study Room header and area selector showing how many other cohort members are currently active in the same study area.
- **Peer Collaboration Chat & Co-Op Solver**: Real-time chat interface, shared scratchpad, and synchronized multi-user option voting.

---

### 10. 🔐 Settings Panel 'Reset Password' Modal (Current Password Verification)
- Accessible directly from the **Settings & Accessibility Panel** (`AccessibilityFontSizeControl.tsx` & `ResetPasswordModal.tsx`).
- Allows users with email-based authentication (`student@az900.ke`, `vangetich@gmail.com`, etc.) to update their account credentials by verifying their **current password** and providing a **new, secure password** via `POST /api/auth/change-password`.

---

### 11. 🛡️ Admin Route Protection Layer & Consolidated Admin Dashboard (`vangetich@gmail.com`)
- **Whitelist Route Protection Layer (`src/utils/adminSecurity.ts`)**:
  - Validates user email credentials against `ADMIN_EMAIL_WHITELIST = ['vangetich@gmail.com']` (`POST /api/admin/verify-access`) to restrict access to **Cloud Sync**, **M-Pesa Daraja STK Push Management**, **Curriculum Readiness**, **User Account Management**, and **Question Bank CRUD**.
  - All sensitive administrative tools are hidden from standard student views and accessible exclusively via authorized administrative login.
- **Consolidated Admin Dashboard (`AdminDashboard.tsx` & `AdminBackOfficeModal.tsx`)**:
  - **User Accounts & Password Resets**: View all registered accounts (`GET /api/admin/users`), manage roles (`student`, `enterprise_user`, `bootcamp_admin`), toggle 12-module premium access, and reset user/admin passwords (`POST /api/admin/users/manage`).
  - **Cloud Sync & M-Pesa Information**: Inspect live M-Pesa Daraja STK Push & Stripe transaction ledgers (`GET /api/admin/payments-ledger`), Cloud Sync status, and launch the full Cloud Sync & M-Pesa portal.
  - **Curriculum Content Edits & Readiness**: Full PostgreSQL/Supabase Question Bank CRUD (`POST/PUT /api/admin/questions`) and Microsoft Learn Curriculum Readiness audits (`GET /api/curriculum/readiness-check`).

---

## 🏗️ Technical Architecture & Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite 6 | Modular SPA with responsive Tailwind CSS v4 styling |
| **Data Visualization** | Recharts 3.10 + D3.js + HTML5 Canvas | Domain Radar, D3 Heatmaps, Shared Whiteboard Canvas, and Telemetry Line Charts |
| **Backend Server** | Express.js (`server.ts`) + WebSocket (`ws`) | REST API proxy, real-time Study Hub WebSockets, M-Pesa/Stripe ledger, and RBAC admin routes |
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
| `POST` | `/api/auth/login` | Authenticates learner or admin credentials and returns session JWT |
| `POST` | `/api/auth/change-password` | Verifies `currentPassword` and updates to `newPassword` for email-authenticated users |
| `POST` | `/api/admin/set-password` | Sets or resets the administrative sign-in password for `vangetich@gmail.com` |
| `POST` | `/api/admin/verify-access` | Validates user email against `ADMIN_EMAIL_WHITELIST` and verifies admin password |
| `GET` | `/api/admin/users` | Returns all user accounts and role/premium metadata for the Admin Dashboard |
| `POST` | `/api/admin/users/manage` | Updates user roles, premium module unlocks, and password resets |
| `GET` | `/api/admin/payments-ledger` | Returns M-Pesa Daraja STK Push & Stripe transaction ledger and Cloud Sync status |
| `GET/POST` | `/api/study-hub/:roomId/event` | Real-time Virtual Study Room state, Shared Whiteboard nodes/strokes, and chat sync |
| `POST` | `/api/quiz/submit` | Records question attempt, latency telemetry, and updates user module progress |
| `POST` | `/api/payments/mpesa/stk-push` | Initiates Safaricom Daraja M-Pesa STK Push transaction |
| `POST` | `/api/payments/webhook` | Processes M-Pesa Daraja & Stripe payment webhooks |
| `GET` | `/api/curriculum/readiness-check` | Audits AZ-900 curriculum alignment and official domain weights |

---

## 📜 Build History
For a complete chronological log of architectural phases, feature implementations, UI/UX refinements, and testing milestones, see **[BUILD_HISTORY.md](./BUILD_HISTORY.md)**, **[HISTORY.md](./HISTORY.md)**, and **[BUILD.md](./BUILD.md)**.

