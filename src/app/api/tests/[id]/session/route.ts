import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import {
  generateTestSessionToken,
  generateBrowserFingerprint,
  calculateSessionExpiry,
  getClientIP,
  getUserAgent,
  validateTestSessionToken,
  getRemainingSeconds,
} from '@/lib/test-security';

/**
 * POST /api/tests/[id]/session
 * Creates a secure session for taking a test
 * Returns session token, test details, and security configuration
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: testId } = await params;

    // Verify test exists and is live
    const { data: test, error: testError } = await admin
      .from('tests')
      .select('id, title, description, duration_minutes, total_marks, questions, is_live, mentor_id')
      .eq('id', testId)
      .single();

    if (testError || !test) {
      console.error('Test fetch error:', testError?.message, 'testId:', testId);
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (!test.is_live) {
      return NextResponse.json({ error: 'Test is not live yet' }, { status: 403 });
    }

    // Verify student is invited to test
    const { data: invitation, error: invError } = await admin
      .from('test_invitations')
      .select('id, status')
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .single();

    if (invError || !invitation) {
      return NextResponse.json({ error: 'You have not been invited to this test' }, { status: 403 });
    }

    if (invitation.status === 'declined') {
      return NextResponse.json({ error: 'You have declined this test' }, { status: 403 });
    }

    // Check if already submitted
    const { data: existingSubmission } = await admin
      .from('test_submissions')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .single();

    if (existingSubmission) {
      return NextResponse.json({ error: 'You have already submitted this test' }, { status: 403 });
    }

    // Check for active session (only one session per test per student at a time)
    const { data: activeSession } = await admin
      .from('test_sessions')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .eq('is_active', true)
      .single();

    if (activeSession) {
      return NextResponse.json({ error: 'You already have an active session for this test' }, { status: 409 });
    }

    // Collect security info
    const rawIP = getClientIP(request);
    const ipAddress = rawIP && rawIP !== 'unknown' ? rawIP : null;
    const userAgent = getUserAgent(request);
    const browserFingerprint = generateBrowserFingerprint(userAgent);
    const sessionToken = generateTestSessionToken();
    const expiresAt = calculateSessionExpiry(test.duration_minutes);

    // Create secure session
    const { data: session, error: sessionError } = await admin
      .from('test_sessions')
      .insert({
        test_id: testId,
        student_id: user.id,
        session_token: sessionToken,
        browser_fingerprint: browserFingerprint,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Log session start event
    await admin.from('test_audit_log').insert({
      session_id: session.id,
      test_id: testId,
      student_id: user.id,
      event_type: 'session_start',
      severity: 'info',
      event_details: {
        ip_address: ipAddress,
        browser_fingerprint: browserFingerprint,
      },
    });

    // Update invitation status
    await admin
      .from('test_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    const timeRemaining = getRemainingSeconds(expiresAt);

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.id,
        sessionToken, // Send to client for verification
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          durationMinutes: test.duration_minutes,
          totalMarks: test.total_marks,
          questions: test.questions,
        },
        security: {
          expiresAt: expiresAt.toISOString(),
          timeRemainingSeconds: timeRemaining,
          screenRecordingEnabled: false,
          faceMonitoringEnabled: false,
          antiCheatEnabled: true,
          verificationRequired: true,
        },
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating test session:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/tests/[id]/session
 * Validates and retrieves active session info
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: testId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('token');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 400 });
    }

    // Validate token format
    if (!validateTestSessionToken(sessionToken)) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    // Fetch session
    const { data: session, error: sessionError } = await admin
      .from('test_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is active
    if (!session.is_active) {
      return NextResponse.json({ error: 'Session is no longer active' }, { status: 403 });
    }

    // Check if expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // Deactivate expired session
      await admin
        .from('test_sessions')
        .update({ is_active: false, was_interrupted: true })
        .eq('id', session.id);

      return NextResponse.json({ error: 'Session has expired' }, { status: 403 });
    }

    const timeRemaining = getRemainingSeconds(expiresAt);

    return NextResponse.json({
      valid: true,
      session: {
        sessionId: session.id,
        test_id: session.test_id,
        student_id: session.student_id,
        violationsCount: session.total_violations,
        timeRemainingSeconds: timeRemaining,
        isActive: session.is_active,
        isSubmitted: session.is_submitted,
        violationBreakdown: {
          tabSwitches: session.tab_switches_count,
          fullscreenExits: session.fullscreen_exits_count,
          faceDetectionFailures: session.face_detection_failures_count,
          copyPasteAttempts: session.copy_paste_attempts_count,
          screenShareStops: session.screen_share_stopped_count,
          suspiciousActivity: session.suspicious_activity_count,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
