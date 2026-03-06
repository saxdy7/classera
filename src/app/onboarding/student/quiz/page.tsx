import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuizClient from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function StudentQuizPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/signin');

    const { data: profile } = await supabase
        .from('users')
        .select('full_name, university_id, quiz_completed')
        .eq('id', user.id)
        .single();

    // Must finish onboarding first
    if (!profile?.full_name || !profile?.university_id) redirect('/onboarding/student');

    // Already done — skip straight to dashboard
    if (profile?.quiz_completed) redirect('/dashboard/student');

    return <QuizClient />;
}
