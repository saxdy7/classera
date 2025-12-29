'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MentorActionsProps {
  mentorId: string;
  mentorEmail: string;
}

export function MentorActions({ mentorId, mentorEmail }: MentorActionsProps) {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check connection status on mount and poll for updates
  useEffect(() => {
    checkConnectionStatus();
    
    // Poll every 3 seconds for status updates when request is pending
    const interval = setInterval(() => {
      if (connectionStatus === 'pending') {
        checkConnectionStatus();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [mentorId, connectionStatus]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/connection-requests?mentorId=${mentorId}`);
      const result = await response.json();
      
      if (result.data) {
        setConnectionStatus(result.data.status);
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      });

      const result = await response.json();

      if (response.ok) {
        setConnectionStatus('pending');
        alert('Connection request sent successfully!');
      } else {
        alert(result.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    router.push(`/dashboard/student/messages?userId=${mentorId}`);
  };

  const handleSchedule = () => {
    router.push('/dashboard/student/schedule');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${mentorEmail}`;
  };

  if (checking) {
    return (
      <div className="flex gap-3">
        <div className="flex-1 px-6 py-3 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="px-6 py-3 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Connect or Send Message Button */}
      {connectionStatus === 'accepted' ? (
        <button
          onClick={handleMessage}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          Send Message
        </button>
      ) : connectionStatus === 'pending' ? (
        <button
          disabled
          className="flex-1 px-6 py-3 bg-slate-300 text-slate-600 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          Request Pending
        </button>
      ) : connectionStatus === 'rejected' ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <MessageSquare className="w-5 h-5" />
          {loading ? 'Sending...' : 'Request Again'}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <MessageSquare className="w-5 h-5" />
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      )}

      {/* Schedule Session Button */}
      {connectionStatus === 'accepted' ? (
        <button
          onClick={handleSchedule}
          className="px-6 py-3 border-2 border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 text-black"
        >
          <Calendar className="w-5 h-5" />
          Schedule Session
        </button>
      ) : (
        <button
          onClick={handleEmail}
          className="px-6 py-3 border-2 border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 text-black"
        >
          <Mail className="w-5 h-5" />
          Email
        </button>
      )}
    </div>
  );
}
