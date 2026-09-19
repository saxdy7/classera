'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Sparkles, Globe, Clock, BookOpen, BarChart, Star, ShieldCheck, Tag } from 'lucide-react';

interface ExternalCourse {
  title: string;
  url: string;
  description: string;
  image: string;
  source: string;
  difficulty: string;
  duration: string;
  rating: string;
  price: string;
  certificateOffered: boolean;
  publishedAt: string;
}

export function ExternalCoursesTab() {
  const [courses, setCourses] = useState<ExternalCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hub/external-courses');
      const data = await response.json();
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching external courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--cl-muted-soft)]" />
        <input
          type="text"
          placeholder="Search Coursera, Udemy, ACS Code Hub..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] focus:outline-none focus:border-[var(--cl-info)] transition-colors"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[var(--cl-info)]" />
          <h3 className="text-sm font-semibold text-[var(--cl-body)] uppercase tracking-widest leading-none">Premium Learning Hub</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-semibold text-[var(--cl-muted-soft)] uppercase">15+ Expert Picked</span>
           <div className="w-2 h-2 bg-[var(--cl-info)] rounded-full animate-pulse" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-xl)] h-80 animate-pulse"></div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border-2 border-dashed border-[var(--cl-hairline)]">
          <BookOpen className="w-16 h-16 text-[var(--cl-muted-soft)] mx-auto mb-4" />
          <p className="text-[var(--cl-muted-soft)] font-medium text-lg">Scraping Coursera & Udemy for new courses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => (
            <div key={idx} className="group flex flex-col bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] overflow-hidden border border-[var(--cl-hairline)] hover:border-[var(--cl-info)] transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-semibold text-[var(--cl-on-dark)] uppercase tracking-widest border border-[rgba(255,255,255,0.2)]">
                  {course.source}
                </div>
                {course.rating && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-[rgba(255,255,255,0.95)] backdrop-blur-sm rounded-lg text-[10px] font-semibold text-[var(--cl-ink)] flex items-center gap-1 border border-[var(--cl-hairline)]">
                    <Star size={10} className="text-[var(--cl-warning)] fill-[var(--cl-warning)]" />
                    {course.rating}
                  </div>
                )}
                {course.certificateOffered && (
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-[var(--cl-info)] text-[var(--cl-on-dark)] rounded-md text-[9px] font-semibold uppercase flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Certificate
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-md font-semibold text-[var(--cl-ink)] mb-2 line-clamp-2 leading-tight group-hover:text-[var(--cl-info)] transition-colors">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase border ${
                    course.difficulty === 'Beginner' ? 'bg-[rgba(22,163,74,0.12)] border-[var(--cl-success)] text-[var(--cl-success)]' :
                    course.difficulty === 'Intermediate' ? 'bg-[rgba(171,100,0,0.12)] border-[var(--cl-warning)] text-[var(--cl-warning)]' :
                    'bg-[rgba(239,68,68,0.12)] border-[var(--cl-error)] text-[var(--cl-error)]'
                  }`}>
                    {course.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--cl-muted-soft)]">
                    <Clock size={12} />
                    {course.duration}
                  </div>
                </div>

                <p className="text-xs text-[var(--cl-muted)] line-clamp-2 mb-4 leading-relaxed opacity-80">
                  {course.description}
                </p>
                
                <div className="mt-auto pt-4 border-t border-[var(--cl-hairline)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--cl-info)] uppercase tracking-tighter">
                    <Tag size={12} />
                    {course.price}
                  </div>
                  <a 
                    href={course.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] text-[10px] font-semibold uppercase tracking-widest hover:bg-[var(--cl-info)] transition-all active:scale-95"
                  >
                    Enroll
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
