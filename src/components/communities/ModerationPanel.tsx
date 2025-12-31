'use client';

import { useState } from 'react';
import { Shield, UserX, Lock, Unlock, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ModerationPanelProps {
    communityId: string;
    channelId: string;
    channelType: 'announcement' | 'discussion';
    isLocked: boolean;
    onChannelLockChange?: () => void;
}

export function ModerationPanel({
    communityId,
    channelId,
    channelType,
    isLocked,
    onChannelLockChange
}: ModerationPanelProps) {
    const router = useRouter();
    const [showMuteModal, setShowMuteModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleLockChannel = async () => {
        if (channelType === 'announcement') {
            alert('Announcement channel cannot be locked');
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch('/api/community-channels', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId,
                    isLocked: !isLocked,
                    reason: isLocked ? 'Unlocking channel' : 'Locking channel for test'
                })
            });

            if (res.ok) {
                if (onChannelLockChange) onChannelLockChange();
                router.refresh();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to lock/unlock channel');
            }
        } catch (error) {
            console.error('Error locking channel:', error);
            alert('Failed to lock/unlock channel');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-900">Moderation Tools</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Lock/Unlock Channel */}
                {channelType === 'discussion' && (
                    <button
                        onClick={handleLockChannel}
                        disabled={processing}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isLocked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {processing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isLocked ? (
                            <>
                                <Unlock className="w-4 h-4" />
                                Unlock
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Lock
                            </>
                        )}
                    </button>
                )}

                {/* View Logs */}
                <button
                    onClick={() => setShowLogsModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    Logs
                </button>
            </div>

            {/* Moderation Logs Modal */}
            {showLogsModal && (
                <ModerationLogsModal
                    communityId={communityId}
                    onClose={() => setShowLogsModal(false)}
                />
            )}
        </div>
    );
}

// Moderation Logs Modal Component
function ModerationLogsModal({ communityId, onClose }: { communityId: string; onClose: () => void }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useState(() => {
        fetchLogs();
    });

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/community-moderation?communityId=${communityId}&limit=20`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Moderation Logs</h2>
                            <p className="text-sm text-slate-600">Recent moderation actions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No moderation actions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                                {formatAction(log.action)}
                                            </span>
                                            {log.target_user && (
                                                <span className="text-sm text-slate-600">
                                                    → {log.target_user.full_name}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
                                    </div>
                                    {log.reason && (
                                        <p className="text-sm text-slate-600 mt-2">
                                            <span className="font-semibold">Reason:</span> {log.reason}
                                        </p>
                                    )}
                                    {log.metadata?.duration && (
                                        <p className="text-sm text-slate-600 mt-1">
                                            <span className="font-semibold">Duration:</span> {log.metadata.duration}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
