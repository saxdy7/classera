import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * OAuth Callback Handler
 * Handles Google and GitHub OAuth callbacks
 * Creates profile if needed and redirects to appropriate dashboard
 */

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') || 'student';

  // Validate role
  if (role !== 'student' && role !== 'mentor') {
    console.error('Invalid role:', role);
    return NextResponse.redirect(`${origin}/signin?error=invalid_role`);
  }

  if (!code) {
    console.error('No authorization code provided');
    return NextResponse.redirect(`${origin}/signin?error=no_code`);
  }

  try {
    const supabase = await createClient();
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Failed to exchange code for session:', error);
      return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
    }

    if (!data.user) {
      console.error('No user data after session exchange');
      return NextResponse.redirect(`${origin}/signin?error=no_user`);
    }

    console.log('✅ OAuth session created for user:', data.user.id);

    // Check if profile exists with retry logic
    const profile = await retryWithBackoff(
      async () => {
        const { data: p, error: profileError } = await supabase
          .from('users')
          .select('id, full_name, university_id, role')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (expected for new users)
          throw profileError;
        }

        return p;
      },
      3,
      500
    );

    // If no profile exists, create one
    if (!profile) {
      console.log('No profile found, creating new profile...');

      const profileData = {
        user_id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || 
                   data.user.user_metadata?.name || 
                   data.user.email?.split('@')[0] || 
                   'User',
        role: role as 'student' | 'mentor',
      };

      const response = await fetch(`${origin}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create profile in callback:', errorData);
        
        // Still redirect to onboarding - user can complete profile there
        return NextResponse.redirect(`${origin}/onboarding/${role}?error=profile_creation_failed`);
      }

      console.log('✅ Profile created successfully');
      
      // New user - always go to onboarding
      return NextResponse.redirect(`${origin}/onboarding/${role}`);
    }

    // Profile exists - check completeness
    const isComplete = profile.full_name && 
                      profile.full_name.trim() !== '' && 
                      profile.university_id;

    if (!isComplete) {
      console.log('Profile incomplete, redirecting to onboarding');
      return NextResponse.redirect(`${origin}/onboarding/${role}`);
    }

    // Verify role matches
    if (profile.role !== role) {
      console.warn(`Role mismatch: profile role is ${profile.role}, requested role is ${role}`);
      // Redirect to the correct dashboard based on profile role
      return NextResponse.redirect(`${origin}/dashboard/${profile.role}`);
    }

    console.log('✅ Profile complete, redirecting to dashboard');
    return NextResponse.redirect(`${origin}/dashboard/${role}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${origin}/signin?error=callback_failed`);
  }
}
