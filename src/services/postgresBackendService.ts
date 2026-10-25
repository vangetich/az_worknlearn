import {
  supabase,
  isSupabaseDirectConfigured,
  PostgresProgressStatus,
  WriteProgressParams,
} from '../lib/supabase';
import {
  authService,
  BackendUserProfile,
  LearnerRole,
  AuthSessionResult,
} from './authService';
import {
  auth,
  syncModuleProgressToFirestore,
  recordQuizSessionToFirestore,
} from '../lib/firebase';

// ============================================================================
// TYPES & CONTRACTS FOR POSTGRESQL BACKEND SERVICE LAYER
// ============================================================================

export type ValidQuizOption = 'A' | 'B' | 'C' | 'D';

export interface SingleQuizSubmitPayload {
  userId?: string;
  questionId: string;
  selectedAnswer: ValidQuizOption;
  recordSession?: boolean;
}

export interface BatchQuizSubmitPayload {
  userId?: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: ValidQuizOption;
  }>;
}

export interface QuizSubmitFeedbackResponse {
  mode: 'single' | 'batch';
  question_id?: string;
  module_id?: number;
  selected_answer?: ValidQuizOption;
  correct_answer?: ValidQuizOption;
  is_correct?: boolean;
  explanation_correct?: string;
  explanation_distractors?: Record<string, string>;
  exam_tip?: string;
  module_progress?: {
    id?: string;
    user_id: string;
    module_id: number;
    score: number;
    status: PostgresProgressStatus;
    attempts_count: number;
    correct_count: number;
    last_attempted: string;
  };
  session?: {
    id: string;
    user_id: string;
    questions_answered: number;
    correct_count: number;
    completed_at: string;
  };
  results?: any[];
  score_percentage?: number;
}

export type MonitoredEndpointPath = '/api/quiz/submit' | '/api/payments/webhook';

export interface EndpointTelemetryPoint {
  id: string;
  timestamp: string;
  epochMs: number;
  quizSubmitLatencyMs: number;
  paymentsWebhookLatencyMs: number;
  quizSubmitErrorRate: number;
  paymentsWebhookErrorRate: number;
  quizSubmitRequests: number;
  paymentsWebhookRequests: number;
  lastEndpointTriggered?: MonitoredEndpointPath;
  lastStatusCode?: number;
}

export interface EndpointSummaryMetrics {
  endpoint: MonitoredEndpointPath;
  totalRequests: number;
  errorCount: number;
  errorRatePercent: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  lastLatencyMs: number;
  lastStatus: number;
}

// ============================================================================
// PURE DATA INTEGRITY & VALIDATION HELPERS
// ============================================================================

const VALID_OPTIONS = new Set<string>(['A', 'B', 'C', 'D']);

/**
 * Validates whether a provided answer option is strictly A, B, C, or D.
 */
export function isValidQuizAnswerOption(option: unknown): option is ValidQuizOption {
  return typeof option === 'string' && VALID_OPTIONS.has(option.trim().toUpperCase());
}

/**
 * Clamps a raw numeric score into the valid PostgreSQL integer range [0, 100].
 */
