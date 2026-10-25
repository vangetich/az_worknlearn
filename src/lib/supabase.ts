import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import {
  auth,
  syncModuleProgressToFirestore,
  recordQuizSessionToFirestore,
} from './firebase';

// ============================================================================
// POSTGRESQL RELATIONAL DATABASE TYPES (Supabase Schema Definition)
// ============================================================================

export type PostgresUserRole = 'student' | 'bootcamp_admin' | 'enterprise_user';
export type PostgresProgressStatus = 'not_started' | 'in_progress' | 'mastered';

export interface PostgresQuestionOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface PostgresUsersRow {
  id: string;
  firebase_uid: string | null;
  email: string;
  full_name: string;
  role: PostgresUserRole;
  is_premium: boolean;
  unlocked_modules: number[];
  created_at: string;
  updated_at?: string;
}

export interface PostgresLearningPathsRow {
  id: number;
  title: string;
  weight_percentage: string;
  created_at?: string;
}

export interface PostgresModulesRow {
  id: number;
  path_id: number;
  title: string;
  module_number: number;
  is_premium_default: boolean;
  question_count?: number;
  is_unlocked?: boolean;
  user_progress?: {
    score: number;
    status: PostgresProgressStatus;
    attempts_count: number;
    correct_count: number;
    last_attempted: string | null;
  };
}

export interface PostgresQuestionsRow {
  id: string;
  module_id: number;
  module_title?: string;
  path_id?: number;
  difficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  scenario_text: string;
  question_text: string;
  options: PostgresQuestionOption[]; // JSONB
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  explanation_correct?: string;
  explanation_distractors?: Record<string, string>; // JSONB
  exam_tip: string;
}

export interface PostgresUserProgressRow {
  id?: string;
  user_id: string;
  module_id: number;
  module_number?: number;
  module_title?: string;
  path_id?: number;
  is_unlocked?: boolean;
  score: number;
  status: PostgresProgressStatus;
  attempts_count: number;
  correct_count: number;
  last_attempted: string | null;
}

export interface PostgresQuizSessionsRow {
  id: string;
  user_id: string;
  questions_answered: number;
  correct_count: number;
  completed_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: PostgresUsersRow;
        Insert: Partial<PostgresUsersRow> & { email: string; full_name: string };
        Update: Partial<PostgresUsersRow>;
      };
      learning_paths: {
        Row: PostgresLearningPathsRow;
        Insert: PostgresLearningPathsRow;
        Update: Partial<PostgresLearningPathsRow>;
      };
      modules: {
        Row: PostgresModulesRow;
        Insert: PostgresModulesRow;
        Update: Partial<PostgresModulesRow>;
      };
      questions: {
        Row: PostgresQuestionsRow;
        Insert: PostgresQuestionsRow;
        Update: Partial<PostgresQuestionsRow>;
      };
      user_progress: {
        Row: PostgresUserProgressRow;
        Insert: Omit<PostgresUserProgressRow, 'id'> & { id?: string };
        Update: Partial<PostgresUserProgressRow>;
      };
      quiz_sessions: {
        Row: PostgresQuizSessionsRow;
        Insert: Omit<PostgresQuizSessionsRow, 'id' | 'completed_at'> & {
          id?: string;
          completed_at?: string;
        };
        Update: Partial<PostgresQuizSessionsRow>;
      };
    };
    Functions: {
      evaluate_quiz_submission: {
        Args: {
          p_user_id: string;
          p_question_id: string;
          p_selected_answer: 'A' | 'B' | 'C' | 'D';
        };
        Returns: any;
      };
    };
  };
}

// ============================================================================
// SUPABASE CLIENT SDK INITIALIZATION
// ============================================================================

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

export const isSupabaseDirectConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    rawSupabaseUrl.startsWith('http') &&
    !rawSupabaseUrl.includes('your-project-id') &&
    rawSupabaseAnonKey !== 'your-supabase-anon-key'
);

const effectiveSupabaseUrl = isSupabaseDirectConfigured
  ? rawSupabaseUrl
  : 'https://az900-smart-quiz-builder.supabase.co';
const effectiveSupabaseKey = isSupabaseDirectConfigured
  ? rawSupabaseAnonKey
  : 'sb-publishable-local-bridge-anon-key';

