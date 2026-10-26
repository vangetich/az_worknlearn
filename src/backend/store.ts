import crypto from 'crypto';
import { LEARNING_PATHS } from '../data/curriculum.ts';
import { BUILTIN_QUESTIONS } from '../data/questionBank.ts';

// ============================================================================
// RELATIONAL DATABASE ENTITIES (PostgreSQL-Aligned Schema)
// ============================================================================

export type UserRole = 'student' | 'bootcamp_admin' | 'enterprise_user';
export type ProgressStatus = 'not_started' | 'in_progress' | 'mastered';
export type PaymentGateway = 'mpesa' | 'stripe';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface DbUser {
  id: string; // UUID Primary Key (or Firebase UID)
  email: string; // Unique
  full_name: string;
  role: UserRole;
  is_premium: boolean;
  unlocked_modules: number[]; // Modules 1..12 unlocked for premium practice
  created_at: string;
}

export interface DbLearningPath {
  id: 1 | 2 | 3;
  title: string;
  weight_percentage: string;
  description: string;
}

export interface DbModule {
  id: number;
  path_id: 1 | 2 | 3; // FK -> learning_paths.id
  title: string;
  module_number: number;
  summary: string;
  key_terms: string[];
  is_premium: boolean;
  price_kes: number;
  price_usd: number;
}

export interface DbQuestion {
  id: string;
  module_id: number; // FK -> modules.id
  learning_path_id: 1 | 2 | 3;
  learning_path_title: string;
  module_title: string;
  difficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  scenario_text: string;
  question_text: string;
  options: { letter: string; text: string }[]; // JSONB
  correct_answer: 'A' | 'B' | 'C' | 'D'; // Char(1)
  explanation_correct: string; // Text
  explanation_distractors: { letter: string; reason: string }[]; // JSONB
  exam_tip: string; // Text
}

export interface DbUserProgress {
  id: string; // UUID
  user_id: string; // FK -> users.id
  module_id: number; // FK -> modules.id
  score: number; // 0..100
  status: ProgressStatus;
  attempts_count: number;
  correct_count: number;
  last_attempted: string; // Timestamp
}

export interface DbQuizSession {
  id: string; // UUID
  user_id: string; // FK -> users.id
  questions_answered: number;
  correct_count: number;
  completed_at: string; // Timestamp
}

export interface DbPaymentTransaction {
  id: string; // UUID
  user_id: string; // FK -> users.id
  gateway: PaymentGateway;
  phone_number: string;
  amount: number;
  currency: 'KES' | 'USD';
  module_id: number | 'all';
  checkout_request_id: string;
  merchant_request_id: string;
  receipt_number: string | null;
  status: PaymentStatus;
  created_at: string;
  completed_at: string | null;
}

// ============================================================================
// RELATIONAL STORE ENGINE (Seeded from Official AZ-900 Curriculum & Question Bank)
// ============================================================================

export interface DbCohortLeaderboardEntry {
  id: string;
  user_id?: string;
  name: string;
  avatar: string;
  location: string;
  region: 'East Africa' | 'West Africa' | 'Southern Africa' | 'North & Horn' | 'Global Diaspora';
  cohort: string;
  chapter: string;
  totalAnswered: number;
  streakDays: number;
  accuracy: number;
  masteredModules: number;
  kudosCount: number;
  specialBadge: string;
  recentActivity: string;
  updated_at: string;
}

class Az900BackendDatabase {
  public users = new Map<string, DbUser>();
  public usersByEmail = new Map<string, string>(); // email -> user.id
  public tokens = new Map<string, string>(); // session token -> user.id

  public learningPaths = new Map<number, DbLearningPath>();
  public modules = new Map<number, DbModule>();
  public questions = new Map<string, DbQuestion>();

  // Composite key: `${user_id}::${module_id}` -> DbUserProgress
  public userProgress = new Map<string, DbUserProgress>();
  public quizSessions: DbQuizSession[] = [];
  public paymentTransactions = new Map<string, DbPaymentTransaction>();
  public cohortLeaderboard = new Map<string, DbCohortLeaderboardEntry>();
  public passwordsByEmail = new Map<string, string>(); // email -> password

  constructor() {
    this.seedCurriculumAndQuestions();
    this.seedDefaultDemoUser();
    this.seedGlobalHarambeeCohortLeaderboard();
  }

