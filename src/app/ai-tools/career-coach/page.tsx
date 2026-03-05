'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Sparkles, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { MarkdownMessage } from '@/components/shared/MarkdownMessage';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTIONS = [
    'What skills do I need to become a Full Stack Developer?',
    'How do I transition from CS student to Data Scientist?',
    'What\'s the best path to get into AI/ML engineering?',
    'How do I prepare for FAANG interviews?',
    'What certifications are valuable for cloud engineering?',
    'How do I build a strong portfolio as a backend developer?',
];

const SYSTEM_PROMPT = `You are an expert AI Career Coach specialized for university students and early professionals. You provide:
- Concrete, actionable career advice tailored to their background
- Step-by-step skill development plans
- Resume and interview tips
- Industry insights and job market trends
- Realistic timelines and milestones

Be encouraging, specific, and practical. Format responses with clear sections using markdown. Keep answers focused and actionable (not generic). Always ask follow-up questions to personalize advice further.`;

export default function CareerCoachPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    const send = async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
        const aiId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, userMsg, { id: aiId, role: 'assistant', content: '' }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content }
                    ]
                }),
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (reader) {
                let accumulated = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    accumulated += decoder.decode(value, { stream: true });
                    setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: accumulated } : m));
                }
            }
        } catch {
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Sorry, something went wrong. Please try again.' } : m));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top bar */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard/student" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={18} className="text-slate-600" />
                </Link>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-900">AI Career Coach</h1>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-400">Powered by Groq · Llama 3</span>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button onClick={() => setMessages([])}
                        className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <RotateCcw size={13} /> New chat
                    </button>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
                {messages.length === 0 ? (
                    <div className="text-center pt-8 pb-12">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Career Coach</h2>
                        <p className="text-slate-500 text-sm mb-10 max-w-md mx-auto">
                            Get personalized career guidance, skill roadmaps, interview tips, and industry insights — all powered by AI.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} onClick={() => send(s)}
                                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700
                    hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all text-left leading-snug">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <Bot size={15} className="text-white" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                                        }`}>
                                        {msg.content === '' && msg.role === 'assistant' ? (
                                            <div className="flex gap-1 py-1">
                                                {[0, 150, 300].map(d => (
                                                    <span key={d} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                                                        style={{ animationDelay: `${d}ms` }} />
                                                ))}
                                            </div>
                                        ) : (
                                            <MarkdownMessage content={msg.content} isUser={msg.role === 'user'} />
                                        )}
                                    </div>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <User size={15} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        placeholder="Ask about career paths, skills, salary, interviews..."
                        disabled={loading}
                        className="flex-1 resize-none px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                        style={{ minHeight: 44, maxHeight: 120 }}
                    />
                    <button onClick={() => send()} disabled={loading || !input.trim()}
                        className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 flex-shrink-0 shadow-sm">
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-300 mt-2 max-w-3xl mx-auto">AI may make mistakes. Verify with career professionals for important decisions.</p>
            </div>
        </div>
    );
}
