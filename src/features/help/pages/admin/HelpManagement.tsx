// src/features/help/pages/admin/HelpManagement.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpLayout from '../../components/HelpLayout';
import HelpTabs from '../../components/HelpTabs';
import faq_icon from '../../../../assets/icons/faq_icon.png';
import add_icon from '../../../../assets/icons/add.svg';
import { useAppSelector } from '../../../../app/hooks';
import {
  useGetHelpCategoriesQuery,
  useGetArticlesQuery,
  useGetFaqsQuery
} from '../../../../services/helpApi';
import type { RootState } from '../../../../app/store';

interface StatsData {
  categories: { total: number; active: number; inactive: number };
  articles: { total: number; published: number; drafts: number };
  faqs: { total: number; active: number; inactive: number };
}

export default function HelpManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'categories' | 'articles' | 'faqs'>('categories');
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // Fetch real data from APIs
  const { data: categoriesData, isLoading: categoriesLoading } = useGetHelpCategoriesQuery({ is_active: undefined });
  const { data: articlesData, isLoading: articlesLoading } = useGetArticlesQuery({ per_page: 1 });
  const { data: faqsData, isLoading: faqsLoading } = useGetFaqsQuery({ per_page: 1 });

  const isLoading = categoriesLoading || articlesLoading || faqsLoading;

  // Calculate stats from actual API data
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const activeCategories = categories.filter(c => c.is_active === true).length;

  // Get articles stats - handle both paginated and non-paginated responses
  const articlesTotal = (articlesData as any)?.total || articlesData?.data?.length || 0;
  const articlesList = Array.isArray(articlesData?.data?.data) ? articlesData.data.data :
    Array.isArray(articlesData?.data) ? articlesData.data : [];
  const publishedArticles = articlesList.filter((a: any) => a.status === 'published').length;

  // Get FAQs stats
  const faqsTotal = (faqsData as any)?.total || faqsData?.data?.length || 0;
  const faqsList = Array.isArray(faqsData?.data?.data) ? faqsData.data.data :
    Array.isArray(faqsData?.data) ? faqsData.data : [];
  const activeFaqs = faqsList.filter((f: any) => f.is_active === true).length;

  const stats: StatsData = {
    categories: {
      total: categories.length,
      active: activeCategories,
      inactive: categories.length - activeCategories
    },
    articles: {
      total: articlesTotal,
      published: publishedArticles,
      drafts: articlesTotal - publishedArticles
    },
    faqs: {
      total: faqsTotal,
      active: activeFaqs,
      inactive: faqsTotal - activeFaqs
    }
  };

  if (isLoading) {
    return (
      <HelpLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </HelpLayout>
    );
  }

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

        {/* Stats Cards - Now showing actual data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Categories Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-gray-900">{stats.categories.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">{stats.categories.active} Active</span>
              <span className="text-gray-400">•</span>
              <span className="text-yellow-600">{stats.categories.inactive} Inactive</span>
            </div>
          </div>

          {/* Articles Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-gray-900">{stats.articles.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Articles</h3>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">{stats.articles.published} Published</span>
              <span className="text-gray-400">•</span>
              <span className="text-yellow-600">{stats.articles.drafts} Drafts</span>
            </div>
          </div>

          {/* FAQs Card */}
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
          onTabChange={(tab) => setActiveTab(tab as any)}
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