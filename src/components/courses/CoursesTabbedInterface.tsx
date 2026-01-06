'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Search, Bookmark, RefreshCw, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseCard } from './CourseCard';
import { YouTubeVideosTab } from './YouTubeVideosTab';

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

export function CoursesTabbedInterface() {
  const [activeTab, setActiveTab] = useState<'courses' | 'videos'>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('updated');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  // Filter states
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>(['full-time', 'part-time', 'self-paced', 'intensive']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['free', 'paid', 'certificate', 'project-based']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  // Dropdown states for collapsible filters
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const [isLevelOpen, setIsLevelOpen] = useState(false);

  const scheduleOptions = [
    { value: 'full-time', label: 'Full time' },
    { value: 'part-time', label: 'Part time' },
    { value: 'self-paced', label: 'Self-paced' },
    { value: 'intensive', label: 'Intensive' },
  ];

  const typeOptions = [
    { value: 'free', label: 'Free courses' },
    { value: 'paid', label: 'Paid courses' },
    { value: 'certificate', label: 'With certificate' },
    { value: 'project-based', label: 'Project-based' },
  ];

  const platformOptions = [
    'Coursera', 'Udemy', 'edX', 'LinkedIn Learning', 
    'freeCodeCamp', 'Udacity', 'Codecademy', 'Pluralsight'
  ];

  const levelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
    setCurrentPage(1); // Reset to first page when filters change
  }, [courses, searchQuery, selectedSchedule, selectedTypes, selectedPlatforms, selectedLevels, sortBy]);

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

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(lowerQuery) ||
        course.description.toLowerCase().includes(lowerQuery) ||
        course.instructor.toLowerCase().includes(lowerQuery) ||
        course.platform.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(course => {
        if (selectedTypes.includes('free') && course.type === 'free') return true;
        if (selectedTypes.includes('paid') && course.type === 'paid') return true;
        if (selectedTypes.includes('certificate') && course.rating >= 4.5) return true;
        if (selectedTypes.includes('project-based') && course.skills.length > 2) return true;
        return false;
      });
    }

    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(course => 
        selectedPlatforms.some(platform => 
          course.platform.toLowerCase() === platform.toLowerCase()
        )
      );
    }

    if (selectedLevels.length > 0) {
      filtered = filtered.filter(course =>
        selectedLevels.some(level => 
          course.level.toLowerCase() === level.toLowerCase()
        )
      );
    }

    switch (sortBy) {
      case 'updated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        filtered.sort((a, b) => parseFloat(b.students) - parseFloat(a.students));
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

  const toggleCheckbox = (value: string, selected: string[], setter: (val: string[]) => void) => {
    if (selected.includes(value)) {
      setter(selected.filter(item => item !== value));
    } else {
      setter([...selected, value]);
    }
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const currentCourses = filteredCourses.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Filters */}
      <div className="w-72 flex-shrink-0 space-y-6">
        {/* Ad Card */}
        <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 leading-tight">Unlock Your</h3>
            <h3 className="text-xl font-bold mb-2 leading-tight">Learning Potential</h3>
            <h3 className="text-xl font-bold mb-4 leading-tight">with Classera</h3>
            <button className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl transition-all hover:shadow-lg">
              Explore Courses
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg text-slate-900">Filters</h3>
            <button 
              onClick={() => {
                setSelectedSchedule(['full-time', 'part-time', 'self-paced', 'intensive']);
                setSelectedTypes(['free', 'paid', 'certificate', 'project-based']);
                setSelectedPlatforms([]);
                setSelectedLevels([]);
              }}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              title="Reset filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Learning Schedule */}
          <div className="mb-5 border-b border-slate-200 pb-5">
            <button
              onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h4 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                Learning schedule
              </h4>
              <motion.div
                animate={{ rotate: isScheduleOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isScheduleOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 mt-3">
                    {scheduleOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer group/item">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedSchedule.includes(option.value)}
                            onChange={() => toggleCheckbox(option.value, selectedSchedule, setSelectedSchedule)}
                            className="appearance-none w-5 h-5 rounded border-2 border-slate-300 cursor-pointer transition-all checked:bg-slate-900 checked:border-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
                          />
                          <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedSchedule.includes(option.value) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors select-none">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Course Type */}
          <div className="mb-5 border-b border-slate-200 pb-5">
            <button
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h4 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                Course type
              </h4>
              <motion.div
                animate={{ rotate: isTypeOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isTypeOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 mt-3">
                    {typeOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer group/item">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(option.value)}
                            onChange={() => toggleCheckbox(option.value, selectedTypes, setSelectedTypes)}
                            className="appearance-none w-5 h-5 rounded border-2 border-slate-300 cursor-pointer transition-all checked:bg-slate-900 checked:border-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
                          />
                          <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedTypes.includes(option.value) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors select-none">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Platform Filter */}
          <div className="mb-5 border-b border-slate-200 pb-5">
            <button
              onClick={() => setIsPlatformOpen(!isPlatformOpen)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h4 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                Platform
              </h4>
              <motion.div
                animate={{ rotate: isPlatformOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isPlatformOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 mt-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {platformOptions.map(platform => (
                      <label key={platform} className="flex items-center gap-3 cursor-pointer group/item">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform)}
                            onChange={() => toggleCheckbox(platform, selectedPlatforms, setSelectedPlatforms)}
                            className="appearance-none w-5 h-5 rounded border-2 border-slate-300 cursor-pointer transition-all checked:bg-slate-900 checked:border-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
                          />
                          <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedPlatforms.includes(platform) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors select-none">{platform}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Level Filter */}
          <div>
            <button
              onClick={() => setIsLevelOpen(!isLevelOpen)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h4 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                Difficulty level
              </h4>
              <motion.div
                animate={{ rotate: isLevelOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isLevelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 mt-3">
                    {levelOptions.map(level => (
                      <label key={level} className="flex items-center gap-3 cursor-pointer group/item">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedLevels.includes(level)}
                            onChange={() => toggleCheckbox(level, selectedLevels, setSelectedLevels)}
                            className="appearance-none w-5 h-5 rounded border-2 border-slate-300 cursor-pointer transition-all checked:bg-slate-900 checked:border-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
                          />
                          <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedLevels.includes(level) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors select-none">{level}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'courses'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Courses</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'videos'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <PlayCircle className="w-5 h-5" />
            <span>YouTube Videos</span>
          </button>
        </div>

        {activeTab === 'courses' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Recommended courses</h2>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                  {filteredCourses.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="updated">Last updated</option>
                    <option value="rating">Highest rated</option>
                    <option value="popular">Most popular</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by title, instructor, platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-slate-700"
              />
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-200 rounded-2xl h-96 animate-pulse"></div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No courses found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isFavorite={favorites.has(course.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current page
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        const showEllipsis = 
                          (page === currentPage - 2 && currentPage > 3) ||
                          (page === currentPage + 2 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return <span key={page} className="px-2 text-slate-400">...</span>;
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`min-w-[40px] h-10 rounded-lg font-semibold transition-all ${
                              currentPage === page
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === totalPages
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <YouTubeVideosTab />
        )}
      </div>
    </div>
  );
}
