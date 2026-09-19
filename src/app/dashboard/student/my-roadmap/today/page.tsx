'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    BookOpen,
    Code,
    FileText
} from 'lucide-react';

export default function TodayPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodaysTasks();
    }, []);

    const fetchTodaysTasks = async () => {
        try {
            const response = await fetch('/api/planner/today');
            const data = await response.json();
            setTasks(data.tasks || []);
            setOverdueTasks(data.overdueTasks || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const completeTask = async (taskId: string, actualMinutes: number) => {
        try {
            const response = await fetch('/api/planner/complete-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    actual_minutes: actualMinutes
                })
            });

            if (response.ok) {
                fetchTodaysTasks(); // Refresh
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'learn': return <BookOpen className="h-5 w-5" />;
            case 'practice': return <Code className="h-5 w-5" />;
            case 'project': return <FileText className="h-5 w-5" />;
            default: return <Circle className="h-5 w-5" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cl-primary)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
            {/* Header */}
            <div className="bg-[var(--cl-surface-card)] border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                        Today's Learning Tasks
                    </h1>
                    <p className="text-[var(--cl-body)]">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <p className="text-sm text-[var(--cl-body)] mb-1">Total Tasks</p>
                        <p className="text-3xl font-semibold text-[var(--cl-ink)]">
                            {stats.totalTasks || 0}
                        </p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-sm text-[var(--cl-body)] mb-1">Completed</p>
                        <p className="text-3xl font-semibold text-[var(--cl-success)]">
                            {stats.completedTasks || 0}
                        </p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-sm text-[var(--cl-body)] mb-1">Time Goal</p>
                        <p className="text-3xl font-semibold text-[var(--cl-info)]">
                            {stats.totalMinutes || 0}m
                        </p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-sm text-[var(--cl-body)] mb-1">Progress</p>
                        <p className="text-3xl font-semibold text-[var(--cl-primary)]">
                            {stats.progress || 0}%
                        </p>
                    </Card>
                </div>

                {/* Progress Bar */}
                {stats.totalTasks > 0 && (
                    <Card className="p-6 mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">Daily Progress</h3>
                            <span className="text-sm text-[var(--cl-body)]">
                                {stats.completedTasks}/{stats.totalTasks} tasks
                            </span>
                        </div>
                        <div className="w-full bg-[var(--cl-surface-strong)] rounded-full h-3">
                            <div
                                className="h-3 rounded-full transition-all duration-500 bg-[var(--cl-primary)]"
                                style={{ width: `${stats.progress || 0}%` }}
                            ></div>
                        </div>
                    </Card>
                )}

                {/* Overdue Tasks */}
                {overdueTasks.length > 0 && (
                    <Card className="p-6 mb-8 border-2 border-[var(--cl-error)] bg-[rgba(239,68,68,0.12)]">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="h-5 w-5 text-[var(--cl-error)]" />
                            <h3 className="font-semibold text-[var(--cl-error)]">
                                Overdue Tasks ({overdueTasks.length})
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {overdueTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 bg-[var(--cl-surface-card)] rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {getTaskIcon(task.task_type)}
                                        <div>
                                            <p className="font-medium text-[var(--cl-ink)]">{task.title}</p>
                                            <p className="text-sm text-[var(--cl-body)]">
                                                Due: {new Date(task.scheduled_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => completeTask(task.id, task.estimated_minutes)}
                                    >
                                        Complete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Today's Tasks */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">Today's Tasks</h3>

                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle2 className="h-16 w-16 text-[var(--cl-success)] mx-auto mb-4" />
                            <p className="text-[var(--cl-body)]">
                                {stats.completedTasks > 0
                                    ? "All tasks completed! Great job! 🎉"
                                    : "No tasks scheduled for today"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`p-6 rounded-lg border-2 transition-all ${task.status === 'completed'
                                            ? 'bg-[rgba(22,163,74,0.12)] border-[var(--cl-success)]'
                                            : 'bg-[var(--cl-surface-card)] border-[var(--cl-hairline)] hover:border-[var(--cl-primary)]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="mt-1">
                                                {task.status === 'completed' ? (
                                                    <CheckCircle2 className="h-6 w-6 text-[var(--cl-success)]" />
                                                ) : (
                                                    <Circle className="h-6 w-6 text-[var(--cl-muted-soft)]" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-[var(--cl-ink)]">
                                                        {task.title}
                                                    </h4>
                                                    <Badge variant="outline">
                                                        {task.task_type}
                                                    </Badge>
                                                    {task.priority === 'high' && (
                                                        <Badge variant="destructive">High Priority</Badge>
                                                    )}
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-[var(--cl-body)] mb-3">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm text-[var(--cl-muted)]">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{task.estimated_minutes} min</span>
                                                    </div>
                                                    {task.node?.title && (
                                                        <div className="flex items-center gap-1">
                                                            <BookOpen className="h-4 w-4" />
                                                            <span>{task.node.title}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {task.status !== 'completed' && (
                                            <Button
                                                onClick={() => completeTask(task.id, task.estimated_minutes)}
                                                className="ml-4"
                                            >
                                                Mark Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

