import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import RealCalendar from '@/components/shared/RealCalendar';
import Image from 'next/image';
// import { PinterestGrid, PinterestCourseCard, PinterestMentorCard } from '@/components/shared/PinterestCards';

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get user profile with university
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  // Check if profile is complete
  if (!profile) {
    redirect('/onboarding/student');
  }

  if (!profile.full_name || !profile.university_id) {
    redirect('/onboarding/student');
  }

  // Fetch real mentors from the same university
  const { data: mentors } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url, role, specialization_board')
    .eq('role', 'mentor')
    .eq('university_id', profile.university_id)
    .order('full_name')
    .limit(10);

  // Add fake mentors after real mentors for UI
  const fakeMentors = [
    { id: 'fake-1', full_name: 'Dr. Sarah Johnson', specialization_board: 'Computer Science', avatar_url: null },
    { id: 'fake-2', full_name: 'Prof. Michael Chen', specialization_board: 'Data Science', avatar_url: null },
    { id: 'fake-3', full_name: 'Dr. Emily Rodriguez', specialization_board: 'Web Development', avatar_url: null },
    { id: 'fake-4', full_name: 'Prof. James Wilson', specialization_board: 'AI & Machine Learning', avatar_url: null },
    { id: 'fake-5', full_name: 'Dr. Priya Patel', specialization_board: 'Software Engineering', avatar_url: null },
  ];
  const displayMentors = [...(mentors || []), ...fakeMentors];

  // Fetch real conversations
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role), receiver:users!messages_receiver_id_fkey(id, full_name, avatar_url, role)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50);

  // Process conversations
  const conversationsMap = new Map();
  messages?.forEach((message: any) => {
    const isCurrentUserSender = message.sender_id === user.id;
    const otherUser = isCurrentUserSender ? message.receiver : message.sender;
    
    if (!otherUser) return;

    const existingConversation = conversationsMap.get(otherUser.id);

    if (!existingConversation || new Date(message.created_at) > new Date(existingConversation.lastMessage.created_at)) {
      conversationsMap.set(otherUser.id, {
        user: otherUser,
        lastMessage: {
          content: message.content,
          created_at: message.created_at,
          isFromCurrentUser: isCurrentUserSender,
          read: message.read,
        },
        unreadCount: message.receiver_id === user.id && !message.read ? 1 : 0,
      });
    } else if (message.receiver_id === user.id && !message.read) {
      existingConversation.unreadCount += 1;
    }
  });

  const conversations = Array.from(conversationsMap.values()).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex bg-white">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Welcome Header Container */}
            <div className="lg:col-span-3 bg-gradient-to-br from-purple-100 via-fuchsia-50 to-pink-50 rounded-3xl p-6 md:p-8 h-fit shadow-sm">
              <div className="flex items-center justify-between gap-6">
                {/* Left Side - Welcome Text */}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Hello, Welcome back! 👋
                  </h1>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Good to see you again, {profile?.full_name?.split(' ')[0]}! You're currently enrolled at {profile.universities?.name}.
                    Continue your learning journey and explore your courses, connect with mentors, and stay on track with your goals.
                  </p>
                </div>

                {/* Right Side - Illustration */}
                <div className="hidden lg:block flex-shrink-0">
                  <Image
                    src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                    alt="Student Illustration"
                    width={200}
                    height={200}
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Real Calendar Widget */}
            <RealCalendar userId={user.id} />
          </div>

          {/* Recommended Mentors Section */}
          <div className="-mt-48 max-w-6xl z-10 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Recommended Mentors</h2>
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                View More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {displayMentors && displayMentors.length > 0 ? (
                displayMentors.map((mentor: any) => {
                  const rating = (Math.random() * 1.3 + 3.7).toFixed(1); // Generate realistic rating 3.7-5.0
                  const expertise = mentor.specialization_board || 'General Mentorship';
                  
                  return (
                    <div key={mentor.id} className="flex-shrink-0 w-80 bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      {/* Header with gradient */}
                      <div className={`h-24 bg-gradient-to-br ${
                        ['from-blue-400 to-cyan-300', 'from-yellow-300 to-orange-300', 'from-purple-400 to-pink-300'][Math.floor(Math.random() * 3)]
                      }`}></div>
                      
                      {/* Profile Image */}
                      <div className="relative -mt-12 flex flex-col items-center px-6">
                        {mentor.avatar_url ? (
                          <img 
                            src={mentor.avatar_url} 
                            alt={mentor.full_name}
                            className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {mentor.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                          </div>
                        )}
                        
                        {/* Rating Badge */}
                        <div className="flex items-center gap-1 mt-2 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <span className="text-sm font-bold text-slate-900">{rating}</span>
                          <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        </div>

                        {/* Name and Title */}
                        <h3 className="text-lg font-bold text-slate-900 mt-2 text-center">{mentor.full_name}</h3>
                        <p className="text-sm text-blue-600 font-medium">{expertise}</p>

                        {/* Expertise Tags */}
                        <p className="text-xs text-slate-600 text-center mt-2 px-4 line-clamp-2">
                          Expertise: skill building, career/path guidance, job placement
                        </p>

                        {/* Book Session Button */}
                        <button className="w-full mt-4 mb-4 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                          Book Session
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No mentors available at the moment</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}