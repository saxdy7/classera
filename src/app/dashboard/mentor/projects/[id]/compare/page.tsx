import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import ComparisonDashboard from '@/components/projects/ComparisonDashboard';

export const dynamic = 'force-dynamic';

export default async function CompareSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assignmentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  const { data: assignment } = await admin
    .from('project_assignments')
    .select('id, title, max_score')
    .eq('id', assignmentId)
    .eq('mentor_id', user.id)
    .single();

  if (!assignment) redirect('/dashboard/mentor/projects');

  const { data: submissions } = await admin
    .from('assignment_submissions')
    .select(`
      id, student_id, status,
      student:users!assignment_submissions_student_id_fkey(id, full_name, avatar_url, email),
      analytics:repo_analytics(overall_score, consistency_score, activity_score, quality_score, total_commits, suspicious_flags),
      evaluation:project_evaluations(score)
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  type RawSub = {
    id: string;
    student_id: string;
    status: string;
    student: { id: string; full_name: string; avatar_url: string | null; email: string } | null;
    analytics: {
      overall_score: number;
      consistency_score: number;
      activity_score: number;
      quality_score: number;
      total_commits: number;
      suspicious_flags: Array<{ type: string; severity: string }>;
    } | null;
    evaluation: { score: number | null } | null;
  };

  const subs = ((submissions ?? []) as unknown as RawSub[]).map((s) => ({
    id: s.id,
    student_id: s.student_id,
    student_name: s.student?.full_name ?? 'Unknown',
    student_email: s.student?.email ?? '',
    status: s.status,
    score: s.evaluation?.score ?? undefined,
    analytics: s.analytics,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Link
              href={`/dashboard/mentor/projects/${assignmentId}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assignment
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Compare Submissions</h1>
                <p className="text-sm text-slate-500">{assignment.title}</p>
              </div>
            </div>

            {subs.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400">
                No analyzed submissions yet
              </div>
            ) : (
              <ComparisonDashboard
                assignmentId={assignmentId}
                assignmentTitle={assignment.title}
                maxScore={assignment.max_score}
                submissions={subs}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
