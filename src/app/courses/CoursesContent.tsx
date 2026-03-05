'use client';

import { useState } from 'react';
import {
    Sparkles, GraduationCap, ChevronDown, ChevronRight,
    ArrowLeft, Loader2, BookOpen, Clock, CheckCircle2,
    ExternalLink, PlayCircle, FileText
} from 'lucide-react';
import Link from 'next/link';

interface Lesson {
    title: string;
    description: string;
    duration_minutes: number;
    type: 'video' | 'reading' | 'exercise' | 'quiz';
    content: string;
    resources?: { title: string; url: string }[];
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

const POPULAR = [
    'Python for Beginners', 'React.js Fundamentals', 'System Design',
    'Machine Learning Basics', 'SQL & Databases', 'Docker & Kubernetes',
];

const LESSON_ICON: Record<string, any> = {
    video: PlayCircle, reading: FileText, exercise: BookOpen, quiz: CheckCircle2,
};
const LESSON_COLOR: Record<string, string> = {
    video: 'text-blue-500', reading: 'text-slate-500', exercise: 'text-emerald-500', quiz: 'text-amber-500',
};

export function CoursesContent() {
    const [form, setForm] = useState({ topic: '', difficulty: 'beginner', modules: '5' });
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState<GeneratedCourse | null>(null);
    const [expandedModule, setExpandedModule] = useState<number | null>(0);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [doneLessons, setDoneLessons] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');

    const generate = async () => {
        if (!form.topic.trim()) return;
        setLoading(true);
        setError('');
        setCourse(null);
        setSelectedLesson(null);
        setDoneLessons(new Set());

        try {
            const res = await fetch('/api/ai/generate-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: form.topic, difficulty: form.difficulty, num_modules: parseInt(form.modules) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setCourse(data);
            setExpandedModule(0);
        } catch (e: any) {
            setError(e.message || 'Failed to generate course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totalLessons = course?.modules.reduce((a, m) => a + m.lessons.length, 0) || 0;
    const doneCount = doneLessons.size;
    const progress = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;

    const toggleLesson = (key: string) => {
        setDoneLessons(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <GraduationCap size={15} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">AI Course Generator</h1>
                        <p className="text-xs text-slate-400">Generate structured courses on any topic</p>
                    </div>
                    {course && (
                        <button onClick={() => { setCourse(null); setForm({ topic: '', difficulty: 'beginner', modules: '5' }); }}
                            className="ml-auto text-xs text-emerald-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                            ← New Course
                        </button>
                    )}
                </div>
            </header>

            {!course ? (
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate a Course</h2>
                        <p className="text-slate-500">Type any subject — AI will create a complete structured course with lessons, exercises, and resources.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">What do you want to learn?</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={form.topic}
                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') generate(); }}
                                placeholder="e.g. Python for Data Science, React.js, System Design..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                            />
                            <button onClick={generate} disabled={!form.topic.trim() || loading}
                                className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Generate
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
                                <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-white">
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Number of modules</label>
                                <select value={form.modules} onChange={e => setForm(f => ({ ...f, modules: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-white">
                                    {['3', '4', '5', '6', '8', '10'].map(n => <option key={n} value={n}>{n} modules</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>}

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Popular topics</p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR.map(t => (
                                <button key={t} onClick={() => setForm(f => ({ ...f, topic: t }))}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
                    {/* Left: curriculum */}
                    <div className={`${selectedLesson ? 'hidden md:block md:w-96 flex-shrink-0' : 'flex-1'}`}>
                        {/* Course header card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <GraduationCap size={20} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-bold text-slate-900 mb-0.5">{course.course_title}</h2>
                                    <p className="text-xs text-slate-500 line-clamp-2">{course.course_description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pb-3 border-b border-slate-100">
                                <span className="capitalize bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{course.difficulty}</span>
                                <span className="flex items-center gap-1"><BookOpen size={11} /> {totalLessons} lessons</span>
                                <span className="flex items-center gap-1"><Clock size={11} /> {Math.round(course.total_duration_minutes / 60)}h total</span>
                            </div>
                            {/* Progress */}
                            <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Progress</span>
                                    <span className="font-semibold text-emerald-600">{doneCount}/{totalLessons}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            {/* Outcomes */}
                            {course.learning_outcomes?.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {course.learning_outcomes.slice(0, 3).map((o, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                            {o}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modules */}
                        <div className="space-y-2">
                            {course.modules.map((mod, mi) => (
                                <div key={mi} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedModule(expandedModule === mi ? null : mi)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                            M{String(mi + 1).padStart(2, '0')}
                                        </span>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{mod.title}</p>
                                            <p className="text-xs text-slate-400">{mod.lessons.length} lessons</p>
                                        </div>
                                        {expandedModule === mi
                                            ? <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />
                                            : <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
                                        }
                                    </button>

                                    {expandedModule === mi && (
                                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                                            {mod.lessons.map((lesson, li) => {
                                                const key = `${mi}-${li}`;
                                                const done = doneLessons.has(key);
                                                const isSelected = selectedLesson?.title === lesson.title;
                                                const LIcon = LESSON_ICON[lesson.type] || FileText;
                                                return (
                                                    <div key={li}
                                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                              ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                                        onClick={() => setSelectedLesson(isSelected ? null : lesson)}
                                                    >
                                                        <button onClick={e => { e.stopPropagation(); toggleLesson(key); }} className="flex-shrink-0">
                                                            {done
                                                                ? <CheckCircle2 size={16} className="text-emerald-500" />
                                                                : <div className="w-4 h-4 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />}
                                                        </button>
                                                        <LIcon size={14} className={`flex-shrink-0 ${LESSON_COLOR[lesson.type] || 'text-slate-400'}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                                {lesson.title}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 flex-shrink-0">{lesson.duration_minutes}m</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: lesson detail */}
                    {selectedLesson && (
                        <div className="flex-1 min-w-0">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-20">
                                <button onClick={() => setSelectedLesson(null)}
                                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-5 md:hidden transition-colors">
                                    <ArrowLeft size={14} /> Back
                                </button>

                                <div className="flex items-center gap-2 mb-1">
                                    {(() => {
                                        const LIcon = LESSON_ICON[selectedLesson.type] || FileText;
                                        return <LIcon size={16} className={LESSON_COLOR[selectedLesson.type]} />;
                                    })()}
                                    <span className="text-xs text-slate-500 capitalize">{selectedLesson.type}</span>
                                    <span className="text-xs text-slate-300">·</span>
                                    <span className="text-xs text-slate-500">{selectedLesson.duration_minutes} min</span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-3">{selectedLesson.title}</h3>
                                <p className="text-sm text-slate-600 mb-5">{selectedLesson.description}</p>

                                <div className="prose prose-sm text-slate-700 leading-relaxed space-y-3 mb-6">
                                    {selectedLesson.content.split('\n\n').map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </div>

                                {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resources</h4>
                                        <div className="space-y-2">
                                            {selectedLesson.resources.map((r, i) => (
                                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                                                    <span className="flex-1 text-sm text-slate-700 group-hover:text-emerald-700 truncate">{r.title}</span>
                                                    <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                            <GraduationCap size={28} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Generating your course…</h3>
                        <p className="text-sm text-slate-500">Building <strong>{form.topic}</strong> curriculum with modules & lessons</p>
                        <div className="flex justify-center gap-1 mt-4">
                            {[0, 150, 300].map(d => (
                                <div key={d} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
