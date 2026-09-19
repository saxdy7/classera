import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import RealCalendar from '@/components/shared/RealCalendar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Users, MessageSquare, Target,
  ArrowUpRight, Briefcase, Map, ClipboardCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentDashboard() {
  const supabase = await createClient();

  // Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/signin');

  // Profile — wrap in try/catch so a DB failure shows a degraded UI, not a 500
  let profile: any = null;
  let mentors: any[] = [];
  let conversations: any[] = [];
  let submissions: any[] = [];

  try {
    const { data } = await supabase
      .from('users')
      .select('*, universities(name)')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (_) { }

  // Redirect to onboarding if profile not set up
  if (!profile || !profile.full_name || !profile.university_id) {
    redirect('/onboarding/student');
  }

  // ── Data fetch ──
  // These four queries are independent of one another, so they run together.
  // They used to await sequentially, and the conversations block additionally
  // issued 2 queries per conversation (an N+1), giving ~14 sequential
  // round-trips before the page could render.
  let courseCount: number | string = '—';
  let sessionCount: number | string = '—';

  const [mentorsRes, submissionsRes, courseCountRes, sessionCountRes, convIdsRes] =
    await Promise.allSettled([
      supabase
        .from('users')
        .select('id, full_name, avatar_url, specialization_board, bio')
        .eq('role', 'mentor')
        .eq('university_id', profile.university_id)
        .order('full_name')
        .limit(8),
      supabase
        .from('test_submissions')
        .select('id, test_id, percentage, score, max_score, submitted_at, test:tests(id, title)')
        .eq('student_id', user.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: true })
        .limit(50),
      supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id),
      supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .limit(5),
    ]);

  if (mentorsRes.status === 'fulfilled') mentors = mentorsRes.value.data || [];
  if (submissionsRes.status === 'fulfilled') submissions = submissionsRes.value.data || [];
  if (courseCountRes.status === 'fulfilled' && courseCountRes.value.count !== null) {
    courseCount = courseCountRes.value.count;
  }
  if (sessionCountRes.status === 'fulfilled' && sessionCountRes.value.count !== null) {
    sessionCount = sessionCountRes.value.count;
  }

  // Conversations: fan out over the ids in parallel instead of looping.
  if (convIdsRes.status === 'fulfilled') {
    const convIds = (convIdsRes.value.data || []).map((c: any) => c.conversation_id);
    const perConv = await Promise.allSettled(
      convIds.map(async (conversation_id: string) => {
        const [others, last] = await Promise.all([
          supabase
            .from('conversation_participants')
            .select('users!conversation_participants_user_id_fkey(id, full_name, avatar_url)')
            .eq('conversation_id', conversation_id)
            .neq('user_id', user.id)
            .limit(1)
            .single(),
          supabase
            .from('messages')
            .select('content, created_at, read_by, sender_id')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
        ]);
        if (!others.data || !last.data) return null;
        return {
          id: conversation_id,
          user: (others.data as any).users,
          lastMessage: last.data.content,
          time: new Date(last.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: !last.data.read_by?.includes?.(user.id) && last.data.sender_id !== user.id,
        };
      })
    );
    conversations = perConv
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter(Boolean);
  }

  const firstName = profile.full_name?.split(' ')[0] || 'Student';
  const universityName = profile.universities?.name || 'your university';
  const gradients = ['', '', '', ''];
  const ratings = ['4.8', '4.6', '4.9', '4.7', '4.5', '5.0', '4.3', '4.8'];

  // ── Derived metrics ──
  const avgScore = submissions.length
    ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
    : null;

  const scoreTrend = submissions.slice(-8).map((s: any, i: number) => {
    const title = s.test?.title || `Test ${i + 1}`;
    return { label: title.length > 10 ? `${title.slice(0, 10)}…` : title, score: Math.round(s.percentage || 0) };
  });

  const recentResults = [...submissions].slice(-5).reverse();

