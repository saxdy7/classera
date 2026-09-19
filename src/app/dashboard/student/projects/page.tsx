import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { ArrowRight, GitBranch, Code, ExternalLink } from 'lucide-react';
import StudentInsightCard from '@/components/projects/StudentInsightCard';

export const dynamic = 'force-dynamic';

export default async function StudentProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'student') redirect('/dashboard/mentor');

  // Get all assignments assigned to this student, with submissions
  const { data: assignedRows } = await admin
    .from('assignment_students')
    .select(`
      assignment_id,
      assigned_at,
      project_assignments (
        id, title, description, technologies, deadline, max_score, is_active,
        users!project_assignments_mentor_id_fkey (full_name, avatar_url)
      )
    `)
    .eq('student_id', user.id)
    .order('assigned_at', { ascending: false });

  // Get my submissions, with their cached GitHub analytics (if any)
  const assignmentIds = (assignedRows ?? []).map((r) => r.assignment_id);
  const { data: submissions } = assignmentIds.length
    ? await admin
        .from('assignment_submissions')
        .select('id, assignment_id, status, submitted_at, repo_url, repo_full_name, repo_analytics(total_commits, overall_score, analyzed_at, student_insight)')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds)
    : { data: [] };

  const { data: evaluations } = await admin
    .from('project_evaluations')
    .select('assignment_id, score, feedback, evaluated_at')
    .eq('student_id', user.id)
    .order('evaluated_at', { ascending: false });

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));
  const evaluationMap = new Map((evaluations ?? []).map((e) => [e.assignment_id, e]));

  const totalAssigned = (assignedRows ?? []).length;
  const totalSubmitted = (submissions ?? []).length;
  const totalPending = totalAssigned - totalSubmitted;

  // Real aggregates across the student's own analyzed repos - replaces the
  // previous hardcoded "1,240 commits / Top 5% / A+" panel, which showed the
  // exact same numbers for every student regardless of their actual work.
  const analyzedSubs = (submissions ?? []).filter((s) => s.repo_analytics);
  const totalCommits = analyzedSubs.reduce((sum, s: any) => sum + (s.repo_analytics?.total_commits ?? 0), 0);
  const avgScore = analyzedSubs.length
    ? Math.round(analyzedSubs.reduce((sum, s: any) => sum + (s.repo_analytics?.overall_score ?? 0), 0) / analyzedSubs.length)
    : null;
  const grade =
    avgScore === null ? null :
    avgScore >= 90 ? 'A+' :
    avgScore >= 80 ? 'A' :
    avgScore >= 70 ? 'B' :
    avgScore >= 60 ? 'C' : 'D';

  const latestFeedback = (evaluations ?? []).find((e) => e.feedback && e.feedback.trim().length > 0);

  // Most recently analyzed submission drives the AI "what to improve next" card.
  const latestAnalyzed = analyzedSubs
    .slice()
    .sort((a: any, b: any) => new Date(b.repo_analytics.analyzed_at).getTime() - new Date(a.repo_analytics.analyzed_at).getTime())[0] as any;

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={{ id: '1', full_name: 'Student', role: 'student', avatar_url: '' }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-[var(--cl-primary)] font-semibold text-[10px] uppercase tracking-[0.2em] mb-2">
                <GitBranch className="w-4 h-4" />
                Clario Project Hub
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-none">Your Engineering Roadmap.</h1>
              <p className="text-[var(--cl-muted)] mt-2 font-medium">Build, commit, and master your technical skills.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Assigned', value: totalAssigned, color: 'bg-[var(--cl-surface-card)] border-[var(--cl-hairline)]', text: 'text-[var(--cl-ink)]' },
                { label: 'Completed', value: totalSubmitted, color: 'bg-[var(--cl-surface-card)] border-[var(--cl-hairline)]', text: 'text-[var(--cl-ink)]' },
                { label: 'Pending', value: totalPending, color: 'bg-[var(--cl-surface-card)] border-[var(--cl-hairline)]', text: 'text-[var(--cl-warning)]' },
                { label: 'Avg. Quality Grade', value: grade ?? '—', color: 'bg-[var(--cl-primary)] border-[var(--cl-primary)]', text: 'text-[var(--cl-on-dark)]' },
              ].map(({ label, value, color, text }) => (
                <div key={label} className={`${color} border rounded-[var(--cl-r-xl)] p-6`}>
                  <p className={`text-3xl font-semibold italic ${text || 'text-[var(--cl-ink)]'}`}>{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mt-1 opacity-60">{label}</p>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Projects List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-semibold text-[var(--cl-muted-soft)] uppercase tracking-widest px-1">Current Assignments</h3>
                {(!assignedRows || assignedRows.length === 0) ? (
                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-12 text-center">
                    <p className="text-[var(--cl-muted-soft)] font-semibold italic">No active projects yet.</p>
                  </div>
                ) : (
                  assignedRows.map((row) => {
                    const a = row.project_assignments as any;
                    if (!a) return null;
                    const submission = submissionMap.get(row.assignment_id);
                    const evaluation = evaluationMap.get(row.assignment_id);
                    
                    return (
                      <Link key={row.assignment_id} href={`/dashboard/student/projects/${row.assignment_id}`}
                        className="group bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] p-6 rounded-[2rem] hover:border-[var(--cl-primary)] transition-all flex items-center justify-between">
                        <div className="flex gap-5 items-center">
                           <div className="w-12 h-12 rounded-[var(--cl-r-xl)] bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] flex items-center justify-center group-hover:bg-[var(--cl-primary)] group-hover:text-[var(--cl-on-dark)] transition-all">
                              <GitBranch size={20} />
                           </div>
                           <div>
                              <h4 className="text-lg font-semibold text-[var(--cl-ink)]">{a.title}</h4>
                              <p className="text-xs font-semibold text-[var(--cl-muted-soft)] uppercase tracking-widest mt-1">Deadline: {a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No limit'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           {evaluation && (
                             <div className="text-right">
                                <p className="text-xl font-semibold text-[var(--cl-primary)] italic leading-none">{evaluation.score}/{a.max_score}</p>
                                <p className="text-[10px] font-semibold text-[var(--cl-muted-soft)] uppercase mt-1">Grade</p>
                             </div>
                           )}
                           <div className="w-10 h-10 rounded-full border border-[var(--cl-hairline)] flex items-center justify-center text-[var(--cl-muted-soft)] group-hover:text-[var(--cl-primary)] group-hover:border-[var(--cl-primary)] transition-all">
                              <ArrowRight size={18} />
                           </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>

              {/* GitHub Insights Sidebar */}
              <div className="space-y-6">
                 <div className="bg-[var(--cl-surface-inverse)] rounded-[2.5rem] p-8 text-[var(--cl-on-dark)] relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-card)] border border-[var(--cl-primary)] flex items-center justify-center">
                          <GitBranch className="text-[var(--cl-primary)] w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-semibold uppercase tracking-widest">GitHub Intelligence</h4>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)] p-4">
                            <p className="text-[10px] font-semibold uppercase text-[var(--cl-muted)] mb-1">Commits</p>
                            <p className="text-xl font-semibold italic">{totalCommits.toLocaleString()}</p>
                          </div>
                          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[var(--cl-r-xl)] p-4">
                            <p className="text-[10px] font-semibold uppercase text-[var(--cl-muted)] mb-1">Avg. Score</p>
                            <p className="text-xl font-semibold italic">{avgScore ?? '—'}</p>
                          </div>
                        </div>

                        <StudentInsightCard
                          submissionId={latestAnalyzed?.id ?? null}
                          cachedNote={latestAnalyzed?.repo_analytics?.student_insight?.note ?? null}
                          grade={grade}
                          analyzedCount={analyzedSubs.length}
                        />
                      </div>
                    </div>
                 </div>

                 <div className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-semibold text-[var(--cl-ink)] uppercase tracking-widest mb-6">Mentor Feedback</h4>
                    <div className="p-5 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] italic font-medium text-[var(--cl-body)] text-xs leading-relaxed">
                       {latestFeedback?.feedback
                         ? `"${latestFeedback.feedback}"`
                         : 'No feedback yet — check back after your mentor reviews a submission.'}
                    </div>
                 </div>
              </div>

            </div>

            {/* Repository Explorer Section */}
            <div className="mt-16 pt-8 border-t border-[var(--cl-hairline)]">
              <div className="mb-8">
                <div className="flex items-center gap-2 text-[var(--cl-info)] font-semibold text-[10px] uppercase tracking-[0.2em] mb-2">
                  <Code className="w-4 h-4" />
                  Source Code & Repository
                </div>
                <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Explore Your Project Code</h2>
                <p className="text-[var(--cl-muted)] mt-2 font-medium">Browse repository structures, source code roadmap, and view files directly from GitHub.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedRows && assignedRows.length > 0 && assignedRows.some((row) => submissionMap.get(row.assignment_id)?.repo_full_name) ? (
                  assignedRows
                    .filter((row) => submissionMap.get(row.assignment_id)?.repo_full_name)
                    .slice(0, 6)
                    .map((row) => {
                      const a = row.project_assignments as any;
                      const submission = submissionMap.get(row.assignment_id) as any;
                      if (!a || !submission?.repo_full_name) return null;

                      return (
                        <div
                          key={row.assignment_id}
                          className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] transition overflow-hidden"
                        >
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-[var(--cl-hairline)] bg-[rgba(13,116,206,0.12)]">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--cl-info)] text-[var(--cl-on-dark)] flex items-center justify-center">
                                <Code className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[var(--cl-ink)] text-sm truncate">{a.title}</h4>
                                <p className="text-xs text-[var(--cl-muted)] mt-1 truncate">
                                  {submission.repo_full_name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="px-6 py-3 text-xs text-[var(--cl-body)] line-clamp-2 border-b border-[var(--cl-hairline)]">
                            {a.description || 'View source code and explore repository structure'}
                          </div>

                          {/* Actions */}
                          <div className="p-4 flex gap-2">
                            <Link
                              href={`/dashboard/student/projects/${row.assignment_id}`}
                              className="flex-1 px-3 py-2 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] rounded-lg hover:bg-[rgba(13,116,206,0.12)] transition text-xs font-semibold text-center flex items-center justify-center gap-1"
                            >
                              <Code className="w-3 h-3" />
                              View Analytics
                            </Link>
                            <a
                              href={submission.repo_url || `https://github.com/${submission.repo_full_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg hover:bg-[var(--cl-surface-strong)] transition text-xs font-semibold text-center flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open on GitHub
                            </a>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="col-span-full bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-12 text-center">
                    <Code className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                    <p className="text-[var(--cl-muted)] font-medium">No projects with repositories yet</p>
                    <p className="text-xs text-[var(--cl-muted-soft)] mt-1">Link a GitHub repository to any project to explore its source code</p>
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
