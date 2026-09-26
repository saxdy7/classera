'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Clock, Play, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Enrollment {
    id: string;
    course_id: string;
    course_type: string;
    external_course_id?: string;
    external_platform?: string;
    progress_percentage: number;
    completed: boolean;
    enrolled_at: string;
    last_accessed_at: string;
    course?: {
        id: string;
        title: string;
        description: string;
        thumbnail_url: string;
        duration_hours: number;
        level: string;
        skills: string[];
        mentor?: {
            full_name: string;
            avatar_url: string;
        };
    };
}

export function EnrolledCourses() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

    useEffect(() => {
        fetchEnrollments();
    }, [filter]);

    const fetchEnrollments = async () => {
        try {
            const response = await fetch(`/api/courses/enroll?filter=${filter}`);
            const data = await response.json();
            setEnrollments(data.enrollments || []);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (enrollmentId: string) => {
        if (!confirm('Are you sure you want to unenroll from this course?')) return;

        try {
            await fetch(`/api/courses/enroll?id=${enrollmentId}`, { method: 'DELETE' });
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
        } catch (error) {
            console.error('Error unenrolling:', error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No enrolled courses</h3>
                <p className="text-foreground/80 mb-6">Start learning by enrolling in a course!</p>
                <Link
                    href="/dashboard/student/courses"
                    className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity bg-primary"
                >
                    Browse Courses
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">My Courses</h2>
                <div className="flex w-fit items-center gap-1 rounded border border-border/40 bg-muted p-1">
                    {(['all', 'in-progress', 'completed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`cursor-pointer rounded-sm px-4 py-1.5 text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Enrolled Courses List */}
            <div className="space-y-4">
                {enrollments.map(enrollment => (
                    <div
                        key={enrollment.id}
                        className="bg-card rounded-lg border border-border p-4 transition-shadow"
                    >
                        <div className="flex gap-4">
                            {/* Thumbnail */}
                            <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={enrollment.course?.thumbnail_url || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400'}
                                    alt={enrollment.course?.title || 'Course'}
                                    fill
                                    className="object-cover"
                                />
                                {enrollment.completed && (
                                    <div className="absolute inset-0 bg-[rgba(22,163,74,0.8)] flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">✓ COMPLETED</span>
                                    </div>
                                )}
                            </div>

                            {/* Course Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-foreground line-clamp-1">
                                            {enrollment.course?.title || `External Course (${enrollment.external_platform})`}
                                        </h3>
                                        <p className="text-sm text-foreground/80 mt-1">
                                            {enrollment.course?.mentor?.full_name || enrollment.external_platform}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleUnenroll(enrollment.id)}
                                        className="p-2 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-foreground/80">Progress</span>
                                        <span className="font-semibold text-accent-purple">{enrollment.progress_percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all bg-primary"
                                            style={{ width: `${enrollment.progress_percentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        {enrollment.course?.duration_hours || '10'} hours
                                    </div>
                                    <Link
                                        href={enrollment.course ? `/dashboard/student/courses/${enrollment.course_id}/learn` : '#'}
                                        className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm bg-primary"
                                    >
                                        <Play className="w-4 h-4" />
                                        {enrollment.progress_percentage > 0 ? 'Continue' : 'Start Learning'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
