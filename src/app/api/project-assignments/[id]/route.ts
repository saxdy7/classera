import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/project-assignments/[id]  — full details with all submissions + analytics
// PATCH /api/project-assignments/[id] — update assignment (mentor only)
// DELETE /api/project-assignments/[id] — delete assignment (mentor only)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: assignment } = await admin
      .from('project_assignments')
      .select(`
        *,
        mentor:users!project_assignments_mentor_id_fkey(id, full_name, avatar_url, email)
      `)
      .eq('id', id)
      .single();

    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    // Get assigned students
    const { data: assignedStudents } = await admin
      .from('assignment_students')
      .select('student_id, assigned_at, student:users!assignment_students_student_id_fkey(id, full_name, avatar_url, email, specialization_board)')
      .eq('assignment_id', id);

    // Get all submissions with analytics and evaluations
    const { data: submissions } = await admin
      .from('assignment_submissions')
      .select(`
        *,
        student:users!assignment_submissions_student_id_fkey(id, full_name, avatar_url, email),
        analytics:repo_analytics(*),
        evaluation:project_evaluations(*)
      `)
      .eq('assignment_id', id)
      .order('submitted_at', { ascending: false });

    return NextResponse.json({
      assignment,
      assignedStudents: assignedStudents ?? [],
      submissions: submissions ?? [],
    });
  } catch (err) {
    console.error('Assignment GET [id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: assignment } = await admin
      .from('project_assignments')
      .select('mentor_id')
      .eq('id', id)
      .single();

    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (assignment.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const allowed = ['title', 'description', 'requirements', 'technologies', 'deadline', 'max_score', 'is_active'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data: updated, error } = await admin
      .from('project_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ assignment: updated });
  } catch (err) {
    console.error('Assignment PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: assignment } = await admin
      .from('project_assignments')
      .select('mentor_id')
      .eq('id', id)
      .single();

    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (assignment.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await admin.from('project_assignments').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Assignment DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
