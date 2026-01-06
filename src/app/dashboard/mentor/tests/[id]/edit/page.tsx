import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TestEditClient } from '@/components/tests/TestEditClient';

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Get test details
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .eq('mentor_id', user.id)
    .single();

  if (!test) {
    redirect('/dashboard/mentor/tests');
  }

  return <TestEditClient profile={profile} test={test} />;
}
