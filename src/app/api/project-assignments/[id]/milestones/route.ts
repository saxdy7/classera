import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/project-assignments/[id]/milestones - list checkpoint tasks for this assignment
 * POST /api/project-assignments/[id]/milestones - mentor creates a checkpoint
 *
 * A "milestone" is just a tasks row per assigned student (tasks.assignment_id
 * links back here) - each student gets their own checkable copy, which the
 * existing personal Task Board already renders with zero changes needed there.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assignmentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: tasks } = await admin
      .from('tasks')
      .select('id, title, description, status, due_date, student_id')
      .eq('assignment_id', assignmentId)
      .order('due_date', { ascending: true });

    // Group by title+due_date so the mentor sees one milestone with a completion count,
    // not one row per student.
    const grouped = new Map<string, { title: string; description: string | null; due_date: string | null; total: number; completed: number }>();
    for (const t of tasks ?? []) {
      const key = `${t.title}__${t.due_date ?? ''}`;
      const g = grouped.get(key) ?? { title: t.title, description: t.description, due_date: t.due_date, total: 0, completed: 0 };
      g.total += 1;
      if (t.status === 'completed') g.completed += 1;
      grouped.set(key, g);
    }

    return NextResponse.json({ milestones: Array.from(grouped.values()) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch milestones' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assignmentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: assignment } = await admin
      .from('project_assignments')
      .select('id, mentor_id')
      .eq('id', assignmentId)
      .eq('mentor_id', user.id)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const title: string = (body.title ?? '').trim();
    const description: string | null = body.description?.trim() || null;
    const due_date: string | null = body.due_date || null;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const { data: roster } = await admin
      .from('assignment_students')
      .select('student_id')
      .eq('assignment_id', assignmentId);

    if (!roster || roster.length === 0) {
      return NextResponse.json({ error: 'No students assigned yet' }, { status: 400 });
    }

    const rows = roster.map((r) => ({
      student_id: r.student_id,
      mentor_id: user.id,
      assignment_id: assignmentId,
      title,
      description,
      status: 'pending' as const,
      priority: 'medium' as const,
      due_date,
    }));

    const { error } = await admin.from('tasks').insert(rows);
    if (error) throw error;

    const notifications = roster.map((r) => ({
      user_id: r.student_id,
      type: 'project_milestone_added',
      title: 'New Checkpoint',
      message: `A new checkpoint "${title}" was added to your project.`,
      related_id: assignmentId,
      related_type: 'project_assignment',
      action_url: `/dashboard/student/projects/${assignmentId}`,
      metadata: { assignment_id: assignmentId },
      is_read: false,
    }));
    await admin.from('notifications').insert(notifications);

    return NextResponse.json({ success: true, students_notified: roster.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create milestone' }, { status: 500 });
  }
}
