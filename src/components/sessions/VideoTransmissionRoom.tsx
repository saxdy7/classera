'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Share2, MessageSquare, Users, Settings, Copy, Check, X } from 'lucide-react';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

interface VideoTransmissionRoomProps {
  roomUrl: string;
  sessionTitle: string;
  sessionId: string;
  userId: string;
  userName: string;
  mentorName: string;
  mentorAvatar?: string;
  onExit?: () => void;
  settings?: {
    require_camera?: boolean;
    require_microphone?: boolean;
    enable_chat?: boolean;
    allow_screen_share?: boolean;
    waiting_room?: boolean;
    record_session?: boolean;
  };
}

export function VideoTransmissionRoom({
  roomUrl,
  sessionTitle,
  sessionId,
  userId,
  userName,
  mentorName,
  mentorAvatar,
  onExit,
  settings = {},
}: VideoTransmissionRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  
  const [isMuted, setIsMuted] = useState(settings.require_microphone ? false : true);
  const [isCameraOff, setIsCameraOff] = useState(settings.require_camera ? false : true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Load Jitsi Meet External API
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;

    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) return;

      // Extract room name from URL or generate
      const roomName = `classera-${sessionId.replace(/-/g, '').slice(0, 16)}`;

      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: isMuted,
          startWithVideoMuted: isCameraOff,
          disableSimulcast: false,
          enableWelcomePage: false,
          enableClosePage: false,
          startAudioOnly: false,
          prejoinPageEnabled: false,
          hideConferenceTimer: true,
        },
        interfaceConfigOverwrite: {
          // Hide Jitsi default UI elements, show only video
          TOOLBAR_BUTTONS: [],
          FILMSTRIP_ENABLED: true,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
        },
        userInfo: {
          displayName: userName,
          email: userId,
        },
      };

      const api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', options);
      jitsiRef.current = api;

      // Event listeners
      api.on('videoConferenceJoined', () => {
        console.log('Joined video conference');
        setConnectionStatus('connected');
      });

      api.on('videoConferenceFailed', () => {
        console.log('Video conference failed');
        setConnectionStatus('disconnected');
      });

      api.on('readyToClose', () => {
        handleLeaveCall();
      });

      api.on('participantJoined', (id: string) => {
        api.setDisplayName(id, mentorName);
      });

      // Set control states
      api.executeCommand('toggleAudio', isMuted);
      api.executeCommand('toggleVideo', isCameraOff);
    };

    document.head.appendChild(script);

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [sessionId, userName, userId, mentorName, isMuted, isCameraOff]);

  const handleLeaveCall = () => {
    if (jitsiRef.current) {
      jitsiRef.current.dispose();
      jitsiRef.current = null;
    }
    onExit?.();
  };

  const toggleMic = () => {
    setIsMuted(!isMuted);
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand('toggleVideo');
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand('toggleShareScreen');
    }
  };

  const handleCopyRoomUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Jitsi Video Container */}
      <div ref={containerRef} className="flex-1 relative" />

      {/* Classera Custom Overlay Controls */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
        {/* Header */}
        <div className="pointer-events-auto p-4 bg-gradient-to-b from-black/90 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-white text-lg font-bold">{sessionTitle}</h2>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white ${
                  connectionStatus === 'connected' ? 'bg-green-500/20 text-green-200' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-200 animate-pulse' :
                  'bg-red-500/20 text-red-200'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 
                   'Disconnected'}
                </span>
              </div>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                title="Show participants"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>

            {/* Mentor Info */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 mt-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {mentorName?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Mentor: {mentorName}</p>
                <p className="text-gray-300 text-xs">Session ID: {sessionId.slice(0, 12)}...</p>
              </div>
              <button
                onClick={handleCopyRoomUrl}
                className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                title="Copy session link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="pointer-events-auto p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
            {/* Microphone */}
            <button
              onClick={toggleMic}
              className={`group relative p-4 rounded-full transition-all transform hover:scale-110 ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>

            {/* Camera */}
            <button
              onClick={toggleCamera}
              className={`group relative p-4 rounded-full transition-all transform hover:scale-110 ${
                isCameraOff
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCameraOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              </span>
            </button>

            {/* Screen Share - Only if allowed */}
            {settings.allow_screen_share !== false && (
              <button
                onClick={toggleScreenShare}
                className={`group relative p-4 rounded-full transition-all transform hover:scale-110 ${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <Share2 className="w-6 h-6 text-white" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {isScreenSharing ? 'Stop sharing' : 'Share screen'}
                </span>
              </button>
            )}

            {/* Chat - Only if enabled */}
            {settings.enable_chat !== false && (
              <button
                onClick={() => setShowChat(!showChat)}
                className="group relative p-4 rounded-full bg-slate-600 hover:bg-slate-700 transition-all transform hover:scale-110"
                title="Open chat"
              >
                <MessageSquare className="w-6 h-6 text-white" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Chat
                </span>
              </button>
            )}

            {/* Settings */}
            <button
              className="group relative p-4 rounded-full bg-slate-600 hover:bg-slate-700 transition-all transform hover:scale-110"
              title="Settings"
            >
              <Settings className="w-6 h-6 text-white" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Settings
              </span>
            </button>

            {/* Divider */}
            <div className="h-10 w-1 bg-white/20 rounded" />

            {/* Leave Call */}
            <button
              onClick={handleLeaveCall}
              className="group relative p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all transform hover:scale-110 shadow-lg shadow-red-500/50"
              title="Leave call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Leave Call
              </span>
            </button>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="pointer-events-auto absolute right-0 top-32 w-80 h-96 bg-slate-900/95 border-l border-slate-700 rounded-l-lg p-4 overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Participants</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Mentor */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {mentorName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{mentorName}</p>
                    <p className="text-indigo-300 text-xs">Mentor (Host)</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              {/* Current User */}
              <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {userName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{userName}</p>
                    <p className="text-gray-400 text-xs">You</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
