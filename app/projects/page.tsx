/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';
import ProjectModal from '@/components/ProjectModal';
import { supabase } from '../lib/supabase/client';

// Use the exact same Project type as everywhere else
import { Project } from '@/types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please log in to view your projects');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('ar_assets')
          .select('id, project_name, description, target_path, media_path, updated_at, project_type, status, views, scans')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          setError('Failed to load projects');
        } else if (data) {
          // Ensure views and scans are numbers (default 0 if null)
          const formattedProjects = data.map((p: any) => ({
            ...p,
            views: p.views || 0,
            scans: p.scans || 0,
          }));
          setProjects(formattedProjects);
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Sidebar onToggle={setSidebarCollapsed} />

      <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-300 p-8`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-12 text-center">Your AR Gallery</h1>

          {loading ? (
            <div className="flex justify-center py-32">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-yellow-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-2xl text-red-600 mb-6">{error}</p>
              <Link href="/login" className="text-indigo-600 hover:underline">Log in again</Link>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-3xl text-gray-600 mb-8">No projects yet</p>
              <Link
                href="/create"
                className="inline-block px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full hover:shadow-2xl transition"
              >
                Create Your First AR Experience
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={project.target_path}
                      alt={project.project_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {project.status === 'published' && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg animate-pulse">
                        LIVE
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    <div className="absolute bottom-8 left-8 text-white opacity-0 group-hover:opacity-100 transition">
                      <p className="text-2xl font-bold">{project.project_name}</p>
                      <p className="text-sm mt-1">Click to view</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAME MODAL AS DASHBOARD */}
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>
    </div>
  );
}