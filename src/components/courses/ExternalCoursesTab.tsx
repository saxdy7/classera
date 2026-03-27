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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search Coursera, Udemy, ACS Code Hub..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest leading-none">Premium Learning Hub</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-slate-400 uppercase">15+ Expert Picked</span>
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-2xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium text-lg">Scraping Coursera & Udemy for new courses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => (
            <div key={idx} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white shadow-xl uppercase tracking-widest border border-white/20">
                  {course.source}
                </div>
                {course.rating && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-black text-slate-900 shadow-xl flex items-center gap-1 border border-slate-100">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    {course.rating}
                  </div>
                )}
                {course.certificateOffered && (
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black uppercase shadow-lg flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Certificate
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-md font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    course.difficulty === 'Beginner' ? 'bg-green-50 border-green-100 text-green-600' :
                    course.difficulty === 'Intermediate' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                    'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    {course.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    {course.duration}
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed opacity-80">
                  {course.description}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 uppercase tracking-tighter">
                    <Tag size={12} />
                    {course.price}
                  </div>
                  <a 
                    href={course.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95"
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
