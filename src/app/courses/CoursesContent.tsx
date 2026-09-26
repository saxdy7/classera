'use client';

import { AIToolShell } from '@/components/shared/AIToolShell';
import { useState, useEffect } from 'react';
import {
    Sparkles, BookOpen, ArrowLeft, Loader2, Clock, CheckCircle2,
    Circle, ChevronDown, ChevronRight, GraduationCap, RotateCcw,
    ExternalLink, Target, Layers, Play, FileText, Code2, HelpCircle, History, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useDebouncedCallback } from '@/hooks/useDebounce';

/* ─── Types ──────────────────────────────────────────────── */
interface Lesson {
    title: string;
    description: string;
    duration_minutes: number;
    type: 'video' | 'reading' | 'exercise' | 'quiz';
    content: string;
    resources: { title: string; url: string }[];
}
interface Module {
    title: string;
    description: string;
    lessons: Lesson[];
}
interface GeneratedCourse {
    course_title: string;
    course_description: string;
    difficulty: string;
    total_duration_minutes: number;
    target_audience: string;
    prerequisites: string[];
    learning_outcomes: string[];
    modules: Module[];
}

/* ─── Popular course topics ──────────────────────────────── */
const POPULAR = [
    'SQL for Beginners', 'Python Fundamentals', 'React & Next.js',
    'Node.js Backend Development', 'Data Structures & Algorithms',
    'Machine Learning Basics', 'Docker & Kubernetes', 'TypeScript Deep Dive',
    'System Design', 'Git & GitHub',
];

/* ─── Lesson type icon ───────────────────────────────────── */
function LessonIcon({ type }: { type: string }) {
    if (type === 'exercise') return <Code2 size={12} className="text-green-600" />;
    if (type === 'quiz') return <HelpCircle size={12} className="text-amber-600" />;
    if (type === 'video') return <Play size={12} className="text-destructive" />;
    return <FileText size={12} className="text-accent-purple" />;
}

/* ─── History item type ─────────────────────────────────── */
interface HistoryItem { id: string; title: string; created_at: string; data: GeneratedCourse; }

