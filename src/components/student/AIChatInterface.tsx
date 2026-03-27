'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Plus, RotateCcw, Bot, GraduationCap, MapIcon, User, Layers, ArrowRight } from 'lucide-react';
import { MarkdownMessage } from '@/components/shared/MarkdownMessage';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: '🚀', text: 'Find a Startup Team (Developer/Designer)', category: 'matching' },
  { icon: '🗺️', text: 'Build my dynamic Career Roadmap', category: 'roadmap' },
  { icon: '📊', text: 'How many mentors/students in Classera?', category: 'data' },
  { icon: '💡', text: 'Ask me anything about your studies', category: 'default' },
];

export function AIChatInterface({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
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
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, content: `Sorry, something went wrong: ${err.message}` } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Classera AI Copilot</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium">llama-3.3-70b · Online</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 font-bold uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* ── Quick Chips ── */}
        <div className="px-5 pb-3.5 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p.text)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all active:scale-95 shadow-sm"
            >
              <span>{p.icon}</span>
              {p.text.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {messages.length === 0 ? (
          /* Empty / Welcome state */
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Hey {userName} 👋</h3>
            <p className="text-slate-500 text-sm mb-8">
              I'm your AI study companion. Ask me anything — concepts, code, problems, summaries.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.text)}
                  className="text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-sm text-slate-700 group"
                >
                  <span className="mr-2">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                >
                  {msg.content === '' && msg.role === 'assistant' ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <>
                      <MarkdownMessage content={msg.content.replace(/\[(TALENT_MATCHING|ROADMAP):.*?\]/g, '')} isUser={msg.role === 'user'} />
                      
                      {/* Specialized Interactive Cards */}
                      {msg.role === 'assistant' && msg.content.includes('[TALENT_MATCHING:') && (
                        <div className="mt-4 space-y-3">
                          {(() => {
                            try {
                              const match = msg.content.match(/\[TALENT_MATCHING:\s*(.*?)\]/);
                              const data = JSON.parse(match![1]);
                              return data.profiles.map((p: any, idx: number) => (
                                <div key={idx} className="bg-white border border-violet-100 rounded-xl p-3 shadow-sm flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                  <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 font-bold">
                                    {p.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-black text-slate-900">{p.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{p.role} · {p.year}</p>
                                  </div>
                                  <button className="px-3 py-1.5 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-violet-700 transition-all active:scale-95">
                                    Connect
                                  </button>
                                </div>
                              ));
                            } catch(e) { return null; }
                          })()}
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.content.includes('[ROADMAP:') && (
                        <div className="mt-4 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl overflow-hidden relative group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-3xl -mr-16 -mt-16" />
                          {(() => {
                            try {
                              const match = msg.content.match(/\[ROADMAP:\s*(.*?)\]/);
                              const data = JSON.parse(match![1]);
                              return (
                                <>
                                  <div className="flex items-center gap-2 mb-4">
                                    <Layers className="w-4 h-4 text-violet-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest italic">{data.title}</h4>
                                  </div>
                                  <div className="space-y-4">
                                    {data.steps.map((s: any, idx: number) => (
                                      <div key={idx} className="flex gap-3 relative">
                                        {idx !== data.steps.length - 1 && <div className="absolute left-2 top-5 bottom-0 w-px bg-slate-700" />}
                                        <div className="w-4 h-4 rounded-full bg-violet-600 border-4 border-slate-900 z-10" />
                                        <div>
                                          <p className="text-xs font-black text-white leading-none mb-1">{s.title}</p>
                                          <p className="text-[10px] text-slate-400 font-medium">{s.desc}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Link href="/roadmaps" className="mt-6 flex items-center justify-between group/btn w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Go to Full Roadmap</span>
                                    <ArrowRight className="w-4 h-4 text-violet-400 group-hover/btn:translate-x-1 transition-transform" />
                                  </Link>
                                </>
                              );
                            } catch(e) { return null; }
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <p className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-slate-100 bg-white px-4 py-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400 mb-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={clearChat}
            title="New chat"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 flex-shrink-0 mb-0.5"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your studies..."
              disabled={loading}
              className="w-full resize-none px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50 bg-white leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '160px' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-300 text-center mt-2">AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
}
