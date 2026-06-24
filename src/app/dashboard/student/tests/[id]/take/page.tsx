'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const handleSubmitRef = useRef<() => void>(() => {});

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

  const handleSubmit = useCallback(async () => {
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
  }, [submitting, answers, violations, test, timeRemaining, testId, router]);

  // Keep ref current so timer/violation callbacks always call the latest handleSubmit
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Max violations handler - auto submit
  const handleMaxViolations = useCallback(() => {
    alert('Maximum violations reached. Your test will be auto-submitted.');
    handleSubmitRef.current();
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
          handleSubmitRef.current();
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
              <h2 className="text-xl font-bold text-black mb-6">{question.question}</h2>
            </div>
          </div>

          {/* Answer Options */}
          <div className={question.type === 'mcq' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-4'}>
            {question.type === 'mcq' && question.options ? (
              (() => {
                const optionStyles = [
                  { letter: 'A', badge: 'bg-blue-500', selected: 'border-blue-400 bg-blue-50', text: 'text-blue-700', shadow: 'shadow-blue-100' },
                  { letter: 'B', badge: 'bg-rose-500', selected: 'border-rose-400 bg-rose-50', text: 'text-rose-700', shadow: 'shadow-rose-100' },
                  { letter: 'C', badge: 'bg-amber-500', selected: 'border-amber-400 bg-amber-50', text: 'text-amber-700', shadow: 'shadow-amber-100' },
                  { letter: 'D', badge: 'bg-emerald-500', selected: 'border-emerald-400 bg-emerald-50', text: 'text-emerald-700', shadow: 'shadow-emerald-100' },
                  { letter: 'E', badge: 'bg-purple-500', selected: 'border-purple-400 bg-purple-50', text: 'text-purple-700', shadow: 'shadow-purple-100' },
                  { letter: 'F', badge: 'bg-pink-500', selected: 'border-pink-400 bg-pink-50', text: 'text-pink-700', shadow: 'shadow-pink-100' },
                ];
                return question.options.map((option: string, index: number) => {
                  const style = optionStyles[index % optionStyles.length];
                  const isSelected = answers[question.id] === option;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, option)}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-150 w-full group ${
                        isSelected
                          ? `${style.selected} border-current scale-[1.02] shadow-lg ${style.shadow}`
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:scale-[1.01]'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm ${style.badge}`}>
                        {style.letter}
                      </span>
                      <span className={`font-medium text-sm md:text-base ${isSelected ? style.text : 'text-slate-800'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <span className="ml-auto w-6 h-6 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0">
                          <svg className={`w-4 h-4 ${style.text}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                });
              })()
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
            <h3 className="font-bold text-black">Progress Overview</h3>
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-fuchsia-600">{Object.keys(answers).length}</span>/{test.questions.length} answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {test.questions.map((q: { id: string }, index: number) => (
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
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(Object.keys(answers).length / test.questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            {test.questions.length - Object.keys(answers).length} question{test.questions.length - Object.keys(answers).length !== 1 ? 's' : ''} remaining
          </p>
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
