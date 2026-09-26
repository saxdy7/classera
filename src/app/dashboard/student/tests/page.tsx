import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Play, Eye, BarChart3, Award, TrendingUp, BookOpen, Zap, ClipboardCheck, ArrowRight } from 'lucide-react';
import { PageHeader, SectionHeader, StatCard, EmptyState, gradientFor } from '@/components/shell';
import { Stagger } from '@/components/motion';

export const dynamic = 'force-dynamic';

export default async function StudentTestsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding/student');
  }

  // Single query — join test details directly onto each invitation
  const { data: invitationsWithTests, error: invError } = await supabase
    .from('test_invitations')
    .select('*, test:tests(*)')
    .eq('student_id', user.id)
    .order('invited_at', { ascending: false });

  if (invError) {
    console.error('Failed to load test invitations:', invError);
  }

  // Get submissions
  const { data: submissions } = await supabase
    .from('test_submissions')
    .select(`
      *,
      test:tests(title, total_marks)
    `)
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false });

  // Get IDs of completed tests
  const completedTestIds = new Set(submissions?.map(s => s.test_id) || []);

  // Live tests: tests that are live AND student hasn't completed yet
  const liveTests = invitationsWithTests?.filter(inv =>
    inv.test?.is_live &&
    !completedTestIds.has(inv.test.id) &&
    inv.status !== 'declined'
  ) || [];

  // Pending tests: not live yet, not completed, and upcoming schedule
  const pendingTests = invitationsWithTests?.filter(inv =>
    inv.status === 'pending' &&
    !inv.test?.is_live &&
    !completedTestIds.has(inv.test?.id) &&
    (!inv.test?.scheduled_at || new Date(inv.test.scheduled_at) > new Date())
  ) || [];

  const completedTests = submissions || [];

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };


  return (
    <div className="min-h-screen bg-background">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">

            <PageHeader
              icon={ClipboardCheck}
              title="Tests"
              description="Track your upcoming tests and review your performance."
            />

            <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-3" each={0.06}>
              <StatCard label="Live tests" value={liveTests.length} icon={Zap} hint="Ready to take now" />
              <StatCard label="Pending" value={pendingTests.length} icon={AlertCircle} hint="Scheduled for later" />
              <StatCard label="Completed" value={completedTests.length} icon={CheckCircle} hint="Tests taken" />
            </Stagger>

            {/* ── Live now — gradient cards, looma ── */}
            <section className="space-y-4">
              <SectionHeader icon={Zap} title="Live now" description="Tests you can start right away." />
              {liveTests.length > 0 ? (
                <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" each={0.05}>
                  {liveTests.map((inv, i) => (
                    <Link
                      key={inv.id}
                      href={`/dashboard/student/tests/${inv.test.id}/take-secure`}
                      className={`group relative block h-[180px] overflow-hidden rounded-xl border bg-linear-to-br p-4 transition-transform hover:scale-[1.02] ${gradientFor(i + 1)}`}
                    >
                      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex size-9 items-center justify-center rounded-lg border border-white/40 bg-white/60 text-foreground shadow-xs">
                            <ClipboardCheck className="size-4.5" />
                          </span>
                          <span className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                            <span className="size-1.5 animate-pulse rounded-full bg-green-600" /> Live
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-1 text-base font-semibold leading-snug text-foreground">{inv.test.title}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-foreground/70">{inv.test.description || 'No description'}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-foreground/70">
                          <span className="flex items-center gap-1"><Clock className="size-3.5" />{inv.test.duration_minutes} min</span>
                          <span className="flex items-center gap-1"><Zap className="size-3.5" />{inv.test.total_marks} pts</span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/10 px-3 py-2.5 text-[11px] font-medium text-foreground/80 backdrop-blur-xs">
                        <span>Secure mode</span>
                        <span className="flex items-center gap-1 text-accent-purple group-hover:underline"><Play className="size-3.5" /> Start test</span>
                      </div>
                    </Link>
                  ))}
                </Stagger>
              ) : (
                <EmptyState icon={Zap} title="No live tests right now" description="When a mentor starts a test you're invited to, it appears here." />
              )}
            </section>

            {/* ── Upcoming — list rows ── */}
            <section className="space-y-4">
              <SectionHeader icon={AlertCircle} title="Upcoming tests" description="Scheduled by your mentors." />
              {pendingTests.length > 0 ? (
                <div className="divide-y overflow-hidden rounded-lg border bg-card">
                  {pendingTests.map((inv) => {
                    const scheduledDate = inv.test.scheduled_at ? new Date(inv.test.scheduled_at) : null;
                    const daysUntil = scheduledDate ? Math.ceil((scheduledDate.getTime() - new Date().getTime()) / 86_400_000) : null;
                    return (
                      <div key={inv.id} className="flex items-center gap-4 px-4 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                          <ClipboardCheck className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">{inv.test.title}</p>
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {daysUntil !== null ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : 'Scheduled'}
                            </span>
                          </div>
                          <p className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="size-3" />{inv.test.duration_minutes} min</span>
                            <span className="flex items-center gap-1"><Zap className="size-3" />{inv.test.total_marks} marks</span>
                            {scheduledDate && <span className="flex items-center gap-1"><BookOpen className="size-3" />{scheduledDate.toLocaleDateString()}</span>}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={AlertCircle} title="No upcoming tests" description="Nothing is scheduled for you yet." />
              )}
            </section>

            {/* ── History — list rows ── */}
            <section className="space-y-4">
              <SectionHeader icon={CheckCircle} title="Test history" description="Your graded submissions." />
              {completedTests.length > 0 ? (
                <div className="divide-y overflow-hidden rounded-lg border bg-card">
                  {completedTests.map((sub) => {
                    const percentage = sub.percentage || 0;
                    const grade = getGrade(percentage);
                    const tone = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-destructive';
                    const bar = percentage >= 70 ? 'bg-green-600' : percentage >= 50 ? 'bg-amber-500' : 'bg-destructive';
                    return (
                      <div key={sub.id} className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                        <Link href={`/dashboard/student/tests/${sub.test_id}/results`} className="absolute inset-0" aria-label={sub.test?.title} />
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-sm font-semibold ${tone}`}>{grade}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-accent-purple">{sub.test?.title}</p>
                            {sub.ai_evaluated_at && (
                              <span className="flex items-center gap-1 rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2 py-0.5 text-[10px] font-medium text-foreground"><TrendingUp className="size-3" />AI analysed</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                              <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              <Award className="mr-1 inline size-3" />{sub.score || 0}/{sub.test?.total_marks || 0} · {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone}`}>{percentage.toFixed(0)}%</span>
                        <div className="relative z-10 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Link href={`/dashboard/student/tests/${sub.test_id}/results`} title="View results" className="flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground"><Eye className="size-4" /></Link>
                          <Link href={`/dashboard/student/tests/${sub.test_id}/review`} title="Review answers" className="flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground"><BarChart3 className="size-4" /></Link>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={CheckCircle} title="No completed tests yet" description="Your results will show up here after you submit a test." />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
