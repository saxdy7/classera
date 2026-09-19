'use client';

import { useState, useEffect } from 'react';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';

interface PinnedMessagesProps {
    communityId: string;
    isMentor: boolean;
    onUnpin: (messageId: string) => Promise<void>;
}

export function PinnedMessages({ communityId, isMentor, onUnpin }: PinnedMessagesProps) {
    const [pins, setPins] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        fetchPins();
    }, [communityId]);

    const fetchPins = async () => {
        try {
            const res = await fetch(`/api/community-messages/pin?communityId=${communityId}`);
            const data = await res.json();
            setPins(data.pins || []);
        } catch (error) {
            console.error('Error fetching pins:', error);
        }
    };

    if (pins.length === 0) return null;

    return (
        <div className="border-b border-[var(--cl-hairline)] bg-[var(--cl-surface-card)]">
            <div
                className="flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-indigo-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--cl-primary)]">
                    <Pin className="w-4 h-4 text-[var(--cl-primary)]" />
                    <span>{pins.length} Pinned {pins.length === 1 ? 'Message' : 'Messages'}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[var(--cl-muted)]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--cl-muted)]" />
                )}
            </div>

            {isOpen && (
                <div className="px-6 py-2 space-y-2 max-h-40 overflow-y-auto mb-2">
                    {pins.map((pin) => (
                        <div
                            key={pin.id}
                            className="bg-[var(--cl-surface-card)] p-3 rounded-lg border border-[var(--cl-primary)] flex items-start gap-3 group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-xs text-[var(--cl-ink)]">
                                        {pin.message.sender.full_name}
                                    </span>
                                    <span className="text-xs text-[var(--cl-muted)]">
                                        {new Date(pin.pinned_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--cl-body)] truncate">
                                    {pin.message.content}
                                </p>
                            </div>
                            {isMentor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUnpin(pin.message.id).then(fetchPins);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--cl-surface-strong)] rounded text-[var(--cl-muted-soft)] hover:text-[var(--cl-error)] transition-all"
                                    title="Unpin message"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
