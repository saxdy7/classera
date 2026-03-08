import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import CreateAssignmentForm from './CreateAssignmentForm';

export const dynamic = 'force-dynamic';

export default async function CreateAssignmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  // Fetch students at the same university
  const { data: students } = await admin
    .from('users')
    .select('id, full_name, email, avatar_url')
    .eq('role', 'student')
    .eq('university_id', profile.university_id)
    .order('full_name');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <CreateAssignmentForm students={students ?? []} />
          </div>
        </main>
      </div>
    </div>
  );
}
