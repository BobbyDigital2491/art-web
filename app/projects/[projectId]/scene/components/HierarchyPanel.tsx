/* eslint-disable @next/next/no-img-element */
'use client';
import { Project } from './SceneEditor';

interface HierarchyPanelProps {
  selectedProject: Project | null;
  onSelectAsset: (project: Project) => void;
  selectedProjectId: string | null;
}

export default function HierarchyPanel({ selectedProject, onSelectAsset, selectedProjectId }: HierarchyPanelProps) {
  // Check if media_path is an image (png, jpg, jpeg, gif)
  const isImage = (path: string | null): boolean => {
    if (!path) return false;
    const ext = path.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif'].includes(ext || '');
  };

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
            {selectedProject.media_path && isImage(selectedProject.media_path) ? (
              <img
                src={selectedProject.media_path}
                alt={selectedProject.project_name}
                className="w-10 h-10 object-cover rounded"
                onError={(e) => {
                  console.error('HierarchyPanel: Image load error for', selectedProject.media_path);
                  e.currentTarget.src = '/fallback-image.png'; // Fallback image
                }}
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