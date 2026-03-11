// src/features/help/pages/HelpDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setCurrentItem, saveItem, unsaveItem } from '../helpSlice';
import {
  useGetArticleBySlugQuery,
  useGetArticleByIdQuery,
  useGetFaqByIdQuery,
  useGetRelatedArticlesQuery
} from '../../../services/helpApi';
import HelpLayout from '../components/HelpLayout';
import HelpViewer from '../components/HelpViewer';
import HelpCard from '../components/HelpCard';
import HelpBreadcrumb from '../components/HelpBreadcrumb';
import HelpFeedback from '../components/HelpFeedback';

import arrow_left from '../../../assets/icons/dashed_arrow.svg';
import share_icon from '../../../assets/icons/refresh_icon.png';
import print_icon from '../../../assets/icons/print_icon.png';
import download_icon from '../../../assets/icons/download_icon.png';

export default function HelpDetail() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { savedItems } = useAppSelector(state => state.help);
  
  const [contentType, setContentType] = useState<'article' | 'faq'>('article');

  // Determine if we're viewing article or FAQ
  useEffect(() => {
    if (slug) {
      setContentType('article');
      dispatch(setCurrentItem({ id: 0, type: 'article' }));
    } else if (id) {
      setContentType('faq');
      dispatch(setCurrentItem({ id: Number(id), type: 'faq' }));
    }
  }, [slug, id]);

  // Fetch data
  const { 
    data: articleData, 
    isLoading: articleLoading,
    error: articleError 
  } = useGetArticleBySlugQuery(slug || '', { 
    skip: !slug || contentType !== 'article' 
  });

  const { 
    data: articleByIdData,
    isLoading: articleByIdLoading 
  } = useGetArticleByIdQuery(Number(id), { 
    skip: !id || contentType !== 'article' 
  });

  const { 
    data: faqData, 
    isLoading: faqLoading,
    error: faqError 
  } = useGetFaqByIdQuery(Number(id), { 
    skip: !id || contentType !== 'faq' 
  });

  // Get related articles
  const articleId = articleData?.data?.id || articleByIdData?.data?.id;
  const { data: relatedData } = useGetRelatedArticlesQuery(articleId!, {
    skip: !articleId || contentType !== 'article'
  });

  const article = articleData?.data || articleByIdData?.data;
  const faq = faqData?.data;
  const relatedArticles = relatedData?.data || [];

  const isLoading = articleLoading || articleByIdLoading || faqLoading;
  const error = articleError || faqError;

  const isSaved = savedItems.some(
    item => item.id === (article?.id || faq?.id) && 
    item.type === contentType
  );

  const handleSaveToggle = () => {
    if (!article && !faq) return;

    if (isSaved) {
      dispatch(unsaveItem({ 
        id: article?.id as any || faq?.id, 
        type: contentType 
      }));
    } else {
      dispatch(saveItem({ 
        id: article?.id as any || faq?.id, 
        type: contentType,
        title: article?.title || faq?.question || ''
      }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title || faq?.question,
        text: article?.summary || faq?.answer.substring(0, 100),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = article || faq;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article?.slug || faq?.id}.json`;
    a.click();
  };

  // Breadcrumb items
  const breadcrumbItems = [
    ...(contentType === 'article' && article ? [
      { label: 'Articles', path: '/help/browse?tab=articles' },
      { label: article.category?.category_name || 'Category', 
        path: `/help/category/${article.category_id}` },
      { label: article.title }
    ] : []),
    ...(contentType === 'faq' && faq ? [
      { label: 'FAQs', path: '/help/browse?tab=faqs' },
      { label: faq.module || 'General' },
      { label: faq.question.substring(0, 50) + '...' }
    ] : [])
  ];

  if (isLoading) {
    return (
      <HelpLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </HelpLayout>
    );
  }

  if (error || (!article && !faq)) {
    return (
      <HelpLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-6">The article or FAQ you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/help')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Help Center
          </button>
        </div>
      </HelpLayout>
    );
  }

  return (
    <HelpLayout>
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <img src={arrow_left} alt="" className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Share"
            >
              <img src={share_icon} alt="Share" className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Print"
            >
              <img src={print_icon} alt="Print" className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Download"
            >
              <img src={download_icon} alt="Download" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <HelpBreadcrumb items={breadcrumbItems} />

        {/* Main Content */}
        {contentType === 'article' && article && (
          <HelpViewer
            type="article"
            data={article}
            onSave={handleSaveToggle}
            isSaved={isSaved}
          />
        )}

        {contentType === 'faq' && faq && (
          <HelpViewer
            type="faq"
            data={faq}
            onSave={handleSaveToggle}
            isSaved={isSaved}
          />
        )}

        {/* Related Articles */}
        {contentType === 'article' && relatedArticles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map(related => (
                <HelpCard key={related.id} type="article" data={related} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </div>

      <HelpFeedback />
    </HelpLayout>
  );
}