'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIGeneratorModal } from '@/components/shared/AIGeneratorModal';
import { BookOpen, Clock, Star, Sparkles } from 'lucide-react';

interface Roadmap {
    id: string;
    title: string;
    description: string;
    slug: string;
    type: string;
    difficulty: string;
    total_nodes: number;
    estimated_weeks: number;
    tags: string[];
    average_rating: number;
}

export function RoadmapsContent() {
    const searchParams = useSearchParams();
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiFormat, setAiFormat] = useState<'course' | 'guide' | 'roadmap'>('roadmap');
    const [filter, setFilter] = useState({
        type: 'all',
        difficulty: 'all',
        search: ''
    });

    useEffect(() => {
        if (searchParams.get('generate') === 'true') {
            const format = searchParams.get('format');
            if (format && ['course', 'guide', 'roadmap'].includes(format)) {
                setAiFormat(format as 'career' | 'skill' | 'project');
            }
            setShowAIModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchRoadmaps();
    }, [filter]);

    const fetchRoadmaps = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.type !== 'all') params.append('type', filter.type);
            if (filter.difficulty !== 'all') params.append('difficulty', filter.difficulty);
            if (filter.search) params.append('search', filter.search);

            const response = await fetch(`/api/roadmaps?${params}`);
            const data = await response.json();
            setRoadmaps(data.roadmaps || []);
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'career': return 'bg-blue-100 text-blue-800';
            case 'skill': return 'bg-purple-100 text-purple-800';
            case 'university': return 'bg-indigo-100 text-indigo-800';
            case 'goal': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Learning Roadmaps
                        </h1>
                        <p className="text-lg text-gray-600">
                            Choose your path and start your learning journey
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Generate
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                    </label>
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Types</option>
                        <option value="career">Career</option>
                        <option value="skill">Skill</option>
                        <option value="university">University</option>
                        <option value="goal">Goal</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                    </label>
                    <select
                        value={filter.difficulty}
                        onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                    </label>
                    <input
                        type="text"
                        placeholder="Search roadmaps..."
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* Roadmaps Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading roadmaps...</p>
                </div>
            ) : roadmaps.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No roadmaps found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmaps.map((roadmap) => (
                        <Link key={roadmap.id} href={`/roadmaps/${roadmap.slug}`}>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-300 h-full">
                                <div className="flex flex-col h-full">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {roadmap.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {roadmap.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge className={getTypeColor(roadmap.type)}>
                                            {roadmap.type}
                                        </Badge>
                                        <Badge className={getDifficultyColor(roadmap.difficulty)}>
                                            {roadmap.difficulty}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-auto">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{roadmap.total_nodes} steps</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{roadmap.estimated_weeks}w</span>
                                        </div>
                                        {roadmap.average_rating > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span>{roadmap.average_rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {roadmap.tags && roadmap.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {roadmap.tags.slice(0, 3).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
