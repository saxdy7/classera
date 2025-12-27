import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Sparkles, Send, BookOpen, Brain, Lightbulb } from 'lucide-react';

export default async function StudentAIAssistantPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">AI Assistant</h2>
              <p className="text-slate-600">Get instant help with your studies</p>
            </div>

            {/* AI Chat Interface */}
            <div className="bg-white rounded-xl border border-slate-200 h-[calc(100vh-250px)] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Welcome Message */}
                <div className="flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-black mb-4">
                        👋 Hi! I&rsquo;m your AI learning assistant. I can help you with:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <BookOpen className="w-4 h-4 text-fuchsia-500" />
                          <span>Explaining difficult concepts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Brain className="w-4 h-4 text-purple-500" />
                          <span>Solving practice problems</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Lightbulb className="w-4 h-4 text-blue-500" />
                          <span>Study tips and strategies</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Just now</p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Ask me anything about your studies..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors text-black bg-white"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
