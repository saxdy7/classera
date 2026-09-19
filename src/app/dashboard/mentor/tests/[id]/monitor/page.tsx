import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { TestMonitorClient } from '@/components/tests/TestMonitorClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MentorTestMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  const { data: test } = await supabase
    .from('tests')
    .select('id, title, is_live')
    .eq('id', id)
    .eq('mentor_id', user.id)
    .single();

  if (!test) redirect('/dashboard/mentor/tests');

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-6xl mx-auto">
            <Link
              href={`/dashboard/mentor/tests/${id}`}
              className="inline-flex items-center gap-2 text-[var(--cl-body)] hover:text-[var(--cl-ink)] mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Test
            </Link>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{test.title}</h1>
                <p className="text-[var(--cl-body)] mt-1">Live monitoring &amp; proctoring</p>
              </div>
              {test.is_live ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] rounded-lg font-medium">
                  <span className="w-2 h-2 bg-[var(--cl-success)] rounded-full animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="px-4 py-2 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg font-medium">Not Live</span>
              )}
            </div>
            <TestMonitorClient testId={id} />
          </div>
        </main>
      </div>
    </div>
  );
}
