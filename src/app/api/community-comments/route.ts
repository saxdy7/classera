import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        author:users!community_comments_author_id_fkey(id, full_name, avatar_url, role)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('is_best_answer', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { post_id, content, parent_comment_id = null } = body;

    if (!post_id || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Verify post exists and is not locked
    const { data: post } = await supabase
      .from('community_posts')
      .select('is_locked, is_deleted, community_id')
      .eq('id', post_id)
      .single();

    if (!post || post.is_deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.is_locked) {
      return NextResponse.json(
        { error: 'This post is locked. No new comments allowed.' },
        { status: 403 }
      );
    }

    // Verify user is member or mentor and not muted
    const { data: membership } = await supabase
      .from('community_members')
      .select('status')
      .eq('community_id', post.community_id)
      .eq('user_id', user.id)
      .single();

    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    const isMentor = community?.mentor_id === user.id;
    const isMember = membership?.status === 'approved';

    if (!isMentor && !isMember) {
      return NextResponse.json(
        { error: 'You must be a community member to comment' },
        { status: 403 }
      );
    }

    // Check if user is muted
    const { data: muteStatus } = await supabase
      .from('community_muted_users')
      .select('muted_until')
      .eq('community_id', post.community_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (muteStatus && (!muteStatus.muted_until || new Date(muteStatus.muted_until) > new Date())) {
      return NextResponse.json(
        { error: 'You are muted and cannot comment in this community' },
        { status: 403 }
      );
    }

    const { data: comment, error } = await supabase
      .from('community_comments')
      .insert({
        post_id,
        author_id: user.id,
        content,
        parent_comment_id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, ...updates } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    // Verify ownership or mentor status
    const { data: comment } = await supabase
      .from('community_comments')
      .select(`
        author_id,
        post_id,
        community_posts!inner(community_id)
      `)
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    interface CommentWithPost {
      author_id: string;
      post_id: string;
      community_posts: {
        community_id: string;
      };
    }

    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', (comment as CommentWithPost).community_posts.community_id)
      .single();

    const canModerate = comment.author_id === user.id || community?.mentor_id === user.id;

    if (!canModerate) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('community_comments')
      .update(updates)
      .eq('id', commentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    // Verify ownership or mentor status
    const { data: comment } = await supabase
      .from('community_comments')
      .select(`
        author_id,
        post_id,
        community_posts!inner(community_id)
      `)
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    interface CommentWithPost2 {
      author_id: string;
      post_id: string;
      community_posts: {
        community_id: string;
      };
    }

    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', (comment as CommentWithPost2).community_posts.community_id)
      .single();

    const canDelete = comment.author_id === user.id || community?.mentor_id === user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('community_comments')
      .update({
        is_deleted: true,
        deleted_by: user.id,
        deleted_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
