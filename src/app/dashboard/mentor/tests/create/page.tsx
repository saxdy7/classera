import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TestCreateClient } from '@/components/tests/TestCreateClient';

export default async function CreateTestPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  if (profile.role !== 'mentor') {
    redirect('/dashboard/student');
  }

  return <TestCreateClient profile={profile} />;
}
