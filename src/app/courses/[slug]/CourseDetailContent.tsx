'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Clock, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function CourseDetailContent() {
    const params = useParams();
    const router = useRouter();
    const [course, setCourse] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [lessonProgress, setLessonProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [activeLesson, setActiveLesson] = useState<any>(null);

    useEffect(() => {
        if (params.slug) {
            fetchCourse();
        }
    }, [params.slug]);

    const fetchCourse = async () => {
        try {
            const listResponse = await fetch('/api/courses');
            const listData = await listResponse.json();
            const found = listData.courses?.find((c: any) => c.slug === params.slug);

            if (found) {
                const response = await fetch(`/api/courses/${found.id}`);
                const data = await response.json();
                setCourse(data.course);
                setEnrollment(data.enrollment);
                setLessonProgress(data.lessonProgress || []);

                if (data.course.modules?.length > 0) {
                    setExpandedModules(new Set([data.course.modules[0].id]));
                }
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!course) return;

        setEnrolling(true);
        try {
            const response = await fetch(`/api/courses/${course.id}/enroll`, {
                method: 'POST'
            });

            if (response.ok) {
                await fetchCourse();
            }
        } catch (error) {
            console.error('Error enrolling:', error);
        } finally {
            setEnrolling(false);
        }
    };

    const handleLessonComplete = async (lessonId: string) => {
        try {
            await fetch(`/api/courses/lessons/${lessonId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ time_spent_minutes: 0 })
            });
            await fetchCourse();

            // If in viewer mode, maybe advance to next lesson?
            // For now, let's look for the next lesson logic or just stay on current
            if (activeLesson && activeLesson.id === lessonId) {
                // Determine next lesson
                // Flatten all lessons
                const allLessons: any[] = [];
                course.modules.forEach((m: any) => {
                    if (m.lessons) allLessons.push(...m.lessons);
                });
                const currentIndex = allLessons.findIndex(l => l.id === lessonId);
                if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
                    setActiveLesson(allLessons[currentIndex + 1]);
                } else {
                    setActiveLesson(null); // Course finished or end of list
                }
            }

        } catch (error) {
            console.error('Error completing lesson:', error);
        }
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const isLessonCompleted = (lessonId: string) => {
        return lessonProgress.some(p => p.lesson_id === lessonId && p.completed);
    };

    if (activeLesson) {
        return (
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Left Sidebar - Course Navigation */}
                <div className="w-80 border-r bg-gray-50 overflow-y-auto hidden md:block">
                    <div className="p-4 border-b bg-white top-0 sticky z-10">
                        <Button variant="ghost" size="sm" onClick={() => setActiveLesson(null)} className="mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Overview
                        </Button>
                        <h3 className="font-semibold text-sm line-clamp-1">{course.title}</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {course.modules?.map((module: any, cmdIndex: number) => (
                            <div key={module.id}>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Module {cmdIndex + 1}</h4>
                                <div className="space-y-1">
                                    {module.lessons?.map((lesson: any, lIndex: number) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => setActiveLesson(lesson)}
                                            className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${activeLesson.id === lesson.id ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                                        >
                                            {isLessonCompleted(lesson.id) ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                                            )}
                                            <span className="line-clamp-1">{lIndex + 1}. {lesson.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content - Lesson Viewer */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto p-6 lg:p-12 mb-20">
                        <div className="mb-8 border-b pb-6">
                            <Button variant="outline" size="sm" onClick={() => setActiveLesson(null)} className="md:hidden mb-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeLesson.title}</h1>
                            {activeLesson.duration_minutes > 0 && (
                                <div className="flex items-center text-gray-500 text-sm">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {activeLesson.duration_minutes} min read
                                </div>
                            )}
                        </div>

                        <div className="prose prose-slate lg:prose-lg max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {activeLesson.content || activeLesson.description || '*No content available for this lesson.*'}
                            </ReactMarkdown>
                        </div>

                        <div className="mt-12 pt-8 border-t flex justify-end">
                            <Button
                                size="lg"
                                className={isLessonCompleted(activeLesson.id) ? "bg-green-600" : "bg-green-600 hover:bg-green-700"}
                                onClick={() => handleLessonComplete(activeLesson.id)}
                            >
                                {isLessonCompleted(activeLesson.id) ? 'Completed' : 'Mark as Complete & Next'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
                <Button onClick={() => router.push('/courses')}>Back to Courses</Button>
            </div>
        );
    }

    const progress = enrollment ? enrollment.progress_percentage : 0;

    return (
        <div className="p-4 md:p-8">
            <div className="mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {course.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>{course.total_modules} modules</span>
                            <span>•</span>
                            <span>{course.total_lessons} lessons</span>
                            <span>•</span>
                            <span>{progress}% complete</span>
                        </div>
                        {enrollment && (
                            <div className="w-full max-w-md bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    {!enrollment && (
                        <Button
                            onClick={handleEnroll}
                            disabled={enrolling}
                            className="ml-4 bg-green-600 hover:bg-green-700"
                        >
                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {course.modules?.map((module: any, moduleIndex: number) => {
                    const isExpanded = expandedModules.has(module.id);

                    return (
                        <Card key={module.id} className="overflow-hidden">
                            <button
                                onClick={() => toggleModule(module.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-400">
                                        {moduleIndex + 1}
                                    </span>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900">
                                            Module {moduleIndex + 1}: {module.title}
                                        </h3>
                                        {module.description && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {module.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                            </button>

                            {isExpanded && module.lessons && (
                                <div className="border-t">
                                    {module.lessons.map((lesson: any, lessonIndex: number) => {
                                        const completed = isLessonCompleted(lesson.id);

                                        return (
                                            <div
                                                key={lesson.id}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                                                onClick={() => enrollment && setActiveLesson(lesson)} // Click to open if enrolled
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    {completed ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                                                    )}

                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {lessonIndex + 1}. {lesson.title}
                                                        </span>
                                                        {lesson.description && (
                                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                                                {lesson.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {lesson.duration_minutes > 0 && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Clock className="h-4 w-4" />
                                                            <span>{lesson.duration_minutes}m</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant={completed ? "ghost" : "outline"}
                                                    className="ml-4"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        enrollment ? setActiveLesson(lesson) : handleEnroll();
                                                    }}
                                                >
                                                    {completed ? 'Review' : 'Start'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
