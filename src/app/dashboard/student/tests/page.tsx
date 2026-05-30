import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Play, Eye, BarChart3, Award, TrendingUp } from 'lucide-react';

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

  //Get test invitations - simplified query to diagnose issues
  const { data: invitations, error: invError } = await supabase
    .from('test_invitations')
    .select('*')
    .eq('student_id', user.id)
    .order('invited_at', { ascending: false });

  if (invError) {
    console.error('Failed to load test invitations:', invError);
  }

  // Fetch test details separately for each invitation
  const invitationsWithTests = await Promise.all(
    (invitations || []).map(async (inv) => {
      const { data: test } = await supabase
        .from('tests')
        .select('*')
        .eq('id', inv.test_id)
        .single();

      return { ...inv, test };
    })
  );

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Tests</h1>
            <p className="text-slate-600 mb-8">Your upcoming and past tests</p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Live Tests</span>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <p className="text-3xl font-bold text-green-600">{liveTests.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Pending</span>
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-600">{pendingTests.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Completed</span>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{completedTests.length}</p>
              </div>
            </div>

            {/* Live Tests */}
            {liveTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Now
                </h2>
                <div className="space-y-3">
                  {liveTests.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl p-6 border-2 border-green-500 shadow-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-1">{inv.test.title}</h3>
                          <p className="text-sm text-slate-600 mb-3">{inv.test.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {inv.test.duration_minutes} minutes
                            </span>
                            <span>📝 {inv.test.total_marks} marks</span>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/student/tests/${inv.test.id}/take-secure`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          Start Test
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Tests */}
            {pendingTests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Upcoming Tests</h2>
                <div className="space-y-3">
                  {pendingTests.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl p-6 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{inv.test.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{inv.test.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {inv.test.duration_minutes} mins
                        </span>
                        <span>📝 {inv.test.total_marks} marks</span>
                        {inv.test.scheduled_at && (
                          <span>📅 {new Date(inv.test.scheduled_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tests */}
            {completedTests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Completed Tests</h2>
                <div className="space-y-3">
                  {completedTests.map((sub) => {
                    const percentage = sub.percentage || 0;
                    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
                    const gradeColor = percentage >= 70 ? 'text-green-600 bg-green-50' : percentage >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

                    return (
                      <div key={sub.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{sub.test?.title}</h3>
                            <p className="text-sm text-slate-600 mb-3">
                              Submitted: {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>

                            {/* Score Bar */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-600">{percentage.toFixed(0)}%</span>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-slate-600">
                                <Award className="w-4 h-4" />
                                Score: {sub.score || 0}/{sub.test?.total_marks || 0}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor}`}>
                                Grade: {grade}
                              </span>
                              {sub.ai_evaluated_at && (
                                <span className="flex items-center gap-1 text-fuchsia-600">
                                  <TrendingUp className="w-4 h-4" />
                                  AI Analyzed
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/dashboard/student/tests/${sub.test_id}/results`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Results
                            </Link>
                            <Link
                              href={`/dashboard/student/tests/${sub.test_id}/results`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                              <BarChart3 className="w-4 h-4" />
                              Analytics
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {invitationsWithTests?.length === 0 && submissions?.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No tests yet</h3>
                <p className="text-slate-600">You'll see tests here when your mentor assigns them</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
