'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, Check } from 'lucide-react';

interface TestRoomProps {
    test: any;
    studentId: string;
}

export function TestRoom({ test, studentId }: TestRoomProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleAnswerSelect = (questionId: string, optionIndex: number) => {
        setAnswers({ ...answers, [questionId]: optionIndex });
    };

    const handleSubmit = async () => {
        if (submitting) return;

        setSubmitting(true);

        try {
            const response = await fetch('/api/tests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    test_id: test.id,
                    answers
                })
            });

            if (!response.ok) throw new Error('Submission failed');

            // Redirect to results/tests page
            router.push('/dashboard/student/tests');
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Failed to submit test. Please try again.');
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const questions = test.questions || [];
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)]">
            {/* Header */}
            <div className="bg-[var(--cl-surface-inverse)] border-b border-[var(--cl-hairline-strong)] p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{test.title}</h1>
                        <p className="text-sm text-[var(--cl-muted-soft)]">{answeredCount}/{questions.length} answered</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className={`text-2xl font-semibold ${timeLeft < 300 ? 'text-[var(--cl-error)] animate-pulse' : 'text-[var(--cl-success)]'}`}>
                            <Clock className="w-5 h-5 inline mr-2" />
                            {formatTime(timeLeft)}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Test'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-[var(--cl-surface-inverse)]">
                <div className="max-w-6xl mx-auto">
                    <div className="h-2 bg-[var(--cl-surface-inverse)]">
                        <div
                            className="h-full bg-[var(--cl-primary)] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-8">
                {question ? (
                    <div className="bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-xl)] p-8 mb-6">
                        <div className="flex items-start justify-between mb-6">
                            <h2 className="text-sm font-medium text-[var(--cl-muted-soft)]">
                                Question {currentQuestion + 1} of {questions.length}
                            </h2>
                            <span className="px-3 py-1 bg-[var(--cl-primary)] rounded-full text-sm font-medium">
                                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                            </span>
                        </div>

                        <p className="text-xl font-medium mb-8">{question.question}</p>

                        <div className="space-y-3">
                            {question.options.map((option: string, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(question.id, index)}
                                    className={`w-full text-left p-4 rounded-[var(--cl-r-lg)] border-2 transition-all ${answers[question.id] === index
                                            ? 'border-[var(--cl-primary)] bg-[var(--cl-surface-card)]'
                                            : 'border-[var(--cl-hairline-strong)] hover:border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[question.id] === index
                                                ? 'border-[var(--cl-primary)] bg-[var(--cl-primary)]'
                                                : 'border-[var(--cl-hairline-strong)]'
                                            }`}>
                                            {answers[question.id] === index && <Check className="w-4 h-4" />}
                                        </div>
                                        <span>{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-xl)] p-16 text-center">
                        <AlertTriangle className="w-16 h-16 text-[var(--cl-warning)] mx-auto mb-4" />
                        <p className="text-xl">No questions available</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="px-6 py-3 bg-[var(--cl-surface-inverse)] hover:bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {/* Question Numbers */}
                    <div className="flex gap-2">
                        {questions.map((_: any, index: number) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestion(index)}
                                className={`w-10 h-10 rounded-lg font-medium transition-all ${index === currentQuestion
                                        ? 'bg-[var(--cl-primary)]'
                                        : answers[questions[index].id] !== undefined
                                            ? 'bg-[var(--cl-success)]'
                                            : 'bg-[var(--cl-surface-inverse)] hover:bg-[var(--cl-surface-strong)]'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                        disabled={currentQuestion === questions.length - 1}
                        className="px-6 py-3 bg-[var(--cl-surface-inverse)] hover:bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Warning for leaving page */}
            <div className="fixed bottom-4 right-4 bg-[rgba(171,100,0,0.1)] border border-[var(--cl-warning)] rounded-lg p-4 max-w-sm">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[var(--cl-warning)] flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium text-[var(--cl-warning)]">Test in Progress</p>
                        <p className="text-[var(--cl-warning)]">Do not close this tab or navigate away</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
