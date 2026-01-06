import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Get saved posts for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: savedPosts, error } = await supabase
      .from('community_saved_posts')
      .select(`
        id,
        created_at,
        post:community_posts(
          *,
          author:users!community_posts_author_id_fkey(id, full_name, avatar_url, role)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ savedPosts: savedPosts || [] });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Save a post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Check if post exists and is not deleted
    const { data: post } = await supabase
      .from('community_posts')
      .select('id, is_deleted')
      .eq('id', postId)
      .single();

    if (!post || post.is_deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('community_saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Post already saved' }, { status: 400 });
    }

    const { error } = await supabase
      .from('community_saved_posts')
      .insert({
        post_id: postId,
        user_id: user.id
      });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Unsave a post
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('community_saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsaving post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
