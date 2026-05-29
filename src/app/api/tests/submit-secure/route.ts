import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import {
  validateTestSessionToken,
  validateSubmissionTiming,
  detectSuspiciousActivity,
  generateSubmissionHash,
  checkSubmissionRateLimit,
} from '@/lib/test-security';
import crypto from 'crypto';

/**
 * POST /api/tests/submit-secure
 * Enhanced secure test submission endpoint
 * Validates session, timing, integrity, and suspicious activity
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    const body = await request.json();
    const {
      testId,
      test_id,
      sessionToken,
      session_token,
      answers,
      violations,
      timeRemaining,
      time_remaining,
      screenRecordingUrl,
      screen_recording_url,
    } = body;

    const testIdValue = testId || test_id;
    const sessionTokenValue = sessionToken || session_token;
    const timeRemainingValue = timeRemaining || time_remaining;

    // Validate required fields
    if (!testIdValue || !sessionTokenValue || !answers) {
      return NextResponse.json({
        error: 'Missing required fields: testId, sessionToken, answers',
      }, { status: 400 });
    }

    // Validate session token format
    if (!validateTestSessionToken(sessionTokenValue)) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    // Fetch test session
    const { data: session, error: sessionError } = await admin
      .from('test_sessions')
      .select('*')
      .eq('session_token', sessionTokenValue)
      .eq('test_id', testIdValue)
      .eq('student_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or invalid' }, { status: 404 });
    }

    // Verify session is active
    if (!session.is_active || session.is_submitted) {
      return NextResponse.json({ error: 'Session is no longer active' }, { status: 403 });
    }

    // Check session expiry
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      await admin.from('test_sessions').update({ is_active: false }).eq('id', session.id);
      return NextResponse.json({ error: 'Session has expired' }, { status: 403 });
    }

    // Fetch test details
    const { data: test, error: testError } = await admin
      .from('tests')
      .select('*')
      .eq('id', testIdValue)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Validate submission timing
    const timingValidation = validateSubmissionTiming(
      new Date(session.started_at),
      test.duration_minutes
    );

    if (!timingValidation.isValid) {
      return NextResponse.json({
        error: timingValidation.reason || 'Submission time exceeded',
      }, { status: 400 });
    }

    // Detect suspicious activity
    const suspiciousCheck = detectSuspiciousActivity({
      tabSwitches: session.tab_switches_count,
      fullscreenExits: session.fullscreen_exits_count,
      copyPasteAttempts: session.copy_paste_attempts_count,
      faceDetectionFailures: session.face_detection_failures_count,
      screenShareStops: session.screen_share_stopped_count,
      suspiciousEvents: session.suspicious_activity_count,
    });

    // Verify student hasn't already submitted
    const { data: existingSubmission } = await admin
      .from('test_submissions')
      .select('id')
      .eq('test_id', testIdValue)
      .eq('student_id', user.id)
      .single();

    if (existingSubmission) {
      return NextResponse.json({ error: 'You have already submitted this test' }, { status: 409 });
    }

    // Calculate score for MCQ questions
    let score = 0;
    const maxScore = test.total_marks || 0;

    interface TestQuestion {
      id: string;
      question: string;
      type: string;
      options?: string[];
      correctAnswer?: string | string[];
      marks?: number;
    }

    const questions = (test.questions as TestQuestion[]) || [];

    questions.forEach((question: any, index: number) => {
      const questionId = question.id || `q_${index}`;
      const studentAnswer = answers[questionId];

      if (question.type === 'mcq' && studentAnswer) {
        const correctAnswerValue = question.correctAnswer ?? question.correct_answer;
        let isCorrect = false;

        if (typeof correctAnswerValue === 'number' && question.options) {
          const correctOption = question.options[correctAnswerValue];
          isCorrect = studentAnswer === correctOption;
        } else {
          isCorrect = studentAnswer === correctAnswerValue;
        }

        if (isCorrect) {
          score += question.marks || 1;
        }
      }
    });

    const percentage = (score / maxScore) * 100;

    // Generate submission hash for integrity
    const submissionHash = generateSubmissionHash(answers, testIdValue, user.id);

    // Prepare submission data
    const submissionData = {
      test_id: testIdValue,
      student_id: user.id,
      session_id: session.id,
      answers,
      score,
      max_score: maxScore,
      percentage,
      submission_hash: submissionHash,
      activity_log: {
        violations: violations || [],
        time_taken_minutes: timingValidation.timeTakenMinutes,
        suspicious_activity_detected: suspiciousCheck.isSuspicious,
        risk_score: suspiciousCheck.riskScore,
        risk_reasons: suspiciousCheck.reasons,
      },
      submitted_at: new Date().toISOString(),
      warnings_count: session.total_violations,
      is_disqualified: session.is_flagged || suspiciousCheck.riskScore > 80,
      student_device_info: {
        browser_fingerprint: session.browser_fingerprint,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
      },
      ...(screenRecordingUrl || screen_recording_url) && {
        screen_recording_url: screenRecordingUrl || screen_recording_url,
      },
    };

    // Create submission
    const { data: submission, error: submissionError } = await admin
      .from('test_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      console.error('Submission creation error:', submissionError);
      return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
    }

    // Create integrity record
    await admin.from('test_submission_integrity').insert({
      submission_id: submission.id,
      session_id: session.id,
      submission_hash: submissionHash,
      integrity_verified: true,
    });

    // Mark session as submitted
    await admin
      .from('test_sessions')
      .update({
        is_submitted: true,
        is_active: false,
        submission_id: submission.id,
        ended_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    // Log submission event
    await admin.from('test_audit_log').insert({
      session_id: session.id,
      test_id: testIdValue,
      student_id: user.id,
      event_type: 'submission',
      severity: suspiciousCheck.isSuspicious ? 'warning' : 'info',
      event_details: {
        score,
        percentage,
        risk_score: suspiciousCheck.riskScore,
        is_disqualified: submissionData.is_disqualified,
      },
    });

    // Trigger AI evaluation in background
    fetch(`${request.url.split('/api')[0]}/api/tests/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submission.id,
        test_id: testIdValue,
        answers,
        questions: test.questions,
      }),
    }).catch(err => console.error('AI evaluation error:', err));

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        score,
        percentage: percentage.toFixed(2),
        maxScore,
        is_disqualified: submissionData.is_disqualified,
        evaluating: true,
        securityAnalysis: {
          risksDetected: suspiciousCheck.isSuspicious,
          riskScore: suspiciousCheck.riskScore,
          flagged: session.is_flagged || false,
        },
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting test:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
