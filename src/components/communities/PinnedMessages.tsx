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
        <div className="border-b border-slate-200 bg-indigo-50/50">
            <div
                className="flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-indigo-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                    <Pin className="w-4 h-4 text-indigo-600" />
                    <span>{pins.length} Pinned {pins.length === 1 ? 'Message' : 'Messages'}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </div>

            {isOpen && (
                <div className="px-6 py-2 space-y-2 max-h-40 overflow-y-auto mb-2">
                    {pins.map((pin) => (
                        <div
                            key={pin.id}
                            className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex items-start gap-3 group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-xs text-slate-900">
                                        {pin.message.sender.full_name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {new Date(pin.pinned_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 truncate">
                                    {pin.message.content}
                                </p>
                            </div>
                            {isMentor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUnpin(pin.message.id).then(fetchPins);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-all"
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
