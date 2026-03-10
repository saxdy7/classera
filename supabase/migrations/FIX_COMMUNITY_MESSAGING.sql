-- ============================================================================
-- FIX_COMMUNITY_MESSAGING.sql
-- Run in Supabase SQL Editor AFTER MASTER_FIX.sql
-- Fixes community chat and adds mentor messaging toggle
-- ============================================================================

-- ============================================================
-- 1. Add messaging_enabled toggle to communities
-- ============================================================
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS messaging_enabled BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 2. Fix community_channels schema
-- ============================================================
ALTER TABLE public.community_channels
  ADD COLUMN IF NOT EXISTS is_locked     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ DEFAULT now();

-- Drop old type constraint and allow 'discussion' and 'announcement'
ALTER TABLE public.community_channels DROP CONSTRAINT IF EXISTS community_channels_type_check;
ALTER TABLE public.community_channels
  ADD CONSTRAINT community_channels_type_check
  CHECK (type IN ('announcement', 'discussion', 'text', 'voice', 'video'));

-- ============================================================
-- 3. Fix community_messages schema — ensure all required columns
-- ============================================================
ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS sender_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_deleted       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by       UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS edited_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS thread_count     INTEGER DEFAULT 0;

-- Back-fill sender_id from user_id if that column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_messages' AND column_name = 'user_id'
  ) THEN
    UPDATE public.community_messages SET sender_id = user_id WHERE sender_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- 4. Create missing helper tables for chat features
-- ============================================================

-- Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Message attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  file_name  TEXT NOT NULL,
  file_url   TEXT NOT NULL,
  file_type  TEXT,
  file_size  BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Message edit history
CREATE TABLE IF NOT EXISTS public.message_edit_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_at   TIMESTAMPTZ DEFAULT now()
);

-- Pinned messages
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  message_id   UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  pinned_by    UUID REFERENCES public.users(id),
  pinned_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, message_id)
);

-- Community muted users
CREATE TABLE IF NOT EXISTS public.community_muted_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  muted_by     UUID REFERENCES public.users(id),
  muted_until  TIMESTAMPTZ,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Community moderation logs
CREATE TABLE IF NOT EXISTS public.community_moderation_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  action_type  TEXT,         -- for messages API
  action       TEXT,         -- for channels API (LOCK_CHANNEL etc)
  performed_by UUID REFERENCES public.users(id),
  mentor_id    UUID REFERENCES public.users(id),
  target_id    UUID,
  reason       TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Enable RLS on new tables
-- ============================================================
ALTER TABLE public.message_reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_edit_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_muted_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "mr_sel"  ON public.message_reactions;
DROP POLICY IF EXISTS "mr_ins"  ON public.message_reactions;
DROP POLICY IF EXISTS "mr_del"  ON public.message_reactions;
DROP POLICY IF EXISTS "ma_sel"  ON public.message_attachments;
DROP POLICY IF EXISTS "ma_ins"  ON public.message_attachments;
DROP POLICY IF EXISTS "mrr_all" ON public.message_read_receipts;
DROP POLICY IF EXISTS "meh_sel" ON public.message_edit_history;
DROP POLICY IF EXISTS "pm_sel"  ON public.pinned_messages;
DROP POLICY IF EXISTS "pm_all"  ON public.pinned_messages;
DROP POLICY IF EXISTS "cmu_sel" ON public.community_muted_users;
DROP POLICY IF EXISTS "cmu_all" ON public.community_muted_users;
DROP POLICY IF EXISTS "cml_sel" ON public.community_moderation_logs;

CREATE POLICY "mr_sel"  ON public.message_reactions     FOR SELECT USING (true);
CREATE POLICY "mr_ins"  ON public.message_reactions     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "mr_del"  ON public.message_reactions     FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "ma_sel"  ON public.message_attachments   FOR SELECT USING (true);
CREATE POLICY "ma_ins"  ON public.message_attachments   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "mrr_all" ON public.message_read_receipts FOR ALL   USING (auth.uid() IS NOT NULL);
CREATE POLICY "meh_sel" ON public.message_edit_history  FOR SELECT USING (true);
CREATE POLICY "pm_sel"  ON public.pinned_messages       FOR SELECT USING (true);
CREATE POLICY "pm_all"  ON public.pinned_messages       FOR ALL   USING (auth.uid() IS NOT NULL);
CREATE POLICY "cmu_sel" ON public.community_muted_users FOR SELECT USING (true);
CREATE POLICY "cmu_all" ON public.community_muted_users FOR ALL   USING (auth.uid() IS NOT NULL);
CREATE POLICY "cml_sel" ON public.community_moderation_logs FOR SELECT USING (true);

-- Fix community_messages RLS
DROP POLICY IF EXISTS "Members can send messages"   ON public.community_messages;
DROP POLICY IF EXISTS "Members can view messages"   ON public.community_messages;
DROP POLICY IF EXISTS "cm_msg_select" ON public.community_messages;
DROP POLICY IF EXISTS "cm_msg_insert" ON public.community_messages;
DROP POLICY IF EXISTS "cm_msg_update" ON public.community_messages;

CREATE POLICY "cm_msg_select" ON public.community_messages FOR SELECT USING (true);
CREATE POLICY "cm_msg_insert" ON public.community_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cm_msg_update" ON public.community_messages FOR UPDATE USING (
  sender_id = auth.uid() OR auth.uid() IS NOT NULL
);

-- Fix community_channels RLS
DROP POLICY IF EXISTS "Members can view channels" ON public.community_channels;
DROP POLICY IF EXISTS "ch_select" ON public.community_channels;
DROP POLICY IF EXISTS "ch_insert" ON public.community_channels;
DROP POLICY IF EXISTS "ch_update" ON public.community_channels;

CREATE POLICY "ch_select" ON public.community_channels FOR SELECT USING (true);
CREATE POLICY "ch_insert" ON public.community_channels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ch_update" ON public.community_channels FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 6. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cm_channel_created  ON public.community_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cm_sender           ON public.community_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_cm_parent           ON public.community_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_mr_message          ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_pm_community        ON public.pinned_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_cmu_community_user  ON public.community_muted_users(community_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cc_community        ON public.community_channels(community_id);

-- ============================================================
-- 7. Ensure each community has default channels
--    (announcement + discussion) — safe to re-run
-- ============================================================
INSERT INTO public.community_channels (community_id, name, type, is_locked)
SELECT c.id, 'Announcements', 'announcement', false
FROM   public.communities c
WHERE  NOT EXISTS (
  SELECT 1 FROM public.community_channels cc
  WHERE cc.community_id = c.id AND cc.type = 'announcement'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.community_channels (community_id, name, type, is_locked)
SELECT c.id, 'General', 'discussion', false
FROM   public.communities c
WHERE  NOT EXISTS (
  SELECT 1 FROM public.community_channels cc
  WHERE cc.community_id = c.id AND cc.type = 'discussion'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. Enable Realtime for messaging tables
-- ============================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.community_channels;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Done! Verify:
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'community_messages', 'community_channels', 'message_reactions',
    'message_attachments', 'message_read_receipts', 'pinned_messages',
    'community_muted_users', 'community_moderation_logs'
  )
ORDER BY table_name;
