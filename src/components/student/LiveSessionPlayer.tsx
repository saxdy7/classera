'use client';

import { useEffect, useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface LiveSessionPlayerProps {
  sessionId: string;
  meetUrl: string;
  studentName: string;
  onClose: () => void;
}

export function LiveSessionPlayer({
  sessionId,
  meetUrl,
  studentName,
  onClose,
}: LiveSessionPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--cl-scrim)] z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Classera Branding Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-[var(--cl-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--cl-surface-card)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--cl-primary)] font-semibold text-sm">C</span>
            </div>
            <div>
              <h3 className="text-[var(--cl-on-dark)] font-semibold">Classera Live Session</h3>
              <p className="text-[var(--cl-primary)] text-xs">with {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--cl-primary)] rounded-lg transition text-[var(--cl-on-dark)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meet Player Container */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center">
                <Loader className="w-8 h-8 text-[var(--cl-on-dark)] animate-spin mx-auto mb-4" />
                <p className="text-[var(--cl-on-dark)] text-sm">Loading Google Meet...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-[var(--cl-error)] mb-4" />
              <p className="text-[var(--cl-on-dark)] text-sm">{error}</p>
            </div>
          )}

          {/* Google Meet iframe - only visible when loaded */}
          <iframe
            src={meetUrl}
            allow="camera; microphone; display-capture; clipboard-write; auto-play"
            className={`w-full h-full ${isLoading ? 'hidden' : 'block'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Failed to load Google Meet');
              setIsLoading(false);
            }}
          />
        </div>

        {/* Footer Info */}
        <div className="bg-[var(--cl-canvas-soft)] px-6 py-3 border-t border-[var(--cl-hairline)] flex items-center justify-between text-xs text-[var(--cl-body)]">
          <div>
            <p className="font-medium">Session ID: {sessionId.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <p>Powered by Classera × Google Meet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
