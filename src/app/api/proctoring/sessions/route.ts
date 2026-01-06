import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Get proctoring session
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const testId = searchParams.get('test_id');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (sessionId) {
            // Get specific session
            const { data, error } = await supabase
                .from('test_proctoring_sessions')
                .select(`
                    *,
                    test:tests(*),
                    student:users!test_proctoring_sessions_student_id_fkey(id, full_name, avatar_url)
                `)
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return NextResponse.json({ session: data });
        }

        if (testId) {
            // Get all sessions for a test (for mentors)
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'mentor') {
                return NextResponse.json({ error: 'Only mentors can view all sessions' }, { status: 403 });
            }

            const { data, error } = await supabase
                .from('test_proctoring_sessions')
                .select(`
                    *,
                    student:users!test_proctoring_sessions_student_id_fkey(id, full_name, avatar_url),
                    alerts:proctoring_alerts(count)
                `)
                .eq('test_id', testId)
                .order('started_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ sessions: data });
        }

        return NextResponse.json({ error: 'session_id or test_id required' }, { status: 400 });
    } catch (error: any) {
        console.error('Error fetching proctoring session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create proctoring session
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { test_id, daily_room_url, daily_room_name } = body;

        // Check if session already exists
        const { data: existing } = await supabase
            .from('test_proctoring_sessions')
            .select('id')
            .eq('test_id', test_id)
            .eq('student_id', user.id)
            .single();

        if (existing) {
            return NextResponse.json({ session: existing });
        }

        // Create new session
        const { data, error } = await supabase
            .from('test_proctoring_sessions')
            .insert({
                test_id,
                student_id: user.id,
                daily_room_url,
                daily_room_name,
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ session: data });
    } catch (error: any) {
        console.error('Error creating proctoring session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update proctoring session
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { session_id, ...updates } = body;

        const { data, error } = await supabase
            .from('test_proctoring_sessions')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', session_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ session: data });
    } catch (error: any) {
        console.error('Error updating proctoring session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
