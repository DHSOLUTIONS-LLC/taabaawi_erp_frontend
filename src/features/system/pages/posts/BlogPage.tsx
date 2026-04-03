import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlogPostsList from '../../components/posts/BlogPostsList';
import BlogPostStats from '../../components/posts/BlogPostStats';
import { useGetBlogStatisticsQuery } from '../../../../services/blogApi';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

type TabType = 'all' | 'published' | 'drafts' | 'scheduled';

const BlogPage: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTabChanging, setIsTabChanging] = useState(false);

  const { data: statsData, refetch: refetchStats } = useGetBlogStatisticsQuery();

  const stats = statsData?.data;

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'published', label: 'Published' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'scheduled', label: 'Scheduled' },
  ];

  const getFilters = () => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;

    if (activeTab === 'drafts') filters.status = 'draft';
    if (activeTab === 'published') filters.status = 'published';
    if (activeTab === 'scheduled') filters.status = 'scheduled';

    return filters;
  };

  const handleTabChange = (tabId: TabType) => {
    if (activeTab === tabId) return;
    setIsTabChanging(true);
    setActiveTab(tabId);
    // Reset loading after 300ms (prevents flicker if loading is too fast)
    setTimeout(() => setIsTabChanging(false), 300);
  };

  // Refresh stats when post is created/deleted/updated
  useEffect(() => {
    refetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-gray-600 mt-2">Manage your blog posts and categories</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/blog/create`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Post
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <BlogPostStats />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
                {stats && tab.id !== 'all' && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({tab.id === 'published' ? stats.published_posts || 0 :
                      tab.id === 'drafts' ? stats.draft_posts || 0 :
                        tab.id === 'scheduled' ? stats.scheduled_posts || 0 : 0})
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search posts by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="ml-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Loading Indicator for Tab Change */}
        {isTabChanging ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading posts...</span>
          </div>
        ) : (
          <BlogPostsList
            key={`${activeTab}-${searchTerm}`} // Force re-render on tab/search change
            filters={getFilters()}
          />
        )}

      </div>
    </DashboardLayout>
  );
};

export default BlogPage;