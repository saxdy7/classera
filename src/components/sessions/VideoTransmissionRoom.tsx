'use client';

import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Share2, MessageSquare, Users, Settings, Copy, Check, X, Shield, Lock } from 'lucide-react';
import Image from 'next/image';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

interface VideoTransmissionRoomProps {
  roomUrl?: string | null;
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

  // Always have a usable URL — fall back to a deterministic Jitsi room
  const resolvedRoomUrl = roomUrl || `https://meet.jit.si/classera-${sessionId.replace(/-/g, '').slice(0, 16)}`;

  const [isMuted, setIsMuted] = useState(settings.require_microphone ? false : true);
  const [isCameraOff, setIsCameraOff] = useState(settings.require_camera ? false : true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Load Jitsi Meet External API
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;

    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) return;

      const roomName = resolvedRoomUrl.split('/').pop() || `classera-${sessionId.replace(/-/g, '').slice(0, 16)}`;

      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: isMuted,
          startWithVideoMuted: isCameraOff,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          hideConferenceTimer: true,
          disableDeepLinking: true,
          noticeMessage: 'Secure Classera connection established.',
          doNotStoreRoom: true,
          // Extra branding bypass attempts:
          disableLogo: true,
          brandingDataUrl: '',
        },
        interfaceConfigOverwrite: {
          // Hide as much Jitsi UI as possible, we use our own controls below
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Member',
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISABLE_TRANSCRIPTION_SUBTITLES: true,
          SUPPORT_URL: 'https://classera.demo',
        },
        userInfo: {
          displayName: userName,
          email: userId,
        },
      };

      const api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', options);
      jitsiRef.current = api;

      api.on('videoConferenceJoined', () => setConnectionStatus('connected'));
      api.on('videoConferenceFailed', () => setConnectionStatus('disconnected'));
      api.on('readyToClose', () => handleLeaveCall());
      
      // Force control sync
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
  }, [roomUrl, sessionId, userName, userId]);

  const handleLeaveCall = () => {
    if (jitsiRef.current) {
      jitsiRef.current.dispose();
      jitsiRef.current = null;
    }
    onExit?.();
  };

  const toggleMic = () => {
    setIsMuted(!isMuted);
    jitsiRef.current?.executeCommand('toggleAudio');
  };

  const toggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    jitsiRef.current?.executeCommand('toggleVideo');
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    jitsiRef.current?.executeCommand('toggleShareScreen');
  };

  const handleCopyRoomUrl = () => {
    navigator.clipboard.writeText(resolvedRoomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[var(--cl-surface-inverse)] z-[100] flex flex-col font-sans">
      {/* Jitsi Engine Container */}
      <div ref={containerRef} className="flex-1 relative bg-[var(--cl-surface-inverse)]" />

      {/* 🛡️ CLASSERA BRANDING OVERLAY - Hides Jitsi Logos */}
      <div className="absolute inset-0 pointer-events-none z-10">
        
        {/* Top-Left: Classera Logo (Branding Overlay) */}
        <div className="absolute top-0 left-0 w-64 h-24 p-6 pointer-events-auto bg-[var(--cl-surface-inverse)]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary)] flex items-center justify-center">
                <span className="text-[var(--cl-on-dark)] font-semibold text-xl leading-none italic">C</span>
             </div>
             <div>
                <h1 className="text-[var(--cl-on-dark)] text-base font-semibold leading-none tracking-tight">Classera <span className="text-[var(--cl-primary)]">Live</span></h1>
                <p className="text-[var(--cl-muted-soft)] text-[10px] uppercase font-semibold tracking-widest mt-1">E-Learning Hub</p>
             </div>
          </div>
        </div>

        {/* Top-Center: Session Title */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[var(--cl-surface-card)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)] flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[rgba(22,163,74,0.2)] text-[var(--cl-success)] rounded-lg text-[10px] font-semibold border border-[var(--cl-success)]">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              SECURE
           </div>
           <span className="text-sm font-semibold text-[var(--cl-on-dark)] tracking-wide">{sessionTitle}</span>
        </div>

        {/* Bottom-Right: Participant Sidebar Toggle (Floating Overlay) */}
        <div className="absolute bottom-32 right-6 flex flex-col gap-3 pointer-events-auto">
           <button 
             onClick={() => setShowParticipants(!showParticipants)}
             className="w-12 h-12 bg-[var(--cl-surface-card)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)] flex items-center justify-center text-[var(--cl-on-dark)] hover:bg-[var(--cl-primary)] transition-all"
           >
              <Users size={20} />
           </button>
           <button className="w-12 h-12 bg-[var(--cl-surface-card)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)] flex items-center justify-center text-[var(--cl-on-dark)] hover:bg-[var(--cl-surface-inverse)] transition-all">
              <Settings size={20} />
           </button>
        </div>

        {/* Custom Sidebar Overlay */}
        {showParticipants && (
           <div className="absolute right-6 top-24 bottom-48 w-72 bg-[var(--cl-surface-card)] backdrop-blur-2xl border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)] p-6 pointer-events-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[var(--cl-on-dark)] font-semibold text-lg">Members</h3>
                <button onClick={() => setShowParticipants(false)} className="text-[var(--cl-muted)] hover:text-[var(--cl-on-dark)]"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-[var(--cl-surface-card)] border border-[var(--cl-primary)] rounded-[var(--cl-r-xl)]">
                    <div className="w-10 h-10 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary)] flex items-center justify-center text-[var(--cl-on-dark)] font-semibold">{mentorName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--cl-on-dark)]">{mentorName}</p>
                      <p className="text-[10px] text-[var(--cl-primary)] uppercase font-semibold tracking-widest">Mentor (Host)</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)]">
                    <div className="w-10 h-10 rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-inverse)] flex items-center justify-center text-[var(--cl-on-dark)] font-semibold">{userName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--cl-on-dark)]">{userName}</p>
                      <p className="text-[10px] text-[var(--cl-muted)] uppercase font-semibold tracking-widest">You</p>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* 🎮 CLASSERA CONTROL CENTER */}
      <div className="bg-[var(--cl-surface-card)] backdrop-blur-3xl px-8 py-6 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between z-20">
        <div className="flex items-center gap-4 flex-1">
           <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-[var(--cl-r-xl)] border border-[rgba(255,255,255,0.05)] text-[var(--cl-muted-soft)] group hover:border-[var(--cl-primary)] transition-all cursor-pointer" onClick={handleCopyRoomUrl}>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[var(--cl-primary)]" />
                 <span className="text-[10px] font-semibold uppercase tracking-widest">{copied ? 'Copied' : 'Session Info'}</span>
                 {copied ? <Check size={12} className="text-[var(--cl-success)]" /> : <Copy size={12} />}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.05)] p-2 rounded-[var(--cl-r-xl)] border border-[rgba(255,255,255,0.05)]">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-[var(--cl-r-xl)] transition-all transform active:scale-95 ${
              isMuted ? 'bg-[var(--cl-error)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] hover:bg-[var(--cl-surface-inverse)]'
            }`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-4 rounded-[var(--cl-r-xl)] transition-all transform active:scale-95 ${
              isCameraOff ? 'bg-[var(--cl-error)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] hover:bg-[var(--cl-surface-inverse)]'
            }`}
          >
            {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>

          <div className="w-[1px] h-10 bg-[rgba(255,255,255,0.1)] mx-1" />

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-[var(--cl-r-xl)] transition-all transform active:scale-105 ${
              isScreenSharing ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] hover:bg-[var(--cl-surface-inverse)]'
            }`}
          >
            <Share2 size={22} />
          </button>

          <div className="w-[1px] h-10 bg-[rgba(255,255,255,0.1)] mx-1" />

          <button
            onClick={handleLeaveCall}
            className="p-4 bg-[var(--cl-error)] hover:bg-[var(--cl-error)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-xl)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <PhoneOff size={22} />
            <span className="text-xs font-semibold font-sans pr-1 group-hover:block hidden">End</span>
          </button>
        </div>

        <div className="flex-1 flex justify-end gap-3 text-xs">
           <div className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-card)] text-[var(--cl-primary)] rounded-[var(--cl-r-lg)] border border-[var(--cl-primary)] font-semibold uppercase tracking-widest text-[9px]">
             Meeting ID: {sessionId.split('-')[0]}
           </div>
        </div>
      </div>
    </div>
  );
}
