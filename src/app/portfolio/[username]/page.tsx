import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { ExternalLink, Github, Globe, Mail, Award, Code2, Star } from 'lucide-react';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Get user by username/email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .or(`email.ilike.${username}%,full_name.ilike.${username}%`)
    .single();

  if (userError || !user) {
    notFound();
  }

  // Get user's portfolio projects
  const { data: projects } = await supabase
    .from('project_assignments')
    .select(`
      id,
      title,
      description,
      tech_stack,
      github_repo_url,
      live_url,
      status,
      created_at,
      project_evaluations(*)
    `)
    .eq('created_by', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  // Get user's achievements
  const { data: achievements } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', user.id);

  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-lg p-12 mb-12">
          <div className="flex items-start justify-between gap-8 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                {user.full_name}
              </h1>
              <p className="text-lg text-slate-600 mb-4">
                {user.email}
              </p>
              <p className="text-slate-600 max-w-2xl">
                {user.bio || 'Software developer passionate about building innovative solutions'}
              </p>
            </div>
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-32 h-32 rounded-lg object-cover shadow-lg"
              />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalProjects}</div>
              <p className="text-sm text-slate-600 mt-1">Total Projects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{completedProjects}</div>
              <p className="text-sm text-slate-600 mt-1">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{achievements?.length || 0}</div>
              <p className="text-sm text-slate-600 mt-1">Achievements</p>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Featured Projects</h2>

          {projects && projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {project.tech_stack && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 font-medium mb-2">Tech Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.split(',').map((tech: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {project.project_evaluations && project.project_evaluations.length > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i <=
                              Math.round(project.project_evaluations[0].overall_rating / 20)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600">
                        {Math.round(project.project_evaluations[0].overall_rating)}%
                      </span>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-3">
                    {project.github_repo_url && (
                      <a
                        href={project.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition text-sm font-medium"
                      >
                        <Github size={16} />
                        Code
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                      >
                        <ExternalLink size={16} />
                        Live
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Code2 size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No completed projects yet</p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Interested in collaborating?</h3>
          <p className="mb-4 text-blue-100">
            Reach out to discuss opportunities or learn more about these projects
          </p>
          <a
            href={`mailto:${user.email}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            <Mail size={20} />
            Contact {user.full_name}
          </a>
        </div>
      </div>
    </div>
  );
}
