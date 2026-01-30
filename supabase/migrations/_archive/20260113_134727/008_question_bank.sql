-- Add question bank table
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'coding', 'short_answer', 'long_answer')),
  subject TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB, -- For MCQ: array of options
  correct_answer TEXT, -- For MCQ: correct option id
  code_template TEXT, -- For coding questions
  test_cases JSONB, -- For coding questions
  marks INTEGER DEFAULT 1,
  tags TEXT[], -- Array of tags for categorization
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add question bank usage tracking (which tests used which questions)
CREATE TABLE IF NOT EXISTS test_question_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, question_id)
);

-- RLS Policies
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_question_usage ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own questions
CREATE POLICY "Mentors can view own questions"
  ON question_bank FOR SELECT
  USING (mentor_id = auth.uid());

-- Mentors can create questions
CREATE POLICY "Mentors can create questions"
  ON question_bank FOR INSERT
  WITH CHECK (mentor_id = auth.uid());

-- Mentors can update their own questions
CREATE POLICY "Mentors can update own questions"
  ON question_bank FOR UPDATE
  USING (mentor_id = auth.uid());

-- Mentors can delete their own questions
CREATE POLICY "Mentors can delete own questions"
  ON question_bank FOR DELETE
  USING (mentor_id = auth.uid());

-- Test question usage policies
CREATE POLICY "Mentors can view test question usage"
  ON test_question_usage FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests WHERE mentor_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can track question usage"
  ON test_question_usage FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM tests WHERE mentor_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_question_bank_mentor ON question_bank(mentor_id);
CREATE INDEX idx_question_bank_type ON question_bank(question_type);
CREATE INDEX idx_question_bank_subject ON question_bank(subject);
CREATE INDEX idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN(tags);
CREATE INDEX idx_test_question_usage_test ON test_question_usage(test_id);
CREATE INDEX idx_test_question_usage_question ON test_question_usage(question_id);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_question_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE question_bank
  SET usage_count = usage_count + 1
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment usage count
CREATE TRIGGER question_usage_trigger
AFTER INSERT ON test_question_usage
FOR EACH ROW
EXECUTE FUNCTION increment_question_usage();
