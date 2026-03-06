import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';

export default function QuizGate({ featureName }: { featureName: string }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-slate-100">
                <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-200">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    {featureName} is locked
                </h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    Complete a quick 2-minute preferences quiz so we can personalise your experience, recommend the right courses, and tailor AI guidance to your goals.
                </p>
                <Link
                    href="/onboarding/student/quiz"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-semibold rounded-xl hover:from-fuchsia-700 hover:to-purple-700 transition-all shadow-md shadow-purple-200"
                >
                    <Sparkles className="w-4 h-4" />
                    Take the Quiz
                </Link>
            </div>
        </div>
    );
}
