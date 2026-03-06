'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Flag, Send, Zap, Target, Trophy, XCircle } from 'lucide-react';

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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-white text-xl font-semibold">Loading test...</p>
                    <p className="text-slate-400 mt-2">Preparing your questions</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-10 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Cannot Start Test</h2>
                    <p className="text-red-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/student/tests')}
                        className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
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
    const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    const timerPct = session ? (timeRemaining / (session.remaining_seconds || 1)) * 100 : 100;
    const isLowTime = timeRemaining < 300;
    const isCritical = timeRemaining < 60;

    // Wayground-style option color themes per index
    const OPTION_THEMES = [
        {
            base: 'bg-violet-600/80 hover:bg-violet-500 border-violet-500/60 hover:border-violet-400',
            selected: 'bg-violet-500 border-violet-300 shadow-violet-500/40 shadow-lg scale-[1.02]',
            letter: 'bg-violet-800 text-violet-200',
            selectedLetter: 'bg-violet-200 text-violet-800',
        },
        {
            base: 'bg-sky-600/80 hover:bg-sky-500 border-sky-500/60 hover:border-sky-400',
            selected: 'bg-sky-500 border-sky-300 shadow-sky-500/40 shadow-lg scale-[1.02]',
            letter: 'bg-sky-800 text-sky-200',
            selectedLetter: 'bg-sky-200 text-sky-800',
        },
        {
            base: 'bg-amber-600/80 hover:bg-amber-500 border-amber-500/60 hover:border-amber-400',
            selected: 'bg-amber-500 border-amber-300 shadow-amber-500/40 shadow-lg scale-[1.02]',
            letter: 'bg-amber-800 text-amber-200',
            selectedLetter: 'bg-amber-200 text-amber-800',
        },
        {
            base: 'bg-emerald-600/80 hover:bg-emerald-500 border-emerald-500/60 hover:border-emerald-400',
            selected: 'bg-emerald-500 border-emerald-300 shadow-emerald-500/40 shadow-lg scale-[1.02]',
            letter: 'bg-emerald-800 text-emerald-200',
            selectedLetter: 'bg-emerald-200 text-emerald-800',
        },
    ];

    const timerColor = isCritical
        ? 'bg-red-500'
        : isLowTime
            ? 'bg-amber-400'
            : 'bg-emerald-500';

    const timerTextColor = isCritical
        ? 'text-red-400'
        : isLowTime
            ? 'text-amber-400'
            : 'text-emerald-400';

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">

            {/* ── Header ── */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
                {/* Timer progress bar */}
                <div className="h-1 w-full bg-slate-800">
                    <div
                        className={`h-full transition-all duration-1000 ${timerColor}`}
                        style={{ width: `${Math.max(0, timerPct)}%` }}
                    />
                </div>

                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    {/* Title + progress */}
                    <div className="min-w-0">
                        <h1 className="font-bold text-base truncate">{test.title}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-slate-400 text-xs">
                                {currentQuestion + 1} / {questions.length}
                            </span>
                            <div className="flex-1 max-w-[120px] h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <span className="text-slate-400 text-xs">{answeredCount} answered</span>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        isCritical ? 'bg-red-500/15 border-red-500/40' :
                        isLowTime ? 'bg-amber-500/15 border-amber-500/40' :
                        'bg-slate-800 border-slate-700'
                    }`}>
                        <Clock className={`w-4 h-4 ${timerTextColor} ${isCritical ? 'animate-pulse' : ''}`} />
                        <span className={`font-mono font-bold text-xl tabular-nums ${timerTextColor}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={() => setShowConfirmSubmit(true)}
                        disabled={submitting}
                        className="px-5 py-2 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-60"
                    >
                        <Send className="w-4 h-4" />
                        Submit Test
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 pt-[76px] pb-6 px-4 flex items-start justify-center">
                <div className="w-full max-w-3xl">

                    {/* Question counter chips */}
                    <div className="flex flex-wrap gap-1.5 py-4 justify-center">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestion(idx)}
                                title={`Question ${idx + 1}`}
                                className={`w-9 h-9 rounded-lg font-bold text-xs transition-all active:scale-90 ${
                                    currentQuestion === idx
                                        ? 'bg-violet-500 text-white ring-2 ring-violet-300 ring-offset-1 ring-offset-slate-950'
                                        : answers[q.id]
                                            ? 'bg-emerald-600/50 text-emerald-300 border border-emerald-600/50'
                                            : flagged.has(q.id)
                                                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {/* Question Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-600/30">
                                    {currentQuestion + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-medium uppercase tracking-wide">
                                        {currentQ?.type || 'mcq'}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-400 font-medium">
                                        <Zap className="w-3 h-3" />
                                        {currentQ?.marks || 1} pts
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => currentQ && toggleFlag(currentQ.id)}
                                className={`p-2 rounded-xl transition-all active:scale-90 ${
                                    currentQ && flagged.has(currentQ.id)
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                        : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-amber-400 hover:border-amber-500/40'
                                }`}
                                title="Flag for review"
                            >
                                <Flag className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Question text */}
                        <div className="px-6 py-6">
                            <p className="text-xl font-semibold leading-relaxed text-white">
                                {currentQ?.text}
                            </p>
                        </div>

                        {/* MCQ colored tiles */}
                        {currentQ?.type === 'mcq' && currentQ.options && (
                            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currentQ.options.map((option, idx) => {
                                    const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
                                    const isSelected = answers[currentQ.id] === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswerChange(currentQ.id, option.id)}
                                            className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left font-medium text-white ${
                                                isSelected ? theme.selected : theme.base
                                            }`}
                                        >
                                            {/* Letter badge */}
                                            <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                                                isSelected ? theme.selectedLetter : theme.letter
                                            }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="flex-1 text-sm leading-snug">{option.text}</span>
                                            {isSelected && (
                                                <CheckCircle className="flex-shrink-0 w-5 h-5 text-white/90" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Essay / Coding answer */}
                        {(currentQ?.type === 'essay' || currentQ?.type === 'coding') && (
                            <div className="px-6 pb-6">
                                <textarea
                                    value={answers[currentQ.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                    placeholder={currentQ.type === 'coding' ? '// Write your code here...' : 'Write your answer here...'}
                                    className="w-full h-52 p-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-sm text-white placeholder-slate-500 resize-none"
                                />
                                <p className="text-slate-500 text-xs mt-2 text-right">
                                    {(answers[currentQ.id] || '').length} characters
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Prev / Next navigation */}
                    <div className="flex items-center justify-between mt-4 gap-4">
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestion === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-700 transition-all active:scale-95 text-sm font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {answeredCount} done
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400" /> {flagged.size} flagged
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-600" /> {questions.length - answeredCount} left
                            </span>
                        </div>

                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentQuestion === questions.length - 1}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-700 transition-all active:scale-95 text-sm font-medium"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Submit Confirmation Modal ── */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-center w-16 h-16 bg-violet-500/15 rounded-2xl mx-auto mb-5">
                            <Target className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-center mb-2">Submit Test?</h3>
                        <p className="text-slate-400 text-center text-sm mb-6">
                            Once submitted, you cannot change your answers.
                        </p>

                        <div className="bg-slate-800 rounded-xl p-4 mb-5 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Answered
                                </span>
                                <span className="font-semibold text-emerald-400">{answeredCount} / {questions.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-600" /> Unanswered
                                </span>
                                <span className={`font-semibold ${questions.length - answeredCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {questions.length - answeredCount}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Flagged
                                </span>
                                <span className="font-semibold text-amber-400">{flagged.size}</span>
                            </div>
                        </div>

                        {questions.length - answeredCount > 0 && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-5">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <p className="text-amber-300 text-sm">
                                    You have {questions.length - answeredCount} unanswered question{questions.length - answeredCount > 1 ? 's' : ''}.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmSubmit(false)}
                                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                            >
                                Keep Going
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="w-4 h-4" />
                                        Submit Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
