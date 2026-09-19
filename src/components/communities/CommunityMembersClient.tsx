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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cl-primary)]"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Members</h2>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--cl-primary-soft)] rounded-lg">
                            <Users className="w-4 h-4 text-[var(--cl-primary)]" />
                            <span className="text-sm font-semibold text-[var(--cl-primary)]">{members.length} total</span>
                        </div>
                    </div>
                    {currentUserRole === 'mentor' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-lg font-medium transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Students
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--cl-muted-soft)]" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-[var(--cl-hairline)]">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'all'
                            ? 'text-[var(--cl-primary)] border-b-2 border-[var(--cl-primary)]'
                            : 'text-[var(--cl-muted)] hover:text-[var(--cl-body)]'
                            }`}
                    >
                        All ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'pending'
                            ? 'text-[var(--cl-primary)] border-b-2 border-[var(--cl-primary)]'
                            : 'text-[var(--cl-muted)] hover:text-[var(--cl-body)]'
                            }`}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'approved'
                            ? 'text-[var(--cl-primary)] border-b-2 border-[var(--cl-primary)]'
                            : 'text-[var(--cl-muted)] hover:text-[var(--cl-body)]'
                            }`}
                    >
                        Approved ({approvedCount})
                    </button>
                </div>

                {/* Members List */}
                {filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-[var(--cl-muted-soft)] mx-auto mb-4" />
                        <p className="text-[var(--cl-body)]">No members found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] hover:bg-[var(--cl-canvas-soft)] transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] font-semibold bg-[var(--cl-primary)]">
                                        {member.student.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[var(--cl-ink)]">{member.student.full_name}</h3>
                                        <p className="text-sm text-[var(--cl-body)]">{member.student.email}</p>
                                        {member.student.degree_type && (
                                            <p className="text-xs text-[var(--cl-muted)] mt-1">
                                                {member.student.degree_type} {member.student.specialization_board && `• ${member.student.specialization_board}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--cl-muted)]">Joined {formatDate(member.joined_at)}</p>
                                        {member.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] text-xs font-semibold rounded-full">
                                                <Clock className="w-3 h-3" />
                                                Pending
                                            </span>
                                        )}
                                        {member.status === 'approved' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] text-xs font-semibold rounded-full">
                                                <Check className="w-3 h-3" />
                                                Approved
                                            </span>
                                        )}
                                        {member.status === 'rejected' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] text-xs font-semibold rounded-full">
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
                                                    className="p-2 bg-[rgba(22,163,74,0.12)] hover:bg-[var(--cl-success)] text-[var(--cl-success)] rounded-lg transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(member.id)}
                                                    disabled={processingId === member.id}
                                                    className="p-2 bg-[rgba(239,68,68,0.12)] hover:bg-[var(--cl-error)] text-[var(--cl-error)] rounded-lg transition-colors disabled:opacity-50"
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
                                                    className="p-2 bg-[rgba(171,100,0,0.12)] hover:bg-[var(--cl-warning)] text-[var(--cl-warning)] rounded-lg transition-colors disabled:opacity-50"
                                                    title="Mute member"
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    disabled={processingId === member.id}
                                                    className="p-2 bg-[rgba(239,68,68,0.12)] hover:bg-[var(--cl-error)] text-[var(--cl-error)] rounded-lg transition-colors disabled:opacity-50"
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