/* ─── Main component ─────────────────────────────────────── */
export function CoursesContent() {
    const [form, setForm] = useState({ topic: '', difficulty: 'beginner', num_modules: '5' });
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState<GeneratedCourse | null>(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history?type=course');
            if (res.ok) setHistory(await res.json());
        } catch { /* silent */ }
    };

    const saveHistory = async (generated: GeneratedCourse) => {
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'course', title: generated.course_title, data: generated }),
            });
            fetchHistory();
        } catch { /* silent */ }
    };

    const deleteHistory = async (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
        await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    };

    const loadFromHistory = (item: HistoryItem) => {
        setCourse(item.data);
        setActiveLesson({ moduleIdx: 0, lessonIdx: 0 });
        setOpenModules(new Set([0]));
        setDone(new Set());
    };

    /* Navigation */
    const [openModules, setOpenModules] = useState<Set<number>>(new Set([0]));
    const [activeLesson, setActiveLesson] = useState<{ moduleIdx: number; lessonIdx: number } | null>(null);
    const [done, setDone] = useState<Set<string>>(new Set());

    const generate = async () => {
        if (!form.topic.trim()) return;
        setLoading(true); setError(''); setCourse(null); setActiveLesson(null); setDone(new Set());
        setOpenModules(new Set([0]));
        try {
            const res = await fetch('/api/ai/generate-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: form.topic,
                    difficulty: form.difficulty,
                    num_modules: parseInt(form.num_modules),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setCourse(data);
            if (data.modules?.[0]?.lessons?.[0]) {
                setActiveLesson({ moduleIdx: 0, lessonIdx: 0 });
            }
            saveHistory(data);
            window.dispatchEvent(new Event('tokens-updated'));
        } catch (e: any) {
            setError(e.message || 'Failed to generate course.');
        } finally { setLoading(false); }
    };

    // Debounced: prevents accidental double-submits from fast Enter presses
    const debouncedGenerate = useDebouncedCallback(generate, 400);

    const lessonKey = (mi: number, li: number) => `${mi}-${li}`;
    const toggleDone = (mi: number, li: number) => {
        const k = lessonKey(mi, li);
        setDone(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
    };
    const toggleModule = (i: number) => {
        setOpenModules(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
    };

    const allLessons = course?.modules.flatMap((m, mi) => m.lessons.map((l, li) => ({ ...l, mi, li }))) ?? [];
    const totalLessons = allLessons.length;
    const doneCount = done.size;
    const progress = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;
    const active = activeLesson !== null
        ? course?.modules[activeLesson.moduleIdx]?.lessons[activeLesson.lessonIdx]
        : null;

    /* — Generation form — */
    if (!course) {
        return (
            <div className="flex min-h-screen flex-col bg-muted/40">
                <header className="bg-card border-b border-border px-4 md:px-8 py-3.5 sticky top-0 z-20">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <ArrowLeft size={18} className="text-foreground/80" />
                        </Link>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <GraduationCap size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-foreground">AI Course Generator</h1>
                            <p className="text-xs text-muted-foreground/70">Enter a topic — AI builds a full structured course</p>
                        </div>
                    </div>
                </header>

                {/* Two-pane shell shared with the AI Career Coach: history rail
                    left, working surface right. Recent items previously sat in a
                    horizontally-scrolling strip that truncated titles. */}
                <AIToolShell
                    newLabel="New Course"
                    onNew={() => { setCourse(null); setError(''); setForm(f => ({ ...f, topic: '' })); }}
                    history={history.map(h => ({ id: h.id, title: h.title, createdAt: h.created_at }))}
                    activeId={null}
                    onDelete={deleteHistory}
                    onSelect={(id) => { const item = history.find(h => h.id === id); if (item) loadFromHistory(item); }}
                    historyLabel="Recent Courses"
                    emptyLabel="No courses yet. Generate your first one."
                >

                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-semibold text-foreground mb-2">Generate a Course</h2>
                        <p className="text-muted-foreground text-sm">Type any topic — AI creates chapters, lessons &amp; content instantly.</p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 mb-6">
                        <label className="block text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wider">
                            What do you want to learn?
                        </label>
                        <div className="flex gap-2 mb-5">
                            <input
                                value={form.topic}
                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') debouncedGenerate(); }}
                                placeholder="e.g. SQL for Beginners, Python, React..."
                                className="flex-1 px-4 py-3 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent-purple transition-all"
                            />
                            <button
                                onClick={generate}
                                disabled={!form.topic.trim() || loading}
                                className="px-5 py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Difficulty</label>
                                <select
                                    value={form.difficulty}
                                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent-purple bg-card"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Chapters</label>
                                <select
                                    value={form.num_modules}
                                    onChange={e => setForm(f => ({ ...f, num_modules: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent-purple bg-card"
                                >
                                    {['3', '4', '5', '6', '7', '8'].map(n => (
                                        <option key={n} value={n}>{n} chapters</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive rounded-lg px-4 py-3 text-sm text-destructive mb-6">{error}</div>
                    )}


                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Popular topics</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR.map(t => (
                            <button
                                key={t}
                                onClick={() => setForm(f => ({ ...f, topic: t }))}
                                className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground/80 hover:border-accent-purple hover:text-accent-purple hover:bg-accent-purple/10 transition-all"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-[rgba(255,255,255,0.8)] backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Sparkles size={28} className="text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Building your course...</h3>
                            <p className="text-sm text-muted-foreground">Generating chapters &amp; lessons for <strong>{form.topic}</strong></p>
                        </div>
                    </div>
                )}
                </AIToolShell>
            </div>
        );
    }

    /* — Course viewer — */
    return (
        <div className="min-h-screen bg-muted/40 flex flex-col">
            {/* Top bar */}
            <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-20">
                <div className="max-w-screen-xl mx-auto flex items-center gap-3">
                    <button onClick={() => setCourse(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <ArrowLeft size={18} className="text-foreground/80" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold text-foreground truncate">{course.course_title}</h1>
                        <p className="text-xs text-muted-foreground/70 capitalize">{course.difficulty} &middot; {course.modules.length} chapters &middot; {totalLessons} lessons</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">{doneCount}/{totalLessons} done</div>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-accent-purple">{progress}%</span>
                    </div>
                    <button
                        onClick={() => { setCourse(null); setActiveLesson(null); setDone(new Set()); }}
                        className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground/80 px-3 py-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                        <RotateCcw size={13} /> New
                    </button>
                </div>
            </header>

            <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
                {/* Left sidebar: Curriculum */}
                <aside className="w-72 flex-shrink-0 bg-card border-r border-border overflow-y-auto sticky top-[57px] h-[calc(100vh-57px)]">
                    <div className="p-4 border-b border-border">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={11} />{Math.round(course.total_duration_minutes / 60)}h total</span>
                            <span className="flex items-center gap-1"><Layers size={11} />{course.modules.length} chapters</span>
                            <span className="flex items-center gap-1"><BookOpen size={11} />{totalLessons} lessons</span>
                            <span className="capitalize px-2 py-0.5 bg-accent-purple/10 text-accent-purple rounded-full font-semibold">{course.difficulty}</span>
                        </div>
                    </div>
                    <nav className="p-2">
                        {course.modules.map((mod, mi) => {
                            const isOpen = openModules.has(mi);
                            const moduleDone = mod.lessons.filter((_, li) => done.has(lessonKey(mi, li))).length;
                            return (
                                <div key={mi} className="mb-1">
                                    <button
                                        onClick={() => toggleModule(mi)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/40 text-left transition-colors"
                                    >
                                        {isOpen
                                            ? <ChevronDown size={14} className="text-muted-foreground/70 flex-shrink-0" />
                                            : <ChevronRight size={14} className="text-muted-foreground/70 flex-shrink-0" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate">{mi + 1}. {mod.title}</p>
                                            <p className="text-[10px] text-muted-foreground/70">{moduleDone}/{mod.lessons.length} lessons</p>
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <div className="ml-5 border-l border-border pl-2 mt-0.5 space-y-0.5">
                                            {mod.lessons.map((lesson, li) => {
                                                const k = lessonKey(mi, li);
                                                const isDone = done.has(k);
                                                const isActive = activeLesson?.moduleIdx === mi && activeLesson?.lessonIdx === li;
                                                return (
                                                    <button
                                                        key={li}
                                                        onClick={() => setActiveLesson({ moduleIdx: mi, lessonIdx: li })}
                                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs ${isActive
                                                            ? 'bg-accent-purple/10 text-accent-purple font-semibold'
                                                            : 'text-foreground/80 hover:bg-muted/40'
                                                            }`}
                                                    >
                                                        <LessonIcon type={lesson.type} />
                                                        <span className="flex-1 truncate leading-snug">{lesson.title}</span>
                                                        {isDone && <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Right: Lesson content */}
                <main className="flex-1 overflow-y-auto">
                    {active && activeLesson ? (
                        <article className="max-w-3xl mx-auto px-6 py-8">
                            <div className="mb-6">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
                                    <span className="font-semibold text-foreground/80">{course.modules[activeLesson.moduleIdx].title}</span>
                                    <ChevronRight size={12} />
                                    <span>Lesson {activeLesson.lessonIdx + 1}</span>
                                    <span className="flex items-center gap-1 ml-auto"><Clock size={11} />{active.duration_minutes} min read</span>
                                </div>
                                <h2 className="text-2xl font-semibold text-foreground mb-2">{active.title}</h2>
                                <p className="text-muted-foreground text-sm">{active.description}</p>
                            </div>

                            <div className="mb-8 leading-relaxed">
                                {active.content.split('\n\n').map((para, i) => (
                                    <p key={i} className="mb-4 text-foreground/80 leading-7">{para}</p>
                                ))}
                            </div>

                            {active.resources?.length > 0 && (
                                <div className="mb-8 p-4 bg-muted/40 rounded-lg border border-border">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Further Reading</h4>
                                    <div className="space-y-2">
                                        {active.resources.map((r, i) => (
                                            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-accent-purple hover:text-accent-purple font-medium">
                                                <ExternalLink size={13} className="flex-shrink-0" />
                                                {r.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-border">
                                <button
                                    onClick={() => toggleDone(activeLesson.moduleIdx, activeLesson.lessonIdx)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-2 ${done.has(lessonKey(activeLesson.moduleIdx, activeLesson.lessonIdx))
                                        ? 'bg-green-500/10 border-green-600 text-green-600'
                                        : 'border-border text-foreground/80 hover:border-accent-purple hover:text-accent-purple'
                                        }`}
                                >
                                    {done.has(lessonKey(activeLesson.moduleIdx, activeLesson.lessonIdx))
                                        ? <><CheckCircle2 size={16} /> Completed</>
                                        : <><Circle size={16} /> Mark Complete</>
                                    }
                                </button>

                                {(() => {
                                    const current = allLessons.findIndex(l => l.mi === activeLesson.moduleIdx && l.li === activeLesson.lessonIdx);
                                    const next = allLessons[current + 1];
                                    if (!next) return <span className="text-xs text-muted-foreground/70">Last lesson</span>;
                                    return (
                                        <button
                                            onClick={() => {
                                                setActiveLesson({ moduleIdx: next.mi, lessonIdx: next.li });
                                                if (!openModules.has(next.mi)) toggleModule(next.mi);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
                                        >
                                            Next: {next.title.length > 28 ? next.title.slice(0, 28) + '...' : next.title}
                                            <ChevronRight size={15} />
                                        </button>
                                    );
                                })()}
                            </div>
                        </article>
                    ) : (
                        /* Course overview */
                        <div className="max-w-3xl mx-auto px-6 py-8">
                            <h2 className="text-2xl font-semibold text-foreground mb-2">{course.course_title}</h2>
                            <p className="text-muted-foreground mb-6 leading-relaxed">{course.course_description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                {[
                                    { icon: <Target size={16} className="text-accent-purple" />, label: 'Audience', value: course.target_audience },
                                    { icon: <Clock size={16} className="text-accent-purple" />, label: 'Duration', value: `${Math.round(course.total_duration_minutes / 60)}h total` },
                                    { icon: <Layers size={16} className="text-green-600" />, label: 'Chapters', value: `${course.modules.length} chapters, ${totalLessons} lessons` },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="bg-card border border-border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground font-medium">{label}</span></div>
                                        <p className="text-sm font-semibold text-foreground">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {course.learning_outcomes?.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-base font-semibold text-foreground mb-3">What you will learn</h3>
                                    <ul className="space-y-2">
                                        {course.learning_outcomes.map((o, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                <CheckCircle2 size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                                                {o}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {course.prerequisites?.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-base font-semibold text-foreground mb-2">Prerequisites</h3>
                                    <ul className="space-y-1 list-disc list-inside">
                                        {course.prerequisites.map((p, i) => (
                                            <li key={i} className="text-sm text-foreground/80">{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={() => setActiveLesson({ moduleIdx: 0, lessonIdx: 0 })}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary transition-colors"
                            >
                                <Play size={16} /> Start Learning
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
