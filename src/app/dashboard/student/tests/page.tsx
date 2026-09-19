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
    if (percentage >= 70) return 'text-[var(--cl-success)] bg-[rgba(22,163,74,0.12)]';
    if (percentage >= 50) return 'text-[var(--cl-warning)] bg-[rgba(171,100,0,0.12)]';
    return 'text-[var(--cl-error)] bg-[rgba(239,68,68,0.12)]';
  };

  return (
    <div className="min-h-screen bg-[var(--cl-canvas)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-semibold text-[var(--cl-ink)] mb-2">Tests</h1>
              <p className="text-[var(--cl-body)]">Track your upcoming tests and review your performance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Live Tests</span>
                  <div className="w-3 h-3 bg-[var(--cl-success)] rounded-full animate-pulse" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-success)]">{liveTests.length}</p>
                <p className="text-xs text-[var(--cl-muted)] mt-2">Ready to take now</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Pending</span>
                  <AlertCircle className="w-5 h-5 text-[var(--cl-warning)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-warning)]">{pendingTests.length}</p>
                <p className="text-xs text-[var(--cl-muted)] mt-2">Scheduled for later</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Completed</span>
                  <CheckCircle className="w-5 h-5 text-[var(--cl-info)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-info)]">{completedTests.length}</p>
                <p className="text-xs text-[var(--cl-muted)] mt-2">Tests taken</p>
              </div>
            </div>

            {/* Live Tests Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[var(--cl-success)] rounded-full" />
                <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Live Now</h2>
              </div>
              {liveTests.length > 0 ? (
                <div className="space-y-3">
                  {liveTests.map((inv) => (
                    <div key={inv.id} className="relative bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-success)] hover:-translate-y-0.5 transition-all overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--cl-success)]" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-[var(--cl-ink)]">{inv.test.title}</h3>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] text-xs font-semibold rounded-full">
                              <span className="w-1.5 h-1.5 bg-[var(--cl-success)] rounded-full animate-pulse" />
                              LIVE
                            </span>
                          </div>
                          <p className="text-sm text-[var(--cl-body)] mb-4">{inv.test.description}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg font-medium">
                              <Clock className="w-4 h-4" />
                              {inv.test.duration_minutes} min
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] rounded-lg font-medium">
                              <Zap className="w-4 h-4" />
                              {inv.test.total_marks} pts
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/student/tests/${inv.test.id}/take-secure`}
                          className="inline-flex items-center gap-2 px-6 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold transition-all whitespace-nowrap bg-[var(--cl-success)]"
                        >
                          <Play className="w-5 h-5" />
                          Start Test
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--cl-surface-card)] rounded-lg p-12 text-center border border-[var(--cl-hairline)]">
                  <Zap className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                  <p className="text-[var(--cl-muted)]">No live tests right now</p>
                </div>
              )}
            </div>

            {/* Pending Tests Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[var(--cl-warning)] rounded-full" />
                <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Upcoming Tests</h2>
              </div>
              {pendingTests.length > 0 ? (
                <div className="space-y-3">
                  {pendingTests.map((inv) => {
                    const scheduledDate = inv.test.scheduled_at ? new Date(inv.test.scheduled_at) : null;
                    const daysUntil = scheduledDate ? Math.ceil((scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <div key={inv.id} className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-[var(--cl-ink)]">{inv.test.title}</h3>
                              <span className="px-2 py-1 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] text-xs font-semibold rounded-full">
                                {daysUntil ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : 'Scheduled'}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--cl-body)] mb-4">{inv.test.description}</p>
                            <div className="flex items-center gap-4 text-sm text-[var(--cl-body)]">
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
                            className="px-6 py-3 bg-[var(--cl-surface-strong)] text-[var(--cl-muted)] rounded-lg font-medium cursor-not-allowed"
                          >
                            Scheduled
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[var(--cl-surface-card)] rounded-lg p-12 text-center border border-[var(--cl-hairline)]">
                  <AlertCircle className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                  <p className="text-[var(--cl-muted)]">No upcoming tests scheduled</p>
                </div>
              )}
            </div>

            {/* Completed Tests Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[var(--cl-info)] rounded-full" />
                <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Test History</h2>
              </div>
              {completedTests.length > 0 ? (
                <div className="space-y-3">
                  {completedTests.map((sub) => {
                    const percentage = sub.percentage || 0;
                    const grade = getGrade(percentage);
                    const gradeColor = getGradeColor(percentage);

                    return (
                      <div key={sub.id} className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)] transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-[var(--cl-ink)]">{sub.test?.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${gradeColor}`}>
                                Grade: {grade}
                              </span>
                            </div>

                            <p className="text-sm text-[var(--cl-body)] mb-4">
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
                              <div className="flex-1 h-2 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentage >= 70 ? 'bg-[var(--cl-success)]' : percentage >= 50 ? 'bg-[var(--cl-warning)]' : 'bg-[var(--cl-error)]'}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-[var(--cl-body)] w-12 text-right">{percentage.toFixed(0)}%</span>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 mt-4 text-sm">
                              <span className="flex items-center gap-1 text-[var(--cl-body)]">
                                <Award className="w-4 h-4" />
                                {sub.score || 0}/{sub.test?.total_marks || 0} marks
                              </span>
                              {sub.ai_evaluated_at && (
                                <span className="flex items-center gap-1 text-[var(--cl-primary)]">
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
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-lg text-sm font-medium hover:bg-[var(--cl-primary)] transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Results
                            </Link>
                            <Link
                              href={`/dashboard/student/tests/${sub.test_id}/review`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg text-sm font-medium hover:bg-[var(--cl-surface-strong)] transition-colors"
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
                <div className="bg-[var(--cl-surface-card)] rounded-lg p-12 text-center border border-[var(--cl-hairline)]">
                  <CheckCircle className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                  <p className="text-[var(--cl-muted)]">No completed tests yet</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
