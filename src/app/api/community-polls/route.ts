import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const communityId = searchParams.get('community_id');
    const channelId = searchParams.get('channel_id');

    let query = supabase
      .from('community_polls')
      .select(`
        *,
        creator:users!community_polls_created_by_fkey(id, full_name, avatar_url),
        poll_votes(user_id, option_id)
      `)
      .order('created_at', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data: polls, error } = await query;

    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      community_id,
      channel_id,
      question,
      options,
      multiple_choice,
      anonymous,
      expires_at,
    } = body;

    // Verify user is mentor of the community
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', community_id)
      .single();

    if (!community || community.mentor_id !== user.id) {
      return NextResponse.json(
        { error: 'Only community mentors can create polls' },
        { status: 403 }
      );
    }

    // Format options with empty votes arrays
    const formattedOptions = options.map((opt: string, idx: number) => ({
      id: `option_${idx}`,
      text: opt,
      votes: [],
    }));

    const { data: poll, error } = await supabase
      .from('community_polls')
      .insert({
        community_id,
        channel_id,
        created_by: user.id,
        question,
        options: formattedOptions,
        multiple_choice: multiple_choice || false,
        anonymous: anonymous || false,
        expires_at,
      })
      .select(`
        *,
        creator:users!community_polls_created_by_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating poll:', error);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    return NextResponse.json({ poll });
  } catch (error) {
    console.error('Error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const pollId = searchParams.get('id');

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('community_polls')
      .delete()
      .eq('id', pollId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting poll:', error);
      return NextResponse.json(
        { error: 'Failed to delete poll' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
