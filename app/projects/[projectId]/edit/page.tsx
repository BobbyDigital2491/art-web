/* eslint-disable @next/next/no-img-element */
'use client';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// TypeScript interface for project data
interface Project {
  id: string;
  project_name: string;
  description: string;
  width_cm: number | null;
  height_cm: number | null;
  target_path: string;
  media_path: string | null;
  status: string;
}

// TypeScript interface for profile data
interface Profile {
  display_name: string | null;
  profile_picture: string | null;
}

export default function EditProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  // Fetch project and profile data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('You must be logged in to edit a project.');
        router.push('/login');
        return;
      }

      // Fetch project
      const { data, error } = await supabase
        .from('ar_assets')
        .select('id, project_name, description, width_cm, height_cm, target_path, media_path, status')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        setError(`Failed to fetch project: ${error.message}`);
      } else if (data) {
        setProject(data);
        setProjectName(data.project_name);
        setDescription(data.description || '');
        setWidth(data.width_cm ? data.width_cm.toString() : '');
        setHeight(data.height_cm ? data.height_cm.toString() : '');
        setMediaUrl(data.media_path && data.media_path.startsWith('http') ? data.media_path : '');
        setUseUrl(data.media_path ? data.media_path.startsWith('http') : false);
      } else {
        setError('Project not found.');
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, profile_picture')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError.message);
      } else {
        setProfile(profileData || { display_name: null, profile_picture: null });
      }
    };

    fetchData();
  }, [projectId, router]);

  // Handle file upload validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'target' | 'media') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'target' && !file.type.startsWith('image/')) {
        setError('Target must be an image file (PNG, JPG, etc.).');
        return;
      }
      if (type === 'media' && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Media must be an image or video file.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50 MB limit
        setError('File must be smaller than 50MB.');
        return;
      }
      if (type === 'target') {
        setTargetImage(file);
      } else {
        setMediaFile(file);
        setMediaUrl('');
      }
      setError(null);
    }
  };

  // Handle project update
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth user:', user?.id, 'Auth error:', authError, 'Session JWT:', session?.access_token);
    if (authError || !user) {
      setError('You must be logged in to update a project.');
      return;
    }

    if (!projectName) {
      setError('Project name is required.');
      return;
    }

    let targetPath = project?.target_path || '';
    if (targetImage) {
      const targetExt = targetImage.name.split('.').pop();
      const targetFileName = `${user.id}/target_${Date.now()}.${targetExt}`;
      console.log('Uploading target:', targetFileName, 'Size:', targetImage.size, 'Type:', targetImage.type, 'Metadata:', { size: targetImage.size });
      const { error: targetUploadError, data: targetUploadData } = await supabase.storage
        .from('ar-assets')
        .upload(targetFileName, targetImage, {
          contentType: targetImage.type,
          metadata: { size: targetImage.size },
        });
      console.log('Target upload response:', targetUploadData, 'Error:', targetUploadError);
      if (targetUploadError) {
        console.error('Target upload detailed error:', JSON.stringify(targetUploadError, null, 2));
        if (targetUploadError.message.includes('column')) {
          setError('Server configuration error. Please contact support.');
        } else {
          setError(`Failed to upload target image: ${targetUploadError.message}`);
        }
        return;
      }
      const { data: targetUrlData } = supabase.storage
        .from('ar-assets')
        .getPublicUrl(targetFileName);
      console.log('Target public URL:', targetUrlData);
      targetPath = targetUrlData.publicUrl;

      // Delete old target image if it exists
      if (project?.target_path) {
        const oldTargetFileName = project.target_path.split('/').pop();
        if (oldTargetFileName) {
          await supabase.storage.from('ar-assets').remove([`${user.id}/${oldTargetFileName}`]);
        }
      }
    }

    let mediaPath: string | null = null;
    if (useUrl && mediaUrl) {
      if (!mediaUrl.match(/^https?:\/\/.+/)) {
        setError('Please enter a valid URL (http:// or https://).');
        return;
      }
      mediaPath = mediaUrl;
      console.log('Using media URL:', mediaPath);
    } else if (mediaFile) {
      const mediaExt = mediaFile.name.split('.').pop();
      const mediaFileName = `${user.id}/media_${Date.now()}.${mediaExt}`;
      console.log('Uploading media:', mediaFileName, 'Size:', mediaFile.size, 'Type:', mediaFile.type, 'Metadata:', { size: mediaFile.size });
      const { error: mediaUploadError, data: mediaUploadData } = await supabase.storage
        .from('ar-assets')
        .upload(mediaFileName, mediaFile, {
          contentType: mediaFile.type,
          metadata: { size: mediaFile.size },
        });
      console.log('Media upload response:', mediaUploadData, 'Error:', mediaUploadError);
      if (mediaUploadError) {
        console.error('Media upload detailed error:', JSON.stringify(mediaUploadError, null, 2));
        if (mediaUploadError.message.includes('column')) {
          setError('Server configuration error. Please contact support.');
        } else {
          setError(`Failed to upload media file: ${mediaUploadError.message}`);
        }
        return;
      }
      const { data: mediaUrlData } = supabase.storage
        .from('ar-assets')
        .getPublicUrl(mediaFileName);
      console.log('Media public URL:', mediaUrlData);
      mediaPath = mediaUrlData.publicUrl;

      // Delete old media file if it exists and is not a URL
      if (project?.media_path && !project.media_path.startsWith('http')) {
        const oldMediaFileName = project.media_path.split('/').pop();
        if (oldMediaFileName) {
          await supabase.storage.from('ar-assets').remove([`${user.id}/${oldMediaFileName}`]);
        }
      }
    } else {
      mediaPath = project?.media_path || null;
    }

    // Update project in ar_assets
    const projectData = {
      project_name: projectName,
      description,
      width_cm: width ? parseFloat(width) : null,
      height_cm: height ? parseFloat(height) : null,
      target_path: targetPath,
      media_path: mediaPath,
      status: project?.status || 'Draft',
    };
    console.log('Updating project:', projectData);
    const { error: updateError } = await supabase
      .from('ar_assets')
      .update(projectData)
      .eq('id', projectId)
      .eq('user_id', user.id);
    console.log('Update error:', updateError);
    if (updateError) {
      setError(`Failed to update project: ${updateError.message}`);
    } else {
      setShowSuccessModal(true);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Handle modal close and redirect
  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  if (!project && !error) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-yellow-400">ARt Emerged</Link>
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-2">
                {profile.profile_picture && (
                  <img
                    src={profile.profile_picture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {profile.display_name || 'User'}
                </span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Edit Project Card */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Edit AR Project</h1>
          <form onSubmit={handleUpdateProject} className="space-y-6">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                id="project-name"
                className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                placeholder="Describe your project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                  Width (cm)
                </label>
                <input
                  type="number"
                  id="width"
                  className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                  placeholder="e.g., 50"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="height"
                  className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                  placeholder="e.g., 50"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label htmlFor="target-image" className="block text-sm font-medium text-gray-700">
                Target Image
              </label>
              {project?.target_path && (
                <img
                  src={project.target_path}
                  alt="Current Target"
                  className="mt-2 w-full h-full object-cover rounded-md"
                />
              )}
              <input
                type="file"
                id="target-image"
                accept="image/*"
                className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                onChange={(e) => handleFileChange(e, 'target')}
                key="target-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media (Image, Video, or Streaming URL)
              </label>
              <div className="flex items-center space-x-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="media-type"
                    checked={!useUrl}
                    onChange={() => {
                      setUseUrl(false);
                      setMediaUrl('');
                    }}
                    className="mr-2"
                  />
                  Upload File
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="media-type"
                    checked={useUrl}
                    onChange={() => {
                      setUseUrl(true);
                      setMediaFile(null);
                    }}
                    className="mr-2"
                  />
                  Enter URL
                </label>
              </div>
              {useUrl ? (
                <input
                  type="text"
                  id="media-url"
                  className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                  placeholder="Enter streaming video URL (e.g., https://youtube.com/)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              ) : (
                <>
                  {project?.media_path && !project.media_path.startsWith('http') && (
                    <div className="mt-2">
                      {project.media_path.includes('.mp4') ? (
                        <video
                          src={project.media_path}
                          className="w-full h-40 object-cover rounded-md"
                          controls
                        />
                      ) : (
                        <img
                          src={project.media_path}
                          alt="Current Media"
                          className="w-full h-40 object-cover rounded-md"
                        />
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    id="media-file"
                    accept="image/*,video/*"
                    className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                    onChange={(e) => handleFileChange(e, 'media')}
                    key="media-input"
                  />
                </>
              )}
            </div>
            <div className="flex justify-center space-x-4">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Update Project
              </button>
              <Link
                href={`/projects/${projectId}/scene`}
                className="rounded-lg bg-green-600 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                View AR Scene
              </Link>
            </div>
          </form>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Success</h2>
            <p className="text-gray-600 mb-6">Your AR project has been updated successfully!</p>
            <div className="flex justify-center">
              <button
                onClick={handleModalClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}