'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Upload } from 'lucide-react';
import Link from 'next/link';

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface Lesson {
    id: string;
    title: string;
    videoUrl: string;
    duration: number;
}

interface Props {
    profile: any;
}

export function CourseBuilderClient({ profile }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'Beginner',
        course_type: 'free',
        price: 0,
        duration_hours: 10,
        thumbnail_url: '',
        skills: [] as string[],
    });

    const [modules, setModules] = useState<Module[]>([]);
    const [newSkill, setNewSkill] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Create the course
            const response = await fetch('/api/mentor/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create course');
            }

            const { course } = await response.json();

            // Create modules and lessons if any
            for (const module of modules) {
                const moduleRes = await fetch(`/api/mentor/courses/${course.id}/modules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: module.title, order_index: modules.indexOf(module) })
                });

                if (moduleRes.ok) {
                    const { module: createdModule } = await moduleRes.json();

                    for (const lesson of module.lessons) {
                        await fetch(`/api/mentor/courses/${course.id}/lessons`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                module_id: createdModule.id,
                                title: lesson.title,
                                video_url: lesson.videoUrl,
                                duration_minutes: lesson.duration,
                                order_index: module.lessons.indexOf(lesson)
                            })
                        });
                    }
                }
            }

            router.push(`/dashboard/mentor/courses/${course.id}`);
        } catch (error: any) {
            console.error('Error creating course:', error);
            alert(error.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const addModule = () => {
        setModules(prev => [...prev, {
            id: `mod_${Date.now()}`,
            title: `Module ${prev.length + 1}`,
            lessons: []
        }]);
    };

    const addLesson = (moduleId: string) => {
        setModules(prev => prev.map(m => {
            if (m.id === moduleId) {
                return {
                    ...m,
                    lessons: [...m.lessons, {
                        id: `les_${Date.now()}`,
                        title: `Lesson ${m.lessons.length + 1}`,
                        videoUrl: '',
                        duration: 10
                    }]
                };
            }
            return m;
        }));
    };

    const updateModule = (moduleId: string, title: string) => {
        setModules(prev => prev.map(m => m.id === moduleId ? { ...m, title } : m));
    };

    const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
        setModules(prev => prev.map(m => {
            if (m.id === moduleId) {
                return {
                    ...m,
                    lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
                };
            }
            return m;
        }));
    };

    const removeModule = (moduleId: string) => {
        setModules(prev => prev.filter(m => m.id !== moduleId));
    };

    const removeLesson = (moduleId: string, lessonId: string) => {
        setModules(prev => prev.map(m => {
            if (m.id === moduleId) {
                return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
            }
            return m;
        }));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header profile={profile} />
            <div className="flex">
                <Sidebar role="mentor" />
                <main className="flex-1 p-4 md:p-8 md:ml-24">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            href="/dashboard/mentor/courses"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Courses
                        </Link>

                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Course</h1>
                        <p className="text-slate-600 mb-8">Build your course content and curriculum</p>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-4 mb-8">
                            {[1, 2, 3].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStep(s)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${step === s
                                            ? 'bg-indigo-500 text-white'
                                            : step > s
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                                        {step > s ? '✓' : s}
                                    </span>
                                    {s === 1 ? 'Basic Info' : s === 2 ? 'Curriculum' : 'Review'}
                                </button>
                            ))}
                        </div>

                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Course Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Complete React.js Course"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What will students learn in this course?"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Level</label>
                                        <select
                                            value={formData.level}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Duration (hours)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.duration_hours}
                                            onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Course Type</label>
                                        <select
                                            value={formData.course_type}
                                            onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="free">Free</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>

                                    {formData.course_type === 'paid' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Price ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Thumbnail URL</label>
                                    <input
                                        type="url"
                                        value={formData.thumbnail_url}
                                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                            placeholder="Add a skill"
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            onClick={addSkill}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
                                                {skill}
                                                <button onClick={() => removeSkill(skill)} className="hover:text-indigo-900">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.title}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    Continue to Curriculum →
                                </button>
                            </div>
                        )}

                        {/* Step 2: Curriculum */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-slate-900">Course Curriculum</h2>
                                        <button
                                            onClick={addModule}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Module
                                        </button>
                                    </div>

                                    {modules.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <p className="mb-4">No modules yet. Add your first module to get started.</p>
                                            <button
                                                onClick={addModule}
                                                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                <Plus className="w-4 h-4 inline mr-2" />
                                                Add Module
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {modules.map((module, moduleIndex) => (
                                                <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                                    <div className="bg-slate-50 p-4 flex items-center gap-4">
                                                        <GripVertical className="w-5 h-5 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={module.title}
                                                            onChange={(e) => updateModule(module.id, e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <button
                                                            onClick={() => addLesson(module.id)}
                                                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                                                        >
                                                            + Lesson
                                                        </button>
                                                        <button
                                                            onClick={() => removeModule(module.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {module.lessons.length > 0 && (
                                                        <div className="p-4 space-y-3">
                                                            {module.lessons.map((lesson, lessonIndex) => (
                                                                <div key={lesson.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
                                                                    <span className="text-sm text-slate-400 w-6">{lessonIndex + 1}.</span>
                                                                    <input
                                                                        type="text"
                                                                        value={lesson.title}
                                                                        onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                                                                        placeholder="Lesson title"
                                                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    />
                                                                    <input
                                                                        type="url"
                                                                        value={lesson.videoUrl}
                                                                        onChange={(e) => updateLesson(module.id, lesson.id, { videoUrl: e.target.value })}
                                                                        placeholder="Video URL"
                                                                        className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={lesson.duration}
                                                                        onChange={(e) => updateLesson(module.id, lesson.id, { duration: parseInt(e.target.value) })}
                                                                        placeholder="mins"
                                                                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    />
                                                                    <button
                                                                        onClick={() => removeLesson(module.id, lesson.id)}
                                                                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Review & Publish →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6">Review Course</h2>

                                    <div className="space-y-4">
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Title</span>
                                            <span className="font-medium">{formData.title}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Level</span>
                                            <span className="font-medium">{formData.level}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Duration</span>
                                            <span className="font-medium">{formData.duration_hours} hours</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Price</span>
                                            <span className="font-medium">{formData.course_type === 'free' ? 'Free' : `$${formData.price}`}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Modules</span>
                                            <span className="font-medium">{modules.length}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Lessons</span>
                                            <span className="font-medium">{modules.reduce((sum, m) => sum + m.lessons.length, 0)}</span>
                                        </div>
                                        {formData.skills.length > 0 && (
                                            <div className="py-2">
                                                <span className="text-slate-600 block mb-2">Skills</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.skills.map(skill => (
                                                        <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !formData.title}
                                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Creating...' : 'Create Course'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
