import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'all', 'live', 'scheduled', 'past'

        // Get user profile to check role
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        let query = supabase
            .from('tests')
            .select(`
        *,
        mentor:users!tests_mentor_id_fkey(id, full_name, avatar_url),
        community:communities(id, name),
        _count:test_submissions(count)
      `);

        if (profile?.role === 'mentor') {
            // Mentors see their own tests
            query = query.eq('mentor_id', user.id);
        } else {
            // Students see tests they're invited to
            const { data: invitations } = await supabase
                .from('test_invitations')
                .select('test_id')
                .eq('student_id', user.id);

            const testIds = invitations?.map(inv => inv.test_id) || [];
            query = query.in('id', testIds.length > 0 ? testIds : ['00000000-0000-0000-0000-000000000000']);
        }

        // Apply filters
        if (filter === 'live') {
            query = query.eq('is_live', true);
        } else if (filter === 'scheduled') {
            query = query
                .eq('is_live', false)
                .gte('scheduled_at', new Date().toISOString());
        } else if (filter === 'past') {
            query = query
                .eq('is_live', false)
                .lt('scheduled_at', new Date().toISOString());
        }

        const { data: tests, error } = await query.order('id', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ tests });
    } catch (error) {
        console.error('Error fetching tests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a mentor
        const { data: profile } = await supabase
            .from('users')
            .select('role, university_id')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'mentor') {
            return NextResponse.json({ error: 'Only mentors can create tests' }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            description,
            test_type,
            question_type,
            duration_minutes,
            total_marks,
            scheduled_at,
            questions,
            community_id,
            enable_screen_recording,
            enable_face_monitoring,
            settings,
            proctoring_settings,
        } = body;

        // Validate required fields
        if (!title || !test_type || !question_type || !duration_minutes || !total_marks || !questions) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: test, error } = await supabase
            .from('tests')
            .insert({
                title,
                description,
                mentor_id: user.id,
                university_id: profile.university_id,
                community_id: community_id || null,
                test_type,
                question_type,
                duration_minutes,
                total_marks,
                scheduled_at: scheduled_at || null,
                questions,
                enable_screen_recording: enable_screen_recording ?? proctoring_settings?.screen_recording ?? true,
                enable_face_monitoring: enable_face_monitoring ?? proctoring_settings?.face_monitoring ?? true,
                settings: {
                    randomize_questions: settings?.randomize_questions ?? false,
                    show_results_immediately: settings?.show_results_immediately ?? true,
                    allow_review: settings?.allow_review ?? true,
                    enable_anti_cheat: proctoring_settings?.anti_cheat ?? settings?.enable_anti_cheat ?? true,
                },
                proctoring_settings: proctoring_settings || {
                    screen_recording: true,
                    face_monitoring: true,
                    tab_switch_limit: 3,
                    fullscreen_required: true,
                },
                is_live: false
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating test:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ test }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating test:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

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
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        // Update test (RLS ensures only mentor can update their own tests)
        const { data: test, error } = await supabase
            .from('tests')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('mentor_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ test });
    } catch (error) {
        console.error('Error updating test:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('tests')
            .delete()
            .eq('id', id)
            .eq('mentor_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting test:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
