-- Classera Database Schema
-- This SQL script sets up the complete database structure for the platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DROP EXISTING TABLES (Clean Slate)
-- =============================================
DROP TABLE IF EXISTS course_progress CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS test_submissions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS universities CASCADE;

-- =============================================
-- UNIVERSITIES TABLE
-- =============================================
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE, -- Email domain (e.g., lpu.co.in)
  country TEXT NOT NULL DEFAULT 'India',
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USERS TABLE (Students & Mentors)
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor')),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  
  -- Profile fields
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  
  -- Student-specific fields
  degree_type TEXT, -- B.Tech, M.Tech, etc.
  graduation_year INTEGER,
  specialization_board TEXT, -- Full Stack, AI/ML, etc.
  current_semester INTEGER,
  
  -- Mentor-specific fields
  expertise TEXT[], -- Array of expertise areas
  years_of_experience INTEGER,
  profile_verified BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  github_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COMMUNITIES TABLE
-- =============================================
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COMMUNITY MEMBERS TABLE
-- =============================================
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, student_id)
);

-- =============================================
-- TESTS TABLE
-- =============================================
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL, -- Optional, for group tests
  
  -- Test configuration
  test_type TEXT NOT NULL CHECK (test_type IN ('individual', 'group')),
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'coding', 'mixed')),
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  is_live BOOLEAN DEFAULT false,
  
  -- Questions (stored as JSONB)
  questions JSONB NOT NULL,
  
  -- Video settings
  enable_screen_recording BOOLEAN DEFAULT true,
  enable_face_monitoring BOOLEAN DEFAULT true,
  daily_room_url TEXT, -- Daily.co room URL
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEST SUBMISSIONS TABLE
-- =============================================
CREATE TABLE test_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Submission data
  answers JSONB NOT NULL,
  score NUMERIC(5,2),
  max_score INTEGER,
  percentage NUMERIC(5,2),
  
  -- AI Analysis
  ai_analysis JSONB, -- {question_id, is_correct, explanation, improvement_tips}
  ai_evaluated_at TIMESTAMP WITH TIME ZONE,
  
  -- Mentor Feedback
  mentor_feedback TEXT,
  mentor_evaluated_at TIMESTAMP WITH TIME ZONE,
  
  -- Monitoring data
  screen_recording_url TEXT,
  face_snapshots TEXT[], -- Array of snapshot URLs
  activity_log JSONB, -- Tracking suspicious activity
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(test_id, student_id)
);

-- =============================================
-- MESSAGES TABLE (Personal & Community)
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Either personal message OR community message
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
  attachment_url TEXT,
  
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure it's either personal or community message
  CHECK (
    (receiver_id IS NOT NULL AND community_id IS NULL) OR
    (receiver_id IS NULL AND community_id IS NOT NULL)
  )
);

-- =============================================
-- TASKS TABLE (Student Task Board)
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- LEADERBOARD TABLE
-- =============================================
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  
  -- Time period
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  
  -- Metrics
  total_score NUMERIC(10,2) DEFAULT 0,
  tests_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  average_percentage NUMERIC(5,2) DEFAULT 0,
  rank INTEGER,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, month, year)
);

-- =============================================
-- COURSES TABLE
-- =============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  specialization TEXT, -- Full Stack, AI/ML, etc.
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- YouTube content
  youtube_playlist_id TEXT,
  video_count INTEGER,
  total_duration_minutes INTEGER,
  
  -- Metadata
  thumbnail_url TEXT,
  is_mentor_recommended BOOLEAN DEFAULT false,
  recommended_by_mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COURSE PROGRESS TABLE
-- =============================================
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  videos_completed INTEGER DEFAULT 0,
  total_videos INTEGER,
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, course_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_users_university ON users(university_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_communities_university ON communities(university_id);
CREATE INDEX idx_communities_mentor ON communities(mentor_id);
CREATE INDEX idx_tests_mentor ON tests(mentor_id);
CREATE INDEX idx_tests_university ON tests(university_id);
CREATE INDEX idx_test_submissions_test ON test_submissions(test_id);
CREATE INDEX idx_test_submissions_student ON test_submissions(student_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_community ON messages(community_id);
CREATE INDEX idx_tasks_student ON tasks(student_id);
CREATE INDEX idx_leaderboard_university_month ON leaderboard(university_id, month, year);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Universities are readable by all authenticated users
CREATE POLICY "Universities readable by all"
  ON universities FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can read all users (needed for mentor/student discovery)
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());
  
-- Users can insert their own profile (for onboarding)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Communities visible to all authenticated users (for browsing)
CREATE POLICY "Communities visible to authenticated users"
  ON communities FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Mentors can create communities
CREATE POLICY "Mentors create communities"
  ON communities FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mentor')
  );

-- Tests visible to all authenticated users
CREATE POLICY "Tests visible to authenticated users"
  ON tests FOR SELECT
  USING (auth.uid() IS NOT NULL);
  
-- Mentors can create tests
CREATE POLICY "Mentors can create tests"
  ON tests FOR INSERT
  WITH CHECK (mentor_id = auth.uid());

-- Students see their own submissions
CREATE POLICY "Students see own submissions"
  ON test_submissions FOR SELECT
  USING (student_id = auth.uid());

-- Mentors see submissions for their tests
CREATE POLICY "Mentors see their test submissions"
  ON test_submissions FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests WHERE mentor_id = auth.uid()
    )
  );

-- Personal messages: sender or receiver can read
CREATE POLICY "Users read their messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    (community_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = messages.community_id
      AND student_id = auth.uid()
      AND status = 'approved'
    ))
  );

-- Students manage their own tasks
CREATE POLICY "Students manage own tasks"
  ON tasks FOR ALL
  USING (student_id = auth.uid());

-- Leaderboard visible to all authenticated users
CREATE POLICY "Leaderboard visible to authenticated users"
  ON leaderboard FOR SELECT
  USING (auth.uid() IS NOT NULL);
  
-- Courses visible to all authenticated users
CREATE POLICY "Courses visible to authenticated users"
  ON courses FOR SELECT
  USING (auth.uid() IS NOT NULL);
  
-- Course progress visible to owner
CREATE POLICY "Users see own course progress"
  ON course_progress FOR SELECT
  USING (student_id = auth.uid());
  
-- Community members can view memberships
CREATE POLICY "Community members visible to authenticated users"
  ON community_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate leaderboard ranks
CREATE OR REPLACE FUNCTION calculate_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  UPDATE leaderboard l1
  SET rank = (
    SELECT COUNT(*) + 1
    FROM leaderboard l2
    WHERE l2.university_id = l1.university_id
    AND l2.month = l1.month
    AND l2.year = l1.year
    AND l2.total_score > l1.total_score
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SEED DATA (Sample Universities)
-- =============================================
INSERT INTO universities (name, domain, country, state) VALUES
  ('Lovely Professional University', 'lpu.co.in', 'India', 'Punjab'),
  ('Parul University', 'paruluniversity.ac.in', 'India', 'Gujarat'),
  ('SRM Institute of Science and Technology', 'srmist.edu.in', 'India', 'Tamil Nadu'),
  ('VIT Vellore', 'vit.ac.in', 'India', 'Tamil Nadu'),
  ('Manipal Academy of Higher Education', 'manipal.edu', 'India', 'Karnataka');
