import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/* GET /api/history?type=roadmap|course|guide|career_coach */
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const type = req.nextUrl.searchParams.get('type');

    let query = supabase
        .from('ai_history')
        .select('id, type, title, created_at, data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}

/* POST /api/history  body: { type, title, data } */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, title, data } = body as { type: string; title: string; data: unknown };

    if (!type || !title || !data) {
        return NextResponse.json({ error: 'Missing type, title, or data' }, { status: 400 });
    }

    const { data: saved, error } = await supabase
        .from('ai_history')
        .insert({ user_id: user.id, type, title, data })
        .select('id')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(saved);
}

/* DELETE /api/history?id=<uuid> */
export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
        .from('ai_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
