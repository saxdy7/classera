import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { User, Bell, Lock } from 'lucide-react';

export default async function StudentSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.university || !profile?.full_name) {
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
              <h2 className="text-3xl font-bold text-black mb-2">Settings</h2>
              <p className="text-slate-600">Manage your account and preferences</p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Profile Information</h3>
                    <p className="text-sm text-slate-600">Update your personal details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.full_name || ''}
                      disabled
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      University
                    </label>
                    <input
                      type="text"
                      value={profile.university || ''}
                      disabled
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={profile.field_of_study || ''}
                      disabled
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Notifications</h3>
                    <p className="text-sm text-slate-600">Manage your notification preferences</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-black">Email Notifications</p>
                      <p className="text-sm text-slate-600">Receive updates via email</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition ml-1" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-black">Push Notifications</p>
                      <p className="text-sm text-slate-600">Get push notifications on your device</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Privacy & Security</h3>
                    <p className="text-sm text-slate-600">Manage your security settings</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-black">Change Password</p>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-black">Two-Factor Authentication</p>
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
