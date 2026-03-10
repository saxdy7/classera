import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import RubricBuilder from '@/components/projects/RubricBuilder';
import type { RubricCriterion } from '@/components/projects/RubricBuilder';

export const dynamic = 'force-dynamic';

export default async function AssignmentRubricPage({
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

  const { data: rubric } = await admin
    .from('assignment_rubrics')
    .select('id, criteria')
    .eq('assignment_id', assignmentId)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Link
              href={`/dashboard/mentor/projects/${assignmentId}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assignment
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Grading Rubric</h1>
                <p className="text-sm text-slate-500">{assignment.title}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <p className="text-sm text-slate-500 mb-6">
                Define criteria with weights summing to 100%. Students&apos; scores will be computed
                automatically from rubric criterion scores when you evaluate their submissions.
              </p>
              <RubricBuilder
                assignmentId={assignmentId}
                existingRubric={
                  rubric
                    ? { id: rubric.id, criteria: rubric.criteria as RubricCriterion[] }
                    : null
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
