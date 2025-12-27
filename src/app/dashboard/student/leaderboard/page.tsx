import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react';

export default async function StudentLeaderboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

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
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-slate-300 to-slate-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-indigo-400 to-purple-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-fuchsia-50/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                Leaderboard
              </h1>
              <p className="text-slate-600">{profile.universities?.name} • {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* My Rank Card */}
            {myRank && (
              <div className={`mb-8 bg-gradient-to-br ${getRankColor(myRank.rank!)} rounded-3xl p-6 shadow-2xl text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Your Rank</div>
                    <div className="text-6xl font-black mb-2">{getRankBadge(myRank.rank!)}</div>
                    <div className="text-lg font-semibold">{myRank.total_score} points</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black mb-2">{Math.round(myRank.average_percentage)}%</div>
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
                <div className="bg-gradient-to-br from-slate-300 to-slate-500 rounded-3xl p-6 text-white text-center">
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                    {leaderboard[1].users?.full_name.charAt(0)}
                  </div>
                  <div className="font-bold text-lg truncate">{leaderboard[1].users?.full_name}</div>
                  <div className="text-2xl font-black mt-2">{leaderboard[1].total_score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>

                {/* 1st Place */}
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 text-white text-center -translate-y-4">
                  <div className="text-6xl mb-3">🥇</div>
                  <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold">
                    {leaderboard[0].users?.full_name.charAt(0)}
                  </div>
                  <div className="font-bold text-xl truncate">{leaderboard[0].users?.full_name}</div>
                  <div className="text-3xl font-black mt-3">{leaderboard[0].total_score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>

                {/* 3rd Place */}
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-6 text-white text-center">
                  <div className="text-5xl mb-3">🥉</div>
                  <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                    {leaderboard[2].users?.full_name.charAt(0)}
                  </div>
                  <div className="font-bold text-lg truncate">{leaderboard[2].users?.full_name}</div>
                  <div className="text-2xl font-black mt-2">{leaderboard[2].total_score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Full Rankings</h2>
              
              <div className="space-y-2">
                {leaderboard && leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      entry.student_id === user.id
                        ? 'bg-purple-50 border-purple-300 shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                        index < 3 ? `bg-gradient-to-br ${getRankColor(entry.rank!)} text-white` : 'bg-slate-200 text-slate-700'
                      }`}>
                        {getRankBadge(entry.rank!)}
                      </div>

                      <div className="flex-1">
                        <div className="font-bold text-slate-900">
                          {entry.users?.full_name}
                          {entry.student_id === user.id && (
                            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600">{entry.users?.degree_type || 'Student'}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">{entry.total_score}</div>
                        <div className="text-xs text-slate-500">points</div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">{Math.round(entry.average_percentage)}%</div>
                        <div className="text-xs text-slate-500">avg</div>
                      </div>

                      <div className="text-sm text-slate-600">
                        <div>{entry.tests_completed} tests</div>
                        <div>{entry.tasks_completed} tasks</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(!leaderboard || leaderboard.length === 0) && (
                <div className="text-center py-12 text-slate-400">
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
