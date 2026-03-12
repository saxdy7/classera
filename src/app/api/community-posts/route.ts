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
    const communityId = searchParams.get('communityId');
    const type = searchParams.get('type'); // 'normal', 'question', 'announcement'
    const saved = searchParams.get('saved'); // 'true' for saved posts

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
    }

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        author:users!community_posts_author_id_fkey(id, full_name, avatar_url, role)
      `)
      .eq('community_id', communityId)
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error('Error fetching posts:', error);
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
    const { community_id, title, content, type = 'normal', images = null } = body;

    if (!community_id || !content) {
      return NextResponse.json(
        { error: 'Community ID and content are required' },
        { status: 400 }
      );
    }

    // Verify user is a member or mentor
    const { data: membership } = await supabase
      .from('community_members')
      .select('status')
      .eq('community_id', community_id)
      .eq('student_id', user.id)
      .single();

    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', community_id)
      .single();

    const isMentor = community?.mentor_id === user.id;
    const isMember = membership?.status === 'approved';

    if (!isMentor && !isMember) {
      return NextResponse.json(
        { error: 'You must be a community member to post' },
        { status: 403 }
      );
    }

    // Only mentors can create announcements
    if (type === 'announcement' && !isMentor) {
      return NextResponse.json(
        { error: 'Only mentors can create announcements' },
        { status: 403 }
      );
    }

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        community_id,
        author_id: user.id,
        title: title || null,
        content,
        type,
        images
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
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
    const { postId, action, ...updates } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Get post to verify ownership
    const { data: post } = await supabase
      .from('community_posts')
      .select('author_id, community_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is author or mentor
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    const canModerate = post.author_id === user.id || community?.mentor_id === user.id;

    if (!canModerate) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('community_posts')
      .update(updates)
      .eq('id', postId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
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
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Get post to verify ownership
    const { data: post } = await supabase
      .from('community_posts')
      .select('author_id, community_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is author or mentor
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', post.community_id)
      .single();

    const canDelete = post.author_id === user.id || community?.mentor_id === user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('community_posts')
      .update({
        is_deleted: true,
        deleted_by: user.id,
        deleted_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
