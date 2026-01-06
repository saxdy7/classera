import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { LiveSessionsClient } from '@/components/sessions/LiveSessionsClient';

export default async function LiveSessionsPage() {
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

  // Fetch upcoming sessions
  const { data: sessions } = await supabase
    .from('live_sessions')
    .select(`
      *,
      host:users!live_sessions_host_id_fkey(id, full_name, avatar_url),
      test:tests(id, title),
      participants:session_participants(
        id,
        user:users(id, full_name, avatar_url),
        status,
        role
      )
    `)
    .eq('host_id', user.id)
    .order('scheduled_at', { ascending: true });

  // Fetch students for inviting
  const { data: students } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, email')
    .eq('university_id', profile.university_id)
    .eq('role', 'student')
    .order('full_name');

  // Fetch tests for linking to proctored sessions
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, duration_minutes, is_live')
    .eq('mentor_id', user.id)
    .eq('is_live', false) // Only tests not yet live
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <LiveSessionsClient 
            profile={profile}
            initialSessions={sessions || []}
            students={students || []}
            tests={tests || []}
          />
        </main>
      </div>
    </div>
  );
}
