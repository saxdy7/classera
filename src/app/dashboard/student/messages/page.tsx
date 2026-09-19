import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { MessagesProvider } from '@/components/messages/MessagesProvider';
import { MessagesLayout } from '@/components/messages/MessagesLayout';

export default async function StudentMessagesPage() {
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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-black mb-2">Messages</h2>
              <p className="text-[var(--cl-body)]">Chat with your mentors in real-time</p>
            </div>

            <MessagesProvider userId={user.id}>
              <MessagesLayout currentUserId={user.id} currentUserRole="student" />
            </MessagesProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
