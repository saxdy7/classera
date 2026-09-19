'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Sparkles, Minimize2, Trash2, ArrowRight } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actionType?: 'navigation' | 'chat';
  actionUrl?: string;
}

type UserIntent = 'roadmap' | 'course' | 'guide' | 'career_coach' | 'none';

// Parse structured data like [ROADMAP: {...}], [COURSE: {...}], etc
function parseStructuredData(content: string): { type: string; data: any; rawText: string } | null {
  const roadmapMatch = content.match(/\[ROADMAP:\s*({[\s\S]*?})\]/);
  if (roadmapMatch) {
    try {
      return { type: 'roadmap', data: JSON.parse(roadmapMatch[1]), rawText: content };
    } catch (e) { console.error('Failed to parse roadmap:', e); }
  }

  const courseMatch = content.match(/\[COURSE:\s*({[\s\S]*?})\]/);
  if (courseMatch) {
    try {
      return { type: 'course', data: JSON.parse(courseMatch[1]), rawText: content };
    } catch (e) { console.error('Failed to parse course:', e); }
  }

  const guideMatch = content.match(/\[GUIDE:\s*({[\s\S]*?})\]/);
  if (guideMatch) {
    try {
      return { type: 'guide', data: JSON.parse(guideMatch[1]), rawText: content };
    } catch (e) { console.error('Failed to parse guide:', e); }
  }

  return null;
}

// Detect user intent from their message
function detectUserIntent(message: string): { intent: UserIntent; topic?: string } {
  const lowerMsg = message.toLowerCase();
  
  // Roadmap intent
  if (lowerMsg.includes('roadmap') || lowerMsg.includes('learning path') || lowerMsg.includes('skill path')) {
    const topic = message.split(/roadmap|learning path|skill path/i)[1]?.trim() || '';
    return { intent: 'roadmap', topic };
  }
  
  // Course intent
  if (lowerMsg.includes('course') || lowerMsg.includes('create course') || lowerMsg.includes('generate course')) {
    const topic = message.split(/course|create|generate/i)[1]?.trim() || '';
    return { intent: 'course', topic };
  }
  
  // Guide intent
  if (lowerMsg.includes('guide') || lowerMsg.includes('study guide') || lowerMsg.includes('studying how')) {
    const topic = message.split(/guide|studying/i)[1]?.trim() || '';
    return { intent: 'guide', topic };
  }
  
  // Career coach intent
  if (lowerMsg.includes('career') || lowerMsg.includes('job') || lowerMsg.includes('profession') || lowerMsg.includes('future')) {
    return { intent: 'career_coach' };
  }
  
  return { intent: 'none' };
}

