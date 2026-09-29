import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import TaskBoard from '@/components/tasks/TaskBoard';

export const dynamic = 'force-dynamic';

/**
 * Mentor task board.
 *
 * This page used to render `<TaskBoard />` on its own, with no Header and no
 * Sidebar — so it appeared as a bare board with the app shell missing entirely.
 */
export default async function MentorTasksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  return (
    <div className="min-h-screen bg-background">
      <Header profile={{ id: user.id, ...profile }} title="Tasks" />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-6">
          <div className="mx-auto w-full max-w-7xl">
            <TaskBoard />
          </div>
        </main>
      </div>
    </div>
  );
}
