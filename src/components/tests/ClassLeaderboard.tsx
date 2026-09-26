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
    if (rank === 1) return 'bg-[rgba(171,100,0,0.2)] border border-amber-500';
    if (rank === 2) return 'bg-[rgba(230,229,224,0.2)] border border-border';
    if (rank === 3) return 'bg-amber-500/10 border border-amber-500';
    return 'bg-card border border-accent-purple';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-600';
    if (rank === 2) return 'text-muted-foreground/70';
    if (rank === 3) return 'text-amber-600';
    return 'text-accent-purple';
  };

  return (
    <div className="rounded-xl p-6 mb-8 border border-accent-purple bg-neutral-900">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(171,100,0,0.2)] rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Class Leaderboard</h3>
            <p className="text-muted-foreground/70 text-xs">{totalParticipants} students completed</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg text-center ${getRankBadgeStyle(myRank + 1)}`}>
          <p className="text-xs text-muted-foreground/70 font-medium">Your Rank</p>
          <p className={`text-2xl font-semibold ${getRankColor(myRank + 1)}`}>#{myRank + 1}</p>
          <p className="text-xs text-muted-foreground">of {totalParticipants}</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isMe ? 'bg-card border border-accent-purple' : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div className="w-8 text-center flex-shrink-0">
                {rankIcon ? <span className="text-xl">{rankIcon}</span> : <span className="text-muted-foreground font-semibold text-sm">#{rank}</span>}
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
                isMe ? 'bg-primary text-white' : 'bg-neutral-900 text-muted-foreground/70'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isMe ? 'text-accent-purple' : 'text-white'}`}>
                  {entry.users?.full_name || 'Student'}
                  {isMe && <span className="ml-2 text-xs text-accent-purple font-normal">(You)</span>}
                </p>
                <p className="text-muted-foreground text-xs">{formatTime(entry.time_taken_seconds)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex w-20 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      entry.percentage >= 80 ? 'bg-green-600' : entry.percentage >= 60 ? 'bg-accent-purple' : entry.percentage >= 40 ? 'bg-amber-500' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(100, entry.percentage || 0)}%` }}
                  />
                </div>
                <span className={`font-semibold text-sm w-12 text-right ${
                  entry.percentage >= 80 ? 'text-green-600' : entry.percentage >= 60 ? 'text-accent-purple' : entry.percentage >= 40 ? 'text-amber-600' : 'text-destructive'
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
