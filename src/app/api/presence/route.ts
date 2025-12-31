import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status, channelId, typing } = await request.json();

        const updates: any = {
            user_id: user.id,
            last_seen: new Date().toISOString()
        };

        if (status) updates.status = status;
        if (typing !== undefined) {
            updates.typing_in_channel = typing ? channelId : null;
        }

        const { error } = await supabase
            .from('user_presence')
            .upsert(updates);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating presence:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
