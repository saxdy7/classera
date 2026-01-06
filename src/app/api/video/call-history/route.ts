import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get call history
    const { data: calls, error } = await supabase
      .from('call_history')
      .select(`
        *,
        caller:users!call_history_caller_id_fkey(id, full_name, avatar_url),
        receiver:users!call_history_receiver_id_fkey(id, full_name, avatar_url),
        test:tests(id, title)
      `)
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching call history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch call history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('Error in call history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
