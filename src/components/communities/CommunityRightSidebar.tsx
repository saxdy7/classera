'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, TrendingUp, Award, Circle } from 'lucide-react';
import Link from 'next/link';

interface OnlineMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'student' | 'mentor';
  status: 'online' | 'away' | 'offline';
}

interface TopContributor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'student' | 'mentor';
  posts_count: number;
  helpful_answers: number;
}

interface CommunityRightSidebarProps {
  communityId: string;
  userId: string;
}

export function CommunityRightSidebar({ communityId, userId }: CommunityRightSidebarProps) {
  const supabase = createClient();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch online members
      const { data: members } = await supabase
        .from('community_members')
        .select(`
          user:users!community_members_student_id_fkey(
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('community_id', communityId)
        .eq('status', 'approved')
        .limit(10);

      // Get online status from user_status table
      const memberIds = members?.map((m: any) => m.user?.id).filter(Boolean) || [];
      const { data: statuses } = await supabase
        .from('user_status')
        .select('user_id, status')
        .in('user_id', memberIds)
        .eq('status', 'online');

      const onlineIds = new Set(statuses?.map((s: any) => s.user_id) || []);
      
      const onlineMembersList = (members || [])
        .filter((m: any) => m.user && onlineIds.has(m.user.id))
        .map((m: any) => ({
          ...m.user,
          status: 'online' as const
        }))
        .slice(0, 8);

      setOnlineMembers(onlineMembersList);

      // Show approved members as contributors (no post-count join needed yet)
      const topContributorsList = (members || [])
        .filter((m: any) => m.user)
        .map((m: any) => ({
          id: m.user.id,
          full_name: m.user.full_name,
          avatar_url: m.user.avatar_url,
          role: m.user.role,
          posts_count: 0,
          helpful_answers: 0,
        }))
        .slice(0, 5);

      setTopContributors(topContributorsList);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sticky top-6">
      {/* Online Members */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Circle className="w-3 h-3 text-green-500 fill-current" />
          <h3 className="font-bold text-slate-900">Online Now</h3>
          <span className="text-sm text-slate-500">({onlineMembers.length})</span>
        </div>

        {onlineMembers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No one is online right now</p>
        ) : (
          <div className="space-y-3">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      member.full_name.charAt(0)
                    )}
                  </div>
                  <Circle className="w-3 h-3 text-green-500 fill-current absolute bottom-0 right-0 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-sm">
                    {member.full_name}
                  </p>
                  <p className={`text-xs ${member.role === 'mentor' ? 'text-purple-600' : 'text-blue-600'
                    }`}>
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Contributors */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900">Top Contributors</h3>
        </div>

        {topContributors.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No contributors yet</p>
        ) : (
          <div className="space-y-3">
            {topContributors.map((contributor, index) => (
              <div
                key={contributor.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
              >
                <div className="flex-shrink-0">
                  {index === 0 && (
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      1
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {contributor.avatar_url ? (
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      contributor.full_name.charAt(0)
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-sm">
                    {contributor.full_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {contributor.posts_count} posts • {contributor.helpful_answers} comments
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Topics (Placeholder) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-slate-900">Trending Topics</h3>
        </div>
        <div className="space-y-2">
          {['#WebDevelopment', '#DataStructures', '#AI_ML', '#CareerAdvice', '#Projects'].map((tag) => (
            <button
              key={tag}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-600 font-medium text-sm transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Community Stats */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <h3 className="font-bold mb-4">📊 Community Stats</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="opacity-90">Total Posts</span>
            <span className="font-bold">Coming soon</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-90">Questions Answered</span>
            <span className="font-bold">Coming soon</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-90">Active Members</span>
            <span className="font-bold">{onlineMembers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
