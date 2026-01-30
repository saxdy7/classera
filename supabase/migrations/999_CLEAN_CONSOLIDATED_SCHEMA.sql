-- ============================================================================
-- CLASSERA DATABASE SCHEMA - CONSOLIDATED MIGRATION
-- ============================================================================
-- This is a clean, consolidated schema for the Classera platform
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Universities Table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL UNIQUE,
    country TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (Students & Mentors)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'mentor')),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    
    -- Student-specific fields
    specialization_board TEXT,
    current_semester INTEGER,
    interests TEXT[],
    
    -- Mentor-specific fields
    expertise TEXT,
    years_of_experience INTEGER,
    linkedin_url TEXT,
    github_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING SYSTEM (Using OLD schema - migration 003)
-- ============================================================================

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure users can't message themselves
    CHECK (sender_id != receiver_id)
);

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'message', 'task', 'session', 'community')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONNECTION REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connection_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a student can't request the same mentor twice
    UNIQUE(student_id, mentor_id)
);

-- ============================================================================
-- TASKS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMMUNITIES SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(university_id, name)
);

CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(community_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'video')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(community_id, name)
);

CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COURSES SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    thumbnail_url TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_published BOOLEAN DEFAULT FALSE,
    estimated_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LIVE SESSIONS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_url TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_university ON public.users(university_id);

-- Messages indexes (OLD schema)
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender ON public.messages(receiver_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read) WHERE NOT is_read;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Connection requests indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_student ON public.connection_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_mentor ON public.connection_requests(mentor_id, status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_student_status ON public.tasks(student_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_mentor_status ON public.tasks(mentor_id, status, due_date) WHERE mentor_id IS NOT NULL;

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_university ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty_published ON public.courses(difficulty, is_published) WHERE is_published = TRUE;

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON public.community_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- UNIVERSITIES POLICIES
-- ============================================================================

-- Everyone can view universities
CREATE POLICY "Anyone can view universities" ON public.universities
    FOR SELECT USING (true);

-- ============================================================================
-- USERS POLICIES (University-isolated)
-- ============================================================================

-- Users can view other users in their university
CREATE POLICY "Users can view users in their university" ON public.users
    FOR SELECT USING (
        university_id IN (
            SELECT university_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- New users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- MESSAGES POLICIES (University-isolated)
-- ============================================================================

-- Users can view messages they sent or received (in their university)
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Users can send messages to users in their university
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        receiver_id IN (
            SELECT id FROM public.users 
            WHERE university_id = (
                SELECT university_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Users can update their received messages (mark as read)
CREATE POLICY "Users can update received messages" ON public.messages
    FOR UPDATE USING (receiver_id = auth.uid());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "Service can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- CONNECTION REQUESTS POLICIES (University-isolated)
-- ============================================================================

CREATE POLICY "Students can view their requests" ON public.connection_requests
    FOR SELECT USING (student_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "Students can create requests" ON public.connection_requests
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        mentor_id IN (
            SELECT id FROM public.users 
            WHERE role = 'mentor' 
            AND university_id = (
                SELECT university_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Mentors can update requests" ON public.connection_requests
    FOR UPDATE USING (mentor_id = auth.uid());

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================

CREATE POLICY "Students can view own tasks" ON public.tasks
    FOR SELECT USING (student_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "Students can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Task owners can update tasks" ON public.tasks
    FOR UPDATE USING (student_id = auth.uid() OR mentor_id = auth.uid());

-- ============================================================================
-- COMMUNITIES POLICIES (University-isolated)
-- ============================================================================

CREATE POLICY "Users can view communities in their university" ON public.communities
    FOR SELECT USING (
        university_id = (
            SELECT university_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create communities" ON public.communities
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Community members can view members
CREATE POLICY "Members can view community members" ON public.community_members
    FOR SELECT USING (
        community_id IN (
            SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join communities" ON public.community_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Community channels
CREATE POLICY "Members can view channels" ON public.community_channels
    FOR SELECT USING (
        community_id IN (
            SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
        )
    );

-- Community messages
CREATE POLICY "Members can view messages" ON public.community_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM public.community_channels WHERE community_id IN (
                SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Members can send messages" ON public.community_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COURSES POLICIES
-- ============================================================================

CREATE POLICY "Users can view published courses" ON public.courses
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Instructors can manage own courses" ON public.courses
    FOR ALL USING (instructor_id = auth.uid());

-- ============================================================================
-- LIVE SESSIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view sessions in their university" ON public.live_sessions
    FOR SELECT USING (
        mentor_id IN (
            SELECT id FROM public.users 
            WHERE university_id = (
                SELECT university_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Mentors can create sessions" ON public.live_sessions
    FOR INSERT WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Mentors can manage own sessions" ON public.live_sessions
    FOR UPDATE USING (mentor_id = auth.uid());

-- Session participants
CREATE POLICY "Users can view session participants" ON public.session_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join sessions" ON public.session_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for messages (use DO block to avoid errors if already added)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SEED DATA - SAMPLE UNIVERSITY
-- ============================================================================

-- Insert a sample university (modify as needed)
INSERT INTO public.universities (name, domain, country)
VALUES ('Sample University', 'sample.edu', 'USA')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connection_requests_updated_at BEFORE UPDATE ON public.connection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.live_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE! 
-- ============================================================================
-- Your Classera database is now ready to use.
-- You can access this database through:
-- 1. Supabase Dashboard > SQL Editor (web interface)
-- 2. VS Code with PostgreSQL extension (connect using connection string)
-- 3. Supabase CLI: npx supabase db remote -db-url <your-connection-string>
-- ============================================================================
