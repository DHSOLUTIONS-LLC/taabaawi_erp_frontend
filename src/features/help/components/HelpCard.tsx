// src/features/help/components/HelpCard.tsx
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { saveItem, unsaveItem } from '../helpSlice';
import type { HelpCategory, HelpArticle, HelpFaq } from '../../../services/helpApi';

// import bookmark_icon from '../../../assets/icons/bookmark.svg';
// import bookmark_filled_icon from '../../../assets/icons/bookmark_filled.svg';
import view_icon from '../../../assets/icons/view-icon.png';
import help_icon from '../../../assets/icons/hr_icon.svg';
import type { RootState } from '../../../app/store';

interface HelpCardProps {
  type: 'category' | 'article' | 'faq';
  data: HelpCategory | HelpArticle | HelpFaq;
  variant?: 'default' | 'compact';
  onSelect?: () => void;
}

export default function HelpCard({ type, data, variant = 'default', onSelect }: HelpCardProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { savedItems } = useAppSelector((state) => state.help);

  const isSaved = savedItems.some(
    item => item.id === data.id && item.type === type
  );

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      switch (type) {
        case 'category':
          navigate(`${basePath}/help/category/${data.id}`);
          break;
        case 'article':
          navigate(`${basePath}/help/article/${data.slug || data.id}`);
          break;
        case 'faq':
          navigate(`${basePath}/help/faq/${data.id}`);
          break;
      }
    }
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      dispatch(unsaveItem({ id: data.id, type: type as 'article' | 'faq', title: getTitle() }));
    } else {
      dispatch(saveItem({
        id: data.id,
        type,
        title: getTitle()
      }));
    }
  };

  const getTitle = (): string => {
    switch (type) {
      case 'category':
        return (data as HelpCategory).category_name;
      case 'article':
        return (data as HelpArticle).title;
      case 'faq':
        return (data as HelpFaq).question;
    }
  };

  const getDescription = (): string => {
    switch (type) {
      case 'category':
        return (data as HelpCategory).description || '';
      case 'article':
        return (data as HelpArticle).summary || '';
      case 'faq':
        return (data as HelpFaq).answer.substring(0, 150) + '...';
    }
  };

  const getMetaInfo = () => {
    switch (type) {
      case 'category':
        const cat = data as HelpCategory;
        return `${cat.article_count || 0} articles • ${cat.faq_count || 0} FAQs`;
      case 'article':
        const art = data as HelpArticle;
        return `${art.view_count || 0} views • ${art.helpfulness_ratio || 0}% helpful`;
      case 'faq':
        const faq = data as HelpFaq;
        return `${faq.view_count || 0} views • ${faq.helpfulness_ratio || 0}% helpful`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'category':
        return (data as HelpCategory).icon || help_icon;
      case 'article':
        return (data as HelpArticle).featured_image || help_icon;
      case 'faq':
        return help_icon;
    }
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
      >
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <img src={getIcon()} alt="" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{getTitle()}</h4>
            <p className="text-xs text-gray-500 truncate">{getMetaInfo()}</p>
          </div>
        </div>
        <button
          onClick={handleSaveToggle}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
        >
          {/* <img 
            src={isSaved ? bookmark_filled_icon : bookmark_icon} 
            alt={isSaved ? 'Saved' : 'Save'} 
            className="w-3 h-3 sm:w-4 sm:h-4" 
          /> */}
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <img src={getIcon()} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{getTitle()}</h3>
        </div>
        <button
          onClick={handleSaveToggle}
          className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0"
        >
          {/* <img 
            src={isSaved ? bookmark_filled_icon : bookmark_icon} 
            alt={isSaved ? 'Saved' : 'Save'} 
            className="w-3 h-3 sm:w-4 sm:h-4" 
          /> */}
        </button>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
        {getDescription()}
      </p>

      <div className="flex items-center text-xs text-gray-500">
        <img src={view_icon} alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
        <span className="text-xs">{getMetaInfo()}</span>
      </div>
    </div>
  );
}