  private seedCurriculumAndQuestions() {
    LEARNING_PATHS.forEach((lp) => {
      this.learningPaths.set(lp.id, {
        id: lp.id,
        title: lp.title,
        weight_percentage: lp.examWeight,
        description: lp.summary,
      });

      lp.modules.forEach((mod) => {
        // Modules 1-4 are free starter modules; Modules 5-12 are advanced/premium unlockable modules
        const isPremium = mod.id > 4;
        this.modules.set(mod.id, {
          id: mod.id,
          path_id: lp.id,
          title: mod.title,
          module_number: mod.id,
          summary: mod.description,
          key_terms: mod.keyTerms,
          is_premium: isPremium,
          price_kes: 250,
          price_usd: 2,
        });
      });
    });

    BUILTIN_QUESTIONS.forEach((q) => {
      this.questions.set(q.id, {
        id: q.id,
        module_id: q.moduleId,
        learning_path_id: q.learningPathId,
        learning_path_title: q.learningPathTitle,
        module_title: q.moduleTitle,
        difficulty: q.difficulty,
        scenario_text: q.scenario,
        question_text: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation_correct: q.whyCorrect,
        explanation_distractors: q.distractorBreakdown,
        exam_tip: q.examTip,
      });
    });
  }

  private seedDefaultDemoUser() {
    const defaultUser: DbUser = {
      id: 'usr-default-learner',
      email: 'vangetich@gmail.com',
      full_name: 'Vincent Kiprono A. (Lead Administrator)',
      role: 'bootcamp_admin',
      is_premium: true,
      unlocked_modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      created_at: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.usersByEmail.set(defaultUser.email.toLowerCase(), defaultUser.id);
    this.passwordsByEmail.set('vangetich@gmail.com', 'Az900Admin!2026');
  }

  public upsertUser(params: {
    id?: string;
    email: string;
    full_name?: string;
    role?: UserRole;
  }): { user: DbUser; token: string } {
    const cleanEmail = params.email.trim().toLowerCase();
    const existingId =
      (params.id && this.users.has(params.id) ? params.id : undefined) ||
      this.usersByEmail.get(cleanEmail);

    let user: DbUser;
    if (existingId && this.users.has(existingId)) {
      const current = this.users.get(existingId)!;
      user = {
        ...current,
        email: cleanEmail,
        full_name: params.full_name?.trim() || current.full_name,
        role: params.role || current.role,
      };
      this.users.set(user.id, user);
    } else {
      const newId = params.id || `usr-${crypto.randomUUID().slice(0, 12)}`;
      user = {
        id: newId,
        email: cleanEmail,
        full_name: params.full_name?.trim() || cleanEmail.split('@')[0] || 'AZ-900 Learner',
        role: params.role || 'student',
        is_premium: params.role === 'enterprise_user' || params.role === 'bootcamp_admin',
        unlocked_modules:
          params.role === 'enterprise_user' || params.role === 'bootcamp_admin'
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            : [1, 2, 3, 4],
        created_at: new Date().toISOString(),
      };
      this.users.set(user.id, user);
      this.usersByEmail.set(cleanEmail, user.id);
    }

    const token = `az900_tok_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
    this.tokens.set(token, user.id);

    // Ensure all 12 modules have an initialized progress row for this user
    for (let mId = 1; mId <= 12; mId++) {
      const key = `${user.id}::${mId}`;
      if (!this.userProgress.has(key)) {
        this.userProgress.set(key, {
          id: `prog-${user.id}-${mId}`,
          user_id: user.id,
          module_id: mId,
          score: 0,
          status: 'not_started',
          attempts_count: 0,
          correct_count: 0,
          last_attempted: new Date().toISOString(),
        });
      }
    }

    return { user, token };
  }

  public getUserByIdOrDefault(userId?: string): DbUser {
    if (userId && this.users.has(userId)) {
      return this.users.get(userId)!;
    }
    if (userId) {
      // Auto-register Firebase UID if passed directly
      return this.upsertUser({
        id: userId,
        email: `${userId.slice(0, 8)}@az900.studio`,
        full_name: 'Cloud Architect Learner',
        role: 'student',
      }).user;
    }
    return this.users.get('usr-default-learner')!;
  }

  public getUserByEmail(email: string): DbUser | undefined {
    const cleanEmail = email.trim().toLowerCase();
    const userId = this.usersByEmail.get(cleanEmail);
    if (userId && this.users.has(userId)) {
      return this.users.get(userId);
    }
    return undefined;
  }

  public setAdminPassword(
    email: string,
    newPassword: string
  ): { success: boolean; user: DbUser; token: string; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    this.passwordsByEmail.set(cleanEmail, newPassword.trim());

    let user = this.getUserByEmail(cleanEmail);
    if (user) {
      user.role = 'bootcamp_admin';
      user.is_premium = true;
      user.unlocked_modules = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      this.users.set(user.id, user);
    } else {
      const created = this.upsertUser({
        email: cleanEmail,
        full_name: 'Vincent Kiprono A. (Lead Administrator)',
        role: 'bootcamp_admin',
      });
      user = created.user;
      user.is_premium = true;
      user.unlocked_modules = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      this.users.set(user.id, user);
    }

    const token = `az900_tok_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
    this.tokens.set(token, user.id);

    return {
      success: true,
      user,
      token,
      message: `Admin password updated successfully for ${cleanEmail}. Lead administrator privileges granted.`,
    };
  }

  public verifyCredentials(
    email: string,
    password?: string
  ): { isValid: boolean; user?: DbUser; token?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const storedPw = this.passwordsByEmail.get(cleanEmail);
    const user = this.getUserByEmail(cleanEmail);

    if (!storedPw) {
      if (user) {
        const token = `az900_tok_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
        this.tokens.set(token, user.id);
        return { isValid: true, user, token };
      }
      return { isValid: true };
    }

    if (password && password.trim() === storedPw) {
      if (user) {
        const token = `az900_tok_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
        this.tokens.set(token, user.id);
        return { isValid: true, user, token };
      }
      return { isValid: true };
    }

    return { isValid: false };
  }

  public recordAnswerSubmission(params: {
    user_id: string;
    question_id: string;
    selected_answer: 'A' | 'B' | 'C' | 'D';
  }) {
    const user = this.getUserByIdOrDefault(params.user_id);
    const question = this.questions.get(params.question_id);

    if (!question) {
      return null;
    }

    const isCorrect = params.selected_answer === question.correct_answer;
    const key = `${user.id}::${question.module_id}`;
    const existing = this.userProgress.get(key) || {
      id: `prog-${user.id}-${question.module_id}`,
      user_id: user.id,
      module_id: question.module_id,
      score: 0,
      status: 'not_started' as ProgressStatus,
      attempts_count: 0,
      correct_count: 0,
      last_attempted: new Date().toISOString(),
    };

    const nextAttempts = existing.attempts_count + 1;
    const nextCorrect = existing.correct_count + (isCorrect ? 1 : 0);
    const nextScore = Math.round((nextCorrect / nextAttempts) * 100);
    const nextStatus: ProgressStatus =
      nextScore >= 80 && nextAttempts >= 1
        ? 'mastered'
        : nextAttempts > 0
        ? 'in_progress'
        : 'not_started';

    const updatedProgress: DbUserProgress = {
      ...existing,
      attempts_count: nextAttempts,
      correct_count: nextCorrect,
      score: nextScore,
      status: nextStatus,
      last_attempted: new Date().toISOString(),
    };

    this.userProgress.set(key, updatedProgress);

    return {
      question_id: question.id,
      module_id: question.module_id,
      selected_answer: params.selected_answer,
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation_correct: question.explanation_correct,
      explanation_distractors: question.explanation_distractors,
      exam_tip: question.exam_tip,
      module_progress: updatedProgress,
    };
  }

  public recordQuizSession(params: {
    user_id: string;
    questions_answered: number;
    correct_count: number;
  }): DbQuizSession {
    const user = this.getUserByIdOrDefault(params.user_id);
    const session: DbQuizSession = {
      id: `sess-${crypto.randomUUID().slice(0, 12)}`,
      user_id: user.id,
      questions_answered: Math.max(1, params.questions_answered),
      correct_count: Math.max(0, params.correct_count),
      completed_at: new Date().toISOString(),
    };
    this.quizSessions.unshift(session);
    if (this.quizSessions.length > 200) {
      this.quizSessions = this.quizSessions.slice(0, 200);
    }
    return session;
  }

  public getUserProgressReport(userId?: string) {
    const user = this.getUserByIdOrDefault(userId);
    const modulesProgress: (DbUserProgress & {
      module_title: string;
      path_id: 1 | 2 | 3;
      is_unlocked: boolean;
    })[] = [];

    for (let mId = 1; mId <= 12; mId++) {
      const key = `${user.id}::${mId}`;
      const mod = this.modules.get(mId)!;
      const prog = this.userProgress.get(key) || {
        id: `prog-${user.id}-${mId}`,
        user_id: user.id,
        module_id: mId,
        score: 0,
        status: 'not_started' as ProgressStatus,
        attempts_count: 0,
        correct_count: 0,
        last_attempted: user.created_at,
      };
      modulesProgress.push({
        ...prog,
        module_title: mod.title,
        path_id: mod.path_id,
        is_unlocked: user.is_premium || user.unlocked_modules.includes(mId),
      });
    }

    const attemptedModules = modulesProgress.filter((m) => m.attempts_count > 0);
    const masteredCount = modulesProgress.filter((m) => m.status === 'mastered').length;
    const inProgressCount = modulesProgress.filter((m) => m.status === 'in_progress').length;
    const overallScore =
      attemptedModules.length > 0
        ? Math.round(
            attemptedModules.reduce((acc, m) => acc + m.score, 0) / attemptedModules.length
          )
        : 0;

    const userSessions = this.quizSessions.filter((s) => s.user_id === user.id).slice(0, 25);
    const userPayments = Array.from(this.paymentTransactions.values())
      .filter((tx) => tx.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return {
      user,
      summary: {
        overall_mastery_score: overallScore,
        mastered_modules_count: masteredCount,
        in_progress_modules_count: inProgressCount,
        not_started_modules_count: 12 - masteredCount - inProgressCount,
        total_modules: 12,
        total_sessions_completed: userSessions.length,
      },
      user_progress: modulesProgress,
      quiz_sessions: userSessions,
      payment_transactions: userPayments,
    };
  }

  public syncClientMastery(params: {
    user_id: string;
    module_mastery: Record<number, { correct: number; total: number }>;
  }) {
    const user = this.getUserByIdOrDefault(params.user_id);
    Object.entries(params.module_mastery || {}).forEach(([mIdStr, stat]) => {
      const mId = Number(mIdStr);
      if (mId >= 1 && mId <= 12 && stat && stat.total > 0) {
        const score = Math.round((stat.correct / stat.total) * 100);
        const status: ProgressStatus =
          score >= 80 ? 'mastered' : stat.total > 0 ? 'in_progress' : 'not_started';
        const key = `${user.id}::${mId}`;
        this.userProgress.set(key, {
          id: `prog-${user.id}-${mId}`,
          user_id: user.id,
          module_id: mId,
          score,
          status,
          attempts_count: stat.total,
          correct_count: stat.correct,
          last_attempted: new Date().toISOString(),
        });
      }
    });
    return this.getUserProgressReport(user.id);
  }

  public createPaymentTransaction(params: {
    user_id: string;
    gateway: PaymentGateway;
    phone_number: string;
    amount: number;
    currency: 'KES' | 'USD';
    module_id: number | 'all';
    checkout_request_id?: string;
    merchant_request_id?: string;
  }): DbPaymentTransaction {
    const user = this.getUserByIdOrDefault(params.user_id);
    const checkoutId =
      params.checkout_request_id ||
      (params.gateway === 'mpesa'
        ? `ws_CO_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}_${Math.floor(
            100000 + Math.random() * 900000
          )}`
        : `cs_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`);
    const merchantId =
      params.merchant_request_id ||
      `29115-34620561-${Math.floor(1000 + Math.random() * 9000)}`;

    const tx: DbPaymentTransaction = {
      id: `tx-${crypto.randomUUID().slice(0, 12)}`,
      user_id: user.id,
      gateway: params.gateway,
      phone_number: params.phone_number,
      amount: params.amount,
      currency: params.currency,
      module_id: params.module_id,
      checkout_request_id: checkoutId,
      merchant_request_id: merchantId,
      receipt_number: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    this.paymentTransactions.set(checkoutId, tx);
    return tx;
  }

  public completePaymentWebhook(params: {
    checkout_request_id: string;
    result_code?: number;
    receipt_number?: string;
  }): { transaction: DbPaymentTransaction | null; user: DbUser | null } {
    const tx = this.paymentTransactions.get(params.checkout_request_id);
    if (!tx) {
      return { transaction: null, user: null };
    }

    const isSuccess = params.result_code === undefined || params.result_code === 0;
    tx.status = isSuccess ? 'completed' : 'failed';
    tx.completed_at = new Date().toISOString();
    tx.receipt_number =
      params.receipt_number ||
      (isSuccess
        ? `SJK${Math.floor(1000000 + Math.random() * 9000000)}M`
        : null);

    this.paymentTransactions.set(tx.checkout_request_id, tx);

    const user = this.users.get(tx.user_id) || null;
    if (user && isSuccess) {
      if (tx.module_id === 'all') {
        user.is_premium = true;
        user.unlocked_modules = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      } else if (typeof tx.module_id === 'number') {
        if (!user.unlocked_modules.includes(tx.module_id)) {
          user.unlocked_modules = [...user.unlocked_modules, tx.module_id].sort((a, b) => a - b);
        }
        if (user.unlocked_modules.length >= 12) {
          user.is_premium = true;
        }
      }
      this.users.set(user.id, user);
    }

    return { transaction: tx, user };
  }

  public getPaymentTransactionStatus(idOrCheckoutId: string): {
    transaction: DbPaymentTransaction | null;
    user: DbUser | null;
  } {
    let foundTx = this.paymentTransactions.get(idOrCheckoutId) || null;
    if (!foundTx) {
      for (const tx of this.paymentTransactions.values()) {
        if (tx.id === idOrCheckoutId || tx.checkout_request_id === idOrCheckoutId) {
          foundTx = tx;
          break;
        }
      }
    }
    if (!foundTx) {
      return { transaction: null, user: null };
    }
    const user = this.users.get(foundTx.user_id) || this.getUserByIdOrDefault(foundTx.user_id);
    return { transaction: foundTx, user };
  }

  public getAdminModuleStats() {
    const allModules = Array.from(this.modules.values()).sort(
      (a, b) => a.module_number - b.module_number
    );
    const allQuestions = Array.from(this.questions.values());
    const allProgress = Array.from(this.userProgress.values());

    const moduleStats = allModules.map((mod) => {
      const modQuestions = allQuestions.filter((q) => q.module_id === mod.id);
      const modProgress = allProgress.filter((p) => p.module_id === mod.id && p.attempts_count > 0);
      const totalAttempts = modProgress.reduce((sum, p) => sum + p.attempts_count, 0);
      const avgScore =
        modProgress.length > 0
          ? Math.round(modProgress.reduce((sum, p) => sum + p.score, 0) / modProgress.length)
          : 0;
      const masteredLearners = modProgress.filter((p) => p.status === 'mastered').length;
      const masteryRate =
        modProgress.length > 0 ? Math.round((masteredLearners / modProgress.length) * 100) : 0;

      const difficultyBreakdown = {
        Fundamental: modQuestions.filter((q) => q.difficulty === 'Fundamental').length,
        Intermediate: modQuestions.filter((q) => q.difficulty === 'Intermediate').length,
        Advanced: modQuestions.filter((q) => q.difficulty === 'Advanced').length,
      };

      const pathObj = this.learningPaths.get(mod.path_id);

      return {
        module_id: mod.id,
        module_number: mod.module_number,
        title: mod.title,
        path_id: mod.path_id,
        path_title: pathObj?.title || `Learning Path ${mod.path_id}`,
        is_premium_default: mod.id > 4,
        question_count: modQuestions.length,
        difficulty_breakdown: difficultyBreakdown,
        total_attempts: totalAttempts,
        active_learners: modProgress.length,
        avg_score: avgScore,
        mastery_rate: masteryRate,
      };
    });

    return {
      total_modules: allModules.length,
      total_questions: allQuestions.length,
      total_users: this.users.size,
      total_sessions: this.quizSessions.length,
      modules: moduleStats,
    };
  }

  public upsertQuestion(input: {
    id?: string;
    module_id: number;
    difficulty?: 'Fundamental' | 'Intermediate' | 'Advanced';
    scenario_text: string;
    question_text: string;
    options: { letter: string; text: string }[];
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation_correct: string;
    explanation_distractors: Record<string, string> | { letter: string; reason: string }[];
    exam_tip: string;
  }): DbQuestion {
    const modId = Math.max(1, Math.min(12, Number(input.module_id) || 1));
    const mod = this.modules.get(modId)!;
    const pathObj = this.learningPaths.get(mod.path_id)!;

    const existingId = input.id && input.id.trim() ? input.id.trim() : '';
    const questionId =
      existingId || `az900-m${modId}-custom-${Date.now().toString(36)}`;

    const normalizedOptions = (input.options || []).map((opt, idx) => ({
      letter: (opt.letter || ['A', 'B', 'C', 'D'][idx] || 'A').toUpperCase(),
      text: String(opt.text || '').trim(),
    }));

    let normalizedDistractors: { letter: string; reason: string }[] = [];
    if (Array.isArray(input.explanation_distractors)) {
      normalizedDistractors = input.explanation_distractors.map((d) => ({
        letter: String(d.letter).toUpperCase(),
        reason: String(d.reason || '').trim(),
      }));
    } else if (input.explanation_distractors && typeof input.explanation_distractors === 'object') {
      normalizedDistractors = Object.entries(input.explanation_distractors).map(
        ([letter, reason]) => ({
          letter: letter.toUpperCase(),
          reason: String(reason || '').trim(),
        })
      );
    }

    const validDiff = ['Fundamental', 'Intermediate', 'Advanced'].includes(
      input.difficulty || ''
    )
      ? (input.difficulty as 'Fundamental' | 'Intermediate' | 'Advanced')
      : 'Intermediate';

    const validCorrect = ['A', 'B', 'C', 'D'].includes(input.correct_answer)
      ? input.correct_answer
      : 'A';

    const dbQuestion: DbQuestion = {
      id: questionId,
      module_id: mod.id,
      learning_path_id: mod.path_id,
      learning_path_title: pathObj.title,
      module_title: mod.title,
      difficulty: validDiff,
      scenario_text: String(input.scenario_text || '').trim(),
      question_text: String(input.question_text || '').trim(),
      options: normalizedOptions,
      correct_answer: validCorrect,
      explanation_correct: String(input.explanation_correct || '').trim(),
      explanation_distractors: normalizedDistractors,
      exam_tip: String(input.exam_tip || '').trim(),
    };

    this.questions.set(questionId, dbQuestion);
    return dbQuestion;
  }

  private seedGlobalHarambeeCohortLeaderboard() {
    const nowIso = new Date().toISOString();
    const initialPeers: DbCohortLeaderboardEntry[] = [
      {
        id: 'peer-1',
        name: 'Amina Kimani',
        avatar: '🇰🇪',
        location: 'Nairobi, Kenya',
        region: 'East Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Nairobi Savannah Hub',
        totalAnswered: 142,
        streakDays: 14,
        accuracy: 94,
        masteredModules: 12,
        kudosCount: 48,
        specialBadge: 'Azure Architect',
        recentActivity: 'Mastered Module 11: Monitoring & Advisor (96%)',
        updated_at: nowIso,
      },
      {
        id: 'peer-2',
        name: 'Chidi Okonkwo',
        avatar: '🇳🇬',
        location: 'Lagos, Nigeria',
        region: 'West Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Yaba Cloud Explorers',
        totalAnswered: 128,
        streakDays: 12,
        accuracy: 91,
        masteredModules: 11,
        kudosCount: 39,
        specialBadge: 'Centurion',
        recentActivity: 'Completed 45-Min Timed Mock Exam (885/1000)',
        updated_at: nowIso,
      },
      {
        id: 'peer-3',
        name: 'Thabo Mokoena',
        avatar: '🇿🇦',
        location: 'Johannesburg, South Africa',
        region: 'Southern Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Mzansi Azure Guild',
        totalAnswered: 115,
        streakDays: 9,
        accuracy: 88,
        masteredModules: 10,
        kudosCount: 34,
        specialBadge: 'Sharpshooter',
        recentActivity: 'Solved 15 Adaptive Quiz scenarios in a row',
        updated_at: nowIso,
      },
      {
        id: 'peer-4',
        name: 'Abeba Haile',
        avatar: '🇪🇹',
        location: 'Addis Ababa, Ethiopia',
        region: 'North & Horn',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Highland Cloud Chapter',
        totalAnswered: 96,
        streakDays: 8,
        accuracy: 89,
        masteredModules: 9,
        kudosCount: 29,
        specialBadge: 'Master of Modules',
        recentActivity: 'Mastered Module 7: Azure Storage Redundancy',
        updated_at: nowIso,
      },
      {
        id: 'peer-5',
        name: 'Kofi Mensah',
        avatar: '🇬🇭',
        location: 'Accra, Ghana',
        region: 'West Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Black Star Tech Hub',
        totalAnswered: 84,
        streakDays: 7,
        accuracy: 86,
        masteredModules: 8,
        kudosCount: 25,
        specialBadge: 'Consistency Master',
        recentActivity: 'Completed Daily 5-Question Harambee Micro-Drill',
        updated_at: nowIso,
      },
      {
        id: 'peer-6',
        name: 'Claudine Uwase',
        avatar: '🇷🇼',
        location: 'Kigali, Rwanda',
        region: 'East Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Kigali Innovation Hub',
        totalAnswered: 72,
        streakDays: 6,
        accuracy: 92,
        masteredModules: 8,
        kudosCount: 31,
        specialBadge: 'Concepts Sentinel',
        recentActivity: 'Scored 95% on Path 2: Azure Architecture',
        updated_at: nowIso,
      },
      {
        id: 'peer-7',
        name: 'Marcus Vance',
        avatar: '🇬🇧',
        location: 'London, UK',
        region: 'Global Diaspora',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'London Diaspora Cloud Circle',
        totalAnswered: 65,
        streakDays: 5,
        accuracy: 84,
        masteredModules: 7,
        kudosCount: 19,
        specialBadge: 'Azure Explorer',
        recentActivity: 'Reviewed Zero Trust & Entra ID Conditional Access',
        updated_at: nowIso,
      },
      {
        id: 'peer-8',
        name: 'Fatima Al-Mansoor',
        avatar: '🇪🇬',
        location: 'Cairo, Egypt',
        region: 'North & Horn',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Nile Valley Azure League',
        totalAnswered: 58,
        streakDays: 5,
        accuracy: 85,
        masteredModules: 6,
        kudosCount: 22,
        specialBadge: 'Cloud Explorer',
        recentActivity: 'Mastered Module 9: Cost Management & TCO',
        updated_at: nowIso,
      },
      {
        id: 'peer-9',
        name: 'Wanjiku Njoroge',
        avatar: '🇰🇪',
        location: 'Mombasa, Kenya',
        region: 'East Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Swahili Coast Cloud Hub',
        totalAnswered: 51,
        streakDays: 5,
        accuracy: 87,
        masteredModules: 6,
        kudosCount: 20,
        specialBadge: 'Governance Pro',
        recentActivity: 'Completed Azure Policy vs RBAC Scenario Drill',
        updated_at: nowIso,
      },
      {
        id: 'peer-10',
        name: 'David Ochieng',
        avatar: '🇰🇪',
        location: 'Kisumu, Kenya',
        region: 'East Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Lake Victoria Tech Network',
        totalAnswered: 44,
        streakDays: 4,
        accuracy: 82,
        masteredModules: 5,
        kudosCount: 17,
        specialBadge: 'Rookie Builder',
        recentActivity: 'Practicing Module 6: VNets & ExpressRoute',
        updated_at: nowIso,
      },
      {
        id: 'peer-11',
        name: 'Elena Rostova',
        avatar: '🇨🇦',
        location: 'Toronto, Canada',
        region: 'Global Diaspora',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'North Star Azure Group',
        totalAnswered: 36,
        streakDays: 3,
        accuracy: 80,
        masteredModules: 4,
        kudosCount: 14,
        specialBadge: 'Cloud Rookie',
        recentActivity: 'Finished Path 1: Cloud Concepts Fundamentals',
        updated_at: nowIso,
      },
      {
        id: 'peer-12',
        name: 'Baraka Mwakasege',
        avatar: '🇹🇿',
        location: 'Dar es Salaam, Tanzania',
        region: 'East Africa',
        cohort: 'Global Harambee Azure Cohort',
        chapter: 'Kilimanjaro Cloud Guild',
        totalAnswered: 29,
        streakDays: 3,
        accuracy: 83,
        masteredModules: 3,
        kudosCount: 15,
        specialBadge: 'Rising Star',
        recentActivity: 'Started Module 4: Core Architectural Components',
        updated_at: nowIso,
      },
    ];

    initialPeers.forEach((peer) => {
      this.cohortLeaderboard.set(peer.id, peer);
    });
  }

  public getCohortLeaderboard(params?: {
    cohort?: string;
    region?: string;
    sortBy?: 'answered' | 'streak' | 'accuracy' | 'mastered';
  }) {
    const requestedCohort = params?.cohort || 'Global Harambee Azure Cohort';
    const requestedRegion = params?.region || 'all';
    const sortBy = params?.sortBy || 'answered';

    let entries = Array.from(this.cohortLeaderboard.values()).filter(
      (entry) =>
        !requestedCohort ||
        entry.cohort.toLowerCase().includes(requestedCohort.toLowerCase())
    );

    if (requestedRegion && requestedRegion !== 'all') {
      entries = entries.filter(
        (e) => e.region.toLowerCase() === requestedRegion.toLowerCase()
      );
    }

    entries.sort((a, b) => {
      if (sortBy === 'streak') {
        if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
        return b.totalAnswered - a.totalAnswered;
      }
      if (sortBy === 'accuracy') {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.totalAnswered - a.totalAnswered;
      }
      if (sortBy === 'mastered') {
        if (b.masteredModules !== a.masteredModules) {
          return b.masteredModules - a.masteredModules;
        }
        return b.totalAnswered - a.totalAnswered;
      }
      // default: answered
      if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
      return b.accuracy - a.accuracy;
    });

    const allCohortMembers = Array.from(this.cohortLeaderboard.values());
    const totalCohortQuestions = allCohortMembers.reduce(
      (sum, item) => sum + item.totalAnswered,
      0
    );
    const avgCohortAccuracy =
      allCohortMembers.length > 0
        ? Math.round(
            allCohortMembers.reduce((sum, item) => sum + item.accuracy, 0) /
              allCohortMembers.length
          )
        : 86;

    return {
      cohort: 'Global Harambee Azure Cohort',
      fetched_at: new Date().toISOString(),
      total_performers: allCohortMembers.length,
      total_cohort_questions_solved: totalCohortQuestions,
      average_cohort_accuracy: avgCohortAccuracy,
      performers: entries,
    };
  }

  public upsertCohortLeaderboardEntry(input: {
    id?: string;
    user_id?: string;
    name: string;
    avatar?: string;
    location?: string;
    region?: 'East Africa' | 'West Africa' | 'Southern Africa' | 'North & Horn' | 'Global Diaspora';
    chapter?: string;
    totalAnswered: number;
    streakDays: number;
    accuracy: number;
    masteredModules?: number;
    recentActivity?: string;
  }): DbCohortLeaderboardEntry {
    const entryId = input.id || (input.user_id ? `learner-${input.user_id}` : 'current-user');
    const existing = this.cohortLeaderboard.get(entryId);
    const totalAnswered = Math.max(0, Number(input.totalAnswered) || 0);
    const accuracy = Math.max(0, Math.min(100, Number(input.accuracy) || 0));
    const streakDays = Math.max(1, Number(input.streakDays) || 1);
    const masteredModules = Math.max(
      0,
      Math.min(12, Number(input.masteredModules ?? existing?.masteredModules ?? 0))
    );

    const specialBadge =
      accuracy >= 88 && totalAnswered >= 80
        ? 'Azure Architect'
        : totalAnswered >= 100
        ? 'Centurion'
        : masteredModules >= 8
        ? 'Master of Modules'
        : streakDays >= 7
        ? 'Consistency Master'
        : totalAnswered >= 20
        ? 'Azure Explorer'
        : 'Cloud Rookie';

    const updated: DbCohortLeaderboardEntry = {
      id: entryId,
      user_id: input.user_id || existing?.user_id,
      name: (input.name || existing?.name || 'You (Current Aspirant)').trim().slice(0, 80),
      avatar: input.avatar || existing?.avatar || '🌟',
      location: (input.location || existing?.location || 'Nairobi, Kenya').trim().slice(0, 80),
      region: input.region || existing?.region || 'East Africa',
      cohort: 'Global Harambee Azure Cohort',
      chapter: (input.chapter || existing?.chapter || 'Harambee Active Aspirant Hub')
        .trim()
        .slice(0, 80),
      totalAnswered,
      streakDays,
      accuracy,
      masteredModules,
      kudosCount: existing?.kudosCount ?? 18,
      specialBadge,
      recentActivity:
        input.recentActivity ||
        existing?.recentActivity ||
        `Solved ${totalAnswered} AZ-900 practice scenarios (${accuracy}% accuracy)`,
      updated_at: new Date().toISOString(),
    };

    this.cohortLeaderboard.set(entryId, updated);
    return updated;
  }

  public giveCohortKudos(targetId: string): DbCohortLeaderboardEntry | null {
    const entry = this.cohortLeaderboard.get(targetId);
    if (!entry) return null;
    entry.kudosCount = (entry.kudosCount || 0) + 1;
    entry.updated_at = new Date().toISOString();
    this.cohortLeaderboard.set(targetId, entry);
    return entry;
  }
}

export const backendDb = new Az900BackendDatabase();

