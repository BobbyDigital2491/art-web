'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { Project } from '@/types';
import Image from 'next/image';

interface HierarchyPanelProps {
  selectedProject: Project | null;
  onSelectAsset: (project: Project) => void;
  selectedProjectId: string | null;
}

export default function HierarchyPanel({
  selectedProject,
  onSelectAsset,
  selectedProjectId,
}: HierarchyPanelProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  // Check if target_path is an image
  const isImage = (path: string | null): boolean => {
    if (!path) return false;
    const ext = path.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '');
  };

  // Normalize path from public URL to storage path
  const normalizePath = (path: string | null | undefined): string | null => {
    if (!path) return null;
    const prefix = 'https://yffzwfxgwqjlxumxleeb.supabase.co/storage/v1/object/public/ar-assets/';
    return path.startsWith(prefix) ? path.replace(prefix, '') : path;
  };

  // Fetch signed URL for target image
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!selectedProject?.target_path) {
        setSignedUrl('/fallback-image.png');
        setImageError(true);
        return;
      }

      const normalizedPath = normalizePath(selectedProject.target_path);

      if (!normalizedPath || !isImage(normalizedPath)) {
        setSignedUrl('/fallback-image.png');
        setImageError(true);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from('ar-assets')
          .createSignedUrl(normalizedPath, 3600); // 1 hour

        if (error || !data?.signedUrl) {
          console.error('Failed to get signed URL:', error);
          setSignedUrl('/fallback-image.png');
          setImageError(true);
        } else {
          setSignedUrl(data.signedUrl);
          setImageError(false);
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setSignedUrl('/fallback-image.png');
        setImageError(true);
      }
    };

    fetchSignedUrl();
  }, [selectedProject?.id, selectedProject?.target_path]);

  return (
    <div className="absolute top-4 left-4 bg-white shadow-2xl rounded-xl z-50 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto border border-gray-200">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Selected Asset</h2>
      </div>

      <div className="p-5">
        {selectedProject ? (
          <div
            className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
              selectedProjectId === selectedProject.id
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : 'hover:bg-gray-50 border-transparent hover:border-gray-300'
            }`}
            onClick={() => onSelectAsset(selectedProject)}
          >
            <div className="flex-shrink-0">
              {signedUrl && !imageError ? (
                <Image
                  src={signedUrl}
                  alt={selectedProject.project_name}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover border-2 border-blue-400 shadow-sm"
                  unoptimized
                  onError={() => {
                    setSignedUrl('/fallback-image.png');
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed border-red-400 rounded-lg w-16 h-16 flex items-center justify-center">
                  <span className="text-xs text-red-600 font-medium">No Image</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate text-sm">
                {selectedProject.project_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedProject.description || 'No description'}
              </p>
              {imageError && (
                <p className="text-xs text-red-500 mt-1">Image failed to load</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No asset selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
