import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import RealCalendar from '@/components/shared/RealCalendar';
import Link from 'next/link';
import Image from 'next/image';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-24 p-4 md:p-8 max-w-screen-xl">

          {/* ── Welcome Banner ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-purple-200">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-24" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium mb-1">Welcome back 👋</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">Hello, {firstName}!</h1>
                <p className="text-purple-100 text-sm md:text-base max-w-md leading-relaxed">
                  You're studying at <span className="font-semibold text-white">{universityName}</span>.
                  Keep up the great work — your mentors are ready to help!
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/dashboard/student/courses" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 font-semibold rounded-xl text-sm hover:bg-purple-50 transition-colors shadow-sm">
                    📚 My Courses
                  </Link>
                  <Link href="/dashboard/student/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl text-sm hover:bg-white/30 transition-colors border border-white/30">
                    💬 Messages
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

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* ── Left Column (2/3) ── */}
            <div className="xl:col-span-2 space-y-8">

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Courses', value: courseCount, icon: '📚', color: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
                  { label: 'Mentors', value: mentors.length || '—', icon: '👨‍🏫', color: 'bg-purple-50 text-purple-700', border: 'border-purple-100' },
                  { label: 'Messages', value: conversations.length || '—', icon: '💬', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
                  { label: 'Sessions', value: sessionCount, icon: '🎯', color: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-white rounded-2xl p-5 border ${stat.border} shadow-sm hover:shadow-md transition-shadow`}>
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg ${stat.color} mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recommended Mentors */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Recommended Mentors</h2>
                    <p className="text-sm text-slate-500 mt-0.5">From {universityName}</p>
                  </div>
                  <Link href="/dashboard/student/mentors" className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    View all <span>→</span>
                  </Link>
                </div>

                {mentors.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {mentors.map((mentor: any, i: number) => (
                      <div key={mentor.id} className="flex-shrink-0 w-56 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                        {/* Color bar */}
                        <div className={`h-16 bg-gradient-to-br ${gradients[i % gradients.length]}`} />
                        <div className="p-4 -mt-8">
                          {mentor.avatar_url ? (
                            <img src={mentor.avatar_url} alt={mentor.full_name} className="w-14 h-14 rounded-full border-3 border-white object-cover shadow-md mb-3" />
                          ) : (
                            <div className={`w-14 h-14 rounded-full border-3 border-white bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-lg font-bold shadow-md mb-3`}>
                              {mentor.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{mentor.full_name}</h3>
                          <p className="text-xs text-purple-600 font-medium mt-0.5 truncate">{mentor.specialization_board || 'Mentor'}</p>
                          <div className="flex items-center gap-1 mt-1 mb-3">
                            <span className="text-amber-400 text-xs">★</span>
                            <span className="text-xs font-semibold text-slate-700">{ratings[i % ratings.length]}</span>
                          </div>
                          <Link href={`/dashboard/student/messages?userId=${mentor.id}`} className="block w-full text-center py-1.5 px-3 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                            Connect
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-3">👨‍🏫</div>
                    <p className="font-medium">No mentors at your university yet</p>
                    <p className="text-sm mt-1">Check back soon</p>
                  </div>
                )}
              </div>

              {/* Recent Messages */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Recent Messages</h2>
                  <Link href="/dashboard/student/messages" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                    View all →
                  </Link>
                </div>
                {conversations.length > 0 ? (
                  <div className="space-y-3">
                    {conversations.map((conv: any) => (
                      <Link key={conv.id} href={`/dashboard/student/messages?userId=${conv.user?.id}`}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="relative flex-shrink-0">
                          {conv.user?.avatar_url ? (
                            <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-11 h-11 rounded-full object-cover" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {conv.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </div>
                          )}
                          {conv.unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-purple-700 transition-colors">{conv.user?.full_name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{conv.time}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <div className="text-4xl mb-3">💬</div>
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
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-lg font-bold shadow-lg">
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{profile.full_name}</p>
                    <p className="text-slate-400 text-xs">{profile.specialization_board || 'Student'}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{universityName}</p>
                <Link href="/dashboard/student/profile" className="mt-4 block text-center py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors border border-white/10">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
      <FloatingAIAssistant quizCompleted={profile?.quiz_completed ?? false} />
    </div>
  );
}
