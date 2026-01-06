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
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm border border-red-100">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Attachment Preview */}
            {attachment && (
                <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-xl w-fit border border-indigo-100">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <div className="text-sm font-medium text-indigo-900 max-w-[200px] truncate">
                        {attachment.name}
                    </div>
                    <span className="text-xs text-indigo-600">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                        onClick={() => setAttachment(null)}
                        className="text-indigo-500 hover:text-red-500 transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl flex items-center p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    <button 
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors flex-shrink-0"
                        title="Add emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0"
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
                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none max-h-32 min-h-[44px] py-3 px-2 text-[15px] text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
                        rows={1}
                        style={{ height: '44px' }}
                        disabled={isSending}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!content.trim() && !attachment) || isSending}
                    className={`p-3.5 rounded-full shadow-lg transition-all flex-shrink-0 min-w-[52px] min-h-[52px] flex items-center justify-center ${(content.trim() || attachment) && !isSending
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:scale-105'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