/**
 * Configured Supabase PostgreSQL Client SDK instance.
 * Automatically attaches the active Firebase Auth / Backend Bearer token to requests.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  effectiveSupabaseUrl,
  effectiveSupabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'az900-smart-quiz-builder',
      },
    },
  }
);

// ============================================================================
// UNIFIED POSTGRESQL DATA ACCESS OPERATIONS (Supabase SDK + Express API Bridge)
// ============================================================================

export interface CurriculumModulesPayload {
  learning_paths: (PostgresLearningPathsRow & { modules: PostgresModulesRow[] })[];
  modules: PostgresModulesRow[];
  total_learning_paths: number;
  total_modules: number;
  total_questions: number;
}

export interface WriteProgressParams {
  userId?: string;
  moduleId: number;
  score: number;
  status?: PostgresProgressStatus;
  attemptsCount?: number;
  correctCount?: number;
}

/**
 * Fetches all 3 Learning Paths and 12 Curriculum Modules with per-module question counts
 * and the current learner's unlock & mastery state from the Postgres backend.
 */
export async function fetchPostgresCurriculumModules(
  userId?: string
): Promise<CurriculumModulesPayload> {
  const resolvedUserId =
    userId ||
    auth.currentUser?.uid ||
    authService.getStoredBackendUser()?.id ||
    'usr-default-learner';

  // 1. If a live external Supabase URL & Anon Key are configured, query Supabase tables directly
  if (isSupabaseDirectConfigured) {
    try {
      const [pathsRes, modsRes, progressRes] = await Promise.all([
        supabase.from('learning_paths').select('*').order('id', { ascending: true }),
        supabase.from('modules').select('*').order('module_number', { ascending: true }),
        supabase.from('user_progress').select('*').eq('user_id', resolvedUserId),
      ]);

      if (!pathsRes.error && !modsRes.error && pathsRes.data && modsRes.data) {
        const progressMap = new Map<number, PostgresUserProgressRow>();
        (progressRes.data || []).forEach((p: any) => progressMap.set(p.module_id, p));

        const enrichedModules: PostgresModulesRow[] = modsRes.data.map((m: any) => {
          const prog = progressMap.get(m.id);
          return {
            ...m,
            question_count: m.question_count ?? 2,
            is_unlocked: !m.is_premium_default || Boolean(prog),
            user_progress: prog
              ? {
                  score: prog.score,
                  status: prog.status,
                  attempts_count: prog.attempts_count,
                  correct_count: prog.correct_count,
                  last_attempted: prog.last_attempted,
                }
              : {
                  score: 0,
                  status: 'not_started',
                  attempts_count: 0,
                  correct_count: 0,
                  last_attempted: null,
                },
          };
        });

        return {
          learning_paths: pathsRes.data.map((lp: any) => ({
            ...lp,
            modules: enrichedModules.filter((m) => m.path_id === lp.id),
          })),
          modules: enrichedModules,
          total_learning_paths: pathsRes.data.length,
          total_modules: enrichedModules.length,
          total_questions: enrichedModules.reduce((acc, m) => acc + (m.question_count || 0), 0),
        };
      }
    } catch (err) {
      console.warn('Supabase direct query fallback to backend API:', err);
    }
  }

  // 2. Query the Express Postgres/Relational Backend API (/api/modules)
  const headers = await authService.getAuthHeaders(resolvedUserId);
  const res = await fetch(
    `/api/modules?userId=${encodeURIComponent(resolvedUserId)}`,
    { headers }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch curriculum modules from Postgres backend.');
  }
  return (await res.json()) as CurriculumModulesPayload;
}

/**
 * Fetches scenario-based questions (with JSONB options) for a specific module.
 */
export async function fetchPostgresModuleQuestions(
  moduleId: number | 'all',
  protectAnswers = true
): Promise<PostgresQuestionsRow[]> {
  if (isSupabaseDirectConfigured && moduleId !== 'all') {
    try {
      const tableOrView = protectAnswers ? 'public_questions_sanitized' : 'questions';
      const { data, error } = await supabase
        .from(tableOrView as any)
        .select('*')
        .eq('module_id', moduleId);
      if (!error && data && data.length > 0) {
        return data as unknown as PostgresQuestionsRow[];
      }
    } catch {
      // fallback to backend API
    }
  }

  const res = await fetch(
    `/api/modules/${moduleId}/questions?protect=${protectAnswers ? 'true' : 'false'}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch questions for module ${moduleId}.`);
  }
  const data = await res.json();
  return (data.questions || []) as PostgresQuestionsRow[];
}

