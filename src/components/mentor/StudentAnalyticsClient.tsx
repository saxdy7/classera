'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Github, BookOpen, MapPin, Target, CheckCircle, Clock, Zap, MessageSquare, Award, TrendingUp, Search, Linkedin } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  avatar_url: string | null;
  specialization_board: string;
  current_semester: number;
  created_at: string;
  github_url?: string;
  linkedin_url?: string;
  github_username?: string;
  university_id?: string;
  role?: string;
}

interface StudentAnalyticsClientProps {
  mentorId: string;
  students: Student[];
  universityName: string;
}

interface StudentMetrics {
  roadmapsCreated: number;
  coursesCompleted: number;
  coursesEnrolled: number;
  tasksCompleted: number;
  tasksTotal: number;
  githubConnected: boolean;
  githubUsername?: string;
  lastActive: string;
  joinDate: string;
  totalHours: number;
  streakDays: number;
  messagesCount: number;
}

export function StudentAnalyticsClient({
  mentorId,
  students,
  universityName,
}: StudentAnalyticsClientProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[0] || null);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentMetrics(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudentMetrics = async (studentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mentor/student-metrics?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        console.error('API error:', response.status);
        // Set default empty metrics on error
        setMetrics({
          roadmapsCreated: 0,
          coursesCompleted: 0,
          coursesEnrolled: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
          githubConnected: false,
          githubUsername: undefined,
          lastActive: 'Never',
          joinDate: new Date(selectedStudent?.created_at || Date.now()).toLocaleDateString(),
          totalHours: 0,
          streakDays: 0,
          messagesCount: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Set default empty metrics on error
      setMetrics({
        roadmapsCreated: 0,
        coursesCompleted: 0,
        coursesEnrolled: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        githubConnected: false,
        githubUsername: undefined,
        lastActive: 'Never',
        joinDate: new Date(selectedStudent?.created_at || Date.now()).toLocaleDateString(),
        totalHours: 0,
        streakDays: 0,
        messagesCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">👤</div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">No Students Available</h1>
        <p className="text-[var(--cl-muted)] font-medium">You don't have any students at {universityName} yet</p>
      </div>
    );
  }

  const completionPercentage = metrics
    ? Math.round((metrics.tasksCompleted / Math.max(metrics.tasksTotal, 1)) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-5xl mb-2">
          Student Analytics
        </h1>
        <p className="text-xl text-[var(--cl-muted)] font-medium">
          Monitor student performance and engagement
        </p>
      </div>

      {/* Student Selector and Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Student Selector */}
        <div className="lg:col-span-1">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-3 bg-[var(--cl-surface-card)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] flex items-center justify-between hover:border-[var(--cl-hairline-strong)] transition-all font-semibold text-[var(--cl-ink)]"
            >
              <span className="flex items-center gap-2">
                {selectedStudent.avatar_url ? (
                  <img
                    src={selectedStudent.avatar_url}
                    alt={selectedStudent.full_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--cl-primary)] flex items-center justify-center text-[var(--cl-on-dark)] text-xs font-semibold">
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                )}
                {selectedStudent.full_name}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--cl-surface-card)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] z-10 max-h-96 overflow-hidden flex flex-col">
                {/* Search Input */}
                <div className="p-3 border-b border-[var(--cl-hairline)] sticky top-0 bg-[var(--cl-surface-card)]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cl-muted-soft)]" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[var(--cl-canvas-soft)] border border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] text-sm font-medium"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Student List */}
                <div className="overflow-y-auto max-h-80">
                  {students
                    .filter(
                      (student) =>
                        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        student.specialization_board?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 border-b border-[var(--cl-hairline)] last:border-0 hover:bg-[var(--cl-canvas-soft)] transition-all text-left ${
                          selectedStudent.id === student.id ? 'bg-[var(--cl-primary-soft)]' : ''
                        }`}
                      >
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.full_name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[var(--cl-primary)] flex items-center justify-center text-[var(--cl-on-dark)] text-xs font-semibold flex-shrink-0">
                            {student.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--cl-ink)] truncate">{student.full_name}</p>
                          <p className="text-xs text-[var(--cl-muted)] truncate">
                            {student.specialization_board || 'Student'} • Sem {student.current_semester || 1}
                          </p>
                        </div>
                        {selectedStudent.id === student.id && (
                          <CheckCircle className="w-5 h-5 text-[var(--cl-primary)] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  {students.filter(
                    (s) =>
                      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.specialization_board?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="p-8 text-center text-[var(--cl-muted)]">
                      <p className="text-sm font-medium">No students found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Overview Card */}
        <div className="lg:col-span-2 rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)] bg-[var(--cl-primary)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[var(--cl-primary)] text-sm font-semibold mb-1">Student Profile</p>
              <h2 className="text-2xl md:text-3xl font-semibold">{selectedStudent.full_name}</h2>
              <p className="text-[var(--cl-primary)] text-sm mt-1 font-medium">
                {selectedStudent.specialization_board || 'Student'} • Semester {selectedStudent.current_semester || 1}
              </p>
            </div>
            {selectedStudent.avatar_url && (
              <img
                src={selectedStudent.avatar_url}
                alt={selectedStudent.full_name}
                className="w-16 h-16 rounded-full object-cover border-4 border-[rgba(255,255,255,0.2)]"
              />
            )}
          </div>

          {/* GitHub & LinkedIn Links - VISIBLE */}
          <div className="space-y-2 mb-6 pt-4 border-t border-[rgba(255,255,255,0.2)]">
            {selectedStudent.github_url && (
              <a
                href={selectedStudent.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--cl-on-dark)] hover:text-[var(--cl-primary)] transition-colors font-semibold text-sm group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="truncate">{selectedStudent.github_url}</span>
              </a>
            )}
            {selectedStudent.linkedin_url && (
              <a
                href={selectedStudent.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--cl-on-dark)] hover:text-[var(--cl-primary)] transition-colors font-semibold text-sm group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="truncate">{selectedStudent.linkedin_url}</span>
              </a>
            )}
            {!selectedStudent.github_url && !selectedStudent.linkedin_url && (
              <p className="text-[var(--cl-primary)] text-xs italic">No social profiles linked</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[var(--cl-primary)] text-xs font-semibold uppercase tracking-widest mb-1">Joined</p>
              <p className="text-lg font-semibold">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[var(--cl-primary)] text-xs font-semibold uppercase tracking-widest mb-1">Last Active</p>
              <p className="text-lg font-semibold">{metrics?.lastActive || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cl-primary)]"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Roadmaps Created */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)]">
                  <MapPin className="w-6 h-6 text-[var(--cl-primary)]" />
                </div>
                <span className="text-2xl font-semibold text-[var(--cl-primary)]">{metrics?.roadmapsCreated || 0}</span>
              </div>
              <p className="text-sm font-semibold text-[var(--cl-body)] mb-1">Roadmaps Created</p>
              <p className="text-xs text-[var(--cl-muted)]">{metrics?.roadmapsCreated === 0 ? 'No learning paths yet' : 'Learning paths designed'}</p>
            </div>

            {/* Courses Completed */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[rgba(22,163,74,0.12)] rounded-[var(--cl-r-lg)]">
                  <BookOpen className="w-6 h-6 text-[var(--cl-success)]" />
                </div>
                <span className="text-2xl font-semibold text-[var(--cl-success)]">
                  {metrics?.coursesCompleted || 0}/{metrics?.coursesEnrolled || 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--cl-body)] mb-1">Courses Completed</p>
              <p className="text-xs text-[var(--cl-muted)]">{metrics?.coursesEnrolled === 0 ? 'Not enrolled in courses' : 'Out of enrolled courses'}</p>
            </div>

            {/* Tasks Completed */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[rgba(13,116,206,0.12)] rounded-[var(--cl-r-lg)]">
                  <CheckCircle className="w-6 h-6 text-[var(--cl-info)]" />
                </div>
                <span className="text-2xl font-semibold text-[var(--cl-info)]">
                  {metrics?.tasksCompleted || 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--cl-body)] mb-1">Tasks Completed</p>
              <p className="text-xs text-[var(--cl-muted)]">{completionPercentage}% completion rate</p>
            </div>

            {/* GitHub Connected */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-[var(--cl-r-lg)] ${metrics?.githubConnected ? 'bg-[var(--cl-surface-strong)]' : 'bg-[var(--cl-surface-strong)]'}`}>
                  <Github className={`w-6 h-6 ${metrics?.githubConnected ? 'text-[var(--cl-ink)]' : 'text-[var(--cl-muted-soft)]'}`} />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-lg ${
                  metrics?.githubConnected
                    ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]'
                    : 'bg-[var(--cl-surface-strong)] text-[var(--cl-muted)]'
                }`}>
                  {metrics?.githubConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--cl-body)] mb-1">GitHub Account</p>
              <p className="text-xs text-[var(--cl-muted)]">
                {metrics?.githubUsername ? `@${metrics.githubUsername}` : 'No GitHub profile linked'}
              </p>
            </div>
          </div>

          {/* Activity & Engagement Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Progress Bar */}
            <div className="lg:col-span-2 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-8 border-2 border-[var(--cl-hairline)]">
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--cl-ink)]">Learning Progress</h3>
                    <p className="text-sm text-[var(--cl-muted)] font-medium mt-1">Task completion & engagement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-[var(--cl-primary)]">{completionPercentage}%</p>
                    <p className="text-xs text-[var(--cl-muted)] font-semibold mt-1">Overall Progress</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full bg-[var(--cl-primary)]"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[var(--cl-warning)]" />
                    <p className="text-xs font-semibold text-[var(--cl-body)] uppercase tracking-widest">Streak</p>
                  </div>
                  <p className="text-2xl font-semibold text-[var(--cl-ink)]">{metrics?.streakDays || 0}</p>
                  <p className="text-xs text-[var(--cl-muted)] mt-1">Days</p>
                </div>

                <div className="p-4 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-[var(--cl-info)]" />
                    <p className="text-xs font-semibold text-[var(--cl-body)] uppercase tracking-widest">Hours</p>
                  </div>
                  <p className="text-2xl font-semibold text-[var(--cl-ink)]">{metrics?.totalHours || 0}</p>
                  <p className="text-xs text-[var(--cl-muted)] mt-1">Total Spent</p>
                </div>

                <div className="p-4 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)]">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-[var(--cl-primary)]" />
                    <p className="text-xs font-semibold text-[var(--cl-body)] uppercase tracking-widest">Messages</p>
                  </div>
                  <p className="text-2xl font-semibold text-[var(--cl-ink)]">{metrics?.messagesCount || 0}</p>
                  <p className="text-xs text-[var(--cl-muted)] mt-1">With Mentor</p>
                </div>

                <div className="p-4 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[var(--cl-success)]" />
                    <p className="text-xs font-semibold text-[var(--cl-body)] uppercase tracking-widest">Activity</p>
                  </div>
                  <p className="text-2xl font-semibold text-[var(--cl-ink)]">
                    {metrics && metrics.lastActive === 'Today' ? '🔥' : '📊'}
                  </p>
                  <p className="text-xs text-[var(--cl-muted)] mt-1">{metrics?.lastActive || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="space-y-4">
              {/* Performance Summary */}
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)]">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[var(--cl-primary)]" />
                  <h3 className="font-semibold text-[var(--cl-ink)]">Performance Summary</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--cl-body)]">Engagement</span>
                      <span className="text-xs font-semibold text-[var(--cl-primary)]">
                        {Math.min(Math.round((metrics?.streakDays || 0) * 3.33), 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--cl-primary)] rounded-full"
                        style={{ width: `${Math.min(Math.round((metrics?.streakDays || 0) * 3.33), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--cl-body)]">Learning</span>
                      <span className="text-xs font-semibold text-[var(--cl-primary)]">{completionPercentage}%</span>
                    </div>
                    <div className="h-2 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--cl-primary)] rounded-full" style={{ width: `${completionPercentage}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--cl-body)]">Courses</span>
                      <span className="text-xs font-semibold text-[var(--cl-primary)]">
                        {metrics ? Math.round((metrics.coursesCompleted / Math.max(metrics.coursesEnrolled, 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--cl-primary)] rounded-full"
                        style={{
                          width: `${metrics ? Math.round((metrics.coursesCompleted / Math.max(metrics.coursesEnrolled, 1)) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/dashboard/mentor/messages?userId=${selectedStudent.id}`}
                className="w-full px-6 py-4 text-[var(--cl-on-dark)] font-semibold rounded-[var(--cl-r-xl)] text-center transition-all active:scale-95 bg-[var(--cl-primary)]"
              >
                💬 Message Student
              </Link>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-8 border-2 border-[var(--cl-hairline)]">
            <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">Teaching Distribution</h3>
            <p className="text-sm text-[var(--cl-muted)] font-medium mb-8">Overview of student engagement across different areas</p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              {/* Pie Chart Simulation */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                  {/* Pie segments based on metrics */}
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="url(#gradientCourses)"
                    strokeWidth="60"
                    stroke="url(#gradientCourses)"
                    pathLength="100"
                    strokeDasharray={`${(metrics?.coursesCompleted || 0) * 20} 100`}
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="gradientCourses" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="gradientRoadmaps" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="gradientTasks" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>

                  <text x="50" y="48" textAnchor="middle" className="text-2xl font-semibold" fill="#1f2937">
                    {metrics?.coursesCompleted || 0}
                  </text>
                  <text x="50" y="58" textAnchor="middle" className="text-xs" fill="#6b7280">
                    Courses
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[var(--cl-success)]" />
                  <span className="font-semibold text-[var(--cl-body)]">{metrics?.coursesCompleted || 0} Courses Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[var(--cl-info)]" />
                  <span className="font-semibold text-[var(--cl-body)]">{metrics?.roadmapsCreated || 0} Roadmaps Created</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[var(--cl-primary)]" />
                  <span className="font-semibold text-[var(--cl-body)]">{metrics?.tasksCompleted || 0} Tasks Done</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[var(--cl-primary)]" />
                  <span className="font-semibold text-[var(--cl-body)]">
                    {(metrics?.tasksTotal || 0) - (metrics?.tasksCompleted || 0)} Tasks Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
