'use client';
import Image from 'next/image';
import { HiX } from 'react-icons/hi';

interface PublishModalProps {
  projectId: string;
  qrCodeUrl: string;
  onClose: () => void;
}

export default function PublishModal({ projectId, qrCodeUrl, onClose }: PublishModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-60 animate-fade-in">
      <div className="bg-gray-800 bg-opacity-90 text-white p-6 rounded-lg max-w-lg w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Project Published</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-300 mb-4">Your project is now live! Share it using the QR code or link below.</p>
        <Image
          src={qrCodeUrl}
          alt="QR Code"
          width={128}
          height={128}
          className="mx-auto mb-4"
        />
        <p className="text-sm text-gray-300">
          AR Scene Link:{' '}
          <a
            href={`${window.location.origin}/ar/${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            {`${window.location.origin}/ar/${projectId}`}
          </a>
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          Close
        </button>
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out !important;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-in-out !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}