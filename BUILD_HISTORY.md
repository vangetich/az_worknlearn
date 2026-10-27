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

---

## 📅 Phase 13: M-Pesa Daraja Payment Gateway & Subscription Cost Transparency
- **M-Pesa Daraja Mobile Money Integration (`MpesaPaymentGateway.tsx` & `SubscriptionPanel.tsx`)**:
  - Engineered an interactive M-Pesa payment gateway powered by Safaricom Daraja API STK Push (`POST /api/payments/mpesa/stk-push`) alongside Stripe card processing.
  - Added Kenyan phone number auto-formatting (`07...`, `01...`, `+254...`), simulated 60-second STK prompt push countdown, status polling, and instant ledger auditing.
- **Subscription Cost Transparency (`SubscriptionTierSelection.tsx`)**:
  - Designed a transparent pricing breakdown modal displaying individual module costs (KSh 1,299 / $9.99) vs. the All-Access bundle (KSh 3,899 / $29.99 with 67% discount savings), clarifying value per learning domain.
- **Payment Gatekeeper Helper UI (`PaymentGatekeeper.tsx`)**:
  - Added an inline 'Authorize Payment Method' helper guide when users encounter locked premium modules, explaining payment options and providing one-click authorization navigation to the Subscription Panel.

---

## 📅 Phase 14: Multi-Factor Authentication (Admin 2FA & User Profile MFA)
- **Admin Console 2FA Layer (`TwoFactorAuthModal.tsx` & `adminSecurity.ts`)**:
  - Added a mandatory TOTP 2FA authentication challenge (`POST /api/admin/verify-2fa`) when signing into the Admin Console, protecting cloud sync, student accounts, and curriculum management.
- **User Profile MFA Security Setup (`MfaSecurityModal.tsx`)**:
  - Created a dedicated MFA setup modal in the User Profile tab allowing individual students to configure TOTP Multi-Factor Authentication for their own accounts (with QR codes, secret keys, and backup recovery codes) independent of admin 2FA.

---

## 📅 Phase 15: Peer Challenge Mode, Offline Markdown Export & Collapsible Controls
- **Cohort Peer Challenge Mode (`PeerChallengeModal.tsx`)**:
  - Built a deterministic seeded 5-question micro-drill engine (`hashChallengeCode(code)`) that ensures every learner who enters the same challenge code or link (`?peer_challenge=CODE`) gets the exact same questions in the same sequence.
  - Integrated an interactive Cohort Peer Invitation Hub with 1-click invites for the Global Harambee Azure Cohort or custom peer handles.
  - Implemented high-precision `0.1s` completion timer, question-by-question split times (`Q1`–`Q5`), live ghost pace bar, and persisted leaderboard.
- **Offline Markdown Study Export (`exportNotesMarkdown.ts`)**:
  - Added custom memory anchor pinning from any question's exam tip or the Quick Notes Drawer.
  - Added export functionality to download all personal question notes, pinned anchors, bookmarked anchors, and core AZ-900 curriculum memory anchors as a structured `.md` study file (`az900-notes-and-memory-anchors-YYYY-MM-DD.md`).
- **Single-Line & Collapsible Practice Control Toolbar (`App.tsx`)**:
  - Consolidated **Sort: Adaptive Default**, **Diff: All Levels (Adaptive Auto)**, **Heatmap**, **Maps**, **Study Zone**, **Peer Challenge**, and **Notes .MD** into a single horizontal row.
  - Added a **Hide Controls / Show Controls** toggle that collapses the entire toolbar into an ultra-slim header strip (`Toolbar Hidden: Sort • Diff • Heatmap • Maps • Study Zone — Show Controls`) for distraction-free practice.

---

## 📅 Phase 16: Micro-Drill Progress Percentage Sparkline & Remaining Effort Visualization
- **Mini Sparkline Chart Integration (`MicroDrillModal.tsx` & `MicroDrillSparkline`)**:
  - Embedded an interactive SVG mini sparkline chart into `MicroDrillModal.tsx` displaying the student's exact progress percentage (`0%` to `100%`) across the 5-question micro-drill sequence.
  - Visualized remaining effort dynamically: displays completed trajectory curve with emerald gradient area shading, active question pulsing beacon, discrete milestone node rings (`Q1` through `Q5`), and a dashed amber forward trajectory line showing the remaining effort required to reach mastery.
  - Added real-time effort metrics badge: updates per question to show remaining questions count and percentage (e.g., `Remaining Effort: 3 Q (60% left)` down to `Goal Reached • 0 Q Remaining`).
  - Integrated the sparkline into both active sequence questions and final completion review screens.

