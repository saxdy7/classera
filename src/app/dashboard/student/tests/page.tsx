import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Play, BarChart3, TrendingUp, BookOpen, Zap, ClipboardCheck } from 'lucide-react';
import { Stat, Section, List, Row, Badge, Empty, btnPrimary, btnSecondary } from '@/components/shell';
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
      <Header
        profile={{ id: user.id, ...profile }}
        title="Tests"
        meta={liveTests.length > 0 ? <Badge tone="success">{liveTests.length} live now</Badge> : undefined}
      />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">

            <p className="text-sm text-muted-foreground">Track your upcoming tests and review your performance.</p>

            <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-3" each={0.05}>
              <Stat label="Live tests" value={liveTests.length} icon={Zap} hint="Ready to take now" />
              <Stat label="Pending" value={pendingTests.length} icon={AlertCircle} hint="Scheduled for later" />
              <Stat label="Completed" value={completedTests.length} icon={CheckCircle} hint="Tests taken" />
            </Stagger>

            {/* ── Live now ── */}
            <Section title="Live now" description="Tests you can start right away." count={liveTests.length || undefined}>
              {liveTests.length > 0 ? (
                <List>
                  {liveTests.map((inv) => (
                    <Row
                      key={inv.id}
                      href={`/dashboard/student/tests/${inv.test.id}/take-secure`}
                      icon={ClipboardCheck}
                      title={inv.test.title}
                      description={inv.test.description || 'No description'}
                      meta={
                        <>
                          <span className="flex items-center gap-1"><Clock className="size-3" />{inv.test.duration_minutes} min</span>
                          <span className="flex items-center gap-1"><Zap className="size-3" />{inv.test.total_marks} pts</span>
                        </>
                      }
                      trailing={
                        <>
                          <Badge tone="success"><span className="size-1.5 animate-pulse rounded-full bg-green-600" />Live</Badge>
                          <span className={btnPrimary}><Play className="size-4" />Start</span>
                        </>
                      }
                      chevron={false}
                    />
                  ))}
                </List>
              ) : (
                <div className="rounded-xl border bg-card">
                  <Empty icon={Zap} title="No live tests right now" description="When a mentor starts a test you're invited to, it appears here." />
                </div>
              )}
            </Section>

            {/* ── Upcoming ── */}
            <Section title="Upcoming tests" description="Scheduled by your mentors." count={pendingTests.length || undefined}>
              {pendingTests.length > 0 ? (
                <List>
                  {pendingTests.map((inv) => {
                    const scheduledDate = inv.test.scheduled_at ? new Date(inv.test.scheduled_at) : null;
                    const daysUntil = scheduledDate ? Math.ceil((scheduledDate.getTime() - new Date().getTime()) / 86_400_000) : null;
                    return (
                      <Row
                        key={inv.id}
                        icon={ClipboardCheck}
                        title={inv.test.title}
                        description={inv.test.description || 'No description'}
                        meta={
                          <>
                            <span className="flex items-center gap-1"><Clock className="size-3" />{inv.test.duration_minutes} min</span>
                            <span className="flex items-center gap-1"><Zap className="size-3" />{inv.test.total_marks} marks</span>
                            {scheduledDate && <span className="flex items-center gap-1"><BookOpen className="size-3" />{scheduledDate.toLocaleDateString()}</span>}
                          </>
                        }
                        trailing={<Badge tone="neutral">{daysUntil !== null ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : 'Scheduled'}</Badge>}
                        chevron={false}
                      />
                    );
                  })}
                </List>
              ) : (
                <div className="rounded-xl border bg-card">
                  <Empty icon={AlertCircle} title="No upcoming tests" description="Nothing is scheduled for you yet." />
                </div>
              )}
            </Section>

            {/* ── History ── */}
            <Section title="Test history" description="Your graded submissions." count={completedTests.length || undefined}>
              {completedTests.length > 0 ? (
                <List>
                  {completedTests.map((sub) => {
                    const percentage = sub.percentage || 0;
                    const grade = getGrade(percentage);
                    const tone = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-destructive';
                    const bar = percentage >= 70 ? 'bg-green-600' : percentage >= 50 ? 'bg-amber-500' : 'bg-destructive';
                    return (
                      <Row
                        key={sub.id}
                        href={`/dashboard/student/tests/${sub.test_id}/results`}
                        title={sub.test?.title ?? 'Test'}
                        description={`${sub.score || 0}/${sub.test?.total_marks || 0} marks · ${new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        meta={
                          <div className="flex w-full items-center gap-2">
                            <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                              <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                            </div>
                            {sub.ai_evaluated_at && (
                              <span className="flex items-center gap-1"><TrendingUp className="size-3" />AI analysed</span>
                            )}
                          </div>
                        }
                        trailing={
                          <>
                            <Badge tone="neutral">{grade}</Badge>
                            <span className={`text-sm font-semibold tabular-nums ${tone}`}>{percentage.toFixed(0)}%</span>
                            <Link href={`/dashboard/student/tests/${sub.test_id}/review`} title="Review answers" className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:text-foreground">
                              <BarChart3 className="size-4" />
                            </Link>
                          </>
                        }
                      />
                    );
                  })}
                </List>
              ) : (
                <div className="rounded-xl border bg-card">
                  <Empty icon={CheckCircle} title="No completed tests yet" description="Your results show up here after you submit a test." />
                </div>
              )}
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}
