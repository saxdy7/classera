'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, BookOpen, MessageSquare, Award, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Analytics {
  testPerformance?: {
    totalTests: number;
    averageScore: number;
    submissions: any[];
    trend: number;
  };
  courseProgress?: {
    totalEnrolled: number;
    completed: number;
    inProgress: number;
    enrollments: any[];
  };
  communityActivity?: {
    totalCommunities: number;
    messagesThisMonth: number;
  };
  timeAnalysis?: Array<{
    date: string;
    tests: number;
    messages: number;
  }>;
  testManagement?: {
    totalTests: number;
    totalSubmissions: number;
    uniqueStudents: number;
  };
  communityManagement?: {
    totalCommunities: number;
    totalMembers: number;
  };
  courseManagement?: {
    totalCourses: number;
    totalEnrollments: number;
  };
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export default function AnalyticsDashboard({ role }: { role: 'student' | 'mentor' }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-6 text-center text-gray-500">No analytics data available</div>;
  }

  if (role === 'student') {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Analytics
          </h1>
          <p className="text-gray-600 mt-2">Track your learning progress and performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.testPerformance?.averageScore.toFixed(1)}%
                </p>
                {analytics.testPerformance && analytics.testPerformance.trend !== 0 && (
                  <div className={`flex items-center mt-2 text-sm ${
                    analytics.testPerformance.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.testPerformance.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(analytics.testPerformance.trend)}% vs previous
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Courses Progress</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.courseProgress?.completed}/{analytics.courseProgress?.totalEnrolled}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {analytics.courseProgress?.inProgress} in progress
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Community Activity</p>
                <p className="text-3xl font-bold text-pink-600">
                  {analytics.communityActivity?.messagesThisMonth}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  messages this month
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Performance Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.testPerformance?.submissions.slice(-10) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="submitted_at" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Activity Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.timeAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tests" fill="#8B5CF6" name="Tests" />
                <Bar dataKey="messages" fill="#EC4899" name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Course Progress Pie Chart */}
        {analytics.courseProgress && analytics.courseProgress.totalEnrolled > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Course Completion Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: analytics.courseProgress.completed },
                    { name: 'In Progress', value: analytics.courseProgress.inProgress },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    );
  }

  // Mentor Analytics
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Mentor Analytics
        </h1>
        <p className="text-gray-600 mt-2">Overview of your teaching impact</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tests</p>
              <p className="text-3xl font-bold text-indigo-600">
                {analytics.testManagement?.totalTests}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {analytics.testManagement?.totalSubmissions} submissions
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Communities</p>
              <p className="text-3xl font-bold text-purple-600">
                {analytics.communityManagement?.totalCommunities}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {analytics.communityManagement?.totalMembers} members
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Courses</p>
              <p className="text-3xl font-bold text-pink-600">
                {analytics.courseManagement?.totalCourses}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {analytics.courseManagement?.totalEnrollments} enrollments
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Teaching Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Tests', value: analytics.testManagement?.totalTests || 0 },
                { name: 'Communities', value: analytics.communityManagement?.totalCommunities || 0 },
                { name: 'Courses', value: analytics.courseManagement?.totalCourses || 0 },
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {[0, 1, 2].map((index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
