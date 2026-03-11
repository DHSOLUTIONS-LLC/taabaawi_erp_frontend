// src/features/help/pages/HelpSearch.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchArticlesQuery, useGetFaqsQuery } from '../../../services/helpApi';
import HelpLayout from '../components/HelpLayout';
import HelpCard from '../components/HelpCard';
// import HelpPagination from '../components/HelpPagination';

import search_icon from '../../../assets/icons/search_icon.svg';
import filter_icon from '../../../assets/icons/filter.svg';

export default function HelpSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [filters, setFilters] = useState({
    module: searchParams.get('module') || '',
    type: searchParams.get('type') || 'all',
    sort: searchParams.get('sort') || 'relevance'
  });
  
  const [currentPage, _setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles');

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.module) params.set('module', filters.module);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    setSearchParams(params);
  }, [query, filters]);

  // Search articles
  const { data: articlesData, isLoading: articlesLoading } = useSearchArticlesQuery(
    { 
      query, 
      module: filters.module || undefined,
      page: currentPage,
      per_page: 10
    },
    { skip: !query || activeTab !== 'articles' }
  );

  // Search FAQs
  const { data: faqsData, isLoading: faqsLoading } = useGetFaqsQuery(
    {
      search: query,
      module: filters.module || undefined,
      page: currentPage,
      per_page: 10
    },
    { skip: !query || activeTab !== 'faqs' }
  );

  const articles = Array.isArray(articlesData?.data) ? articlesData.data : [];
const faqs = Array.isArray(faqsData?.data) ? faqsData.data : [];
const totalArticles = (articlesData as any)?.total || articles.length;
const totalFaqs = (faqsData as any)?.total || faqs.length;

  const isLoading = (activeTab === 'articles' && articlesLoading) ||
                   (activeTab === 'faqs' && faqsLoading);

  const modules = [
    'General', 'User Management', 'POS', 'Accounting', 'Inventory', 'HR'
  ];

  return (
    <HelpLayout>
      <div className="max-w-5xl mx-auto">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          <p className="text-gray-600">
            {query ? `Showing results for "${query}"` : 'Enter a search term'}
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newQuery = formData.get('search') as string;
            if (newQuery) {
              setSearchParams({ q: newQuery });
            }
          }}>
            <div className="relative">
              <img
                src={search_icon}
                alt=""
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                name="search"
                defaultValue={query}
                placeholder="Search articles, FAQs, tutorials..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {query && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <img src={filter_icon} alt="" className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                <select
                  value={filters.module}
                  onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Modules</option>
                  {modules.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Results Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab('articles')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'articles'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Articles ({totalArticles})
                </button>
                <button
                  onClick={() => setActiveTab('faqs')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'faqs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  FAQs ({totalFaqs})
                </button>
              </nav>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                {activeTab === 'articles' && (
                  <div className="space-y-3">
                    {articles.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No articles found matching your search.
                      </div>
                    ) : (
                      articles.map(article => (
                        <HelpCard key={article.id} type="article" data={article} variant="compact" />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="space-y-3">
                    {faqs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No FAQs found matching your search.
                      </div>
                    ) : (
                      faqs.map(faq => (
                        <HelpCard key={faq.id} type="faq" data={faq} variant="compact" />
                      ))
                    )}
                  </div>
                )}

                {/* Pagination */}
                {((activeTab === 'articles' && totalArticles > 10) ||
                  (activeTab === 'faqs' && totalFaqs > 10)) && (
                  <div className="mt-6">
                    {/* <HelpPagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(
                        (activeTab === 'articles' ? totalArticles : totalFaqs) / 10
                      )}
                      onPageChange={setCurrentPage}
                    /> */}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </HelpLayout>
  );
}