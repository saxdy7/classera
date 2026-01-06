-- Add polls table
CREATE TABLE IF NOT EXISTS community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES community_channels(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, text, votes: [user_ids]}
  multiple_choice BOOLEAN DEFAULT false,
  anonymous BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id)
);

-- RLS Policies
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Community members can view polls
CREATE POLICY "Community members can view polls"
  ON community_polls FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members
      WHERE student_id = auth.uid() AND status = 'approved'
    )
  );

-- Mentors can create polls
CREATE POLICY "Mentors can create polls"
  ON community_polls FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_id AND mentor_id = auth.uid()
    )
  );

-- Creators can update/delete polls
CREATE POLICY "Creators can update polls"
  ON community_polls FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete polls"
  ON community_polls FOR DELETE
  USING (created_by = auth.uid());

-- Community members can view votes
CREATE POLICY "Community members can view votes"
  ON poll_votes FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM community_polls
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

-- Community members can vote
CREATE POLICY "Community members can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    poll_id IN (
      SELECT id FROM community_polls
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_community_polls_community ON community_polls(community_id);
CREATE INDEX idx_community_polls_channel ON community_polls(channel_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);
