import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Plus, GitBranch, Clock, Users, CheckCircle, FileCode, Code2 } from 'lucide-react';
import { Stat, Section, ItemCard, Badge, Empty, Toolbar, btnPrimary, btnSecondary } from '@/components/shell';
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
      <Header profile={profile} title="Projects" meta={<Badge tone="neutral">{list.length} assignments</Badge>} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">

            {/* Toolbar — Amboras: filters left, actions right */}
            <Toolbar
              left={<p className="text-sm text-muted-foreground">Assign coding projects and track student GitHub activity.</p>}
              right={
                <>
                  <Link href="/dashboard/mentor/projects" className={btnSecondary}>Export</Link>
                  <Link href="/dashboard/mentor/projects/create" className={btnPrimary}>
                    <Plus className="size-4" /> New assignment
                  </Link>
                </>
              }
            />

            {/* Stats */}
            <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4" each={0.05}>
              <Stat label="Total assignments" value={list.length} icon={FileCode} />
              <Stat label="Active" value={activeCount} icon={CheckCircle} />
              <Stat label="Students assigned" value={totalStudents} icon={Users} />
              <Stat label="Submissions" value={totalSubmissions} icon={GitBranch} />
            </Stagger>

            {list.length === 0 ? (
              <div className="rounded-xl border bg-card">
                <Empty
                  icon={GitBranch}
                  title="No assignments yet"
                  description="Create your first project assignment to start tracking student work."
                  cta="Create assignment"
                  href="/dashboard/mentor/projects/create"
                />
              </div>
            ) : (
              <Section title="Assignments" count={list.length}>
                <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" each={0.04}>
                  {list.map((a) => {
                    const status = getStatusConfig(a);
                    const studentCount = a.assignment_students[0]?.count ?? 0;
                    const subCount = a.assignment_submissions[0]?.count ?? 0;
                    const isOverdue = a.deadline && new Date(a.deadline) < new Date();
                    const progressPct = studentCount > 0 ? Math.round((subCount / studentCount) * 100) : 0;
                    const tone =
                      status.label === 'Closed' ? 'neutral'
                      : status.label === 'Expired' ? 'danger'
                      : status.label === 'All Submitted' ? 'success'
                      : 'accent';

                    return (
                      <ItemCard
                        key={a.id}
                        href={`/dashboard/mentor/projects/${a.id}`}
                        icon={Code2}
                        title={a.title}
                        category={a.technologies?.slice(0, 3).join(' · ') || 'Project'}
                        description={a.description ?? undefined}
                        badge={<Badge tone={tone as 'neutral' | 'danger' | 'success' | 'accent'}>{status.label}</Badge>}
                        footer={
                          <div className="space-y-2">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="size-3.5" />{subCount}/{studentCount} submitted</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3.5" />
                                {a.deadline
                                  ? `${isOverdue ? 'Expired' : 'Due'} ${new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                  : 'No deadline'}
                              </span>
                            </div>
                          </div>
                        }
                      />
                    );
                  })}
                </Stagger>
              </Section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
