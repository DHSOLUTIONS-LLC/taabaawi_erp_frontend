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
      <div className="space-y-4 sm:space-y-6 ">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help Center Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage categories, articles, and FAQs</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'categories') navigate(`${basePath}/help/categories`);
              else if (activeTab === 'articles') navigate(`${basePath}/help/articles`);
              else navigate(`${basePath}/help/faqs/new`);
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <img src={add_icon} alt="" className="w-4 h-4 mr-2" />
            Add New
          </button>
        </div>

        {/* Stats Cards - Now showing actual data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Categories Card */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.categories.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-green-600">{stats.categories.active} Active</span>
              <span className="text-gray-300">•</span>
              <span className="text-yellow-600">{stats.categories.inactive} Inactive</span>
            </div>
          </div>

          {/* Articles Card */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.articles.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Articles</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-green-600">{stats.articles.published} Published</span>
              <span className="text-gray-300">•</span>
              <span className="text-yellow-600">{stats.articles.drafts} Drafts</span>
            </div>
          </div>

          {/* FAQs Card */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.faqs.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">FAQs</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-green-600">{stats.faqs.active} Active</span>
              <span className="text-gray-300">•</span>
              <span className="text-red-600">{stats.faqs.inactive} Inactive</span>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <div className="overflow-x-auto">
          <HelpTabs
            tabs={[
              { id: 'categories', label: 'Categories', count: stats.categories.total },
              { id: 'articles', label: 'Articles', count: stats.articles.total },
              { id: 'faqs', label: 'FAQs', count: stats.faqs.total }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <button
            onClick={() => navigate(`${basePath}/help/categories`)}
            className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Manage Categories</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 ml-11 sm:ml-14">Create, edit, and organize help categories</p>
          </button>

          <button
            onClick={() => navigate(`${basePath}/help/articles`)}
            className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Manage Articles</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 ml-11 sm:ml-14">Write and publish help articles</p>
          </button>

          <button
            onClick={() => navigate(`${basePath}/help/faqs`)}
            className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Manage FAQs</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 ml-11 sm:ml-14">Create and organize frequently asked questions</p>
          </button>
        </div>
      </div>
    </HelpLayout>
  );
}