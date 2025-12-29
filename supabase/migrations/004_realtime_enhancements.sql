-- Realtime Enhancements Migration
-- This migration adds presence tracking and typing indicators

-- =============================================
-- USER PRESENCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Presence readable by authenticated users" ON public.user_presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update own presence status" ON public.user_presence;

-- Policy: Everyone can read presence
CREATE POLICY "Presence readable by authenticated users"
  ON public.user_presence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can insert their own presence
CREATE POLICY "Users can insert own presence"
  ON public.user_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own presence
CREATE POLICY "Users can update own presence status"
  ON public.user_presence
  FOR UPDATE
  USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_presence_updated_at ON public.user_presence;

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_updated_at();

-- =============================================
-- TYPING INDICATORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_with UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_with)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see typing in their conversations" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can insert own typing status" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update own typing status" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can delete own typing status" ON public.typing_indicators;

-- Policy: Users can see typing indicators for their conversations
CREATE POLICY "Users can see typing in their conversations"
  ON public.typing_indicators
  FOR SELECT
  USING (
    user_id = auth.uid() OR conversation_with = auth.uid()
  );

-- Policy: Users can insert/update their own typing status
CREATE POLICY "Users can insert own typing status"
  ON public.typing_indicators
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own typing status"
  ON public.typing_indicators
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own typing status"
  ON public.typing_indicators
  FOR DELETE
  USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_typing_user_conversation 
  ON public.typing_indicators(user_id, conversation_with);

-- Auto-delete old typing indicators (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE created_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATE MESSAGES TABLE FOR BETTER REALTIME
-- =============================================
-- Add index for better realtime performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
  ON public.messages(sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc 
  ON public.messages(created_at DESC);

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.user_presence IS 'Tracks online/offline status of users';
COMMENT ON TABLE public.typing_indicators IS 'Ephemeral data showing when users are typing';
COMMENT ON FUNCTION cleanup_old_typing_indicators() IS 'Removes stale typing indicators older than 10 seconds';
