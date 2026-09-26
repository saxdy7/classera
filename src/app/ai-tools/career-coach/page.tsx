import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import CareerCoachContent from './CareerCoachContent';
import QuizGate from '@/components/shared/QuizGate';

export default async function CareerCoachPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/signin');

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
            <Header profile={{ id: user.id, ...profile }} />
            <div className="flex">
                <Sidebar role="student" />
                <main className="flex-1 cl-main flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
                    {profile?.quiz_completed ? (
                        <CareerCoachContent />
                    ) : (
                        <QuizGate featureName="AI Career Coach" />
                    )}
                </main>
            </div>
        </div>
    );
}
