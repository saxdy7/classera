'use client';

import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  student_id: string;
  score: number;
  percentage: number;
  time_taken_seconds?: number;
  users?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
}

interface ClassLeaderboardProps {
  entries: LeaderboardEntry[];
  myRank: number | null;
  currentUserId: string;
}

export function ClassLeaderboard({ entries, myRank, currentUserId }: ClassLeaderboardProps) {
  if (!entries.length || myRank === null) return null;

  const totalParticipants = entries.length;
  const formatTime = (secs?: number) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-[rgba(171,100,0,0.2)] border border-[var(--cl-warning)]';
    if (rank === 2) return 'bg-[rgba(230,229,224,0.2)] border border-[var(--cl-hairline-strong)]';
    if (rank === 3) return 'bg-[rgba(171,100,0,0.3)] border border-[var(--cl-warning)]';
    return 'bg-[var(--cl-surface-card)] border border-[var(--cl-primary)]';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-[var(--cl-warning)]';
    if (rank === 2) return 'text-[var(--cl-muted-soft)]';
    if (rank === 3) return 'text-[var(--cl-warning)]';
    return 'text-[var(--cl-primary)]';
  };

  return (
    <div className="rounded-[var(--cl-r-xl)] p-6 mb-8 border border-[var(--cl-primary)] bg-[var(--cl-surface-inverse)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(171,100,0,0.2)] rounded-[var(--cl-r-lg)] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[var(--cl-warning)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--cl-on-dark)]">Class Leaderboard</h3>
            <p className="text-[var(--cl-muted-soft)] text-xs">{totalParticipants} students completed</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-[var(--cl-r-lg)] text-center ${getRankBadgeStyle(myRank + 1)}`}>
          <p className="text-xs text-[var(--cl-muted-soft)] font-medium">Your Rank</p>
          <p className={`text-2xl font-semibold ${getRankColor(myRank + 1)}`}>#{myRank + 1}</p>
          <p className="text-xs text-[var(--cl-muted)]">of {totalParticipants}</p>
        </div>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 5).map((entry, idx) => {
          const rank = idx + 1;
          const isMe = entry.student_id === currentUserId;
          const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
          const initials = (entry.users?.full_name || 'S')
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={entry.student_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-[var(--cl-r-lg)] transition-all ${
                isMe ? 'bg-[var(--cl-surface-card)] border border-[var(--cl-primary)]' : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div className="w-8 text-center flex-shrink-0">
                {rankIcon ? <span className="text-xl">{rankIcon}</span> : <span className="text-[var(--cl-muted)] font-semibold text-sm">#{rank}</span>}
              </div>
              <div className={`w-9 h-9 rounded-[var(--cl-r-lg)] flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
                isMe ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-inverse)] text-[var(--cl-muted-soft)]'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isMe ? 'text-[var(--cl-primary)]' : 'text-[var(--cl-on-dark)]'}`}>
                  {entry.users?.full_name || 'Student'}
                  {isMe && <span className="ml-2 text-xs text-[var(--cl-primary)] font-normal">(You)</span>}
                </p>
                <p className="text-[var(--cl-muted)] text-xs">{formatTime(entry.time_taken_seconds)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex w-20 h-1.5 bg-[var(--cl-surface-inverse)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      entry.percentage >= 80 ? 'bg-[var(--cl-success)]' : entry.percentage >= 60 ? 'bg-[var(--cl-info)]' : entry.percentage >= 40 ? 'bg-[var(--cl-warning)]' : 'bg-[var(--cl-error)]'
                    }`}
                    style={{ width: `${Math.min(100, entry.percentage || 0)}%` }}
                  />
                </div>
                <span className={`font-semibold text-sm w-12 text-right ${
                  entry.percentage >= 80 ? 'text-[var(--cl-success)]' : entry.percentage >= 60 ? 'text-[var(--cl-info)]' : entry.percentage >= 40 ? 'text-[var(--cl-warning)]' : 'text-[var(--cl-error)]'
                }`}>
                  {(entry.percentage || 0).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
