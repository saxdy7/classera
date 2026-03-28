import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Create a connection request (mentor or student)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { mentorId, targetUserId, type = 'mentor' } = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipientId = mentorId || targetUserId;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID required' },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        { error: 'Cannot connect with yourself' },
        { status: 400 }
      );
    }

    // Check if request already exists (both directions for student-student)
    const { data: existing } = await supabase
      .from('connection_requests')
      .select('*')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${recipientId}),and(requester_id.eq.${recipientId},receiver_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Connection request already exists', status: existing.status },
        { status: 400 }
      );
    }

    // For backward compatibility: mentor-student uses student_id, mentor_id
    // For new: student-student uses requester_id, receiver_id
    let insertData: any = { status: 'pending' };

    if (type === 'mentor') {
      // Old format: student requesting mentor
      insertData.student_id = user.id;
      insertData.mentor_id = recipientId;
    } else {
      // New format: student-to-student mutual connection
      insertData.requester_id = user.id;
      insertData.receiver_id = recipientId;
    }

    // Create connection request
    const { data, error } = await supabase
      .from('connection_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating connection request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error in POST /api/connection-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check connection status with a mentor
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json({ error: 'mentorId required' }, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check connection status
    const { data } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('student_id', user.id)
      .eq('mentor_id', mentorId)
      .single();

    return NextResponse.json({ data, connected: data?.status === 'accepted' });
  } catch (error) {
    console.error('Error in GET /api/connection-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update connection request status (accept/reject)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { requestId, status } = await request.json();

    if (!requestId || !status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the request (RLS ensures only mentor can update their requests)
    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('mentor_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating connection request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error in PATCH /api/connection-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
