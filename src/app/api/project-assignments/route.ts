import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/project-assignments  — list assignments visible to the current user
// POST /api/project-assignments — create a new assignment (mentor only)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (profile.role === 'mentor') {
      // Mentor sees all their own assignments with submission counts
      const { data: assignments } = await admin
        .from('project_assignments')
        .select(`
          *,
          assignment_students(count),
          assignment_submissions(count)
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      return NextResponse.json({ assignments: assignments ?? [] });
    } else {
      // Student sees assignments they are assigned to
      const { data: assignedRows } = await admin
        .from('assignment_students')
        .select(`
          assignment_id,
          assignment:project_assignments(
            *,
            mentor:users!project_assignments_mentor_id_fkey(id, full_name, avatar_url)
          )
        `)
        .eq('student_id', user.id);

      const assignments = (assignedRows ?? []).map((r) => r.assignment).filter(Boolean);

      // Attach student's own submission status if any
      const assignmentIds = assignments.map((a) => (a as unknown as { id: string }).id);
      const { data: submissions } = await admin
        .from('assignment_submissions')
        .select('assignment_id, status, submitted_at, id')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds);

      const submissionMap = Object.fromEntries(
        (submissions ?? []).map((s) => [s.assignment_id, s]),
      );

      const result = assignments.map((a) => ({
        ...(a as object),
        my_submission: submissionMap[(a as unknown as { id: string }).id] ?? null,
      }));

      return NextResponse.json({ assignments: result });
    }
  } catch (err) {
    console.error('Project assignments GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can create assignments' }, { status: 403 });
    }

    const body = await request.json() as {
      title: string;
      description?: string;
      requirements?: string;
      technologies?: string[];
      deadline?: string;
      max_score?: number;
      student_ids?: string[];
    };

    const { title, description, requirements, technologies, deadline, max_score, student_ids } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create assignment
    const { data: assignment, error: assignErr } = await admin
      .from('project_assignments')
      .insert({
        mentor_id: user.id,
        university_id: profile.university_id,
        title: title.trim(),
        description,
        requirements,
        technologies: technologies ?? [],
        deadline: deadline ?? null,
        max_score: max_score ?? 100,
      })
      .select()
      .single();

    if (assignErr) throw assignErr;

    // Assign to students if provided
    if (student_ids && student_ids.length > 0) {
      const rows = student_ids.map((sid) => ({
        assignment_id: assignment.id,
        student_id: sid,
      }));
      await admin.from('assignment_students').insert(rows);
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error('Project assignments POST error:', err);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
