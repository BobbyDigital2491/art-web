/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { HiX, HiShare, HiQrcode, HiEye, HiDownload, HiTrash } from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';

interface Project {
  id: string;
  project_name: string;
  description: string | null;
  target_path: string | null;
  created_at: string;
  views?: number;
  scans?: number;
}

interface DashboardClientProps {
  initialProjects: Project[];
  user: any;
}

export default function DashboardClient({ initialProjects, user }: DashboardClientProps) {
  const [projects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const totalProjects = projects.length;
  const totalViews = projects.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalScans = projects.reduce((acc, p) => acc + (p.scans || 0), 0);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Sidebar />
      
      {/*Header*/}
      <div className="flex-1 ml-64 p-8">
        <div className="bg-white rounded-2xl shadow-sm border px-8 py-6 flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My AR Gallery</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Image
              src="/default-avatar.png"
              alt="User"
              width={56}
              height={56}
              className="rounded-full ring-4 ring-purple-200"
            />
          </div>
        </div>
        {/* Stats Bento Grid */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Projects</p>
                <p className="text-4xl font-bold text-purple-600">{totalProjects}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <HiEye className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Views</p>
                <p className="text-4xl font-bold text-blue-600">{totalViews}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <HiEye className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Scans</p>
                <p className="text-4xl font-bold text-green-600">{totalScans}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <HiQrcode className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-3xl text-gray-500 mb-8">No projects yet</p>
              <Link href="/create" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition">
                Create Your First Masterpiece
              </Link>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={project.target_path || '/fallback-image.png'}
                    alt={project.project_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition">
                    <p className="text-sm">{project.views || 0} views • {project.scans || 0} scans</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-800">{project.project_name}</h3>
                  <p className="text-gray-600 text-sm mt-2">{project.description || 'No description'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold">{selectedProject.project_name}</h2>
              <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-gray-700">
                <HiX className="h-8 w-8" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-sm text-gray-600">Views</p>
                <p className="text-2xl font-bold">{selectedProject.views || 0}</p>
              </div>
              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-sm text-gray-600">Scans</p>
                <p className="text-2xl font-bold">{selectedProject.scans || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Link href={`/projects/${selectedProject.id}/edit`} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-4 rounded-xl font-bold hover:shadow-lg transition">
                Edit Project
              </Link>
              <Link href={`/projects/${selectedProject.id}/scene`} className="bg-blue-600 text-white text-center py-4 rounded-xl font-bold hover:bg-blue-700 transition">
                Open Editor
              </Link>
              <button onClick={() => setShowQRModal(true)} className="bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition">
                Share AR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
            <QRCodeSVG value={`https://art-web.vercel.app/p/${selectedProject.id}`} size={300} />
            <p className="mt-6 text-xl font-bold">Scan to view in AR</p>
            <p className="text-gray-600 mt-2">Point your phone camera at this code</p>
            <button onClick={() => setShowQRModal(false)} className="mt-8 text-red-600 font-bold text-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}