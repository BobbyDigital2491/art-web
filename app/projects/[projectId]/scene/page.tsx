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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('No user — redirecting to login');
          router.replace('/login');
          return;
        }

        const { data, error } = await supabase
          .from('ar_assets')
          .select('id, project_name, description, target_path, media_path, updated_at, status, user_id')
          .eq('id', projectId as string)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Supabase fetch error:', error);
          if (error.code === 'PGRST116') {
            setError('Project not found');
          } else {
            setError('Failed to load project');
          }
        } else if (data) {
          setProject(data as unknown as Project);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading your AR scene...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-red-500 text-6xl mb-4">Warning</div>
          <p className="text-xl text-gray-800 font-semibold mb-4">{error}</p>
          <p className="text-gray-600 mb-6">This project may have been deleted or you don&apos;t have access.</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition font-semibold"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.refresh()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No project
  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-700">Project not found</p>
        </div>
      </div>
    );
  }

  // Success — render editor
  return <SceneEditor project={project} />;
}