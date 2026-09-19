import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import RealCalendar from '@/components/shared/RealCalendar';
import { StatCard, SectionHeader, GradientCard, EmptyState, getGreeting, gradientFor, primaryButton, outlineButton } from '@/components/shell';
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

  // ── Data fetch ──
  // These four queries are independent of one another, so they run together.
  // They used to await sequentially, and the conversations block additionally
  // issued 2 queries per conversation (an N+1), giving ~14 sequential
  // round-trips before the page could render.
  let courseCount: number | string = '—';
  let sessionCount: number | string = '—';

  const [mentorsRes, submissionsRes, courseCountRes, sessionCountRes, convIdsRes] =
    await Promise.allSettled([
      supabase
        .from('users')
        .select('id, full_name, avatar_url, specialization_board, bio')
        .eq('role', 'mentor')
        .eq('university_id', profile.university_id)
        .order('full_name')
        .limit(8),
      supabase
        .from('test_submissions')
        .select('id, test_id, percentage, score, max_score, submitted_at, test:tests(id, title)')
        .eq('student_id', user.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: true })
        .limit(50),
      supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id),
      supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .limit(5),
    ]);

  if (mentorsRes.status === 'fulfilled') mentors = mentorsRes.value.data || [];
  if (submissionsRes.status === 'fulfilled') submissions = submissionsRes.value.data || [];
  if (courseCountRes.status === 'fulfilled' && courseCountRes.value.count !== null) {
    courseCount = courseCountRes.value.count;
  }
  if (sessionCountRes.status === 'fulfilled' && sessionCountRes.value.count !== null) {
    sessionCount = sessionCountRes.value.count;
  }

  // Conversations: fan out over the ids in parallel instead of looping.
  if (convIdsRes.status === 'fulfilled') {
    const convIds = (convIdsRes.value.data || []).map((c: any) => c.conversation_id);
    const perConv = await Promise.allSettled(
      convIds.map(async (conversation_id: string) => {
        const [others, last] = await Promise.all([
          supabase
            .from('conversation_participants')
            .select('users!conversation_participants_user_id_fkey(id, full_name, avatar_url)')
            .eq('conversation_id', conversation_id)
            .neq('user_id', user.id)
            .limit(1)
            .single(),
          supabase
            .from('messages')
            .select('content, created_at, read_by, sender_id')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
        ]);
        if (!others.data || !last.data) return null;
        return {
          id: conversation_id,
          user: (others.data as any).users,
          lastMessage: last.data.content,
          time: new Date(last.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: !last.data.read_by?.includes?.(user.id) && last.data.sender_id !== user.id,
        };
      })
    );
    conversations = perConv
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter(Boolean);
  }

  const firstName = profile.full_name?.split(' ')[0] || 'Student';
  const universityName = profile.universities?.name || 'your university';

  // ── Derived metrics ──
  const avgScore = submissions.length
    ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
    : null;

  const scoreTrend = submissions.slice(-8).map((s: any, i: number) => {
    const title = s.test?.title || `Test ${i + 1}`;
    return { label: title.length > 10 ? `${title.slice(0, 10)}…` : title, score: Math.round(s.percentage || 0) };
  });

  const recentResults = [...submissions].slice(-5).reverse();

  const quickActions = [
    { href: '/ai-tools/career-coach', icon: Briefcase, title: 'AI Career Coach', subtitle: 'AI-guided career wisdom' },
    { href: '/roadmaps', icon: Map, title: 'AI Roadmap Maker', subtitle: 'Chart your personalized path' },
    { href: '/dashboard/student/find-mentors', icon: Users, title: 'Connect Mentors', subtitle: 'Learn from those ahead of you' },
    { href: '/dashboard/student/courses', icon: BookOpen, title: 'My Courses', subtitle: `${courseCount} enrolled` },
  ];

  const initials = (name?: string) =>
    name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-10">

            {/* ── Greeting — aria home page ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&rsquo;re studying at <span className="font-medium text-foreground">{universityName}</span>. Your mentors are ready to help.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href="/dashboard/student/messages" className={outlineButton}>
                  <MessageSquare className="size-3.5" /> Messages
                </Link>
                <Link href="/dashboard/student/courses" className={primaryButton}>
                  <BookOpen className="size-4" /> My Courses
                </Link>
              </div>
            </div>

            {/* ── Brief card — aria "Morning Brief" ── */}
            <Link
              href="/ai-tools/career-coach"
              className="flex min-h-[100px] items-center gap-5 rounded-xl border bg-linear-to-br from-transparent via-accent-purple/5 to-accent-purple/20 p-5 transition-colors hover:to-accent-purple/25"
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-linear-to-br from-white to-purple-400">
                <Briefcase className="size-6 text-white drop-shadow" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">AI Career Coach</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Personalised guidance built from your tests, courses and goals. Ask it what to work on next.
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-3 sm:flex">
                <span className="text-xs text-muted-foreground">Open coach</span>
                <ArrowUpRight className="size-4 text-accent-purple" />
              </div>
            </Link>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Courses" value={courseCount} icon={BookOpen} href="/dashboard/student/courses" />
              <StatCard label="Tests taken" value={submissions.length || 0} icon={ClipboardCheck} href="/dashboard/student/tests" />
              <StatCard label="Average score" value={avgScore !== null ? `${avgScore}%` : '—'} icon={Target} href="/dashboard/student/tests" />
              <StatCard label="Sessions" value={sessionCount} icon={MessageSquare} href="/dashboard/student/sessions" />
            </div>

            {/* ── Quick actions — looma "My Workspaces" gradient grid ── */}
            <section className="space-y-4">
              <SectionHeader
                icon={Target}
                title="Quick actions"
                description="Jump back into the tools you use most."
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((a, i) => (
                  <GradientCard key={a.href} href={a.href} index={i + 2} icon={a.icon} title={a.title} subtitle={a.subtitle} footerLeft="Open" footerRight="→" />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
              <div className="space-y-8 xl:col-span-2">

                {/* ── Score trend + Recent results ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Score trend</h2>
                    <p className="mb-4 text-xs text-muted-foreground">Last {scoreTrend.length} graded test{scoreTrend.length !== 1 ? 's' : ''}</p>
                    {scoreTrend.length > 0 ? (
                      <ScoreTrendChart data={scoreTrend} color="#a855f7" />
                    ) : (
                      <div className="flex h-[180px] items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">No graded tests yet</div>
                    )}
                  </div>

                  <div className="rounded-xl border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent results</h2>
                      <Link href="/dashboard/student/tests" className={outlineButton}>View all</Link>
                    </div>
                    {recentResults.length > 0 ? (
                      <div className="divide-y overflow-hidden rounded-lg border">
                        {recentResults.map((r: any) => {
                          const pct = Math.round(r.percentage || 0);
                          const tone = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-destructive';
                          return (
                            <Link key={r.id} href={`/dashboard/student/tests/${r.test_id}/results`} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground group-hover:text-accent-purple">{r.test?.title || 'Test'}</p>
                                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</p>
                              </div>
                              <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone}`}>{pct}%</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-[180px] items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">No test results yet</div>
                    )}
                  </div>
                </div>

                {/* ── Recommended mentors — looma gradient cards ── */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={Users}
                    title="Recommended mentors"
                    description={`From ${universityName}`}
                    action={<Link href="/dashboard/student/find-mentors" className={outlineButton}>View all</Link>}
                  />
                  {mentors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {mentors.slice(0, 6).map((mentor: any, i: number) => (
                        <Link
                          key={mentor.id}
                          href={`/dashboard/student/mentor/${mentor.id}`}
                          className={`group relative block h-[180px] overflow-hidden rounded-xl border bg-linear-to-br p-4 transition-transform hover:scale-[1.02] ${gradientFor(i)}`}
                        >
                          <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl" />
                          <div className="relative flex items-start gap-3">
                            {mentor.avatar_url ? (
                              <Image src={mentor.avatar_url} alt="" width={44} height={44} className="size-11 rounded-full border-2 border-white/70 object-cover shadow-xs" />
                            ) : (
                              <div className="flex size-11 items-center justify-center rounded-full border-2 border-white/70 bg-white/60 text-sm font-semibold text-foreground shadow-xs">
                                {initials(mentor.full_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{mentor.full_name}</p>
                              <p className="truncate text-xs text-foreground/70">{mentor.specialization_board || 'Mentor'}</p>
                            </div>
                          </div>
                          {mentor.bio && <p className="relative mt-3 line-clamp-2 text-xs text-foreground/70">{mentor.bio}</p>}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/10 px-3 py-2.5 text-[11px] font-medium text-foreground/80 backdrop-blur-xs">
                            <span>Mentor</span>
                            <span className="text-accent-purple group-hover:underline">Connect →</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Users} title="No mentors at your university yet" description="Check back soon — mentors are added as they join." />
                  )}
                </section>

                {/* ── Recent messages — list rows ── */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={MessageSquare}
                    title="Recent messages"
                    action={<Link href="/dashboard/student/messages" className={outlineButton}>View all</Link>}
                  />
                  {conversations.length > 0 ? (
                    <div className="divide-y overflow-hidden rounded-lg border bg-card">
                      {conversations.map((conv: any) => (
                        <Link key={conv.id} href={`/dashboard/student/messages?userId=${conv.user?.id}`} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
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
                    <EmptyState icon={MessageSquare} title="No messages yet" description="Connect with a mentor to start a conversation." cta="Find mentors" href="/dashboard/student/find-mentors" />
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
                      <p className="truncate text-xs text-muted-foreground">{profile.specialization_board || 'Student'}</p>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="size-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/student/profile" className={`${outlineButton} mt-4 w-full justify-center`}>
                    Edit profile
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
