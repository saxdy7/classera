import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import QuestionBankManager from '@/components/tests/QuestionBankManager';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function QuestionBankPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student');

  return (
    <div className="min-h-screen bg-muted/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/dashboard/mentor/tests"
              className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tests
            </Link>
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Question Bank</h1>
              <p className="text-foreground/80 mt-1">Build a reusable library of questions for your tests</p>
            </div>
            <QuestionBankManager />
          </div>
        </main>
      </div>
    </div>
  );
}
