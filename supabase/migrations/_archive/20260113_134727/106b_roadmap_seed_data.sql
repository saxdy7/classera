-- =====================================================
-- CLASSERA ROADMAP SYSTEM - SEED DATA
-- Run this AFTER: 000_RESET_ROADMAP_TABLES.sql
-- =====================================================

-- NOTE: This file adds roadmaps, projects, and guides
-- The skills are already added in the reset script

-- =====================================================
-- SEED ROADMAPS
-- =====================================================

-- 1. Frontend Developer Roadmap
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by, 
    is_premium, tags, estimated_weeks
) VALUES (
    'Frontend Developer',
    'frontend-developer',
    'Complete roadmap to become a professional frontend developer. Learn HTML, CSS, JavaScript, React, and modern frontend tools.',
    'career',
    'beginner',
    'system',
    false,
    ARRAY['web', 'frontend', 'javascript', 'react'],
    24
) ON CONFLICT (slug) DO NOTHING;

-- 2. Backend Developer Roadmap
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'Backend Developer',
    'backend-developer',
    'Master backend development with Node.js, databases, APIs, and server-side programming.',
    'career',
    'intermediate',
    'system',
    false,
    ARRAY['backend', 'nodejs', 'api', 'database'],
    20
) ON CONFLICT (slug) DO NOTHING;

-- 3. Full Stack Developer Roadmap
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'Full Stack Developer',
    'full-stack-developer',
    'Become a complete full stack developer mastering both frontend and backend technologies.',
    'career',
    'advanced',
    'system',
    false,
    ARRAY['fullstack', 'web', 'frontend', 'backend'],
    36
) ON CONFLICT (slug) DO NOTHING;

-- 4. Data Structures & Algorithms
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'DSA Mastery',
    'dsa-mastery',
    'Master Data Structures and Algorithms for coding interviews and competitive programming.',
    'skill',
    'intermediate',
    'system',
    false,
    ARRAY['dsa', 'algorithms', 'interview', 'coding'],
    16
) ON CONFLICT (slug) DO NOTHING;

-- 5. React Developer
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'React Developer',
    'react-developer',
    'Deep dive into React ecosystem - hooks, state management, routing, and best practices.',
    'skill',
    'intermediate',
    'system',
    false,
    ARRAY['react', 'frontend', 'javascript'],
    12
) ON CONFLICT (slug) DO NOTHING;

-- 6. DevOps Engineer
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'DevOps Engineer',
    'devops-engineer',
    'Learn DevOps practices, CI/CD, Docker, Kubernetes, and cloud platforms.',
    'career',
    'advanced',
    'system',
    false,
    ARRAY['devops', 'docker', 'kubernetes', 'aws'],
    20
) ON CONFLICT (slug) DO NOTHING;

-- 7. AI/ML Engineer
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'AI/ML Engineer',
    'ai-ml-engineer',
    'Comprehensive path to becoming an AI/ML engineer with Python, TensorFlow, and deep learning.',
    'career',
    'advanced',
    'system',
    true,
    ARRAY['ai', 'ml', 'python', 'tensorflow'],
    28
) ON CONFLICT (slug) DO NOTHING;

-- 8. System Design
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'System Design',
    'system-design',
    'Learn to design scalable, distributed systems for tech interviews and real-world applications.',
    'skill',
    'advanced',
    'system',
    false,
    ARRAY['system-design', 'architecture', 'scalability'],
    10
) ON CONFLICT (slug) DO NOTHING;

-- 9. Placement Preparation (University)
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'Campus Placement Prep',
    'campus-placement-prep',
    'Complete preparation guide for campus placements - DSA, aptitude, interviews, and resume building.',
    'goal',
    'intermediate',
    'system',
    false,
    ARRAY['placement', 'interview', 'campus', 'career'],
    20
) ON CONFLICT (slug) DO NOTHING;

