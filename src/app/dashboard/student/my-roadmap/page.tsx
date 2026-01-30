'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    Circle,
    Clock,
    Calendar,
    TrendingUp,
    Target,
    Flame
} from 'lucide-react';

export default function MyRoadmapPage() {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyPlan();
    }, []);

    const fetchMyPlan = async () => {
        try {
            const response = await fetch('/api/planner/my-plan');
            const data = await response.json();
            setPlan(data.plan);
        } catch (error) {
            console.error('Error fetching plan:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        No Active Learning Plan
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Start a roadmap to begin your learning journey
                    </p>
                    <Button onClick={() => router.push('/roadmaps')}>
                        Browse Roadmaps
                    </Button>
                </div>
            </div>
        );
    }

    const stats = plan.stats || {};
    const progress = stats.completionPercentage || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {plan.roadmap?.title}
                            </h1>
                            <p className="text-gray-600">
                                {plan.roadmap?.description}
                            </p>
                        </div>
                        <Button onClick={() => router.push('/dashboard/student/my-roadmap/today')}>
                            View Today's Tasks
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Progress</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {progress}%
                                </p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-purple-600" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Completed</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.completedNodes}/{stats.totalNodes}
                                </p>
                            </div>
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Days Active</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.daysActive || 0}
                                </p>
                            </div>
                            <Calendar className="h-10 w-10 text-blue-600" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Daily Goal</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    {plan.daily_time_minutes}m
                                </p>
                            </div>
                            <Flame className="h-10 w-10 text-orange-600" />
                        </div>
                    </Card>
                </div>

                {/* Progress Bar */}
                <Card className="p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                        {stats.completedNodes} of {stats.totalNodes} steps completed
                    </p>
                </Card>

                {/* Roadmap Nodes */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">Learning Path</h3>
                    <div className="space-y-4">
                        {plan.progress?.map((item: any, index: number) => (
                            <div
                                key={item.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${item.status === 'completed'
                                        ? 'bg-green-50 border-green-200'
                                        : item.status === 'in_progress'
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-white border-gray-200'
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {item.status === 'completed' ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900">
                                            {item.node?.title}
                                        </h4>
                                        <Badge variant={
                                            item.status === 'completed' ? 'default' :
                                                item.status === 'in_progress' ? 'secondary' :
                                                    'outline'
                                        }>
                                            {item.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {item.node?.description}
                                    </p>
                                    {item.node?.estimated_hours && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="h-4 w-4" />
                                            <span>{item.node.estimated_hours} hours</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
