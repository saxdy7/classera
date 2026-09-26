'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, GripVertical, FileText, CircleDot, Sparkles, Eye } from 'lucide-react';
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
            case 'mcq': return 'bg-accent-purple/10 text-accent-purple';
            case 'descriptive': return 'bg-accent-purple/10 text-accent-purple';
            case 'short_answer': return 'bg-green-500/10 text-green-600';
            default: return 'bg-muted text-foreground/80';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Editor column ── */}
          <div className="lg:col-span-3 space-y-6">
            {questions.map((question, qIndex) => (
                <div
                    key={question.id}
                    draggable
                    onDragStart={() => handleDragStart(qIndex)}
                    onDragOver={(e) => handleDragOver(e, qIndex)}
                    onDragEnd={handleDragEnd}
                    className={`bg-card rounded-lg p-6 border border-border ${draggedIndex === qIndex ? 'opacity-50' : ''}`}
                >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="cursor-grab text-muted-foreground/70 hover:text-foreground/80">
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Question {qIndex + 1}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(question.type)}`}>
                                {getTypeLabel(question.type)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Question Text *
                        </label>
                        <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            placeholder="Enter your question here..."
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            rows={3}
                        />
                    </div>

                    {/* MCQ Options */}
                    {question.type === 'mcq' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Options *
                            </label>
                            <div className="space-y-2">
                                {question.options?.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                            className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${question.correctAnswer === oIndex
                                                ? 'bg-green-600 border-green-600 text-white'
                                                : 'border-border hover:border-green-600'
                                                }`}
                                        >
                                            {question.correctAnswer === oIndex && <Check className="w-4 h-4" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                        {(question.options?.length || 0) > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(qIndex, oIndex)}
                                                className="p-2 text-muted-foreground/70 hover:text-destructive transition-colors"
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
                                className="mt-2 text-sm text-accent-purple hover:text-accent-purple font-medium"
                            >
                                + Add Option
                            </button>
                            <p className="text-xs text-muted-foreground mt-2">Click the circle to mark correct answer</p>
                        </div>
                    )}

                    {/* Descriptive Answer Guidelines */}
                    {(question.type === 'descriptive' || question.type === 'short_answer') && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Expected Answer / Grading Guidelines
                            </label>
                            <textarea
                                value={question.correctAnswer as string || ''}
                                onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                placeholder="Enter expected answer or key points for grading..."
                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                This will be used as a reference for manual/AI grading
                            </p>
                        </div>
                    )}

                    {/* Marks and Explanation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Marks *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={question.marks}
                                onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Explanation (Optional)
                            </label>
                            <input
                                type="text"
                                value={question.explanation || ''}
                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                placeholder="Why is this the correct answer?"
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className="py-4 border-2 border-dashed border-border rounded-lg hover:border-accent-purple hover:bg-accent-purple/10 transition-all flex flex-col items-center justify-center gap-2 text-foreground/80 hover:text-accent-purple font-medium"
                >
                    <CircleDot className="w-6 h-6" />
                    <span className="text-sm">Multiple Choice</span>
                </button>
                <button
                    type="button"
                    onClick={() => addQuestion('descriptive')}
                    className="py-4 border-2 border-dashed border-border rounded-lg hover:border-accent-purple hover:bg-accent-purple/10 transition-all flex flex-col items-center justify-center gap-2 text-foreground/80 hover:text-accent-purple font-medium"
                >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm">Descriptive</span>
                </button>
                <button
                    type="button"
                    onClick={() => addQuestion('short_answer')}
                    className="py-4 border-2 border-dashed border-border rounded-lg hover:border-green-600 hover:bg-green-500/10 transition-all flex flex-col items-center justify-center gap-2 text-foreground/80 hover:text-green-600 font-medium"
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

          {/* ── Live preview column ── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-accent-purple" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Live Preview</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-5">How students will see your test</p>

                {questions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/70 text-sm border border-dashed border-border rounded-lg">
                    Add a question to see the preview
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                    {questions.map((q, i) => (
                      <div key={q.id} className="pb-5 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-start gap-2 mb-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-purple/10 text-accent-purple text-xs font-semibold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {q.question || <span className="text-muted-foreground/70 italic font-normal">Untitled question</span>}
                          </p>
                        </div>

                        {q.type === 'mcq' ? (
                          <div className="space-y-2 pl-8">
                            {(q.options || []).map((opt, oi) => {
                              const isCorrect = q.correctAnswer === oi;
                              return (
                                <div
                                  key={oi}
                                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                                    isCorrect ? 'border-green-600 bg-green-500/10' : 'border-border'
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                      isCorrect ? 'border-green-600 bg-green-600' : 'border-border'
                                    }`}
                                  >
                                    {isCorrect && <Check className="w-2.5 h-2.5 text-white" />}
                                  </span>
                                  <span className={isCorrect ? 'text-green-600 font-medium' : 'text-foreground/80'}>
                                    {opt || `Option ${oi + 1}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pl-8">
                            <div className="w-full px-4 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground/70">
                              {q.type === 'short_answer' ? 'Short answer response…' : 'Long answer response…'}
                            </div>
                          </div>
                        )}

                        <div className="pl-8 mt-2">
                          <span className="text-[11px] font-medium text-muted-foreground/70">
                            {q.marks} {q.marks === 1 ? 'point' : 'points'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    );
}
