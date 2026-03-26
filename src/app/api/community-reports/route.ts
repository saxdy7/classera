import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch reports for a community
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const status = searchParams.get('status'); // pending, reviewed, resolved, dismissed

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
    }

    // Verify user is mentor
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', communityId)
      .single();

    if (!community || community.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Only community mentor can view reports' }, { status: 403 });
    }

    let query = supabase
      .from('community_post_reports')
      .select(`
        *,
        reported_by:users!community_post_reports_reported_by_fkey(id, full_name, avatar_url),
        post:community_posts(id, content, community_id),
        comment:community_comments(id, content, post_id)
      `)
      .eq('community_id', communityId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reports, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports: reports || [] });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a report
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { communityId, postId, commentId, reason, description } = body;

    if (!communityId || (!postId && !commentId)) {
      return NextResponse.json({ error: 'Community ID and post/comment ID required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Report reason required' }, { status: 400 });
    }

    // Verify content exists
    if (postId) {
      const { data: post } = await supabase
        .from('community_posts')
        .select('id')
        .eq('id', postId)
        .eq('community_id', communityId)
        .single();

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
    }

    if (commentId) {
      const { data: comment } = await supabase
        .from('community_comments')
        .select('id')
        .eq('id', commentId)
        .single();

      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
    }

    // Create report
    const { data: report, error } = await supabase
      .from('community_post_reports')
      .insert({
        community_id: communityId,
        post_id: postId || null,
        comment_id: commentId || null,
        reason,
        description: description || null,
        reported_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for mentor
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id, name')
      .eq('id', communityId)
      .single();

    if (community) {
      await supabase.rpc('create_notification', {
        p_user_id: community.mentor_id,
        p_title: 'New Report in ' + community.name,
        p_message: 'A user reported ' + (postId ? 'a post' : 'a comment') + ' for: ' + reason,
        p_notification_type: 'report',
        p_actor_id: user.id
      });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update report status
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, status, action } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Report ID and status required' }, { status: 400 });
    }

    // Get report to verify mentor
    const { data: report } = await supabase
      .from('community_post_reports')
      .select('community_id')
      .eq('id', reportId)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify user is mentor
    const { data: community } = await supabase
      .from('communities')
      .select('mentor_id')
      .eq('id', report.community_id)
      .single();

    if (!community || community.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Only mentor can update reports' }, { status: 403 });
    }

    // Update report
    const { error: updateError } = await supabase
      .from('community_post_reports')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    // If resolving with action, log it
    if (action) {
      await supabase
        .from('community_moderation_logs')
        .insert({
          community_id: report.community_id,
          action_type: 'resolve_report',
          action: action,
          performed_by: user.id,
          reason: 'Report resolution'
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
