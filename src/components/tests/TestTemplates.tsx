'use client';

import { useState } from 'react';
import { X, FileText, Clock, CheckCircle, BookOpen, Calculator, Globe, Beaker, Code } from 'lucide-react';

interface TestTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    duration_minutes: number;
    questions: {
        question: string;
        type: 'mcq' | 'descriptive' | 'short_answer';
        options?: string[];
        correctAnswer?: number | string;
        marks: number;
    }[];
    settings: {
        randomize_questions: boolean;
        show_results_immediately: boolean;
        allow_review: boolean;
        passing_percentage: number;
    };
}

const templates: TestTemplate[] = [
    {
        id: 'quick-quiz',
        name: 'Quick Quiz',
        description: '10 MCQ questions for a rapid assessment',
        icon: <CheckCircle className="w-6 h-6" />,
        category: 'General',
        duration_minutes: 15,
        questions: Array.from({ length: 10 }, (_, i) => ({
            question: `Question ${i + 1}`,
            type: 'mcq' as const,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            marks: 1,
        })),
        settings: {
            randomize_questions: true,
            show_results_immediately: true,
            allow_review: true,
            passing_percentage: 60,
        },
    },
    {
        id: 'mid-term-exam',
        name: 'Mid-term Exam',
        description: 'Comprehensive exam with mixed question types',
        icon: <BookOpen className="w-6 h-6" />,
        category: 'Academic',
        duration_minutes: 60,
        questions: [
            ...Array.from({ length: 15 }, (_, i) => ({
                question: `MCQ Question ${i + 1}`,
                type: 'mcq' as const,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0,
                marks: 2,
            })),
            ...Array.from({ length: 3 }, (_, i) => ({
                question: `Short Answer Question ${i + 1}`,
                type: 'short_answer' as const,
                correctAnswer: '',
                marks: 5,
            })),
            ...Array.from({ length: 2 }, (_, i) => ({
                question: `Essay Question ${i + 1}`,
                type: 'descriptive' as const,
                correctAnswer: '',
                marks: 10,
            })),
        ],
        settings: {
            randomize_questions: false,
            show_results_immediately: false,
            allow_review: true,
            passing_percentage: 50,
        },
    },
    {
        id: 'math-practice',
        name: 'Mathematics Practice',
        description: 'Practice problems for mathematical concepts',
        icon: <Calculator className="w-6 h-6" />,
        category: 'Mathematics',
        duration_minutes: 45,
        questions: Array.from({ length: 20 }, (_, i) => ({
            question: `Math Problem ${i + 1}`,
            type: 'short_answer' as const,
            correctAnswer: '',
            marks: 5,
        })),
        settings: {
            randomize_questions: true,
            show_results_immediately: true,
            allow_review: true,
            passing_percentage: 60,
        },
    },
    {
        id: 'coding-test',
        name: 'Programming Assessment',
        description: 'Code-based questions and problem solving',
        icon: <Code className="w-6 h-6" />,
        category: 'Technology',
        duration_minutes: 90,
        questions: [
            ...Array.from({ length: 5 }, (_, i) => ({
                question: `Coding MCQ ${i + 1}`,
                type: 'mcq' as const,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0,
                marks: 2,
            })),
            ...Array.from({ length: 3 }, (_, i) => ({
                question: `Code Writing Problem ${i + 1}`,
                type: 'descriptive' as const,
                correctAnswer: '',
                marks: 20,
            })),
        ],
        settings: {
            randomize_questions: false,
            show_results_immediately: false,
            allow_review: true,
            passing_percentage: 50,
        },
    },
    {
        id: 'science-quiz',
        name: 'Science Quiz',
        description: 'Quick science knowledge assessment',
        icon: <Beaker className="w-6 h-6" />,
        category: 'Science',
        duration_minutes: 30,
        questions: Array.from({ length: 15 }, (_, i) => ({
            question: `Science Question ${i + 1}`,
            type: 'mcq' as const,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            marks: 2,
        })),
        settings: {
            randomize_questions: true,
            show_results_immediately: true,
            allow_review: true,
            passing_percentage: 60,
        },
    },
    {
        id: 'language-test',
        name: 'Language Proficiency',
        description: 'Reading comprehension and vocabulary',
        icon: <Globe className="w-6 h-6" />,
        category: 'Languages',
        duration_minutes: 45,
        questions: [
            ...Array.from({ length: 10 }, (_, i) => ({
                question: `Vocabulary MCQ ${i + 1}`,
                type: 'mcq' as const,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0,
                marks: 1,
            })),
            ...Array.from({ length: 5 }, (_, i) => ({
                question: `Short Response ${i + 1}`,
                type: 'short_answer' as const,
                correctAnswer: '',
                marks: 4,
            })),
            {
                question: 'Essay: Write about...',
                type: 'descriptive' as const,
                correctAnswer: '',
                marks: 20,
            },
        ],
        settings: {
            randomize_questions: false,
            show_results_immediately: true,
            allow_review: true,
            passing_percentage: 60,
        },
    },
];

interface TestTemplatesProps {
    onSelect: (template: TestTemplate) => void;
}

export function TestTemplates({ onSelect }: TestTemplatesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const categories = [...new Set(templates.map(t => t.category))];
    const filteredTemplates = selectedCategory 
        ? templates.filter(t => t.category === selectedCategory)
        : templates;

    const handleSelect = (template: TestTemplate) => {
        onSelect(template);
        setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-all"
            >
                <FileText className="w-4 h-4" />
                Use Template
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed inset-x-4 top-8 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[800px] z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Test Templates</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Start with a pre-built template
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Category Filter */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedCategory('')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedCategory === ''
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    All
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            selectedCategory === category
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Templates Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {filteredTemplates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleSelect(template)}
                                        className="p-5 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                                {template.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 mb-1">
                                                    {template.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                                                    {template.description}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {template.duration_minutes} min
                                                    </span>
                                                    <span>{template.questions.length} questions</span>
                                                    <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                                                        {template.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
