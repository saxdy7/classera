'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  receiver?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface ChatInterfaceProps {
  currentUserId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  onBack: () => void;
}

export function ChatInterface({ currentUserId, otherUser, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?otherUserId=${otherUser.id}`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
        
        // Mark unread messages as read
        const unreadMessageIds = data.messages
          .filter((msg: Message) => msg.receiver_id === currentUserId && !msg.read)
          .map((msg: Message) => msg.id);

        if (unreadMessageIds.length > 0) {
          await fetch('/api/messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: unreadMessageIds }),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    let isMounted = true;
    
    const loadMessages = async () => {
      if (isMounted) {
        await fetchMessages();
      }
    };

    loadMessages();

    // Subscribe to new messages - both incoming and outgoing
    const channel = supabase
      .channel(`messages:${currentUserId}:${otherUser.id}`, {
        config: { broadcast: { self: false } } // Don't echo back own messages
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (!isMounted) return;
          
          const newMsg = payload.new as any;
          
          // Check if this message is relevant to this conversation
          const isRelevant = 
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === otherUser.id) ||
            (newMsg.sender_id === otherUser.id && newMsg.receiver_id === currentUserId);
          
          if (isRelevant) {
            // Debounce: only fetch if not already loading
            if (!loading) {
              fetchMessages();
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [otherUser.id, currentUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    const messageContent = newMessage.trim();
    setLoading(true);
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUser.id,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Immediately add the new message to UI
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
      } else {
        // If failed, restore the message text
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message text on error
      setNewMessage(messageContent);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white">
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          {getInitials(otherUser.full_name)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{otherUser.full_name}</h3>
          <p className="text-sm text-slate-500 capitalize">{otherUser.role}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <Send className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-500">
              Start a conversation with {otherUser.full_name}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
