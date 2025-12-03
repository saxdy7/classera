import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getGravatarUrl } from '@/lib/utils/gravatar';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') || 'student';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      // If no profile exists, create minimal profile and redirect to onboarding
      if (!profile) {
        const avatarUrl = getGravatarUrl(data.user.email || '');
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          role: role,
          full_name: data.user.user_metadata.full_name || '',
          email: data.user.email || '',
          university: '',
          avatar_url: avatarUrl,
        });

        return NextResponse.redirect(`${origin}/onboarding/${role}`);
      }

      // Check if profile is complete
      const isComplete = profile.university && profile.full_name;
      if (!isComplete) {
        return NextResponse.redirect(`${origin}/onboarding/${role}`);
      }

      return NextResponse.redirect(`${origin}/dashboard/${role}`);
    }
  }

  return NextResponse.redirect(`${origin}/signin`);
}
