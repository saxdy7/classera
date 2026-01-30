import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
        }

        const body = await request.json();
        const { test_id, answers, violations, time_taken_minutes } = body;

        console.log('Submit request:', { test_id, answersCount: answers ? Object.keys(answers).length : 0, userId: user.id });

        if (!test_id) {
            return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
        }

        if (!answers || typeof answers !== 'object') {
            return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
        }

        // Get test details first
        const { data: test, error: testError } = await supabase
            .from('tests')
            .select('id, questions, total_marks, question_type, is_live')
            .eq('id', test_id)
            .single();

        if (testError || !test) {
            console.error('Test fetch error:', testError);
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        console.log('Test found:', { id: test.id, is_live: test.is_live, questionsCount: test.questions?.length });

        // Check if test is live
        if (!test.is_live) {
            return NextResponse.json({ error: 'This test is not currently live. Contact your mentor.' }, { status: 403 });
        }

        // Check for invitation
        const { data: invitation, error: invError } = await supabase
            .from('test_invitations')
            .select('id')
            .eq('test_id', test_id)
            .eq('student_id', user.id)
            .single();

        console.log('Invitation check:', { found: !!invitation, error: invError?.message });

        if (!invitation) {
            return NextResponse.json({ error: 'You have not been invited to this test' }, { status: 403 });
        }

        // Calculate score for MCQ questions
        let score = 0;
        let maxScore = test.total_marks || 0;
        interface TestQuestion {
            id: string;
            question: string;
            type: string;
            options?: string[];
            correctAnswer?: string | string[];
            points?: number;
        }
        const questions = (test.questions as TestQuestion[]) || [];

        questions.forEach((question: any, index: number) => {
            const questionId = question.id || `q_${index}`;
            const studentAnswer = answers[questionId];
            
            if (question.type === 'mcq') {
                // correctAnswer can be an index (number) or the actual text
                const correctAnswerValue = question.correctAnswer ?? question.correct_answer;
                let isCorrect = false;
                
                if (typeof correctAnswerValue === 'number' && question.options) {
                    // correctAnswer is an index, compare with option text at that index
                    const correctOption = question.options[correctAnswerValue];
                    isCorrect = studentAnswer === correctOption;
                } else {
                    // correctAnswer is the actual text
                    isCorrect = studentAnswer === correctAnswerValue;
                }
                
                if (isCorrect) {
                    score += question.marks || 1;
                }
            }
        });

        console.log('Score calculated:', { score, maxScore });

        const percentage = (score / maxScore) * 100;

        // Update or create submission
        // First check if submission exists
        const { data: existingSubmission } = await supabase
            .from('test_submissions')
            .select('id')
            .eq('test_id', test_id)
            .eq('student_id', user.id)
            .single();

        let submission;
        let error;

        if (existingSubmission) {
            // Update existing submission
            const result = await supabase
                .from('test_submissions')
                .update({
                    answers,
                    score,
                    max_score: maxScore,
                    percentage,
                    activity_log: violations ? { violations } : null,
                    submitted_at: new Date().toISOString()
                })
                .eq('id', existingSubmission.id)
                .select()
                .single();
            submission = result.data;
            error = result.error;
            console.log('Update result:', { success: !!result.data, error: result.error?.message });
        } else {
            // Create new submission
            const result = await supabase
                .from('test_submissions')
                .insert({
                    test_id,
                    student_id: user.id,
                    answers,
                    score,
                    max_score: maxScore,
                    percentage,
                    activity_log: violations ? { violations } : null,
                    submitted_at: new Date().toISOString()
                })
                .select()
                .single();
            submission = result.data;
            error = result.error;
            console.log('Insert result:', { success: !!result.data, error: result.error?.message });
        }

        if (error) {
            console.error('Submission error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            
            // Provide more helpful error messages
            if (error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy')) {
                return NextResponse.json({ 
                    error: 'Permission denied. Make sure you have been invited to this test.' 
                }, { status: 403 });
            }
            
            if (error.code === '23505') {
                return NextResponse.json({ 
                    error: 'You have already submitted this test.' 
                }, { status: 400 });
            }
            
            return NextResponse.json({ error: error.message || 'Failed to save submission' }, { status: 400 });
        }

        // Trigger AI evaluation in background (async - no await)
        fetch(`${request.url.split('/api')[0]}/api/tests/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submission_id: submission.id,
                test_id,
                answers,
                questions: test.questions
            })
        }).catch(err => console.error('AI evaluation error:', err));

        return NextResponse.json({
            submission: {
                ...submission,
                evaluating: true // Indicates AI evaluation in progress
            }
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
