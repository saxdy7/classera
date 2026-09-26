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
        <p className="text-muted-foreground font-medium">You don't have any students at {universityName} yet</p>
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
        <p className="text-xl text-muted-foreground font-medium">
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
              className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl flex items-center justify-between hover:border-border transition-all font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                {selectedStudent.avatar_url ? (
                  <img
                    src={selectedStudent.avatar_url}
                    alt={selectedStudent.full_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl z-10 max-h-96 overflow-hidden flex flex-col">
                {/* Search Input */}
                <div className="p-3 border-b border-border sticky top-0 bg-card">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm font-medium"
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
                        className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border last:border-0 hover:bg-muted/40 transition-all text-left ${
                          selectedStudent.id === student.id ? 'bg-accent-purple/10' : ''
                        }`}
                      >
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.full_name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {student.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.specialization_board || 'Student'} • Sem {student.current_semester || 1}
                          </p>
                        </div>
                        {selectedStudent.id === student.id && (
                          <CheckCircle className="w-5 h-5 text-accent-purple flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  {students.filter(
                    (s) =>
                      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.specialization_board?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No students found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Overview Card */}
        <div className="lg:col-span-2 rounded-xl p-6 text-white bg-primary">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-accent-purple text-sm font-semibold mb-1">Student Profile</p>
              <h2 className="text-2xl md:text-3xl font-semibold">{selectedStudent.full_name}</h2>
              <p className="text-accent-purple text-sm mt-1 font-medium">
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
                className="flex items-center gap-2 text-white hover:text-accent-purple transition-colors font-semibold text-sm group"
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
                className="flex items-center gap-2 text-white hover:text-accent-purple transition-colors font-semibold text-sm group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="truncate">{selectedStudent.linkedin_url}</span>
              </a>
            )}
            {!selectedStudent.github_url && !selectedStudent.linkedin_url && (
              <p className="text-accent-purple text-xs italic">No social profiles linked</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-accent-purple text-xs font-semibold uppercase tracking-widest mb-1">Joined</p>
              <p className="text-lg font-semibold">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-accent-purple text-xs font-semibold uppercase tracking-widest mb-1">Last Active</p>
              <p className="text-lg font-semibold">{metrics?.lastActive || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Roadmaps Created */}
            <div className="bg-card rounded-xl p-6 border-2 border-border transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-accent-purple/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-accent-purple" />
                </div>
                <span className="text-2xl font-semibold text-accent-purple">{metrics?.roadmapsCreated || 0}</span>
              </div>
              <p className="text-sm font-semibold text-foreground/80 mb-1">Roadmaps Created</p>
              <p className="text-xs text-muted-foreground">{metrics?.roadmapsCreated === 0 ? 'No learning paths yet' : 'Learning paths designed'}</p>
            </div>

            {/* Courses Completed */}
            <div className="bg-card rounded-xl p-6 border-2 border-border transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-semibold text-green-600">
                  {metrics?.coursesCompleted || 0}/{metrics?.coursesEnrolled || 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground/80 mb-1">Courses Completed</p>
              <p className="text-xs text-muted-foreground">{metrics?.coursesEnrolled === 0 ? 'Not enrolled in courses' : 'Out of enrolled courses'}</p>
            </div>

            {/* Tasks Completed */}
            <div className="bg-card rounded-xl p-6 border-2 border-border transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-accent-purple/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-accent-purple" />
                </div>
                <span className="text-2xl font-semibold text-accent-purple">
                  {metrics?.tasksCompleted || 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground/80 mb-1">Tasks Completed</p>
              <p className="text-xs text-muted-foreground">{completionPercentage}% completion rate</p>
            </div>

            {/* GitHub Connected */}
            <div className="bg-card rounded-xl p-6 border-2 border-border transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${metrics?.githubConnected ? 'bg-muted' : 'bg-muted'}`}>
                  <Github className={`w-6 h-6 ${metrics?.githubConnected ? 'text-foreground' : 'text-muted-foreground/70'}`} />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-lg ${
                  metrics?.githubConnected
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {metrics?.githubConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground/80 mb-1">GitHub Account</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.githubUsername ? `@${metrics.githubUsername}` : 'No GitHub profile linked'}
              </p>
            </div>
          </div>

          {/* Activity & Engagement Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Progress Bar */}
            <div className="lg:col-span-2 bg-card rounded-xl p-8 border-2 border-border">
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Learning Progress</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Task completion & engagement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-accent-purple">{completionPercentage}%</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">Overall Progress</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full bg-primary"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-semibold text-foreground/80 uppercase tracking-widest">Streak</p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.streakDays || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Days</p>
                </div>

                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-accent-purple" />
                    <p className="text-xs font-semibold text-foreground/80 uppercase tracking-widest">Hours</p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.totalHours || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
                </div>

                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-accent-purple" />
                    <p className="text-xs font-semibold text-foreground/80 uppercase tracking-widest">Messages</p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.messagesCount || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">With Mentor</p>
                </div>

                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-foreground/80 uppercase tracking-widest">Activity</p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {metrics && metrics.lastActive === 'Today' ? '🔥' : '📊'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics?.lastActive || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="space-y-4">
              {/* Performance Summary */}
              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-accent-purple" />
                  <h3 className="font-semibold text-foreground">Performance Summary</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground/80">Engagement</span>
                      <span className="text-xs font-semibold text-accent-purple">
                        {Math.min(Math.round((metrics?.streakDays || 0) * 3.33), 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(Math.round((metrics?.streakDays || 0) * 3.33), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground/80">Learning</span>
                      <span className="text-xs font-semibold text-accent-purple">{completionPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${completionPercentage}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground/80">Courses</span>
                      <span className="text-xs font-semibold text-accent-purple">
                        {metrics ? Math.round((metrics.coursesCompleted / Math.max(metrics.coursesEnrolled, 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
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
                className="w-full px-6 py-4 text-white font-semibold rounded-xl text-center transition-all active:scale-95 bg-primary"
              >
                💬 Message Student
              </Link>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div className="bg-card rounded-xl p-8 border-2 border-border">
            <h3 className="text-xl font-semibold text-foreground mb-2">Teaching Distribution</h3>
            <p className="text-sm text-muted-foreground font-medium mb-8">Overview of student engagement across different areas</p>

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
                  <div className="w-4 h-4 rounded-full bg-green-600" />
                  <span className="font-semibold text-foreground/80">{metrics?.coursesCompleted || 0} Courses Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-accent-purple" />
                  <span className="font-semibold text-foreground/80">{metrics?.roadmapsCreated || 0} Roadmaps Created</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground/80">{metrics?.tasksCompleted || 0} Tasks Done</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground/80">
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
