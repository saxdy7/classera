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
        redirect('/signin');
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
        <div className="min-h-screen bg-card">
            <Header profile={{ id: user.id, ...profile, role }} />
            <div className="flex bg-card">
                <Sidebar role={role} />
                <main className="flex-1 cl-main bg-card">
                    {children}
                </main>
            </div>
            {/* AI assistant only for students */}
            {role === 'student' && <FloatingAIAssistant />}
        </div>
    );
}
