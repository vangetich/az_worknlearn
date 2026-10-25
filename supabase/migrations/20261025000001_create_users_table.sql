-- ============================================================================
-- Migration 001: Users Table & Role Enum
-- Target: Supabase / PostgreSQL 15+
-- Constraints: UUID Primary Key, Unique Email & Firebase UID, Role Enum Check
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'student',
      'bootcamp_admin',
      'enterprise_user'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  firebase_uid TEXT,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_modules INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_firebase_uid UNIQUE (firebase_uid),
  CONSTRAINT chk_users_email_format CHECK (position('@' IN email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- Automatically maintain updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
    OR auth.jwt() ->> 'sub' = firebase_uid
    OR role = 'bootcamp_admin'
  );

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR auth.jwt() ->> 'sub' = firebase_uid
  )
  WITH CHECK (
    auth.uid() = id
    OR auth.jwt() ->> 'sub' = firebase_uid
  );
