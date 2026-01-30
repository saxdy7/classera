import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import { ReactNode } from 'react';

interface LearningLayoutProps {
    children: ReactNode;
}

export async function LearningLayout({ children }: LearningLayoutProps) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('*, universities(*)')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/onboarding/student');
    }

    const role = profile.role || 'student';

    return (
        <div className="min-h-screen bg-white">
            <Header profile={{ id: user.id, ...profile, role }} />
            <div className="flex bg-white">
                <Sidebar role={role} />
                <main className="flex-1 md:ml-24 bg-white">
                    {children}
                </main>
            </div>
            <FloatingAIAssistant />
        </div>
    );
}
