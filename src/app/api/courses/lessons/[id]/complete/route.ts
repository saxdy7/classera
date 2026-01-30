import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/courses/lessons/[id]/complete - Mark lesson as complete
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: lessonId } = await params;
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { time_spent_minutes } = body;

        // Upsert lesson progress
        const { data: progress, error } = await supabase
            .from('lesson_progress')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                time_spent_minutes: time_spent_minutes || 0,
                completed_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,lesson_id'
            })
            .select()
            .single();

        if (error) throw error;

        // Update course enrollment progress
        const { data: lesson } = await supabase
            .from('course_lessons')
            .select('module_id')
            .eq('id', lessonId)
            .single();

        if (lesson) {
            const { data: module } = await supabase
                .from('course_modules')
                .select('course_id')
                .eq('id', lesson.module_id)
                .single();

            if (module) {
                // Calculate progress percentage
                const { data: course } = await supabase
                    .from('courses')
                    .select('total_lessons')
                    .eq('id', module.course_id)
                    .single();

                const { data: completedLessons } = await supabase
                    .from('lesson_progress')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('completed', true);

                const progressPercentage = course && course.total_lessons > 0
                    ? Math.round(((completedLessons?.length || 0) / course.total_lessons) * 100)
                    : 0;

                await supabase
                    .from('course_enrollments')
                    .update({
                        progress_percentage: progressPercentage,
                        current_lesson_id: lessonId
                    })
                    .eq('user_id', user.id)
                    .eq('course_id', module.course_id);
            }
        }

        return NextResponse.json({
            progress,
            message: 'Lesson marked as complete!'
        });

    } catch (error: any) {
        console.error('Error completing lesson:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to complete lesson' },
            { status: 500 }
        );
    }
}
