import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { getRemainingSeconds } from '@/lib/test-security';

/**
 * GET /api/tests/[id]/monitor
 * Mentor-only live view of active test-taking sessions (the real anti-cheat data
 * produced by the take-secure flow), with violation breakdowns and submission state.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: testId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify the requester owns this test
    const { data: test } = await admin
      .from('tests')
      .select('id, mentor_id, title, duration_minutes')
      .eq('id', testId)
      .single();

    if (!test || test.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Live sessions + submissions
    const [{ data: sessions }, { data: submissions }] = await Promise.all([
      admin
        .from('test_sessions')
        .select('*')
        .eq('test_id', testId)
        .order('started_at', { ascending: false }),
      admin
        .from('test_submissions')
        .select('student_id, submitted_at, percentage, is_disqualified')
        .eq('test_id', testId),
    ]);

    const submittedBy = new Map(
      (submissions || []).map((s: any) => [s.student_id, s])
    );

    // Resolve student names in one query
    const studentIds = [...new Set((sessions || []).map((s: any) => s.student_id))];
    const { data: students } = studentIds.length
      ? await admin.from('users').select('id, full_name, avatar_url, email').in('id', studentIds)
      : { data: [] as any[] };
    const studentMap = new Map((students || []).map((u: any) => [u.id, u]));

    const now = Date.now();
    const rows = (sessions || []).map((s: any) => {
      const expiresAt = s.expires_at ? new Date(s.expires_at) : null;
      const sub = submittedBy.get(s.student_id);
      const isExpired = expiresAt ? expiresAt.getTime() < now : false;
      let state: 'active' | 'submitted' | 'expired' | 'flagged' = 'active';
      if (sub?.submitted_at || s.is_submitted) state = 'submitted';
      else if (!s.is_active || isExpired) state = 'expired';
      if (s.is_flagged && state === 'active') state = 'flagged';

      return {
        id: s.id,
        student: studentMap.get(s.student_id) || { id: s.student_id, full_name: 'Unknown', avatar_url: null },
        started_at: s.started_at,
        time_remaining_seconds: expiresAt && !isExpired ? getRemainingSeconds(expiresAt) : 0,
        state,
        is_flagged: !!s.is_flagged,
        flag_reason: s.flag_reason || null,
        total_violations: s.total_violations || 0,
        violations: {
          tab_switches: s.tab_switches_count || 0,
          fullscreen_exits: s.fullscreen_exits_count || 0,
          copy_paste: s.copy_paste_attempts_count || 0,
          face_failures: s.face_detection_failures_count || 0,
          screen_share_stops: s.screen_share_stopped_count || 0,
          suspicious: s.suspicious_activity_count || 0,
        },
        submission: sub ? { percentage: sub.percentage, is_disqualified: sub.is_disqualified } : null,
      };
    });

    const summary = {
      active: rows.filter((r) => r.state === 'active' || r.state === 'flagged').length,
      submitted: rows.filter((r) => r.state === 'submitted').length,
      flagged: rows.filter((r) => r.is_flagged).length,
      total_violations: rows.reduce((sum, r) => sum + r.total_violations, 0),
    };

    return NextResponse.json({ test: { id: test.id, title: test.title }, sessions: rows, summary });
  } catch (error: any) {
    console.error('Error fetching monitor data:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
