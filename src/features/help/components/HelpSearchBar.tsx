// src/features/help/components/HelpSearchBar.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchArticlesQuery } from '../../../services/helpApi';
import search_icon from '../../../assets/icons/search_icon.svg';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

export default function HelpSearchBar() {
         const { user } = useAppSelector((state: RootState) => state.auth);
         const isSuperAdmin = user?.role?.role_name === 'Super Admin';
            const basePath = isSuperAdmin ? '/admin' : '';
    

            
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data, isLoading } = useSearchArticlesQuery(
    { query, per_page: 5 },
    { skip: query.length < 3 }
  );

  const suggestions = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${basePath}/help/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <img
            src={search_icon}
            alt=""
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search for articles, FAQs, tutorials..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </form>

      {showSuggestions && query.length >= 3 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : (
            <div>
              {suggestions.map((article) => (
                <button
                  key={article.id}
                  onClick={() => {
                    navigate(`${basePath}/help/article/${article.slug}`);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{article.title}</div>
                  <div className="text-sm text-gray-500 truncate">{article.summary}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {article.article_type}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{article.difficulty_level}</span>
                  </div>
                </button>
              ))}
              <div className="p-2 border-t">
                <button
                  onClick={handleSearch}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
                >
                  See all results for "{query}"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}