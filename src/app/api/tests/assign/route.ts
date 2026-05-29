import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// POST - Assign test to students
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // Verify mentor role via admin client (avoids RLS recursion on users table)
        const { data: profile } = await admin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'mentor') {
            return NextResponse.json({ error: 'Only mentors can assign tests' }, { status: 403 });
        }

        const body = await request.json();
        const { test_id, student_ids, community_id, send_notification } = body;

        if (!test_id) {
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        // Verify test belongs to this mentor
        const { data: test } = await admin
            .from('tests')
            .select('id, title, mentor_id')
            .eq('id', test_id)
            .eq('mentor_id', user.id)
            .single();

        if (!test) {
            return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });
        }

        let studentsToAssign: string[] = [];

        // If community_id provided, get all members via admin (bypasses RLS on community_members)
        // Real schema from CREATE_COMMUNITIES.sql: student_id (not user_id)
        if (community_id) {
            const { data: members } = await admin
                .from('community_members')
                .select('student_id')
                .eq('community_id', community_id)
                .neq('student_id', user.id); // Exclude mentor

            studentsToAssign = members?.map((m: any) => m.student_id) || [];
        }

        // Add individual students
        if (student_ids && Array.isArray(student_ids)) {
            studentsToAssign = [...new Set([...studentsToAssign, ...student_ids])];
        }

        if (studentsToAssign.length === 0) {
            return NextResponse.json({ error: 'No students to assign' }, { status: 400 });
        }

        // Create invitations (upsert to avoid duplicates) via admin client
        const invitations = studentsToAssign.map(student_id => ({
            test_id,
            student_id,
            status: 'pending',
            invited_at: new Date().toISOString(),
            invited_by: user.id
        }));

        let { data: created, error } = await admin
            .from('test_invitations')
            .upsert(invitations, {
                onConflict: 'test_id,student_id',
                ignoreDuplicates: true
            })
            .select();

        // If the column set is missing something, try a stripped payload
        if (error) {
            console.error('Error creating invitations (attempt 1):', error.message);
            // Retry — sometimes the schema cache needs a moment
            const retried = await admin
                .from('test_invitations')
                .upsert(invitations, {
                    onConflict: 'test_id,student_id',
                    ignoreDuplicates: true
                })
                .select();
            if (retried.error) {
                console.error('Error creating invitations (attempt 2):', retried.error);
                return NextResponse.json({ error: retried.error.message }, { status: 400 });
            }
            created = retried.data;
        }

        // Create notifications for students via admin client
        if (send_notification !== false) {
            const notifications = studentsToAssign.map(student_id => ({
                user_id: student_id,
                type: 'test_assigned',
                title: 'New Test Assigned',
                message: `You have been assigned to take: ${test.title}`,
                related_id: test_id,
                related_type: 'test',
                action_url: `/dashboard/student/tests/${test_id}`,
                metadata: { test_id, test_title: test.title, duration: body.duration_minutes },
                read: false
            }));

            await admin.from('notifications').insert(notifications);
        }

        // Update test to go live if needed
        const { data: updatedTest, error: updateError } = await admin
            .from('tests')
            .update({ is_live: true, scheduled_at: new Date().toISOString() })
            .eq('id', test_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating test to live:', updateError);
        }

        return NextResponse.json({
            success: true,
            assigned_count: studentsToAssign.length,
            message: `Test assigned to ${studentsToAssign.length} students`
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error assigning test:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET - Get students assigned to a test
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const testId = searchParams.get('test_id');

        if (!testId) {
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        const admin = createAdminClient();

        // Fetch invitations without FK hints to avoid schema cache issues
        const { data: invitations, error } = await admin
            .from('test_invitations')
            .select(`
        *,
        student:users!test_invitations_student_id_fkey(id, full_name, email, avatar_url)
      `)
            .eq('test_id', testId);

        if (error) throw error;

        // Calculate stats
        const stats = {
            total: invitations?.length || 0,
            pending: invitations?.filter(i => i.status === 'pending').length || 0,
            in_progress: invitations?.filter(i => i.status === 'in_progress').length || 0,
            completed: invitations?.filter(i => i.status === 'completed').length || 0
        };

        return NextResponse.json({ invitations, stats });
    } catch (error: any) {
        console.error('Error fetching invitations:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
