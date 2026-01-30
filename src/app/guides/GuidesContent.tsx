'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIGeneratorModal } from '@/components/shared/AIGeneratorModal';
import { BookText, Clock, Sparkles } from 'lucide-react';

interface Guide {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    difficulty: string;
    tags: string[];
    created_at: string;
}

export function GuidesContent() {
    const searchParams = useSearchParams();
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiFormat, setAiFormat] = useState<'course' | 'guide' | 'roadmap'>('guide');
    const [filter, setFilter] = useState({ search: '' });

    useEffect(() => {
        if (searchParams.get('generate') === 'true') {
            const format = searchParams.get('format');
            if (format && ['course', 'guide', 'roadmap'].includes(format)) {
                setAiFormat(format as 'tutorial' | 'documentation' | 'guide');
            }
            setShowAIModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchGuides();
    }, [filter]);

    const fetchGuides = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.search) params.append('search', filter.search);

            const response = await fetch(`/api/guides?${params}`);
            const data = await response.json();
            setGuides(data.guides || []);
        } catch (error) {
            console.error('Error fetching guides:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReadingTime = (content: string) => {
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <BookText className="h-10 w-10 text-blue-600" />
                            <h1 className="text-4xl font-bold text-gray-900">Learning Guides</h1>
                        </div>
                        <p className="text-lg text-gray-600">
                            Quick, focused guides to help you learn specific topics
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Generate
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search guides..."
                    value={filter.search}
                    onChange={(e) => setFilter({ search: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading guides...</p>
                </div>
            ) : guides.length === 0 ? (
                <div className="text-center py-12">
                    <BookText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No guides found</p>
                    <Button onClick={() => setShowAIModal(true)}>
                        Generate Your First Guide with AI
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides.map((guide) => (
                        <Link key={guide.id} href={`/guides/${guide.slug}`}>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 h-full">
                                <div className="flex flex-col h-full">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {guide.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                                        {guide.content.substring(0, 150)}...
                                    </p>

                                    <div className="flex items-center gap-2 mb-3">
                                        {guide.difficulty && (
                                            <Badge variant="outline">{guide.difficulty}</Badge>
                                        )}
                                        {guide.category && (
                                            <Badge variant="secondary">{guide.category}</Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        <span>{getReadingTime(guide.content)}</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <AIGeneratorModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} initialFormat={aiFormat} />
        </div>
    );
}
