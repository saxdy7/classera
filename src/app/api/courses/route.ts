import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/courses - List all courses
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        const difficulty = searchParams.get('difficulty');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query = supabase
            .from('courses')
            .select(`
                *,
                creator:users!courses_created_by_fkey(id, full_name, avatar_url)
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (difficulty) query = query.eq('difficulty', difficulty);
        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data: courses, error } = await query;

        if (error) throw error;

        return NextResponse.json({ courses: courses || [] });

    } catch (error: any) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}

// POST /api/courses - Create new course (mentor only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        // Allow students to create courses (for AI generation)
        // if (userData?.role !== 'mentor') {
        //     return NextResponse.json({ error: 'Only mentors can create courses' }, { status: 403 });
        // }

        const body = await request.json();
        const { title, description, difficulty, category, tags, modules } = body;

        if (!title || !difficulty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(7);

        // Use Admin Client to bypass RLS for creation
        const supabaseAdmin = createAdminClient();

        // Start transaction (Supabase doesn't support explicit transactions in JS client easily, so we just chain)
        // 1. Create Course
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({
                title,
                slug,
                description,
                difficulty,
                category,
                tags: tags || [],
                created_by: user.id,
                is_published: true // Auto-publish personalized courses
            })
            .select()
            .single();

        if (courseError) throw courseError;

        // 2. Create Modules and Lessons if provided
        if (modules && modules.length > 0) {
            for (let i = 0; i < modules.length; i++) {
                const module = modules[i];
                const { data: newModule, error: moduleError } = await supabaseAdmin
                    .from('course_modules')
                    .insert({
                        course_id: course.id,
                        title: module.title,
                        description: module.description,
                        order_index: i + 1
                    })
                    .select()
                    .single();

                if (moduleError) throw moduleError;

                if (module.lessons && module.lessons.length > 0) {
                    const lessonsToInsert = module.lessons.map((lesson: any, j: number) => ({
                        module_id: newModule.id,
                        title: lesson.title,
                        content: lesson.content,
                        duration_minutes: lesson.duration_minutes || 10,
                        order_index: j + 1
                    }));

                    const { error: lessonsError } = await supabaseAdmin
                        .from('course_lessons')
                        .insert(lessonsToInsert);

                    if (lessonsError) throw lessonsError;
                }
            }
        }

        return NextResponse.json({ course }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create course' },
            { status: 500 }
        );
    }
}
