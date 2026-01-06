import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { poll_id, option_id } = await request.json();

    // Get poll details
    const { data: poll } = await supabase
      .from('community_polls')
      .select('*, community:communities(*)')
      .eq('id', poll_id)
      .single();

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // Check if user is a member of the community
    const { data: membership } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', poll.community_id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a community member to vote' },
        { status: 403 }
      );
    }

    // If not multiple choice, delete existing votes
    if (!poll.multiple_choice) {
      await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', poll_id)
        .eq('user_id', user.id);
    }

    // Add vote
    const { data: vote, error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id,
        user_id: user.id,
        option_id,
      })
      .select()
      .single();

    if (error) {
      // If duplicate vote (in multiple choice), remove it instead
      if (error.code === '23505') {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll_id)
          .eq('user_id', user.id)
          .eq('option_id', option_id);

        return NextResponse.json({ message: 'Vote removed' });
      }

      console.error('Error voting:', error);
      return NextResponse.json(
        { error: 'Failed to vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vote });
  } catch (error) {
    console.error('Error in vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
