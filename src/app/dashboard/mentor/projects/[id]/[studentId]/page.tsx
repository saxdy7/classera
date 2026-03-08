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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back */}
            <Link
              href={`/dashboard/mentor/projects/${assignmentId}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assignment
            </Link>

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-start gap-5 flex-wrap">
                {/* Student avatar */}
                {student.avatar_url ? (
                  <Image
                    src={student.avatar_url}
                    alt={student.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-700 flex-shrink-0">
                    {student.full_name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-900">{student.full_name}</h1>
                    {evaluation?.score !== null && evaluation?.score !== undefined && (
                      <span className="text-sm font-bold px-3 py-1 bg-violet-100 text-violet-700 rounded-full">
                        {evaluation.score}/{assignment.max_score}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">{student.email}</p>
                  {student.specialization_board && (
                    <p className="text-slate-400 text-sm">{student.specialization_board}</p>
                  )}

                  {/* Repo link */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-xl text-sm text-white">
                      <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{submission.repo_full_name}</span>
                    </div>
                    <a
                      href={submission.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open on GitHub
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-xs text-slate-400 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {analytics?.analyzed_at && (
                    <span className="text-slate-300">
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
              repoUrl={submission.repo_url}
              repoFullName={submission.repo_full_name}
              status={submission.status}
              analytics={analytics ?? null}
              evaluation={evaluation ?? null}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
