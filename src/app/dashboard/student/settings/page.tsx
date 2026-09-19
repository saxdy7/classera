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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-4 md:p-8 flex flex-col items-center">
          <div className="mb-8 w-full max-w-2xl">
            <h1 className="text-3xl font-semibold text-[var(--cl-ink)] mb-1">Settings</h1>
            <p className="text-[var(--cl-muted)]">Manage your account and preferences</p>
          </div>
          <div className="w-full max-w-2xl">
            <SettingsClient profile={{ ...profile, universities: profile.universities }} />
          </div>
        </main>
      </div>
    </div>
  );
}
