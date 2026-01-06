import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantIds, roomName, testId } = await request.json();

    // Create a Daily.co room using API
    // Note: You need to set DAILY_API_KEY in your environment variables
    const dailyApiKey = process.env.DAILY_API_KEY;

    if (!dailyApiKey) {
      return NextResponse.json(
        { error: 'Daily.co API key not configured' },
        { status: 500 }
      );
    }

    // Create room with Daily API
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomName || `room-${Date.now()}`,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: true,
          enable_recording: testId ? 'cloud' : 'local',
          max_participants: 50,
          exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Daily API error:', error);
      return NextResponse.json(
        { error: 'Failed to create video room' },
        { status: 500 }
      );
    }

    const room = await response.json();

    // Create call history record
    const { data: callHistory, error: dbError } = await supabase
      .from('call_history')
      .insert({
        caller_id: user.id,
        room_url: room.url,
        call_type: testId ? 'test_monitoring' : 'direct',
        test_id: testId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Send notifications to participants
    if (participantIds && participantIds.length > 0) {
      const { data: caller } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      for (const participantId of participantIds) {
        await supabase.from('notifications').insert({
          user_id: participantId,
          type: 'video_call',
          title: 'Video Call Invitation',
          message: `${caller?.full_name || 'Someone'} invited you to a video call`,
          metadata: {
            room_url: room.url,
            call_history_id: callHistory?.id,
          },
        });
      }
    }

    return NextResponse.json({
      roomUrl: room.url,
      roomName: room.name,
      callHistoryId: callHistory?.id,
    });
  } catch (error) {
    console.error('Error creating video room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
