import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/courses/[id] - Get course with modules and lessons
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = await createClient();

        // Get course details
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select(`
                *,
                creator:users!courses_created_by_fkey(id, full_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (courseError) throw courseError;
        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get modules with lessons
        const { data: modules, error: modulesError } = await supabase
            .from('course_modules')
            .select(`
                *,
                lessons:course_lessons(*)
            `)
            .eq('course_id', id)
            .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // Get user enrollment if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        let enrollment = null;
        let lessonProgress: any[] = [];

        if (user) {
            const { data: enrollmentData } = await supabase
                .from('course_enrollments')
                .select('*')
                .eq('user_id', user.id)
                .eq('course_id', id)
                .single();

            enrollment = enrollmentData;

            if (enrollment) {
                const { data: progressData } = await supabase
                    .from('lesson_progress')
                    .select('*')
                    .eq('user_id', user.id);

                lessonProgress = progressData || [];
            }
        }

        return NextResponse.json({
            course: {
                ...course,
                modules: modules || [],
            },
            enrollment,
            lessonProgress
        });

    } catch (error: any) {
        console.error('Error fetching course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch course' },
            { status: 500 }
        );
    }
}
