import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify test belongs to this mentor
        const { data: test } = await supabase
            .from('tests')
            .select('id, mentor_id, questions, total_marks, settings')
            .eq('id', id)
            .eq('mentor_id', user.id)
            .single();

        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Get all submissions
        const { data: submissions } = await supabase
            .from('test_submissions')
            .select('*')
            .eq('test_id', id);

        // Get all invitations
        const { data: invitations } = await supabase
            .from('test_invitations')
            .select('id')
            .eq('test_id', id);

        const totalInvited = invitations?.length || 0;
        const totalSubmitted = submissions?.length || 0;
        const completionRate = totalInvited > 0 ? (totalSubmitted / totalInvited) * 100 : 0;

        // Calculate score statistics
        const scores = submissions?.map(s => s.percentage || 0) || [];
        const averageScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        // Calculate pass rate (default 60% passing)
        const passingPercentage = test.settings?.passing_percentage || 60;
        const passCount = scores.filter(s => s >= passingPercentage).length;
        const passRate = scores.length > 0 ? (passCount / scores.length) * 100 : 0;

        // Calculate average time
        const times = submissions?.filter(s => s.started_at && s.submitted_at).map(s => {
            const start = new Date(s.started_at).getTime();
            const end = new Date(s.submitted_at).getTime();
            return (end - start) / 60000; // Convert to minutes
        }) || [];
        const averageTime = times.length > 0 
            ? times.reduce((a, b) => a + b, 0) / times.length 
            : 0;

        // Grade distribution
        const gradeRanges = [
            { grade: 'A', min: 90, max: 100 },
            { grade: 'B', min: 80, max: 89 },
            { grade: 'C', min: 70, max: 79 },
            { grade: 'D', min: 60, max: 69 },
            { grade: 'F', min: 0, max: 59 },
        ];

        const gradeDistribution = gradeRanges.map(range => {
            const count = scores.filter(s => s >= range.min && s <= range.max).length;
            return {
                grade: range.grade,
                count,
                percentage: scores.length > 0 ? (count / scores.length) * 100 : 0,
            };
        });

        // Question analysis
        const questions = test.questions || [];
        const questionAnalysis = questions.map((q: any, index: number) => {
            let correctCount = 0;
            let incorrectCount = 0;
            let skipCount = 0;

            submissions?.forEach(sub => {
                const answers = sub.answers || {};
                const studentAnswer = answers[q.id || `q_${index}`];

                if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
                    skipCount++;
                } else if (q.type === 'mcq') {
                    if (studentAnswer === q.correctAnswer || studentAnswer === q.options?.[q.correctAnswer]) {
                        correctCount++;
                    } else {
                        incorrectCount++;
                    }
                } else {
                    // For descriptive, count as submitted (needs manual grading)
                    correctCount++; // Placeholder - would need AI/manual grading
                }
            });

            const total = correctCount + incorrectCount + skipCount;
            const correctRate = total > 0 ? (correctCount / total) * 100 : 0;
            let difficultyRating: 'easy' | 'medium' | 'hard' = 'medium';
            if (correctRate >= 70) difficultyRating = 'easy';
            else if (correctRate < 40) difficultyRating = 'hard';

            return {
                question_id: q.id || `q_${index}`,
                question_text: q.question || q.text || '',
                correct_count: correctCount,
                incorrect_count: incorrectCount,
                skip_count: skipCount,
                difficulty_rating: difficultyRating,
                avg_time_seconds: 0, // Would need per-question timing
            };
        });

        // Time distribution (in 10-minute buckets)
        const timeRanges = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60+'];
        const timeDistribution = timeRanges.map(range => {
            let count = 0;
            const [min, max] = range.includes('+') 
                ? [parseInt(range), Infinity] 
                : range.split('-').map(Number);

            times.forEach(t => {
                if (t >= min && t < (max === Infinity ? max : max)) {
                    count++;
                }
            });

            return { range, count };
        });

        return NextResponse.json({
            summary: {
                total_invited: totalInvited,
                total_submitted: totalSubmitted,
                completion_rate: completionRate,
                average_score: averageScore,
                highest_score: highestScore,
                lowest_score: lowestScore,
                average_time_minutes: averageTime,
                pass_rate: passRate,
            },
            grade_distribution: gradeDistribution,
            question_analysis: questionAnalysis,
            time_distribution: timeDistribution,
            score_trend: [], // Would need historical data
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
