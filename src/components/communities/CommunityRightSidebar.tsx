'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, TrendingUp, Award, Circle, Flame, ChevronRight, UserPlus, Hash, BarChart3 } from 'lucide-react';
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

      const topContributorsList = (members || [])
        .filter((m: any) => m.user)
        .map((m: any) => ({
          id: m.user.id,
          full_name: m.user.full_name,
          avatar_url: m.user.avatar_url,
          role: m.user.role,
          posts_count: Math.floor(Math.random() * 20) + 5,
          helpful_answers: Math.floor(Math.random() * 50) + 10,
        }))
        .sort((a, b) => b.helpful_answers - a.helpful_answers)
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
      <div className="space-y-8 sticky top-6">
        <div className="bg-card rounded-[2rem] p-8 border border-border animate-pulse">
          <div className="h-6 bg-muted rounded-lg w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/40 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 sticky top-6">
      {/* Top Streaks (Image 3 Style) */}
      <div className="bg-card rounded-[2rem] p-8 border border-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Flame size={80} className="text-amber-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground tracking-tight">Top Streaks</h3>
              <BarChart3 className="w-5 h-5 text-accent-purple" />
          </div>
          <p className="text-xs text-muted-foreground/70 font-semibold uppercase tracking-widest mb-6">Active for consecutive days</p>
          
          <div className="space-y-5">
            {topContributors.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-xs bg-primary">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full rounded-lg object-cover" />
                    ) : user.full_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground leading-none mb-1">{user.full_name}</h4>
                    <p className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-widest">Active Member</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-600 font-semibold text-sm">
                   <Flame size={14} className="fill-current" />
                   {1200 - (idx * 150)}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-muted/40 hover:bg-muted text-foreground/80 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all">View Leaderboard</button>
        </div>
      </div>

      {/* Online Now (Image 2 Style - "People to Follow") */}
      <div className="bg-card rounded-[2rem] p-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground tracking-tight">Active Fellows</h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-lg text-[10px] font-semibold uppercase border border-green-600 italic">
             <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
             Live
          </div>
        </div>

        {onlineMembers.length === 0 ? (
          <p className="text-xs text-muted-foreground/70 font-semibold uppercase tracking-widest text-center py-6">No one is active</p>
        ) : (
          <div className="space-y-5">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                   <div className="w-11 h-11 rounded-xl bg-muted border border-border p-0.5 group-hover:border-accent-purple transition-colors">
                      <div className="w-full h-full rounded-lg flex items-center justify-center text-muted-foreground/70 font-semibold relative bg-muted">
                         {member.avatar_url ? (
                            <img src={member.avatar_url} className="w-full h-full rounded-lg object-cover" />
                         ) : member.full_name.charAt(0)}
                         <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 border-2 border-white rounded-full" />
                      </div>
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate mb-0.5 transition-colors group-hover:text-accent-purple">{member.full_name}</h4>
                      <p className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-widest leading-none">{member.role}</p>
                   </div>
                </div>
                <button className="p-2.5 text-accent-purple hover:text-accent-purple hover:bg-accent-purple/10 rounded-lg transition-all border border-transparent hover:border-accent-purple">
                   <UserPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Tags (Image 2 Style) */}
      <div className="bg-card rounded-[2rem] p-8 border border-border">
        <h3 className="text-xl font-semibold text-foreground tracking-tight mb-6">Trending Hashtags</h3>
        <div className="flex flex-wrap gap-2">
          {['LearningStreak', 'BuiltWithCode', 'DesignInspo', 'AskTheCommunity', 'CareerSwitch', 'MyFirstCourse', 'WomenInTech', 'DailyWin'].map((tag) => (
            <button
              key={tag}
              className="px-4 py-2.5 bg-muted/40 hover:bg-primary text-foreground/80 hover:text-white rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all border border-border hover:border-accent-purple"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Community Invite Card */}
      <div className="rounded-[2.5rem] p-8 text-white relative overflow-hidden group bg-primary">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[rgba(255,255,255,0.1)] rounded-full blur-3xl group-hover:scale-110 transition-transform" />
        <div className="relative z-10">
           <h3 className="text-2xl font-semibold leading-tight mb-4 tracking-tighter italic">Grow Faster <br /> Together.</h3>
           <p className="text-accent-purple text-xs font-semibold leading-relaxed mb-6">Invite your peers to join the discussion and unlock exclusive mentor tips.</p>
           <button className="w-full py-4 bg-card text-accent-purple rounded-[1.5rem] font-semibold text-xs uppercase tracking-widest shadow-black/10 transition-all hover:bg-accent-purple/10 active:scale-95">
              Copy Invite Link
           </button>
        </div>
      </div>
    </div>
  );
}
