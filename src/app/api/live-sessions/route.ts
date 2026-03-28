import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const GOOGLE_MEET_API_KEY = process.env.GOOGLE_MEET_API_KEY || 'AIzaSyDigHGYE_RNo1bHnKA_0TQfpSfrY8__yTs';

export async function POST(request: Request) {
  try {
    const { targetStudentId, title } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if users are connected
    const { data: connection } = await supabase
      .from('connection_requests')
      .select('*')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${targetStudentId},status.eq.accepted),` +
        `and(requester_id.eq.${targetStudentId},receiver_id.eq.${user.id},status.eq.accepted)`
      )
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'You must be connected to start a live session' },
        { status: 403 }
      );
    }

    // Generate unique meet ID
    const meetId = crypto.randomBytes(8).toString('hex');
    const googleMeetUrl = `https://meet.google.com/${meetId}`;

    // Store session in peer_sessions table (new table for student-to-student sessions)
    const { data: session, error } = await supabase
      .from('peer_sessions')
      .insert([
        {
          created_by: user.id,
          target_student_id: targetStudentId,
          google_meet_url: googleMeetUrl,
          google_meet_id: meetId,
          title: title || 'Live Session',
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating peer session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      meetUrl: googleMeetUrl,
      meetId: meetId,
    });
  } catch (error) {
    console.error('Error generating meet link:', error);
    return NextResponse.json(
      { error: 'Failed to generate meeting link' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from('peer_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is part of this peer session
    if (session.created_by !== user.id && session.target_student_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching peer session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

