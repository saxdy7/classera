'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { QuestionBuilder, TestQuestion } from '@/components/tests/QuestionBuilder';
import { QuestionBankSelector } from '@/components/tests/QuestionBankSelector';
import { TestTemplates } from '@/components/tests/TestTemplates';
import { ArrowLeft, Save, Shuffle, Shield } from 'lucide-react';
import Link from 'next/link';

interface Props {
    profile: any;
}

export function TestCreateClient({ profile }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        test_type: 'individual',
        duration_minutes: 60,
        scheduled_at: '',
        enable_screen_recording: true,
        enable_face_monitoring: true,
        randomize_questions: false,
        show_results_immediately: true,
        allow_review: true,
        passing_percentage: 60,
        enable_anti_cheat: true,
    });
    const [questions, setQuestions] = useState<TestQuestion[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const total_marks = questions.reduce((sum, q) => sum + q.marks, 0);

            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    test_type: formData.test_type,
                    duration_minutes: formData.duration_minutes,
                    scheduled_at: formData.scheduled_at || null,
                    question_type: 'mixed',
                    total_marks,
                    questions,
                    proctoring_settings: {
                        screen_recording: formData.enable_screen_recording,
                        face_monitoring: formData.enable_face_monitoring,
                        anti_cheat: formData.enable_anti_cheat,
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
                throw new Error(data.error || 'Failed to create test');
            }

            router.push(`/dashboard/mentor/tests/${data.test.id}`);
        } catch (error: any) {
            console.error('Error creating test:', error);
            alert(error.message || 'Failed to create test. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (template: any) => {
        setFormData(prev => ({
            ...prev,
            title: template.name,
            description: template.description,
            duration_minutes: template.duration_minutes,
            randomize_questions: template.settings.randomize_questions,
            show_results_immediately: template.settings.show_results_immediately,
            allow_review: template.settings.allow_review,
            passing_percentage: template.settings.passing_percentage,
        }));
        setQuestions(template.questions.map((q: any, i: number) => ({
            id: `template_${i}_${Date.now()}`,
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
        })));
    };

    const handleImportFromBank = (importedQuestions: TestQuestion[]) => {
        setQuestions(prev => [...prev, ...importedQuestions]);
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
                        <Link
                            href="/dashboard/mentor/tests"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Tests
                        </Link>

                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Test</h1>
                        <p className="text-slate-600 mb-4">Build your test and configure settings</p>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3 mb-8">
                            <TestTemplates onSelect={handleTemplateSelect} />
                            <QuestionBankSelector 
                                onSelect={handleImportFromBank}
                                existingQuestionIds={questions.map(q => q.id)}
                            />
                        </div>

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

                                    <div className="grid grid-cols-3 gap-4">
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

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Passing % 
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
                            </div>

                            {/* Test Settings */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                                    <Shuffle className="w-5 h-5 inline-block mr-2" />
                                    Test Settings
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.randomize_questions}
                                            onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
                                            className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Randomize Questions</span>
                                            <p className="text-xs text-slate-500">Each student sees questions in different order</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.show_results_immediately}
                                            onChange={(e) => setFormData({ ...formData, show_results_immediately: e.target.checked })}
                                            className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Show Results Immediately</span>
                                            <p className="text-xs text-slate-500">Students see score right after submission</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.allow_review}
                                            onChange={(e) => setFormData({ ...formData, allow_review: e.target.checked })}
                                            className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Allow Answer Review</span>
                                            <p className="text-xs text-slate-500">Students can review correct answers</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.enable_anti_cheat}
                                            onChange={(e) => setFormData({ ...formData, enable_anti_cheat: e.target.checked })}
                                            className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Anti-Cheating Measures</span>
                                            <p className="text-xs text-slate-500">Block copy/paste, tab switching, etc.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Proctoring Settings */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                                    <Shield className="w-5 h-5 inline-block mr-2" />
                                    Proctoring Settings
                                </h2>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.enable_screen_recording}
                                            onChange={(e) => setFormData({ ...formData, enable_screen_recording: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Enable Screen Recording</span>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.enable_face_monitoring}
                                            onChange={(e) => setFormData({ ...formData, enable_face_monitoring: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Enable Face Monitoring</span>
                                    </label>
                                </div>
                            </div>

                            {/* Questions */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-slate-900">Questions</h2>
                                    <div className="flex items-center gap-4">
                                        <QuestionBankSelector 
                                            onSelect={handleImportFromBank}
                                            existingQuestionIds={questions.map(q => q.id)}
                                        />
                                        <span className="text-sm text-slate-600">
                                            Total Marks: <span className="font-bold text-indigo-600">{total_marks}</span>
                                        </span>
                                    </div>
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
                                    {loading ? 'Creating...' : 'Create Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
