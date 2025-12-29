import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Create a connection request
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { mentorId } = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('student_id', user.id)
      .eq('mentor_id', mentorId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Connection request already exists', status: existing.status },
        { status: 400 }
      );
    }

    // Create connection request
    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        student_id: user.id,
        mentor_id: mentorId,
        status: 'pending',
      })
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
