import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import { BookOpen, Users, Plus, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default async function MentorCoursesPage() {
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

  // Get mentor's courses
  const { data: courses } = await supabase
    .from('mentor_courses')
    .select('*')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter(c => c.is_published).length || 0;
  const totalStudents = courses?.reduce((sum, c) => sum + (c.enrolled_count || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8 md:ml-14">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">My Courses</h2>
                <p className="text-slate-600">Create and manage your courses</p>
              </div>
              <Link
                href="/dashboard/mentor/courses/create"
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Course
              </Link>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Courses</p>
                    <p className="text-2xl font-bold text-black">{totalCourses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Students</p>
                    <p className="text-2xl font-bold text-black">{totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Published</p>
                    <p className="text-2xl font-bold text-black">{publishedCourses}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses List */}
            {courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Course Thumbnail */}
                    <div className="relative h-40">
                      <Image
                        src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400'}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.is_published
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white'
                          }`}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${course.course_type === 'free'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {course.course_type === 'free' ? 'Free' : `$${course.price}`}
                        </span>
                        <span className="text-xs text-slate-500">{course.level}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description || 'No description'}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolled_count || 0} students
                        </span>
                        <span>{course.duration_hours}h</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/mentor/courses/${course.id}/edit`}
                          className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/mentor/courses/${course.id}`}
                          className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No Courses Yet</h3>
                <p className="text-slate-600 mb-6">
                  Create your first course and start teaching students
                </p>
                <Link
                  href="/dashboard/mentor/courses/create"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Course
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}