/**
 * Writes a single module's progress update to the Postgres backend (and syncs with
 * Supabase `user_progress` and Cloud Firestore if authenticated).
 */
export async function writePostgresModuleProgress(params: WriteProgressParams) {
  const resolvedUserId =
    params.userId ||
    auth.currentUser?.uid ||
    authService.getStoredBackendUser()?.id ||
    'usr-default-learner';

  const clampedScore = Math.max(0, Math.min(100, Math.round(params.score)));
  const computedStatus: PostgresProgressStatus =
    params.status ||
    (clampedScore >= 80 ? 'mastered' : clampedScore > 0 ? 'in_progress' : 'not_started');
  const attempts = Math.max(1, params.attemptsCount ?? 1);
  const correct = Math.min(
    attempts,
    params.correctCount ?? Math.round((clampedScore / 100) * attempts)
  );

  // 1. Write directly to Supabase `user_progress` table if configured
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
    } catch (err) {
      console.warn('Supabase direct upsert fallback:', err);
    }
  }

  // 2. Sync to Cloud Firestore if authenticated with Firebase
  if (auth.currentUser) {
    try {
      await syncModuleProgressToFirestore(
        auth.currentUser.uid,
        params.moduleId,
        clampedScore,
        computedStatus
      );
    } catch {
      // ignore Firestore sync error if rules/offline
    }
  }

  // 3. Write to the Express Postgres/Relational Backend API (/api/user/progress/sync)
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
    throw new Error('Failed to write module progress update to Postgres backend.');
  }

  return await response.json();
}

/**
 * Batch-writes all 12 module mastery updates and an optional quiz session telemetry record
 * to the Postgres backend.
 */
export async function syncAllPostgresUserProgress(params: {
  userId?: string;
  moduleMastery: Record<number, { correct: number; total: number }>;
  session?: { questionsAnswered: number; correctCount: number };
}) {
  const resolvedUserId =
    params.userId ||
    auth.currentUser?.uid ||
    authService.getStoredBackendUser()?.id ||
    'usr-default-learner';

  if (isSupabaseDirectConfigured) {
    try {
      const rows = Object.entries(params.moduleMastery)
        .filter(([, m]) => m && m.total > 0)
        .map(([modIdStr, m]) => {
          const score = Math.round((m.correct / m.total) * 100);
          return {
            user_id: resolvedUserId,
            module_id: Number(modIdStr),
            score,
            status: (score >= 80 ? 'mastered' : 'in_progress') as PostgresProgressStatus,
            attempts_count: m.total,
            correct_count: m.correct,
            last_attempted: new Date().toISOString(),
          };
        });

      if (rows.length > 0) {
        await (supabase.from('user_progress') as any).upsert(rows, {
          onConflict: 'user_id,module_id',
        });
      }

      if (params.session && params.session.questionsAnswered > 0) {
        await (supabase.from('quiz_sessions') as any).insert({
          user_id: resolvedUserId,
          questions_answered: params.session.questionsAnswered,
          correct_count: params.session.correctCount,
        });
      }
    } catch (err) {
      console.warn('Supabase batch progress sync fallback:', err);
    }
  }

  if (auth.currentUser) {
    try {
      for (const [modIdStr, mm] of Object.entries(params.moduleMastery)) {
        if (mm && mm.total > 0) {
          const score = Math.round((mm.correct / mm.total) * 100);
          const status = score >= 80 ? 'mastered' : 'in_progress';
          await syncModuleProgressToFirestore(
            auth.currentUser.uid,
            Number(modIdStr),
            score,
            status
          );
        }
      }
      if (params.session && params.session.questionsAnswered > 0) {
        await recordQuizSessionToFirestore(
          auth.currentUser.uid,
          params.session.questionsAnswered,
          params.session.correctCount
        );
      }
    } catch {
      // non-fatal
    }
  }

  const headers = await authService.getAuthHeaders(resolvedUserId);
  const res = await fetch('/api/user/progress/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: resolvedUserId,
      moduleMastery: params.moduleMastery,
      session: params.session,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to synchronize user progress with Postgres backend.');
  }

  return await res.json();
}
