import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, Clock, Users, CheckCircle, Rocket, BookMarked } from 'lucide-react';

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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Tests</h1>
                <p className="text-[var(--cl-body)]">Create and manage your tests</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/mentor/question-bank"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--cl-surface-card)] text-[var(--cl-body)] border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] font-medium hover:border-[var(--cl-primary)] hover:text-[var(--cl-primary)] transition-all"
                >
                  <BookMarked className="w-5 h-5" />
                  Question Bank
                </Link>
                <Link
                  href="/dashboard/mentor/tests/create"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium transition-all bg-[var(--cl-primary)]"
                >
                  <Plus className="w-5 h-5" />
                  Create Test
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Total Tests</span>
                  <CheckCircle className="w-5 h-5 text-[var(--cl-info)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-ink)]">{tests?.length || 0}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Live Now</span>
                  <div className="w-3 h-3 bg-[var(--cl-success)] rounded-full animate-pulse" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-success)]">{liveTests.length}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Ready</span>
                  <Rocket className="w-5 h-5 text-[var(--cl-info)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-info)]">{readyTests.length}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Drafts</span>
                  <div className="w-5 h-5 text-[var(--cl-warning)]">📝</div>
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-warning)]">{draftTests.length}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Scheduled</span>
                  <Clock className="w-5 h-5 text-[var(--cl-warning)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-warning)]">{scheduledTests.length}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Completed</span>
                  <Users className="w-5 h-5 text-[var(--cl-muted-soft)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-body)]">{completedTests.length}</p>
              </div>
            </div>

            {/* Ready Tests - Has invitations but not live yet */}
            {readyTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
                  🚀 Ready to Go Live
                  <span className="text-sm font-normal text-[var(--cl-muted)]">(students invited)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {readyTests.map((test) => (
                    <TestCard key={test.id} test={test} isReady />
                  ))}
                </div>
              </div>
            )}

            {/* Draft Tests - Show prominently */}
            {draftTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
                  📝 Draft Tests
                  <span className="text-sm font-normal text-[var(--cl-muted)]">(needs setup)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftTests.map((test) => (
                    <TestCard key={test.id} test={test} isDraft />
                  ))}
                </div>
              </div>
            )}

            {/* Live Tests */}
            {liveTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--cl-success)] rounded-full animate-pulse" />
                  Live Tests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveTests.map((test) => (
                    <TestCard key={test.id} test={test} isLive />
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Tests */}
            {scheduledTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4">Scheduled Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scheduledTests.map((test) => (
                    <TestCard key={test.id} test={test} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tests */}
            {completedTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4">Completed Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedTests.map((test) => (
                    <TestCard key={test.id} test={test} isCompleted />
                  ))}
                </div>
              </div>
            )}

            {(!tests || tests.length === 0) && (
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-16 text-center border border-[var(--cl-hairline)]">
                <div className="w-16 h-16 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--cl-muted-soft)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">No tests yet</h3>
                <p className="text-[var(--cl-body)] mb-6">Create your first test to get started</p>
                <Link
                  href="/dashboard/mentor/tests/create"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium transition-all bg-[var(--cl-primary)]"
                >
                  <Plus className="w-5 h-5" />
                  Create Test
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TestCard({ test, isLive = false, isCompleted = false, isDraft = false, isReady = false }: { test: any; isLive?: boolean; isCompleted?: boolean; isDraft?: boolean; isReady?: boolean }) {
  const submissionCount = test.submissions?.length ?? 0;
  const invitationCount = test.invitations?.length ?? 0;

  return (
    <Link
      href={`/dashboard/mentor/tests/${test.id}`}
      className={`block bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border hover:-translate-y-0.5 transition-all ${
        isDraft ? 'border-[var(--cl-warning)] hover:border-[var(--cl-warning)] bg-[rgba(171,100,0,0.3)]' :
        isLive ? 'border-[var(--cl-success)] hover:border-[var(--cl-success)]' :
        isReady ? 'border-[var(--cl-info)] hover:border-[var(--cl-info)] bg-[rgba(13,116,206,0.3)]' :
        isCompleted ? 'border-[var(--cl-hairline-strong)] hover:border-[var(--cl-hairline-strong)]' :
        'border-[var(--cl-hairline)] hover:border-[var(--cl-primary)]'
      }`}
    >
      {isLive && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] text-xs font-medium rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-[var(--cl-success)] rounded-full animate-pulse" />
          Live Now
        </span>
      )}

      {isDraft && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] text-xs font-medium rounded-full mb-3">
          📝 Draft - Needs Setup
        </span>
      )}

      {isReady && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] text-xs font-medium rounded-full mb-3">
          🚀 Ready - Go Live
        </span>
      )}

      {isCompleted && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] text-xs font-medium rounded-full mb-3">
          ✅ Completed
        </span>
      )}

      <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-2">{test.title}</h3>
      <p className="text-sm text-[var(--cl-body)] mb-4 line-clamp-2">
        {test.description || 'No description'}
      </p>

      <div className="flex items-center gap-4 text-sm text-[var(--cl-muted)] mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {test.duration_minutes} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {invitationCount} invited
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          {submissionCount} submitted
        </span>
      </div>

      {isDraft && (
        <p className="text-xs text-[var(--cl-warning)] font-medium">
          Click to invite students and go live →
        </p>
      )}

      {isReady && (
        <p className="text-xs text-[var(--cl-info)] font-medium">
          Click to start the test →
        </p>
      )}

      {isCompleted && (
        <p className="text-xs text-[var(--cl-body)] font-medium">
          Click to view results →
        </p>
      )}

      {test.scheduled_at && !isLive && !isDraft && !isReady && (
        <p className="text-xs text-[var(--cl-muted)]">
          {isCompleted ? 'Conducted' : 'Scheduled'}: {new Date(test.scheduled_at).toLocaleDateString()}
        </p>
      )}
    </Link>
  );
}