export default function FloatingAIAssistant({ quizCompleted = true }: { quizCompleted?: boolean }) {
  if (!quizCompleted) return null;
  const router = useRouter();
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
      // Detect user intent
      const { intent, topic } = detectUserIntent(userMessage);
      
      // Handle direct navigation for creation intents
      if (intent !== 'none') {
        const intentMap: Record<UserIntent, { url: string; label: string }> = {
          roadmap: { url: '/roadmaps', label: 'Roadmap Creation' },
          course: { url: '/courses', label: 'Course Creation' },
          guide: { url: '/guides', label: 'Study Guide' },
          career_coach: { url: '/ai-tools/career-coach', label: 'Career Coach' },
          none: { url: '', label: '' }
        };
        
        const action = intentMap[intent];
        
        // Show action message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎯 Navigating to ${action.label}${topic ? ` for "${topic}"` : ''}...`,
          actionType: 'navigation',
          actionUrl: action.url
        }]);
        
        // Navigate after brief delay to show the message
        setTimeout(() => {
          router.push(action.url);
          setIsOpen(false);
        }, 800);
        
        setIsLoading(false);
        return;
      }

      // For general queries, use chat API
      setMessages(prev => [...prev, { role: 'assistant', content: '', actionType: 'chat' }]);

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
        window.dispatchEvent(new Event('tokens-updated'));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = 'Sorry, I encountered an error. Please try again.';
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
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center group transition-all duration-500 bg-[var(--cl-primary)] ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-[var(--cl-on-dark)] group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--cl-success)] rounded-full border-2 border-[var(--cl-on-dark)] animate-pulse"></span>
      </button>

      {/* Chat Container */}
      <div className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] flex flex-col border border-[var(--cl-hairline)] overflow-hidden transition-all duration-500 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-[var(--cl-primary)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[rgba(255,255,255,0.2)] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--cl-on-dark)]" />
            </div>
            <div>
              <h3 className="text-[var(--cl-on-dark)] font-semibold">AI Assistant</h3>
              <p className="text-[rgba(255,255,255,0.8)] text-xs flex items-center gap-1">
                Powered by Groq & Tavily
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="text-[rgba(255,255,255,0.8)] hover:text-[var(--cl-on-dark)] transition-colors p-1 hover:bg-[rgba(255,255,255,0.1)] rounded-lg"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[rgba(255,255,255,0.8)] hover:text-[var(--cl-on-dark)] transition-colors p-1 hover:bg-[rgba(255,255,255,0.1)] rounded-lg"
              aria-label="Close chat"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--cl-canvas-soft)]">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-[var(--cl-primary-soft)]">
                <Sparkles className="w-8 h-8 text-[var(--cl-primary)]" />
              </div>
              <h4 className="text-[var(--cl-ink)] font-semibold mb-1">How can I help you?</h4>
              <p className="text-[var(--cl-muted)] text-sm mb-4">I can search the web and answer questions about anything!</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-3 py-1 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-full text-[var(--cl-body)]">Find React courses</span>
                <span className="px-3 py-1 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-full text-[var(--cl-body)]">Latest AI news</span>
                <span className="px-3 py-1 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-full text-[var(--cl-body)]">Help with code</span>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const structured = msg.role === 'assistant' && msg.content ? parseStructuredData(msg.content) : null;
            
            return (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* User Message */}
              {msg.role === 'user' && (
                <div className="max-w-[85%] rounded-[var(--cl-r-xl)] px-4 py-3 text-[var(--cl-on-dark)] bg-[var(--cl-primary)]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                </div>
              )}

              {/* Assistant Message - Structured Data */}
              {msg.role === 'assistant' && structured && (
                <div className="max-w-[90%] w-full">
                  {structured.type === 'roadmap' && (
                    <div className="border-2 border-[var(--cl-primary)] rounded-[var(--cl-r-xl)] p-4 bg-[rgba(13,116,206,0.12)]">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">🗺️</span>
                        <div>
                          <h4 className="font-semibold text-[var(--cl-ink)] text-base">{structured.data.goal}</h4>
                          <p className="text-xs text-[var(--cl-body)] mt-1">{structured.data.description}</p>
                        </div>
                      </div>
                      
                      {/* Steps */}
                      <div className="space-y-2 mb-3 bg-[rgba(255,255,255,0.6)] rounded-lg p-3">
                        {structured.data.steps?.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] text-xs font-semibold rounded-full flex-shrink-0">{i + 1}</span>
                            <span className="text-sm text-[var(--cl-body)]">{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommended */}
                      <div className="space-y-2 mb-3 text-xs">
                        {structured.data.recommended_courses?.length > 0 && (
                          <div>
                            <p className="font-semibold text-[var(--cl-ink)]">📚 Courses:</p>
                            <div className="flex flex-wrap gap-1">
                              {structured.data.recommended_courses.map((course: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] rounded-full text-xs">{course}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {structured.data.recommended_mentor && (
                          <div>
                            <p className="font-semibold text-[var(--cl-ink)]">👨‍🏫 Mentor: <span className="text-[var(--cl-primary)]">{structured.data.recommended_mentor}</span></p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => router.push('/roadmaps')}
                        className="w-full mt-3 px-3 py-2 text-[var(--cl-on-dark)] rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-[var(--cl-primary)]"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Create Roadmap
                      </button>
                    </div>
                  )}

                  {structured.type === 'course' && (
                    <div className="border-2 border-[var(--cl-success)] rounded-[var(--cl-r-xl)] p-4 bg-[rgba(22,163,74,0.12)]">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">📖</span>
                        <div>
                          <h4 className="font-semibold text-[var(--cl-ink)] text-base">{structured.data.title}</h4>
                          <p className="text-xs text-[var(--cl-body)] mt-1">{structured.data.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3 text-xs">
                        <p className="font-semibold text-[var(--cl-ink)]">📝 Modules: <span className="text-[var(--cl-success)]">{structured.data.modules?.length || 0}</span></p>
                        <p className="font-semibold text-[var(--cl-ink)]">⏱️ Duration: <span className="text-[var(--cl-success)]">{structured.data.duration_hours}h</span></p>
                        <p className="font-semibold text-[var(--cl-ink)]">📊 Level: <span className="text-[var(--cl-success)] capitalize">{structured.data.difficulty}</span></p>
                      </div>

                      <button
                        onClick={() => router.push('/courses')}
                        className="w-full mt-3 px-3 py-2 text-[var(--cl-on-dark)] rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-[var(--cl-success)]"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Create Course
                      </button>
                    </div>
                  )}

                  {structured.type === 'guide' && (
                    <div className="border-2 border-[var(--cl-primary)] rounded-[var(--cl-r-xl)] p-4 bg-[var(--cl-primary-soft)]">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">📚</span>
                        <div>
                          <h4 className="font-semibold text-[var(--cl-ink)] text-base">{structured.data.title}</h4>
                        </div>
                      </div>
                      
                      {structured.data.topics?.length > 0 && (
                        <div className="mb-3">
                          <p className="font-semibold text-[var(--cl-ink)] text-xs mb-1">Topics:</p>
                          <div className="flex flex-wrap gap-1">
                            {structured.data.topics.map((topic: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full text-xs">{topic}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => router.push('/guides')}
                        className="w-full mt-3 px-3 py-2 text-[var(--cl-on-dark)] rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-[var(--cl-primary)]"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Create Guide
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Assistant Message - Regular Chat */}
              {msg.role === 'assistant' && !structured && msg.actionType === 'navigation' && msg.actionUrl && (
                <div className="max-w-[85%] rounded-[var(--cl-r-xl)] px-4 py-3 border border-[var(--cl-success)] bg-[rgba(22,163,74,0.12)]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--cl-ink)]">{msg.content}</div>
                  <button
                    onClick={() => {
                      router.push(msg.actionUrl!);
                      setIsOpen(false);
                    }}
                    className="mt-3 flex items-center gap-2 px-3 py-2 text-[var(--cl-on-dark)] rounded-lg font-medium text-xs transition-all bg-[var(--cl-primary)]"
                  >
                    <span>Open Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Assistant Message - Regular Reply */}
              {msg.role === 'assistant' && !structured && !msg.actionUrl && (
                <div className="max-w-[85%] rounded-[var(--cl-r-xl)] px-4 py-3 bg-[var(--cl-surface-card)] text-[var(--cl-ink)] border border-[var(--cl-hairline)]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                </div>
              )}
            </div>
            );
          })}

          {isLoading && !messages[messages.length - 1]?.content && (
            <div className="flex justify-start">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] px-4 py-3 border border-[var(--cl-hairline)]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[var(--cl-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-[var(--cl-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-[var(--cl-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-[var(--cl-muted-soft)] font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[var(--cl-surface-card)] border-t border-[var(--cl-hairline)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[var(--cl-surface-strong)] border border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-md)] focus:outline-none focus:border-[var(--cl-ink)] focus:ring-[3px] focus:ring-[rgba(10,10,10,0.12)] text-sm disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-[var(--cl-primary)]"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-[var(--cl-muted-soft)]">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}