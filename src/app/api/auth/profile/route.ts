import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            full_name,
            university_id,
            expertise,
            years_of_experience,
            linkedin_url,
            github_url,
            bio,
            specialization_board,
            current_semester,
            interests
        } = body;

        // Use admin client to bypass RLS
        const supabaseAdmin = createAdminClient();

        // Update profile
        const updateData: any = {
            full_name,
            university_id: university_id || null,
        };

        // Add mentor-specific fields
        if (expertise !== undefined) updateData.expertise = expertise;
        if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience;
        if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
        if (github_url !== undefined) updateData.github_url = github_url;
        if (bio !== undefined) updateData.bio = bio;

        // Add student-specific fields
        if (specialization_board !== undefined && specialization_board !== null) {
            updateData.specialization_board = specialization_board;
        }
        if (current_semester !== undefined && current_semester !== null) {
            updateData.current_semester = current_semester;
        }
        if (interests !== undefined && interests !== null) {
            updateData.interests = interests;
        }

        // Validate required fields for completion
        if (!full_name || !full_name.trim()) {
            return NextResponse.json(
                { error: 'Full name is required' },
                { status: 400 }
            );
        }

        if (!university_id) {
            return NextResponse.json(
                { error: 'University selection is required' },
                { status: 400 }
            );
        }

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', user.id);

        if (updateError) {
            console.error('Profile update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update profile: ' + updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });

    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}
