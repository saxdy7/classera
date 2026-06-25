import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Award, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import type { AIAnalysis } from '@/lib/test-types';

export const dynamic = 'force-dynamic';

interface ReviewItem {
  question_id: string;
  question_text: string;
  type: string;
  options?: string[];
  student_answer: string;
  correct_answer?: string;
  is_correct: boolean;
  answered: boolean;
  earned_marks: number;
  max_marks: number;
  feedback?: string;
  tips?: string[];
}

export default async function TestReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: testId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  const admin = createAdminClient();

  const { data: test } = await admin
    .from('tests')
    .select('id, title, total_marks, questions, settings')
    .eq('id', testId)
    .single();

  const { data: submission } = await admin
    .from('test_submissions')
    .select('*')
    .eq('test_id', testId)
    .eq('student_id', user.id)
    .single();

  if (!test || !submission) redirect('/dashboard/student/tests');

  // Respect the mentor's "allow review" setting (defaults to allowed)
  const allowReview = (test.settings as any)?.allow_review !== false;

  const questions: any[] = Array.isArray(test.questions) ? test.questions : [];
  const answers: Record<string, any> = (submission.answers as any) || {};
  const aiAnalysis = submission.ai_analysis as AIAnalysis | null;
  const aiByQuestion = new Map<string, any>(
    (aiAnalysis?.question_analysis || []).map((qa: any) => [qa.question_id, qa])
  );

  // Build a per-question review, preferring AI analysis where present
  const items: ReviewItem[] = questions.map((q, index) => {
    const questionId = q.id || `q_${index}`;
    const rawAnswer = answers[questionId];
    const studentAnswer = Array.isArray(rawAnswer) ? rawAnswer.join(', ') : (rawAnswer ?? '');
    const answered = studentAnswer !== '' && studentAnswer != null;
    const maxMarks = q.marks ?? 1;

    // Resolve correct answer text
    let correctAnswer = '';
    if (typeof q.correctAnswer === 'number' && q.options) {
      correctAnswer = q.options[q.correctAnswer];
    } else {
      const raw = q.correctAnswer ?? q.correct_answer ?? '';
      correctAnswer = Array.isArray(raw) ? raw.join(', ') : String(raw);
    }

    const ai = aiByQuestion.get(questionId);
    const isCorrect = ai ? !!ai.is_correct : (q.type === 'mcq' && answered && studentAnswer === correctAnswer);
    const earned = ai
      ? (ai.earned_marks ?? ai.partial_score ?? (ai.is_correct ? maxMarks : 0))
      : (isCorrect ? maxMarks : 0);

    return {
      question_id: questionId,
      question_text: q.question || ai?.question_text || `Question ${index + 1}`,
      type: q.type || 'mcq',
      options: q.options,
      student_answer: answered ? studentAnswer : 'No answer',
      correct_answer: q.type === 'mcq' ? correctAnswer : (ai?.correct_answer || undefined),
      is_correct: isCorrect,
      answered,
      earned_marks: earned,
      max_marks: maxMarks,
      feedback: ai?.feedback || ai?.explanation,
      tips: ai?.improvement_tips || ai?.tips,
    };
  });

  const totalEarned = items.reduce((s, i) => s + i.earned_marks, 0);
  const totalMax = items.reduce((s, i) => s + i.max_marks, 0) || (test.total_marks ?? 0);
  const correctCount = items.filter((i) => i.is_correct).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/dashboard/student/tests/${testId}/results`}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Results
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900">{test.title}</h1>
              <p className="text-slate-600 mt-1">Answer review</p>
            </div>

            {!allowReview ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <MinusCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Review not available</h3>
                <p className="text-slate-500">Your mentor has disabled answer review for this test.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <p className="text-sm text-slate-500">Score</p>
                    <p className="text-2xl font-bold text-slate-900">{totalEarned}/{totalMax}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <p className="text-sm text-slate-500">Correct</p>
                    <p className="text-2xl font-bold text-green-600">{correctCount}/{items.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <p className="text-sm text-slate-500">Percentage</p>
                    <p className="text-2xl font-bold text-fuchsia-600">
                      {totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0}%
                    </p>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const statusColor = !item.answered
                      ? 'border-slate-200'
                      : item.is_correct
                      ? 'border-green-300'
                      : 'border-red-300';
                    return (
                      <div key={item.question_id} className={`bg-white rounded-xl p-6 border-2 ${statusColor}`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                              {index + 1}
                            </span>
                            <h3 className="text-base font-semibold text-slate-900">{item.question_text}</h3>
                          </div>
                          <span className="flex-shrink-0 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                            <Award className="w-4 h-4" />
                            {item.earned_marks}/{item.max_marks}
                          </span>
                        </div>

                        <div className="ml-11 space-y-3">
                          {/* Status badge */}
                          <div>
                            {!item.answered ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                <MinusCircle className="w-3.5 h-3.5" /> Not answered
                              </span>
                            ) : item.is_correct ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect
                              </span>
                            )}
                          </div>

                          {/* MCQ options */}
                          {item.type === 'mcq' && item.options ? (
                            <div className="space-y-2">
                              {item.options.map((opt, i) => {
                                const isStudent = opt === item.student_answer;
                                const isCorrectOpt = opt === item.correct_answer;
                                return (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${
                                      isCorrectOpt
                                        ? 'border-green-400 bg-green-50 text-green-800'
                                        : isStudent
                                        ? 'border-red-400 bg-red-50 text-red-800'
                                        : 'border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {isCorrectOpt ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : isStudent ? (
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    ) : (
                                      <span className="w-4 h-4" />
                                    )}
                                    <span>{opt}</span>
                                    {isStudent && <span className="ml-auto text-xs font-medium">Your answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Your answer</p>
                                <p className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap">
                                  {item.student_answer}
                                </p>
                              </div>
                              {item.correct_answer && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 mb-1">Expected answer</p>
                                  <p className="px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-800 whitespace-pre-wrap">
                                    {item.correct_answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Feedback */}
                          {item.feedback && (
                            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-900">
                              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" />
                              <div>
                                <p>{item.feedback}</p>
                                {item.tips && item.tips.length > 0 && (
                                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-indigo-700">
                                    {item.tips.map((t, i) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
