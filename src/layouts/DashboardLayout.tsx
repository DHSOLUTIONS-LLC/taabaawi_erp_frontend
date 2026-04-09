// src/layouts/DashboardLayout.tsx
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard Overview');

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleMenuSelect = (title: string) => {
    setPageTitle(title);
    if (window.innerWidth <= 991) {
      closeMobileMenu();
    }
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex relative">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar}
          onMenuSelect={handleMenuSelect}
          mobileMenuOpen={mobileMenuOpen}
          closeMobileMenu={closeMobileMenu}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
        }`}>
          <Topbar 
            sidebarCollapsed={sidebarCollapsed} 
            toggleSidebar={toggleSidebar}
            toggleMobileMenu={toggleMobileMenu}
            pageTitle={pageTitle}
            mobileMenuOpen={mobileMenuOpen}
          />

          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto min-w-0">
            {children || <Outlet />}
          </main>
        </div>

        {/* Mobile overlay - CRITICAL: Must be last child */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
            style={{ zIndex: 35 }}
            onClick={closeMobileMenu}
          />
        )}
      </div>
    </div>
  );
}