import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ../../lib/firebase before importing services that depend on it
vi.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  ensureCloudUserProfile: vi.fn().mockResolvedValue(undefined),
  syncModuleProgressToFirestore: vi.fn().mockResolvedValue(undefined),
  recordQuizSessionToFirestore: vi.fn().mockResolvedValue(undefined),
}));

// Mock ../../lib/supabase so unit tests run deterministically against the Express Postgres API bridge
vi.mock('../../lib/supabase', () => ({
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
  clampMasteryScore,
  computePostgresProgressStatus,
  isValidQuizAnswerOption,
} from '../postgresBackendService';
import { auth, syncModuleProgressToFirestore } from '../../lib/firebase';

describe('PostgreSQL Backend Integration Unit Tests (quizBackend.test.ts)', () => {
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

  // ============================================================================
  // 1. SUBMIT QUESTION ANSWER - NETWORK LATENCY HANDLING
  // ============================================================================
  describe('submitQuestionAnswer — Network Latency Handling', () => {
    it('properly resolves quiz answer submission through simulated network latency', async () => {
      const simulatedLatencyMs = 80;
      const mockSuccessResponse = {
        mode: 'single',
        question_id: 'az900-m2-q4',
        module_id: 2,
        selected_answer: 'B',
        correct_answer: 'B',
        is_correct: true,
        explanation_correct: 'Availability Zones provide physical redundancy within an Azure region.',
        explanation_distractors: {
          A: 'Regions are sets of datacenters deployed within a latency-defined perimeter.',
          C: 'Resource groups are logical containers.',
          D: 'Subscriptions are billing and access boundaries.',
        },
        exam_tip: 'AZs have independent power, cooling, and networking within an Azure region.',
        module_progress: {
          user_id: 'usr-latency-test',
          module_id: 2,
          score: 85,
          status: 'mastered',
          attempts_count: 6,
          correct_count: 5,
          last_attempted: new Date().toISOString(),
        },
      };

      // Simulate network latency delay before resolving fetch
      mockFetch.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
        return {
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse,
        };
      });

      const startTime = Date.now();
      const result = await postgresBackendService.submitQuizAnswer({
        userId: 'usr-latency-test',
        questionId: 'az900-m2-q4',
        selectedAnswer: 'B',
        recordSession: true,
      });
      const durationMs = Date.now() - startTime;

      expect(durationMs).toBeGreaterThanOrEqual(simulatedLatencyMs - 15);
      expect(result.is_correct).toBe(true);
      expect(result.correct_answer).toBe('B');
      expect(result.module_progress?.status).toBe('mastered');

      // Verify that the telemetry store captured the sample for /api/quiz/submit
      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      const quizSummary = telemetry.summaries['/api/quiz/submit'];
      expect(quizSummary.totalRequests).toBeGreaterThanOrEqual(2);
      expect(quizSummary.lastStatus).toBe(200);
      expect(quizSummary.lastLatencyMs).toBeGreaterThanOrEqual(simulatedLatencyMs - 20);
    });

    it('records elevated latency samples during high network latency and updates telemetry metrics', async () => {
      const highLatencyMs = 120;
      mockFetch.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, highLatencyMs));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            mode: 'single',
            question_id: 'az900-m1-q2',
            module_id: 1,
            selected_answer: 'A',
            correct_answer: 'A',
            is_correct: true,
          }),
        };
      });

      await postgresBackendService.submitQuizAnswer({
        userId: 'usr-high-latency',
        questionId: 'az900-m1-q2',
        selectedAnswer: 'A',
      });

      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      const quizSummary = telemetry.summaries['/api/quiz/submit'];
      expect(quizSummary.lastLatencyMs).toBeGreaterThanOrEqual(highLatencyMs - 25);
      expect(quizSummary.p95LatencyMs).toBeGreaterThan(0);
    });

    it('handles multiple sequential quiz submissions with variable network latencies correctly', async () => {
      const latencies = [30, 75, 45];
      let callCount = 0;

      mockFetch.mockImplementation(async () => {
        const delay = latencies[callCount % latencies.length];
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            mode: 'single',
            question_id: `az900-q-${callCount}`,
            is_correct: true,
            correct_answer: 'C',
          }),
        };
      });

      const answers = ['C', 'C', 'C'] as const;
      for (let i = 0; i < answers.length; i++) {
        const res = await postgresBackendService.submitQuizAnswer({
          userId: 'usr-sequence-test',
          questionId: `az900-q-${i + 1}`,
          selectedAnswer: answers[i],
        });
        expect(res.is_correct).toBe(true);
      }

      expect(callCount).toBe(3);
      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      expect(telemetry.summaries['/api/quiz/submit'].totalRequests).toBeGreaterThanOrEqual(4);
    });
  });

  // ============================================================================
  // 2. SUBMIT QUESTION ANSWER - DATA SYNCHRONIZATION ERRORS
  // ============================================================================
  describe('submitQuestionAnswer — Data Synchronization Errors', () => {
    it('properly catches HTTP 500 PostgreSQL database error and records error telemetry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'PostgreSQL connection timeout: failed to evaluate submission.',
        }),
      });

      await expect(
        postgresBackendService.submitQuizAnswer({
          userId: 'usr-sync-err-1',
          questionId: 'az900-m1-q1',
          selectedAnswer: 'B',
        })
      ).rejects.toThrow('PostgreSQL connection timeout: failed to evaluate submission.');

      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      const quizSummary = telemetry.summaries['/api/quiz/submit'];
      expect(quizSummary.lastStatus).toBe(500);
      expect(quizSummary.errorCount).toBeGreaterThanOrEqual(1);
      expect(quizSummary.errorRatePercent).toBeGreaterThan(0);
    });

    it('rejects empty or whitespace-only questionId client-side and logs 400 error status', async () => {
      await expect(
        postgresBackendService.submitQuizAnswer({
          questionId: '   ',
          selectedAnswer: 'A',
        })
      ).rejects.toThrow('question_id is required to submit a quiz answer.');

      expect(mockFetch).not.toHaveBeenCalled();
      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      expect(telemetry.summaries['/api/quiz/submit'].lastStatus).toBe(400);
      expect(telemetry.summaries['/api/quiz/submit'].errorCount).toBe(1);
    });

    it('rejects invalid option letter (e.g. "Z") client-side and validates strict A, B, C, D choices', async () => {
      expect(isValidQuizAnswerOption('A')).toBe(true);
      expect(isValidQuizAnswerOption('b')).toBe(true);
      expect(isValidQuizAnswerOption('Z')).toBe(false);
      expect(isValidQuizAnswerOption(null)).toBe(false);

      await expect(
        postgresBackendService.submitQuizAnswer({
          questionId: 'az900-m1-q1',
          selectedAnswer: 'Z' as any,
        })
      ).rejects.toThrow('Invalid selected_answer: must be one of A, B, C, or D.');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('propagates HTTP 404 Question Not Found synchronization error from PostgreSQL database', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Question 'az900-unknown-999' not found in bank.",
        }),
      });

      await expect(
        postgresBackendService.submitQuizAnswer({
          questionId: 'az900-unknown-999',
          selectedAnswer: 'D',
        })
      ).rejects.toThrow("Question 'az900-unknown-999' not found in bank.");

      const telemetry = postgresBackendService.getEndpointTelemetrySnapshot();
      expect(telemetry.summaries['/api/quiz/submit'].lastStatus).toBe(404);
    });

    it('handles network drop / fetch rejection gracefully without unhandled crashes', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch: Network is offline'));

      await expect(
        postgresBackendService.submitQuizAnswer({
          userId: 'usr-offline',
          questionId: 'az900-m1-q1',
          selectedAnswer: 'A',
        })
      ).rejects.toThrow('Failed to fetch: Network is offline');
    });

    it('handles secondary Firestore synchronization failure gracefully without failing primary PostgreSQL quiz evaluation', async () => {
      (auth as any).currentUser = {
        uid: 'fb-learner-123',
        getIdToken: vi.fn().mockResolvedValue('test-fb-jwt'),
      };

      // Mock Firestore sync to fail with permission-denied / network error
      vi.mocked(syncModuleProgressToFirestore).mockRejectedValueOnce(
        new Error('Firestore sync error: [permission-denied]')
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          mode: 'single',
          question_id: 'az900-m1-q1',
          is_correct: true,
          correct_answer: 'B',
          module_progress: {
            user_id: 'fb-learner-123',
            module_id: 1,
            score: 90,
            status: 'mastered',
          },
        }),
      });

      // The primary PostgreSQL evaluation must succeed even if secondary Firestore sync throws
      const response = await postgresBackendService.submitQuizAnswer({
        userId: 'fb-learner-123',
        questionId: 'az900-m1-q1',
        selectedAnswer: 'B',
      });

      expect(response.is_correct).toBe(true);
      expect(response.correct_answer).toBe('B');
      expect(syncModuleProgressToFirestore).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // 3. WRITE MODULE PROGRESS - NETWORK LATENCY HANDLING
  // ============================================================================
  describe('writeModuleProgress — Network Latency Handling', () => {
    it('successfully writes module progress through simulated network latency and normalizes output', async () => {
      const simulatedLatencyMs = 65;

      mockFetch.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: 'Module progress updated in PostgreSQL',
            updated_modules: [3],
          }),
        };
      });

      const startTime = Date.now();
      const result = await postgresBackendService.updateModuleProgress({
        userId: 'usr-progress-latency',
        moduleId: 3,
        score: 82,
        attemptsCount: 8,
        correctCount: 7,
      });
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(simulatedLatencyMs - 15);
      expect(result.normalized).toEqual({
        user_id: 'usr-progress-latency',
        module_id: 3,
        score: 82,
        status: 'mastered',
        attempts_count: 8,
        correct_count: 7,
      });

      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe('/api/user/progress/sync');
      expect(calledInit.method).toBe('POST');
    });

    it('clamps raw mastery scores [0, 100] and computes status accurately across all boundary conditions', async () => {
      expect(clampMasteryScore(-15)).toBe(0);
      expect(clampMasteryScore(0)).toBe(0);
      expect(clampMasteryScore(79.4)).toBe(79);
      expect(clampMasteryScore(80)).toBe(80);
      expect(clampMasteryScore(105)).toBe(100);
      expect(clampMasteryScore(Number.NaN)).toBe(0);

      expect(computePostgresProgressStatus(0)).toBe('not_started');
      expect(computePostgresProgressStatus(45)).toBe('in_progress');
      expect(computePostgresProgressStatus(79)).toBe('in_progress');
      expect(computePostgresProgressStatus(80)).toBe('mastered');
      expect(computePostgresProgressStatus(100)).toBe('mastered');
    });
  });

  // ============================================================================
  // 4. WRITE MODULE PROGRESS - DATA SYNCHRONIZATION ERRORS
  // ============================================================================
  describe('writeModuleProgress — Data Synchronization Errors', () => {
    it('validates moduleId strictly between 1 and 12, rejecting invalid modules before network call', async () => {
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

      await expect(
        postgresBackendService.updateModuleProgress({
          moduleId: -5,
          score: 50,
        })
      ).rejects.toThrow('moduleId must be an integer between 1 and 12.');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('catches and propagates HTTP 500 error when PostgreSQL progress sync fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'PostgreSQL transaction failed: deadlock detected on user_progress row.',
        }),
      });

      await expect(
        postgresBackendService.updateModuleProgress({
          userId: 'usr-deadlock-test',
          moduleId: 5,
          score: 75,
        })
      ).rejects.toThrow(
        'PostgreSQL transaction failed: deadlock detected on user_progress row.'
      );
    });

    it('catches network drop or server timeout during module progress update', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection reset by peer'));

      await expect(
        postgresBackendService.updateModuleProgress({
          userId: 'usr-reset-test',
          moduleId: 1,
          score: 60,
        })
      ).rejects.toThrow('Network connection reset by peer');
    });

    it('handles secondary Firestore sync failure gracefully during module progress write', async () => {
      (auth as any).currentUser = {
        uid: 'fb-user-progress',
        getIdToken: vi.fn().mockResolvedValue('test-jwt'),
      };

      vi.mocked(syncModuleProgressToFirestore).mockRejectedValueOnce(
        new Error('Firestore quota exceeded')
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Success',
        }),
      });

      const res = await postgresBackendService.updateModuleProgress({
        userId: 'fb-user-progress',
        moduleId: 7,
        score: 95,
        attemptsCount: 10,
        correctCount: 9,
      });

      expect(res.normalized.status).toBe('mastered');
      expect(res.normalized.score).toBe(95);
      expect(syncModuleProgressToFirestore).toHaveBeenCalledWith(
        'fb-user-progress',
        7,
        95,
        'mastered'
      );
    });

    it('sanitizes batch module mastery synchronization data and clamps out-of-range inputs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', synced: 2 }),
      });

      const result = await postgresBackendService.syncBatchModuleProgress({
        userId: 'usr-batch-sanitizer',
        moduleMastery: {
          1: { correct: 8, total: 10 },
          2: { correct: 15, total: 10 }, // correct exceeds total: must clamp to 10
          999: { correct: 1, total: 1 }, // invalid moduleId > 12: must be omitted
        },
        session: {
          questionsAnswered: 20,
          correctCount: 18,
        },
      });

      expect(result.status).toBe('success');
      const [, init] = mockFetch.mock.calls[0];
      const payload = JSON.parse(init.body);
      expect(payload.moduleMastery['1']).toEqual({ correct: 8, total: 10 });
      expect(payload.moduleMastery['2']).toEqual({ correct: 10, total: 10 });
      expect(payload.moduleMastery['999']).toBeUndefined();
    });
  });
});
