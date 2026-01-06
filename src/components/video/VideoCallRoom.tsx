'use client';

import React, { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall, DailyEvent } from '@daily-co/daily-js';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface VideoCallRoomProps {
  roomUrl: string;
  userName: string;
  onLeave: () => void;
  participantType?: 'mentor' | 'student';
  testId?: string;
}

export default function VideoCallRoom({
  roomUrl,
  userName,
  onLeave,
  participantType = 'student',
  testId,
}: VideoCallRoomProps) {
  const callFrameRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  const [callDuration, setCallDuration] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let durationInterval: NodeJS.Timeout;

    const initializeCall = async () => {
      try {
        if (!containerRef.current) return;

        // Create Daily call frame
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px',
          },
        });

        callFrameRef.current = callFrame;

        // Event listeners
        callFrame
          .on('joined-meeting', async (event) => {
            console.log('Joined meeting', event);
            setIsLoading(false);
            setParticipants(Object.keys(event.participants).length);

            // Log call start to database
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              await supabase.from('call_history').insert({
                caller_id: userData.user.id,
                room_url: roomUrl,
                started_at: new Date().toISOString(),
                call_type: testId ? 'test_monitoring' : 'direct',
                test_id: testId,
              });
            }

            // Start duration counter
            durationInterval = setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          })
          .on('left-meeting', () => {
            console.log('Left meeting');
            clearInterval(durationInterval);
          })
          .on('participant-joined', (event) => {
            console.log('Participant joined', event);
            setParticipants((prev) => prev + 1);
          })
          .on('participant-left', (event) => {
            console.log('Participant left', event);
            setParticipants((prev) => Math.max(0, prev - 1));
          })
          .on('error', (event) => {
            console.error('Daily error', event);
            setError(event.errorMsg || 'An error occurred');
            setIsLoading(false);
          });

        // Join the call
        await callFrame.join({
          url: roomUrl,
          userName: userName,
        });
      } catch (err) {
        console.error('Error initializing call:', err);
        setError('Failed to initialize video call');
        setIsLoading(false);
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      clearInterval(durationInterval);
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, [roomUrl, userName, testId, supabase]);

  const toggleMute = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (callFrameRef.current) {
      if (isScreenSharing) {
        await callFrameRef.current.stopScreenShare();
      } else {
        await callFrameRef.current.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const leaveCall = async () => {
    if (callFrameRef.current) {
      // Log call end to database
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: callHistory } = await supabase
          .from('call_history')
          .select('id')
          .eq('caller_id', userData.user.id)
          .eq('room_url', roomUrl)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (callHistory) {
          await supabase
            .from('call_history')
            .update({
              ended_at: new Date().toISOString(),
              duration_seconds: callDuration,
            })
            .eq('id', callHistory.id);
        }
      }

      await callFrameRef.current.leave();
      await callFrameRef.current.destroy();
    }
    onLeave();
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <Button onClick={onLeave} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Video Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to video call...</p>
          </div>
        </div>
      )}

      {/* Call Info Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 px-6 py-3 rounded-full shadow-lg">
        <div className="flex items-center space-x-6 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
          </div>
          <div className="text-sm">
            {participants} participant{participants !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        <Button
          onClick={toggleMute}
          size="lg"
          className={`rounded-full w-14 h-14 ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button
          onClick={toggleVideo}
          size="lg"
          className={`rounded-full w-14 h-14 ${
            isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        {participantType === 'mentor' && (
          <Button
            onClick={toggleScreenShare}
            size="lg"
            className={`rounded-full w-14 h-14 ${
              isScreenSharing ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </Button>
        )}

        <Button
          onClick={leaveCall}
          size="lg"
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
