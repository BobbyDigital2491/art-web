/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { HiX, HiShare, HiQrcode } from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';

interface Project {
  id: string;
  project_name: string;
  description: string | null;
  target_path: string | null;
}

interface DashboardClientProps {
  initialProjects: Project[];
  user: any;
}

export default function DashboardClient({ initialProjects, user }: DashboardClientProps) {
  const [projects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onToggle={function (collapsed: boolean): void {
              throw new Error('Function not implemented.');
          } } />
      <div className="flex-1 ml-60">
        <div className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <div className="flex items-center gap-4">
            <Image
              src="/default-avatar.png"
              alt="User"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-medium">{user.email}</span>
          </div>
        </div>

        <div className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-gray-600 mb-4">No projects yet</p>
              <Link href="/create" className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition">
                Create Your First AR Experience
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    <Image
                      src={project.target_path || '/fallback-image.png'}
                      alt={project.project_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{project.project_name}</h3>
                    <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedProject.project_name}</h2>
              <button onClick={() => setSelectedProject(null)}>
                <HiX className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Link href={`/projects/${selectedProject.id}/edit`} className="bg-gray-700 text-white text-center py-3 rounded hover:bg-gray-800">
                Edit Details
              </Link>
              <Link href={`/projects/${selectedProject.id}/scene`} className="bg-blue-600 text-white text-center py-3 rounded hover:bg-blue-700">
                Open Editor
              </Link>
              <button onClick={() => setShowQRModal(true)} className="bg-green-600 text-white py-3 rounded hover:bg-green-700">
                <HiShare className="inline mr-2" /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <QRCodeSVG value={`https://art-web.vercel.app/p/${selectedProject.id}`} size={256} />
            <p className="mt-4 text-sm text-gray-600">Scan to view in AR</p>
            <button onClick={() => setShowQRModal(false)} className="mt-4 text-red-600 font-medium">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}