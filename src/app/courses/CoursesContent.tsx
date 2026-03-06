'use client';

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
    if (type === 'exercise') return <Code2 size={12} className="text-emerald-500" />;
    if (type === 'quiz') return <HelpCircle size={12} className="text-amber-500" />;
    if (type === 'video') return <Play size={12} className="text-red-500" />;
    return <FileText size={12} className="text-blue-500" />;
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
            <div className="min-h-screen bg-slate-50">
                <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 sticky top-0 z-20">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <ArrowLeft size={18} className="text-slate-600" />
                        </Link>
                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                            <GraduationCap size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900">AI Course Generator</h1>
                            <p className="text-xs text-slate-400">Enter a topic — AI builds a full structured course</p>
                        </div>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate a Course</h2>
                        <p className="text-slate-500 text-sm">Type any topic — AI creates chapters, lessons &amp; content instantly.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                            What do you want to learn?
                        </label>
                        <div className="flex gap-2 mb-5">
                            <input
                                value={form.topic}
                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') debouncedGenerate(); }}
                                placeholder="e.g. SQL for Beginners, Python, React..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                            />
                            <button
                                onClick={generate}
                                disabled={!form.topic.trim() || loading}
                                className="px-5 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
                                <select
                                    value={form.difficulty}
                                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Chapters</label>
                                <select
                                    value={form.num_modules}
                                    onChange={e => setForm(f => ({ ...f, num_modules: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                                >
                                    {['3', '4', '5', '6', '7', '8'].map(n => (
                                        <option key={n} value={n}>{n} chapters</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>
                    )}

                    {history.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <History size={13} className="text-slate-400" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Courses</p>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {history.map(item => (
                                    <div key={item.id} className="flex-shrink-0 w-48 p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-violet-300 hover:bg-violet-50 transition-all group cursor-pointer"
                                        onClick={() => loadFromHistory(item)}>
                                        <p className="text-xs font-bold text-slate-800 truncate mb-1 leading-snug">{item.title}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteHistory(item.id); }}
                                            className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={10} /> Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Popular topics</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR.map(t => (
                            <button
                                key={t}
                                onClick={() => setForm(f => ({ ...f, topic: t }))}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                                <Sparkles size={28} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Building your course...</h3>
                            <p className="text-sm text-slate-500">Generating chapters &amp; lessons for <strong>{form.topic}</strong></p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* — Course viewer — */
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top bar */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20">
                <div className="max-w-screen-xl mx-auto flex items-center gap-3">
                    <button onClick={() => setCourse(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-bold text-slate-900 truncate">{course.course_title}</h1>
                        <p className="text-xs text-slate-400 capitalize">{course.difficulty} &middot; {course.modules.length} chapters &middot; {totalLessons} lessons</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-xs text-slate-500">{doneCount}/{totalLessons} done</div>
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-violet-600">{progress}%</span>
                    </div>
                    <button
                        onClick={() => { setCourse(null); setActiveLesson(null); setDone(new Set()); }}
                        className="ml-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw size={13} /> New
                    </button>
                </div>
            </header>

            <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
                {/* Left sidebar: Curriculum */}
                <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto sticky top-[57px] h-[calc(100vh-57px)]">
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock size={11} />{Math.round(course.total_duration_minutes / 60)}h total</span>
                            <span className="flex items-center gap-1"><Layers size={11} />{course.modules.length} chapters</span>
                            <span className="flex items-center gap-1"><BookOpen size={11} />{totalLessons} lessons</span>
                            <span className="capitalize px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full font-semibold">{course.difficulty}</span>
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
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors"
                                    >
                                        {isOpen
                                            ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                                            : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{mi + 1}. {mod.title}</p>
                                            <p className="text-[10px] text-slate-400">{moduleDone}/{mod.lessons.length} lessons</p>
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <div className="ml-5 border-l border-slate-100 pl-2 mt-0.5 space-y-0.5">
                                            {mod.lessons.map((lesson, li) => {
                                                const k = lessonKey(mi, li);
                                                const isDone = done.has(k);
                                                const isActive = activeLesson?.moduleIdx === mi && activeLesson?.lessonIdx === li;
                                                return (
                                                    <button
                                                        key={li}
                                                        onClick={() => setActiveLesson({ moduleIdx: mi, lessonIdx: li })}
                                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs ${isActive
                                                            ? 'bg-violet-50 text-violet-800 font-semibold'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <LessonIcon type={lesson.type} />
                                                        <span className="flex-1 truncate leading-snug">{lesson.title}</span>
                                                        {isDone && <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
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
                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                    <span className="font-semibold text-slate-600">{course.modules[activeLesson.moduleIdx].title}</span>
                                    <ChevronRight size={12} />
                                    <span>Lesson {activeLesson.lessonIdx + 1}</span>
                                    <span className="flex items-center gap-1 ml-auto"><Clock size={11} />{active.duration_minutes} min read</span>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">{active.title}</h2>
                                <p className="text-slate-500 text-sm">{active.description}</p>
                            </div>

                            <div className="mb-8 leading-relaxed">
                                {active.content.split('\n\n').map((para, i) => (
                                    <p key={i} className="mb-4 text-slate-700 leading-7">{para}</p>
                                ))}
                            </div>

                            {active.resources?.length > 0 && (
                                <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Further Reading</h4>
                                    <div className="space-y-2">
                                        {active.resources.map((r, i) => (
                                            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 font-medium">
                                                <ExternalLink size={13} className="flex-shrink-0" />
                                                {r.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                                <button
                                    onClick={() => toggleDone(activeLesson.moduleIdx, activeLesson.lessonIdx)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${done.has(lessonKey(activeLesson.moduleIdx, activeLesson.lessonIdx))
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                        : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700'
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
                                    if (!next) return <span className="text-xs text-slate-400">Last lesson</span>;
                                    return (
                                        <button
                                            onClick={() => {
                                                setActiveLesson({ moduleIdx: next.mi, lessonIdx: next.li });
                                                if (!openModules.has(next.mi)) toggleModule(next.mi);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
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
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{course.course_title}</h2>
                            <p className="text-slate-500 mb-6 leading-relaxed">{course.course_description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                {[
                                    { icon: <Target size={16} className="text-violet-500" />, label: 'Audience', value: course.target_audience },
                                    { icon: <Clock size={16} className="text-blue-500" />, label: 'Duration', value: `${Math.round(course.total_duration_minutes / 60)}h total` },
                                    { icon: <Layers size={16} className="text-emerald-500" />, label: 'Chapters', value: `${course.modules.length} chapters, ${totalLessons} lessons` },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500 font-medium">{label}</span></div>
                                        <p className="text-sm font-semibold text-slate-800">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {course.learning_outcomes?.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-base font-bold text-slate-900 mb-3">What you will learn</h3>
                                    <ul className="space-y-2">
                                        {course.learning_outcomes.map((o, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                {o}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {course.prerequisites?.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-base font-bold text-slate-900 mb-2">Prerequisites</h3>
                                    <ul className="space-y-1 list-disc list-inside">
                                        {course.prerequisites.map((p, i) => (
                                            <li key={i} className="text-sm text-slate-600">{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={() => setActiveLesson({ moduleIdx: 0, lessonIdx: 0 })}
                                className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
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
