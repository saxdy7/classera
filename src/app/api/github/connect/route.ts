import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/github/connect
 * Redirects the authenticated user to GitHub OAuth authorization page.
 * Required env vars: GITHUB_CLIENT_ID, NEXT_PUBLIC_APP_URL
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured (missing GITHUB_CLIENT_ID)' },
      { status: 500 },
    );
  }

  const redirectUri = `${appUrl}/api/github/callback`;
  const state = Buffer.from(
    JSON.stringify({ userId: user.id, returnTo: request.nextUrl.searchParams.get('returnTo') ?? null }),
  ).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user repo',
    state,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
}
