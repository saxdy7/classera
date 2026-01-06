'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, X, Loader2 } from 'lucide-react';

interface User {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    degree_type?: string | null;
    specialization_board?: string | null;
}

interface NewConversationModalProps {
    currentUserRole: 'student' | 'mentor';
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

export function NewConversationModal({ currentUserRole, onClose, onSelectUser }: NewConversationModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'mentors' | 'students'>('mentors');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Fetch ALL users (students and mentors) from same university
            const endpoint = '/api/users/all';
            
            console.log('🔍 Fetching all users (students & mentors) for:', currentUserRole);
            
            const res = await fetch(endpoint);
            const data = await res.json();
            
            console.log('📥 Received users:', data.users?.length || 0);
            
            // Set all users (both students and mentors)
            setUsers(data.users || []);
        } catch (error) {
            console.error('❌ Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users
        .filter(u => u.role === activeTab.slice(0, -1)) // 'mentors' -> 'mentor', 'students' -> 'student'
        .filter(u =>
            u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const mentorsCount = users.filter(u => u.role === 'mentor').length;
    const studentsCount = users.filter(u => u.role === 'student').length;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">New Conversation</h2>
                            <p className="text-sm text-slate-600">
                                Select a student or mentor to start chatting
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('mentors')}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                activeTab === 'mentors'
                                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Mentors
                            {mentorsCount > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    activeTab === 'mentors'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {mentorsCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                activeTab === 'students'
                                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Students
                            {studentsCount > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    activeTab === 'students'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {studentsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                            <p className="text-sm text-slate-500">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-slate-600 font-medium">
                                {searchQuery ? `No ${activeTab} found` : `No ${activeTab} available`}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                {searchQuery ? 'Try a different search term' : 'Check back later'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {user.avatar_url ? (
                                            <img 
                                                src={user.avatar_url} 
                                                alt={user.full_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                                                user.role === 'student'
                                                    ? 'bg-gradient-to-br from-fuchsia-500 to-purple-500'
                                                    : 'bg-gradient-to-br from-indigo-500 to-blue-500'
                                            }`}>
                                                {getInitials(user.full_name)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900 truncate">
                                                {user.full_name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                        {user.degree_type && (
                                            <p className="text-xs text-slate-400 mt-1 truncate">
                                                {user.degree_type} {user.specialization_board && `• ${user.specialization_board}`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Indicator */}
                                    <div className="flex-shrink-0">
                                        <MessageSquare className="w-5 h-5 text-slate-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-500 text-center">
                        Showing {filteredUsers.length} {activeTab} from your university
                    </p>
                </div>
            </div>
        </div>
    );
}
