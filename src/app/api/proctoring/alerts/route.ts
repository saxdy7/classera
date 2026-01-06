import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Get alerts for a session or test
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const testId = searchParams.get('test_id');
        const severity = searchParams.get('severity');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let query = supabase
            .from('proctoring_alerts')
            .select(`
                *,
                session:test_proctoring_sessions(
                    id,
                    test_id,
                    student:users!test_proctoring_sessions_student_id_fkey(id, full_name, avatar_url)
                )
            `);

        if (sessionId) {
            query = query.eq('session_id', sessionId);
        }

        if (testId) {
            query = query.eq('session.test_id', testId);
        }

        if (severity) {
            query = query.eq('severity', severity);
        }

        query = query.order('triggered_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ alerts: data });
    } catch (error: any) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create alert
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            session_id,
            type,
            severity,
            title,
            description,
            metadata,
            screenshot_url,
            video_timestamp,
        } = body;

        const { data, error } = await supabase
            .from('proctoring_alerts')
            .insert({
                session_id,
                type,
                severity,
                title,
                description,
                metadata,
                screenshot_url,
                video_timestamp,
                triggered_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ alert: data });
    } catch (error: any) {
        console.error('Error creating alert:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update alert (resolve)
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { alert_id, is_resolved, resolution_note } = body;

        const { data, error } = await supabase
            .from('proctoring_alerts')
            .update({
                is_resolved,
                resolved_by: user.id,
                resolved_at: new Date().toISOString(),
                resolution_note,
            })
            .eq('id', alert_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ alert: data });
    } catch (error: any) {
        console.error('Error updating alert:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
