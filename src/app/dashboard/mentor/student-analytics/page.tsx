import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StudentAnalyticsClient } from '@/components/mentor/StudentAnalyticsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAnalyticsPage() {
  const supabase = await createClient();

  // Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/signin');

  // Profile
  let profile: any = null;
  let students: any[] = [];

  try {
    const { data } = await supabase
      .from('users')
      .select('*, universities(name)')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (_) { }

  if (!profile || !profile.full_name || !profile.university_id) {
    redirect('/onboarding/mentor');
  }

  // Fetch all students (from ANY university) - can filter by mentor's university later
  try {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, specialization_board, current_semester, created_at, github_url, linkedin_url, github_username, university_id, role')
      .eq('role', 'student')
      .order('full_name');
    students = data || [];
    
    // Log for debugging
    console.log('Mentor university:', profile.university_id);
    console.log('Total students found:', students.length);
    console.log('Students:', students.map(s => ({ id: s.id, name: s.full_name, university: s.university_id, role: s.role })));
  } catch (error) {
    console.error('Error fetching students:', error);
  }

  return (
    <div className="min-h-screen bg-white">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 md:ml-24 p-4 md:p-8">
          <StudentAnalyticsClient 
            mentorId={user.id} 
            students={students}
            universityName={profile.universities?.name || 'your university'}
          />
        </main>
      </div>
    </div>
  );
}
