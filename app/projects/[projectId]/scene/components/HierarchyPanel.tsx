/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Project } from '@/types';
import Image from 'next/image';

interface HierarchyPanelProps {
  selectedProject: Project | null;
  onSelectAsset: (project: Project) => void;
  selectedProjectId: string | null;
}

export default function HierarchyPanel({ selectedProject, onSelectAsset, selectedProjectId }: HierarchyPanelProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const supabase = createClientComponentClient();

  // Check if target_path is an image (png, jpg, jpeg, webp)
  const isImage = (path: string | null): boolean => {
    if (!path) return false;
    const ext = path.toLowerCase().split('.').pop();
    const isImageResult = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
    console.log('HierarchyPanel: target_path:', path, 'isImage:', isImageResult);
    return isImageResult;
  };

  // Normalize target_path by removing Supabase URL prefix
  const normalizePath = (path: string | null | undefined): string | null => {
    if (!path) return null;
    const prefix = 'https://yffzwfxgwqjlxumxleeb.supabase.co/storage/v1/object/public/ar-assets/';
    if (path.startsWith(prefix)) {
      const normalized = path.replace(prefix, '');
      console.log('HierarchyPanel: Normalized target_path:', path, 'to:', normalized);
      return normalized;
    }
    console.log('HierarchyPanel: target_path already normalized:', path);
    return path;
  };

  // Fetch signed URL for target_path
  useEffect(() => {
    async function fetchSignedUrl() {
      const targetPath = normalizePath(selectedProject?.target_path);
      if (targetPath && isImage(targetPath)) {
        try {
          const { data, error } = await supabase.storage
            .from('ar-assets')
            .createSignedUrl(targetPath, 60);
          if (error) {
            console.error('HierarchyPanel: Failed to get signed URL for', targetPath, ':', error.message);
            setSignedUrl('/fallback-image.png');
            setImageError(true);
          } else {
            console.log('HierarchyPanel: Signed URL for', targetPath, ':', data.signedUrl);
            setSignedUrl(data.signedUrl);
            setImageError(false);
          }
        } catch (err) {
          console.error('HierarchyPanel: Error fetching signed URL for', targetPath, ':', err);
          setSignedUrl('/fallback-image.png');
          setImageError(true);
        }
      } else {
        console.log('HierarchyPanel: No valid target_path or not an image for', selectedProject?.id || 'no project');
        setSignedUrl('/fallback-image.png');
        setImageError(true);
      }
    }
    fetchSignedUrl();
  }, [selectedProject?.target_path]);

  return (
    <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg z-10 w-48 md:w-64 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Selected Asset</h2>
        {selectedProject ? (
          <div
            className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
              selectedProjectId === selectedProject.id ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectAsset(selectedProject)}
          >
            {selectedProject.target_path && isImage(selectedProject.target_path) && signedUrl && !imageError ? (
              <Image
                src={signedUrl}
                alt={selectedProject.project_name}
                width={50}
                height={50}
                className="mr-2 border-2 border-blue-500 rounded object-cover"
                unoptimized
                onError={() => {
                  console.error('HierarchyPanel: Image load error for', selectedProject.target_path);
                  setSignedUrl('/fallback-image.png');
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log('HierarchyPanel: Image loaded successfully for', selectedProject.target_path);
                  setImageError(false);
                }}
              />
            ) : (
              <Image
                src="/fallback-image.png"
                alt={selectedProject.project_name}
                width={50}
                height={50}
                className="mr-2 border-2 border-red-500 rounded object-cover"
                unoptimized
                onLoad={() => console.log('HierarchyPanel: Fallback image loaded for', selectedProject.id)}
              />
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