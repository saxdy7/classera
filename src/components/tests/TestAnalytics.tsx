'use client';

import { useState, useEffect } from 'react';
import { 
    BarChart3, TrendingUp, TrendingDown, Users, Clock, 
    Target, Award, AlertCircle, CheckCircle, XCircle,
    Download, RefreshCw, X
} from 'lucide-react';

interface TestAnalyticsProps {
    testId: string;
    onClose?: () => void;
}

interface AnalyticsData {
    summary: {
        total_invited: number;
        total_submitted: number;
        completion_rate: number;
        average_score: number;
        highest_score: number;
        lowest_score: number;
        average_time_minutes: number;
        pass_rate: number;
    };
    grade_distribution: {
        grade: string;
        count: number;
        percentage: number;
    }[];
    question_analysis: {
        question_id: string;
        question_text: string;
        correct_count: number;
        incorrect_count: number;
        skip_count: number;
        difficulty_rating: 'easy' | 'medium' | 'hard';
        avg_time_seconds: number;
    }[];
    time_distribution: {
        range: string;
        count: number;
    }[];
    score_trend: {
        date: string;
        avg_score: number;
        submissions: number;
    }[];
}

export function TestAnalytics({ testId, onClose }: TestAnalyticsProps) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [testId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/tests/${testId}/analytics`);
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCsv = async () => {
        try {
            const response = await fetch(`/api/tests/${testId}/export?format=csv`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test-results-${testId}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export results');
        }
    };

    const content = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (error || !analytics) {
            return (
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <p className="text-muted-foreground">{error || 'No analytics available'}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-accent-purple hover:bg-accent-purple/10 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            );
        }

        const { summary, grade_distribution, question_analysis, time_distribution } = analytics;

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-foreground/80">Completion Rate</span>
                            <Users className="w-5 h-5 text-accent-purple" />
                        </div>
                        <p className="text-3xl font-semibold text-foreground">
                            {summary.completion_rate.toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {summary.total_submitted}/{summary.total_invited} submitted
                        </p>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-foreground/80">Average Score</span>
                            <Target className="w-5 h-5 text-accent-purple" />
                        </div>
                        <p className="text-3xl font-semibold text-accent-purple">
                            {summary.average_score.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            High: {summary.highest_score}% | Low: {summary.lowest_score}%
                        </p>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-foreground/80">Pass Rate</span>
                            <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-semibold text-green-600">
                            {summary.pass_rate.toFixed(0)}%
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            {summary.pass_rate >= 70 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                            <span className="text-sm text-muted-foreground">
                                {summary.pass_rate >= 70 ? 'Good' : 'Needs attention'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-foreground/80">Avg Time</span>
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-3xl font-semibold text-foreground">
                            {summary.average_time_minutes.toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">minutes</p>
                    </div>
                </div>

                {/* Grade Distribution */}
                <div className="bg-muted/40 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Grade Distribution</h3>
                    <div className="space-y-3">
                        {grade_distribution.map((grade) => (
                            <div key={grade.grade} className="flex items-center gap-4">
                                <div className="w-12 text-sm font-medium text-foreground/80">
                                    {grade.grade}
                                </div>
                                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full rounded-lg transition-all ${
                                            grade.grade === 'A' ? 'bg-green-600' :
                                            grade.grade === 'B' ? 'bg-accent-purple' :
                                            grade.grade === 'C' ? 'bg-amber-500' :
                                            grade.grade === 'D' ? 'bg-amber-500' :
                                            'bg-destructive'
                                        }`}
                                        style={{ width: `${grade.percentage}%` }}
                                    />
                                </div>
                                <div className="w-20 text-right">
                                    <span className="text-sm font-medium text-foreground">
                                        {grade.count}
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-1">
                                        ({grade.percentage.toFixed(0)}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question Analysis */}
                <div className="bg-muted/40 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Question Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/80">Question</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-foreground/80">Correct</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-foreground/80">Incorrect</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-foreground/80">Skipped</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-foreground/80">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {question_analysis.map((q, index) => {
                                    return (
                                        <tr key={q.question_id} className="border-b border-border">
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-foreground font-medium">Q{index + 1}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                    {q.question_text}
                                                </p>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {q.correct_count}
                                                </span>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <span className="inline-flex items-center gap-1 text-sm text-destructive">
                                                    <XCircle className="w-4 h-4" />
                                                    {q.incorrect_count}
                                                </span>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <span className="text-sm text-muted-foreground">{q.skip_count}</span>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    q.difficulty_rating === 'easy' ? 'bg-green-500/10 text-green-600' :
                                                    q.difficulty_rating === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                                                    'bg-destructive/10 text-destructive'
                                                }`}>
                                                    {q.difficulty_rating}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Time Distribution */}
                <div className="bg-muted/40 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Time Distribution</h3>
                    <div className="flex items-end gap-2 h-40">
                        {time_distribution.map((item, index) => {
                            const maxCount = Math.max(...time_distribution.map(t => t.count));
                            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-primary rounded-t-lg transition-all"
                                        style={{ height: `${height}%`, minHeight: item.count > 0 ? '8px' : '0' }}
                                    />
                                    <span className="text-xs text-muted-foreground">{item.range}</span>
                                    <span className="text-xs font-medium text-foreground/80">{item.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // If onClose is provided, render as modal
    if (onClose) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-2xl font-semibold text-foreground">Test Analytics</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchAnalytics}
                                className="p-2 text-foreground/80 hover:bg-muted rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={exportToCsv}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-foreground/80 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {content()}
                    </div>
                </div>
            </div>
        );
    }

    // Otherwise render inline
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Test Analytics</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAnalytics}
                        className="p-2 text-foreground/80 hover:bg-muted rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={exportToCsv}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>
            {content()}
        </div>
    );
}

export default TestAnalytics;
