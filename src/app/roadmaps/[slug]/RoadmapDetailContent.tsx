'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// ... imports
import {
    ArrowLeft,
    Play,
    BookOpen,
    Clock,
    Star,
    CheckCircle2,
    Circle,
    X,
    ExternalLink,
    FileText,
    Video
} from 'lucide-react';

export function RoadmapDetailContent() {
    const params = useParams();
    const router = useRouter();
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any>(null); // New state

    useEffect(() => {
        if (params.slug) {
            fetchRoadmap();
        }
    }, [params.slug]);

    const fetchRoadmap = async () => {
        try {
            const response = await fetch('/api/roadmaps');
            const data = await response.json();
            const found = data.roadmaps?.find((r: any) => r.slug === params.slug);

            if (found) {
                const detailResponse = await fetch(`/api/roadmaps/${found.id}`);
                const detailData = await detailResponse.json();
                setRoadmap(detailData.roadmap);
            }
        } catch (error) {
            console.error('Error fetching roadmap:', error);
        } finally {
            setLoading(false);
        }
    };

    const startLearningPlan = async () => {
        if (!roadmap) return;

        setStarting(true);
        try {
            const response = await fetch(`/api/roadmaps/${roadmap.id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    daily_time_minutes: 60,
                    target_weeks: roadmap.estimated_weeks
                })
            });

            if (response.ok) {
                router.push('/dashboard/student/my-roadmap');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to start learning plan');
            }
        } catch (error) {
            console.error('Error starting plan:', error);
            alert('Failed to start learning plan');
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        // ... existing loading state
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cl-primary)]"></div>
            </div>
        );
    }

    if (!roadmap) {
        // ... existing not found
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-2">
                    Roadmap Not Found
                </h2>
                <Button onClick={() => router.push('/roadmaps')}>
                    Back to Roadmaps
                </Button>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]';
            case 'intermediate': return 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]';
            case 'advanced': return 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]';
            default: return 'bg-[var(--cl-surface-strong)] text-[var(--cl-ink)]';
        }
    };

    return (
        <div className="p-4 md:p-8 relative min-h-screen">
            <Button
                variant="ghost"
                onClick={() => router.push('/roadmaps')}
                className="mb-4"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roadmaps
            </Button>

            <div className="mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <Badge className={getDifficultyColor(roadmap.difficulty)}>
                                {roadmap.difficulty}
                            </Badge>
                            <Badge variant="outline">{roadmap.type}</Badge>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
                            {roadmap.title}
                        </h1>
                        <p className="text-lg text-[var(--cl-body)] mb-4">
                            {roadmap.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-[var(--cl-body)]">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                <span>{roadmap.total_nodes} learning steps</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                <span>{roadmap.estimated_weeks} weeks</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={startLearningPlan}
                        disabled={starting}
                        className="ml-4 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)]"
                    >
                        {starting ? (
                            <>Starting...</>
                        ) : (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                Start Learning Plan
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex gap-8 relative">
                {/* Main Content - Node List */}
                <div className={`transition-all duration-300 ${selectedNode ? 'w-full md:w-2/3' : 'w-full'}`}>
                    <Card className="p-8">
                        <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-6">
                            Learning Path
                        </h2>

                        {roadmap.nodes && roadmap.nodes.length > 0 ? (
                            <div className="space-y-4">
                                {roadmap.nodes.map((node: any, index: number) => {
                                    const isCompleted = roadmap.userProgress?.some(
                                        (p: any) => p.node_id === node.id && p.status === 'completed'
                                    );
                                    const isSelected = selectedNode?.id === node.id;

                                    return (
                                        <div
                                            key={node.id}
                                            onClick={() => setSelectedNode(node)}
                                            className={`flex items-start gap-4 p-6 rounded-lg border-2 transition-all cursor-pointer ${isSelected
                                                ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)] ring-2 ring-[var(--cl-primary)]'
                                                : isCompleted
                                                    ? 'bg-[rgba(22,163,74,0.12)] border-[var(--cl-success)]'
                                                    : 'bg-[var(--cl-surface-card)] border-[var(--cl-hairline)] hover:border-[var(--cl-primary)]'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${isCompleted
                                                    ? 'bg-[var(--cl-success)] text-[var(--cl-on-dark)]'
                                                    : 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]'
                                                    }`}>
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-6 w-6" />
                                                    ) : (
                                                        <span>{index + 1}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-[var(--cl-ink)]">
                                                        {node.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {node.estimated_hours && (
                                                            <Badge variant="secondary">
                                                                {node.estimated_hours}h
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[var(--cl-body)] mb-2 line-clamp-2">
                                                    {node.description}
                                                </p>
                                                <p className="text-sm text-[var(--cl-primary)] font-medium">
                                                    Click to view details &rarr;
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[var(--cl-body)] text-center py-8">
                                No learning steps defined yet
                            </p>
                        )}
                    </Card>
                </div>

                {/* Right Sidebar for Details */}
                <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-[var(--cl-surface-card)] transform transition-transform duration-300 z-50 overflow-y-auto ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedNode && (
                        <div className="p-8">
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-[var(--cl-surface-strong)] rounded-full"
                            >
                                <X className="h-6 w-6 text-[var(--cl-muted)]" />
                            </button>

                            <div className="mt-8">
                                <Badge className="mb-4 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] hover:bg-[var(--cl-primary)]">
                                    Step {roadmap.nodes.findIndex((n: any) => n.id === selectedNode.id) + 1}
                                </Badge>

                                <h2 className="text-3xl font-semibold text-[var(--cl-ink)] mb-6">
                                    {selectedNode.title}
                                </h2>

                                <div className="prose prose-purple max-w-none mb-8">
                                    <h3 className="text-xl font-semibold mb-3">Overview</h3>
                                    <p className="text-[var(--cl-body)] leading-relaxed whitespace-pre-line">
                                        {selectedNode.detailed_summary || selectedNode.description}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold text-[var(--cl-ink)] flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Learning Resources
                                    </h3>

                                    {selectedNode.resources ? (
                                        <div className="space-y-4">
                                            {/* Handle both Array (New) and Object (Old) formats */}
                                            {Array.isArray(selectedNode.resources) ? (
                                                selectedNode.resources.map((resource: any, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block p-4 rounded-lg border hover:border-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] transition-all group"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {resource.type === 'video' ? (
                                                                <Video className="h-5 w-5 text-[var(--cl-error)] mt-1" />
                                                            ) : (
                                                                <FileText className="h-5 w-5 text-[var(--cl-info)] mt-1" />
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-[var(--cl-ink)] group-hover:text-[var(--cl-primary)]">
                                                                    {resource.title}
                                                                </div>
                                                                <div className="text-xs text-[var(--cl-muted)] mt-1 flex items-center gap-1">
                                                                    {resource.type === 'video' ? 'Video Tutorial' : 'Article / Documentation'} <ExternalLink className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))
                                            ) : (
                                                <>
                                                    {/* Legacy Object Format Support */}
                                                    {selectedNode.resources.videos?.map((video: any, idx: number) => (
                                                        <a
                                                            key={`vid-${idx}`}
                                                            href={video.url || video}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block p-4 rounded-lg border hover:border-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] transition-all group"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <Video className="h-5 w-5 text-[var(--cl-error)] mt-1" />
                                                                <div>
                                                                    <div className="font-medium text-[var(--cl-ink)] group-hover:text-[var(--cl-primary)]">
                                                                        {video.title || "Watch Video Tutorial"}
                                                                    </div>
                                                                    <div className="text-xs text-[var(--cl-muted)] mt-1 flex items-center gap-1">
                                                                        Video Resource <ExternalLink className="h-3 w-3" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                    {selectedNode.resources.articles?.map((article: any, idx: number) => (
                                                        <a
                                                            key={`art-${idx}`}
                                                            href={article.url || article}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block p-4 rounded-lg border hover:border-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] transition-all group"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <FileText className="h-5 w-5 text-[var(--cl-info)] mt-1" />
                                                                <div>
                                                                    <div className="font-medium text-[var(--cl-ink)] group-hover:text-[var(--cl-primary)]">
                                                                        {article.title || "Read Article"}
                                                                    </div>
                                                                    <div className="text-xs text-[var(--cl-muted)] mt-1 flex items-center gap-1">
                                                                        Article / Documentation <ExternalLink className="h-3 w-3" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[var(--cl-muted)] italic">No resources available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop for sidebar on mobile */}
            {selectedNode && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
}
