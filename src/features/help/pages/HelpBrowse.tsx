// src/features/help/pages/HelpBrowse.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setActiveTab, setFilters, resetFilters } from '../helpSlice';
import {
  useGetHelpCategoriesQuery,
  useGetArticlesQuery,
  useGetFaqsQuery
} from '../../../services/helpApi';
import HelpLayout from '../components/HelpLayout';
import HelpSidebar from '../components/HelpSidebar';
import HelpTabs from '../components/HelpTabs';
import HelpFilters from '../components/HelpFilters';
import HelpBreadcrumb from '../components/HelpBreadcrumb';
import HelpCard from '../components/HelpCard';
import type { RootState } from '../../../app/store';

type TabType = 'categories' | 'articles' | 'faqs' | 'saved';

// Skeleton loader component for cards
const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
    <div className="flex items-center">
      <div className="w-3 h-3 bg-gray-200 rounded-full mr-1" />
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </div>
  </div>
);

// Compact skeleton for articles/faqs
const CompactSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-5 h-5 bg-gray-200 rounded" />
      <div className="space-y-1">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="w-4 h-4 bg-gray-200 rounded" />
  </div>
);

export default function HelpBrowse() {
  const dispatch = useAppDispatch();
  const { activeTab, filters } = useAppSelector((state: RootState) => state.help);
  const { categoryId, module: moduleParam } = useParams();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['categories', 'articles', 'faqs', 'saved'].includes(tabParam)) {
      if (activeTab !== tabParam) {
        setIsTabChanging(true);
        dispatch(setActiveTab(tabParam));
        setTimeout(() => setIsTabChanging(false), 300);
      }
    } else if (!activeTab) {
      dispatch(setActiveTab('articles'));
    }

    if (categoryId) {
      dispatch(setFilters({ category_id: Number(categoryId) }));
    }

    if (moduleParam) {
      dispatch(setFilters({ module: moduleParam }));
    }
  }, [categoryId, moduleParam, searchParams, activeTab, dispatch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    dispatch(setFilters({ page: 1 }));
  }, [filters.module, filters.category_id, filters.difficulty, filters.article_type, filters.search, dispatch]);

  // Update page in filters
  useEffect(() => {
    dispatch(setFilters({ page: currentPage }));
  }, [currentPage, dispatch]);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    if (activeTab === tab) return;
    setIsTabChanging(true);
    dispatch(setActiveTab(tab as TabType));
    setCurrentPage(1);
    dispatch(resetFilters());
    setTimeout(() => setIsTabChanging(false), 300);
  }, [activeTab, dispatch]);

  // Queries with proper skip logic
  const { data: categoriesData, isLoading: categoriesLoading, isFetching: categoriesFetching } = useGetHelpCategoriesQuery(
    {
      module: filters.module || undefined,
      is_active: 1
    },
    { skip: activeTab !== 'categories' }
  );

  const { data: articlesData, isLoading: articlesLoading, isFetching: articlesFetching } = useGetArticlesQuery(
    {
      category_id: filters.category_id || undefined,
      module: filters.module || undefined,
      difficulty_level: filters.difficulty || undefined,
      article_type: filters.article_type || undefined,
      search: filters.search || undefined,
      page: currentPage,
      per_page: filters.per_page || 10
    },
    { skip: activeTab !== 'articles' }
  );

  const { data: faqsData, isLoading: faqsLoading, isFetching: faqsFetching } = useGetFaqsQuery(
    {
      category_id: filters.category_id || undefined,
      module: filters.module || undefined,
      search: filters.search || undefined,
      page: currentPage,
      per_page: filters.per_page || 10
    },
    { skip: activeTab !== 'faqs' }
  );

  // Extract data safely
  const categories = useMemo(() => {
    return Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  }, [categoriesData]);

  const articles = useMemo(() => {
    return Array.isArray(articlesData?.data?.data) ? articlesData.data.data :
      Array.isArray(articlesData?.data) ? articlesData.data : [];
  }, [articlesData]);

  const faqs = useMemo(() => {
    return Array.isArray(faqsData?.data?.data) ? faqsData.data.data :
      Array.isArray(faqsData?.data) ? faqsData.data : [];
  }, [faqsData]);

  // Get total counts for pagination
  const articlesTotal = articlesData?.total || articlesData?.data?.total || 0;
  const faqsTotal = faqsData?.total || faqsData?.data?.total || 0;

  // Determine loading state
  const isLoading = useMemo(() => {
    if (isTabChanging) return true;
    switch (activeTab) {
      case 'categories': return categoriesLoading || categoriesFetching;
      case 'articles': return articlesLoading || articlesFetching;
      case 'faqs': return faqsLoading || faqsFetching;
      default: return false;
    }
  }, [activeTab, isTabChanging, categoriesLoading, categoriesFetching, articlesLoading, articlesFetching, faqsLoading, faqsFetching]);

  // Render skeletons based on active tab
  const renderSkeletons = () => {
    if (activeTab === 'categories') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <CompactSkeleton key={i} />)}
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (isLoading) {
      return renderSkeletons();
    }

    switch (activeTab) {
      case 'categories':
        if (categories.length === 0) {
          return (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => (
              <HelpCard key={category.id} type="category" data={category} />
            ))}
          </div>
        );

      case 'articles':
        if (articles.length === 0) {
          return (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No articles found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {articles.map(article => (
              <HelpCard key={article.id} type="article" data={article} variant="compact" />
            ))}
          </div>
        );

      case 'faqs':
        if (faqs.length === 0) {
          return (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No FAQs found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {faqs.map(faq => (
              <HelpCard key={faq.id} type="faq" data={faq} variant="compact" />
            ))}
          </div>
        );

      case 'saved':
        return (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-lg font-medium">No saved items</p>
            <p className="text-sm mt-1">Save articles and FAQs to access them quickly</p>
          </div>
        );

      default:
        return null;
    }
  };

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; path?: string }[] = [];
    if (filters.module) {
      items.push({ label: filters.module });
    }
    if (filters.category_id && categories.length > 0) {
      const category = categories.find(c => c.id === filters.category_id);
      if (category) {
        items.push({ label: category.category_name });
      }
    }
    return items;
  }, [filters.module, filters.category_id, categories]);

  // Pagination component
  const renderPagination = () => {
    const total = activeTab === 'articles' ? articlesTotal : faqsTotal;
    const perPage = filters.per_page || 10;
    const totalPages = Math.ceil(total / perPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500 order-2 sm:order-1">
          Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, total)} of {total} items
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <HelpLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="lg:w-64 flex-shrink-0">
          <HelpSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb - Responsive */}
          <div className="mb-4 overflow-x-auto">
            <HelpBreadcrumb items={breadcrumbItems} />
          </div>

          {/* Tabs - Responsive with horizontal scroll on mobile */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <HelpTabs
              activeTab={activeTab || 'articles'}
              onTabChange={handleTabChange}
            />
          </div>

          {/* Filters - Only show for articles and faqs */}
          {(activeTab === 'articles' || activeTab === 'faqs') && (
            <div className="mt-4">
              <HelpFilters />
            </div>
          )}

          {/* Content with loading state */}
          <div className="mt-6">
            {renderContent()}
          </div>

          {/* Pagination */}
          {(activeTab === 'articles' || activeTab === 'faqs') && renderPagination()}
        </div>
      </div>
    </HelpLayout>
  );
}