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
import StalenessBanner from '@/components/projects/StalenessBanner';
import MilestoneChecklist from '@/components/projects/MilestoneChecklist';
import SubmissionForm from './SubmissionForm';
import PortfolioToggle from './PortfolioToggle';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    submitted:  { label: 'Submitted',  className: 'bg-accent-purple/10 text-accent-purple' },
    analyzing:  { label: 'Analyzing',  className: 'bg-amber-500/10 text-amber-600' },
    analyzed:   { label: 'Analyzed',   className: 'bg-green-500/10 text-green-600' },
    reviewed:   { label: 'Reviewed',   className: 'bg-accent-purple/10 text-accent-purple' },
    graded:     { label: 'Graded',     className: 'bg-accent-purple/10 text-accent-purple' },
  };
  const s = map[status] ?? { label: status, className: 'bg-muted text-foreground/80' };
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
        .select('score, feedback, comments, evaluated_at, featured_on_portfolio')
        .eq('submission_id', submission.id)
        .single()
    : { data: null };

  // Rubric breakdown, shown read-only once graded (mentor grades against this same rubric)
  const { data: rubric } = await admin
    .from('assignment_rubrics')
    .select('id, criteria')
    .eq('assignment_id', assignmentId)
    .single();

  type RubricCriterion = { id: string; name: string; description?: string; max_points: number; weight: number };
  const { data: rubricScores } = rubric && submission
    ? await admin
        .from('rubric_scores')
        .select('criterion_id, score, comment')
        .eq('submission_id', submission.id)
        .eq('rubric_id', rubric.id)
    : { data: [] };
  const rubricScoreMap = new Map((rubricScores ?? []).map((s) => [s.criterion_id, s]));
  const rubricCriteria = ((rubric?.criteria as RubricCriterion[] | null) ?? []);

  // Checkpoint tasks the mentor created for this assignment (tasks.assignment_id).
  const { data: milestoneTasks } = await admin
    .from('tasks')
    .select('id, title, status, due_date')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .order('due_date', { ascending: true });

  // Check GitHub connection
  const { data: githubConnection } = await admin
    .from('github_connections')
    .select('github_username, github_avatar_url')
    .eq('user_id', user.id)
    .single();

  const { data: { session } } = await supabase.auth.getSession();
  const githubIdentity = user?.identities?.find((id) => id.provider === 'github');

  const isGithubConnected = !!githubIdentity || !!session?.provider_token || !!githubConnection;

  const githubUsername = githubIdentity?.identity_data?.preferred_username 
                      || githubIdentity?.identity_data?.user_name
                      || githubConnection?.github_username;
  
  const githubAvatarUrl = githubIdentity?.identity_data?.avatar_url
                       || githubConnection?.github_avatar_url;

  const now = new Date();
  const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
  const isOverdue = deadline && deadline < now && !submission;

  return (
    <div className="min-h-screen bg-muted/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-accent-purple font-semibold uppercase tracking-wider mb-3">
              <GitBranch className="w-4 h-4" />
              Assignment Submission
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{assignment.title}</h1>
                <p className="text-muted-foreground mt-1">
                  By {(assignment.users as { full_name: string } | null)?.full_name ?? 'Mentor'}
                  {!assignment.is_active && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full align-middle">Closed</span>
                  )}
                </p>
              </div>
              <Link
                href="/dashboard/student/projects"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2 bg-card"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Main column ── */}
              <div className="lg:col-span-2 space-y-5">

                {/* GitHub connect - only relevant for GitHub-repo submissions */}
                {assignment.submission_type === 'github' && (
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-accent-purple" />
                      Repository Connection
                    </h2>

                    {!isGithubConnected ? (
                      <div className="border-2 border-dashed border-border rounded-xl bg-muted/40 p-8 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mb-4">
                          <GitBranch className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-foreground">Connect GitHub Account</h3>
                        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
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
                      <div className="bg-accent-purple/10 border border-accent-purple rounded-xl p-5 mb-5">
                        <div className="flex items-center gap-3">
                          {githubAvatarUrl ? (
                            <img src={githubAvatarUrl} alt={githubUsername || "GitHub User"} className="w-10 h-10 rounded-full border-2 border-accent-purple" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                              <GitBranch className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <p className="text-sm font-semibold text-foreground">GitHub Connected</p>
                            </div>
                            <p className="text-xs text-muted-foreground">@{githubUsername}</p>
                          </div>
                          <GitHubConnectButton
                            connected={true}
                            username={githubUsername}
                            avatarUrl={githubAvatarUrl}
                          />
                        </div>
                      </div>
                    )}

                    {/* Repo URL + submit */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">Repository URL</h3>
                        {submission && <StatusBadge status={submission.status} />}
                      </div>

                      {submission ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-lg">
                            <GitBranch className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
                            <span className="font-mono text-sm text-white flex-1 truncate">
                              {submission.repo_full_name}
                            </span>
                            <a
                              href={`https://github.com/${submission.repo_full_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-accent-purple hover:text-accent-purple flex-shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open on GitHub
                            </a>
                          </div>
                          <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                              month: 'long', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                          {submission.status !== 'graded' && (
                            <div className="pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground mb-2 font-medium">Update repository URL</p>
                              <SubmissionForm assignmentId={assignmentId} submissionType="github" existing={submission} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <SubmissionForm assignmentId={assignmentId} submissionType="github" />
                      )}
                    </div>
                  </div>
                )}

                {/* Non-GitHub submission types */}
                {assignment.submission_type !== 'github' && (
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-semibold text-foreground">Your Submission</h2>
                      {submission && <StatusBadge status={submission.status} />}
                    </div>

                    {submission && (
                      <div className="mb-4 space-y-3">
                        {assignment.submission_type === 'link' && submission.submission_url && (
                          <a
                            href={submission.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg text-sm text-accent-purple hover:underline break-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                            {submission.submission_url}
                          </a>
                        )}
                        {assignment.submission_type === 'written' && submission.submission_text && (
                          <p className="p-3 bg-muted/40 rounded-lg text-sm text-foreground/80 whitespace-pre-line">
                            {submission.submission_text}
                          </p>
                        )}
                        {assignment.submission_type === 'file_upload' && submission.file_url && (
                          <a
                            href={submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg text-sm text-accent-purple hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                            {submission.file_name ?? 'View uploaded file'}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}

                    {(!submission || submission.status !== 'graded') && (
                      <SubmissionForm
                        assignmentId={assignmentId}
                        submissionType={assignment.submission_type}
                        existing={submission ?? undefined}
                      />
                    )}
                  </div>
                )}

                <MilestoneChecklist initialTasks={(milestoneTasks ?? []) as any} />

                {submission?.deploy_url && (
                  <a
                    href={submission.deploy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-3 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Live Site
                  </a>
                )}

                {/* Evaluation feedback */}
                {evaluation && (
                  <div className="bg-card rounded-xl border border-green-600 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <h2 className="text-base font-semibold text-foreground">Mentor Feedback</h2>
                      {evaluation.score !== null && (
                        <span className="ml-auto text-xl font-semibold text-accent-purple">
                          {evaluation.score}<span className="text-muted-foreground/70 font-normal text-sm">/{assignment.max_score}</span>
                        </span>
                      )}
                    </div>
                    {evaluation.feedback && (
                      <p className="text-sm text-foreground/80 whitespace-pre-line mb-4 leading-relaxed">{evaluation.feedback}</p>
                    )}
                    {Array.isArray(evaluation.comments) && evaluation.comments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comments</p>
                        {(evaluation.comments as Array<{ text: string; created_at: string }>).map((c, i) => (
                          <div key={i} className="bg-muted/40 rounded-lg p-3">
                            <p className="text-sm text-foreground/80">{c.text}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border">
                      <PortfolioToggle assignmentId={assignmentId} initialFeatured={evaluation.featured_on_portfolio ?? false} />
                    </div>
                  </div>
                )}

                {/* Rubric breakdown */}
                {evaluation && rubricCriteria.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Rubric Breakdown</h2>
                    <div className="space-y-3">
                      {rubricCriteria.map((criterion) => {
                        const scored = rubricScoreMap.get(criterion.id);
                        return (
                          <div key={criterion.id} className="p-3 bg-muted/40 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{criterion.name}</p>
                                {criterion.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-accent-purple flex-shrink-0">
                                {scored ? scored.score : '—'}<span className="text-muted-foreground/70 font-normal">/{criterion.max_points}</span>
                              </span>
                            </div>
                            {scored?.comment && (
                              <p className="text-xs text-foreground/80 mt-2 italic">{scored.comment}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Analytics preview */}
                {analytics && (
                  <div className="space-y-4">
                    <StalenessBanner submissionId={submission!.id} analyzedAt={analytics.analyzed_at} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Commits', value: analytics.total_commits },
                        { label: 'Active Days', value: analytics.active_days },
                        { label: 'Files', value: analytics.total_files },
                        { label: 'Score', value: `${analytics.overall_score}/100` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                          <p className="text-2xl font-semibold text-foreground">{value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-600" />
                        My Coding Activity
                      </h3>
                      <ActivityHeatmap dailyActivity={analytics.daily_activity} weeks={26} />
                    </div>
                    {analytics.suspicious_flags?.length > 0 && (
                      <div className="bg-card border border-border rounded-xl p-5">
                        <SuspiciousActivityAlert flags={analytics.suspicious_flags} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sidebar ── */}
              <div className="space-y-5">

                {/* Deadline + score */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="space-y-3">
                    {deadline && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${
                        isOverdue ? 'bg-destructive/10' : deadline.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 ? 'bg-amber-500/10' : 'bg-muted/40'
                      }`}>
                        <Calendar className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deadline</p>
                          <p className={`text-sm font-semibold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                            {isOverdue ? 'Overdue — ' : ''}{deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-accent-purple/10 rounded-lg">
                      <Star className="w-4 h-4 text-accent-purple flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Score</p>
                        <p className="text-sm font-semibold text-accent-purple">{assignment.max_score} points</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements / Guidelines */}
                {(assignment.description || assignment.requirements) && (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent-purple" />
                      Project Guidelines
                    </h3>
                    {assignment.requirements ? (
                      <ul className="space-y-3">
                        {assignment.requirements.split('\n').filter(Boolean).map((req: string, i: number) => (
                          <li key={i} className="flex gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground/80">{req}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-foreground/80 leading-relaxed">{assignment.description}</p>
                    )}
                  </div>
                )}

                {/* Technologies */}
                {assignment.technologies?.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-accent-purple" />
                      Tech Requirements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {assignment.technologies.map((t: string) => (
                        <span key={t} className="text-xs px-3 py-1.5 bg-muted text-foreground/80 rounded-full font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help */}
                {assignment.submission_type === 'github' && (
                  <div className="bg-accent-purple/10 border border-accent-purple rounded-xl p-5">
                    <div className="flex gap-3">
                      <HelpCircle className="w-5 h-5 text-accent-purple flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Need help?</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Public repos work out of the box. For a private repo, connect your GitHub account above first so analysis can access it.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {assignment.submission_type === 'github' && !isGithubConnected && (
                  <div className="bg-amber-500/10 border border-amber-500 rounded-xl p-4">
                    <div className="flex gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600">
                        Without a connected GitHub account, only <strong>public</strong> repositories can be analyzed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
