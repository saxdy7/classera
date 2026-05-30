'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Shield, Lock } from 'lucide-react';
import { AntiCheatWrapper } from '@/components/tests/AntiCheatWrapper';
import { MCQQuestion } from '@/components/tests/MCQQuestionDisplay';
import type { Question, Test, TestSession } from '@/lib/test-types';

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

  // Timer countdown
  useEffect(() => {
    if (!sessionData || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
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
    handleSubmit();
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

  const handleSubmit = async () => {
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

      // Success - redirect to results
      router.push(`/dashboard/student/tests/${testId}/results`);

    } catch (err) {
      console.error('Error submitting test:', err);
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 mb-2">Initializing secure test session...</p>
          <p className="text-xs text-slate-500">Please allow a moment for setup</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Start Test</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/student/tests')}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
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
    <div className="min-h-screen bg-slate-50">
      {/* Security Banner */}
      {antiCheatEnabled && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <Lock className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-900">Secure Test Session Active</span>
            </div>
            <span className="text-sm text-amber-700">
              Session Token: {sessionTokenRef.current?.substring(0, 16)}...
            </span>
            {violations.length > 0 && (
              <span className="ml-auto font-semibold text-amber-800 bg-amber-100 px-3 py-1 rounded-full text-sm">
                Warnings: {violations.length}/5
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header with Timer */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
              <p className="text-slate-600 text-sm">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-all ${
                timeRemaining < 60
                  ? 'bg-red-50 text-red-600 animate-pulse border-2 border-red-300'
                  : timeRemaining < 300
                  ? 'bg-orange-50 text-orange-600 border-2 border-orange-200'
                  : 'bg-fuchsia-50 text-fuchsia-600'
              }`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'short_answer' ? 'Short Answer' : 'Descriptive'}
                </span>
                <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-sm font-medium">
                  {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">{question.question}</h2>
            </div>
          </div>

          {/* Answer Options */}
          <div className={question.type === 'mcq' ? 'space-y-3' : 'space-y-4'}>
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
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-fuchsia-500 transition-colors"
              />
            ) : (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <span className="text-sm text-slate-500 font-medium">
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {isLastQuestion ? 'Finish' : 'Next'}
              {!isLastQuestion && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Answer Summary */}
        <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Progress Overview</h3>
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-fuchsia-600">{Object.keys(answers).length}</span>/{test.questions.length} answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {test.questions.map((q: Question, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                title={`Question ${index + 1}${answers[q.id] ? ' (answered)' : ''}`}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  index === currentQuestion
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white scale-110 shadow-md'
                    : answers[q.id]
                    ? 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
