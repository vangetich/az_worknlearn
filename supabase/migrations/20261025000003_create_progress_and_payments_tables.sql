-- ============================================================================
-- Migration 003: User Progress, Telemetry & Payment Gateways (M-Pesa & Stripe)
-- Target: Supabase / PostgreSQL 15+
-- Constraints: UUID Primary Keys, Foreign Keys to users(id) & modules(id)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
    CREATE TYPE public.progress_status AS ENUM (
      'not_started',
      'in_progress',
      'mastered'
    );
  END IF;
END
$$;

-- 1. User Progress Table (Per-Module Mastery Across All 12 Modules)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  status public.progress_status NOT NULL DEFAULT 'not_started',
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  last_attempted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_user_progress PRIMARY KEY (id),
  CONSTRAINT uq_user_module_progress UNIQUE (user_id, module_id),
  CONSTRAINT fk_user_progress_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_progress_module
    FOREIGN KEY (module_id)
    REFERENCES public.modules(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_user_progress_score_range CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT chk_user_progress_counts CHECK (attempts_count >= 0 AND correct_count >= 0 AND correct_count <= attempts_count)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON public.user_progress (module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON public.user_progress (status);

DROP TRIGGER IF EXISTS trg_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER trg_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 2. Quiz Sessions Telemetry Table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  questions_answered INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_quiz_sessions PRIMARY KEY (id),
  CONSTRAINT fk_quiz_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_quiz_sessions_counts
    CHECK (questions_answered >= 0 AND correct_count >= 0 AND correct_count <= questions_answered)
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON public.quiz_sessions (completed_at DESC);

-- 3. Payment Transactions Table (M-Pesa Daraja STK Push & Stripe Webhooks)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gateway VARCHAR(24) NOT NULL,
  phone_number VARCHAR(64) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'KES',
  module_id VARCHAR(16) NOT NULL DEFAULT 'all',
  checkout_request_id VARCHAR(128) NOT NULL,
  merchant_request_id VARCHAR(128),
  receipt_number VARCHAR(64),
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT pk_payment_transactions PRIMARY KEY (id),
  CONSTRAINT uq_payment_tx_checkout_id UNIQUE (checkout_request_id),
  CONSTRAINT fk_payment_transactions_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_payment_tx_gateway CHECK (gateway IN ('mpesa', 'stripe')),
  CONSTRAINT chk_payment_tx_amount CHECK (amount > 0),
  CONSTRAINT chk_payment_tx_currency CHECK (currency IN ('KES', 'USD')),
  CONSTRAINT chk_payment_tx_status CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user_id ON public.payment_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_checkout_id ON public.payment_transactions (checkout_request_id);

-- 4. Server-Side RPC Function: Evaluate Answer & Update Mastery Atomically
CREATE OR REPLACE FUNCTION public.evaluate_quiz_submission(
  p_user_id UUID,
  p_question_id VARCHAR,
  p_selected_answer CHAR(1)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_attempts INTEGER;
  v_correct INTEGER;
  v_score INTEGER;
  v_status public.progress_status;
BEGIN
  SELECT * INTO v_question
  FROM public.questions
  WHERE id = p_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question % not found', p_question_id;
  END IF;

  v_is_correct := (UPPER(p_selected_answer) = v_question.correct_answer);

  INSERT INTO public.user_progress (
    user_id,
    module_id,
    score,
    status,
    attempts_count,
    correct_count,
    last_attempted
  )
  VALUES (
    p_user_id,
    v_question.module_id,
    CASE WHEN v_is_correct THEN 100 ELSE 0 END,
    CASE WHEN v_is_correct THEN 'mastered'::public.progress_status ELSE 'in_progress'::public.progress_status END,
    1,
    CASE WHEN v_is_correct THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, module_id) DO UPDATE
  SET
    attempts_count = public.user_progress.attempts_count + 1,
    correct_count = public.user_progress.correct_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END),
    score = ROUND(
      ((public.user_progress.correct_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END))::NUMERIC
      / (public.user_progress.attempts_count + 1)::NUMERIC) * 100
    )::INTEGER,
    status = CASE
      WHEN ROUND(
        ((public.user_progress.correct_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END))::NUMERIC
        / (public.user_progress.attempts_count + 1)::NUMERIC) * 100
      ) >= 80 THEN 'mastered'::public.progress_status
      ELSE 'in_progress'::public.progress_status
    END,
    last_attempted = NOW()
  RETURNING attempts_count, correct_count, score, status
  INTO v_attempts, v_correct, v_score, v_status;

  RETURN jsonb_build_object(
    'question_id', v_question.id,
    'module_id', v_question.module_id,
    'selected_answer', UPPER(p_selected_answer),
    'correct_answer', v_question.correct_answer,
    'is_correct', v_is_correct,
    'explanation_correct', v_question.explanation_correct,
    'explanation_distractors', v_question.explanation_distractors,
    'exam_tip', v_question.exam_tip,
    'module_progress', jsonb_build_object(
      'module_id', v_question.module_id,
      'score', v_score,
      'status', v_status,
      'attempts_count', v_attempts,
      'correct_count', v_correct
    )
  );
END;
$$;

-- Enable RLS on Progress, Sessions, and Payments
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own module progress"
  ON public.user_progress
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_progress.user_id
        AND (u.id = auth.uid() OR u.firebase_uid = auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users manage own quiz sessions"
  ON public.quiz_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = quiz_sessions.user_id
        AND (u.id = auth.uid() OR u.firebase_uid = auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users view own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = payment_transactions.user_id
        AND (u.id = auth.uid() OR u.firebase_uid = auth.jwt() ->> 'sub')
    )
  );
