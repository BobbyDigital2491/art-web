/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { HiX } from 'react-icons/hi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  project_name: string;
  description: string;
  target_path: string;
  media_path?: string;
  updated_at: string;
  project_type?: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Authentication failed');
          setLoading(false);
          return;
        }

        // Check if project_type column exists
        const hasProjectType = await supabase
          .rpc('column_exists', { table_name: 'ar_assets', column_name: 'project_type' })
          .then(({ data }) => data);

        // Fetch all user projects
        const selectColumns = `id, project_name, description, target_path, media_path, updated_at${
          hasProjectType ? ', project_type' : ''
        }`;
        const { data: projectsData, error: projectsError } = await supabase
          .from('ar_assets')
          .select(selectColumns)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        console.log('ar_assets query:', selectColumns);
        console.log('ar_assets result:', projectsData, 'error:', projectsError);

        if (projectsError) {
          setError('Failed to fetch projects: ' + projectsError.message);
          setProjects([]);
        } else if (projectsData && projectsData.length > 0) {
          const validProjects: Project[] = projectsData
            .filter((p: any) => p.id && p.project_name)
            .map((p: any) => ({
              id: p.id,
              project_name: p.project_name,
              description: p.description || 'No description',
              target_path:
                p.target_path ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
              media_path: p.media_path,
              updated_at: p.updated_at || new Date().toISOString(),
              project_type: hasProjectType ? p.project_type : undefined,
            }));
          setProjects(validProjects);
        } else {
          setProjects([]);
          setError('No projects found');
        }
      } catch (err) {
        setError('Unexpected error: ' + (err as Error).message);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <div
        className={`flex-1 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        } p-6 bg-gray-100 transition-all duration-300`}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">All Projects</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow md:w-[calc(33.333%-1.5rem)]"
                  onClick={() => setSelectedProject(project)}
                >
                  <img
                    src={project.target_path}
                    alt={project.project_name}
                    className="w-full h-40 object-cover rounded-md mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-800">{project.project_name}</h3>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  {project.project_type && (
                    <p className="text-xs text-gray-500 mt-2">
                      Type: {project.project_type.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                  {project.media_path && (
                    <p className="text-xs text-gray-500 mt-2">
                      Video:{' '}
                      <a
                        href={project.media_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline"
                      >
                        View Video
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Updated:{' '}
                    {new Date(project.updated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true,
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No projects available. Create a project to get started!</p>
            )}
          </div>
        )}

        {/* Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{selectedProject.project_name}</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-full hover:bg-gray-200"
                >
                  <HiX className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <img
                src={selectedProject.target_path}
                alt={selectedProject.project_name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <p className="text-gray-600">{selectedProject.description}</p>
              {selectedProject.project_type && (
                <p className="text-xs text-gray-500 mt-2">
                  Type: {selectedProject.project_type.replace('_', ' ').toUpperCase()}
                </p>
              )}
              {selectedProject.media_path && (
                <p className="text-xs text-gray-500 mt-2">
                  Video:{' '}
                  <a
                    href={selectedProject.media_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-500 hover:underline"
                  >
                    View Video
                  </a>
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Updated:{' '}
                {new Date(selectedProject.updated_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                })}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/projects/${selectedProject.id}/edit`}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Edit
                </Link>
                <Link
                  href={`/projects/${selectedProject.id}/scene`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  View AR Scene
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for Modal Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}