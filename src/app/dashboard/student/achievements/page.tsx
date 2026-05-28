import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { AchievementsClient } from '@/components/student/AchievementsClient';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
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

  if (!profile) {
    redirect('/signin');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="student" />

      <div className="flex-1 overflow-auto">
        <Header profile={{ id: user.id, ...profile }} />

        <AchievementsClient />
      </div>
    </div>
  );
}
