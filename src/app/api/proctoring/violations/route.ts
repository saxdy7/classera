import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Log violation
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
            violation_type,
            count,
            timestamp,
        } = body;

        // Log to suspicious activities
        const { data, error } = await supabase
            .from('suspicious_activities')
            .insert({
                session_id,
                activity_type: violation_type,
                timestamp: timestamp || new Date().toISOString(),
                details: { count },
                is_auto_detected: true,
                detected_by: 'client',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ activity: data });
    } catch (error: any) {
        console.error('Error logging violation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
