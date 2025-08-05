'use client';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectType = searchParams.get('type') || 'image_target';
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !file) {
      setError('Project name and target file are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      // Upload target file
      const targetFileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ar-assets')
        .upload(targetFileName, file);
      if (uploadError) {
        setError('Failed to upload target file: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const targetUrl = supabase.storage.from('ar-assets').getPublicUrl(targetFileName).data.publicUrl;

      // Upload video file (if provided)
      let mediaUrl: string | undefined;
      if (videoFile) {
        const videoFileName = `${user.id}/${Date.now()}-${videoFile.name}`;
        const { error: videoUploadError } = await supabase.storage
          .from('ar-assets')
          .upload(videoFileName, videoFile);
        if (videoUploadError) {
          setError('Failed to upload video file: ' + videoUploadError.message);
          setLoading(false);
          return;
        }
        mediaUrl = supabase.storage.from('ar-assets').getPublicUrl(videoFileName).data.publicUrl;
      }

      // Insert into ar_assets
      const { error: insertError } = await supabase.from('ar_assets').insert({
        user_id: user.id,
        project_name: projectName,
        description,
        target_path: targetUrl,
        media_path: mediaUrl,
        project_type: projectType as 'image_target' | 'object_tracking' | 'object_placement',
      });
      if (insertError) {
        setError('Failed to create project: ' + insertError.message);
        setLoading(false);
        return;
      }

      // Log uploads
      await supabase.from('storage_upload_logs').insert({
        user_id: user.id,
        file_path: targetFileName,
      });
      if (videoFile) {
        await supabase.from('storage_upload_logs').insert({
          user_id: user.id,
          file_path: videoFile,
        });
      }

      router.push('/');
    } catch (err) {
      setError('Unexpected error: ' + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <div
        className={`flex-1 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        } p-6 bg-gray-100 transition-all duration-300`}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Project</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">
              Project Type
            </label>
            <input
              id="projectType"
              type="text"
              value={projectType.replace('_', ' ').toWellFormed()}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Target File
            </label>
            <input
              id="file"
              type="file"
              accept="image/*,.glb"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:hover:bg-indigo-100"
              required
            />
          </div>
          <div>
            <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700">
              Video File (Optional)
            </label>
            <input
              id="videoFile"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:hover:bg-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}