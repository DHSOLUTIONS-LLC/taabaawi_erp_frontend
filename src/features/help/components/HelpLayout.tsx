// src/features/help/components/HelpLayout.tsx
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../app/hooks';
import search_icon from '../../../assets/icons/search_icon.svg';
import type { RootState } from '../../../app/store';
// import help_icon from '../../../assets/icons/he.svg';

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
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link to={`${basePath}/help`} className="flex items-center space-x-2">
                  {/* <img src={help_icon} alt="Help" className="w-6 h-6" /> */}
                  <span className="text-lg font-semibold text-gray-900">Help Center</span>
                </Link>
                
                <nav className="hidden md:flex space-x-4 ml-8">
                  <Link to={`${basePath}/help`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to={`${basePath}/help/browse`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Browse
                  </Link>
                 
                  <Link to={`${basePath}/help/saved`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Saved
                  </Link>
                  {isAdmin && (
                    <Link to={`${basePath}/help/management`} className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Manage
                    </Link>
                  )}
                </nav>
              </div>

              {showSearch && (
                <form onSubmit={handleSearch} className="flex-1 max-w-lg ml-4">
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
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}