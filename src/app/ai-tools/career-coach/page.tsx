'use client';

import Link from 'next/link';

const features = [
    { icon: '🎯', title: 'Resume Builder', desc: 'Create ATS-optimized resumes with AI suggestions' },
    { icon: '💼', title: 'Interview Prep', desc: 'Practice with AI-powered mock interviews' },
    { icon: '🗺️', title: 'Career Roadmap', desc: 'Get a personalized step-by-step career path' },
    { icon: '📊', title: 'Skill Gap Analysis', desc: 'Identify skills needed for your dream role' },
    { icon: '🔍', title: 'Job Market insights', desc: 'Real-time salary and demand data for your field' },
    { icon: '🤝', title: 'Mentor Matching', desc: 'Get matched with mentors in your target industry' },
];

export default function CareerCoachPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-3xl w-full">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-4xl mb-6 shadow-lg shadow-indigo-200">
                        🤖
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">AI Career Coach</h1>
                    <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                        Your personal AI-powered career advisor. Get guidance on resumes, interviews,
                        and skill development — all tailored to your goals.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                    {features.map((f) => (
                        <div key={f.title} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="text-2xl mb-3">{f.icon}</div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{f.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Coming Soon Banner */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-center text-white shadow-xl shadow-indigo-200">
                    <div className="text-3xl mb-3">🚀</div>
                    <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                    <p className="text-indigo-200 text-sm mb-6">
                        The AI Career Coach is being built. In the meantime, use the AI Assistant
                        or connect with a mentor for career guidance.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/dashboard/student/find-mentors"
                            className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors">
                            Find a Mentor
                        </Link>
                        <Link href="/dashboard/student/ai-assistant"
                            className="px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl text-sm hover:bg-white/30 transition-colors border border-white/30">
                            AI Assistant
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
