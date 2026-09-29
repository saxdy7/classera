import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import RealCalendar from '@/components/shared/RealCalendar';
import { Stat, Section, ItemCard, List, Row, Empty, Badge, btnPrimary, btnSecondary, getGreeting } from '@/components/shell';
import { Stagger, ScrollReveal } from '@/components/motion';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Users, MessageSquare, Target,
  Briefcase, Map, ClipboardCheck, TrendingUp,
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
    { href: '/ai-tools/career-coach', icon: Briefcase, title: 'AI Career Coach', category: 'Guidance', description: 'Personalised advice built from your tests, courses and goals.' },
    { href: '/roadmaps', icon: Map, title: 'Skill Roadmaps', category: 'Planning', description: 'Generate a step-by-step path to the role you want.' },
    { href: '/dashboard/student/find-mentors', icon: Users, title: 'Find Mentors', category: 'People', description: 'Connect with mentors at your university.' },
    { href: '/courses', icon: BookOpen, title: 'AI Courses', category: 'Learning', description: 'Build a course on any topic and start learning.' },
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
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">

            {/* ── Greeting ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{getGreeting()}, {firstName}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  Let&rsquo;s keep your learning moving.
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href="/dashboard/student/messages" className={btnSecondary}>
                  <MessageSquare className="size-4" /> Messages
                </Link>
                <Link href="/dashboard/student/courses" className={btnPrimary}>
                  <BookOpen className="size-4" /> My Courses
                </Link>
              </div>
            </div>

            {/* ── Stats ── */}
            <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4" each={0.05}>
              <Stat label="Courses" value={courseCount} icon={BookOpen} href="/dashboard/student/courses" />
              <Stat label="Tests taken" value={submissions.length || 0} icon={ClipboardCheck} href="/dashboard/student/tests" />
              <Stat label="Average score" value={avgScore !== null ? `${avgScore}%` : '—'} icon={Target} href="/dashboard/student/tests" />
              <Stat label="Sessions" value={sessionCount} icon={MessageSquare} href="/dashboard/student/sessions" />
            </Stagger>

            {/* ── Quick actions ── */}
            <Section title="Quick actions" description="Jump back into the tools you use most.">
              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" each={0.06}>
                {quickActions.map((a) => (
                  <ItemCard
                    key={a.href}
                    href={a.href}
                    icon={a.icon}
                    title={a.title}
                    category={a.category}
                    description={a.description}
                    badge={<Badge tone="accent">AI</Badge>}
                  />
                ))}
              </Stagger>
            </Section>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
              <div className="space-y-8 xl:col-span-2">

                {/* ── Score trend + Recent results ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">Score trend</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Last {scoreTrend.length} graded test{scoreTrend.length !== 1 ? 's' : ''}</p>
                    {scoreTrend.length > 0 ? (
                      <ScoreTrendChart data={scoreTrend} color="#a855f7" />
                    ) : (
                      <Empty icon={TrendingUp} title="No graded tests yet" description="Your score trend appears once a test is graded." className="py-10" />
                    )}
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Recent results</h3>
                      <Link href="/dashboard/student/tests" className="text-sm font-medium text-muted-foreground hover:text-foreground">View all</Link>
                    </div>
                    {recentResults.length > 0 ? (
                      <div className="divide-y">
                        {recentResults.map((r: any) => {
                          const pct = Math.round(r.percentage || 0);
                          const tone = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-destructive';
                          return (
                            <Link key={r.id} href={`/dashboard/student/tests/${r.test_id}/results`} className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{r.test?.title || 'Test'}</p>
                                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</p>
                              </div>
                              <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone}`}>{pct}%</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <Empty icon={ClipboardCheck} title="No results yet" description="Submit a test to see your results here." className="py-10" />
                    )}
                  </div>
                </div>

                {/* ── Mentors ── */}
                <ScrollReveal>
                  <Section
                    title="Recommended mentors"
                    description={`From ${universityName}`}
                    count={mentors.length || undefined}
                    action={<Link href="/dashboard/student/find-mentors" className={btnSecondary}>View all</Link>}
                  >
                    {mentors.length > 0 ? (
                      <List>
                        {mentors.slice(0, 5).map((mentor: any) => (
                          <Row
                            key={mentor.id}
                            href={`/dashboard/student/mentor/${mentor.id}`}
                            title={mentor.full_name}
                            description={mentor.specialization_board || 'Mentor'}
                            meta={mentor.bio ? <span className="line-clamp-1">{mentor.bio}</span> : undefined}
                            trailing={<Badge tone="neutral">Mentor</Badge>}
                          />
                        ))}
                      </List>
                    ) : (
                      <Empty icon={Users} title="No mentors yet" description="Mentors at your university will appear here as they join." />
                    )}
                  </Section>
                </ScrollReveal>

                {/* ── Messages ── */}
                <ScrollReveal>
                  <Section
                    title="Recent messages"
                    action={<Link href="/dashboard/student/messages" className={btnSecondary}>View all</Link>}
                  >
                    {conversations.length > 0 ? (
                      <List>
                        {conversations.map((conv: any) => (
                          <Row
                            key={conv.id}
                            href={`/dashboard/student/messages?userId=${conv.user?.id}`}
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
                      <Empty icon={MessageSquare} title="No messages yet" description="Connect with a mentor to start a conversation." cta="Find mentors" href="/dashboard/student/find-mentors" />
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
                      <p className="truncate text-xs text-muted-foreground">{profile.specialization_board || 'Student'}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="size-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/student/profile" className={`${btnSecondary} mt-3 w-full`}>
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
