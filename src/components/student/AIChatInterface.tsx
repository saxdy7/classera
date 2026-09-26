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
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Classera AI Copilot</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                <span className="text-xs text-muted-foreground/70 font-medium">gpt-oss-120b · Online</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/40 font-semibold uppercase tracking-wider"
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
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-muted/40 border border-border rounded-full text-xs font-semibold text-foreground/80 hover:bg-accent-purple/10 hover:border-accent-purple hover:text-accent-purple transition-all active:scale-95"
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
            <div className="w-16 h-16 rounded-xl bg-accent-purple/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-accent-purple" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-1">Hey {userName} 👋</h3>
            <p className="text-muted-foreground text-sm mb-8">
              I'm your AI study companion. Ask me anything — concepts, code, problems, summaries.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.text)}
                  className="text-left px-4 py-3 rounded-lg border border-border hover:border-accent-purple hover:bg-accent-purple/10 transition-all text-sm text-foreground/80 group"
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
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-muted/40 border border-border text-foreground rounded-bl-sm'
                    }`}
                >
                  {msg.content === '' && msg.role === 'assistant' ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                <div key={idx} className="bg-card border border-accent-purple rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                  <div className="w-10 h-10 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple font-semibold">
                                    {p.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">{p.role} · {p.year}</p>
                                  </div>
                                  <button className="px-3 py-1.5 bg-primary text-white text-[10px] font-semibold uppercase tracking-widest rounded-lg hover:bg-primary transition-all active:scale-95">
                                    Connect
                                  </button>
                                </div>
                              ));
                            } catch(e) { return null; }
                          })()}
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.content.includes('[ROADMAP:') && (
                        <div className="mt-4 bg-neutral-900 rounded-xl p-5 border border-border overflow-hidden relative group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-card blur-3xl -mr-16 -mt-16" />
                          {(() => {
                            try {
                              const match = msg.content.match(/\[ROADMAP:\s*(.*?)\]/);
                              const data = JSON.parse(match![1]);
                              return (
                                <>
                                  <div className="flex items-center gap-2 mb-4">
                                    <Layers className="w-4 h-4 text-accent-purple" />
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-widest italic">{data.title}</h4>
                                  </div>
                                  <div className="space-y-4">
                                    {data.steps.map((s: any, idx: number) => (
                                      <div key={idx} className="flex gap-3 relative">
                                        {idx !== data.steps.length - 1 && <div className="absolute left-2 top-5 bottom-0 w-px bg-neutral-900" />}
                                        <div className="w-4 h-4 rounded-full bg-primary border-4 border-border z-10" />
                                        <div>
                                          <p className="text-xs font-semibold text-white leading-none mb-1">{s.title}</p>
                                          <p className="text-[10px] text-muted-foreground/70 font-medium">{s.desc}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Link href="/roadmaps" className="mt-6 flex items-center justify-between group/btn w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-all duration-300">
                                    <span className="text-[10px] font-semibold text-white uppercase tracking-widest">Go to Full Roadmap</span>
                                    <ArrowRight className="w-4 h-4 text-accent-purple group-hover/btn:translate-x-1 transition-transform" />
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
                <p className={`text-[10px] text-muted-foreground/70 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-border bg-card px-4 py-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground/70 mb-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={clearChat}
            title="New chat"
            className="p-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors text-muted-foreground flex-shrink-0 mb-0.5"
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
              className="w-full resize-none px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:border-foreground focus:ring-[3px] focus:ring-ring/50 transition-all text-foreground placeholder:text-muted-foreground disabled:opacity-50 bg-card leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '160px' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 text-center mt-2">AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
}
