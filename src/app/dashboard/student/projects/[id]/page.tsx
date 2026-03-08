import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Star,
  AlertCircle,
  BookOpen,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import ActivityHeatmap from '@/components/projects/ActivityHeatmap';
import SuspiciousActivityAlert from '@/components/projects/SuspiciousActivityAlert';
import GitHubConnectButton from '@/components/projects/GitHubConnectButton';
import RepoSubmitForm from './RepoSubmitForm';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    submitted:  { label: 'Submitted',  className: 'bg-blue-50 text-blue-700' },
    analyzing:  { label: 'Analyzing',  className: 'bg-amber-50 text-amber-700' },
    analyzed:   { label: 'Analyzed',   className: 'bg-emerald-50 text-emerald-700' },
    reviewed:   { label: 'Reviewed',   className: 'bg-purple-50 text-purple-700' },
    graded:     { label: 'Graded',     className: 'bg-violet-50 text-violet-700' },
  };
  const s = map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.className}`}>{s.label}</span>;
}

export default async function StudentProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assignmentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'student') redirect('/dashboard/mentor');

  // Verify student is assigned
  const { data: assignedRow } = await admin
    .from('assignment_students')
    .select('assignment_id')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single();

  if (!assignedRow) redirect('/dashboard/student/projects');

  // Get assignment
  const { data: assignment } = await admin
    .from('project_assignments')
    .select('*, users!project_assignments_mentor_id_fkey(full_name, avatar_url)')
    .eq('id', assignmentId)
    .single();

  if (!assignment) redirect('/dashboard/student/projects');

  // Get submission
  const { data: submission } = await admin
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single();

  // Get analytics
  const { data: analytics } = submission
    ? await admin.from('repo_analytics').select('*').eq('submission_id', submission.id).single()
    : { data: null };

  // Get evaluation
  const { data: evaluation } = submission
    ? await admin
        .from('project_evaluations')
        .select('score, feedback, comments, evaluated_at')
        .eq('submission_id', submission.id)
        .single()
    : { data: null };

  // Check GitHub connection
  const { data: githubConnection } = await admin
    .from('github_connections')
    .select('github_username, github_avatar_url')
    .eq('user_id', user.id)
    .single();

  const now = new Date();
  const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
  const isOverdue = deadline && deadline < now && !submission;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-violet-600 font-semibold uppercase tracking-wider mb-3">
              <GitBranch className="w-4 h-4" />
              Assignment Submission
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">{assignment.title}</h1>
                <p className="text-slate-500 mt-1">
                  By {(assignment.users as { full_name: string } | null)?.full_name ?? 'Mentor'}
                  {!assignment.is_active && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full align-middle">Closed</span>
                  )}
                </p>
              </div>
              <Link
                href="/dashboard/student/projects"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 rounded-xl px-3 py-2 bg-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Main column ── */}
              <div className="lg:col-span-2 space-y-5">

                {/* GitHub connect */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-violet-600" />
                    Repository Connection
                  </h2>

                  {!githubConnection ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 p-8 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center mb-4">
                        <GitBranch className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-slate-900">Connect GitHub Account</h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-sm">
                        Link your GitHub account to verify your repository and pull commit data for your submission.
                      </p>
                      <GitHubConnectButton
                        connected={false}
                        username={null}
                        avatarUrl={null}
                        returnTo={`/dashboard/student/projects/${assignmentId}`}
                      />
                    </div>
                  ) : (
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-5">
                      <div className="flex items-center gap-3">
                        {githubConnection.github_avatar_url ? (
                          <img src={githubConnection.github_avatar_url} alt={githubConnection.github_username} className="w-10 h-10 rounded-full border-2 border-violet-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <p className="text-sm font-bold text-slate-900">GitHub Connected</p>
                          </div>
                          <p className="text-xs text-slate-500">@{githubConnection.github_username}</p>
                        </div>
                        <GitHubConnectButton
                          connected={true}
                          username={githubConnection.github_username}
                          avatarUrl={githubConnection.github_avatar_url}
                        />
                      </div>
                    </div>
                  )}

                  {/* Repo URL + submit */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-800">Repository URL</h3>
                      {submission && <StatusBadge status={submission.status} />}
                    </div>

                    {submission ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl">
                          <GitBranch className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-sm text-white flex-1 truncate">
                            {submission.repo_full_name}
                          </span>
                          <a
                            href={submission.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 flex-shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open on GitHub
                          </a>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                        {submission.status !== 'graded' && (
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-2 font-medium">Update repository URL</p>
                            <RepoSubmitForm assignmentId={assignmentId} existingUrl={submission.repo_url} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <RepoSubmitForm assignmentId={assignmentId} />
                    )}
                  </div>
                </div>

                {/* Evaluation feedback */}
                {evaluation && (
                  <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base font-bold text-slate-900">Mentor Feedback</h2>
                      {evaluation.score !== null && (
                        <span className="ml-auto text-xl font-black text-violet-700">
                          {evaluation.score}<span className="text-slate-400 font-normal text-sm">/{assignment.max_score}</span>
                        </span>
                      )}
                    </div>
                    {evaluation.feedback && (
                      <p className="text-sm text-slate-600 whitespace-pre-line mb-4 leading-relaxed">{evaluation.feedback}</p>
                    )}
                    {Array.isArray(evaluation.comments) && evaluation.comments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Comments</p>
                        {(evaluation.comments as Array<{ text: string; created_at: string }>).map((c, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-3">
                            <p className="text-sm text-slate-700">{c.text}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics preview */}
                {analytics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Commits', value: analytics.total_commits },
                        { label: 'Active Days', value: analytics.active_days },
                        { label: 'Files', value: analytics.total_files },
                        { label: 'Score', value: `${analytics.overall_score}/100` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                          <p className="text-2xl font-black text-slate-900">{value}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        My Coding Activity
                      </h3>
                      <ActivityHeatmap dailyActivity={analytics.daily_activity} weeks={26} />
                    </div>
                    {analytics.suspicious_flags?.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <SuspiciousActivityAlert flags={analytics.suspicious_flags} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sidebar ── */}
              <div className="space-y-5">

                {/* Deadline + score */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="space-y-3">
                    {deadline && (
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${
                        isOverdue ? 'bg-red-50' : deadline.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 ? 'bg-amber-50' : 'bg-slate-50'
                      }`}>
                        <Calendar className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Deadline</p>
                          <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                            {isOverdue ? 'Overdue — ' : ''}{deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                      <Star className="w-4 h-4 text-violet-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Max Score</p>
                        <p className="text-sm font-bold text-violet-700">{assignment.max_score} points</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements / Guidelines */}
                {(assignment.description || assignment.requirements) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                      Project Guidelines
                    </h3>
                    {assignment.requirements ? (
                      <ul className="space-y-3">
                        {assignment.requirements.split('\n').filter(Boolean).map((req: string, i: number) => (
                          <li key={i} className="flex gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600">{req}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed">{assignment.description}</p>
                    )}
                  </div>
                )}

                {/* Technologies */}
                {assignment.technologies?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-violet-600" />
                      Tech Requirements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {assignment.technologies.map((t: string) => (
                        <span key={t} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help */}
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <HelpCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Need help?</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Make sure your GitHub account is connected and your repository is public during evaluation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alert about private repos */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Repository must be <strong>public</strong> for automated analysis to work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
