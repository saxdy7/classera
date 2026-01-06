'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Flag, Send } from 'lucide-react';

interface Question {
    id: string;
    text: string;
    type: 'mcq' | 'essay' | 'coding';
    options?: { id: string; text: string }[];
    marks: number;
    explanation?: string;
}

interface TestSession {
    start_time: string;
    end_time: string;
    remaining_seconds: number;
}

interface TestData {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    total_marks: number;
    questions: Question[];
    question_type: string;
    enable_screen_recording: boolean;
    enable_face_monitoring: boolean;
}

interface Props {
    testId: string;
}

export function TestTakingClient({ testId }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [test, setTest] = useState<TestData | null>(null);
    const [session, setSession] = useState<TestSession | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

    // Start test
    useEffect(() => {
        const startTest = async () => {
            try {
                const response = await fetch(`/api/tests/${testId}/start`, { method: 'POST' });
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to start test');
                    return;
                }

                setTest(data.test);
                setSession(data.session);
                setTimeRemaining(data.session.remaining_seconds);
            } catch (err: any) {
                setError(err.message || 'Failed to start test');
            } finally {
                setLoading(false);
            }
        };

        startTest();
    }, [testId]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit(true); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Prevent tab switching
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && test) {
                // Log violation
                fetch(`/api/tests/${testId}/proctor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'tab_switch', timestamp: new Date().toISOString() })
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [test, testId]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const toggleFlag = (questionId: string) => {
        setFlagged(prev => {
            const newFlagged = new Set(prev);
            if (newFlagged.has(questionId)) {
                newFlagged.delete(questionId);
            } else {
                newFlagged.add(questionId);
            }
            return newFlagged;
        });
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const response = await fetch('/api/tests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    test_id: testId,
                    answers,
                    auto_submitted: autoSubmit,
                    time_taken_seconds: session ? (session.remaining_seconds - timeRemaining) : 0
                })
            });

            const data = await response.json();

            if (response.ok) {
                router.push(`/dashboard/student/tests/${testId}/results`);
            } else {
                console.error('Submit error:', data);
                setError(data.error || 'Failed to submit test. Please try again.');
                setSubmitting(false);
            }
        } catch (err: any) {
            console.error('Submit exception:', err);
            setError(err.message || 'Failed to submit test. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading test...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500 rounded-xl p-8 max-w-md text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Cannot Start Test</h2>
                    <p className="text-red-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/student/tests')}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                        Back to Tests
                    </button>
                </div>
            </div>
        );
    }

    if (!test) return null;

    const questions = test.questions || [];
    const currentQ = questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;
    const isLowTime = timeRemaining < 300; // Less than 5 minutes

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 px-4 py-3 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">{test.title}</h1>
                        <p className="text-slate-400 text-sm">Question {currentQuestion + 1} of {questions.length}</p>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLowTime ? 'bg-red-500/20 text-red-400' : 'bg-slate-700'}`}>
                        <Clock className={`w-5 h-5 ${isLowTime ? 'animate-pulse' : ''}`} />
                        <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
                    </div>

                    <button
                        onClick={() => setShowConfirmSubmit(true)}
                        disabled={submitting}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-20 pb-24 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Question Card */}
                    <div className="bg-slate-800 rounded-xl p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                                {currentQ?.marks || 1} marks
                            </span>
                            <button
                                onClick={() => currentQ && toggleFlag(currentQ.id)}
                                className={`p-2 rounded-lg transition-colors ${currentQ && flagged.has(currentQ.id)
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-slate-700 text-slate-400 hover:text-yellow-400'
                                    }`}
                            >
                                <Flag className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold mb-6">{currentQ?.text}</h2>

                        {/* MCQ Options */}
                        {currentQ?.type === 'mcq' && currentQ.options && (
                            <div className="space-y-3">
                                {currentQ.options.map((option, idx) => (
                                    <label
                                        key={option.id}
                                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQ.id] === option.id
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-600 hover:border-slate-500'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q_${currentQ.id}`}
                                            value={option.id}
                                            checked={answers[currentQ.id] === option.id}
                                            onChange={() => handleAnswerChange(currentQ.id, option.id)}
                                            className="w-5 h-5 text-purple-500"
                                        />
                                        <span className="font-medium text-slate-300">{String.fromCharCode(65 + idx)}.</span>
                                        <span>{option.text}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Essay Answer */}
                        {(currentQ?.type === 'essay' || currentQ?.type === 'coding') && (
                            <textarea
                                value={answers[currentQ.id] || ''}
                                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                placeholder={currentQ.type === 'coding' ? 'Write your code here...' : 'Write your answer here...'}
                                className="w-full h-64 p-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            />
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                        </button>

                        <div className="flex gap-2 flex-wrap justify-center">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${currentQuestion === idx
                                            ? 'bg-purple-500 text-white'
                                            : answers[q.id]
                                                ? 'bg-green-500/20 text-green-400'
                                                : flagged.has(q.id)
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-slate-700 text-slate-400'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentQuestion === questions.length - 1}
                            className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Question Overview Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full" />
                            Answered: {answeredCount}/{questions.length}
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                            Flagged: {flagged.size}
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-slate-500 rounded-full" />
                            Unanswered: {questions.length - answeredCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Submit Test?</h3>
                        <div className="space-y-2 mb-6 text-slate-300">
                            <p>Answered: {answeredCount} of {questions.length}</p>
                            <p>Unanswered: {questions.length - answeredCount}</p>
                            <p>Flagged for review: {flagged.size}</p>
                        </div>
                        {questions.length - answeredCount > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                                <p className="text-yellow-400 text-sm">⚠️ You have unanswered questions!</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmSubmit(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"
                            >
                                Continue Test
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-green-600 rounded-lg font-medium"
                            >
                                {submitting ? 'Submitting...' : 'Submit Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
