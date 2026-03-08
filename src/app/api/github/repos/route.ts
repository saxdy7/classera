import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRepos } from '@/lib/github';

/**
 * GET /api/github/repos
 * Returns the authenticated user's connected GitHub repositories.
 * Optional ?search= filter on repo name.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: conn } = await admin
      .from('github_connections')
      .select('access_token, github_username')
      .eq('user_id', user.id)
      .single();

    if (!conn) {
      return NextResponse.json({ error: 'GitHub account not connected', repos: [] }, { status: 200 });
    }

    const repos = await getUserRepos(conn.github_username, conn.access_token);
    const search = request.nextUrl.searchParams.get('search')?.toLowerCase();

    const filtered = search
      ? (repos ?? []).filter((r) => r.name.toLowerCase().includes(search))
      : repos ?? [];

    return NextResponse.json({ repos: filtered });
  } catch (err) {
    console.error('Error fetching repos:', err);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
