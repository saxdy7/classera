import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { detectSuspiciousActivity } from '@/lib/test-security';

const VIOLATION_TYPES = [
  'tab_switch',
  'fullscreen_exit',
  'face_not_detected',
  'multiple_faces',
  'screen_share_stopped',
  'suspicious_activity',
  'copy_paste_attempt',
];

const SEVERITY_MAP: Record<string, string> = {
  tab_switch: 'warning',
  fullscreen_exit: 'warning',
  face_not_detected: 'critical',
  multiple_faces: 'critical',
  screen_share_stopped: 'warning',
  suspicious_activity: 'critical',
  copy_paste_attempt: 'warning',
};

const MAX_WARNINGS = 5;

/**
 * POST /api/tests/[id]/violations
 * Log a proctoring violation for current session
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.id;
    const body = await request.json();
    const {
      violationType,
      violation_type,
      sessionId,
      session_id,
      deviceInfo,
      additionalData,
    } = body;

    const vType = violationType || violation_type;
    const sId = sessionId || session_id;

    // Validate violation type
    if (!vType || !VIOLATION_TYPES.includes(vType)) {
      return NextResponse.json({ error: 'Invalid violation type' }, { status: 400 });
    }

    if (!sId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get session
    const { data: session, error: sessionError } = await admin
      .from('test_sessions')
      .select('*')
      .eq('id', sId)
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is active
    if (!session.is_active || session.is_submitted) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 403 });
    }

    const severity = SEVERITY_MAP[vType] || 'warning';

    // Log violation
    const { data: violation, error: violationError } = await admin
      .from('test_proctoring_violations')
      .insert({
        session_id: sId,
        violation_type: vType,
        severity,
        device_info: deviceInfo || null,
        additional_data: additionalData || null,
      })
      .select()
      .single();

    if (violationError) {
      console.error('Violation insert error:', violationError);
      return NextResponse.json({ error: 'Failed to log violation' }, { status: 500 });
    }

    // Update violation counters
    const updateData: Record<string, any> = {
      total_violations: session.total_violations + 1,
    };

    // Increment specific violation counter
    switch (vType) {
      case 'tab_switch':
        updateData.tab_switches_count = (session.tab_switches_count || 0) + 1;
        break;
      case 'fullscreen_exit':
        updateData.fullscreen_exits_count = (session.fullscreen_exits_count || 0) + 1;
        break;
      case 'face_not_detected':
      case 'multiple_faces':
        updateData.face_detection_failures_count = (session.face_detection_failures_count || 0) + 1;
        break;
      case 'copy_paste_attempt':
        updateData.copy_paste_attempts_count = (session.copy_paste_attempts_count || 0) + 1;
        break;
      case 'screen_share_stopped':
        updateData.screen_share_stopped_count = (session.screen_share_stopped_count || 0) + 1;
        break;
      case 'suspicious_activity':
        updateData.suspicious_activity_count = (session.suspicious_activity_count || 0) + 1;
        break;
    }

    // Check if max violations exceeded
    if (updateData.total_violations >= MAX_WARNINGS) {
      updateData.is_flagged = true;
      updateData.flag_reason = `Maximum violations reached (${MAX_WARNINGS})`;
    }

    // Update session
    const { data: updatedSession, error: updateError } = await admin
      .from('test_sessions')
      .update(updateData)
      .eq('id', sId)
      .select()
      .single();

    if (updateError) {
      console.error('Session update error:', updateError);
    }

    // Log to audit trail
    await admin.from('test_audit_log').insert({
      session_id: sId,
      test_id: testId,
      student_id: user.id,
      event_type: 'violation',
      severity,
      event_details: {
        violation_type: vType,
        violation_count: updateData.total_violations,
        flag_reason: updateData.flag_reason,
      },
    });

    return NextResponse.json({
      success: true,
      violation: violation,
      sessionStatus: {
        violationCount: updateData.total_violations,
        maxWarnings: MAX_WARNINGS,
        isFlagged: updateData.is_flagged || false,
        flagReason: updateData.flag_reason,
        shouldAutoSubmit: updateData.total_violations >= MAX_WARNINGS,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error logging violation:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/tests/[id]/violations
 * Get violations for a test (mentor only)
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    // Verify mentor owns this test
    const { data: test, error: testError } = await admin
      .from('tests')
      .select('mentor_id')
      .eq('id', testId)
      .single();

    if (testError || !test || test.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let query = admin
      .from('test_proctoring_violations')
      .select(`
        *,
        session:test_sessions(student_id)
      `)
      .eq('test_sessions.test_id', testId);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: violations, error: violationsError } = await query.order('violation_timestamp', { ascending: false });

    if (violationsError) {
      throw violationsError;
    }

    // Group violations by session and analyze
    const violationsBySession: Record<string, any> = {};

    violations?.forEach((v: any) => {
      const sId = v.session_id;
      if (!violationsBySession[sId]) {
        violationsBySession[sId] = {
          sessionId: sId,
          studentId: v.session?.student_id,
          violations: [],
          summary: {
            total: 0,
            bySeverity: { warning: 0, critical: 0 },
            byType: {},
          },
        };
      }

      violationsBySession[sId].violations.push(v);
      violationsBySession[sId].summary.total++;
      violationsBySession[sId].summary.bySeverity[v.severity]++;
      violationsBySession[sId].summary.byType[v.violation_type] =
        (violationsBySession[sId].summary.byType[v.violation_type] || 0) + 1;
    });

    return NextResponse.json({
      violations: violations || [],
      violationsBySession: Object.values(violationsBySession),
      summary: {
        totalViolations: violations?.length || 0,
        bySeverity: {
          critical: violations?.filter((v: any) => v.severity === 'critical').length || 0,
          warning: violations?.filter((v: any) => v.severity === 'warning').length || 0,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching violations:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
