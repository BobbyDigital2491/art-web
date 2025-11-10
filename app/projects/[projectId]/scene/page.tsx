/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import SceneEditor from './components/SceneEditor';
import { supabase } from '@/app/lib/supabase/client';
import { Project } from '@/types';

export default function ScenePage() {
  const router = useRouter();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('ar_assets')
          .select('id, project_name, description, target_path, media_path, updated_at, status, user_id')
          .eq('id', projectId as string)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Fetch error:', error);
          setError('Failed to load project');
        } else if (data) {
          setProject(data as Project);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading AR Scene...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  return <SceneEditor project={project} />;
}