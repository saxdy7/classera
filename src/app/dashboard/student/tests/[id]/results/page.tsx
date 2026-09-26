import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft, FileText, Sparkles, Lightbulb, TrendingUp, AlertCircle, BookOpen, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { AIAnalysis } from '@/lib/test-types';

export default async function TestResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id: testId } = await params;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/signin');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('*, universities(*)')
        .eq('id', user.id)
        .single();

    // Get test details
    const { data: test } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();

    // Get submission with AI analysis
    const { data: submission } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('test_id', testId)
        .eq('student_id', user.id)
        .single();

    if (!submission) {
        redirect('/dashboard/student/tests');
    }

    // Admin client — used for evaluation persistence (RLS would block a student
    // writing their own score) and for reading the class leaderboard.
    const admin = createAdminClient();

    // Trigger AI evaluation if not done yet (server-side)
    if (!submission.ai_evaluated_at) {
        // Get test data
        const { data: testData } = await admin
            .from('tests')
            .select('questions, total_marks')
            .eq('id', testId)
            .single();
            
        if (testData) {
            // Evaluate MCQ questions directly
            interface TestQuestion {
                id: string;
                question: string;
                type: string;
                options?: string[];
                correctAnswer?: string | string[] | number;
                correct_answer?: string | string[];
                marks?: number;
                points?: number;
            }
            interface StudentAnswers {
                [questionId: string]: string | string[];
            }
            const questions = testData.questions as TestQuestion[];
            const answers = submission.answers as StudentAnswers;
            let totalScore = 0;
            let maxScore = 0;
            const analysisResults: any[] = [];
            
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const questionId = q.id || `q_${i}`;
                const studentAnswer = answers?.[questionId] || 'No answer';
                const marks = q.marks || 1;
                maxScore += marks;
                
                if (q.type === 'mcq') {
                    let isCorrect = false;
                    let correctAnswer = '';
                    
                    if (typeof q.correctAnswer === 'number' && q.options) {
                        correctAnswer = q.options[q.correctAnswer];
                        isCorrect = studentAnswer === correctAnswer;
                    } else {
                        const rawAnswer = (q.correctAnswer ?? q.correct_answer) ?? '';
                        correctAnswer = Array.isArray(rawAnswer) ? rawAnswer.join(', ') : String(rawAnswer);
                        isCorrect = studentAnswer === correctAnswer;
                    }
                    
                    if (isCorrect) totalScore += marks;
                    
                    analysisResults.push({
                        question_id: questionId,
                        question_text: q.question,
                        student_answer: studentAnswer,
                        correct_answer: correctAnswer,
                        is_correct: isCorrect,
                        earned_marks: isCorrect ? marks : 0,
                        feedback: isCorrect ? '✅ Correct!' : `❌ Incorrect. Answer: "${correctAnswer}"`,
                    });
                } else {
                    // For non-MCQ, give partial credit if answered
                    const hasAnswer = studentAnswer && studentAnswer !== 'No answer';
                    const partialScore = hasAnswer ? Math.ceil(marks * 0.5) : 0;
                    totalScore += partialScore;
                    
                    analysisResults.push({
                        question_id: questionId,
                        question_text: q.question,
                        student_answer: studentAnswer,
                        is_correct: false,
                        earned_marks: partialScore,
                        feedback: hasAnswer ? '📝 Answer recorded. Mentor will review.' : '⚠️ Not answered',
                    });
                }
            }
            
            const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
            
            const aiAnalysisData = {
                overall_score: totalScore,
                max_score: maxScore,
                percentage: Math.round(percentage * 100) / 100,
                grade,
                question_analysis: analysisResults,
                strengths: percentage >= 70 ? ['Good understanding of material'] : [],
                weaknesses: percentage < 50 ? ['Review core concepts'] : [],
                study_recommendations: percentage < 70 ? ['Review incorrect answers'] : ['Keep practicing!'],
                overall_feedback: `Score: ${totalScore}/${maxScore} (${Math.round(percentage)}%) - Grade: ${grade}`,
            };
            
            // Update submission with analysis
            await admin
                .from('test_submissions')
                .update({
                    ai_analysis: aiAnalysisData,
                    ai_evaluated_at: new Date().toISOString(),
                    score: totalScore,
                    percentage: percentage,
                })
                .eq('id', submission.id);
                
            // Update local submission data
            submission.ai_analysis = aiAnalysisData;
            submission.ai_evaluated_at = new Date().toISOString();
            submission.score = totalScore;
            submission.percentage = percentage;
        }
    }

    const aiAnalysis = submission.ai_analysis as AIAnalysis | null;
    const percentage = aiAnalysis?.percentage ?? submission.percentage ?? 0;
    const passed = percentage >= 40;
    const grade = aiAnalysis?.grade ?? (percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F');

    // Quiz-summary tile counts
    const questionAnalysis = aiAnalysis?.question_analysis || [];
    const totalQuestions = (test?.questions?.length as number) || questionAnalysis.length || 0;
    const correctCount = questionAnalysis.filter((q: any) => q.is_correct).length;
    const wrongCount = Math.max(0, totalQuestions - correctCount);
    const pointsScored = submission.score ?? aiAnalysis?.overall_score ?? 0;
    const pad2 = (n: number) => String(n).padStart(2, '0');

    // Fetch per-test leaderboard — admin client needed so RLS doesn't hide other students' rows
    const { data: classLeaderboard } = await admin
        .from('test_submissions')
        .select('student_id, score, percentage, time_taken_seconds, users!test_submissions_student_id_fkey(id, full_name, avatar_url)')
        .eq('test_id', testId)
        .not('submitted_at', 'is', null)
        .order('percentage', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(50);

    const leaderboardEntries = (classLeaderboard || []) as unknown as Array<{
        student_id: string;
        score: number;
        percentage: number;
        time_taken_seconds: number;
        users: { id: string; full_name: string; avatar_url: string | null } | null;
    }>;
    const myRank = leaderboardEntries.findIndex(e => e.student_id === user.id);
    const myRankDisplay = myRank >= 0 ? myRank + 1 : null;
    const totalParticipants = leaderboardEntries.length;

    const formatTimeTaken = (secs: number) => {
        if (!secs) return '—';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <div className="min-h-screen bg-background">
            <Header profile={{ id: user.id, ...profile }} />
            <div className="flex">
                <Sidebar role="student" />
                <main className="flex-1 p-4 md:p-8 cl-main">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <Link
                                href="/dashboard/student/tests"
                                className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Tests
                            </Link>
                            <Link
                                href={`/dashboard/student/tests/${testId}/review`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Review Answers
                            </Link>
                        </div>

                        {/* ── Quiz Summary Hero (Wayground/Quizizz style) ── */}
                        <div className="rounded-xl overflow-hidden mb-8 border border-border bg-card">
                            {/* Gradient top with trophy */}
                            <div className={`relative px-6 pt-10 pb-20 text-center ${passed ? 'bg-primary' : 'bg-neutral-900'}`}>
                                <div
                                    className="absolute inset-0 opacity-[0.12]"
                                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
                                />
                                <div className="relative">
                                    <div className="text-6xl mb-2 drop-shadow-lg">{passed ? '🏆' : '📚'}</div>
                                    <h1 className="text-3xl font-semibold tracking-tight text-foreground text-[rgba(255,255,255,0.95)]">{test?.title}</h1>
                                </div>
                            </div>

                            {/* Overlapping congratulations card */}
                            <div className="relative z-10 -mt-12 mx-4 md:mx-8 rounded-xl bg-card border border-border px-6 py-6 text-center">
                                <h2 className="text-2xl font-semibold text-foreground">
                                    {passed ? 'Congratulations!' : 'Keep practicing!'}
                                </h2>
                                <p className="text-muted-foreground mt-1">
                                    You&apos;ve scored{' '}
                                    <span className={`font-semibold ${passed ? 'text-green-600' : 'text-amber-600'}`}>+{pointsScored}</span>{' '}
                                    points
                                </p>
                            </div>

                            {/* Stat tiles: Total / Correct / Wrong */}
                            <div className="px-4 md:px-8 pt-6 pb-7">
                                <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
                                    <div className="flex flex-col items-center py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-accent-purple/10 text-accent-purple flex items-center justify-center font-semibold text-sm">Q</span>
                                            <span className="text-2xl font-semibold text-foreground">{totalQuestions}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1.5 font-medium">Total Questions</span>
                                    </div>
                                    <div className="flex flex-col items-center py-5">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                            <span className="text-2xl font-semibold text-foreground">{pad2(correctCount)}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1.5 font-medium">Correct</span>
                                    </div>
                                    <div className="flex flex-col items-center py-5">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-6 h-6 text-destructive" />
                                            <span className="text-2xl font-semibold text-foreground">{pad2(wrongCount)}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1.5 font-medium">Wrong</span>
                                    </div>
                                </div>

                                {/* Score / grade / percentage summary */}
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-5 text-sm">
                                    <span className="text-muted-foreground">Score: <span className="font-semibold text-foreground">{pointsScored}/{test?.total_marks ?? 0}</span></span>
                                    <span className="text-muted-foreground">Grade: <span className="font-semibold text-foreground">{grade}</span></span>
                                    <span className="text-muted-foreground">Percentage: <span className={`font-semibold ${passed ? 'text-green-600' : 'text-amber-600'}`}>{Math.round(percentage)}%</span></span>
                                </div>
                            </div>
                        </div>

                        {/* ── Per-Test Class Leaderboard ── */}
                        {myRankDisplay !== null && totalParticipants >= 1 && (
                            <div className="bg-card rounded-xl border border-border mb-8 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground">Standings</h3>
                                            <p className="text-muted-foreground text-xs">{totalParticipants} player{totalParticipants !== 1 ? 's' : ''} completed this test</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wide">Your Rank</p>
                                        <p className="text-2xl font-semibold text-accent-purple">
                                            #{myRankDisplay}<span className="text-sm text-muted-foreground/70 font-medium"> / {totalParticipants}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Column labels */}
                                <div className="grid grid-cols-[3.5rem_1fr_4.5rem] gap-3 px-6 py-2.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide bg-muted/40 border-y border-border">
                                    <span>Rank</span>
                                    <span>Player</span>
                                    <span className="text-right">Correct</span>
                                </div>

                                {/* Rows */}
                                <div>
                                    {leaderboardEntries.slice(0, 10).map((entry, idx) => {
                                        const isMe = entry.student_id === user.id;
                                        const rank = idx + 1;
                                        const ordinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
                                        const initials = (entry.users?.full_name || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                        const avatarColors = ['bg-primary text-accent-purple', 'bg-amber-500 text-amber-600', 'bg-green-600 text-green-600', 'bg-accent-purple text-accent-purple', 'bg-destructive text-destructive'];
                                        const ac = avatarColors[idx % avatarColors.length];
                                        const pct = entry.percentage || 0;
                                        return (
                                            <div
                                                key={entry.student_id}
                                                className={`grid grid-cols-[3.5rem_1fr_4.5rem] gap-3 items-center px-6 py-3 border-b border-border last:border-0 ${
                                                    rank === 1 ? 'bg-[rgba(22,163,74,0.7)]' : isMe ? 'bg-accent-purple/10' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                {/* Rank */}
                                                <div className="flex items-center gap-1 font-semibold text-foreground/80 text-sm">
                                                    {rank === 1 && <span className="text-base leading-none">👑</span>}
                                                    {ordinal}
                                                </div>

                                                {/* Player */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {entry.users?.avatar_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={entry.users.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm ${ac}`}>
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-foreground truncate">
                                                            {entry.users?.full_name || 'Student'}
                                                            {isMe && <span className="ml-1.5 text-xs text-accent-purple font-normal">(You)</span>}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/70">{formatTimeTaken(entry.time_taken_seconds)}</p>
                                                    </div>
                                                </div>

                                                {/* Correct % */}
                                                <span className="text-right font-semibold text-sm text-foreground">{pct.toFixed(0)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}


                        {/* AI Analysis Summary */}
                        {aiAnalysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                {(aiAnalysis.strengths?.length ?? 0) > 0 && (
                                    <div className="rounded-lg border border-green-600 p-6 bg-green-500/10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-green-600">Your Strengths</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiAnalysis.strengths.map((strength: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-green-600">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Areas for Improvement */}
                                {(aiAnalysis.weaknesses?.length ?? 0) > 0 && (
                                    <div className="rounded-lg border border-amber-500 p-6 bg-amber-500/10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-amber-600">Areas to Improve</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiAnalysis.weaknesses.map((weakness: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-amber-600">
                                                    <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <span>{weakness}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Study Recommendations */}
                        {(aiAnalysis?.study_recommendations?.length ?? 0) > 0 && (
                            <div className="rounded-lg border border-accent-purple p-6 bg-accent-purple/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-accent-purple/10 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-accent-purple" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-accent-purple">Study Recommendations</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {aiAnalysis!.study_recommendations.map((rec: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 bg-[rgba(255,255,255,0.6)] rounded-lg text-accent-purple">
                                            <span className="w-6 h-6 bg-accent-purple/10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-accent-purple">
                                                {idx + 1}
                                            </span>
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Question Review */}
                        <div className="bg-card rounded-lg border border-border">
                            <div className="p-6 border-b border-border">
                                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    Question Review
                                    {aiAnalysis && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-purple/10 text-accent-purple text-xs font-medium rounded-full">
                                            <Sparkles className="w-3 h-3" />
                                            AI Enhanced
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <div className="divide-y divide-border">
                                {test?.questions?.map((question: any, index: number) => {
                                    const studentAnswer = submission.answers?.[question.id];
                                    const questionAnalysis = aiAnalysis?.question_analysis?.find(
                                        (qa: any) => qa.question_id === question.id || qa.question_number === index + 1
                                    );
                                    const isCorrect = questionAnalysis?.is_correct ?? 
                                        (question.type === 'mcq' && studentAnswer === question.correct_answer);
                                    const earnedMarks = questionAnalysis?.earned_marks ?? (isCorrect ? question.marks || 1 : 0);

                                    return (
                                        <div key={question.id} className="p-6">
                                            <div className="flex items-start gap-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                    isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="font-medium text-foreground mb-2">{question.question || question.text}</p>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                                                                isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                                                            }`}>
                                                                {earnedMarks}/{question.marks || 1}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {question.type === 'mcq' && (
                                                        <div className="space-y-2 mt-3">
                                                            {question.options?.map((opt: any, optIdx: number) => {
                                                                const optValue = typeof opt === 'string' ? opt : opt.text || opt.id;
                                                                const isSelected = studentAnswer === optValue || studentAnswer === opt.id || studentAnswer === optIdx;
                                                                const correctAnswer = question.correct_answer ?? question.correctAnswer;
                                                                const isCorrectOpt = correctAnswer === optValue || 
                                                                    correctAnswer === opt.id || 
                                                                    correctAnswer === optIdx ||
                                                                    (typeof correctAnswer === 'number' && correctAnswer === optIdx);

                                                                return (
                                                                    <div
                                                                        key={optIdx}
                                                                        className={`p-3 rounded-lg border ${
                                                                            isCorrectOpt
                                                                                ? 'bg-green-500/10 border-green-600'
                                                                                : isSelected
                                                                                    ? 'bg-destructive/10 border-destructive'
                                                                                    : 'bg-muted/40 border-border'
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            {isCorrectOpt && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                                            {isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-destructive" />}
                                                                            <span className={isCorrectOpt ? 'text-green-600' : isSelected ? 'text-destructive' : 'text-foreground/80'}>
                                                                                {optValue}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {question.type !== 'mcq' && studentAnswer && (
                                                        <div className="mt-3 p-4 bg-muted/40 rounded-lg">
                                                            <p className="text-sm text-foreground/80 mb-1">Your Answer:</p>
                                                            <p className="text-foreground whitespace-pre-wrap">{studentAnswer}</p>
                                                        </div>
                                                    )}

                                                    {/* AI Feedback for this question */}
                                                    {questionAnalysis?.feedback && (
                                                        <div className="mt-3 p-4 rounded-lg border border-accent-purple bg-accent-purple/10">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Sparkles className="w-4 h-4 text-accent-purple" />
                                                                <p className="text-sm text-accent-purple font-medium">AI Feedback</p>
                                                            </div>
                                                            <p className="text-accent-purple">{questionAnalysis.feedback}</p>
                                                        </div>
                                                    )}

                                                    {question.explanation && (
                                                        <div className="mt-3 p-4 bg-accent-purple/10 rounded-lg">
                                                            <p className="text-sm text-accent-purple font-medium mb-1">Explanation:</p>
                                                            <p className="text-accent-purple">{question.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Overall AI Feedback */}
                        {(aiAnalysis?.overall_feedback || submission.ai_feedback) && (
                            <div className="rounded-lg border border-accent-purple p-6 bg-accent-purple/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-accent-purple/10 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-accent-purple" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-accent-purple">AI Overall Assessment</h3>
                                        {submission.ai_evaluated_at && (
                                            <p className="text-sm text-accent-purple">
                                                Evaluated {new Date(submission.ai_evaluated_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-accent-purple whitespace-pre-wrap leading-relaxed">
                                    {aiAnalysis?.overall_feedback || submission.ai_feedback}
                                </p>
                            </div>
                        )}

                        {/* Pending Evaluation Notice */}
                        {!submission.ai_evaluated_at && (
                            <div className="bg-amber-500/10 border border-amber-500 rounded-lg p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-amber-600">AI Evaluation in Progress</h3>
                                        <p className="text-amber-600">
                                            Your test is being evaluated by our AI. Detailed feedback will appear shortly. 
                                            Refresh the page in a few moments.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
