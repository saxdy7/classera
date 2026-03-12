import { redirect } from 'next/navigation';

export default async function LiveTestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/signin');
    }

    // Verify user is invited to this test
    const { data: invitation } = await supabase
        .from('test_invitations')
        .select('*')
        .eq('test_id', id)
        .eq('student_id', user.id)
        .single();

    if (!invitation) {
        redirect('/dashboard/student/tests');
    }

    // Get test details
    const { data: test } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .single();

    if (!test) {
        redirect('/dashboard/student/tests');
    }

    // Check if already submitted
    const { data: existing } = await supabase
        .from('test_submissions')
        .select('id')
        .eq('test_id', id)
        .eq('student_id', user.id)
        .single();

    if (existing) {
        redirect('/dashboard/student/tests');
    }

    return <TestRoom test={test} studentId={user.id} />;
}
