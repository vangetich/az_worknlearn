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

  constructor() {
    this.seedCurriculumAndQuestions();
    this.seedDefaultDemoUser();
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
      full_name: 'Cloud Architect Learner',
      role: 'student',
      is_premium: false,
      unlocked_modules: [1, 2, 3, 4],
      created_at: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.usersByEmail.set(defaultUser.email.toLowerCase(), defaultUser.id);
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
}

export const backendDb = new Az900BackendDatabase();
