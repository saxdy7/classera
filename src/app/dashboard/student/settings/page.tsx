import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import SettingsClient from '@/components/shared/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function StudentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  let profile: any = null;
  try {
    const { data } = await supabase.from('users').select('*, universities(name)').eq('id', user.id).single();
    profile = data;
  } catch (_) { }

  if (!profile?.full_name || !profile?.university_id) redirect('/onboarding/student');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-14 p-4 md:p-8 max-w-screen-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Settings</h1>
            <p className="text-slate-500">Manage your account and preferences</p>
          </div>
          <SettingsClient profile={{ ...profile, universities: profile.universities }} />
        </main>
      </div>
    </div>
  );
}
