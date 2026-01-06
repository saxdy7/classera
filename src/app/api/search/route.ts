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
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // all, users, courses, communities, messages

    if (!query || query.length < 2) {
      return NextResponse.json({ results: {} });
    }

    const results: any = {};

    // Get user's university for filtering
    const { data: profile } = await supabase
      .from('users')
      .select('university_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Search Users
    if (!type || type === 'all' || type === 'users') {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, role, degree_type, expertise')
        .eq('university_id', profile.university_id)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      results.users = users || [];
    }

    // Search Courses
    if (!type || type === 'all' || type === 'courses') {
      const { data: courses } = await supabase
        .from('mentor_courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          level,
          instructor:users!mentor_courses_instructor_id_fkey(full_name, avatar_url)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      results.courses = courses || [];
    }

    // Search Communities
    if (!type || type === 'all' || type === 'communities') {
      const { data: communities } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          avatar_url,
          mentor:users!communities_mentor_id_fkey(full_name, avatar_url)
        `)
        .eq('university_id', profile.university_id)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      results.communities = communities || [];
    }

    // Search Tests (for mentors)
    if (profile.role === 'mentor' && (!type || type === 'all' || type === 'tests')) {
      const { data: tests } = await supabase
        .from('tests')
        .select('id, title, test_type, total_marks, scheduled_at')
        .eq('mentor_id', user.id)
        .ilike('title', `%${query}%`)
        .limit(10);

      results.tests = tests || [];
    }

    // Search Messages (within user's communities)
    if (!type || type === 'all' || type === 'messages') {
      // Get user's communities
      const { data: userCommunities } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const communityIds = userCommunities?.map(c => c.community_id) || [];

      if (communityIds.length > 0) {
        const { data: messages } = await supabase
          .from('community_messages')
          .select(`
            id,
            content,
            created_at,
            channel_id,
            user:users!community_messages_user_id_fkey(full_name, avatar_url),
            channel:community_channels!community_messages_channel_id_fkey(name, community_id)
          `)
          .in('channel_id', communityIds)
          .ilike('content', `%${query}%`)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(10);

        results.messages = messages || [];
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
