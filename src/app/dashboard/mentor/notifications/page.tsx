import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default async function MentorNotificationsPage() {
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
    redirect('/onboarding/mentor');
  }

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'info',
      title: 'New Student Enrollment',
      message: 'A new student has enrolled in your Web Development course.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 2,
      type: 'success',
      title: 'Test Submissions',
      message: '15 students have submitted their assignments for Data Structures.',
      time: '3 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      title: 'Upcoming Live Session',
      message: 'You have a live session scheduled for tomorrow at 2:00 PM.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 4,
      type: 'info',
      title: 'Student Question',
      message: 'A student has asked a question in the course forum.',
      time: '2 days ago',
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-orange-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold text-black flex items-center gap-3">
                  <Bell className="w-8 h-8 text-indigo-600" />
                  Notifications
                </h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  Mark all as read
                </button>
              </div>
              <p className="text-slate-600">Stay updated with your latest activities</p>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-indigo-500' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-black">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-slate-400">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State (if no notifications) */}
            {notifications.length === 0 && (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No notifications yet</h3>
                <p className="text-slate-500">You're all caught up! Check back later for updates.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
