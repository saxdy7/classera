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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
        <input
          type="text"
          placeholder="Search Coursera, Udemy, ACS Code Hub..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-accent-purple transition-colors"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent-purple" />
          <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-widest leading-none">Premium Learning Hub</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase">15+ Expert Picked</span>
           <div className="w-2 h-2 bg-accent-purple rounded-full animate-pulse" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-muted/40 rounded-xl border-2 border-dashed border-border">
          <BookOpen className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
          <p className="text-muted-foreground/70 font-medium text-lg">Scraping Coursera & Udemy for new courses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => (
            <div key={idx} className="group flex flex-col bg-card rounded-xl overflow-hidden border border-border hover:border-accent-purple transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white uppercase tracking-widest border border-[rgba(255,255,255,0.2)]">
                  {course.source}
                </div>
                {course.rating && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-[rgba(255,255,255,0.95)] backdrop-blur-sm rounded-lg text-[10px] font-semibold text-foreground flex items-center gap-1 border border-border">
                    <Star size={10} className="text-amber-600 fill-[var(--cl-warning)]" />
                    {course.rating}
                  </div>
                )}
                {course.certificateOffered && (
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-accent-purple text-white rounded-md text-[9px] font-semibold uppercase flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Certificate
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-md font-semibold text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-accent-purple transition-colors">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase border ${
                    course.difficulty === 'Beginner' ? 'bg-green-500/10 border-green-600 text-green-600' :
                    course.difficulty === 'Intermediate' ? 'bg-amber-500/10 border-amber-500 text-amber-600' :
                    'bg-destructive/10 border-destructive text-destructive'
                  }`}>
                    {course.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70">
                    <Clock size={12} />
                    {course.duration}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed opacity-80">
                  {course.description}
                </p>
                
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-purple uppercase tracking-tighter">
                    <Tag size={12} />
                    {course.price}
                  </div>
                  <a 
                    href={course.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-[10px] font-semibold uppercase tracking-widest hover:bg-accent-purple transition-all active:scale-95"
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
