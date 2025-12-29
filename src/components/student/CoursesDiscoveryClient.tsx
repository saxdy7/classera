'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Star, Users, Clock, BookOpen, Play, X, TrendingUp, Award, Zap, Heart, Share2, ChevronDown, SlidersHorizontal } from 'lucide-react';
import Image from 'next/image';

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

interface Video {
    id: string;
    title: string;
    channel: string;
    views: string;
    duration: string;
    thumbnail: string;
}

export function CoursesDiscoveryClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedPlatform, setSelectedPlatform] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchCourses();
        fetchVideos();
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

    const fetchVideos = async () => {
        try {
            const response = await fetch('/api/courses/youtube?topic=programming');
            const data = await response.json();
            setVideos(data.videos || []);
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    };

    const filterAndSortCourses = () => {
        let filtered = [...courses];

        // Filter by search query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(lowerQuery) ||
                course.description.toLowerCase().includes(lowerQuery) ||
                course.skills.some(skill => skill.toLowerCase().includes(lowerQuery)) ||
                course.instructor.toLowerCase().includes(lowerQuery)
            );
        }

        // Filter by type
        if (selectedType !== 'all') {
            filtered = filtered.filter(course => course.type === selectedType);
        }

        // Filter by platform
        if (selectedPlatform !== 'all') {
            filtered = filtered.filter(course => course.platform.toLowerCase() === selectedPlatform.toLowerCase());
        }

        // Filter by level
        if (selectedLevel !== 'all') {
            filtered = filtered.filter(course => course.level.toLowerCase() === selectedLevel.toLowerCase());
        }

        // Sort courses
        switch (sortBy) {
            case 'popular':
                filtered.sort((a, b) => parseFloat(b.students) - parseFloat(a.students));
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                // Keep original order (newest first)
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
        <div className="space-y-8">
            {/* Advanced Search and Filters Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-4">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search courses, skills, or instructors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${showFilters ? 'bg-fuchsia-500 text-white' : 'bg-slate-100 hover:bg-slate-200'
                                    }`}
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                Filters
                            </button>

                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                title={viewMode === 'grid' ? 'List view' : 'Grid view'}
                            >
                                {viewMode === 'grid' ? '☰' : '⊞'}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Type Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Course Type</label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-fuchsia-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="free">Free Courses</option>
                                    <option value="paid">Paid Courses</option>
                                </select>
                            </div>

                            {/* Platform Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Platform</label>
                                <select
                                    value={selectedPlatform}
                                    onChange={(e) => setSelectedPlatform(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-fuchsia-500"
                                >
                                    {platforms.map((platform) => (
                                        <option key={platform} value={platform}>
                                            {platform === 'all' ? 'All Platforms' : platform}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Level Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
                                <select
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-fuchsia-500"
                                >
                                    {levels.map((level) => (
                                        <option key={level} value={level}>
                                            {level === 'all' ? 'All Levels' : level}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-fuchsia-500"
                                >
                                    <option value="popular">Most Popular</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="newest">Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(searchQuery || selectedType !== 'all' || selectedPlatform !== 'all' || selectedLevel !== 'all') && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {searchQuery && (
                            <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-sm flex items-center gap-2">
                                Search: "{searchQuery}"
                                <button onClick={() => setSearchQuery('')} className="hover:text-fuchsia-900">×</button>
                            </span>
                        )}
                        {selectedType !== 'all' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                                {selectedType === 'free' ? 'Free' : 'Paid'}
                                <button onClick={() => setSelectedType('all')} className="hover:text-blue-900">×</button>
                            </span>
                        )}
                        {selectedPlatform !== 'all' && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                                {selectedPlatform}
                                <button onClick={() => setSelectedPlatform('all')} className="hover:text-purple-900">×</button>
                            </span>
                        )}
                        {selectedLevel !== 'all' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                                {selectedLevel}
                                <button onClick={() => setSelectedLevel('all')} className="hover:text-green-900">×</button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                    {searchQuery ? `Results for "${searchQuery}"` : 'Discover Courses'}
                </h2>
                <div className="flex items-center gap-4">
                    <p className="text-slate-600">{filteredCourses.length} courses</p>
                    {favorites.size > 0 && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-red-700" />
                            {favorites.size} saved
                        </span>
                    )}
                </div>
            </div>

            {/* Courses Grid/List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                            <div className="w-full h-48 bg-slate-200"></div>
                            <div className="p-6 space-y-3">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
                    <p className="text-slate-600 mb-4">Try adjusting your search or filters</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedType('all');
                            setSelectedPlatform('all');
                            setSelectedLevel('all');
                        }}
                        className="px-6 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            className={`bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group ${viewMode === 'list' ? 'flex' : ''
                                }`}
                        >
                            {/* Course Image */}
                            <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-64' : 'h-48'}`}>
                                <Image
                                    src={course.image}
                                    alt={course.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${course.type === 'free'
                                            ? 'bg-green-500/90 text-white'
                                            : 'bg-blue-500/90 text-white'
                                        }`}>
                                        {course.type === 'free' ? 'FREE' : course.price}
                                    </span>
                                </div>
                                <button
                                    onClick={() => toggleFavorite(course.id)}
                                    className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <Heart className={`w-4 h-4 ${favorites.has(course.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                                </button>
                            </div>

                            {/* Course Info */}
                            <div className="p-6 flex-1">
                                {/* Platform & Level Badge */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="text-xs font-semibold text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded">
                                        {course.platform}
                                    </span>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {course.level}
                                    </span>
                                    {course.rating >= 4.5 && (
                                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            Top Rated
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-fuchsia-600 transition-colors">
                                    {course.title}
                                </h3>

                                {/* Instructor */}
                                <p className="text-sm text-slate-600 mb-3">{course.instructor}</p>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-semibold">{course.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{course.students}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{course.duration}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {course.skills.slice(0, 3).map((skill, idx) => (
                                        <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                            {skill}
                                        </span>
                                    ))}
                                    {course.skills.length > 3 && (
                                        <span className="text-xs text-slate-500">+{course.skills.length - 3} more</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        View Course
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        title="Share course"
                                    >
                                        <Share2 className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* YouTube Videos Section */}
            <div className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Play className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Top YouTube Tutorials</h2>
                        <p className="text-sm text-slate-600">Learn from the best free content creators</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            onClick={() => setSelectedVideo(video.id)}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                        >
                            {/* Video Thumbnail */}
                            <div className="relative h-48 overflow-hidden bg-slate-900">
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    className="object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-semibold">
                                    {video.duration}
                                </div>
                            </div>

                            {/* Video Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                    {video.title}
                                </h3>
                                <p className="text-sm text-slate-600 mb-1 font-medium">{video.channel}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{video.views} views</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedVideo(null)}>
                    <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <div className="relative pt-[56.25%]">
                            <iframe
                                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
