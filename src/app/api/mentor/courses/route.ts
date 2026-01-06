import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - List mentor's courses
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: courses, error } = await supabase
            .from('mentor_courses')
            .select(`
        *,
        modules:course_modules(count),
        enrollments:course_enrollments(count)
      `)
            .eq('mentor_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ courses });
    } catch (error: any) {
        console.error('Error fetching mentor courses:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create a new course
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify mentor role
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'mentor') {
            return NextResponse.json({ error: 'Only mentors can create courses' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, duration_hours, level, course_type, price, thumbnail_url, skills } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const { data: course, error } = await supabase
            .from('mentor_courses')
            .insert({
                mentor_id: user.id,
                title,
                description,
                duration_hours: duration_hours || 10,
                level: level || 'Beginner',
                course_type: course_type || 'free',
                price: price || 0,
                thumbnail_url,
                skills: skills || [],
                is_published: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating course:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ course }, { status: 201 });
    } catch (error: any) {
        console.error('Error in course creation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update a course
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        const { data: course, error } = await supabase
            .from('mentor_courses')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('mentor_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ course });
    } catch (error: any) {
        console.error('Error updating course:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a course
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('mentor_courses')
            .delete()
            .eq('id', id)
            .eq('mentor_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
