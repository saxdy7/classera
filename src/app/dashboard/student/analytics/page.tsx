import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export default async function StudentAnalyticsPage() {
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
        <main className="flex-1 md:ml-24">
          <AnalyticsDashboard role="student" />
        </main>
      </div>
    </div>
  );
}
