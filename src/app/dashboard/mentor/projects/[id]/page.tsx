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
    case 'graded': return 'bg-accent-purple/10 text-accent-purple';
    case 'reviewed': return 'bg-accent-purple/10 text-accent-purple';
    case 'analyzed': return 'bg-green-500/10 text-green-600';
    case 'analyzing': return 'bg-amber-500/10 text-amber-600';
    case 'submitted': return 'bg-muted text-foreground/80';
    default: return 'bg-muted text-muted-foreground';
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
    <div className="min-h-screen bg-muted/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back */}
            <Link
              href="/dashboard/mentor/projects"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>

            {/* Assignment header */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-6 h-6 text-accent-purple" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">{assignment.title}</h1>
                    {assignment.description && (
                      <p className="text-muted-foreground text-sm mt-1">{assignment.description}</p>
                    )}
                    {assignment.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(assignment.technologies as string[]).map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 bg-muted text-foreground/80 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground flex-shrink-0">
                  {assignment.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">Max score: {assignment.max_score}</span>
                </div>
              </div>

              {assignment.requirements && (
                <div className="mt-4 p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Requirements</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{assignment.requirements}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Assigned', value: assigned.length, icon: Users, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
                { label: 'Submitted', value: subList.length, icon: FileCode, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
                { label: 'Avg Score', value: avgScore !== null ? `${avgScore}/100` : '—', icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                { label: 'Alerts', value: totalSuspicious, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
                  <Icon className={`${color} w-5 h-5 flex-shrink-0`} />
                  <div>
                    <p className="text-xl font-semibold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions row: Compare + Rubric + Batch tools */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/mentor/projects/${id}/compare`}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <BarChart2 size={15} className="text-accent-purple" />
                  Compare All
                </Link>
                <Link
                  href={`/dashboard/mentor/projects/${id}/rubric`}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <BookOpen size={15} className="text-accent-purple" />
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
              <div className="bg-card rounded-xl border border-border p-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
                <p className="text-muted-foreground">No students assigned to this project yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
