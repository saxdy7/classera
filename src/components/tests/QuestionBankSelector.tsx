'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Filter, BookOpen } from 'lucide-react';

interface BankQuestion {
    id: string;
    mentor_id: string;
    question_text: string;
    question_type: 'mcq' | 'coding' | 'short_answer' | 'long_answer';
    subject: string | null;
    topic: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    options: string[] | null;
    correct_answer: string | null;
    marks: number;
    tags: string[];
}

interface TestQuestion {
    id: string;
    question: string;
    type: 'mcq' | 'descriptive' | 'short_answer';
    options?: string[];
    correctAnswer?: number | string;
    marks: number;
    explanation?: string;
}

interface QuestionBankSelectorProps {
    onSelect: (questions: TestQuestion[]) => void;
    existingQuestionIds?: string[];
}

export function QuestionBankSelector({ onSelect, existingQuestionIds = [] }: QuestionBankSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [questions, setQuestions] = useState<BankQuestion[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<BankQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        subject: '',
        difficulty: '',
        search: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchQuestions();
        }
    }, [isOpen, filters]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(`/api/question-bank?${params}`);
            const data = await response.json();
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (question: BankQuestion) => {
        setSelectedQuestions(prev => {
            const exists = prev.find(q => q.id === question.id);
            if (exists) {
                return prev.filter(q => q.id !== question.id);
            }
            return [...prev, question];
        });
    };

    const handleAddSelected = () => {
        const convertedQuestions: TestQuestion[] = selectedQuestions.map(q => {
            // Map question bank types to test question types
            let type: 'mcq' | 'descriptive' | 'short_answer' = 'mcq';
            if (q.question_type === 'long_answer' || q.question_type === 'coding') {
                type = 'descriptive';
            } else if (q.question_type === 'short_answer') {
                type = 'short_answer';
            }

            return {
                id: `imported_${q.id}_${Date.now()}`,
                question: q.question_text,
                type,
                options: q.options || undefined,
                correctAnswer: q.question_type === 'mcq' 
                    ? parseInt(q.correct_answer || '0') 
                    : q.correct_answer || '',
                marks: q.marks,
            };
        });

        onSelect(convertedQuestions);
        setSelectedQuestions([]);
        setIsOpen(false);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-500/10 text-green-600';
            case 'medium': return 'bg-amber-500/10 text-amber-600';
            case 'hard': return 'bg-destructive/10 text-destructive';
            default: return 'bg-muted text-foreground/80';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'mcq': return 'MCQ';
            case 'coding': return 'Coding';
            case 'short_answer': return 'Short Answer';
            case 'long_answer': return 'Essay';
            default: return type;
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple/10 text-accent-purple rounded-lg font-medium hover:bg-accent-purple/10 transition-all"
            >
                <BookOpen className="w-4 h-4" />
                Import from Question Bank
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed inset-x-4 top-8 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[900px] z-50 flex flex-col bg-card rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-2xl font-semibold text-foreground">Question Bank</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedQuestions.length} questions selected
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="p-4 border-b border-border bg-muted/40">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">All Types</option>
                                    <option value="mcq">Multiple Choice</option>
                                    <option value="short_answer">Short Answer</option>
                                    <option value="long_answer">Essay</option>
                                    <option value="coding">Coding</option>
                                </select>

                                <select
                                    value={filters.difficulty}
                                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                                    className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Subject..."
                                    value={filters.subject}
                                    onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                                    className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/70 mb-4" />
                                    <p className="text-muted-foreground">No questions found</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {questions.map((question) => {
                                        const isSelected = selectedQuestions.some(q => q.id === question.id);
                                        const isExisting = existingQuestionIds.includes(question.id);

                                        return (
                                            <div
                                                key={question.id}
                                                onClick={() => !isExisting && toggleSelection(question)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                    isExisting 
                                                        ? 'bg-muted/40 border-border opacity-50 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-accent-purple/10 border-accent-purple'
                                                            : 'bg-card border-border hover:border-accent-purple'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected 
                                                            ? 'bg-primary border-accent-purple'
                                                            : 'border-border'
                                                    }`}>
                                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                                                {question.difficulty}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 bg-muted text-foreground/80 rounded-full">
                                                                {getTypeLabel(question.question_type)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {question.marks} marks
                                                            </span>
                                                            {isExisting && (
                                                                <span className="text-xs text-amber-600 font-medium">
                                                                    Already added
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-foreground line-clamp-2">
                                                            {question.question_text}
                                                        </p>
                                                        {question.subject && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {question.subject}
                                                                {question.topic && ` • ${question.topic}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/40">
                            <p className="text-sm text-foreground/80">
                                {selectedQuestions.length} questions selected
                                {selectedQuestions.length > 0 && (
                                    <span className="ml-2">
                                        ({selectedQuestions.reduce((sum, q) => sum + q.marks, 0)} marks)
                                    </span>
                                )}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-foreground/80 hover:bg-muted rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddSelected}
                                    disabled={selectedQuestions.length === 0}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add {selectedQuestions.length} Questions
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
