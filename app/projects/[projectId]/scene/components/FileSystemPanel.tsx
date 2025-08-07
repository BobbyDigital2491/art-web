/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useRef } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

interface FileSystemPanelProps {
  onAssetUpload: (file: File) => void;
  isFullScreen: boolean;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

export default function FileSystemPanel({ onAssetUpload, isFullScreen, isMinimized, setIsMinimized }: FileSystemPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAssetUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onAssetUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 ${isMinimized ? 'h-12' : 'h-32'} bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg border border-gray-600 z-40 file-system-panel transition-all duration-300`}
      style={{ visibility: 'visible', zIndex: 40 }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-gray-800 bg-opacity-70 text-white hover:bg-opacity-90 transition"
        title={isMinimized ? 'Maximize File System' : 'Minimize File System'}
      >
        {isMinimized ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
      </button>
      {!isMinimized && (
        <>
          <h3 className="text-sm font-semibold text-gray-200 mb-2">File System</h3>
          <div className="flex items-center justify-center h-[calc(100%-2rem)]">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.glb"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition"
            >
              Upload Asset
            </button>
            <p className="text-xs text-gray-400 ml-4">Drag and drop files here (jpg, png, glb)</p>
          </div>
        </>
      )}
    </div>
  );
}