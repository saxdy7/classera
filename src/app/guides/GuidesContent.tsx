'use client';

import { AIToolShell } from '@/components/shared/AIToolShell';
import { useState, useEffect } from 'react';
import { Sparkles, BookText, ArrowLeft, Loader2, Clock, ExternalLink, ChevronDown, History, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useDebouncedCallback } from '@/hooks/useDebounce';

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

interface HistoryItem { id: string; title: string; created_at: string; data: GeneratedGuide; }

export function GuidesContent() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [loading, setLoading] = useState(false);
    const [guide, setGuide] = useState<GeneratedGuide | null>(null);
    const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
    const [error, setError] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history?type=guide');
            if (res.ok) setHistory(await res.json());
        } catch { /* silent */ }
    };

    const saveHistory = async (generated: GeneratedGuide) => {
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'guide', title: generated.guide_title, data: generated }),
            });
            fetchHistory();
        } catch { /* silent */ }
    };

    const deleteHistory = async (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
        await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    };

    const loadFromHistory = (item: HistoryItem) => {
        setGuide(item.data);
        setOpenSections(new Set([0]));
    };

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
            saveHistory(data);
            window.dispatchEvent(new Event('tokens-updated'));
        } catch (e: any) {
            setError(e.message || 'Failed to generate guide. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Debounced: prevents accidental double-submits from fast Enter presses
    const debouncedGenerate = useDebouncedCallback(generate, 400);

    const toggleSection = (i: number) => {
        setOpenSections(prev => {
            const n = new Set(prev);
            n.has(i) ? n.delete(i) : n.add(i);
            return n;
        });
    };

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="bg-card border-b border-border px-4 md:px-8 py-4 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <ArrowLeft size={18} className="text-foreground/80" />
                    </Link>
                    <div className="w-8 h-8 rounded-lg bg-accent-purple flex items-center justify-center">
                        <BookText size={15} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-foreground">AI Guide Generator</h1>
                        <p className="text-xs text-muted-foreground">Generate focused learning guides on any topic</p>
                    </div>
                    {guide && (
                        <button
                            onClick={() => { setGuide(null); setTopic(''); }}
                            className="ml-auto rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            Back to form
                        </button>
                    )}
                </div>
            </header>

            {/* Two-pane shell shared with the AI Career Coach: history rail on the
                left, working surface on the right. */}
            <AIToolShell
                newLabel="New Guide"
                onNew={() => { setGuide(null); setError(''); setTopic(''); }}
                history={history.map(h => ({ id: h.id, title: h.title, createdAt: h.created_at }))}
                activeId={null}
                onDelete={deleteHistory}
                onSelect={(id) => { const item = history.find(h => h.id === id); if (item) loadFromHistory(item); }}
                historyLabel="Recent Guides"
                emptyLabel="No guides yet. Generate your first one."
            >

            {!guide ? (
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-xl bg-accent-purple flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-semibold text-foreground mb-2">Generate a Guide</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Get a deep, focused guide on any programming concept, tool, or technology — structured, clear, and actionable.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 mb-6">
                        <label className="block text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wider">What do you want explained?</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') debouncedGenerate(); }}
                                placeholder="e.g. How REST APIs work, What is recursion, Docker explained..."
                                className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-info)] focus:border-accent-purple transition-all"
                            />
                            <button onClick={generate} disabled={!topic.trim() || loading}
                                className="px-5 py-3 bg-accent-purple text-white rounded-lg font-semibold text-sm hover:bg-accent-purple disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Depth level</label>
                            <div className="flex gap-2">
                                {['beginner', 'intermediate', 'advanced'].map(d => (
                                    <button key={d} onClick={() => setDifficulty(d)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all
                      ${difficulty === d
                                                ? 'bg-accent-purple text-white border-accent-purple'
                                                : 'bg-card text-foreground/80 border-border hover:border-accent-purple'
                                            }`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-destructive/10 border border-destructive rounded-lg px-4 py-3 text-sm text-destructive mb-6">{error}</div>}


                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Try these topics</p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR.map(t => (
                                <button key={t} onClick={() => setTopic(t)}
                                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground/80 hover:border-accent-purple hover:text-accent-purple hover:bg-accent-purple/10 transition-all">
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
                    <div className="bg-card border border-border rounded-xl p-7 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                ${{ beginner: 'bg-green-500/10 text-green-600', intermediate: 'bg-amber-500/10 text-amber-600', advanced: 'bg-destructive/10 text-destructive' }[guide.difficulty] || 'bg-muted text-foreground/80'}`}>
                                {guide.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                                <Clock size={11} /> {guide.estimated_read_minutes} min read
                            </span>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">{guide.guide_title}</h1>
                        <p className="text-foreground/80 leading-relaxed">{guide.introduction}</p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-3 mb-6">
                        {guide.sections.map((section, i) => (
                            <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSection(i)}
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
                                >
                                    <span className="text-xs font-semibold text-accent-purple bg-accent-purple/10 w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <h2 className="flex-1 text-sm font-semibold text-foreground">{section.heading}</h2>
                                    <ChevronDown size={16} className={`text-muted-foreground/70 flex-shrink-0 transition-transform ${openSections.has(i) ? 'rotate-180' : ''}`} />
                                </button>

                                {openSections.has(i) && (
                                    <div className="border-t border-border px-5 py-5 space-y-4">
                                        <p className="text-sm text-foreground/80 leading-relaxed">{section.content}</p>

                                        {section.code_example && (
                                            <pre className="bg-neutral-900 text-muted-foreground/70 rounded-lg px-4 py-4 text-xs leading-relaxed overflow-x-auto">
                                                <code>{section.code_example}</code>
                                            </pre>
                                        )}

                                        {section.key_points?.length > 0 && (
                                            <div className="bg-accent-purple/10 border border-accent-purple rounded-lg px-4 py-3">
                                                <p className="text-xs font-semibold text-accent-purple mb-2">Key Points</p>
                                                <ul className="space-y-1.5">
                                                    {section.key_points.map((pt, j) => (
                                                        <li key={j} className="text-xs text-accent-purple flex items-start gap-2">
                                                            <span className="text-accent-purple flex-shrink-0 mt-0.5">→</span>
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
                                                        className="flex items-center gap-3 px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-foreground/80 hover:border-accent-purple hover:bg-accent-purple/10 hover:text-accent-purple transition-all group">
                                                        <span className="flex-1 truncate">{r.title}</span>
                                                        <ExternalLink size={11} className="flex-shrink-0 text-muted-foreground/70" />
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
                    <div className="bg-accent-purple/10 border border-accent-purple rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-accent-purple mb-2">Summary</h3>
                        <p className="text-sm text-accent-purple leading-relaxed mb-4">{guide.summary}</p>
                        {guide.next_steps?.length > 0 && (
                            <>
                                <h4 className="text-xs font-semibold text-accent-purple mb-2">What to learn next</h4>
                                <div className="flex flex-wrap gap-2">
                                    {guide.next_steps.map((step, i) => (
                                        <button key={i} onClick={() => { setGuide(null); setTopic(step); }}
                                            className="px-3 py-1.5 bg-card text-xs font-semibold text-accent-purple rounded-lg border border-accent-purple hover:bg-primary hover:text-white hover:border-accent-purple transition-all">
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
                <div className="fixed inset-0 bg-[rgba(255,255,255,0.8)] backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-xl bg-accent-purple flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <BookText size={28} className="text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Writing your guide…</h3>
                        <p className="text-sm text-muted-foreground">AI is creating a detailed guide on <strong>{topic}</strong></p>
                        <div className="flex justify-center gap-1 mt-4">
                            {[0, 150, 300].map(d => (
                                <div key={d} className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            </AIToolShell>
        </div>
    );
}
