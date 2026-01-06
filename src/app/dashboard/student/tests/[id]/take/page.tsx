'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { AntiCheatWrapper } from '@/components/tests/AntiCheatWrapper';

interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'descriptive' | 'short_answer';
  options?: string[];
  correct_answer?: string;
  marks: number;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  test_type: string;
  duration_minutes: number;
  questions: Question[];
  total_marks: number;
  mentor_id: string;
  university_id: string;
  scheduled_at: string;
  settings?: {
    randomize_questions?: boolean;
    show_results_immediately?: boolean;
    allow_review?: boolean;
    enable_anti_cheat?: boolean;
    passing_percentage?: number;
  };
  proctoring_enabled?: boolean;
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;
  const supabase = createClient();

  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [violations, setViolations] = useState<{ type: string; count: number; timestamp: string }[]>([]);

  // Anti-cheat violation handler
  const handleViolation = useCallback((violation: { type: string; count: number; timestamp: string }) => {
    setViolations(prev => [...prev, violation]);
    // Log violation to server
    fetch(`/api/tests/${testId}/violations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...violation, student_id: userId }),
    }).catch(console.error);
  }, [testId, userId]);

  // Max violations handler - auto submit
  const handleMaxViolations = useCallback(() => {
    alert('Maximum violations reached. Your test will be auto-submitted.');
    handleSubmit();
  }, []);

  useEffect(() => {
    async function loadTest() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/signin');
          return;
        }
        setUserId(user.id);

        const { data: testData, error } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (error || !testData) {
          console.error('Error loading test:', error);
          router.push('/dashboard/student/tests');
          return;
        }

        // Randomize questions if setting is enabled
        let questions = testData.questions || [];
        if (testData.settings?.randomize_questions) {
          questions = [...questions].sort(() => Math.random() - 0.5);
        }

        setTest({ ...testData, questions });
        setTimeRemaining(testData.duration_minutes * 60); // Convert to seconds
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        router.push('/dashboard/student/tests');
      }
    }

    loadTest();
  }, [testId, router, supabase]);

  // Timer countdown
  useEffect(() => {
    if (!test || timeRemaining <= 0) return;

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
  }, [test, timeRemaining]);

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
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: testId,
          answers,
          violations: violations.length > 0 ? violations : null,
          time_taken_minutes: test ? (test.duration_minutes * 60 - timeRemaining) / 60 : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Submission error:', data);
        alert(data.error || 'Failed to submit test. Please try again.');
        setSubmitting(false);
        return;
      }

      // Show results immediately if enabled
      if (test?.settings?.show_results_immediately) {
        router.push(`/dashboard/student/tests/${testId}/results`);
      } else {
        router.push('/dashboard/student/tests');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Test Not Found</h2>
          <p className="text-slate-600">The test you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;
  const isLastQuestion = currentQuestion === test.questions.length - 1;
  const antiCheatEnabled = test.settings?.enable_anti_cheat || test.proctoring_enabled;

  const testContent = (
    <div className="min-h-screen bg-slate-50">
      {/* Anti-cheat indicator */}
      {antiCheatEnabled && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-amber-700 text-sm">
            <Shield className="w-4 h-4" />
            <span>Anti-cheat protection is active. Tab switches and copy/paste are being monitored.</span>
            {violations.length > 0 && (
              <span className="ml-auto font-medium text-amber-800">
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
              <h1 className="text-2xl font-bold text-black">{test.title}</h1>
              <p className="text-slate-600 text-sm">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-fuchsia-50 rounded-lg">
                <Clock className="w-5 h-5 text-fuchsia-600" />
                <span className={`font-mono text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-fuchsia-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
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
              <h2 className="text-xl font-bold text-black mb-6">{question.question}</h2>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {question.type === 'mcq' && question.options ? (
              question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[question.id] === option
                      ? 'border-fuchsia-500 bg-fuchsia-50'
                      : 'border-slate-200 hover:border-fuchsia-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="ml-4 text-black">{option}</span>
                </label>
              ))
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

            <div className="flex gap-2 flex-wrap justify-center">
              {test.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    index === currentQuestion
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white'
                      : answers[test.questions[index].id]
                      ? 'bg-fuchsia-100 text-fuchsia-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

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
          <h3 className="font-bold text-black mb-4">Answer Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-black">{Object.keys(answers).length}</p>
              <p className="text-sm text-slate-600">Answered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-400">{test.questions.length - Object.keys(answers).length}</p>
              <p className="text-sm text-slate-600">Unanswered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{test.questions.length}</p>
              <p className="text-sm text-slate-600">Total</p>
            </div>
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
        config={{
          preventCopyPaste: true,
          detectTabSwitch: true,
          preventRightClick: true,
          fullscreenMode: test.proctoring_enabled || false,
          maxTabSwitches: 3,
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
