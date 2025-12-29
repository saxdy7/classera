'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Plus, ImageIcon, Mic, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  userName: string;
}

export function AIChatInterface({ userName }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      // Ensure reply is a string
      let replyContent = '';
      if (typeof data.reply === 'string') {
        replyContent = data.reply;
      } else if (data.reply && typeof data.reply === 'object') {
        replyContent = JSON.stringify(data.reply);
      } else {
        replyContent = 'Sorry, I couldn\'t process that.';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    { emoji: '📚', title: 'Explain', desc: 'Complex topics' },
    { emoji: '🧮', title: 'Solve', desc: 'Math problems' },
    { emoji: '💡', title: 'Tips', desc: 'Study strategies' },
    { emoji: '✍️', title: 'Review', desc: 'My notes' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      {/* Left Sidebar - Chat History */}
      <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-4 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
        <div className="mb-4">
          <button 
            onClick={() => setMessages([])}
            className="w-full px-4 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Sparkles className="w-4 h-4" />
          Current Session
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No messages yet. Start chatting!
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-50 to-purple-50 border border-fuchsia-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900 truncate">Active Chat</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 truncate">{messages.length} messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-fuchsia-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Learning Assistant</h3>
              <p className="text-xs text-slate-500">Always here to help you learn</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome Message */
            <div className="flex gap-4 mb-6 animate-fade-in">
              <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 max-w-2xl">
                <div className="bg-gradient-to-r from-fuchsia-50 to-purple-50 rounded-2xl rounded-tl-none p-5 border border-fuchsia-100">
                  <p className="text-slate-900 font-medium mb-3">
                    👋 Hello {userName}! I&rsquo;m your AI learning companion.
                  </p>
                  <p className="text-slate-700 mb-4">
                    I can help you with studying, explaining concepts, solving problems, and much more. What would you like to learn today?
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(`Help me with ${prompt.desc.toLowerCase()}`)}
                        className="p-3 bg-white/80 rounded-xl text-left hover:bg-white hover:shadow-md transition-all border border-slate-100"
                      >
                        <div className="text-xs font-semibold text-fuchsia-600 mb-1">
                          {prompt.emoji} {prompt.title}
                        </div>
                        <div className="text-xs text-slate-600">{prompt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">Just now</p>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 mb-6 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 max-w-2xl ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-tr-none'
                          : 'bg-gradient-to-r from-fuchsia-50 to-purple-50 border border-fuchsia-100 rounded-tl-none'
                      }`}
                    >
                      <div className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-slate-900'}`}>
                        {msg.content}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 ml-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 max-w-2xl">
                    <div className="bg-gradient-to-r from-fuchsia-50 to-purple-50 rounded-2xl rounded-tl-none p-4 border border-fuchsia-100">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-purple-50/50">
          <div className="flex gap-2 mb-3">
            <button className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
              <ImageIcon className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
              <Mic className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              disabled={loading}
              className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-all text-slate-900 bg-white placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
