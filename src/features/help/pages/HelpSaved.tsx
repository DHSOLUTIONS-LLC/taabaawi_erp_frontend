// src/features/help/pages/HelpSaved.tsx
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { unsaveItem, clearSavedItems } from '../helpSlice';
import { useGetArticlesByIdsQuery, useGetFaqsByIdsQuery } from '../../../services/helpApi';
import HelpLayout from '../components/HelpLayout';
import HelpCard from '../components/HelpCard';
import HelpTabs from '../components/HelpTabs';
import delete_icon from '../../../assets/icons/delete-icon.png';

export default function HelpSaved() {
  const dispatch = useAppDispatch();
  const { savedItems } = useAppSelector(state => state.help);
  const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles');

  const articleIds = savedItems.filter(item => item.type === 'article').map(item => item.id);
  const faqIds = savedItems.filter(item => item.type === 'faq').map(item => item.id);

  // Batch fetch saved articles
  const { data: articlesData, isLoading: articlesLoading } = useGetArticlesByIdsQuery(articleIds, {
    skip: articleIds.length === 0,
  });

  // Batch fetch saved FAQs
  const { data: faqsData, isLoading: faqsLoading } = useGetFaqsByIdsQuery(faqIds, {
    skip: faqIds.length === 0,
  });

  const articles = articlesData?.data || [];
  const faqs = faqsData?.data || [];

  const isLoading = (activeTab === 'articles' && articlesLoading) ||
    (activeTab === 'faqs' && faqsLoading);

  const handleRemoveAll = () => {
    if (window.confirm('Are you sure you want to remove all saved items?')) {
      dispatch(clearSavedItems());
    }
  };

  const handleRemoveItem = (id: number, type: 'article' | 'faq') => {
    dispatch(unsaveItem({ id, type }));
  };

  if (savedItems.length === 0) {
    return (
      <HelpLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No saved items yet</h3>
            <p className="text-gray-500 mb-4">Save articles and FAQs to access them quickly</p>
            <button
              onClick={() => window.location.href = '/help/browse'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Help Center
            </button>
          </div>
        </div>
      </HelpLayout>
    );
  }

  return (
    <HelpLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
            <p className="text-sm text-gray-500 mt-1">
              {savedItems.length} saved item(s)
            </p>
          </div>

          {savedItems.length > 0 && (
            <button
              onClick={handleRemoveAll}
              className="flex items-center px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <img src={delete_icon} alt="" className="w-4 h-4 mr-2" />
              Remove All
            </button>
          )}
        </div>

        {/* Tabs */}
        <HelpTabs
          tabs={[
            { id: 'articles', label: 'Articles', count: articleIds.length },
            { id: 'faqs', label: 'FAQs', count: faqIds.length }
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />

        {/* Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'articles' && articles.map((article: any) => (
                <div key={`article-${article.id}`} className="relative group">
                  <HelpCard type="article" data={article} variant="compact" />
                  <button
                    onClick={() => handleRemoveItem(article.id, 'article')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-opacity"
                    title="Remove"
                  >
                    <img src={delete_icon} alt="Remove" className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {activeTab === 'faqs' && faqs.map((faq: any) => (
                <div key={`faq-${faq.id}`} className="relative group">
                  <HelpCard type="faq" data={faq} variant="compact" />
                  <button
                    onClick={() => handleRemoveItem(faq.id, 'faq')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-opacity"
                    title="Remove"
                  >
                    <img src={delete_icon} alt="Remove" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HelpLayout>
  );
}