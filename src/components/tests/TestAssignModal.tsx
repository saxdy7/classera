'use client';

import { useState, useEffect } from 'react';
import { X, Users, User, Search, Check, Loader } from 'lucide-react';

interface Student {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

interface Community {
    id: string;
    name: string;
    member_count: number;
}

interface Props {
    testId: string;
    testTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onAssigned: (count: number) => void;
}

export function TestAssignModal({ testId, testTitle, isOpen, onClose, onAssigned }: Props) {
    const [mode, setMode] = useState<'students' | 'community'>('students');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
            fetchCommunities();
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students');
            const data = await response.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchCommunities = async () => {
        try {
            const response = await fetch('/api/communities');
            const data = await response.json();
            setCommunities(data.communities || []);
        } catch (error) {
            console.error('Error fetching communities:', error);
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const selectAllStudents = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handleAssign = async () => {
        if ((mode === 'students' && selectedStudents.size === 0) || (mode === 'community' && !selectedCommunity)) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/tests/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    test_id: testId,
                    student_ids: mode === 'students' ? Array.from(selectedStudents) : undefined,
                    community_id: mode === 'community' ? selectedCommunity : undefined,
                    send_notification: true
                })
            });

            const data = await response.json();

            if (response.ok) {
                onAssigned(data.assigned_count || 0);
                onClose();
            } else {
                alert(data.error || 'Failed to assign test');
            }
        } catch (error) {
            console.error('Error assigning test:', error);
            alert('Failed to assign test');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--cl-hairline)] flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--cl-ink)]">Invite Students</h2>
                            <p className="text-[var(--cl-body)] text-xs">{testTitle}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--cl-surface-strong)] rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode('students')}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg font-medium flex items-center justify-center gap-2 ${mode === 'students'
                                    ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)]'
                                    : 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)] hover:bg-[var(--cl-surface-strong)]'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Individual Students
                        </button>
                        <button
                            onClick={() => setMode('community')}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg font-medium flex items-center justify-center gap-2 ${mode === 'community'
                                    ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)]'
                                    : 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)] hover:bg-[var(--cl-surface-strong)]'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Entire Community
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 overflow-y-auto min-h-0">
                    {mode === 'students' ? (
                        <>
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cl-muted-soft)]" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)]"
                                />
                            </div>

                            {/* Select All */}
                            <button
                                onClick={selectAllStudents}
                                className="text-xs text-[var(--cl-primary)] hover:text-[var(--cl-primary)] mb-2"
                            >
                                {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                            </button>

                            {/* Student List */}
                            <div className="space-y-1">
                                {filteredStudents.map(student => (
                                    <label
                                        key={student.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border-2 transition-all ${selectedStudents.has(student.id)
                                                ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)]'
                                                : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)] hover:bg-[var(--cl-canvas-soft)]'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            selectedStudents.has(student.id)
                                                ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)]'
                                                : 'border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)]'
                                        }`}>
                                            {selectedStudents.has(student.id) && (
                                                <Check className="w-3 h-3 text-[var(--cl-on-dark)]" />
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.has(student.id)}
                                            onChange={() => toggleStudent(student.id)}
                                            className="hidden"
                                        />
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] font-semibold text-xs flex-shrink-0 bg-[var(--cl-primary)]">
                                            {student.full_name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[var(--cl-ink)]">{student.full_name}</p>
                                            <p className="text-xs text-[var(--cl-muted)] truncate">{student.email}</p>
                                        </div>
                                        {selectedStudents.has(student.id) && (
                                            <Check className="w-4 h-4 text-[var(--cl-primary)] flex-shrink-0" />
                                        )}
                                    </label>
                                ))}

                                {filteredStudents.length === 0 && (
                                    <p className="text-center text-[var(--cl-muted)] py-6 text-sm">No students found</p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Community List */
                        <div className="space-y-1">
                            {communities.map(community => (
                                <label
                                    key={community.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border-2 transition-all ${selectedCommunity === community.id
                                            ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)]'
                                            : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)] hover:bg-[var(--cl-canvas-soft)]'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        selectedCommunity === community.id
                                            ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)]'
                                            : 'border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)]'
                                    }`}>
                                        {selectedCommunity === community.id && (
                                            <Check className="w-3 h-3 text-[var(--cl-on-dark)]" />
                                        )}
                                    </div>
                                    <input
                                        type="radio"
                                        name="community"
                                        checked={selectedCommunity === community.id}
                                        onChange={() => setSelectedCommunity(community.id)}
                                        className="hidden"
                                    />
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--cl-on-dark)] font-semibold text-xs flex-shrink-0 bg-[var(--cl-info)]">
                                        {community.name?.[0] || 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[var(--cl-ink)]">{community.name}</p>
                                        <p className="text-xs text-[var(--cl-muted)]">{community.member_count || 0} members</p>
                                    </div>
                                </label>
                            ))}

                            {communities.length === 0 && (
                                <p className="text-center text-[var(--cl-muted)] py-6 text-sm">No communities found</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--cl-hairline)] flex-shrink-0 flex items-center justify-between gap-3">
                    <p className="text-xs text-[var(--cl-body)]">
                        {mode === 'students'
                            ? `${selectedStudents.size} selected`
                            : selectedCommunity ? '1 selected' : 'None selected'
                        }
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg hover:bg-[var(--cl-surface-strong)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={submitting || (mode === 'students' && selectedStudents.size === 0) || (mode === 'community' && !selectedCommunity)}
                            title={
                              (mode === 'students' && selectedStudents.size === 0)
                                ? 'Select at least one student'
                                : (mode === 'community' && !selectedCommunity)
                                ? 'Select a community'
                                : `Assign to ${mode === 'students' ? selectedStudents.size : 1} recipient${mode === 'students' && selectedStudents.size !== 1 ? 's' : ''}`
                            }
                            className="px-4 py-1.5 text-sm text-[var(--cl-on-dark)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 bg-[var(--cl-primary)]"
                        >
                            {submitting ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Assign
                              </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
