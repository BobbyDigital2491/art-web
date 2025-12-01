/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';
import { HiX } from 'react-icons/hi';
import { supabase } from '../lib/supabase/client';

interface Project {
  id: string;
  project_name: string;
  description: string;
  target_path: string;
  media_path?: string;
  updated_at: string;
  project_type?: string;
  status?: string;
  views?: number;     // ← Added these two lines only
  scans?: number;     // ← to match ProjectModal expectations
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
          setError('Authentication failed — please log in again');
          setLoading(false);
          return;
        }

        // Fetch all columns safely
        const { data: projectsData, error: projectsError } = await supabase
          .from('ar_assets')
          .select('id, project_name, description, target_path, media_path, updated_at, project_type')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (projectsError) {
          console.error('Supabase error:', projectsError);
          setError('Failed to load projects');
          setProjects([]);
        } else if (projectsData && projectsData.length > 0) {
          const validProjects: Project[] = projectsData.map((p: any) => ({
            id: p.id,
            project_name: p.project_name || 'Untitled Project',
            description: p.description || 'No description',
            target_path: p.target_path || '/fallback-ar.png',
            media_path: p.media_path,
            updated_at: p.updated_at || new Date().toISOString(),
            project_type: p.project_type,
            status: p.status || 'draft',
            views: Number(p.views) || 0,   // ← safe defaults
            scans: Number(p.scans) || 0,   // ← safe defaults
          }));
          setProjects(validProjects);
        } else {
          setProjects([]);
          setError(null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-300 p-8`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">All Projects</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-600 mb-6">No projects yet</p>
              <Link
                href="/create"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-full hover:shadow-2xl transition"
              >
                Create Your First AR Experience
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={project.target_path}
                      alt={project.project_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition">
                      <p className="text-sm font-medium">Click to view</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 truncate">{project.project_name}</h3>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{project.description}</p>
                    {project.project_type && (
                      <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        {project.project_type.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-in">
              <div className="relative">
                <Image
                  src={selectedProject.target_path}
                  alt={selectedProject.project_name}
                  width={800}
                  height={400}
                  className="w-full object-cover"
                  unoptimized
                />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white transition"
                >
                  <HiX className="h-6 w-6 text-gray-800" />
                </button>
              </div>
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedProject.project_name}</h2>
                <p className="text-gray-600 mb-6">{selectedProject.description}</p>
                
                {selectedProject.project_type && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600">Type:</span>{' '}
                    <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {selectedProject.project_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}

                {selectedProject.media_path && (
                  <div className="mb-6">
                    <a
                      href={selectedProject.media_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View Video
                    </a>
                  </div>
                )}

                <div className="flex gap-4">
                  <Link
                    href={`/projects/${selectedProject.id}/edit`}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-4 rounded-xl font-bold hover:shadow-lg transition"
                  >
                    Edit Project
                  </Link>
                  <Link
                    href={`/projects/${selectedProject.id}/scene`}
                    className="flex-1 bg-green-600 text-white text-center py-4 rounded-xl font-bold hover:bg-green-700 transition"
                  >
                    Open AR Scene
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-fade-in { animation: fadeIn 0.3s ease-out; }
          .animate-scale-in { animation: scaleIn 0.3s ease-out; }
        `}</style>
      </div>
    </div>
  );
}