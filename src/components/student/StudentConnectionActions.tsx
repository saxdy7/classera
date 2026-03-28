'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, X, Clock, Video } from 'lucide-react';
import { LiveSessionPlayer } from './LiveSessionPlayer';

interface StudentConnectionActionsProps {
  studentId: string;
  currentUserId: string;
  connectionStatus?: string;
  isRequester?: boolean;
  studentName?: string;
}

export function StudentConnectionActions({
  studentId,
  currentUserId,
  connectionStatus,
  isRequester,
  studentName = 'Student',
}: StudentConnectionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<string | null | undefined>(connectionStatus);
  const [sessionActive, setSessionActive] = useState(false);
  const [meetUrl, setMeetUrl] = useState('');
  const [sessionId, setSessionId] = useState('');

  const sendRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/connection-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: studentId, type: 'student' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send request');
      }

      setStatus('pending');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/connection-requests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept request');
      }

      setStatus('accepted');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/connection-requests/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel request');
      }

      setStatus(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const startLiveSession = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStudentId: studentId,
          title: `Live Session with ${studentName}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create meeting');
      }

      const data = await res.json();
      setMeetUrl(data.meetUrl);
      setSessionId(data.sessionId);
      setSessionActive(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <button
        onClick={sendRequest}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        <UserPlus className="w-5 h-5" />
        {loading ? 'Sending...' : 'Connect Student'}
      </button>
    );
  }

  if (status === 'pending' && !isRequester) {
    return (
      <div className="space-y-3">
        <button
          onClick={acceptRequest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <UserCheck className="w-5 h-5" />
          {loading ? 'Accepting...' : 'Accept Request'}
        </button>
        <button
          onClick={cancelRequest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-300 text-black rounded-lg hover:bg-slate-400 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          {loading ? 'Declining...' : 'Decline'}
        </button>
      </div>
    );
  }

  if (status === 'pending' && isRequester) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg">
        <Clock className="w-5 h-5" />
        <span>Request Pending</span>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <>
        <button
          onClick={startLiveSession}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          <Video className="w-5 h-5" />
          {loading ? 'Starting...' : 'Start Live Session'}
        </button>
        {sessionActive && (
          <LiveSessionPlayer
            sessionId={sessionId}
            meetUrl={meetUrl}
            studentName={studentName}
            onClose={() => setSessionActive(false)}
          />
        )}
      </>
    );
  }

  return null;
}
