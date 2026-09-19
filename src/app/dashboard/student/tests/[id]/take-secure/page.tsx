'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Shield, Lock } from 'lucide-react';
import { AntiCheatWrapper } from '@/components/tests/AntiCheatWrapper';
import { MCQQuestion } from '@/components/tests/MCQQuestionDisplay';
import type { Question } from '@/lib/test-types';

interface SessionData {
  sessionId: string;
  sessionToken: string;
  test: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    totalMarks: number;
    questions: Question[];
  };
  security: {
    expiresAt: string;
    timeRemainingSeconds: number;
    screenRecordingEnabled: boolean;
    faceMonitoringEnabled: boolean;
    antiCheatEnabled: boolean;
    verificationRequired: boolean;
  };
}

export default function TakeTestPageSecure() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;
  const supabase = createClient();

  // Session and auth state
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [violations, setViolations] = useState<{ type: string; count: number; timestamp: string }[]>([]);
  const sessionTokenRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const handleSubmitRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Initialize session
  useEffect(() => {
    async function initializeTestSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/signin');
          return;
        }
        setUserId(user.id);

        // Request secure session
        const sessionResponse = await fetch(`/api/tests/${testId}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!sessionResponse.ok) {
          const data = await sessionResponse.json();
          setError(data.error || 'Failed to start test');
          setLoading(false);
          return;
        }

        const sessionResult = await sessionResponse.json();
        if (!sessionResult.success || !sessionResult.session) {
          setError('Failed to initialize test session');
          setLoading(false);
          return;
        }

        const { session } = sessionResult;
        setSessionData(session);
        sessionTokenRef.current = session.sessionToken;
        sessionStartTimeRef.current = Date.now();

        const expiresAt = new Date(session.security.expiresAt);
        setTimeRemaining(Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        setLoading(false);

      } catch (err) {
        console.error('Session initialization error:', err);
        setError('Failed to initialize test session');
        setLoading(false);
      }
    }

    initializeTestSession();
  }, [testId, router, supabase]);

  // Timer countdown — uses ref so the callback always calls the latest handleSubmit
  useEffect(() => {
    if (!sessionData || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData, timeRemaining]);

  // Anti-cheat violation handler
  const handleViolation = useCallback((violation: { type: string; count: number; timestamp: string }) => {
    setViolations(prev => [...prev, violation]);

    // Log violation to secure endpoint
    if (sessionTokenRef.current && sessionData) {
      fetch(`/api/tests/${testId}/violations-secure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violation_type: violation.type,
          session_id: sessionData.sessionId,
          deviceInfo: {
            timestamp: new Date().toISOString(),
          },
          additionalData: {
            violationCount: violation.count,
          },
        }),
      }).catch(console.error);
    }
  }, [testId, sessionData]);

  // Max violations handler - auto submit
  const handleMaxViolations = useCallback(() => {
    alert('Maximum violations reached. Your test will be auto-submitted.');
    handleSubmitRef.current();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !sessionData || !sessionTokenRef.current) return;
    setSubmitting(true);

    try {
      const timeTakenSeconds = Date.now() - sessionStartTimeRef.current;
      const timeTakenMinutes = timeTakenSeconds / (1000 * 60);

      const submitResponse = await fetch('/api/tests/submit-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: testId,
          session_token: sessionTokenRef.current,
          answers,
          violations: violations.length > 0 ? violations : null,
          time_remaining: timeRemaining,
          timeTakenMinutes: Math.round(timeTakenMinutes),
        }),
      });

      const data = await submitResponse.json();

      if (!submitResponse.ok) {
        console.error('Submission error:', data);
        setError(data.error || 'Failed to submit test. Please try again.');
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/student/tests/${testId}/results`);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, sessionData, testId, answers, violations, timeRemaining, router]);

  // Keep ref current so the timer always calls the latest version
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cl-canvas-soft)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--cl-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--cl-body)] mb-2">Initializing secure test session...</p>
          <p className="text-xs text-[var(--cl-muted)]">Please allow a moment for setup</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-[var(--cl-canvas-soft)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-[var(--cl-error)] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-2">Unable to Start Test</h2>
          <p className="text-[var(--cl-body)] mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/student/tests')}
            className="px-6 py-2 bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] rounded-lg font-medium hover:bg-[var(--cl-surface-inverse)]"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const test = sessionData.test;
  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;
  const isLastQuestion = currentQuestion === test.questions.length - 1;
  const antiCheatEnabled = sessionData.security.antiCheatEnabled;

  const testContent = (
    <div className="min-h-screen bg-[var(--cl-primary-soft)]">
      {/* Security Banner */}
      {antiCheatEnabled && (
        <div className="border-b-2 border-[var(--cl-warning)] px-4 py-3 bg-[rgba(171,100,0,0.12)]">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--cl-warning)]" />
              <Lock className="w-5 h-5 text-[var(--cl-warning)]" />
              <span className="font-semibold text-[var(--cl-warning)]">Secure Test Session Active</span>
            </div>
            <span className="text-sm text-[var(--cl-warning)]">
              Session Token: {sessionTokenRef.current?.substring(0, 16)}...
            </span>
            {violations.length > 0 && (
              <span className="ml-auto font-semibold text-[var(--cl-warning)] bg-[rgba(171,100,0,0.12)] px-3 py-1 rounded-full text-sm">
                Warnings: {violations.length}/5
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header with Timer */}
      <div className="bg-[rgba(255,255,255,0.8)] backdrop-blur border-b border-[var(--cl-hairline)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold text-[var(--cl-ink)] truncate">{test.title}</h1>
              <p className="text-[var(--cl-muted)] text-sm font-medium">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-semibold transition-all ${
                timeRemaining < 60
                  ? 'bg-[var(--cl-error)] text-[var(--cl-on-dark)] animate-pulse'
                  : timeRemaining < 300
                  ? 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] border-2 border-[var(--cl-warning)]'
                  : 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] border-2 border-[var(--cl-primary)]'
              }`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 md:px-6 py-2.5 text-[var(--cl-on-dark)] rounded-full font-semibold transition-all disabled:opacity-50 bg-[var(--cl-primary)]"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2.5 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full bg-[var(--cl-primary)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] overflow-hidden">
          {/* Question header band */}
          <div className="px-6 md:px-10 py-6 bg-[var(--cl-primary)]">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(255,255,255,0.2)] backdrop-blur text-[var(--cl-on-dark)] rounded-full text-xs font-semibold uppercase tracking-wide">
                {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'short_answer' ? 'Short Answer' : 'Descriptive'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(255,255,255,0.2)] backdrop-blur text-[var(--cl-on-dark)] rounded-full text-xs font-semibold">
                {question.marks} {question.marks === 1 ? 'point' : 'points'}
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-11 h-11 rounded-[var(--cl-r-xl)] bg-[var(--cl-surface-card)] text-[var(--cl-primary)] flex items-center justify-center font-semibold text-lg">
                {currentQuestion + 1}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-[var(--cl-on-dark)] leading-snug pt-1">{question.question}</h2>
            </div>
          </div>

          {/* Answer Options */}
          <div className={`p-6 md:p-10 ${question.type === 'mcq' ? '' : 'space-y-4'}`}>
            {question.type === 'mcq' ? (
              <MCQQuestion
                question={question}
                selectedAnswer={answers[question.id]}
                onSelect={(answer) => handleAnswerChange(question.id, answer)}
              />
            ) : question.type === 'short_answer' ? (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your short answer here..."
                className="w-full px-4 py-3 border-2 border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:border-[var(--cl-primary)] transition-colors"
              />
            ) : (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:border-[var(--cl-primary)] transition-colors resize-none"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-6 md:px-10 pb-6 md:pb-8 pt-2">
            <button
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-5 py-3 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] font-semibold hover:bg-[var(--cl-surface-strong)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <span className="text-sm text-[var(--cl-muted-soft)] font-semibold">
              {currentQuestion + 1} / {test.questions.length}
            </span>

            <button
              onClick={() => {
                if (isLastQuestion) {
                  handleSubmit();
                } else {
                  setCurrentQuestion((prev) => Math.min(test.questions.length - 1, prev + 1));
                }
              }}
              className="flex items-center gap-2 px-6 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold transition-all bg-[var(--cl-primary)]"
            >
              {isLastQuestion ? 'Finish' : 'Next'}
              {!isLastQuestion && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Answer Summary */}
        <div className="mt-6 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--cl-ink)]">Progress Overview</h3>
            <span className="text-sm text-[var(--cl-muted)]">
              <span className="font-semibold text-[var(--cl-primary)]">{Object.keys(answers).length}</span>/{test.questions.length} answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {test.questions.map((q: Question, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                title={`Question ${index + 1}${answers[q.id] ? ' (answered)' : ''}`}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                  index === currentQuestion
                    ? 'text-[var(--cl-on-dark)] scale-110 bg-[var(--cl-primary)]'
                    : answers[q.id]
                    ? 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] hover:bg-[var(--cl-primary)]'
                    : 'bg-[var(--cl-surface-strong)] text-[var(--cl-muted)] hover:bg-[var(--cl-surface-strong)]'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap with AntiCheatWrapper if enabled
  if (antiCheatEnabled) {
    return (
      <AntiCheatWrapper
        testId={testId}
        studentId={userId}
        sessionId={sessionData.sessionId}
        config={{
          preventCopyPaste: true,
          detectTabSwitch: true,
          preventRightClick: true,
          fullscreenMode: sessionData.security.screenRecordingEnabled || false,
          maxTabSwitches: 5,
          maxWarnings: 5,
        }}
        onViolation={handleViolation}
        onMaxViolations={handleMaxViolations}
      >
        {testContent}
      </AntiCheatWrapper>
    );
  }

  return testContent;
}
