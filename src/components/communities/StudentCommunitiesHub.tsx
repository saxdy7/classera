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
    <div className="min-h-screen bg-[var(--cl-canvas)]">
      {/* Header Section */}
      <div className="text-[var(--cl-on-dark)] px-8 py-16 bg-[var(--cl-primary)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-semibold mb-3 tracking-tight">
                Communities
              </h1>
              <p className="text-[var(--cl-primary)] text-lg font-medium">
                Connect, learn, and grow with your peers
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-md rounded-[var(--cl-r-xl)] p-8 border border-[rgba(255,255,255,0.2)]">
                <div className="text-center">
                  <div className="text-5xl font-semibold text-[var(--cl-on-dark)] mb-2">
                    {communities.length}
                  </div>
                  <div className="text-[var(--cl-primary)] font-medium">Active Communities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--cl-muted-soft)]" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[var(--cl-surface-card)] text-[var(--cl-ink)] rounded-[var(--cl-r-xl)] font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.5)] placeholder:text-[var(--cl-muted-soft)]"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--cl-body)] font-medium mb-1">Total Communities</div>
                <div className="text-3xl font-semibold text-[var(--cl-ink)]">{communities.length}</div>
              </div>
              <div className="p-3 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)]">
                <MessageCircle className="w-6 h-6 text-[var(--cl-primary)]" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--cl-body)] font-medium mb-1">Your Memberships</div>
                <div className="text-3xl font-semibold text-[var(--cl-ink)]">
                  {Object.keys(memberships).filter((k) => memberships[k].status === 'approved').length}
                </div>
              </div>
              <div className="p-3 bg-[rgba(22,163,74,0.12)] rounded-[var(--cl-r-lg)]">
                <Users className="w-6 h-6 text-[var(--cl-success)]" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--cl-body)] font-medium mb-1">Pending Requests</div>
                <div className="text-3xl font-semibold text-[var(--cl-ink)]">
                  {Object.keys(memberships).filter((k) => memberships[k].status === 'pending').length}
                </div>
              </div>
              <div className="p-3 bg-[rgba(171,100,0,0.12)] rounded-[var(--cl-r-lg)]">
                <Clock className="w-6 h-6 text-[var(--cl-warning)]" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--cl-body)] font-medium mb-1">Total Members</div>
                <div className="text-3xl font-semibold text-[var(--cl-ink)]">
                  {communities.reduce((sum, c) => sum + (c.community_members?.[0]?.count || 0), 0)}
                </div>
              </div>
              <div className="p-3 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)]">
                <Activity className="w-6 h-6 text-[var(--cl-primary)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[var(--cl-hairline)]">
          {[
            { id: 'all', label: '📚 All Communities', icon: BookOpen },
            { id: 'joined', label: '💚 My Communities', icon: Heart },
            { id: 'trending', label: '🔥 Trending', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-[var(--cl-primary)] border-b-2 border-[var(--cl-primary)]'
                  : 'text-[var(--cl-body)] hover:text-[var(--cl-ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cl-primary)]"></div>
          </div>
        ) : displayedCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCommunities.map((community) => {
              const membership = memberships[community.id];
              const memberCount = community.community_members?.[0]?.count || 0;

              return (
                <div
                  key={community.id}
                  className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] overflow-hidden hover:border-[var(--cl-primary)] transition-all group"
                >
                  {/* Card Header with Gradient */}
                  <div className="h-32 relative overflow-hidden bg-[var(--cl-primary)]">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-[var(--cl-surface-card)] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--cl-surface-card)] rounded-full translate-x-1/4 translate-y-1/4"></div>
                    </div>

                    {/* Mentor Avatar - Positioned Over Gradient */}
                    <div className="absolute -bottom-4 right-6">
                      <div className="w-16 h-16 rounded-[var(--cl-r-xl)] bg-[var(--cl-surface-card)] border-4 border-[var(--cl-primary)] flex items-center justify-center text-sm font-semibold text-[var(--cl-primary)] overflow-hidden">
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
                    <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2 line-clamp-2 group-hover:text-[var(--cl-primary)] transition">
                      {community.name}
                    </h3>

                    <p className="text-sm text-[var(--cl-body)] mb-4 line-clamp-2 font-medium">
                      {community.description || 'No description available'}
                    </p>

                    {/* Mentor Info */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--cl-hairline)]">
                      <div className="w-7 h-7 rounded-lg bg-[var(--cl-primary-soft)] flex items-center justify-center text-xs font-semibold text-[var(--cl-primary)]">
                        👨‍🏫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--cl-muted)]">By</div>
                        <div className="text-sm font-semibold text-[var(--cl-ink)] truncate">
                          {community.mentor?.full_name || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--cl-body)]">
                        <Users className="w-4 h-4 text-[var(--cl-primary)]" />
                        <span>{memberCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--cl-body)]">
                        <MessageCircle className="w-4 h-4 text-[var(--cl-primary)]" />
                        <span>Active</span>
                      </div>
                    </div>

                    {/* Membership Status Badge */}
                    {membership && (
                      <div className="mb-4">
                        {membership.status === 'approved' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] text-xs font-semibold rounded-lg border border-[var(--cl-success)]">
                            ✓ Member
                          </div>
                        )}
                        {membership.status === 'pending' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] text-xs font-semibold rounded-lg border border-[var(--cl-warning)]">
                            ⏳ Pending
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      href={membership ? `/dashboard/student/communities/${community.id}` : `#`}
                      onClick={(e) => {
                        if (!membership || membership.status !== 'approved') {
                          e.preventDefault();
                          // Trigger join action
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        membership?.status === 'approved'
                          ? 'bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)]'
                          : 'bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-ink)]'
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
            <div className="w-24 h-24 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-[var(--cl-primary)]" />
            </div>
            <h3 className="text-2xl font-semibold text-[var(--cl-ink)] mb-2">No Communities Found</h3>
            <p className="text-[var(--cl-body)] font-medium">
              {searchQuery ? 'Try adjusting your search' : 'No communities available right now'}
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="fixed right-0 top-20 w-80 h-[calc(100vh-80px)] bg-[var(--cl-surface-card)] border-l border-[var(--cl-hairline)] p-8 overflow-y-auto hidden xl:block">
        {/* Trending Communities */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--cl-error)]" />
            Trending Now
          </h3>
          <div className="space-y-3">
            {trendingCommunities.slice(0, 5).map((c, idx) => (
              <Link
                key={c.id}
                href={`/dashboard/student/communities/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--cl-surface-strong)] transition group"
              >
                <div className="text-xl font-semibold text-[var(--cl-warning)]">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--cl-ink)] truncate group-hover:text-[var(--cl-primary)]">
                    {c.name}
                  </div>
                  <div className="text-xs text-[var(--cl-muted)]">
                    {c.community_members?.[0]?.count || 0} members
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-primary)]">
          <h4 className="text-sm font-semibold text-[var(--cl-primary)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Pro Tips
          </h4>
          <ul className="space-y-2 text-xs text-[var(--cl-primary)] font-medium">
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
