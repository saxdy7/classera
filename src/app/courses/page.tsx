import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LearningLayout } from '@/components/shared/LearningLayout';
import { CoursesContent } from './CoursesContent';
import QuizGate from '@/components/shared/QuizGate';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/signin');

    const { data: profile } = await supabase
        .from('users')
        .select('quiz_completed')
        .eq('id', user.id)
        .single();

    if (!profile?.quiz_completed) {
        return (
            <LearningLayout>
                <QuizGate featureName="Course Discovery" />
            </LearningLayout>
        );
    }

    return (
        <LearningLayout>
            <CoursesContent />
        </LearningLayout>
    );
}

