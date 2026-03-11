import React, { useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import SEOForm from '../components/seo/SEOForm';
import SitemapGenerator from '../components/seo/SitemapGenerator';
import SEOPreview from '../components/seo/SEOPreview';
import { useGetSeoForPageQuery } from '../../../services/seoApi';

type TabType = 'home' | 'about' | 'contact' | 'blog' | 'products' | 'sitemap';

const SEOPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedPage, setSelectedPage] = useState<string>('home');

  const { data: seoData, refetch } = useGetSeoForPageQuery(selectedPage);

  const seo = seoData?.data;

  const pages = [
    { id: 'home', label: 'Home Page', url: '/' },
    { id: 'about', label: 'About Us', url: '/about' },
    { id: 'contact', label: 'Contact', url: '/contact' },
    { id: 'blog', label: 'Blog', url: '/blog' },
    { id: 'products', label: 'Products', url: '/products' },
  ];

  const tabs = [
    { id: 'home', label: 'Home Page' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' },
    { id: 'blog', label: 'Blog' },
    { id: 'products', label: 'Products' },
    { id: 'sitemap', label: 'Sitemap' },
  ];

  const getPageUrl = (pageId: string): string => {
    const page = pages.find(p => p.id === pageId);
    return page ? `https://yourdomain.com${page.url}` : 'https://yourdomain.com';
  };

  const handlePageChange = (pageId: TabType) => {
    setActiveTab(pageId);
    if (pageId !== 'sitemap') {
      setSelectedPage(pageId);
    }
  };

  const handleSuccess = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Manager</h1>
          <p className="text-gray-600 mt-2">
            Manage SEO settings for your website pages and generate sitemaps
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handlePageChange(tab.id as TabType)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'sitemap' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sitemap Generator</h2>
            <SitemapGenerator />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                SEO Settings - {pages.find(p => p.id === activeTab)?.label}
              </h2>
              <SEOForm
                seo={seo || null}
                isGlobal
                pageName={activeTab}
                onSuccess={handleSuccess}
              />
            </div>

            {/* Right Column - Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Preview</h2>
              <SEOPreview
                seo={seo || null}
                pageUrl={getPageUrl(activeTab)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SEOPage;