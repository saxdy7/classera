'use client';

import { useState, useEffect } from 'react';
import { X, Search, Users, Check, UserPlus, Send, Filter } from 'lucide-react';

interface Student {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

interface Community {
    id: string;
    name: string;
    member_count?: number;
}

interface BulkInviteModalProps {
    testId: string;
    testTitle: string;
    onClose: () => void;
    onSuccess: () => void;
    existingInvitations?: string[]; // student IDs already invited
}

export function BulkInviteModal({ testId, testTitle, onClose, onSuccess, existingInvitations = [] }: BulkInviteModalProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'students' | 'communities'>('students');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch students from same university
            const studentsRes = await fetch('/api/students');
            const studentsData = await studentsRes.json();
            setStudents(studentsData.students || []);

            // Fetch communities
            const communitiesRes = await fetch('/api/communities');
            const communitiesData = await communitiesRes.json();
            setCommunities(communitiesData.communities || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            }
            return [...prev, studentId];
        });
    };

    const selectAll = () => {
        const availableStudents = filteredStudents
            .filter(s => !existingInvitations.includes(s.id))
            .map(s => s.id);
        setSelectedStudents(availableStudents);
    };

    const clearSelection = () => {
        setSelectedStudents([]);
    };

    const handleSendInvitations = async () => {
        setSending(true);
        try {
            const payload: { test_id: string; student_ids?: string[]; community_id?: string; send_notification: boolean } = {
                test_id: testId,
                send_notification: true,
            };

            if (tab === 'students') {
                payload.student_ids = selectedStudents;
            } else {
                payload.community_id = selectedCommunity;
            }

            const response = await fetch('/api/tests/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitations');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error sending invitations:', error);
            alert(error.message || 'Failed to send invitations. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const filteredStudents = students.filter(student => {
        if (!searchQuery) return true;
        return (
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const canSend = tab === 'students' 
        ? selectedStudents.length > 0 
        : selectedCommunity !== '';

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />
            <div className="fixed inset-x-4 top-8 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[700px] z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Invite Students</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            to {testTitle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setTab('students')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                            tab === 'students'
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <UserPlus className="w-4 h-4 inline-block mr-2" />
                        Individual Students
                    </button>
                    <button
                        onClick={() => setTab('communities')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                            tab === 'communities'
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Entire Community
                    </button>
                </div>

                {/* Content */}
                {tab === 'students' ? (
                    <>
                        {/* Search & Actions */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={selectAll}
                                    className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Students List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500">No students found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredStudents.map((student) => {
                                        const isSelected = selectedStudents.includes(student.id);
                                        const isAlreadyInvited = existingInvitations.includes(student.id);

                                        return (
                                            <div
                                                key={student.id}
                                                onClick={() => !isAlreadyInvited && toggleStudent(student.id)}
                                                className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all ${
                                                    isAlreadyInvited
                                                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-indigo-50 border-indigo-300'
                                                            : 'bg-white border-slate-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600'
                                                        : 'border-slate-300'
                                                }`}>
                                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {student.full_name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900">
                                                        {student.full_name}
                                                    </p>
                                                    <p className="text-sm text-slate-500 truncate">
                                                        {student.email}
                                                    </p>
                                                </div>
                                                {isAlreadyInvited && (
                                                    <span className="text-xs text-orange-500 font-medium">
                                                        Already invited
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Communities Tab */
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : communities.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">No communities found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-slate-500 mb-4">
                                    Select a community to invite all its members
                                </p>
                                {communities.map((community) => (
                                    <div
                                        key={community.id}
                                        onClick={() => setSelectedCommunity(community.id)}
                                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                                            selectedCommunity === community.id
                                                ? 'bg-indigo-50 border-indigo-300'
                                                : 'bg-white border-slate-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            selectedCommunity === community.id
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'border-slate-300'
                                        }`}>
                                            {selectedCommunity === community.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {community.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900">
                                                {community.name}
                                            </p>
                                            {community.member_count && (
                                                <p className="text-sm text-slate-500">
                                                    {community.member_count} members
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-600">
                        {tab === 'students' 
                            ? `${selectedStudents.length} students selected`
                            : selectedCommunity ? '1 community selected' : 'No community selected'
                        }
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSendInvitations}
                            disabled={!canSend || sending}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            {sending ? 'Sending...' : 'Send Invitations'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BulkInviteModal;
