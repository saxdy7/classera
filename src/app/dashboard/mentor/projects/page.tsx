import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, GitBranch, Clock, Users, CheckCircle, FileCode, AlertTriangle, ChevronRight, Code2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  max_score: number;
  is_active: boolean;
  created_at: string;
  technologies: string[];
  assignment_students: { count: number }[];
  assignment_submissions: { count: number }[];
};

export default async function MentorProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  const { data: assignments } = await admin
    .from('project_assignments')
    .select(`
      id, title, description, deadline, max_score, is_active, created_at, technologies,
      assignment_students(count),
      assignment_submissions(count)
    `)
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  const list = (assignments ?? []) as unknown as Assignment[];

  function getStatusConfig(a: Assignment) {
    if (!a.is_active) return { label: 'Closed', cls: 'bg-[var(--cl-surface-strong)] text-[var(--cl-muted)] border-[var(--cl-hairline)]' };
    if (a.deadline && new Date(a.deadline) < new Date()) return { label: 'Expired', cls: 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] border-[var(--cl-error)]' };
    const subCount = a.assignment_submissions[0]?.count ?? 0;
    const studentCount = a.assignment_students[0]?.count ?? 0;
    if (subCount > 0 && subCount >= studentCount) return { label: 'All Submitted', cls: 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] border-[var(--cl-success)]' };
    if (subCount > 0) return { label: 'In Progress', cls: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] border-[var(--cl-info)]' };
    return { label: 'Active', cls: 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] border-[var(--cl-primary)]' };
  }

  const totalStudents = list.reduce((s, a) => s + (a.assignment_students[0]?.count ?? 0), 0);
  const totalSubmissions = list.reduce((s, a) => s + (a.assignment_submissions[0]?.count ?? 0), 0);
  const activeCount = list.filter((a) => a.is_active && (!a.deadline || new Date(a.deadline) >= new Date())).length;

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Project Assignments</h1>
                <p className="text-[var(--cl-muted)] text-sm mt-1">Assign coding projects and track student GitHub activity</p>
              </div>
              <Link
                href="/dashboard/mentor/projects/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Assignment
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Assignments', value: list.length, icon: FileCode, color: 'text-[var(--cl-primary)]', bg: 'bg-[var(--cl-primary-soft)] border-[var(--cl-primary)]' },
                { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-[var(--cl-success)]', bg: 'bg-[rgba(22,163,74,0.12)] border-[var(--cl-success)]' },
                { label: 'Students Assigned', value: totalStudents, icon: Users, color: 'text-[var(--cl-info)]', bg: 'bg-[rgba(13,116,206,0.12)] border-[var(--cl-info)]' },
                { label: 'Submissions', value: totalSubmissions, icon: GitBranch, color: 'text-[var(--cl-primary)]', bg: 'bg-[var(--cl-primary-soft)] border-[var(--cl-primary)]' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} border rounded-[var(--cl-r-xl)] p-4 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-card)] flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[var(--cl-ink)]">{value}</p>
                    <p className="text-xs text-[var(--cl-muted)]">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {list.length === 0 ? (
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-dashed border-[var(--cl-hairline)] p-16 text-center">
                <div className="w-16 h-16 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="w-8 h-8 text-[var(--cl-primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--cl-body)] mb-1">No assignments yet</h3>
                <p className="text-sm text-[var(--cl-muted)] mb-6">Create your first project assignment for students</p>
                <Link
                  href="/dashboard/mentor/projects/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] text-sm font-semibold hover:bg-[var(--cl-primary)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {list.map((a) => {
                  const status = getStatusConfig(a);
                  const studentCount = a.assignment_students[0]?.count ?? 0;
                  const subCount = a.assignment_submissions[0]?.count ?? 0;
                  const isOverdue = a.deadline && new Date(a.deadline) < new Date();
                  const progressPct = studentCount > 0 ? Math.round((subCount / studentCount) * 100) : 0;

                  return (
                    <Link
                      key={a.id}
                      href={`/dashboard/mentor/projects/${a.id}`}
                      className="group block bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-5 hover:border-[var(--cl-primary)] transition-all"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-[var(--cl-r-lg)] bg-[var(--cl-primary-soft)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--cl-primary-soft)] transition-colors">
                            <Code2 className="w-6 h-6 text-[var(--cl-primary)]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[var(--cl-ink)] truncate">{a.title}</h3>
                            {a.description && (
                              <p className="text-sm text-[var(--cl-muted)] line-clamp-1 mt-0.5">{a.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Deadline + updated */}
                      <div className="flex items-center justify-between text-xs text-[var(--cl-muted)] mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {a.deadline
                            ? `${isOverdue ? 'Expired' : 'Due'} ${new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'No deadline'}
                        </span>
                        <span className="flex items-center gap-1 text-[var(--cl-muted)]">
                          <Users className="w-3.5 h-3.5" />
                          {subCount}/{studentCount} submitted
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[var(--cl-surface-strong)] h-1.5 rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full ${progressPct === 100 ? 'bg-[var(--cl-success)]' : 'bg-[var(--cl-primary)]'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--cl-hairline)]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {a.technologies.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-full">
                              {t}
                            </span>
                          ))}
                          {a.technologies.length > 3 && (
                            <span className="text-xs text-[var(--cl-muted)]">+{a.technologies.length - 3}</span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-[var(--cl-primary)] font-semibold text-sm group-hover:gap-2 transition-all">
                          Review <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
