import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * User Profile Creation API
 * Uses admin client to bypass RLS
 * Includes retry logic with exponential backoff for auth user verification
 */

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 500
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return retryWithBackoff(fn, retries - 1, delayMs * 2);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, email, full_name, role } = body;

        // Validate required fields
        if (!user_id || !email || !full_name || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, email, full_name, and role are required' },
                { status: 400 }
            );
        }

        // Validate role
        if (role !== 'student' && role !== 'mentor') {
            return NextResponse.json(
                { error: 'Invalid role. Must be "student" or "mentor"' },
                { status: 400 }
            );
        }

        // Use admin client to bypass RLS
        const supabaseAdmin = createAdminClient();

        // Check if profile already exists first (faster than checking auth)
        const { data: existingProfile } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', user_id)
            .single();

        if (existingProfile) {
            return NextResponse.json({
                success: true,
                message: 'Profile already exists',
            });
        }

        // Verify the auth user exists with retry logic
        let authUser;
        try {
            const result = await retryWithBackoff(
                async () => {
                    const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);
                    if (error || !data) {
                        throw new Error('Auth user not found');
                    }
                    return data;
                },
                5, // 5 retries
                500 // Start with 500ms, doubles each time
            );
            authUser = result;
        } catch (authCheckError) {
            console.error('Auth user not found after retries:', authCheckError);
            return NextResponse.json(
                {
                    error: 'User not found in authentication system. Please try again or contact support.',
                    code: 'AUTH_USER_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Generate avatar URL using proper MD5 hash for Gravatar
        const avatarHash = createHash('md5').update(email.toLowerCase().trim()).digest('hex');
        const avatarUrl = `https://www.gravatar.com/avatar/${avatarHash}?d=identicon`;

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: user_id,
                email,
                full_name,
                role,
                avatar_url: avatarUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            // Handle duplicate key errors gracefully
            if (profileError.code === '23505' || profileError.message.includes('duplicate key')) {
                return NextResponse.json({
                    success: true,
                    message: 'Profile already exists',
                });
            }

            console.error('Profile creation error:', profileError);
            return NextResponse.json(
                {
                    error: 'Failed to create user profile: ' + profileError.message,
                    code: 'PROFILE_CREATION_FAILED'
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Profile created successfully',
        });

    } catch (error: any) {
        // Catch any duplicate key errors at the catch level too
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
            return NextResponse.json({
                success: true,
                message: 'Profile already exists',
            });
        }

        console.error('Unexpected profile creation error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to create profile',
                code: 'UNEXPECTED_ERROR'
            },
            { status: 500 }
        );
    }
}
