'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Minimize2, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Create a new assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }]
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          accumulatedText += text;

          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = accumulatedText;
            return newMessages;
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = 'Sorry, I encountered an error. Please check your internet connection and try again.';
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group transition-all duration-500 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {/* Chat Container */}
      <div className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden transition-all duration-500 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-500 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
              <p className="text-white/80 text-xs flex items-center gap-1">
                Powered by Groq & Tavily
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              aria-label="Close chat"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-fuchsia-500" />
              </div>
              <h4 className="text-slate-900 font-semibold mb-1">How can I help you?</h4>
              <p className="text-slate-500 text-sm mb-4">I can search the web and answer questions about anything!</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600">Find React courses</span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600">Latest AI news</span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600">Help with code</span>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                  }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}

          {isLoading && !messages[messages.length - 1]?.content && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent text-sm disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}