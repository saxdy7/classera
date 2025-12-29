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
      <div className="bg-slate-50 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-200"
        >
          <div className="flex items-center gap-3 mb-3">
            {request.student.avatar_url ? (
              <Image
                src={request.student.avatar_url}
                alt={request.student.full_name}
                className="w-12 h-12 rounded-xl object-cover"
                width={48}
                height={48}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                {request.student.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate text-sm">
                {request.student.full_name}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {request.student.specialization_board || 'Student'}
              </p>
              <p className="text-xs text-orange-600 font-semibold mt-1">
                Wants to connect
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAction(request.id, 'accepted')}
              disabled={loading === request.id}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
            >
              {loading === request.id ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={() => handleAction(request.id, 'rejected')}
              disabled={loading === request.id}
              className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
            >
              {loading === request.id ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
