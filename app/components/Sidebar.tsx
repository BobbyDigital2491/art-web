'use client';
import { useState } from 'react';
import { HiArrowSmLeft, HiArrowSmRight, HiHome, HiFolder, HiUser, HiArrowSmRight as HiLogout, HiVideoCamera, HiCube } from 'react-icons/hi';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Sidebar = ({ onToggle }: { onToggle: (collapsed: boolean) => void }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const router = useRouter();

  const handleToggle = () => {
    setCollapsed(!collapsed);
    onToggle(!collapsed);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleDrawer = (name: string) => {
    setOpenDrawer(openDrawer === name ? null : name);
  };

  const menuItems = [
    { name: 'Home', icon: <HiHome className="h-6 w-6 text-yellow-700" />, href: '/', isDrawer: false },
    { 
      name: 'Projects', 
      icon: <HiFolder className="h-6 w-6 text-yellow-700" />, 
      isDrawer: true,
      drawerContent: (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">Projects</h3>
          <Link
            href="/projects/create"
            className="block text-white hover:text-blue-300 p-2 rounded-md"
          >
            Create New Project
          </Link>
          <Link
            href="/projects"
            className="block text-white hover:text-gray-200 p-2 rounded-md"
          >
            View All Projects
          </Link>
        </div>
      ),
    },
    { 
      name: 'Video Editor', 
      icon: <HiVideoCamera className="h-6 w-6 text-yellow-700" />, 
      isDrawer: true,
      drawerContent: (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Video Editor</h3>
          <Link
            href="/video-editor"
            className="block text-white hover:text-gray-200 p-2 rounded-md"
          >
            Open Video Editor
          </Link>
        </div>
      ),
    },
    { 
      name: '3D Scene Editor', 
      icon: <HiCube className="h-6 w-6 text-yellow-700" />, 
      isDrawer: true,
      drawerContent: (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2">3D Scene Editor</h3>
          <Link
            href="/3d-scene-editor"
            className="block text-white hover:text-gray-200 p-2 rounded-md"
          >
            Open 3D Scene Editor
          </Link>
        </div>
      ),
    },
    { name: 'Profile', icon: <HiUser className="h-6 w-6 text-yellow-700" />, href: '/profile', isDrawer: false },
    { name: 'Logout', icon: <HiLogout className="h-6 w-6 text-yellow-700" />, isDrawer: false, onClick: handleLogout },
  ];

  return (
    <div className={`bg-black text-white h-screen ${collapsed ? 'w-16' : 'w-60'} transition-all duration-300 fixed top-0 left-0 z-20`}>
      <div className="flex flex-col h-full">
        {/* Logo and Toggle Button */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-700`}>
          {!collapsed && (
            <Link href="/" className="text-xl font-bold text-yellow-400">
              ARt Emerged
            </Link>
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            {collapsed ? <HiArrowSmRight className="h-6 w-6" /> : <HiArrowSmLeft className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-grow mt-4">
          <ul className="flex flex-col gap-2">
            {menuItems.map((item, index) => (
              <li key={index} className="mx-2">
                {item.isDrawer ? (
                  <>
                    <button
                      onClick={() => toggleDrawer(item.name)}
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 w-full text-left ${
                        collapsed ? 'justify-center' : ''
                      }`}
                    >
                      {item.icon}
                      {!collapsed && <span className="text-sm">{item.name}</span>}
                    </button>
                    {!collapsed && openDrawer === item.name && (
                      <div className="bg-gray-700 mt-1 rounded-md animate-slide-in">
                        {item.drawerContent}
                      </div>
                    )}
                  </>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 w-full text-left ${
                      collapsed ? 'justify-center' : ''
                    }`}
                  >
                    {item.icon}
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 ${
                      collapsed ? 'justify-center' : ''
                    }`}
                  >
                    {item.icon}
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* CSS for Drawer Animation */}
      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-in-out;
        }
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;