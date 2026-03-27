import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  mentionNotification,
  newPostNotification,
  newCommentNotification,
} from '@/inngest/functions';

// Create an API handler to manage Inngest events
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [mentionNotification, newPostNotification, newCommentNotification],
});
