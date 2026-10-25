import { useState, useEffect, useCallback } from 'react';
import {
  supabase,
  isSupabaseDirectConfigured,
  fetchPostgresCurriculumModules,
  fetchPostgresModuleQuestions,
  writePostgresModuleProgress,
  syncAllPostgresUserProgress,
  PostgresLearningPathsRow,
  PostgresModulesRow,
  PostgresQuestionsRow,
  PostgresUserProgressRow,
  PostgresProgressStatus,
  WriteProgressParams,
} from '../lib/supabase';
import { authService } from '../services/authService';
import { auth, syncModuleProgressToFirestore } from '../lib/firebase';

export interface PostgresProgressSummary {
  overall_mastery_score: number;
  mastered_modules_count: number;
  in_progress_modules_count: number;
  not_started_modules_count: number;
  total_modules: number;
  total_sessions_completed: number;
}

export type SupabaseRealtimeStatus = 'connected' | 'syncing' | 'offline';

export interface UsePostgresDatabaseResult {
  supabaseClient: typeof supabase;
  connectionMode: 'supabase-direct' | 'express-postgres-bridge';
  realtimeStatus: SupabaseRealtimeStatus;
  learningPaths: (PostgresLearningPathsRow & { modules: PostgresModulesRow[] })[];
  modules: PostgresModulesRow[];
  userProgress: PostgresUserProgressRow[];
  progressSummary: PostgresProgressSummary | null;
  paymentTransactions: any[];
  backendUser: any;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncedAt: number | null;
  fetchCurriculumModules: () => Promise<void>;
  fetchModuleQuestions: (
    moduleId: number | 'all',
    protectAnswers?: boolean
  ) => Promise<PostgresQuestionsRow[]>;
  writeModuleProgress: (params: WriteProgressParams) => Promise<any>;
  syncAllModuleProgress: (
    moduleMastery: Record<number, { correct: number; total: number }>,
    session?: { questionsAnswered: number; correctCount: number }
  ) => Promise<any>;
  submitQuestionAnswer: (
    questionId: string,
    selectedAnswer: 'A' | 'B' | 'C' | 'D',
    recordSession?: boolean
  ) => Promise<any>;
  refreshAll: () => Promise<void>;
}

/**
 * Database utility hook (`usePostgresDatabase`) that handles fetching curriculum modules
 * (`learning_paths`, `modules`, `questions` with JSONB options) and writing user progress
 * updates (`user_progress`, `quiz_sessions`) to the Supabase / Postgres backend.
 */
