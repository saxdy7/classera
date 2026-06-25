import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Play, Eye, BarChart3, Award, TrendingUp, BookOpen, Zap } from 'lucide-react';

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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Tests</h1>
              <p className="text-slate-600">Track your upcoming tests and review your performance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">Live Tests</span>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <p className="text-3xl font-bold text-green-600">{liveTests.length}</p>
                <p className="text-xs text-slate-500 mt-2">Ready to take now</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">Pending</span>
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-600">{pendingTests.length}</p>
                <p className="text-xs text-slate-500 mt-2">Scheduled for later</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">Completed</span>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{completedTests.length}</p>
                <p className="text-xs text-slate-500 mt-2">Tests taken</p>
              </div>
            </div>

            {/* Live Tests Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-green-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">Live Now</h2>
              </div>
              {liveTests.length > 0 ? (
                <div className="space-y-3">
                  {liveTests.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-lg p-6 border-2 border-green-500 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-slate-900">{inv.test.title}</h3>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Live</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-4">{inv.test.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {inv.test.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-4 h-4" />
                              {inv.test.total_marks} marks
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/student/tests/${inv.test.id}/take-secure`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          <Play className="w-5 h-5" />
                          Start Test
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
                  <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No live tests right now</p>
                </div>
              )}
            </div>

            {/* Pending Tests Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">Upcoming Tests</h2>
              </div>
              {pendingTests.length > 0 ? (
                <div className="space-y-3">
                  {pendingTests.map((inv) => {
                    const scheduledDate = inv.test.scheduled_at ? new Date(inv.test.scheduled_at) : null;
                    const daysUntil = scheduledDate ? Math.ceil((scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <div key={inv.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-slate-900">{inv.test.title}</h3>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                {daysUntil ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : 'Scheduled'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-4">{inv.test.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {inv.test.duration_minutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                {inv.test.total_marks} marks
                              </span>
                              {scheduledDate && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {scheduledDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            disabled
                            className="px-6 py-3 bg-slate-100 text-slate-500 rounded-lg font-medium cursor-not-allowed"
                          >
                            Scheduled
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No upcoming tests scheduled</p>
                </div>
              )}
            </div>

            {/* Completed Tests Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">Test History</h2>
              </div>
              {completedTests.length > 0 ? (
                <div className="space-y-3">
                  {completedTests.map((sub) => {
                    const percentage = sub.percentage || 0;
                    const grade = getGrade(percentage);
                    const gradeColor = getGradeColor(percentage);

                    return (
                      <div key={sub.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-slate-900">{sub.test?.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColor}`}>
                                Grade: {grade}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600 mb-4">
                              Submitted: {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>

                            {/* Score Bar */}
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 w-12 text-right">{percentage.toFixed(0)}%</span>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 mt-4 text-sm">
                              <span className="flex items-center gap-1 text-slate-600">
                                <Award className="w-4 h-4" />
                                {sub.score || 0}/{sub.test?.total_marks || 0} marks
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
                          <div className="flex flex-col gap-2 whitespace-nowrap">
                            <Link
                              href={`/dashboard/student/tests/${sub.test_id}/results`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Results
                            </Link>
                            <Link
                              href={`/dashboard/student/tests/${sub.test_id}/review`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                              <BarChart3 className="w-4 h-4" />
                              Review Answers
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No completed tests yet</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
