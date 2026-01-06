'use client';

import { useState, useEffect } from 'react';
import { X, Save, ChevronLeft, ChevronRight, CheckCircle, Clock, FileText } from 'lucide-react';

interface Submission {
    id: string;
    student: {
        id: string;
        full_name: string;
        email: string;
    };
    answers: Record<string, string>;
    score: number;
    percentage: number;
    submitted_at: string;
    manual_grades?: Record<string, { score: number; feedback: string }>;
}

interface Question {
    id: string;
    question: string;
    type: 'mcq' | 'descriptive' | 'short_answer';
    marks: number;
    correctAnswer?: string | number;
}

interface ManualGradingProps {
    testId: string;
    testTitle: string;
    questions: Question[];
    onClose: () => void;
}

export function ManualGrading({ testId, testTitle, questions, onClose }: ManualGradingProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [grades, setGrades] = useState<Record<string, Record<string, { score: number; feedback: string }>>>({});

    // Filter only descriptive/short answer questions
    const gradableQuestions = questions.filter(q => q.type === 'descriptive' || q.type === 'short_answer');

    useEffect(() => {
        fetchSubmissions();
    }, [testId]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tests/${testId}/submissions`);
            const data = await response.json();
            setSubmissions(data.submissions || []);
            
            // Initialize grades from existing manual grades
            const initialGrades: Record<string, Record<string, { score: number; feedback: string }>> = {};
            data.submissions?.forEach((sub: Submission) => {
                if (sub.manual_grades) {
                    initialGrades[sub.id] = sub.manual_grades;
                } else {
                    initialGrades[sub.id] = {};
                    gradableQuestions.forEach(q => {
                        initialGrades[sub.id][q.id] = { score: 0, feedback: '' };
                    });
                }
            });
            setGrades(initialGrades);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateGrade = (submissionId: string, questionId: string, field: 'score' | 'feedback', value: number | string) => {
        setGrades(prev => ({
            ...prev,
            [submissionId]: {
                ...prev[submissionId],
                [questionId]: {
                    ...prev[submissionId]?.[questionId],
                    [field]: value,
                },
            },
        }));
    };

    const saveGrades = async () => {
        setSaving(true);
        try {
            const currentSubmission = submissions[currentIndex];
            const submissionGrades = grades[currentSubmission.id];

            // Calculate new total score
            let totalManualScore = 0;
            Object.values(submissionGrades).forEach(grade => {
                totalManualScore += grade.score;
            });

            // Get MCQ score (auto-graded)
            const mcqQuestions = questions.filter(q => q.type === 'mcq');
            let mcqScore = 0;
            mcqQuestions.forEach((q, i) => {
                const answer = currentSubmission.answers[q.id || `q_${i}`];
                if (answer === q.correctAnswer || answer === q.correctAnswer?.toString()) {
                    mcqScore += q.marks;
                }
            });

            const totalScore = mcqScore + totalManualScore;
            const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
            const percentage = (totalScore / totalMarks) * 100;

            await fetch(`/api/tests/${testId}/grade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission_id: currentSubmission.id,
                    manual_grades: submissionGrades,
                    total_score: totalScore,
                    percentage,
                }),
            });

            // Update local state
            setSubmissions(prev => prev.map((sub, idx) => 
                idx === currentIndex 
                    ? { ...sub, score: totalScore, percentage, manual_grades: submissionGrades }
                    : sub
            ));

            alert('Grades saved successfully!');
        } catch (error) {
            console.error('Error saving grades:', error);
            alert('Failed to save grades. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (submissions.length === 0 || gradableQuestions.length === 0) {
        return (
            <>
                <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
                <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-50 bg-white rounded-2xl p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {gradableQuestions.length === 0 ? 'No Gradable Questions' : 'No Submissions'}
                    </h3>
                    <p className="text-slate-500 mb-6">
                        {gradableQuestions.length === 0 
                            ? 'This test only has MCQ questions which are auto-graded.'
                            : 'No students have submitted this test yet.'
                        }
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </>
        );
    }

    const currentSubmission = submissions[currentIndex];
    const currentGrades = grades[currentSubmission.id] || {};

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed inset-4 md:inset-8 z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Manual Grading</h2>
                        <p className="text-sm text-slate-500 mt-1">{testTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Student Navigation */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {currentSubmission.student.full_name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{currentSubmission.student.full_name}</p>
                            <p className="text-sm text-slate-500">{currentSubmission.student.email}</p>
                        </div>
                        <span className="text-sm text-slate-400">
                            {currentIndex + 1} of {submissions.length}
                        </span>
                    </div>

                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(submissions.length - 1, prev + 1))}
                        disabled={currentIndex === submissions.length - 1}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Grading Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {gradableQuestions.map((question, qIndex) => {
                            const answer = currentSubmission.answers[question.id] || '';
                            const grade = currentGrades[question.id] || { score: 0, feedback: '' };

                            return (
                                <div key={question.id} className="bg-slate-50 rounded-xl p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                question.type === 'descriptive' 
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {question.type === 'descriptive' ? 'Essay' : 'Short Answer'}
                                            </span>
                                            <p className="text-sm text-slate-500 mt-2">Max: {question.marks} marks</p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Q{qIndex + 1}. {question.question}
                                    </h3>

                                    {question.correctAnswer && (
                                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm font-medium text-green-800">Expected Answer / Guidelines:</p>
                                            <p className="text-sm text-green-700 mt-1">{question.correctAnswer}</p>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-slate-700 mb-2">Student's Answer:</p>
                                        <div className="p-4 bg-white border border-slate-200 rounded-lg min-h-[100px]">
                                            {answer ? (
                                                <p className="text-slate-900 whitespace-pre-wrap">{answer}</p>
                                            ) : (
                                                <p className="text-slate-400 italic">No answer provided</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Score (out of {question.marks})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={question.marks}
                                                value={grade.score}
                                                onChange={(e) => updateGrade(
                                                    currentSubmission.id,
                                                    question.id,
                                                    'score',
                                                    Math.min(question.marks, Math.max(0, parseInt(e.target.value) || 0))
                                                )}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Feedback
                                            </label>
                                            <input
                                                type="text"
                                                value={grade.feedback}
                                                onChange={(e) => updateGrade(
                                                    currentSubmission.id,
                                                    question.id,
                                                    'feedback',
                                                    e.target.value
                                                )}
                                                placeholder="Optional feedback for the student..."
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">
                            Current Score: {Object.values(currentGrades).reduce((sum, g) => sum + (g.score || 0), 0)} / 
                            {gradableQuestions.reduce((sum, q) => sum + q.marks, 0)}
                        </span>
                        {currentSubmission.manual_grades && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                Previously graded
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveGrades}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Grades'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ManualGrading;
