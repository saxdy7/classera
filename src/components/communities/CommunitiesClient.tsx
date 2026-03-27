'use client';

import { useState, useEffect } from 'react';
import { UsersRound, Search, Plus, Check, Clock, X, TrendingUp, Sparkles, Flame, MessageSquare, ChevronRight, Hash, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Community {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    is_active: boolean;
    mentor: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    community_members: { count: number }[];
}

interface Membership {
    id: string;
    community_id: string;
    status: 'pending' | 'approved' | 'rejected';
    community: Community;
}

interface CommunitiesClientProps {
    userId: string;
    universityId: string;
}

export function CommunitiesClient({ userId, universityId }: CommunitiesClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const communitiesRes = await fetch('/api/communities');
            const communitiesData = await communitiesRes.json();
            setCommunities(communitiesData.communities || []);

            const membershipsRes = await fetch('/api/community-members');
            const membershipsData = await membershipsRes.json();
            setMemberships(membershipsData.memberships || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCommunity = async (communityId: string) => {
        setJoiningId(communityId);
        try {
            const res = await fetch('/api/community-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ communityId, action: 'join' })
            });

            if (res.ok) {
                await fetchData();
                router.refresh();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to join community');
            }
        } catch (error) {
            console.error('Error joining community:', error);
            alert('Failed to join community');
        } finally {
            setJoiningId(null);
        }
    };

    const getMembershipStatus = (communityId: string) => {
        return memberships.find(m => m.community_id === communityId);
    };

    const filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayCommunities = activeTab === 'all'
        ? filteredCommunities
        : memberships
            .filter(m => m.status === 'approved')
            .map(m => m.community)
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
            {/* Header / Hero Section (Image 1 Style) */}
            <div className="mb-12">
                <div className="max-w-3xl mb-10">
                    <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                        Explore, Share & <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Connect</span> with Fellow Learners
                    </h1>
                    <p className="text-xl text-slate-500 font-medium">
                        Join the Classera community — share your learning journey, get real tips from peers, and discover new growth paths.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search discussions, groups or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg shadow-sm"
                        />
                    </div>
                    <button className="px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Plus className="w-6 h-6" />
                        Start Discussion
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content (Left) */}
                <div className="col-span-12 lg:col-span-8">
                    {/* Featured Discussions Banner (Image 3 Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                         <div className="relative h-64 rounded-3xl overflow-hidden group cursor-pointer shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" />
                            <div className="absolute inset-0 bg-indigo-600/20 group-hover:bg-indigo-600/0 transition-all duration-500" />
                            <div className="absolute bottom-6 left-6 right-6 z-20">
                                <span className="px-2 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-3 inline-block">Featured</span>
                                <h3 className="text-xl font-bold text-white mb-2 leading-snug">The Beautiful Art of Tech Leadership with Classera Mentors</h3>
                                <div className="flex items-center gap-2 text-white/70 text-xs">
                                    <div className="w-5 h-5 rounded-full bg-slate-200" />
                                    <span>by Admin Team</span>
                                </div>
                            </div>
                         </div>
                         <div className="relative h-64 rounded-3xl overflow-hidden group cursor-pointer shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" />
                            <div className="absolute inset-0 bg-purple-600/20 group-hover:bg-purple-600/0 transition-all duration-500" />
                            <div className="absolute bottom-6 left-6 right-6 z-20">
                                <span className="px-2 py-1 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-3 inline-block">Trending</span>
                                <h3 className="text-xl font-bold text-white mb-2 leading-snug">5 things I learned during my 1st year at University</h3>
                                <div className="flex items-center gap-2 text-white/70 text-xs">
                                    <div className="w-5 h-5 rounded-full bg-slate-200" />
                                    <span>by Student Council</span>
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Discussions List */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm mb-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Community Groups</h2>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    All Groups
                                </button>
                                <button 
                                    onClick={() => setActiveTab('my')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    My Joined
                                </button>
                            </div>
                        </div>

                        {displayCommunities.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <UsersRound className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">No communities found</h3>
                                <p className="text-slate-400 text-sm">Try broadening your search criteria</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {displayCommunities.map((community) => {
                                    const membership = getMembershipStatus(community.id);
                                    const memberCount = community.community_members?.[0]?.count || 0;

                                    return (
                                        <div key={community.id} className="group flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-3xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                                            <div className="w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-[2rem] flex items-center justify-center text-4xl flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                                {community.avatar_url ? (
                                                    <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-[2rem] object-cover" />
                                                ) : (
                                                    '📚'
                                                )}
                                            </div>
                                            <div className="flex-1 text-center sm:text-left">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{community.name}</h3>
                                                    {!community.is_active && (
                                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg self-center">Inactive</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed font-medium">{community.description}</p>
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <UsersRound className="w-3.5 h-3.5" />
                                                        <span>{memberCount} Members</span>
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <div className="flex items-center gap-1.5 text-indigo-500">
                                                        <span>Mentor: {community.mentor?.full_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 w-full sm:w-auto self-center lg:self-start">
                                                {membership?.status === 'approved' ? (
                                                    <Link
                                                        href={`/dashboard/student/communities/${community.id}`}
                                                        className="w-full px-6 py-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
                                                    >
                                                        Enter <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Link>
                                                ) : membership?.status === 'pending' ? (
                                                    <div className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                                                        <Clock className="w-4 h-4" /> Pending
                                                    </div>
                                                ) : membership?.status === 'rejected' ? (
                                                    <div className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-red-100">
                                                        <X className="w-4 h-4" /> Rejected
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleJoinCommunity(community.id)}
                                                        className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        Join Room
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Right) (Image 2 & 3 Style) */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    {/* What's Trending (Image 1 Style) */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                             <Flame className="w-5 h-5 text-orange-500" />
                             What's Trending
                        </h3>
                        <div className="space-y-6">
                            {[
                                { title: "Cheapest Courses for UI/UX Design", desc: "Learners share their favorite budget-friendly paths...", tag: "Career Advice" },
                                { title: "Must-Join Coding Bootcamps 2024", desc: "A list of aesthetic, cozy, and local-favorite courses...", tag: "Technology" },
                                { title: "Planning for Final Year Projects?", desc: "Tips on avoiding burnout and finding inspirations...", tag: "Education" }
                            ].map((item, idx) => (
                                <div key={idx} className="group cursor-pointer">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">{item.tag}</span>
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{item.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                                    <div className="mt-2 flex items-center gap-1 text-indigo-600 text-xs font-bold cursor-pointer group-hover:translate-x-1 transition-transform">
                                        Read More <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Popular Topics (Image 1 Style) */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-800">Popular Topics</h3>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">See All</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['UI/UX Design', 'Web Development', 'AI Research', 'Career Tips', 'Study Groups', 'Networking', 'Project Hub'].map((tag) => (
                                <span key={tag} className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-100 flex items-center gap-1.5">
                                    <Hash className="w-3 h-3 text-slate-400" /> {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Top Mentors (Real Data) */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Top Mentors</h3>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">See All</button>
                        </div>
                        <div className="space-y-6">
                            {Array.from(new Map(communities.map(c => [c.mentor?.id, c.mentor])).values())
                                .slice(0, 5)
                                .map((mentor, idx) => (
                                <div key={mentor?.id || idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shadow-inner overflow-hidden">
                                            {mentor?.avatar_url ? (
                                                <img src={mentor.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                mentor?.full_name?.charAt(0) || 'M'
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{mentor?.full_name || 'Classera Mentor'}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Mentor</p>
                                        </div>
                                    </div>
                                    <button className="p-2.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            ))}
                            {communities.length === 0 && (
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-4">No mentors active yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