-- 10. FAANG Interview Prep
INSERT INTO roadmaps (
    title, slug, description, type, difficulty, created_by,
    is_premium, tags, estimated_weeks
) VALUES (
    'FAANG Interview Prep',
    'faang-interview-prep',
    'Crack FAANG interviews with focused preparation on coding, system design, and behavioral rounds.',
    'goal',
    'advanced',
    'system',
    true,
    ARRAY['faang', 'interview', 'coding', 'system-design'],
    16
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED ROADMAP NODES - Frontend Developer
-- =====================================================

DO $$
DECLARE
    roadmap_id_frontend UUID;
    node_html UUID;
    node_css UUID;
    node_js UUID;
    node_git UUID;
    node_react UUID;
BEGIN
    -- Get roadmap ID
    SELECT id INTO roadmap_id_frontend FROM roadmaps WHERE slug = 'frontend-developer';
    
    IF roadmap_id_frontend IS NOT NULL THEN
        -- Node 1: HTML Basics
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'HTML Fundamentals',
            'Learn HTML tags, semantic HTML, forms, and document structure',
            1, 'topic', 10,
            '{"videos": ["https://youtu.be/qz0aGYrrlhU"], "articles": ["https://developer.mozilla.org/en-US/docs/Web/HTML"]}'::jsonb,
            100, 100, '#E34F26'
        ) RETURNING id INTO node_html;
        
        -- Node 2: CSS Basics
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            prerequisite_nodes, estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'CSS Fundamentals',
            'Master CSS selectors, box model, flexbox, grid, and responsive design',
            2, 'topic',
            ARRAY[node_html],
            15,
            '{"videos": ["https://youtu.be/1Rs2ND1ryYc"], "articles": ["https://developer.mozilla.org/en-US/docs/Web/CSS"]}'::jsonb,
            250, 100, '#1572B6'
        ) RETURNING id INTO node_css;
        
        -- Node 3: JavaScript Basics
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            prerequisite_nodes, estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'JavaScript Fundamentals',
            'Learn JS syntax, DOM manipulation, events, and ES6+ features',
            3, 'topic',
            ARRAY[node_html, node_css],
            20,
            '{"videos": ["https://youtu.be/PkZNo7MFNFg"], "articles": ["https://javascript.info"]}'::jsonb,
            400, 100, '#F7DF1E'
        ) RETURNING id INTO node_js;
        
        -- Node 4: Git & GitHub
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            prerequisite_nodes, estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'Version Control with Git',
            'Learn Git basics, branching, merging, and GitHub collaboration',
            4, 'topic',
            ARRAY[node_js],
            8,
            '{"videos": ["https://youtu.be/RGOj5yH7evk"], "articles": ["https://git-scm.com/doc"]}'::jsonb,
            550, 100, '#F05032'
        ) RETURNING id INTO node_git;
        
        -- Node 5: React Basics
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            prerequisite_nodes, estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'React Fundamentals',
            'Components, props, state, hooks, and React ecosystem',
            5, 'topic',
            ARRAY[node_js, node_git],
            25,
            '{"videos": ["https://youtu.be/Tn6-PIqc4UM"], "articles": ["https://react.dev"]}'::jsonb,
            700, 100, '#61DAFB'
        ) RETURNING id INTO node_react;
        
        -- Node 6: Build a Project
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            prerequisite_nodes, estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'Portfolio Project',
            'Build a complete portfolio website showcasing your skills',
            6, 'project',
            ARRAY[node_react],
            30,
            '{"github": ["https://github.com/topics/portfolio-website"]}'::jsonb,
            850, 100, '#10B981'
        );
        
        -- Node 7: Assessment
        INSERT INTO roadmap_nodes (
            roadmap_id, title, description, order_index, node_type,
            prerequisite_nodes, estimated_hours, resources, position_x, position_y, color
        ) VALUES (
            roadmap_id_frontend,
            'Frontend Assessment',
            'Test your frontend development skills',
            7, 'assessment',
            ARRAY[node_react],
            2,
            '{}'::jsonb,
            1000, 100, '#8B5CF6'
        );
    END IF;
END $$;

-- =====================================================
-- SEED ROADMAP NODES - DSA Mastery
-- =====================================================

DO $$
DECLARE
    roadmap_id_dsa UUID;
