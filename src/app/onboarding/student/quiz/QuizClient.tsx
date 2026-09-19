'use client';

import { useState } from 'react';
import {
    Target, Zap, Heart, BookOpen, Clock, TrendingUp, Calendar,
    ArrowLeft, ArrowRight, CheckCircle,
} from 'lucide-react';

const TOTAL_STEPS = 7;

const STEPS = [
    {
        icon: Target,
        gradient: '',
        title: 'What is your career goal?',
        subtitle: 'Pick the path you\'re most excited about',
        key: 'career_goal',
        type: 'single',
        options: [
            'Full Stack Developer',
            'Data Scientist',
            'Mobile App Developer',
            'DevOps / Cloud Engineer',
            'UI/UX Designer',
            'AI / ML Engineer',
            'Cybersecurity Analyst',
            'Still Exploring',
        ],
    },
    {
        icon: Zap,
        gradient: '',
        title: 'What is your current skill level?',
        subtitle: 'Be honest — there are no wrong answers',
        key: 'skill_level',
        type: 'single',
        options: [
            'Complete Beginner',
            'I know some basics',
            'Intermediate',
            'Advanced',
        ],
    },
    {
        icon: Heart,
        gradient: '',
        title: 'What topics interest you most?',
        subtitle: 'Select all that apply',
        key: 'interests',
        type: 'multi',
        options: [
            'Web Development',
            'AI & Machine Learning',
            'Mobile Development',
            'Cloud & DevOps',
            'Cybersecurity',
            'Data Science',
            'Game Development',
            'Blockchain',
        ],
    },
    {
        icon: BookOpen,
        gradient: '',
        title: 'How do you learn best?',
        subtitle: 'This helps us recommend the right content format',
        key: 'learning_style',
        type: 'single',
        options: [
            'Video tutorials',
            'Hands-on projects',
            'Reading docs & articles',
            'Everything mixed',
        ],
    },
    {
        icon: Clock,
        gradient: '',
        title: 'How many hours per week can you study?',
        subtitle: 'We\'ll build a realistic plan around your schedule',
        key: 'weekly_hours',
        type: 'single',
        options: [
            '1 – 3 hours',
            '3 – 7 hours',
            '7 – 15 hours',
            '15+ hours',
        ],
    },
    {
        icon: TrendingUp,
        gradient: '',
        title: 'What is your biggest challenge right now?',
        subtitle: 'We\'ll focus on solving this for you',
        key: 'biggest_challenge',
        type: 'single',
        options: [
            'Finding the right resources',
            'Staying consistent',
            'Understanding concepts',
            'Building real projects',
            'Getting hired / internship',
        ],
    },
    {
        icon: Calendar,
        gradient: '',
        title: 'What is your goal timeline?',
        subtitle: 'When do you want to achieve your goal?',
        key: 'goal_timeline',
        type: 'single',
        options: [
            '3 months',
            '6 months',
            '1 year',
            '2+ years',
        ],
    },
];

export default function QuizClient() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const current = STEPS[step];
    const Icon = current.icon;
    const answer = answers[current.key];

    const isAnswered = current.type === 'single'
        ? typeof answer === 'string' && answer.length > 0
        : Array.isArray(answer) && answer.length > 0;

    const selectSingle = (opt: string) => {
        setAnswers(prev => ({ ...prev, [current.key]: opt }));
    };

    const toggleMulti = (opt: string) => {
        setAnswers(prev => {
            const existing = (prev[current.key] as string[]) || [];
            const next = existing.includes(opt)
                ? existing.filter(x => x !== opt)
                : [...existing, opt];
            return { ...prev, [current.key]: next };
        });
    };

    const handleNext = () => {
        if (!isAnswered) return;
        setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        if (!isAnswered) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save preferences');
            window.location.href = '/dashboard/student';
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--cl-canvas)]">
            <div className="w-full max-w-2xl">
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-8 md:p-12">

                    {/* Progress bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs text-[var(--cl-muted-soft)] mb-2">
                            <span>Question {step + 1} of {TOTAL_STEPS}</span>
                            <span>{Math.round(progress)}% complete</span>
                        </div>
                        <div className="h-2 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 bg-[var(--cl-primary)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="animate-in fade-in slide-in-from-right duration-300">
                        <div className="text-center mb-8">
                            <div className={`w-20 h-20 ${current.gradient} rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-4`}>
                                <Icon className="w-10 h-10 text-[var(--cl-on-dark)]" />
                            </div>
                            <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-2">{current.title}</h2>
                            <p className="text-[var(--cl-muted)] text-sm">{current.subtitle}</p>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {current.options.map(opt => {
                                const selected = current.type === 'single'
                                    ? answer === opt
                                    : Array.isArray(answer) && answer.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => current.type === 'single' ? selectSingle(opt) : toggleMulti(opt)}
                                        className={`relative flex items-center gap-3 px-4 py-3 rounded-[var(--cl-r-lg)] border-2 text-left text-sm font-medium transition-all ${selected
                                            ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]'
                                            : 'border-[var(--cl-hairline)] text-[var(--cl-body)] hover:border-[var(--cl-primary)] hover:bg-[var(--cl-canvas-soft)]'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected
                                            ? 'border-[var(--cl-primary)] bg-[var(--cl-primary)]'
                                            : 'border-[var(--cl-hairline-strong)]'
                                            }`}>
                                            {selected && <CheckCircle className="w-3 h-3 text-[var(--cl-on-dark)]" />}
                                        </div>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-[rgba(239,68,68,0.12)] border border-[var(--cl-error)] text-[var(--cl-error)] rounded-[var(--cl-r-lg)] text-sm">{error}</div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4 pt-6 border-t border-[var(--cl-hairline)]">
                        <button
                            onClick={handleBack}
                            disabled={step === 0}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--cl-r-lg)] text-sm font-medium transition-all ${step === 0
                                ? 'invisible'
                                : 'text-[var(--cl-body)] hover:bg-[var(--cl-surface-strong)]'
                                }`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {step < TOTAL_STEPS - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={!isAnswered}
                                className="flex items-center gap-2 px-6 py-2.5 text-[var(--cl-on-dark)] font-semibold rounded-[var(--cl-r-lg)] transition-all disabled:opacity-40 bg-[var(--cl-primary)]"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isAnswered || submitting}
                                className="flex items-center gap-2 px-6 py-2.5 text-[var(--cl-on-dark)] font-semibold rounded-[var(--cl-r-lg)] transition-all disabled:opacity-40 bg-[var(--cl-primary)]"
                            >
                                {submitting ? 'Saving…' : 'Go to Dashboard'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
