'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { QuestionBuilder } from '@/components/tests/QuestionBuilder';
import { ArrowLeft, Save, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Props {
    profile: any;
    test: any;
}

export interface TestQuestion {
    id: string;
    question: string;
    type: 'mcq' | 'descriptive' | 'short_answer';
    options?: string[];
    correctAnswer?: number | string;
    marks: number;
    explanation?: string;
}

export function TestEditClient({ profile, test: initialTest }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        title: initialTest.title || '',
        description: initialTest.description || '',
        test_type: initialTest.test_type || 'individual',
        duration_minutes: initialTest.duration_minutes || 60,
        scheduled_at: initialTest.scheduled_at ? new Date(initialTest.scheduled_at).toISOString().slice(0, 16) : '',
        enable_screen_recording: initialTest.proctoring_settings?.screen_recording ?? true,
        enable_face_monitoring: initialTest.proctoring_settings?.face_monitoring ?? true,
        randomize_questions: initialTest.settings?.randomize_questions ?? false,
        show_results_immediately: initialTest.settings?.show_results_immediately ?? true,
        allow_review: initialTest.settings?.allow_review ?? true,
        passing_percentage: initialTest.settings?.passing_percentage ?? 60,
        enable_anti_cheat: initialTest.settings?.enable_anti_cheat ?? false,
        proctoring_enabled: initialTest.proctoring_enabled ?? false,
    });
    const [questions, setQuestions] = useState<TestQuestion[]>(
        (initialTest.questions || []).map((q: any, i: number) => ({
            id: q.id || `q_${i}`,
            question: q.question || q.text || '',
            type: q.type || 'mcq',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer ?? 0,
            marks: q.marks || 1,
            explanation: q.explanation || '',
        }))
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const total_marks = questions.reduce((sum, q) => sum + q.marks, 0);

            const response = await fetch('/api/tests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: initialTest.id,
                    title: formData.title,
                    description: formData.description,
                    test_type: formData.test_type,
                    duration_minutes: formData.duration_minutes,
                    scheduled_at: formData.scheduled_at || null,
                    total_marks,
                    questions,
                    proctoring_enabled: formData.proctoring_enabled,
                    proctoring_settings: {
                        screen_recording: formData.enable_screen_recording,
                        face_monitoring: formData.enable_face_monitoring,
                    },
                    settings: {
                        randomize_questions: formData.randomize_questions,
                        show_results_immediately: formData.show_results_immediately,
                        allow_review: formData.allow_review,
                        passing_percentage: formData.passing_percentage,
                        enable_anti_cheat: formData.enable_anti_cheat,
                    },
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update test');
            }

            router.push(`/dashboard/mentor/tests/${initialTest.id}`);
        } catch (error: any) {
            console.error('Error updating test:', error);
            alert(error.message || 'Failed to update test. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = async () => {
        setLoading(true);
        try {
            const total_marks = questions.reduce((sum, q) => sum + q.marks, 0);

            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${formData.title} (Copy)`,
                    description: formData.description,
                    test_type: formData.test_type,
                    duration_minutes: formData.duration_minutes,
                    scheduled_at: null,
                    question_type: 'mixed',
                    total_marks,
                    questions,
                    proctoring_settings: {
                        screen_recording: formData.enable_screen_recording,
                        face_monitoring: formData.enable_face_monitoring,
                    },
                    settings: {
                        randomize_questions: formData.randomize_questions,
                        show_results_immediately: formData.show_results_immediately,
                        allow_review: formData.allow_review,
                        passing_percentage: formData.passing_percentage,
                    },
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to duplicate test');
            }

            router.push(`/dashboard/mentor/tests/${data.test.id}`);
        } catch (error: any) {
            console.error('Error duplicating test:', error);
            alert(error.message || 'Failed to duplicate test. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/tests?id=${initialTest.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete test');
            }

            router.push('/dashboard/mentor/tests');
        } catch (error: any) {
            console.error('Error deleting test:', error);
            alert(error.message || 'Failed to delete test. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const total_marks = questions.reduce((sum, q) => sum + q.marks, 0);
    const isValid = formData.title && questions.length > 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <Header profile={profile} />
            <div className="flex">
                <Sidebar role="mentor" />
                <main className="flex-1 p-4 md:p-8 md:ml-24">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <Link
                                href={`/dashboard/mentor/tests/${initialTest.id}`}
                                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Test
                            </Link>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDuplicate}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Test</h1>
                        <p className="text-slate-600 mb-8">Modify your test settings and questions</p>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Info */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900 mb-4">Basic Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Test Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Mathematics Mid-term Exam"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Optional description..."
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Duration (minutes) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={formData.duration_minutes}
                                                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Schedule Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduled_at}
                                                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Passing Percentage
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.passing_percentage}
                                            onChange={(e) => setFormData({ ...formData, passing_percentage: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Test Settings */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900 mb-4">Test Settings</h2>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.randomize_questions}
                                            onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Randomize Questions</span>
                                            <p className="text-xs text-slate-500">Each student gets questions in a different order</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.show_results_immediately}
                                            onChange={(e) => setFormData({ ...formData, show_results_immediately: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Show Results Immediately</span>
                                            <p className="text-xs text-slate-500">Students see results right after submission</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.allow_review}
                                            onChange={(e) => setFormData({ ...formData, allow_review: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Allow Question Review</span>
                                            <p className="text-xs text-slate-500">Students can review correct answers after submission</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Proctoring Settings */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900 mb-4">Proctoring & Anti-Cheat Settings</h2>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.proctoring_enabled}
                                            onChange={(e) => setFormData({ ...formData, proctoring_enabled: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Enable Proctoring</span>
                                            <p className="text-xs text-slate-500">Video monitoring and recording during test</p>
                                        </div>
                                    </label>

                                    {formData.proctoring_enabled && (
                                        <>
                                            <label className="flex items-center gap-3 ml-6">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.enable_screen_recording}
                                                    onChange={(e) => setFormData({ ...formData, enable_screen_recording: e.target.checked })}
                                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Screen Recording</span>
                                            </label>

                                            <label className="flex items-center gap-3 ml-6">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.enable_face_monitoring}
                                                    onChange={(e) => setFormData({ ...formData, enable_face_monitoring: e.target.checked })}
                                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Face Monitoring</span>
                                            </label>
                                        </>
                                    )}

                                    <div className="border-t border-slate-200 pt-3 mt-3">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.enable_anti_cheat}
                                                onChange={(e) => setFormData({ ...formData, enable_anti_cheat: e.target.checked })}
                                                className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700">Enable Anti-Cheat Protection</span>
                                                <p className="text-xs text-slate-500">Block copy/paste, detect tab switches, prevent right-click</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Questions */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-slate-900">Questions</h2>
                                    <span className="text-sm text-slate-600">
                                        Total Marks: <span className="font-bold text-indigo-600">{total_marks}</span>
                                    </span>
                                </div>

                                <QuestionBuilder questions={questions} onChange={setQuestions} />
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{questions.length} questions</p>
                                    <p className="text-xs text-slate-500">Total: {total_marks} marks</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!isValid || loading}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
