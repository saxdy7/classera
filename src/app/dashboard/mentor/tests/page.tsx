import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, Clock, Users, CheckCircle, Rocket, BookMarked, ClipboardCheck, Radio, FileEdit } from 'lucide-react';
import { PageHeader, SectionHeader, StatCard, CreateTile, gradientFor, primaryButton, outlineButton } from '@/components/shell';
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
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">

            <PageHeader
              icon={ClipboardCheck}
              title="Tests"
              description="Create and manage your tests."
              actions={
                <>
                  <Link href="/dashboard/mentor/question-bank" className={outlineButton}>
                    <BookMarked className="size-3.5" />
                    Question Bank
                  </Link>
                  <Link href="/dashboard/mentor/tests/create" className={primaryButton}>
                    <Plus className="size-4" />
                    Create Test
                  </Link>
                </>
              }
            />

            {/* Stats */}
            <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" each={0.05}>
              <StatCard label="Total tests" value={tests?.length || 0} icon={CheckCircle} />
              <StatCard label="Live now" value={liveTests.length} icon={Radio} />
              <StatCard label="Ready" value={readyTests.length} icon={Rocket} />
              <StatCard label="Drafts" value={draftTests.length} icon={FileEdit} />
              <StatCard label="Scheduled" value={scheduledTests.length} icon={Clock} />
              <StatCard label="Completed" value={completedTests.length} icon={Users} />
            </Stagger>

            {(!tests || tests.length === 0) ? (
              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" each={0.05}>
                <CreateTile href="/dashboard/mentor/tests/create" label="Create your first test" />
              </Stagger>
            ) : (
              <>
                {liveTests.length > 0 && (
                  <TestSection title="Live tests" description="Running right now" tests={liveTests} state="live" offset={0} />
                )}
                {readyTests.length > 0 && (
                  <TestSection title="Ready to go live" description="Students invited" tests={readyTests} state="ready" offset={4} showCreate />
                )}
                {draftTests.length > 0 && (
                  <TestSection title="Drafts" description="Needs setup" tests={draftTests} state="draft" offset={7} showCreate={readyTests.length === 0} />
                )}
                {scheduledTests.length > 0 && (
                  <TestSection title="Scheduled" tests={scheduledTests} state="scheduled" offset={2} />
                )}
                {completedTests.length > 0 && (
                  <TestSection title="Completed" description="Results available" tests={completedTests} state="completed" offset={9} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

type TestState = 'live' | 'ready' | 'draft' | 'scheduled' | 'completed';

const STATE_META: Record<TestState, { badge: string; cta: string }> = {
  live: { badge: 'Live now', cta: 'Monitor →' },
  ready: { badge: 'Ready', cta: 'Start the test →' },
  draft: { badge: 'Draft', cta: 'Invite students →' },
  scheduled: { badge: 'Scheduled', cta: 'Open →' },
  completed: { badge: 'Completed', cta: 'View results →' },
};

/** looma "My Workspaces" row: section header, then a gradient card grid, with the dashed create tile leading. */
function TestSection({ title, description, tests, state, offset, showCreate = false }: {
  title: string; description?: string; tests: any[]; state: TestState; offset: number; showCreate?: boolean;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={state === 'live' ? Radio : state === 'completed' ? CheckCircle : ClipboardCheck}
        title={title}
        description={description}
      />
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" each={0.05}>
        {showCreate && <CreateTile href="/dashboard/mentor/tests/create" label="Create New Test" />}
        {tests.map((test, i) => (
          <TestCard key={test.id} test={test} state={state} index={offset + i} />
        ))}
      </Stagger>
    </section>
  );
}

function TestCard({ test, state, index }: { test: any; state: TestState; index: number }) {
  const submissionCount = test.submissions?.length ?? 0;
  const invitationCount = test.invitations?.length ?? 0;
  const meta = STATE_META[state];

  return (
    <Link
      href={`/dashboard/mentor/tests/${test.id}`}
      className={`group relative block h-[180px] overflow-hidden rounded-xl border bg-linear-to-br p-4 transition-transform hover:scale-[1.02] ${
        state === 'completed' ? 'from-neutral-200 to-neutral-50' : gradientFor(index)
      }`}
    >
      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg border border-white/40 bg-white/60 text-foreground shadow-xs">
            <ClipboardCheck className="size-4.5" />
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
            {state === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-green-600" />}
            {meta.badge}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-1 text-base font-semibold leading-snug text-foreground">{test.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-foreground/70">{test.description || 'No description'}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-foreground/70">
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{test.duration_minutes} min</span>
          <span className="flex items-center gap-1"><Users className="size-3.5" />{invitationCount}</span>
          <span className="flex items-center gap-1"><CheckCircle className="size-3.5" />{submissionCount}</span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/10 px-3 py-2.5 text-[11px] font-medium text-foreground/80 backdrop-blur-xs">
        <span>
          {test.scheduled_at && state !== 'live' && state !== 'draft' && state !== 'ready'
            ? `${state === 'completed' ? 'Conducted' : 'Scheduled'} ${new Date(test.scheduled_at).toLocaleDateString()}`
            : `${submissionCount}/${invitationCount} submitted`}
        </span>
        <span className="text-accent-purple group-hover:underline">{meta.cta}</span>
      </div>
    </Link>
  );
}
