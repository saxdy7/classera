'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Map, Sparkles, X } from 'lucide-react';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFormat?: 'course' | 'guide' | 'roadmap';
}

export function AIGeneratorModal({ isOpen, onClose, initialFormat = 'course' }: AIGeneratorModalProps) {
    const [topic, setTopic] = useState('');
    const [selectedFormat, setSelectedFormat] = useState<'course' | 'guide' | 'roadmap'>(initialFormat);
    const [showQuestions, setShowQuestions] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (isOpen && initialFormat) {
            setSelectedFormat(initialFormat);
        }
    }, [isOpen, initialFormat]);

    if (!isOpen) return null;

    const formats = [
        {
            id: 'course' as const,
            icon: BookOpen,
            label: 'Course',
            description: 'Structured learning with modules and lessons'
        },
        {
            id: 'guide' as const,
            icon: FileText,
            label: 'Guide',
            description: 'Quick focused tutorial'
        },
        {
            id: 'roadmap' as const,
            icon: Map,
            label: 'Roadmap',
            description: 'Step-by-step learning path'
        }
    ];

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setGenerating(true);
        try {
            if (selectedFormat === 'roadmap') {
                const response = await fetch('/api/ai/generate-roadmap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_role: topic,
                        current_experience: 'beginner',
                        available_hours_per_week: 10
                    })
                });

                const data = await response.json();
                if (data.roadmap) {
                    // Save to database
                    await fetch('/api/roadmaps', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.roadmap)
                    });

                    onClose();
                    setTopic('');
                    window.location.reload(); // Refresh to show new roadmap
                }
            } else if (selectedFormat === 'guide') {
                const response = await fetch('/api/ai/generate-guide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic,
                        difficulty: 'beginner'
                    })
                });

                const data = await response.json();
                if (data.guide) {
                    // Save to database
                    await fetch('/api/guides', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.guide)
                    });

                    onClose();
                    setTopic('');
                    window.location.reload(); // Refresh to show new guide
                }
            } else if (selectedFormat === 'course') {
                const response = await fetch('/api/ai/generate-course', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic,
                        difficulty: 'beginner'
                    })
                });

                const data = await response.json();

                if (data.course) {
                    // Save to database using the enhanced /api/courses endpoint
                    const saveResponse = await fetch('/api/courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.course)
                    });

                    if (saveResponse.ok) {
                        onClose();
                        setTopic('');
                        window.location.reload(); // Refresh to show new course
                    } else {
                        console.error("Failed to save course");
                        alert("Failed to save generated course.");
                    }
                }
            }
        } catch (error) {
            console.error('Error generating:', error);
            alert('Failed to generate content');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <Card className="max-w-3xl w-full p-8 relative bg-[var(--cl-surface-card)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-[var(--cl-surface-strong)] rounded-lg transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-semibold text-[var(--cl-ink)] mb-2">
                        What can I help you learn?
                    </h2>
                    <p className="text-[var(--cl-body)]">
                        Enter a topic below to generate a personalized course for it
                    </p>
                </div>

                {/* Topic Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">
                        What can I help you learn?
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic"
                        className="w-full px-4 py-3 border border-[var(--cl-hairline-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                    />
                </div>

                {/* Format Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[var(--cl-body)] mb-3">
                        Choose the format
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {formats.map((format) => {
                            const Icon = format.icon;
                            const isSelected = selectedFormat === format.id;

                            return (
                                <button
                                    key={format.id}
                                    onClick={() => setSelectedFormat(format.id)}
                                    className={`p-6 border-2 rounded-[var(--cl-r-lg)] transition-all ${isSelected
                                        ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)]'
                                        : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)]'
                                        }`}
                                >
                                    <Icon className={`h-8 w-8 mx-auto mb-3 ${isSelected ? 'text-[var(--cl-primary)]' : 'text-[var(--cl-muted-soft)]'
                                        }`} />
                                    <div className={`font-semibold mb-1 ${isSelected ? 'text-[var(--cl-ink)]' : 'text-[var(--cl-body)]'
                                        }`}>
                                        {format.label}
                                    </div>
                                    <div className="text-xs text-[var(--cl-muted)]">
                                        {format.description}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Optional Questions */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showQuestions}
                            onChange={(e) => setShowQuestions(e.target.checked)}
                            className="rounded border-[var(--cl-hairline-strong)]"
                        />
                        <span className="text-sm text-[var(--cl-body)]">
                            Answer the following questions for a better course
                        </span>
                    </label>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={!topic.trim() || generating}
                    className="w-full bg-[var(--cl-surface-inverse)] hover:bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] py-4 rounded-lg flex items-center justify-center gap-2 text-lg font-medium"
                >
                    <Sparkles className="h-5 w-5" />
                    {generating ? 'Generating...' : 'Generate'}
                </Button>
            </Card>
        </div>
    );
}
