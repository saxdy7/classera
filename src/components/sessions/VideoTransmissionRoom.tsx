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
    <div className="fixed inset-0 bg-neutral-900 z-[100] flex flex-col font-sans">
      {/* Jitsi Engine Container */}
      <div ref={containerRef} className="flex-1 relative bg-neutral-900" />

      {/* 🛡️ CLASSERA BRANDING OVERLAY - Hides Jitsi Logos */}
      <div className="absolute inset-0 pointer-events-none z-10">
        
        {/* Top-Left: Classera Logo (Branding Overlay) */}
        <div className="absolute top-0 left-0 w-64 h-24 p-6 pointer-events-auto bg-neutral-900">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-semibold text-xl leading-none italic">C</span>
             </div>
             <div>
                <h1 className="text-white text-base font-semibold leading-none tracking-tight">Classera <span className="text-accent-purple">Live</span></h1>
                <p className="text-muted-foreground/70 text-[10px] uppercase font-semibold tracking-widest mt-1">E-Learning Hub</p>
             </div>
          </div>
        </div>

        {/* Top-Center: Session Title */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-card backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[rgba(22,163,74,0.2)] text-green-600 rounded-lg text-[10px] font-semibold border border-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              SECURE
           </div>
           <span className="text-sm font-semibold text-white tracking-wide">{sessionTitle}</span>
        </div>

        {/* Bottom-Right: Participant Sidebar Toggle (Floating Overlay) */}
        <div className="absolute bottom-32 right-6 flex flex-col gap-3 pointer-events-auto">
           <button 
             onClick={() => setShowParticipants(!showParticipants)}
             className="w-12 h-12 bg-card backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl flex items-center justify-center text-white hover:bg-primary transition-all"
           >
              <Users size={20} />
           </button>
           <button className="w-12 h-12 bg-card backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl flex items-center justify-center text-white hover:bg-neutral-900 transition-all">
              <Settings size={20} />
           </button>
        </div>

        {/* Custom Sidebar Overlay */}
        {showParticipants && (
           <div className="absolute right-6 top-24 bottom-48 w-72 bg-card backdrop-blur-2xl border border-[rgba(255,255,255,0.1)] rounded-xl p-6 pointer-events-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-lg">Members</h3>
                <button onClick={() => setShowParticipants(false)} className="text-muted-foreground hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-card border border-accent-purple rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-semibold">{mentorName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{mentorName}</p>
                      <p className="text-[10px] text-accent-purple uppercase font-semibold tracking-widest">Mentor (Host)</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-semibold">{userName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{userName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">You</p>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* 🎮 CLASSERA CONTROL CENTER */}
      <div className="bg-card backdrop-blur-3xl px-8 py-6 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between z-20">
        <div className="flex items-center gap-4 flex-1">
           <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-xl border border-[rgba(255,255,255,0.05)] text-muted-foreground/70 group hover:border-accent-purple transition-all cursor-pointer" onClick={handleCopyRoomUrl}>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary" />
                 <span className="text-[10px] font-semibold uppercase tracking-widest">{copied ? 'Copied' : 'Session Info'}</span>
                 {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.05)] p-2 rounded-xl border border-[rgba(255,255,255,0.05)]">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-xl transition-all transform active:scale-95 ${
              isMuted ? 'bg-destructive text-white' : 'bg-neutral-900 text-white hover:bg-neutral-900'
            }`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-4 rounded-xl transition-all transform active:scale-95 ${
              isCameraOff ? 'bg-destructive text-white' : 'bg-neutral-900 text-white hover:bg-neutral-900'
            }`}
          >
            {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>

          <div className="w-[1px] h-10 bg-[rgba(255,255,255,0.1)] mx-1" />

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-xl transition-all transform active:scale-105 ${
              isScreenSharing ? 'bg-primary text-white' : 'bg-neutral-900 text-white hover:bg-neutral-900'
            }`}
          >
            <Share2 size={22} />
          </button>

          <div className="w-[1px] h-10 bg-[rgba(255,255,255,0.1)] mx-1" />

          <button
            onClick={handleLeaveCall}
            className="p-4 bg-destructive hover:bg-destructive text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <PhoneOff size={22} />
            <span className="text-xs font-semibold font-sans pr-1 group-hover:block hidden">End</span>
          </button>
        </div>

        <div className="flex-1 flex justify-end gap-3 text-xs">
           <div className="flex items-center gap-2 px-4 py-2 bg-card text-accent-purple rounded-lg border border-accent-purple font-semibold uppercase tracking-widest text-[9px]">
             Meeting ID: {sessionId.split('-')[0]}
           </div>
        </div>
      </div>
    </div>
  );
}
