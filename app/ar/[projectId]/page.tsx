'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  project_name: string;
  target_path: string;
  media_path?: string;
  project_type: string;
  published: boolean;
}

export default function ARScene() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('ar_assets')
          .select('id, project_name, target_path, media_path, project_type, published')
          .eq('id', projectId)
          .eq('published', true)
          .single();

        if (error) {
          setError('Failed to fetch project: ' + error.message);
          setLoading(false);
          return;
        }

        if (data) {
          setProject({
            id: data.id,
            project_name: data.project_name,
            target_path: data.target_path,
            media_path: data.media_path,
            project_type: data.project_type,
            published: data.published,
          });
        }
      } catch (err) {
        setError('Unexpected error: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AR Scene</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : project ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{project.project_name}</h2>
            <p className="text-gray-600">This is a placeholder for the AR Scene. Full AR implementation to be added.</p>
            <p className="text-sm text-gray-600 mt-2">Type: {project.project_type.replace('_', ' ').toUpperCase()}</p>
            {project.media_path && (
              <p className="text-sm text-gray-600 mt-2">
                Video:{' '}
                <a
                  href={project.media_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:underline"
                >
                  View Video
                </a>
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Project not found or not published.</p>
        )}
      </div>
    </div>
  );
}