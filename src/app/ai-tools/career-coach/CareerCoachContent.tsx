'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Sparkles, RotateCcw, History, Trash2, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MarkdownMessage } from '@/components/shared/MarkdownMessage';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}
interface SessionHistory { id: string; title: string; created_at: string; data: { messages: Message[] }; }

const SUGGESTIONS = [
    'What skills do I need to become a Full Stack Developer?',
    'How do I transition from CS student to Data Scientist?',
    "What's the best path to get into AI/ML engineering?",
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

export default function CareerCoachContent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [sessions, setSessions] = useState<SessionHistory[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => { fetchSessions(); }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/history?type=career_coach');
            if (res.ok) setSessions(await res.json());
        } catch { /* silent */ }
    };

    const saveSession = async (msgs: Message[]) => {
        if (msgs.length < 2) return;
        const firstUser = msgs.find(m => m.role === 'user');
        const title = firstUser ? firstUser.content.slice(0, 80) : 'Career Session';
        try {
            const res = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: currentSessionId, 
                    type: 'career_coach', 
                    title, 
                    data: { messages: msgs } 
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (!currentSessionId) setCurrentSessionId(data.id);
            }
            fetchSessions();
        } catch { /* silent */ }
    };

    const deleteSession = async (id: string) => {
        if (id === currentSessionId) setCurrentSessionId(null);
        setSessions(prev => prev.filter(s => s.id !== id));
        await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    };

    const handleNewChat = () => {
        if (messages.length > 0) saveSession(messages);
        setMessages([]);
        setCurrentSessionId(null);
    };

    const loadSession = (session: SessionHistory) => {
        setMessages(session.data.messages);
        setCurrentSessionId(session.id);
    };

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

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: errorData.error || `Error: ${res.status} ${res.statusText}` } : m));
                setLoading(false);
                return;
            }

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
                
                // Save session after completion
                setMessages(prev => {
                    saveSession(prev);
                    return prev;
                });

                window.dispatchEvent(new Event('tokens-updated'));
            }
        } catch {
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Sorry, something went wrong. Please try again.' } : m));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-slate-50 h-full overflow-hidden">
            {/* ── Sidebar: History ── */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 shadow-sm relative z-20 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <button onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
                        <Plus size={14} /> New Career Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-1.5 font-bold uppercase tracking-tight text-[11px]">
                    <div className="px-3 py-2 text-slate-400 font-black mb-1">Recent Sessions</div>
                    {sessions.length === 0 ? (
                        <div className="px-3 py-8 text-center text-slate-400 font-medium italic">
                            No history yet. Start your first session!
                        </div>
                    ) : (
                        sessions.map(s => (
                            <div key={s.id}
                                onClick={() => loadSession(s)}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                                    currentSessionId === s.id 
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:shadow-md'
                                }`}>
                                <MessageSquare size={14} className={currentSessionId === s.id ? 'text-indigo-500' : 'text-slate-400'} />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate lowercase text-xs first-letter:uppercase">{s.title}</p>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded-md">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-normal">Your Personal<br/>AI Journey</p>
                </div>
            </aside>

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Top bar */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-3.5 flex items-center gap-4 sticky top-0 z-10">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1">
                                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : 'New Career Consultation'}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">llama-3.3-70b · Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-8 bg-slate-50/30">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6 rotate-3">
                                    <Sparkles size={36} className="text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">AI Career Coach</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mb-12 opacity-70">
                                    Let's build your professional future together — fast, smart, and effective.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button key={i} onClick={() => send(s)}
                                            className="group px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700
                                            hover:border-indigo-400 hover:ring-4 hover:ring-indigo-500/5 hover:-translate-y-1 transition-all duration-300 shadow-sm flex items-center justify-between">
                                            <span className="leading-snug">{s}</span>
                                            <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-12">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
                                                <Bot size={18} className="text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] sm:max-w-[75%]`}>
                                            <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/10'
                                                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                                                }`}>
                                                {msg.content === '' && msg.role === 'assistant' ? (
                                                    <div className="flex gap-1 py-1 px-2">
                                                        {[0, 150, 300].map(d => (
                                                            <span key={d} className="w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce"
                                                                style={{ animationDelay: `${d}ms` }} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <MarkdownMessage content={msg.content} isUser={msg.role === 'user'} />
                                                )}
                                            </div>
                                            <p className={`text-[10px] text-slate-300 mt-2 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {msg.role === 'user' ? 'You' : 'Classera Coach'} · Just Now
                                            </p>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 mt-1 text-white text-xs font-black shadow-lg shadow-slate-900/10">
                                                U
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={bottomRef} className="h-4" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white/80 backdrop-blur-md border-t border-slate-100 p-5 sticky bottom-0 z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-[2rem] p-2 pr-3 pl-5 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-300 shadow-sm">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="Ask your expert coach anything..."
                                disabled={loading}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 placeholder:text-slate-400 py-3 resize-none scroll-smooth min-h-[44px] max-h-[200px]"
                            />
                            <button onClick={() => send()} disabled={loading || !input.trim()}
                                className="mb-1 p-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300 disabled:opacity-40 flex-shrink-0 shadow-lg shadow-indigo-500/20 active:scale-90">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
