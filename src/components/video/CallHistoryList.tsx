'use client';

import React, { useEffect, useState } from 'react';
import { Phone, Video, Clock, Calendar, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface CallHistory {
  id: string;
  caller_id: string;
  receiver_id: string | null;
  room_url: string;
  call_type: 'direct' | 'group' | 'test_monitoring';
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  caller: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  test: {
    id: string;
    title: string;
  } | null;
}

export default function CallHistoryList() {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/video/call-history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch call history');
      }

      const data = await response.json();
      setCalls(data.calls || []);
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'direct':
        return 'Direct Call';
      case 'group':
        return 'Group Call';
      case 'test_monitoring':
        return 'Test Monitoring';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No call history yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Your video calls will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <Card key={call.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {call.receiver ? (
                <Avatar className="w-12 h-12">
                  {call.receiver.avatar_url ? (
                    <img
                      src={call.receiver.avatar_url}
                      alt={call.receiver.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {call.receiver.full_name.charAt(0)}
                    </div>
                  )}
                </Avatar>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>

            {/* Call Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {call.test
                    ? call.test.title
                    : call.receiver
                    ? call.receiver.full_name
                    : 'Group Call'}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    call.ended_at
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {call.ended_at ? 'Ended' : 'In Progress'}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Video className="w-4 h-4" />
                  <span>{getCallTypeLabel(call.call_type)}</span>
                </div>

                {call.duration_seconds && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(call.duration_seconds)}</span>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDistanceToNow(new Date(call.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {call.test && (
                <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                  Test Monitoring Session
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
