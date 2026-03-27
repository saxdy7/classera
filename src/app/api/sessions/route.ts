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

// Create a Daily.co room URL (requires API key)
async function createDailyRoom(roomName: string, settings: any) {
  try {
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is not configured');
    }

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public', // Change to 'private' and use tokens for gated access later
        properties: {
          enable_chat: settings.enable_chat !== false,
          enable_screenshare: settings.allow_screen_share !== false,
          start_video_off: !settings.require_camera,
          start_audio_off: !settings.require_microphone,
          exp: Math.floor(Date.now() / 1000) + 3600 * 2, // 2-hour expiry
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create Daily room');
    }

    const data = await response.json();
    return { 
      url: data.url, 
      name: data.name,
      room_name: data.name,
      type: 'daily' 
    };
  } catch (error) {
    console.error('Error creating Daily room:', error);
    throw error;
  }
}

// Create a Jitsi room URL (completely free)
async function createJitsiRoom(roomName: string, settings: any) {
  try {
    // Sanitize room name - Jitsi requires lowercase alphanumeric and hyphens only
    const sanitizedName = roomName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 100);

    // Jitsi Meet room URL - no backend needed, completely free
    const roomUrl = `https://meet.jit.si/classera-${sanitizedName}`;
    
    return { 
      url: roomUrl, 
      name: sanitizedName, 
      room_name: sanitizedName,
      type: 'jitsi' 
    };
  } catch (error) {
    console.error('Error creating Jitsi room:', error);
    throw error;
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

    let query = admin
      .from('live_sessions')
      .select(`
        *,
        mentor:users!live_sessions_mentor_id_fkey(id, full_name, avatar_url),
        test:tests(id, title),
        participants:session_participants(id, user_id, user:users(id, full_name, avatar_url))
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
      session_type,
      scheduled_at,
      duration_minutes,
      test_id,
      settings,
      participant_ids, // Array of user IDs to invite
    } = body;

    if (!title || !scheduled_at) {
      return NextResponse.json({ error: 'title and scheduled_at are required' }, { status: 400 });
    }

    // Create Jitsi room (Completely free and reliable)
    let videoRoom = null;
    try {
      const roomName = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      videoRoom = await createJitsiRoom(roomName, settings);
    } catch (videoError) {
      console.error('Error creating Jitsi room:', videoError);
      return NextResponse.json({ error: 'Failed to create video room' }, { status: 500 });
    }

    const admin = createAdminClient();

    // Insert using only columns that exist in live_sessions:
    //   mentor_id, title, description, scheduled_at, duration_minutes, meeting_url, status, max_participants
    const { data: session, error: sessionError } = await admin
      .from('live_sessions')
      .insert({
        mentor_id: user.id,
        title,
        description: description || null,
        session_type: session_type || 'mentor_meeting',
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        test_id: test_id || null,
        meeting_url: videoRoom?.url || null,
        daily_room_url: videoRoom?.url || null,
        settings: settings || {},
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

    // Invite participants (exclude mentor to avoid UNIQUE constraint violation)
    const filteredParticipantIds = (participant_ids || []).filter((id: string) => id !== user.id);
    if (filteredParticipantIds.length > 0) {
      const participantInserts = filteredParticipantIds.map((userId: string) => ({
        session_id: (session as any).id,
        user_id: userId,
      }));

      await admin.from('session_participants').insert(participantInserts);

      // Notify invitees — use only columns safe for notifications schema
      await safeInsertNotifications(admin, filteredParticipantIds.map((userId: string) => ({
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
      case 'start': {
        updateData = { status: 'ongoing' };
        // Lazily create video room if none was set at schedule-time
        const existingUrl = (session as any).daily_room_url || (session as any).meeting_url;
        if (!existingUrl) {
          const roomName = `session-${session_id.replace(/-/g, '').slice(0, 12)}`;
          const room = await createDailyRoom(roomName, (session as any).settings || {});
          if (room?.url) {
            updateData.daily_room_url = room.url;
            updateData.meeting_url = room.url;
          }
        }
        break;
      }

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
        if (updates.settings !== undefined) updateData.settings = updates.settings;
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
