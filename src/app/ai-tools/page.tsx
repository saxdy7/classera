'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { CreditsDisplay, CreditsModal } from '@/components/shared/CreditsDisplay';
import { useCredits } from '@/hooks/useCredits';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Brain, CheckCircle2 } from 'lucide-react';

const AI_TOOLS = [
  {
    id: 'career-coach',
    name: 'AI Career Coach',
    description: 'Get personalized career guidance and development plans',
    icon: '🎯',
    cost: 1,
    pro: false,
    features: ['Career path recommendations', 'Resume optimization', 'Interview preparation'],
  },
  {
    id: 'roadmap',
    name: 'AI Roadmap',
    description: 'Generate custom learning roadmaps for your goals',
    icon: '🗺️',
    cost: 2,
    pro: false,
    features: ['Personalized learning paths', 'Skill assessment', 'Progress tracking'],
  },
  {
    id: 'job-tracker',
    name: 'AI Job Tracker',
    description: 'Track job applications and get interview insights',
    icon: '📊',
    cost: 1,
    pro: false,
    features: ['Application tracking', 'Job market analysis', 'Salary insights'],
  },
  {
    id: 'resume-maker',
    name: 'AI Resume Maker',
    description: 'Create professional resumes powered by AI',
    icon: '📄',
    cost: 3,
    pro: true,
    features: ['Template selection', 'ATS optimization', 'Cover letter generation'],
  },
  {
    id: 'interview-prep',
    name: 'AI Interview Prep',
    description: 'Practice interviews with AI feedback and scoring',
    icon: '🎤',
    cost: 2,
    pro: true,
    features: ['Mock interviews', 'Real-time feedback', 'Performance analytics'],
  },
];

export default function AIToolsPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, [supabase.auth]);
  
  const { balance, loading: creditsLoading } = useCredits();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (searchParams.get('modal') === 'credits') {
      setShowCreditsModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('*, universities(name)')
            .eq('id', user.id)
            .single();
          if (data) setProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session, supabase.auth]);

  const handleToolClick = (tool: (typeof AI_TOOLS)[0]) => {
    if (balance < tool.cost) {
      setShowCreditsModal(true);
    } else {
      router.push(`/ai-tools/${tool.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      {profile && <Header profile={profile} />}
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-4 md:p-8 max-w-6xl">
          {/* Credits Section */}
          <div className="mb-8">
            {!creditsLoading && (
              <CreditsDisplay balance={balance} onTopUpClick={() => setShowCreditsModal(true)} />
            )}
          </div>

          {/* Tools Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-[var(--cl-info)]" />
                  AI Learning Tools
                </h1>
                <p className="text-[var(--cl-body)] mt-1">
                  Enhance your learning with AI-powered tools. Each tool costs credits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AI_TOOLS.map((tool) => {
                const canUse = balance >= tool.cost;
                return (
                  <Card
                    key={tool.id}
                    className={`hover:shadow-lg transition-all ${
                      !canUse ? 'opacity-75' : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-4xl">{tool.icon}</span>
                        {tool.pro && (
                          <Badge className="bg-[var(--cl-warning)] text-[var(--cl-on-dark)]">Pro</Badge>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">
                        {tool.name}
                      </h3>
                      <p className="text-[var(--cl-body)] text-sm mb-4">
                        {tool.description}
                      </p>

                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        {tool.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[var(--cl-success)]" />
                            <span className="text-sm text-[var(--cl-body)]">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Cost & Button */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold text-[var(--cl-info)]">
                            {tool.cost}
                          </span>
                          <span className="text-sm text-[var(--cl-muted)]">credits</span>
                        </div>
                        <Button
                          onClick={() => handleToolClick(tool)}
                          disabled={creditsLoading}
                          className={
                            canUse
                              ? 'bg-[var(--cl-info)] hover:bg-[var(--cl-info)]'
                              : 'bg-[var(--cl-surface-strong)] cursor-not-allowed'
                          }
                        >
                          {canUse ? (
                            'Use Tool'
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Locked
                            </>
                          )}
                        </Button>
                      </div>

                      {!canUse && (
                        <p className="text-xs text-[var(--cl-muted)] mt-2">
                          Need {tool.cost - balance} more credit{tool.cost - balance === 1 ? '' : 's'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Free Tier Info */}
          <Card className="bg-[rgba(13,116,206,0.12)] border-[var(--cl-info)]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Brain className="w-6 h-6 text-[var(--cl-info)] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[var(--cl-info)] mb-1">
                    Free Trial: 5 Credits
                  </h3>
                  <p className="text-sm text-[var(--cl-info)]">
                    Every new student gets 5 free credits to try our AI tools. Once you
                    run out, purchase more credits to continue learning with AI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Credits Purchase Modal */}
      <Dialog open={showCreditsModal} onOpenChange={setShowCreditsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <CreditsModal onClose={() => setShowCreditsModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
