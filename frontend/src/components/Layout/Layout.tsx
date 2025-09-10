import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { selectSidebarState } from '@/store/slices/uiSlice';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const { open: sidebarOpen, collapsed: sidebarCollapsed } = useAppSelector(selectSidebarState);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? sidebarCollapsed
              ? 'lg:ml-16'
              : 'lg:ml-64'
            : 'lg:ml-0'
        }`}
      >
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => {
            // Close sidebar on mobile
            // This will be implemented with dispatch
          }}
        />
      )}
    </div>
  );
};

export default Layout;
