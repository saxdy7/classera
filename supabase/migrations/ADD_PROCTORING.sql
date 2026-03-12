-- ============================================================================
-- ADD_PROCTORING.sql
-- Run in Supabase SQL Editor
-- Adds anti-cheat, proctoring, and AI evaluation columns to test_submissions
-- ============================================================================

-- Add all extended columns to test_submissions
ALTER TABLE public.test_submissions
  ADD COLUMN IF NOT EXISTS warnings_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_room_url TEXT,
  ADD COLUMN IF NOT EXISTS screen_recording_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_grades JSONB,
  ADD COLUMN IF NOT EXISTS activity_log JSONB;

-- Create storage bucket for test recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('test-recordings', 'test-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for test-recordings
DROP POLICY IF EXISTS "Students can upload their recordings" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can read student recordings" ON storage.objects;

CREATE POLICY "Students can upload their recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'test-recordings');

CREATE POLICY "Mentors can read student recordings"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'test-recordings');
