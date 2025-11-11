/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { Project } from '@/types';
import { useRouter } from 'next/navigation';

export default function ProjectEditor() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

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
          .select('*')
          .eq('id', projectId as string)
          .eq('user_id', user.id)
          .single();

        if (error) {
          setError('Project not found');
        } else if (data) {
          setProject(data as Project);
          setProjectName(data.project_name);
          setDescription(data.description || '');
        }
      } catch (err) {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      const { error } = await supabase
        .from('ar_assets')
        .update({
          project_name: projectName,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId as string);

      if (error) {
        alert('Failed to update project');
      } else {
        alert('Project updated successfully!');
        router.push('/');
      }
    } catch (err) {
      alert('Error updating project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-yellow-600 mb-6"></div>
          <p className="text-2xl font-bold text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-3xl shadow-2xl">
          <p className="text-2xl text-red-600 font-bold mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Edit Project</h1>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
            >
              Update Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}