import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

// Create a Daily.co room
async function createDailyRoom(roomName: string, settings: any) {
  if (!DAILY_API_KEY) {
    console.error('DAILY_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: settings?.chat_enabled ?? true,
          enable_screenshare: settings?.allow_screen_share ?? true,
          enable_recording: settings?.record_session ? 'cloud' : undefined,
          max_participants: settings?.max_participants || 50,
          enable_prejoin_ui: settings?.waiting_room ?? true,
          start_video_off: !settings?.require_camera,
          start_audio_off: !settings?.require_microphone,
          exp: Math.floor(Date.now() / 1000) + 86400 * 7, // Expires in 7 days
        },
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Daily room:', error);
    return null;
  }
}

// GET - List sessions
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // mentor_meeting, proctored_test, etc.
    const status = searchParams.get('status'); // scheduled, live, completed
    const upcoming = searchParams.get('upcoming') === 'true';

    // Get user's university
    const { data: profile } = await supabase
      .from('users')
      .select('university_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('live_sessions')
      .select(`
        *,
        host:users!live_sessions_host_id_fkey(id, full_name, avatar_url),
        test:tests(id, title),
        participants:session_participants(count)
      `)
      .eq('university_id', profile.university_id)
      .order('scheduled_at', { ascending: true });

    if (type) {
      query = query.eq('session_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (upcoming) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }

    // For students, only show sessions they're invited to or public sessions
    if (profile.role === 'student') {
      // Get sessions where student is a participant
      const { data: participantSessions } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

      const sessionIds = participantSessions?.map(p => p.session_id) || [];

      if (sessionIds.length > 0) {
        query = query.in('id', sessionIds);
      } else {
        return NextResponse.json({ sessions: [] });
      }
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create session
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if mentor
    const { data: profile } = await supabase
      .from('users')
      .select('university_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can create sessions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      session_type,
      scheduled_at,
      duration_minutes,
      test_id,
      settings,
      participant_ids, // Array of user IDs to invite
    } = body;

    // Validate required fields
    if (!title || !session_type || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Daily room
    const roomName = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dailyRoom = await createDailyRoom(roomName, settings);

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .insert({
        title,
        description: description || null,
        session_type,
        host_id: user.id,
        university_id: profile.university_id,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        daily_room_url: dailyRoom?.url || null,
        daily_room_name: dailyRoom?.name || roomName,
        test_id: test_id || null, // Convert empty string to null
        settings: settings || {},
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    // Add host as participant
    await supabase.from('session_participants').insert({
      session_id: session.id,
      user_id: user.id,
      role: 'host',
      status: 'accepted',
    });

    // Invite participants
    if (participant_ids && participant_ids.length > 0) {
      const participantInserts = participant_ids.map((userId: string) => ({
        session_id: session.id,
        user_id: userId,
        role: 'attendee',
        status: 'invited',
      }));

      await supabase.from('session_participants').insert(participantInserts);

      // Send notifications
      const notifications = participant_ids.map((userId: string) => ({
        user_id: userId,
        type: 'system',
        title: `Invited to: ${title}`,
        message: `You've been invited to a ${session_type.replace('_', ' ')} session scheduled for ${new Date(scheduled_at).toLocaleString()}`,
        related_id: session.id,
        related_type: 'session',
        action_url: '/dashboard/student/sessions',
        metadata: {
          session_id: session.id,
          session_title: title,
          session_type: session_type,
          scheduled_at: scheduled_at
        },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update session (start, end, update settings)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, action, ...updates } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: session, error: fetchError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    let updateData: any = {};

    switch (action) {
      case 'start':
        updateData = {
          status: 'live',
          started_at: new Date().toISOString(),
        };
        break;

      case 'end':
        updateData = {
          status: 'completed',
          ended_at: new Date().toISOString(),
        };
        break;

      case 'cancel':
        updateData = {
          status: 'cancelled',
        };
        break;

      default:
        // Regular update
        updateData = {
          title: updates.title,
          description: updates.description,
          scheduled_at: updates.scheduled_at,
          duration_minutes: updates.duration_minutes,
          settings: updates.settings,
        };
        // Remove undefined values
        Object.keys(updateData).forEach(key =>
          updateData[key] === undefined && delete updateData[key]
        );
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('live_sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Send notifications for cancel or reschedule
    if (action === 'cancel') {
      // Get all participants to notify
      const { data: participants } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', session_id)
        .neq('user_id', user.id); // Don't notify the host

      if (participants && participants.length > 0) {
        const notifications = participants.map((p: any) => ({
          user_id: p.user_id,
          type: 'system',
          title: 'Session Cancelled',
          message: `The session "${session.title}" scheduled for ${new Date(session.scheduled_at).toLocaleString()} has been cancelled.`,
          related_id: session.id,
          related_type: 'session',
          action_url: '/dashboard/student/sessions',
          metadata: {
            session_id: session.id,
            session_title: session.title,
            action: 'cancelled'
          },
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } else if (!action || (updates.scheduled_at && updates.scheduled_at !== session.scheduled_at)) {
      // Reschedule notification
      const { data: participants } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', session_id)
        .neq('user_id', user.id);

      if (participants && participants.length > 0) {
        const notifications = participants.map((p: any) => ({
          user_id: p.user_id,
          type: 'system',
          title: 'Session Rescheduled',
          message: `The session "${updates.title || session.title}" has been rescheduled to ${new Date(updates.scheduled_at || session.scheduled_at).toLocaleString()}.`,
          related_id: session.id,
          related_type: 'session',
          action_url: '/dashboard/student/sessions',
          metadata: {
            session_id: session.id,
            session_title: updates.title || session.title,
            new_schedule: updates.scheduled_at || session.scheduled_at,
            action: 'rescheduled'
          },
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete session
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: session } = await supabase
      .from('live_sessions')
      .select('host_id')
      .eq('id', session_id)
      .single();

    if (!session || session.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('live_sessions')
      .delete()
      .eq('id', session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
