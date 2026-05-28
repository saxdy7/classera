'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  Github,
  Filter,
  ArrowRight,
  Star,
  User,
  Calendar,
} from 'lucide-react';

interface DiscoveryProject {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  github_repo_url: string;
  live_url: string;
  status: string;
  created_by: string;
  creator?: {
    full_name: string;
    avatar_url: string;
  };
  project_evaluations?: {
    overall_rating: number;
  }[];
  created_at: string;
}

export function ProjectDiscoveryClient() {
  const [projects, setProjects] = useState<DiscoveryProject[]>([]);
  const [filtered, setFiltered] = useState<DiscoveryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [techOptions, setTechOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/discover');
      const data = await response.json();
      setProjects(data);
      setFiltered(data);

      // Extract unique tech stacks
      const techs = new Set<string>();
      data.forEach((p: DiscoveryProject) => {
        if (p.tech_stack) {
          p.tech_stack.split(',').forEach((t) => techs.add(t.trim()));
        }
      });
      setTechOptions(Array.from(techs).sort());
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = projects;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tech
    if (selectedTech) {
      result = result.filter((p) =>
        p.tech_stack?.toLowerCase().includes(selectedTech.toLowerCase())
      );
    }

    setFiltered(result);
  }, [searchTerm, selectedTech, projects]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Discovery</h1>
        <p className="text-slate-600">
          Explore projects from fellow students. Get inspired and learn from their work.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tech Stack Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-slate-600" />
              <label className="font-medium text-slate-700">Filter by Tech Stack</label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTech(null)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedTech === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {techOptions.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedTech === tech
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-slate-600">No projects found matching your filters</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group">
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {project.title}
                  </h3>
                  {project.project_evaluations?.[0]?.overall_rating && (
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-amber-700">
                        {Math.round(project.project_evaluations[0].overall_rating / 20)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Creator */}
                {project.creator && (
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
                    {project.creator.avatar_url && (
                      <img
                        src={project.creator.avatar_url}
                        alt={project.creator.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {project.creator.full_name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech Stack */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack?.split(',').map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  {project.github_repo_url && (
                    <a
                      href={project.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm font-medium text-slate-700"
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
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm font-medium text-white"
                    >
                      <ExternalLink size={16} />
                      Live
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
