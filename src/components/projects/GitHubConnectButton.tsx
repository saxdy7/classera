'use client';

import { useState } from 'react';
import { Github, Loader2, Unlink, CheckCircle } from 'lucide-react';

interface GitHubConnectButtonProps {
  connected: boolean;
  username?: string | null;
  avatarUrl?: string | null;
  returnTo?: string;
}

export default function GitHubConnectButton({
  connected,
  username,
  avatarUrl,
  returnTo,
}: GitHubConnectButtonProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function handleDisconnect() {
    if (!confirm('Disconnect your GitHub account? Existing analytics will be preserved.')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/github/profile-stats', { method: 'DELETE' });
      window.location.reload();
    } finally {
      setDisconnecting(false);
    }
  }

  if (connected && username) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-600 rounded-lg">
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
            <Github className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">@{username}</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            GitHub connected
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/80 border border-border rounded-lg hover:bg-muted/40 transition-colors"
        >
          {disconnecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Unlink className="w-3.5 h-3.5" />
          )}
          Disconnect
        </button>
      </div>
    );
  }

  const href = returnTo
    ? `/api/github/connect?returnTo=${encodeURIComponent(returnTo)}`
    : '/api/github/connect';

  return (
    <a
      href={href}
      onClick={() => setConnecting(true)}
      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-900 text-white rounded-lg text-sm font-medium transition-colors"
    >
      {connecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Github className="w-4 h-4" />
      )}
      {connecting ? 'Redirecting to GitHub…' : 'Connect GitHub Account'}
    </a>
  );
}
