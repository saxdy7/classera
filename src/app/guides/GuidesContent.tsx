'use client';

import { useState } from 'react';
import { Sparkles, BookText, ArrowLeft, Loader2, Clock, ExternalLink, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface GuideSection {
    heading: string;
    content: string;
    code_example?: string;
    key_points: string[];
    resources?: { title: string; url: string }[];
}

interface GeneratedGuide {
    guide_title: string;
    introduction: string;
    estimated_read_minutes: number;
    difficulty: string;
    sections: GuideSection[];
    summary: string;
    next_steps: string[];
}

const POPULAR = [
    'How REST APIs work', 'Git & GitHub for Beginners', 'How to use Docker',
    'Understanding JWT Authentication', 'Introduction to SQL', 'CSS Flexbox explained',
    'What is recursion?', 'Big O Notation simply explained',
];

export function GuidesContent() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [loading, setLoading] = useState(false);
    const [guide, setGuide] = useState<GeneratedGuide | null>(null);
    const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
    const [error, setError] = useState('');

    const generate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setError('');
        setGuide(null);
        setOpenSections(new Set([0]));

        try {
            const res = await fetch('/api/ai/generate-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, difficulty }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setGuide(data);
        } catch (e: any) {
            setError(e.message || 'Failed to generate guide. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (i: number) => {
        setOpenSections(prev => {
            const n = new Set(prev);
            n.has(i) ? n.delete(i) : n.add(i);
            return n;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <BookText size={15} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">AI Guide Generator</h1>
                        <p className="text-xs text-slate-400">Generate focused learning guides on any topic</p>
                    </div>
                    {guide && (
                        <button onClick={() => { setGuide(null); setTopic(''); }}
                            className="ml-auto text-xs text-blue-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                            ← New Guide
                        </button>
                    )}
                </div>
            </header>

            {!guide ? (
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate a Guide</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Get a deep, focused guide on any programming concept, tool, or technology — structured, clear, and actionable.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">What do you want explained?</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') generate(); }}
                                placeholder="e.g. How REST APIs work, What is recursion, Docker explained..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            />
                            <button onClick={generate} disabled={!topic.trim() || loading}
                                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Depth level</label>
                            <div className="flex gap-2">
                                {['beginner', 'intermediate', 'advanced'].map(d => (
                                    <button key={d} onClick={() => setDifficulty(d)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all
                      ${difficulty === d
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                            }`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>}

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Try these topics</p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR.map(t => (
                                <button key={t} onClick={() => setTopic(t)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Guide view ── */
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                ${{ beginner: 'bg-emerald-100 text-emerald-700', intermediate: 'bg-amber-100 text-amber-700', advanced: 'bg-red-100 text-red-700' }[guide.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                                {guide.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={11} /> {guide.estimated_read_minutes} min read
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">{guide.guide_title}</h1>
                        <p className="text-slate-600 leading-relaxed">{guide.introduction}</p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-3 mb-6">
                        {guide.sections.map((section, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleSection(i)}
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                                >
                                    <span className="text-xs font-bold text-blue-500 bg-blue-50 w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <h2 className="flex-1 text-sm font-bold text-slate-900">{section.heading}</h2>
                                    <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${openSections.has(i) ? 'rotate-180' : ''}`} />
                                </button>

                                {openSections.has(i) && (
                                    <div className="border-t border-slate-100 px-5 py-5 space-y-4">
                                        <p className="text-sm text-slate-700 leading-relaxed">{section.content}</p>

                                        {section.code_example && (
                                            <pre className="bg-slate-900 text-slate-100 rounded-xl px-4 py-4 text-xs leading-relaxed overflow-x-auto">
                                                <code>{section.code_example}</code>
                                            </pre>
                                        )}

                                        {section.key_points?.length > 0 && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                                <p className="text-xs font-bold text-blue-700 mb-2">Key Points</p>
                                                <ul className="space-y-1.5">
                                                    {section.key_points.map((pt, j) => (
                                                        <li key={j} className="text-xs text-blue-800 flex items-start gap-2">
                                                            <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span>
                                                            {pt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {(section.resources?.length ?? 0) > 0 && (
                                            <div className="space-y-2">
                                                {section.resources?.map((r, j) => (
                                                    <a key={j} href={r.url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all group">
                                                        <span className="flex-1 truncate">{r.title}</span>
                                                        <ExternalLink size={11} className="flex-shrink-0 text-slate-400" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary + next steps */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-indigo-900 mb-2">Summary</h3>
                        <p className="text-sm text-indigo-800 leading-relaxed mb-4">{guide.summary}</p>
                        {guide.next_steps?.length > 0 && (
                            <>
                                <h4 className="text-xs font-bold text-indigo-700 mb-2">What to learn next</h4>
                                <div className="flex flex-wrap gap-2">
                                    {guide.next_steps.map((step, i) => (
                                        <button key={i} onClick={() => { setGuide(null); setTopic(step); }}
                                            className="px-3 py-1.5 bg-white text-xs font-semibold text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                                            {step} →
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                            <BookText size={28} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Writing your guide…</h3>
                        <p className="text-sm text-slate-500">AI is creating a detailed guide on <strong>{topic}</strong></p>
                        <div className="flex justify-center gap-1 mt-4">
                            {[0, 150, 300].map(d => (
                                <div key={d} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
