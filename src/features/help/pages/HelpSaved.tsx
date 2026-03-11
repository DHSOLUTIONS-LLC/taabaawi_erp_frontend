// src/features/help/pages/HelpSaved.tsx
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { unsaveItem, clearSavedItems } from '../helpSlice';
import { useGetArticleByIdQuery, useGetFaqByIdQuery } from '../../../services/helpApi';
import HelpLayout from '../components/HelpLayout';
import HelpCard from '../components/HelpCard';
import HelpTabs from '../components/HelpTabs';

// import bookmark_filled_icon from '../../../assets/icons/bookmark_filled.svg';
import delete_icon from '../../../assets/icons/delete-icon.png';

export default function HelpSaved() {
  const dispatch = useAppDispatch();
  const { savedItems } = useAppSelector(state => state.help);
  const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles');

  const articleItems = savedItems.filter(item => item.type === 'article');
  const faqItems = savedItems.filter(item => item.type === 'faq');

  // Fetch saved articles
  const { data: articles, isLoading: articlesLoading } = useGetArticleByIdQuery(0, {
    skip: articleItems.length === 0,
    // This is a workaround - in real app, you'd have a batch endpoint
  });

  // Fetch saved FAQs
  const { data: faqs, isLoading: faqsLoading } = useGetFaqByIdQuery(0, {
    skip: faqItems.length === 0,
  });

  const isLoading = (activeTab === 'articles' && articlesLoading) ||
                   (activeTab === 'faqs' && faqsLoading);

  const handleRemoveAll = () => {
    if (window.confirm('Are you sure you want to remove all saved items?')) {
      dispatch(clearSavedItems());
    }
  };

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
            { id: 'articles', label: 'Articles', count: articleItems.length },
            { id: 'faqs', label: 'FAQs', count: faqItems.length }
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />

        {/* Content */}
        <div className="mt-6">
          {savedItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              {/* <img src={bookmark_filled_icon} alt="" className="w-12 h-12 mx-auto mb-3 opacity-30" /> */}
              <h3 className="text-lg font-medium text-gray-700 mb-2">No saved items yet</h3>
              <p className="text-gray-500 mb-4">Save articles and FAQs to access them quickly</p>
              <button
                onClick={() => window.location.href = '/help/browse'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Help Center
              </button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTab === 'articles' && articleItems.map(item => (
                    <div key={`article-${item.id}`} className="relative group">
                      <HelpCard type="article" data={{ id: item.id, title: item.title } as any} variant="compact" />
                      <button
                        onClick={() => dispatch(unsaveItem({ id: item.id, type: 'article' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                        title="Remove"
                      >
                        <img src={delete_icon} alt="Remove" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {activeTab === 'faqs' && faqItems.map(item => (
                    <div key={`faq-${item.id}`} className="relative group">
                      <HelpCard type="faq" data={{ id: item.id, question: item.title } as any} variant="compact" />
                      <button
                        onClick={() => dispatch(unsaveItem({ id: item.id, type: 'faq' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                        title="Remove"
                      >
                        <img src={delete_icon} alt="Remove" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </HelpLayout>
  );
}