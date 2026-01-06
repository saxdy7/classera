import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Update lesson progress
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { lesson_id, completed, watch_time_seconds } = body;

        if (!lesson_id) {
            return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
        }

        // Upsert progress
        const { data: progress, error } = await supabase
            .from('lesson_progress')
            .upsert({
                user_id: user.id,
                lesson_id,
                completed: completed || false,
                watch_time_seconds: watch_time_seconds || 0,
                completed_at: completed ? new Date().toISOString() : null
            }, {
                onConflict: 'user_id,lesson_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating progress:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ progress });
    } catch (error: any) {
        console.error('Error in progress update:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// Get progress for a course
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Get all lessons for the course and their progress
        const { data: modules, error } = await supabase
            .from('course_modules')
            .select(`
        id, title, order_index,
        lessons:course_lessons(
          id, title, order_index, duration_minutes,
          progress:lesson_progress(completed, watch_time_seconds, completed_at)
        )
      `)
            .eq('course_id', courseId)
            .order('order_index');

        if (error) throw error;

        // Calculate overall progress
        let totalLessons = 0;
        let completedLessons = 0;
        let totalWatchTime = 0;

        modules?.forEach(module => {
            module.lessons?.forEach((lesson: any) => {
                totalLessons++;
                const userProgress = lesson.progress?.find((p: any) => true); // First match (user's progress)
                if (userProgress?.completed) {
                    completedLessons++;
                }
                totalWatchTime += userProgress?.watch_time_seconds || 0;
            });
        });

        const progressPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return NextResponse.json({
            modules,
            stats: {
                totalLessons,
                completedLessons,
                progressPercentage,
                totalWatchTimeMinutes: Math.round(totalWatchTime / 60)
            }
        });
    } catch (error: any) {
        console.error('Error fetching progress:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
