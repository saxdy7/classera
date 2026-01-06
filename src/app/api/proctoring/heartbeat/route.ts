import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Send heartbeat
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
            is_active,
            is_fullscreen,
            browser_info,
            latency_ms,
        } = body;

        // Insert heartbeat
        const { data, error } = await supabase
            .from('test_heartbeats')
            .insert({
                session_id,
                is_active,
                is_fullscreen,
                browser_info,
                latency_ms,
                timestamp: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ heartbeat: data });
    } catch (error: any) {
        console.error('Error sending heartbeat:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Get heartbeats for a session
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!sessionId) {
            return NextResponse.json({ error: 'session_id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('test_heartbeats')
            .select('*')
            .eq('session_id', sessionId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ heartbeats: data });
    } catch (error: any) {
        console.error('Error fetching heartbeats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
