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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8 cl-main">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-semibold text-black mb-2">My Courses</h2>
                <p className="text-[var(--cl-body)]">Create and manage your courses</p>
              </div>
              <Link
                href="/dashboard/mentor/courses/create"
                className="px-6 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium hover:opacity-90 transition-opacity flex items-center gap-2 bg-[var(--cl-primary)]"
              >
                <Plus className="w-5 h-5" />
                Create Course
              </Link>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--cl-primary-soft)] rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[var(--cl-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Total Courses</p>
                    <p className="text-2xl font-semibold text-black">{totalCourses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[rgba(13,116,206,0.12)] rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-[var(--cl-info)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Total Students</p>
                    <p className="text-2xl font-semibold text-black">{totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[rgba(22,163,74,0.12)] rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-[var(--cl-success)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Published</p>
                    <p className="text-2xl font-semibold text-black">{publishedCourses}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses List */}
            {courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] overflow-hidden transition-shadow">
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
                            ? 'bg-[var(--cl-success)] text-[var(--cl-on-dark)]'
                            : 'bg-[var(--cl-warning)] text-[var(--cl-on-dark)]'
                          }`}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${course.course_type === 'free'
                            ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]'
                            : 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]'
                          }`}>
                          {course.course_type === 'free' ? 'Free' : `$${course.price}`}
                        </span>
                        <span className="text-xs text-[var(--cl-muted)]">{course.level}</span>
                      </div>

                      <h3 className="font-semibold text-[var(--cl-ink)] mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-[var(--cl-body)] mb-4 line-clamp-2">{course.description || 'No description'}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-[var(--cl-muted)] mb-4">
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
                          className="flex-1 py-2 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg font-medium hover:bg-[var(--cl-surface-strong)] transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/mentor/courses/${course.id}`}
                          className="flex-1 py-2 text-[var(--cl-on-dark)] rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 bg-[var(--cl-primary)]"
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
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-12 border border-[var(--cl-hairline)] text-center">
                <div className="w-20 h-20 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-[var(--cl-muted-soft)]" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">No Courses Yet</h3>
                <p className="text-[var(--cl-body)] mb-6">
                  Create your first course and start teaching students
                </p>
                <Link
                  href="/dashboard/mentor/courses/create"
                  className="px-6 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2 bg-[var(--cl-primary)]"
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
