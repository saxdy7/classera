import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, Clock, Users, CheckCircle, Rocket } from 'lucide-react';

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

  // Fetch tests with submission counts
  const { data: tests } = await supabase
    .from('tests')
    .select(`
      *,
      community:communities(id, name),
      submissions:test_submissions(count),
      invitations:test_invitations(count)
    `)
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  // Live tests - currently active
  const liveTests = tests?.filter(t => t.is_live) || [];
  
  // Draft: not live AND no invitations sent yet
  const draftTests = tests?.filter(t => 
    !t.is_live && 
    (!t.invitations?.[0]?.count || t.invitations[0].count === 0)
  ) || [];
  
  // Ready tests: not live, has invitations, no submissions yet (ready to go live)
  const readyTests = tests?.filter(t => 
    !t.is_live && 
    t.invitations?.[0]?.count > 0 &&
    (!t.submissions?.[0]?.count || t.submissions[0].count === 0)
  ) || [];
  
  // Scheduled: not live, has future schedule, has invitations
  const scheduledTests = tests?.filter(t => 
    !t.is_live && 
    t.scheduled_at && 
    new Date(t.scheduled_at) > new Date() &&
    t.invitations?.[0]?.count > 0
  ) || [];
  
  // Completed: not live, has submissions (test was conducted and has responses)
  const completedTests = tests?.filter(t => 
    !t.is_live && 
    t.submissions?.[0]?.count > 0
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-14">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Tests</h1>
                <p className="text-slate-600">Create and manage your tests</p>
              </div>
              <Link
                href="/dashboard/mentor/tests/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Test
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Total Tests</span>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{tests?.length || 0}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Live Now</span>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <p className="text-3xl font-bold text-green-600">{liveTests.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Ready</span>
                  <Rocket className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{readyTests.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Drafts</span>
                  <div className="w-5 h-5 text-amber-500">📝</div>
                </div>
                <p className="text-3xl font-bold text-amber-600">{draftTests.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Scheduled</span>
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-600">{scheduledTests.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Completed</span>
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-600">{completedTests.length}</p>
              </div>
            </div>

            {/* Ready Tests - Has invitations but not live yet */}
            {readyTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  🚀 Ready to Go Live
                  <span className="text-sm font-normal text-slate-500">(students invited)</span>
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
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  📝 Draft Tests
                  <span className="text-sm font-normal text-slate-500">(needs setup)</span>
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
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
                <h2 className="text-xl font-bold text-slate-900 mb-4">Scheduled Tests</h2>
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
                <h2 className="text-xl font-bold text-slate-900 mb-4">Completed Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedTests.map((test) => (
                    <TestCard key={test.id} test={test} isCompleted />
                  ))}
                </div>
              </div>
            )}

            {tests?.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No tests yet</h3>
                <p className="text-slate-600 mb-6">Create your first test to get started</p>
                <Link
                  href="/dashboard/mentor/tests/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
  const submissionCount = test.submissions?.[0]?.count || 0;
  const invitationCount = test.invitations?.[0]?.count || 0;

  return (
    <Link
      href={`/dashboard/mentor/tests/${test.id}`}
      className={`block bg-white rounded-xl p-6 border hover:shadow-lg transition-all ${
        isDraft ? 'border-amber-300 hover:border-amber-400 bg-amber-50/30' : 
        isLive ? 'border-green-300 hover:border-green-400' :
        isReady ? 'border-blue-300 hover:border-blue-400 bg-blue-50/30' :
        isCompleted ? 'border-slate-300 hover:border-slate-400' :
        'border-slate-200 hover:border-indigo-300'
      }`}
    >
      {isLive && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live Now
        </span>
      )}

      {isDraft && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full mb-3">
          📝 Draft - Needs Setup
        </span>
      )}

      {isReady && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
          🚀 Ready - Go Live
        </span>
      )}

      {isCompleted && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full mb-3">
          ✅ Completed
        </span>
      )}

      <h3 className="text-lg font-bold text-slate-900 mb-2">{test.title}</h3>
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {test.description || 'No description'}
      </p>

      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
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
        <p className="text-xs text-amber-600 font-medium">
          Click to invite students and go live →
        </p>
      )}

      {isReady && (
        <p className="text-xs text-blue-600 font-medium">
          Click to start the test →
        </p>
      )}

      {isCompleted && (
        <p className="text-xs text-slate-600 font-medium">
          Click to view results →
        </p>
      )}

      {/* Debug: Show test ID */}
      <p className="text-[10px] text-slate-400 mt-2 font-mono truncate">
        ID: {test.id}
      </p>

      {test.scheduled_at && !isLive && !isDraft && !isReady && (
        <p className="text-xs text-slate-500">
          {isCompleted ? 'Conducted' : 'Scheduled'}: {new Date(test.scheduled_at).toLocaleDateString()}
        </p>
      )}
    </Link>
  );
}
