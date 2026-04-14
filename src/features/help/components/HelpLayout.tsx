// src/features/help/components/HelpLayout.tsx
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../app/hooks';
import search_icon from '../../../assets/icons/search_icon.svg';
import type { RootState } from '../../../app/store';

interface HelpLayoutProps {
  children: ReactNode;
  showSearch?: boolean;
}

export default function HelpLayout({ children, showSearch = true }: HelpLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';
  const isAdmin = user?.role?.role_name === 'Super Admin' || user?.role?.role_name === 'Admin';

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query.trim()) {
      navigate(`${basePath}/help/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile Header - Logo and Menu Toggle */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-0 md:h-16">
              {/* Logo and Mobile Menu Button */}
              <div className="flex items-center justify-between">
                <Link to={`${basePath}/help`} className="flex items-center space-x-2">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Help Center</span>
                </Link>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const mobileMenu = document.getElementById('mobile-menu');
                      if (mobileMenu) {
                        mobileMenu.classList.toggle('hidden');
                      }
                    }}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-4 ml-8">
                <Link to={`${basePath}/help`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to={`${basePath}/help/browse`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Browse
                </Link>
                {isAdmin && (
                  <Link to={`${basePath}/help/management`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                    Manage
                  </Link>
                )}
              </nav>

              {/* Search Bar - Desktop */}
              {showSearch && (
                <div className="hidden md:block flex-1 max-w-lg ml-4">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <img
                        src={search_icon}
                        alt=""
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      />
                      <input
                        type="text"
                        name="search"
                        placeholder="Search for help..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <div id="mobile-menu" className="hidden md:hidden pb-3">
              <nav className="flex flex-col space-y-1">
                <Link
                  to={`${basePath}/help`}
                  onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to={`${basePath}/help/browse`}
                  onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  Browse
                </Link>
                {isAdmin && (
                  <Link
                    to={`${basePath}/help/management`}
                    onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  >
                    Manage
                  </Link>
                )}
              </nav>

              {/* Search Bar - Mobile */}
              {showSearch && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <img
                        src={search_icon}
                        alt=""
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      />
                      <input
                        type="text"
                        name="search"
                        placeholder="Search for help..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto py-4 sm:py-6">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}