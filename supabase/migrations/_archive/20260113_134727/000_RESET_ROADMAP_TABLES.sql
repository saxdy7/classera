-- =====================================================
-- COMPLETE RESET AND INSTALL - ROADMAP SYSTEM
-- Run this SINGLE file to fix everything
-- =====================================================

-- =====================================================
-- STEP 1: DROP EVERYTHING (Clean Slate)
-- =====================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS trigger_update_roadmap_rating ON roadmap_ratings;
DROP TRIGGER IF EXISTS trigger_update_plan_completion ON roadmap_progress;
DROP TRIGGER IF EXISTS trigger_update_roadmap_node_count ON roadmap_nodes;

-- Drop all functions
DROP FUNCTION IF EXISTS update_roadmap_rating();
DROP FUNCTION IF EXISTS update_plan_completion();
DROP FUNCTION IF EXISTS update_roadmap_node_count();

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS roadmap_ratings CASCADE;
DROP TABLE IF EXISTS roadmap_contributions CASCADE;
DROP TABLE IF EXISTS guides CASCADE;
DROP TABLE IF EXISTS project_submissions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS roadmap_progress CASCADE;
DROP TABLE IF EXISTS plan_tasks CASCADE;
DROP TABLE IF EXISTS learning_plans CASCADE;
DROP TABLE IF EXISTS credentials CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS roadmap_nodes CASCADE;
DROP TABLE IF EXISTS roadmaps CASCADE;

-- =====================================================
-- STEP 2: CREATE ALL TABLES (Fresh)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROADMAPS TABLE
CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('career', 'skill', 'university', 'goal')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_by TEXT NOT NULL CHECK (created_by IN ('system', 'mentor', 'community')),
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    is_premium BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    icon_url TEXT,
    cover_image_url TEXT,
    estimated_weeks INTEGER,
    total_nodes INTEGER DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roadmaps_type ON roadmaps(type);
CREATE INDEX idx_roadmaps_difficulty ON roadmaps(difficulty);
CREATE INDEX idx_roadmaps_creator ON roadmaps(creator_id);
CREATE INDEX idx_roadmaps_university ON roadmaps(university_id);
CREATE INDEX idx_roadmaps_published ON roadmaps(is_published);

-- 2. ROADMAP NODES TABLE (WITH 'practice' TYPE!)
CREATE TABLE roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    node_type TEXT NOT NULL CHECK (node_type IN ('topic', 'project', 'assessment', 'milestone', 'resource', 'practice')),
    prerequisite_nodes UUID[] DEFAULT '{}',
    skills_unlocked UUID[] DEFAULT '{}',
    estimated_hours INTEGER DEFAULT 1,
    resources JSONB DEFAULT '{"videos": [], "articles": [], "courses": [], "docs": []}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(roadmap_id, order_index)
);

CREATE INDEX idx_roadmap_nodes_roadmap ON roadmap_nodes(roadmap_id);
CREATE INDEX idx_roadmap_nodes_type ON roadmap_nodes(node_type);

-- 3. SKILLS TABLE
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
    description TEXT,
    icon_url TEXT,
    color TEXT DEFAULT '#6366f1',
    parent_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    related_skills UUID[] DEFAULT '{}',
    total_users INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_difficulty ON skills(difficulty_level);

-- 4. USER SKILLS
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency INTEGER CHECK (proficiency BETWEEN 0 AND 100) DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_proof TEXT,
    last_practiced TIMESTAMPTZ DEFAULT NOW(),
    practice_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX idx_user_skills_verified ON user_skills(verified);

-- 5. CREDENTIALS
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    issued_by TEXT NOT NULL CHECK (issued_by IN ('classera', 'mentor', 'university')),
    issuer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    skills_verified UUID[] DEFAULT '{}',
    proof_type TEXT CHECK (proof_type IN ('test', 'project', 'interview', 'course', 'roadmap')),
    proof_id UUID,
    badge_url TEXT,
    certificate_url TEXT,
    verification_code TEXT UNIQUE,
    is_public BOOLEAN DEFAULT true,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_credentials_user ON credentials(user_id);
CREATE INDEX idx_credentials_issuer ON credentials(issuer_id);
CREATE INDEX idx_credentials_type ON credentials(proof_type);

-- 6. LEARNING PLANS
CREATE TABLE learning_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    title TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_end_date DATE,
    actual_end_date DATE,
    daily_time_minutes INTEGER DEFAULT 60,
    current_node_id UUID REFERENCES roadmap_nodes(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')) DEFAULT 'active',
    completion_percentage INTEGER DEFAULT 0,
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_learning_plans_user ON learning_plans(user_id);
CREATE INDEX idx_learning_plans_roadmap ON learning_plans(roadmap_id);
CREATE INDEX idx_learning_plans_status ON learning_plans(status);

-- 7. PLAN TASKS
CREATE TABLE plan_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
    node_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('learn', 'practice', 'project', 'test', 'review', 'reading')),
    title TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER DEFAULT 30,
    actual_minutes INTEGER,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_tasks_plan ON plan_tasks(plan_id);
CREATE INDEX idx_plan_tasks_date ON plan_tasks(scheduled_date);
CREATE INDEX idx_plan_tasks_status ON plan_tasks(status);

-- 8. ROADMAP PROGRESS
CREATE TABLE roadmap_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    notes TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, roadmap_id, node_id)
);

CREATE INDEX idx_roadmap_progress_user ON roadmap_progress(user_id);
CREATE INDEX idx_roadmap_progress_roadmap ON roadmap_progress(roadmap_id);
CREATE INDEX idx_roadmap_progress_node ON roadmap_progress(node_id);
CREATE INDEX idx_roadmap_progress_status ON roadmap_progress(status);

