'use client';

import { useState } from 'react';
import { Settings, X, Download, Bell, Moon, Sun } from 'lucide-react';

interface PreferencesModalProps {
    communityId: string;
    onClose: () => void;
}

export function PreferencesModal({ communityId, onClose }: PreferencesModalProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async (format: 'json' | 'txt') => {
        setLoading(true);
        try {
            // Mock export function - in real app would fetch all messages
            const res = await fetch(`/api/community-messages/export?communityId=${communityId}&format=${format}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `chat-export.${format}`;
                a.click();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Chat Preferences
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Notifications */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Bell className="w-4 h-4" /> Notifications
                        </h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
                                <input type="radio" name="notif" defaultChecked />
                                All messages
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
                                <input type="radio" name="notif" />
                                Mentions only
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
                                <input type="radio" name="notif" />
                                Mute all
                            </label>
                        </div>
                    </div>

                    {/* Export */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Chat
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleExport('json')}
                                disabled={loading}
                                className="px-3 py-2 bg-accent-purple/10 text-accent-purple rounded-lg text-sm font-medium hover:bg-accent-purple/10 transition-colors"
                            >
                                Export as JSON
                            </button>
                            <button
                                onClick={() => handleExport('txt')}
                                disabled={loading}
                                className="px-3 py-2 bg-muted/40 text-foreground/80 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Export as TXT
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
