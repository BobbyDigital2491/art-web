/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiX, HiPencil, HiCube, HiCamera, HiQrcode, HiTrash, HiShare, HiGlobeAlt, HiCheckCircle } from 'react-icons/hi';
import { Project } from '@/types';
import { useState } from 'react';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onPublishToggle?: (projectId: string, published: boolean) => void;
}

export default function ProjectModal({ project, onClose, onPublishToggle }: ProjectModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const shareUrl = `https://art-emerged-web.netlify.app//p/${project.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareUrl)}`;
  const isPublished = project.status === 'published';

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate API call
    setTimeout(() => {
      onPublishToggle?.(project.id, !isPublished);
      setIsPublishing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-7xl w-full h-[92vh] shadow-3xl animate-scale-in grid grid-cols-1 lg:grid-cols-2 overflow-hidden relative">
        
        {/* X Button - Top Left */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-20 bg-white/90 hover:bg-white p-4 rounded-full shadow-2xl transition backdrop-blur-md"
          aria-label="Close"
        >
          <HiX className="h-8 w-8 text-gray-800" />
        </button>

        {/* LEFT: Image */}
        <div className="relative h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-8">
          <Image
            src={project.target_path || '/fallback-ar.png'}
            alt={project.project_name || 'Project'}
            fill
            className="object-contain drop-shadow-2xl"
            unoptimized
            priority
            sizes="50vw"
          />
          {isPublished && (
            <div className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
              <HiCheckCircle className="h-5 w-5" />
              LIVE
            </div>
          )}
        </div>

        {/* RIGHT: Scrollable Content */}
        <div className="p-8 lg:p-10 overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-white">
          <div className="max-w-lg mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {project.project_name || 'Untitled Project'}
            </h2>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {project.description || 'No description provided.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-center">
                <div className="text-4xl font-bold text-purple-700">{(project.views || 0).toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">Views</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-center">
                <div className="text-4xl font-bold text-green-700">{(project.scans || 0).toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">Scans</p>
              </div>
            </div>

            {/* Project Type */}
            {project.project_type && (
              <div className="text-center mb-10">
                <span className="inline-block px-8 py-4 bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 rounded-full text-lg font-bold shadow-lg">
                  {project.project_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 pb-8">
              {/* Publish / Unpublish Button */}
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className={`w-full flex items-center justify-center gap-4 py-6 rounded-3xl font-bold text-xl transition transform hover:scale-105 shadow-2xl ${
                  isPublished
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
                }`}
              >
                <HiGlobeAlt className="h-8 w-8" />
                {isPublishing ? 'Updating...' : isPublished ? 'Unpublish Project' : 'Publish Project'}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3D Editor */}
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="flex items-center justify-center gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-3xl font-bold text-xl hover:shadow-2xl transition transform hover:scale-105"
                >
                  <HiCube className="h-7 w-7" />
                  3D Editor
                </Link>

                {/* AR Camera */}
                <Link
                href={`/ar/${project.id}`}  // ← FIXED: was /projects/.../ar
                className="flex items-center justify-center gap-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-3xl font-bold text-xl hover:shadow-2xl transition transform hover:scale-105"
                >
                <HiCamera className="h-7 w-7" />
                Open AR Camera
                </Link>

                {/* Share */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="flex items-center justify-center gap-4 bg-blue-600 text-white py-5 rounded-3xl font-bold text-xl hover:bg-blue-700 transition transform hover:scale-105"
                >
                  <HiShare className="h-7 w-7" />
                  Share Link
                </button>

                {/* QR Code */}
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-4 bg-yellow-600 text-white py-5 rounded-3xl font-bold text-xl hover:bg-yellow-700 transition transform hover:scale-105"
                >
                  <HiQrcode className="h-7 w-7" />
                  View QR Code
                </a>
              </div>

              {/* Delete */}
              <div className="text-center pt-6">
                <button className="text-red-600 hover:text-red-700 font-bold text-lg flex items-center gap-3 mx-auto transition">
                  <HiTrash className="h-6 w-6" />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-scale-in { animation: scaleIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}