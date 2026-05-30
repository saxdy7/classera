import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import TestDetailClient from '@/components/tests/TestDetailClient';

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') {
    redirect('/dashboard/student');
  }

  const admin = createAdminClient();

  // Get test first (using user client to enforce mentor_id ownership check via RLS)
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .eq('mentor_id', user.id)
    .single();

  if (testError) {
    console.error('Error fetching test:', testError);
  }

  if (!test) {
    console.error('Test not found for id:', id);
    redirect('/dashboard/mentor/tests');
  }

  // Get submissions via admin
  const { data: submissions, error: subError } = await admin
    .from('test_submissions')
    .select(`
      id,
      score,
      max_score,
      percentage,
      submitted_at,
      ai_evaluated_at,
      warnings_count,
      is_disqualified
    `)
    .eq('test_id', id);

  if (subError) {
    console.error('Error fetching submissions:', subError);
  }

  // Get invitations via admin
  const { data: invitations, error: invError } = await admin
    .from('test_invitations')
    .select('id, student_id, status, invited_at')
    .eq('test_id', id);

  if (invError) console.error('Error fetching invitations:', invError);

  // Combine data
  const testWithRelations = {
    ...test,
    submissions: submissions || [],
    invitations: invitations || [],
  };

  const submissionCount = testWithRelations.submissions?.length || 0;
  const avgScore = submissionCount > 0
    ? testWithRelations.submissions.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) / submissionCount
    : 0;

  // Check if test has descriptive questions for manual grading
  const hasDescriptiveQuestions = testWithRelations.questions?.some((q: any) =>
    q.type === 'descriptive' || q.type === 'short_answer'
  );

  return (
    <TestDetailClient
      profile={profile}
      test={testWithRelations}
      submissionCount={submissionCount}
      avgScore={avgScore}
      hasDescriptiveQuestions={hasDescriptiveQuestions}
    />
  );
}
