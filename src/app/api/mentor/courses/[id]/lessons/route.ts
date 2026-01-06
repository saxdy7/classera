import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Create a lesson
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: courseId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const { data: course } = await supabase
            .from('mentor_courses')
            .select('mentor_id')
            .eq('id', courseId)
            .single();

        if (!course || course.mentor_id !== user.id) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
        }

        const body = await request.json();
        const { module_id, title, video_url, content_markdown, order_index, duration_minutes, is_preview } = body;

        if (!module_id) {
            return NextResponse.json({ error: 'Module ID required' }, { status: 400 });
        }

        const { data: lesson, error } = await supabase
            .from('course_lessons')
            .insert({
                module_id,
                title: title || 'New Lesson',
                video_url,
                content_markdown,
                order_index: order_index || 0,
                duration_minutes: duration_minutes || 10,
                is_preview: is_preview || false
            })
            .select()
            .single();

        if (error) throw error;

        // Update course total lessons count
        await supabase.rpc('update_course_lesson_count', { p_course_id: courseId });

        return NextResponse.json({ lesson }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating lesson:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update a lesson
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: courseId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { lesson_id, ...updates } = body;

        if (!lesson_id) {
            return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
        }

        const { data: lesson, error } = await supabase
            .from('course_lessons')
            .update(updates)
            .eq('id', lesson_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ lesson });
    } catch (error: any) {
        console.error('Error updating lesson:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a lesson
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: courseId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const lessonId = searchParams.get('lessonId');

        if (!lessonId) {
            return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('course_lessons')
            .delete()
            .eq('id', lessonId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting lesson:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
