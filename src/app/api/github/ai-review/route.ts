import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAIClients } from '@/lib/deepseek';

const GITHUB_API = 'https://api.github.com';
const MAX_FILE_CHARS = 8_000;
const MAX_ANALYTICS_CHARS = 6_000;

interface ReviewIssue {
  severity: 'critical' | 'warning' | 'info';
  line?: number;
  description: string;
  suggestion: string;
}

interface AIReviewResult {
  summary: string;
  overall_rating: number;
  strengths: string[];
  issues: ReviewIssue[];
  cached_at?: string;
  is_cached?: boolean;
}

function extractJson(text: string): string {
  // Find the first { ... } block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

async function callAI(prompt: string): Promise<AIReviewResult> {
  const { deepseek, groq } = getAIClients();

  const systemPrompt =
    'You are an expert code reviewer. Respond ONLY with valid JSON matching the schema provided. No markdown, no extra text.';

  // Try DeepSeek first
  try {
    const resp = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2048,
    });
    const content = resp.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as AIReviewResult;
  } catch (primaryErr) {
    console.warn('DeepSeek failed, falling back to Groq:', primaryErr);
  }

  // Fallback: Groq
  const fallbackResp = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });
  const raw = fallbackResp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(extractJson(raw)) as AIReviewResult;
}

/** POST /api/github/ai-review  Body: { submission_id, file_path?, force_refresh? } */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      submission_id: string;
      file_path?: string;
      force_refresh?: boolean;
    };
    const { submission_id, file_path, force_refresh } = body;

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify caller is the mentor for this submission
    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('student_id, repo_full_name, assignment:project_assignments(mentor_id)')
      .eq('id', submission_id)
      .single();

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    const mentorId = (submission.assignment as { mentor_id?: string })?.mentor_id;
    if (mentorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden — mentors only' }, { status: 403 });
    }

    // Fetch cached analytics row
    const { data: analytics } = await admin
      .from('repo_analytics')
      .select('ai_review, ai_file_reviews, overall_score, consistency_score, activity_score, quality_score, suspicious_flags, languages, total_commits, active_days, has_readme, has_tests')
      .eq('submission_id', submission_id)
      .single();

    // Check cache
    if (!force_refresh && analytics) {
      if (file_path) {
        const cached = (analytics.ai_file_reviews as Record<string, AIReviewResult> | null)?.[file_path];
        if (cached) return NextResponse.json({ review: { ...cached, is_cached: true } });
      } else if (analytics.ai_review) {
        return NextResponse.json({ review: { ...(analytics.ai_review as AIReviewResult), is_cached: true } });
      }
    }

    const { data: studentConn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', submission.student_id)
      .single();

    let token = studentConn?.access_token ?? null;
    if (!token) {
      const mentorId = (submission.assignment as any)?.mentor_id;
      if (mentorId) {
        const { data: mentorConn } = await admin
          .from('github_connections')
          .select('access_token')
          .eq('user_id', mentorId)
          .single();
        token = mentorConn?.access_token ?? null;
      }
    }
    token = token ?? process.env.GITHUB_TOKEN ?? null;
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3.raw',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let prompt: string;

    if (file_path) {
      // Fetch file contents
      const fileRes = await fetch(
        `${GITHUB_API}/repos/${submission.repo_full_name}/contents/${encodeURIComponent(file_path)}`,
        { headers: { ...headers, Accept: 'application/vnd.github.v3+json' } },
      );

      if (!fileRes.ok) {
        return NextResponse.json({ error: 'Could not fetch file from GitHub' }, { status: 502 });
      }

      const fileData = await fileRes.json() as { content?: string; encoding?: string; size?: number };
      let code = '';
      if (fileData.encoding === 'base64' && fileData.content) {
        code = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
      }
      code = code.slice(0, MAX_FILE_CHARS);

      prompt = `Review the following code file from a student's GitHub project submission.

File path: ${file_path}
Repository: ${submission.repo_full_name}

\`\`\`
${code}
\`\`\`

Return ONLY this JSON schema (no markdown fences):
{
  "summary": "2-3 sentence overview of this file",
  "overall_rating": <integer 1-10>,
  "strengths": ["..."],
  "issues": [
    {
      "severity": "critical|warning|info",
      "line": <optional line number>,
      "description": "what the problem is",
      "suggestion": "how to fix it"
    }
  ]
}`;
    } else {
      // Use repo analytics as context
      const ctx = JSON.stringify(analytics ?? {}).slice(0, MAX_ANALYTICS_CHARS);
      prompt = `Review the following GitHub repository analytics for a student's project submission.

Repository: ${submission.repo_full_name}
Analytics data (JSON):
${ctx}

Provide a holistic review of the project quality, workflow patterns, and potential issues.

Return ONLY this JSON schema (no markdown fences):
{
  "summary": "3-4 sentence overview of the project",
  "overall_rating": <integer 1-10>,
  "strengths": ["..."],
  "issues": [
    {
      "severity": "critical|warning|info",
      "description": "what the problem is",
      "suggestion": "how to improve"
    }
  ]
}`;
    }

    const review = await callAI(prompt);
    review.cached_at = new Date().toISOString();

    // Cache the result
    if (file_path) {
      const existing = (analytics?.ai_file_reviews as Record<string, AIReviewResult>) ?? {};
      await admin
        .from('repo_analytics')
        .update({ ai_file_reviews: { ...existing, [file_path]: review } })
        .eq('submission_id', submission_id);
    } else {
      await admin
        .from('repo_analytics')
        .update({ ai_review: review })
        .eq('submission_id', submission_id);
    }

    return NextResponse.json({ review: { ...review, is_cached: false } });
  } catch (err) {
    console.error('AI review error:', err);
    const msg = err instanceof Error ? err.message : 'AI review failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
