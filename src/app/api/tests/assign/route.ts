import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// POST - Assign test to students
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        console.log('📌 Assign test API called for user:', user?.id);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // Verify mentor role via admin client (avoids RLS recursion on users table)
        const { data: profile, error: profileError } = await admin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('👤 Profile lookup:', { profile, error: profileError?.message });

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Failed to verify profile: ' + profileError?.message }, { status: 500 });
        }

        if (profile?.role !== 'mentor') {
            return NextResponse.json({ error: `Only mentors can assign tests. Your role: ${profile?.role}` }, { status: 403 });
        }

        const body = await request.json();
        const { test_id, student_ids, community_id, send_notification } = body;

        console.log('📌 Request body:', { test_id, student_ids: student_ids?.length, community_id });

        if (!test_id) {
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        // Verify test belongs to this mentor
        const { data: test, error: testError } = await admin
            .from('tests')
            .select('id, title, mentor_id')
            .eq('id', test_id)
            .eq('mentor_id', user.id)
            .single();

        console.log('🧪 Test lookup:', { test: test?.id, mentor_id: test?.mentor_id, error: testError?.message });

        if (testError || !test) {
            return NextResponse.json({ error: `Test not found or unauthorized: ${testError?.message}` }, { status: 404 });
        }

        let studentsToAssign: string[] = [];

        // If community_id provided, get all members via admin (bypasses RLS on community_members)
        if (community_id) {
            const { data: members, error: membersError } = await admin
                .from('community_members')
                .select('student_id')
                .eq('community_id', community_id)
                .neq('student_id', user.id);

            console.log('👥 Community members:', { count: members?.length, error: membersError?.message });

            studentsToAssign = members?.map((m: any) => m.student_id) || [];
        }

        // Add individual students
        if (student_ids && Array.isArray(student_ids)) {
            studentsToAssign = [...new Set([...studentsToAssign, ...student_ids])];
            console.log('📝 Students to assign:', studentsToAssign.length);
        }

        if (studentsToAssign.length === 0) {
            return NextResponse.json({ error: 'No students to assign' }, { status: 400 });
        }

        // Create invitations via admin client
        const invitations = studentsToAssign.map(student_id => ({
            test_id,
            student_id,
            status: 'pending',
            invited_at: new Date().toISOString(),
            invited_by: user.id
        }));

        console.log('✍️  Inserting invitations:', invitations.length);

        // Use insert instead of upsert to avoid duplicate key issues
        const { data: created, error } = await admin
            .from('test_invitations')
            .insert(invitations, { ignoreDuplicates: true })
            .select();

        if (error) {
            console.error('❌ Insert error:', error);
            return NextResponse.json({
              error: `Failed to create invitations: ${error.message}`,
              details: error
            }, { status: 400 });
        }

        console.log('✅ Invitations created:', created?.length);

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
            console.log('🔔 Notifications sent:', notifications.length);
        }

        return NextResponse.json({
            success: true,
            assigned_count: studentsToAssign.length,
            message: `Test assigned to ${studentsToAssign.length} student${studentsToAssign.length !== 1 ? 's' : ''}. Use "Go Live" to make it available to students.`
        }, { status: 201 });

    } catch (error: any) {
        console.error('❌ Error assigning test:', error);
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
