'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, History as HistoryIcon, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MarkdownMessage } from '@/components/shared/MarkdownMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text?: string) => {
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
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content }
          ].slice(-8)
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch');

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
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Error connecting to AI.' } : m));
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-5 py-4 bg-indigo-600 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Bot size={18} />
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">How can I help you?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask me about mentors, students count, university data, or finding a teammate!
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                      <Bot size={12} />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {m.role === 'assistant' && !m.content ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <MarkdownMessage content={m.content} isUser={m.role === 'user'} />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-1.5 border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Message AI..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-medium text-slate-800 placeholder:text-slate-400 py-1.5"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group relative
          ${isOpen ? 'bg-slate-900 border-2 border-white rotate-90' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none'}
        `}
      >
        {isOpen ? (
          <X className="text-white" />
        ) : (
          <>
            <Bot size={28} className="transition-transform group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[10px] font-black text-white">1</span>
            </div>
            <div className="absolute -inset-1 bg-indigo-400/20 rounded-full animate-ping pointer-events-none" />
          </>
        )}
      </button>
    </div>
  );
}
