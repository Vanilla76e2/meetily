'use client';

import React from 'react';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={`relative z-0 h-full min-w-0 flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      <div className="min-h-full min-w-0 w-full">
        {children}
      </div>
    </main>
  );
};

export default MainContent;
