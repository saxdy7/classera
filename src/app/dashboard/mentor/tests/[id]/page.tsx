import { createClient } from '@/lib/supabase/server';
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

  // Get test first
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

  // Get submissions separately
  const { data: submissions } = await supabase
    .from('test_submissions')
    .select(`
      id,
      score,
      percentage,
      submitted_at,
      ai_evaluated_at,
      student:users!test_submissions_student_id_fkey(id, full_name, avatar_url)
    `)
    .eq('test_id', id);

  // Get invitations separately
  const { data: invitations } = await supabase
    .from('test_invitations')
    .select(`
      id,
      student_id,
      status,
      invited_at,
      student:users!test_invitations_student_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('test_id', id);

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
