# Security Specification: AZ-900 Smart Quiz Builder

## 1. Data Invariants
1. **Identity & Ownership**:
   - Every `/users/{userId}` document must have `uid == userId` and `userId == request.auth.uid`.
   - Self-registration via client SDK is restricted to `role == 'student'` and `isPremium == false` unless performed by a verified admin (`isAdmin()`).
   - PII (`email`, `fullName`) inside `/users/{userId}` is strictly isolated: only `isOwner(userId)` or `isAdmin()` may read (`get` or `list`) a user profile.
2. **User Progress (`/user_progress/{progressId}`)**:
   - `userId` must match `request.auth.uid` and reference an existing `/users/$(incoming().userId)` document.
   - `moduleId` must be an integer between `1` and `12`.
   - `score` must be an integer between `0` and `100`.
   - `status` must be one of `'not_started'`, `'in_progress'`, or `'mastered'`.
   - `userId`, `moduleId`, and `createdAt` are immutable once created.
3. **Quiz Sessions (`/quiz_sessions/{sessionId}`)**:
   - `userId` must match `request.auth.uid` and reference an existing `/users/$(incoming().userId)` document.
   - `questionsAnswered` must be between `1` and `200`, and `correctCount` between `0` and `questionsAnswered`.
   - Completed quiz sessions are immutable audit logs (no client updates or deletes).
4. **Payment Transactions (`/payment_transactions/{txId}`)**:
   - `userId` must match `request.auth.uid` and reference an existing `/users/$(incoming().userId)` document.
   - Clients can only create `pending` transactions (`status == 'pending'`).
   - Once a payment reaches a terminal state (`status == 'completed'` or `'failed'`), no further client updates are permitted.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/users/{uid}`.
2. **Self-Privilege Escalation**: Authenticated user creating `/users/{uid}` with `role: "bootcamp_admin"` or `isPremium: true`.
3. **Shadow Field Injection**: Authenticated user updating `/users/{uid}` with an undeclared field `isVerified: true`.
4. **Cross-User PII Read**: Authenticated user `userA` attempting `get` on `/users/userB`.
5. **Unfiltered List Scraping**: Authenticated user attempting `list` on `/user_progress` without filtering `resource.data.userId == request.auth.uid`.
6. **ID Poisoning Attack**: Attempting to create `/user_progress/{2KB_junk_id}` with invalid characters or length > 128.
7. **Orphaned Progress Write**: Attempting to create `/user_progress/{id}` when `/users/{uid}` does not exist.
8. **Score Boundary Overflow**: Attempting to write `score: 999` or `moduleId: 99` to `/user_progress/{id}`.
9. **Immortal Field Mutation**: Attempting to mutate `createdAt` or `userId` on `/user_progress/{id}` during update.
10. **Forged Timestamp**: Attempting to create `/quiz_sessions/{id}` with a client-supplied past/future `completedAt` instead of `request.time`.
11. **Terminal Payment State Reversal**: Attempting to update `/payment_transactions/{txId}` after `status` is already `'completed'`.
12. **Client Payment Self-Approval**: Non-admin user attempting to create `/payment_transactions/{txId}` directly with `status: 'completed'`.