---

## 📅 Phase 17: Mobile Touch-Friendly Overflow Menu & Disappearing Brand Title with Student Stats Hover Pop-up
- **Mobile Practice Control Overflow Menu (`PracticeControlOverflowMenu.tsx` & `App.tsx`)**:
  - Engineered a touch-friendly overflow menu for mobile devices (`< md` screens) replacing the wrapping of 'Sort', 'Diff', 'Heatmap', 'Maps', and 'Study Zone' buttons.
  - Features high-touch targets (`min-h-[46px]`), active indicator tags, one-tap sort order switches (5 options), difficulty level overrides (4 options), visual toggles for Heatmap and Maps, and instant Study Zone launch.
- **Disappearing Brand Text on Mobile & Small Tablet Views (`Header.tsx`)**:
  - Made "Azure Cloud Explorer AZ-900 Fundamentals Practice Studio" a disappearing set of text on mobile and smaller tablet viewports (`hidden md:block`), displaying exclusively the Azure Cloud logo on compact screens.
- **1/4 Screen Size Student Stats Cloud Pop-up with Randomized Encouraging Message (`StudentStatsCloudPopup.tsx`)**:
  - Built a 1/4 screen size pop-up window triggered by hovering or tapping the Cloud logo in both mobile/tablet and desktop headers.
  - Displays live student core metrics: Overall Accuracy % with visual progress bar, total questions solved & today's count, active study streak days, daily study goal progress, and mastered modules count.
  - Carries an automatically randomized, uplifting encouraging message rooted in Harambee wisdom and Azure exam preparation tips with a quick shuffle button.

---

## 📅 Phase 18: Responsive Admin Dashboard & Consolidated Admin Dropdown Menu
- **Consolidated Admin Navigation & Portals Dropdown Menu (`AdminBackOfficeModal.tsx`)**:
  - Replaced sprawling multi-row admin header buttons and tab bars with a neat, unified dropdown menu accessible via the top navigation bar and a mobile sub-header trigger.
  - Consolidated all 9 requested administrative actions and route guard badges into structured, accessible menu sections:
    1. `Whitelist Route Guard: [vangetich@gmail.com]` (live pulse indicator)
    2. `• Hidden from standard student views` (security lock badge)
    3. `Open Cloud Sync & M-Pesa Portal` (direct modal launcher)
    4. `Curriculum Readiness Modal` (audit modal launcher)
    5. `Full REST API Reference` (REST documentation modal launcher)
    6. `1. Admin Dashboard (Users, Passwords & DB CRUD)` (tab switcher)
    7. `2. Cloud Sync, M-Pesa & Curriculum Readiness` (tab switcher)
    8. `3. Whitelist Route Guard & Admin Password` (tab switcher)
    9. `4. Telemetry & SQL Migrations.` (tab switcher)
- **Responsive Tailwind CSS Across All View Window Sizes (`AdminDashboard.tsx`, `AdminBackOfficeModal.tsx`)**:
  - Upgraded modal container to `maxWidth="6xl"` (`max-w-[min(72rem,96vw)]`) for comfortable data-table rendering on wide displays.
  - Integrated a dedicated mobile/tablet sub-header bar (`< lg`) providing a single-line touch trigger for the dropdown menu showing active section title, eliminating multi-line horizontal tab wrapping.
  - Built vertical scroll protection (`max-h-[82vh] overflow-y-auto overscroll-contain`) into the dropdown menu so all actions remain fully reachable on short or landscape mobile screens.
  - Refactored KPI summary cards in `AdminDashboard.tsx` to `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3` and mode switchers to responsive flex columns (`flex-col sm:flex-row`) preventing awkward text wrapping and card clipping on narrow screens (320px–480px).
  - Maintained strict single-admin whitelist authorization (`vangetich@gmail.com`) and RFC 6238 TOTP 2FA security enforcement across all viewports.
