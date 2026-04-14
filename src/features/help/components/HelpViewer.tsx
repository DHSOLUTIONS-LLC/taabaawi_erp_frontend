// src/features/help/components/HelpViewer.tsx
import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { openFeedbackModal } from '../helpSlice';
import type { HelpArticle, HelpFaq } from '../../../services/helpApi';
import view_icon from '../../../assets/icons/view-icon.png';

interface HelpViewerProps {
  type: 'article' | 'faq';
  data: HelpArticle | HelpFaq;
  onSave?: () => void;
  isSaved?: boolean;
}

// Helper function to strip HTML tags for preview
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

// Helper to get YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/v\/([^/?]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

// Helper to get Vimeo video ID
const getVimeoVideoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

// Video Player Component
const VideoPlayer = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);
  const videoId = getYouTubeVideoId(url) || getVimeoVideoId(url);

  if (!videoId || error) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 sm:p-8 text-center">
        <p className="text-xs sm:text-sm text-gray-500">Video not available. Please check the URL.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs sm:text-sm mt-2 inline-block">
          Open video in new tab
        </a>
      </div>
    );
  }

  const isYouTube = url.includes('youtube') || url.includes('youtu.be');
  const embedUrl = isYouTube
    ? `https://www.youtube.com/embed/${videoId}`
    : `https://player.vimeo.com/video/${videoId}`;

  return (
    <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        title="Video Tutorial"
        className="absolute top-0 left-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setError(true)}
      />
    </div>
  );
};

// Rich Text Content Renderer with proper HTML
const RichContent = ({ content }: { content: string }) => {
  if (!content) return null;

  return (
    <div
      className="prose prose-sm sm:prose lg:prose-lg max-w-none 
        prose-headings:font-bold prose-headings:text-gray-900 
        prose-h1:text-xl sm:prose-h1:text-2xl prose-h2:text-lg sm:prose-h2:text-xl 
        prose-p:text-xs sm:prose-p:text-sm prose-p:leading-relaxed
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-ul:list-disc prose-ol:list-decimal prose-li:text-xs sm:prose-li:text-sm
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
        prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:p-3 sm:prose-pre:p-4 prose-pre:rounded-lg
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-3 sm:prose-blockquote:pl-4 prose-blockquote:italic
        prose-img:rounded-lg prose-img:shadow-md
        [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-x-auto [&_table]:block
        [&_th]:border [&_th]:border-gray-300 [&_th]:p-1 sm:[&_th]:p-2 [&_th]:bg-gray-100 [&_th]:text-xs
        [&_td]:border [&_td]:border-gray-300 [&_td]:p-1 sm:[&_td]:p-2 [&_td]:text-xs"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default function HelpViewer({ type, data, onSave, isSaved }: HelpViewerProps) {
  const dispatch = useAppDispatch();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    // Track view - you can implement API call here
    // incrementViewCount(data.id, type);
  }, [data.id, type]);

  const handleFeedback = () => {
    dispatch(openFeedbackModal({
      id: data.id,
      type,
      title: type === 'article'
        ? (data as HelpArticle).title
        : (data as HelpFaq).question
    }));
  };

  // Helper for safe number formatting
  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // FAQ View
  if (type === 'faq') {
    const faq = data as HelpFaq;
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
            {faq.question}
          </h1>

          <div className="prose max-w-none mb-4 sm:mb-6 overflow-x-auto">
            <RichContent content={faq.answer} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center whitespace-nowrap">
                <img src={view_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {formatNumber(faq.view_count)} views
              </span>
              <span className="whitespace-nowrap">
                {faq.helpfulness_ratio || 0}% found this helpful
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onSave && (
                <button
                  onClick={onSave}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${isSaved
                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  title={isSaved ? 'Saved' : 'Save for later'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleFeedback}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="hidden sm:inline">Was this helpful?</span>
                <span className="sm:hidden">Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Article View
  const article = data as HelpArticle;
  const imageUrl = article.featured_image?.startsWith('http')
    ? article.featured_image
    : article.featured_image
      ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/storage/${article.featured_image}`
      : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Featured Image with Skeleton Loader */}
      {imageUrl && (
        <div className="relative w-full bg-gray-100">
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <img
            src={imageUrl}
            alt={article.image_alt_text || article.title}
            className={`w-full max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[400px] object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              setIsImageLoaded(true);
            }}
          />
        </div>
      )}

      <div className="p-4 sm:p-6 md:p-8">
        {/* Article Type Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {article.article_type && (
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {article.article_type}
            </span>
          )}
          {article.difficulty_level && (
            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${article.difficulty_level === 'Beginner' ? 'bg-green-100 text-green-700' :
              article.difficulty_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
              {article.difficulty_level}
            </span>
          )}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
          {article.title}
        </h1>

        {/* Summary/Excerpt */}
        {article.summary && (
          <div className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200 italic">
            {article.summary}
          </div>
        )}

        {/* Main Content */}
        <div className="overflow-x-auto">
          <RichContent content={article.content} />
        </div>

        {/* Video Section */}
        {article.video_url && (
          <div className="mt-6 sm:mt-8">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 15l5-3-5-3v6zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
              Video Tutorial
            </h3>
            <VideoPlayer url={article.video_url} />
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center whitespace-nowrap">
                <img src={view_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {formatNumber(article.view_count)} views
              </span>
              <span className="whitespace-nowrap">
                {article.helpfulness_ratio || 0}% found this helpful
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Updated: {new Date(article.published_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onSave && (
                <button
                  onClick={onSave}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${isSaved
                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  title={isSaved ? 'Saved' : 'Save for later'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleFeedback}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="hidden sm:inline">Was this helpful?</span>
                <span className="sm:hidden">Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}