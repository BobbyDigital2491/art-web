'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { supabase } from '@/app/lib/supabase/client';

interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface FileProps {
  files: FileItem[];
  onFileUpload: (file: File) => void;
  onFileDelete: (id: string) => void;
  onFileSelect: (file: FileItem) => void;
}

export default function File({ files, onFileUpload, onFileDelete, onFileSelect }: FileProps) {
  // ← Removed createClientComponentClient() — using shared client

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        onFileUpload(file);
      });
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'model/gltf-binary': ['.glb'],
    },
  });

  const handleDelete = async (id: string, url: string) => {
    try {
      // Extract file path from public URL
      const filePath = new URL(url).pathname.split('/public/')[1];
      if (!filePath) throw new Error('Invalid file URL');

      const { error } = await supabase.storage.from('ar-assets').remove([filePath]);
      if (error) throw error;

      onFileDelete(id);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  return (
    <div className="bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg border border-gray-600 overflow-y-auto h-[150px]">
      <h3 className="text-sm font-semibold text-gray-200 mb-2">File System</h3>
      
      <div
        {...getRootProps()}
        className={`p-2 border-2 border-dashed rounded cursor-pointer transition ${
          isDragActive ? 'border-indigo-600 bg-indigo-900 bg-opacity-30' : 'border-gray-600'
        } mb-2`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center space-x-2">
          <FiUpload className="h-5 w-5 text-gray-400" />
          <p className="text-xs text-gray-400">
            {isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-[80px] overflow-y-auto">
        {files.length === 0 ? (
          <p className="text-xs text-gray-500 text-center">No files uploaded</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between text-xs text-gray-300 hover:bg-gray-700 px-2 py-1 rounded transition"
            >
              <button
                onClick={() => onFileSelect(file)}
                className="truncate max-w-[120px] text-left hover:text-indigo-400"
                title={file.name}
              >
                {file.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.id, file.url);
                }}
                className="p-1 rounded-full hover:bg-red-700 transition"
                title="Delete file"
              >
                <FiTrash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}