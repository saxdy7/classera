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
            university_name,   // ← New: name from external API when no DB id exists
            expertise,
            years_of_experience,
            linkedin_url,
            github_url,
            bio,
            specialization_board,
            current_semester,
            interests
        } = body;

        // Validate required fields
        if (!full_name || !full_name.trim()) {
            return NextResponse.json(
                { error: 'Full name is required' },
                { status: 400 }
            );
        }

        if (!university_id && !university_name) {
            return NextResponse.json(
                { error: 'University selection is required' },
                { status: 400 }
            );
        }

        // Use admin client to bypass RLS
        const supabaseAdmin = createAdminClient();

        // Resolve university_id — auto-create if only a name was provided
        let resolvedUniversityId = university_id || null;

        if (!resolvedUniversityId && university_name) {
            // Try to find existing university by name (case-insensitive)
            const { data: existingUni } = await supabaseAdmin
                .from('universities')
                .select('id')
                .ilike('name', university_name.trim())
                .limit(1)
                .single();

            if (existingUni) {
                resolvedUniversityId = existingUni.id;
            } else {
                // Create the university in the DB so it gets a real ID
                // Generate a placeholder domain from the university name (satisfies NOT NULL)
                const placeholderDomain = university_name.trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '-')
                    .slice(0, 50) + '.edu.in';

                const { data: newUni, error: uniError } = await supabaseAdmin
                    .from('universities')
                    .insert({
                        name: university_name.trim(),
                        country: 'India',
                        domain: placeholderDomain,
                    })
                    .select('id')
                    .single();

                if (uniError) {
                    console.error('Failed to create university:', uniError);
                    return NextResponse.json(
                        { error: 'Failed to register university: ' + uniError.message },
                        { status: 500 }
                    );
                }

                resolvedUniversityId = newUni.id;
            }
        }

        // Build update payload
        const updateData: any = {
            full_name: full_name.trim(),
            university_id: resolvedUniversityId,
        };

        // Mentor-specific fields
        if (expertise !== undefined) updateData.expertise = expertise;
        if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience;
        if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
        if (github_url !== undefined) updateData.github_url = github_url;
        if (bio !== undefined) updateData.bio = bio;

        // Student-specific fields
        if (specialization_board !== undefined && specialization_board !== null) {
            updateData.specialization_board = specialization_board;
        }
        if (current_semester !== undefined && current_semester !== null) {
            updateData.current_semester = current_semester;
        }
        if (interests !== undefined && interests !== null) {
            updateData.interests = interests;
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

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}
