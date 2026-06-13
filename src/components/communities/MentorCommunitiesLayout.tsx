'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Users,
  Settings,
  Plus,
  ChevronDown,
  Home,
  Bell,
  Search,
  MoreVertical,
  Hash,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_active: boolean;
  messaging_enabled?: boolean;
  mentor_id: string;
  community_members?: Array<{ count: number }>;
  created_at: string;
}

interface MentorCommunitiesLayoutProps {
  communities: Community[];
  profile: any;
}

export function MentorCommunitiesLayout({
  communities,
  profile,
}: MentorCommunitiesLayoutProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    communities && communities.length > 0 ? communities[0] : null
  );
  const [expandedCommunity, setExpandedCommunity] = useState<string | null>(
    communities && communities.length > 0 ? communities[0]?.id : null
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const channels = [
    { id: 'general', name: 'General', icon: Hash, type: 'public' },
    { id: 'announcements', name: 'Announcements', icon: Bell, type: 'public' },
    { id: 'resources', name: 'Resources', icon: Zap, type: 'public' },
    { id: 'discussions', name: 'Discussions', icon: MessageCircle, type: 'public' },
  ];

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Sidebar - Communities & Channels */}
      <div className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        {/* Top Section */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard/mentor" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                C
              </div>
              <span className="font-bold text-lg">Classera</span>
            </Link>
            <button className="p-1.5 hover:bg-slate-800 rounded-lg transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <Link
            href="/dashboard/mentor/communities/create"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            New Community
          </Link>
        </div>

        {/* Communities List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Your Communities
          </div>
          <div className="space-y-2">
            {communities && communities.length > 0 ? (
              communities.map((community) => (
                <div key={community.id}>
                  <button
                    onClick={() => {
                      setSelectedCommunity(community);
                      setExpandedCommunity(
                        expandedCommunity === community.id ? null : community.id
                      );
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                      selectedCommunity?.id === community.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        selectedCommunity?.id === community.id
                          ? 'bg-indigo-700'
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{community.name}</div>
                      <div className="text-xs text-slate-400">
                        {community.community_members?.[0]?.count || 0} members
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition ${
                        expandedCommunity === community.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Channels */}
                  {expandedCommunity === community.id && (
                    <div className="pl-3 mt-1 space-y-1">
                      {channels.map((channel) => {
                        const Icon = channel.icon;
                        return (
                          <Link
                            key={channel.id}
                            href={`/dashboard/mentor/communities/${community.id}?channel=${channel.id}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
                          >
                            <Icon className="w-4 h-4" />
                            <span>{channel.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No communities yet</p>
                <p className="text-xs opacity-75 mt-1">Create one to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name} className="w-full h-full object-cover" />
              ) : (
                getInitials(profile?.full_name || 'Mentor')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{profile?.full_name}</div>
              <div className="text-xs text-slate-400 truncate">Mentor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedCommunity ? (
          <>
            {/* Header */}
            <div className="border-b border-slate-200 px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {selectedCommunity.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">
                        {selectedCommunity.name}
                      </h1>
                      <p className="text-sm text-slate-600">
                        {selectedCommunity.description || 'Community of learners'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/mentor/communities/${selectedCommunity.id}`}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition"
                  >
                    View Full
                  </Link>
                  <Link
                    href={`/dashboard/mentor/communities/${selectedCommunity.id}/settings`}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Content - Community Overview */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-3xl font-bold text-indigo-900">
                          {selectedCommunity.community_members?.[0]?.count || 0}
                        </div>
                        <div className="text-sm text-indigo-700 font-medium">Members</div>
                      </div>
                      <div className="p-2 bg-indigo-200 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-3xl font-bold text-green-900">
                          {selectedCommunity.is_active ? '✓' : '○'}
                        </div>
                        <div className="text-sm text-green-700 font-medium">
                          {selectedCommunity.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="p-2 bg-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-3xl font-bold text-purple-900">
                          {selectedCommunity.messaging_enabled ? '✓' : '○'}
                        </div>
                        <div className="text-sm text-purple-700 font-medium">
                          Messaging {selectedCommunity.messaging_enabled ? 'On' : 'Off'}
                        </div>
                      </div>
                      <div className="p-2 bg-purple-200 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
                  <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/dashboard/mentor/communities/${selectedCommunity.id}?tab=feed`}
                      className="flex items-center gap-3 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition"
                    >
                      <MessageCircle className="w-5 h-5" />
                      View Feed
                    </Link>
                    <Link
                      href={`/dashboard/mentor/communities/${selectedCommunity.id}?tab=members`}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg transition"
                    >
                      <Users className="w-5 h-5" />
                      Manage Members
                    </Link>
                    <Link
                      href={`/dashboard/mentor/communities/${selectedCommunity.id}/analytics`}
                      className="flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg transition"
                    >
                      <Eye className="w-5 h-5" />
                      Analytics
                    </Link>
                    <Link
                      href={`/dashboard/mentor/communities/${selectedCommunity.id}/moderation`}
                      className="flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-lg transition"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Moderation
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Select a community
              </h3>
              <p className="text-slate-600">Choose a community from the left sidebar to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Team Members */}
      {selectedCommunity && (
        <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search members..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Team Members ({selectedCommunity.community_members?.[0]?.count || 0})
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 hover:bg-white rounded-lg transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        Member {i}
                      </div>
                      <div className="text-xs text-slate-500">Student</div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Community Info
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Created</span>
                <span className="text-slate-900 font-semibold">
                  {new Date(selectedCommunity.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Status</span>
                <span className="text-slate-900 font-semibold">
                  {selectedCommunity.is_active ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
