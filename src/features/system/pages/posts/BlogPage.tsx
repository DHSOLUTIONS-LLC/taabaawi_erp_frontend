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

  const { data: statsData, refetch: refetchStats } = useGetBlogStatisticsQuery();
  const stats = statsData?.data;

  const tabs = [
    { id: 'all', label: 'All Posts', icon: '', count: stats?.total_posts || 0 },
    { id: 'published', label: 'Published', icon: '', count: stats?.published_posts || 0 },
    { id: 'drafts', label: 'Drafts', icon: '', count: stats?.draft_posts || 0 },
    { id: 'scheduled', label: 'Scheduled', icon: '', count: stats?.scheduled_posts || 0 },
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
    setActiveTab(tabId);
  };

  useEffect(() => {
    refetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto">

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Blog Management</h1>
                <p className="text-gray-500 mt-1">Create, manage, and organize your blog content</p>
              </div>
              <button
                onClick={() => navigate(`${basePath}/blog/create`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <BlogPostStats />
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id !== 'all' && (
                    <span className={`
                      ml-1 px-1.5 py-0.5 rounded-full text-xs
                      ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="overflow-hidden">
            <BlogPostsList
              key={`${activeTab}-${searchTerm}`}
              filters={getFilters()}
            />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogPage;