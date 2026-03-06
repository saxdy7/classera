import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import RealCalendar from '@/components/shared/RealCalendar';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MentorDashboard() {
  const supabase = await createClient();

  // Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/signin');

  // Profile — non-fatal
  let profile: any = null;
  let students: any[] = [];
  let conversations: any[] = [];

  try {
    const { data } = await supabase
      .from('users')
      .select('*, universities(name)')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (_) { }

  if (!profile || !profile.full_name || !profile.university_id) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-4 md:p-8 max-w-screen-xl">

          {/* ── Welcome Banner ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-24" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back 👋</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">Hello, {firstName}!</h1>
                <p className="text-indigo-100 text-sm md:text-base max-w-md leading-relaxed">
                  You're mentoring at <span className="font-semibold text-white">{universityName}</span>.
                  Guide your students, manage sessions, and build impactful communities.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/dashboard/mentor/communities" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-sm">
                    👥 Communities
                  </Link>
                  <Link href="/dashboard/mentor/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl text-sm hover:bg-white/30 transition-colors border border-white/30">
                    💬 Messages
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

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* ── Left Column (2/3) ── */}
            <div className="xl:col-span-2 space-y-8">

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Students', value: students.length || '—', icon: '🎓', color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-100' },
                  { label: 'Courses', value: '—', icon: '📚', color: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
                  { label: 'Messages', value: conversations.length || '—', icon: '💬', color: 'bg-violet-50 text-violet-700', border: 'border-violet-100' },
                  { label: 'Sessions', value: '—', icon: '🎥', color: 'bg-cyan-50 text-cyan-700', border: 'border-cyan-100' },
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

              {/* Students at University */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Students at Your University</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{universityName}</p>
                  </div>
                  <Link href="/dashboard/mentor/students" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    View all →
                  </Link>
                </div>

                {students.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {students.slice(0, 6).map((student: any, i: number) => (
                      <div key={student.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt={student.full_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                            {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{student.full_name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{student.specialization_board || 'Student'}</p>
                          {student.current_semester && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
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
                    <div className="text-4xl mb-3">🎓</div>
                    <p className="font-medium">No students at your university yet</p>
                    <p className="text-sm mt-1">Students will appear here once they join</p>
                  </div>
                )}
              </div>

              {/* Recent Messages */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Recent Messages</h2>
                  <Link href="/dashboard/mentor/messages" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    View all →
                  </Link>
                </div>
                {conversations.length > 0 ? (
                  <div className="space-y-3">
                    {conversations.map((conv: any) => (
                      <Link key={conv.id} href={`/dashboard/mentor/messages?userId=${conv.user?.id}`}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="relative flex-shrink-0">
                          {conv.user?.avatar_url ? (
                            <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-11 h-11 rounded-full object-cover" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                              {conv.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </div>
                          )}
                          {conv.unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{conv.user?.full_name}</p>
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
                    <p className="text-sm mt-1">Your students will reach out soon</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column (1/3) ── */}
            <div className="space-y-6">
              <RealCalendar userId={user.id} />

              {/* Quick Links */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Access</h3>
                <nav className="space-y-2">
                  {[
                    { href: '/dashboard/mentor/students',     icon: '🎓', label: 'My Students' },
                    { href: '/dashboard/mentor/communities',  icon: '👥', label: 'Communities' },
                    { href: '/dashboard/mentor/tests',        icon: '📝', label: 'Tests & Quizzes' },
                    { href: '/dashboard/mentor/question-bank',icon: '📚', label: 'Question Bank' },
                    { href: '/dashboard/mentor/analytics',    icon: '📊', label: 'Analytics' },
                    { href: '/dashboard/mentor/live-sessions',icon: '🎥', label: 'Live Sessions' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all text-sm font-medium group">
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                      <span className="ml-auto text-slate-300 group-hover:text-indigo-400">→</span>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Profile Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-lg font-bold shadow-lg">
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{profile.full_name}</p>
                    <p className="text-slate-400 text-xs">
                      {Array.isArray(profile.expertise) ? profile.expertise.slice(0, 2).join(', ') : (profile.expertise || 'Mentor')}
                    </p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{universityName}</p>
                <Link href="/dashboard/mentor/profile" className="mt-4 block text-center py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors border border-white/10">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
