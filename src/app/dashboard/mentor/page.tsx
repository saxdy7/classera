import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import RealCalendar from '@/components/shared/RealCalendar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityBarChart } from '@/components/dashboard/ActivityBarChart';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, ClipboardCheck, MessageSquare, Trophy,
  ArrowUpRight, GraduationCap, Target, UsersRound,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MentorDashboard() {
  const supabase = await createClient();

  // Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/signin');

  // Profile — check if properly completed
  let profile: any = null;
  let students: any[] = [];
  let conversations: any[] = [];
  let tests: any[] = [];
  let submissions: any[] = [];

  try {
    const { data } = await supabase
      .from('users')
      .select('*, universities(name)')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (_) { }

  // If profile is incomplete, redirect to onboarding
  if (!profile) {
    redirect('/onboarding/mentor');
  }

  if (!profile.full_name?.trim() || !profile.university_id) {
    redirect('/onboarding/mentor');
  }

  // Fetch students (non-fatal)
  try {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, specialization_board, current_semester')
      .eq('role', 'student')
      .eq('university_id', profile.university_id)
      .order('full_name')
      .limit(8);
    students = data || [];
  } catch (_) { }

  // Fetch this mentor's tests and submissions (non-fatal) — drives KPIs, chart, leaderboard
  try {
    const { data } = await supabase
      .from('tests')
      .select('id, title, is_live')
      .eq('mentor_id', user.id);
    tests = data || [];

    const testIds = tests.map((t) => t.id);
    if (testIds.length > 0) {
      const { data: subs } = await supabase
        .from('test_submissions')
        .select('id, test_id, student_id, percentage, submitted_at, student:users!test_submissions_student_id_fkey(id, full_name, avatar_url)')
        .in('test_id', testIds)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(200);
      submissions = subs || [];
    }
  } catch (_) { }

  // Fetch recent conversations (non-fatal)
  try {
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)
      .limit(5);

    if (myConvs && myConvs.length > 0) {
      for (const { conversation_id } of myConvs) {
        try {
          const { data: otherPs } = await supabase
            .from('conversation_participants')
            .select('users!conversation_participants_user_id_fkey(id, full_name, avatar_url)')
            .eq('conversation_id', conversation_id)
            .neq('user_id', user.id)
            .limit(1)
            .single();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, read_by, sender_id')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (otherPs && lastMsg) {
            const other = (otherPs as any).users;
            conversations.push({
              id: conversation_id,
              user: other,
              lastMessage: lastMsg.content,
              time: new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: !lastMsg.read_by?.includes?.(user.id) && lastMsg.sender_id !== user.id,
            });
          }
        } catch (_) { }
      }
    }
  } catch (_) { }

  const firstName = profile.full_name?.split(' ')[0] || 'Mentor';
  const universityName = profile.universities?.name || 'your university';
  const gradients = ['from-blue-400 to-indigo-500', 'from-cyan-400 to-teal-500', 'from-violet-400 to-purple-500', 'from-sky-400 to-blue-500'];

  // ── Derived metrics ──
  const liveTestsCount = tests.filter((t) => t.is_live).length;
  const avgScore = submissions.length
    ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
    : null;

  // Submissions per day, last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const submissionsByDay = last7Days.map((d) => ({
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    submissions: submissions.filter((s) => new Date(s.submitted_at).toDateString() === d.toDateString()).length,
  }));

  // Top performing students (by avg % across this mentor's tests)
  const studentStatsMap: Record<string, { student: any; total: number; count: number }> = {};
  submissions.forEach((s: any) => {
    const sid = s.student_id;
    if (!studentStatsMap[sid]) studentStatsMap[sid] = { student: s.student, total: 0, count: 0 };
    studentStatsMap[sid].total += s.percentage || 0;
    studentStatsMap[sid].count += 1;
  });
  const topStudents = Object.values(studentStatsMap)
    .map((s) => ({ student: s.student, avg: Math.round(s.total / s.count), count: s.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-4 md:p-8">
          <div className="w-full max-w-9xl mx-auto">

            {/* ── Welcome Banner ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-indigo-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-24" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back</p>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">Hello, {firstName}</h1>
                  <p className="text-indigo-100 text-sm md:text-base max-w-md leading-relaxed">
                    You're mentoring at <span className="font-semibold text-white">{universityName}</span>.
                    Guide your students, manage sessions, and build impactful communities.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <Link href="/dashboard/mentor/communities" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-sm">
                      <UsersRound className="w-4 h-4" /> Communities
                    </Link>
                    <Link href="/dashboard/mentor/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-colors border border-white/30">
                      <MessageSquare className="w-4 h-4" /> Messages
                    </Link>
                  </div>
                </div>
                <div className="hidden lg:block flex-shrink-0">
                  <Image
                    src="https://illustrations.popsy.co/amber/man-riding-a-rocket.svg"
                    alt="Mentor"
                    width={200}
                    height={200}
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/dashboard/mentor/communities" className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <UsersRound className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">Build Communities</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Create learning communities</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>

              <Link href="/dashboard/mentor/tests" className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:border-amber-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">Create Tests</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Design assessments</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>

              <Link href="/dashboard/mentor/students" className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:border-pink-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">Manage Students</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Guide their learning journey</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

              {/* ── Left Column (2/3) ── */}
              <div className="xl:col-span-2 space-y-8">

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Students" value={students.length || 0} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                  <StatCard icon={ClipboardCheck} label="Live Tests" value={liveTestsCount} iconBg="bg-amber-50" iconColor="text-amber-600" />
                  <StatCard icon={Trophy} label="Avg Score" value={avgScore !== null ? `${avgScore}%` : '—'} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                  <StatCard icon={MessageSquare} label="Messages" value={conversations.length || 0} iconBg="bg-violet-50" iconColor="text-violet-600" />
                </div>

                {/* Submissions Chart + Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-semibold text-slate-900">Submissions This Week</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Across all your tests</p>
                    {submissions.length > 0 ? (
                      <ActivityBarChart data={submissionsByDay} color="#6366f1" />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                        No submissions yet
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <h2 className="text-base font-semibold text-slate-900">Top Students</h2>
                    </div>
                    {topStudents.length > 0 ? (
                      <div className="space-y-3">
                        {topStudents.map((entry, i) => (
                          <div key={entry.student?.id || i} className="flex items-center gap-3">
                            <span className="w-5 text-xs font-semibold text-slate-400">{i + 1}</span>
                            {entry.student?.avatar_url ? (
                              <img src={entry.student.avatar_url} alt={entry.student.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {entry.student?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{entry.student?.full_name || 'Student'}</p>
                              <p className="text-xs text-slate-500">{entry.count} test{entry.count !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">{entry.avg}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                        No graded submissions yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Students at University */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Students at Your University</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{universityName}</p>
                    </div>
                    <Link href="/dashboard/mentor/students" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      View all →
                    </Link>
                  </div>

                  {students.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {students.slice(0, 6).map((student: any, i: number) => (
                        <div key={student.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-sm hover:border-indigo-200 transition-all group">
                          {student.avatar_url ? (
                            <img src={student.avatar_url} alt={student.full_name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                              {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{student.full_name}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{student.specialization_board || 'Student'}</p>
                            {student.current_semester && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                                Sem {student.current_semester}
                              </span>
                            )}
                          </div>
                          <Link href={`/dashboard/mentor/messages?userId=${student.id}`}
                              className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                            Message
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No students at your university yet</p>
                      <p className="text-sm mt-1">Students will appear here once they join</p>
                    </div>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-slate-900">Recent Messages</h2>
                    <Link href="/dashboard/mentor/messages" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      View all →
                    </Link>
                  </div>
                  {conversations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conversations.map((conv: any) => (
                        <Link key={conv.id} href={`/dashboard/mentor/messages?userId=${conv.user?.id}`}
                          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:shadow-sm hover:border-indigo-200 transition-all group">
                          <div className="relative flex-shrink-0">
                            {conv.user?.avatar_url ? (
                              <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-11 h-11 rounded-full object-cover" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                                {conv.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                            {conv.unread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{conv.user?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-slate-400">{conv.time}</span>
                            {conv.unread && <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">New</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mt-1">Your students will reach out soon</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right Column (1/3) ── */}
              <div className="space-y-6">
                <RealCalendar userId={user.id} />

                {/* Profile Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-lg font-semibold text-white shadow-sm">
                      {firstName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{profile.full_name}</p>
                      <p className="text-slate-500 text-xs truncate">
                        {Array.isArray(profile.expertise) ? profile.expertise.slice(0, 2).join(', ') : (profile.expertise || 'Mentor')}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/mentor/profile" className="mt-4 block text-center py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-200">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
