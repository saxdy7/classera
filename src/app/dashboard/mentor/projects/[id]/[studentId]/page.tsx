import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Clock, GitBranch } from 'lucide-react';
import ProjectReviewClient from './ProjectReviewClient';

export const dynamic = 'force-dynamic';

export default async function StudentProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id: assignmentId, studentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  // Verify assignment belongs to mentor
  const { data: assignment } = await admin
    .from('project_assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('mentor_id', user.id)
    .single();

  if (!assignment) redirect('/dashboard/mentor/projects');

  // Get student
  const { data: student } = await admin
    .from('users')
    .select('id, full_name, avatar_url, email, specialization_board')
    .eq('id', studentId)
    .single();

  if (!student) redirect(`/dashboard/mentor/projects/${assignmentId}`);

  // Get submission
  const { data: submission } = await admin
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .single();

  if (!submission) redirect(`/dashboard/mentor/projects/${assignmentId}`);

  // Get analytics
  const { data: analytics } = await admin
    .from('repo_analytics')
    .select('*')
    .eq('submission_id', submission.id)
    .single();

  // Get evaluation
  const { data: evaluation } = await admin
    .from('project_evaluations')
    .select('score, feedback, comments')
    .eq('submission_id', submission.id)
    .single();

  // Get analysis snapshots (progress history)
  const { data: snapshots } = await admin
    .from('analysis_snapshots')
    .select('overall_score, consistency_score, activity_score, quality_score, total_commits, active_days, analyzed_at')
    .eq('submission_id', submission.id)
    .order('analyzed_at', { ascending: true });

  // Resolve display names for any peers flagged by the code-similarity check
  const similarityFlags = (analytics?.similarity_flags as Array<{ peer_student_id: string }> | null) ?? [];
  const peerIds = similarityFlags.map((f) => f.peer_student_id);
  const { data: peers } = peerIds.length
    ? await admin.from('users').select('id, full_name').in('id', peerIds)
    : { data: [] };
  const peerNames = Object.fromEntries((peers ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back */}
            <Link
              href={`/dashboard/mentor/projects/${assignmentId}`}
              className="inline-flex items-center gap-2 text-sm text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assignment
            </Link>

            {/* Header card */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6">
              <div className="flex items-start gap-5 flex-wrap">
                {/* Student avatar */}
                {student.avatar_url ? (
                  <Image
                    src={student.avatar_url}
                    alt={student.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-[var(--cl-r-xl)] object-cover border border-[var(--cl-hairline)] flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-[var(--cl-r-xl)] bg-[var(--cl-primary-soft)] flex items-center justify-center text-xl font-semibold text-[var(--cl-primary)] flex-shrink-0">
                    {student.full_name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">{student.full_name}</h1>
                    {evaluation?.score !== null && evaluation?.score !== undefined && (
                      <span className="text-sm font-semibold px-3 py-1 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full">
                        {evaluation.score}/{assignment.max_score}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--cl-muted)] text-sm mt-0.5">{student.email}</p>
                  {student.specialization_board && (
                    <p className="text-[var(--cl-muted)] text-sm">{student.specialization_board}</p>
                  )}

                  {/* Submission link */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {assignment.submission_type === 'github' && (
                      <>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-lg)] text-sm text-[var(--cl-on-dark)]">
                          <GitBranch className="w-3.5 h-3.5 text-[var(--cl-muted-soft)]" />
                          <span className="font-mono">{submission.repo_full_name}</span>
                        </div>
                        <a
                          href={`https://github.com/${submission.repo_full_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-[var(--cl-primary)] hover:text-[var(--cl-primary)] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open on GitHub
                        </a>
                      </>
                    )}
                    {assignment.submission_type === 'link' && submission.submission_url && (
                      <a
                        href={submission.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-[var(--cl-primary)] hover:underline break-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        {submission.submission_url}
                      </a>
                    )}
                    {assignment.submission_type === 'file_upload' && submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-[var(--cl-primary)] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        {submission.file_name ?? 'View uploaded file'}
                      </a>
                    )}
                    {submission.deploy_url && (
                      <a
                        href={submission.deploy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-[var(--cl-primary)] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        Live site
                      </a>
                    )}
                  </div>
                  {assignment.submission_type === 'written' && submission.submission_text && (
                    <p className="mt-3 p-3 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)] text-sm text-[var(--cl-body)] whitespace-pre-line">
                      {submission.submission_text}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 text-xs text-[var(--cl-muted-soft)] flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {analytics?.analyzed_at && (
                    <span className="text-[var(--cl-muted)]">
                      Analyzed {new Date(analytics.analyzed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Review client (tabs) */}
            <ProjectReviewClient
              assignmentId={assignmentId}
              submissionId={submission.id}
              studentId={studentId}
              maxScore={assignment.max_score}
              submissionType={assignment.submission_type}
              repoUrl={submission.repo_full_name ? `https://github.com/${submission.repo_full_name}` : null}
              repoFullName={submission.repo_full_name}
              status={submission.status}
              analytics={analytics ?? null}
              evaluation={evaluation ?? null}
              snapshots={snapshots ?? []}
              peerNames={peerNames}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
