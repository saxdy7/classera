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
  const gradients = ['', '', '', ''];
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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-4 md:p-8">
          <div className="w-full max-w-9xl mx-auto">

            {/* ── Welcome header ──
                Was a full-bleed black banner whose body copy used
                text-[var(--cl-primary)] - near-black on a near-black fill, so
                the greeting and description were invisible. The reference
                dashboards open with a plain light greeting instead of a heavy
                colour slab, which also removes the large empty area it left. */}
            <div className="cl-rise mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="cl-eyebrow">Dashboard</span>
                <h1 className="mt-2 text-[32px] font-semibold leading-[1.15] tracking-[-0.5px] text-[var(--cl-ink)] md:text-[40px] md:tracking-[-1px]">
                  Hello, {firstName}
                </h1>
                <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-[var(--cl-muted)]">
                  You&rsquo;re studying at{' '}
                  <span className="font-semibold text-[var(--cl-ink)]">{universityName}</span>.
                  Your mentors are ready to help.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/student/courses"
                    className="inline-flex h-11 items-center gap-2 rounded-[var(--cl-r-md)] bg-[var(--cl-primary)] px-5 text-sm font-semibold text-[var(--cl-on-primary)] transition-colors hover:bg-[var(--cl-primary-active)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)]"
                  >
                    <BookOpen className="h-4 w-4" /> My Courses
                  </Link>
                  <Link
                    href="/dashboard/student/messages"
                    className="inline-flex h-11 items-center gap-2 rounded-[var(--cl-r-md)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] px-5 text-sm font-semibold text-[var(--cl-ink)] transition-colors hover:bg-[var(--cl-canvas-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]"
                  >
                    <MessageSquare className="h-4 w-4" /> Messages
                  </Link>
                </div>
              </div>

              <div className="hidden flex-shrink-0 lg:block">
                <Image
                  src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                  alt=""
                  width={200}
                  height={200}
                  className="h-44 w-44 object-contain"
                />
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="cl-stagger grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/ai-tools/career-coach" className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] hover:border-[var(--cl-info)] transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-[var(--cl-r-lg)] bg-[rgba(13,116,206,0.12)] flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-[var(--cl-info)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--cl-ink)] text-sm">AI Career Coach</h3>
                  <p className="text-xs text-[var(--cl-muted)] mt-0.5">AI-guided career wisdom</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--cl-muted-soft)] flex-shrink-0" />
              </Link>

              <Link href="/roadmaps" className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] hover:border-[var(--cl-warning)] transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-[var(--cl-r-lg)] bg-[rgba(171,100,0,0.12)] flex items-center justify-center flex-shrink-0">
                  <Map className="w-5 h-5 text-[var(--cl-warning)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--cl-ink)] text-sm">AI Roadmap Maker</h3>
                  <p className="text-xs text-[var(--cl-muted)] mt-0.5">Chart your personalized path</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--cl-muted-soft)] flex-shrink-0" />
              </Link>

              <Link href="/dashboard/student/find-mentors" className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary-soft)] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[var(--cl-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--cl-ink)] text-sm">Connect Mentors</h3>
                  <p className="text-xs text-[var(--cl-muted)] mt-0.5">Learn from those ahead of you</p>
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
                  <StatCard icon={BookOpen} label="Courses" value={courseCount} iconBg="bg-[rgba(13,116,206,0.12)]" iconColor="text-[var(--cl-info)]" />
                  <StatCard icon={ClipboardCheck} label="Tests Taken" value={submissions.length || 0} iconBg="bg-[var(--cl-primary-soft)]" iconColor="text-[var(--cl-primary)]" />
                  <StatCard icon={Target} label="Avg Score" value={avgScore !== null ? `${avgScore}%` : '—'} iconBg="bg-[rgba(22,163,74,0.12)]" iconColor="text-[var(--cl-success)]" />
                  <StatCard icon={MessageSquare} label="Sessions" value={sessionCount} iconBg="bg-[rgba(171,100,0,0.12)]" iconColor="text-[var(--cl-warning)]" />
                </div>

                {/* Score Trend + Recent Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-semibold text-[var(--cl-ink)]">My Score Trend</h2>
                    </div>
                    <p className="text-xs text-[var(--cl-muted)] mb-4">Last {scoreTrend.length} graded test{scoreTrend.length !== 1 ? 's' : ''}</p>
                    {scoreTrend.length > 0 ? (
                      <ScoreTrendChart data={scoreTrend} color="#9333ea" />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-[var(--cl-muted-soft)]">
                        No graded tests yet
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-[var(--cl-ink)]">Recent Results</h2>
                      <Link href="/dashboard/student/tests" className="text-sm font-medium text-[var(--cl-primary)] hover:text-[var(--cl-primary)]">
                        View all →
                      </Link>
                    </div>
                    {recentResults.length > 0 ? (
                      <div className="space-y-3">
                        {recentResults.map((r: any) => (
                          <Link key={r.id} href={`/dashboard/student/tests/${r.test_id}/results`} className="flex items-center justify-between gap-3 hover:bg-[var(--cl-canvas-soft)] -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--cl-ink)] truncate">{r.test?.title || 'Test'}</p>
                              <p className="text-xs text-[var(--cl-muted)]">{new Date(r.submitted_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-sm font-semibold flex-shrink-0 ${(r.percentage || 0) >= 70 ? 'text-[var(--cl-success)]' : (r.percentage || 0) >= 40 ? 'text-[var(--cl-warning)]' : 'text-[var(--cl-error)]'}`}>
                              {Math.round(r.percentage || 0)}%
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-[var(--cl-muted-soft)]">
                        No test results yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended Mentors */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--cl-ink)]">Recommended Mentors</h2>
                      <p className="text-xs text-[var(--cl-muted)] mt-0.5">From {universityName}</p>
                    </div>
                    <Link href="/dashboard/student/mentors" className="text-sm font-medium text-[var(--cl-primary)] hover:text-[var(--cl-primary)] flex items-center gap-1">
                      View all <span>→</span>
                    </Link>
                  </div>

                  {mentors.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                      {mentors.map((mentor: any, i: number) => (
                        <div key={mentor.id} className="flex-shrink-0 w-56 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] overflow-hidden border border-[var(--cl-hairline)] hover:-translate-y-0.5 transition-all duration-200">
                          <div className={`h-1.5 ${gradients[i % gradients.length]}`} />
                          <div className="p-5">
                            {mentor.avatar_url ? (
                              <img src={mentor.avatar_url} alt={mentor.full_name} className="w-12 h-12 rounded-full object-cover mb-3" />
                            ) : (
                              <div className={`w-12 h-12 rounded-full ${gradients[i % gradients.length]} flex items-center justify-center text-[var(--cl-on-dark)] text-sm font-semibold mb-3`}>
                                {mentor.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <h3 className="font-semibold text-[var(--cl-ink)] text-sm leading-tight">{mentor.full_name}</h3>
                            <p className="text-xs text-[var(--cl-primary)] font-medium mt-1 truncate">{mentor.specialization_board || 'Mentor'}</p>
                            <div className="flex items-center gap-1 mt-2 mb-4">
                              <span className="text-[var(--cl-warning)] text-xs">★</span>
                              <span className="text-xs font-semibold text-[var(--cl-body)]">{ratings[i % ratings.length]}</span>
                              <span className="text-xs text-[var(--cl-muted)]">(Top Rated)</span>
                            </div>
                            <Link href={`/dashboard/student/messages?userId=${mentor.id}`} className="block w-full text-center py-2 px-3 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] text-xs font-semibold rounded-lg hover:bg-[var(--cl-primary)] transition-colors">
                              Connect
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[var(--cl-muted-soft)]">
                      <Users className="w-10 h-10 mx-auto mb-3 text-[var(--cl-muted-soft)]" />
                      <p className="font-medium">No mentors at your university yet</p>
                      <p className="text-sm mt-1">Check back soon</p>
                    </div>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-[var(--cl-ink)]">Recent Messages</h2>
                    <Link href="/dashboard/student/messages" className="text-sm font-medium text-[var(--cl-primary)] hover:text-[var(--cl-primary)]">
                      View all →
                    </Link>
                  </div>
                  {conversations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conversations.map((conv: any) => (
                        <Link key={conv.id} href={`/dashboard/student/messages?userId=${conv.user?.id}`}
                          className="flex items-center gap-3 p-4 rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all group">
                          <div className="relative flex-shrink-0">
                            {conv.user?.avatar_url ? (
                              <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-11 h-11 rounded-full object-cover" />
                            ) : (
                              <div className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] text-sm font-semibold bg-[var(--cl-primary)]">
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
                            <span className="text-xs text-[var(--cl-muted-soft)]">{conv.time}</span>
                            {conv.unread && <span className="text-xs font-medium text-[var(--cl-primary)] bg-[var(--cl-primary-soft)] px-2 py-0.5 rounded-full">New</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[var(--cl-muted-soft)]">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--cl-muted-soft)]" />
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
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-[var(--cl-on-dark)] bg-[var(--cl-primary)]">
                      {firstName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--cl-ink)] truncate">{profile.full_name}</p>
                      <p className="text-[var(--cl-muted)] text-xs truncate">{profile.specialization_board || 'Student'}</p>
                    </div>
                  </div>
                  <p className="text-[var(--cl-muted)] text-xs leading-relaxed flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> {universityName}
                  </p>
                  <Link href="/dashboard/student/profile" className="mt-4 block text-center py-2 px-4 bg-[var(--cl-canvas-soft)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] text-sm font-medium rounded-[var(--cl-r-lg)] transition-colors border border-[var(--cl-hairline)]">
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
