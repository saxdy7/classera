import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * GitHub Webhook Handler
 * Receives events from GitHub: push, pull_request, issues, etc.
 * Updates project analytics in real-time
 */

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'dev-secret';

function verifyWebhookSignature(request: NextRequest, payload: Buffer): boolean {
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) return false;

  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const expectedSignature = `sha256=${hash}`;
  return crypto.timingSafeEqual(signature, expectedSignature);
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const payload = await request.arrayBuffer();
    if (!verifyWebhookSignature(request, Buffer.from(payload))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(Buffer.from(payload).toString());
    const admin = createAdminClient();

    // Extract repository info
    const repoName = event.repository?.name;
    const repoUrl = event.repository?.html_url;
    const repoOwner = event.repository?.owner?.login;

    if (!repoName || !repoUrl) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Get the full repo URL in standard format
    const fullRepoUrl = `https://github.com/${repoOwner}/${repoName}`;

    // Find the project with this GitHub repo
    const { data: projects } = await admin
      .from('project_assignments')
      .select('id, title')
      .ilike('github_repo_url', `%${repoName}%`);

    if (!projects || projects.length === 0) {
      console.log(`No projects found for repo: ${fullRepoUrl}`);
      return NextResponse.json({ message: 'Project not found (this is OK)' });
    }

    const project = projects[0];

    // Handle push events
    if (event.action === 'opened' || event.ref) {
      const commits = event.commits || [];
      const { data: analytics } = await admin
        .from('repo_analytics')
        .select('*')
        .eq('project_id', project.id)
        .single();

      if (analytics) {
        await admin
          .from('repo_analytics')
          .update({
            total_commits: (analytics.total_commits || 0) + commits.length,
            last_commit_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', project.id);
      } else {
        await admin
          .from('repo_analytics')
          .insert({
            project_id: project.id,
            repo_url: fullRepoUrl,
            total_commits: commits.length,
            last_commit_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
      }
    }

    // Handle pull request events
    if (event.action === 'opened' && event.pull_request) {
      const { data: analytics } = await admin
        .from('repo_analytics')
        .select('*')
        .eq('project_id', project.id)
        .single();

      if (analytics) {
        await admin
          .from('repo_analytics')
          .update({
            total_pull_requests: (analytics.total_pull_requests || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', project.id);
      }
    }

    // Log webhook activity
    await admin
      .from('webhook_logs')
      .insert({
        project_id: project.id,
        event_type: event.action || event.ref ? 'push' : 'unknown',
        event_data: event,
        processed_at: new Date().toISOString(),
      })
      .catch(err => console.log('Webhook log insert error:', err)); // Non-critical

    // Trigger AI review on commits (optional - can be rate-limited)
    if (commits && commits.length > 0) {
      const commitData = commits.slice(0, 3).map((c: any) => ({
        message: c.message,
        url: c.url,
        timestamp: c.timestamp,
      }));

      // Could queue this for async processing
      console.log(`New commits on ${project.title}:`, commitData);
    }

    return NextResponse.json({
      success: true,
      project: project.title,
      eventType: event.action || 'push',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub Webhook Endpoint',
    description: 'Configure in GitHub repo settings: Settings > Webhooks > Add webhook',
    events: ['push', 'pull_request', 'issues', 'pull_request_review'],
  });
}
