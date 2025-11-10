/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import ProjectModal from '@/components/ProjectModal';
import { HiEye, HiQrcode, HiDocumentText } from 'react-icons/hi';
import { Project } from '@/types';
import { supabase } from './lib/supabase/client';

interface DashboardClientProps {
  initialProjects: Project[];
  user: any;
}

export default function DashboardClient({ initialProjects, user }: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time updates from Supabase
  useEffect(() => {
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ar_assets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.id) {
            setProjects(prev => prev.map(p => 
              p.id === payload.new.id 
                ? { ...p, status: payload.new.status, views: payload.new.views, scans: payload.new.scans } 
                : p
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handlePublishToggle = async (projectId: string, published: boolean) => {
    setIsLoading(true);
    const newStatus = published ? 'published' : 'draft';

    const { error } = await supabase
      .from('ar_assets')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      alert('Failed to update status: ' + error.message);
    }
    setIsLoading(false);
  };

  const totalProjects = projects.length;
  const totalViews = projects.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalScans = projects.reduce((sum, p) => sum + (p.scans || 0), 0);
  const publishedCount = projects.filter(p => p.status === 'published').length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Sidebar onToggle={setSidebarCollapsed} />
      
      <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-300 p-8`}>
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Image
                src={user.profile_picture || '/default-avatar.png'}
                alt="Profile"
                width={120}
                height={120}
                className="rounded-full ring-8 ring-purple-100 shadow-2xl"
                unoptimized
              />
              <div className="text-center md:text-left">
                <h1 className="text-5xl font-bold text-gray-900">
                  Welcome back, {user.display_name || user.email.split('@')[0]}!
                </h1>
                <p className="text-2xl text-gray-600 mt-3">
                  {publishedCount} published • {totalProjects - publishedCount} in draft
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="bg-white rounded-3xl shadow-2xl p-10 hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xl">Total Projects</p>
                  <p className="text-6xl font-bold text-purple-600 mt-4">{totalProjects}</p>
                </div>
                <HiDocumentText className="h-20 w-20 text-purple-400" />
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-10 hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xl">Published</p>
                  <p className="text-6xl font-bold text-green-600 mt-4">{publishedCount}</p>
                </div>
                
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-10 hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xl">Total Views</p>
                  <p className="text-6xl font-bold text-blue-600 mt-4">{totalViews.toLocaleString()}</p>
                </div>
                <HiEye className="h-20 w-20 text-blue-400" />
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-10 hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xl">Total Scans</p>
                  <p className="text-6xl font-bold text-green-600 mt-4">{totalScans.toLocaleString()}</p>
                </div>
                <HiQrcode className="h-20 w-20 text-green-400" />
              </div>
            </div>
          </div>

          {/* Projects */}
          {projects.length === 0 ? (
            <div className="text-center py-40 bg-white rounded-3xl shadow-2xl">
              <p className="text-5xl font-bold text-gray-700 mb-10">No projects yet</p>
              <Link
                href="/create"
                className="inline-block px-16 py-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-3xl rounded-full hover:shadow-3xl transition transform hover:scale-110"
              >
                Create Your First AR Masterpiece
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Your AR Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={project.target_path || '/fallback-ar.png'}
                        alt={project.project_name || 'Untitled'}
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
                        <p className="text-3xl font-bold">{project.project_name}</p>
                        <p className="text-lg mt-2">Click to manage</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onPublishToggle={handlePublishToggle}
          />
        )}
      </div>
    </div>
  );
}