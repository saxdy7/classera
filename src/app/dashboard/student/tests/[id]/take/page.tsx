import { redirect } from 'next/navigation';

/**
 * The legacy /take flow loaded a test directly on the client with no server-side
 * gating (invitation / is_live / already-submitted). All test-taking now goes through
 * the secure, server-validated, anti-cheat path so there is a single hardened entry point.
 */
export default async function TakeRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/student/tests/${id}/take-secure`);
}
