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
    if (!a.is_active) return { label: 'Closed', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (a.deadline && new Date(a.deadline) < new Date()) return { label: 'Expired', cls: 'bg-red-50 text-red-600 border-red-200' };
    const subCount = a.assignment_submissions[0]?.count ?? 0;
    const studentCount = a.assignment_students[0]?.count ?? 0;
    if (subCount > 0 && subCount >= studentCount) return { label: 'All Submitted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (subCount > 0) return { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { label: 'Active', cls: 'bg-violet-50 text-violet-700 border-violet-200' };
  }

  const totalStudents = list.reduce((s, a) => s + (a.assignment_students[0]?.count ?? 0), 0);
  const totalSubmissions = list.reduce((s, a) => s + (a.assignment_submissions[0]?.count ?? 0), 0);
  const activeCount = list.filter((a) => a.is_active && (!a.deadline || new Date(a.deadline) >= new Date())).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Project Assignments</h1>
                <p className="text-slate-500 text-sm mt-1">Assign coding projects and track student GitHub activity</p>
              </div>
              <Link
                href="/dashboard/mentor/projects/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
              >
                <Plus className="w-4 h-4" />
                New Assignment
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Assignments', value: list.length, icon: FileCode, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
                { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                { label: 'Students Assigned', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                { label: 'Submissions', value: totalSubmissions, icon: GitBranch, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} border rounded-2xl p-4 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {list.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">No assignments yet</h3>
                <p className="text-sm text-slate-400 mb-6">Create your first project assignment for students</p>
                <Link
                  href="/dashboard/mentor/projects/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
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
                      className="group block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-violet-200 transition-all"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                            <Code2 className="w-6 h-6 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{a.title}</h3>
                            {a.description && (
                              <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{a.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Deadline + updated */}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {a.deadline
                            ? `${isOverdue ? 'Expired' : 'Due'} ${new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'No deadline'}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          {subCount}/{studentCount} submitted
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {a.technologies.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                              {t}
                            </span>
                          ))}
                          {a.technologies.length > 3 && (
                            <span className="text-xs text-slate-400">+{a.technologies.length - 3}</span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-violet-600 font-semibold text-sm group-hover:gap-2 transition-all">
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
