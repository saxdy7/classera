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
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center group transition-all duration-500 bg-primary ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {/* Chat Container */}
      <div className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-card rounded-xl flex flex-col border border-border overflow-hidden transition-all duration-500 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-primary">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[rgba(255,255,255,0.2)] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
              <p className="text-[rgba(255,255,255,0.8)] text-xs flex items-center gap-1">
                Powered by Groq & Tavily
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="text-[rgba(255,255,255,0.8)] hover:text-white transition-colors p-1 hover:bg-[rgba(255,255,255,0.1)] rounded-lg"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[rgba(255,255,255,0.8)] hover:text-white transition-colors p-1 hover:bg-[rgba(255,255,255,0.1)] rounded-lg"
              aria-label="Close chat"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/40">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-accent-purple/10">
                <Sparkles className="w-8 h-8 text-accent-purple" />
              </div>
              <h4 className="text-foreground font-semibold mb-1">How can I help you?</h4>
              <p className="text-muted-foreground text-sm mb-4">I can search the web and answer questions about anything!</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-3 py-1 bg-card border border-border rounded-full text-foreground/80">Find React courses</span>
                <span className="px-3 py-1 bg-card border border-border rounded-full text-foreground/80">Latest AI news</span>
                <span className="px-3 py-1 bg-card border border-border rounded-full text-foreground/80">Help with code</span>
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
                <div className="max-w-[85%] rounded-xl px-4 py-3 text-white bg-primary">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                </div>
              )}

              {/* Assistant Message - Structured Data */}
              {msg.role === 'assistant' && structured && (
                <div className="max-w-[90%] w-full">
                  {structured.type === 'roadmap' && (
                    <div className="border-2 border-accent-purple rounded-xl p-4 bg-accent-purple/10">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">🗺️</span>
                        <div>
                          <h4 className="font-semibold text-foreground text-base">{structured.data.goal}</h4>
                          <p className="text-xs text-foreground/80 mt-1">{structured.data.description}</p>
                        </div>
                      </div>
                      
                      {/* Steps */}
                      <div className="space-y-2 mb-3 bg-[rgba(255,255,255,0.6)] rounded-lg p-3">
                        {structured.data.steps?.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white text-xs font-semibold rounded-full flex-shrink-0">{i + 1}</span>
                            <span className="text-sm text-foreground/80">{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommended */}
                      <div className="space-y-2 mb-3 text-xs">
                        {structured.data.recommended_courses?.length > 0 && (
                          <div>
                            <p className="font-semibold text-foreground">📚 Courses:</p>
                            <div className="flex flex-wrap gap-1">
                              {structured.data.recommended_courses.map((course: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs">{course}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {structured.data.recommended_mentor && (
                          <div>
                            <p className="font-semibold text-foreground">👨‍🏫 Mentor: <span className="text-accent-purple">{structured.data.recommended_mentor}</span></p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => router.push('/roadmaps')}
                        className="w-full mt-3 px-3 py-2 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-primary"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Create Roadmap
                      </button>
                    </div>
                  )}

                  {structured.type === 'course' && (
                    <div className="border-2 border-green-600 rounded-xl p-4 bg-green-500/10">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">📖</span>
                        <div>
                          <h4 className="font-semibold text-foreground text-base">{structured.data.title}</h4>
                          <p className="text-xs text-foreground/80 mt-1">{structured.data.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3 text-xs">
                        <p className="font-semibold text-foreground">📝 Modules: <span className="text-green-600">{structured.data.modules?.length || 0}</span></p>
                        <p className="font-semibold text-foreground">⏱️ Duration: <span className="text-green-600">{structured.data.duration_hours}h</span></p>
                        <p className="font-semibold text-foreground">📊 Level: <span className="text-green-600 capitalize">{structured.data.difficulty}</span></p>
                      </div>

                      <button
                        onClick={() => router.push('/courses')}
                        className="w-full mt-3 px-3 py-2 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-green-600"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Create Course
                      </button>
                    </div>
                  )}

                  {structured.type === 'guide' && (
                    <div className="border-2 border-accent-purple rounded-xl p-4 bg-accent-purple/10">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">📚</span>
                        <div>
                          <h4 className="font-semibold text-foreground text-base">{structured.data.title}</h4>
                        </div>
                      </div>
                      
                      {structured.data.topics?.length > 0 && (
                        <div className="mb-3">
                          <p className="font-semibold text-foreground text-xs mb-1">Topics:</p>
                          <div className="flex flex-wrap gap-1">
                            {structured.data.topics.map((topic: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs">{topic}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => router.push('/guides')}
                        className="w-full mt-3 px-3 py-2 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-primary"
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
                <div className="max-w-[85%] rounded-xl px-4 py-3 border border-green-600 bg-green-500/10">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{msg.content}</div>
                  <button
                    onClick={() => {
                      router.push(msg.actionUrl!);
                      setIsOpen(false);
                    }}
                    className="mt-3 flex items-center gap-2 px-3 py-2 text-white rounded-lg font-medium text-xs transition-all bg-primary"
                  >
                    <span>Open Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Assistant Message - Regular Reply */}
              {msg.role === 'assistant' && !structured && !msg.actionUrl && (
                <div className="max-w-[85%] rounded-xl px-4 py-3 bg-card text-foreground border border-border">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                </div>
              )}
            </div>
            );
          })}

          {isLoading && !messages[messages.length - 1]?.content && (
            <div className="flex justify-start">
              <div className="bg-card rounded-xl px-4 py-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground/70 font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:border-foreground focus:ring-[3px] focus:ring-ring/50 text-sm disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 text-white rounded-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-primary"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-muted-foreground/70">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}