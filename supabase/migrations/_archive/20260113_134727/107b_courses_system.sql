-- =====================================================
-- COURSES SYSTEM - CLEAN INSTALL
-- Drop existing tables and recreate
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS course_lessons CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_course_module_count() CASCADE;
DROP FUNCTION IF EXISTS update_course_lesson_count() CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,
    thumbnail_url TEXT,
    total_modules INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_published BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_published ON courses(is_published);

-- =====================================================
-- 2. COURSE MODULES TABLE
-- =====================================================
CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

CREATE INDEX idx_course_modules_course ON course_modules(course_id);

-- =====================================================
-- 3. COURSE LESSONS TABLE
-- =====================================================
CREATE TABLE course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    resources JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, order_index)
);

CREATE INDEX idx_course_lessons_module ON course_lessons(module_id);

-- =====================================================
-- 4. COURSE ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0,
    current_lesson_id UUID REFERENCES course_lessons(id),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);

-- =====================================================
-- 5. LESSON PROGRESS TABLE
-- =====================================================
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    time_spent_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update course module count
CREATE OR REPLACE FUNCTION update_course_module_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses SET total_modules = total_modules + 1 WHERE id = NEW.course_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses SET total_modules = GREATEST(total_modules - 1, 0) WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_module_count
AFTER INSERT OR DELETE ON course_modules
FOR EACH ROW EXECUTE FUNCTION update_course_module_count();

-- Update course lesson count
CREATE OR REPLACE FUNCTION update_course_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses 
        SET total_lessons = total_lessons + 1,
            total_duration_minutes = total_duration_minutes + COALESCE(NEW.duration_minutes, 0)
        WHERE id = (SELECT course_id FROM course_modules WHERE id = NEW.module_id);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses 
        SET total_lessons = GREATEST(total_lessons - 1, 0),
            total_duration_minutes = GREATEST(total_duration_minutes - COALESCE(OLD.duration_minutes, 0), 0)
        WHERE id = (SELECT course_id FROM course_modules WHERE id = OLD.module_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_lesson_count
AFTER INSERT OR DELETE ON course_lessons
FOR EACH ROW EXECUTE FUNCTION update_course_lesson_count();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Courses: Public can view published, creators can manage their own
CREATE POLICY "Published courses viewable by all"
    ON courses FOR SELECT
    USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Instructors can create courses"
    ON courses FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mentor')
    );

CREATE POLICY "Instructors can update their courses"
    ON courses FOR UPDATE
    USING (created_by = auth.uid());

-- Modules and Lessons: Follow course permissions
CREATE POLICY "Course modules viewable with course"
    ON course_modules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_modules.course_id
              AND (is_published = true OR created_by = auth.uid())
        )
    );

CREATE POLICY "Course lessons viewable with course"
    ON course_lessons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN course_modules m ON m.course_id = c.id
            WHERE m.id = course_lessons.module_id
              AND (c.is_published = true OR c.created_by = auth.uid())
        )
    );

-- Enrollments: Users manage their own
CREATE POLICY "Users can view their enrollments"
    ON course_enrollments FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in courses"
    ON course_enrollments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Lesson Progress: Users manage their own
CREATE POLICY "Users manage their lesson progress"
    ON lesson_progress FOR ALL
    USING (user_id = auth.uid());

-- =====================================================
-- SEED DATA - Sample Course
-- =====================================================

-- Insert sample course (Full Stack Web Development with MERN)
INSERT INTO courses (title, slug, description, difficulty, category, is_published, tags)
VALUES (
    'Full Stack Web Development with MERN',
    'full-stack-mern',
    'Learn to build modern web applications with MongoDB, Express, React, and Node.js',
    'intermediate',
    'Web Development',
    true,
    ARRAY['React', 'Node.js', 'MongoDB', 'Express', 'Full Stack']
) RETURNING id;

COMMENT ON TABLE courses IS 'Full structured courses with modules and lessons';
COMMENT ON TABLE course_modules IS 'Course modules grouping lessons';
COMMENT ON TABLE course_lessons IS 'Individual lessons with video content';
COMMENT ON TABLE course_enrollments IS 'User course enrollments and progress';
COMMENT ON TABLE lesson_progress IS 'User progress on individual lessons';
