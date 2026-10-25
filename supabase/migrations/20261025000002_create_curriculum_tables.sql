-- ============================================================================
-- Migration 002: Curriculum Hierarchy Tables (Learning Paths, Modules, Questions)
-- Target: Supabase / PostgreSQL 15+
-- Constraints: Foreign Keys (ON DELETE CASCADE), JSONB Option & Distractor Storage
-- ============================================================================

-- 1. Learning Paths Table (3 Official AZ-900 Exam Domains)
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  weight_percentage VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_learning_paths PRIMARY KEY (id),
  CONSTRAINT chk_learning_paths_id_range CHECK (id BETWEEN 1 AND 3)
);

-- 2. Modules Table (12 Official AZ-900 Curriculum Modules)
CREATE TABLE IF NOT EXISTS public.modules (
  id INTEGER NOT NULL,
  path_id INTEGER NOT NULL,
  title VARCHAR(220) NOT NULL,
  module_number INTEGER NOT NULL,
  is_premium_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_modules PRIMARY KEY (id),
  CONSTRAINT uq_modules_number UNIQUE (module_number),
  CONSTRAINT chk_modules_number_range CHECK (module_number BETWEEN 1 AND 12),
  CONSTRAINT fk_modules_learning_path
    FOREIGN KEY (path_id)
    REFERENCES public.learning_paths(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_modules_path_id ON public.modules (path_id);
CREATE INDEX IF NOT EXISTS idx_modules_number ON public.modules (module_number);

-- 3. Questions Table (Scenario-Based Question Bank with JSONB Storage Constraints)
CREATE TABLE IF NOT EXISTS public.questions (
  id VARCHAR(80) NOT NULL,
  module_id INTEGER NOT NULL,
  difficulty VARCHAR(24) NOT NULL DEFAULT 'Intermediate',
  scenario_text TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  explanation_correct TEXT NOT NULL,
  explanation_distractors JSONB NOT NULL DEFAULT '{}'::jsonb,
  exam_tip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_questions PRIMARY KEY (id),
  CONSTRAINT fk_questions_module
    FOREIGN KEY (module_id)
    REFERENCES public.modules(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_questions_difficulty
    CHECK (difficulty IN ('Fundamental', 'Intermediate', 'Advanced')),
  CONSTRAINT chk_questions_correct_answer
    CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  CONSTRAINT chk_questions_options_jsonb_array
    CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4),
  CONSTRAINT chk_questions_distractors_jsonb_object
    CHECK (jsonb_typeof(explanation_distractors) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_questions_module_id ON public.questions (module_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_options_gin ON public.questions USING GIN (options);
CREATE INDEX IF NOT EXISTS idx_questions_distractors_gin ON public.questions USING GIN (explanation_distractors);

-- Anti-Scraping Public View: Exposes scenario and JSONB options without revealing answers
CREATE OR REPLACE VIEW public.public_questions_sanitized AS
SELECT
  q.id,
  q.module_id,
  m.path_id,
  m.title AS module_title,
  q.difficulty,
  q.scenario_text,
  q.question_text,
  q.options,
  q.created_at
FROM public.questions q
JOIN public.modules m ON m.id = q.module_id;

-- Enable Row Level Security (RLS)
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning paths are viewable by all authenticated learners"
  ON public.learning_paths
  FOR SELECT
  USING (true);

CREATE POLICY "Modules are viewable by all authenticated learners"
  ON public.modules
  FOR SELECT
  USING (true);

CREATE POLICY "Full question answer key restricted to backend service and admins"
  ON public.questions
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.firebase_uid = auth.jwt() ->> 'sub')
        AND u.role = 'bootcamp_admin'
    )
  );
