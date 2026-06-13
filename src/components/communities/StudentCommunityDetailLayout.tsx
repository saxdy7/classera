'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Users,
  Settings,
  Search,
  MoreVertical,
  Heart,
  Reply,
  Share2,
  Bookmark,
  Flag,
  Bell,
  Hash,
  Zap,
  TrendingUp,
  Pin,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title?: string;
  content: string;
  type: 'normal' | 'question' | 'announcement';
  author: {
    full_name: string;
    avatar_url?: string;
    role: 'student' | 'mentor';
  };
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_pinned?: boolean;
}

interface CommunityDetailLayoutProps {
  communityId: string;
  communityName: string;
  communityDescription?: string;
  communityAvatar?: string;
  memberCount: number;
  isMentor: boolean;
  userId: string;
  posts: Post[];
}

export function StudentCommunityDetailLayout({
  communityId,
  communityName,
  communityDescription,
  communityAvatar,
  memberCount,
  isMentor,
  userId,
  posts,
}: CommunityDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about'>('feed');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'questions' | 'announcements'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const channels = [
    { id: 'general', name: 'General', icon: Hash },
    { id: 'announcements', name: 'Announcements', icon: Bell },
    { id: 'resources', name: 'Resources', icon: Zap },
  ];

  const filteredPosts = posts.filter((post) => {
    if (selectedFilter === 'questions') return post.type === 'question';
    if (selectedFilter === 'announcements') return post.type === 'announcement';
    return true;
  });

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Sidebar - Community Navigation */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        {/* Community Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {communityAvatar || communityName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{communityName}</h2>
              <p className="text-xs text-slate-500 font-medium">{memberCount} members</p>
            </div>
          </div>

          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition">
            + New Post
          </button>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 px-2">
            Channels
          </div>
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm font-medium"
              >
                <Hash className="w-4 h-4" />
                <span>{channel.name}</span>
              </button>
            ))}
          </div>

          {/* Pinned Messages */}
          <div className="mt-8">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 px-2">
              Pinned
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Pin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-900 line-clamp-2">
                        Important announcement #{i}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition">
            <Settings className="w-4 h-4" />
            Community Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{communityName}</h1>
              <p className="text-slate-600 font-medium">{communityDescription}</p>
            </div>
            <Link
              href="#"
              className="p-3 hover:bg-slate-100 rounded-lg transition"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200">
            {[
              { id: 'feed', label: '💬 Feed', count: posts.length },
              { id: 'members', label: '👥 Members', count: memberCount },
              { id: 'about', label: 'ℹ️ About' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label} {tab.count && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'feed' && (
            <div>
              {/* Filters and Search */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex gap-3">
                  {['all', 'questions', 'announcements'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter as typeof selectedFilter)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                        selectedFilter === filter
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {filter === 'all' ? '📚 All' : filter === 'questions' ? '❓ Questions' : '📢 Announcements'}
                    </button>
                  ))}
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-300 transition group"
                  >
                    {/* Post Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {post.author.avatar_url ? (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          post.author.full_name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900">{post.author.full_name}</h3>
                          {post.author.role === 'mentor' && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                              Mentor
                            </span>
                          )}
                          {post.is_pinned && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">2 hours ago</p>
                      </div>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      {post.title && (
                        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition">
                          {post.title}
                        </h4>
                      )}
                      <p className="text-slate-700 leading-relaxed font-medium">{post.content}</p>
                    </div>

                    {/* Post Footer - Actions */}
                    <div className="flex items-center gap-6 text-slate-600">
                      <button className="flex items-center gap-2 hover:text-red-500 transition font-medium text-sm">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes_count}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-blue-500 transition font-medium text-sm">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-green-500 transition font-medium text-sm">
                        <Bookmark className="w-4 h-4" />
                        Save
                      </button>
                      <button className="flex items-center gap-2 hover:text-slate-900 transition font-medium text-sm ml-auto">
                        <Flag className="w-4 h-4" />
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6">Community Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: memberCount > 10 ? 10 : memberCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">Member {i + 1}</h4>
                      <p className="text-xs text-slate-500">@member{i + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">About This Community</h3>
                <p className="text-slate-700 font-medium leading-relaxed mb-6">
                  {communityDescription || 'No description available'}
                </p>

                <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-200">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-2">Created</p>
                    <p className="text-lg font-bold text-slate-900">June 2024</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-2">Members</p>
                    <p className="text-lg font-bold text-slate-900">{memberCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Trending/Activity */}
      <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto hidden lg:block">
        {/* Trending Posts */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Trending This Week
          </h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post, idx) => (
              <Link
                key={post.id}
                href={`#`}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition group block"
              >
                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 mb-1">
                  {post.title || post.content}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
          <h4 className="text-sm font-bold text-indigo-900 mb-4">Community Activity</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-indigo-800">Posts Today</span>
              <span className="font-bold text-indigo-900">12</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-indigo-800">Active Members</span>
              <span className="font-bold text-indigo-900">24</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-indigo-800">New Members</span>
              <span className="font-bold text-indigo-900">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
