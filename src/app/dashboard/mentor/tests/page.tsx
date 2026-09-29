import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, Clock, Users, CheckCircle, Rocket, BookMarked, ClipboardCheck, Radio, FileEdit } from 'lucide-react';
import { Stat, Section, ItemCard, Badge, Empty, Toolbar, btnPrimary, btnSecondary } from '@/components/shell';
import { Stagger } from '@/components/motion';

export const dynamic = 'force-dynamic';

export default async function TestsPage() {
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

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  const admin = createAdminClient();

  // Fetch tests with submission counts — admin client to bypass RLS edge cases
  const { data: tests, error: testsError } = await admin
    .from('tests')
    .select(`
      *,
      community:communities(id, name),
      submissions:test_submissions(id),
      invitations:test_invitations(id, student_id)
    `)
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  if (testsError) console.error('Error fetching tests:', testsError);

  // Count helpers — invitations/submissions are now fetched as full rows (not count aggregate)
  const invCount = (t: any) => t.invitations?.length ?? 0;
  const subCount = (t: any) => t.submissions?.length ?? 0;

  // Live tests - currently active
  const liveTests = tests?.filter(t => t.is_live) || [];
  
  // Completed: not live, has submissions
  const completedTests = tests?.filter(t => !t.is_live && subCount(t) > 0) || [];

  // Ready: not live, has invitations, no submissions
  const readyTests = tests?.filter(t => !t.is_live && invCount(t) > 0 && subCount(t) === 0) || [];

  // Draft: not live AND no invitations sent yet, no submissions
  const draftTests = tests?.filter(t => !t.is_live && invCount(t) === 0 && subCount(t) === 0) || [];

  // Scheduled: subset of ready with a future scheduled_at
  const scheduledTests = tests?.filter(t => 
    !t.is_live && 
    t.scheduled_at && 
    new Date(t.scheduled_at) > new Date() &&
    invCount(t) > 0
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header profile={profile} title="Tests" meta={liveTests.length > 0 ? <Badge tone="success">{liveTests.length} live</Badge> : undefined} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">

            <Toolbar
              left={<p className="text-sm text-muted-foreground">Create and manage your tests.</p>}
              right={
                <>
                  <Link href="/dashboard/mentor/question-bank" className={btnSecondary}>
                    <BookMarked className="size-4" /> Question Bank
                  </Link>
                  <Link href="/dashboard/mentor/tests/create" className={btnPrimary}>
                    <Plus className="size-4" /> Create test
                  </Link>
                </>
              }
            />

            <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" each={0.04}>
              <Stat label="Total" value={tests?.length || 0} icon={CheckCircle} />
              <Stat label="Live now" value={liveTests.length} icon={Radio} />
              <Stat label="Ready" value={readyTests.length} icon={Rocket} />
              <Stat label="Drafts" value={draftTests.length} icon={FileEdit} />
              <Stat label="Scheduled" value={scheduledTests.length} icon={Clock} />
              <Stat label="Completed" value={completedTests.length} icon={Users} />
            </Stagger>

            {(!tests || tests.length === 0) ? (
              <div className="rounded-xl border bg-card">
                <Empty
                  icon={ClipboardCheck}
                  title="No tests yet"
                  description="Create your first test, invite students, then take it live."
                  cta="Create test"
                  href="/dashboard/mentor/tests/create"
                />
              </div>
            ) : (
              <>
                {liveTests.length > 0 && <TestSection title="Live tests" description="Running right now" tests={liveTests} state="live" />}
                {readyTests.length > 0 && <TestSection title="Ready to go live" description="Students invited" tests={readyTests} state="ready" />}
                {draftTests.length > 0 && <TestSection title="Drafts" description="Needs setup" tests={draftTests} state="draft" />}
                {scheduledTests.length > 0 && <TestSection title="Scheduled" tests={scheduledTests} state="scheduled" />}
                {completedTests.length > 0 && <TestSection title="Completed" description="Results available" tests={completedTests} state="completed" />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

type TestState = 'live' | 'ready' | 'draft' | 'scheduled' | 'completed';

const STATE_META: Record<TestState, { badge: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }> = {
  live: { badge: 'Live', tone: 'success' },
  ready: { badge: 'Ready', tone: 'accent' },
  draft: { badge: 'Draft', tone: 'warning' },
  scheduled: { badge: 'Scheduled', tone: 'neutral' },
  completed: { badge: 'Completed', tone: 'neutral' },
};

function TestSection({ title, description, tests, state }: {
  title: string; description?: string; tests: any[]; state: TestState;
}) {
  return (
    <Section title={title} description={description} count={tests.length}>
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" each={0.04}>
        {tests.map((test) => <TestCard key={test.id} test={test} state={state} />)}
      </Stagger>
    </Section>
  );
}

function TestCard({ test, state }: { test: any; state: TestState }) {
  const submissionCount = test.submissions?.length ?? 0;
  const invitationCount = test.invitations?.length ?? 0;
  const meta = STATE_META[state];

  return (
    <ItemCard
      href={`/dashboard/mentor/tests/${test.id}`}
      icon={ClipboardCheck}
      title={test.title}
      category={`${test.duration_minutes} min · ${test.total_marks ?? 0} marks`}
      description={test.description || 'No description'}
      badge={
        <Badge tone={meta.tone}>
          {state === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-green-600" />}
          {meta.badge}
        </Badge>
      }
      footer={
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="size-3.5" />{invitationCount} invited</span>
          <span className="flex items-center gap-1"><CheckCircle className="size-3.5" />{submissionCount} submitted</span>
        </div>
      }
    />
  );
}
