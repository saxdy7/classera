'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, User, BookOpen, Users, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';

interface SearchResults {
  users?: any[];
  courses?: any[];
  communities?: any[];
  tests?: any[];
  messages?: any[];
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const router = useRouter();

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchDebounced = useCallback(
    debounce(async (searchQuery: string, type: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}`
        );
        const data = await response.json();
        setResults(data.results || {});
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchDebounced(query, selectedType);
  }, [query, selectedType, searchDebounced]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  const getTotalResults = () => {
    return Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-block ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">
          ⌘K
        </kbd>
      </Button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed inset-x-0 top-20 z-50 mx-auto max-w-3xl px-4">
        <Card className="shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search users, courses, communities, messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-lg"
              autoFocus
            />
            {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-2" />}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 px-4 py-2 border-b overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'users', label: 'Users', icon: User },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'communities', label: 'Communities', icon: Users },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm ${
                  selectedType === tab.id
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-4">
            {!query || query.length < 2 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Type at least 2 characters to search</p>
                <p className="text-sm mt-1">Try searching for users, courses, or communities</p>
              </div>
            ) : getTotalResults() === 0 && !loading ? (
              <div className="text-center py-8 text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Users */}
                {results.users && results.users.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Users ({results.users.length})
                    </h3>
                    <div className="space-y-2">
                      {results.users.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleNavigate(`/profile/${user.id}`)}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <Avatar className="w-10 h-10">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {user.full_name.charAt(0)}
                              </div>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {user.role === 'mentor' ? 'Mentor' : 'Student'}
                              {user.degree_type && ` • ${user.degree_type}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {results.courses && results.courses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      Courses ({results.courses.length})
                    </h3>
                    <div className="space-y-2">
                      {results.courses.map((course) => (
                        <div
                          key={course.id}
                          onClick={() => handleNavigate(`/dashboard/student/courses/${course.id}`)}
                          className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {course.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              by {course.instructor?.full_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Communities */}
                {results.communities && results.communities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Communities ({results.communities.length})
                    </h3>
                    <div className="space-y-2">
                      {results.communities.map((community) => (
                        <div
                          key={community.id}
                          onClick={() => handleNavigate(`/dashboard/student/communities/${community.id}`)}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <Avatar className="w-10 h-10">
                            {community.avatar_url ? (
                              <img src={community.avatar_url} alt={community.name} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                                {community.name.charAt(0)}
                              </div>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{community.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {community.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {results.messages && results.messages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Messages ({results.messages.length})
                    </h3>
                    <div className="space-y-2">
                      {results.messages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() =>
                            handleNavigate(
                              `/dashboard/student/communities/${message.channel?.community_id}`
                            )
                          }
                          className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="w-6 h-6">
                              {message.user?.avatar_url ? (
                                <img src={message.user.avatar_url} alt={message.user.full_name} />
                              ) : (
                                <div className="w-full h-full bg-purple-500 text-white text-xs flex items-center justify-center">
                                  {message.user?.full_name?.charAt(0)}
                                </div>
                              )}
                            </Avatar>
                            <span className="text-sm font-medium">{message.user?.full_name}</span>
                            <span className="text-xs text-gray-400">
                              in {message.channel?.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 pl-8">
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
