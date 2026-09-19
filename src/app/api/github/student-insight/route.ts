import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAIClients } from '@/lib/deepseek';

const MAX_ANALYTICS_CHARS = 4_000;

interface StudentInsight {
  note: string;
  generated_at?: string;
  is_cached?: boolean;
}

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

async function callAI(prompt: string): Promise<StudentInsight> {
  const { deepseek, groq } = getAIClients();

  const systemPrompt =
    'You are a warm, specific, encouraging coding mentor giving a student a short heads-up on what to work on next. ' +
    'Respond ONLY with valid JSON matching the schema provided. No markdown, no extra text.';

  try {
    const resp = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 300,
    });
    const content = resp.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as StudentInsight;
  } catch (primaryErr) {
    console.warn('DeepSeek failed, falling back to Groq:', primaryErr);
  }

  const fallbackResp = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 300,
  });
  const raw = fallbackResp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(extractJson(raw)) as StudentInsight;
}

/**
 * POST /api/github/student-insight
 * Body: { submission_id, force_refresh? }
 * Student-authorized (unlike /api/github/ai-review, which is mentor-only).
 * Generates a short, specific, encouraging "what to work on next" note from
 * the student's own repo_analytics - not a critique, a coaching nudge.
 * Cached in repo_analytics.student_insight, separate from the mentor-facing
 * repo_analytics.ai_review.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { submission_id: string; force_refresh?: boolean };
    const { submission_id, force_refresh } = body;
    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('student_id, repo_full_name')
      .eq('id', submission_id)
      .single();

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: analytics } = await admin
      .from('repo_analytics')
      .select('student_insight, overall_score, consistency_score, activity_score, quality_score, suspicious_flags, languages, total_commits, active_days, has_readme, has_tests, complexity_level')
      .eq('submission_id', submission_id)
      .single();

    if (!analytics) {
      return NextResponse.json({ error: 'No analysis yet for this submission' }, { status: 404 });
    }

    if (!force_refresh && analytics.student_insight) {
      return NextResponse.json({ insight: { ...(analytics.student_insight as StudentInsight), is_cached: true } });
    }

    const ctx = JSON.stringify({
      overall_score: analytics.overall_score,
      consistency_score: analytics.consistency_score,
      activity_score: analytics.activity_score,
      quality_score: analytics.quality_score,
      suspicious_flags: analytics.suspicious_flags,
      languages: analytics.languages,
      total_commits: analytics.total_commits,
      active_days: analytics.active_days,
      has_readme: analytics.has_readme,
      has_tests: analytics.has_tests,
      complexity_level: analytics.complexity_level,
    }).slice(0, MAX_ANALYTICS_CHARS);

    const prompt = `Here is a student's GitHub repository analytics for their project submission (repo: ${submission.repo_full_name}):

${ctx}

Write ONE short, specific, encouraging note (2-3 sentences max) telling the student what to focus on next to improve. Reference something concrete from the data (e.g. missing tests, low consistency, no README) rather than generic advice. Be warm, not harsh.

Return ONLY this JSON schema (no markdown fences):
{
  "note": "2-3 sentence coaching note"
}`;

    const result = await callAI(prompt);
    result.generated_at = new Date().toISOString();

    await admin
      .from('repo_analytics')
      .update({ student_insight: result })
      .eq('submission_id', submission_id);

    return NextResponse.json({ insight: { ...result, is_cached: false } });
  } catch (err) {
    console.error('Student insight error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate insight';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
