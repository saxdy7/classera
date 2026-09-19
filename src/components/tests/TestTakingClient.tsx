'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Flag, Send, Zap, Target, Trophy, XCircle, Maximize } from 'lucide-react';

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

    // Anti-cheat state
    const [warningsCount, setWarningsCount] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [disqualified, setDisqualified] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

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

    // Start the test after taking any pre-test steps (like requesting fullscreen)
    const handleStartTest = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen failed:', err);
        }
        setHasStarted(true);
    };

    // Prevent tab switching & fullscreen exiting
    useEffect(() => {
        if (!test || !hasStarted || submitting || disqualified) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation('tab_switch');
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                handleViolation('fullscreen_exit');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [test, hasStarted, submitting, disqualified, warningsCount, testId]);

    const handleViolation = (type: string) => {
        const newCount = warningsCount + 1;

        fetch(`/api/tests/${testId}/proctor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, timestamp: new Date().toISOString(), warnings_count: newCount })
        }).catch(console.error);

        if (newCount >= 3) {
            setDisqualified(true);
            handleSubmit(true); // Auto-submit due to disqualification
        } else {
            setWarningsCount(newCount);
            setShowWarningModal(true);
        }
    };

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
            <div className="min-h-screen bg-[var(--cl-surface-inverse)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-[var(--cl-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-[var(--cl-on-dark)] text-xl font-semibold">Loading test...</p>
                    <p className="text-[var(--cl-muted-soft)] mt-2">Preparing your questions</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--cl-surface-inverse)] flex items-center justify-center">
                <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--cl-error)] rounded-[var(--cl-r-xl)] p-10 max-w-md text-center">
                    <div className="w-16 h-16 bg-[rgba(239,68,68,0.2)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-[var(--cl-error)]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-[var(--cl-on-dark)] mb-2">Cannot Start Test</h2>
                    <p className="text-[var(--cl-error)] mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/student/tests')}
                        className="px-6 py-3 bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] hover:bg-[var(--cl-surface-strong)] transition-colors"
                    >
                        Back to Tests
                    </button>
                </div>
            </div>
        );
    }

    if (!test) return null;

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-[var(--cl-surface-inverse)] flex flex-col items-center justify-center p-4">
                <div className="bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-xl)] p-10 max-w-lg w-full text-center relative overflow-hidden">
                    <div className="absolute inset-0 z-0" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-[var(--cl-surface-card)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Target className="w-10 h-10 text-[var(--cl-primary)]" />
                        </div>
                        <h1 className="text-3xl font-semibold text-[var(--cl-on-dark)] mb-3">Ready to begin?</h1>
                        <p className="text-[var(--cl-muted-soft)] mb-8 leading-relaxed">
                            {test.title} is a timed test. Once you start, the timer will begin.
                        </p>

                        <div className="bg-[rgba(171,100,0,0.1)] border border-[var(--cl-warning)] rounded-[var(--cl-r-xl)] p-5 mb-8 text-left">
                            <h3 className="flex items-center gap-2 text-[var(--cl-warning)] font-semibold mb-3">
                                <AlertTriangle className="w-5 h-5" />
                                Anti-Cheat Rules
                            </h3>
                            <ul className="space-y-2 text-[var(--cl-warning)] text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 translate-y-[2px] w-1.5 h-1.5 rounded-full bg-[var(--cl-warning)] flex-shrink-0" />
                                    This test requires Full Screen mode.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 translate-y-[2px] w-1.5 h-1.5 rounded-full bg-[var(--cl-warning)] flex-shrink-0" />
                                    Switching tabs, opening other apps, or exiting full screen will issue a warning.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 translate-y-[2px] w-1.5 h-1.5 rounded-full bg-[var(--cl-error)] flex-shrink-0" />
                                    <strong className="text-[var(--cl-error)]">3 warnings will automatically submit and fail your test.</strong>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={handleStartTest}
                            className="w-full py-4 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] rounded-[var(--cl-r-lg)] font-semibold text-[var(--cl-on-dark)] flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Maximize className="w-5 h-5" />
                            Enter Fullscreen & Start Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
            base: 'bg-[var(--cl-surface-card)] hover:bg-[var(--cl-primary)] border-[var(--cl-primary)] hover:border-[var(--cl-primary)]',
            selected: 'bg-[var(--cl-primary)] border-[var(--cl-primary)] scale-[1.02]',
            letter: 'bg-[var(--cl-primary)] text-[var(--cl-primary)]',
            selectedLetter: 'bg-[var(--cl-primary)] text-[var(--cl-primary)]',
        },
        {
            base: 'bg-[rgba(13,116,206,0.8)] hover:bg-[var(--cl-info)] border-[var(--cl-info)] hover:border-[var(--cl-info)]',
            selected: 'bg-[var(--cl-info)] border-[var(--cl-info)] scale-[1.02]',
            letter: 'bg-[var(--cl-info)] text-[var(--cl-info)]',
            selectedLetter: 'bg-[var(--cl-info)] text-[var(--cl-info)]',
        },
        {
            base: 'bg-[rgba(171,100,0,0.8)] hover:bg-[var(--cl-warning)] border-[var(--cl-warning)] hover:border-[var(--cl-warning)]',
            selected: 'bg-[var(--cl-warning)] border-[var(--cl-warning)] scale-[1.02]',
            letter: 'bg-[var(--cl-warning)] text-[var(--cl-warning)]',
            selectedLetter: 'bg-[var(--cl-warning)] text-[var(--cl-warning)]',
        },
        {
            base: 'bg-[rgba(22,163,74,0.8)] hover:bg-[var(--cl-success)] border-[var(--cl-success)] hover:border-[var(--cl-success)]',
            selected: 'bg-[var(--cl-success)] border-[var(--cl-success)] scale-[1.02]',
            letter: 'bg-[var(--cl-success)] text-[var(--cl-success)]',
            selectedLetter: 'bg-[var(--cl-success)] text-[var(--cl-success)]',
        },
    ];

    const timerColor = isCritical
        ? 'bg-[var(--cl-error)]'
        : isLowTime
            ? 'bg-[var(--cl-warning)]'
            : 'bg-[var(--cl-success)]';

    const timerTextColor = isCritical
        ? 'text-[var(--cl-error)]'
        : isLowTime
            ? 'text-[var(--cl-warning)]'
            : 'text-[var(--cl-success)]';

    return (
        <div className="min-h-screen bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] flex flex-col">

            {/* ── Header ── */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--cl-surface-card)] backdrop-blur border-b border-[var(--cl-hairline-strong)]">
                {/* Timer progress bar */}
                <div className="h-1 w-full bg-[var(--cl-surface-inverse)]">
                    <div
                        className={`h-full transition-all duration-1000 ${timerColor}`}
                        style={{ width: `${Math.max(0, timerPct)}%` }}
                    />
                </div>

                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    {/* Title + progress */}
                    <div className="min-w-0">
                        <h1 className="font-semibold text-base truncate">{test.title}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[var(--cl-muted-soft)] text-xs">
                                {currentQuestion + 1} / {questions.length}
                            </span>
                            <div className="flex-1 max-w-[120px] h-1.5 bg-[var(--cl-surface-inverse)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--cl-primary)] rounded-full transition-all duration-300"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <span className="text-[var(--cl-muted-soft)] text-xs">{answeredCount} answered</span>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-[var(--cl-r-lg)] border ${isCritical ? 'bg-[rgba(239,68,68,0.15)] border-[var(--cl-error)]' :
                            isLowTime ? 'bg-[rgba(171,100,0,0.15)] border-[var(--cl-warning)]' :
                                'bg-[var(--cl-surface-inverse)] border-[var(--cl-hairline-strong)]'
                        }`}>
                        <Clock className={`w-4 h-4 ${timerTextColor} ${isCritical ? 'animate-pulse' : ''}`} />
                        <span className={`font-mono font-semibold text-xl tabular-nums ${timerTextColor}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={() => setShowConfirmSubmit(true)}
                        disabled={submitting}
                        className="px-5 py-2 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] active:scale-95 rounded-[var(--cl-r-lg)] font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-60"
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
                                className={`w-9 h-9 rounded-lg font-semibold text-xs transition-all active:scale-90 ${currentQuestion === idx
                                        ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)] ring-2 ring-[var(--cl-primary)] ring-offset-1 ring-offset-[var(--cl-canvas)]'
                                        : answers[q.id]
                                            ? 'bg-[rgba(22,163,74,0.5)] text-[var(--cl-success)] border border-[var(--cl-success)]'
                                            : flagged.has(q.id)
                                                ? 'bg-[rgba(171,100,0,0.3)] text-[var(--cl-warning)] border border-[var(--cl-warning)]'
                                                : 'bg-[var(--cl-surface-inverse)] text-[var(--cl-muted-soft)] border border-[var(--cl-hairline-strong)] hover:border-[var(--cl-hairline-strong)]'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {/* Question Card */}
                    <div className="bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-xl)] overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary)] flex items-center justify-center font-semibold text-sm">
                                    {currentQuestion + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-lg text-[var(--cl-muted-soft)] font-medium uppercase tracking-wide">
                                        {currentQ?.type || 'mcq'}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-[rgba(171,100,0,0.15)] border border-[var(--cl-warning)] rounded-lg text-[var(--cl-warning)] font-medium">
                                        <Zap className="w-3 h-3" />
                                        {currentQ?.marks || 1} pts
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => currentQ && toggleFlag(currentQ.id)}
                                className={`p-2 rounded-[var(--cl-r-lg)] transition-all active:scale-90 ${currentQ && flagged.has(currentQ.id)
                                        ? 'bg-[rgba(171,100,0,0.2)] text-[var(--cl-warning)] border border-[var(--cl-warning)]'
                                        : 'bg-[var(--cl-surface-inverse)] text-[var(--cl-muted)] border border-[var(--cl-hairline-strong)] hover:text-[var(--cl-warning)] hover:border-[var(--cl-warning)]'
                                    }`}
                                title="Flag for review"
                            >
                                <Flag className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Question text */}
                        <div className="px-6 py-6">
                            <p className="text-xl font-semibold leading-relaxed text-[var(--cl-on-dark)]">
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
                                            className={`group relative flex items-center gap-4 p-4 rounded-[var(--cl-r-lg)] border-2 cursor-pointer transition-all duration-200 text-left font-medium text-[var(--cl-on-dark)] ${isSelected ? theme.selected : theme.base
                                                }`}
                                        >
                                            {/* Letter badge */}
                                            <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors ${isSelected ? theme.selectedLetter : theme.letter
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="flex-1 text-sm leading-snug">{option.text}</span>
                                            {isSelected && (
                                                <CheckCircle className="flex-shrink-0 w-5 h-5 text-[rgba(255,255,255,0.9)]" />
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
                                    className="w-full h-52 p-4 bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent font-mono text-sm text-[var(--cl-on-dark)] placeholder-[var(--cl-muted-soft)] resize-none"
                                />
                                <p className="text-[var(--cl-muted)] text-xs mt-2 text-right">
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
                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-lg)] disabled:opacity-30 hover:bg-[var(--cl-surface-inverse)] transition-all active:scale-95 text-sm font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex items-center gap-4 text-xs text-[var(--cl-muted)]">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--cl-success)]" /> {answeredCount} done
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--cl-warning)]" /> {flagged.size} flagged
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--cl-surface-strong)]" /> {questions.length - answeredCount} left
                            </span>
                        </div>

                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentQuestion === questions.length - 1}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-lg)] disabled:opacity-30 hover:bg-[var(--cl-surface-inverse)] transition-all active:scale-95 text-sm font-medium"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Submit Confirmation Modal ── */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-[rgba(10,10,10,0.8)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-xl)] p-8 max-w-md w-full">
                        <div className="flex items-center justify-center w-16 h-16 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] mx-auto mb-5">
                            <Target className="w-8 h-8 text-[var(--cl-primary)]" />
                        </div>
                        <h3 className="text-2xl font-semibold text-center mb-2">Submit Test?</h3>
                        <p className="text-[var(--cl-muted-soft)] text-center text-sm mb-6">
                            Once submitted, you cannot change your answers.
                        </p>

                        <div className="bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-lg)] p-4 mb-5 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--cl-muted-soft)] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[var(--cl-success)]" /> Answered
                                </span>
                                <span className="font-semibold text-[var(--cl-success)]">{answeredCount} / {questions.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--cl-muted-soft)] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[var(--cl-surface-strong)]" /> Unanswered
                                </span>
                                <span className={`font-semibold ${questions.length - answeredCount > 0 ? 'text-[var(--cl-error)]' : 'text-[var(--cl-muted-soft)]'}`}>
                                    {questions.length - answeredCount}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--cl-muted-soft)] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[var(--cl-warning)]" /> Flagged
                                </span>
                                <span className="font-semibold text-[var(--cl-warning)]">{flagged.size}</span>
                            </div>
                        </div>

                        {questions.length - answeredCount > 0 && (
                            <div className="flex items-center gap-2 bg-[rgba(171,100,0,0.1)] border border-[var(--cl-warning)] rounded-[var(--cl-r-lg)] px-4 py-3 mb-5">
                                <AlertTriangle className="w-4 h-4 text-[var(--cl-warning)] flex-shrink-0" />
                                <p className="text-[var(--cl-warning)] text-sm">
                                    You have {questions.length - answeredCount} unanswered question{questions.length - answeredCount > 1 ? 's' : ''}.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmSubmit(false)}
                                className="flex-1 px-4 py-3 bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-lg)] font-medium hover:bg-[var(--cl-surface-inverse)] transition-colors"
                            >
                                Keep Going
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] rounded-[var(--cl-r-lg)] font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
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
