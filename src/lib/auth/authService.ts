/**
 * Centralized Authentication Service
 * Handles all auth operations: signin, signup, OAuth, profile creation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  AuthResult,
  CreateProfileRequest,
  CreateProfileResponse,
  OAuthProvider,
  SignInFormData,
  SignUpFormData,
  UserRole,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROFILE_CREATION_DELAY = 2500; // Wait time after auth user creation
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Wait for specified milliseconds
 */
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate Gravatar URL for email
 */
const getGravatarUrl = (email: string): string => {
  const hash = Buffer.from(email.toLowerCase()).toString('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await delay(delayMs);
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}

// ============================================================================
// PROFILE CREATION
// ============================================================================

/**
 * Create user profile via API (uses admin client to bypass RLS)
 */
export async function createProfile(
  data: CreateProfileRequest
): Promise<CreateProfileResponse> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok && !result.error?.includes('already exists')) {
      throw new Error(result.error || 'Failed to create profile');
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Profile creation failed:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Check if user profile is complete
 */
export async function isProfileComplete(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('full_name, university_id')
      .eq('id', userId)
      .single();

    if (error || !profile) return false;

    return Boolean(
      profile.full_name && 
      profile.full_name.trim() !== '' && 
      profile.university_id
    );
  } catch {
    return false;
  }
}

// ============================================================================
// EMAIL/PASSWORD AUTHENTICATION
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  supabase: SupabaseClient,
  formData: SignInFormData,
  role: UserRole
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    // Check profile completeness
    const isComplete = await isProfileComplete(supabase, data.user.id);
    
    return {
      success: true,
      redirectTo: isComplete 
        ? `/dashboard/${role}` 
        : `/onboarding/${role}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  supabase: SupabaseClient,
  formData: SignUpFormData,
  role: UserRole
): Promise<AuthResult> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Wait for auth user to propagate
    await delay(PROFILE_CREATION_DELAY);

    // Create profile with retry logic
    const profileResult = await retryWithBackoff(
      () => createProfile({
        user_id: authData.user!.id,
        email: formData.email,
        full_name: formData.name,
        role,
      }),
      MAX_RETRIES,
      RETRY_DELAY
    );

    if (!profileResult.success) {
      console.error('❌ Profile creation failed:', profileResult.error);
      // Still redirect to onboarding - they can complete profile there
    } else {
      console.log('✅ Profile created successfully');
    }

    // Always redirect to onboarding after successful signup
    // Note: If email confirmation is enabled in Supabase, user will need to verify first
    return {
      success: true,
      redirectTo: `/onboarding/${role}`,
      needsEmailConfirmation: !authData.session,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed';
    return {
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// OAUTH AUTHENTICATION
// ============================================================================

/**
 * Sign in with OAuth provider (Google, GitHub)
 */
export async function signInWithOAuth(
  supabase: SupabaseClient,
  provider: OAuthProvider,
  role: UserRole
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: `Failed to authenticate with ${provider}`,
      };
    }

    // OAuth redirect happens automatically, no need to return redirectTo
    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth failed';
    return {
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Sign out current user
 */
export async function signOut(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Refresh current session
 */
export async function refreshSession(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.refreshSession();
}

/**
 * Get current user session
 */
export async function getCurrentUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
