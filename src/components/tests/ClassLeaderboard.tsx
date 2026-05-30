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
    if (rank === 1) return 'bg-yellow-400/20 border border-yellow-400/40';
    if (rank === 2) return 'bg-slate-400/20 border border-slate-400/40';
    if (rank === 3) return 'bg-amber-700/30 border border-amber-700/40';
    return 'bg-violet-600/20 border border-violet-600/40';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-amber-500';
    return 'text-violet-400';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 rounded-2xl p-6 mb-8 border border-violet-800/40 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Class Leaderboard</h3>
            <p className="text-slate-400 text-xs">{totalParticipants} students completed</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-center ${getRankBadgeStyle(myRank + 1)}`}>
          <p className="text-xs text-slate-400 font-medium">Your Rank</p>
          <p className={`text-2xl font-bold ${getRankColor(myRank + 1)}`}>#{myRank + 1}</p>
          <p className="text-xs text-slate-500">of {totalParticipants}</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isMe ? 'bg-violet-600/25 border border-violet-500/50 shadow-lg' : 'bg-white/5 border border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="w-8 text-center flex-shrink-0">
                {rankIcon ? <span className="text-xl">{rankIcon}</span> : <span className="text-slate-500 font-bold text-sm">#{rank}</span>}
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                isMe ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isMe ? 'text-violet-200' : 'text-white'}`}>
                  {entry.users?.full_name || 'Student'}
                  {isMe && <span className="ml-2 text-xs text-violet-400 font-normal">(You)</span>}
                </p>
                <p className="text-slate-500 text-xs">{formatTime(entry.time_taken_seconds)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      entry.percentage >= 80 ? 'bg-emerald-400' : entry.percentage >= 60 ? 'bg-sky-400' : entry.percentage >= 40 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, entry.percentage || 0)}%` }}
                  />
                </div>
                <span className={`font-bold text-sm w-12 text-right ${
                  entry.percentage >= 80 ? 'text-emerald-400' : entry.percentage >= 60 ? 'text-sky-400' : entry.percentage >= 40 ? 'text-amber-400' : 'text-red-400'
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
