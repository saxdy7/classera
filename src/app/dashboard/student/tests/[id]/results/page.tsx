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

    // Trigger AI evaluation if not done yet (server-side)
    if (!submission.ai_evaluated_at) {
        // Import the evaluate function directly instead of making HTTP call
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        
        // Get test data
        const { data: testData } = await serverSupabase
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
            await serverSupabase
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

    // Fetch per-test leaderboard — admin client needed so RLS doesn't hide other students' rows
    const admin = createAdminClient();
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
            <Header profile={{ id: user.id, ...profile }} />
            <div className="flex">
                <Sidebar role="student" />
                <main className="flex-1 p-4 md:p-8 md:ml-24">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            href="/dashboard/student/tests"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Tests
                        </Link>

                        {/* Result Card */}
                        <div className={`rounded-3xl p-8 mb-8 ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">{test?.title}</h1>
                                    <p className="text-white/80">Your test results</p>
                                </div>
                                <div className="text-center">
                                    {passed ? (
                                        <CheckCircle className="w-16 h-16 text-white mx-auto mb-2" />
                                    ) : (
                                        <XCircle className="w-16 h-16 text-white mx-auto mb-2" />
                                    )}
                                    <p className="text-white font-bold text-lg">{passed ? 'PASSED' : 'FAILED'}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Per-Test Class Leaderboard ── */}
                        {myRankDisplay !== null && totalParticipants >= 1 && (
                            <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 rounded-2xl p-6 mb-8 border border-violet-800/40 shadow-xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Class Leaderboard</h3>
                                            <p className="text-slate-400 text-xs">{totalParticipants} student{totalParticipants !== 1 ? 's' : ''} completed this test</p>
                                        </div>
                                    </div>
                                    {/* Your rank badge */}
                                    <div className={`px-4 py-2 rounded-xl text-center ${
                                        myRankDisplay === 1 ? 'bg-yellow-400/20 border border-yellow-400/40' :
                                        myRankDisplay === 2 ? 'bg-slate-400/20 border border-slate-400/40' :
                                        myRankDisplay === 3 ? 'bg-amber-700/30 border border-amber-700/40' :
                                        'bg-violet-600/20 border border-violet-600/40'
                                    }`}>
                                        <p className="text-xs text-slate-400 font-medium">Your Rank</p>
                                        <p className={`text-2xl font-bold ${
                                            myRankDisplay === 1 ? 'text-yellow-400' :
                                            myRankDisplay === 2 ? 'text-slate-300' :
                                            myRankDisplay === 3 ? 'text-amber-500' :
                                            'text-violet-400'
                                        }`}>
                                            #{myRankDisplay}
                                        </p>
                                        <p className="text-xs text-slate-500">of {totalParticipants}</p>
                                    </div>
                                </div>

                                {/* Top 5 list */}
                                <div className="space-y-2">
                                    {leaderboardEntries.slice(0, 5).map((entry, idx) => {
                                        const isMe = entry.student_id === user.id;
                                        const rank = idx + 1;
                                        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                                        const initials = (entry.users?.full_name || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                                        return (
                                            <div
                                                key={entry.student_id}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                    isMe
                                                        ? 'bg-violet-600/25 border border-violet-500/50 shadow-lg shadow-violet-900/30'
                                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                {/* Rank */}
                                                <div className="w-8 text-center flex-shrink-0">
                                                    {rankIcon ? (
                                                        <span className="text-xl leading-none">{rankIcon}</span>
                                                    ) : (
                                                        <span className="text-slate-500 font-bold text-sm">#{rank}</span>
                                                    )}
                                                </div>

                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                                                    isMe ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
                                                }`}>
                                                    {initials}
                                                </div>

                                                {/* Name */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-semibold text-sm truncate ${isMe ? 'text-violet-200' : 'text-white'}`}>
                                                        {entry.users?.full_name || 'Student'}
                                                        {isMe && <span className="ml-2 text-xs text-violet-400 font-normal">(You)</span>}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">{formatTimeTaken(entry.time_taken_seconds)}</p>
                                                </div>

                                                {/* Score bar + % */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="hidden sm:flex w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                entry.percentage >= 80 ? 'bg-emerald-400' :
                                                                entry.percentage >= 60 ? 'bg-sky-400' :
                                                                entry.percentage >= 40 ? 'bg-amber-400' : 'bg-red-400'
                                                            }`}
                                                            style={{ width: `${Math.min(100, entry.percentage || 0)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`font-bold text-sm w-12 text-right ${
                                                        entry.percentage >= 80 ? 'text-emerald-400' :
                                                        entry.percentage >= 60 ? 'text-sky-400' :
                                                        entry.percentage >= 40 ? 'text-amber-400' : 'text-red-400'
                                                    }`}>
                                                        {(entry.percentage || 0).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Show student's row if outside top 5 */}
                                    {myRankDisplay !== null && myRankDisplay > 5 && (
                                        <>
                                            <div className="flex items-center gap-2 py-1">
                                                <div className="flex-1 border-t border-dashed border-slate-700" />
                                                <span className="text-slate-600 text-xs px-2">···</span>
                                                <div className="flex-1 border-t border-dashed border-slate-700" />
                                            </div>
                                            {leaderboardEntries[myRankDisplay - 1] && (() => {
                                                const entry = leaderboardEntries[myRankDisplay - 1];
                                                const initials = (entry.users?.full_name || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                                return (
                                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/25 border border-violet-500/50">
                                                        <div className="w-8 text-center flex-shrink-0">
                                                            <span className="text-slate-400 font-bold text-sm">#{myRankDisplay}</span>
                                                        </div>
                                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm bg-violet-500 text-white">
                                                            {initials}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm truncate text-violet-200">
                                                                {entry.users?.full_name || 'You'}
                                                                <span className="ml-2 text-xs text-violet-400 font-normal">(You)</span>
                                                            </p>
                                                            <p className="text-slate-500 text-xs">{formatTimeTaken(entry.time_taken_seconds)}</p>
                                                        </div>
                                                        <span className={`font-bold text-sm w-12 text-right ${
                                                            (entry.percentage || 0) >= 80 ? 'text-emerald-400' :
                                                            (entry.percentage || 0) >= 60 ? 'text-sky-400' :
                                                            (entry.percentage || 0) >= 40 ? 'text-amber-400' : 'text-red-400'
                                                        }`}>
                                                            {(entry.percentage || 0).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Score Details */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Award className="w-6 h-6 text-purple-600" />
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{submission.score || 0}</p>
                                <p className="text-slate-600 text-sm">Score</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{test?.total_marks || 0}</p>
                                <p className="text-slate-600 text-sm">Total Marks</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl font-bold text-green-600">{percentage.toFixed(0)}%</span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{percentage.toFixed(1)}%</p>
                                <p className="text-slate-600 text-sm">Percentage</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                                <div className="w-12 h-12 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-xl font-bold text-fuchsia-600">{grade}</span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{grade}</p>
                                <p className="text-slate-600 text-sm">Grade</p>
                            </div>
                        </div>

                        {/* AI Analysis Summary */}
                        {aiAnalysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                {(aiAnalysis.strengths?.length ?? 0) > 0 && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-green-800">Your Strengths</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiAnalysis.strengths.map((strength: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-green-700">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Areas for Improvement */}
                                {(aiAnalysis.weaknesses?.length ?? 0) > 0 && (
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-amber-800">Areas to Improve</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiAnalysis.weaknesses.map((weakness: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-amber-700">
                                                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
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
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-blue-800">Study Recommendations</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {aiAnalysis!.study_recommendations.map((rec: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 bg-white/60 rounded-lg text-blue-700">
                                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-blue-600">
                                                {idx + 1}
                                            </span>
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Question Review */}
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    Question Review
                                    {aiAnalysis && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-fuchsia-100 text-fuchsia-700 text-xs font-medium rounded-full">
                                            <Sparkles className="w-3 h-3" />
                                            AI Enhanced
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100">
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
                                                    isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="font-medium text-slate-900 mb-2">{question.question || question.text}</p>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                                                                isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                                                                                ? 'bg-green-50 border-green-300'
                                                                                : isSelected
                                                                                    ? 'bg-red-50 border-red-300'
                                                                                    : 'bg-slate-50 border-slate-200'
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            {isCorrectOpt && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                                            {isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-600" />}
                                                                            <span className={isCorrectOpt ? 'text-green-700' : isSelected ? 'text-red-700' : 'text-slate-700'}>
                                                                                {optValue}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {question.type !== 'mcq' && studentAnswer && (
                                                        <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                                                            <p className="text-sm text-slate-600 mb-1">Your Answer:</p>
                                                            <p className="text-slate-900 whitespace-pre-wrap">{studentAnswer}</p>
                                                        </div>
                                                    )}

                                                    {/* AI Feedback for this question */}
                                                    {questionAnalysis?.feedback && (
                                                        <div className="mt-3 p-4 bg-gradient-to-r from-fuchsia-50 to-purple-50 rounded-lg border border-fuchsia-200">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Sparkles className="w-4 h-4 text-fuchsia-600" />
                                                                <p className="text-sm text-fuchsia-700 font-medium">AI Feedback</p>
                                                            </div>
                                                            <p className="text-fuchsia-800">{questionAnalysis.feedback}</p>
                                                        </div>
                                                    )}

                                                    {question.explanation && (
                                                        <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                                                            <p className="text-sm text-blue-600 font-medium mb-1">Explanation:</p>
                                                            <p className="text-blue-800">{question.explanation}</p>
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
                            <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl border border-fuchsia-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-fuchsia-100 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-fuchsia-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-fuchsia-800">AI Overall Assessment</h3>
                                        {submission.ai_evaluated_at && (
                                            <p className="text-sm text-fuchsia-600">
                                                Evaluated {new Date(submission.ai_evaluated_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-fuchsia-800 whitespace-pre-wrap leading-relaxed">
                                    {aiAnalysis?.overall_feedback || submission.ai_feedback}
                                </p>
                            </div>
                        )}

                        {/* Pending Evaluation Notice */}
                        {!submission.ai_evaluated_at && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-800">AI Evaluation in Progress</h3>
                                        <p className="text-amber-700">
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
