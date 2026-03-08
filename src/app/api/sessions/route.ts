import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// Safe notification insert — ignores column-mismatch errors so they never block core operations
async function safeInsertNotifications(admin: ReturnType<typeof createAdminClient>, notifications: any[]) {
  try {
    const { error } = await admin.from('notifications').insert(notifications);
    if (error) console.error('Non-fatal: notification insert failed', error);
  } catch (e) {
    console.error('Non-fatal: notification insert exception', e);
  }
}

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
    const status = searchParams.get('status'); // scheduled, ongoing, completed, cancelled
    const upcoming = searchParams.get('upcoming') === 'true';

    // Get user's role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const admin = createAdminClient();

    // live_sessions actual columns: id, mentor_id, title, description,
    //   scheduled_at, duration_minutes, meeting_url, status, max_participants, created_at, updated_at
    let query = admin
      .from('live_sessions')
      .select(`
        *,
        mentor:users!live_sessions_mentor_id_fkey(id, full_name, avatar_url),
        participants:session_participants(count)
      `)
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (upcoming) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }

    if (profile.role === 'mentor') {
      // Mentors see their own sessions
      query = query.eq('mentor_id', user.id);
    } else {
      // Students see only sessions they're a participant in
      const { data: participantSessions } = await admin
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

      const sessionIds = (participantSessions ?? []).map((p: any) => p.session_id);

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

    return NextResponse.json({ sessions: sessions ?? [] });
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can create sessions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      scheduled_at,
      duration_minutes,
      settings,
      participant_ids, // Array of user IDs to invite
    } = body;

    if (!title || !scheduled_at) {
      return NextResponse.json({ error: 'title and scheduled_at are required' }, { status: 400 });
    }

    // Optionally create Daily room if API key exists
    const roomName = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dailyRoom = await createDailyRoom(roomName, settings);

    const admin = createAdminClient();

    // Insert using only columns that exist in live_sessions:
    //   mentor_id, title, description, scheduled_at, duration_minutes, meeting_url, status, max_participants
    const { data: session, error: sessionError } = await admin
      .from('live_sessions')
      .insert({
        mentor_id: user.id,
        title,
        description: description || null,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        meeting_url: dailyRoom?.url || null,
        status: 'scheduled',
        max_participants: settings?.max_participants || 50,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    // Add mentor as participant — session_participants has: id, session_id, user_id, joined_at
    await admin.from('session_participants').insert({
      session_id: (session as any).id,
      user_id: user.id,
    });

    // Invite participants
    if (participant_ids && participant_ids.length > 0) {
      const participantInserts = participant_ids.map((userId: string) => ({
        session_id: (session as any).id,
        user_id: userId,
      }));

      await admin.from('session_participants').insert(participantInserts);

      // Notify invitees — use only columns safe for notifications schema
      await safeInsertNotifications(admin, participant_ids.map((userId: string) => ({
        user_id: userId,
        type: 'session',
        title: `Invited to: ${title}`,
        message: `You've been invited to a session scheduled for ${new Date(scheduled_at).toLocaleString()}`,
        action_url: '/dashboard/student/sessions',
      })));
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

    const admin = createAdminClient();

    // Verify ownership — live_sessions uses mentor_id, not host_id
    const { data: session, error: fetchError } = await admin
      .from('live_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if ((session as any).mentor_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    let updateData: any = {};

    switch (action) {
      case 'start':
        // Valid status values (999_CLEAN): 'scheduled', 'ongoing', 'completed', 'cancelled'
        updateData = { status: 'ongoing' };
        break;

      case 'end':
        updateData = { status: 'completed' };
        break;

      case 'cancel':
        updateData = { status: 'cancelled' };
        break;

      default:
        // Regular update — only include columns that exist in live_sessions
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.scheduled_at !== undefined) updateData.scheduled_at = updates.scheduled_at;
        if (updates.duration_minutes !== undefined) updateData.duration_minutes = updates.duration_minutes;
        if (updates.meeting_url !== undefined) updateData.meeting_url = updates.meeting_url;
        if (updates.max_participants !== undefined) updateData.max_participants = updates.max_participants;
    }

    const { data: updatedSession, error: updateError } = await admin
      .from('live_sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Send notifications for cancel or reschedule
    if (action === 'cancel' || (updates.scheduled_at && updates.scheduled_at !== (session as any).scheduled_at)) {
      // Get all participants to notify (excluding the mentor)
      const { data: participants } = await admin
        .from('session_participants')
        .select('user_id')
        .eq('session_id', session_id)
        .neq('user_id', user.id);

      if (participants && participants.length > 0) {
        const isCancel = action === 'cancel';
        await safeInsertNotifications(admin, participants.map((p: any) => ({
          user_id: p.user_id,
          type: 'session',
          title: isCancel ? 'Session Cancelled' : 'Session Rescheduled',
          message: isCancel
            ? `The session "${(session as any).title}" has been cancelled.`
            : `The session "${updates.title || (session as any).title}" has been rescheduled to ${new Date(updates.scheduled_at || (session as any).scheduled_at).toLocaleString()}.`,
          action_url: '/dashboard/student/sessions',
        })));
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

    const admin = createAdminClient();

    // Verify ownership — live_sessions uses mentor_id, not host_id
    const { data: session } = await admin
      .from('live_sessions')
      .select('mentor_id')
      .eq('id', session_id)
      .single();

    if (!session || (session as any).mentor_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { error } = await admin.from('live_sessions').delete().eq('id', session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