export function clampMasteryScore(rawScore: number): number {
  if (Number.isNaN(rawScore) || !Number.isFinite(rawScore)) return 0;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Computes the deterministic PostgreSQL `progress_status_enum` value from a clamped score.
 * - `>= 80` => `'mastered'`
 * - `1..79` => `'in_progress'`
 * - `<= 0`  => `'not_started'`
 */
export function computePostgresProgressStatus(score: number): PostgresProgressStatus {
  const clamped = clampMasteryScore(score);
  if (clamped >= 80) return 'mastered';
  if (clamped > 0) return 'in_progress';
  return 'not_started';
}

// ============================================================================
// REAL-TIME ENDPOINT TELEMETRY STORE (/api/quiz/submit & /api/payments/webhook)
// ============================================================================

const INITIAL_TELEMETRY_SERIES: EndpointTelemetryPoint[] = [
  {
    id: 'seed-1',
    timestamp: '10:00:00',
    epochMs: Date.now() - 35000,
    quizSubmitLatencyMs: 42,
    paymentsWebhookLatencyMs: 68,
    quizSubmitErrorRate: 0.8,
    paymentsWebhookErrorRate: 0.4,
    quizSubmitRequests: 18,
    paymentsWebhookRequests: 6,
  },
  {
    id: 'seed-2',
    timestamp: '10:00:05',
    epochMs: Date.now() - 30000,
    quizSubmitLatencyMs: 38,
    paymentsWebhookLatencyMs: 64,
    quizSubmitErrorRate: 0.5,
    paymentsWebhookErrorRate: 0.3,
    quizSubmitRequests: 24,
    paymentsWebhookRequests: 8,
  },
  {
    id: 'seed-3',
    timestamp: '10:00:10',
    epochMs: Date.now() - 25000,
    quizSubmitLatencyMs: 51,
    paymentsWebhookLatencyMs: 79,
    quizSubmitErrorRate: 1.4,
    paymentsWebhookErrorRate: 0.9,
    quizSubmitRequests: 31,
    paymentsWebhookRequests: 11,
  },
  {
    id: 'seed-4',
    timestamp: '10:00:15',
    epochMs: Date.now() - 20000,
    quizSubmitLatencyMs: 35,
    paymentsWebhookLatencyMs: 58,
    quizSubmitErrorRate: 0.4,
    paymentsWebhookErrorRate: 0.2,
    quizSubmitRequests: 29,
    paymentsWebhookRequests: 9,
  },
  {
    id: 'seed-5',
    timestamp: '10:00:20',
    epochMs: Date.now() - 15000,
    quizSubmitLatencyMs: 44,
    paymentsWebhookLatencyMs: 71,
    quizSubmitErrorRate: 0.7,
    paymentsWebhookErrorRate: 0.5,
    quizSubmitRequests: 27,
    paymentsWebhookRequests: 10,
  },
  {
    id: 'seed-6',
    timestamp: '10:00:25',
    epochMs: Date.now() - 10000,
    quizSubmitLatencyMs: 33,
    paymentsWebhookLatencyMs: 55,
    quizSubmitErrorRate: 0.3,
    paymentsWebhookErrorRate: 0.2,
    quizSubmitRequests: 34,
    paymentsWebhookRequests: 12,
  },
  {
    id: 'seed-7',
    timestamp: '10:00:30',
    epochMs: Date.now() - 5000,
    quizSubmitLatencyMs: 39,
    paymentsWebhookLatencyMs: 62,
    quizSubmitErrorRate: 0.5,
    paymentsWebhookErrorRate: 0.3,
    quizSubmitRequests: 36,
    paymentsWebhookRequests: 14,
  },
];

class PostgresBackendService {
  private telemetryHistory: EndpointTelemetryPoint[] = [...INITIAL_TELEMETRY_SERIES];
  private rawSamples: Record<
    MonitoredEndpointPath,
    Array<{ latencyMs: number; status: number; isError: boolean; timestamp: number }>
  > = {
    '/api/quiz/submit': [
      { latencyMs: 42, status: 200, isError: false, timestamp: Date.now() - 35000 },
      { latencyMs: 38, status: 200, isError: false, timestamp: Date.now() - 30000 },
      { latencyMs: 51, status: 200, isError: false, timestamp: Date.now() - 25000 },
      { latencyMs: 35, status: 200, isError: false, timestamp: Date.now() - 20000 },
      { latencyMs: 44, status: 200, isError: false, timestamp: Date.now() - 15000 },
      { latencyMs: 33, status: 200, isError: false, timestamp: Date.now() - 10000 },
      { latencyMs: 39, status: 200, isError: false, timestamp: Date.now() - 5000 },
    ],
    '/api/payments/webhook': [
      { latencyMs: 68, status: 200, isError: false, timestamp: Date.now() - 35000 },
      { latencyMs: 64, status: 200, isError: false, timestamp: Date.now() - 30000 },
      { latencyMs: 79, status: 200, isError: false, timestamp: Date.now() - 25000 },
      { latencyMs: 58, status: 200, isError: false, timestamp: Date.now() - 20000 },
      { latencyMs: 71, status: 200, isError: false, timestamp: Date.now() - 15000 },
      { latencyMs: 55, status: 200, isError: false, timestamp: Date.now() - 10000 },
      { latencyMs: 62, status: 200, isError: false, timestamp: Date.now() - 5000 },
    ],
  };

  /**
   * Submits a single quiz answer to `POST /api/quiz/submit`, validates inputs,
   * records telemetry latency/error rates, and syncs module progress.
   */
  public async submitQuizAnswer(
    params: SingleQuizSubmitPayload
  ): Promise<QuizSubmitFeedbackResponse> {
    const cleanQuestionId = (params.questionId || '').trim();
    if (!cleanQuestionId) {
      this.recordEndpointSample('/api/quiz/submit', 4, 400);
      throw new Error('question_id is required to submit a quiz answer.');
    }

    const normalizedOption =
      typeof params.selectedAnswer === 'string'
        ? params.selectedAnswer.trim().toUpperCase()
        : '';

    if (!isValidQuizAnswerOption(normalizedOption)) {
      this.recordEndpointSample('/api/quiz/submit', 5, 400);
      throw new Error(
        'Invalid selected_answer: must be one of A, B, C, or D.'
      );
    }

    const resolvedUserId =
      params.userId ||
      auth.currentUser?.uid ||
      authService.getStoredBackendUser()?.id ||
      'usr-default-learner';

    const startTime = Date.now();

    // 1. Optional direct Supabase RPC if configured
    if (isSupabaseDirectConfigured) {
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          'evaluate_quiz_submission',
          {
            p_user_id: resolvedUserId,
            p_question_id: cleanQuestionId,
            p_selected_answer: normalizedOption,
          }
        );
        if (!rpcError && rpcData) {
          const elapsed = Math.max(1, Date.now() - startTime);
          this.recordEndpointSample('/api/quiz/submit', elapsed, 200);
          return rpcData as QuizSubmitFeedbackResponse;
        }
      } catch {
        // Fallback to Express Postgres API
      }
    }

    // 2. Call POST /api/quiz/submit on the backend
    const headers = await authService.getAuthHeaders(resolvedUserId);
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: resolvedUserId,
        question_id: cleanQuestionId,
        selected_answer: normalizedOption,
        record_session: params.recordSession ?? true,
      }),
    });

    const elapsed = Math.max(1, Date.now() - startTime);
    const data = await response.json();

    this.recordEndpointSample('/api/quiz/submit', elapsed, response.status);

    if (!response.ok) {
      throw new Error(data.error || `Quiz submission failed with HTTP ${response.status}`);
    }

    // Sync to Cloud Firestore if authenticated with Firebase
    if (auth.currentUser && data.module_progress) {
      try {
        await syncModuleProgressToFirestore(
          auth.currentUser.uid,
          data.module_progress.module_id,
          clampMasteryScore(data.module_progress.score),
          computePostgresProgressStatus(data.module_progress.score)
        );
      } catch {
        // non-fatal Firestore sync
      }
    }

    return data as QuizSubmitFeedbackResponse;
  }

  /**
   * Submits a batch of quiz answers to `POST /api/quiz/submit` and returns aggregate session feedback.
   */
  public async submitBatchQuizAnswers(
    params: BatchQuizSubmitPayload
  ): Promise<QuizSubmitFeedbackResponse> {
    if (!Array.isArray(params.answers) || params.answers.length === 0) {
      this.recordEndpointSample('/api/quiz/submit', 3, 400);
      throw new Error('Batch submission requires a non-empty answers array.');
    }

    for (const item of params.answers) {
      if (!item.questionId || !isValidQuizAnswerOption(item.selectedAnswer)) {
        this.recordEndpointSample('/api/quiz/submit', 4, 400);
        throw new Error(
          'Every batch answer item must contain a valid questionId and selectedAnswer (A, B, C, or D).'
        );
      }
    }

    const resolvedUserId =
      params.userId ||
      auth.currentUser?.uid ||
      authService.getStoredBackendUser()?.id ||
      'usr-default-learner';

    const startTime = Date.now();
    const headers = await authService.getAuthHeaders(resolvedUserId);

    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: resolvedUserId,
        answers: params.answers.map((a) => ({
          question_id: a.questionId.trim(),
          selected_answer: a.selectedAnswer,
        })),
      }),
    });

    const elapsed = Math.max(1, Date.now() - startTime);
    const data = await response.json();
    this.recordEndpointSample('/api/quiz/submit', elapsed, response.status);

    if (!response.ok) {
      throw new Error(data.error || 'Batch quiz submission failed.');
    }

    return data as QuizSubmitFeedbackResponse;
  }

  /**
   * Writes a single module's progress update to the PostgreSQL backend (`/api/user/progress/sync`),
   * enforcing score clamping (0-100) and deterministic status computation.
   */
  public async updateModuleProgress(params: WriteProgressParams) {
    if (
      typeof params.moduleId !== 'number' ||
      params.moduleId < 1 ||
      params.moduleId > 12
    ) {
      throw new Error('moduleId must be an integer between 1 and 12.');
    }

    const resolvedUserId =
      params.userId ||
      auth.currentUser?.uid ||
      authService.getStoredBackendUser()?.id ||
      'usr-default-learner';

    const clampedScore = clampMasteryScore(params.score);
    const computedStatus: PostgresProgressStatus =
      params.status || computePostgresProgressStatus(clampedScore);
    const attempts = Math.max(1, params.attemptsCount ?? 1);
    const correct = Math.max(
      0,
      Math.min(
        attempts,
        params.correctCount ?? Math.round((clampedScore / 100) * attempts)
      )
    );

    if (isSupabaseDirectConfigured) {
      try {
        await (supabase.from('user_progress') as any).upsert(
          {
            user_id: resolvedUserId,
            module_id: params.moduleId,
            score: clampedScore,
            status: computedStatus,
            attempts_count: attempts,
            correct_count: correct,
            last_attempted: new Date().toISOString(),
          },
          { onConflict: 'user_id,module_id' }
        );
      } catch {
        // fallback to backend API
      }
    }

    if (auth.currentUser) {
      try {
        await syncModuleProgressToFirestore(
          auth.currentUser.uid,
          params.moduleId,
          clampedScore,
          computedStatus
        );
      } catch {
        // non-fatal
      }
    }

    const headers = await authService.getAuthHeaders(resolvedUserId);
    const response = await fetch('/api/user/progress/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: resolvedUserId,
        moduleMastery: {
          [params.moduleId]: {
            correct,
            total: attempts,
          },
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        errBody.error || 'Failed to write module progress update to Postgres backend.'
      );
    }

    const payload = await response.json();
    return {
      ...payload,
      normalized: {
        user_id: resolvedUserId,
        module_id: params.moduleId,
        score: clampedScore,
        status: computedStatus,
        attempts_count: attempts,
        correct_count: correct,
      },
    };
  }

  /**
   * Synchronizes a batch of module mastery records and an optional quiz session to the Postgres backend.
   */
  public async syncBatchModuleProgress(params: {
    userId?: string;
    moduleMastery: Record<number, { correct: number; total: number }>;
    session?: { questionsAnswered: number; correctCount: number };
  }) {
    const resolvedUserId =
      params.userId ||
      auth.currentUser?.uid ||
      authService.getStoredBackendUser()?.id ||
      'usr-default-learner';

    const sanitizedMastery: Record<number, { correct: number; total: number }> = {};
    for (const [modIdStr, stats] of Object.entries(params.moduleMastery || {})) {
      const modId = Number(modIdStr);
      if (modId >= 1 && modId <= 12 && stats && stats.total > 0) {
        const total = Math.max(1, Math.round(stats.total));
        const correct = Math.max(0, Math.min(total, Math.round(stats.correct)));
        sanitizedMastery[modId] = { correct, total };
      }
    }

    if (auth.currentUser && params.session && params.session.questionsAnswered > 0) {
      try {
        await recordQuizSessionToFirestore(
          auth.currentUser.uid,
          params.session.questionsAnswered,
          params.session.correctCount
        );
      } catch {
        // non-fatal
      }
    }

    const headers = await authService.getAuthHeaders(resolvedUserId);
    const response = await fetch('/api/user/progress/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: resolvedUserId,
        moduleMastery: sanitizedMastery,
        session: params.session,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to synchronize batch user progress with Postgres backend.');
    }

    return await response.json();
  }

  /**
   * Triggers a payment confirmation webhook call (`POST /api/payments/webhook`) and records latency/error telemetry.
   */
  public async triggerPaymentWebhook(payload: Record<string, any>) {
    const startTime = Date.now();
    const response = await fetch('/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const elapsed = Math.max(1, Date.now() - startTime);
    const data = await response.json().catch(() => ({}));

    this.recordEndpointSample('/api/payments/webhook', elapsed, response.status);

    if (!response.ok) {
      throw new Error(data.error || `Webhook failed with HTTP ${response.status}`);
    }
    return data;
  }

  /**
   * Unified authentication state handler for login, signup, logout, and session restoration.
   */
  public async handleAuthStateAction(
    action: 'login' | 'signup' | 'logout' | 'restore',
    payload?: {
      email?: string;
      password?: string;
      fullName?: string;
      role?: LearnerRole;
    }
  ): Promise<{
    isAuthenticated: boolean;
    user: BackendUserProfile | null;
    token: string | null;
    sessionResult?: AuthSessionResult;
  }> {
    if (action === 'logout') {
      await authService.logout();
      return {
        isAuthenticated: false,
        user: null,
        token: null,
      };
    }

    if (action === 'restore') {
      const storedUser = authService.getStoredBackendUser();
      const storedToken = authService.getStoredBackendToken();
      return {
        isAuthenticated: Boolean(storedUser && storedToken),
        user: storedUser,
        token: storedToken || null,
      };
    }

    if (action === 'signup') {
      if (!payload?.email) {
        throw new Error('Email is required for signup state transition.');
      }
      const res = await authService.signup({
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName || 'AZ-900 Learner',
        role: payload.role || 'student',
      });
      return {
        isAuthenticated: true,
        user: res.user,
        token: res.token,
        sessionResult: res,
      };
    }

    if (!payload?.email) {
      throw new Error('Email is required for login state transition.');
    }
    const res = await authService.login({
      email: payload.email,
      password: payload.password,
      role: payload.role,
    });
    return {
      isAuthenticated: true,
      user: res.user,
      token: res.token,
      sessionResult: res,
    };
  }

  /**
   * Records a real-time request sample for `/api/quiz/submit` or `/api/payments/webhook`
   * and appends a new telemetry point for the Recharts monitoring dashboard.
   */
  public recordEndpointSample(
    endpoint: MonitoredEndpointPath,
    latencyMs: number,
    statusCode: number
  ): EndpointTelemetryPoint {
    const cleanLatency = Math.max(1, Math.round(latencyMs));
    const isError = statusCode >= 400;
    const now = Date.now();

    this.rawSamples[endpoint].push({
      latencyMs: cleanLatency,
      status: statusCode,
      isError,
      timestamp: now,
    });

    if (this.rawSamples[endpoint].length > 50) {
      this.rawSamples[endpoint].shift();
    }

    const quizSamples = this.rawSamples['/api/quiz/submit'];
    const webhookSamples = this.rawSamples['/api/payments/webhook'];

    const quizErrorCount = quizSamples.filter((s) => s.isError).length;
    const webhookErrorCount = webhookSamples.filter((s) => s.isError).length;

    const prevPoint =
      this.telemetryHistory[this.telemetryHistory.length - 1] ||
      INITIAL_TELEMETRY_SERIES[INITIAL_TELEMETRY_SERIES.length - 1];

    const newPoint: EndpointTelemetryPoint = {
      id: `pt-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(now).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      epochMs: now,
      quizSubmitLatencyMs:
        endpoint === '/api/quiz/submit' ? cleanLatency : prevPoint.quizSubmitLatencyMs,
      paymentsWebhookLatencyMs:
        endpoint === '/api/payments/webhook'
          ? cleanLatency
          : prevPoint.paymentsWebhookLatencyMs,
      quizSubmitErrorRate: Number(
        ((quizErrorCount / Math.max(1, quizSamples.length)) * 100).toFixed(1)
      ),
      paymentsWebhookErrorRate: Number(
        ((webhookErrorCount / Math.max(1, webhookSamples.length)) * 100).toFixed(1)
      ),
      quizSubmitRequests: quizSamples.length,
      paymentsWebhookRequests: webhookSamples.length,
      lastEndpointTriggered: endpoint,
      lastStatusCode: statusCode,
    };

    this.telemetryHistory = [...this.telemetryHistory.slice(-19), newPoint];

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('az900-telemetry-updated', { detail: newPoint })
      );
    }

    return newPoint;
  }

  /**
   * Returns the time-series history and aggregated KPIs (avg latency, p95 latency, error rate)
   * for `/api/quiz/submit` and `/api/payments/webhook`.
   */
  public getEndpointTelemetrySnapshot(): {
    series: EndpointTelemetryPoint[];
    summaries: Record<MonitoredEndpointPath, EndpointSummaryMetrics>;
  } {
    const computeSummary = (
      endpoint: MonitoredEndpointPath
    ): EndpointSummaryMetrics => {
      const list = this.rawSamples[endpoint];
      if (list.length === 0) {
        return {
          endpoint,
          totalRequests: 0,
          errorCount: 0,
          errorRatePercent: 0,
          avgLatencyMs: 0,
          p95LatencyMs: 0,
          lastLatencyMs: 0,
          lastStatus: 200,
        };
      }
      const latencies = list.map((s) => s.latencyMs).sort((a, b) => a - b);
      const sum = latencies.reduce((acc, v) => acc + v, 0);
      const p95Index = Math.min(
        latencies.length - 1,
        Math.floor(latencies.length * 0.95)
      );
      const errorCount = list.filter((s) => s.isError).length;
      const latest = list[list.length - 1];

      return {
        endpoint,
        totalRequests: list.length,
        errorCount,
        errorRatePercent: Number(((errorCount / list.length) * 100).toFixed(1)),
        avgLatencyMs: Math.round(sum / list.length),
        p95LatencyMs: latencies[p95Index],
        lastLatencyMs: latest.latencyMs,
        lastStatus: latest.status,
      };
    };

    return {
      series: [...this.telemetryHistory],
      summaries: {
        '/api/quiz/submit': computeSummary('/api/quiz/submit'),
        '/api/payments/webhook': computeSummary('/api/payments/webhook'),
      },
    };
  }

  /**
   * Fetches latest backend request telemetry from GET /api/telemetry,
   * merging any server-side recorded samples into the local telemetry cache.
   */
  public async fetchBackendTelemetry(): Promise<{
    series: EndpointTelemetryPoint[];
    summaries: Record<MonitoredEndpointPath, EndpointSummaryMetrics>;
  }> {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.series) && data.series.length > 0) {
          this.telemetryHistory = data.series;
        }
        if (data.summaries) {
          return {
            series: data.series || this.telemetryHistory,
            summaries: data.summaries,
          };
        }
      }
    } catch {
      // Fallback gracefully to local snapshot
    }
    return this.getEndpointTelemetrySnapshot();
  }

  /**
   * Resets the telemetry buffer to initial baseline (useful for deterministic unit tests).
   */
  public resetTelemetryForTests(): void {
    this.telemetryHistory = [...INITIAL_TELEMETRY_SERIES];
    this.rawSamples['/api/quiz/submit'] = [
      { latencyMs: 40, status: 200, isError: false, timestamp: Date.now() },
    ];
    this.rawSamples['/api/payments/webhook'] = [
      { latencyMs: 60, status: 200, isError: false, timestamp: Date.now() },
    ];
  }
}

export const postgresBackendService = new PostgresBackendService();
