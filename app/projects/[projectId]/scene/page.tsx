'use client';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import SceneEditor from './components/SceneEditor';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  project_name: string;
  description: string | null;
  target_path: string;
  media_path: string | null;
  status: string;
  user_id: string;
}

export default function ScenePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('ScenePage: userId:', user?.id, 'session:', !!session, 'authError:', JSON.stringify(authError, null, 2));
      console.log('ScenePage: cookies:', document.cookie);

      if (authError || !user) {
        setError('You must be logged in to view the AR scene.');
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('ar_assets')
        .select('id, project_name, description, target_path, media_path, status, user_id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      console.log('ScenePage: projectId:', projectId, 'ar_assets result:', JSON.stringify(data, null, 2), 'error:', JSON.stringify(error, null, 2));

      if (error) {
        setError(`Failed to fetch project: ${error.message}`);
      } else if (data) {
        setProject(data);
      } else {
        setError('Project not found.');
      }
    };

    fetchProject();
  }, [projectId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return <SceneEditor project={project} />;
}