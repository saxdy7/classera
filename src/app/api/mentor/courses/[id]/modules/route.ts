import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Create a module
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
        const { title, description, order_index } = body;

        const { data: module, error } = await supabase
            .from('course_modules')
            .insert({
                course_id: courseId,
                title: title || 'New Module',
                description,
                order_index: order_index || 0
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ module }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating module:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Get modules for a course
export async function GET(
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

        const { data: modules, error } = await supabase
            .from('course_modules')
            .select(`
        *,
        lessons:course_lessons(*)
      `)
            .eq('course_id', courseId)
            .order('order_index');

        if (error) throw error;

        return NextResponse.json({ modules });
    } catch (error: any) {
        console.error('Error fetching modules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
