-- =============================================
-- COURSES PORTAL ENHANCEMENT
-- =============================================

-- Mentor-created courses
CREATE TABLE IF NOT EXISTS mentor_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER DEFAULT 10,
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  course_type TEXT NOT NULL DEFAULT 'free' CHECK (course_type IN ('free', 'paid')),
  price DECIMAL(10,2) DEFAULT 0,
  thumbnail_url TEXT,
  skills TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  total_lessons INTEGER DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course modules (sections)
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES mentor_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course lessons
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  content_markdown TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 10,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student course enrollments (for both mentor and external courses)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES mentor_courses(id) ON DELETE CASCADE,
  course_type TEXT NOT NULL DEFAULT 'internal' CHECK (course_type IN ('internal', 'external')),
  external_course_id TEXT, -- For external courses (Coursera, Udemy, etc.)
  external_platform TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  watch_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- Course reviews and ratings
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES mentor_courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Course favorites/bookmarks
CREATE TABLE IF NOT EXISTS course_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES mentor_courses(id) ON DELETE CASCADE,
  external_course_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_mentor_courses_mentor_id ON mentor_courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_courses_is_published ON mentor_courses(is_published);
CREATE INDEX IF NOT EXISTS idx_mentor_courses_level ON mentor_courses(level);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_favorites_user_id ON course_favorites(user_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE mentor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_favorites ENABLE ROW LEVEL SECURITY;

-- Mentor courses: viewable by all, manageable by owner
CREATE POLICY "Published courses are viewable by all"
  ON mentor_courses FOR SELECT
  USING (is_published = true OR mentor_id = auth.uid());

CREATE POLICY "Mentors can create courses"
  ON mentor_courses FOR INSERT
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Mentors can update own courses"
  ON mentor_courses FOR UPDATE
  USING (mentor_id = auth.uid());

CREATE POLICY "Mentors can delete own courses"
  ON mentor_courses FOR DELETE
  USING (mentor_id = auth.uid());

-- Course modules: viewable if course is viewable
CREATE POLICY "Modules viewable by authenticated users"
  ON course_modules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mentors can manage modules"
  ON course_modules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mentor_courses 
    WHERE mentor_courses.id = course_modules.course_id 
    AND mentor_courses.mentor_id = auth.uid()
  ));

-- Course lessons: similar to modules
CREATE POLICY "Lessons viewable by authenticated users"
  ON course_lessons FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Enrollments: users can manage their own
CREATE POLICY "Users can view own enrollments"
  ON course_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can enroll themselves"
  ON course_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments"
  ON course_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- Lesson progress: users can manage their own
CREATE POLICY "Users can manage own progress"
  ON lesson_progress FOR ALL
  USING (user_id = auth.uid());

-- Reviews: viewable by all, manageable by owner
CREATE POLICY "Reviews viewable by all"
  ON course_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reviews"
  ON course_reviews FOR ALL
  USING (user_id = auth.uid());

-- Favorites: users can manage their own
CREATE POLICY "Users can manage own favorites"
  ON course_favorites FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update course progress when lesson is completed
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_module_id UUID;
  v_course_id UUID;
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress INTEGER;
BEGIN
  -- Get module and course info
  SELECT module_id INTO v_module_id FROM course_lessons WHERE id = NEW.lesson_id;
  SELECT course_id INTO v_course_id FROM course_modules WHERE id = v_module_id;
  
  -- Count total and completed lessons
  SELECT COUNT(*) INTO v_total_lessons
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.course_id = v_course_id;
  
  SELECT COUNT(*) INTO v_completed_lessons
  FROM lesson_progress lp
  JOIN course_lessons cl ON lp.lesson_id = cl.id
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.course_id = v_course_id 
  AND lp.user_id = NEW.user_id 
  AND lp.completed = true;
  
  -- Calculate progress percentage
  IF v_total_lessons > 0 THEN
    v_progress := (v_completed_lessons * 100) / v_total_lessons;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Update enrollment progress
  UPDATE course_enrollments 
  SET progress_percentage = v_progress,
      completed = (v_progress >= 100),
      completed_at = CASE WHEN v_progress >= 100 THEN NOW() ELSE NULL END,
      last_accessed_at = NOW()
  WHERE user_id = NEW.user_id AND course_id = v_course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for progress updates
DROP TRIGGER IF EXISTS trigger_update_course_progress ON lesson_progress;
CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress();

-- Function to increment enrolled count
CREATE OR REPLACE FUNCTION increment_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mentor_courses 
  SET enrolled_count = enrolled_count + 1
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_increment_enrolled ON course_enrollments;
CREATE TRIGGER trigger_increment_enrolled
  AFTER INSERT ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION increment_enrolled_count();
