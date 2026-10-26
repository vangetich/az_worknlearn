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
