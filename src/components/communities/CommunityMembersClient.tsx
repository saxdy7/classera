'use client';

import { useState, useEffect } from 'react';
import { Users, Check, X, Clock, Trash2, Search, UserPlus, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddMembersModal } from './AddMembersModal';
import { MuteUserModal } from './MuteUserModal';

interface Member {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    joined_at: string;
    student: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        degree_type: string | null;
        specialization_board: string | null;
    };
}

interface CommunityMembersClientProps {
    communityId: string;
    currentUserRole: 'student' | 'mentor';
}

export function CommunityMembersClient({ communityId, currentUserRole }: CommunityMembersClientProps) {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMuteModal, setShowMuteModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    useEffect(() => {
        fetchMembers();
    }, [communityId]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/community-members?communityId=${communityId}`);
            const data = await res.json();
            setMembers(data.members || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (memberId: string) => {
        setProcessingId(memberId);
        try {
            const res = await fetch('/api/community-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, action: 'approve' })
            });

            if (res.ok) {
                await fetchMembers();
                router.refresh();
            }
        } catch (error) {
            console.error('Error approving member:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (memberId: string) => {
        setProcessingId(memberId);
        try {
            const res = await fetch('/api/community-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, action: 'reject' })
            });

            if (res.ok) {
                await fetchMembers();
                router.refresh();
            }
        } catch (error) {
            console.error('Error rejecting member:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        setProcessingId(memberId);
        try {
            const res = await fetch(`/api/community-members?memberId=${memberId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchMembers();
                router.refresh();
            }
        } catch (error) {
            console.error('Error removing member:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || m.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const pendingCount = members.filter(m => m.status === 'pending').length;
    const approvedCount = members.filter(m => m.status === 'approved').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900">Members</h2>
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-600">{members.length} total</span>
                        </div>
                    </div>
                    {currentUserRole === 'mentor' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Students
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'all'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'pending'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'approved'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Approved ({approvedCount})
                    </button>
                </div>

                {/* Members List */}
                {filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No members found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {member.student.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900">{member.student.full_name}</h3>
                                        <p className="text-sm text-slate-600">{member.student.email}</p>
                                        {member.student.degree_type && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {member.student.degree_type} {member.student.specialization_board && `• ${member.student.specialization_board}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Joined {formatDate(member.joined_at)}</p>
                                        {member.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                                <Clock className="w-3 h-3" />
                                                Pending
                                            </span>
                                        )}
                                        {member.status === 'approved' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                <Check className="w-3 h-3" />
                                                Approved
                                            </span>
                                        )}
                                        {member.status === 'rejected' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                                <X className="w-3 h-3" />
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {currentUserRole === 'mentor' && (
                                    <div className="flex items-center gap-2 ml-4">
                                        {member.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(member.id)}
                                                    disabled={processingId === member.id}
                                                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(member.id)}
                                                    disabled={processingId === member.id}
                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        {member.status === 'approved' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedMember(member);
                                                        setShowMuteModal(true);
                                                    }}
                                                    disabled={processingId === member.id}
                                                    className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Mute member"
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    disabled={processingId === member.id}
                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Members Modal */}
            {showAddModal && (
                <AddMembersModal
                    communityId={communityId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        fetchMembers();
                        router.refresh();
                    }}
                />
            )}

            {/* Mute User Modal */}
            {showMuteModal && selectedMember && (
                <MuteUserModal
                    communityId={communityId}
                    userId={selectedMember.student.id}
                    userName={selectedMember.student.full_name}
                    onClose={() => {
                        setShowMuteModal(false);
                        setSelectedMember(null);
                    }}
                    onSuccess={() => {
                        fetchMembers();
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}
