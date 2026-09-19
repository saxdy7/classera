import { inngest } from './client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Send notification for @mentions
export const mentionNotification = inngest.createFunction(
  { id: 'mention-notification', triggers: [{ event: 'community/mention.created' }] },
  async ({ event }) => {
    const { mentionedUserId, postId, commentId, mentionedByUserId } = event.data;

    // Create notification in database
    const { error } = await supabase.from('notifications').insert({
      user_id: mentionedUserId,
      type: 'mention',
      title: 'You were mentioned',
      message: 'Someone mentioned you in a post',
      related_post_id: postId,
      related_comment_id: commentId,
      actor_id: mentionedByUserId,
      is_read: false,
    });

    if (error) {
      console.error('Error creating mention notification:', error);
      throw error;
    }

    return { success: true, notificationType: 'mention' };
  },
);

// Send notification for new posts in followed communities
export const newPostNotification = inngest.createFunction(
  { id: 'new-post-notification', triggers: [{ event: 'community/post.created' }] },
  async ({ event }) => {
    const { communityId, postId, createdByUserId, title } = event.data;

    // Get all members of the community except the author
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)
      .neq('user_id', createdByUserId);

    if (membersError) {
      console.error('Error fetching community members:', membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      return { success: true, notificationsCount: 0 };
    }

    // Create notifications for all members
    const notifications = members.map((member) => ({
      user_id: member.user_id,
      type: 'new_post',
      title: 'New post in community',
      message: title,
      related_post_id: postId,
      actor_id: createdByUserId,
      is_read: false,
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating post notifications:', notifError);
      throw notifError;
    }

    return { success: true, notificationsCount: notifications.length };
  },
);

// Send notification for new comments on user's posts
export const newCommentNotification = inngest.createFunction(
  { id: 'new-comment-notification', triggers: [{ event: 'community/comment.created' }] },
  async ({ event }) => {
    const { postId, commentText, commentedByUserId } = event.data;

    // Get the post author
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('created_by')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      throw postError;
    }

    // Only notify if the commenter is not the post author
    if (post.created_by === commentedByUserId) {
      return { success: true, notified: false };
    }

    // Create notification
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: post.created_by,
      type: 'new_comment',
      title: 'New comment on your post',
      message: commentText.substring(0, 100),
      related_post_id: postId,
      actor_id: commentedByUserId,
      is_read: false,
    });

    if (notifError) {
      console.error('Error creating comment notification:', notifError);
      throw notifError;
    }

    return { success: true, notified: true };
  },
);

// Nudge students whose project deadline is coming up and who haven't submitted yet.
// Runs hourly; checks a 24-48h window so each student is caught once as they enter
// it, and skips anyone already notified for that assignment to avoid re-notifying
// every run.
export const projectDeadlineReminder = inngest.createFunction(
  { id: 'project-deadline-reminder', triggers: [{ cron: '0 * * * *' }] },
  async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const { data: assignments, error: assignmentsError } = await supabase
      .from('project_assignments')
      .select('id, title, deadline')
      .eq('is_active', true)
      .gte('deadline', windowStart.toISOString())
      .lte('deadline', windowEnd.toISOString());

    if (assignmentsError) {
      console.error('Error fetching assignments for deadline reminder:', assignmentsError);
      throw assignmentsError;
    }
    if (!assignments || assignments.length === 0) {
      return { success: true, remindersSent: 0 };
    }

    let remindersSent = 0;

    for (const assignment of assignments) {
      const { data: roster } = await supabase
        .from('assignment_students')
        .select('student_id')
        .eq('assignment_id', assignment.id);

      const { data: submitted } = await supabase
        .from('assignment_submissions')
        .select('student_id')
        .eq('assignment_id', assignment.id);

      const submittedIds = new Set((submitted ?? []).map((s) => s.student_id));
      const pendingStudentIds = (roster ?? [])
        .map((r) => r.student_id)
        .filter((id) => !submittedIds.has(id));

      if (pendingStudentIds.length === 0) continue;

      const { data: alreadyNotified } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('type', 'project_deadline_reminder')
        .eq('related_id', assignment.id)
        .in('user_id', pendingStudentIds);

      const alreadyNotifiedIds = new Set((alreadyNotified ?? []).map((n) => n.user_id));
      const toNotify = pendingStudentIds.filter((id) => !alreadyNotifiedIds.has(id));
      if (toNotify.length === 0) continue;

      const notifications = toNotify.map((student_id) => ({
        user_id: student_id,
        type: 'project_deadline_reminder',
        title: 'Deadline Approaching',
        message: `"${assignment.title}" is due ${new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} and you haven't submitted yet.`,
        related_id: assignment.id,
        related_type: 'project_assignment',
        action_url: `/dashboard/student/projects/${assignment.id}`,
        metadata: { assignment_id: assignment.id },
        is_read: false,
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) {
        console.error(`Error sending deadline reminders for assignment ${assignment.id}:`, insertError);
        continue;
      }
      remindersSent += notifications.length;
    }

    return { success: true, remindersSent };
  },
);
