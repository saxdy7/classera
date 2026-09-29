import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import RealCalendar from '@/components/shared/RealCalendar';
import { Stat, Section, ItemCard, List, Row, Empty, Badge, btnPrimary, btnSecondary, getGreeting } from '@/components/shell';
import { Stagger, ScrollReveal } from '@/components/motion';
import { ActivityBarChart } from '@/components/dashboard/ActivityBarChart';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, ClipboardCheck, MessageSquare, Trophy, BarChart2,
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
    { href: '/dashboard/mentor/tests/create', icon: ClipboardCheck, title: 'Create a test', category: 'Assessment', description: 'Build a test, invite students and take it live.' },
    { href: '/dashboard/mentor/projects/create', icon: GitBranch, title: 'Assign a project', category: 'Coursework', description: 'Set a build brief with a rubric and deadline.' },
    { href: '/dashboard/mentor/communities/create', icon: UsersRound, title: 'Start a community', category: 'People', description: 'Create a space for discussion and resources.' },
    { href: '/dashboard/mentor/live-sessions', icon: Video, title: 'Host a session', category: 'Teaching', description: 'Schedule a class or open office hours.' },
  ];

  const initials = (name?: string) =>
    name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background">
      <Header
        profile={{ id: user.id, ...profile }}
        title="Home"
        meta={<Badge tone="neutral">{universityName}</Badge>}
      />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">

            {/* ── Greeting ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{getGreeting()}, {firstName}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  Here&rsquo;s how your students are doing.
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href="/dashboard/mentor/messages" className={btnSecondary}>
                  <MessageSquare className="size-4" /> Messages
                </Link>
                <Link href="/dashboard/mentor/tests/create" className={btnPrimary}>
                  <Plus className="size-4" /> New test
                </Link>
              </div>
            </div>

            {/* ── Stats ── */}
            <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4" each={0.05}>
              <Stat label="Students" value={students.length || 0} icon={Users} href="/dashboard/mentor/students" />
              <Stat label="Live tests" value={liveTestsCount} icon={ClipboardCheck} href="/dashboard/mentor/tests" hint={`${tests.length} total`} />
              <Stat label="Average score" value={avgScore !== null ? `${avgScore}%` : '—'} icon={Trophy} href="/dashboard/mentor/analytics" />
              <Stat label="Conversations" value={conversations.length || 0} icon={MessageSquare} href="/dashboard/mentor/messages" />
            </Stagger>

            {/* ── Quick actions ── */}
            <Section title="Quick actions" description="Create something for your students.">
              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" each={0.06}>
                {quickActions.map((a) => (
                  <ItemCard
                    key={a.href}
                    href={a.href}
                    icon={a.icon}
                    title={a.title}
                    category={a.category}
                    description={a.description}
                  />
                ))}
              </Stagger>
            </Section>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
              <div className="space-y-8 xl:col-span-2">

                {/* ── Chart + leaderboard ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">Submissions this week</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Across all your tests</p>
                    {submissions.length > 0 ? (
                      <ActivityBarChart data={submissionsByDay} color="#a855f7" />
                    ) : (
                      <Empty icon={BarChart2} title="No submissions yet" description="Activity appears once students submit." className="py-10" />
                    )}
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Top students</h3>
                      <Link href="/dashboard/mentor/student-analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground">View all</Link>
                    </div>
                    {topStudents.length > 0 ? (
                      <div className="divide-y">
                        {topStudents.map((entry, i) => (
                          <Link
                            key={entry.student?.id || i}
                            href={entry.student?.id ? `/dashboard/mentor/student/${entry.student.id}` : '#'}
                            className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
                          >
                            <span className="w-4 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                            {entry.student?.avatar_url ? (
                              <Image src={entry.student.avatar_url} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full border object-cover" />
                            ) : (
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-[10px] font-semibold text-foreground">{initials(entry.student?.full_name)}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{entry.student?.full_name || 'Student'}</p>
                              <p className="text-xs text-muted-foreground">{entry.count} test{entry.count !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-green-600">{entry.avg}%</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Empty icon={Trophy} title="No graded submissions" description="Rankings appear once tests are graded." className="py-10" />
                    )}
                  </div>
                </div>

                {/* ── Students ── */}
                <ScrollReveal>
                  <Section
                    title="Students at your university"
                    description={universityName}
                    count={students.length || undefined}
                    action={<Link href="/dashboard/mentor/students" className={btnSecondary}>View all</Link>}
                  >
                    {students.length > 0 ? (
                      <List>
                        {students.slice(0, 6).map((student: any) => (
                          <Row
                            key={student.id}
                            href={`/dashboard/mentor/student/${student.id}`}
                            title={student.full_name}
                            description={student.specialization_board || 'Student'}
                            trailing={student.current_semester ? <Badge tone="neutral">Sem {student.current_semester}</Badge> : undefined}
                          />
                        ))}
                      </List>
                    ) : (
                      <Empty icon={GraduationCap} title="No students yet" description="Students will appear here once they join your university." />
                    )}
                  </Section>
                </ScrollReveal>

                {/* ── Messages ── */}
                <ScrollReveal>
                  <Section
                    title="Recent messages"
                    action={<Link href="/dashboard/mentor/messages" className={btnSecondary}>View all</Link>}
                  >
                    {conversations.length > 0 ? (
                      <List>
                        {conversations.map((conv: any) => (
                          <Row
                            key={conv.id}
                            href={`/dashboard/mentor/messages?userId=${conv.user?.id}`}
                            title={conv.user?.full_name ?? 'Conversation'}
                            description={conv.lastMessage}
                            trailing={
                              <>
                                {conv.unread && <Badge tone="accent">New</Badge>}
                                <span className="text-xs text-muted-foreground">{conv.time}</span>
                              </>
                            }
                          />
                        ))}
                      </List>
                    ) : (
                      <Empty icon={MessageSquare} title="No messages yet" description="Your students will reach out soon." />
                    )}
                  </Section>
                </ScrollReveal>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-4">
                <RealCalendar userId={user.id} />

                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full border bg-muted text-sm font-semibold text-foreground">
                      {initials(profile.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{profile.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {Array.isArray(profile.expertise) ? profile.expertise.slice(0, 2).join(', ') : (profile.expertise || 'Mentor')}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="size-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/mentor/settings" className={`${btnSecondary} mt-3 w-full`}>
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
