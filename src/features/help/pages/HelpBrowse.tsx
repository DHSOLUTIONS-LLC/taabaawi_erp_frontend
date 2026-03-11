// src/features/help/pages/HelpBrowse.tsx
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setActiveTab, setFilters } from '../helpSlice';
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
// import HelpPagination from '../components/he';

export default function HelpBrowse() {
  const dispatch = useAppDispatch();
  const { activeTab, filters } = useAppSelector(state => state.help);
  const { categoryId, module: moduleParam } = useParams();
  const [searchParams] = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize from URL params and set default tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['categories', 'articles', 'faqs', 'saved'].includes(tab)) {
      dispatch(setActiveTab(tab as any));
    } else if (!activeTab) {
      // Set default tab if none is active
      dispatch(setActiveTab('articles'));
    }
    
    if (categoryId) {
      dispatch(setFilters({ category_id: Number(categoryId) }));
    }
    
    if (moduleParam) {
      dispatch(setFilters({ module: moduleParam }));
    }
  }, [categoryId, moduleParam, searchParams, activeTab, dispatch]);

  // Update page in filters
  useEffect(() => {
    dispatch(setFilters({ page: currentPage }));
  }, [currentPage, dispatch]);

  // Log current state for debugging
  console.log('Active Tab:', activeTab);
  console.log('Filters:', filters);

  // Queries
  const { data: categoriesData, isLoading: categoriesLoading } = useGetHelpCategoriesQuery(
    { 
      module: filters.module || undefined,
      is_active: 1 
    },
    { skip: activeTab !== 'categories' }
  );

  const { data: articlesData, isLoading: articlesLoading } = useGetArticlesQuery(
    { 
      category_id: filters.category_id || undefined,
      module: filters.module || undefined,
      difficulty_level: filters.difficulty || undefined,
      article_type: filters.article_type || undefined,
      search: filters.search || undefined,
      page: filters.page || 1,
      per_page: filters.per_page || 10
    },
    { skip: activeTab !== 'articles' }
  );

  const { data: faqsData, isLoading: faqsLoading } = useGetFaqsQuery(
    {
      category_id: filters.category_id || undefined,
      module: filters.module || undefined,
      search: filters.search || undefined,
      page: filters.page || 1,
      per_page: filters.per_page || 10
    },
    { skip: activeTab !== 'faqs' }
  );

  // Log API responses
  console.log('Categories Data:', categoriesData);
  console.log('Articles Data:', articlesData);
  console.log('FAQs Data:', faqsData);

  // Extract data with proper structure
const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const articles = Array.isArray(articlesData?.data?.data) ? articlesData.data.data : 
                   Array.isArray(articlesData?.data) ? articlesData.data : [];
  const faqs = Array.isArray(faqsData?.data?.data) ? faqsData.data.data : 
               Array.isArray(faqsData?.data) ? faqsData.data : [];

  // Get total counts for pagination
  const articlesTotal = articlesData?.total || articlesData?.data?.total || 0;
  const faqsTotal = faqsData?.total || faqsData?.data?.total || 0;

  console.log('Processed categories:', categories);
  console.log('Processed articles:', articles);
  console.log('Processed faqs:', faqs);

  const isLoading = 
    (activeTab === 'categories' && categoriesLoading) ||
    (activeTab === 'articles' && articlesLoading) ||
    (activeTab === 'faqs' && faqsLoading);

  // Breadcrumb items
  const breadcrumbItems = [
    ...(filters.module ? [{ label: filters.module }] : []),
    ...(filters.category_id && categories.length > 0 
      ? [{ label: categories.find(c => c.id === filters.category_id)?.category_name || '' }] 
      : [])
  ];

  return (
    <HelpLayout>
      <div className="flex">
        <HelpSidebar />
        
        <div className="flex-1 min-w-0 pl-6">
          <HelpBreadcrumb items={breadcrumbItems} />
          
          <HelpTabs 
            activeTab={activeTab || 'articles'}
            onTabChange={(tab) => {
              dispatch(setActiveTab(tab as any));
              setCurrentPage(1);
            }}
          />
          
          <HelpFilters />

          {/* Content */}
          <div className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                {activeTab === 'categories' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <HelpCard key={category.id} type="category" data={category} />
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 text-gray-500">
                        No categories found
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'articles' && (
                  <div className="space-y-3">
                    {articles.length > 0 ? (
                      articles.map(article => (
                        <HelpCard type="article" data={article} variant="compact" />
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        No articles found
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="space-y-3">
                    {faqs.length > 0 ? (
                      faqs.map(faq => (
                        <HelpCard key={faq.id} type="faq" data={faq} variant="compact" />
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        No FAQs found
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'saved' && (
                  <div className="text-center py-12 text-gray-500">
                    <p>Save articles and FAQs to access them quickly</p>
                  </div>
                )}

                {/* Pagination - Uncomment when HelpPagination is available */}
                {/* {(activeTab === 'articles' && articlesTotal > (filters.per_page || 10)) && (
                  <div className="mt-6">
                    <HelpPagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(articlesTotal / (filters.per_page || 10))}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )} */}
              </>
            )}
          </div>
        </div>
      </div>
    </HelpLayout>
  );
}