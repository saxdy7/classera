import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
        const admin = createAdminClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify test belongs to this mentor
        const { data: test } = await admin
            .from('tests')
            .select('id, title, mentor_id, questions, total_marks')
            .eq('id', id)
            .eq('mentor_id', user.id)
            .single();

        if (!test) {
            return NextResponse.json({ error: 'Test not found or access denied' }, { status: 404 });
        }

        // Fetch submissions via admin client (bypasses RLS), ordered by score desc
        const { data: submissions, error: subError } = await admin
            .from('test_submissions')
            .select(`
                id,
                student_id,
                score,
                max_score,
                percentage,
                submitted_at,
                warnings_count,
                is_disqualified,
                ai_evaluated_at,
                answers,
                student:users!test_submissions_student_id_fkey(full_name, email)
            `)
            .eq('test_id', id)
            .order('percentage', { ascending: false });

        if (subError) {
            console.error('Export fetch error:', subError);
            return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
        }

        const getGrade = (pct: number) => {
            if (pct >= 90) return 'A+';
            if (pct >= 80) return 'A';
            if (pct >= 70) return 'B';
            if (pct >= 60) return 'C';
            if (pct >= 50) return 'D';
            return 'F';
        };

        const escapeCell = (value: unknown) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;

        if (format === 'csv') {
            const questions = (test.questions as any[]) || [];

            const headers = [
                'Rank',
                'Student Name',
                'Email',
                'Score',
                'Total Marks',
                'Percentage',
                'Grade',
                'Submitted At',
                'Warnings',
                'Disqualified',
                'AI Evaluated',
                ...questions.map((_: any, i: number) => `Q${i + 1} Answer`),
            ];

            const rows = (submissions || []).map((sub: any, idx: number) => {
                const answers = sub.answers || {};
                const questionAnswers = questions.map((q: any, i: number) => {
                    return answers[q.id || `q_${i}`] || '';
                });

                return [
                    idx + 1,
                    sub.student?.full_name || 'Unknown',
                    sub.student?.email || '',
                    sub.score ?? 0,
                    sub.max_score ?? test.total_marks,
                    `${(sub.percentage ?? 0).toFixed(1)}%`,
                    getGrade(sub.percentage ?? 0),
                    sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '',
                    sub.warnings_count ?? 0,
                    sub.is_disqualified ? 'Yes' : 'No',
                    sub.ai_evaluated_at ? 'Yes' : 'No',
                    ...questionAnswers,
                ];
            });

            const csv = [headers, ...rows]
                .map(row => row.map(escapeCell).join(','))
                .join('\n');

            const filename = `${test.title.replace(/[^a-z0-9]/gi, '_')}_results.csv`;

            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        if (format === 'json') {
            return NextResponse.json({
                test: {
                    id: test.id,
                    title: test.title,
                    total_marks: test.total_marks,
                },
                submissions: (submissions || []).map((sub: any, idx: number) => ({
                    rank: idx + 1,
                    student: sub.student,
                    score: sub.score,
                    percentage: sub.percentage,
                    grade: getGrade(sub.percentage ?? 0),
                    submitted_at: sub.submitted_at,
                    warnings_count: sub.warnings_count,
                    is_disqualified: sub.is_disqualified,
                    ai_evaluated_at: sub.ai_evaluated_at,
                })),
            });
        }

        return NextResponse.json({ error: 'Invalid format. Use ?format=csv or ?format=json' }, { status: 400 });
    } catch (error: any) {
        console.error('Error exporting results:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