BEGIN
    SELECT id INTO roadmap_id_dsa FROM roadmaps WHERE slug = 'dsa-mastery';
    
    IF roadmap_id_dsa IS NOT NULL THEN
        INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, node_type, estimated_hours, position_x, position_y) VALUES
        (roadmap_id_dsa, 'Arrays & Strings', 'Master array and string manipulation', 1, 'topic', 15, 100, 100),
        (roadmap_id_dsa, 'Linked Lists', 'Singly, doubly, and circular linked lists', 2, 'topic', 12, 250, 100),
        (roadmap_id_dsa, 'Stacks & Queues', 'LIFO and FIFO data structures', 3, 'topic', 10, 400, 100),
        (roadmap_id_dsa, 'Trees & Graphs', 'Binary trees, BST, graph traversal', 4, 'topic', 20, 550, 100),
        (roadmap_id_dsa, 'Sorting Algorithms', 'Bubble, merge, quick, heap sort', 5, 'topic', 12, 700, 100),
        (roadmap_id_dsa, 'Searching Algorithms', 'Binary search, DFS, BFS', 6, 'topic', 10, 850, 100),
        (roadmap_id_dsa, 'Dynamic Programming', 'Memoization and tabulation', 7, 'topic', 25, 1000, 100),
        (roadmap_id_dsa, 'Practice Problems', 'Solve 100+ coding problems', 8, 'practice', 50, 1150, 100);
    END IF;
END $$;

-- =====================================================
-- SEED PROJECTS
-- =====================================================

INSERT INTO projects (
    title, slug, description, difficulty, category, estimated_hours,
    github_template_url, tags
) VALUES
(
    'Todo App with React',
    'todo-app-react',
    'Build a full-featured todo application with React, including CRUD operations, filters, and local storage',
    'beginner',
    'frontend',
    8,
    'https://github.com/topics/todo-app',
    ARRAY['react', 'javascript', 'frontend']
),
(
    'Weather Dashboard',
    'weather-dashboard',
    'Create a weather dashboard using a public API, displaying current weather and forecasts',
    'beginner',
    'frontend',
    10,
    'https://github.com/topics/weather-app',
    ARRAY['react', 'api', 'frontend']
),
(
    'E-commerce Product Page',
    'ecommerce-product-page',
    'Build a responsive product page with image gallery, cart functionality, and checkout flow',
    'intermediate',
    'frontend',
    15,
    'https://github.com/topics/ecommerce',
    ARRAY['react', 'ecommerce', 'frontend']
),
(
    'REST API with Node.js',
    'rest-api-nodejs',
    'Create a RESTful API with authentication, CRUD operations, and database integration',
    'intermediate',
    'backend',
    20,
    'https://github.com/topics/rest-api',
    ARRAY['nodejs', 'api', 'backend']
),
(
    'Chat Application',
    'chat-application',
    'Build a real-time chat app with WebSockets, user authentication, and message history',
    'advanced',
    'fullstack',
    30,
    'https://github.com/topics/chat-app',
    ARRAY['react', 'nodejs', 'websocket', 'fullstack']
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED GUIDES
-- =====================================================

INSERT INTO guides (
    title, slug, content, excerpt, difficulty, category, tags, reading_time_minutes
) VALUES
(
    'Getting Started with React Hooks',
    'getting-started-react-hooks',
    '# React Hooks Guide\n\nLearn how to use useState, useEffect, and custom hooks...',
    'A beginner-friendly guide to understanding and using React Hooks',
    'beginner',
    'frontend',
    ARRAY['react', 'hooks', 'javascript'],
    10
),
(
    'Understanding Async/Await in JavaScript',
    'understanding-async-await',
    '# Async/Await in JavaScript\n\nMaster asynchronous programming...',
    'Deep dive into promises, async/await, and error handling',
    'intermediate',
    'javascript',
    ARRAY['javascript', 'async', 'promises'],
    15
),
(
    'REST API Best Practices',
    'rest-api-best-practices',
    '# REST API Design\n\nLearn industry-standard API design patterns...',
    'Comprehensive guide to designing scalable REST APIs',
    'intermediate',
    'backend',
    ARRAY['api', 'rest', 'backend'],
    20
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- UPDATE STATISTICS
-- =====================================================

-- Update roadmap node counts
UPDATE roadmaps r
SET total_nodes = (
    SELECT COUNT(*)
    FROM roadmap_nodes rn
    WHERE rn.roadmap_id = r.id
);

COMMENT ON SCHEMA public IS 'Roadmap system seed data loaded successfully';
