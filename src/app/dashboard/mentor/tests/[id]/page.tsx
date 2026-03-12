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

  // Get submissions via admin — try full column set first, fall back to base columns
  // if extended columns (from ADD_PROCTORING.sql) haven't been migrated yet
  let submissions: any[] | null = null;
  let subError: any = null;

  const fullSelect = `
      id,
      score,
      max_score,
      percentage,
      submitted_at,
      ai_evaluated_at,
      manual_grades,
      warnings_count,
      is_disqualified,
      screen_recording_url,
      student:users!student_id(id, full_name, avatar_url)
    `;

  const baseSelect = `
      id,
      score,
      max_score,
      percentage,
      submitted_at,
      student:users!student_id(id, full_name, avatar_url)
    `;

  const fullResult = await admin
    .from('test_submissions')
    .select(fullSelect)
    .eq('test_id', id);

  if (fullResult.error) {
    // Extended columns not yet migrated — use base columns
    console.warn('Submissions full query failed, falling back to base columns:', fullResult.error.message);
    const baseResult = await admin
      .from('test_submissions')
      .select(baseSelect)
      .eq('test_id', id);
    submissions = baseResult.data;
    subError = baseResult.error;
  } else {
    submissions = fullResult.data;
  }

  if (subError) console.error('Error fetching submissions:', subError);

  // Get invitations via admin to bypass RLS and avoid FK hint issues
  const { data: invitations, error: invError } = await admin
    .from('test_invitations')
    .select(`
      id,
      student_id,
      status,
      invited_at,
      student:users!student_id(id, full_name, avatar_url, email)
    `)
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
