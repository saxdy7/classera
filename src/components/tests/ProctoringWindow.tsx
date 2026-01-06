'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall, DailyEventObjectParticipant } from '@daily-co/daily-js';
import { Camera, CameraOff, Monitor, MonitorOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProctoringWindowProps {
  testId: string;
  sessionId: string;
  roomUrl: string;
  studentName: string;
  onViolation?: (type: string, severity: string) => void;
  enableScreenShare?: boolean;
  enableWebcam?: boolean;
  enableRecording?: boolean;
}

export default function ProctoringWindow({
  testId,
  sessionId,
  roomUrl,
  studentName,
  onViolation,
  enableScreenShare = true,
  enableWebcam = true,
  enableRecording = false,
}: ProctoringWindowProps) {
  const callRef = useRef<DailyCall | null>(null);
  const webcamRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [isScreenShareOn, setIsScreenShareOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Initialize Daily.co call
  useEffect(() => {
    const initCall = async () => {
      try {
        // Create Daily.co call object
        const call = DailyIframe.createFrame(webcamRef.current!, {
          showLeaveButton: false,
          showFullscreenButton: false,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '0.5rem',
          },
        });

        callRef.current = call;

        // Join the room
        await call.join({
          url: roomUrl,
          userName: studentName,
        });

        // Start webcam if enabled
        if (enableWebcam) {
          await call.setLocalVideo(true);
          setIsWebcamOn(true);
        }

        // Start screen share if enabled
        if (enableScreenShare) {
          await startScreenShare();
        }

        // Start recording if enabled
        if (enableRecording) {
          await startRecording();
        }

        // Listen for participant events
        call.on('participant-updated', handleParticipantUpdate);
        call.on('participant-left', handleParticipantLeft);
        call.on('error', handleError);

      } catch (err: any) {
        console.error('Failed to initialize proctoring:', err);
        setError('Failed to start proctoring session. Please check your camera and screen sharing permissions.');
      }
    };

    initCall();

    // Cleanup on unmount
    return () => {
      if (callRef.current) {
        callRef.current.destroy();
      }
    };
  }, [roomUrl, studentName, enableWebcam, enableScreenShare, enableRecording]);

  const startScreenShare = async () => {
    try {
      if (!callRef.current) return;

      await callRef.current.startScreenShare();
      setIsScreenShareOn(true);

      // Update session in database
      await fetch(`/api/proctoring/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screen_share_started: true }),
      });
    } catch (err: any) {
      console.error('Failed to start screen share:', err);
      setError('Failed to start screen sharing. Please allow screen sharing to continue.');
      onViolation?.('screen_share_failed', 'critical');
    }
  };

  const stopScreenShare = async () => {
    try {
      if (!callRef.current) return;

      await callRef.current.stopScreenShare();
      setIsScreenShareOn(false);

      // Log violation
      await logViolation('screen_share_stopped', 'high', 'Student stopped screen sharing');
    } catch (err: any) {
      console.error('Failed to stop screen share:', err);
    }
  };

  const startRecording = async () => {
    try {
      if (!callRef.current) return;

      await callRef.current.startRecording();
      setIsRecording(true);

      // Update session in database
      await fetch(`/api/proctoring/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_started_at: new Date().toISOString() }),
      });
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!callRef.current) return;

      await callRef.current.stopRecording();
      setIsRecording(false);

      // Update session in database
      await fetch(`/api/proctoring/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_ended_at: new Date().toISOString() }),
      });
    } catch (err: any) {
      console.error('Failed to stop recording:', err);
    }
  };

  const toggleWebcam = async () => {
    try {
      if (!callRef.current) return;

      if (isWebcamOn) {
        await callRef.current.setLocalVideo(false);
        setIsWebcamOn(false);
        await logViolation('webcam_disabled', 'high', 'Student disabled webcam');
      } else {
        await callRef.current.setLocalVideo(true);
        setIsWebcamOn(true);
      }
    } catch (err: any) {
      console.error('Failed to toggle webcam:', err);
    }
  };

  const handleParticipantUpdate = (event: DailyEventObjectParticipant) => {
    // Monitor participant state changes
    if (event.participant.local) {
      // Check if student disabled camera
      if (!event.participant.video && isWebcamOn) {
        setWarnings(prev => [...prev, 'Camera was disabled']);
        onViolation?.('camera_disabled', 'high');
      }

      // Check if student disabled screen share
      if (!event.participant.screen && isScreenShareOn) {
        setWarnings(prev => [...prev, 'Screen sharing was stopped']);
        onViolation?.('screen_share_stopped', 'critical');
      }
    }
  };

  const handleParticipantLeft = (event: any) => {
    if (event.participant.local) {
      setError('You have been disconnected from the proctoring session.');
      onViolation?.('disconnected', 'critical');
    }
  };

  const handleError = (event: any) => {
    console.error('Daily.co error:', event);
    setError('An error occurred with the proctoring system.');
  };

  const logViolation = async (type: string, severity: string, description: string) => {
    try {
      await fetch('/api/proctoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          type,
          severity,
          title: description,
          description,
        }),
      });

      onViolation?.(type, severity);
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        <div className="space-y-4">
          {/* Webcam Feed */}
          {enableWebcam && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Your Camera</h3>
                <Button
                  size="sm"
                  variant={isWebcamOn ? 'default' : 'destructive'}
                  onClick={toggleWebcam}
                >
                  {isWebcamOn ? (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Camera On
                    </>
                  ) : (
                    <>
                      <CameraOff className="h-4 w-4 mr-2" />
                      Camera Off
                    </>
                  )}
                </Button>
              </div>
              <div
                ref={webcamRef}
                className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden"
              />
            </div>
          )}

          {/* Screen Share */}
          {enableScreenShare && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Screen Sharing</h3>
                <Button
                  size="sm"
                  variant={isScreenShareOn ? 'default' : 'outline'}
                  onClick={isScreenShareOn ? stopScreenShare : startScreenShare}
                >
                  {isScreenShareOn ? (
                    <>
                      <Monitor className="h-4 w-4 mr-2" />
                      Sharing
                    </>
                  ) : (
                    <>
                      <MonitorOff className="h-4 w-4 mr-2" />
                      Not Sharing
                    </>
                  )}
                </Button>
              </div>
              {isScreenShareOn && (
                <div
                  ref={screenRef}
                  className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden"
                />
              )}
            </div>
          )}

          {/* Recording Status */}
          {enableRecording && (
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {isRecording ? 'Recording in progress' : 'Not recording'}
                </span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Your session is being proctored</p>
            {enableWebcam && <p>• Keep your camera on throughout the test</p>}
            {enableScreenShare && <p>• Screen sharing must remain active</p>}
            <p>• Do not switch tabs or exit fullscreen</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
