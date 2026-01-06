import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify test belongs to this mentor
        const { data: test } = await supabase
            .from('tests')
            .select('id, title, mentor_id, questions, total_marks')
            .eq('id', id)
            .eq('mentor_id', user.id)
            .single();

        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Get all submissions with student info
        const { data: submissions } = await supabase
            .from('test_submissions')
            .select(`
                *,
                student:users(id, full_name, email)
            `)
            .eq('test_id', id)
            .order('submitted_at', { ascending: true });

        if (format === 'csv') {
            // Generate CSV content
            const questions = test.questions || [];
            
            // CSV Headers
            const headers = [
                'Student Name',
                'Email',
                'Score',
                'Percentage',
                'Status',
                'Started At',
                'Submitted At',
                'Time Taken (min)',
                ...questions.map((_: any, i: number) => `Q${i + 1}`)
            ];

            // CSV Rows
            const rows = submissions?.map(sub => {
                const answers = sub.answers || {};
                const startTime = sub.started_at ? new Date(sub.started_at) : null;
                const endTime = sub.submitted_at ? new Date(sub.submitted_at) : null;
                const timeTaken = startTime && endTime 
                    ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) 
                    : '';

                const questionAnswers = questions.map((q: any, i: number) => {
                    const answer = answers[q.id || `q_${i}`];
                    if (q.type === 'mcq' && q.options && typeof answer === 'number') {
                        return q.options[answer] || answer;
                    }
                    return answer || '';
                });

                return [
                    sub.student?.full_name || 'Unknown',
                    sub.student?.email || '',
                    sub.score || 0,
                    `${(sub.percentage || 0).toFixed(1)}%`,
                    sub.status || 'completed',
                    sub.started_at ? new Date(sub.started_at).toLocaleString() : '',
                    sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '',
                    timeTaken,
                    ...questionAnswers
                ];
            }) || [];

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            // Return CSV file
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="test-results-${test.title.replace(/[^a-z0-9]/gi, '-')}.csv"`,
                },
            });
        }

        if (format === 'json') {
            return NextResponse.json({
                test: {
                    id: test.id,
                    title: test.title,
                    total_marks: test.total_marks,
                    questions: test.questions,
                },
                submissions: submissions?.map(sub => ({
                    student: sub.student,
                    score: sub.score,
                    percentage: sub.percentage,
                    status: sub.status,
                    answers: sub.answers,
                    started_at: sub.started_at,
                    submitted_at: sub.submitted_at,
                    ai_analysis: sub.ai_analysis,
                })),
            });
        }

        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    } catch (error) {
        console.error('Error exporting results:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
