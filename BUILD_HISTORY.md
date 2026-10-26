# 🏗️ History of Build — AZ-900 Smart Quiz Builder & Adaptive Practice Studio

This document provides the complete chronological engineering history, architectural decisions, feature milestones, and UI/UX refinements for the **Microsoft Azure Fundamentals (AZ-900) Smart Quiz Builder & Adaptive Practice Studio**.

---

## 📅 Phase 1: Core Curriculum & Exam Engine Foundation
- **AZ-900 Official Curriculum Mapping**: Structured the core dataset (`src/data/curriculum.ts`) around Microsoft Learn's three official AZ-900 exam domains:
  1. *Cloud Concepts (25–30%)* — Modules 1 to 3
  2. *Azure Architecture & Services (35–40%)* — Modules 4 to 7
  3. *Azure Management & Governance (30–35%)* — Modules 8 to 11
- **Scenario-Based Question Bank**: Engineered realistic multi-sentence enterprise cloud scenarios with 4 options (`A`, `B`, `C`, `D`), detailed `whyCorrect` explanations, per-option `distractorBreakdown` rationales, and high-yield `examTip` anchors.
- **Local Persistence Engine**: Built `src/utils/storage.ts` to track per-module accuracy, question attempt logs, bookmarks, personal per-question study notes, and consecutive daily study streaks.

---

## 📅 Phase 2: Adaptive Learning Path & Weak Areas Review Mode
- **Dynamic Adaptive Engine (`AdaptiveQuizView.tsx` & `App.tsx`)**:
  - Implemented rolling accuracy tracking across recent question attempts and module-level performance scoring.
  - Prioritizes questions from modules where the learner's accuracy falls below `80%` or where confidence scores (`1–5`) indicate guessing.
  - Dynamically scales difficulty (`Fundamental` → `Intermediate` → `Advanced`) based on consecutive streaks and rolling window accuracy.
- **Persistent Manual Difficulty Selector Override**:
  - Added a persistent difficulty dropdown selector (`All (Adaptive)`, `Fundamental`, `Intermediate`, `Advanced`) in the Practice Workspace Toolbar so users can manually filter the question bank and override automatic difficulty scaling at any time.
- **Weak Areas Review Mode (`PostSessionWeakAreaReview.tsx` & `WeakAreasReviewModal.tsx`)**:
  - Built end-of-session diagnostic analysis that isolates missed concepts, generates targeted weak-area drills, and provides a 5-minute temporary **Quick-Retry Queue** to reinforce challenging modules immediately.

---

## 📅 Phase 3: Interactive Study Mode & Microsoft Learn Integration
- **Study Mode (`StudyDeck.tsx` & `QuickStudyOverlay.tsx`)**:
  - Integrated unit-by-unit study cards mapped to each of the 11 AZ-900 modules, complete with official Microsoft Learn documentation links, architectural comparison tables, and interactive readiness checks.
