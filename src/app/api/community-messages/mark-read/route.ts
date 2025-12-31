import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageIds } = await request.json();

        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return NextResponse.json({ error: 'Message IDs required' }, { status: 400 });
        }

        // Insert read receipts efficiently
        const receipts = messageIds.map(id => ({
            message_id: id,
            user_id: user.id
        }));

        const { error } = await supabase
            .from('message_read_receipts')
            .upsert(receipts, { onConflict: 'message_id,user_id', ignoreDuplicates: true });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
