'use client';
import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { HiOutlinePhotograph, HiOutlineCube, HiOutlineMap } from 'react-icons/hi';

export default function CreateProject() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const projectTypes = [
    {
      type: 'image_target',
      title: 'Image Target',
      description: 'Create AR experiences triggered by specific images.',
      icon: <HiOutlinePhotograph className="h-12 w-12 text-indigo-500" />,
    },
    {
      type: 'object_tracking',
      title: 'Object Tracking',
      description: 'Track and augment 3D objects in the real world.',
      icon: <HiOutlineCube className="h-12 w-12 text-indigo-500" />,
    },
    {
      type: 'object_placement',
      title: 'Object Placement',
      description: 'Place virtual objects in a real-world environment.',
      icon: <HiOutlineMap className="h-12 w-12 text-indigo-500" />,
    },
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Project</h1>

        {/* Flex Grid */}
        <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
          {projectTypes.map((project) => (
            <div
              key={project.type}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow md:w-[calc(33.333%-1.5rem)]"
            >
              <div className="flex items-center mb-4">
                {project.icon}
                <h2 className="text-xl font-semibold text-gray-800 ml-3">{project.title}</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              <Link
                href={`/projects/new?type=${encodeURIComponent(project.type)}`}
                className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors"
              >
                Select
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}