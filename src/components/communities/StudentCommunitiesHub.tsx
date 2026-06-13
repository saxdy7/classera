'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Users,
  TrendingUp,
  Search,
  Plus,
  Heart,
  BookOpen,
  Zap,
  ArrowRight,
  Clock,
  Activity,
  ChevronRight,
  Sparkles,
  Hash,
  MapPin,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_active: boolean;
  community_members?: Array<{ count: number }>;
  mentor?: { full_name: string; avatar_url?: string };
  created_at: string;
}

interface Membership {
  community_id: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function StudentCommunitiesHub({ userId, universityId }: { userId: string; universityId: string }) {
  const supabase = createClient();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [memberships, setMemberships] = useState<Record<string, Membership>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'joined' | 'trending'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all communities
      const { data: allCommunities } = await supabase
        .from('communities')
        .select(`
          *,
          community_members(count),
          mentor:users!communities_mentor_id_fkey(full_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Fetch user's memberships
      const { data: userMemberships } = await supabase
        .from('community_members')
        .select('community_id, status')
        .eq('student_id', userId);

      setCommunities(allCommunities || []);

      const membershipMap: Record<string, Membership> = {};
      userMemberships?.forEach((m) => {
        membershipMap[m.community_id] = m;
      });
      setMemberships(membershipMap);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isMember = memberships[c.id];

    if (activeTab === 'joined') return matchesSearch && isMember;
    if (activeTab === 'trending') return matchesSearch; // Sort by member count
    return matchesSearch;
  });

  const trendingCommunities = [...filteredCommunities].sort(
    (a, b) => (b.community_members?.[0]?.count || 0) - (a.community_members?.[0]?.count || 0)
  );

  const displayedCommunities =
    activeTab === 'trending' ? trendingCommunities : filteredCommunities;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-black mb-3 tracking-tight">
                Communities
              </h1>
              <p className="text-indigo-100 text-lg font-medium">
                Connect, learn, and grow with your peers
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center">
                  <div className="text-5xl font-black text-white mb-2">
                    {communities.length}
                  </div>
                  <div className="text-indigo-100 font-medium">Active Communities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white text-slate-900 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-2xl placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 font-medium mb-1">Total Communities</div>
                <div className="text-3xl font-black text-slate-900">{communities.length}</div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 font-medium mb-1">Your Memberships</div>
                <div className="text-3xl font-black text-slate-900">
                  {Object.keys(memberships).filter((k) => memberships[k].status === 'approved').length}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 font-medium mb-1">Pending Requests</div>
                <div className="text-3xl font-black text-slate-900">
                  {Object.keys(memberships).filter((k) => memberships[k].status === 'pending').length}
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 font-medium mb-1">Total Members</div>
                <div className="text-3xl font-black text-slate-900">
                  {communities.reduce((sum, c) => sum + (c.community_members?.[0]?.count || 0), 0)}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          {[
            { id: 'all', label: '📚 All Communities', icon: BookOpen },
            { id: 'joined', label: '💚 My Communities', icon: Heart },
            { id: 'trending', label: '🔥 Trending', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : displayedCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCommunities.map((community) => {
              const membership = memberships[community.id];
              const memberCount = community.community_members?.[0]?.count || 0;

              return (
                <div
                  key={community.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-300 transition-all group"
                >
                  {/* Card Header with Gradient */}
                  <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/4 translate-y-1/4"></div>
                    </div>

                    {/* Mentor Avatar - Positioned Over Gradient */}
                    <div className="absolute -bottom-4 right-6">
                      <div className="w-16 h-16 rounded-2xl bg-white border-4 border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 overflow-hidden shadow-lg">
                        {community.mentor?.avatar_url ? (
                          <img
                            src={community.mentor.avatar_url}
                            alt={community.mentor.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          community.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-10">
                    <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition">
                      {community.name}
                    </h3>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 font-medium">
                      {community.description || 'No description available'}
                    </p>

                    {/* Mentor Info */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        👨‍🏫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500">By</div>
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {community.mentor?.full_name || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>{memberCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                        <span>Active</span>
                      </div>
                    </div>

                    {/* Membership Status Badge */}
                    {membership && (
                      <div className="mb-4">
                        {membership.status === 'approved' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                            ✓ Member
                          </div>
                        )}
                        {membership.status === 'pending' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                            ⏳ Pending
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      href={membership ? `/dashboard/student/communities/${community.id}` : `#`}
                      onClick={(e) => {
                        if (!membership && !membership?.status === 'approved') {
                          e.preventDefault();
                          // Trigger join action
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        membership?.status === 'approved'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      {membership?.status === 'approved' ? (
                        <>
                          View Community <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        'Request to Join'
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Communities Found</h3>
            <p className="text-slate-600 font-medium">
              {searchQuery ? 'Try adjusting your search' : 'No communities available right now'}
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="fixed right-0 top-20 w-80 h-[calc(100vh-80px)] bg-white border-l border-slate-200 p-8 overflow-y-auto hidden xl:block">
        {/* Trending Communities */}
        <div className="mb-10">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Trending Now
          </h3>
          <div className="space-y-3">
            {trendingCommunities.slice(0, 5).map((c, idx) => (
              <Link
                key={c.id}
                href={`/dashboard/student/communities/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition group"
              >
                <div className="text-xl font-black text-amber-600">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600">
                    {c.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.community_members?.[0]?.count || 0} members
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
          <h4 className="text-sm font-black text-indigo-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Pro Tips
          </h4>
          <ul className="space-y-2 text-xs text-indigo-700 font-medium">
            <li>✓ Join communities related to your interests</li>
            <li>✓ Ask questions in the discussion forum</li>
            <li>✓ Share your knowledge with peers</li>
            <li>✓ Connect with mentors for guidance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
