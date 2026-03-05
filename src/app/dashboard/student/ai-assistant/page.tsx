import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { AIChatInterface } from '@/components/student/AIChatInterface';

export default async function StudentAIAssistantPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-14 p-4 md:p-6">
          <div style={{ height: 'calc(100vh - 88px)' }}>
            <AIChatInterface userName={profile.full_name?.split(' ')[0] || 'Student'} />
          </div>
        </main>
      </div>
    </div>
  );

}
