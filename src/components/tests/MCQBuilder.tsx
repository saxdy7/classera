'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    marks: number;
    explanation?: string;
}

interface MCQBuilderProps {
    questions: MCQQuestion[];
    onChange: (questions: MCQQuestion[]) => void;
}

export function MCQBuilder({ questions, onChange }: MCQBuilderProps) {
    const addQuestion = () => {
        const newQuestion: MCQQuestion = {
            id: `q_${Date.now()}`,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            marks: 1
        };
        onChange([...questions, newQuestion]);
    };

    const removeQuestion = (index: number) => {
        onChange(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof MCQQuestion, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        const options = [...updated[questionIndex].options];
        options[optionIndex] = value;
        updated[questionIndex] = { ...updated[questionIndex], options };
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            {questions.map((question, qIndex) => (
                <div key={question.id} className="bg-white rounded-xl p-6 border border-slate-200">
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Question {qIndex + 1}</h3>
                        <button
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

                    {/* Options */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Options *
                        </label>
                        <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-3">
                                    <button
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
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Click the circle to mark correct answer</p>
                    </div>

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

            {/* Add Question Button */}
            <button
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-indigo-600 font-medium"
            >
                <Plus className="w-5 h-5" />
                Add Question
            </button>
        </div>
    );
}
