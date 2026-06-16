import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import RealCalendar from '@/components/shared/RealCalendar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Users, MessageSquare, Target,
  ArrowUpRight, Briefcase, Map, ClipboardCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentDashboard() {
  const supabase = await createClient();

  // Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/signin');

  // Profile — wrap in try/catch so a DB failure shows a degraded UI, not a 500
  let profile: any = null;
  let mentors: any[] = [];
  let conversations: any[] = [];
  let submissions: any[] = [];

  try {
    const { data } = await supabase
      .from('users')
      .select('*, universities(name)')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (_) { }

  // Redirect to onboarding if profile not set up
  if (!profile || !profile.full_name || !profile.university_id) {
    redirect('/onboarding/student');
  }

  // Fetch mentors (non-fatal)
  try {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, specialization_board, bio')
      .eq('role', 'mentor')
      .eq('university_id', profile.university_id)
      .order('full_name')
      .limit(8);
    mentors = data || [];
  } catch (_) { }

  // Fetch this student's test submissions (non-fatal) — drives KPIs, score trend, recent results
  try {
    const { data } = await supabase
      .from('test_submissions')
      .select('id, test_id, percentage, score, max_score, submitted_at, test:tests(id, title)')
      .eq('student_id', user.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: true })
      .limit(50);
    submissions = data || [];
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

  // Fetch real counts (non-fatal)
  let courseCount: number | string = '—';
  let sessionCount: number | string = '—';
  try {
    const { count: cc } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id);
    if (cc !== null) courseCount = cc;
  } catch (_) { }
  try {
    const { count: sc } = await supabase
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (sc !== null) sessionCount = sc;
  } catch (_) { }

  const firstName = profile.full_name?.split(' ')[0] || 'Student';
  const universityName = profile.universities?.name || 'your university';
  const gradients = ['from-violet-400 to-purple-500', 'from-cyan-400 to-blue-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500'];
  const ratings = ['4.8', '4.6', '4.9', '4.7', '4.5', '5.0', '4.3', '4.8'];

  // ── Derived metrics ──
  const avgScore = submissions.length
    ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
    : null;

  const scoreTrend = submissions.slice(-8).map((s: any, i: number) => {
    const title = s.test?.title || `Test ${i + 1}`;
    return { label: title.length > 10 ? `${title.slice(0, 10)}…` : title, score: Math.round(s.percentage || 0) };
  });

  const recentResults = [...submissions].slice(-5).reverse();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-24 p-4 md:p-8">
          <div className="w-full max-w-9xl mx-auto">

            {/* ── Welcome Banner ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-purple-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-24" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium mb-1">Welcome back</p>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">Hello, {firstName}</h1>
                  <p className="text-purple-100 text-sm md:text-base max-w-md leading-relaxed">
                    You're studying at <span className="font-semibold text-white">{universityName}</span>.
                    Keep up the great work — your mentors are ready to help.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <Link href="/dashboard/student/courses" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 font-semibold rounded-xl text-sm hover:bg-purple-50 transition-colors shadow-sm">
                      <BookOpen className="w-4 h-4" /> My Courses
                    </Link>
                    <Link href="/dashboard/student/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-colors border border-white/30">
                      <MessageSquare className="w-4 h-4" /> Messages
                    </Link>
                  </div>
                </div>
                <div className="hidden lg:block flex-shrink-0">
                  <Image
                    src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                    alt="Student"
                    width={200}
                    height={200}
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/ai-tools/career-coach" className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">AI Career Coach</h3>
                  <p className="text-xs text-slate-500 mt-0.5">AI-guided career wisdom</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>

              <Link href="/roadmaps" className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:border-amber-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Map className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">AI Roadmap Maker</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Chart your personalized path</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>

              <Link href="/dashboard/student/find-mentors" className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:border-pink-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">Connect Mentors</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Learn from those ahead of you</p>
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
                  <StatCard icon={BookOpen} label="Courses" value={courseCount} iconBg="bg-blue-50" iconColor="text-blue-600" />
                  <StatCard icon={ClipboardCheck} label="Tests Taken" value={submissions.length || 0} iconBg="bg-purple-50" iconColor="text-purple-600" />
                  <StatCard icon={Target} label="Avg Score" value={avgScore !== null ? `${avgScore}%` : '—'} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                  <StatCard icon={MessageSquare} label="Sessions" value={sessionCount} iconBg="bg-amber-50" iconColor="text-amber-600" />
                </div>

                {/* Score Trend + Recent Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-semibold text-slate-900">My Score Trend</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Last {scoreTrend.length} graded test{scoreTrend.length !== 1 ? 's' : ''}</p>
                    {scoreTrend.length > 0 ? (
                      <ScoreTrendChart data={scoreTrend} color="#9333ea" />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                        No graded tests yet
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-slate-900">Recent Results</h2>
                      <Link href="/dashboard/student/tests" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                        View all →
                      </Link>
                    </div>
                    {recentResults.length > 0 ? (
                      <div className="space-y-3">
                        {recentResults.map((r: any) => (
                          <Link key={r.id} href={`/dashboard/student/tests/${r.test_id}/results`} className="flex items-center justify-between gap-3 hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{r.test?.title || 'Test'}</p>
                              <p className="text-xs text-slate-500">{new Date(r.submitted_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-sm font-semibold flex-shrink-0 ${(r.percentage || 0) >= 70 ? 'text-emerald-600' : (r.percentage || 0) >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {Math.round(r.percentage || 0)}%
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                        No test results yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended Mentors */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Recommended Mentors</h2>
                      <p className="text-xs text-slate-500 mt-0.5">From {universityName}</p>
                    </div>
                    <Link href="/dashboard/student/mentors" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                      View all <span>→</span>
                    </Link>
                  </div>

                  {mentors.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                      {mentors.map((mentor: any, i: number) => (
                        <div key={mentor.id} className="flex-shrink-0 w-56 bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className={`h-1.5 bg-gradient-to-r ${gradients[i % gradients.length]}`} />
                          <div className="p-5">
                            {mentor.avatar_url ? (
                              <img src={mentor.avatar_url} alt={mentor.full_name} className="w-12 h-12 rounded-full object-cover mb-3" />
                            ) : (
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-sm font-semibold mb-3`}>
                                {mentor.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{mentor.full_name}</h3>
                            <p className="text-xs text-purple-600 font-medium mt-1 truncate">{mentor.specialization_board || 'Mentor'}</p>
                            <div className="flex items-center gap-1 mt-2 mb-4">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-xs font-semibold text-slate-700">{ratings[i % ratings.length]}</span>
                              <span className="text-xs text-slate-500">(Top Rated)</span>
                            </div>
                            <Link href={`/dashboard/student/messages?userId=${mentor.id}`} className="block w-full text-center py-2 px-3 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                              Connect
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No mentors at your university yet</p>
                      <p className="text-sm mt-1">Check back soon</p>
                    </div>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-slate-900">Recent Messages</h2>
                    <Link href="/dashboard/student/messages" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                      View all →
                    </Link>
                  </div>
                  {conversations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conversations.map((conv: any) => (
                        <Link key={conv.id} href={`/dashboard/student/messages?userId=${conv.user?.id}`}
                          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:shadow-sm hover:border-purple-200 transition-all group">
                          <div className="relative flex-shrink-0">
                            {conv.user?.avatar_url ? (
                              <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-11 h-11 rounded-full object-cover" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                {conv.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                            {conv.unread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate group-hover:text-purple-700 transition-colors">{conv.user?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-slate-400">{conv.time}</span>
                            {conv.unread && <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">New</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mt-1">Connect with a mentor to get started</p>
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-lg font-semibold text-white shadow-sm">
                      {firstName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{profile.full_name}</p>
                      <p className="text-slate-500 text-xs truncate">{profile.specialization_board || 'Student'}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/student/profile" className="mt-4 block text-center py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-200">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <FloatingAIAssistant quizCompleted={profile?.quiz_completed ?? false} />
    </div>
  );
}
