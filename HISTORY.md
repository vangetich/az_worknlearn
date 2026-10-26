# 🏗️ History of Build — AZ-900 Smart Quiz Builder & Adaptive Practice Studio

> Note: This file mirrors [BUILD_HISTORY.md](./BUILD_HISTORY.md) for convenience so tools or users looking for either `HISTORY.md` or `BUILD_HISTORY.md` have immediate access to the complete chronological build log.

---

## Chronological Summary of Build Milestones

1. **Core AZ-900 Curriculum & Question Engine**
   - Full coverage of Path 1 (*Cloud Concepts 25–30%*), Path 2 (*Azure Architecture & Services 35–40%*), and Path 3 (*Azure Management & Governance 30–35%*) across 11 official Microsoft Learn modules.
   - Scenario-based multiple-choice questions with instant explanations, exam anchor tips, voice dictation/answering, and hands-free TTS audio playback.

2. **Adaptive Learning Path & Persistent Difficulty Selector**
   - Rolling accuracy and module mastery tracking that automatically prioritizes weaker modules and adjusts difficulty (`Fundamental`, `Intermediate`, `Advanced`).
   - Persistent Difficulty Level Dropdown Selector in the Practice Workspace Toolbar allowing manual question bank filtering that overrides dynamic difficulty scaling.

3. **Study Mode & Post-Session Weak Areas Review**
   - Direct `Study This Topic` links to Microsoft Learn AZ-900 curriculum units, ELI5 analogies, and interactive unit-by-unit Study Decks.
   - Automated post-session diagnostics (`PostSessionWeakAreaReview`) with targeted Weak Areas Review drills and a 5-minute Quick-Retry Queue.

4. **Analyze Distractors & Azure Concept Snap**
   - **Analyze Distractors**: Maps every incorrect option (`A`, `B`, `C`, `D`) in `QuizCard` to common Azure architectural misconceptions with corrective prescriptions.
   - **Azure Concept Snap**: Displays an animated floating definition card on hover or click for Azure service keywords mentioned in the question or scenario text.

5. **Header Daily Study Goal Ring & Compact Red Sign-Out Button**
   - **Daily Study Goal Ring**: Animated SVG circular progress ring in the `Header` component tracking daily answered questions toward the user's session target.
   - **Sign-Out Button**: Uses the `ArrowLeftOnRectangle` icon in a red container that stays compact when idle and smoothly expands on hover via CSS transitions to show `"Sign out"`, launching the 17-second African Heritage Exit Modal with WhatsApp summary handoff.

6. **`.KenyanFlagQuickSortMotifs` Shimmer & 180° Trend Indicator**
   - Smooth 180-degree CSS `transform` flip transition (`rotate(180deg)`) on the trend indicator arrow when performance score data updates.
   - Pure CSS shimmer loading animation on `.KenyanFlagQuickSortMotifs` triggered during Supabase/PostgreSQL data fetching states.

7. **Global Peer Leaderboard (`Global Harambee Azure Cohort`)**
   - Competitive leaderboard ranking peers from the *Global Harambee Azure Cohort* by total questions solved, streak days, and accuracy.

8. **Backend Telemetry Visualization & Vitest Unit Tests**
   - Recharts line chart in `ApiDocumentationModal` visualizing `/api/quiz/submit` and `/api/payments/webhook` latency and error rates.
   - Vitest unit test suite in `src/services/__tests__/quizBackend.test.ts` testing `submitQuestionAnswer` and `writeModuleProgress` latency and sync error handling.
