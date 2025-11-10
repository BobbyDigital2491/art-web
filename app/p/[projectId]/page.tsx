/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { HiArrowLeft, HiLink, HiQrcode, HiX } from 'react-icons/hi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function PublicARScene() {
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const publicUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('ar_assets')
        .select('project_name, target_path, media_path')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        setProject(null);
      } else {
        setProject(data);
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center">
        <div className="text-2xl text-gray-700">Loading AR Experience...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Project Not Found</h1>
          <p className="text-gray-600">This AR experience may have been deleted or is private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{project.project_name}</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                alert('Link copied!');
              }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
            >
              <HiLink className="h-5 w-5" />
              Copy Link
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
            >
              <HiQrcode className="h-5 w-5" />
              QR Code
            </button>
          </div>
        </div>
      </div>

      {/* AR View */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="aspect-video relative bg-gray-900">
            {/* Replace with your actual AR viewer */}
            <iframe
              src={`/projects/${projectId}/scene?public=true`}
              className="w-full h-full border-0"
              allow="camera; gyroscope; accelerometer"
              title="AR Experience"
            />
          </div>
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Point your camera at the target image
            </h2>
            <div className="bg-gray-100 rounded-xl p-8 inline-block">
              <img
                src={project.target_path}
                alt="Target"
                className="max-w-xs mx-auto rounded-lg shadow-lg"
              />
            </div>
            <p className="text-gray-600 mt-6 text-lg">
              Hold your phone steady and move it around to see the 3D model appear!
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Scan to View</h3>
              <button onClick={() => setShowQR(false)} className="text-gray-500">
                <HiX className="h-6 w-6" />
              </button>
            </div>
            <div className="bg-white p-8 rounded-xl border-8 border-gray-200">
              <QRCodeSVG value={publicUrl} size={256} level="H" />
            </div>
            <p className="text-center text-gray-600 mt-4 text-sm">
              Scan with any phone camera
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicARPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center"><div className="text-2xl">Loading...</div></div>}>
      <PublicARScene />
    </Suspense>
  );
}