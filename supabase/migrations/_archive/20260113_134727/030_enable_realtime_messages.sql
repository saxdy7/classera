-- Enable Realtime for messages table
-- This ensures postgres_changes subscriptions work properly

-- Step 1: Enable REPLICA IDENTITY FULL for the messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Step 2: Add the messages table to the realtime publication (with error handling)
DO $$ 
BEGIN
    -- Try to add table to publication, ignore if already exists
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Table messages already in publication';
    END;
END $$;

-- Step 3: Create indexes for faster real-time queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created 
    ON public.messages(receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
    ON public.messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
    ON public.messages(sender_id, receiver_id);

-- Step 4: Add columns needed for real-time messaging (if they don't exist)
DO $$ 
BEGIN
    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file'));
    END IF;

    -- Add file columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_url'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN file_url TEXT;
        ALTER TABLE public.messages ADD COLUMN file_name TEXT;
        ALTER TABLE public.messages ADD COLUMN file_size BIGINT;
    END IF;

    -- Add edit/delete flags if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_edited'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

