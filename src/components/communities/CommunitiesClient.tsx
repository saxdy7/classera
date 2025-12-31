'use client';

import { useState, useEffect } from 'react';
import { UsersRound, Search, Plus, Check, Clock, X } from 'lucide-react';
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
            // Fetch all communities
            const communitiesRes = await fetch('/api/communities');
            const communitiesData = await communitiesRes.json();
            setCommunities(communitiesData.communities || []);

            // Fetch user's memberships
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

    const handleLeaveCommunity = async (communityId: string) => {
        if (!confirm('Are you sure you want to leave this community?')) return;

        try {
            const res = await fetch('/api/community-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ communityId, action: 'leave' })
            });

            if (res.ok) {
                await fetchData();
                router.refresh();
            }
        } catch (error) {
            console.error('Error leaving community:', error);
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-black flex items-center gap-3 mb-2">
                    <UsersRound className="w-8 h-8 text-purple-600" />
                    Communities
                </h2>
                <p className="text-slate-600">Connect with peers and learn together</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'all'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    All Communities ({communities.length})
                </button>
                <button
                    onClick={() => setActiveTab('my')}
                    className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'my'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    My Communities ({memberships.filter(m => m.status === 'approved').length})
                </button>
            </div>

            {/* Communities Grid */}
            {displayCommunities.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UsersRound className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {activeTab === 'all' ? 'No Communities Yet' : 'No Joined Communities'}
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        {activeTab === 'all'
                            ? 'Communities will be created by mentors. Check back later!'
                            : 'Join communities to collaborate with your peers.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayCommunities.map((community) => {
                        const membership = getMembershipStatus(community.id);
                        const memberCount = community.community_members?.[0]?.count || 0;

                        return (
                            <div
                                key={community.id}
                                className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
                                        {community.avatar_url ? (
                                            <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            '👥'
                                        )}
                                    </div>
                                    {!community.is_active && (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-900 mb-2">{community.name}</h3>
                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{community.description}</p>

                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                    <UsersRound className="w-4 h-4" />
                                    <span>{memberCount} members</span>
                                </div>

                                <div className="text-xs text-slate-500 mb-4">
                                    Mentor: {community.mentor?.full_name}
                                </div>

                                {/* Action Button */}
                                {membership?.status === 'approved' ? (
                                    <Link
                                        href={`/dashboard/student/communities/${community.id}`}
                                        className="w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        View Community
                                    </Link>
                                ) : membership?.status === 'pending' ? (
                                    <button
                                        disabled
                                        className="w-full px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Pending Approval
                                    </button>
                                ) : membership?.status === 'rejected' ? (
                                    <button
                                        disabled
                                        className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <X className="w-4 h-4" />
                                        Request Rejected
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleJoinCommunity(community.id)}
                                        disabled={joiningId === community.id || !community.is_active}
                                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {joiningId === community.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Joining...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Join Community
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
