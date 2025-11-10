/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { HiX, HiTrash, HiExternalLink, HiChevronDown, HiPencil, HiEye, HiShare, HiQrcode, HiLink } from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';
import type { Project } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, detectSessionInUrl: false } }
);

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<{ display_name: string; profile_picture: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    storageUsed: '—',
    lastUpload: '—'
  });
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Refresh session on mount
  useEffect(() => {
    const refreshSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await supabase.auth.refreshSession();
    };
    refreshSession();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push(`/login?next=${encodeURIComponent('/')}`);
        return;
      }

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, profile_picture')
        .eq('id', user.id)
        .single();

      setUserData({
        display_name: profileData?.display_name || user.email?.split('@')[0] || 'User',
        profile_picture: profileData?.profile_picture || '/default-avatar.png',
      });

      // Projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('ar_assets')
        .select('id, project_name, description, target_path, media_path, updated_at, project_type')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;

      const total = projectsData?.length || 0;
      const latest = projectsData?.[0]?.updated_at
        ? new Date(projectsData[0].updated_at).toLocaleDateString()
        : '—';

      setProjects(projectsData || []);
      setStats({
        totalProjects: total,
        storageUsed: '—', // You can add storage API later
        lastUpload: latest
      });

    } catch (err: any) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router, searchParams]);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('ar_assets')
        .delete()
        .eq('id', projectToDelete.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      if (projectToDelete.target_path) {
        const targetFile = projectToDelete.target_path.split('/ar-assets/')[1];
        if (targetFile) await supabase.storage.from('ar-assets').remove([targetFile]);
      }
      if (projectToDelete.media_path) {
        const mediaFile = projectToDelete.media_path.split('/ar-assets/')[1];
        if (mediaFile) await supabase.storage.from('ar-assets').remove([mediaFile]);
      }

      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      setError('Failed to delete project: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Loading your projects...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar onToggle={setSidebarCollapsed} />

      <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-300`}>
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">My Projects</h1>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300">
                  <Image
                    src={userData?.profile_picture || '/default-avatar.png'}
                    alt={userData?.display_name || 'User'}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium text-gray-700 hidden sm:block">
                  {userData?.display_name}
                </span>
                <HiChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 bg-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Total Projects</h3>
              <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.totalProjects}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Storage Used</h3>
              <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.storageUsed}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Last Upload</h3>
              <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.lastUpload}</p>
            </div>
          </div>

          {/* Projects Grid */}
          {error && <p className="text-red-600 mb-4 bg-red-50 p-4 rounded-lg">{error}</p>}

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete(project);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete project"
                  >
                    <HiTrash className="h-5 w-5" />
                  </button>

                  <div className="aspect-video relative bg-gray-200">
                    <Image
                      src={project.target_path || '/fallback-image.png'}
                      alt={project.project_name}
                      fill
                      className="object-cover rounded-t-lg"
                      unoptimized={project.target_path?.includes('supabase.co')}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {project.project_name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg">
              <p className="text-gray-600 text-lg mb-6">No projects yet.</p>
              <p className="text-gray-500 mb-8">Create your first AR experience from the sidebar</p>
            </div>
          )}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedProject.project_name}
                  </h2>
                  <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-gray-700">
                    <HiX className="h-6 w-6" />
                  </button>
                </div>
                <div className="aspect-video relative bg-gray-200 rounded-lg overflow-hidden mb-6">
                  <Image
                    src={selectedProject.target_path || '/fallback-image.png'}
                    alt={selectedProject.project_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-gray-700 mb-6">{selectedProject.description || 'No description'}</p>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <Link
                    href={`/projects/${selectedProject.id}/edit`}
                    className="bg-gray-700 text-white text-center py-3 rounded-md hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2"
                  >
                    <HiPencil className="h-4 w-4" />
                    Edit Details
                  </Link>
                  <Link
                    href={`/projects/${selectedProject.id}/scene`}
                    className="bg-blue-600 text-white text-center py-3 rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <HiEye className="h-4 w-4" />
                    View in Editor
                  </Link>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="bg-green-600 text-white text-center py-3 rounded-md hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <HiShare className="h-4 w-4" />
                    Publish & Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code + Link Modal */}
        {showQRModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Share AR Experience</h3>
                <button onClick={() => setShowQRModal(false)} className="text-gray-500 hover:text-gray-700">
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border-4 border-gray-200 mb-6">
                <QRCodeSVG
                  value={`${window.location.origin}/p/${selectedProject.id}`}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${selectedProject.id}`);
                    alert('Link copied!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-3 rounded-lg transition"
                >
                  <HiLink className="h-5 w-5" />
                  Copy Link
                </button>
                <Link
                  href={`/p/${selectedProject.id}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition"
                >
                  <HiExternalLink className="h-5 w-5" />
                  Open
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Project?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{projectToDelete.project_name}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setProjectToDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}