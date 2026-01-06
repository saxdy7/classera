'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, BookOpen, Clock, Star, Play, ExternalLink, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface Recommendation {
    id: string;
    title: string;
    platform: string;
    instructor: string;
    rating: number;
    price: string;
    skills: string[];
    level: string;
    type: string;
    image: string;
}

interface LearningPath {
    step: number;
    title: string;
    duration: string;
    level: string;
}

export function RecommendedCourses() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [learningPath, setLearningPath] = useState<LearningPath[]>([]);
    const [weakAreas, setWeakAreas] = useState<string[]>([]);
    const [specialization, setSpecialization] = useState('');
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState<string | null>(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const response = await fetch('/api/ai/course-recommendations');
            const data = await response.json();

            setRecommendations(data.personalized?.recommendations || []);
            setLearningPath(data.learningPath || []);
            setWeakAreas(data.personalized?.weakAreas || []);
            setSpecialization(data.personalized?.specialization || '');
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (course: Recommendation) => {
        setEnrolling(course.id);
        try {
            const response = await fetch('/api/courses/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_type: 'external',
                    external_course_id: course.id,
                    external_platform: course.platform
                })
            });

            if (response.ok) {
                // Remove from recommendations after enrollment
                setRecommendations(prev => prev.filter(r => r.id !== course.id));
            }
        } catch (error) {
            console.error('Error enrolling:', error);
        } finally {
            setEnrolling(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* AI Recommendations Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Recommended for You</h2>
                        <p className="text-white/80 text-sm">Based on your {specialization} specialization</p>
                    </div>
                </div>

                {weakAreas.length > 0 && (
                    <div className="bg-white/10 rounded-lg p-4 mt-4">
                        <p className="text-sm font-medium mb-2">💡 Strengthen your weak areas:</p>
                        <div className="flex flex-wrap gap-2">
                            {weakAreas.map(area => (
                                <span key={area} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                    {area}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recommended Courses */}
            {recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendations.map(course => (
                        <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative h-40">
                                <Image
                                    src={course.image}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.type === 'free'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-blue-500 text-white'
                                        }`}>
                                        {course.type === 'free' ? 'FREE' : course.price}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                        {course.platform}
                                    </span>
                                    <span className="text-xs text-slate-500">{course.level}</span>
                                </div>

                                <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{course.title}</h3>
                                <p className="text-sm text-slate-600 mb-3">{course.instructor}</p>

                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-semibold">{course.rating}</span>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-4">
                                    {course.skills.slice(0, 3).map(skill => (
                                        <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleEnroll(course)}
                                    disabled={enrolling === course.id}
                                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {enrolling === course.id ? (
                                        'Enrolling...'
                                    ) : (
                                        <>
                                            <BookOpen className="w-4 h-4" />
                                            Enroll Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Learning Path */}
            {learningPath.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Your Learning Path</h3>
                            <p className="text-sm text-slate-600">{specialization} roadmap</p>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Progress line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

                        <div className="space-y-4">
                            {learningPath.map((step, index) => (
                                <div key={step.step} className="flex items-start gap-4">
                                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {index === 0 ? <CheckCircle className="w-5 h-5" /> : step.step}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <h4 className="font-semibold text-slate-900">{step.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {step.duration}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                                                {step.level}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
