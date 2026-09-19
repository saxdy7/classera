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
  const gradients = ['', '', '', ''];

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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-4 md:p-8">
          <div className="w-full max-w-9xl mx-auto">

            {/* ── Welcome header ──
                Same defect as the student dashboard: body copy inside a solid
                colour banner used text-[var(--cl-primary)] (near-black), which
                was unreadable on the fill. Replaced with the light greeting the
                reference dashboards use. */}
            <div className="cl-rise mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="cl-eyebrow">Dashboard</span>
                <h1 className="mt-2 text-[32px] font-semibold leading-[1.15] tracking-[-0.5px] text-[var(--cl-ink)] md:text-[40px] md:tracking-[-1px]">
                  Hello, {firstName}
                </h1>
                <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-[var(--cl-muted)]">
                  You&rsquo;re mentoring at{' '}
                  <span className="font-semibold text-[var(--cl-ink)]">{universityName}</span>.
                  Guide your students, manage sessions and build communities.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/mentor/communities"
                    className="inline-flex h-11 items-center gap-2 rounded-[var(--cl-r-md)] bg-[var(--cl-primary)] px-5 text-sm font-semibold text-[var(--cl-on-primary)] transition-colors hover:bg-[var(--cl-primary-active)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)]"
                  >
                    <UsersRound className="h-4 w-4" /> Communities
                  </Link>
                  <Link
                    href="/dashboard/mentor/messages"
                    className="inline-flex h-11 items-center gap-2 rounded-[var(--cl-r-md)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] px-5 text-sm font-semibold text-[var(--cl-ink)] transition-colors hover:bg-[var(--cl-canvas-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]"
                  >
                    <MessageSquare className="h-4 w-4" /> Messages
                  </Link>
                </div>
              </div>

              <div className="hidden flex-shrink-0 lg:block">
                <Image
                  src="https://illustrations.popsy.co/amber/man-riding-a-rocket.svg"
                  alt=""
                  width={200}
                  height={200}
                  className="h-44 w-44 object-contain"
                />
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/dashboard/mentor/communities" className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-[var(--cl-r-lg)] bg-[rgba(13,116,206,0.12)] flex items-center justify-center flex-shrink-0">
                  <UsersRound className="w-5 h-5 text-[var(--cl-info)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--cl-ink)] text-sm">Build Communities</h3>
                  <p className="text-xs text-[var(--cl-muted)] mt-0.5">Create learning communities</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--cl-muted-soft)] flex-shrink-0" />
              </Link>

              <Link href="/dashboard/mentor/tests" className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] hover:border-[var(--cl-warning)] transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-[var(--cl-r-lg)] bg-[rgba(171,100,0,0.12)] flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-[var(--cl-warning)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--cl-ink)] text-sm">Create Tests</h3>
                  <p className="text-xs text-[var(--cl-muted)] mt-0.5">Design assessments</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--cl-muted-soft)] flex-shrink-0" />
              </Link>

              <Link href="/dashboard/mentor/students" className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary-soft)] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-[var(--cl-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--cl-ink)] text-sm">Manage Students</h3>
                  <p className="text-xs text-[var(--cl-muted)] mt-0.5">Guide their learning journey</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--cl-muted-soft)] flex-shrink-0" />
              </Link>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

              {/* ── Left Column (2/3) ── */}
              <div className="xl:col-span-2 space-y-8">

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Students" value={students.length || 0} iconBg="bg-[var(--cl-primary-soft)]" iconColor="text-[var(--cl-primary)]" />
                  <StatCard icon={ClipboardCheck} label="Live Tests" value={liveTestsCount} iconBg="bg-[rgba(171,100,0,0.12)]" iconColor="text-[var(--cl-warning)]" />
                  <StatCard icon={Trophy} label="Avg Score" value={avgScore !== null ? `${avgScore}%` : '—'} iconBg="bg-[rgba(22,163,74,0.12)]" iconColor="text-[var(--cl-success)]" />
                  <StatCard icon={MessageSquare} label="Messages" value={conversations.length || 0} iconBg="bg-[var(--cl-primary-soft)]" iconColor="text-[var(--cl-primary)]" />
                </div>

                {/* Submissions Chart + Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-semibold text-[var(--cl-ink)]">Submissions This Week</h2>
                    </div>
                    <p className="text-xs text-[var(--cl-muted)] mb-4">Across all your tests</p>
                    {submissions.length > 0 ? (
                      <ActivityBarChart data={submissionsByDay} color="#6366f1" />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-[var(--cl-muted-soft)]">
                        No submissions yet
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-4 h-4 text-[var(--cl-warning)]" />
                      <h2 className="text-base font-semibold text-[var(--cl-ink)]">Top Students</h2>
                    </div>
                    {topStudents.length > 0 ? (
                      <div className="space-y-3">
                        {topStudents.map((entry, i) => (
                          <div key={entry.student?.id || i} className="flex items-center gap-3">
                            <span className="w-5 text-xs font-semibold text-[var(--cl-muted)]">{i + 1}</span>
                            {entry.student?.avatar_url ? (
                              <img src={entry.student.avatar_url} alt={entry.student.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] text-xs font-semibold flex-shrink-0 bg-[var(--cl-primary)]">
                                {entry.student?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--cl-ink)] truncate">{entry.student?.full_name || 'Student'}</p>
                              <p className="text-xs text-[var(--cl-muted)]">{entry.count} test{entry.count !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-sm font-semibold text-[var(--cl-success)]">{entry.avg}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-[var(--cl-muted-soft)]">
                        No graded submissions yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Students at University */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--cl-ink)]">Students at Your University</h2>
                      <p className="text-xs text-[var(--cl-muted)] mt-0.5">{universityName}</p>
                    </div>
                    <Link href="/dashboard/mentor/students" className="text-sm font-medium text-[var(--cl-primary)] hover:text-[var(--cl-primary)] flex items-center gap-1">
                      View all →
                    </Link>
                  </div>

                  {students.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {students.slice(0, 6).map((student: any, i: number) => (
                        <div key={student.id} className="flex items-center gap-3 p-4 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all group">
                          {student.avatar_url ? (
                            <img src={student.avatar_url} alt={student.full_name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-11 h-11 rounded-full ${gradients[i % gradients.length]} flex items-center justify-center text-[var(--cl-on-dark)] text-sm font-semibold flex-shrink-0`}>
                              {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--cl-ink)] text-sm truncate group-hover:text-[var(--cl-primary)] transition-colors">{student.full_name}</p>
                            <p className="text-xs text-[var(--cl-muted)] truncate mt-0.5">{student.specialization_board || 'Student'}</p>
                            {student.current_semester && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] text-xs font-medium rounded-full">
                                Sem {student.current_semester}
                              </span>
                            )}
                          </div>
                          <Link href={`/dashboard/mentor/messages?userId=${student.id}`}
                              className="flex-shrink-0 px-3 py-1.5 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] text-xs font-semibold rounded-lg hover:bg-[var(--cl-primary)] transition-colors">
                            Message
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[var(--cl-muted-soft)]">
                      <GraduationCap className="w-10 h-10 mx-auto mb-3 text-[var(--cl-muted-soft)]" />
                      <p className="font-medium">No students at your university yet</p>
                      <p className="text-sm mt-1">Students will appear here once they join</p>
                    </div>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-[var(--cl-ink)]">Recent Messages</h2>
                    <Link href="/dashboard/mentor/messages" className="text-sm font-medium text-[var(--cl-primary)] hover:text-[var(--cl-primary)]">
                      View all →
                    </Link>
                  </div>
                  {conversations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conversations.map((conv: any) => (
                        <Link key={conv.id} href={`/dashboard/mentor/messages?userId=${conv.user?.id}`}
                          className="flex items-center gap-3 p-4 rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all group">
                          <div className="relative flex-shrink-0">
                            {conv.user?.avatar_url ? (
                              <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-11 h-11 rounded-full object-cover" />
                            ) : (
                              <div className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] text-sm font-semibold bg-[var(--cl-info)]">
                                {conv.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                            {conv.unread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--cl-error)] rounded-full border-2 border-[var(--cl-on-dark)]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--cl-ink)] text-sm truncate group-hover:text-[var(--cl-primary)] transition-colors">{conv.user?.full_name}</p>
                            <p className="text-xs text-[var(--cl-muted)] truncate mt-0.5">{conv.lastMessage}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-[var(--cl-muted)]">{conv.time}</span>
                            {conv.unread && <span className="text-xs font-medium text-[var(--cl-primary)] bg-[var(--cl-primary-soft)] px-2 py-0.5 rounded-full">New</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[var(--cl-muted-soft)]">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--cl-muted-soft)]" />
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
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-[var(--cl-on-dark)] bg-[var(--cl-info)]">
                      {firstName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--cl-ink)] truncate">{profile.full_name}</p>
                      <p className="text-[var(--cl-muted)] text-xs truncate">
                        {Array.isArray(profile.expertise) ? profile.expertise.slice(0, 2).join(', ') : (profile.expertise || 'Mentor')}
                      </p>
                    </div>
                  </div>
                  <p className="text-[var(--cl-muted)] text-xs leading-relaxed flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/mentor/profile" className="mt-4 block text-center py-2 px-4 bg-[var(--cl-canvas-soft)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] text-sm font-medium rounded-[var(--cl-r-lg)] transition-colors border border-[var(--cl-hairline)]">
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
