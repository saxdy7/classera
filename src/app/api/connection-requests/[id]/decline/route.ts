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
        .delete()
        .or(`and(requester_id.eq.${studentId},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${studentId})`)
        .select()
        .single();

      if (error) {
        console.error('Error declining student connection:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Handle mentor connection by request ID
    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('mentor_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error declining connection request:', error);
      return NextResponse.redirect(
        new URL('/dashboard/mentor/students?error=decline_failed', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/dashboard/mentor/students?success=declined', request.url)
    );
  } catch (err) {
    console.error('Error in POST /api/connection-requests/[id]/decline:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

