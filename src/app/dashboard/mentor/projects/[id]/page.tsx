import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  ArrowLeft,
  GitBranch,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Star,
  FileCode,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import SubmissionsList from './SubmissionsList';
import BatchToolbar from '@/components/projects/BatchToolbar';
import AddStudentsButton from './AddStudentsButton';
import MilestonesSection from './MilestonesSection';

export const dynamic = 'force-dynamic';

type Submission = {
  id: string;
  student_id: string;
  repo_url: string;
  repo_full_name: string;
  submitted_at: string;
  status: string;
  student: { id: string; full_name: string; avatar_url: string | null; email: string } | null;
  analytics: {
    overall_score: number;
    consistency_score: number;
    activity_score: number;
    quality_score: number;
    total_commits: number;
    suspicious_flags: Array<{ type: string; severity: string }>;
    last_push_at: string | null;
  } | null;
  evaluation: { score: number | null } | null;
};

type AssignedStudent = {
  student_id: string;
  student: { id: string; full_name: string; avatar_url: string | null; email: string } | null;
};

function statusColor(status: string) {
  switch (status) {
    case 'graded': return 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]';
    case 'reviewed': return 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]';
    case 'analyzed': return 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]';
    case 'analyzing': return 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]';
    case 'submitted': return 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)]';
    default: return 'bg-[var(--cl-surface-strong)] text-[var(--cl-muted)]';
  }
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  const { data: assignment } = await admin
    .from('project_assignments')
    .select('*')
    .eq('id', id)
    .eq('mentor_id', user.id)
    .single();

  if (!assignment) redirect('/dashboard/mentor/projects');

  const { data: assignedStudents } = await admin
    .from('assignment_students')
    .select('student_id, student:users!assignment_students_student_id_fkey(id, full_name, avatar_url, email)')
    .eq('assignment_id', id);

  const { data: submissions } = await admin
    .from('assignment_submissions')
    .select(`
      id, student_id, repo_url, repo_full_name, submitted_at, status,
      student:users!assignment_submissions_student_id_fkey(id, full_name, avatar_url, email),
      analytics:repo_analytics(overall_score, consistency_score, activity_score, quality_score, total_commits, suspicious_flags, last_push_at),
      evaluation:project_evaluations(score)
    `)
    .eq('assignment_id', id)
    .order('submitted_at', { ascending: false });

  const subList = (submissions ?? []) as unknown as Submission[];
  const assigned = (assignedStudents ?? []) as unknown as AssignedStudent[];

  // Students at the same university not yet on this assignment's roster.
  const assignedIds = new Set(assigned.map((a) => a.student_id));
  const { data: universityStudents } = await admin
    .from('users')
    .select('id, full_name, email, avatar_url')
    .eq('role', 'student')
    .eq('university_id', profile.university_id)
    .order('full_name');
  const eligibleStudents = (universityStudents ?? []).filter((s) => !assignedIds.has(s.id));

  const submittedIds = new Set(subList.map((s) => s.student_id));
  const notSubmitted = assigned.filter((a) => !submittedIds.has(a.student_id));

  const totalSuspicious = subList.filter(
    (s) => s.analytics?.suspicious_flags?.some((f) => f.severity === 'high'),
  ).length;

  const avgScore =
    subList.filter((s) => s.analytics?.overall_score).length > 0
      ? Math.round(
          subList.reduce((sum, s) => sum + (s.analytics?.overall_score ?? 0), 0) /
            subList.length,
        )
      : null;

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back */}
            <Link
              href="/dashboard/mentor/projects"
              className="inline-flex items-center gap-2 text-sm text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>

            {/* Assignment header */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-xl)] flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-6 h-6 text-[var(--cl-primary)]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-[var(--cl-ink)]">{assignment.title}</h1>
                    {assignment.description && (
                      <p className="text-[var(--cl-muted)] text-sm mt-1">{assignment.description}</p>
                    )}
                    {assignment.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(assignment.technologies as string[]).map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm text-[var(--cl-muted)] flex-shrink-0">
                  {assignment.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-[var(--cl-muted)] text-xs">Max score: {assignment.max_score}</span>
                </div>
              </div>

              {assignment.requirements && (
                <div className="mt-4 p-3 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)]">
                  <p className="text-xs font-semibold text-[var(--cl-muted)] uppercase tracking-wide mb-1">Requirements</p>
                  <p className="text-sm text-[var(--cl-body)] whitespace-pre-wrap">{assignment.requirements}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Assigned', value: assigned.length, icon: Users, color: 'text-[var(--cl-primary)]', bg: 'bg-[var(--cl-primary-soft)]' },
                { label: 'Submitted', value: subList.length, icon: FileCode, color: 'text-[var(--cl-primary)]', bg: 'bg-[var(--cl-primary-soft)]' },
                { label: 'Avg Score', value: avgScore !== null ? `${avgScore}/100` : '—', icon: Star, color: 'text-[var(--cl-warning)]', bg: 'bg-[rgba(171,100,0,0.12)]' },
                { label: 'Alerts', value: totalSuspicious, icon: AlertTriangle, color: 'text-[var(--cl-error)]', bg: 'bg-[rgba(239,68,68,0.12)]' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-[var(--cl-r-xl)] p-4 flex items-center gap-3`}>
                  <Icon className={`${color} w-5 h-5 flex-shrink-0`} />
                  <div>
                    <p className="text-xl font-semibold text-[var(--cl-ink)]">{value}</p>
                    <p className="text-xs text-[var(--cl-muted)]">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions row: Compare + Rubric + Batch tools */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/mentor/projects/${id}/compare`}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] text-[var(--cl-body)] text-sm font-medium rounded-[var(--cl-r-lg)] hover:bg-[var(--cl-canvas-soft)] transition-colors"
                >
                  <BarChart2 size={15} className="text-[var(--cl-primary)]" />
                  Compare All
                </Link>
                <Link
                  href={`/dashboard/mentor/projects/${id}/rubric`}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] text-[var(--cl-body)] text-sm font-medium rounded-[var(--cl-r-lg)] hover:bg-[var(--cl-canvas-soft)] transition-colors"
                >
                  <BookOpen size={15} className="text-[var(--cl-primary)]" />
                  Rubric
                </Link>
                <AddStudentsButton assignmentId={id} eligibleStudents={eligibleStudents} />
              </div>
              <BatchToolbar
                assignmentId={id}
                submissions={subList.map((s) => ({
                  id: s.id,
                  status: s.status,
                  student_name: s.student?.full_name,
                  student_email: s.student?.email,
                  score: s.evaluation?.score ?? undefined,
                  analytics: s.analytics,
                }))}
              />
            </div>

            <MilestonesSection assignmentId={id} />

            <SubmissionsList
              assignmentId={id}
              maxScore={assignment.max_score}
              submissions={subList}
              notSubmitted={notSubmitted}
            />

            {subList.length === 0 && notSubmitted.length === 0 && (
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                <p className="text-[var(--cl-muted)]">No students assigned to this project yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
