// src/features/help/pages/admin/HelpManagement.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpLayout from '../../components/HelpLayout';
import HelpTabs from '../../components/HelpTabs';

// import category_icon from '../../../../assets/icons/cate.svg';
// import article_icon from '../../../../assets/icons/article.svg';
import faq_icon from '../../../../assets/icons/faq_icon.png';
import add_icon from '../../../../assets/icons/add.svg';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

export default function HelpManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('categories');
     const { user } = useAppSelector((state: RootState) => state.auth);
     const isSuperAdmin = user?.role?.role_name === 'Super Admin';
        const basePath = isSuperAdmin ? '/admin' : '';

        
  const stats = {
    categories: { total: 24, active: 22, drafts: 2 },
    articles: { total: 156, published: 142, drafts: 14 },
    faqs: { total: 89, active: 85, inactive: 4 }
  };

  return (
    <HelpLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help Center Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage categories, articles, and FAQs</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'categories') navigate(`${basePath}/help/categories`);
              else if (activeTab === 'articles') navigate(`${basePath}/help/articles`);
              else navigate(`${basePath}/help/faqs/new`);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <img src={add_icon} alt="" className="w-4 h-4 mr-2" />
            Add New
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              {/* <img src={category_icon} alt="" className="w-8 h-8" /> */}
              <span className="text-2xl font-bold text-gray-900">{stats.categories.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">{stats.categories.active} Active</span>
              <span className="text-gray-400">•</span>
              <span className="text-yellow-600">{stats.categories.drafts} Drafts</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              {/* <img src={article_icon} alt="" className="w-8 h-8" /> */}
              <span className="text-2xl font-bold text-gray-900">{stats.articles.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Articles</h3>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">{stats.articles.published} Published</span>
              <span className="text-gray-400">•</span>
              <span className="text-yellow-600">{stats.articles.drafts} Drafts</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <img src={faq_icon} alt="" className="w-8 h-8" />
              <span className="text-2xl font-bold text-gray-900">{stats.faqs.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">FAQs</h3>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">{stats.faqs.active} Active</span>
              <span className="text-gray-400">•</span>
              <span className="text-red-600">{stats.faqs.inactive} Inactive</span>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <HelpTabs
          tabs={[
            { id: 'categories', label: 'Categories', count: stats.categories.total },
            { id: 'articles', label: 'Articles', count: stats.articles.total },
            { id: 'faqs', label: 'FAQs', count: stats.faqs.total }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => navigate(`${basePath}/help/categories`)}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage Categories</h3>
            <p className="text-sm text-gray-500">Create, edit, and organize help categories</p>
          </button>

          <button
            onClick={() => navigate(`${basePath}/help/articles`)}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage Articles</h3>
            <p className="text-sm text-gray-500">Write and publish help articles</p>
          </button>

          <button
            onClick={() => navigate(`${basePath}/help/faqs`)}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage FAQs</h3>
            <p className="text-sm text-gray-500">Create and organize frequently asked questions</p>
          </button>
        </div>
      </div>
    </HelpLayout>
  );
}