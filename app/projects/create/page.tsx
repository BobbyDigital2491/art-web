/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function CreateProject() {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [targetImageUrl, setTargetImageUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'file' | 'url'>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      let targetPath = '';
      let mediaPath = '';

      // Upload target image
      if (targetImage) {
        const fileExt = targetImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-target.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('ar-assets')
          .upload(fileName, targetImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ar-assets')
          .getPublicUrl(fileName);
        targetPath = urlData.publicUrl;
      } else if (targetImageUrl) {
        targetPath = targetImageUrl;
      }

      // Upload or use media
      if (mediaType === 'file' && mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-media.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('ar-assets')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ar-assets')
          .getPublicUrl(fileName);
        mediaPath = urlData.publicUrl;
      } else if (mediaType === 'url' && mediaUrl) {
        mediaPath = mediaUrl;
      }

      const { error: dbError } = await supabase
        .from('ar_assets')
        .insert({
          user_id: user.id,
          project_name: projectName,
          description,
          target_path: targetPath,
          media_path: mediaPath || null,
          status: 'draft',
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Create New AR Project</h1>
            <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
              ← Back to Dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-purple-600 transition text-lg"
                placeholder="My Amazing AR Experience"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-purple-600 transition text-lg"
                placeholder="What will people see in AR?"
              />
            </div>

            {/* Target Image */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Target Image (required)
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTargetImage(e.target.files?.[0] || null)}
                  className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
                <div className="text-center text-gray-500">OR</div>
                <input
                  type="url"
                  value={targetImageUrl}
                  onChange={(e) => setTargetImageUrl(e.target.value)}
                  placeholder="https://example.com/target.jpg"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-purple-600 transition text-lg"
                />
              </div>
            </div>

            {/* Media Content */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                3D Model or Video (optional)
              </label>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setMediaType('file')}
                  className={`px-6 py-3 rounded-xl font-medium transition ${mediaType === 'file' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('url')}
                  className={`px-6 py-3 rounded-xl font-medium transition ${mediaType === 'url' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Use URL
                </button>
              </div>

              {mediaType === 'file' ? (
                <input
                  type="file"
                  accept=".glb,.gltf,.mp4,.webm"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              ) : (
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/model.glb"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-purple-600 transition text-lg"
                />
              )}
            </div>

            <div className="flex justify-center gap-6">
              <Link
                href="/"
                className="px-12 py-5 bg-gray-500 text-white rounded-2xl font-bold text-xl hover:bg-gray-600 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-xl transition transform hover:scale-105 shadow-2xl disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>

            {error && (
              <div className="mt-8 bg-red-100 text-red-800 px-8 py-4 rounded-2xl text-center font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-8 bg-green-100 text-green-800 px-8 py-4 rounded-2xl text-center font-medium">
                Project created! Redirecting...
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}