-- ============================================================
-- Drop the dead "project catalog" system (projects, project_submissions).
-- Verified live: both tables exist with 0 rows and, after removing the
-- broken pages/routes that referenced them, zero remaining code references
-- anywhere in the app. Safe to drop - no data loss, nothing left pointing
-- at them.
-- ============================================================
DROP TABLE IF EXISTS project_submissions;
DROP TABLE IF EXISTS projects;

-- ============================================================
-- Projects: next-level features
-- Adds support for non-GitHub submission types, deploy links,
-- cross-submission similarity flags, portfolio opt-in, and
-- linking the existing Tasks/Kanban board to project assignments
-- as milestones/checkpoints.
-- ============================================================

-- Mentor picks how students submit work for this assignment.
ALTER TABLE project_assignments
  ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'github'
    CHECK (submission_type IN ('github', 'file_upload', 'link', 'written'));

-- Non-GitHub submission payloads + a deploy/live-preview link (any submission type can have one).
ALTER TABLE assignment_submissions
  ADD COLUMN IF NOT EXISTS submission_url  TEXT,
  ADD COLUMN IF NOT EXISTS submission_text TEXT,
  ADD COLUMN IF NOT EXISTS file_url        TEXT,
  ADD COLUMN IF NOT EXISTS file_name       TEXT,
  ADD COLUMN IF NOT EXISTS deploy_url      TEXT;

-- repo_url is only meaningful for GitHub submissions now that other types exist.
ALTER TABLE assignment_submissions
  ALTER COLUMN repo_url DROP NOT NULL;

-- Cross-submission code-similarity flags, alongside the existing suspicious_flags.
ALTER TABLE repo_analytics
  ADD COLUMN IF NOT EXISTS similarity_flags JSONB DEFAULT '[]'::jsonb;

-- Cached AI-generated "what to improve next" note shown to the student
-- (separate from repo_analytics.ai_review, which is the mentor-facing review).
ALTER TABLE repo_analytics
  ADD COLUMN IF NOT EXISTS student_insight JSONB;

-- Student opt-in to showcase a graded project on their public portfolio.
ALTER TABLE project_evaluations
  ADD COLUMN IF NOT EXISTS featured_on_portfolio BOOLEAN DEFAULT false;

-- Link the existing personal Kanban board to a project assignment, so a
-- mentor can create checkpoint tasks under a project instead of it being a
-- single pass/fail cliff-edge at the deadline. Nullable - existing personal
-- tasks (assignment_id IS NULL) are unaffected.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES project_assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assignment_id ON tasks(assignment_id);
