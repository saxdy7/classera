import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Log proctoring violation
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: testId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, timestamp, details } = body;

        // Valid violation types
        const validTypes = ['tab_switch', 'face_not_detected', 'multiple_faces', 'screen_share_stopped', 'suspicious_activity'];

        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid violation type' }, { status: 400 });
        }

        // Log the violation
        const { error } = await supabase
            .from('proctoring_logs')
            .insert({
                test_id: testId,
                student_id: user.id,
                violation_type: type,
                timestamp: timestamp || new Date().toISOString(),
                details: details || null
            });

        if (error) {
            // Table might not exist, create it
            console.error('Proctoring log error:', error);
        }

        // Update invitation with violation count
        await supabase.rpc('increment_violation_count', {
            p_test_id: testId,
            p_student_id: user.id
        });

        return NextResponse.json({ logged: true });
    } catch (error: any) {
        console.error('Error logging proctoring violation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Get proctoring logs for a test (mentor only)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: testId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify mentor owns the test
        const { data: test } = await supabase
            .from('tests')
            .select('mentor_id')
            .eq('id', testId)
            .single();

        if (!test || test.mentor_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { data: logs, error } = await supabase
            .from('proctoring_logs')
            .select(`
        *,
        student:users!proctoring_logs_student_id_fkey(id, full_name, avatar_url)
      `)
            .eq('test_id', testId)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        // Group by student
        const grouped: Record<string, any[]> = {};
        logs?.forEach(log => {
            if (!grouped[log.student_id]) {
                grouped[log.student_id] = [];
            }
            grouped[log.student_id].push(log);
        });

        return NextResponse.json({ logs, grouped });
    } catch (error: any) {
        console.error('Error fetching proctoring logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
