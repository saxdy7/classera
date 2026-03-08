import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, CheckCircle, GitBranch, Hourglass, Plus, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    submitted:   { label: 'Submitted',  className: 'bg-blue-50 text-blue-700' },
    analyzing:   { label: 'Analyzing',  className: 'bg-amber-50 text-amber-700' },
    analyzed:    { label: 'Analyzed',   className: 'bg-emerald-50 text-emerald-700' },
    reviewed:    { label: 'Reviewed',   className: 'bg-purple-50 text-purple-700' },
    graded:      { label: 'Graded',     className: 'bg-violet-50 text-violet-700' },
  };
  const s = map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${s.className}`}>{s.label}</span>
  );
}

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

  // Get my submissions
  const assignmentIds = (assignedRows ?? []).map((r) => r.assignment_id);
  const { data: submissions } = assignmentIds.length
    ? await admin
        .from('assignment_submissions')
        .select('assignment_id, status, submitted_at, repo_full_name')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds)
    : { data: [] };

  // Get evaluations for submitted ones
  const submissionIds = (submissions ?? []).map((_, i) => i); // placeholder
  const { data: evaluations } = await admin
    .from('project_evaluations')
    .select('assignment_id, score')
    .eq('student_id', user.id);

  const submissionMap = new Map(
    (submissions ?? []).map((s) => [s.assignment_id, s]),
  );
  const evaluationMap = new Map(
    (evaluations ?? []).map((e) => [e.assignment_id, e]),
  );

  const now = new Date();
  const totalAssigned = (assignedRows ?? []).length;
  const totalSubmitted = (submissions ?? []).length;
  const totalGraded = (evaluations ?? []).filter(e => e.score !== null).length;
  const totalPending = totalAssigned - totalSubmitted;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-violet-600 font-semibold text-xs uppercase tracking-wider mb-2">
                <GitBranch className="w-4 h-4" />
                Project Assignments
              </div>
              <h1 className="text-3xl font-black text-slate-900">My Projects</h1>
              <p className="text-slate-500 mt-1">Project assignments from your mentor</p>
            </div>

            {/* Stats */}
            {totalAssigned > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'Assigned', value: totalAssigned, color: 'bg-violet-50 border-violet-100', text: 'text-violet-700' },
                  { label: 'Submitted', value: totalSubmitted, color: 'bg-blue-50 border-blue-100', text: 'text-blue-700' },
                  { label: 'Pending', value: totalPending, color: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
                  { label: 'Graded', value: totalGraded, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
                ].map(({ label, value, color, text }) => (
                  <div key={label} className={`${color} border rounded-2xl p-4 text-center`}>
                    <p className={`text-2xl font-black ${text}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!assignedRows || assignedRows.length === 0) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="w-7 h-7 text-slate-400" />
                </div>
                <h2 className="text-slate-700 font-bold text-lg mb-1">No projects yet</h2>
                <p className="text-slate-400 text-sm">
                  Your mentor will assign projects to you. Check back soon.
                </p>
              </div>
            )}

            {/* Card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(assignedRows ?? []).map((row) => {
                const a = row.project_assignments as unknown as {
                  id: string;
                  title: string;
                  description: string | null;
                  technologies: string[] | null;
                  deadline: string | null;
                  max_score: number;
                  is_active: boolean;
                  users: { full_name: string; avatar_url: string | null } | null;
                };
                if (!a) return null;

                const submission = submissionMap.get(row.assignment_id);
                const evaluation = evaluationMap.get(row.assignment_id);
                const deadline = a.deadline ? new Date(a.deadline) : null;
                const isOverdue = deadline && deadline < now && !submission;
                const daysUntil = deadline
                  ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                const statusConfig = submission
                  ? submission.status === 'graded'
                    ? { label: 'Graded', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
                    : submission.status === 'analyzed' || submission.status === 'reviewed'
                    ? { label: 'Under Review', cls: 'bg-purple-50 text-purple-700 border-purple-100' }
                    : submission.status === 'analyzing'
                    ? { label: 'Analyzing', cls: 'bg-amber-50 text-amber-700 border-amber-100' }
                    : { label: 'Submitted', cls: 'bg-blue-50 text-blue-700 border-blue-100' }
                  : isOverdue
                  ? { label: 'Overdue', cls: 'bg-red-50 text-red-700 border-red-100' }
                  : { label: 'Not Submitted', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

                return (
                  <Link
                    key={row.assignment_id}
                    href={`/dashboard/student/projects/${row.assignment_id}`}
                    className="group block bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-300 hover:shadow-md transition-all"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-5 h-5 text-violet-600" />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">
                      {a.title}
                    </h2>
                    {a.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{a.description}</p>
                    )}

                    {/* Technologies */}
                    {a.technologies && a.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {a.technologies.slice(0, 4).map((t) => (
                          <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                            {t}
                          </span>
                        ))}
                        {a.technologies.length > 4 && (
                          <span className="text-xs text-slate-400 px-1 py-0.5">+{a.technologies.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {deadline && (
                          <span className={`flex items-center gap-1 font-medium ${
                            isOverdue ? 'text-red-500' : daysUntil !== null && daysUntil <= 3 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {isOverdue
                              ? 'Overdue'
                              : daysUntil === 0
                              ? 'Due today'
                              : daysUntil !== null && daysUntil > 0
                              ? `${daysUntil}d left`
                              : deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {evaluation?.score !== null && evaluation?.score !== undefined && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" />
                            {evaluation.score}/{a.max_score}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-violet-600 text-xs font-semibold group-hover:gap-2.5 transition-all">
                        {!submission ? (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Submit
                          </>
                        ) : submission.status === 'graded' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600">View Result</span>
                          </>
                        ) : (
                          <>
                            <Hourglass className="w-3.5 h-3.5" />
                            View
                          </>
                        )}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
