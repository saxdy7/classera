'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Globe, SlidersHorizontal, Grid3x3, List } from 'lucide-react';
import { CourseCard } from './CourseCard';

interface Course {
  id: string;
  title: string;
  platform: string;
  instructor: string;
  rating: number;
  students: string;
  duration: string;
  level: string;
  type: string;
  price: string;
  image: string;
  url: string;
  description: string;
  skills: string[];
}

export function CoursesTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveSearching, setLiveSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchQuery, selectedType, selectedPlatform, selectedLevel, sortBy]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/courses/search');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const liveSearchCourses = async (query: string) => {
    if (!query.trim()) return;

    setLiveSearching(true);
    try {
      const response = await fetch(`/api/courses/live-search?query=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();

      const liveCourses: Course[] = (data.courses || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        platform: course.platform,
        instructor: course.displayLink || course.platform,
        rating: 4.5,
        students: 'N/A',
        duration: 'Varies',
        level: 'All Levels',
        type: 'paid',
        price: 'See platform',
        image: course.image,
        url: course.url,
        skills: [query]
      }));

      setCourses(liveCourses);
      setFilteredCourses(liveCourses);
    } catch (error) {
      console.error('Error in live search:', error);
    } finally {
      setLiveSearching(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(lowerQuery) ||
        course.description.toLowerCase().includes(lowerQuery) ||
        course.skills.some(skill => skill.toLowerCase().includes(lowerQuery)) ||
        course.instructor.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(course => course.type === selectedType);
    }

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(course => course.platform.toLowerCase() === selectedPlatform.toLowerCase());
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level.toLowerCase() === selectedLevel.toLowerCase());
    }

    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => parseFloat(b.students) - parseFloat(a.students));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = a.type === 'free' ? 0 : parseFloat(a.price.replace(/[^0-9.]/g, ''));
          const priceB = b.type === 'free' ? 0 : parseFloat(b.price.replace(/[^0-9.]/g, ''));
          return priceA - priceB;
        });
        break;
    }

    setFilteredCourses(filtered);
  };

  const toggleFavorite = (courseId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(courseId)) {
        newFavorites.delete(courseId);
      } else {
        newFavorites.add(courseId);
      }
      return newFavorites;
    });
  };

  const platforms = ['all', 'Coursera', 'Udemy', 'edX', 'LinkedIn Learning', 'freeCodeCamp', 'Udacity', 'Codecademy'];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by name, instructor, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  liveSearchCourses(searchQuery);
                }
              }}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => liveSearchCourses(searchQuery)}
              disabled={liveSearching || !searchQuery.trim()}
              className="px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg disabled:opacity-50"
            >
              {liveSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  Live Search
                </>
              )}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                showFilters ? 'bg-purple-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3x3 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform === 'all' ? 'All Platforms' : platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level === 'all' ? 'All Levels' : level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredCourses.length}</span> courses
          {favorites.size > 0 && (
            <span className="ml-2">• {favorites.size} favorites saved</span>
          )}
        </p>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-2xl h-96 animate-pulse"></div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No courses found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isFavorite={favorites.has(course.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
