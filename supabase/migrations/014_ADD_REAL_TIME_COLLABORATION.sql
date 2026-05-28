-- Collaboration Tables Migration
-- Adds support for real-time collaborative editing

-- Drop existing policies (idempotent cleanup)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Members can view their own collaboration memberships" ON collaboration_members;
  DROP POLICY IF EXISTS "Assignment mentor can manage collaborators" ON collaboration_members;
  DROP POLICY IF EXISTS "Users can view invites sent to them" ON collaboration_invites;
  DROP POLICY IF EXISTS "Assignment mentor can manage invites" ON collaboration_invites;
  DROP POLICY IF EXISTS "Collaborators can view versions" ON collaboration_versions;
  DROP POLICY IF EXISTS "Users can save their own versions" ON collaboration_versions;
  DROP POLICY IF EXISTS "Collaborators can view activity" ON collaboration_activity;
  DROP POLICY IF EXISTS "Users can log their own activity" ON collaboration_activity;
  DROP POLICY IF EXISTS "Collaborators can view comments" ON collaboration_comments;
  DROP POLICY IF EXISTS "Collaborators can create comments" ON collaboration_comments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create collaboration_members table
CREATE TABLE IF NOT EXISTS collaboration_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Create collaboration_invites table
CREATE TABLE IF NOT EXISTS collaboration_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, invitee_email)
);

-- Create collaboration_versions table
CREATE TABLE IF NOT EXISTS collaboration_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  content TEXT,
  description TEXT,
  word_count INT DEFAULT 0,
  char_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration_activity table for tracking edits
CREATE TABLE IF NOT EXISTS collaboration_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration_comments table for document discussions
CREATE TABLE IF NOT EXISTS collaboration_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  line_number INT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_members_assignment_id ON collaboration_members(assignment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_members_user_id ON collaboration_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_assignment_id ON collaboration_invites(assignment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_email ON collaboration_invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_collaboration_versions_assignment_id ON collaboration_versions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_versions_created_at ON collaboration_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_assignment_id ON collaboration_activity(assignment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_comments_assignment_id ON collaboration_comments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_comments_line ON collaboration_comments(line_number);

-- Enable RLS on all collaboration tables
ALTER TABLE collaboration_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_members
CREATE POLICY "Members can view their own collaboration memberships"
  ON collaboration_members FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM collaboration_members cm
    WHERE cm.assignment_id = collaboration_members.assignment_id
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Assignment mentor can manage collaborators"
  ON collaboration_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM project_assignments
    WHERE project_assignments.id = collaboration_members.assignment_id
    AND project_assignments.mentor_id = auth.uid()
  ));

-- RLS Policies for collaboration_invites
CREATE POLICY "Users can view invites sent to them"
  ON collaboration_invites FOR SELECT
  USING (invitee_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Assignment mentor can manage invites"
  ON collaboration_invites FOR ALL
  USING (EXISTS (
    SELECT 1 FROM project_assignments
    WHERE project_assignments.id = collaboration_invites.assignment_id
    AND project_assignments.mentor_id = auth.uid()
  ));

-- RLS Policies for collaboration_versions
CREATE POLICY "Collaborators can view versions"
  ON collaboration_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM collaboration_members
    WHERE collaboration_members.assignment_id = collaboration_versions.assignment_id
    AND collaboration_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can save their own versions"
  ON collaboration_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM collaboration_members
    WHERE collaboration_members.assignment_id = collaboration_versions.assignment_id
    AND collaboration_members.user_id = auth.uid()
  ));

-- RLS Policies for collaboration_activity
CREATE POLICY "Collaborators can view activity"
  ON collaboration_activity FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM collaboration_members
    WHERE collaboration_members.assignment_id = collaboration_activity.assignment_id
    AND collaboration_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can log their own activity"
  ON collaboration_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for collaboration_comments
CREATE POLICY "Collaborators can view comments"
  ON collaboration_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM collaboration_members
    WHERE collaboration_members.assignment_id = collaboration_comments.assignment_id
    AND collaboration_members.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can create comments"
  ON collaboration_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM collaboration_members
    WHERE collaboration_members.assignment_id = collaboration_comments.assignment_id
    AND collaboration_members.user_id = auth.uid()
  ));

-- Create function to update word/char counts
CREATE OR REPLACE FUNCTION update_version_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count := array_length(string_to_array(trim(NEW.content), ' '), 1);
  NEW.char_count := length(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version stats
DROP TRIGGER IF EXISTS trigger_update_version_stats ON collaboration_versions;
CREATE TRIGGER trigger_update_version_stats
  BEFORE INSERT OR UPDATE ON collaboration_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_version_stats();

-- Create function to auto-add project mentor as member
CREATE OR REPLACE FUNCTION add_project_mentor_to_collaboration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO collaboration_members (assignment_id, user_id, role)
  SELECT NEW.id, NEW.mentor_id, 'owner'
  ON CONFLICT (assignment_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add project mentor to collaboration
DROP TRIGGER IF EXISTS trigger_add_mentor_to_collaboration ON project_assignments;
CREATE TRIGGER trigger_add_mentor_to_collaboration
  AFTER INSERT ON project_assignments
  FOR EACH ROW
  EXECUTE FUNCTION add_project_mentor_to_collaboration();

-- Create function to clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS TABLE(removed_count INT) AS $$
BEGIN
  DELETE FROM collaboration_invites
  WHERE status = 'pending' AND expires_at < NOW();
  
  RETURN QUERY SELECT COUNT(*) FROM collaboration_invites WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
