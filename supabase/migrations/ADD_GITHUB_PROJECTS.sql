-- ============================================================
-- GitHub Integration & Project Assignments
-- ============================================================

-- GitHub OAuth connections (one per user)
CREATE TABLE IF NOT EXISTS github_connections (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  github_user_id   BIGINT,
  github_username  TEXT NOT NULL,
  github_name      TEXT,
  github_avatar_url TEXT,
  github_profile_url TEXT,
  access_token     TEXT NOT NULL,
  token_scope      TEXT,
  public_repos     INTEGER DEFAULT 0,
  followers        INTEGER DEFAULT 0,
  following        INTEGER DEFAULT 0,
  connected_at     TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Project assignments created by mentors
CREATE TABLE IF NOT EXISTS project_assignments (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  university_id  UUID REFERENCES universities(id),
  title          TEXT NOT NULL,
  description    TEXT,
  requirements   TEXT,
  technologies   TEXT[] DEFAULT '{}',
  deadline       TIMESTAMPTZ,
  max_score      INTEGER DEFAULT 100,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Assignment ↔ student mapping
CREATE TABLE IF NOT EXISTS assignment_students (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id  UUID REFERENCES project_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assigned_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Student GitHub repo submission per assignment
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id   UUID REFERENCES project_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  repo_url        TEXT NOT NULL,
  repo_owner      TEXT,
  repo_name       TEXT,
  repo_full_name  TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'submitted', -- submitted | analyzing | analyzed | reviewed | graded
  UNIQUE(assignment_id, student_id)
);

-- Cached repository analytics (stale after 6h, refreshable)
CREATE TABLE IF NOT EXISTS repo_analytics (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id    UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE UNIQUE,
  student_id       UUID REFERENCES users(id),
  repo_full_name   TEXT NOT NULL,
  -- Basic stats
  total_commits    INTEGER DEFAULT 0,
  total_branches   INTEGER DEFAULT 0,
  total_files      INTEGER DEFAULT 0,
  repo_size_kb     INTEGER DEFAULT 0,
  open_issues      INTEGER DEFAULT 0,
  stars            INTEGER DEFAULT 0,
  forks            INTEGER DEFAULT 0,
  -- Dates
  repo_created_at  TIMESTAMPTZ,
  last_push_at     TIMESTAMPTZ,
  last_commit_at   TIMESTAMPTZ,
  -- Activity
  active_days      INTEGER DEFAULT 0,
  commit_frequency JSONB DEFAULT '[]'::jsonb,   -- [{week_start, commits}]
  daily_activity   JSONB DEFAULT '{}'::jsonb,   -- {"YYYY-MM-DD": count}
  weekly_activity  JSONB DEFAULT '[]'::jsonb,   -- [{week, total}]
  contributors     JSONB DEFAULT '[]'::jsonb,
  languages        JSONB DEFAULT '{}'::jsonb,
  -- Code quality
  total_lines      INTEGER DEFAULT 0,
  complexity_level TEXT DEFAULT 'medium',        -- low | medium | high
  has_readme       BOOLEAN DEFAULT false,
  has_tests        BOOLEAN DEFAULT false,
  folder_depth     INTEGER DEFAULT 0,
  -- Scores (0-100)
  consistency_score INTEGER DEFAULT 0,
  activity_score    INTEGER DEFAULT 0,
  quality_score     INTEGER DEFAULT 0,
  overall_score     INTEGER DEFAULT 0,
  -- Suspicious activity flags
  suspicious_flags  JSONB DEFAULT '[]'::jsonb,
  -- Project timeline
  timeline_events   JSONB DEFAULT '[]'::jsonb,
  -- File tree (cached)
  file_tree         JSONB DEFAULT '[]'::jsonb,
  -- Metadata
  analyzed_at       TIMESTAMPTZ DEFAULT now(),
  is_stale          BOOLEAN DEFAULT false
);

-- Mentor evaluation / grading
CREATE TABLE IF NOT EXISTS project_evaluations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  assignment_id UUID REFERENCES project_assignments(id) ON DELETE CASCADE NOT NULL,
  mentor_id     UUID REFERENCES users(id) NOT NULL,
  student_id    UUID REFERENCES users(id) NOT NULL,
  score         INTEGER,
  feedback      TEXT,
  comments      JSONB DEFAULT '[]'::jsonb,  -- [{text, created_at}]
  evaluated_at  TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE github_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_analytics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_evaluations   ENABLE ROW LEVEL SECURITY;

-- All access via service-role client (admin) in API routes
CREATE POLICY "service_role_all" ON github_connections    FOR ALL USING (true);
CREATE POLICY "service_role_all" ON project_assignments   FOR ALL USING (true);
CREATE POLICY "service_role_all" ON assignment_students   FOR ALL USING (true);
CREATE POLICY "service_role_all" ON assignment_submissions FOR ALL USING (true);
CREATE POLICY "service_role_all" ON repo_analytics        FOR ALL USING (true);
CREATE POLICY "service_role_all" ON project_evaluations   FOR ALL USING (true);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_github_connections_user_id   ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_mentor   ON project_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_assignment_students_assign   ON assignment_students(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_students_student  ON assignment_students(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assign ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_repo_analytics_submission    ON repo_analytics(submission_id);
CREATE INDEX IF NOT EXISTS idx_repo_analytics_student       ON repo_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_submission ON project_evaluations(submission_id);
