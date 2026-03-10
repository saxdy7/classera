-- Fix test_invitations table to add missing columns
-- This migration is safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- Add invited_by column (referenced in assign route but missing from MASTER_FIX schema)
ALTER TABLE public.test_invitations
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add responded_at for tracking when student accepted/declined
ALTER TABLE public.test_invitations
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Ensure the select policy allows students to see their own invitations
DROP POLICY IF EXISTS "test_inv_select" ON public.test_invitations;
CREATE POLICY "test_inv_select" ON public.test_invitations
  FOR SELECT USING (
    auth.uid() = student_id OR
    auth.uid() = invited_by OR
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_invitations.test_id
        AND t.mentor_id = auth.uid()
    )
  );

-- Ensure insert policy allows authenticated mentors
DROP POLICY IF EXISTS "test_inv_insert" ON public.test_invitations;
CREATE POLICY "test_inv_insert" ON public.test_invitations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update policy
DROP POLICY IF EXISTS "test_inv_update" ON public.test_invitations;
CREATE POLICY "test_inv_update" ON public.test_invitations
  FOR UPDATE USING (
    auth.uid() = student_id OR
    auth.uid() = invited_by OR
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_invitations.test_id
        AND t.mentor_id = auth.uid()
    )
  );
