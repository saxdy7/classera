import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CourseBuilderClient } from '@/components/courses/CourseBuilderClient';

export default async function CreateCoursePage() {
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

    if (!profile?.university_id || profile?.role !== 'mentor') {
        redirect('/dashboard/mentor');
    }

    return <CourseBuilderClient profile={profile} />;
}
