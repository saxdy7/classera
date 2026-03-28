import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const requestId = (await params).id;
    const { studentId } = body;

    // Handle student-to-student connection by studentId
    if (studentId) {
      const { data, error } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .or(`and(requester_id.eq.${studentId},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${studentId})`)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !data) {
        console.error('Error accepting student connection:', error);
        return NextResponse.json(
          { error: error?.message || 'Connection not found' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    // Handle mentor connection by request ID
    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('mentor_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error accepting connection request:', error);
      return NextResponse.redirect(
        new URL('/dashboard/mentor/students?error=accept_failed', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/dashboard/mentor/students?success=accepted', request.url)
    );
  } catch (err) {
    console.error('Error in POST /api/connection-requests/[id]/accept:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

