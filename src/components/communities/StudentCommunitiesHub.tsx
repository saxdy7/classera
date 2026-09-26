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
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="text-white px-8 py-16 bg-primary">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground text-5xl mb-3">
                Communities
              </h1>
              <p className="text-accent-purple text-lg font-medium">
                Connect, learn, and grow with your peers
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl p-8 border border-[rgba(255,255,255,0.2)]">
                <div className="text-center">
                  <div className="text-5xl font-semibold text-white mb-2">
                    {communities.length}
                  </div>
                  <div className="text-accent-purple font-medium">Active Communities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-card text-foreground rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.5)] placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-card rounded-xl p-6 border border-border transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground/80 font-medium mb-1">Total Communities</div>
                <div className="text-3xl font-semibold text-foreground">{communities.length}</div>
              </div>
              <div className="p-3 bg-accent-purple/10 rounded-lg">
                <MessageCircle className="w-6 h-6 text-accent-purple" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground/80 font-medium mb-1">Your Memberships</div>
                <div className="text-3xl font-semibold text-foreground">
                  {Object.keys(memberships).filter((k) => memberships[k].status === 'approved').length}
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground/80 font-medium mb-1">Pending Requests</div>
                <div className="text-3xl font-semibold text-foreground">
                  {Object.keys(memberships).filter((k) => memberships[k].status === 'pending').length}
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground/80 font-medium mb-1">Total Members</div>
                <div className="text-3xl font-semibold text-foreground">
                  {communities.reduce((sum, c) => sum + (c.community_members?.[0]?.count || 0), 0)}
                </div>
              </div>
              <div className="p-3 bg-accent-purple/10 rounded-lg">
                <Activity className="w-6 h-6 text-accent-purple" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex w-fit items-center gap-1 rounded border border-border/40 bg-muted p-1">
          {[
            { id: 'all', label: 'All Communities', icon: BookOpen },
            { id: 'joined', label: 'My Communities', icon: Heart },
            { id: 'trending', label: 'Trending', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex cursor-pointer items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors sm:px-6 ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : displayedCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCommunities.map((community) => {
              const membership = memberships[community.id];
              const memberCount = community.community_members?.[0]?.count || 0;

              return (
                <div
                  key={community.id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:border-accent-purple transition-all group"
                >
                  {/* Card Header with Gradient */}
                  <div className="h-32 relative overflow-hidden bg-primary">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-card rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-card rounded-full translate-x-1/4 translate-y-1/4"></div>
                    </div>

                    {/* Mentor Avatar - Positioned Over Gradient */}
                    <div className="absolute -bottom-4 right-6">
                      <div className="w-16 h-16 rounded-xl bg-card border-4 border-accent-purple flex items-center justify-center text-sm font-semibold text-accent-purple overflow-hidden">
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
                    <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-accent-purple transition">
                      {community.name}
                    </h3>

                    <p className="text-sm text-foreground/80 mb-4 line-clamp-2 font-medium">
                      {community.description || 'No description available'}
                    </p>

                    {/* Mentor Info */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                      <div className="w-7 h-7 rounded-lg bg-accent-purple/10 flex items-center justify-center text-xs font-semibold text-accent-purple">
                        👨‍🏫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">By</div>
                        <div className="text-sm font-semibold text-foreground truncate">
                          {community.mentor?.full_name || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                        <Users className="w-4 h-4 text-accent-purple" />
                        <span>{memberCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                        <MessageCircle className="w-4 h-4 text-accent-purple" />
                        <span>Active</span>
                      </div>
                    </div>

                    {/* Membership Status Badge */}
                    {membership && (
                      <div className="mb-4">
                        {membership.status === 'approved' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 text-xs font-semibold rounded-lg border border-green-600">
                            ✓ Member
                          </div>
                        )}
                        {membership.status === 'pending' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 text-xs font-semibold rounded-lg border border-amber-500">
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
                          ? 'bg-primary hover:bg-primary text-white'
                          : 'bg-muted hover:bg-muted text-foreground'
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
            <div className="w-24 h-24 bg-accent-purple/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-accent-purple" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No Communities Found</h3>
            <p className="text-foreground/80 font-medium">
              {searchQuery ? 'Try adjusting your search' : 'No communities available right now'}
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="fixed right-0 top-20 w-80 h-[calc(100vh-80px)] bg-card border-l border-border p-8 overflow-y-auto hidden xl:block">
        {/* Trending Communities */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-destructive" />
            Trending Now
          </h3>
          <div className="space-y-3">
            {trendingCommunities.slice(0, 5).map((c, idx) => (
              <Link
                key={c.id}
                href={`/dashboard/student/communities/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition group"
              >
                <div className="text-xl font-semibold text-amber-600">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate group-hover:text-accent-purple">
                    {c.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.community_members?.[0]?.count || 0} members
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-accent-purple/10 rounded-xl p-6 border border-accent-purple">
          <h4 className="text-sm font-semibold text-accent-purple mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Pro Tips
          </h4>
          <ul className="space-y-2 text-xs text-accent-purple font-medium">
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
