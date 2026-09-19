import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import RealCalendar from '@/components/shared/RealCalendar';
import { StatCard, SectionHeader, GradientCard, EmptyState, getGreeting, gradientFor, primaryButton, outlineButton } from '@/components/shell';
import { ActivityBarChart } from '@/components/dashboard/ActivityBarChart';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, ClipboardCheck, MessageSquare, Trophy,
  GraduationCap, Target, UsersRound, GitBranch, Video, Plus,
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

  const quickActions = [
    { href: '/dashboard/mentor/tests/create', icon: ClipboardCheck, title: 'Create a test', subtitle: 'Design an assessment' },
    { href: '/dashboard/mentor/projects/create', icon: GitBranch, title: 'Assign a project', subtitle: 'Set a build brief with a rubric' },
    { href: '/dashboard/mentor/communities/create', icon: UsersRound, title: 'Start a community', subtitle: 'Create a learning space' },
    { href: '/dashboard/mentor/live-sessions', icon: Video, title: 'Host a live session', subtitle: 'Schedule a class or office hours' },
  ];

  const initials = (name?: string) =>
    name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-10">

            {/* ── Greeting — aria home page ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&rsquo;re mentoring at <span className="font-medium text-foreground">{universityName}</span>. Guide your students, manage sessions and build communities.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href="/dashboard/mentor/messages" className={outlineButton}>
                  <MessageSquare className="size-3.5" /> Messages
                </Link>
                <Link href="/dashboard/mentor/tests/create" className={primaryButton}>
                  <Plus className="size-4" /> New test
                </Link>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Students" value={students.length || 0} icon={Users} href="/dashboard/mentor/students" />
              <StatCard label="Live tests" value={liveTestsCount} icon={ClipboardCheck} href="/dashboard/mentor/tests" hint={`${tests.length} total`} />
              <StatCard label="Average score" value={avgScore !== null ? `${avgScore}%` : '—'} icon={Trophy} href="/dashboard/mentor/analytics" />
              <StatCard label="Conversations" value={conversations.length || 0} icon={MessageSquare} href="/dashboard/mentor/messages" />
            </div>

            {/* ── Quick actions — looma gradient grid + dashed create tile ── */}
            <section className="space-y-4">
              <SectionHeader icon={Target} title="Quick actions" description="Create something for your students." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((a, i) => (
                  <GradientCard key={a.href} href={a.href} index={i + 4} icon={a.icon} title={a.title} subtitle={a.subtitle} footerLeft="Open" footerRight="→" />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
              <div className="space-y-8 xl:col-span-2">

                {/* ── Submissions chart + Top students ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Submissions this week</h2>
                    <p className="mb-4 text-xs text-muted-foreground">Across all your tests</p>
                    {submissions.length > 0 ? (
                      <ActivityBarChart data={submissionsByDay} color="#a855f7" />
                    ) : (
                      <div className="flex h-[180px] items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">No submissions yet</div>
                    )}
                  </div>

                  <div className="rounded-xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Trophy className="size-4 text-amber-500" />
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">Top students</h2>
                    </div>
                    {topStudents.length > 0 ? (
                      <div className="divide-y overflow-hidden rounded-lg border">
                        {topStudents.map((entry, i) => (
                          <Link key={entry.student?.id || i} href={entry.student?.id ? `/dashboard/mentor/student/${entry.student.id}` : '#'} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40">
                            <span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                            {entry.student?.avatar_url ? (
                              <Image src={entry.student.avatar_url} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full border object-cover" />
                            ) : (
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold text-primary">{initials(entry.student?.full_name)}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground group-hover:text-accent-purple">{entry.student?.full_name || 'Student'}</p>
                              <p className="text-xs text-muted-foreground">{entry.count} test{entry.count !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-green-600">{entry.avg}%</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-[180px] items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">No graded submissions yet</div>
                    )}
                  </div>
                </div>

                {/* ── Students at university — looma gradient cards ── */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={GraduationCap}
                    title="Students at your university"
                    description={universityName}
                    action={<Link href="/dashboard/mentor/students" className={outlineButton}>View all</Link>}
                  />
                  {students.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {students.slice(0, 6).map((student: any, i: number) => (
                        <Link
                          key={student.id}
                          href={`/dashboard/mentor/student/${student.id}`}
                          className={`group relative block h-[180px] overflow-hidden rounded-xl border bg-linear-to-br p-4 transition-transform hover:scale-[1.02] ${gradientFor(i + 1)}`}
                        >
                          <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl" />
                          <div className="relative flex items-start gap-3">
                            {student.avatar_url ? (
                              <Image src={student.avatar_url} alt="" width={44} height={44} className="size-11 rounded-full border-2 border-white/70 object-cover shadow-xs" />
                            ) : (
                              <div className="flex size-11 items-center justify-center rounded-full border-2 border-white/70 bg-white/60 text-sm font-semibold text-foreground shadow-xs">
                                {initials(student.full_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{student.full_name}</p>
                              <p className="truncate text-xs text-foreground/70">{student.specialization_board || 'Student'}</p>
                            </div>
                          </div>
                          {student.current_semester && (
                            <span className="relative mt-3 inline-block rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              Semester {student.current_semester}
                            </span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/10 px-3 py-2.5 text-[11px] font-medium text-foreground/80 backdrop-blur-xs">
                            <span>Student</span>
                            <span className="text-accent-purple group-hover:underline">View profile →</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={GraduationCap} title="No students at your university yet" description="Students will appear here once they join." />
                  )}
                </section>

                {/* ── Recent messages ── */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={MessageSquare}
                    title="Recent messages"
                    action={<Link href="/dashboard/mentor/messages" className={outlineButton}>View all</Link>}
                  />
                  {conversations.length > 0 ? (
                    <div className="divide-y overflow-hidden rounded-lg border bg-card">
                      {conversations.map((conv: any) => (
                        <Link key={conv.id} href={`/dashboard/mentor/messages?userId=${conv.user?.id}`} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                          <div className="relative shrink-0">
                            {conv.user?.avatar_url ? (
                              <Image src={conv.user.avatar_url} alt="" width={36} height={36} className="size-9 rounded-full border object-cover" />
                            ) : (
                              <div className="flex size-9 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold text-primary">{initials(conv.user?.full_name)}</div>
                            )}
                            {conv.unread && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-accent-purple ring-2 ring-card" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-accent-purple">{conv.user?.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">{conv.time}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={MessageSquare} title="No messages yet" description="Your students will reach out soon." />
                  )}
                </section>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-6">
                <RealCalendar userId={user.id} />

                <div className="rounded-xl border bg-card p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full border bg-primary/10 text-base font-semibold text-primary">
                      {firstName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{profile.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {Array.isArray(profile.expertise) ? profile.expertise.slice(0, 2).join(', ') : (profile.expertise || 'Mentor')}
                      </p>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="size-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/mentor/settings" className={`${outlineButton} mt-4 w-full justify-center`}>
                    Edit profile
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
