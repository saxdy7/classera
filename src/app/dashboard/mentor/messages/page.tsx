import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { MessagesProvider } from '@/components/messages/MessagesProvider';
import { MessagesLayout } from '@/components/messages/MessagesLayout';

export default async function MentorMessagesPage() {
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
    redirect('/onboarding/mentor');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">Messages</h2>
              <p className="text-slate-600">Chat with your students in real-time</p>
            </div>

            <MessagesProvider userId={user.id}>
              <MessagesLayout currentUserId={user.id} currentUserRole="mentor" />
            </MessagesProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
