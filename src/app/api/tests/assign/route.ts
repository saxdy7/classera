import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Assign test to students
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify mentor role
        const { data: profile } = await supabase
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
        const { data: test } = await supabase
            .from('tests')
            .select('id, title, mentor_id')
            .eq('id', test_id)
            .eq('mentor_id', user.id)
            .single();

        if (!test) {
            return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });
        }

        let studentsToAssign: string[] = [];

        // If community_id provided, get all members
        if (community_id) {
            const { data: members } = await supabase
                .from('community_members')
                .select('user_id')
                .eq('community_id', community_id)
                .neq('user_id', user.id); // Exclude mentor

            studentsToAssign = members?.map(m => m.user_id) || [];
        }

        // Add individual students
        if (student_ids && Array.isArray(student_ids)) {
            studentsToAssign = [...new Set([...studentsToAssign, ...student_ids])];
        }

        if (studentsToAssign.length === 0) {
            return NextResponse.json({ error: 'No students to assign' }, { status: 400 });
        }

        // Create invitations (upsert to avoid duplicates)
        const invitations = studentsToAssign.map(student_id => ({
            test_id,
            student_id,
            invited_by: user.id,
            status: 'pending',
            invited_at: new Date().toISOString()
        }));

        const { data: created, error } = await supabase
            .from('test_invitations')
            .upsert(invitations, {
                onConflict: 'test_id,student_id',
                ignoreDuplicates: true
            })
            .select();

        if (error) {
            console.error('Error creating invitations:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Create notifications for students
        if (send_notification !== false) {
            const notifications = studentsToAssign.map(student_id => ({
                user_id: student_id,
                type: 'test_assigned',
                title: 'New Test Assigned',
                message: `You have been assigned to take: ${test.title}`,
                data: { test_id, test_title: test.title },
                is_read: false
            }));

            await supabase.from('notifications').insert(notifications);
        }

        // Update test to go live if needed
        await supabase
            .from('tests')
            .update({ is_live: true })
            .eq('id', test_id);

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

        const { data: invitations, error } = await supabase
            .from('test_invitations')
            .select(`
        *,
        student:users!test_invitations_student_id_fkey(id, full_name, email, avatar_url),
        submission:test_submissions!test_submissions_test_id_fkey(id, score, submitted_at)
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
