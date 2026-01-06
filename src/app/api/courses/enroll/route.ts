import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Enroll in a course
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { course_id, course_type = 'internal', external_course_id, external_platform } = body;

        if (!course_id && !external_course_id) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq(course_id ? 'course_id' : 'external_course_id', course_id || external_course_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
        }

        // Create enrollment
        const { data: enrollment, error } = await supabase
            .from('course_enrollments')
            .insert({
                user_id: user.id,
                course_id: course_id || null,
                course_type,
                external_course_id,
                external_platform,
                progress_percentage: 0,
                completed: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error enrolling:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Award XP points for enrollment (if points system exists)
        try {
            await supabase.rpc('award_points', {
                p_user_id: user.id,
                p_points: 10,
                p_reason: 'Course enrollment'
            });
        } catch (e) {
            // Points system might not exist yet, ignore
        }

        return NextResponse.json({ enrollment }, { status: 201 });
    } catch (error: any) {
        console.error('Error in enrollment:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET - Get user's enrolled courses
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'in-progress', 'completed', 'all'

        let query = supabase
            .from('course_enrollments')
            .select(`
        *,
        course:mentor_courses(
          id, title, description, thumbnail_url, duration_hours, 
          level, skills, mentor_id,
          mentor:users!mentor_courses_mentor_id_fkey(full_name, avatar_url)
        )
      `)
            .eq('user_id', user.id)
            .order('last_accessed_at', { ascending: false });

        if (filter === 'in-progress') {
            query = query.eq('completed', false).gt('progress_percentage', 0);
        } else if (filter === 'completed') {
            query = query.eq('completed', true);
        }

        const { data: enrollments, error } = await query;

        if (error) throw error;

        return NextResponse.json({ enrollments });
    } catch (error: any) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Unenroll from a course
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const enrollmentId = searchParams.get('id');

        if (!enrollmentId) {
            return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('course_enrollments')
            .delete()
            .eq('id', enrollmentId)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error unenrolling:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