-- 9. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    required_skills UUID[] DEFAULT '{}',
    estimated_hours INTEGER DEFAULT 5,
    github_template_url TEXT,
    instructions_url TEXT,
    demo_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    total_submissions INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_difficulty ON projects(difficulty);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_creator ON projects(created_by);

-- 10. PROJECT SUBMISSIONS
CREATE TABLE project_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    github_url TEXT,
    demo_url TEXT,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'needs_revision')) DEFAULT 'submitted',
    mentor_feedback TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    ai_score INTEGER CHECK (ai_score BETWEEN 0 AND 100),
    ai_feedback TEXT,
    manual_score INTEGER CHECK (manual_score BETWEEN 0 AND 100),
    final_score INTEGER CHECK (final_score BETWEEN 0 AND 100),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_submissions_user ON project_submissions(user_id);
CREATE INDEX idx_project_submissions_project ON project_submissions(project_id);
CREATE INDEX idx_project_submissions_status ON project_submissions(status);

-- 11. GUIDES
CREATE TABLE guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    linked_skills UUID[] DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cover_image_url TEXT,
    reading_time_minutes INTEGER DEFAULT 5,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guides_author ON guides(author_id);
CREATE INDEX idx_guides_difficulty ON guides(difficulty);
CREATE INDEX idx_guides_category ON guides(category);
CREATE INDEX idx_guides_published ON guides(is_published);

-- 12. ROADMAP CONTRIBUTIONS
CREATE TABLE roadmap_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('add_node', 'edit_node', 'remove_node', 'add_resource', 'edit_description', 'other')),
    suggestion_data JSONB NOT NULL,
    reason TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roadmap_contributions_user ON roadmap_contributions(user_id);
CREATE INDEX idx_roadmap_contributions_roadmap ON roadmap_contributions(roadmap_id);
CREATE INDEX idx_roadmap_contributions_status ON roadmap_contributions(status);

-- 13. ROADMAP RATINGS
CREATE TABLE roadmap_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, roadmap_id)
);

CREATE INDEX idx_roadmap_ratings_roadmap ON roadmap_ratings(roadmap_id);

-- =====================================================
-- STEP 3: CREATE TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_roadmap_node_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE roadmaps SET total_nodes = total_nodes + 1, updated_at = NOW() WHERE id = NEW.roadmap_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE roadmaps SET total_nodes = GREATEST(total_nodes - 1, 0), updated_at = NOW() WHERE id = OLD.roadmap_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roadmap_node_count
AFTER INSERT OR DELETE ON roadmap_nodes
FOR EACH ROW EXECUTE FUNCTION update_roadmap_node_count();

-- =====================================================
-- STEP 4: ENABLE RLS
-- =====================================================

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public roadmaps viewable" ON roadmaps FOR SELECT USING (is_published = true OR creator_id = auth.uid());
CREATE POLICY "Mentors can create roadmaps" ON roadmaps FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "Creators can update roadmaps" ON roadmaps FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Roadmap nodes viewable" ON roadmap_nodes FOR SELECT USING (EXISTS (SELECT 1 FROM roadmaps WHERE id = roadmap_nodes.roadmap_id AND (is_published = true OR creator_id = auth.uid())));

CREATE POLICY "Skills viewable by all" ON skills FOR SELECT USING (true);

CREATE POLICY "Users manage own skills" ON user_skills FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own plans" ON learning_plans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own tasks" ON plan_tasks FOR ALL USING (EXISTS (SELECT 1 FROM learning_plans WHERE id = plan_tasks.plan_id AND user_id = auth.uid()));
CREATE POLICY "Users manage own progress" ON roadmap_progress FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Published projects viewable" ON projects FOR SELECT USING (is_published = true OR created_by = auth.uid());
CREATE POLICY "Users manage own submissions" ON project_submissions FOR ALL USING (user_id = auth.uid() OR reviewed_by = auth.uid());

CREATE POLICY "Published guides viewable" ON guides FOR SELECT USING (is_published = true OR author_id = auth.uid());

-- =====================================================
-- STEP 5: SEED INITIAL SKILLS
-- =====================================================

INSERT INTO skills (name, slug, category, difficulty_level, description, color) VALUES
('HTML', 'html', 'frontend', 1, 'HyperText Markup Language', '#E34F26'),
('CSS', 'css', 'frontend', 1, 'Cascading Style Sheets', '#1572B6'),
('JavaScript', 'javascript', 'frontend', 2, 'Programming language for web', '#F7DF1E'),
('React', 'react', 'frontend', 3, 'JavaScript library for UI', '#61DAFB'),
('TypeScript', 'typescript', 'frontend', 3, 'Typed JavaScript', '#3178C6'),
('Next.js', 'nextjs', 'frontend', 4, 'React framework', '#000000'),
('Node.js', 'nodejs', 'backend', 3, 'JavaScript runtime', '#339933'),
('Python', 'python', 'backend', 2, 'General-purpose language', '#3776AB'),
('PostgreSQL', 'postgresql', 'backend', 3, 'Relational database', '#4169E1'),
('Git', 'git', 'devops', 2, 'Version control', '#F05032'),
('Docker', 'docker', 'devops', 3, 'Containerization', '#2496ED'),
('Data Structures', 'data-structures', 'core', 3, 'Data organization', '#6366F1'),
('Algorithms', 'algorithms', 'core', 4, 'Problem solving', '#8B5CF6')
ON CONFLICT (slug) DO NOTHING;

-- Success message
SELECT 'Roadmap system installed successfully! ✅' as status;