- **In-Question "Study This Topic" & ELI5 Analogies**:
  - Added instant toggles inside `QuizCard.tsx` for **Knowledge Check** side-panels, **Quick Study** overlays, and child-friendly **ELI5 (Explain Like I'm 5)** real-world analogies (e.g., *Apartment vs. Hotel for Shared Responsibility*, *Grocery Store Checkout Lanes for Horizontal vs. Vertical Scaling*).

---

## 📅 Phase 4: Azure Concept Snap & Analyze Distractors Engine
- **Azure Concept Snap (`ScenarioTextWithTooltips.tsx` & `QuizCard.tsx`)**:
  - Built an automated keyword recognizer that highlights Azure services and cloud terminology directly inside both the **Scenario Narrative** and the **Question Prompt** text, plus quick-access service pills below the question.
  - Hovering or clicking any highlighted keyword opens an animated **Azure Concept Snap** card displaying the official service definition, acronym, architectural role, and a button to pin the concept to the side-panel.
- **Analyze Distractors (`QuizCard.tsx`)**:
  - Created an interactive **Analyze Distractors** panel that maps every incorrect answer option (`A`, `B`, `C`, `D`) to a specific **Common Azure Architectural Misconception** (such as *IaaS vs. PaaS Responsibility Boundary Confusion*, *Availability Zone vs. Region Pair Blast Radius Trap*, *Azure Policy vs. RBAC Governance Scope Conflation*, and *ExpressRoute vs. VPN Gateway Transport Misconception*).
  - Provides learners with both why the distractor is tempting and the exact architectural counter-rule for the exam.

---

## 📅 Phase 5: Kenyan & Pan-African Heritage Design System (`.KenyanFlagQuickSortMotifs`)
- **Cultural Visual Identity (`MotifDecorations.tsx` & `src/index.css`)**:
  - Designed custom SVG heritage components including `KenyanFlagQuickSortMotifs`, `MoranShieldMotif`, `MaasaiMedallion`, `KitengeRibbon`, and `WavyAzureFabricMotif`.
- **`.KenyanFlagQuickSortMotifs` Interactive Enhancements**:
  - **180° Trend Indicator CSS Transition**: Engineered a smooth CSS `transform: rotate(180deg)` transition (`cubic-bezier(0.34, 1.56, 0.64, 1)`) on the performance trend arrow element inside `.KenyanFlagQuickSortMotifs` that animates whenever quiz performance score or trend data updates.
  - **CSS-Only Shimmer Loading Animation**: Added a pure CSS `@keyframes kenyanMotifShimmer` pseudo-element sweep on `.KenyanFlagQuickSortMotifs` that triggers automatically whenever Supabase/PostgreSQL dashboard data is in a fetching or syncing state.

---

## 📅 Phase 6: Header Daily Study Goal Ring & Compact Red Sign-Out Transition
- **Daily Study Goal Circular Progress Ring (`Header.tsx`)**:
  - Implemented an animated SVG circular progress ring in the `Header` component that smoothly animates `stroke-dashoffset` as users answer questions throughout the day toward their customizable daily session target (`todayAnsweredCount / dailyGoal`).
- **Compact Red Sign-Out Button with Hover Width Expansion (`Header.tsx`)**:
  - Updated the Sign-Out button to use the `ArrowLeftOnRectangle` icon inside a red button container (`bg-red-600 hover:bg-red-700 text-white`).
  - Applied a smooth CSS width transition (`max-w-[38px] hover:max-w-[136px] transition-all duration-300 ease-in-out overflow-hidden`) so the button stays compact as an icon symbol when idle and smoothly expands on hover to show the `"Sign out"` text.
- **17-Second African Heritage Exit & WhatsApp Handoff (`ExitStudySessionModal.tsx`)**:
  - Built a graceful sign-out confirmation flow featuring a 17-second countdown timer (auto-pausing on interaction), rotating African wisdom proverbs, PDF/JSON snapshot export, and 1-click **WhatsApp Study Summary** sharing to the user's phone.

---

## 📅 Phase 7: Global Peer Leaderboard (`Global Harambee Azure Cohort`)
- **Competitive Peer Benchmarking (`GlobalLeaderboard.tsx`)**:
  - Created the **Global Peer Leaderboard** tab showcasing top performers from the **Global Harambee Azure Cohort** across Nairobi, Lagos, Johannesburg, Addis Ababa, Accra, Kigali, Cairo, Kisumu, London, and Toronto.
  - Ranks learners by **Total Questions Solved**, **Study Streak Days**, and **Overall Accuracy %**, dynamically merging the active user's live statistics into the cohort standings.

---

## 📅 Phase 8: Multi-Cloud Backend, Telemetry Visualization & Vitest Unit Tests
- **Full-Stack Express + PostgreSQL + Firebase Architecture (`server.ts`, `postgresBackendService.ts`, `firestore.rules`)**:
  - Built REST endpoints for `/api/quiz/submit`, `/api/progress/module`, `/api/payments/webhook`, and `/api/telemetry/endpoints`.
  - Implemented client-side resilience with exponential backoff, latency instrumentation, and offline queue synchronization.
- **Recharts Backend Telemetry Visualization (`BackendTelemetryLineChart.tsx` & `ApiDocumentationModal.tsx`)**:
  - Added a live Recharts `LineChart` inside `ApiDocumentationModal` that fetches and visualizes real-time request latency (`ms`) and error rates (`%`) for `/api/quiz/submit` and `/api/payments/webhook`.
- **Vitest Backend Unit Test Suite (`src/services/__tests__/quizBackend.test.ts`)**:
  - Authored comprehensive unit tests verifying `submitQuestionAnswer` and `writeModuleProgress` under simulated network latency, HTTP 5xx failures, timeout aborts, and offline synchronization recovery.

---

## 📅 Phase 9: Comprehensive Documentation & In-App Reader
- Created `/README.md`, `/BUILD_HISTORY.md`, and `/HISTORY.md` in the repository root.
- Integrated an interactive **README & Build History Viewer + Downloader** inside the application's `UserGuideModal` so learners and reviewers can read, copy, or download the full project documentation directly from the UI.

---

## 📅 Phase 10: Virtual Study Room Areas, Shared Whiteboard & Cohort Presence Indicator
- **6 Specialized Virtual Study Room Areas (`src/data/virtualStudyAreas.ts`, `GlassyStudyHubDropdown.tsx`, `VirtualStudyRoom.tsx`)**:
  - Engineered six domain-aligned Virtual Study Room Areas inside the Study Hub: `AZ900-CONCEPTS`, `AZ900-SERVICES`, `AZ900-SECURITY`, `AZ900-GOVERNANCE`, `AZ900-WAR-ROOM`, and `AZ900-CLINIC`.
- **Shared Whiteboard View (`VirtualStudyRoom.tsx` & `server.ts`)**:
  - Added a real-time **Shared Whiteboard** tab inside the Virtual Study Room featuring an interactive HTML5 freehand sketching canvas (multi-color Azure pens) and draggable Azure Architecture Concept Cards (`Compute`, `Networking`, `Storage`, `Identity`, `Governance`).
  - Synchronized whiteboard nodes and freehand strokes across connected cohort members via WebSockets (`/api/collab-ws`) and `/api/study-hub/:roomId/event` (`whiteboard:node:add`, `whiteboard:node:move`, `whiteboard:node:delete`, `whiteboard:stroke:add`, `whiteboard:clear`).
- **Live Cohort Member Presence Indicator**:
  - Added prominent live cohort presence badges in the Virtual Study Room header and area selector bar showing how many other cohort members are currently active in the same study area.

---

## 📅 Phase 11: Settings Panel 'Reset Password' Modal (Current Password Verification)
- **Email Credential Verification & Password Update (`ResetPasswordModal.tsx`, `AccessibilityFontSizeControl.tsx`, `authService.ts`, `server.ts`)**:
  - Created a dedicated **Reset Password** modal accessible directly from all variants of the Settings & Accessibility panel (header popover, inline footer bar, and full settings card).
  - Implemented `POST /api/auth/change-password` and `backendDb.changeUserPassword()` to verify the user's `currentPassword` before updating their account credentials to `newPassword`, complete with real-time password strength checks (`8+ chars`, `Uppercase`, `Number/Symbol`, `Match confirmation`).

---

## 📅 Phase 12: Admin Route Protection Layer & Consolidated Admin Dashboard (`vangetich@gmail.com`)
- **Whitelist Route Protection Layer (`src/utils/adminSecurity.ts` & `POST /api/admin/verify-access`)**:
  - Implemented `ADMIN_EMAIL_WHITELIST = ['vangetich@gmail.com']`, `isWhitelistedAdminEmail()`, and `verifyAdminRouteCredentials()` to guard access to Cloud Sync, M-Pesa management, Curriculum Readiness, User Account Management, and Question Bank CRUD.
  - Hid administrative and curriculum readiness controls from standard student toolbars (`src/App.tsx`) so sensitive administrative tools are only accessible via authorized administrative login.
- **Consolidated Admin Dashboard (`AdminDashboard.tsx` & `AdminBackOfficeModal.tsx`)**:
  - Added **User Accounts & Password Resets** management (`GET /api/admin/users`, `POST /api/admin/users/manage`) alongside **PostgreSQL/Supabase Question Bank CRUD**.
  - Added a dedicated **Cloud Sync, M-Pesa & Curriculum Readiness** tab in `AdminBackOfficeModal.tsx` (`GET /api/admin/payments-ledger`, `GET /api/curriculum/readiness-check`) storing and displaying M-Pesa Daraja STK Push transactions, Cloud Sync status, and official Microsoft Learn readiness audits.

