import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, GitBranch, Clock, Users, CheckCircle, FileCode, ChevronRight, Code2 } from 'lucide-react';
import { PageHeader, SectionHeader, StatCard, CreateTile, gradientFor, primaryButton } from '@/components/shell';
import { Stagger } from '@/components/motion';

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
    if (!a.is_active) return { label: 'Closed', cls: 'bg-muted text-muted-foreground border-border' };
    if (a.deadline && new Date(a.deadline) < new Date()) return { label: 'Expired', cls: 'bg-destructive/10 text-destructive border-destructive' };
    const subCount = a.assignment_submissions[0]?.count ?? 0;
    const studentCount = a.assignment_students[0]?.count ?? 0;
    if (subCount > 0 && subCount >= studentCount) return { label: 'All Submitted', cls: 'bg-green-500/10 text-green-600 border-green-600' };
    if (subCount > 0) return { label: 'In Progress', cls: 'bg-accent-purple/10 text-accent-purple border-accent-purple' };
    return { label: 'Active', cls: 'bg-accent-purple/10 text-accent-purple border-accent-purple' };
  }

  const totalStudents = list.reduce((s, a) => s + (a.assignment_students[0]?.count ?? 0), 0);
  const totalSubmissions = list.reduce((s, a) => s + (a.assignment_submissions[0]?.count ?? 0), 0);
  const activeCount = list.filter((a) => a.is_active && (!a.deadline || new Date(a.deadline) >= new Date())).length;

  return (
    <div className="min-h-screen bg-background">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">

            <PageHeader
              icon={GitBranch}
              title="Project Assignments"
              description="Assign coding projects and track student GitHub activity."
              actions={
                <Link href="/dashboard/mentor/projects/create" className={primaryButton}>
                  <Plus className="size-4" />
                  New Assignment
                </Link>
              }
            />

            {/* Stats */}
            <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4" each={0.06}>
              <StatCard label="Total assignments" value={list.length} icon={FileCode} />
              <StatCard label="Active" value={activeCount} icon={CheckCircle} />
              <StatCard label="Students assigned" value={totalStudents} icon={Users} />
              <StatCard label="Submissions" value={totalSubmissions} icon={GitBranch} />
            </Stagger>

            {/* Grid — looma: dashed create tile first, then gradient cards */}
            <section className="space-y-4">
              <SectionHeader icon={Code2} title="Assignments" description={list.length ? `${list.length} total` : 'Nothing here yet'} />
              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" each={0.05}>
                <CreateTile href="/dashboard/mentor/projects/create" label="Create New Assignment" />
                {list.map((a, i) => {
                  const status = getStatusConfig(a);
                  const studentCount = a.assignment_students[0]?.count ?? 0;
                  const subCount = a.assignment_submissions[0]?.count ?? 0;
                  const isOverdue = a.deadline && new Date(a.deadline) < new Date();
                  const progressPct = studentCount > 0 ? Math.round((subCount / studentCount) * 100) : 0;

                  return (
                    <Link
                      key={a.id}
                      href={`/dashboard/mentor/projects/${a.id}`}
                      className={`group relative block h-[180px] overflow-hidden rounded-xl border bg-linear-to-br p-4 transition-transform hover:scale-[1.02] ${gradientFor(i)}`}
                    >
                      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex size-9 items-center justify-center rounded-lg border border-white/40 bg-white/60 text-foreground shadow-xs">
                            <Code2 className="size-4.5" />
                          </span>
                          <span className="rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                            {status.label}
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-1 text-base font-semibold leading-snug text-foreground">{a.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-foreground/70">
                          <Clock className="size-3.5" />
                          {a.deadline
                            ? `${isOverdue ? 'Expired' : 'Due'} ${new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'No deadline'}
                        </p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/50">
                          <div className="h-full rounded-full bg-foreground/70" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/10 px-3 py-2.5 text-[11px] font-medium text-foreground/80 backdrop-blur-xs">
                        <span className="flex items-center gap-1"><Users className="size-3.5" />{subCount}/{studentCount} submitted</span>
                        <span className="flex items-center gap-0.5 text-accent-purple">Review <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                      </div>
                    </Link>
                  );
                })}
              </Stagger>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
