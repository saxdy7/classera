'use client';

import { useState, useRef } from 'react';
import { useMessages } from './MessagesProvider';
import { Send, Paperclip, Smile, X, Loader2 } from 'lucide-react';

interface MessageInputProps {
    onTyping?: () => void;
}

export function MessageInput({ onTyping }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const { sendMessage } = useMessages();
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = async () => {
        // Guard against duplicate sends
        if ((!content.trim() && !attachment) || isSending) return;

        setIsSending(true);
        setError(null);
        
        try {
            await sendMessage(content, 'text', attachment || undefined);
            setContent('');
            setAttachment(null);
            
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = '44px';
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setAttachment(file);
            setError(null);
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        
        // Call typing indicator
        if (onTyping) {
            onTyping();
        }
        
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
    };

    return (
        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm border border-destructive">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Attachment Preview */}
            {attachment && (
                <div className="flex items-center gap-2 bg-accent-purple/10 p-3 rounded-lg w-fit border border-accent-purple">
                    <Paperclip className="w-4 h-4 text-accent-purple" />
                    <div className="text-sm font-medium text-accent-purple max-w-[200px] truncate">
                        {attachment.name}
                    </div>
                    <span className="text-xs text-accent-purple">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                        onClick={() => setAttachment(null)}
                        className="text-accent-purple hover:text-destructive transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="flex flex-1 items-end gap-1 rounded-lg border border-border bg-card p-1.5 transition-colors focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-ring/50">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    <button 
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                        title="Add emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                        title="Attach file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                        className="min-h-[40px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] leading-relaxed text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:border-0 focus:outline-none focus:ring-0"
                        rows={1}
                        style={{ height: '40px' }}
                        disabled={isSending}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!content.trim() && !attachment) || isSending}
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${(content.trim() || attachment) && !isSending
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'cursor-not-allowed bg-muted text-muted-foreground'
                        }`}
                    title={isSending ? 'Sending...' : 'Send message'}
                >
                    {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
