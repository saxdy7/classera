'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Search, Bookmark, RefreshCw, PlayCircle, Globe, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseCard } from './CourseCard';
import { YouTubeVideosTab } from './YouTubeVideosTab';
import { ExternalCoursesTab } from './ExternalCoursesTab';
import { HackathonsTab } from './HackathonsTab';

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
  const [activeTab, setActiveTab] = useState<'courses' | 'videos' | 'external-courses' | 'hackathons'>('courses');
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
        <div className="rounded-xl p-6 text-white relative overflow-hidden bg-neutral-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative z-10">
            {/* One heading, not three stacked <h3>s - three headings for one
                sentence is wrong structurally and was what forced the cramped
                line breaks. */}
            <h3 className="text-[20px] font-semibold leading-[1.3] text-white mb-4">
              Unlock your learning potential with Classera
            </h3>
            {/* White button on a dark surface. It was the inline-link blue,
                which this system never uses as a CTA fill. */}
            <button className="w-full rounded-lg bg-card py-2.5 font-semibold text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(255,255,255,0.3)]">
              Explore Courses
            </button>
          </div>
        </div>

        {/* Filters Section (Only show for internal courses tab) */}
        {activeTab === 'courses' && (
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg text-foreground">Filters</h3>
              <button 
                onClick={() => {
                  setSelectedSchedule(['full-time', 'part-time', 'self-paced', 'intensive']);
                  setSelectedTypes(['free', 'paid', 'certificate', 'project-based']);
                  setSelectedPlatforms([]);
                  setSelectedLevels([]);
                }}
                className="text-muted-foreground hover:text-foreground/80 transition-colors"
                title="Reset filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Learning Schedule */}
            <div className="mb-5 border-b border-border pb-5">
              <button
                onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                className="flex items-center justify-between w-full text-left group"
              >
                <h4 className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  Learning schedule
                </h4>
                <motion.div
                  animate={{ rotate: isScheduleOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                              className="appearance-none w-5 h-5 rounded border-2 border-border cursor-pointer transition-all checked:bg-neutral-900 checked:border-border hover:border-border focus:ring-2 focus:ring-[var(--cl-hairline-strong)] focus:ring-offset-0"
                            />
                            <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedSchedule.includes(option.value) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-foreground/80 group-hover/item:text-foreground transition-colors select-none">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Course Type */}
            <div className="mb-5 border-b border-border pb-5">
              <button
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className="flex items-center justify-between w-full text-left group"
              >
                <h4 className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  Course type
                </h4>
                <motion.div
                  animate={{ rotate: isTypeOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                              className="appearance-none w-5 h-5 rounded border-2 border-border cursor-pointer transition-all checked:bg-neutral-900 checked:border-border hover:border-border focus:ring-2 focus:ring-[var(--cl-hairline-strong)] focus:ring-offset-0"
                            />
                            <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedTypes.includes(option.value) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-foreground/80 group-hover/item:text-foreground transition-colors select-none">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Platform Filter */}
            <div className="mb-5 border-b border-border pb-5">
              <button
                onClick={() => setIsPlatformOpen(!isPlatformOpen)}
                className="flex items-center justify-between w-full text-left group"
              >
                <h4 className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  Platform
                </h4>
                <motion.div
                  animate={{ rotate: isPlatformOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                              className="appearance-none w-5 h-5 rounded border-2 border-border cursor-pointer transition-all checked:bg-neutral-900 checked:border-border hover:border-border focus:ring-2 focus:ring-[var(--cl-hairline-strong)] focus:ring-offset-0"
                            />
                            <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedPlatforms.includes(platform) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-foreground/80 group-hover/item:text-foreground transition-colors select-none">{platform}</span>
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
                <h4 className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  Difficulty level
                </h4>
                <motion.div
                  animate={{ rotate: isLevelOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                              className="appearance-none w-5 h-5 rounded border-2 border-border cursor-pointer transition-all checked:bg-neutral-900 checked:border-border hover:border-border focus:ring-2 focus:ring-[var(--cl-hairline-strong)] focus:ring-offset-0"
                            />
                            <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 transition-opacity" style={{ opacity: selectedLevels.includes(level) ? 1 : 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-foreground/80 group-hover/item:text-foreground transition-colors select-none">{level}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'courses'
                ? 'bg-neutral-900 text-white scale-105'
                : 'bg-card text-foreground/80 hover:bg-muted/40 border border-border'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Recommended</span>
          </button>
          
          <button
            onClick={() => setActiveTab('external-courses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'external-courses'
                ? 'bg-accent-purple text-white scale-105'
                : 'bg-card text-foreground/80 hover:bg-muted/40 border border-border'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Online Courses</span>
          </button>

          <button
            onClick={() => setActiveTab('hackathons')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'hackathons'
                ? 'bg-destructive text-white scale-105'
                : 'bg-card text-foreground/80 hover:bg-muted/40 border border-border'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Hackathons</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'videos'
                ? 'bg-destructive text-white scale-105'
                : 'bg-card text-foreground/80 hover:bg-muted/40 border border-border'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>YouTube Videos</span>
          </button>
        </div>

        {activeTab === 'courses' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground border-l-4 border-border pl-4">Recommended courses</h2>
                <span className="px-3 py-1 bg-muted text-foreground/80 rounded-full text-xs font-semibold ring-1 ring-border">
                  {filteredCourses.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-10 text-sm font-semibold text-foreground/80 hover:border-border focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    <option value="updated">Last updated</option>
                    <option value="rating">Highest rated</option>
                    <option value="popular">Most popular</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70 group-focus-within:text-accent-purple transition-colors" />
              <input
                type="text"
                placeholder="Search internal curated courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-4 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-accent-purple transition-all text-foreground/80"
              />
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-xl h-96 animate-pulse"></div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
                <BookOpen className="w-20 h-20 text-muted-foreground/70 mx-auto mb-6" />
                <p className="text-muted-foreground/70 font-medium text-lg">No matching courses found in our records.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
                  <div className="mt-16 flex items-center justify-center gap-3">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        currentPage === 1
                          ? 'bg-muted/40 text-muted-foreground/70 cursor-not-allowed'
                          : 'bg-card text-foreground/80 hover:bg-neutral-900 hover:text-white border border-border active:scale-95'
                      }`}
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-12 h-12 rounded-lg font-semibold transition-all ${
                              currentPage === page
                                ? 'bg-neutral-900 text-white'
                                : 'bg-card text-foreground/80 hover:bg-muted/40 border border-border active:scale-95'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        currentPage === totalPages
                          ? 'bg-muted/40 text-muted-foreground/70 cursor-not-allowed'
                          : 'bg-card text-foreground/80 hover:bg-neutral-900 hover:text-white border border-border active:scale-95'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'external-courses' && <ExternalCoursesTab />}
        {activeTab === 'hackathons' && <HackathonsTab />}
        {activeTab === 'videos' && <YouTubeVideosTab />}
      </div>
    </div>
  );
}
