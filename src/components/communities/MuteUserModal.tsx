'use client';

import { useState } from 'react';
import { UserX, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MuteUserModalProps {
    communityId: string;
    userId: string;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function MuteUserModal({ communityId, userId, userName, onClose, onSuccess }: MuteUserModalProps) {
    const router = useRouter();
    const [duration, setDuration] = useState<'24h' | '7d' | '30d' | 'permanent'>('24h');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleMute = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/community-moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                    action: 'MUTE_USER',
                    targetUserId: userId,
                    duration,
                    reason: reason || 'No reason provided'
                })
            });

            if (res.ok) {
                onSuccess();
                router.refresh();
                onClose();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to mute user');
            }
        } catch (error) {
            console.error('Error muting user:', error);
            alert('Failed to mute user');
        } finally {
            setProcessing(false);
        }
    };

    const getDurationLabel = (dur: string) => {
        switch (dur) {
            case '24h': return '24 Hours';
            case '7d': return '7 Days';
            case '30d': return '30 Days';
            case 'permanent': return 'Permanent';
            default: return dur;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-[var(--cl-hairline)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[rgba(239,68,68,0.12)] rounded-[var(--cl-r-lg)] flex items-center justify-center">
                            <UserX className="w-5 h-5 text-[var(--cl-error)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--cl-ink)]">Mute User</h2>
                            <p className="text-sm text-[var(--cl-body)]">Mute {userName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--cl-surface-strong)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--cl-body)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Duration Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
                            Mute Duration
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['24h', '7d', '30d', 'permanent'] as const).map((dur) => (
                                <button
                                    key={dur}
                                    onClick={() => setDuration(dur)}
                                    className={`px-4 py-3 rounded-[var(--cl-r-lg)] font-medium transition-colors ${duration === dur
                                            ? 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] border-2 border-[var(--cl-error)]'
                                            : 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)] border-2 border-transparent hover:bg-[var(--cl-surface-strong)]'
                                        }`}
                                >
                                    {getDurationLabel(dur)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label htmlFor="reason" className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-error)] focus:border-transparent resize-none"
                            placeholder="Why are you muting this user?"
                        />
                    </div>

                    {/* Warning */}
                    <div className="p-4 bg-[rgba(171,100,0,0.12)] border border-[var(--cl-warning)] rounded-[var(--cl-r-lg)]">
                        <p className="text-sm text-[var(--cl-warning)]">
                            <strong>Note:</strong> The user will not be able to post messages in this community for the selected duration.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--cl-hairline)] flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-6 py-2.5 bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] font-semibold transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMute}
                        disabled={processing}
                        className="px-6 py-2.5 bg-[var(--cl-error)] hover:bg-[var(--cl-error)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Muting...
                            </>
                        ) : (
                            <>
                                <UserX className="w-4 h-4" />
                                Mute User
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
