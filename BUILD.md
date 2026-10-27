# 🛠️ Build & Architecture Guide — AZ-900 Smart Quiz Builder & Adaptive Practice Studio

> For the chronological engineering log, see **[BUILD_HISTORY.md](./BUILD_HISTORY.md)** and **[HISTORY.md](./HISTORY.md)**.

## 1. Build & Run Commands

```bash
# Install dependencies
npm install

# Run full-stack Express + Vite dev server on port 3000
npm run dev

# Type-check with TypeScript
npm run lint

# Build production client bundle to dist/
npm run build

# Start production Express server
npm start
```

## 2. Newly Integrated Architectural Modules

### A. Virtual Study Room (`Study Hub`) — Chat, Shared Whiteboard & Cohort Presence
- **Files**: `src/components/VirtualStudyRoom.tsx`, `src/data/virtualStudyAreas.ts`, `src/components/GlassyStudyHubDropdown.tsx`, `server.ts`
- **Capabilities**:
  - **6 Specialized Study Room Areas**: `AZ900-CONCEPTS`, `AZ900-SERVICES`, `AZ900-SECURITY`, `AZ900-GOVERNANCE`, `AZ900-WAR-ROOM`, and `AZ900-CLINIC`.
  - **Cohort Presence Indicator**: Real-time indicator showing how many other cohort members are currently active in the same study area.
  - **Shared Whiteboard View**: Interactive HTML5 freehand drawing canvas + draggable Azure Concept Cards (`Compute`, `Networking`, `Storage`, `Identity`, `Governance`) synced in real-time via WebSockets (`/api/collab-ws`) and `POST /api/study-hub/:roomId/event`.
  - **Peer Collaboration Chat & Co-Op Scenario Solver**: Live room chat, shared scratchpad, and synchronized multi-user option voting.

### B. Settings Panel 'Reset Password' Modal
- **Files**: `src/components/ResetPasswordModal.tsx`, `src/components/AccessibilityFontSizeControl.tsx`, `src/services/authService.ts`, `server.ts`
- **Capabilities**:
  - Accessible from the Settings & Accessibility panel (header popover, inline footer bar, and full settings card).
  - Verifies the user's current password (`POST /api/auth/change-password`) before updating to a new secure password for email-authenticated users.

### C. Admin Route Protection Layer & Consolidated Admin Dashboard
- **Files**: `src/utils/adminSecurity.ts`, `src/components/AdminDashboard.tsx`, `src/components/AdminBackOfficeModal.tsx`, `src/backend/store.ts`, `server.ts`
- **Capabilities**:
  - **Route Protection Whitelist**: Validates user email credentials against `ADMIN_EMAIL_WHITELIST = ['vangetich@gmail.com']` (`POST /api/admin/verify-access`) to restrict access to Cloud Sync, M-Pesa management, Curriculum Readiness, User Account Management, and Question Bank CRUD.
  - **Hidden from Standard Student Views**: Administrative and readiness controls are hidden from standard student practice toolbars (`src/App.tsx`) and accessible only via authorized administrative login.
  - **Consolidated Admin Dashboard**: Manages user accounts, roles, premium status, password resets (`GET /api/admin/users`, `POST /api/admin/users/manage`), curriculum content edits (`POST/PUT /api/admin/questions`), M-Pesa Daraja STK Push & Cloud Sync ledger (`GET /api/admin/payments-ledger`), and Curriculum Readiness (`GET /api/curriculum/readiness-check`).

### D. M-Pesa Daraja Payment Gateway & Subscription Cost Transparency
- **Files**: `src/components/MpesaPaymentGateway.tsx`, `src/components/SubscriptionPanel.tsx`, `src/components/SubscriptionTierSelection.tsx`, `src/components/PaymentGatekeeper.tsx`, `server.ts`
- **Capabilities**:
  - **Daraja API STK Push**: Mobile money integration enabling Safaricom M-Pesa payments (`POST /api/payments/mpesa/stk-push`) alongside Stripe card checkout.
  - **STK Push Simulator & Ledger**: 60-second interactive countdown, phone format sanitization (`07...`, `01...`, `+254...`), instant polling, and transaction audit trails.
  - **Subscription Cost Transparency**: Clear cost breakdown comparing single module unlocks (KSh 1,299 / $9.99) vs. All-Access Bundle (KSh 3,899 / $29.99) with explicit bundle savings calculations.
  - **Payment Gatekeeper UI**: Contextual helper card displayed upon accessing locked premium modules, guiding students through payment method authorization and unlocking.

### E. Multi-Factor Authentication (Admin 2FA & User Profile MFA)
- **Files**: `src/components/TwoFactorAuthModal.tsx`, `src/components/MfaSecurityModal.tsx`, `src/utils/adminSecurity.ts`, `server.ts`
- **Capabilities**:
  - **Admin Console 2FA**: Mandatory TOTP authentication layer protecting administrative operations (`POST /api/admin/verify-2fa`).
  - **User Profile MFA Security**: Independent security configuration allowing students to enable/disable TOTP MFA with QR codes, secret setup keys, and emergency backup codes.

