// src/features/help/components/HelpViewer.tsx
import { useEffect } from 'react';
// import ReactMarkdown from 'react-markdown';
import { useAppDispatch } from '../../../app/hooks';
import { openFeedbackModal } from '../helpSlice';
import type { HelpArticle, HelpFaq } from '../../../services/helpApi';

import view_icon from '../../../assets/icons/view-icon.png';
// import feedback_icon from '../../../assets/icons/feedback.svg';
// import bookmark_icon from '../../../assets/icons/bookmark.svg';

interface HelpViewerProps {
  type: 'article' | 'faq';
  data: HelpArticle | HelpFaq;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function HelpViewer({ type, data, onSave }: HelpViewerProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Track view
    // This would call an API to increment view count
  }, [data.id]);

  const handleFeedback = () => {
    dispatch(openFeedbackModal({
      id: data.id,
      type,
      title: type === 'article' 
        ? (data as HelpArticle).title 
        : (data as HelpFaq).question
    }));
  };

  if (type === 'faq') {
    const faq = data as HelpFaq;
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{faq.question}</h1>
          
          <div className="prose max-w-none mb-6">
             {faq.answer} 
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <img src={view_icon} alt="" className="w-4 h-4 mr-1" />
                {faq.view_count || 0} views
              </span>
              <span>
                {faq.helpfulness_ratio || 0}% found this helpful
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onSave}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {/* <img src={bookmark_icon} alt="Save" className="w-4 h-4" /> */}
              </button>
              <button
                onClick={handleFeedback}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {/* <img src={feedback_icon} alt="" className="w-4 h-4" /> */}
                <span>Was this helpful?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const article = data as HelpArticle;
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {article.featured_image && (
        <img 
          src={article.featured_image} 
          alt={article.title}
          className="w-full h-64 object-cover"
        />
      )}

      <div className="p-8">
        <div className="flex items-center space-x-3 mb-4">
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {article.article_type}
          </span>
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {article.difficulty_level}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
        
        {article.summary && (
          <p className="text-lg text-gray-600 mb-6 pb-6 border-b border-gray-200">
            {article.summary}
          </p>
        )}

        <div className="prose max-w-none">
           {article.content} 
        </div>

        {article.video_url && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Video Tutorial</h3>
            <iframe
              src={article.video_url}
              className="w-full aspect-video rounded-lg"
              allowFullScreen
            />
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center">
                <img src={view_icon} alt="" className="w-4 h-4 mr-1" />
                {article.view_count || 0} views
              </span>
              <span>
                {article.helpfulness_ratio || 0}% found this helpful
              </span>
              <span>
                Last updated: {new Date(article.published_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onSave}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {/* <img src={bookmark_icon} alt="Save" className="w-4 h-4" /> */}
              </button>
              <button
                onClick={handleFeedback}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {/* <img src={feedback_icon} alt="" className="w-4 h-4" /> */}
                <span>Was this helpful?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}