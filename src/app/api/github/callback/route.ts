import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/github';

/**
 * GET /api/github/callback
 * GitHub redirects here after authorization. Exchanges code for access token,
 * fetches the GitHub user profile, and upserts into github_connections.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  if (errorParam) {
    return NextResponse.redirect(`${appUrl}/dashboard/student/profile?github_error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/student/profile?github_error=invalid_request`);
  }

  // Parse state to get userId
  let userId: string;
  let returnTo: string | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
    userId = decoded.userId;
    returnTo = decoded.returnTo ?? null;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/student/profile?github_error=invalid_state`);
  }

  // Exchange code for access token
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/dashboard/student/profile?github_error=not_configured`);
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      scope?: string;
      token_type?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/student/profile?github_error=token_exchange_failed`,
      );
    }

    // Fetch GitHub user profile
    const ghUser = await getAuthenticatedUser(tokenData.access_token);
    if (!ghUser) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/student/profile?github_error=profile_fetch_failed`,
      );
    }

    // Upsert connection in DB
    const admin = createAdminClient();
    await admin.from('github_connections').upsert(
      {
        user_id: userId,
        github_user_id: ghUser.id,
        github_username: ghUser.login,
        github_name: ghUser.name,
        github_avatar_url: ghUser.avatar_url,
        github_profile_url: ghUser.html_url,
        access_token: tokenData.access_token,
        token_scope: tokenData.scope ?? '',
        public_repos: ghUser.public_repos,
        followers: ghUser.followers,
        following: ghUser.following,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    const successUrl = returnTo
      ? `${appUrl}${returnTo}?github_connected=true`
      : `${appUrl}/dashboard/student/profile?github_connected=true`;

    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/student/profile?github_error=server_error`,
    );
  }
}
