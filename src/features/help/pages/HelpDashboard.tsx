// src/features/help/pages/HelpDashboard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpLayout from '../components/HelpLayout';
import HelpSearchBar from '../components/HelpSearchBar';
import HelpCard from '../components/HelpCard';
import {
  useGetHelpCategoriesQuery,
  useGetPopularArticlesQuery,
  useGetFeaturedFaqsQuery,
  useGetFaqStatisticsQuery
} from '../../../services/helpApi';
import trending_icon from '../../../assets/icons/trending_icon.png';
import faq_icon from '../../../assets/icons/faq_icon.png';
import arrow_right from '../../../assets/icons/dropdown_arrow_icon.svg';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

interface ModuleType {
  id: string;
  name: string;
  icon: string;
}

export default function HelpDashboard() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState('');

  const { data: categoriesData, isLoading: categoriesLoading } = useGetHelpCategoriesQuery({
    parent_only: true,
    is_active: true,
    module: selectedModule || undefined
  });

  const { data: popularData, isLoading: popularLoading } = useGetPopularArticlesQuery({ limit: 6 });
  const { data: featuredData, isLoading: featuredLoading } = useGetFeaturedFaqsQuery();
  const { data: statsData, isLoading: statsLoading } = useGetFaqStatisticsQuery();

  const isLoading = categoriesLoading || popularLoading || featuredLoading || statsLoading;

  // Extract data safely
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const popularArticles = Array.isArray(popularData?.data) ? popularData.data :
    Array.isArray(popularData) ? popularData : [];
  const featuredFaqs = Array.isArray(featuredData?.data) ? featuredData.data :
    Array.isArray(featuredData) ? featuredData : [];
  const stats = statsData?.data || {};

  // Get real stats from API - show 0 if not available
  const totalArticles = stats.total_articles ?? 0;
  const totalFaqs = stats.total_faqs ?? 0;
  const avgHelpfulness = stats.avg_helpfulness ?? 0;
  const todayViews = stats.today_views ?? 0;

  const modules: ModuleType[] = [
    { id: 'General', name: 'General', icon: '📋' },
    { id: 'User Management', name: 'User Management', icon: '👥' },
    { id: 'POS', name: 'Point of Sale', icon: '🛒' },
    { id: 'Accounting', name: 'Accounting', icon: '💰' },
    { id: 'Inventory', name: 'Inventory', icon: '📦' },
    { id: 'HR', name: 'Human Resources', icon: '👔' },
  ];

  const quickStats = [
    { label: 'Total Articles', value: totalArticles, icon: '📄' },
    { label: 'Total FAQs', value: totalFaqs, icon: '❓' },
    // { label: 'Helpfulness', value: `${avgHelpfulness}%`, icon: '👍' },
    // { label: 'Today\'s Views', value: todayViews.toLocaleString(), icon: '👁️' },
  ];

  if (isLoading) {
    return (
      <HelpLayout showSearch={false}>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </HelpLayout>
    );
  }

  return (
    <HelpLayout showSearch={false}>
      <div className="space-y-8">
        {/* Hero Section with Search */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-3">How can we help you today?</h1>
          <p className="text-blue-100 mb-6">Search our knowledge base or browse by category</p>
          <div className="max-w-2xl">
            <HelpSearchBar />
          </div>
        </div>

        {/* Quick Stats - Real data from API */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Module Quick Access */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Browse by Module</h2>
            <button
              onClick={() => navigate(`${basePath}/help/browse`)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              View All <img src={arrow_right} alt="" className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {modules.map(module => (
              <button
                key={module.id}
                onClick={() => {
                  setSelectedModule(module.id);
                  navigate(`${basePath}/help/module/${module.id}`);
                }}
                className="bg-white rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all text-center group"
              >
                <div className="text-3xl mb-2">{module.icon}</div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  {module.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Popular Categories</h2>
            <button
              onClick={() => navigate(`${basePath}/help/browse?tab=categories`)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              All Categories <img src={arrow_right} alt="" className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.slice(0, 6).map(category => (
              <HelpCard key={category.id} type="category" data={category} />
            ))}
            {categories.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No categories found
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Popular Articles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img src={trending_icon} alt="" className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Popular Articles</h3>
              </div>
              <button
                onClick={() => navigate(`${basePath}/help/browse?tab=articles`)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {popularArticles.map(article => (
                <HelpCard key={article.id} type="article" data={article} variant="compact" />
              ))}
              {popularArticles.length === 0 && (
                <p className="text-center text-gray-500 py-4">No popular articles found</p>
              )}
            </div>
          </div>

          {/* Featured FAQs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img src={faq_icon} alt="" className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Featured FAQs</h3>
              </div>
              <button
                onClick={() => navigate(`${basePath}/help/browse?tab=faqs`)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {featuredFaqs.map(faq => (
                <HelpCard key={faq.id} type="faq" data={faq} variant="compact" />
              ))}
              {featuredFaqs.length === 0 && (
                <p className="text-center text-gray-500 py-4">No featured FAQs found</p>
              )}
            </div>
          </div>
        </div>

        {/* Need More Help */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Still need help?</h3>
              <p className="text-gray-600">Can't find what you're looking for? Contact our support team.</p>
            </div>
            <button className="mt-4 md:mt-0 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </HelpLayout>
  );
}