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
        <div className="flex bg-[var(--cl-canvas-soft)] h-full overflow-hidden">
            {/* ── Sidebar: History ── */}
            <aside className="hidden lg:flex flex-col w-72 bg-[var(--cl-surface-card)] border-r border-[var(--cl-hairline)] relative z-20 overflow-hidden">
                <div className="p-4 border-b border-[var(--cl-hairline)] bg-[rgba(250,250,247,0.5)]">
                    <button onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] text-xs font-semibold uppercase tracking-widest hover:bg-[var(--cl-primary)] transition-all active:scale-95">
                        <Plus size={14} /> New Career Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-1.5 font-semibold uppercase tracking-tight text-[11px]">
                    <div className="px-3 py-2 text-[var(--cl-muted-soft)] font-semibold mb-1">Recent Sessions</div>
                    {sessions.length === 0 ? (
                        <div className="px-3 py-8 text-center text-[var(--cl-muted-soft)] font-medium italic">
                            No history yet. Start your first session!
                        </div>
                    ) : (
                        sessions.map(s => (
                            <div key={s.id}
                                onClick={() => loadSession(s)}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-[var(--cl-r-lg)] cursor-pointer transition-all border ${
                                    currentSessionId === s.id 
                                    ? 'bg-[var(--cl-primary-soft)] border-[var(--cl-primary)] text-[var(--cl-primary)]' 
                                    : 'border-transparent text-[var(--cl-body)] hover:bg-[var(--cl-canvas-soft)] hover:text-[var(--cl-ink)]'
                                }`}>
                                <MessageSquare size={14} className={currentSessionId === s.id ? 'text-[var(--cl-primary)]' : 'text-[var(--cl-muted-soft)]'} />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate lowercase text-xs first-letter:uppercase">{s.title}</p>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--cl-muted-soft)] hover:text-[var(--cl-error)] transition-all rounded-md">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-[var(--cl-hairline)] text-center">
                    <p className="text-[10px] text-[var(--cl-muted-soft)] font-semibold uppercase tracking-widest leading-normal">Your Personal<br/>AI Journey</p>
                </div>
            </aside>

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col h-full bg-[var(--cl-surface-card)] relative">
                {/* Top bar */}
                <header className="bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[var(--cl-hairline)] px-5 py-3.5 flex items-center gap-4 sticky top-0 z-10">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary)] flex items-center justify-center">
                            <Bot size={18} className="text-[var(--cl-on-dark)]" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-[var(--cl-ink)] uppercase tracking-tight truncate leading-none mb-1">
                                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : 'New Career Consultation'}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--cl-success)] animate-pulse" />
                                <span className="text-[10px] text-[var(--cl-muted-soft)] font-semibold uppercase">llama-3.3-70b · Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-8 bg-[rgba(250,250,247,0.3)]">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-[var(--cl-r-xl)] bg-[var(--cl-primary)] flex items-center justify-center mb-6 rotate-3">
                                    <Sparkles size={36} className="text-[var(--cl-on-dark)]" />
                                </div>
                                <h2 className="text-3xl font-semibold text-[var(--cl-ink)] mb-2 uppercase tracking-tight italic">AI Career Coach</h2>
                                <p className="text-[var(--cl-muted)] text-xs font-semibold uppercase tracking-widest max-w-sm mb-12 opacity-70">
                                    Let's build your professional future together — fast, smart, and effective.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button key={i} onClick={() => send(s)}
                                            className="group px-5 py-4 bg-[var(--cl-surface-card)] border border-slate-200 rounded-2xl text-[11px] font-semibold text-slate-700
                                            hover:border-indigo-400 hover:ring-4 hover:ring-indigo-500/5 hover:-translate-y-1 transition-all duration-300 shadow-sm flex items-center justify-between">
                                            <span className="leading-snug">{s}</span>
                                            <ArrowRight size={14} className="text-[var(--cl-muted-soft)] group-hover:text-[var(--cl-primary)] group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-12">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-9 h-9 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary)] flex items-center justify-center flex-shrink-0 mt-1">
                                                <Bot size={18} className="text-[var(--cl-on-dark)]" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] sm:max-w-[75%]`}>
                                            <div className={`px-5 py-4 rounded-[var(--cl-r-xl)] text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-br-none'
                                                : 'bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] text-[var(--cl-ink)] rounded-bl-none'
                                                }`}>
                                                {msg.content === '' && msg.role === 'assistant' ? (
                                                    <div className="flex gap-1 py-1 px-2">
                                                        {[0, 150, 300].map(d => (
                                                            <span key={d} className="w-2 h-2 bg-[var(--cl-surface-card)] rounded-full animate-bounce"
                                                                style={{ animationDelay: `${d}ms` }} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <MarkdownMessage content={msg.content} isUser={msg.role === 'user'} />
                                                )}
                                            </div>
                                            <p className={`text-[10px] text-[var(--cl-muted-soft)] mt-2 font-semibold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {msg.role === 'user' ? 'You' : 'Classera Coach'} · Just Now
                                            </p>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-9 h-9 rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-inverse)] flex items-center justify-center flex-shrink-0 mt-1 text-[var(--cl-on-dark)] text-xs font-semibold">
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
                <div className="sticky bottom-0 z-10 border-t border-[var(--cl-hairline)] bg-[var(--cl-canvas)] p-5">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-end gap-2 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] p-1.5 pl-4 transition-colors focus-within:border-[var(--cl-ink)] focus-within:ring-[3px] focus-within:ring-[rgba(10,10,10,0.12)]">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="Ask your expert coach anything..."
                                disabled={loading}
                                className="min-h-[40px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-0 py-2.5 text-[15px] font-normal leading-relaxed text-[var(--cl-ink)] shadow-none outline-none placeholder:text-[var(--cl-muted)] focus:border-0 focus:outline-none focus:ring-0"
                            />
                            <button onClick={() => send()} disabled={loading || !input.trim()}
                                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--cl-r-md)] bg-[var(--cl-primary)] text-[var(--cl-on-primary)] transition-colors hover:bg-[var(--cl-primary-active)] disabled:cursor-not-allowed disabled:bg-[var(--cl-surface-strong)] disabled:text-[var(--cl-muted)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)]">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
