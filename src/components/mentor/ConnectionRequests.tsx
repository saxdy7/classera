'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ConnectionRequest {
  id: string;
  student_id: string;
  mentor_id: string;
  status: string;
  created_at: string;
  student: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    degree_type: string | null;
    specialization_board: string | null;
    universities: {
      name: string;
    } | null;
  };
}

interface ConnectionRequestsProps {
  requests: ConnectionRequest[];
}

export function ConnectionRequests({ requests }: ConnectionRequestsProps) {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState(requests);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    setLoading(requestId);
    
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        alert(`Connection request ${status}!`);
        router.refresh();
      } else {
        alert(result.error || `Failed to ${status} request`);
      }
    } catch (error) {
      console.error(`Error ${status} connection request:`, error);
      alert(`Failed to ${status} request`);
    } finally {
      setLoading(null);
    }
  };

  if (!pendingRequests || pendingRequests.length === 0) {
    return (
      <div className="bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] p-8 text-center">
        <div className="w-12 h-12 bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[var(--cl-muted-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--cl-body)]">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="rounded-[var(--cl-r-xl)] p-4 border border-[var(--cl-warning)] bg-[rgba(171,100,0,0.12)]"
        >
          <div className="flex items-center gap-3 mb-3">
            {request.student.avatar_url ? (
              <Image
                src={request.student.avatar_url}
                alt={request.student.full_name}
                className="w-12 h-12 rounded-[var(--cl-r-lg)] object-cover"
                width={48}
                height={48}
              />
            ) : (
              <div className="w-12 h-12 rounded-[var(--cl-r-lg)] flex items-center justify-center text-[var(--cl-on-dark)] text-lg font-semibold bg-[var(--cl-primary)]">
                {request.student.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--cl-ink)] truncate text-sm">
                {request.student.full_name}
              </h3>
              <p className="text-xs text-[var(--cl-muted)] truncate">
                {request.student.specialization_board || 'Student'}
              </p>
              <p className="text-xs text-[var(--cl-warning)] font-semibold mt-1">
                Wants to connect
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAction(request.id, 'accepted')}
              disabled={loading === request.id}
              className="flex-1 px-4 py-2 bg-[var(--cl-success)] hover:bg-[var(--cl-success)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium transition-colors text-sm disabled:opacity-50"
            >
              {loading === request.id ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={() => handleAction(request.id, 'rejected')}
              disabled={loading === request.id}
              className="flex-1 px-4 py-2 bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] font-medium transition-colors text-sm disabled:opacity-50"
            >
              {loading === request.id ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
