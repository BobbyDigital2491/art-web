/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Project } from '../../../../types';

interface HierarchyPanelProps {
  selectedProject: Project | null;
  onSelectAsset: (project: Project) => void;
  selectedProjectId: string | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yffzwfxgwqjlxumxleeb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

export default function HierarchyPanel({ selectedProject, onSelectAsset, selectedProjectId }: HierarchyPanelProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Check if media_path is an image (png, jpg, jpeg, gif)
  const isImage = (path: string | null): boolean => {
    if (!path) return false;
    const ext = path.toLowerCase().split('.').pop();
    const isImageResult = ['png', 'jpg', 'jpeg', 'gif'].includes(ext || '');
    console.log('HierarchyPanel: media_path:', path, 'isImage:', isImageResult);
    return isImageResult;
  };

  // Fetch signed URL for media_path
  useEffect(() => {
    async function fetchSignedUrl() {
      if (selectedProject?.media_path && isImage(selectedProject.media_path)) {
        try {
          const { data, error } = await supabase.storage
            .from('ar-assets')
            .createSignedUrl(selectedProject.media_path, 60);
          if (error) {
            console.error('HierarchyPanel: Signed URL error:', error.message);
            setSignedUrl(null);
          } else {
            console.log('HierarchyPanel: Signed URL:', data.signedUrl);
            setSignedUrl(data.signedUrl);
          }
        } catch (err) {
          console.error('HierarchyPanel: Signed URL fetch error:', err);
          setSignedUrl(null);
        }
      } else {
        console.log('HierarchyPanel: No valid media_path or not an image');
        setSignedUrl(null);
      }
    }
    fetchSignedUrl();
  }, [selectedProject?.media_path]);

  return (
    <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg z-10 w-48 sm:w-36 md:w-48 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-2">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Selected Asset</h2>
        {selectedProject ? (
          <div
            className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
              selectedProjectId === selectedProject.id ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectAsset(selectedProject)}
          >
            {selectedProject.media_path && isImage(selectedProject.media_path) && signedUrl ? (
              <img
                src={signedUrl}
                alt={selectedProject.project_name}
                className="w-10 h-10 object-cover rounded border border-red-500"
                onError={(e) => {
                  console.error('HierarchyPanel: Image load error for', signedUrl, 'falling back to /fallback-image.png');
                  e.currentTarget.src = '/fallback-image.png';
                }}
                onLoad={() => console.log('HierarchyPanel: Image loaded successfully for', signedUrl)}
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">No Image</span>
              </div>
            )}
            <span className="text-xs truncate">{selectedProject.project_name}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-500">No asset selected</div>
        )}
      </div>
    </div>
  );
}