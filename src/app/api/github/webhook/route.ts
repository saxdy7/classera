import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * GitHub Webhook Handler - push events trigger automatic re-analysis instead
 * of requiring a mentor to click "Re-analyze" manually.
 *
 * Rebuilt against the real schema (the previous version referenced
 * project_assignments.github_repo_url, repo_analytics.project_id/
 * total_pull_requests/last_commit_date, and a webhook_logs table - none of
 * which exist; see PROJECTS_FEATURE_HANDOFF.md). Matches submissions by
 * repo_full_name on assignment_submissions instead.
 */

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifyWebhookSignature(request: NextRequest, payload: Buffer): boolean {
  if (!WEBHOOK_SECRET) return false;
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) return false;

  const expected = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')}`;

  // timingSafeEqual throws on mismatched buffer lengths instead of returning
  // false - check length first so a malformed/short signature fails safely.
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  try {
    const payloadBuffer = Buffer.from(await request.arrayBuffer());
    if (!verifyWebhookSignature(request, payloadBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const githubEvent = request.headers.get('x-github-event');
    if (githubEvent !== 'push') {
      // We only act on pushes; acknowledge everything else so GitHub doesn't retry.
      return NextResponse.json({ message: `Ignored event type: ${githubEvent}` });
    }

    const event = JSON.parse(payloadBuffer.toString());
    const repoFullName: string | undefined = event.repository?.full_name;
    const commitCount: number = Array.isArray(event.commits) ? event.commits.length : 0;

    if (!repoFullName || commitCount === 0) {
      return NextResponse.json({ message: 'No commits to process' });
    }

    const admin = createAdminClient();

    // A repo can be submitted to more than one assignment (rare, but possible
    // if a student reuses a repo) - re-analyze every match.
    const { data: submissions } = await admin
      .from('assignment_submissions')
      .select('id, assignment_id, student_id, assignment:project_assignments(mentor_id, title, submission_type)')
      .ilike('repo_full_name', repoFullName);

    const matches = (submissions ?? []).filter(
      (s) => (s.assignment as any)?.submission_type === 'github' || !(s.assignment as any)?.submission_type,
    );

    if (matches.length === 0) {
      return NextResponse.json({ message: `No submission found for ${repoFullName} (this is OK)` });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    for (const submission of matches) {
      const assignment = submission.assignment as { mentor_id?: string; title?: string } | null;

      // Fire-and-forget re-analysis, same internal call the submit route already uses.
      fetch(`${appUrl}/api/github/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id }),
      }).catch((e) => console.error('Webhook-triggered analysis failed to start:', e));

      if (assignment?.mentor_id) {
        await admin.from('notifications').insert({
          user_id: assignment.mentor_id,
          type: 'project_new_commits',
          title: 'New Commits Pushed',
          message: `${commitCount} new commit${commitCount !== 1 ? 's' : ''} pushed to "${assignment.title ?? 'a project'}" since you last reviewed it.`,
          related_id: submission.assignment_id,
          related_type: 'project_assignment',
          action_url: `/dashboard/mentor/projects/${submission.assignment_id}/${submission.student_id}`,
          metadata: { assignment_id: submission.assignment_id, submission_id: submission.id, commit_count: commitCount },
          is_read: false,
        });
      }
    }

    return NextResponse.json({ success: true, repo: repoFullName, submissions_reanalyzed: matches.length });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub Webhook Endpoint',
    description:
      'Configure in GitHub repo settings: Settings > Webhooks > Add webhook. Content type: application/json. ' +
      'Set GITHUB_WEBHOOK_SECRET in your environment and use the same value as the webhook secret.',
    events: ['push'],
  });
}
