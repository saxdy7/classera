import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Mock endpoint for saving preferences
    // In a real app, this would upsert to 'notification_preferences' table
    return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabase
        .from('users')
        .update({
            student_preferences: body,
            quiz_completed: true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
