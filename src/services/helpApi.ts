// src/features/help/helpApi.ts (Complete version)
import { api } from '../services/api';

export interface HelpCategory {
  id: number;
  category_name: string;
  slug: string;
  description: string;
  icon: string | null;
  parent_id: number | null;
  module: string;
  sort_order: number;
  is_active: boolean;
  article_count: number;
  faq_count: number;
  parent?: HelpCategory;
  children?: HelpCategory[];
}

export interface HelpArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: number;
  article_type: 'Guide' | 'Tutorial' | 'FAQ' | 'Video' | 'Troubleshooting' | 'How To' | 'Best Practices';
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  featured_image: string | null;
  video_url: string | null;
  attachments: any | null;
  tags: string[];
  author_id: number;
  author_name?: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_featured: boolean;
  category?: HelpCategory;
  helpfulness_ratio?: number;
}

export interface HelpFaq {
  id: number;
  question: string;
  answer: string;
  category_id: number | null;
  module: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  category?: HelpCategory;
  helpfulness_ratio?: number;
}

export const helpApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ─── CATEGORIES ──────────────────────────────────────────────
    getHelpCategories: builder.query<{ success: boolean; data: HelpCategory[] }, {
      module?: string;
      is_active?: boolean;
      parent_only?: boolean;
    }>({
      query: (params) => ({ 
        url: '/help-categories', 
        params: { 
          ...params,
          is_active: params.is_active === undefined ? 1 : params.is_active 
        } 
      }),
      providesTags: ['HelpCategories'],
    }),

    getCategoryById: builder.query<{ success: boolean; data: HelpCategory }, number>({
      query: (id) => `/help-categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'HelpCategories', id }],
    }),

    getCategoriesByModule: builder.query<{ success: boolean; data: HelpCategory[] }, string>({
      query: (module) => `/help-categories/module/${module}`,
      providesTags: ['HelpCategories'],
    }),

    createCategory: builder.mutation<{ success: boolean; data: HelpCategory }, Partial<HelpCategory>>({
      query: (body) => ({ 
        url: '/help-categories', 
        method: 'POST', 
        body 
      }),
      invalidatesTags: ['HelpCategories'],
    }),

    updateCategory: builder.mutation<{ success: boolean; data: HelpCategory }, { id: number; data: Partial<HelpCategory> }>({
      query: ({ id, data }) => ({ 
        url: `/help-categories/${id}`, 
        method: 'PUT', 
        body: data 
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'HelpCategories', id }, 'HelpCategories'],
    }),

    deleteCategory: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ 
        url: `/help-categories/${id}`, 
        method: 'DELETE' 
      }),
      invalidatesTags: ['HelpCategories'],
    }),

    reorderCategories: builder.mutation<{ success: boolean }, { id: number; sort_order: number }[]>({
      query: (updates) => ({ 
        url: '/help-categories/reorder', 
        method: 'POST',
        body: { updates }
      }),
      invalidatesTags: ['HelpCategories'],
    }),

    // ─── ARTICLES ────────────────────────────────────────────────
    getArticles: builder.query<{ success: boolean; data: HelpArticle[]; total?: number }, {
      category_id?: number;
      module?: string;
      status?: string;
      article_type?: string;
      difficulty_level?: string;
      is_featured?: boolean;
      search?: string;
      tag?: string;
      page?: number;
      per_page?: number;
    }>({
      query: (params) => ({ 
        url: '/help-articles', 
        params: {
          ...params,
          status: params.status || 'published'
        }
      }),
      providesTags: ['HelpArticles'],
    }),

    getArticleById: builder.query<{ success: boolean; data: HelpArticle }, number>({
      query: (id) => `/help-articles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'HelpArticles', id }],
    }),

    getArticlesByIds: builder.query<{ success: boolean; data: HelpArticle[] }, number[]>({
      query: (ids) => ({ 
        url: '/help-articles/batch', 
        params: { ids: ids.join(',') } 
      }),
      providesTags: ['HelpArticles'],
    }),

    getArticleBySlug: builder.query<{ success: boolean; data: HelpArticle }, string>({
      query: (slug) => `/help-articles/slug/${slug}`,
      providesTags: ['HelpArticles'],
    }),

    getPopularArticles: builder.query<{ success: boolean; data: HelpArticle[] }, { limit?: number }>({
      query: (params) => ({ 
        url: '/help-articles/popular', 
        params 
      }),
      providesTags: ['HelpArticles'],
    }),

    getRelatedArticles: builder.query<{ success: boolean; data: HelpArticle[] }, number>({
      query: (id) => `/help-articles/${id}/related`,
      providesTags: (_r, _e, id) => [{ type: 'HelpArticles', id }],
    }),

    searchArticles: builder.query<{ success: boolean; data: HelpArticle[] }, { 
      query: string; 
      module?: string; 
      category_id?: number;
      page?: number;
      per_page?: number;
    }>({
      query: (params) => ({ 
        url: '/help-articles/search', 
        params 
      }),
      providesTags: ['HelpArticles'],
    }),

    getSearchSuggestions: builder.query<{ success: boolean; data: string[] }, string>({
      query: (query) => ({ 
        url: '/help-articles/suggestions', 
        params: { query } 
      }),
    }),

    createArticle: builder.mutation<{ success: boolean; data: HelpArticle }, FormData | Partial<HelpArticle>>({
      query: (body) => ({ 
        url: '/help-articles', 
        method: 'POST', 
        body,
        ...(body instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } })
      }),
      invalidatesTags: ['HelpArticles', 'HelpCategories'],
    }),

    updateArticle: builder.mutation<{ success: boolean; data: HelpArticle }, { id: number; data: FormData | Partial<HelpArticle> }>({
      query: ({ id, data }) => ({ 
        url: `/help-articles/${id}`, 
        method: 'PUT', 
        body: data,
        ...(data instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } })
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'HelpArticles', id }, 'HelpArticles'],
    }),

    deleteArticle: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ 
        url: `/help-articles/${id}`, 
        method: 'DELETE' 
      }),
      invalidatesTags: ['HelpArticles'],
    }),

    incrementArticleView: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ 
        url: `/help-articles/${id}/increment-view`, 
        method: 'POST' 
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'HelpArticles', id }],
    }),

    // ─── FAQS ─────────────────────────────────────────────────────
    getFaqs: builder.query<{ success: boolean; data: HelpFaq[]; total?: number }, {
  module?: string;
  category_id?: number;
  is_active?: boolean;
  is_featured?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
} | void>({
  query: (params = {}) => ({ 
    url: '/faqs', 
    params: {
      ...params,
      is_active: params.is_active ?? 1,               // safe nullish coalescing
      // is_active: 'is_active' in params ? params.is_active : 1,
    }
  }),
  providesTags: ['HelpFaqs'],
}),


    getFaqById: builder.query<{ success: boolean; data: HelpFaq }, number>({
      query: (id) => `/faqs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'HelpFaqs', id }],
    }),

    getFaqsByIds: builder.query<{ success: boolean; data: HelpFaq[] }, number[]>({
      query: (ids) => ({ 
        url: '/faqs/batch', 
        params: { ids: ids.join(',') } 
      }),
      providesTags: ['HelpFaqs'],
    }),

    getFeaturedFaqs: builder.query<{ success: boolean; data: HelpFaq[] }, void>({
      query: () => '/faqs/featured',
      providesTags: ['HelpFaqs'],
    }),

    getFaqsByModule: builder.query<{ success: boolean; data: HelpFaq[] }, string>({
      query: (module) => `/faqs/module/${module}`,
      providesTags: ['HelpFaqs'],
    }),

    getFaqStatistics: builder.query<{ success: boolean; data: any }, void>({
      query: () => '/faqs/statistics',
      providesTags: ['HelpFaqs'],
    }),

    getPopularSearches: builder.query<{ success: boolean; data: Array<{ query: string; count: number }> }, { limit?: number }>({
      query: (params) => ({ 
        url: '/help/popular-searches', 
        params 
      }),
    }),

    createFaq: builder.mutation<{ success: boolean; data: HelpFaq }, Partial<HelpFaq>>({
      query: (body) => ({ 
        url: '/faqs', 
        method: 'POST', 
        body 
      }),
      invalidatesTags: ['HelpFaqs'],
    }),

    updateFaq: builder.mutation<{ success: boolean; data: HelpFaq }, { id: number; data: Partial<HelpFaq> }>({
      query: ({ id, data }) => ({ 
        url: `/faqs/${id}`, 
        method: 'PUT', 
        body: data 
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'HelpFaqs', id }, 'HelpFaqs'],
    }),

    deleteFaq: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ 
        url: `/faqs/${id}`, 
        method: 'DELETE' 
      }),
      invalidatesTags: ['HelpFaqs'],
    }),

    incrementFaqView: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ 
        url: `/faqs/${id}/increment-view`, 
        method: 'POST' 
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'HelpFaqs', id }],
    }),

    // ─── FEEDBACK ─────────────────────────────────────────────────
    submitArticleFeedback: builder.mutation<{ success: boolean; data: any }, { 
      id: number; 
      feedback_type: 'helpful' | 'not_helpful'; 
      comment?: string; 
      rating?: number 
    }>({
      query: ({ id, ...body }) => ({ 
        url: `/help-articles/${id}/feedback`, 
        method: 'POST', 
        body 
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'HelpArticles', id }],
    }),

    submitFaqFeedback: builder.mutation<{ success: boolean; data: any }, { 
      id: number; 
      feedback_type: 'helpful' | 'not_helpful'; 
      comment?: string 
    }>({
      query: ({ id, ...body }) => ({ 
        url: `/faqs/${id}/feedback`, 
        method: 'POST', 
        body 
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'HelpFaqs', id }],
    }),

    // ─── ANALYTICS & EXPORT ───────────────────────────────────────
    exportAnalytics: builder.mutation<Blob, { format: 'csv' | 'pdf' | 'excel'; dateRange: { start: string; end: string } }>({
      query: (params) => ({ 
        url: '/help/analytics/export', 
        method: 'POST',
        body: params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  // Categories
  useGetHelpCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetCategoriesByModuleQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,

  // Articles
  useGetArticlesQuery,
  useGetArticleByIdQuery,
  useGetArticlesByIdsQuery,
  useGetArticleBySlugQuery,
  useGetPopularArticlesQuery,
  useGetRelatedArticlesQuery,
  useSearchArticlesQuery,
  useGetSearchSuggestionsQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useIncrementArticleViewMutation,

  // FAQs
  useGetFaqsQuery,
  useGetFaqByIdQuery,
  useGetFaqsByIdsQuery,
  useGetFeaturedFaqsQuery,
  useGetFaqsByModuleQuery,
  useGetFaqStatisticsQuery,
  useGetPopularSearchesQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useIncrementFaqViewMutation,

  // Feedback
  useSubmitArticleFeedbackMutation,
  useSubmitFaqFeedbackMutation,

  // Export
  useExportAnalyticsMutation,
} = helpApi;