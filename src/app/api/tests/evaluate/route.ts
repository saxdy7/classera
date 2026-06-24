import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

interface QuestionAnalysis {
    question_id: string;
    question_text: string;
    student_answer: string;
    correct_answer?: string;
    is_correct: boolean;
    partial_score?: number;
    explanation: string;
    improvement_tips: string[];
}

export async function POST(request: Request) {
    try {
        // Use admin client — this endpoint is triggered server-to-server (no auth cookies
        // are forwarded), so RLS-scoped writes via the cookie client would silently fail.
        const admin = createAdminClient();
        const body = await request.json();
        const { submission_id, test_id, answers, questions, force_reevaluate } = body;

        if (!submission_id) {
            return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
        }

        // Get submission if not provided all data
        let questionsToEvaluate = questions;
        let answersToEvaluate = answers;

        if (!questionsToEvaluate || !answersToEvaluate) {
            const { data: submission, error: subError } = await admin
                .from('test_submissions')
                .select(`*, test:tests(questions, total_marks, title)`)
                .eq('id', submission_id)
                .single();

            if (subError || !submission) {
                return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
            }

            questionsToEvaluate = submission.test.questions;
            answersToEvaluate = submission.answers;
        }

        // Check if already evaluated
        const { data: existingSubmission } = await admin
            .from('test_submissions')
            .select('ai_analysis, ai_evaluated_at')
            .eq('id', submission_id)
            .single();

        if (existingSubmission?.ai_evaluated_at && !force_reevaluate) {
            return NextResponse.json({
                message: 'Already evaluated',
                analysis: existingSubmission.ai_analysis,
            });
        }

        // Prepare questions for evaluation
        const analysisResults: QuestionAnalysis[] = [];
        let totalScore = 0;
        let maxScore = 0;

        // Evaluate MCQ questions (deterministic)
        for (let i = 0; i < questionsToEvaluate.length; i++) {
            const q = questionsToEvaluate[i];
            const questionId = q.id || `q_${i}`;
            const studentAnswer = answersToEvaluate[questionId] || 'No answer provided';
            const marks = q.marks || 1;
            maxScore += marks;

            if (q.type === 'mcq') {
                let isCorrect = false;
                let correctAnswer = '';

                if (typeof q.correctAnswer === 'number' && q.options) {
                    correctAnswer = q.options[q.correctAnswer];
                    isCorrect = studentAnswer === correctAnswer;
                } else {
                    correctAnswer = q.correctAnswer || q.correct_answer || '';
                    isCorrect = studentAnswer === correctAnswer;
                }

                if (isCorrect) totalScore += marks;

                analysisResults.push({
                    question_id: questionId,
                    question_text: q.question,
                    student_answer: studentAnswer,
                    correct_answer: correctAnswer,
                    is_correct: isCorrect,
                    explanation: isCorrect
                        ? '✅ Correct! Well done.'
                        : `❌ Incorrect. The correct answer is: "${correctAnswer}"`,
                    improvement_tips: isCorrect ? [] : ['Review this concept in your study materials'],
                });
            } else {
                // Descriptive/short answer - needs AI evaluation
                analysisResults.push({
                    question_id: questionId,
                    question_text: q.question,
                    student_answer: studentAnswer,
                    is_correct: false, // Will be updated by AI
                    partial_score: 0,
                    explanation: 'Pending AI evaluation...',
                    improvement_tips: [],
                });
            }
        }

        // Use AI for descriptive questions
        const descriptiveQuestions = questionsToEvaluate.filter((q: any) =>
            q.type === 'descriptive' || q.type === 'short_answer'
        );

        if (descriptiveQuestions.length > 0 && process.env.GROQ_API_KEY) {
            try {
                const prompt = `You are an expert educator evaluating student answers. Be fair but thorough.

QUESTIONS TO EVALUATE:
${descriptiveQuestions.map((q: any, idx: number) => {
    const questionId = q.id || `q_${idx}`;
    const studentAnswer = answersToEvaluate[questionId] || 'No answer provided';
    return `
Question ${idx + 1} (${q.marks} marks): ${q.question}
Student Answer: ${studentAnswer}
Expected concepts: ${q.explanation || 'General understanding required'}
---`;
}).join('\n')}

Evaluate each answer and respond with ONLY valid JSON:
{
  "evaluations": [
    {
      "question_number": 1,
      "score": <number out of max marks>,
      "is_correct": <true if score >= 70% of marks>,
      "feedback": "<specific feedback on the answer>",
      "tips": ["<improvement tip 1>", "<improvement tip 2>"]
    }
  ]
}`;

                const completion = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are an academic evaluator. Respond with valid JSON only.' },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 1500,
                });

                const responseText = completion.choices[0]?.message?.content || '{}';
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    const aiResponse = JSON.parse(jsonMatch[0]);
                    
                    aiResponse.evaluations?.forEach((eval_: any, idx: number) => {
                        const q = descriptiveQuestions[idx];
                        if (!q) return;
                        
                        const questionId = q.id || `q_${questionsToEvaluate.indexOf(q)}`;
                        const resultIndex = analysisResults.findIndex(r => r.question_id === questionId);
                        
                        if (resultIndex !== -1) {
                            totalScore += eval_.score || 0;
                            analysisResults[resultIndex] = {
                                ...analysisResults[resultIndex],
                                is_correct: eval_.is_correct || false,
                                partial_score: eval_.score,
                                explanation: eval_.feedback || 'Evaluated by AI',
                                improvement_tips: eval_.tips || [],
                            };
                        }
                    });
                }
            } catch (aiError) {
                console.error('AI evaluation failed:', aiError);
                // Give partial credit for attempts
                descriptiveQuestions.forEach((q: any) => {
                    const questionId = q.id || `q_${questionsToEvaluate.indexOf(q)}`;
                    const studentAnswer = answersToEvaluate[questionId];
                    const hasAnswer = studentAnswer && studentAnswer !== 'No answer provided';
                    const partialScore = hasAnswer ? Math.ceil(q.marks * 0.5) : 0;
                    totalScore += partialScore;
                    
                    const resultIndex = analysisResults.findIndex(r => r.question_id === questionId);
                    if (resultIndex !== -1) {
                        analysisResults[resultIndex] = {
                            ...analysisResults[resultIndex],
                            partial_score: partialScore,
                            explanation: '⏳ Pending mentor review for full evaluation.',
                            improvement_tips: ['Your mentor will provide detailed feedback'],
                        };
                    }
                });
            }
        }

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        // Determine grade
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        const correctCount = analysisResults.filter(a => a.is_correct).length;
        
        const finalAnalysis = {
            overall_score: totalScore,
            max_score: maxScore,
            percentage: Math.round(percentage * 100) / 100,
            grade,
            question_analysis: analysisResults,
            strengths: percentage >= 70 ? ['Good understanding of the material'] : [],
            weaknesses: percentage < 50 ? ['Review core concepts needed'] : [],
            study_recommendations: percentage < 70 
                ? ['Focus on topics from incorrect answers', 'Practice more problems']
                : ['Keep up the good work!'],
            overall_feedback: percentage >= 70
                ? `🎉 Great job! You scored ${grade} with ${correctCount}/${analysisResults.length} correct.`
                : `📚 Keep practicing! You got ${correctCount}/${analysisResults.length} correct. Review the feedback below.`,
        };

        // Update submission
        const { error: updateError } = await admin
            .from('test_submissions')
            .update({
                ai_analysis: finalAnalysis,
                ai_evaluated_at: new Date().toISOString(),
                score: totalScore,
                percentage: percentage,
            })
            .eq('id', submission_id);

        if (updateError) {
            console.error('Error updating submission:', updateError);
        }

        return NextResponse.json({ success: true, analysis: finalAnalysis });

    } catch (error) {
        console.error('Error in AI evaluation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - Retrieve evaluation
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const submission_id = searchParams.get('submission_id');

        if (!submission_id) {
            return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('test_submissions')
            .select('ai_analysis, ai_evaluated_at, score, percentage')
            .eq('id', submission_id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json({
            evaluated: !!data.ai_evaluated_at,
            analysis: data.ai_analysis,
            score: data.score,
            percentage: data.percentage,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
