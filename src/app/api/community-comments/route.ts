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

    // Get the post and its community
    const { data: post } = await supabase
      .from('community_posts')
      .select('community_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify user is member or mentor
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const isMentor = community.mentor_id === user.id;
    if (!isMentor) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('status')
        .eq('community_id', post.community_id)
        .eq('student_id', user.id)
        .single();

      if (!membership || membership.status !== 'approved') {
        return NextResponse.json({ error: 'You are not a member of this community' }, { status: 403 });
      }
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        id,
        post_id,
        author_id,
        parent_comment_id,
        content,
        images,
        likes_count,
        is_best_answer,
        marked_as_best_by,
        marked_as_best_at,
        is_deleted,
        deleted_by,
        deleted_at,
        created_at,
        updated_at
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('is_best_answer', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch author details for each comment
    if (comments && comments.length > 0) {
      const authorIds = [...new Set(comments.map(c => c.author_id))];
      const { data: authors, error: authError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, role')
        .in('id', authorIds);

      if (!authError && authors) {
        const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
        const commentsWithAuthor = comments.map(c => ({
          ...c,
          author: authorMap[c.author_id] || null
        }));
        return NextResponse.json({ comments: commentsWithAuthor });
      }
    }

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

    console.log('POST /api/community-comments - Request:', {
      userId: user.id,
      post_id,
      contentLength: content?.length,
      parent_comment_id
    });

    if (!post_id || !content) {
      console.warn('Validation failed: missing post_id or content', {
        post_id: !!post_id,
        content: !!content,
        received: { post_id, content }
      });
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Verify post exists and is not locked
    const { data: post } = await supabase
      .from('community_posts')
      .select('community_id, is_locked, is_deleted')
      .eq('id', post_id)
      .maybeSingle();

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
    const { data: membership, error: memberError } = await supabase
      .from('community_members')
      .select('status')
      .eq('community_id', post.community_id)
      .eq('student_id', user.id)
      .maybeSingle();

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    if (communityError) {
      console.error('Error fetching community:', communityError);
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const isMentor = community?.mentor_id === user.id;
    const isMember = membership?.status === 'approved';

    console.log('Comment submission - Membership check:', {
      userId: user.id,
      communityId: post.community_id,
      isMentor,
      isMember,
      membershipStatus: membership?.status,
      membershipData: membership
    });

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

    if (error) {
      console.error('Supabase error creating comment:', error);
      return NextResponse.json({
        error: error.message || 'Failed to create comment',
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    if (!comment) {
      return NextResponse.json({ error: 'Comment creation returned no data' }, { status: 500 });
    }

    // Process mentions in the comment content (non-blocking, optional)
    // Temporarily disabled due to database function ambiguity
    // TODO: Fix create_notification() function signature in database
    // try {
    //   await supabase.rpc('process_mentions', {
    //     p_content: content,
    //     p_comment_id: comment.id,
    //     p_mentioned_by: user.id
    //   });
    // } catch (mentionError) {
    //   console.warn('Mention processing failed, continuing anyway:', mentionError);
    // }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to create comment',
      code: error?.code
    }, { status: 500 });
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
        post_id
      `)
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get the post to find the community
    const { data: post } = await supabase
      .from('community_posts')
      .select('community_id')
      .eq('id', comment.post_id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const canModerate = comment.author_id === user.id || community.mentor_id === user.id;

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
        post_id
      `)
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get the post to find the community
    const { data: post } = await supabase
      .from('community_posts')
      .select('community_id')
      .eq('id', comment.post_id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const canDelete = comment.author_id === user.id || community.mentor_id === user.id;

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
