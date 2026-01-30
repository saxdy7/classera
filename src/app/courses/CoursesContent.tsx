'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIGeneratorModal } from '@/components/shared/AIGeneratorModal';
import { BookOpen, Clock, Users, Star, GraduationCap, Sparkles } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    category: string;
    thumbnail_url: string;
    total_modules: number;
    total_lessons: number;
    total_duration_minutes: number;
    enrollment_count: number;
    rating: number;
    tags: string[];
}

import { useSearchParams } from 'next/navigation';
// ... existing imports

export function CoursesContent() {
    const searchParams = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiFormat, setAiFormat] = useState<'course' | 'guide' | 'roadmap'>('course');
    const [filter, setFilter] = useState({
        difficulty: 'all',
        search: ''
    });

    useEffect(() => {
        if (searchParams.get('generate') === 'true') {
            const format = searchParams.get('format');
            if (format && ['course', 'guide', 'roadmap'].includes(format)) {
                setAiFormat(format as 'beginner' | 'intermediate' | 'advanced');
            }
            setShowAIModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchCourses();
    }, [filter]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.difficulty !== 'all') params.append('difficulty', filter.difficulty);
            if (filter.search) params.append('search', filter.search);

            const response = await fetch(`/api/courses?${params}`);
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
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

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        return hours > 0 ? `${hours}h` : `${minutes}m`;
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <GraduationCap className="h-10 w-10 text-green-600" />
                            <h1 className="text-4xl font-bold text-gray-900">Courses</h1>
                        </div>
                        <p className="text-lg text-gray-600">
                            Structured learning paths with video lessons and hands-on projects
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Generate
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                    </label>
                    <select
                        value={filter.difficulty}
                        onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                        placeholder="Search courses..."
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading courses...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No courses found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.slug}`}>
                            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-300 h-full flex flex-col">
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                        <GraduationCap className="h-16 w-16 text-white opacity-50" />
                                    </div>
                                )}

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {course.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                                        {course.description}
                                    </p>

                                    <div className="mb-4">
                                        <Badge className={getDifficultyColor(course.difficulty)}>
                                            {course.difficulty}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{course.total_lessons} lessons</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatDuration(course.total_duration_minutes)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{course.enrollment_count} enrolled</span>
                                        </div>
                                        {course.rating > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span>{course.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {course.tags && course.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {course.tags.slice(0, 3).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
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
