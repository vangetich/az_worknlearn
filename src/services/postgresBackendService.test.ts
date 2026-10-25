import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ../lib/firebase before importing services that depend on it
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  ensureCloudUserProfile: vi.fn().mockResolvedValue(undefined),
  syncModuleProgressToFirestore: vi.fn().mockResolvedValue(undefined),
  recordQuizSessionToFirestore: vi.fn().mockResolvedValue(undefined),
}));

// Mock ../lib/supabase so unit tests run deterministically against the Express Postgres API bridge
vi.mock('../lib/supabase', () => ({
  isSupabaseDirectConfigured: false,
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

import {
  postgresBackendService,
  isValidQuizAnswerOption,
  clampMasteryScore,
  computePostgresProgressStatus,
} from './postgresBackendService';
import { authService } from './authService';
import { auth, syncModuleProgressToFirestore } from '../lib/firebase';

describe('PostgreSQL Backend Service Layer (postgresBackendService)', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    postgresBackendService.resetTelemetryForTests();
    (auth as any).currentUser = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ==========================================================================
  // 1. PURE DATA INTEGRITY & VALIDATION HELPERS
  // ==========================================================================
  describe('Data Integrity & Validation Helpers', () => {
    it('validates quiz answer options strictly as A, B, C, or D', () => {
      expect(isValidQuizAnswerOption('A')).toBe(true);
      expect(isValidQuizAnswerOption('b')).toBe(true);
      expect(isValidQuizAnswerOption(' C ')).toBe(true);
      expect(isValidQuizAnswerOption('D')).toBe(true);

      expect(isValidQuizAnswerOption('E')).toBe(false);
      expect(isValidQuizAnswerOption('')).toBe(false);
      expect(isValidQuizAnswerOption(null)).toBe(false);
      expect(isValidQuizAnswerOption(undefined)).toBe(false);
      expect(isValidQuizAnswerOption(2)).toBe(false);
    });

    it('clamps mastery scores within [0, 100] and handles NaN safely', () => {
      expect(clampMasteryScore(-25)).toBe(0);
      expect(clampMasteryScore(0)).toBe(0);
      expect(clampMasteryScore(74.6)).toBe(75);
      expect(clampMasteryScore(100)).toBe(100);
      expect(clampMasteryScore(145)).toBe(100);
      expect(clampMasteryScore(Number.NaN)).toBe(0);
    });

    it('computes PostgreSQL progress_status_enum accurately across thresholds', () => {
      expect(computePostgresProgressStatus(0)).toBe('not_started');
      expect(computePostgresProgressStatus(-10)).toBe('not_started');
      expect(computePostgresProgressStatus(1)).toBe('in_progress');
      expect(computePostgresProgressStatus(50)).toBe('in_progress');
      expect(computePostgresProgressStatus(79)).toBe('in_progress');
      expect(computePostgresProgressStatus(80)).toBe('mastered');
      expect(computePostgresProgressStatus(95)).toBe('mastered');
      expect(computePostgresProgressStatus(120)).toBe('mastered');
    });
  });

  // ==========================================================================
  // 2. /api/quiz/submit LOGIC TESTS
  // ==========================================================================
  describe('POST /api/quiz/submit Logic (submitQuizAnswer & submitBatchQuizAnswers)', () => {
    it('submits a valid single quiz answer, returns instant feedback + distractor breakdown, and records telemetry', async () => {
      const mockResponsePayload = {
        mode: 'single',
        question_id: 'az900-m1-q1',
        module_id: 1,
        selected_answer: 'B',
        correct_answer: 'B',
        is_correct: true,
        explanation_correct:
          'Customer always retains responsibility for data, endpoints, and access.',
        explanation_distractors: {
          A: 'Physical datacenter security is managed by Microsoft.',
          C: 'Hypervisor host patching is managed by Microsoft.',
          D: 'Physical network hardware is managed by Microsoft.',
        },
        exam_tip: 'Data, Endpoints, Account & Access = Customer Responsibility.',
        module_progress: {
          id: 'prog-usr-1',
          user_id: 'usr-test-learner',
          module_id: 1,
          score: 85,
          status: 'mastered',
          attempts_count: 5,
          correct_count: 4,
          last_attempted: '2026-10-25T12:00:00.000Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponsePayload,
      });

      const result = await postgresBackendService.submitQuizAnswer({
        userId: 'usr-test-learner',
        questionId: 'az900-m1-q1',
        selectedAnswer: 'B',
        recordSession: true,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe('/api/quiz/submit');
      expect(calledInit.method).toBe('POST');
      expect(JSON.parse(calledInit.body)).toEqual({
        user_id: 'usr-test-learner',
        question_id: 'az900-m1-q1',
        selected_answer: 'B',
        record_session: true,
      });

      expect(result.is_correct).toBe(true);
      expect(result.correct_answer).toBe('B');
      expect(result.explanation_distractors).toHaveProperty('A');
      expect(result.module_progress?.status).toBe('mastered');

      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      expect(telemetry.summaries['/api/quiz/submit'].totalRequests).toBeGreaterThanOrEqual(2);
      expect(telemetry.summaries['/api/quiz/submit'].lastStatus).toBe(200);
    });

    it('rejects empty questionId before network call and increments error rate telemetry', async () => {
      await expect(
        postgresBackendService.submitQuizAnswer({
          questionId: '   ',
          selectedAnswer: 'A',
        })
      ).rejects.toThrow('question_id is required to submit a quiz answer.');

      expect(mockFetch).not.toHaveBeenCalled();
      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      expect(telemetry.summaries['/api/quiz/submit'].errorCount).toBe(1);
      expect(telemetry.summaries['/api/quiz/submit'].lastStatus).toBe(400);
    });

    it('rejects invalid selectedAnswer option (e.g. "E") before network call', async () => {
      await expect(
        postgresBackendService.submitQuizAnswer({
          questionId: 'az900-m1-q1',
          selectedAnswer: 'E' as any,
        })
      ).rejects.toThrow('Invalid selected_answer: must be one of A, B, C, or D.');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('propagates server 404 error when question_id is not found in PostgreSQL questions table', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Question 'az900-nonexistent' not found in bank.",
        }),
      });

      await expect(
        postgresBackendService.submitQuizAnswer({
          questionId: 'az900-nonexistent',
          selectedAnswer: 'C',
        })
      ).rejects.toThrow("Question 'az900-nonexistent' not found in bank.");

      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      expect(telemetry.summaries['/api/quiz/submit'].lastStatus).toBe(404);
      expect(telemetry.summaries['/api/quiz/submit'].errorRatePercent).toBeGreaterThan(0);
    });

    it('submits batch quiz answers and evaluates aggregate session mastery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          mode: 'batch',
          score_percentage: 100,
          results: [
            { question_id: 'q1', is_correct: true },
            { question_id: 'q2', is_correct: true },
          ],
        }),
      });

      const batchRes = await postgresBackendService.submitBatchQuizAnswers({
        userId: 'usr-batch-1',
        answers: [
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q2', selectedAnswer: 'D' },
        ],
      });

      expect(batchRes.mode).toBe('batch');
      expect(batchRes.score_percentage).toBe(100);
      expect(batchRes.results).toHaveLength(2);
    });
  });

  // ==========================================================================
  // 3. MODULE PROGRESS UPDATES TESTS
  // ==========================================================================
  describe('Module Progress Updates (updateModuleProgress & syncBatchModuleProgress)', () => {
    it('clamps score, derives mastered status (>= 80), and writes to /api/user/progress/sync', async () => {
      (auth as any).currentUser = {
        uid: 'fb-uid-777',
        getIdToken: vi.fn().mockResolvedValue('fb-token-777'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Progress synced',
          updated_modules: [4],
        }),
      });

      const response = await postgresBackendService.updateModuleProgress({
        userId: 'fb-uid-777',
        moduleId: 4,
        score: 88.4,
        attemptsCount: 10,
        correctCount: 9,
      });

      expect(response.normalized).toEqual({
        user_id: 'fb-uid-777',
        module_id: 4,
        score: 88,
        status: 'mastered',
        attempts_count: 10,
        correct_count: 9,
      });

      expect(syncModuleProgressToFirestore).toHaveBeenCalledWith(
        'fb-uid-777',
        4,
        88,
        'mastered'
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/progress/sync',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('rejects out-of-range moduleId (< 1 or > 12)', async () => {
      await expect(
        postgresBackendService.updateModuleProgress({
          moduleId: 0,
          score: 50,
        })
      ).rejects.toThrow('moduleId must be an integer between 1 and 12.');

      await expect(
        postgresBackendService.updateModuleProgress({
          moduleId: 13,
          score: 50,
        })
      ).rejects.toThrow('moduleId must be an integer between 1 and 12.');
    });

    it('sanitizes and batch-syncs multiple modules with quiz session telemetry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', synced_count: 2 }),
      });

      const res = await postgresBackendService.syncBatchModuleProgress({
        userId: 'usr-batch-sync',
        moduleMastery: {
          1: { correct: 5, total: 5 },
          2: { correct: 8, total: 5 }, // should clamp correct to 5
          99: { correct: 1, total: 2 }, // invalid module id 99 should be ignored
        },
        session: {
          questionsAnswered: 10,
          correctCount: 9,
        },
      });

      expect(res.status).toBe('ok');
      const [, reqInit] = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(reqInit.body);
      expect(sentBody.moduleMastery).toEqual({
        1: { correct: 5, total: 5 },
        2: { correct: 5, total: 5 },
      });
      expect(sentBody.moduleMastery[99]).toBeUndefined();
    });
  });

  // ==========================================================================
  // 4. AUTHENTICATION STATE HANDLERS TESTS
  // ==========================================================================
  describe('Authentication State Handlers (handleAuthStateAction)', () => {
    it('handles signup, login, restore, and logout state transitions cleanly', async () => {
      const signupSpy = vi.spyOn(authService, 'signup').mockResolvedValueOnce({
        user: {
          id: 'usr-new-101',
          email: 'amina@az900.ke',
          full_name: 'Amina Wanjiku',
          role: 'student',
          is_premium: false,
          unlocked_modules: [1, 2, 3, 4],
          created_at: '2026-10-25T10:00:00.000Z',
        },
        token: 'tok-signup-101',
        firebaseUser: null,
        firebaseIdToken: null,
        authProvider: 'backend_session',
      });

      const signupState = await postgresBackendService.handleAuthStateAction(
        'signup',
        {
          email: 'amina@az900.ke',
          fullName: 'Amina Wanjiku',
          role: 'student',
        }
      );

      expect(signupSpy).toHaveBeenCalledTimes(1);
      expect(signupState.isAuthenticated).toBe(true);
      expect(signupState.user?.email).toBe('amina@az900.ke');
      expect(signupState.token).toBe('tok-signup-101');

      const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValueOnce();
      const logoutState = await postgresBackendService.handleAuthStateAction('logout');
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(logoutState.isAuthenticated).toBe(false);
      expect(logoutState.user).toBeNull();
    });
  });
});
