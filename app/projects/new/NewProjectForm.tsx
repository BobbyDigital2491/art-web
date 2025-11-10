'use client';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, detectSessionInUrl: false } }
);

export default function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [projectType, setProjectType] = useState('image_target');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Check authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('NewProjectForm: No user, redirecting to /login');
        router.push(`/login?next=/projects/new${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
        setLoading(false);
        return;
      }

      if (!projectName.trim()) {
        setError('Project name is required');
        setLoading(false);
        return;
      }

      if (!targetFile) {
        setError('Target image is required');
        setLoading(false);
        return;
      }

      // Validate target file
      if (!targetFile.type.startsWith('image/')) {
        setError('Target file must be an image (PNG, JPG, etc.)');
        setLoading(false);
        return;
      }
      if (targetFile.size > 5 * 1024 * 1024) {
        setError('Target image must be smaller than 5MB');
        setLoading(false);
        return;
      }

      // Validate media file if provided
      if (mediaFile) {
        if (!mediaFile.type.startsWith('video/') && !mediaFile.type.startsWith('image/')) {
          setError('Media file must be a video or image');
          setLoading(false);
          return;
        }
        if (mediaFile.size > 50 * 1024 * 1024) {
          setError('Media file must be smaller than 50MB');
          setLoading(false);
          return;
        }
      }

      const projectId = uuidv4();
      console.log('NewProjectForm: Generated projectId:', projectId);
      const targetFileExt = targetFile.name.split('.').pop();
      const targetFileName = `${user.id}/${projectId}/target.${targetFileExt}`;
      console.log('NewProjectForm: targetFileName:', targetFileName);

      // Upload target file
      const { error: targetUploadError } = await supabase.storage
        .from('ar-assets')
        .upload(targetFileName, targetFile, {
          contentType: targetFile.type,
        });
      if (targetUploadError) {
        console.error('NewProjectForm: Target upload error:', targetUploadError.message);
        setError('Failed to upload target image: ' + targetUploadError.message);
        setLoading(false);
        return;
      }

      // Get public URL for target file
      const { data: targetUrlData } = supabase.storage
        .from('ar-assets')
        .getPublicUrl(targetFileName);
      if (!targetUrlData.publicUrl) {
        console.error('NewProjectForm: Failed to get target public URL');
        setError('Failed to generate target image URL');
        setLoading(false);
        return;
      }
      const targetPath = targetUrlData.publicUrl;
      console.log('NewProjectForm: targetPath:', targetPath);

      let mediaPath: string | undefined;
      if (mediaFile) {
        const mediaFileExt = mediaFile.name.split('.').pop();
        const mediaFileName = `${user.id}/${projectId}/media.${mediaFileExt}`;
        const { error: mediaUploadError } = await supabase.storage
          .from('ar-assets')
          .upload(mediaFileName, mediaFile, {
            contentType: mediaFile.type,
          });
        if (mediaUploadError) {
          console.error('NewProjectForm: Media upload error:', mediaUploadError.message);
          setError('Failed to upload media file: ' + mediaUploadError.message);
          setLoading(false);
          return;
        }
        const { data: mediaUrlData } = supabase.storage
          .from('ar-assets')
          .getPublicUrl(mediaFileName);
        if (!mediaUrlData.publicUrl) {
          console.error('NewProjectForm: Failed to get media public URL');
          setError('Failed to generate media file URL');
          setLoading(false);
          return;
        }
        mediaPath = mediaUrlData.publicUrl;
        console.log('NewProjectForm: mediaPath:', mediaPath);
      }

      // Insert project into ar_assets
      const projectData = {
        id: projectId,
        user_id: user.id,
        project_name: projectName.trim(),
        description: description.trim() || 'No description',
        target_path: targetPath,
        media_path: mediaPath,
        project_type: projectType,
        updated_at: new Date().toISOString(),
      };
      console.log('NewProjectForm: Inserting project:', JSON.stringify(projectData, null, 2));
      const { error: insertError } = await supabase
        .from('ar_assets')
        .insert(projectData);
      if (insertError) {
        console.error('NewProjectForm: Insert error:', insertError.message, insertError.details, insertError.hint);
        setError('Failed to save project: ' + insertError.message);
        setLoading(false);
        return;
      }

      console.log('NewProjectForm: Project inserted successfully:', { projectId, targetPath, mediaPath });
      setSuccess('Project created successfully!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('NewProjectForm: Unexpected error:', err);
      setError('Unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New Project</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700 transition"
              placeholder="Enter project name"
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
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700 transition"
              placeholder="Describe your project"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="project-type" className="block text-sm font-medium text-gray-700">
              Project Type
            </label>
            <select
              id="project-type"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700 transition"
            >
              <option value="image_target">Image Target</option>
              <option value="world_tracking">World Tracking</option>
              <option value="face_tracking">Face Tracking</option>
            </select>
          </div>
          <div>
            <label htmlFor="target-file" className="block text-sm font-medium text-gray-700">
              Target Image
            </label>
            <input
              id="target-file"
              type="file"
              accept="image/*"
              onChange={(e) => setTargetFile(e.target.files?.[0] || null)}
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="media-file" className="block text-sm font-medium text-gray-700">
              Media File (Optional)
            </label>
            <input
              id="media-file"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700 transition"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg bg-yellow-700 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
      </div>
    </div>
  );
}