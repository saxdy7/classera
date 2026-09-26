'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';

interface MessageSearchProps {
    channelId: string;
    onClose: () => void;
}

export function MessageSearch({ channelId, onClose }: MessageSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim()) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/community-messages/search?channelId=${channelId}&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data.messages || []);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="absolute top-0 right-0 w-80 h-full bg-card border-l border-border z-20 flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground/70" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                    autoFocus
                />
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-accent-purple" />
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {results.length} results found
                        </p>
                        {results.map((msg) => (
                            <div
                                key={msg.id}
                                className="p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm text-foreground">
                                        {msg.sender?.full_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(msg.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-3">
                                    {msg.content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : query ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No messages found
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground/70 text-sm">
                        Type to search in this channel
                    </div>
                )}
            </div>
        </div>
    );
}