### F. Peer Challenge Mode (5-Question Cohort Micro-Drill)
- **Files**: `src/components/PeerChallengeModal.tsx`, `src/components/CohortPerformanceView.tsx`, `src/components/MicroDrillModal.tsx`, `src/App.tsx`
- **Capabilities**:
  - **Deterministic Seeded Questions**: Algorithmic challenge code generator (`hashChallengeCode`) ensuring all participants solve the identical 5 questions in the exact same sequence.
  - **Cohort Invite Hub**: 1-click invitation of peers from the Global Harambee Azure Cohort or custom peer handles, with shareable links (`?peer_challenge=CODE`).
  - **Real-Time Split Times & Ghost Bar**: High-precision `0.1s` completion timer, per-question split times (`Q1`–`Q5`), live cohort ghost pace bar, and persisted historical leaderboards.

### G. Offline Markdown Study Export (.md) & Pinned Anchors
- **Files**: `src/utils/exportNotesMarkdown.ts`, `src/components/QuickNotesDrawer.tsx`, `src/components/QuizCard.tsx`, `src/components/ExportProgressModal.tsx`
- **Capabilities**:
  - **Custom Memory Anchor Pinning**: Allows learners to pin memory anchors from any question's exam tip or the Quick Notes Drawer.
  - **Formatted Markdown Generation**: Compiles personal notes, pinned anchors, bookmarked anchors, and official curriculum anchors into a structured `.md` study handbook (`az900-notes-and-memory-anchors-YYYY-MM-DD.md`) for offline study.

### H. Single-Line & Collapsible Practice Control Toolbar
- **Files**: `src/App.tsx`, `src/components/MotifDecorations.tsx`
- **Capabilities**:
  - **Horizontal Single-Line Alignment**: Aligns **Sort: Adaptive Default**, **Diff: All Levels (Adaptive Auto)**, **Heatmap**, **Maps**, **Study Zone**, **Peer Challenge**, and **Notes .MD** along a sleek single scrollable row.
  - **Neatly Hidden Control Strip**: Toggle that neatly collapses the toolbar into an ultra-slim header strip (`Toolbar Hidden: Sort • Diff • Heatmap • Maps • Study Zone — Show Controls`), maximizing vertical practice workspace.

### I. Micro-Drill Progress Percentage Sparkline & Remaining Effort Visualization
- **Files**: `src/components/MicroDrillModal.tsx` (`MicroDrillSparkline`)
- **Capabilities**:
  - **Mini Sparkline SVG Chart**: Displays real-time progress percentage across the 5-question micro-drill sequence.
  - **Effort Trajectory Dual Curves**: Solid emerald line with gradient fill for completed questions + dashed amber curve illustrating the path and remaining effort required to complete the sequence.
  - **Dynamic Effort Badges**: Visual indicators (`Remaining Effort: 3 Q (60% left)` down to `Goal Reached • 0 Q Remaining`) giving instant feedback on remaining effort.

### J. Mobile Touch-Friendly Overflow Menu & Disappearing Brand Title with Student Stats Hover Pop-up
- **Files**: `src/components/PracticeControlOverflowMenu.tsx`, `src/components/StudentStatsCloudPopup.tsx`, `src/components/Header.tsx`, `src/App.tsx`
- **Capabilities**:
  - **Mobile Touch Overflow Menu**: Replaces multi-line button wrapping on mobile devices (`< md`) with an accessible touch sheet menu (`44px+` targets) for Sort, Diff, Heatmap, Maps, and Study Zone.
  - **Disappearing Title on Mobile & Small Tablets**: Hides "Azure Cloud Explorer AZ-900 Fundamentals Practice Studio" on compact screens (`hidden md:block`), displaying solely the Azure Cloud logo.
  - **1/4 Screen Size Student Stats Pop-up with Encouraging Message**: Hovering or tapping the Cloud logo in either mobile or desktop header opens an approximate 1/4 screen size dossier displaying live student stats and an automatically randomized Harambee encouragement quote.

### K. Responsive Admin Dashboard & Consolidated Admin Dropdown Menu
- **Files**: `src/components/AdminBackOfficeModal.tsx`, `src/components/AdminDashboard.tsx`, `src/components/ResponsiveModalContainer.tsx`
- **Capabilities**:
  - **Consolidated Admin Dropdown Menu**: Groups all 9 administrative actions, portals, and route guard indicators into a neat dropdown menu accessible via the header bar or mobile sub-header trigger:
    1. `Whitelist Route Guard: [vangetich@gmail.com]`
    2. `• Hidden from standard student views`
    3. `Open Cloud Sync & M-Pesa Portal`
    4. `Curriculum Readiness Modal`
    5. `Full REST API Reference`
    6. `1. Admin Dashboard (Users, Passwords & DB CRUD)`
    7. `2. Cloud Sync, M-Pesa & Curriculum Readiness`
    8. `3. Whitelist Route Guard & Admin Password`
    9. `4. Telemetry & SQL Migrations.`
  - **Multi-Viewport Responsive Design**:
    - Mobile/tablet sub-header bar (`< lg`) provides an accessible touch trigger displaying active section title, preventing clunky horizontal tab wrapping.
    - Modal width extended to `maxWidth="6xl"` (`max-w-[min(72rem,96vw)]`).
    - Scroll overflow protection (`max-h-[82vh] overflow-y-auto overscroll-contain`) ensures accessibility on short/landscape mobile viewports.
    - KPI grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) and mode switchers (`flex-col sm:flex-row`) adapt seamlessly across small screens (320px–480px).
  - **Whitelist Security & 2FA**: Strict enforcement of whitelist access (`vangetich@gmail.com`) and RFC 6238 TOTP 2FA remains enforced at all times.


