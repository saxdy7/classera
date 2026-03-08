import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('mentor_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error accepting connection request:', error);
      return NextResponse.redirect(
        new URL('/dashboard/mentor/students?error=accept_failed', _request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/dashboard/mentor/students?success=accepted', _request.url)
    );
  } catch (err) {
    console.error('Error in POST /api/connection-requests/[id]/accept:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
