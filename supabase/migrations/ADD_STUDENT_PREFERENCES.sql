-- Add student preferences quiz fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS student_preferences JSONB DEFAULT '{}'::jsonb;

-- Index for quick quiz_completed lookups
CREATE INDEX IF NOT EXISTS idx_users_quiz_completed ON public.users(quiz_completed);
