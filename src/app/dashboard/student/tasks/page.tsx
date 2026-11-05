import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import TaskBoardClient from '@/components/tasks/TaskBoardClient';

export default async function StudentTasksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') redirect('/dashboard');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-muted/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-4 md:p-8">
          <div className="max-w-[1500px] mx-auto">
            <TaskBoardClient initialTasks={tasks || []} userId={user.id} />
          </div>
        </main>
      </div>
    </div>
  );
}

