import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Start a conversation with a user (creates initial message if needed)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { otherUserId } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 });
    }

    // Get the other user's details
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .eq('id', otherUserId)
      .single();

    if (userError || !otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: otherUser });
  } catch (error) {
    console.error('Error in POST /api/start-conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
