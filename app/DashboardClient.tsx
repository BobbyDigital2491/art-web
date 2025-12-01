/* eslint-disable react-hooks/exhaustive-deps */
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
}

export default function DashboardClient({ initialProjects }: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Fetch user + profile from profiles table
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, profile_picture, bio')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    fetchUserAndProfile();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

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
  }, [user?.id]);

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

  // FIXED: Use profile from profiles table
  const displayName = profile?.display_name || user?.email?.split('@')[0] || '';
  const profilePic = profile?.profile_picture || '/default-avatar.png';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Sidebar onToggle={setSidebarCollapsed} />
      
      <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-300 flex flex-col`}>
        {/* Top Bar with Profile */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome back <span className="text-yellow-400">{displayName}</span>
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                {publishedCount} published • {totalProjects - publishedCount} in draft
              </p>
            </div>
            
            {/* Profile Picture - Top Right */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{displayName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link href="/profile">
              <div className="relative">
                
                <Image
                  src={profilePic}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="rounded-full ring-4 ring-yellow-200 shadow-xl hover:ring-yellow-400 transition"
                  unoptimized
                />
                {user && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white"></div>
                )}
                
              </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">

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
                  <div className="bg-green-100 p-6 rounded-full">
                    <svg className="h-12 w-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
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
        </main>

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