export function usePostgresDatabase(explicitUserId?: string): UsePostgresDatabaseResult {
  const [learningPaths, setLearningPaths] = useState<
    (PostgresLearningPathsRow & { modules: PostgresModulesRow[] })[]
  >([]);
  const [modules, setModules] = useState<PostgresModulesRow[]>([]);
  const [userProgress, setUserProgress] = useState<PostgresUserProgressRow[]>([]);
  const [progressSummary, setProgressSummary] = useState<PostgresProgressSummary | null>(null);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [backendUser, setBackendUser] = useState<any>(() => authService.getStoredBackendUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [channelOffline, setChannelOffline] = useState<boolean>(false);

  const resolveActiveUserId = useCallback(() => {
    return (
      explicitUserId ||
      auth.currentUser?.uid ||
      authService.getStoredBackendUser()?.id ||
      'usr-default-learner'
    );
  }, [explicitUserId]);

  /**
   * Fetches all 3 Learning Paths and 12 Modules from the Postgres backend.
   */
  const fetchCurriculumModules = useCallback(async () => {
    const activeUserId = resolveActiveUserId();
    setIsLoading(true);
    setError(null);
    try {
      const headers = await authService.getAuthHeaders(activeUserId);
      const [curriculumPayload, progressRes] = await Promise.all([
        fetchPostgresCurriculumModules(activeUserId),
        fetch(`/api/user/progress?userId=${encodeURIComponent(activeUserId)}`, { headers }),
      ]);

      setLearningPaths(curriculumPayload.learning_paths || []);
      setModules(curriculumPayload.modules || []);

      if (progressRes.ok) {
        const progData = await progressRes.json();
        setUserProgress(progData.user_progress || []);
        setProgressSummary(progData.summary || null);
        setPaymentTransactions(progData.payment_transactions || []);
        if (progData.user) {
          setBackendUser(progData.user);
        }
      }
      setLastSyncedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum modules from Postgres backend.');
    } finally {
      setIsLoading(false);
    }
  }, [resolveActiveUserId]);

  /**
   * Fetches scenario-based questions (with JSONB options) for a given module.
   */
  const fetchModuleQuestions = useCallback(
    async (
      moduleId: number | 'all',
      protectAnswers = true
    ): Promise<PostgresQuestionsRow[]> => {
      try {
        return await fetchPostgresModuleQuestions(moduleId, protectAnswers);
      } catch (err: any) {
        setError(err.message || 'Failed to load module questions.');
        return [];
      }
    },
    []
  );

  /**
   * Writes a single module's score & mastery status (`not_started` | `in_progress` | `mastered`)
   * to the Postgres backend and refreshes local hook state.
   */
  const writeModuleProgress = useCallback(
    async (params: WriteProgressParams) => {
      const activeUserId = params.userId || resolveActiveUserId();
      setIsSyncing(true);
      setError(null);
      try {
        const report = await writePostgresModuleProgress({
          ...params,
          userId: activeUserId,
        });
        if (report?.user_progress) {
          setUserProgress(report.user_progress);
        }
        if (report?.summary) {
          setProgressSummary(report.summary);
        }
        await fetchCurriculumModules();
        setLastSyncedAt(Date.now());
        return report;
      } catch (err: any) {
        setError(err.message || 'Failed to write module progress to Postgres.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [resolveActiveUserId, fetchCurriculumModules]
  );

  /**
   * Synchronizes all 12 curriculum module mastery scores and optional quiz session telemetry
   * to the Postgres backend.
   */
  const syncAllModuleProgress = useCallback(
    async (
      moduleMastery: Record<number, { correct: number; total: number }>,
      session?: { questionsAnswered: number; correctCount: number }
    ) => {
      const activeUserId = resolveActiveUserId();
      setIsSyncing(true);
      setError(null);
      try {
        const report = await syncAllPostgresUserProgress({
          userId: activeUserId,
          moduleMastery,
          session,
        });
        if (report?.user_progress) {
          setUserProgress(report.user_progress);
        }
        if (report?.summary) {
          setProgressSummary(report.summary);
        }
        await fetchCurriculumModules();
        setLastSyncedAt(Date.now());
        return report;
      } catch (err: any) {
        setError(err.message || 'Failed to sync all module progress to Postgres.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [resolveActiveUserId, fetchCurriculumModules]
  );

  /**
   * Submits a learner's answer to the server-side Postgres grader (`evaluate_quiz_submission`
   * RPC / `POST /api/quiz/submit`), updating module progress atomically.
   */
  const submitQuestionAnswer = useCallback(
    async (
      questionId: string,
      selectedAnswer: 'A' | 'B' | 'C' | 'D',
      recordSession = true
    ) => {
      const activeUserId = resolveActiveUserId();
      setIsSyncing(true);
      setError(null);
      try {
        if (isSupabaseDirectConfigured) {
          try {
            const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)(
              'evaluate_quiz_submission',
              {
                p_user_id: activeUserId,
                p_question_id: questionId,
                p_selected_answer: selectedAnswer,
              }
            );
            if (!rpcErr && rpcData) {
              await fetchCurriculumModules();
              return rpcData;
            }
          } catch {
            // fallback to /api/quiz/submit
          }
        }

        const headers = await authService.getAuthHeaders(activeUserId);
        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: activeUserId,
            question_id: questionId,
            selected_answer: selectedAnswer,
            record_session: recordSession,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to evaluate quiz answer.');
        }

        if (auth.currentUser && data.module_progress) {
          await syncModuleProgressToFirestore(
            auth.currentUser.uid,
            data.module_progress.module_id,
            data.module_progress.score,
            data.module_progress.status as PostgresProgressStatus
          );
        }

        await fetchCurriculumModules();
        setLastSyncedAt(Date.now());
        return data;
      } catch (err: any) {
        setError(err.message || 'Failed to submit answer to Postgres backend.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [resolveActiveUserId, fetchCurriculumModules]
  );

  useEffect(() => {
    fetchCurriculumModules();
  }, [fetchCurriculumModules]);

  // Listen for browser online/offline events, auth changes, and Supabase real-time channel status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setChannelOffline(false);
      fetchCurriculumModules();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleAuthChange = () => {
      setBackendUser(authService.getStoredBackendUser());
      fetchCurriculumModules();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('az900-auth-session-change', handleAuthChange);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseDirectConfigured) {
      channel = supabase
        .channel('az900-user-progress-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_progress' },
          () => {
            fetchCurriculumModules();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setChannelOffline(false);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setChannelOffline(true);
          }
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('az900-auth-session-change', handleAuthChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchCurriculumModules]);

  const realtimeStatus: SupabaseRealtimeStatus =
    !isOnline || channelOffline || Boolean(error)
      ? 'offline'
      : isSyncing || isLoading
      ? 'syncing'
      : 'connected';

  return {
    supabaseClient: supabase,
    connectionMode: isSupabaseDirectConfigured ? 'supabase-direct' : 'express-postgres-bridge',
    realtimeStatus,
    learningPaths,
    modules,
    userProgress,
    progressSummary,
    paymentTransactions,
    backendUser,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    fetchCurriculumModules,
    fetchModuleQuestions,
    writeModuleProgress,
    syncAllModuleProgress,
    submitQuestionAnswer,
    refreshAll: fetchCurriculumModules,
  };
}
