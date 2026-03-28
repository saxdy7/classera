'use client';

import { useState, useMemo } from 'react';
import { Search, BookOpen, Award } from 'lucide-react';

interface Roadmap {
  id: string;
  title: string;
  progress: number;
}

interface Course {
  id: string;
  title: string;
  subject: string;
}

interface ProfileContentProps {
  roadmaps: Roadmap[] | null;
  courses: Course[] | null;
  githubConn: any;
}

export function ProfileContent({ roadmaps, courses, githubConn }: ProfileContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'roadmaps' | 'courses'>('all');

  // Filter roadmaps based on search
  const filteredRoadmaps = useMemo(() => {
    if (!roadmaps) return [];
    return roadmaps.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roadmaps, searchQuery]);

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search roadmaps & courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Filter Dropdown */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'roadmaps' | 'courses')}
          className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
        >
          <option value="all">All Content</option>
          <option value="roadmaps">Learning Paths Only</option>
          <option value="courses">Courses Only</option>
        </select>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Learning Path - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roadmaps */}
          {(filterType === 'all' || filterType === 'roadmaps') && roadmaps && roadmaps.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Learning Paths
                </h2>
                <span className="text-sm text-slate-500 font-medium">
                  {filteredRoadmaps.length} of {roadmaps.length}
                </span>
              </div>
              
              {filteredRoadmaps.length > 0 ? (
                <div className="space-y-3">
                  {filteredRoadmaps.map(roadmap => (
                    <div key={roadmap.id} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition">
                      <p className="font-medium text-black">{roadmap.title}</p>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all" 
                          style={{ width: `${roadmap.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{roadmap.progress || 0}% complete</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 py-4 text-center">No learning paths match your search</p>
              )}
            </div>
          )}

          {/* Courses */}
          {(filterType === 'all' || filterType === 'courses') && courses && courses.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Enrolled Courses
                </h2>
                <span className="text-sm text-slate-500 font-medium">
                  {filteredCourses.length} of {courses.length}
                </span>
              </div>

              {filteredCourses.length > 0 ? (
                <div className="space-y-3">
                  {filteredCourses.map((enrollment, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition">
                      <p className="font-medium text-black">{enrollment.title || 'Course'}</p>
                      <p className="text-sm text-slate-600">{enrollment.subject || 'General'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 py-4 text-center">No courses match your search</p>
              )}
            </div>
          )}

          {/* Empty State */}
          {searchQuery && filteredRoadmaps.length === 0 && filteredCourses.length === 0 && (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* GitHub Stats - Right Column */}
        {githubConn && (
          <div className="bg-white rounded-xl shadow p-6 h-fit">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Profile
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Username</p>
                <a href={`https://github.com/${githubConn.github_username}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">
                  @{githubConn.github_username}
                </a>
              </div>
              {githubConn.public_repos && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Public Repositories</p>
                  <p className="text-2xl font-bold text-black">{githubConn.public_repos}</p>
                </div>
              )}
              {githubConn.followers && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Followers</p>
                  <p className="text-2xl font-bold text-black">{githubConn.followers}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
