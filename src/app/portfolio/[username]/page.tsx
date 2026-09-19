import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { ExternalLink, Github, Mail, Code2, Star } from 'lucide-react';

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

  // Get the student's graded projects that they've opted to feature.
  // Note: goes through assignment_students -> project_assignments (the real,
  // live schema) rather than project_assignments.created_by/status/tech_stack,
  // which don't exist on that table (a stale-schema bug found and fixed
  // elsewhere in this feature - see PROJECTS_FEATURE_HANDOFF.md).
  const { data: featuredEvaluations } = await supabase
    .from('project_evaluations')
    .select('assignment_id, submission_id, score, feedback')
    .eq('student_id', user.id)
    .eq('featured_on_portfolio', true)
    .order('evaluated_at', { ascending: false });

  const assignmentIds = (featuredEvaluations ?? []).map((e) => e.assignment_id);
  const submissionIds = (featuredEvaluations ?? []).map((e) => e.submission_id);

  const { data: featuredAssignments } = assignmentIds.length
    ? await supabase
        .from('project_assignments')
        .select('id, title, description, technologies, max_score')
        .in('id', assignmentIds)
    : { data: [] };

  const { data: featuredSubmissions } = submissionIds.length
    ? await supabase
        .from('assignment_submissions')
        .select('id, repo_url, repo_full_name, deploy_url, submission_url')
        .in('id', submissionIds)
    : { data: [] };

  const assignmentMap = new Map((featuredAssignments ?? []).map((a) => [a.id, a]));
  const submissionMap = new Map((featuredSubmissions ?? []).map((s) => [s.id, s]));

  const projects = (featuredEvaluations ?? [])
    .map((e) => {
      const assignment = assignmentMap.get(e.assignment_id);
      if (!assignment) return null;
      return {
        ...assignment,
        score: e.score,
        max_score: assignment.max_score,
        feedback: e.feedback,
        submission: submissionMap.get(e.submission_id) ?? null,
      };
    })
    .filter(Boolean) as Array<{
      id: string; title: string; description: string | null; technologies: string[] | null; max_score: number;
      score: number | null; feedback: string | null;
      submission: { repo_url: string | null; repo_full_name: string | null; deploy_url: string | null; submission_url: string | null } | null;
    }>;

  // Get user's achievements
  const { data: achievements } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', user.id);

  const totalProjects = projects.length;
  const completedProjects = projects.length;

  return (
    <div className="min-h-screen bg-[var(--cl-canvas)]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-[var(--cl-surface-card)] rounded-lg p-12 mb-12">
          <div className="flex items-start justify-between gap-8 mb-8">
            <div>
              <h1 className="text-4xl font-semibold text-[var(--cl-ink)] mb-2">
                {user.full_name}
              </h1>
              <p className="text-lg text-[var(--cl-body)] mb-4">
                {user.email}
              </p>
              <p className="text-[var(--cl-body)] max-w-2xl">
                {user.bio || 'Software developer passionate about building innovative solutions'}
              </p>
            </div>
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-32 h-32 rounded-lg object-cover"
              />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-[var(--cl-hairline)]">
            <div className="text-center">
              <div className="text-3xl font-semibold text-[var(--cl-info)]">{totalProjects}</div>
              <p className="text-sm text-[var(--cl-body)] mt-1">Total Projects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-[var(--cl-success)]">{completedProjects}</div>
              <p className="text-sm text-[var(--cl-body)] mt-1">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-[var(--cl-warning)]">{achievements?.length || 0}</div>
              <p className="text-sm text-[var(--cl-body)] mt-1">Achievements</p>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-[var(--cl-ink)] mb-6">Featured Projects</h2>

          {projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[var(--cl-surface-card)] rounded-lg transition p-6"
                >
                  <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[var(--cl-body)] mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-[var(--cl-muted)] font-medium mb-2">Tech Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="inline-block px-2.5 py-1 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] rounded text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score */}
                  {project.score !== null && (
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i <= Math.round((project.score! / project.max_score) * 5)
                                ? 'fill-[var(--cl-warning)] text-[var(--cl-warning)]'
                                : 'text-[var(--cl-muted-soft)]'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-[var(--cl-body)]">
                        {project.score}/{project.max_score}
                      </span>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-3">
                    {project.submission?.repo_url && (
                      <a
                        href={project.submission.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] rounded hover:bg-[var(--cl-surface-inverse)] transition text-sm font-medium"
                      >
                        <Github size={16} />
                        Code
                      </a>
                    )}
                    {project.submission?.deploy_url && (
                      <a
                        href={project.submission.deploy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--cl-info)] text-[var(--cl-on-dark)] rounded hover:bg-[var(--cl-info)] transition text-sm font-medium"
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
            <div className="bg-[var(--cl-surface-card)] rounded-lg p-12 text-center">
              <Code2 size={48} className="text-[var(--cl-muted-soft)] mx-auto mb-4" />
              <p className="text-[var(--cl-body)]">No completed projects yet</p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="rounded-lg p-8 text-[var(--cl-on-dark)] text-center bg-[var(--cl-info)]">
          <h3 className="text-2xl font-semibold mb-2">Interested in collaborating?</h3>
          <p className="mb-4 text-[var(--cl-info)]">
            Reach out to discuss opportunities or learn more about these projects
          </p>
          <a
            href={`mailto:${user.email}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--cl-surface-card)] text-[var(--cl-info)] font-semibold rounded-lg hover:bg-[rgba(13,116,206,0.12)] transition"
          >
            <Mail size={20} />
            Contact {user.full_name}
          </a>
        </div>
      </div>
    </div>
  );
}
