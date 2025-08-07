'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createClientComponentClient();

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
      const filePath = new URL(url).pathname.split('/public/')[1];
      await supabase.storage.from('ar-assets').remove([filePath]);
      onFileDelete(id);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg border border-gray-600 overflow-y-auto h-[150px]">
      <h3 className="text-sm font-semibold text-gray-200 mb-2">File System</h3>
      <div
        {...getRootProps()}
        className={`p-2 border-2 border-dashed rounded ${isDragActive ? 'border-indigo-600' : 'border-gray-600'} mb-2`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center space-x-2">
          <FiUpload className="h-5 w-5 text-gray-400" />
          <p className="text-xs text-gray-400">{isDragActive ? 'Drop files here' : 'Drag & drop files or click to upload'}</p>
        </div>
      </div>
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between text-xs text-gray-300">
            <button
              onClick={() => onFileSelect(file)}
              className="truncate hover:text-indigo-400"
              title={file.name}
            >
              {file.name}
            </button>
            <button
              onClick={() => handleDelete(file.id, file.url)}
              className="p-1 rounded-full hover:bg-red-700 transition"
              title="Delete file"
            >
              <FiTrash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}