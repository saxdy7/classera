import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Vote on a poll
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { pollId, optionId } = body;

    if (!pollId || !optionId) {
      return NextResponse.json({ error: 'Poll ID and option ID required' }, { status: 400 });
    }

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('community_polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('community_poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      // Update vote
      const { error: updateError } = await supabase
        .from('community_poll_votes')
        .update({ option_id: optionId, voted_at: new Date().toISOString() })
        .eq('id', existingVote.id);

      if (updateError) throw updateError;
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('community_poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error voting:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove vote
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const pollId = searchParams.get('pollId');

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('community_poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
