import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import CalendarWidget from '@/components/calendar/CalendarWidget';

export default async function StudentSchedulePage() {
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
    <div className="min-h-screen bg-muted/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Schedule</h1>
              <p className="text-foreground/80">View all your upcoming sessions, tests, and assignments in one place</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <CalendarWidget />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
