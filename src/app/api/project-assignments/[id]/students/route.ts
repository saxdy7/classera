import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// POST /api/project-assignments/[id]/students - add students to an existing assignment
// Mirrors the roster pattern in /api/tests/assign: upsert with ignoreDuplicates
// so re-adding an already-rostered student is a no-op, then notify the new ones.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assignmentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: assignment, error: assignmentError } = await admin
      .from('project_assignments')
      .select('id, title, mentor_id')
      .eq('id', assignmentId)
      .eq('mentor_id', user.id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const studentIds: string[] = Array.isArray(body.student_ids) ? body.student_ids : [];
    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'student_ids required' }, { status: 400 });
    }

    const rows = studentIds.map((student_id) => ({
      assignment_id: assignmentId,
      student_id,
      assigned_at: new Date().toISOString(),
    }));

    const { data: added, error } = await admin
      .from('assignment_students')
      .upsert(rows, { onConflict: 'assignment_id,student_id', ignoreDuplicates: true })
      .select('student_id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const addedIds = new Set((added ?? []).map((r) => r.student_id));
    if (addedIds.size > 0) {
      const notifications = studentIds
        .filter((id) => addedIds.has(id))
        .map((student_id) => ({
          user_id: student_id,
          type: 'project_assigned',
          title: 'New Project Assigned',
          message: `You've been added to the project "${assignment.title}".`,
          related_id: assignmentId,
          related_type: 'project_assignment',
          action_url: `/dashboard/student/projects/${assignmentId}`,
          metadata: { assignment_id: assignmentId, assignment_title: assignment.title },
          is_read: false,
        }));
      await admin.from('notifications').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      added_count: addedIds.size,
      already_assigned_count: studentIds.length - addedIds.size,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
