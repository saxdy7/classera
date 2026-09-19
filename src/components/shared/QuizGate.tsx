import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';

export default function QuizGate({ featureName }: { featureName: string }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-10 max-w-md w-full text-center border border-[var(--cl-hairline)]">
                <div className="w-16 h-16 rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-6 bg-[var(--cl-primary)]">
                    <Lock className="w-8 h-8 text-[var(--cl-on-dark)]" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-3">
                    {featureName} is locked
                </h2>
                <p className="text-[var(--cl-muted)] text-sm mb-8 leading-relaxed">
                    Complete a quick 2-minute preferences quiz so we can personalise your experience, recommend the right courses, and tailor AI guidance to your goals.
                </p>
                <Link
                    href="/onboarding/student/quiz"
                    className="inline-flex items-center gap-2 px-6 py-3 text-[var(--cl-on-dark)] font-semibold rounded-[var(--cl-r-lg)] transition-all bg-[var(--cl-primary)]"
                >
                    <Sparkles className="w-4 h-4" />
                    Take the Quiz
                </Link>
            </div>
        </div>
    );
}
