import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/courses/[id]/enroll - Enroll in a course
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
        }

        // Create enrollment
        const { data: enrollment, error } = await supabase
            .from('course_enrollments')
            .insert({
                user_id: user.id,
                course_id: courseId
            })
            .select()
            .single();

        if (error) throw error;

        // Update enrollment count
        const { data: course } = await supabase
            .from('courses')
            .select('enrollment_count')
            .eq('id', courseId)
            .single();

        if (course) {
            await supabase
                .from('courses')
                .update({ enrollment_count: (course.enrollment_count || 0) + 1 })
                .eq('id', courseId);
        }

        return NextResponse.json({
            enrollment,
            message: 'Successfully enrolled in course!'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error enrolling in course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to enroll' },
            { status: 500 }
        );
    }
}
