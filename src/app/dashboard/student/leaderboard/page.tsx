import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react';

export default async function StudentLeaderboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') redirect('/dashboard');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Get leaderboard for current month
  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*, users(full_name, avatar_url, degree_type)')
    .eq('university_id', profile.university_id)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .order('rank', { ascending: true })
    .limit(50);

  // Get my rank
  const myRank = leaderboard?.find(l => l.student_id === user.id);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '';
    if (rank === 2) return '';
    if (rank === 3) return '';
    return '';
  };

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold mb-2 text-[var(--cl-ink)]">
                Leaderboard
              </h1>
              <p className="text-[var(--cl-body)]">{profile.universities?.name} • {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* My Rank Card */}
            {myRank && (
              <div className={`mb-8 ${getRankColor(myRank.rank!)} rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)]`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Your Rank</div>
                    <div className="text-6xl font-semibold mb-2">{getRankBadge(myRank.rank!)}</div>
                    <div className="text-lg font-semibold">{myRank.total_score} points</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold mb-2">{Math.round(myRank.average_percentage)}%</div>
                    <div className="text-sm opacity-90">Average Score</div>
                    <div className="mt-3 text-sm">
                      {myRank.tests_completed} tests • {myRank.tasks_completed} tasks
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top 3 Podium */}
            {leaderboard && leaderboard.length >= 3 && (
              <div className="mb-8 grid grid-cols-3 gap-4 items-end">
                {/* 2nd Place */}
                <div className="rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)] text-center bg-[var(--cl-surface-strong)]">
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="w-16 h-16 bg-[rgba(255,255,255,0.2)] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-semibold">
                    {leaderboard[1].users?.full_name.charAt(0)}
                  </div>
                  <div className="font-semibold text-lg truncate">{leaderboard[1].users?.full_name}</div>
                  <div className="text-2xl font-semibold mt-2">{leaderboard[1].total_score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>

                {/* 1st Place */}
                <div className="rounded-[var(--cl-r-xl)] p-8 text-[var(--cl-on-dark)] text-center -translate-y-4 bg-[var(--cl-warning)]">
                  <div className="text-6xl mb-3">🥇</div>
                  <div className="w-20 h-20 bg-[rgba(255,255,255,0.2)] rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-semibold">
                    {leaderboard[0].users?.full_name.charAt(0)}
                  </div>
                  <div className="font-semibold text-xl truncate">{leaderboard[0].users?.full_name}</div>
                  <div className="text-3xl font-semibold mt-3">{leaderboard[0].total_score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>

                {/* 3rd Place */}
                <div className="rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)] text-center bg-[var(--cl-warning)]">
                  <div className="text-5xl mb-3">🥉</div>
                  <div className="w-16 h-16 bg-[rgba(255,255,255,0.2)] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-semibold">
                    {leaderboard[2].users?.full_name.charAt(0)}
                  </div>
                  <div className="font-semibold text-lg truncate">{leaderboard[2].users?.full_name}</div>
                  <div className="text-2xl font-semibold mt-2">{leaderboard[2].total_score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="bg-[rgba(255,255,255,0.8)] backdrop-blur-sm rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6">
              <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-6">Full Rankings</h2>
              
              <div className="space-y-2">
                {leaderboard && leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-[var(--cl-r-xl)] border transition-all ${
                      entry.student_id === user.id
                        ? 'bg-[var(--cl-primary-soft)] border-[var(--cl-primary)]'
                        : 'bg-[var(--cl-canvas-soft)] border-[var(--cl-hairline)] hover:bg-[var(--cl-surface-strong)]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[var(--cl-r-lg)] flex items-center justify-center font-semibold text-xl ${
                        index < 3 ? ` ${getRankColor(entry.rank!)} text-[var(--cl-on-dark)]` : 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)]'
                      }`}>
                        {getRankBadge(entry.rank!)}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold text-[var(--cl-ink)]">
                          {entry.users?.full_name}
                          {entry.student_id === user.id && (
                            <span className="ml-2 px-2 py-1 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] text-xs font-semibold rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-[var(--cl-body)]">{entry.users?.degree_type || 'Student'}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">{entry.total_score}</div>
                        <div className="text-xs text-[var(--cl-muted)]">points</div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-[var(--cl-primary)]">{Math.round(entry.average_percentage)}%</div>
                        <div className="text-xs text-[var(--cl-muted)]">avg</div>
                      </div>

                      <div className="text-sm text-[var(--cl-body)]">
                        <div>{entry.tests_completed} tests</div>
                        <div>{entry.tasks_completed} tasks</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(!leaderboard || leaderboard.length === 0) && (
                <div className="text-center py-12 text-[var(--cl-muted-soft)]">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">No rankings yet</p>
                  <p className="text-sm">Complete tests and tasks to appear on the leaderboard</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

