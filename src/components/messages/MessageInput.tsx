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
                <div className="flex items-center gap-2 bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] px-3 py-2 rounded-lg text-sm border border-[var(--cl-error)]">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-[var(--cl-error)] hover:text-[var(--cl-error)]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Attachment Preview */}
            {attachment && (
                <div className="flex items-center gap-2 bg-[var(--cl-primary-soft)] p-3 rounded-[var(--cl-r-lg)] w-fit border border-[var(--cl-primary)]">
                    <Paperclip className="w-4 h-4 text-[var(--cl-primary)]" />
                    <div className="text-sm font-medium text-[var(--cl-primary)] max-w-[200px] truncate">
                        {attachment.name}
                    </div>
                    <span className="text-xs text-[var(--cl-primary)]">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                        onClick={() => setAttachment(null)}
                        className="text-[var(--cl-primary)] hover:text-[var(--cl-error)] transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="flex flex-1 items-end gap-1 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] p-1.5 transition-colors focus-within:border-[var(--cl-ink)] focus-within:ring-[3px] focus-within:ring-[rgba(10,10,10,0.12)]">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    <button 
                        className="p-2 text-[var(--cl-muted)] hover:text-[var(--cl-ink)] hover:bg-[var(--cl-surface-strong)] rounded-full transition-colors flex-shrink-0"
                        title="Add emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[var(--cl-muted)] hover:text-[var(--cl-ink)] hover:bg-[var(--cl-surface-strong)] rounded-full transition-colors flex-shrink-0"
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
                        className="min-h-[40px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] leading-relaxed text-[var(--cl-ink)] shadow-none outline-none placeholder:text-[var(--cl-muted)] focus:border-0 focus:outline-none focus:ring-0"
                        rows={1}
                        style={{ height: '40px' }}
                        disabled={isSending}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!content.trim() && !attachment) || isSending}
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--cl-r-md)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)] ${(content.trim() || attachment) && !isSending
                            ? 'bg-[var(--cl-primary)] text-[var(--cl-on-primary)] hover:bg-[var(--cl-primary-active)]'
                            : 'cursor-not-allowed bg-[var(--cl-surface-strong)] text-[var(--cl-muted)]'
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
