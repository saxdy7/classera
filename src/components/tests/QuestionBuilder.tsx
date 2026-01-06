'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, GripVertical, FileText, CircleDot, Sparkles } from 'lucide-react';
import { AIQuestionGenerator } from './AIQuestionGenerator';

export interface TestQuestion {
    id: string;
    question: string;
    type: 'mcq' | 'descriptive' | 'short_answer';
    options?: string[];
    correctAnswer?: number | string;
    marks: number;
    explanation?: string;
}

interface QuestionBuilderProps {
    questions: TestQuestion[];
    onChange: (questions: TestQuestion[]) => void;
    testSubject?: string;
}

export function QuestionBuilder({ questions, onChange, testSubject }: QuestionBuilderProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const addQuestion = (type: 'mcq' | 'descriptive' | 'short_answer') => {
        const newQuestion: TestQuestion = {
            id: `q_${Date.now()}`,
            question: '',
            type,
            options: type === 'mcq' ? ['', '', '', ''] : undefined,
            correctAnswer: type === 'mcq' ? 0 : '',
            marks: 1,
        };
        onChange([...questions, newQuestion]);
    };

    const removeQuestion = (index: number) => {
        onChange(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof TestQuestion, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        const options = [...(updated[questionIndex].options || [])];
        options[optionIndex] = value;
        updated[questionIndex] = { ...updated[questionIndex], options };
        onChange(updated);
    };

    const addOption = (questionIndex: number) => {
        const updated = [...questions];
        const options = [...(updated[questionIndex].options || [])];
        options.push('');
        updated[questionIndex] = { ...updated[questionIndex], options };
        onChange(updated);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updated = [...questions];
        const options = [...(updated[questionIndex].options || [])];
        if (options.length <= 2) return; // Minimum 2 options
        options.splice(optionIndex, 1);
        // Adjust correct answer if needed
        let correctAnswer = updated[questionIndex].correctAnswer as number;
        if (optionIndex === correctAnswer) {
            correctAnswer = 0;
        } else if (optionIndex < correctAnswer) {
            correctAnswer--;
        }
        updated[questionIndex] = { ...updated[questionIndex], options, correctAnswer };
        onChange(updated);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newQuestions = [...questions];
        const [draggedItem] = newQuestions.splice(draggedIndex, 1);
        newQuestions.splice(index, 0, draggedItem);
        onChange(newQuestions);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'mcq': return 'Multiple Choice';
            case 'descriptive': return 'Descriptive (Essay)';
            case 'short_answer': return 'Short Answer';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'mcq': return 'bg-blue-100 text-blue-700';
            case 'descriptive': return 'bg-purple-100 text-purple-700';
            case 'short_answer': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {questions.map((question, qIndex) => (
                <div
                    key={question.id}
                    draggable
                    onDragStart={() => handleDragStart(qIndex)}
                    onDragOver={(e) => handleDragOver(e, qIndex)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-xl p-6 border border-slate-200 ${draggedIndex === qIndex ? 'opacity-50' : ''}`}
                >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="cursor-grab text-slate-400 hover:text-slate-600">
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Question {qIndex + 1}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(question.type)}`}>
                                {getTypeLabel(question.type)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Question Text *
                        </label>
                        <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            placeholder="Enter your question here..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={3}
                        />
                    </div>

                    {/* MCQ Options */}
                    {question.type === 'mcq' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Options *
                            </label>
                            <div className="space-y-2">
                                {question.options?.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                            className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${question.correctAnswer === oIndex
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-slate-300 hover:border-green-400'
                                                }`}
                                        >
                                            {question.correctAnswer === oIndex && <Check className="w-4 h-4" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {(question.options?.length || 0) > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(qIndex, oIndex)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                + Add Option
                            </button>
                            <p className="text-xs text-slate-500 mt-2">Click the circle to mark correct answer</p>
                        </div>
                    )}

                    {/* Descriptive Answer Guidelines */}
                    {(question.type === 'descriptive' || question.type === 'short_answer') && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Expected Answer / Grading Guidelines
                            </label>
                            <textarea
                                value={question.correctAnswer as string || ''}
                                onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                placeholder="Enter expected answer or key points for grading..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                This will be used as a reference for manual/AI grading
                            </p>
                        </div>
                    )}

                    {/* Marks and Explanation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Marks *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={question.marks}
                                onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Explanation (Optional)
                            </label>
                            <input
                                type="text"
                                value={question.explanation || ''}
                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                placeholder="Why is this the correct answer?"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            ))}

            {/* Add Question Buttons */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    type="button"
                    onClick={() => addQuestion('mcq')}
                    className="py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-blue-600 font-medium"
                >
                    <CircleDot className="w-6 h-6" />
                    <span className="text-sm">Multiple Choice</span>
                </button>
                <button
                    type="button"
                    onClick={() => addQuestion('descriptive')}
                    className="py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-purple-600 font-medium"
                >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm">Descriptive</span>
                </button>
                <button
                    type="button"
                    onClick={() => addQuestion('short_answer')}
                    className="py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-green-600 font-medium"
                >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm">Short Answer</span>
                </button>
            </div>

            {/* AI Question Generator */}
            <AIQuestionGenerator
                testSubject={testSubject}
                onAddQuestions={(aiQuestions) => {
                    const convertedQuestions: TestQuestion[] = aiQuestions.map(q => ({
                        id: q.id,
                        question: q.question,
                        type: q.type,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        marks: q.marks,
                        explanation: q.explanation,
                    }));
                    onChange([...questions, ...convertedQuestions]);
                }}
            />
        </div>
    );
}
